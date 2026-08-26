# Architecture Audit: "Learning Machine" Experimental System

**Audit Date:** August 2026  
**Auditor:** AI Systems Engineering & Research Team  
**Repository:** Aetheris / Learning Machine Reference Architecture

---

## 1. Executive Summary

This document presents a comprehensive audit of the existing codebase to determine its readiness for empirical testing of the core learning hypothesis:
> *"Can an AI system improve its future performance by learning from the outcomes of its previous predictions and actions?"*

The repository currently contains a working full-stack prototype simulating a 13-stage cognitive architecture within a supply-chain and procurement environment. The architecture already contains foundational concepts of explicit prediction, observation, prediction error calculation, episodic memory storage, causal graph updates, and metacognitive diagnosis. However, several components are currently hardcoded to a single domain scenario or use synthetic/simulated scoring rather than a rigorous, reproducible experimental harness comparing an active Learning Agent against an identical Control Agent.

---

## 2. Component-by-Component Technical Inventory

### 2.1 Architecture Overview
- **Stack:** Client-Server Full Stack (Node.js + Express backend on port 3000, Vite + React 18 + Tailwind CSS frontend).
- **Execution Mode:** In-memory synchronous discrete-time cycle simulation with optional automated timer (`setInterval`).
- **Core Loop:** 13-phase cognitive cycle (`src/cognitive/engine.ts`):
  $$\text{Perceive} \to \text{Working Memory} \to \text{Memory Retrieval} \to \text{Plan} \to \text{Predict} \to \text{Act} \to \text{Observe} \to \text{Error} \to \text{Learn} \to \text{Metacognition} \to \text{Consolidate}$$

### 2.2 Frontend Layer
- **Files:** `src/App.tsx`, `src/components/*` (10 component modules).
- **Capabilities:**
  - Complete dashboard with visual status pipelines, Causal DAG visualizers, 5-layer memory inspectors, prediction trajectory charts, error diagnostic monitors, and step-by-step audit traces.
  - Recharts integration for real-time tracking of accuracy, prediction error loss, and Brier calibration scores.
  - Interactive parameter controls for environmental shocks (strikes, weather disruptions, port congestion, demand volatility).

### 2.3 Backend & API Layer
- **File:** `server.ts`
- **Endpoints:**
  - `GET /api/health`: Health check and status of `GEMINI_API_KEY` configuration.
  - `POST /api/cognitive/deep-reason`: Metacognitive and causal synthesis endpoint using Google GenAI SDK (`@google/genai`, model `gemini-3.7-flash` / `gemini-2.5-flash`), with deterministic symbolic fallback when no API key is provided.
  - `POST /api/cognitive/concept-discovery`: Domain concept distillation endpoint.

### 2.4 Agent & Orchestration Layer
- **File:** `src/cognitive/engine.ts`
- **Lifecycle:**
  - Instantiates `CognitiveSystemState` containing World Model, Memory System, Environment, Experiments, and Traces.
  - `executeFullCognitiveCycle(state)` processes one full cycle step deterministically.
  - Maintains rolling trace buffer of 30 past cycles and accuracy history.

### 2.5 LLM Integration
- **Status:** Functional on backend via `@google/genai` TypeScript SDK.
- **Role in Current System:** Operates as a secondary, on-demand inductive reasoning and concept extraction subsystem triggered by user action in `DeepReasoningModal.tsx`.
- **Finding:** The primary autonomous cognitive simulation loop runs via deterministic TypeScript rule engines in `src/cognitive/` without making per-cycle LLM API calls.

### 2.6 Memory System
- **File:** `src/cognitive/memory.ts`, `src/types/cognitive.ts`
- **Layers:**
  1. **Working Memory:** Active goals, attention budget, current observations, active hypotheses.
  2. **Episodic Memory:** Chronological list of past execution episodes with structured context, action, predicted outcome, actual outcome, prediction error, and surprise score.
  3. **Semantic Memory:** Generalized invariant rules with confidence scores and applicability conditions.
  4. **Procedural Memory:** 3 procedural skills with tracked execution counts and success rates.
  5. **Meta-Memory:** Domain-level competence self-ratings and Brier calibration scores.
- **Consolidation Mechanism:** `consolidateEpisodes()` automatically creates a semantic rule when an episode's surprise score exceeds $0.40$ or normalized error exceeds $0.35$.
- **Limitation:** Retrieval is currently a simple confidence filter (`confidence > 0.8`) rather than task-conditioned semantic or feature-based retrieval.

### 2.7 Tool-Use System
- **Status:** Fixed action dispatch.
- **Implementation:** The agent chooses between 4 predefined actions (`ORDER_SUPPLIER` for Alpha, Beta, Gamma, or `DUAL_SOURCE_SPLIT`). There is no generic dynamic tool execution interface (e.g. calculator, python sandbox, external API call).

### 2.8 Planning & Reasoning System
- **Files:** `src/cognitive/planning.ts`, `src/cognitive/reasoning.ts`
- **Mechanism:** Evaluates counterfactual alternatives by calculating expected net utility:
  $$E[\text{Utility}] = 10000 - (\text{Direct Cost} + \text{Stockout Penalty})$$
- Uses safety margin heuristic to switch policies when buffer inventory falls below 2.0 days.

### 2.9 Prediction Mechanism
- **File:** `src/cognitive/prediction.ts`
- **Mechanism:** Takes candidate action and environment state, applies causal edge weights and entity baseline lead times, and generates 3 candidate future trajectories (*Optimistic*, *Modal Expected*, *Adverse*) with assigned probabilities, confidence intervals, and expected delay days.

### 2.10 Evaluation Mechanism
- **File:** `src/cognitive/learning.ts` (`calculatePredictionError`)
- **Metrics Calculated:**
  - $\Delta\text{Delay} = \text{Actual Delay Days} - \text{Predicted Delay Days}$
  - $\Delta\text{Cost} = \text{Actual Cost} - \text{Predicted Cost}$
  - $\text{Normalized Error} = 0.75 \cdot \frac{|\Delta\text{Delay}|}{4.0} + 0.25 \cdot \frac{|\Delta\text{Cost}|}{2000.0}$
  - Error Direction: `UNDERESTIMATED`, `OVERESTIMATED`, `ACCURATE`
  - Brier Score Contribution: $(P(\text{Modal}) - \mathbb{I}(\text{Hit}))^2$

### 2.11 Learning & Update Mechanism
- **File:** `src/cognitive/learning.ts` (`executeMultiLevelLearning`)
- **Tiers Updated:**
  - **Level 1 (Knowledge):** Adjusts target supplier reliability score.
  - **Level 2 (Pattern/Causal):** Strengthens causal edge weight ($w \gets w + 0.08$) if volume underestimation occurs.
  - **Level 3 (Skill/Procedural):** Updates skill success rate via exponential moving average.
  - **Level 4 (Strategy/Epistemic):** Demotes unverified assumptions to disputed hypotheses upon significant error.
  - **Level 5 (World Model):** Promotes verified hypotheses to empirical beliefs.
  - **Level 6 (Meta-Learning):** Recalibrates meta-memory calibration scores based on Brier loss.
- **Downstream Behavioral Impact:** When causal edge weight increases, future predictions project higher delays for high-volume orders with Supplier Alpha, which increases expected stockout penalties in the planner, shifting future decisions to Dual-Sourcing or Supplier Beta.

### 2.12 Database / Storage
- **Status:** Ephemeral in-memory React state (`useState`).
- **Limitation:** Page refresh resets all learning, world models, and episodic history to cycle 1 defaults. No persistent JSON, SQLite, or cloud database storage exists.

### 2.13 Logging & Observability
- **Status:** In-memory structured traces (`CognitiveCycleTrace`) storing up to 30 past cycles.
- **Limitation:** Traces are not serialized to disk/JSONL.

### 2.14 Authentication & Security
- No user authentication system (open experimental workbench).
- API keys are handled strictly server-side in `server.ts` via `process.env.GEMINI_API_KEY`.

### 2.15 Existing Tests
- **Status:** No unit or integration test suite exists in the repository (`0` test files).

---

## 3. Data Flow & Agent Lifecycle Matrix

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             ENVIRONMENT STATE                              │
│         (Inventory, Cash, Volatility, Disruptions, Port Congestion)        │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                         [01. Perception Ingestion]
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            WORKING MEMORY FOCUS                            │
│           (Active Goal, Attention Allocation, Active Hypotheses)           │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                        [02. Experience Retrieval]
                                      │ (Queries Semantic/Episodic/Procedural)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    WORLD MODEL & CAUSAL GRAPH GROUNDING                    │
│           (Entity Parameters, Causal Edge Weights, Epistemic DAG)          │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                      [03. Counterfactual Simulation]
                                      │ (Generates & Ranks Action Options)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    PROBABILISTIC OUTCOME PREDICTION                        │
│           (Projects Future States, Probability, Confidence, Error)          │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                        [04. Execution in Environment]
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          EMPIRICAL OBSERVATION                             │
│                  (Ground Truth Delay, Cost, Saturation)                    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                       [05. Prediction Error Engine]
                                      │ (Delta Delay, Delta Cost, Brier Loss)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-TIER UPDATE & CONSOLIDATION                      │
│     (Causal Weights, Entity Reliability, Skill Rates, Epistemic Status)    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                     [06. Feed Forward to Next Episode]
                                      │
                                      ▼
                          (Cycle N+1 World Model)
```

---

## 4. Analysis: Functional vs. Mock / Hardcoded Code

| Component | Status | Functional Reality |
| :--- | :--- | :--- |
| **Prediction Calculation** | Partially Functional | Uses mathematical formulas combining base lead time and causal weights, but formulas are domain-specific. |
| **Error Feedback** | Fully Functional | Exact mathematical computation of delay delta, cost delta, normalized loss, and Brier quadratic loss. |
| **Causal Weight Learning** | Functional | Directly alters edge weights in the active world model, which directly alters future counterfactual decisions. |
| **Self-Improvement Lab** | Mock / Placeholder | `runSandboxExperiment()` in `selfImprovement.ts` generates synthetic random accuracy boosts (`Math.random() * 0.06`) instead of evaluating code mutations on real benchmark tasks. |
| **Episodic Retrieval** | Basic / Incomplete | Retrieves all semantic rules with confidence $> 0.8$; lacks similarity-based or task-indexed retrieval of past episodic experiences. |
| **Persistence** | Ephemeral | In-memory only. |
| **Experimental Harness** | Missing | No side-by-side Control vs. Learning agent benchmark runner. |

---

## 5. Current Architectural Limitations

1. **No Standardized Benchmark Harness:** The system cannot currently run an automated batch of $N$ tasks across repeated and novel conditions to statistically measure performance before vs. after learning.
2. **Lack of a Control Condition:** The codebase has only a single active agent. To evaluate our hypothesis, we need an identical Control Agent (same baseline model and heuristics, but with learning/updates disabled) running the exact same tasks.
3. **Hardcoded Entity IDs in Learning Logic:** `executeMultiLevelLearning` specifically checks `if (targetSupplierId === 'supplier_alpha')` and updates hardcoded epistemic IDs (`ep_2`, `ep_3`). A true experimental learning architecture requires a general structured experience update mechanism.
4. **No Persistent Disk Logging:** Runs cannot be serialized to JSON/JSONL for offline regression and statistical significance tests ($p$-values, effect size).
5. **No Unit/Integration Test Suite:** Verification currently relies on manual UI interaction and compilation checks.

---

## 6. Recommended Minimum Changes for the Experiment

To rigorously test the learning hypothesis without altering the core UI or redesigning the architecture, the following minimum changes are required:

1. **Structured Experience Store (`src/cognitive/experienceStore.ts`):** Standardize the Experience Record schema to capture: task, context, prediction, confidence, reasoning features, action, expected outcome, actual outcome, prediction error, success/failure, error cause, lessons learned, and applicability conditions.
2. **General Benchmark & Task Suite (`src/cognitive/benchmark.ts`):** Implement an objective benchmark containing 30–50 deterministic tasks across resource allocation, supplier selection, inventory buffering, and sequential decision-making with both repeated and held-out transfer tasks.
3. **Dual Agent Runner (`src/cognitive/experimentRunner.ts`):**
   - **Control Agent:** Executes tasks with fixed priors, zero cross-task experience persistence, and zero weight updates.
   - **Learning Agent:** Executes identical tasks with full prediction generation, prediction error calculation, structured experience storage, and relevant experience retrieval.
4. **Metrics & Statistical Logger (`src/cognitive/metrics.ts`):** Measure initial vs. final performance, task success rate, prediction accuracy, Brier calibration, adaptation speed, and decision change frequency, exporting to JSON/JSONL format.
5. **Automated Test Suite (`src/cognitive/__tests__/`):** Add automated unit and benchmark regression tests.
