/**
 * User Profile and Personal Aetheris state types.
 */

export interface UserProfile {
  name: string; // e.g. "Aria", "Nova", "My Aetheris"
  userName?: string;
  domains: string[]; // ['Business', 'Work', 'Study', 'Research', 'Personal', 'Custom']
  contextDescription: string;
  createdAt: string;
  isOnboarded: boolean;
}

export type MemoryCategory = 'ALL' | 'EXPERIENCES' | 'FACTS' | 'LESSONS' | 'PREFERENCES' | 'SKILLS';

export type MemorySourceType = 'TAUGHT_BY_YOU' | 'OBSERVED' | 'INFERRED' | 'LEARNED';

export interface UserFriendlyMemoryItem {
  id: string;
  title: string;
  description: string;
  category: MemoryCategory;
  source: MemorySourceType;
  confidence: number; // 0.0 to 1.0
  evidenceCount?: number;
  createdAt: string;
  timesUsed?: number;
  timesInfluenced?: number;
  
  // Detailed metadata
  details?: {
    whatHappened?: {
      expected?: string;
      actual?: string;
      predictionError?: string;
    };
    whatLearned?: string;
    whyBelieveThis?: string;
    evidenceEpisodes?: string[];
    applicableConditions?: string;
    userCorrectionHistory?: Array<{
      correctedAt: string;
      previousValue: string;
      newValue: string;
      userNote: string;
    }>;
  };
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeString: string;
  type: 'TEACH' | 'MEMORY_CREATED' | 'PREDICTION' | 'OUTCOME' | 'ERROR' | 'LESSON' | 'RETRIEVAL' | 'DECISION';
  title: string;
  description: string;
  details?: Record<string, any>;
  iconType?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aetheris';
  timestamp: string;
  text: string;
  
  // Structured cards inside chat
  teachingCard?: {
    proposedFact: string;
    category: MemoryCategory;
    memoryType?: 'EXPERIENCE' | 'FACT' | 'PREFERENCE' | 'HYPOTHESIS_OR_RULE' | 'LESSON';
    evidenceStatus?: string;
    confidence?: number;
    status: 'PENDING' | 'SAVED' | 'CORRECTED';
    rawText?: string;
  };
  
  decisionCard?: {
    query: string;
    recommendedAction: string;
    reasoningSummary: string;
    confidence: number;
    expectedOutcome: string;
    retrievedMemoryNote?: string;
    retrievedMemories?: Array<{
      id: string;
      lesson: string;
      relevance: number;
      confidence: number;
      source: string;
      influencedPrediction: boolean;
      influenceMagnitude?: number;
      affectedVariable?: string;
      supportingCount?: number;
      contradictingCount?: number;
    }>;
    causalSummary?: {
      baselineAction: string;
      baselineUtility: number;
      chosenAction: string;
      chosenUtility: number;
      decisionChanged: boolean;
      delayDeltaDays: number;
      utilityDelta: number;
    };
    decisionTraceId?: string;
  };
}

export type AppNavTab = 'HOME' | 'CHAT' | 'MEMORY' | 'LEARNING' | 'ACTIVITY' | 'EXPERIMENTS' | 'SETTINGS';
export type AppMode = 'SIMPLE' | 'EXPERT';
