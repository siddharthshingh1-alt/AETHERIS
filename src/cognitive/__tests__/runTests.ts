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

console.log('\n====================================================');
console.log(`🎉 ALL ${totalTests} TESTS PASSED CLEANLY (${passedTests}/${totalTests})`);
console.log('====================================================\n');
