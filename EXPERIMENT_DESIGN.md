# Experiment Design: Learning Machine Controlled Benchmark

**Document:** Formal Experimental & Benchmark Specification  
**System:** Learning Machine Cognitive Architecture  
**Status:** Implemented & Verified  

---

## 1. Research Question & Objective

The objective of this controlled experiment is to evaluate the foundational capability:
> *"Does an agent that explicitly predicts outcomes, observes the consequences of its actions, evaluates prediction error, and stores/retrieves structured experiential lessons achieve measurable and statistically significant performance improvement on repeated and held-out transfer tasks compared with an identical control agent without persistent learning?"*

---

## 2. Experimental Architecture

```
                               ┌─────────────────────────────┐
                               │   36-TASK BENCHMARK SUITE   │
                               │  (Deterministic Seeds 101+) │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
       ┌──────────────────────────────┐                ┌──────────────────────────────┐
       │        CONTROL AGENT         │                │        LEARNING AGENT        │
       ├──────────────────────────────┤                ├──────────────────────────────┤
       │ • Baseline Priors Heuristic  │                │ • Baseline Priors Heuristic  │
       │ • Prediction Generation      │                │ • Prediction Generation      │
       │ • Action Selection (Net U)   │                │ • Action Selection (Net U)   │
       │ • Objective Env Execution    │                │ • Objective Env Execution    │
       │ • Error Calculation          │                │ • Error Calculation          │
       │ ✗ Zero cross-task store      │                │ ✓ Structured Experience Store│
       │ ✗ Memory purged per task     │                │ ✓ Pre-prediction Retrieval   │
       │ ✗ Fixed policy               │                │ ✓ Causal Lesson Diagnosis    │
       └──────────────┬───────────────┘                └──────────────┬───────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │   COMPARATIVE EVALUATION    │
                               │ • Task Success Rate Delta   │
                               │ • Net Utility Improvement   │
                               │ • Prediction Error Delta    │
                               │ • Brier Calibration Loss    │
                               │ • Held-Out Generalization   │
                               └─────────────────────────────┘
```

---

## 3. Benchmark Task Families & Partitions

The benchmark contains **36 deterministic tasks** with mathematically computed ground-truth outcomes across three distinct cognitive decision families:

### 3.1 Task Family A: Supplier Selection (12 Tasks)
- **Causal Invariant:** Low-cost maritime carriers (e.g. Supplier Alpha) exhibit severe lead time spikes (+2.5 days) when order volume $> 1000$ or port congestion $> 0.4$, triggering stockout penalties. Air express is reliable but costly; Dual Sourcing (50/50) provides the Pareto-optimal risk hedge.
- **Partition:** 5 Repeated, 3 Related, 4 Held-Out (Novel Pacific Corridor lines).

### 3.2 Task Family B: Resource Allocation (12 Tasks)
- **Causal Invariant:** Under high demand volatility ($> 0.35$), maintaining a safety stock buffer dominates lean cash-holding due to asymmetric stockout penalties ($>\$2000/\text{day}$). In calm markets ($< 0.20$), lean cash allocation minimizes unnecessary holding fees.
- **Partition:** 6 Repeated, 3 Related, 3 Held-Out (Novel Market Liquidity Shock).

### 3.3 Task Family C: Sequential Decision Making (12 Tasks)
- **Causal Invariant:** Pre-booking freight capacity in advance incurs a minor fixed insurance fee ($\$450$), which is optimal when weather disruption alerts are active (spot market surges to $4.0\times$ with massive backlog). In clear weather, waiting for spot dispatch is optimal.
- **Partition:** 5 Repeated, 4 Related, 3 Held-Out (Novel Corridor Weather Hedge).

### Summary Partition Table:
| Task Family | Repeated | Related | Held-Out Transfer | Total |
| :--- | :---: | :---: | :---: | :---: |
| **Supplier Selection** | 5 | 3 | 4 | 12 |
| **Resource Allocation** | 6 | 3 | 3 | 12 |
| **Sequential Decision** | 5 | 4 | 3 | 12 |
| **Total Tasks** | **16** | **10** | **10** | **36** |

---

## 4. Structured Experience Schema

The experience store records structured entries separating facts from interpretations and lessons:

```typescript
export interface ExperienceRecord {
  experienceId: string;
  taskId: string;
  taskFamily: string;
  context: Record<string, any>;
  prediction: {
    predictedDelay?: number;
    predictedCost?: number;
    expectedUtility: number;
    modalOutcome?: string;
  };
  confidence: number;
  predictionFeatures: Record<string, any>;
  selectedAction: { actionType: string; parameters: Record<string, any> };
  expectedOutcome: { delayDays?: number; cost?: number; netUtility?: number };
  actualOutcome: { delayDays?: number; cost?: number; stockoutOccurred?: boolean; netUtility?: number };
  predictionError: {
    delayErrorDelta?: number;
    costErrorDelta?: number;
    normalizedError: number;
    brierLoss: number;
    direction: 'UNDERESTIMATED' | 'OVERESTIMATED' | 'ACCURATE';
  };
  success: boolean;
  errorCause: {
    observedFact: string;       // What actually occurred
    interpretation: string;     // Agent's causal explanation
    identifiedDriver: string;   // Key environmental driver
  };
  lesson: {
    observedFact: string;
    interpretation: string;
    proposedChange: string;     // Explicit policy adjustment rule
    confidence: number;
    rule: string;
  };
  applicableConditions: Record<string, any>;
  createdAt: string;
  sourceExperimentId: string;
}
```

---

## 5. The Step-by-Step Learning Loop

Every task runs the 10-step experiential learning cycle:
1. **Receive Goal & Context:** Task ingested with environmental parameters (inventory, volatility, congestion, alerts).
2. **Retrieve Prior Experience (Learning Agent only):** Queries `ExperienceStore` for past tasks with matching family or feature patterns.
3. **Compute Probabilistic Prediction:** Adjusts estimated delay, cost, and stockout probability using retrieved lessons.
4. **Evaluate Action Utilities:** Computes $E[\text{Utility}] = 10000 - \text{Estimated Cost} - \text{Estimated Penalty}$.
5. **Select Action:** Picks the action maximizing expected net utility.
6. **Execute in Objective Environment:** Evaluates chosen action in the deterministic environment simulator.
7. **Calculate Exact Prediction Error:**
   $$\Delta\text{Delay} = y_{\text{delay}} - \hat{y}_{\text{delay}}, \quad \Delta\text{Cost} = y_{\text{cost}} - \hat{y}_{\text{cost}}, \quad BS = (\text{Confidence} - \mathbb{I}(\text{Success}))^2$$
8. **Diagnose Error Cause:** Identifies whether error was driven by underestimating environmental friction.
9. **Synthesize Structured Lesson:** Formulates concrete heuristic adjustments.
10. **Store Structured Record:** Ingests the record into `ExperienceStore` for subsequent task retrieval.

---

## 6. Metrics & Statistical Hypotheses

| Metric | Formula / Definition | Target Outcome |
| :--- | :--- | :--- |
| **Overall Success Rate** | $\frac{N_{\text{success}}}{N_{\text{total}}}$ | $\text{Learning} > \text{Control}$ ($+15\%$ to $+40\%$) |
| **Initial $\to$ Final Improvement** | $\text{Rate}_{\text{final quartile}} - \text{Rate}_{\text{initial quartile}}$ | $\Delta > 0$ for Learning, $\Delta \approx 0$ for Control |
| **Normalized Prediction Error** | $0.6 \frac{|\Delta\text{Delay}|}{4.0} + 0.4 \frac{|\Delta\text{Cost}|}{2500}$ | $\text{Error}_{\text{Learning}} < \text{Error}_{\text{Control}}$ |
| **Brier Loss** | $\frac{1}{N} \sum (\text{Confidence} - \mathbb{I}(\text{Success}))^2$ | Lower Brier Loss indicates better calibration |
| **Held-Out Generalization** | $\text{Success Rate on HELD\_OUT partition}$ | Tests whether learning generalized without rote memorization |

---

## 7. Machine-Readable Experiment Logging (JSONL)

Every run outputs standard JSONL lines formatted as:

```json
{
  "experimentId": "exp_1724680000000",
  "agentType": "LEARNING",
  "taskId": "SUP_REP_1",
  "taskFamily": "SUPPLIER_SELECTION",
  "split": "REPEATED",
  "seed": 101,
  "predictedOutcome": { "delayDays": 4.5, "cost": 1420, "expectedUtility": 8580 },
  "confidence": 0.85,
  "selectedActionId": "DUAL_SOURCE",
  "optimalActionId": "DUAL_SOURCE",
  "isOptimalAction": true,
  "actualOutcome": { "delayDays": 1.2, "cost": 1420, "stockoutOccurred": false, "netUtility": 8580 },
  "predictionError": { "normalizedError": 0.0, "brierLoss": 0.0225, "direction": "ACCURATE" },
  "success": true,
  "retrievedExperiencesCount": 2,
  "experienceInfluencedDecision": true
}
```
