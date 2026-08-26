# Empirical Research Protocol: Learning Machine Hypothesis

**Document:** Formal Experimental Specification  
**Version:** 1.0.0  
**Domain:** Autonomous Cognitive Systems / Machine Learning from Experience  

---

## 1. Formal Scientific Hypothesis

> **Primary Hypothesis ($H_1$):**  
> *"An agent that explicitly predicts outcomes, observes the consequences of its actions, evaluates prediction error, and stores/updates useful structured experience will achieve statistically significant and measurable performance improvements on repeated and related tasks, as well as superior calibration and decision quality, compared with an otherwise identical control agent operating without persistent experience updates."*

> **Null Hypothesis ($H_0$):**  
> *"An agent with explicit prediction, outcome evaluation, and structured experience storage exhibits no statistically significant performance improvement ($p \ge 0.05$ or effect size $d \approx 0$) on repeated or related tasks compared with an identical control agent without experience persistence."*

---

## 2. Core Assumptions

1. **Environmental Regularity:** The task environment exhibits underlying causal invariants (e.g., specific actions under specific conditions consistently produce correlated outcome distributions).
2. **Observability:** Key outcome variables (e.g., latency, cost, success/failure, stockout status) are measurable and reportable without deceptive noise.
3. **Capacity for Discrimination:** The agent's representation is capable of capturing the relevant state features that distinguish optimal actions from suboptimal actions.
4. **Parity of Substrate:** Both the Control and Experimental agents utilize identical underlying baseline models, identical observation inputs, identical action spaces, and identical evaluation formulas.

---

## 3. Independent & Dependent Variables

### 3.1 Independent Variables
- **Agent Learning Mode (Binary Factor):**
  - **Level 0 (Control Condition):** Zero cross-task experience persistence. Memory is reset between episodes/tasks. Fixed baseline prior weights and static heuristic policy.
  - **Level 1 (Experimental Condition):** Active structured experience recording, causal edge weight updates, procedural skill updates, and dynamic experience retrieval on subsequent tasks.
- **Task Novelty (Categorical Factor):**
  - **Repeated Tasks:** Identical task configuration presented in subsequent trial blocks (testing memory utilization & parameter calibration).
  - **Related / Transfer Tasks:** Held-out task configurations sharing underlying causal invariants with altered surface parameters (testing generalization).

### 3.2 Dependent Variables
- **Task Success Rate ($S$):** Proportion of tasks where all operational criteria (zero stockout, total budget constraint satisfied) were met: $S \in [0.0, 1.0]$.
- **Total Operational Net Utility ($U$):** Net business reward generated across a benchmark suite:
  $$U = \text{Revenue} - \text{Direct Cost} - \text{Penalty Cost}$$
- **Mean Absolute Prediction Error ($E_{\text{pred}}$):**
  $$E_{\text{pred}} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i|$$
- **Brier Calibration Score ($BS$):** Quadratic penalty measuring prediction probability calibration:
  $$BS = \frac{1}{N} \sum_{i=1}^N (P(\text{modal}) - \mathbb{I}(\text{outcome}))^2$$
- **Decision Adaptation Frequency ($R_{\text{shift}}$):** Rate at which the agent alters its chosen policy following a falsified prediction error.

---

## 4. Controlled Experimental Design

```
                     ┌──────────────────────────────────────┐
                     │          BENCHMARK TASK SUITE        │
                     │  (N = 30-50 Deterministic Tasks)     │
                     └──────────────────┬───────────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  ┌──────────────────────────────┐              ┌──────────────────────────────┐
  │        CONTROL AGENT         │              │        LEARNING AGENT        │
  ├──────────────────────────────┤              ├──────────────────────────────┤
  │ • Identical base parameters  │              │ • Identical base parameters  │
  │ • Generates predictions      │              │ • Generates predictions      │
  │ • Executes actions           │              │ • Executes actions           │
  │ • Observes outcomes          │              │ • Observes outcomes          │
  │ • Calculates error           │              │ • Calculates error           │
  │ ✗ No persistent storage      │              │ ✓ Stores structured experience│
  │ ✗ No weight/skill updates    │              │ ✓ Updates causal weights     │
  │ ✗ No cross-task retrieval    │              │ ✓ Retrieves prior lessons    │
  └──────────────┬───────────────┘              └──────────────┬───────────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        ▼
                     ┌──────────────────────────────────────┐
                     │     OBJECTIVE COMPARATIVE METRICS    │
                     │  - Initial vs. Final Performance     │
                     │  - Repeated Task Improvement Curve   │
                     │  - Transfer Task Generalization      │
                     │  - Brier Calibration & Error Loss    │
                     └──────────────────────────────────────┘
```

### 4.1 Control Agent Specification
- **Architecture:** Same planning engine, same counterfactual scoring module, same environmental observation parser.
- **Experience Persistence:** Explicitly disabled. After each task, all episodic traces and causal edge adjustments are purged, resetting the agent to baseline factory priors.
- **Hypothesis Expectation:** Performance remains flat across successive task repetitions ($t_1 = t_2 = \dots = t_n$).

### 4.2 Learning Agent Specification
- **Architecture:** Identical base engine, augmented with:
  - **Structured Experience Record Storage:** Every task produces a schema-validated record.
  - **Causal Model & Procedural Adaptation:** Prediction errors trigger bounded parameter adjustments.
  - **Context-Sensitive Retrieval:** Prior experiences matching active task features are retrieved and injected into the decision/planning stage.
- **Hypothesis Expectation:** Prediction error decreases monotonically over successive task encounters ($E_{t+1} < E_t$), and net utility increases ($U_{t+1} > U_t$).

---

## 5. Potential Confounding Factors & Controls

| Confounder | Potential Threat | Mitigation Strategy |
| :--- | :--- | :--- |
| **Environmental Stochasticity** | Random seed variation may favor one agent by chance. | Use fixed deterministic pseudo-random seeds ($S=42$) across identical task sequences for both agents. |
| **Model Inconsistency** | Variable LLM prompt completions or temperature drift. | Run evaluation benchmark with zero temperature or deterministic simulation environments. |
| **Data Leakage / Contamination** | Test tasks inadvertently exposed during training/priors. | Strict division between Training/Exploration tasks and Held-Out Transfer tasks. |
| **Overfitting / Memorization** | Agent merely memorizes verbatim task solutions without generalizable rule learning. | Measure performance on novel tasks with altered numerical parameters and unseen entity combinations. |
| **Catastrophic Forgetting / Drift** | New learning corrupts performance on previously learned basic tasks. | Interleave baseline verification tasks after complex learning sequences. |

---

## 6. Objective Failure Criteria

The experimental hypothesis ($H_1$) shall be considered **FALSIFIED** or **UNSUPPORTED** if any of the following occur:

1. **No Performance Delta:** The Learning Agent shows no statistically significant improvement in task success rate or net utility over the Control Agent ($p \ge 0.05$).
2. **Negative Transfer / Degradation:** The Learning Agent achieves lower net utility on held-out transfer tasks than the Control Agent due to erroneous over-generalization.
3. **Error Divergence:** Prediction error fails to decrease across repeated exposures to identical causal mechanisms.
4. **Trivial Memorization:** The Learning Agent only improves when exact task parameters are identical, with zero transfer to structurally related tasks.
