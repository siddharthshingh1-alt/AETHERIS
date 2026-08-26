import { 
  EpisodicRecord, 
  SemanticRule, 
  ProceduralSkill, 
  MetaMemoryEntry,
  ActionRecord,
  PredictionOutcome,
  ActualOutcome,
  PredictionErrorDelta
} from '../types/cognitive';

export interface WorkingMemoryState {
  activeGoal: string;
  activeSubgoals: string[];
  focusedEntityIds: string[];
  activeHypotheses: string[];
  shortTermObservations: string[];
  attentionBudgetUsed: number;
}

export interface MemorySystemState {
  workingMemory: WorkingMemoryState;
  episodicMemory: EpisodicRecord[];
  semanticMemory: SemanticRule[];
  proceduralMemory: ProceduralSkill[];
  metaMemory: MetaMemoryEntry[];
  totalConsolidatedEpisodes: number;
}

export function createInitialMemorySystem(): MemorySystemState {
  const workingMemory: WorkingMemoryState = {
    activeGoal: 'Maintain seamless factory assembly throughput while minimizing overall procurement and delay risk',
    activeSubgoals: [
      'Monitor buffer inventory and upcoming burn schedule',
      'Select lowest-total-cost procurement pathway conditioned on reliability',
      'Minimize probability of catastrophic line stoppage'
    ],
    focusedEntityIds: ['supplier_alpha', 'supplier_beta', 'production_hub', 'liquid_capital'],
    activeHypotheses: [
      'Supplier Alpha cost advantage may be neutralized by surge-induced delivery delays'
    ],
    shortTermObservations: [
      'Inventory currently at 120 units; 3-day buffer available.'
    ],
    attentionBudgetUsed: 0.35
  };

  const episodicMemory: EpisodicRecord[] = [
    {
      id: 'ep_001',
      cycle: -1,
      timestamp: '2026-08-20T10:00:00Z',
      context: 'Historical baseline run: Standard baseline bulk order placed with Supplier Alpha for 60 units.',
      actionTaken: {
        id: 'act_prev_1',
        type: 'ORDER_SUPPLIER',
        title: 'Order 60 units from Supplier Alpha',
        targetEntityId: 'supplier_alpha',
        parameters: { units: 60, unitCost: 45 },
        cost: 2700,
        riskLevel: 'LOW',
        reversible: false,
        rationale: 'Low volume standard order within baseline capacity threshold.'
      },
      predictedOutcome: {
        horizonSteps: 3,
        candidateFutures: [],
        chosenTrajectory: {
          step: 1,
          stateDescription: 'Arrival within expected 3 days with zero stockout',
          probability: 0.85,
          confidenceInterval: [2.5, 3.5],
          expectedMetrics: { delayDays: 0, cost: 2700, inventoryLevel: 140, cashDelta: -2700, customerSatisfaction: 0.95 },
          uncertaintyFactors: ['Slight port friction']
        },
        expectedDelayDays: 0,
        expectedCost: 2700,
        confidence: 0.85,
        reasoningSummary: 'Order below supplier volume threshold.'
      },
      actualOutcome: {
        actionId: 'act_prev_1',
        actualDelayDays: 0.5,
        actualCost: 2700,
        actualInventoryDelta: 60,
        actualCashDelta: -2700,
        actualCustomerSatisfaction: 0.94,
        status: 'SUCCESS',
        notes: 'Delivered in 3.5 days without significant line disruption.'
      },
      predictionError: {
        delayErrorDays: 0.5,
        costError: 0,
        overallNormalizedError: 0.08,
        direction: 'UNDERESTIMATED',
        dominantCause: 'Minor logistics customs clearance',
        brierScoreContribution: 0.04
      },
      surpriseScore: 0.12,
      keyInsight: 'Standard small orders from Alpha deliver reasonably close to nominal schedule.',
      consolidated: true
    }
  ];

  const semanticMemory: SemanticRule[] = [
    {
      id: 'sem_001',
      domain: 'Procurement Dynamics',
      invariantRule: 'Cost-only optimization leads to systemic fragility when supplier reliability is volatile.',
      confidence: 0.92,
      supportingEpisodeIds: ['ep_001'],
      generalityScore: 0.95,
      applicabilityConditions: ['High demand volatility', 'Buffer stock < 3 days']
    },
    {
      id: 'sem_002',
      domain: 'Logistics Dependencies',
      invariantRule: 'Port congestion non-linearly amplifies overseas freight delivery variance.',
      confidence: 0.88,
      supportingEpisodeIds: ['ep_001'],
      generalityScore: 0.89,
      applicabilityConditions: ['Port congestion index > 0.40']
    },
    {
      id: 'sem_003',
      domain: 'Dual-Sourcing Strategy',
      invariantRule: 'Splitting critical batch orders between low-cost bulk and agile rapid suppliers protects against catastrophic stockout while preserving margin.',
      confidence: 0.85,
      supportingEpisodeIds: [],
      generalityScore: 0.92,
      applicabilityConditions: ['Critical buffer threshold breach', 'High volume demand']
    }
  ];

  const proceduralMemory: ProceduralSkill[] = [
    {
      id: 'proc_001',
      name: 'Single-Source Bulk Procurement',
      description: 'Execute entire procurement tranche with low-cost supplier Alpha when safety buffer is ample.',
      steps: [
        'Verify buffer inventory exceeds 4 days of burn rate',
        'Verify port congestion index < 0.30',
        'Commit full purchase order to Supplier Alpha',
        'Log delivery deadline and begin monitoring transit corridor'
      ],
      successRate: 0.78,
      executionCount: 12,
      cost: 45,
      risk: 'MEDIUM',
      triggerCondition: 'Inventory >= 150 AND Demand == NORMAL'
    },
    {
      id: 'proc_002',
      name: 'Dual-Sourced Hedged Order Allocation',
      description: 'Split batch 65% to Supplier Alpha (low cost) and 35% to Supplier Beta (high speed assurance).',
      steps: [
        'Calculate critical immediate 2-day requirement',
        'Dispatch expedited portion (35%) to Supplier Beta with 2-day guarantee',
        'Dispatch bulk replenishment (65%) to Supplier Alpha',
        'Mitigate line starvation risk while reducing average unit cost from $72 to $54.45'
      ],
      successRate: 0.94,
      executionCount: 8,
      cost: 54.45,
      risk: 'LOW',
      triggerCondition: 'Inventory < 100 OR Volatility == HIGH'
    },
    {
      id: 'proc_003',
      name: 'Emergency Spot-Expedite Protocol',
      description: 'Trigger instant zero-delay procurement with Supplier Beta to avert active factory shutdown.',
      steps: [
        'Lock immediate order with Supplier Beta with premium freight',
        'Charge cash reserves',
        'Reschedule assembly shifts to align with 48h arrival'
      ],
      successRate: 0.98,
      executionCount: 4,
      cost: 72,
      risk: 'LOW',
      triggerCondition: 'Inventory < 40'
    }
  ];

  const metaMemory: MetaMemoryEntry[] = [
    {
      id: 'meta_001',
      domain: 'Supplier Lead Time Prediction',
      competenceLevel: 0.72,
      calibrationScore: 0.81,
      knownStrengths: ['Accurate on low-volume deterministic runs (<80 units)', 'Recognizes port congestion shifts'],
      knownWeaknesses: ['Tends to underestimate delay non-linearity when order surge exceeds supplier capacity threshold'],
      uncertaintyBoundaries: ['Untested during simultaneous supplier strike and extreme weather']
    },
    {
      id: 'meta_002',
      domain: 'Multi-Step Counterfactual Simulation',
      competenceLevel: 0.84,
      calibrationScore: 0.88,
      knownStrengths: ['Identifies trade-offs between unit cost vs stockout penalty accurately'],
      knownWeaknesses: ['Assumes static customer demand unless explicit shock is perceived'],
      uncertaintyBoundaries: ['Complex multi-tier supplier cascades']
    },
    {
      id: 'meta_003',
      domain: 'Self-Improvement Experiments',
      competenceLevel: 0.65,
      calibrationScore: 0.75,
      knownStrengths: ['Strict sandbox isolation before production weight update'],
      knownWeaknesses: ['Requires multiple verification cycles before permanent consolidation'],
      uncertaintyBoundaries: ['Autonomous architecture modification without regression']
    }
  ];

  return {
    workingMemory,
    episodicMemory,
    semanticMemory,
    proceduralMemory,
    metaMemory,
    totalConsolidatedEpisodes: 1
  };
}

export function consolidateEpisodes(
  memory: MemorySystemState,
  newEpisodes: EpisodicRecord[]
): { updatedMemory: MemorySystemState; newRulesCount: number } {
  const updatedEpisodes = [...memory.episodicMemory];
  let newRulesCount = 0;
  const updatedSemantic = [...memory.semanticMemory];

  for (const ep of newEpisodes) {
    if (ep.consolidated) continue;
    ep.consolidated = true;
    updatedEpisodes.push(ep);

    // If prediction error was significant or surprise score was high, extract a semantic rule
    if (ep.surpriseScore > 0.4 || ep.predictionError.overallNormalizedError > 0.35) {
      const existingRule = updatedSemantic.find(r => r.invariantRule.includes(ep.actionTaken.targetEntityId));
      if (!existingRule) {
        newRulesCount++;
        updatedSemantic.push({
          id: `sem_${Date.now()}_${newRulesCount}`,
          domain: 'Empirical Behavioral Invariant',
          invariantRule: `Observed significant outcome discrepancy in ${ep.actionTaken.targetEntityId}: ${ep.keyInsight}`,
          confidence: Math.min(0.95, 0.65 + ep.surpriseScore * 0.3),
          supportingEpisodeIds: [ep.id],
          generalityScore: 0.80,
          applicabilityConditions: [ep.context]
        });
      }
    }
  }

  return {
    updatedMemory: {
      ...memory,
      episodicMemory: updatedEpisodes,
      semanticMemory: updatedSemantic,
      totalConsolidatedEpisodes: memory.totalConsolidatedEpisodes + newEpisodes.length
    },
    newRulesCount
  };
}
