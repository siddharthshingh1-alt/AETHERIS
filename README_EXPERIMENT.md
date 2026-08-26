# Learning Machine: Controlled Experiential Learning Experiment

## Overview
This module implements a controlled experiment designed to test whether an autonomous agent that explicitly predicts outcomes, observes the consequences of its actions, evaluates prediction errors, and stores/retrieves structured experiential lessons achieves measurable and statistically significant performance improvements on repeated and held-out transfer tasks compared with an otherwise identical control agent without persistent learning.

## Quick Start

### Run the Benchmark & Automated Test Suite
```bash
npm run test
```

### Run via TypeScript CLI directly
```bash
npx tsx src/cognitive/__tests__/runTests.ts
```

## Structure
- `src/cognitive/experienceStore.ts`: Structured experience store with factual grounding and lesson retrieval.
- `src/cognitive/benchmark.ts`: 36 deterministic, objectively evaluated benchmark tasks across 3 task families and 3 partitions.
- `src/cognitive/experimentRunner.ts`: Dual-agent harness running interleaved tasks on Control and Learning Agents with JSONL log generation.
- `src/cognitive/metrics.ts`: Statistical evaluation suite measuring task success rates, initial-to-final improvement, Brier loss, prediction error loss, and held-out transfer generalization.
- `src/cognitive/__tests__/runTests.ts`: Automated test suite covering store operations, benchmark validation, agent isolation, and end-to-end evaluation.

## Documentation
- `ARCHITECTURE_AUDIT.md`: Complete audit of the baseline cognitive system.
- `LEARNING_HYPOTHESIS.md`: Formal scientific hypothesis, variables, and failure criteria.
- `EXPERIMENT_DESIGN.md`: Detailed benchmark design, task families, partitions, and metrics.
