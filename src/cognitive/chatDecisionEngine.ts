/**
 * Cognitive Decision Engine for Chat & Interactive Reasoning.
 *
 * Connects User Chat and Transparent Explanations directly to the actual
 * cognitive architecture:
 * 1. Reads current operational environment and parameters
 * 2. Queries ExperienceStore for relevant empirical records & taught facts
 * 3. Calculates baseline prior (Memory OFF)
 * 4. Applies retrieved experiences to update predictions, penalties, and confidence (Memory ON)
 * 5. Evaluates candidate action utilities and selects the optimal action
 * 6. Generates full Before/After causal comparison trace for transparent explanation
 */

import { ExperienceStore, ExperienceRecord, CognitiveMemoryType, CognitiveEvidenceStatus } from './experienceStore';
import { EnvironmentState } from '../types/cognitive';
import { UserFriendlyMemoryItem } from '../types/userState';
import { DecisionExplanationData } from '../components/DecisionExplanationModal';
import { accumulateEvidenceForAction, AccumulatedEvidenceResult } from './evidenceAccumulator';

export interface ActionCandidateScore {
  actionId: string;
  label: string;
  estimatedDelay: number;
  estimatedCost: number;
  stockoutPenalty: number;
  expectedUtility: number;
  confidence: number;
  wasInfluenced: boolean;
  influenceMagnitude?: number;
  affectedVariable?: string;
  evidenceSummary?: string;
  rejectionReason?: string;
}

export interface RetrievedMemoryInfo {
  id: string;
  title: string;
  lessonSnippet: string;
  relevanceScore: number;
  confidence: number;
  source: 'EXPERIENCE_STORE' | 'USER_TAUGHT' | 'WORLD_MODEL';
  memoryType?: CognitiveMemoryType;
  evidenceStatus?: CognitiveEvidenceStatus;
  influencedPrediction: boolean;
  influenceMagnitude?: number;
  affectedVariable?: string;
  supportingCount?: number;
  contradictingCount?: number;
}

export interface CognitiveDecisionTrace {
  traceId: string;
  timestamp: string;
  queryTitle: string;
  taskFamily: string;
  
  // Environment Context
  context: {
    inventoryDays: number;
    portCongestion: number;
    demandVolatility: number;
    weatherDisruption: boolean;
    cashReserves: number;
  };
  
  // Retrieved Memory Evidence
  retrievedMemories: RetrievedMemoryInfo[];
  
  // Memory OFF (Baseline Prior)
  baseline: {
    selectedActionId: string;
    selectedActionLabel: string;
    confidence: number;
    expectedDelay: number;
    expectedCost: number;
    expectedUtility: number;
    candidateScores: ActionCandidateScore[];
  };
  
  // Memory ON (Experience Informed)
  experienceInformed: {
    selectedActionId: string;
    selectedActionLabel: string;
    confidence: number;
    expectedDelay: number;
    expectedCost: number;
    expectedUtility: number;
    candidateScores: ActionCandidateScore[];
  };
  
  // Causal Delta (Before vs. After Memory)
  causalDelta: {
    delayDeltaDays: number;
    costDelta: number;
    utilityDelta: number;
    confidenceDelta: number;
    decisionChanged: boolean;
  };
  
  // Explanation Modal Data
  explanationData: DecisionExplanationData;
}

/**
 * Creates an initialized ExperienceStore populated with verified empirical experiences.
 */
export function createDefaultExperienceStore(experimentId: string = 'aria_live_store'): ExperienceStore {
  const store = new ExperienceStore(experimentId);

  // Seed with realistic empirical experiences
  const seedExperiences: ExperienceRecord[] = [
    {
      experienceId: 'exp_rec_alpha_01',
      taskId: 'TASK_SEED_1',
      taskFamily: 'SUPPLIER_SELECTION',
      context: { portCongestion: 0.62, inventoryDays: 2.0, orderVolume: 1250 },
      prediction: { expectedUtility: 8800 },
      confidence: 0.88,
      predictionFeatures: { portCongestion: 0.62, inventoryDays: 2.0, orderVolume: 1250 },
      selectedAction: { actionType: 'SUPPLIER_ALPHA', targetEntity: 'Supplier Alpha', parameters: { mode: 'maritime' } },
      expectedOutcome: { delayDays: 2.0, cost: 1200, netUtility: 8800 },
      actualOutcome: { delayDays: 4.5, cost: 1200, stockoutOccurred: true, netUtility: 4300 },
      predictionError: {
        delayErrorDelta: 2.5,
        costErrorDelta: 0,
        normalizedError: 0.55,
        brierLoss: 0.30,
        direction: 'UNDERESTIMATED',
      },
      success: false,
      errorCause: {
        observedFact: 'Maritime shipping arrival was delayed to 4.5 days due to container offload bottleneck.',
        interpretation: 'Port congestion (>0.40) non-linearly amplifies maritime transit lead times.',
        identifiedDriver: 'portCongestion',
      },
      lesson: {
        observedFact: 'Maritime freight delayed by +2.5 days during port congestion > 0.40.',
        interpretation: 'Under congestion, maritime risk exceeds air freight cost premium.',
        proposedChange: 'Switch to Dual Sourcing or Express Air Freight when port congestion exceeds 40%.',
        confidence: 0.88,
        rule: 'IF portCongestion > 0.40 THEN add +2.5d maritime delay penalty',
        targetFeature: 'estimatedDelay',
        adjustmentWeight: 2.5,
      },
      applicableConditions: {
        taskFamily: 'SUPPLIER_SELECTION',
        featureConstraints: { portCongestion: { min: 0.4 } },
      },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      sourceExperimentId: experimentId,
      memoryType: 'LESSON',
      source: 'BENCHMARK',
      targetEntity: 'Supplier Alpha',
      evidenceStatus: 'EMPIRICALLY_VALIDATED',
      supportingEvidenceCount: 1,
      contradictingEvidenceCount: 0,
    },
    {
      experienceId: 'exp_rec_volatility_02',
      taskId: 'TASK_SEED_2',
      taskFamily: 'RESOURCE_ALLOCATION',
      context: { demandVolatility: 0.45, inventoryDays: 1.5 },
      prediction: { expectedUtility: 9800 },
      confidence: 0.82,
      predictionFeatures: { demandVolatility: 0.45, inventoryDays: 1.5 },
      selectedAction: { actionType: 'LEAN_CASH', targetEntity: 'Lean Cash Reserves', parameters: {} },
      expectedOutcome: { netUtility: 9800 },
      actualOutcome: { netUtility: 5200, stockoutOccurred: true },
      predictionError: {
        normalizedError: 0.47,
        brierLoss: 0.22,
        direction: 'UNDERESTIMATED',
      },
      success: false,
      errorCause: {
        observedFact: 'Demand spike of +40% depleted inventory prematurely.',
        interpretation: 'Lean cash inventory buffers fail under high demand volatility.',
        identifiedDriver: 'demandVolatility',
      },
      lesson: {
        observedFact: 'Demand volatility > 0.30 caused safety stock exhaustion in 2 cycles.',
        interpretation: 'Safety buffer hedging is required when market volatility is elevated.',
        proposedChange: 'Maintain balanced hedging reserve when demand volatility > 0.30.',
        confidence: 0.82,
        rule: 'IF demandVolatility > 0.30 THEN apply buffer allocation hedge',
      },
      applicableConditions: {
        taskFamily: 'RESOURCE_ALLOCATION',
        featureConstraints: { demandVolatility: { min: 0.3 } },
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      sourceExperimentId: experimentId,
      memoryType: 'LESSON',
      source: 'BENCHMARK',
      targetEntity: 'Lean Cash Reserves',
      evidenceStatus: 'EMPIRICALLY_VALIDATED',
      supportingEvidenceCount: 1,
      contradictingEvidenceCount: 0,
    },
  ];

  seedExperiences.forEach((exp) => store.addExperience(exp));
  return store;
}

/**
 * Executes a live decision evaluation using the actual cognitive engine and ExperienceStore.
 */
export function evaluateCognitiveDecision(params: {
  query: string;
  environmentState: EnvironmentState;
  experienceStore: ExperienceStore;
  userTaughtMemories?: UserFriendlyMemoryItem[];
}): CognitiveDecisionTrace {
  const { query, environmentState, experienceStore } = params;
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const queryLower = query.toLowerCase();

  // 1. Extract context variables from Query (if explicitly specified) or Environment
  let demandVolatility =
    environmentState.marketVolatility === 'CHAOTIC'
      ? 0.6
      : environmentState.marketVolatility === 'HIGH'
      ? 0.4
      : environmentState.marketVolatility === 'NORMAL'
      ? 0.2
      : 0.1;
  if (queryLower.includes('demand volatility is high') || queryLower.includes('volatility is high') || queryLower.includes('high demand volatility')) {
    demandVolatility = 0.45;
  } else if (queryLower.includes('demand volatility is low') || queryLower.includes('volatility is low') || queryLower.includes('low demand volatility')) {
    demandVolatility = 0.15;
  }

  let portCongestion = environmentState.portCongestionLevel ?? 0.55;
  if (queryLower.includes('port congestion is low') || queryLower.includes('congestion is low') || queryLower.includes('low port congestion') || queryLower.includes('congestion is calm')) {
    portCongestion = 0.20;
  } else if (queryLower.includes('port congestion is high') || queryLower.includes('congestion is high') || queryLower.includes('high port congestion')) {
    portCongestion = 0.55;
  }

  const invDays = Math.max(0.5, Math.round((environmentState.inventoryUnits / (environmentState.productionCapacity || 40)) * 10) / 10);
  const weatherDisruption = queryLower.includes('storm') || queryLower.includes('weather') ? true : environmentState.weatherDisruption ?? false;
  const cashReserves = environmentState.cash ?? 50000;

  // Inferred Task Family
  let taskFamily = 'SUPPLIER_SELECTION';
  if (queryLower.includes('cash') || queryLower.includes('reserve') || queryLower.includes('resource') || queryLower.includes('allocate')) {
    taskFamily = 'RESOURCE_ALLOCATION';
  } else if (queryLower.includes('spot') || queryLower.includes('forward') || queryLower.includes('contract')) {
    taskFamily = 'SEQUENTIAL_DECISION';
  }

  // 2. Define Available Action Candidates
  interface ActionSpec {
    id: string;
    label: string;
    targetEntity: string;
    baseDelay: number;
    baseCost: number;
  }

  const actionSpecs: ActionSpec[] =
    taskFamily === 'RESOURCE_ALLOCATION'
      ? [
          { id: 'LEAN_CASH', label: 'Lean Cash Reserves (Low Overhead)', targetEntity: 'Lean Cash Reserves', baseDelay: 0.0, baseCost: 200 },
          { id: 'BALANCED_HEDGE', label: 'Balanced Hedging Strategy (Safety Stock)', targetEntity: 'Balanced Hedging', baseDelay: 0.0, baseCost: 650 },
          { id: 'MAX_PROTECTION', label: 'Maximum Protection Buffer', targetEntity: 'Protection Buffer', baseDelay: 0.0, baseCost: 1300 },
        ]
      : taskFamily === 'SEQUENTIAL_DECISION'
      ? [
          { id: 'SPOT_MARKET', label: 'Spot Market Procurement', targetEntity: 'Spot Market', baseDelay: 1.0, baseCost: 350 },
          { id: 'FORWARD_PREBOOK', label: 'Pre-book Forward Contract', targetEntity: 'Forward Contract', baseDelay: 1.0, baseCost: 1650 },
        ]
      : queryLower.includes('supplier beta') || queryLower.includes('choose between supplier alpha and supplier beta')
      ? [
          { id: 'SUPPLIER_ALPHA', label: 'Supplier Alpha (Direct Bulk)', targetEntity: 'Supplier Alpha', baseDelay: 2.0, baseCost: 1200 },
          { id: 'SUPPLIER_BETA', label: 'Supplier Beta (Standard Reliable)', targetEntity: 'Supplier Beta', baseDelay: 2.0, baseCost: 1500 },
          { id: 'DUAL_SOURCING', label: 'Dual Sourcing (50% Alpha, 50% Beta)', targetEntity: 'Dual Sourcing', baseDelay: 2.0, baseCost: 1350 },
        ]
      : [
          { id: 'STANDARD_MARITIME', label: 'Standard Maritime Freight (Supplier Alpha)', targetEntity: 'Supplier Alpha', baseDelay: 2.0, baseCost: 1200 },
          { id: 'EXPRESS_AIR', label: 'Express Air Freight (Fast Transit)', targetEntity: 'Express Air Freight', baseDelay: 1.0, baseCost: 2400 },
          { id: 'DUAL_SOURCING', label: 'Dual Sourcing (50% Maritime, 50% Air)', targetEntity: 'Dual Sourcing', baseDelay: 1.4, baseCost: 1450 },
        ];

  // 3. STEP A: Evaluate Baseline Prior (Memory OFF)
  const baselineCandidateScores: ActionCandidateScore[] = actionSpecs.map((spec) => {
    let penalty = 0;
    if (spec.baseDelay > invDays) {
      penalty = (spec.baseDelay - invDays) * 1500;
    }
    const expectedUtility = 10000 - spec.baseCost - penalty;
    return {
      actionId: spec.id,
      label: spec.label,
      estimatedDelay: spec.baseDelay,
      estimatedCost: spec.baseCost,
      stockoutPenalty: penalty,
      expectedUtility,
      confidence: 0.65,
      wasInfluenced: false,
    };
  });

  const sortedBaseline = [...baselineCandidateScores].sort((a, b) => b.expectedUtility - a.expectedUtility);
  const baselineWinner = sortedBaseline[0];

  // 4. STEP B: Unified Memory Retrieval from ExperienceStore (Single Source of Truth)
  const retrievedExperiences = experienceStore.retrieveRelevantExperiences({
    taskFamily,
    contextFeatures: {
      portCongestion,
      inventoryDays: invDays,
      demandVolatility,
      weatherDisruption,
    },
    limit: 6,
    minConfidence: 0.2,
  });

  // 5. STEP C: Evaluate Memory ON (Experience-Informed Prediction & Utility Adjustment)
  const retrievedMemories: RetrievedMemoryInfo[] = [];

  const experienceCandidateScores: ActionCandidateScore[] = actionSpecs.map((spec) => {
    // Accumulate evidence from all relevant retrieved experiences
    const evidence = accumulateEvidenceForAction(spec.id, spec.targetEntity, retrievedExperiences, {
      demandVolatility,
      portCongestion,
      inventoryDays: invDays,
      weatherDisruption,
    });

    let adjustedDelay = spec.baseDelay + evidence.netDelayAdjustment;
    let adjustedCost = spec.baseCost + evidence.netCostAdjustment;
    let adjustedPenalty = 0;
    let wasInfluenced = false;
    let influenceMagnitude = 0;
    let affectedVariable = 'none';

    // Calculate stockout penalty if delay exceeds warehouse inventory buffer
    if (adjustedDelay > invDays) {
      adjustedPenalty = (adjustedDelay - invDays) * 1800;
    }

    if (Math.abs(evidence.netDelayAdjustment) > 0.3 || evidence.netCostAdjustment !== 0 || adjustedPenalty > 0) {
      wasInfluenced = true;
      influenceMagnitude = Math.abs(evidence.netDelayAdjustment) > 0 ? evidence.netDelayAdjustment : evidence.netCostAdjustment;
      affectedVariable = Math.abs(evidence.netDelayAdjustment) > 0 ? 'estimatedDelay' : 'estimatedCost';
    }

    const expectedUtility = 10000 - adjustedCost - adjustedPenalty;

    return {
      actionId: spec.id,
      label: spec.label,
      estimatedDelay: Math.round(adjustedDelay * 10) / 10,
      estimatedCost: Math.round(adjustedCost),
      stockoutPenalty: Math.round(adjustedPenalty),
      expectedUtility: Math.round(expectedUtility),
      confidence: evidence.effectiveConfidence,
      wasInfluenced,
      influenceMagnitude,
      affectedVariable,
      evidenceSummary: evidence.evidenceSummary,
    };
  });

  // Map retrieved experiences into transparent retrieved memory cards
  retrievedExperiences.forEach((exp) => {
    // Determine whether this record actually changed predictions for any candidate
    const matchedCandidate = experienceCandidateScores.find(
      (c) =>
        (exp.targetEntity && c.label.toLowerCase().includes(exp.targetEntity.toLowerCase())) ||
        (exp.selectedAction?.targetEntity && c.label.toLowerCase().includes(exp.selectedAction.targetEntity.toLowerCase()))
    );

    const influenced = matchedCandidate ? matchedCandidate.wasInfluenced : false;
    const influenceMagnitude = matchedCandidate?.influenceMagnitude ?? 0;
    const affectedVariable = matchedCandidate?.affectedVariable ?? 'estimatedDelay';

    retrievedMemories.push({
      id: exp.experienceId,
      title: exp.lesson?.observedFact || exp.errorCause?.observedFact || `Observation #${exp.taskId}`,
      lessonSnippet: exp.lesson?.rule || exp.lesson?.interpretation || exp.errorCause?.interpretation || 'Empirical execution record',
      relevanceScore: exp.relevanceScore ?? 0.85,
      confidence: exp.lesson?.confidence || exp.confidence || 0.75,
      source: exp.source === 'USER_TAUGHT' ? 'USER_TAUGHT' : 'EXPERIENCE_STORE',
      memoryType: exp.memoryType,
      evidenceStatus: exp.evidenceStatus,
      influencedPrediction: influenced,
      influenceMagnitude,
      affectedVariable,
      supportingCount: exp.supportingEvidenceCount ?? (exp.success ? 0 : 1),
      contradictingCount: exp.contradictingEvidenceCount ?? (exp.success ? 1 : 0),
    });
  });

  const sortedExperience = [...experienceCandidateScores].sort((a, b) => b.expectedUtility - a.expectedUtility);
  const experienceWinner = sortedExperience[0];

  // 6. Compute Causal Delta
  const decisionChanged = baselineWinner.actionId !== experienceWinner.actionId;
  const delayDeltaDays = Math.round((experienceWinner.estimatedDelay - baselineWinner.estimatedDelay) * 10) / 10;
  const costDelta = experienceWinner.estimatedCost - baselineWinner.estimatedCost;
  const utilityDelta = experienceWinner.expectedUtility - baselineWinner.expectedUtility;
  const confidenceDelta = Math.round((experienceWinner.confidence - baselineWinner.confidence) * 100) / 100;

  // 7. Format Alternatives and Rejection Reasons
  const alternativesConsidered = sortedExperience.slice(1).map((alt) => {
    let whyRejected = '';
    if (alt.stockoutPenalty > 0) {
      whyRejected = `Projected ${alt.estimatedDelay}d delay exceeds ${invDays}d warehouse buffer, incurring $${alt.stockoutPenalty.toLocaleString()} in stockout penalties.`;
    } else if (alt.estimatedCost > experienceWinner.estimatedCost) {
      whyRejected = `Higher direct expenditure ($${alt.estimatedCost.toLocaleString()} vs $${experienceWinner.estimatedCost.toLocaleString()}) yields lower net utility score.`;
    } else {
      whyRejected = `Expected utility (${alt.expectedUtility}) is lower than the recommended option (${experienceWinner.expectedUtility}).`;
    }
    return {
      actionName: alt.label,
      projectedUtility: alt.expectedUtility,
      whyRejected,
    };
  });

  // 8. Build Explanation Reasoning
  let reasoningSummary = '';
  if (retrievedMemories.length === 0) {
    reasoningSummary = `No relevant prior experiences were found in memory. Recommending ${experienceWinner.label} based purely on baseline parameters (estimated delay: ${experienceWinner.estimatedDelay}d, utility: ${experienceWinner.expectedUtility}).`;
  } else if (decisionChanged) {
    reasoningSummary = `Prior experience causally changed the decision from "${baselineWinner.label}" (utility dropped from ${baselineWinner.expectedUtility} to ${experienceCandidateScores.find((s) => s.actionId === baselineWinner.actionId)?.expectedUtility || 'lower'}) to "${experienceWinner.label}" (expected utility ${experienceWinner.expectedUtility}). Retrieved memory evidence: "${retrievedMemories[0].lessonSnippet}".`;
  } else {
    reasoningSummary = `Retrieved memory confirmed that ${experienceWinner.label} is the optimal choice under current conditions (expected utility: ${experienceWinner.expectedUtility}, confidence: ${Math.round(experienceWinner.confidence * 100)}%).`;
  }

  // 9. Build Complete Explanation Data for Modal
  const isCongested = portCongestion > 0.4;
  const explanationData: DecisionExplanationData = {
    queryTitle: query,
    chosenAction: experienceWinner.label,
    confidence: experienceWinner.confidence,
    currentSituation: {
      contextSummary: `Operational Context: Port congestion is ${(portCongestion * 100).toFixed(0)}%, inventory covers ${invDays} days of demand, demand volatility is ${(demandVolatility * 100).toFixed(0)}%, and available cash is $${cashReserves.toLocaleString()}.`,
      keyVariables: [
        {
          name: 'Port Congestion',
          value: `${(portCongestion * 100).toFixed(0)}%`,
          status: isCongested ? 'alert' : 'normal',
        },
        {
          name: 'Inventory Buffer',
          value: `${invDays} days`,
          status: invDays <= 2.0 ? 'warning' : 'normal',
        },
        {
          name: 'Demand Volatility',
          value: demandVolatility > 0.3 ? 'HIGH' : 'LOW',
          status: demandVolatility > 0.3 ? 'warning' : 'normal',
        },
        {
          name: 'Cash Reserves',
          value: `$${cashReserves.toLocaleString()}`,
          status: 'normal',
        },
      ],
    },
    relevantMemories: retrievedMemories.map((m) => ({
      title: m.title,
      relevanceScore: m.relevanceScore,
      influencedDecision: m.influencedPrediction,
      lessonSnippet: `${m.lessonSnippet} [Influence: ${m.influencedPrediction ? (m.influenceMagnitude && m.influenceMagnitude > 0 ? `+${m.influenceMagnitude}d` : 'Adjusted') : '0.0'}]`,
    })),
    lessonsApplied: retrievedMemories
      .filter((m) => m.influencedPrediction)
      .map((m) => m.lessonSnippet),
    prediction: {
      expectedCostOrDelay: `Expected Delay: ${experienceWinner.estimatedDelay}d | Direct Cost: $${experienceWinner.estimatedCost.toLocaleString()}`,
      expectedNetUtility: experienceWinner.expectedUtility,
      projectedOutcome:
        experienceWinner.stockoutPenalty === 0
          ? `Maintains continuity without stockouts. Net utility score: +${experienceWinner.expectedUtility.toLocaleString()}.`
          : `Stockout incurred (${experienceWinner.estimatedDelay}d vs ${invDays}d buffer); penalty: $${experienceWinner.stockoutPenalty.toLocaleString()}.`,
    },
    alternativesConsidered,
    finalDecisionReasoning: reasoningSummary,
  };

  return {
    traceId,
    timestamp,
    queryTitle: query,
    taskFamily,
    context: {
      inventoryDays: invDays,
      portCongestion,
      demandVolatility,
      weatherDisruption,
      cashReserves,
    },
    retrievedMemories,
    baseline: {
      selectedActionId: baselineWinner.actionId,
      selectedActionLabel: baselineWinner.label,
      confidence: baselineWinner.confidence,
      expectedDelay: baselineWinner.estimatedDelay,
      expectedCost: baselineWinner.estimatedCost,
      expectedUtility: baselineWinner.expectedUtility,
      candidateScores: baselineCandidateScores,
    },
    experienceInformed: {
      selectedActionId: experienceWinner.actionId,
      selectedActionLabel: experienceWinner.label,
      confidence: experienceWinner.confidence,
      expectedDelay: experienceWinner.estimatedDelay,
      expectedCost: experienceWinner.estimatedCost,
      expectedUtility: experienceWinner.expectedUtility,
      candidateScores: experienceCandidateScores,
    },
    causalDelta: {
      delayDeltaDays,
      costDelta,
      utilityDelta,
      confidenceDelta,
      decisionChanged,
    },
    explanationData,
  };
}

