/**
 * Experience Store - Structured Experiential Memory for the Learning Machine.
 *
 * Implements persistent, structured experience records separating:
 * - OBSERVED FACT (ground truth outcomes)
 * - INTERPRETATION (causal attribution of error)
 * - LESSON (concrete adjustment rule)
 * - CONFIDENCE (statistical grounding)
 */

import { PersistenceAdapter, LocalStorageAdapter } from './persistence';

export type CognitiveMemoryType = 'EXPERIENCE' | 'FACT' | 'PREFERENCE' | 'HYPOTHESIS_OR_RULE' | 'LESSON';
export type CognitiveEvidenceStatus = 'OBSERVED_EVENT' | 'USER_HYPOTHESIS' | 'EMPIRICALLY_VALIDATED' | 'USER_PREFERENCE' | 'FACT';

export interface StructuredLesson {
  observedFact: string;
  interpretation: string;
  proposedChange: string;
  confidence: number; // 0.0 to 1.0
  rule: string;
  targetFeature?: string;
  adjustmentWeight?: number;
}

export interface ExperienceRecord {
  experienceId: string;
  taskId: string;
  taskFamily: string; // 'RESOURCE_ALLOCATION' | 'SUPPLIER_SELECTION' | 'SEQUENTIAL_DECISION' | 'GENERAL'
  context: Record<string, any>;
  prediction: {
    predictedDelay?: number;
    predictedCost?: number;
    predictedSuccess?: boolean;
    expectedUtility?: number;
    modalOutcome?: string;
    probabilities?: Record<string, number>;
  };
  confidence: number; // 0.0 to 1.0
  predictionFeatures: Record<string, number | string | boolean>;
  selectedAction: {
    actionType: string;
    targetEntity?: string;
    parameters: Record<string, any>;
  };
  expectedOutcome: {
    delayDays?: number;
    cost?: number;
    stockoutOccurred?: boolean;
    netUtility?: number;
  };
  actualOutcome: {
    delayDays?: number;
    cost?: number;
    stockoutOccurred?: boolean;
    netUtility?: number;
  };
  predictionError: {
    delayErrorDelta?: number;
    costErrorDelta?: number;
    normalizedError: number;
    brierLoss: number;
    direction: 'UNDERESTIMATED' | 'OVERESTIMATED' | 'ACCURATE';
  };
  success: boolean;
  errorCause: {
    observedFact: string;
    interpretation: string;
    identifiedDriver: string;
  };
  lesson: StructuredLesson;
  applicableConditions: {
    taskFamily: string;
    featureConstraints: Record<string, { min?: number; max?: number; exact?: string | number | boolean }>;
  };
  createdAt: string;
  sourceExperimentId: string;
  
  // Extended User Teaching & Memory Architecture Fields
  memoryType?: CognitiveMemoryType;
  source?: 'USER_TAUGHT' | 'BENCHMARK' | 'AUTONOMOUS_CYCLE' | 'OBSERVED';
  targetEntity?: string;
  evidenceStatus?: CognitiveEvidenceStatus;
  supportingEvidenceCount?: number;
  contradictingEvidenceCount?: number;
  userTeachingRawText?: string;
  relevanceScore?: number; // Cached or runtime relevance
}

export interface ExperienceQuery {
  taskFamily?: string;
  targetEntity?: string;
  contextFeatures?: Record<string, any>;
  memoryTypes?: CognitiveMemoryType[];
  limit?: number;
  minConfidence?: number;
}

export class ExperienceStore {
  private experiences: Map<string, ExperienceRecord> = new Map();
  private experimentId: string;
  private persistenceAdapter?: PersistenceAdapter<ExperienceRecord[]>;

  constructor(experimentId: string = 'exp_default', persistenceAdapter?: PersistenceAdapter<ExperienceRecord[]>) {
    this.experimentId = experimentId;
    this.persistenceAdapter = persistenceAdapter;

    // Load from persistence if available
    if (this.persistenceAdapter) {
      const loaded = this.persistenceAdapter.load();
      if (Array.isArray(loaded) && loaded.length > 0) {
        loaded.forEach((rec) => {
          if (rec.experienceId) {
            this.experiences.set(rec.experienceId, rec);
          }
        });
      }
    }
  }

  private persist(): void {
    if (this.persistenceAdapter) {
      this.persistenceAdapter.save(Array.from(this.experiences.values()));
    }
  }

  public getExperimentId(): string {
    return this.experimentId;
  }

  public setExperimentId(id: string): void {
    this.experimentId = id;
  }

  /**
   * Adds a structured experience record to the store and persists it.
   */
  public addExperience(record: ExperienceRecord): void {
    if (!record.experienceId) {
      record.experienceId = `exp_rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    if (!record.memoryType) {
      record.memoryType = record.source === 'USER_TAUGHT' ? 'EXPERIENCE' : 'LESSON';
    }
    this.experiences.set(record.experienceId, { ...record });
    this.persist();
  }

  /**
   * Updates an existing experience record.
   */
  public updateExperience(record: ExperienceRecord): void {
    if (this.experiences.has(record.experienceId)) {
      this.experiences.set(record.experienceId, { ...record });
      this.persist();
    }
  }

  /**
   * Removes an experience by ID.
   */
  public removeExperience(experienceId: string): boolean {
    const deleted = this.experiences.delete(experienceId);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  /**
   * Retrieves an individual experience by ID.
   */
  public getExperience(experienceId: string): ExperienceRecord | undefined {
    const item = this.experiences.get(experienceId);
    return item ? { ...item } : undefined;
  }

  /**
   * Returns all stored experiences in chronological order.
   */
  public getAllExperiences(): ExperienceRecord[] {
    return Array.from(this.experiences.values());
  }

  /**
   * Retrieves relevant previous experiences before making a prediction.
   * Evaluates task family, target entity, context features with distance scaling, and confidence.
   */
  public retrieveRelevantExperiences(query: ExperienceQuery): ExperienceRecord[] {
    const limit = query.limit ?? 5;
    const minConfidence = query.minConfidence ?? 0.2;
    const all = Array.from(this.experiences.values());

    const scored = all.map(exp => {
      let score = 0;

      // 1. Task family match (+0.4)
      if (query.taskFamily && exp.taskFamily === query.taskFamily) {
        score += 0.4;
      } else if (!query.taskFamily || exp.taskFamily === 'GENERAL') {
        score += 0.2;
      }

      // 2. Target Entity match (+0.3)
      if (query.targetEntity) {
        const qTarget = query.targetEntity.toLowerCase();
        const expTarget = (exp.targetEntity || exp.selectedAction?.targetEntity || '').toLowerCase();
        const expAction = (exp.selectedAction?.actionType || '').toLowerCase();
        if (expTarget.includes(qTarget) || qTarget.includes(expTarget) || expAction.includes(qTarget)) {
          score += 0.3;
        }
      }

      // 3. Feature matching with distance scaling
      if (query.contextFeatures && exp.predictionFeatures) {
        let featureScore = 0;
        let featuresCompared = 0;

        for (const [key, queryVal] of Object.entries(query.contextFeatures)) {
          if (queryVal === undefined || queryVal === null) continue;
          
          if (exp.predictionFeatures[key] !== undefined) {
            featuresCompared++;
            const expVal = exp.predictionFeatures[key];

            if (expVal === queryVal) {
              featureScore += 1.0;
            } else if (typeof expVal === 'number' && typeof queryVal === 'number') {
              const diffRatio = Math.abs(expVal - queryVal) / Math.max(0.1, Math.abs(queryVal));
              if (diffRatio < 0.2) {
                featureScore += 0.9;
              } else if (diffRatio < 0.4) {
                featureScore += 0.6;
              } else if (diffRatio < 0.7) {
                featureScore += 0.2;
              } else {
                // Large distance mismatch (e.g. demandVolatility 0.15 vs 0.45): contextual mismatch penalty
                featureScore -= 0.4;
              }
            } else if (typeof expVal === 'boolean' && typeof queryVal === 'boolean') {
              featureScore += expVal === queryVal ? 1.0 : -0.3;
            }
          }
        }

        if (featuresCompared > 0) {
          const normalizedFeatureScore = Math.max(0, featureScore / featuresCompared);
          score += 0.4 * normalizedFeatureScore;
        }
      }

      // 4. Memory Type Filter (if specified)
      if (query.memoryTypes && query.memoryTypes.length > 0 && exp.memoryType) {
        if (!query.memoryTypes.includes(exp.memoryType)) {
          score *= 0.5;
        }
      }

      // 5. Weight by lesson confidence or record confidence
      const recordConfidence = exp.lesson?.confidence || exp.confidence || 0.7;
      score *= (0.4 + 0.6 * recordConfidence);

      return { exp, score };
    });

    return scored
      .filter(item => item.score > 0.15 && (item.exp.lesson?.confidence || item.exp.confidence || 0) >= minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.exp,
        relevanceScore: Math.min(0.98, Math.round(item.score * 100) / 100),
      }));
  }

  /**
   * Clears all stored experiences (used for resetting between test partitions or control agent).
   */
  public clear(): void {
    this.experiences.clear();
    this.persist();
  }

  /**
   * Returns current count of stored experiences.
   */
  public size(): number {
    return this.experiences.size;
  }

  /**
   * Exports full store as a JSON formatted string.
   */
  public export(): string {
    return JSON.stringify(Array.from(this.experiences.values()), null, 2);
  }

  /**
   * Exports full store as line-delimited JSON (JSONL) for machine learning analysis.
   */
  public exportJSONL(): string {
    return Array.from(this.experiences.values())
      .map(exp => JSON.stringify(exp))
      .join('\n');
  }
}

