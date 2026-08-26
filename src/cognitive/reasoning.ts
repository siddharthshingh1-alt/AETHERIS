import { ActionRecord, PredictionOutcome, EnvironmentState } from '../types/cognitive';
import { WorldModelState } from './worldModel';
import { generatePredictions } from './prediction';

export interface CounterfactualCandidate {
  action: ActionRecord;
  prediction: PredictionOutcome;
  netExpectedValue: number; // calculated utility
  pros: string[];
  cons: string[];
  riskCategory: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
}

export function simulateCounterfactualOptions(
  worldModel: WorldModelState,
  envState: EnvironmentState,
  orderUnits: number = 100
): CounterfactualCandidate[] {
  const options: ActionRecord[] = [
    {
      id: `act_alpha_${Date.now()}`,
      type: 'ORDER_SUPPLIER',
      title: `Full Bulk Order (${orderUnits} units) with Supplier Alpha`,
      targetEntityId: 'supplier_alpha',
      parameters: { units: orderUnits, unitCost: 45, split: false },
      cost: orderUnits * 45,
      riskLevel: 'HIGH',
      reversible: false,
      rationale: 'Lowest unit cost ($45), but high non-linear queue sensitivity under surge volume.'
    },
    {
      id: `act_beta_${Date.now()}`,
      type: 'ORDER_SUPPLIER',
      title: `Guaranteed Rapid Order (${orderUnits} units) with Supplier Beta`,
      targetEntityId: 'supplier_beta',
      parameters: { units: orderUnits, unitCost: 72, split: false },
      cost: orderUnits * 72,
      riskLevel: 'LOW',
      reversible: false,
      rationale: 'Highest unit cost ($72), but bulletproof SLA (2 days) and zero volume queue penalty.'
    },
    {
      id: `act_split_${Date.now()}`,
      type: 'DUAL_SOURCE_SPLIT',
      title: `Dual-Sourced Hedged Split (60% Alpha / 40% Beta)`,
      targetEntityId: 'supplier_alpha', // primary target
      parameters: { units: orderUnits, alphaUnits: Math.round(orderUnits * 0.6), betaUnits: Math.round(orderUnits * 0.4), unitCost: 55.8 },
      cost: Math.round(orderUnits * 0.6 * 45 + orderUnits * 0.4 * 72),
      riskLevel: 'MEDIUM',
      reversible: false,
      rationale: 'Hedges risk: Beta ensures 40 units arrive in 2d to prevent line stoppage; Alpha fulfills bulk balance at $45.'
    },
    {
      id: `act_gamma_${Date.now()}`,
      type: 'ORDER_SUPPLIER',
      title: `Regional Flexible Order (${orderUnits} units) with Supplier Gamma`,
      targetEntityId: 'supplier_gamma',
      parameters: { units: orderUnits, unitCost: 60, split: false },
      cost: orderUnits * 60,
      riskLevel: 'MEDIUM',
      reversible: false,
      rationale: 'Medium cost ($60), bypasses marine port congestion via inland transport.'
    }
  ];

  return options.map(action => {
    const prediction = generatePredictions(action, worldModel, envState, 3);
    const expectedDelay = prediction.expectedDelayDays;
    const directCost = action.cost;
    
    // Line starvation penalty cost if buffer stock depletes before delivery
    const daysOfBuffer = envState.inventoryUnits / envState.productionCapacity;
    const totalLeadTime = (action.targetEntityId === 'supplier_beta' ? 2.0 : 3.0) + expectedDelay;
    const starvationDays = Math.max(0, totalLeadTime - daysOfBuffer);
    const stockoutPenalty = starvationDays * 1200; // $1200/day line stoppage

    // Utility: lower total cost & penalty is better
    const totalExpectedImpactCost = directCost + stockoutPenalty;
    const netExpectedValue = Math.round(10000 - totalExpectedImpactCost);

    const pros: string[] = [];
    const cons: string[] = [];

    if (action.cost < orderUnits * 50) pros.push('Superb capital efficiency (low unit price)');
    if (expectedDelay <= 0.5) pros.push('Minimal delivery delay risk (high reliability)');
    if (action.type === 'DUAL_SOURCE_SPLIT') pros.push('Resilient against single-point supplier breakdown');
    if (starvationDays > 0) cons.push(`Severe stockout risk (${starvationDays.toFixed(1)} days line stoppage, +$${stockoutPenalty} penalty)`);
    if (action.cost > orderUnits * 65) cons.push('High cash outflow consumes liquidity');
    if (expectedDelay > 1.5) cons.push(`Elevated delay variance (+${expectedDelay.toFixed(1)}d expected delay)`);

    let riskCategory: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' = 'BALANCED';
    if (action.riskLevel === 'LOW') riskCategory = 'CONSERVATIVE';
    if (action.riskLevel === 'HIGH') riskCategory = 'AGGRESSIVE';

    return {
      action,
      prediction,
      netExpectedValue,
      pros,
      cons,
      riskCategory
    };
  }).sort((a, b) => b.netExpectedValue - a.netExpectedValue);
}
