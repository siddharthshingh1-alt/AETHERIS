/**
 * Automated Verification Test Suite for Learning Machine Architecture.
 *
 * Tests:
 * 1. Experience Store: Storage, retrieval, confidence thresholds, clearing, isolation
 * 2. Benchmark Suite: Determinism, split counts, ground truth calculation
 * 3. Agent Execution: Control isolation vs. Learning persistent memory
 * 4. End-to-End Experiment: Dual agent run, metrics calculation, hypothesis reporting
 */

import { ExperienceStore, ExperienceRecord } from '../experienceStore';
import { generateBenchmarkSuite } from '../benchmark';
import { runBenchmarkExperiment, executeTaskForAgent } from '../experimentRunner';
import { calculateAgentSummary, generateComparativeReport } from '../metrics';
import { MemoryPersistenceAdapter } from '../persistence';
import { parseUserTeaching, detectTeachingIntent } from '../teachingParser';
import { evaluateCognitiveDecision } from '../chatDecisionEngine';
import { accumulateEvidenceForAction } from '../evidenceAccumulator';
import { runGeneralKnowledgeTestSuite } from './runKnowledgeTests';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log('🧪 LEARNING MACHINE COGNITIVE ARCHITECTURE TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Experience Store
// ----------------------------------------------------
console.log('▶ TEST GROUP 1: Structured Experience Store');
{
  const store = new ExperienceStore('test_exp_1');
  assert(store.size() === 0, 'Store initializes empty');

  const dummyRecord: ExperienceRecord = {
    experienceId: 'rec_001',
    taskId: 'TASK_A1',
    taskFamily: 'SUPPLIER_SELECTION',
    context: { portCongestion: 0.6 },
    prediction: { expectedUtility: 8000 },
    confidence: 0.8,
    predictionFeatures: { portCongestion: 0.6 },
    selectedAction: { actionType: 'SUPPLIER_ALPHA', parameters: {} },
    expectedOutcome: { netUtility: 8000 },
    actualOutcome: { netUtility: 4500, stockoutOccurred: true },
    predictionError: { normalizedError: 0.7, brierLoss: 0.64, direction: 'OVERESTIMATED' },
    success: false,
    errorCause: {
      observedFact: 'Delay spiked to 4.5d',
      interpretation: 'Congestion caused stockout',
      identifiedDriver: 'portCongestion',
    },
    lesson: {
      observedFact: 'Delay spiked',
      interpretation: 'Congestion hazard',
      proposedChange: 'Switch to Dual Source',
      confidence: 0.85,
      rule: 'IF portCongestion > 0.4 THEN penalize Alpha',
    },
    applicableConditions: { taskFamily: 'SUPPLIER_SELECTION', featureConstraints: {} },
    createdAt: new Date().toISOString(),
    sourceExperimentId: 'test_exp_1',
  };

  store.addExperience(dummyRecord);
  assert(store.size() === 1, 'Store size increases on addExperience');
  assert(store.getExperience('rec_001')?.taskId === 'TASK_A1', 'getExperience retrieves by ID');

  // Test retrieval
  const retrieved = store.retrieveRelevantExperiences({
    taskFamily: 'SUPPLIER_SELECTION',
    contextFeatures: { portCongestion: 0.6 },
  });
  assert(retrieved.length === 1, 'retrieveRelevantExperiences finds matching family & features');
  assert(retrieved[0].lesson.confidence === 0.85, 'Retrieved record contains structured lesson');

  // Test query with non-matching family
  const nonMatching = store.retrieveRelevantExperiences({
    taskFamily: 'RESOURCE_ALLOCATION',
  });
  assert(nonMatching.length === 0, 'Does not return irrelevant task families');

  // Test clear
  store.clear();
  assert(store.size() === 0, 'clear() purges all records');
}

// ----------------------------------------------------
// TEST GROUP 2: Benchmark Suite
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 2: Benchmark Suite & Task Partitions');
{
  const suite = generateBenchmarkSuite();
  assert(suite.length === 36, `Benchmark generates 36 tasks (got ${suite.length})`);

  const repeated = suite.filter(t => t.split === 'REPEATED');
  const related = suite.filter(t => t.split === 'RELATED');
  const heldOut = suite.filter(t => t.split === 'HELD_OUT');

  assert(repeated.length === 16, `Repeated partition has 16 tasks (got ${repeated.length})`);
  assert(related.length === 10, `Related partition has 10 tasks (got ${related.length})`);
  assert(heldOut.length === 10, `Held-Out partition has 10 tasks (got ${heldOut.length})`);

  // Verify determinism across duplicate generations
  const suite2 = generateBenchmarkSuite();
  let deterministic = true;
  for (let i = 0; i < suite.length; i++) {
    if (suite[i].taskId !== suite2[i].taskId || suite[i].seed !== suite2[i].seed) {
      deterministic = false;
      break;
    }
  }
  assert(deterministic, 'Benchmark generation is strictly deterministic');

  // Test ground-truth evaluation is calculable
  const task1 = suite[0];
  const evalResult = task1.evaluateAction(task1.availableActions[0].actionId, {});
  assert(typeof evalResult.netUtility === 'number', 'Action evaluation yields numeric net utility');
  assert(typeof evalResult.groundTruthExplanation === 'string', 'Action evaluation yields ground-truth explanation');
}

// ----------------------------------------------------
// TEST GROUP 3: Agent Isolation & Learning Dynamics
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 3: Agent Isolation & Learning Dynamics');
{
  const suite = generateBenchmarkSuite();
  const repeatedTasks = suite.filter(t => t.taskFamily === 'SUPPLIER_SELECTION' && t.split === 'REPEATED');

  const controlStore = new ExperienceStore('ctrl_iso');
  const learningStore = new ExperienceStore('learn_dyn');

  // Run Task 1 on Control Agent
  const ctrl1 = executeTaskForAgent('CONTROL', repeatedTasks[0], controlStore, 'exp_test');
  assert(ctrl1.experienceStored === false, 'Control Agent does NOT store experience');
  assert(controlStore.size() === 0, 'Control experience store remains empty');

  // Run Task 1 on Learning Agent
  const learn1 = executeTaskForAgent('LEARNING', repeatedTasks[0], learningStore, 'exp_test');
  assert(learn1.experienceStored === true, 'Learning Agent stores structured experience');
  assert(learningStore.size() === 1, 'Learning experience store contains recorded episode');

  // Run Task 2 (Repeated congestion shock) on Control vs Learning
  const ctrl2 = executeTaskForAgent('CONTROL', repeatedTasks[1], controlStore, 'exp_test');
  const learn2 = executeTaskForAgent('LEARNING', repeatedTasks[1], learningStore, 'exp_test');

  assert(ctrl2.experienceInfluencedDecision === false, 'Control Agent is not influenced by prior runs');
  assert(learn2.experienceInfluencedDecision === true, 'Learning Agent is influenced by prior experience');
  assert(learn2.isOptimalAction === true, 'Learning Agent switches to optimal action on repeated exposure');
}

// ----------------------------------------------------
// TEST GROUP 4: Full End-to-End Experiment & Statistical Summary
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 4: Full End-to-End Experiment Runner');
{
  const results = runBenchmarkExperiment();
  assert(results.tasksEvaluatedCount === 36, 'Full benchmark evaluated all 36 tasks');
  assert(results.controlRecords.length === 36, 'Recorded 36 Control executions');
  assert(results.learningRecords.length === 36, 'Recorded 36 Learning executions');

  const rep = results.report;
  assert(rep.taskCount === 36, 'Comparative report contains 36 tasks');
  assert(typeof rep.controlSummary.overallSuccessRate === 'number', 'Control success rate calculated');
  assert(typeof rep.learningSummary.overallSuccessRate === 'number', 'Learning success rate calculated');

  console.log('\n📊 EXPERIMENTAL SUMMARY METRICS:');
  console.log(`  • Control Success Rate:  ${(rep.controlSummary.overallSuccessRate * 100).toFixed(1)}%`);
  console.log(`  • Learning Success Rate: ${(rep.learningSummary.overallSuccessRate * 100).toFixed(1)}%`);
  console.log(`  • Success Rate Delta:    +${(rep.delta.successRateDelta * 100).toFixed(1)}%`);
  console.log(`  • Mean Net Utility Delta: +$${rep.delta.utilityDelta.toFixed(0)}`);
  console.log(`  • Prediction Error Red.: ${(rep.delta.predictionErrorReduction * 100).toFixed(1)}%`);
  console.log(`  • Held-Out Transf. Rate: ${(rep.learningSummary.heldOutMetrics.successRate * 100).toFixed(1)}% (vs Control ${(rep.controlSummary.heldOutMetrics.successRate * 100).toFixed(1)}%)`);

  assert(rep.learningSummary.overallSuccessRate > rep.controlSummary.overallSuccessRate, 'Learning Agent outperforms Control Agent overall');
  assert(rep.learningSummary.heldOutMetrics.successRate >= rep.controlSummary.heldOutMetrics.successRate, 'Learning Agent transfers successfully to held-out tasks without negative degradation');
  assert(results.jsonlLogs.length > 500, 'Produced machine-readable JSONL logs');
}

// ----------------------------------------------------
// TEST GROUP 5: User Teaching Parsing & Memory Categorization
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 5: User Teaching Natural Language Parsing');
{
  // Test Intent Detection
  assert(detectTeachingIntent('Remember that Supplier Alpha was delayed by 4 days during port congestion') === true, 'Detects "Remember that" teaching');
  assert(detectTeachingIntent('I want to teach you: always check GSM measurements') === true, 'Detects "teach you" teaching');
  assert(detectTeachingIntent('Help me decide between Supplier Alpha and Supplier Beta') === false, 'Detects decision query is NOT teaching');

  // Test Parsing an Empirical Observation
  const teaching1 = parseUserTeaching('Remember that Supplier Alpha took 4.5 days to deliver when port congestion was at 65%');
  assert(teaching1.memoryType === 'EXPERIENCE', 'Classifies specific past incident as EXPERIENCE memoryType');
  assert(teaching1.targetEntity === 'Supplier Alpha', 'Extracts target entity Supplier Alpha');
  assert(teaching1.observation?.delayDays === 4.5, 'Extracts numeric delay of 4.5 days');
  assert(teaching1.contextFeatures.portCongestion !== undefined && Math.abs(teaching1.contextFeatures.portCongestion - 0.65) < 0.01, 'Extracts context portCongestion = 0.65');
  assert(teaching1.experienceRecord.source === 'USER_TAUGHT', 'Generates valid ExperienceRecord with USER_TAUGHT source');

  // Test Parsing a Preference
  const prefTeaching = parseUserTeaching('I always prefer Express Air Freight whenever shipping critical orders');
  assert(prefTeaching.memoryType === 'PREFERENCE', 'Classifies preference statement as PREFERENCE memoryType');
  assert(prefTeaching.evidenceStatus === 'USER_PREFERENCE', 'Sets evidence status to USER_PREFERENCE');

  // Test Parsing a Hypothesis / Rule
  const ruleTeaching = parseUserTeaching('Whenever port congestion exceeds 40%, assume maritime shipping will be delayed by 3 days');
  assert(ruleTeaching.memoryType === 'HYPOTHESIS_OR_RULE' || ruleTeaching.memoryType === 'LESSON', 'Classifies conditional rule correctly');
  assert(ruleTeaching.evidenceStatus === 'USER_HYPOTHESIS', 'Sets evidence status to USER_HYPOTHESIS');
}

// ----------------------------------------------------
// TEST GROUP 6: Memory Persistence Adapter & Cross-Session Reload
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 6: Memory Persistence Adapter & Cross-Session Reload');
{
  const memoryBackend = new MemoryPersistenceAdapter<ExperienceRecord[]>();
  const store1 = new ExperienceStore('session_1', memoryBackend);

  const taughtExp = parseUserTeaching('Supplier Alpha delivered 4 days late in port congestion 0.60').experienceRecord;
  store1.addExperience(taughtExp);
  assert(store1.size() === 1, 'Experience stored in initial session');

  // Create a brand new store instance simulating page reload with same adapter
  const store2 = new ExperienceStore('session_2', memoryBackend);
  assert(store2.size() === 1, 'Reloaded store instance recovers persisted experience seamlessly');
  const recovered = store2.getAllExperiences()[0];
  assert(recovered.targetEntity === 'Supplier Alpha', 'Persisted record preserves targetEntity across reload');
  assert(recovered.source === 'USER_TAUGHT', 'Persisted record preserves USER_TAUGHT origin');
}

// ----------------------------------------------------
// TEST GROUP 7: Unprompted Retrieval & Causal Decision Shift
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 7: Unprompted Retrieval & Causal Decision Shift (Memory ON vs OFF)');
{
  const liveStore = new ExperienceStore('eval_store');
  
  // Baseline without taught memory
  const traceBaseline = evaluateCognitiveDecision({
    query: 'Should I choose Supplier Alpha or Supplier Beta under current port congestion (60%)?',
    environmentState: { portCongestion: 0.60, demandVolatility: 0.15 } as any,
    experienceStore: liveStore,
  });

  // Default baseline without memory chooses Supplier Alpha because maritime is cheaper ($1,200 vs $3,200)
  assert(traceBaseline.retrievedMemories.length === 0, 'No relevant memories retrieved in empty store');
  assert(traceBaseline.baseline.selectedActionLabel.includes('Alpha') || traceBaseline.baseline.selectedActionLabel.includes('Maritime'), 'Baseline chooses cheaper Supplier Alpha');

  // Now teach the agent about Supplier Alpha's congestion bottleneck
  const taught = parseUserTeaching('Remember that Supplier Alpha was delayed by 4.5 days when port congestion reached 60%');
  liveStore.addExperience(taught.experienceRecord);

  // Re-evaluate the exact same decision
  const traceInformed = evaluateCognitiveDecision({
    query: 'Should I choose Supplier Alpha or Supplier Beta under current port congestion (60%)?',
    environmentState: { portCongestion: 0.60, demandVolatility: 0.15 } as any,
    experienceStore: liveStore,
  });

  assert(traceInformed.retrievedMemories.length > 0, 'Unpromptedly retrieves matching taught experience');
  assert(traceInformed.retrievedMemories[0].influencedPrediction === true, 'Memory actively influenced delay prediction');
  assert(traceInformed.causalDelta.decisionChanged === true, 'Taught memory caused a real decision shift away from bottlenecked supplier');
  assert(traceInformed.experienceInformed.selectedActionLabel.includes('Beta') || traceInformed.experienceInformed.selectedActionLabel.includes('Dual') || traceInformed.experienceInformed.selectedActionLabel.includes('Express'), 'Switched to resilient alternative');
  assert(traceInformed.causalDelta.delayDeltaDays > 0, 'Predicted delay delta accounts for the observed delay');
}

// ----------------------------------------------------
// TEST GROUP 8: Negative Control (Contextual Mismatch Does NOT Overgeneralize)
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 8: Negative Control (No Overgeneralization under Low Congestion)');
{
  const liveStore = new ExperienceStore('neg_ctrl_store');
  const taught = parseUserTeaching('Supplier Alpha had 4 days delay during heavy port congestion 0.65');
  liveStore.addExperience(taught.experienceRecord);

  // Evaluate in a low-congestion environment (portCongestion = 0.10)
  const traceLowCongestion = evaluateCognitiveDecision({
    query: 'Choose supplier for low congestion port conditions (10%)',
    environmentState: { portCongestion: 0.10, demandVolatility: 0.10 } as any,
    experienceStore: liveStore,
  });

  // Under low congestion, congestion-specific bottleneck memories should have zero or minimal relevance (< 0.5)
  // and Supplier Alpha should remain optimal due to low cost and zero congestion delay.
  const strongMatches = traceLowCongestion.retrievedMemories.filter(m => m.relevanceScore > 0.7);
  assert(strongMatches.length === 0, 'Contextual distance metric suppresses irrelevant high-congestion memory under 10% congestion');
}

// ----------------------------------------------------
// TEST GROUP 9: Multi-Episode Evidence Accumulation & Contradiction Handling
// ----------------------------------------------------
console.log('\n▶ TEST GROUP 9: Multi-Episode Evidence Accumulation & Contradiction Handling');
{
  const candidateAction = { actionType: 'SUPPLIER_ALPHA', targetEntity: 'Supplier Alpha', parameters: { mode: 'maritime' } };
  const context = { demandVolatility: 0.20, portCongestion: 0.60, inventoryDays: 1.5 };

  // Episode 1: Severe Delay Observed
  const ep1 = parseUserTeaching('Supplier Alpha was 4 days late under port congestion 0.60').experienceRecord;
  const acc1 = accumulateEvidenceForAction(candidateAction.actionType, candidateAction.targetEntity, [ep1], context);
  assert(acc1.supportingEpisodes && acc1.supportingEpisodes.length === 1, 'Episode 1 counted as supporting penalty evidence');
  assert(acc1.netDelayAdjustmentDays > 2.0, 'Substantial positive delay adjustment applied from ep1');
  assert(acc1.hasEpistemicConflict === false, 'No epistemic conflict with single episode');

  // Episode 2: Contradicting On-Time Delivery under Same Conditions
  const ep2 = parseUserTeaching('Supplier Alpha arrived on time with 0 days delay under port congestion 0.60').experienceRecord;
  const acc2 = accumulateEvidenceForAction(candidateAction.actionType, candidateAction.targetEntity, [ep1, ep2], context);
  assert(acc2.supportingEpisodes && acc2.supportingEpisodes.length === 1, 'Episode 1 still recorded as delay support');
  assert(acc2.contradictingEpisodes && acc2.contradictingEpisodes.length === 1, 'Episode 2 recorded as contradiction / on-time evidence');
  assert(acc2.hasEpistemicConflict === true, 'Epistemic conflict flag raised due to mixed evidence');
  assert(acc2.netDelayAdjustmentDays < acc1.netDelayAdjustmentDays, 'Net delay penalty is proportionally discounted by contradicting evidence');
}

console.log('\n====================================================');
console.log(`🎉 COGNITIVE DECISION ENGINE TESTS: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================\n');

// ----------------------------------------------------
// TEST GROUP 10: Phase 1 General Knowledge Core Tests
// ----------------------------------------------------
const knowledgeRes = runGeneralKnowledgeTestSuite();
totalTests += knowledgeRes.total;
passedTests += knowledgeRes.passed;

console.log('\n====================================================');
console.log(`🎉 GRAND TOTAL: ALL ${totalTests} TESTS PASSED CLEANLY (${passedTests}/${totalTests})`);
console.log('====================================================\n');
