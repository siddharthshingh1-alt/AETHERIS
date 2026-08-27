# AETHERIS — Build Phase 1: General Knowledge & Common-Sense Foundation
## Architectural Audit, Integration Plan & Foundation Specification

**Author:** AETHERIS Cognitive Architecture Core  
**Phase:** Build Phase 1 — General Knowledge & Common-Sense Foundation  
**Date:** 2026-08-27  

---

## 1. Executive Summary & Core Objective

The purpose of Phase 1 is **not** to build a fake AGI, chatbot, or a brittle hardcoded database of domain rules. Instead, the objective is to give AETHERIS a **domain-independent, evidence-aware knowledge core** that represents concepts, relationships, epistemic statuses, provenance, multi-observation evidence synthesis, and cross-domain common-sense principles.

The same underlying knowledge machinery must seamlessly represent concepts from everyday physical objects (e.g. `Kettle`, `Apple`), computing systems (e.g. `Python`, `Database`), business entities (e.g. `Revenue`, `Cost`, `Supplier`), and abstract dimensions (e.g. `Deadline`, `Time`, `Quantity`) without hardcoded `if (supplier)` or `if (portCongestion)` checks.

---

## 2. Audit of Existing Architecture

A thorough audit of the existing codebase reveals a well-structured cognitive system with several strong modules:

1. **`ExperienceStore` (`src/cognitive/experienceStore.ts`)**:
   - Stores structured experience records containing `context`, `prediction`, `actualOutcome`, `predictionError`, `lesson`, and `applicableConditions`.
   - Supports user-taught records (`USER_TAUGHT`), empirical benchmark runs, and relevance querying.
   - *Audit finding:* Excellent for experiential/episodic memory, but lacks first-class typed conceptual graph representation (`Concept`, `Relationship`, generic ontology, and common-sense rules).

2. **`MemorySystem` (`src/cognitive/memory.ts`)**:
   - Maintains `workingMemory`, `episodicMemory`, `semanticMemory` (`SemanticRule[]`), `proceduralMemory`, and `metaMemory`.
   - *Audit finding:* Semantic memory currently stores invariant text strings. It needs a formal structured graph representation of concepts, properties, and relationships.

3. **`WorldModel` (`src/cognitive/worldModel.ts`)**:
   - Contains `WorldEntity`, `CausalEdge[]`, and `EpistemicStatement[]`.
   - *Audit finding:* Currently holds domain-specific seeded entities (`supplier_alpha`, `production_hub`, etc.). The data structures can be generalized into domain-agnostic concept nodes and typed relationship edges.

4. **`EvidenceAccumulator` (`src/cognitive/evidenceAccumulator.ts`)**:
   - Implements multi-episode accumulation, supporting vs. contradicting observation counts, and epistemic conflict detection.
   - *Audit finding:* Currently tailored to supply chain numerical deltas. It can be generalized into an evidence ledger that updates concept relationships, belief confidence, and truth values across any domain.

5. **`PersistenceAdapter` (`src/cognitive/persistence.ts`)**:
   - Clean persistence abstraction with `LocalStorageAdapter` and `MemoryPersistenceAdapter`.
   - *Audit finding:* Ready to persist the new `KnowledgeCore` alongside `ExperienceStore`.

6. **`TeachingParser` (`src/cognitive/teachingParser.ts`)**:
   - Parses natural language user input into intent, memory type (`EXPERIENCE`, `FACT`, `PREFERENCE`, `HYPOTHESIS_OR_RULE`), and numerical/context features.
   - *Audit finding:* Needs extension to parse arbitrary concept definitions (e.g., *"A kettle is an appliance used for heating water"*, *"Python is a programming language"*).

7. **`ChatDecisionEngine` (`src/cognitive/chatDecisionEngine.ts`)**:
   - Executes baseline vs. memory-informed cognitive decision traces with full causal transparency.
   - *Audit finding:* Can query the `KnowledgeCore` for conceptual constraints and common-sense principles during inference.

8. **Benchmark & Test Suite (`src/cognitive/benchmark.ts`, `src/cognitive/__tests__/runTests.ts`)**:
   - 61 deterministic unit and integration tests across 9 test groups.
   - *Audit finding:* All 61 existing tests must continue to pass untouched.

---

## 3. Proposed Knowledge Core Architecture

### 3.1. Core Entities and Types

#### A. `Concept`
Represents an entity, category, physical object, abstract dimension, or domain term:
- `id`: Unique identifier (e.g., `concept_kettle`, `concept_apple`, `concept_deadline`).
- `name`: Human-readable name (e.g., `"Kettle"`, `"Apple"`).
- `category`: Category / Type (e.g., `"APPLIANCE"`, `"FRUIT"`, `"LANGUAGE"`, `"TEMPORAL"`, `"FINANCIAL"`, `"ENTITY"`).
- `properties`: Record of key-value properties with confidence and provenance (e.g., `{ is_edible: true, state_of_matter: "solid" }`).
- `relationships`: List of relationship IDs outgoing from this concept.
- `source`: Provenance source (`SYSTEM_SEED`, `USER`, `TEXT`, `IMAGE`, `VIDEO`, `WEB`, `EXPERIMENT`, `ENVIRONMENT`, `OBSERVATION`, `LEARNED_EXPERIENCE`).
- `status`: Epistemic status (`SEEDED`, `USER_TAUGHT`, `OBSERVED`, `INFERRED`, `HYPOTHESIS`, `VALIDATED`, `CONTRADICTED`, `REJECTED`).
- `evidence`: Structure tracking supporting/contradicting observations and prediction track record.
- `confidence`: Numeric calibration score from `0.0` to `1.0`.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

#### B. `Relationship`
Represents a typed edge between two concepts:
- `id`: Unique relationship ID.
- `sourceConceptId`: ID of source concept.
- `predicate`: Extensible relationship type:
  - `IS_A` (Taxonomy / Classification)
  - `PART_OF` (Meronymy)
  - `HAS` (Possession / Attribute)
  - `USED_FOR` (Functional utility)
  - `LOCATED_IN` (Spatial location)
  - `CAUSES` (Causality)
  - `PREVENTS` (Inhibition)
  - `REQUIRES` (Prerequisite / Dependency)
  - `BEFORE` / `AFTER` (Temporal ordering)
  - `SIMILAR_TO` / `DIFFERENT_FROM` (Analogical relation)
  - `CAN` / `CANNOT` (Affordance / Capability)
  - `ASSOCIATED_WITH` (General semantic association)
  - `CUSTOM(string)` (Open-ended extensibility)
- `targetConceptId`: ID or literal target (e.g., `"heating water"` or concept ID).
- `source`: Provenance of this specific edge.
- `status`: Epistemic status of this relation.
- `confidence`: Confidence score (`0.0` to `1.0`).
- `evidence`: Supporting and contradicting evidence entries.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.

#### C. `EvidenceItem`
Tracks the empirical provenance and validation history:
- `evidenceId`: Unique ID.
- `source`: Provenance source.
- `observationType`: `SUPPORTING` | `CONTRADICTING`.
- `description`: Textual explanation or observation details.
- `context`: Operational or environmental context where observed.
- `timestamp`: Timestamp of observation.
- `associatedExperienceId`?: Optional link to `ExperienceStore` record.

---

## 4. Generic Belief-Update Mechanism

When new evidence is observed:
1. **Prior Confidence & Counts**: Retrieve current `confidence`, `supportingCount`, `contradictingCount`.
2. **Bayesian / Proportional Update**:
   - If `SUPPORTING`:
     $$\text{newConfidence} = \min(0.99, \text{confidence} + (1 - \text{confidence}) \times \alpha)$$
   - If `CONTRADICTING`:
     $$\text{newConfidence} = \max(0.01, \text{confidence} - \text{confidence} \times \beta)$$
3. **Status Transitions**:
   - `HYPOTHESIS` + repeated support $\rightarrow$ `VALIDATED` (confidence $\ge 0.85$, $\ge 3$ supporting, 0 contradicting).
   - Any status + strong contradictory evidence $\rightarrow$ `CONTRADICTED` (confidence $\le 0.35$ with active contradictions).
   - Preserves complete historical evidence list without silent deletion.

---

## 5. Domain-Independent Common-Sense Foundation (Seeded)

The initial seed knowledge graph contains foundational principles across core ontological dimensions:

1. **Temporal Principles**:
   - `Past` `BEFORE` `Present`; `Present` `BEFORE` `Future`.
   - `Event` `OCCURS_IN` `Time`.
   - `Deadline`: `REQUIRES` `Completion_Time`; if `Actual_Time` > `Required_Time` $\rightarrow$ `Status` = `Missed`.

2. **Quantitative & Economic Principles**:
   - `Requirement`: `REQUIRES` `Available_Quantity` $\ge$ `Required_Quantity`.
   - `Transaction`: `HAS` `Revenue` and `Cost`.
   - `Profit`: `Revenue` > `Cost` $\rightarrow$ `Positive_Margin`; `Revenue` < `Cost` $\rightarrow$ `Negative_Margin`.

3. **Physical Intuition**:
   - `Physical_Object` `OCCURS_IN` `Space`; `HAS` `Mass` & `State_Of_Matter`.
   - `Heat` `CAUSES` `State_Change` in materials.
   - `Fragile_Object` `CAN` be `Damaged` by `Strong_Impact`.
   - `Water`: `IS_A` `Liquid`; `Boiling` `REQUIRES` `Heat`.
   - `Kettle`: `IS_A` `Appliance`; `USED_FOR` `heating water`.
   - `Apple`: `IS_A` `Fruit`; `HAS` property `edible = true`.

4. **Computing & Logic**:
   - `Python`: `IS_A` `Programming_Language`.
   - `Program`: `REQUIRES` `Instructions`.
   - `Database`: `USED_FOR` `storing data`.

5. **Causality & Epistemic Reasoning**:
   - `Correlation` `CANNOT` automatically establish `Causation`.
   - `Hypothesis` `REQUIRES` `Empirical_Evidence` for validation.
   - `Unknown` $\neq$ `False` and `Unknown` $\neq$ `True`.

---

## 6. Cognitive Architecture Data Flow

```text
               User Teaching / Natural Language / Sensor Input
                                     │
                                     ▼
                            [TeachingParser]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
             [KnowledgeCore]                  [ExperienceStore]
         (Concepts, Relations,              (Episodic & Outcome
         Common-Sense Principles)           Empirical Records)
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
                        [Relevant Knowledge Retrieval]
                                     │
                                     ▼
                            [World Model State]
                                     │
                                     ▼
                       [Inference & Hypothesis Engine]
                                     │
                                     ▼
                            [Prediction Engine]
                                     │
                                     ▼
                             [Action / Decision]
                                     │
                                     ▼
                            [Outcome Observation]
                                     │
                                     ▼
                         [Prediction Error Delta]
                                     │
                                     ▼
                       [Evidence Accumulator Engine]
                                     │
                                     ▼
                      [Belief Update & Revision]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
          [KnowledgeCore Update]            [ExperienceStore Update]
```

---

## 7. What is Genuinely Implemented vs. Seeded vs. Inferred vs. Future Work

| Component | Status | Mechanism |
| :--- | :--- | :--- |
| Concept & Relationship Graph | **Implemented** | Typed node-and-edge graph with generic predicates, property maps, and indices. |
| Epistemic Status & Provenance | **Implemented** | Strict multi-state status engine (`SEEDED`, `USER_TAUGHT`, `OBSERVED`, `INFERRED`, `HYPOTHESIS`, `VALIDATED`, `CONTRADICTED`, `REJECTED`) and source tracking. |
| Evidence & Belief Updating | **Implemented** | Proportional Bayesian-style updater maintaining complete audit histories without destructive deletes. |
| Common-Sense Principles | **Seeded** | Core physics, temporal, quantitative, computational, and epistemic principles seeded via the generic structure. |
| Graph Inference Engine | **Implemented** | Transitive relation deduction (`A IS_A B`, `B CAN C` $\Rightarrow$ `A CAN C`), constraint checking, and causal prediction. |
| User Teaching Extraction | **Implemented** | Extended natural language parser mapping user statements into structured concepts and relations. |
| Cross-Session Persistence | **Implemented** | Storage adapter persisting `KnowledgeCore` to `localStorage` (browser) or memory (tests). |
| UI Knowledge Observability | **Implemented** | Dual-mode UI integration: Simple Mode ("What I Know" & "What I Am Uncertain About") and Expert Mode (Knowledge Graph & Belief History). |
| Autonomous Web/Video/Vision Learning | *Future Work* | Out of scope for Phase 1; to be introduced in subsequent phases. |

---
