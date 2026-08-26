/**
 * Teaching Parser - Natural Language Cognitive Extraction Pipeline.
 *
 * Converts user teaching inputs into structured Cognitive Memory objects:
 * 1. Intent Detection
 * 2. Memory Type Classification (EXPERIENCE, FACT, PREFERENCE, HYPOTHESIS_OR_RULE, LESSON)
 * 3. Entity & Context Feature Extraction (demandVolatility, portCongestion, etc.)
 * 4. Episodic Grounding & ExperienceRecord synthesis
 */

import { ExperienceRecord, CognitiveMemoryType, CognitiveEvidenceStatus } from './experienceStore';

export interface ParsedTeachingResult {
  isTeaching: boolean;
  rawText: string;
  memoryType: CognitiveMemoryType;
  evidenceStatus: CognitiveEvidenceStatus;
  confidence: number;
  
  title: string;
  summary: string;
  targetEntity?: string;
  
  contextFeatures: {
    demandVolatility?: number;
    portCongestion?: number;
    weatherDisruption?: boolean;
    inventoryDays?: number;
  };
  
  observation?: {
    delayDays?: number;
    cost?: number;
    stockoutOccurred?: boolean;
    success: boolean;
    description: string;
  };
  
  interpretation: string;
  proposedChange: string;
  rule: string;
  
  createExperienceRecord: (overrides?: Partial<ExperienceRecord>) => ExperienceRecord;
}

/**
 * Checks whether user input expresses a teaching, rule-setting, or experiential observation intent.
 */
export function detectTeachingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Explicit teaching cues
  const explicitCues = [
    'teach',
    'remember',
    'note that',
    'i want you to know',
    'lesson:',
    'rule:',
    'fact:',
    'preference:',
    'experience:',
    'whenever',
    'when ordering',
    'check gsm',
  ];
  
  if (explicitCues.some(cue => lower.includes(cue))) {
    return true;
  }
  
  // Narrative empirical observations (e.g. "Supplier Alpha delivered 4 days late...")
  const episodicCues = [
    'delivered',
    'arrived late',
    'days late',
    'on time',
    'delayed by',
    'lead time is',
    'i prefer',
  ];
  
  const hasEntity = lower.includes('alpha') || lower.includes('beta') || lower.includes('supplier') || lower.includes('freight') || lower.includes('carrier') || lower.includes('inventory');
  const hasOutcome = episodicCues.some(c => lower.includes(c));
  
  return hasEntity && hasOutcome;
}

/**
 * Parses user teaching text into a structured, type-safe representation.
 */
export function parseUserTeaching(text: string): ParsedTeachingResult {
  const rawText = text.trim();
  const lower = rawText.toLowerCase();
  const isTeaching = detectTeachingIntent(rawText);

  // 1. Classify Memory Type
  let memoryType: CognitiveMemoryType = 'EXPERIENCE';
  let evidenceStatus: CognitiveEvidenceStatus = 'OBSERVED_EVENT';
  let initialConfidence = 0.75; // Initial empirical observation confidence

  if (lower.includes('as an experience') || lower.includes('not a universal rule')) {
    memoryType = 'EXPERIENCE';
    evidenceStatus = 'OBSERVED_EVENT';
    initialConfidence = 0.75;
  } else if (lower.includes('prefer') || lower.includes('preference') || lower.includes('i want to avoid') || lower.includes('always favor')) {
    memoryType = 'PREFERENCE';
    evidenceStatus = 'USER_PREFERENCE';
    initialConfidence = 0.95;
  } else if (lower.includes('lead time is normally') || lower.includes('warehouse capacity is') || lower.includes('standard lead time') || lower.startsWith('fact:')) {
    memoryType = 'FACT';
    evidenceStatus = 'FACT';
    initialConfidence = 0.90;
  } else if (lower.includes('tends to') || lower.includes('usually') || lower.includes('hypothesis') || lower.startsWith('rule:') || (!lower.includes('delivered') && !lower.includes('yesterday') && lower.includes('when demand volatility is high'))) {
    memoryType = 'HYPOTHESIS_OR_RULE';
    evidenceStatus = 'USER_HYPOTHESIS';
    initialConfidence = 0.60;
  } else if (lower.startsWith('lesson:') || lower.includes('validated lesson')) {
    memoryType = 'LESSON';
    evidenceStatus = 'EMPIRICALLY_VALIDATED';
    initialConfidence = 0.85;
  } else {
    // Default empirical past-tense episode
    memoryType = 'EXPERIENCE';
    evidenceStatus = 'OBSERVED_EVENT';
    initialConfidence = 0.75;
  }

  // 2. Extract Target Entity
  let targetEntity = 'Supplier Alpha';
  if (lower.includes('supplier beta') || lower.includes('beta')) {
    targetEntity = 'Supplier Beta';
  } else if (lower.includes('supplier alpha') || lower.includes('alpha')) {
    targetEntity = 'Supplier Alpha';
  } else if (lower.includes('air freight') || lower.includes('express air')) {
    targetEntity = 'Express Air Freight';
  } else if (lower.includes('maritime freight') || lower.includes('ocean')) {
    targetEntity = 'Standard Maritime Freight';
  } else if (lower.includes('dual sourcing')) {
    targetEntity = 'Dual Sourcing';
  }

  // 3. Extract Context Features
  const contextFeatures: {
    demandVolatility?: number;
    portCongestion?: number;
    weatherDisruption?: boolean;
    inventoryDays?: number;
  } = {};

  // Demand Volatility
  if (lower.includes('demand volatility was high') || lower.includes('high demand volatility') || lower.includes('volatility was high') || lower.includes('volatility is high')) {
    contextFeatures.demandVolatility = 0.45;
  } else if (lower.includes('demand volatility was low') || lower.includes('low demand volatility') || lower.includes('volatility was low') || lower.includes('volatility is low')) {
    contextFeatures.demandVolatility = 0.15;
  } else if (lower.includes('moderate volatility')) {
    contextFeatures.demandVolatility = 0.30;
  }

  // Port Congestion
  if (lower.includes('port congestion was low') || lower.includes('low port congestion') || lower.includes('congestion was low') || lower.includes('congestion was calm') || lower.includes('congestion is low')) {
    contextFeatures.portCongestion = 0.20;
  } else if (lower.includes('port congestion was high') || lower.includes('high port congestion') || lower.includes('congestion was high') || lower.includes('congestion is high')) {
    contextFeatures.portCongestion = 0.55;
  } else if (lower.includes('moderate port congestion')) {
    contextFeatures.portCongestion = 0.35;
  }

  // Weather Disruption
  if (lower.includes('storm') || lower.includes('weather disruption') || lower.includes('severe weather')) {
    contextFeatures.weatherDisruption = true;
  } else if (lower.includes('calm weather') || lower.includes('clear weather')) {
    contextFeatures.weatherDisruption = false;
  }

  // 4. Extract Observation & Outcome
  let delayDays = 0;
  let isSuccess = true;
  let stockoutOccurred = false;

  // Match "X days late"
  const delayMatch = lower.match(/(\d+(?:\.\d+)?)\s*days?\s*late/);
  if (delayMatch) {
    delayDays = parseFloat(delayMatch[1]);
    isSuccess = false;
  } else if (lower.includes('on time') || lower.includes('delivered on time') || lower.includes('successful')) {
    delayDays = 0;
    isSuccess = true;
  } else if (lower.includes('delayed') || lower.includes('late')) {
    delayDays = 3.0;
    isSuccess = false;
  }

  if (lower.includes('stockout') || delayDays >= 3.0) {
    stockoutOccurred = true;
  }

  // 5. Construct Summary, Interpretation, and Rule
  let title = '';
  let summary = '';
  let interpretation = '';
  let proposedChange = '';
  let rule = '';

  if (memoryType === 'EXPERIENCE') {
    title = `${targetEntity}: ${delayDays > 0 ? `${delayDays}d Delay Observed` : 'On-Time Delivery'}`;
    summary = `Observed event: ${targetEntity} ${delayDays > 0 ? `delivered ${delayDays} days late` : 'delivered on time'} under ${contextFeatures.demandVolatility && contextFeatures.demandVolatility > 0.3 ? 'HIGH' : 'LOW'} volatility and ${contextFeatures.portCongestion && contextFeatures.portCongestion > 0.3 ? 'HIGH' : 'LOW'} congestion.`;
    interpretation = delayDays > 0
      ? `${targetEntity} experienced operational throughput bottlenecks under market volatility conditions.`
      : `${targetEntity} maintained reliable fulfillment under market volatility conditions.`;
    proposedChange = delayDays > 0
      ? `Apply estimated delay adjustment (+${delayDays}d) for ${targetEntity} when demand volatility is high.`
      : `Reinforce reliability weighting for ${targetEntity} under high demand volatility.`;
    rule = `IF targetEntity == "${targetEntity}" AND demandVolatility > 0.35 THEN adjustDelay = +${delayDays}`;
  } else if (memoryType === 'PREFERENCE') {
    title = `Preference: Avoid Risk / Prioritize ${targetEntity}`;
    summary = rawText;
    interpretation = `User-expressed constraint or utility weighting.`;
    proposedChange = `Incorporate penalty modifier for disfavored pathways.`;
    rule = `APPLY_PREFERENCE: ${rawText}`;
  } else if (memoryType === 'FACT') {
    title = `Fact: Operational Parameter`;
    summary = rawText;
    interpretation = `User-provided ground truth constraint.`;
    proposedChange = `Update baseline parameter priors.`;
    rule = `SET_BASELINE: ${rawText}`;
  } else {
    title = `Hypothesis: ${targetEntity} Behavior`;
    summary = rawText;
    interpretation = `Unverified heuristic provided by user.`;
    proposedChange = `Observe upcoming outcomes to accumulate empirical evidence.`;
    rule = `HEURISTIC: ${rawText}`;
  }

  const result: ParsedTeachingResult = {
    isTeaching,
    rawText,
    memoryType,
    evidenceStatus,
    confidence: initialConfidence,
    title,
    summary,
    targetEntity,
    contextFeatures,
    observation: {
      delayDays,
      cost: 1200,
      stockoutOccurred,
      success: isSuccess,
      description: summary,
    },
    interpretation,
    proposedChange,
    rule,
    createExperienceRecord: (overrides = {}) => {
      const now = new Date().toISOString();
      const expId = `exp_user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const record: ExperienceRecord = {
        experienceId: expId,
        taskId: `USER_OBSERVATION_${Date.now()}`,
        taskFamily: 'SUPPLIER_SELECTION',
        context: {
          ...contextFeatures,
          targetEntity,
          rawText,
        },
        prediction: {
          predictedDelay: 2.0, // baseline expectation
          expectedUtility: 8800,
        },
        confidence: initialConfidence,
        predictionFeatures: {
          ...contextFeatures,
          targetEntity,
        },
        selectedAction: {
          actionType: targetEntity === 'Supplier Beta' ? 'SUPPLIER_BETA' : 'SUPPLIER_ALPHA',
          targetEntity,
          parameters: {},
        },
        expectedOutcome: {
          delayDays: 2.0,
          cost: 1200,
          netUtility: 8800,
        },
        actualOutcome: {
          delayDays: delayDays,
          cost: 1200,
          stockoutOccurred,
          netUtility: isSuccess ? 8800 : 8800 - (delayDays * 1200),
        },
        predictionError: {
          delayErrorDelta: delayDays - 2.0,
          normalizedError: Math.abs(delayDays - 2.0) / 4.0,
          brierLoss: isSuccess ? 0.05 : 0.55,
          direction: delayDays > 2.0 ? 'UNDERESTIMATED' : 'ACCURATE',
        },
        success: isSuccess,
        errorCause: {
          observedFact: summary,
          interpretation,
          identifiedDriver: contextFeatures.demandVolatility && contextFeatures.demandVolatility > 0.3 ? 'demandVolatility' : 'portCongestion',
        },
        lesson: {
          observedFact: summary,
          interpretation,
          proposedChange,
          confidence: initialConfidence,
          rule,
          targetFeature: 'estimatedDelay',
          adjustmentWeight: delayDays,
        },
        applicableConditions: {
          taskFamily: 'SUPPLIER_SELECTION',
          featureConstraints: {
            ...(contextFeatures.demandVolatility !== undefined ? { demandVolatility: { min: contextFeatures.demandVolatility - 0.15 } } : {}),
            ...(contextFeatures.portCongestion !== undefined ? { portCongestion: { max: contextFeatures.portCongestion + 0.15 } } : {}),
          },
        },
        createdAt: now,
        sourceExperimentId: 'USER_TAUGHT',
        memoryType,
        source: 'USER_TAUGHT',
        targetEntity,
        evidenceStatus,
        supportingEvidenceCount: isSuccess ? 0 : 1,
        contradictingEvidenceCount: isSuccess ? 1 : 0,
        userTeachingRawText: rawText,
        ...overrides,
      };

      return record;
    },
  };

  return result;
}
