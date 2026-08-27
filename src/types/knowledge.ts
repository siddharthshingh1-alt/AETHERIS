/**
 * Knowledge Core Type Definitions for AETHERIS.
 *
 * Provides a domain-independent, evidence-aware conceptual ontology supporting:
 * - Arbitrary concepts (Kettle, Apple, Python, Deadline, Supplier, Revenue, etc.)
 * - Generic and extensible relationships (IS_A, PART_OF, HAS, USED_FOR, CAUSES, REQUIRES, etc.)
 * - Epistemic status tracking (SEEDED, USER_TAUGHT, OBSERVED, INFERRED, HYPOTHESIS, VALIDATED, CONTRADICTED, REJECTED)
 * - Source/Provenance tracking (SYSTEM_SEED, USER, TEXT, IMAGE, VIDEO, WEB, EXPERIMENT, ENVIRONMENT, OBSERVATION, LEARNED_EXPERIENCE)
 * - Multi-observation evidence ledgers & belief update histories
 */

export type KnowledgeSource =
  | 'SYSTEM_SEED'
  | 'USER'
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'WEB'
  | 'EXPERIMENT'
  | 'ENVIRONMENT'
  | 'OBSERVATION'
  | 'LEARNED_EXPERIENCE';

export type EpistemicStatus =
  | 'SEEDED'
  | 'USER_TAUGHT'
  | 'OBSERVED'
  | 'INFERRED'
  | 'HYPOTHESIS'
  | 'VALIDATED'
  | 'CONTRADICTED'
  | 'REJECTED';

export type StandardPredicate =
  | 'IS_A'
  | 'PART_OF'
  | 'HAS'
  | 'USED_FOR'
  | 'LOCATED_IN'
  | 'CAUSES'
  | 'PREVENTS'
  | 'REQUIRES'
  | 'BEFORE'
  | 'AFTER'
  | 'SIMILAR_TO'
  | 'DIFFERENT_FROM'
  | 'CAN'
  | 'CANNOT'
  | 'ASSOCIATED_WITH'
  | string; // Extensible predicate string

export interface EvidenceRecordItem {
  id: string;
  type: 'SUPPORTING' | 'CONTRADICTING';
  source: KnowledgeSource;
  description: string;
  timestamp: string;
  context?: Record<string, any>;
  experienceId?: string;
  weight?: number; // 0.0 to 1.0 (default 1.0)
}

export interface EvidenceLedger {
  supportingCount: number;
  contradictingCount: number;
  successfulPredictions: number;
  failedPredictions: number;
  sourceReliability: number; // 0.0 to 1.0
  history: EvidenceRecordItem[];
}

export interface ConceptProperty {
  key: string;
  value: string | number | boolean | Record<string, any>;
  confidence: number; // 0.0 to 1.0
  source: KnowledgeSource;
  status: EpistemicStatus;
  evidence: EvidenceLedger;
  lastUpdated: string;
}

export interface Relationship {
  id: string;
  sourceConceptId: string;
  predicate: StandardPredicate;
  targetConceptId: string; // Target concept ID or literal value
  targetDescription?: string; // Human readable description of target if literal
  source: KnowledgeSource;
  status: EpistemicStatus;
  confidence: number; // 0.0 to 1.0
  evidence: EvidenceLedger;
  contextConditions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Concept {
  id: string;
  name: string;
  category: string; // e.g. "APPLIANCE", "FRUIT", "LANGUAGE", "TEMPORAL", "FINANCIAL", "ABSTRACT"
  properties: Record<string, ConceptProperty>;
  relationshipIds: string[];
  source: KnowledgeSource;
  status: EpistemicStatus;
  confidence: number; // 0.0 to 1.0
  evidence: EvidenceLedger;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeliefUpdateEvent {
  id: string;
  targetType: 'CONCEPT' | 'RELATIONSHIP' | 'PROPERTY';
  targetId: string;
  previousStatus: EpistemicStatus;
  newStatus: EpistemicStatus;
  previousConfidence: number;
  newConfidence: number;
  triggerEvidence: EvidenceRecordItem;
  timestamp: string;
  rationale: string;
}

export interface KnowledgeQueryResult {
  concepts: Concept[];
  relationships: Relationship[];
  inferences?: InferredFact[];
}

export interface InferredFact {
  id: string;
  subject: string;
  predicate: StandardPredicate;
  object: string;
  confidence: number;
  derivationChain: string[];
  status: EpistemicStatus;
}
