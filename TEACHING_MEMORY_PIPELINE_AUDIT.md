# SOURCE-CODE AUDIT: USER TEACHING → PERSISTENT MEMORY PIPELINE

**Audit Target**: User Teaching → Persistent Memory → Retrieval → Causal Decision Influence  
**Repository State**: Inspected directly against actual source files (`src/App.tsx`, `src/components/ChatView.tsx`, `src/cognitive/chatDecisionEngine.ts`, `src/cognitive/experienceStore.ts`, `src/cognitive/memory.ts`).  
**Audit Rule**: Zero speculation, zero fabricated pass states, strict line-by-line code tracing.

---

## 1. Executive Summary

This audit examines whether an end-user interacting with ARIA via the Chat interface can teach an empirical experience (e.g., *"Supplier Alpha delivered 4 days late when demand volatility was high and port congestion was low"*) and have that taught experience persist, enter the cognitive `ExperienceStore`, be retrieved during an unprompted decision, and causally change prediction and action selection.

**Key Findings:**
1. **Teaching Detection Failure**: The exact user phrase (`"I want to teach you something..."`) is **not detected** as teaching because `App.tsx` uses a rigid prefix check (`lower.startsWith('remember')`).
2. **Decoupled Store Storage**: When teaching is recognized and saved, it is written solely to React component state (`userTaughtMemories`). It does **not** create an `ExperienceRecord` and does **not** call `ExperienceStore.addExperience()`.
3. **No Durable Persistence**: `userTaughtMemories` is stored only in a React `useState` hook. It is **not** written to `localStorage`, Firestore, or disk. It is completely lost upon page refresh or app reload.
4. **Retrieval Disconnect**: `ExperienceStore.retrieveRelevantExperiences()` does not query or contain user-taught memories. An ad-hoc keyword scan in `chatDecisionEngine.ts` surfaces user memory titles into the UI card, but...
5. **Zero Causal Influence**: The utility adjustment loop in `chatDecisionEngine.ts` iterates strictly over `retrievedExperiences` (from `ExperienceStore`) using 3 hardcoded condition branches. User-taught memories exert **zero mathematical influence** on delay, cost, penalty, or action selection.

---

## 2. Test Breakdown

---

### TEST A — USER TEACHING FLOW TRACE

**User Prompt Tested**:
```text
"I want to teach you something.

Supplier Alpha delivered an order 4 days late when demand volatility was high.
Port congestion was LOW.

Remember this as an experience, not a universal rule."
```

#### Step-by-Step Code Trace:

1. **Chat Input**:
   - Component: `src/components/ChatView.tsx` (`handleSubmit`, lines 52–57).
   - Action: Submits `inputText` to `onSendMessage(inputText.trim())`.

2. **Intent Detection in `App.tsx`**:
   - Location: `src/App.tsx` (`handleSendMessage`, lines 286–301).
   ```typescript
   // src/App.tsx:286-301
   const lower = text.toLowerCase();
   const isTeaching =
     lower.startsWith('remember') ||
     lower.includes('when ordering') ||
     lower.includes('whenever') ||
     lower.includes('check gsm') ||
     lower.includes('rule:');

   const isDecisionRequest =
     lower.includes('help me decide') ||
     lower.includes('which supplier') ||
     lower.includes('freight option') ||
     lower.includes('choose') ||
     lower.includes('decision');
   ```
   - **Evaluation**:
     - `lower` starts with `"i want to teach you something..."`.
     - `lower.startsWith('remember')` returns `false` (even though the word "remember" appears in paragraph 3, the check requires `startsWith`).
     - `lower.includes('when ordering')` → `false`
     - `lower.includes('whenever')` → `false`
     - `lower.includes('check gsm')` → `false`
     - `lower.includes('rule:')` → `false`
     - **Result**: `isTeaching` evaluates to **`false`**.
     - `isDecisionRequest` evaluates to **`false`**.
   - **Execution Pathway**: The message falls into the fallback conversational branch (`App.tsx:366-374`):
     ```typescript
     // src/App.tsx:367-373
     const responseMsg: ChatMessage = {
       id: `msg_resp_${Date.now()}`,
       sender: 'aetheris',
       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       text: `I'm currently tracking ${unifiedMemories.length} memories and ${activeLessons.length} validated lessons...`,
     };
     ```
     **Nothing is structured, proposed, or saved.**

---

#### Alternate Scenario: User Starts Message with `"Remember that..."`

If the user explicitly prefixes their message with `"Remember that Supplier Alpha delivered 4 days late..."`:

1. `isTeaching` evaluates to `true`.
2. A `teachingCard` is created with status `'PENDING'` (`App.tsx:309-320`).
3. The user clicks "Save as Memory" in `ChatView.tsx` (line 198), calling `onSaveProposedMemory`.
4. `handleSaveProposedMemory` in `App.tsx` executes:
   ```typescript
   // src/App.tsx:389-405
   const newMemory: UserFriendlyMemoryItem = {
     id: `taught_${Date.now()}`,
     title: memoryText.slice(0, 50) + (memoryText.length > 50 ? '...' : ''),
     description: memoryText,
     category: 'FACTS',
     source: 'TAUGHT_BY_YOU',
     confidence: 0.95,
     createdAt: new Date().toISOString(),
     timesUsed: 0,
     timesInfluenced: 0,
     details: {
       whatLearned: memoryText,
       whyBelieveThis: 'Taught directly by you in Chat.',
     },
   };

   setUserTaughtMemories((prev) => [newMemory, ...prev]);
   ```
5. **Memory Creation**: Creates a `UserFriendlyMemoryItem` object.
6. **ExperienceRecord Creation**: **NONE**. No `ExperienceRecord` interface object is created.
7. **ExperienceStore.addExperience()**: **NOT CALLED**.
8. **Persistent State**: Written only to `useState` hook `userTaughtMemories`.

---

### TEST B — MEMORY COUNT

**Target Question**: What produces the number shown in the UI (e.g., *"5 memories"*), and does user teaching increment this count?

1. **Source of Truth**: The computed array `unifiedMemories` in `src/App.tsx` (lines 184–251).
2. **State Variables**:
   - `userTaughtMemories` (`UserFriendlyMemoryItem[]`, React `useState`)
   - `state.memorySystem.semanticMemory` (`SemanticRule[]`, React `useState`)
   - `state.memorySystem.episodicMemory` (`EpisodicRecord[]`, React `useState`)
   - `state.worldModel.epistemicStatements` (`EpistemicStatement[]`, React `useState`)
3. **Computation**:
   ```typescript
   // src/App.tsx:184-251
   const unifiedMemories = useMemo<UserFriendlyMemoryItem[]>(() => {
     const list: UserFriendlyMemoryItem[] = [...(userTaughtMemories || [])];
     (state.memorySystem?.semanticMemory || []).forEach(...);
     (state.memorySystem?.episodicMemory || []).slice(-6).forEach(...);
     (state.worldModel?.epistemicStatements || []).slice(-4).forEach(...);
     return list;
   }, [userTaughtMemories, state.memorySystem, state.worldModel]);
   ```
4. **Components Displaying the Count**:
   - `AppHeader.tsx`: `memoryCount={unifiedMemories.length}`
   - `HomeDashboard.tsx`: `totalMemoriesCount={unifiedMemories.length}` (rendered as `"Memories: {totalMemoriesCount}"`)
   - `UserMemoryView.tsx`: Tab counts derived from `memories.length`
5. **Update Mechanism**: When `setUserTaughtMemories` appends a new item, `unifiedMemories` recomputes and the count **does increment in the UI for the active React session**.

---

### TEST C — PERSISTENCE

After a user teaches an experience and confirms it:

| Lifecycle Event | Survives? | Mechanism & Source Verification |
| :--- | :--- | :--- |
| **1. Another Chat Message** | **YES** | `chatMessages` updates in `App.tsx` state without clearing `userTaughtMemories`. |
| **2. Navigation to Memory Page** | **YES** | `activeTab` switches from `'CHAT'` to `'MEMORY'`; `App.tsx` state remains mounted. |
| **3. A New Decision** | **YES** | `evaluateCognitiveDecision` receives `userTaughtMemories` as a parameter from React state. |
| **4. Page Refresh (`F5`)** | **NO** | `userTaughtMemories` has no `localStorage` sync in `App.tsx` (only `userProfile` is synced via `localStorage.setItem('aetheris_user_profile', ...)` at line 120). On refresh, it resets to the hardcoded initial array (`taught_alpha_gsm`). |
| **5. Application Restart** | **NO** | Process/container restart resets all in-memory React state and `experienceStoreRef` to hardcoded seeds. |

---

### TEST D — RETRIEVAL

**Test Scenario**:
User asks:
```text
"Demand volatility is HIGH.
Port congestion is LOW.
Choose between Supplier Alpha and Supplier Beta."
```
*(User does NOT mention the previous experience).*

#### Retrieval Audit:

1. **`ExperienceStore.retrieveRelevantExperiences()`**:
   - Location: `src/cognitive/chatDecisionEngine.ts` (lines 269–279).
   - Execution:
     ```typescript
     const retrievedExperiences = experienceStore.retrieveRelevantExperiences({
       taskFamily,
       contextFeatures: {
         portCongestion,
         inventoryDays: invDays,
         demandVolatility,
         weatherDisruption,
       },
       limit: 3,
       minConfidence: 0.2,
     });
     ```
   - **Does it retrieve the user-created experience?** **NO.**
   - **Why**: `experienceStore` only contains seed items (`exp_rec_alpha_01` with `portCongestion: 0.62`, and `exp_rec_volatility_02` with `taskFamily: 'RESOURCE_ALLOCATION'`). The user-taught experience was never added to `experienceStore`.

2. **Ad-Hoc Keyword Matching in `chatDecisionEngine.ts`**:
   - Location: `src/cognitive/chatDecisionEngine.ts` (lines 301–322).
   ```typescript
   // Check User-Taught Memories for matching keywords
   userTaughtMemories.forEach((mem) => {
     const memText = `${mem.title} ${mem.description}`.toLowerCase();
     let relevance = 0;
     if (queryLower.split(' ').some((w) => w.length > 3 && memText.includes(w))) {
       relevance += 0.4;
     }
     if (taskFamily === 'SUPPLIER_SELECTION' && (memText.includes('alpha') || memText.includes('supplier') || memText.includes('congestion'))) {
       relevance += 0.5;
     }
     if (relevance >= 0.4) {
       retrievedMemories.push({
         id: mem.id,
         title: mem.title,
         lessonSnippet: mem.description,
         relevanceScore: Math.min(0.96, relevance),
         confidence: mem.confidence || 0.95,
         source: 'USER_TAUGHT',
         influencedPrediction: true,
       });
     }
   });
   ```
   - **Query Match Results**:
     - `taskFamily` = `'SUPPLIER_SELECTION'`
     - `memText` includes `'alpha'` and `'supplier'` → `relevance` = `0.5 + 0.4 = 0.90`.
     - Pushed to UI list `retrievedMemories` with:
       - **Memory ID**: `taught_<timestamp>`
       - **Retrieval Score**: `0.90` (90%)
       - **Confidence**: `0.95` (95%)
       - **Context Similarity**: Unchecked (simple substring match on `'alpha'`)
       - **Retrieval Source**: `'USER_TAUGHT'`

---

### TEST E — CAUSAL INFLUENCE TRACE

**Target Question**: Does the retrieved user-created memory actually adjust predictions and candidate action scores?

Let us trace `Step C: Evaluate Memory ON` in `src/cognitive/chatDecisionEngine.ts` (lines 325–386):

```typescript
// src/cognitive/chatDecisionEngine.ts:325-386
const experienceCandidateScores: ActionCandidateScore[] = actionSpecs.map((spec) => {
  let adjustedDelay = spec.baseDelay;
  let adjustedCost = spec.baseCost;
  let adjustedPenalty = 0;
  let wasInfluenced = false;
  let baseConfidence = 0.65;

  if (retrievedExperiences.length > 0 || retrievedMemories.some((m) => m.source === 'USER_TAUGHT')) {
    // CRITICAL: The loop only iterates over retrievedExperiences (from ExperienceStore)!
    for (const exp of retrievedExperiences) {
      const lesson = exp.lesson;
      if (!lesson || lesson.confidence < 0.3) continue;

      // Rule 1: Maritime Congestion Spike
      if (
        taskFamily === 'SUPPLIER_SELECTION' &&
        (spec.id.includes('MARITIME') || spec.id.includes('ALPHA')) &&
        portCongestion > 0.4
      ) {
        adjustedDelay += 2.5 * lesson.confidence;
        ...
      }

      // Rule 2: Demand Volatility Buffer
      if (
        taskFamily === 'RESOURCE_ALLOCATION' &&
        spec.id.includes('LEAN') &&
        demandVolatility > 0.3
      ) {
        adjustedPenalty += 3500 * lesson.confidence;
        ...
      }

      // Rule 3: Weather surge
      if (
        taskFamily === 'SEQUENTIAL_DECISION' &&
        spec.id.includes('SPOT') &&
        weatherDisruption
      ) {
        ...
      }
    }

    // Dual Sourcing specific hardcode
    if (taskFamily === 'SUPPLIER_SELECTION' && spec.id === 'DUAL_SOURCING' && portCongestion > 0.4) {
      adjustedDelay = 1.2;
      ...
    }
  }

  const expectedUtility = 10000 - adjustedCost - adjustedPenalty;
  return {
    actionId: spec.id,
    label: spec.label,
    estimatedDelay: Math.round(adjustedDelay * 10) / 10,
    estimatedCost: adjustedCost,
    stockoutPenalty: Math.round(adjustedPenalty),
    expectedUtility: Math.round(expectedUtility),
    confidence: Math.round(baseConfidence * 100) / 100,
    wasInfluenced,
  };
});
```

#### Causal Analysis:
1. **Loop Target**: The scoring loop runs `for (const exp of retrievedExperiences)`. It **never loops over user-taught memories**.
2. **Hardcoded Rules**: The only adjustments made are 3 fixed conditional blocks:
   - Rule 1 requires `portCongestion > 0.4`. In our test condition, port congestion is **LOW** (`<= 0.4`), so Rule 1 evaluates to `false`.
   - Rule 2 applies only to `taskFamily === 'RESOURCE_ALLOCATION'`.
   - Rule 3 applies only to `taskFamily === 'SEQUENTIAL_DECISION'`.
3. **No Rule Parsing**: The user's taught lesson (*"Supplier Alpha delivered 4 days late when demand volatility was high"*) contains structured information (Supplier Alpha delay +4d under high demand volatility), but there is **no parser or dynamic rule applicator** for user-taught text in `chatDecisionEngine.ts`.
4. **Outcome**:
   - `adjustedDelay` for Supplier Alpha remains its base value `2.0d`.
   - `wasInfluenced` remains `false`.
   - `expectedUtility` remains `8800`.
   - **Conclusion**: The user-taught memory has **ZERO causal influence** on the prediction, utility calculation, or final decision.

---

### TEST F — SOURCE SEPARATION AUDIT

The repository currently maintains **5 separate, partially disconnected memory representations**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Chat User Memories (userTaughtMemories)                                  │
│    • Stored in: React useState in App.tsx (Array of UserFriendlyMemoryItem) │
│    • Persistence: Session only (lost on refresh)                            │
│    • Destination: Rendered in UserMemoryView & Chat UI                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ (Mapped for UI display only)
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Unified Memory Projection (unifiedMemories)                              │
│    • Read-only useMemo projection combining Stores 1, 3, 4, and WorldModel  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Cognitive Engine Semantic Memory (state.memorySystem.semanticMemory)      │
│    • Stored in: MemorySystemState in src/cognitive/memory.ts                │
│    • Populated by: Autonomous cognitive loop (learning.ts)                  │
│    • Not connected to: userTaughtMemories or ExperienceStore                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Cognitive Engine Episodic Memory (state.memorySystem.episodicMemory)      │
│    • Stored in: MemorySystemState in src/cognitive/memory.ts                │
│    • Populated by: Cycle engine executions (engine.ts)                      │
│    • Not connected to: userTaughtMemories or ExperienceStore                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Empirical Experience Store (ExperienceStore)                             │
│    • Stored in: ExperienceStore class (Map<string, ExperienceRecord>)        │
│    • Used by: benchmark.ts, experimentRunner.ts, chatDecisionEngine.ts     │
│    • Contains: Hardcoded seed experiences & benchmark execution episodes    │
│    • Disconnected from: userTaughtMemories (Never receives user teachings)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Connection Matrix:

| Store Pair | Connected? | Mechanism |
| :--- | :--- | :--- |
| **`userTaughtMemories` ↔ `ExperienceStore`** | **NO** | `handleSaveProposedMemory` never creates `ExperienceRecord` or calls `experienceStore.addExperience()`. |
| **`userTaughtMemories` ↔ `semanticMemory`** | **NO** | No bridge exists to convert user teaching into `SemanticRule`. |
| **`ExperienceStore` ↔ `episodicMemory`** | **NO** | `EpisodicRecord` and `ExperienceRecord` use distinct schemas and separate storage arrays. |
| **`userTaughtMemories` ↔ `unifiedMemories`** | **YES** | Concatenated via `useMemo` in `App.tsx:185`. |
| **`userTaughtMemories` ↔ `chatDecisionEngine`** | **PARTIAL** | Passed as parameter; keyword-scanned for UI card, but bypassed during numerical candidate scoring. |

---

### TEST G — REAL USER EXPERIMENT (TRACED RUN)

| Step | Action | Actual System Behavior | Status |
| :---: | :--- | :--- | :---: |
| **STEP 1** | User inputs: *"Supplier Alpha delivered 4 days late during high demand volatility when port congestion was low."* | Regex fails (does not start with `'remember'`). Message treated as general chat. | ❌ Failed Intent Detection |
| **STEP 1b** | User inputs: *"Remember: Supplier Alpha delivered 4 days late during high demand volatility when port congestion was low."* | Regex matches `'remember:'`. Shows Teaching Card. User clicks *"Save as Memory"*. | ⚠️ Requires `'Remember:'` prefix |
| **STEP 2** | Confirm memory record creation. | `userTaughtMemories` in React state receives 1 item. `ExperienceStore` remains unchanged (size = 2 seeds). | ⚠️ React State Only |
| **STEP 3** | User asks unrelated question (*"What is today's inventory level?"*). | System responds with operational context. Memory remains in React state. | ✅ Survives conversation |
| **STEP 4** | User asks: *"Demand volatility is HIGH and port congestion is LOW. Choose between Supplier Alpha and Supplier Beta."* | `evaluateCognitiveDecision` runs. Keyword scanner matches `"alpha"` and `"supplier"`. | ⚠️ Keyword Match (not context similarity) |
| **STEP 5** | Verify retrieval. | User memory card appears in UI (`source: USER_TAUGHT`, `relevance: 90%`). `ExperienceStore.retrieveRelevantExperiences` returns zero matches for low congestion. | ⚠️ UI-only retrieval |
| **STEP 6** | Compare decision with Memory OFF vs. Memory ON. | **Memory OFF Winner**: Supplier Alpha (Delay 2.0d, Cost $1,200, Utility 8,800).<br>**Memory ON Winner**: Supplier Alpha (Delay 2.0d, Cost $1,200, Utility 8,800).<br>**Causal Delta**: 0 days, $0 cost, 0 utility difference. | ❌ Zero Causal Change (Memory failed to penalize Supplier Alpha) |

---

## 3. Final Classification

```
================================================================================
FINAL CLASSIFICATION: LEVEL B (TEMPORARY UI / APPLICATION STATE)
================================================================================
```

### Justification:

1. **Why not Level A?**
   The system does more than acknowledge chat; it renders structured UI cards (`TeachingCard`), updates React state (`userTaughtMemories`), increments the memory count badge in `AppHeader` and `HomeDashboard`, and shows the saved item in `UserMemoryView`.
2. **Why Level B?**
   User teaching creates only transient in-memory React state. It is not persisted across reloads (no database or `localStorage`), does not enter the cognitive `ExperienceStore`, does not generate structured `ExperienceRecord` objects, and cannot be evaluated by the quantitative causal scoring engine.
3. **Why not Level C, D, or E?**
   - **Not Level C**: Persistence is non-existent on page refresh.
   - **Not Level D**: `ExperienceStore.retrieveRelevantExperiences()` does not index or return user-taught experiences.
   - **Not Level E**: The user-taught experience does not propagate into prediction adjustment, candidate utility scoring, or action selection.
