export type EpistemicStatus = 
  | 'FACT'
  | 'BELIEF'
  | 'HYPOTHESIS'
  | 'ASSUMPTION'
  | 'PREDICTION'
  | 'INFERENCE'
  | 'UNKNOWN';

export type MemoryType = 
  | 'WORKING'
  | 'EPISODIC'
  | 'SEMANTIC'
  | 'PROCEDURAL'
  | 'META';

export type CognitivePhase = 
  | 'IDLE'
  | 'OBSERVE'
  | 'PERCEIVE'
  | 'REPRESENT'
  | 'UPDATE_WORLD'
  | 'RETRIEVE_MEMORY'
  | 'PREDICT'
  | 'REASON_SIMULATE'
  | 'PLAN'
  | 'ACT'
  | 'OBSERVE_CONSEQUENCE'
  | 'CALCULATE_ERROR'
  | 'LEARN'
  | 'METACOGNITION'
  | 'SELF_IMPROVEMENT';

export interface EntityProperty {
  key: string;
  value: string | number | boolean;
  confidence: number; // 0 to 1
  source: string;
  lastUpdatedCycle: number;
}

export interface WorldEntity {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'LOGISTICS' | 'PRODUCTION' | 'CUSTOMER' | 'RESOURCE' | 'ENVIRONMENT';
  status: string;
  properties: Record<string, EntityProperty>;
  reliabilityScore: number; // 0 to 1
  historicalEventsCount: number;
  tags: string[];
}

export interface CausalEdge {
  id: string;
  sourceEntityId: string;
  sourceProperty: string;
  targetEntityId: string;
  targetProperty: string;
  relationship: string; // e.g. "increases delay probability"
  influenceWeight: number; // -1.0 to 1.0
  confidence: number; // 0 to 1
  empiricalSupportCount: number;
  falsificationCount: number;
  lastUpdatedCycle: number;
}

export interface EpistemicStatement {
  id: string;
  statement: string;
  status: EpistemicStatus;
  confidence: number; // 0 to 1
  evidenceIds: string[];
  counterEvidenceIds: string[];
  createdCycle: number;
  lastValidatedCycle: number;
}

export interface EpisodicRecord {
  id: string;
  cycle: number;
  timestamp: string;
  context: string;
  actionTaken: ActionRecord;
  predictedOutcome: PredictionOutcome;
  actualOutcome: ActualOutcome;
  predictionError: PredictionErrorDelta;
  surpriseScore: number; // 0 to 1
  keyInsight: string;
  consolidated: boolean;
}

export interface SemanticRule {
  id: string;
  domain: string;
  invariantRule: string;
  confidence: number;
  supportingEpisodeIds: string[];
  generalityScore: number; // 0 to 1
  applicabilityConditions: string[];
}

export interface ProceduralSkill {
  id: string;
  name: string;
  description: string;
  steps: string[];
  successRate: number; // 0 to 1
  executionCount: number;
  cost: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  triggerCondition: string;
}

export interface MetaMemoryEntry {
  id: string;
  domain: string;
  competenceLevel: number; // 0 to 1
  calibrationScore: number; // 0 to 1 (1 = perfectly calibrated)
  knownStrengths: string[];
  knownWeaknesses: string[];
  uncertaintyBoundaries: string[];
}

export interface FutureStatePrediction {
  step: number;
  stateDescription: string;
  probability: number;
  confidenceInterval: [number, number]; // [min, max]
  expectedMetrics: {
    delayDays: number;
    cost: number;
    inventoryLevel: number;
    cashDelta: number;
    customerSatisfaction: number;
  };
  uncertaintyFactors: string[];
}

export interface PredictionOutcome {
  horizonSteps: number;
  candidateFutures: FutureStatePrediction[];
  chosenTrajectory: FutureStatePrediction;
  expectedDelayDays: number;
  expectedCost: number;
  confidence: number;
  reasoningSummary: string;
}

export interface ActionRecord {
  id: string;
  type: string;
  title: string;
  targetEntityId: string;
  parameters: Record<string, any>;
  cost: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reversible: boolean;
  rationale: string;
}

export interface ActualOutcome {
  actionId: string;
  actualDelayDays: number;
  actualCost: number;
  actualInventoryDelta: number;
  actualCashDelta: number;
  actualCustomerSatisfaction: number;
  status: 'SUCCESS' | 'DELAYED' | 'FAILED' | 'PARTIAL';
  notes: string;
}

export interface PredictionErrorDelta {
  delayErrorDays: number; // actual - predicted
  costError: number;
  overallNormalizedError: number; // 0 to 1
  direction: 'OVERESTIMATED' | 'UNDERESTIMATED' | 'ACCURATE';
  dominantCause: string;
  brierScoreContribution: number;
}

export interface LearningEvent {
  id: string;
  cycle: number;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  levelName: 'Knowledge' | 'Pattern' | 'Skill' | 'Strategy' | 'World Model' | 'Meta-Learning';
  description: string;
  parameterChanged: string;
  previousValue: string | number;
  newValue: string | number;
  justification: string;
}

export interface MetacognitiveDiagnosis {
  id: string;
  cycle: number;
  question: string;
  diagnosis: string;
  assumptionsTested: string[];
  flawedAssumption?: string;
  proposedRemedy: string;
  confidenceInSelf: number;
}

export interface SelfImprovementExperiment {
  id: string;
  version: string;
  hypothesis: string;
  weaknessAddressed: string;
  componentTarget: 'PREDICTION_ENGINE' | 'PLANNING_ENGINE' | 'MEMORY_RETRIEVAL' | 'CAUSAL_LEARNING' | 'MODEL_ROUTING';
  baselineScore: number;
  candidateScore: number;
  status: 'PROPOSED' | 'RUNNING_SANDBOX' | 'ACCEPTED' | 'REJECTED' | 'ROLLED_BACK';
  benchmarkMetrics: {
    predictionAccuracy: number;
    calibrationBrier: number;
    adaptationLatencyCycles: number;
    resourceCost: number;
  };
  deployedCycle?: number;
}

export interface EnvironmentState {
  cycle: number;
  cash: number;
  inventoryUnits: number;
  pendingOrders: Array<{
    id: string;
    supplierId: string;
    units: number;
    unitCost: number;
    orderCycle: number;
    expectedDeliveryCycle: number;
    actualDeliveryCycle?: number;
    status: 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  }>;
  customerDemandRate: number; // units per cycle
  productionCapacity: number;
  marketVolatility: 'LOW' | 'NORMAL' | 'HIGH' | 'CHAOTIC';
  weatherDisruption: boolean;
  supplierStrike: boolean;
  portCongestionLevel: number; // 0 to 1
}

export interface CognitiveCycleTrace {
  cycleNumber: number;
  timestamp: string;
  phase: CognitivePhase;
  perception: string[];
  workingMemorySnapshot: {
    activeGoal: string;
    hypotheses: string[];
    focusedEntities: string[];
  };
  worldModelUpdates: string[];
  retrievedMemories: string[];
  prediction: PredictionOutcome;
  plan: {
    goal: string;
    subgoals: string[];
    selectedAction: ActionRecord;
    alternativeOptions: string[];
  };
  actionExecuted: ActionRecord;
  actualObservation: ActualOutcome;
  predictionError: PredictionErrorDelta;
  learningEvents: LearningEvent[];
  metacognition: MetacognitiveDiagnosis;
  selfImprovementProposal?: SelfImprovementExperiment;
}
