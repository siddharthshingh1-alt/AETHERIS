import { SelfImprovementExperiment } from '../types/cognitive';

export function createInitialExperiments(): SelfImprovementExperiment[] {
  return [
    {
      id: 'exp_001',
      version: 'v1.1.0-bayesian-queue',
      hypothesis: 'Replacing the linear volume penalty with an exponential asymptotic queue function (M/M/c approximation) will reduce surge prediction error by >= 35%.',
      weaknessAddressed: 'Prediction accuracy drops when order size exceeds 80 units with Supplier Alpha.',
      componentTarget: 'PREDICTION_ENGINE',
      baselineScore: 0.68,
      candidateScore: 0.89,
      status: 'ACCEPTED',
      benchmarkMetrics: {
        predictionAccuracy: 0.89,
        calibrationBrier: 0.08,
        adaptationLatencyCycles: 1,
        resourceCost: 1.05
      },
      deployedCycle: 1
    },
    {
      id: 'exp_002',
      version: 'v1.2.0-dual-source-heuristic',
      hypothesis: 'Embedding an automatic dual-sourcing bifurcation constraint whenever inventory buffer < 2.5 days will eliminate stockout line stoppages.',
      weaknessAddressed: 'Single-source procurement causes assembly line starvation when supplier delay exceeds buffer.',
      componentTarget: 'PLANNING_ENGINE',
      baselineScore: 0.74,
      candidateScore: 0.94,
      status: 'ACCEPTED',
      benchmarkMetrics: {
        predictionAccuracy: 0.92,
        calibrationBrier: 0.06,
        adaptationLatencyCycles: 1,
        resourceCost: 1.10
      },
      deployedCycle: 2
    },
    {
      id: 'exp_003',
      version: 'v1.3.0-counterfactual-horizon-5',
      hypothesis: 'Expanding simulation horizon from 3 steps to 5 steps will improve forward cashflow visibility, but may increase compute latency.',
      weaknessAddressed: 'Multi-cycle cash depletion when placing consecutive expedited orders.',
      componentTarget: 'PREDICTION_ENGINE',
      baselineScore: 0.82,
      candidateScore: 0.86,
      status: 'PROPOSED',
      benchmarkMetrics: {
        predictionAccuracy: 0.86,
        calibrationBrier: 0.09,
        adaptationLatencyCycles: 2,
        resourceCost: 1.45
      }
    }
  ];
}

export function runSandboxExperiment(
  experiment: SelfImprovementExperiment,
  currentAccuracy: number
): SelfImprovementExperiment {
  // Simulate running a comprehensive 20-episode test suite in an isolated sandbox environment
  const candidateAccuracy = Math.min(0.98, Math.max(0.65, currentAccuracy + 0.12 + (Math.random() * 0.06 - 0.03)));
  const candidateBrier = Math.max(0.03, Math.min(0.25, 0.15 - (candidateAccuracy - 0.7) * 0.2));
  
  const accepted = candidateAccuracy > experiment.baselineScore;

  return {
    ...experiment,
    candidateScore: Math.round(candidateAccuracy * 100) / 100,
    status: accepted ? 'ACCEPTED' : 'REJECTED',
    benchmarkMetrics: {
      predictionAccuracy: Math.round(candidateAccuracy * 100) / 100,
      calibrationBrier: Math.round(candidateBrier * 1000) / 1000,
      adaptationLatencyCycles: 1,
      resourceCost: experiment.benchmarkMetrics.resourceCost
    }
  };
}
