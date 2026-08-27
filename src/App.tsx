import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  createInitialCognitiveSystem,
  executeFullCognitiveCycle,
  CognitiveSystemState,
} from './cognitive/engine';
import { runSandboxExperiment } from './cognitive/selfImprovement';
import { DeepReasoningModal } from './components/DeepReasoningModal';
import {
  evaluateCognitiveDecision,
  createDefaultExperienceStore,
  CognitiveDecisionTrace,
} from './cognitive/chatDecisionEngine';
import { ExperienceStore, ExperienceRecord } from './cognitive/experienceStore';
import { LocalStorageAdapter } from './cognitive/persistence';
import { parseUserTeaching, detectTeachingIntent } from './cognitive/teachingParser';

// Redesigned User-Friendly Components
import { FirstTimeExperience } from './components/FirstTimeExperience';
import { AppHeader } from './components/AppHeader';
import { HomeDashboard } from './components/HomeDashboard';
import { ChatView } from './components/ChatView';
import { UserMemoryView } from './components/UserMemoryView';
import { MemoryDetailModal } from './components/MemoryDetailModal';
import { UserLearningView } from './components/UserLearningView';
import { DecisionExplanationModal, DecisionExplanationData } from './components/DecisionExplanationModal';
import { ActivityTimelineView } from './components/ActivityTimelineView';
import { UserExperimentsView } from './components/UserExperimentsView';
import { SettingsView } from './components/SettingsView';
import { ExpertModeView } from './components/ExpertModeView';

// State Types
import {
  UserProfile,
  UserFriendlyMemoryItem,
  ActivityEvent,
  ChatMessage,
  AppNavTab,
  AppMode,
} from './types/userState';

export default function App() {
  // 1. Cognitive Engine Core State
  const [state, setState] = useState<CognitiveSystemState>(() => createInitialCognitiveSystem());

  // 2. User Profile / Personal Aetheris State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aetheris_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: 'ARIA',
      domains: ['Business', 'Work'],
      contextDescription:
        'Managing supplier selection and inventory logistics. High port congestion causes unexpected maritime delivery delays.',
      createdAt: new Date().toISOString(),
      isOnboarded: false,
    };
  });

  // 3. Navigation & Mode
  const [activeTab, setActiveTab] = useState<AppNavTab>('HOME');
  const [appMode, setAppMode] = useState<AppMode>('SIMPLE');

  // 4. Modals State
  const [selectedMemoryDetail, setSelectedMemoryDetail] = useState<UserFriendlyMemoryItem | null>(null);
  const [decisionExplanationData, setDecisionExplanationData] = useState<DecisionExplanationData | null>(null);
  const [isDeepReasoningOpen, setIsDeepReasoningOpen] = useState<boolean>(false);

  // 5. Cognitive Experience Store (Single source of truth with LocalStorage persistence)
  const [experienceStoreRevision, setExperienceStoreRevision] = useState<number>(0);
  const experienceStoreRef = useRef<ExperienceStore | null>(null);
  if (!experienceStoreRef.current) {
    experienceStoreRef.current = createDefaultExperienceStore(
      'aria_live_store',
      new LocalStorageAdapter<ExperienceRecord[]>('aetheris_cognitive_experiences')
    );
  }
  const decisionTracesRef = useRef<Map<string, CognitiveDecisionTrace>>(new Map());

  // 6. User Chat History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'aetheris',
      timestamp: '10:00 AM',
      text: `Hello! I'm ${userProfile.name}. I'm ready to learn from your experiences and help you make better decisions under uncertainty.`,
    },
  ]);

  // 7. Activity History (Derived from traces & user actions)
  const [userActivityEvents, setUserActivityEvents] = useState<ActivityEvent[]>([
    {
      id: 'act_init',
      timestamp: new Date().toISOString(),
      timeString: '10:00 AM',
      type: 'MEMORY_CREATED',
      title: 'Aetheris workspace initialized',
      description: `Personal learning environment configured for ${userProfile.domains.join(', ')}.`,
    },
  ]);

  // Save user profile changes to local storage
  useEffect(() => {
    localStorage.setItem('aetheris_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Autonomous cognitive loop timer (Expert mode or background)
  useEffect(() => {
    let timer: any = null;
    if (state.isRunningAutonomous) {
      timer = setInterval(() => {
        setState((prevState) => executeFullCognitiveCycle(prevState));
      }, state.cycleIntervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isRunningAutonomous, state.cycleIntervalMs]);

  // Handle autonomous step
  const handleStepCycle = () => {
    setState((prevState) => {
      const next = executeFullCognitiveCycle(prevState);
      // Append an activity event for the cycle
      if (next.activeTrace) {
        const hasHighError = next.activeTrace.predictionError && next.activeTrace.predictionError.overallNormalizedError > 0.3;
        setUserActivityEvents((prev) => [
          {
            id: `act_${Date.now()}`,
            timestamp: new Date().toISOString(),
            timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: hasHighError ? 'ERROR' : 'DECISION',
            title: `Executed cycle #${next.currentCycle}`,
            description: `Chosen action: ${next.activeTrace?.plan?.selectedAction?.title || 'Evaluated step'}. Prediction error: ${(next.activeTrace?.predictionError?.overallNormalizedError || 0).toFixed(2)}`,
          },
          ...prev.slice(0, 49),
        ]);
      }
      return next;
    });
  };

  const handleToggleAutonomous = () => {
    setState((prevState) => ({
      ...prevState,
      isRunningAutonomous: !prevState.isRunningAutonomous,
    }));
  };

  const handleChangeInterval = (ms: number) => {
    setState((prevState) => ({
      ...prevState,
      cycleIntervalMs: ms,
    }));
  };

  const handleUpdateEnvironment = (updated: any) => {
    setState((prevState) => ({
      ...prevState,
      environment: {
        ...prevState.environment,
        ...updated,
      },
    }));
  };

  // Convert raw system state & ExperienceStore into unified UserFriendlyMemoryItem list
  const unifiedMemories = useMemo<UserFriendlyMemoryItem[]>(() => {
    const list: UserFriendlyMemoryItem[] = [];
    const store = experienceStoreRef.current;

    // 1. Experiences and Taught Rules from ExperienceStore (Single Source of Truth)
    if (store) {
      const allExperiences = store.getAllExperiences();
      allExperiences.forEach((exp) => {
        const isUserTaught = exp.source === 'USER_TAUGHT';
        const title = exp.lesson?.observedFact || exp.errorCause?.observedFact || `Observation #${exp.taskId}`;
        const desc = exp.lesson?.rule || exp.lesson?.interpretation || exp.errorCause?.interpretation || 'Empirical execution record';

        list.push({
          id: exp.experienceId,
          title: title.slice(0, 60) + (title.length > 60 ? '...' : ''),
          description: desc,
          category:
            exp.memoryType === 'PREFERENCE'
              ? 'PREFERENCES'
              : exp.memoryType === 'LESSON' || exp.memoryType === 'HYPOTHESIS_OR_RULE'
              ? 'LESSONS'
              : exp.memoryType === 'FACT'
              ? 'FACTS'
              : 'EXPERIENCES',
          source: isUserTaught ? 'TAUGHT_BY_YOU' : 'OBSERVED',
          confidence: exp.lesson?.confidence || exp.confidence || 0.85,
          evidenceCount: (exp.supportingEvidenceCount ?? 1) + (exp.contradictingEvidenceCount ?? 0),
          createdAt: exp.createdAt || new Date().toISOString(),
          timesUsed: isUserTaught ? 3 : 5,
          timesInfluenced: isUserTaught ? 2 : 4,
          details: {
            whatHappened: exp.actualOutcome
              ? {
                  expected: `Delay: ${exp.expectedOutcome?.delayDays?.toFixed(1) || 0}d, Cost: $${(exp.expectedOutcome?.cost || 0).toLocaleString()}`,
                  actual: `Delay: ${exp.actualOutcome?.delayDays?.toFixed(1) || 0}d, Cost: $${(exp.actualOutcome?.cost || 0).toLocaleString()}`,
                  predictionError: exp.predictionError ? `Normalized Error: ${(exp.predictionError.normalizedError || 0).toFixed(2)}` : undefined,
                }
              : undefined,
            whatLearned: desc,
            whyBelieveThis: isUserTaught
              ? `Taught directly by user (Evidence Status: ${exp.evidenceStatus || 'USER_HYPOTHESIS'}).`
              : `Empirically observed in experiment ${exp.sourceExperimentId || 'baseline'}.`,
            applicableConditions: exp.applicableConditions?.featureConstraints
              ? Object.entries(exp.applicableConditions.featureConstraints)
                  .map(([k, v]) => `${k} ≥ ${(v as any).min}`)
                  .join('; ')
              : undefined,
          },
        });
      });
    }

    // 2. Semantic Memory Rules (Autonomous engine synthesis)
    (state.memorySystem?.semanticMemory || []).forEach((sem) => {
      const ruleText = sem.invariantRule || '';
      if (!list.some((item) => item.description === ruleText)) {
        list.push({
          id: sem.id || `sem_${Math.random().toString(36).slice(2, 7)}`,
          title: ruleText.slice(0, 60) + (ruleText.length > 60 ? '...' : ''),
          description: ruleText,
          category: 'LESSONS',
          source: 'LEARNED',
          confidence: sem.confidence ?? 0.85,
          evidenceCount: sem.supportingEpisodeIds?.length || 1,
          createdAt: new Date().toISOString(),
          timesUsed: 6,
          timesInfluenced: 4,
          details: {
            whatLearned: ruleText,
            whyBelieveThis: `Synthesized across ${sem.supportingEpisodeIds?.length || 1} empirical episodes with generality rating of ${((sem.generalityScore ?? 0.9) * 100).toFixed(0)}%.`,
            applicableConditions: (sem.applicabilityConditions || []).join('; '),
          },
        });
      }
    });

    return list;
  }, [experienceStoreRevision, state.memorySystem, state.worldModel]);

  // Lessons list
  const activeLessons = useMemo(() => {
    return unifiedMemories.filter((m) => m.category === 'LESSONS' || m.source === 'LEARNED');
  }, [unifiedMemories]);

  // Calibration / Progress % derived from real accuracy history
  const learningProgressPct = useMemo(() => {
    if (state.overallAccuracyHistory.length === 0) return 72;
    const latest = state.overallAccuracyHistory[state.overallAccuracyHistory.length - 1];
    return Math.round(latest.accuracy * 100);
  }, [state.overallAccuracyHistory]);

  // Learning Status
  const learningStatus = useMemo<'NORMAL' | 'LIMITED_EVIDENCE' | 'LOW_CONFIDENCE'>(() => {
    if (activeLessons.length === 0) return 'LIMITED_EVIDENCE';
    if (learningProgressPct < 50) return 'LOW_CONFIDENCE';
    return 'NORMAL';
  }, [activeLessons, learningProgressPct]);

  // ----------------------------------------------------
  // Chat Handlers (Teaching & Decisions)
  // ----------------------------------------------------

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    const isTeaching = detectTeachingIntent(text);
    const lower = text.toLowerCase();
    const isDecisionRequest =
      lower.includes('help me decide') ||
      lower.includes('which supplier') ||
      lower.includes('freight option') ||
      lower.includes('choose') ||
      lower.includes('decision') ||
      lower.includes('should i pick') ||
      lower.includes('recommend');

    setTimeout(() => {
      if (isTeaching) {
        const parsed = parseUserTeaching(text);

        const responseMsg: ChatMessage = {
          id: `msg_resp_${Date.now()}`,
          sender: 'aetheris',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I understood this as a new **${parsed.memoryType}** memory (${parsed.evidenceStatus.replace(/_/g, ' ')}). Please verify below to save it into my persistent experience store.`,
          teachingCard: {
            proposedFact: parsed.proposedFact,
            category: parsed.category,
            memoryType: parsed.memoryType,
            evidenceStatus: parsed.evidenceStatus,
            confidence: parsed.confidence,
            status: 'PENDING',
            rawText: text,
          },
        };
        setChatMessages((prev) => [...prev, responseMsg]);
      } else if (isDecisionRequest) {
        // Execute real cognitive evaluation through cognitive engine
        const decisionTrace = evaluateCognitiveDecision({
          query: text,
          environmentState: state.environment,
          experienceStore: experienceStoreRef.current!,
        });

        // Store execution trace for transparent inspection
        decisionTracesRef.current.set(decisionTrace.traceId, decisionTrace);

        const responseMsg: ChatMessage = {
          id: `msg_resp_${Date.now()}`,
          sender: 'aetheris',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I've evaluated your decision using the cognitive engine, querying retrieved experiences from memory and calculating expected utility.`,
          decisionCard: {
            query: text,
            recommendedAction: decisionTrace.experienceInformed.selectedActionLabel,
            reasoningSummary: decisionTrace.explanationData.finalDecisionReasoning,
            confidence: decisionTrace.experienceInformed.confidence,
            expectedOutcome: decisionTrace.explanationData.prediction.expectedCostOrDelay,
            retrievedMemories: decisionTrace.retrievedMemories.map((m) => ({
              id: m.id,
              lesson: m.title + (m.lessonSnippet ? ` — ${m.lessonSnippet}` : ''),
              relevance: m.relevanceScore,
              confidence: m.confidence,
              source: m.source,
              influencedPrediction: m.influencedPrediction,
              influenceMagnitude: m.influenceMagnitude,
              affectedVariable: m.affectedVariable,
              supportingCount: m.supportingCount,
              contradictingCount: m.contradictingCount,
            })),
            causalSummary: {
              baselineAction: decisionTrace.baseline.selectedActionLabel,
              baselineUtility: decisionTrace.baseline.expectedUtility,
              chosenAction: decisionTrace.experienceInformed.selectedActionLabel,
              chosenUtility: decisionTrace.experienceInformed.expectedUtility,
              decisionChanged: decisionTrace.causalDelta.decisionChanged,
              delayDeltaDays: decisionTrace.causalDelta.delayDeltaDays,
              utilityDelta: decisionTrace.causalDelta.utilityDelta,
            },
            decisionTraceId: decisionTrace.traceId,
          },
        };
        setChatMessages((prev) => [...prev, responseMsg]);
      } else {
        // General conversational response with factual grounding
        const responseMsg: ChatMessage = {
          id: `msg_resp_${Date.now()}`,
          sender: 'aetheris',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I'm currently tracking ${unifiedMemories.length} memories in my experience store. You can teach me operational rules (e.g. "Remember that Supplier Alpha took 4 days under port congestion") or ask me to evaluate supplier and freight decisions.`,
        };
        setChatMessages((prev) => [...prev, responseMsg]);
      }
    }, 400);
  };

  const handleSaveProposedMemory = (messageId: string, memoryText: string) => {
    // 1. Update message status in chat
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.teachingCard
          ? { ...msg, teachingCard: { ...msg.teachingCard, status: 'SAVED' } }
          : msg
      )
    );

    // 2. Parse and add to persistent ExperienceStore
    const parsed = parseUserTeaching(memoryText);
    experienceStoreRef.current?.addExperience(parsed.experienceRecord);
    setExperienceStoreRevision((v) => v + 1);

    // 3. Log Activity
    setUserActivityEvents((prev) => [
      {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'TEACH',
        title: `You taught ${userProfile.name} a new ${parsed.memoryType} memory`,
        description: `Saved to ExperienceStore: "${memoryText}"`,
      },
      ...prev,
    ]);
  };

  const handleCorrectProposedMemory = (messageId: string, correctedText: string) => {
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.teachingCard
          ? {
              ...msg,
              teachingCard: {
                ...msg.teachingCard,
                proposedFact: correctedText,
                status: 'CORRECTED',
              },
            }
          : msg
      )
    );

    const parsed = parseUserTeaching(correctedText);
    parsed.experienceRecord.confidence = 0.98;
    experienceStoreRef.current?.addExperience(parsed.experienceRecord);
    setExperienceStoreRevision((v) => v + 1);

    setUserActivityEvents((prev) => [
      {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'TEACH',
        title: 'Memory updated with your refined correction',
        description: `Saved to ExperienceStore: "${correctedText}"`,
      },
      ...prev,
    ]);
  };

  // ----------------------------------------------------
  // Memory Correction & Forgetting
  // ----------------------------------------------------

  const handleCorrectExistingMemory = (memoryId: string, correctedText: string, note: string) => {
    const store = experienceStoreRef.current;
    if (store) {
      store.updateExperience(memoryId, (prev) => {
        return {
          ...prev,
          lesson: prev.lesson
            ? {
                ...prev.lesson,
                observedFact: correctedText,
                rule: correctedText,
              }
            : undefined,
          errorCause: prev.errorCause
            ? {
                ...prev.errorCause,
                observedFact: correctedText,
              }
            : undefined,
        };
      });
      setExperienceStoreRevision((v) => v + 1);
    }

    setUserActivityEvents((prev) => [
      {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'TEACH',
        title: 'Memory updated with your correction',
        description: `Corrected: "${correctedText}"`,
      },
      ...prev,
    ]);
  };

  const handleForgetMemory = (memoryId: string) => {
    experienceStoreRef.current?.removeExperience(memoryId);
    setExperienceStoreRevision((v) => v + 1);
    setSelectedMemoryDetail(null);

    setUserActivityEvents((prev) => [
      {
        id: `act_${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'MEMORY_CREATED',
        title: 'Memory forgotten',
        description: `Memory record #${memoryId.slice(-6)} was purged from ExperienceStore.`,
      },
      ...prev,
    ]);
  };

  // ----------------------------------------------------
  // Decision "Why Did You Choose That?" Modal Trigger
  // ----------------------------------------------------

  const handleOpenWhyModal = (traceId?: string, query?: string) => {
    let trace: CognitiveDecisionTrace | undefined;
    if (traceId && decisionTracesRef.current.has(traceId)) {
      trace = decisionTracesRef.current.get(traceId);
    }

    if (!trace) {
      trace = evaluateCognitiveDecision({
        query: query || 'Supplier & Freight Logistics Decision under Port Congestion',
        environmentState: state.environment,
        experienceStore: experienceStoreRef.current!,
      });
      decisionTracesRef.current.set(trace.traceId, trace);
    }

    setDecisionExplanationData(trace.explanationData);
  };

  // ----------------------------------------------------
  // Onboarding Screen vs Main App
  // ----------------------------------------------------

  if (!userProfile.isOnboarded) {
    return (
      <FirstTimeExperience
        onCompleteOnboarding={(newProfile) => {
          setUserProfile(newProfile);
          // Insert initial context as first taught memory into ExperienceStore
          if (newProfile.contextDescription) {
            const parsed = parseUserTeaching(newProfile.contextDescription);
            experienceStoreRef.current?.addExperience(parsed.experienceRecord);
            setExperienceStoreRevision((v) => v + 1);
          }
        }}
        onSkipToDefault={() => {
          setUserProfile((prev) => ({ ...prev, isOnboarded: true }));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <AppHeader
        userProfile={userProfile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mode={appMode}
        onToggleMode={setAppMode}
        learningStatus={learningStatus}
        memoryCount={unifiedMemories.length}
        lessonCount={activeLessons.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If Expert Mode is Active */}
        {appMode === 'EXPERT' ? (
          <ExpertModeView
            systemState={state}
            onStepCycle={handleStepCycle}
            onToggleAutonomous={handleToggleAutonomous}
            onIntervalChange={handleChangeInterval}
            onOpenDeepReasoning={() => setIsDeepReasoningOpen(true)}
            onUpdateEnvironment={handleUpdateEnvironment}
          />
        ) : (
          /* Simple Mode Tabs */
          <>
            {activeTab === 'HOME' && (
              <HomeDashboard
                userProfile={userProfile}
                totalMemoriesCount={unifiedMemories.length}
                totalLessonsCount={activeLessons.length}
                totalBehaviorsCount={4}
                learningProgressPct={learningProgressPct}
                recentLessons={activeLessons}
                recentActivities={userActivityEvents}
                onNavigate={setActiveTab}
                onOpenLessonDetail={setSelectedMemoryDetail}
                onOpenWhyModal={() => handleOpenWhyModal()}
              />
            )}

            {activeTab === 'CHAT' && (
              <ChatView
                userProfile={userProfile}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onSaveProposedMemory={handleSaveProposedMemory}
                onCorrectProposedMemory={handleCorrectProposedMemory}
                onOpenWhyModal={handleOpenWhyModal}
                onOpenMemoryDetailById={(id) => {
                  const m = unifiedMemories.find((item) => item.id === id);
                  if (m) setSelectedMemoryDetail(m);
                }}
              />
            )}

            {activeTab === 'MEMORY' && (
              <UserMemoryView
                userProfile={userProfile}
                memories={unifiedMemories}
                onSelectMemory={setSelectedMemoryDetail}
                onNavigateToChat={() => setActiveTab('CHAT')}
                onForgetMemory={handleForgetMemory}
              />
            )}

            {activeTab === 'LEARNING' && (
              <UserLearningView
                userProfile={userProfile}
                lessons={activeLessons}
                onOpenWhyModal={() => handleOpenWhyModal()}
                onOpenLessonDetail={setSelectedMemoryDetail}
              />
            )}

            {activeTab === 'ACTIVITY' && (
              <ActivityTimelineView
                userProfile={userProfile}
                activities={userActivityEvents}
              />
            )}

            {activeTab === 'EXPERIMENTS' && (
              <UserExperimentsView userProfile={userProfile} />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsView
                userProfile={userProfile}
                onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
                onClearUserMemory={() => {
                  experienceStoreRef.current?.clear();
                  setExperienceStoreRevision((v) => v + 1);
                  setUserActivityEvents([]);
                }}
                onResetToDefault={() => {
                  setUserProfile((prev) => ({ ...prev, isOnboarded: false }));
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      {selectedMemoryDetail && (
        <MemoryDetailModal
          memory={selectedMemoryDetail}
          onClose={() => setSelectedMemoryDetail(null)}
          onCorrectMemory={handleCorrectExistingMemory}
          onForgetMemory={handleForgetMemory}
        />
      )}

      {decisionExplanationData && (
        <DecisionExplanationModal
          data={decisionExplanationData}
          onClose={() => setDecisionExplanationData(null)}
        />
      )}

      {isDeepReasoningOpen && (
        <DeepReasoningModal
          isOpen={isDeepReasoningOpen}
          onClose={() => setIsDeepReasoningOpen(false)}
          worldModel={state.worldModel}
          memorySystem={state.memorySystem}
          onApplyInsights={(insights, newConcepts) => {
            setState((prevState) => {
              const updatedSemantic = [...(prevState.memorySystem?.semanticMemory || [])];
              insights.forEach((ins, idx) => {
                updatedSemantic.push({
                  id: `sem_gemini_${Date.now()}_${idx}`,
                  domain: 'Deep Inductive Synthesis',
                  invariantRule: ins,
                  confidence: 0.94,
                  supportingEpisodeIds: (prevState.memorySystem?.episodicMemory || []).slice(-2).map((e) => e.id),
                  generalityScore: 0.90,
                  applicabilityConditions: ['Synthesized via Gemini Inductive Core'],
                });
              });

              return {
                ...prevState,
                memorySystem: {
                  ...prevState.memorySystem,
                  semanticMemory: updatedSemantic,
                },
              };
            });
            setIsDeepReasoningOpen(false);
          }}
        />
      )}
    </div>
  );
}
