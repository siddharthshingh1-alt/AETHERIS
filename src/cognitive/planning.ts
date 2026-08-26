import { ActionRecord, EnvironmentState } from '../types/cognitive';
import { WorldModelState } from './worldModel';
import { simulateCounterfactualOptions, CounterfactualCandidate } from './reasoning';

export interface PlanRecord {
  goal: string;
  subgoals: string[];
  selectedAction: ActionRecord;
  alternativeOptions: string[];
  chosenCandidate: CounterfactualCandidate;
  allSimulatedCandidates: CounterfactualCandidate[];
  planningPolicyApplied: string;
}

export function synthesizePlan(
  worldModel: WorldModelState,
  envState: EnvironmentState,
  orderUnits: number = 100
): PlanRecord {
  const simulatedCandidates = simulateCounterfactualOptions(worldModel, envState, orderUnits);
  
  // Strategy selection based on current inventory level and environmental risk
  const daysOfInventory = envState.inventoryUnits / (envState.productionCapacity || 40);
  let planningPolicyApplied = 'Expected-Utility Optimization with Risk Penalty';
  let chosenCandidate = simulatedCandidates[0];

  if (daysOfInventory < 2.0 || envState.supplierStrike) {
    planningPolicyApplied = 'Critical Safety Margin Policy: Prioritize Zero-Delay Assurance';
    // Find candidate with lowest risk level or lowest delay
    const conservativeCandidate = simulatedCandidates.find(c => c.action.targetEntityId === 'supplier_beta' || c.action.type === 'DUAL_SOURCE_SPLIT');
    if (conservativeCandidate) {
      chosenCandidate = conservativeCandidate;
    }
  }

  const subgoals = [
    `Assess current inventory runway (${daysOfInventory.toFixed(1)} days remaining)`,
    `Simulate ${simulatedCandidates.length} candidate procurement pathways across cost and delay axes`,
    `Select optimal strategy: ${chosenCandidate.action.title}`
  ];

  return {
    goal: 'Maintain uninterrupted assembly production at minimal total risk-adjusted cost',
    subgoals,
    selectedAction: chosenCandidate.action,
    alternativeOptions: simulatedCandidates.slice(1).map(c => c.action.title),
    chosenCandidate,
    allSimulatedCandidates: simulatedCandidates,
    planningPolicyApplied
  };
}
