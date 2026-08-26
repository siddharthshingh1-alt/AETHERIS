/**
 * Experience Store - Structured Experiential Memory for the Learning Machine.
 *
 * Implements persistent, structured experience records separating:
 * - OBSERVED FACT (ground truth outcomes)
 * - INTERPRETATION (causal attribution of error)
 * - LESSON (concrete adjustment rule)
 * - CONFIDENCE (statistical grounding)
 */

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
  taskFamily: string; // 'RESOURCE_ALLOCATION' | 'SUPPLIER_SELECTION' | 'SEQUENTIAL_DECISION'
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
}

export interface ExperienceQuery {
  taskFamily?: string;
  contextFeatures?: Record<string, any>;
  limit?: number;
  minConfidence?: number;
}

export class ExperienceStore {
  private experiences: Map<string, ExperienceRecord> = new Map();
  private experimentId: string;

  constructor(experimentId: string = 'exp_default') {
    this.experimentId = experimentId;
  }

  public getExperimentId(): string {
    return this.experimentId;
  }

  public setExperimentId(id: string): void {
    this.experimentId = id;
  }

  /**
   * Adds a structured experience record to the store.
   */
  public addExperience(record: ExperienceRecord): void {
    if (!record.experienceId) {
      record.experienceId = `exp_rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    this.experiences.set(record.experienceId, { ...record });
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
   * Uses deterministic task family and feature similarity matching.
   */
  public retrieveRelevantExperiences(query: ExperienceQuery): ExperienceRecord[] {
    const limit = query.limit ?? 5;
    const minConfidence = query.minConfidence ?? 0.2;
    const all = Array.from(this.experiences.values());

    const scored = all.map(exp => {
      let score = 0;

      // Task family match (+0.5)
      if (query.taskFamily && exp.taskFamily === query.taskFamily) {
        score += 0.5;
      }

      // Feature matching
      if (query.contextFeatures && exp.predictionFeatures) {
        let matchingFeatures = 0;
        let totalQueried = 0;

        for (const [key, val] of Object.entries(query.contextFeatures)) {
          totalQueried++;
          if (exp.predictionFeatures[key] !== undefined) {
            const expVal = exp.predictionFeatures[key];
            if (expVal === val) {
              matchingFeatures += 1.0;
            } else if (typeof expVal === 'number' && typeof val === 'number') {
              const diffRatio = Math.abs(expVal - val) / Math.max(1, Math.abs(val));
              if (diffRatio < 0.25) {
                matchingFeatures += 0.7;
              } else if (diffRatio < 0.5) {
                matchingFeatures += 0.3;
              }
            }
          }
        }

        if (totalQueried > 0) {
          score += 0.5 * (matchingFeatures / totalQueried);
        }
      }

      // Weight by lesson confidence
      score *= (0.5 + 0.5 * (exp.lesson.confidence || 0.5));

      return { exp, score };
    });

    return scored
      .filter(item => item.score > 0.1 && (item.exp.lesson.confidence || 0) >= minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({ ...item.exp }));
  }

  /**
   * Clears all stored experiences (used for resetting between test partitions or control agent).
   */
  public clear(): void {
    this.experiences.clear();
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
