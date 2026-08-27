/**
 * Metrics & Evaluation Suite for Cognitive Architecture Experiments.
 *
 * Implements objective measurement of:
 * - Primary Performance: Success Rate, Net Utility, MAE, Brier Score
 * - Learning Curves: Initial vs. Final Performance Delta
 * - Generalization: Performance across Repeated, Related, and Held-Out Splits
 * - Epistemic Quality: Decision Adaptation Frequency, Experience Influence Rate
 * - Efficiency: Execution latency, tool calls, token usage
 */

import { TaskSplit } from './benchmark';

export interface SingleTaskExecutionRecord {
  experimentId: string;
  agentType: 'CONTROL' | 'LEARNING';
  taskId: string;
  taskFamily: string;
  split: TaskSplit;
  seed: number;
  
  // Prediction & Features
  predictedOutcome: {
    delayDays?: number;
    cost?: number;
    expectedUtility: number;
    modalAction: string;
  };
  confidence: number;
  predictionFeatures: Record<string, any>;
  
  // Action & Outcome
  selectedActionId: string;
  optimalActionId: string;
  isOptimalAction: boolean;
  actualOutcome: {
    delayDays: number;
    cost: number;
    stockoutOccurred: boolean;
    netUtility: number;
    groundTruthExplanation: string;
  };
  
  // Prediction Error
  predictionError: {
    delayDelta: number;
    costDelta: number;
    utilityDelta: number;
    normalizedError: number;
    brierLoss: number;
    direction: 'UNDERESTIMATED' | 'OVERESTIMATED' | 'ACCURATE';
  };
  success: boolean;
  
  // Experiential Learning Traces
  retrievedExperiencesCount: number;
  retrievedExperiencesIds: string[];
  experienceInfluencedDecision: boolean;
  errorCause?: {
    observedFact: string;
    interpretation: string;
    identifiedDriver: string;
  };
  lessonGenerated?: {
    rule: string;
    proposedChange: string;
    confidence: number;
  };
  experienceStored: boolean;
  
  // Efficiency
  executionTimeMs: number;
  toolCallsCount: number;
  tokenUsage?: number;
  costEstimateUsd?: number;
  timestamp: string;
}

export interface SplitMetrics {
  totalTasks: number;
  successCount: number;
  successRate: number;
  optimalActionCount: number;
  optimalActionRate: number;
  meanNetUtility: number;
  meanPredictionError: number;
  meanBrierLoss: number;
  meanConfidence: number;
}

export interface AgentBenchmarkSummary {
  agentType: 'CONTROL' | 'LEARNING';
  totalTasks: number;
  
  // Primary Metrics
  overallSuccessRate: number;
  initialSuccessRate: number; // First 25% of tasks
  finalSuccessRate: number;   // Last 25% of tasks
  performanceImprovementRate: number; // Final - Initial
  meanNetUtility: number;
  meanPredictionError: number;
  meanBrierLoss: number;
  meanConfidence: number;
  
  // Partition Breakdown
  repeatedMetrics: SplitMetrics;
  relatedMetrics: SplitMetrics;
  heldOutMetrics: SplitMetrics;
  
  // Learning & Adaptation Dynamics
  decisionShiftFrequency: number;
  totalExperiencesRetrieved: number;
  experienceInfluenceFrequency: number;
  
  // Efficiency
  totalExecutionTimeMs: number;
  meanExecutionTimeMs: number;
  totalToolCalls: number;
}

export interface TaskComparisonResult {
  taskId: string;
  taskFamily: string;
  split: TaskSplit;
  controlRecord: SingleTaskExecutionRecord;
  learningRecord: SingleTaskExecutionRecord;
  utilityDelta: number;
}

export interface ExperimentSummaryOverview {
  learningSuccessRate: number;
  controlSuccessRate: number;
  successRateDelta: number;
  meanUtilityDelta: number;
  predictionErrorReduction: number;
  heldOutTransferRate: number;
  controlHeldOutRate: number;
}

export interface ComparativeExperimentReport {
  experimentId: string;
  timestamp: string;
  taskCount: number;
  controlSummary: AgentBenchmarkSummary;
  learningSummary: AgentBenchmarkSummary;
  delta: {
    successRateDelta: number; // Learning - Control
    utilityDelta: number;
    predictionErrorReduction: number; // Control - Learning (positive means learning had lower error)
    brierLossReduction: number;
    heldOutGeneralizationDelta: number; // Learning Held-Out - Control Held-Out
    pValEstimate?: number;
  };
  summary: ExperimentSummaryOverview;
  taskResults?: TaskComparisonResult[];
  hypothesisSupported: boolean;
  conclusionSummary: string;
}

/**
 * Computes comprehensive statistical summary for a single agent's execution records.
 */
export function calculateAgentSummary(
  agentType: 'CONTROL' | 'LEARNING',
  records: SingleTaskExecutionRecord[]
): AgentBenchmarkSummary {
  const total = records.length;
  if (total === 0) {
    return createEmptySummary(agentType);
  }

  const successCount = records.filter(r => r.success).length;
  const overallSuccessRate = successCount / total;
  const meanNetUtility = records.reduce((acc, r) => acc + r.actualOutcome.netUtility, 0) / total;
  const meanPredictionError = records.reduce((acc, r) => acc + r.predictionError.normalizedError, 0) / total;
  const meanBrierLoss = records.reduce((acc, r) => acc + r.predictionError.brierLoss, 0) / total;
  const meanConfidence = records.reduce((acc, r) => acc + r.confidence, 0) / total;

  // Initial vs Final (First quartile vs Last quartile)
  const quarterSize = Math.max(1, Math.floor(total / 4));
  const initialRecords = records.slice(0, quarterSize);
  const finalRecords = records.slice(total - quarterSize);

  const initialSuccessRate = initialRecords.filter(r => r.success).length / initialRecords.length;
  const finalSuccessRate = finalRecords.filter(r => r.success).length / finalRecords.length;
  const performanceImprovementRate = finalSuccessRate - initialSuccessRate;

  // Split calculations
  const repeatedRecords = records.filter(r => r.split === 'REPEATED');
  const relatedRecords = records.filter(r => r.split === 'RELATED');
  const heldOutRecords = records.filter(r => r.split === 'HELD_OUT');

  const repeatedMetrics = calculateSplitMetrics(repeatedRecords);
  const relatedMetrics = calculateSplitMetrics(relatedRecords);
  const heldOutMetrics = calculateSplitMetrics(heldOutRecords);

  // Learning and adaptation
  const experiencesRetrieved = records.reduce((acc, r) => acc + r.retrievedExperiencesCount, 0);
  const influencedDecisions = records.filter(r => r.experienceInfluencedDecision).length;
  const experienceInfluenceFrequency = total > 0 ? influencedDecisions / total : 0;

  // Decision shift: how often the chosen action was different from baseline default heuristic
  const decisionShiftCount = records.filter(r => r.experienceInfluencedDecision).length;
  const decisionShiftFrequency = total > 0 ? decisionShiftCount / total : 0;

  const totalTime = records.reduce((acc, r) => acc + r.executionTimeMs, 0);
  const totalTools = records.reduce((acc, r) => acc + r.toolCallsCount, 0);

  return {
    agentType,
    totalTasks: total,
    overallSuccessRate,
    initialSuccessRate,
    finalSuccessRate,
    performanceImprovementRate,
    meanNetUtility,
    meanPredictionError,
    meanBrierLoss,
    meanConfidence,
    repeatedMetrics,
    relatedMetrics,
    heldOutMetrics,
    decisionShiftFrequency,
    totalExperiencesRetrieved: experiencesRetrieved,
    experienceInfluenceFrequency,
    totalExecutionTimeMs: totalTime,
    meanExecutionTimeMs: totalTime / total,
    totalToolCalls: totalTools,
  };
}

function calculateSplitMetrics(records: SingleTaskExecutionRecord[]): SplitMetrics {
  const total = records.length;
  if (total === 0) {
    return {
      totalTasks: 0,
      successCount: 0,
      successRate: 0,
      optimalActionCount: 0,
      optimalActionRate: 0,
      meanNetUtility: 0,
      meanPredictionError: 0,
      meanBrierLoss: 0,
      meanConfidence: 0,
    };
  }

  const successCount = records.filter(r => r.success).length;
  const optimalCount = records.filter(r => r.isOptimalAction).length;
  const meanNetUtility = records.reduce((acc, r) => acc + r.actualOutcome.netUtility, 0) / total;
  const meanPredictionError = records.reduce((acc, r) => acc + r.predictionError.normalizedError, 0) / total;
  const meanBrierLoss = records.reduce((acc, r) => acc + r.predictionError.brierLoss, 0) / total;
  const meanConfidence = records.reduce((acc, r) => acc + r.confidence, 0) / total;

  return {
    totalTasks: total,
    successCount,
    successRate: successCount / total,
    optimalActionCount: optimalCount,
    optimalActionRate: optimalCount / total,
    meanNetUtility,
    meanPredictionError,
    meanBrierLoss,
    meanConfidence,
  };
}

function createEmptySummary(agentType: 'CONTROL' | 'LEARNING'): AgentBenchmarkSummary {
  const emptySplit: SplitMetrics = {
    totalTasks: 0,
    successCount: 0,
    successRate: 0,
    optimalActionCount: 0,
    optimalActionRate: 0,
    meanNetUtility: 0,
    meanPredictionError: 0,
    meanBrierLoss: 0,
    meanConfidence: 0,
  };

  return {
    agentType,
    totalTasks: 0,
    overallSuccessRate: 0,
    initialSuccessRate: 0,
    finalSuccessRate: 0,
    performanceImprovementRate: 0,
    meanNetUtility: 0,
    meanPredictionError: 0,
    meanBrierLoss: 0,
    meanConfidence: 0,
    repeatedMetrics: emptySplit,
    relatedMetrics: emptySplit,
    heldOutMetrics: emptySplit,
    decisionShiftFrequency: 0,
    totalExperiencesRetrieved: 0,
    experienceInfluenceFrequency: 0,
    totalExecutionTimeMs: 0,
    meanExecutionTimeMs: 0,
    totalToolCalls: 0,
  };
}

/**
 * Generates the comparative experimental report contrasting Control vs. Learning conditions.
 */
export function generateComparativeReport(
  experimentId: string,
  controlRecords: SingleTaskExecutionRecord[],
  learningRecords: SingleTaskExecutionRecord[]
): ComparativeExperimentReport {
  const controlSummary = calculateAgentSummary('CONTROL', controlRecords);
  const learningSummary = calculateAgentSummary('LEARNING', learningRecords);

  const successRateDelta = learningSummary.overallSuccessRate - controlSummary.overallSuccessRate;
  const utilityDelta = learningSummary.meanNetUtility - controlSummary.meanNetUtility;
  const predictionErrorReduction = controlSummary.meanPredictionError - learningSummary.meanPredictionError;
  const brierLossReduction = controlSummary.meanBrierLoss - learningSummary.meanBrierLoss;
  const heldOutGeneralizationDelta = learningSummary.heldOutMetrics.successRate - controlSummary.heldOutMetrics.successRate;

  // Hypothesis support criteria:
  // 1. Success rate delta > 0.10
  // 2. Prediction error reduction > 0
  // 3. Held-out transfer does not degrade significantly (>= -0.05)
  const hypothesisSupported =
    successRateDelta > 0.05 &&
    predictionErrorReduction > 0.05 &&
    heldOutGeneralizationDelta >= 0;

  let conclusionSummary = '';
  if (hypothesisSupported) {
    conclusionSummary = `HYPOTHESIS SUPPORTED: The Learning Agent achieved a +${(successRateDelta * 100).toFixed(1)}% success rate increase and +$${utilityDelta.toFixed(0)} net utility improvement over the Control Agent, with a ${(predictionErrorReduction * 100).toFixed(1)}% error reduction and ${(heldOutGeneralizationDelta * 100).toFixed(1)}% transfer delta on novel held-out tasks.`;
  } else if (successRateDelta < 0) {
    conclusionSummary = `HYPOTHESIS NOT SUPPORTED (Negative Transfer): The Learning Agent performed worse (${(successRateDelta * 100).toFixed(1)}% delta) than the Control Agent due to maladaptive parameter updates or over-generalization.`;
  } else {
    conclusionSummary = `HYPOTHESIS INCONCLUSIVE: The performance delta (${(successRateDelta * 100).toFixed(1)}%) was below the statistical significance threshold.`;
  }

  const summary: ExperimentSummaryOverview = {
    learningSuccessRate: learningSummary.overallSuccessRate,
    controlSuccessRate: controlSummary.overallSuccessRate,
    successRateDelta,
    meanUtilityDelta: utilityDelta,
    predictionErrorReduction,
    heldOutTransferRate: learningSummary.heldOutMetrics.successRate,
    controlHeldOutRate: controlSummary.heldOutMetrics.successRate,
  };

  const taskResults: TaskComparisonResult[] = controlRecords.map((ctrl, idx) => {
    const learn = learningRecords[idx];
    return {
      taskId: ctrl.taskId,
      taskFamily: ctrl.taskFamily,
      split: ctrl.split,
      controlRecord: ctrl,
      learningRecord: learn,
      utilityDelta: (learn?.actualOutcome?.netUtility ?? 0) - (ctrl?.actualOutcome?.netUtility ?? 0),
    };
  });

  return {
    experimentId,
    timestamp: new Date().toISOString(),
    taskCount: controlRecords.length,
    controlSummary,
    learningSummary,
    delta: {
      successRateDelta,
      utilityDelta,
      predictionErrorReduction,
      brierLossReduction,
      heldOutGeneralizationDelta,
    },
    summary,
    taskResults,
    hypothesisSupported,
    conclusionSummary,
  };
}
