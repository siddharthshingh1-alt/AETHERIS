import { 
  CognitivePhase, 
  CognitiveCycleTrace, 
  EnvironmentState,
  SelfImprovementExperiment 
} from '../types/cognitive';
import { WorldModelState, createInitialWorldModel } from './worldModel';
import { MemorySystemState, createInitialMemorySystem } from './memory';
import { createInitialEnvironment, executeActionInEnvironment } from './environment';
import { generatePredictions } from './prediction';
import { synthesizePlan, PlanRecord } from './planning';
import { calculatePredictionError, executeMultiLevelLearning } from './learning';
import { runMetacognitiveIntrospection } from './metacognition';
import { createInitialExperiments } from './selfImprovement';

export interface CognitiveSystemState {
  currentCycle: number;
  currentPhase: CognitivePhase;
  isRunningAutonomous: boolean;
  cycleIntervalMs: number;
  worldModel: WorldModelState;
  memorySystem: MemorySystemState;
  environment: EnvironmentState;
  experiments: SelfImprovementExperiment[];
  traces: CognitiveCycleTrace[];
  activeTrace: CognitiveCycleTrace | null;
  overallAccuracyHistory: Array<{ cycle: number; accuracy: number; error: number; brier: number }>;
}

export function createInitialCognitiveSystem(): CognitiveSystemState {
  const worldModel = createInitialWorldModel();
  const memorySystem = createInitialMemorySystem();
  const environment = createInitialEnvironment();
  const experiments = createInitialExperiments();

  return {
    currentCycle: 1,
    currentPhase: 'IDLE',
    isRunningAutonomous: false,
    cycleIntervalMs: 1500,
    worldModel,
    memorySystem,
    environment,
    experiments,
    traces: [],
    activeTrace: null,
    overallAccuracyHistory: [
      { cycle: 0, accuracy: 0.70, error: 0.30, brier: 0.15 }
    ]
  };
}

export function executeFullCognitiveCycle(state: CognitiveSystemState): CognitiveSystemState {
  const cycle = state.currentCycle;
  const env = { ...state.environment };
  const world = { ...state.worldModel };
  const mem = { ...state.memorySystem };

  // 1. OBSERVE & PERCEIVE
  const bufferDays = env.inventoryUnits / (env.productionCapacity || 40);
  const perception: string[] = [
    `Warehouse Inventory: ${env.inventoryUnits} units (~${bufferDays.toFixed(1)} days runway)`,
    `Liquid Capital: $${env.cash.toLocaleString()}`,
    `Market Volatility: ${env.marketVolatility} | Port Congestion Index: ${env.portCongestionLevel.toFixed(2)}`,
    env.supplierStrike ? 'CRITICAL: Supplier Alpha union strike active' : 'Supplier Alpha operational',
    env.weatherDisruption ? 'Severe maritime weather disruption reported' : 'Sea transit corridors clear'
  ];

  // 2. WORKING MEMORY FOCUS
  mem.workingMemory.shortTermObservations = perception;
  mem.workingMemory.focusedEntityIds = ['supplier_alpha', 'supplier_beta', 'production_hub', 'liquid_capital'];

  // 3. RETRIEVE MEMORIES
  const retrievedMemories = mem.semanticMemory
    .filter(r => r.confidence > 0.8)
    .map(r => `[${r.domain}] ${r.invariantRule}`);

  // 4. PLAN & REASON (Counterfactual Simulation)
  const orderBatchSize = bufferDays < 2.5 ? 120 : (env.marketVolatility === 'HIGH' ? 140 : 100);
  const plan: PlanRecord = synthesizePlan(world, env, orderBatchSize);

  // 5. PREDICT (First-Class Probabilistic Forecaster)
  const prediction = generatePredictions(plan.selectedAction, world, env, 3);

  // 6. ACT IN SANDBOX ENVIRONMENT
  const { updatedEnv, outcome } = executeActionInEnvironment(plan.selectedAction, env);

  // 7. OBSERVE CONSEQUENCE & CALCULATE ERROR
  const error = calculatePredictionError(prediction, outcome);

  // 8. MULTI-LEVEL LEARNING (Levels 1-6)
  const { 
    updatedWorldModel, 
    updatedMemorySystem, 
    learningEvents, 
    newEpisode 
  } = executeMultiLevelLearning(cycle, plan.selectedAction, prediction, outcome, error, world, mem);

  // 9. METACOGNITION
  const metacognition = runMetacognitiveIntrospection(cycle, plan.selectedAction, prediction, outcome, error, updatedWorldModel);

  // 10. SELF-IMPROVEMENT PROPOSAL (if high error detected or periodic interval)
  let selfImprovementProposal: SelfImprovementExperiment | undefined;
  if (error.overallNormalizedError > 0.25 && cycle % 2 === 0) {
    selfImprovementProposal = {
      id: `exp_auto_${cycle}_${Date.now()}`,
      version: `v1.${cycle}.0-dynamic-calib`,
      hypothesis: `Adjusting learning gradient damping for ${plan.selectedAction.targetEntityId} will decrease surprise variance.`,
      weaknessAddressed: error.dominantCause,
      componentTarget: 'CAUSAL_LEARNING',
      baselineScore: Math.max(0.60, 1 - error.overallNormalizedError),
      candidateScore: Math.min(0.96, (1 - error.overallNormalizedError) + 0.18),
      status: 'PROPOSED',
      benchmarkMetrics: {
        predictionAccuracy: 0.91,
        calibrationBrier: 0.05,
        adaptationLatencyCycles: 1,
        resourceCost: 1.02
      }
    };
  }

  // Construct complete cognitive cycle trace
  const trace: CognitiveCycleTrace = {
    cycleNumber: cycle,
    timestamp: new Date().toISOString(),
    phase: 'SELF_IMPROVEMENT',
    perception,
    workingMemorySnapshot: {
      activeGoal: mem.workingMemory.activeGoal,
      hypotheses: [...mem.workingMemory.activeHypotheses],
      focusedEntities: [...mem.workingMemory.focusedEntityIds]
    },
    worldModelUpdates: learningEvents.map(e => `[${e.levelName}] ${e.description}`),
    retrievedMemories,
    prediction,
    plan: {
      goal: plan.goal,
      subgoals: plan.subgoals,
      selectedAction: plan.selectedAction,
      alternativeOptions: plan.alternativeOptions
    },
    actionExecuted: plan.selectedAction,
    actualObservation: outcome,
    predictionError: error,
    learningEvents,
    metacognition,
    selfImprovementProposal
  };

  // Compute overall accuracy metric for learning curve
  const currentAccuracy = Math.round((1 - error.overallNormalizedError) * 100) / 100;
  const newAccuracyHistory = [
    ...state.overallAccuracyHistory,
    {
      cycle,
      accuracy: currentAccuracy,
      error: error.overallNormalizedError,
      brier: error.brierScoreContribution
    }
  ];

  return {
    ...state,
    currentCycle: cycle + 1,
    currentPhase: 'IDLE',
    worldModel: updatedWorldModel,
    memorySystem: updatedMemorySystem,
    environment: updatedEnv,
    experiments: selfImprovementProposal 
      ? [selfImprovementProposal, ...state.experiments.slice(0, 8)] 
      : state.experiments,
    traces: [trace, ...state.traces.slice(0, 30)],
    activeTrace: trace,
    overallAccuracyHistory: newAccuracyHistory
  };
}
