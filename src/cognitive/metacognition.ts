import { 
  ActionRecord, 
  PredictionOutcome, 
  ActualOutcome, 
  PredictionErrorDelta, 
  MetacognitiveDiagnosis 
} from '../types/cognitive';
import { WorldModelState } from './worldModel';

export function runMetacognitiveIntrospection(
  cycle: number,
  action: ActionRecord,
  predicted: PredictionOutcome,
  actual: ActualOutcome,
  error: PredictionErrorDelta,
  worldModel: WorldModelState
): MetacognitiveDiagnosis {
  const isAccurate = Math.abs(error.delayErrorDays) <= 0.5 && error.costError === 0;

  if (isAccurate) {
    return {
      id: `diag_${cycle}_${Date.now()}`,
      cycle,
      question: 'Did the internal world model accurately reflect physical and market causality?',
      diagnosis: `High fidelity: The predicted modal lead time (~${predicted.expectedDelayDays}d extra) matched actual delivery (${actual.actualDelayDays}d). Causal assumptions regarding volume queuing and logistics transit held true.`,
      assumptionsTested: [
        'Supplier capacity threshold model',
        'Port customs latency coefficient',
        'Linear assembly consumption burn rate'
      ],
      proposedRemedy: 'Maintain current predictive parameters; continue testing edge-case volatility.',
      confidenceInSelf: 0.94
    };
  }

  // Diagnostic for underestimation
  if (error.direction === 'UNDERESTIMATED') {
    const isSupplierAlpha = action.targetEntityId === 'supplier_alpha';
    const volume = action.parameters.units || 100;
    
    return {
      id: `diag_${cycle}_${Date.now()}`,
      cycle,
      question: 'Why did reality produce a longer delay than predicted by the world model?',
      diagnosis: `Causal Miss: The world model assumed Supplier Alpha possessed elastic batch capacity for ${volume} units. In reality, order volume exceeded the hidden physical machine queue threshold, creating +${error.delayErrorDays} days of unmodeled latency.`,
      assumptionsTested: [
        'Assumption: Supplier Alpha has linear delivery response up to 150 units [FALSIFIED]',
        'Assumption: Maritime port customs clearance delay <= 0.5 days [TESTED]',
        'Belief: Unit cost is the dominant metric when safety buffer >= 3 days [QUESTIONED]'
      ],
      flawedAssumption: 'Assumption: Supplier Alpha has linear delivery response up to 150 units',
      proposedRemedy: '1. Update volume sensitivity causal edge from 0.72 to 0.88; 2. Shift planning heuristic to prioritize Dual-Sourcing (Alpha+Beta) whenever order volume > 80 units; 3. Formulate sandbox A/B test for non-linear queuing function.',
      confidenceInSelf: 0.78
    };
  }

  // Diagnostic for overestimation
  return {
    id: `diag_${cycle}_${Date.now()}`,
    cycle,
    question: 'Why was the predicted delay more pessimistic than actual delivery?',
    diagnosis: `Conservative Bias: Transit cleared faster than expected (-${Math.abs(error.delayErrorDays)} days). Port congestion index cleared ahead of historical average.`,
    assumptionsTested: ['Logistics congestion persistent decay model'],
    proposedRemedy: 'Gradually increase exponential moving average weight on recent port telemetry.',
    confidenceInSelf: 0.86
  };
}
