import { 
  ActionRecord, 
  PredictionOutcome, 
  ActualOutcome, 
  PredictionErrorDelta, 
  LearningEvent,
  EpisodicRecord
} from '../types/cognitive';
import { WorldModelState } from './worldModel';
import { MemorySystemState, consolidateEpisodes } from './memory';

export function calculatePredictionError(
  predicted: PredictionOutcome,
  actual: ActualOutcome
): PredictionErrorDelta {
  const predictedDelay = predicted.expectedDelayDays;
  const actualDelay = actual.actualDelayDays;
  const delayErrorDays = Math.round((actualDelay - predictedDelay) * 10) / 10;
  
  const costError = actual.actualCost - predicted.expectedCost;
  
  // Normalized error between 0 and 1
  const normalizedDelay = Math.min(1.0, Math.abs(delayErrorDays) / 4.0);
  const normalizedCost = Math.min(1.0, Math.abs(costError) / 2000.0);
  const overallNormalizedError = Math.round((normalizedDelay * 0.75 + normalizedCost * 0.25) * 100) / 100;

  let direction: 'OVERESTIMATED' | 'UNDERESTIMATED' | 'ACCURATE' = 'ACCURATE';
  if (delayErrorDays > 0.5) direction = 'UNDERESTIMATED'; // reality was worse/longer than predicted
  else if (delayErrorDays < -0.5) direction = 'OVERESTIMATED'; // reality was faster than predicted

  let dominantCause = 'Model aligned with empirical reality';
  if (Math.abs(delayErrorDays) > 1.0) {
    dominantCause = `Discrepancy in supplier queue model or freight transit speed (error ${delayErrorDays > 0 ? '+' : ''}${delayErrorDays} days)`;
  }

  // Brier score calculation for modal trajectory prediction
  const modalProb = predicted.chosenTrajectory.probability;
  const hit = Math.abs(delayErrorDays) <= 0.8;
  const brierScoreContribution = Math.round(Math.pow(modalProb - (hit ? 1 : 0), 2) * 1000) / 1000;

  return {
    delayErrorDays,
    costError,
    overallNormalizedError,
    direction,
    dominantCause,
    brierScoreContribution
  };
}

export function executeMultiLevelLearning(
  cycle: number,
  action: ActionRecord,
  predicted: PredictionOutcome,
  actual: ActualOutcome,
  error: PredictionErrorDelta,
  worldModel: WorldModelState,
  memorySystem: MemorySystemState
): {
  updatedWorldModel: WorldModelState;
  updatedMemorySystem: MemorySystemState;
  learningEvents: LearningEvent[];
  newEpisode: EpisodicRecord;
} {
  const learningEvents: LearningEvent[] = [];
  const updatedWorld = { ...worldModel, entities: { ...worldModel.entities }, causalEdges: [...worldModel.causalEdges] };
  let updatedMemory = { ...memorySystem };

  const targetSupplierId = action.targetEntityId;
  const targetSupplier = updatedWorld.entities[targetSupplierId];

  // 1. Level 1: Knowledge Learning (Fact updating)
  if (targetSupplier) {
    const prevRel = targetSupplier.reliabilityScore;
    const isSuccess = actual.status === 'SUCCESS';
    const newRel = isSuccess 
      ? Math.min(0.99, prevRel * 0.95 + 0.05) 
      : Math.max(0.40, prevRel * 0.90 - (error.delayErrorDays * 0.05));
    
    targetSupplier.reliabilityScore = Math.round(newRel * 100) / 100;
    targetSupplier.historicalEventsCount += 1;

    learningEvents.push({
      id: `learn_lvl1_${cycle}_${Date.now()}`,
      cycle,
      level: 1,
      levelName: 'Knowledge',
      description: `Updated entity '${targetSupplier.name}' reliability metrics from empirical observation.`,
      parameterChanged: `${targetSupplierId}.reliabilityScore`,
      previousValue: prevRel,
      newValue: targetSupplier.reliabilityScore,
      justification: `Actual delivery status: ${actual.status} with delay error of ${error.delayErrorDays} days.`
    });
  }

  // 2. Level 2: Pattern & Causal Learning
  const relevantEdgeIndex = updatedWorld.causalEdges.findIndex(
    e => e.sourceEntityId === targetSupplierId && e.sourceProperty === 'order_volume'
  );

  if (relevantEdgeIndex >= 0) {
    const edge = updatedWorld.causalEdges[relevantEdgeIndex];
    const prevWeight = edge.influenceWeight;
    
    // If underestimating delay on volume, increase influence weight
    if (error.direction === 'UNDERESTIMATED' && (action.parameters.units || 0) > 80) {
      const newWeight = Math.min(0.98, prevWeight + 0.08);
      edge.influenceWeight = Math.round(newWeight * 100) / 100;
      edge.empiricalSupportCount += 1;
      edge.confidence = Math.min(0.98, edge.confidence + 0.05);

      learningEvents.push({
        id: `learn_lvl2_${cycle}_${Date.now()}`,
        cycle,
        level: 2,
        levelName: 'Pattern',
        description: `Strengthened causal edge: [${edge.sourceEntityId}.order_volume -> ${edge.targetProperty}].`,
        parameterChanged: `causalEdge.${edge.id}.influenceWeight`,
        previousValue: prevWeight,
        newValue: edge.influenceWeight,
        justification: `Empirical proof: High volume (${action.parameters.units} units) triggered unexpected queuing latency.`
      });
    }
  }

  // 3. Level 3: Skill & Procedural Learning
  const updatedSkills = updatedMemory.proceduralMemory.map(skill => {
    if (skill.name.toLowerCase().includes(targetSupplierId.replace('supplier_', '')) || 
        (action.type === 'DUAL_SOURCE_SPLIT' && skill.name.includes('Dual-Sourced'))) {
      const prevSuccessRate = skill.successRate;
      const isOk = actual.status === 'SUCCESS';
      const newSuccessRate = isOk 
        ? Math.min(0.99, prevSuccessRate * 0.9 + 0.1) 
        : Math.max(0.40, prevSuccessRate * 0.9);
      
      if (Math.abs(newSuccessRate - prevSuccessRate) > 0.02) {
        learningEvents.push({
          id: `learn_lvl3_${cycle}_${Date.now()}`,
          cycle,
          level: 3,
          levelName: 'Skill',
          description: `Updated procedural skill success rate: '${skill.name}'.`,
          parameterChanged: `skill.${skill.id}.successRate`,
          previousValue: Math.round(prevSuccessRate * 100) / 100,
          newValue: Math.round(newSuccessRate * 100) / 100,
          justification: `Execution result was ${actual.status}.`
        });
      }
      return { ...skill, successRate: Math.round(newSuccessRate * 100) / 100, executionCount: skill.executionCount + 1 };
    }
    return skill;
  });
  updatedMemory.proceduralMemory = updatedSkills;

  // 4. Level 4: Strategy Learning (Epistemic update)
  if (error.delayErrorDays > 1.5 && targetSupplierId === 'supplier_alpha') {
    // Audit epistemic assumption
    const epAssumption = updatedWorld.epistemicRegistry.find(e => e.id === 'ep_2');
    if (epAssumption && epAssumption.status === 'ASSUMPTION') {
      epAssumption.status = 'HYPOTHESIS';
      epAssumption.confidence = 0.35;
      epAssumption.counterEvidenceIds.push(`episode_cycle_${cycle}`);
      
      learningEvents.push({
        id: `learn_lvl4_${cycle}_${Date.now()}`,
        cycle,
        level: 4,
        levelName: 'Strategy',
        description: 'Demoted epistemic statement: "Supplier Alpha capacity assumption" from ASSUMPTION to disputed HYPOTHESIS.',
        parameterChanged: 'epistemicRegistry.ep_2.status',
        previousValue: 'ASSUMPTION (0.60 conf)',
        newValue: 'DISPUTED HYPOTHESIS (0.35 conf)',
        justification: `Falsified by cycle ${cycle} observation: Delivery took ${actual.actualDelayDays} extra days.`
      });
    }
  }

  // 5. Level 5: World Model Evolution (Refining Epistemic Beliefs)
  const epVolumeHypothesis = updatedWorld.epistemicRegistry.find(e => e.id === 'ep_3');
  if (epVolumeHypothesis && error.direction === 'UNDERESTIMATED') {
    epVolumeHypothesis.status = 'BELIEF';
    epVolumeHypothesis.confidence = Math.min(0.95, epVolumeHypothesis.confidence + 0.15);
    epVolumeHypothesis.evidenceIds.push(`episode_cycle_${cycle}`);

    learningEvents.push({
      id: `learn_lvl5_${cycle}_${Date.now()}`,
      cycle,
      level: 5,
      levelName: 'World Model',
      description: 'Promoted hypothesis: "Order volume > 100 creates +3.5d delay" to verified empirical BELIEF.',
      parameterChanged: 'epistemicRegistry.ep_3.status',
      previousValue: 'HYPOTHESIS (0.55 conf)',
      newValue: 'VERIFIED BELIEF (0.85 conf)',
      justification: 'Repeated empirical validation across high-volume tranches.'
    });
  }

  // 6. Level 6: Meta-Learning & Self-Calibration
  const metaEntry = updatedMemory.metaMemory.find(m => m.domain.includes('Lead Time'));
  if (metaEntry) {
    const prevCalib = metaEntry.calibrationScore;
    const newCalib = Math.max(0.50, Math.min(0.99, prevCalib * 0.95 + (1 - error.brierScoreContribution) * 0.05));
    metaEntry.calibrationScore = Math.round(newCalib * 100) / 100;

    learningEvents.push({
      id: `learn_lvl6_${cycle}_${Date.now()}`,
      cycle,
      level: 6,
      levelName: 'Meta-Learning',
      description: 'Recalibrated meta-memory confidence and prediction error variance distribution.',
      parameterChanged: 'metaMemory.meta_001.calibrationScore',
      previousValue: prevCalib,
      newValue: metaEntry.calibrationScore,
      justification: `Brier score contribution on cycle ${cycle}: ${error.brierScoreContribution}.`
    });
  }

  // Create new episodic memory record
  const surprise = Math.min(1.0, Math.max(0.05, (Math.abs(error.delayErrorDays) / 3.0) * 0.8 + (error.costError > 0 ? 0.2 : 0)));
  const newEpisode: EpisodicRecord = {
    id: `ep_cycle_${cycle}_${Date.now()}`,
    cycle,
    timestamp: new Date().toISOString(),
    context: `Cycle ${cycle}: Executed '${action.title}' under ${actual.status} conditions.`,
    actionTaken: action,
    predictedOutcome: predicted,
    actualOutcome: actual,
    predictionError: error,
    surpriseScore: Math.round(surprise * 100) / 100,
    keyInsight: error.direction === 'ACCURATE' 
      ? 'Model accurately predicted trajectory within tight confidence interval.' 
      : `Model ${error.direction} delay by ${error.delayErrorDays} days due to ${error.dominantCause}.`,
    consolidated: false
  };

  // Consolidate into memory system
  const { updatedMemory: consolidatedMem } = consolidateEpisodes(updatedMemory, [newEpisode]);

  return {
    updatedWorldModel: {
      ...updatedWorld,
      lastUpdatedCycle: cycle,
      version: updatedWorld.version + 1
    },
    updatedMemorySystem: consolidatedMem,
    learningEvents,
    newEpisode
  };
}
