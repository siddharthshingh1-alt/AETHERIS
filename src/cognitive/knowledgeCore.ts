/**
 * KnowledgeCore - Domain-Independent Conceptual Knowledge Graph & Epistemic Reasoning Engine.
 *
 * Implements:
 * 1. Typed Concept & Relationship Graph with arbitrary domain support
 * 2. Strict provenance and EpistemicStatus lifecycle management
 * 3. Proportional Bayesian evidence accumulation and multi-observation tracking
 * 4. Contradiction handling without destructive deletion (preserves audit history)
 * 5. Deductive and Transitive Graph Inference across connected relationships
 * 6. Cross-session persistence via PersistenceAdapter (LocalStorage / In-Memory)
 */

import {
  Concept,
  Relationship,
  KnowledgeSource,
  EpistemicStatus,
  StandardPredicate,
  EvidenceRecordItem,
  EvidenceLedger,
  BeliefUpdateEvent,
  KnowledgeQueryResult,
  InferredFact,
} from '../types/knowledge';
import { PersistenceAdapter, LocalStorageAdapter } from './persistence';
import { getCommonSenseSeedKnowledge, createEmptyEvidenceLedger } from './knowledgeSeed';

export interface KnowledgeStoreState {
  concepts: Record<string, Concept>;
  relationships: Record<string, Relationship>;
  beliefUpdateLog: BeliefUpdateEvent[];
  version: number;
}

export class KnowledgeCore {
  private concepts: Map<string, Concept> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private beliefUpdateLog: BeliefUpdateEvent[] = [];
  private persistenceAdapter?: PersistenceAdapter<KnowledgeStoreState>;
  private storeId: string;

  constructor(storeId = 'aetheris_knowledge_core', persistenceAdapter?: PersistenceAdapter<KnowledgeStoreState>) {
    this.storeId = storeId;
    this.persistenceAdapter = persistenceAdapter;
    this.initialize();
  }

  private initialize(): void {
    if (this.persistenceAdapter) {
      const persisted = this.persistenceAdapter.load();
      if (persisted && persisted.concepts && Object.keys(persisted.concepts).length > 0) {
        for (const [id, c] of Object.entries(persisted.concepts)) {
          this.concepts.set(id, c);
        }
        for (const [id, r] of Object.entries(persisted.relationships || {})) {
          this.relationships.set(id, r);
        }
        this.beliefUpdateLog = persisted.beliefUpdateLog || [];
        return;
      }
    }

    // Seed initial domain-independent common-sense ontology
    const seed = getCommonSenseSeedKnowledge();
    for (const c of seed.concepts) {
      this.concepts.set(c.id, c);
    }
    for (const r of seed.relationships) {
      this.relationships.set(r.id, r);
    }
    this.persist();
  }

  private persist(): void {
    if (!this.persistenceAdapter) return;
    const state: KnowledgeStoreState = {
      concepts: Object.fromEntries(this.concepts.entries()),
      relationships: Object.fromEntries(this.relationships.entries()),
      beliefUpdateLog: this.beliefUpdateLog.slice(-200),
      version: 1,
    };
    this.persistenceAdapter.save(state);
  }

  // =========================================================================
  // 1. CONCEPT MANAGEMENT
  // =========================================================================

  public createOrUpdateConcept(params: {
    id?: string;
    name: string;
    category?: string;
    description?: string;
    source: KnowledgeSource;
    status?: EpistemicStatus;
    confidence?: number;
    properties?: Record<string, any>;
  }): Concept {
    const conceptId = params.id || `concept_${params.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const now = new Date().toISOString();
    const existing = this.concepts.get(conceptId);

    const defaultStatus: EpistemicStatus =
      params.status || (params.source === 'USER' ? 'USER_TAUGHT' : params.source === 'SYSTEM_SEED' ? 'SEEDED' : 'OBSERVED');
    const defaultConfidence = params.confidence ?? (params.source === 'SYSTEM_SEED' ? 0.95 : params.source === 'USER' ? 0.85 : 0.70);

    if (existing) {
      existing.name = params.name;
      if (params.category) existing.category = params.category;
      if (params.description) existing.description = params.description;
      if (params.status) existing.status = params.status;
      if (params.source && params.source === 'USER') {
        existing.source = params.source;
        existing.status = 'USER_TAUGHT';
      }
      if (params.confidence !== undefined) existing.confidence = params.confidence;
      existing.updatedAt = now;

      // Add properties
      if (params.properties) {
        for (const [key, value] of Object.entries(params.properties)) {
          existing.properties[key] = {
            key,
            value,
            confidence: defaultConfidence,
            source: params.source,
            status: defaultStatus,
            evidence: createEmptyEvidenceLedger(),
            lastUpdated: now,
          };
        }
      }

      this.concepts.set(conceptId, existing);
      this.persist();
      return existing;
    }

    const newConcept: Concept = {
      id: conceptId,
      name: params.name,
      category: params.category || 'GENERAL_ENTITY',
      description: params.description,
      properties: {},
      relationshipIds: [],
      source: params.source,
      status: defaultStatus,
      confidence: defaultConfidence,
      evidence: createEmptyEvidenceLedger(),
      createdAt: now,
      updatedAt: now,
    };

    if (params.properties) {
      for (const [key, value] of Object.entries(params.properties)) {
        newConcept.properties[key] = {
          key,
          value,
          confidence: defaultConfidence,
          source: params.source,
          status: defaultStatus,
          evidence: createEmptyEvidenceLedger(),
          lastUpdated: now,
        };
      }
    }

    this.concepts.set(conceptId, newConcept);
    this.persist();
    return newConcept;
  }

  public getConcept(id: string): Concept | undefined {
    return this.concepts.get(id);
  }

  public findConceptByName(name: string): Concept | undefined {
    const target = name.trim().toLowerCase();
    for (const c of this.concepts.values()) {
      if (c.name.toLowerCase() === target || c.id.toLowerCase() === target || c.id.toLowerCase() === `concept_${target}`) {
        return c;
      }
    }
    return undefined;
  }

  public getAllConcepts(): Concept[] {
    return Array.from(this.concepts.values());
  }

  // =========================================================================
  // 2. RELATIONSHIP MANAGEMENT
  // =========================================================================

  public addRelationship(params: {
    id?: string;
    sourceConceptId: string;
    predicate: StandardPredicate;
    targetConceptId: string;
    targetDescription?: string;
    source: KnowledgeSource;
    status?: EpistemicStatus;
    confidence?: number;
    contextConditions?: Record<string, any>;
  }): Relationship {
    const relId =
      params.id ||
      `rel_${params.sourceConceptId}_${params.predicate.toLowerCase()}_${params.targetConceptId.toLowerCase()}_${Date.now()}`;
    const now = new Date().toISOString();

    const status: EpistemicStatus =
      params.status || (params.source === 'USER' ? 'USER_TAUGHT' : params.source === 'SYSTEM_SEED' ? 'SEEDED' : 'HYPOTHESIS');
    const confidence = params.confidence ?? (params.source === 'SYSTEM_SEED' ? 0.95 : params.source === 'USER' ? 0.85 : 0.60);

    const newRelationship: Relationship = {
      id: relId,
      sourceConceptId: params.sourceConceptId,
      predicate: params.predicate,
      targetConceptId: params.targetConceptId,
      targetDescription: params.targetDescription,
      source: params.source,
      status,
      confidence,
      evidence: createEmptyEvidenceLedger(),
      contextConditions: params.contextConditions,
      createdAt: now,
      updatedAt: now,
    };

    this.relationships.set(relId, newRelationship);

    // Link relationship to source concept
    const sourceConcept = this.concepts.get(params.sourceConceptId);
    if (sourceConcept && !sourceConcept.relationshipIds.includes(relId)) {
      sourceConcept.relationshipIds.push(relId);
      sourceConcept.updatedAt = now;
    }

    this.persist();
    return newRelationship;
  }

  public getRelationship(id: string): Relationship | undefined {
    return this.relationships.get(id);
  }

  public getRelationshipsForConcept(conceptId: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      (r) => r.sourceConceptId === conceptId || r.targetConceptId === conceptId
    );
  }

  public getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }

  // =========================================================================
  // 3. EVIDENCE ACCUMULATION & GENERIC BELIEF UPDATE
  // =========================================================================

  public addEvidenceToConcept(
    conceptId: string,
    evidence: {
      isSupporting: boolean;
      source: KnowledgeSource;
      notes?: string;
      weight?: number;
    }
  ): { concept: Concept; updateEvent?: BeliefUpdateEvent } {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      throw new Error(`Concept with ID '${conceptId}' not found.`);
    }

    const prevConfidence = concept.confidence;
    const prevStatus = concept.status;
    const weight = evidence.weight ?? 1.0;
    const now = new Date().toISOString();

    const evItem: EvidenceRecordItem = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: evidence.isSupporting ? 'SUPPORTING' : 'CONTRADICTING',
      source: evidence.source,
      description: evidence.notes || (evidence.isSupporting ? 'Supporting evidence' : 'Contradicting evidence'),
      timestamp: now,
      weight,
    };

    concept.evidence.history.push(evItem);

    if (evidence.isSupporting) {
      concept.evidence.supportingCount += 1;
      const learningRate = 0.20 * weight;
      concept.confidence = Math.round(Math.min(0.99, concept.confidence + (1 - concept.confidence) * learningRate) * 100) / 100;
    } else {
      concept.evidence.contradictingCount += 1;
      const discountRate = 0.35 * weight;
      concept.confidence = Math.round(Math.max(0.05, concept.confidence - concept.confidence * discountRate) * 100) / 100;
    }

    // Update Status
    let newStatus = concept.status;
    if (concept.evidence.contradictingCount >= 2 && concept.confidence < 0.40) {
      newStatus = 'CONTRADICTED';
    } else if (concept.evidence.contradictingCount >= 4 && concept.confidence < 0.20) {
      newStatus = 'REJECTED';
    } else if (
      (concept.status === 'HYPOTHESIS' || concept.status === 'USER_TAUGHT' || concept.status === 'OBSERVED') &&
      concept.evidence.supportingCount >= 3 &&
      concept.evidence.contradictingCount === 0 &&
      concept.confidence >= 0.85
    ) {
      newStatus = 'VALIDATED';
    } else if (concept.evidence.contradictingCount > 0 && concept.confidence < 0.60) {
      newStatus = 'CONTRADICTED';
    }

    concept.status = newStatus;
    concept.updatedAt = now;

    let updateEvent: BeliefUpdateEvent | undefined;
    if (newStatus !== prevStatus || Math.abs(concept.confidence - prevConfidence) >= 0.05) {
      updateEvent = {
        id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetType: 'CONCEPT',
        targetId: concept.id,
        previousStatus: prevStatus,
        newStatus: newStatus,
        previousConfidence: prevConfidence,
        newConfidence: concept.confidence,
        triggerEvidence: evItem,
        timestamp: now,
        rationale: `Evidence (${evItem.type}) from ${evidence.source}: ${evItem.description}`,
      };
      this.beliefUpdateLog.push(updateEvent);
    }

    this.persist();
    return { concept, updateEvent };
  }

  public recordEvidence(
    conceptId: string,
    evidence: {
      isSupporting: boolean;
      source: KnowledgeSource;
      notes?: string;
      weight?: number;
    }
  ): { concept: Concept; updateEvent?: BeliefUpdateEvent } {
    return this.addEvidenceToConcept(conceptId, evidence);
  }

  public addEvidenceToRelationship(
    relationshipId: string,
    evidence: {
      type: 'SUPPORTING' | 'CONTRADICTING';
      source: KnowledgeSource;
      description: string;
      context?: Record<string, any>;
      experienceId?: string;
      weight?: number;
    }
  ): { relationship: Relationship; updateEvent?: BeliefUpdateEvent } {
    const rel = this.relationships.get(relationshipId);
    if (!rel) {
      throw new Error(`Relationship with ID '${relationshipId}' not found.`);
    }

    const prevConfidence = rel.confidence;
    const prevStatus = rel.status;
    const weight = evidence.weight ?? 1.0;
    const now = new Date().toISOString();

    const evItem: EvidenceRecordItem = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: evidence.type,
      source: evidence.source,
      description: evidence.description,
      timestamp: now,
      context: evidence.context,
      experienceId: evidence.experienceId,
      weight,
    };

    rel.evidence.history.push(evItem);

    if (evidence.type === 'SUPPORTING') {
      rel.evidence.supportingCount += 1;
      // Proportional positive Bayesian-style update
      const learningRate = 0.20 * weight;
      rel.confidence = Math.round(Math.min(0.99, rel.confidence + (1 - rel.confidence) * learningRate) * 100) / 100;
    } else {
      rel.evidence.contradictingCount += 1;
      // Proportional negative update
      const discountRate = 0.35 * weight;
      rel.confidence = Math.round(Math.max(0.05, rel.confidence - rel.confidence * discountRate) * 100) / 100;
    }

    // Determine Status Transition
    let newStatus = rel.status;
    if (rel.evidence.contradictingCount >= 2 && rel.confidence < 0.40) {
      newStatus = 'CONTRADICTED';
    } else if (rel.evidence.contradictingCount >= 4 && rel.confidence < 0.20) {
      newStatus = 'REJECTED';
    } else if (
      (rel.status === 'HYPOTHESIS' || rel.status === 'USER_TAUGHT' || rel.status === 'OBSERVED') &&
      rel.evidence.supportingCount >= 3 &&
      rel.evidence.contradictingCount === 0 &&
      rel.confidence >= 0.85
    ) {
      newStatus = 'VALIDATED';
    }

    rel.status = newStatus;
    rel.updatedAt = now;

    let updateEvent: BeliefUpdateEvent | undefined;
    if (newStatus !== prevStatus || Math.abs(rel.confidence - prevConfidence) >= 0.05) {
      updateEvent = {
        id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        targetType: 'RELATIONSHIP',
        targetId: rel.id,
        previousStatus: prevStatus,
        newStatus: newStatus,
        previousConfidence: prevConfidence,
        newConfidence: rel.confidence,
        triggerEvidence: evItem,
        timestamp: now,
        rationale: `Evidence (${evidence.type}) from ${evidence.source}: ${evidence.description}`,
      };
      this.beliefUpdateLog.push(updateEvent);
    }

    this.persist();
    return { relationship: rel, updateEvent };
  }

  // =========================================================================
  // 4. RETRIEVAL & GRAPH INFERENCE ENGINE
  // =========================================================================

  /**
   * Retrieves all relevant concepts, outgoing/incoming relationships, and deduces
   * multi-hop inferences (e.g. A IS_A B and B CAN C => A CAN C).
   */
  public queryKnowledge(query: {
    conceptNamesOrIds?: string[];
    predicates?: StandardPredicate[];
    minConfidence?: number;
    includeInferred?: boolean;
    maxInferenceDepth?: number;
  }): KnowledgeQueryResult {
    const minConf = query.minConfidence ?? 0.0;
    const targetSet = new Set<string>();

    if (query.conceptNamesOrIds) {
      for (const nameOrId of query.conceptNamesOrIds) {
        const found = this.findConceptByName(nameOrId) || this.concepts.get(nameOrId);
        if (found) targetSet.add(found.id);
      }
    } else {
      for (const c of this.concepts.keys()) {
        targetSet.add(c);
      }
    }

    const matchedConcepts: Concept[] = [];
    for (const id of targetSet) {
      const c = this.concepts.get(id);
      if (c && c.confidence >= minConf) {
        matchedConcepts.push(c);
      }
    }

    const matchedRelationships: Relationship[] = [];
    for (const rel of this.relationships.values()) {
      if (rel.confidence < minConf) continue;
      if (query.predicates && !query.predicates.includes(rel.predicate)) continue;

      if (targetSet.has(rel.sourceConceptId) || targetSet.has(rel.targetConceptId)) {
        matchedRelationships.push(rel);
      }
    }

    const inferences: InferredFact[] = [];
    if (query.includeInferred !== false) {
      // Deduce Transitive Inheritance: If X IS_A Y and Y [PREDICATE] Z => X [PREDICATE] Z
      for (const rel of Array.from(this.relationships.values())) {
        if (rel.predicate === 'IS_A') {
          const parentConceptId = rel.targetConceptId;
          const parentRels = Array.from(this.relationships.values()).filter(
            (r) => r.sourceConceptId === parentConceptId && r.predicate !== 'IS_A'
          );

          for (const pRel of parentRels) {
            const subject = this.concepts.get(rel.sourceConceptId)?.name || rel.sourceConceptId;
            const parentName = this.concepts.get(parentConceptId)?.name || parentConceptId;
            const object = this.concepts.get(pRel.targetConceptId)?.name || pRel.targetDescription || pRel.targetConceptId;

            inferences.push({
              id: `inf_${rel.sourceConceptId}_${pRel.predicate}_${pRel.targetConceptId}`,
              subject,
              predicate: pRel.predicate,
              object,
              confidence: Math.round(rel.confidence * pRel.confidence * 100) / 100,
              derivationChain: [
                `${subject} IS_A ${parentName} (conf: ${rel.confidence})`,
                `${parentName} ${pRel.predicate} ${object} (conf: ${pRel.confidence})`,
              ],
              status: 'INFERRED',
            });
          }
        }
      }
    }

    return {
      concepts: matchedConcepts,
      relationships: matchedRelationships,
      inferences,
    };
  }

  // =========================================================================
  // 5. OBSERVABILITY & AUDIT LOGS
  // =========================================================================

  public getBeliefUpdateHistory(): BeliefUpdateEvent[] {
    return [...this.beliefUpdateLog];
  }

  public getContradictedKnowledge(): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      (r) => r.status === 'CONTRADICTED' || r.status === 'REJECTED' || r.evidence.contradictingCount > 0
    );
  }

  public clear(): void {
    this.concepts.clear();
    this.relationships.clear();
    this.beliefUpdateLog = [];
    this.initialize();
  }

  public size(): { concepts: number; relationships: number } {
    return {
      concepts: this.concepts.size,
      relationships: this.relationships.size,
    };
  }
}
