import { 
  ActionRecord, 
  PredictionOutcome, 
  FutureStatePrediction, 
  WorldEntity, 
  CausalEdge,
  EnvironmentState 
} from '../types/cognitive';
import { WorldModelState } from './worldModel';

export function generatePredictions(
  candidateAction: ActionRecord,
  worldModel: WorldModelState,
  envState: EnvironmentState,
  horizonSteps: number = 3
): PredictionOutcome {
  const targetSupplier = worldModel.entities[candidateAction.targetEntityId];
  const orderUnits = candidateAction.parameters.units || 100;
  const isSurge = orderUnits > 90;

  // Causal edge lookup for volume sensitivity
  const volumeCausalEdge = worldModel.causalEdges.find(
    e => e.sourceEntityId === candidateAction.targetEntityId && e.sourceProperty === 'order_volume'
  );
  const volumeInfluence = volumeCausalEdge ? volumeCausalEdge.influenceWeight : 0.5;

  const portCongestion = envState.portCongestionLevel;
  const weatherDisruption = envState.weatherDisruption;
  const strike = envState.supplierStrike && candidateAction.targetEntityId === 'supplier_alpha';

  // Base lead time
  const baseLeadTime = typeof targetSupplier?.properties?.base_lead_time_days?.value === 'number' 
    ? targetSupplier.properties.base_lead_time_days.value 
    : 3.0;

  // Calculate expected delay based on causal factors
  let expectedExtraDelay = 0;
  if (isSurge) {
    expectedExtraDelay += (orderUnits / 100) * volumeInfluence * 2.5;
  }
  if (portCongestion > 0.4) {
    expectedExtraDelay += portCongestion * 1.8;
  }
  if (weatherDisruption) {
    expectedExtraDelay += 1.5;
  }
  if (strike) {
    expectedExtraDelay += 4.0;
  }

  const expectedTotalLeadTime = baseLeadTime + expectedExtraDelay;
  const expectedCost = orderUnits * (candidateAction.parameters.unitCost || 50);

  // Generate 3 candidate futures: (A) Nominal/Best Case, (B) Expected Modal Case, (C) Adverse/Worst Case
  const candidateFutures: FutureStatePrediction[] = [
    {
      step: 1,
      stateDescription: 'Optimistic Track: Smooth corridor discharge with zero friction',
      probability: Math.max(0.15, 0.55 - (isSurge ? 0.3 : 0) - (portCongestion > 0.3 ? 0.15 : 0)),
      confidenceInterval: [Math.max(1.5, baseLeadTime - 0.5), baseLeadTime + 0.5],
      expectedMetrics: {
        delayDays: 0,
        cost: expectedCost,
        inventoryLevel: Math.max(0, envState.inventoryUnits - 40 + (baseLeadTime <= 2 ? orderUnits : 0)),
        cashDelta: -expectedCost,
        customerSatisfaction: 0.98
      },
      uncertaintyFactors: ['Favorable customs processing', 'Zero dock congestion']
    },
    {
      step: 2,
      stateDescription: 'Expected Modal Track: Mild queuing and volume friction',
      probability: 0.55,
      confidenceInterval: [Math.max(2.0, expectedTotalLeadTime - 1.0), expectedTotalLeadTime + 1.2],
      expectedMetrics: {
        delayDays: Math.round(expectedExtraDelay * 10) / 10,
        cost: expectedCost,
        inventoryLevel: Math.max(0, envState.inventoryUnits - (expectedTotalLeadTime * 35) + orderUnits),
        cashDelta: -expectedCost,
        customerSatisfaction: expectedExtraDelay > 2.0 ? 0.78 : 0.92
      },
      uncertaintyFactors: [
        isSurge ? 'Supplier queue backlog' : 'Nominal queue',
        portCongestion > 0.3 ? 'Port throughput friction' : 'Standard logistics'
      ]
    },
    {
      step: 3,
      stateDescription: 'Adverse Track: Cascading bottleneck & acute delivery stall',
      probability: Math.min(0.50, 0.15 + (isSurge ? 0.25 : 0) + (portCongestion > 0.3 ? 0.20 : 0) + (strike ? 0.35 : 0)),
      confidenceInterval: [expectedTotalLeadTime + 1.5, expectedTotalLeadTime + 4.5],
      expectedMetrics: {
        delayDays: Math.round((expectedExtraDelay + 3.2) * 10) / 10,
        cost: expectedCost + 800, // expediting fees
        inventoryLevel: Math.max(0, envState.inventoryUnits - ((expectedTotalLeadTime + 3) * 40)),
        cashDelta: -expectedCost - 800,
        customerSatisfaction: 0.62
      },
      uncertaintyFactors: ['Severe freight holdup', 'Assembly line starvation penalty']
    }
  ];

  // Normalize probabilities so they sum to 1.0
  const sumProb = candidateFutures.reduce((s, f) => s + f.probability, 0);
  candidateFutures.forEach(f => {
    f.probability = Math.round((f.probability / sumProb) * 100) / 100;
  });

  const chosenTrajectory = candidateFutures[1]; // Expected modal trajectory

  return {
    horizonSteps,
    candidateFutures,
    chosenTrajectory,
    expectedDelayDays: chosenTrajectory.expectedMetrics.delayDays,
    expectedCost,
    confidence: Math.round((1 - (expectedExtraDelay * 0.12)) * 100) / 100,
    reasoningSummary: `Predicted total lead time of ~${expectedTotalLeadTime.toFixed(1)} days (${baseLeadTime}d base + ${expectedExtraDelay.toFixed(1)}d volume/friction). Modal probability ${chosenTrajectory.probability * 100}%.`
  };
}

export function computeBrierScore(predictedProbability: number, outcomeOccurred: boolean): number {
  const actual = outcomeOccurred ? 1 : 0;
  return Math.pow(predictedProbability - actual, 2);
}
