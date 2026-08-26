import React, { useState, useEffect, useRef } from 'react';
import { 
  createInitialCognitiveSystem, 
  executeFullCognitiveCycle, 
  CognitiveSystemState 
} from './cognitive/engine';
import { runSandboxExperiment } from './cognitive/selfImprovement';
import { Header } from './components/Header';
import { CognitiveCycleFlow } from './components/CognitiveCycleFlow';
import { WorldModelView } from './components/WorldModelView';
import { PredictionView } from './components/PredictionView';
import { MemoryView } from './components/MemoryView';
import { EnvironmentView } from './components/EnvironmentView';
import { LearningView } from './components/LearningView';
import { MetacognitionView } from './components/MetacognitionView';
import { ObservabilityTrace } from './components/ObservabilityTrace';
import { DeepReasoningModal } from './components/DeepReasoningModal';
import { 
  Globe, 
  TrendingUp, 
  Database, 
  Building2, 
  GraduationCap, 
  HelpCircle, 
  Terminal,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<CognitiveSystemState>(() => createInitialCognitiveSystem());
  const [activeNavTab, setActiveNavTab] = useState<
    'PIPELINE' | 'WORLD_MODEL' | 'PREDICTION' | 'MEMORY' | 'ENVIRONMENT' | 'LEARNING' | 'METACOGNITION' | 'TRACES'
  >('PIPELINE');
  const [isDeepReasoningOpen, setIsDeepReasoningOpen] = useState<boolean>(false);

  // Autonomous cognitive loop timer
  const autonomousRef = useRef<boolean>(state.isRunningAutonomous);
  autonomousRef.current = state.isRunningAutonomous;
  const intervalRef = useRef<number>(state.cycleIntervalMs);
  intervalRef.current = state.cycleIntervalMs;

  useEffect(() => {
    let timer: any = null;
    if (state.isRunningAutonomous) {
      timer = setInterval(() => {
        setState(prevState => executeFullCognitiveCycle(prevState));
      }, state.cycleIntervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isRunningAutonomous, state.cycleIntervalMs]);

  const handleStepCycle = () => {
    setState(prevState => executeFullCognitiveCycle(prevState));
  };

  const handleToggleAutonomous = () => {
    setState(prevState => ({
      ...prevState,
      isRunningAutonomous: !prevState.isRunningAutonomous
    }));
  };

  const handleReset = () => {
    setState(createInitialCognitiveSystem());
  };

  const handleChangeInterval = (ms: number) => {
    setState(prevState => ({
      ...prevState,
      cycleIntervalMs: ms
    }));
  };

  const handleUpdateEnvironment = (updated: any) => {
    setState(prevState => ({
      ...prevState,
      environment: {
        ...prevState.environment,
        ...updated
      }
    }));
  };

  const handleRunExperimentSandbox = (exp: any) => {
    const latestAccuracy = state.overallAccuracyHistory.length > 0 
      ? state.overallAccuracyHistory[state.overallAccuracyHistory.length - 1].accuracy 
      : 0.75;
    const updatedExp = runSandboxExperiment(exp, latestAccuracy);
    setState(prevState => ({
      ...prevState,
      experiments: prevState.experiments.map(e => e.id === exp.id ? updatedExp : e)
    }));
  };

  const handleRollbackExperiment = (expId: string) => {
    setState(prevState => ({
      ...prevState,
      experiments: prevState.experiments.map(e => e.id === expId ? { ...e, status: 'ROLLED_BACK' as const } : e)
    }));
  };

  const handleApplyInsights = (insights: string[], newConcepts: Array<{ name: string; description: string }>) => {
    setState(prevState => {
      const updatedSemantic = [...prevState.memorySystem.semanticMemory];
      insights.forEach((ins, idx) => {
        updatedSemantic.push({
          id: `sem_gemini_${Date.now()}_${idx}`,
          domain: 'Deep Inductive Synthesis',
          invariantRule: ins,
          confidence: 0.94,
          supportingEpisodeIds: prevState.memorySystem.episodicMemory.slice(-2).map(e => e.id),
          generalityScore: 0.90,
          applicabilityConditions: ['Synthesized via Gemini Inductive Core']
        });
      });

      return {
        ...prevState,
        memorySystem: {
          ...prevState.memorySystem,
          semanticMemory: updatedSemantic
        }
      };
    });
  };

  const currentAccuracy = state.overallAccuracyHistory.length > 0 
    ? state.overallAccuracyHistory[state.overallAccuracyHistory.length - 1].accuracy 
    : 0.70;

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 flex flex-col font-sans relative selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      {/* Immersive Cyber Atmosphere Glowing Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-cyber-grid opacity-60" />
      </div>

      {/* Top Navigation & Controls Header */}
      <Header
        currentCycle={state.currentCycle}
        currentPhase={state.currentPhase}
        isRunningAutonomous={state.isRunningAutonomous}
        cycleIntervalMs={state.cycleIntervalMs}
        accuracy={currentAccuracy}
        onToggleAutonomous={handleToggleAutonomous}
        onStepCycle={handleStepCycle}
        onReset={handleReset}
        onChangeInterval={handleChangeInterval}
        onOpenDeepReasoning={() => setIsDeepReasoningOpen(true)}
      />

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 relative z-10">
        
        {/* Master Cycle Visual Flow Pipeline (Always visible) */}
        <CognitiveCycleFlow
          activeTrace={state.activeTrace}
          currentCycle={state.currentCycle}
        />

        {/* View Selection Navigation Bar */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1.5 p-1 bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-xl text-xs shadow-lg">
          <button
            id="nav-tab-overview"
            onClick={() => setActiveNavTab('PIPELINE')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'PIPELINE' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview & Dashboard</span>
          </button>

          <button
            id="nav-tab-world-model"
            onClick={() => setActiveNavTab('WORLD_MODEL')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'WORLD_MODEL' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Model & Causal DAG</span>
          </button>

          <button
            id="nav-tab-prediction"
            onClick={() => setActiveNavTab('PREDICTION')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'PREDICTION' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Multi-Step Prediction & Sim</span>
          </button>

          <button
            id="nav-tab-memory"
            onClick={() => setActiveNavTab('MEMORY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'MEMORY' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Multi-Layer Memory</span>
          </button>

          <button
            id="nav-tab-environment"
            onClick={() => setActiveNavTab('ENVIRONMENT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'ENVIRONMENT' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Environment Sandbox</span>
          </button>

          <button
            id="nav-tab-learning"
            onClick={() => setActiveNavTab('LEARNING')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'LEARNING' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Learning & Error Feedback</span>
          </button>

          <button
            id="nav-tab-metacognition"
            onClick={() => setActiveNavTab('METACOGNITION')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'METACOGNITION' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Metacognition & Self-Improvement</span>
          </button>

          <button
            id="nav-tab-traces"
            onClick={() => setActiveNavTab('TRACES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeNavTab === 'TRACES' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit Traces</span>
          </button>
        </nav>

        {/* Tab Content Panes */}
        {activeNavTab === 'PIPELINE' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <EnvironmentView
                environment={state.environment}
                onUpdateEnvironment={handleUpdateEnvironment}
              />
              <PredictionView
                prediction={state.activeTrace?.prediction || null}
                worldModel={state.worldModel}
                environment={state.environment}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <LearningView
                learningEvents={state.traces.flatMap(t => t.learningEvents)}
                latestError={state.activeTrace?.predictionError || null}
                accuracyHistory={state.overallAccuracyHistory}
              />
              <MetacognitionView
                metacognition={state.activeTrace?.metacognition || null}
                experiments={state.experiments}
                currentAccuracy={currentAccuracy}
                onRunExperimentSandbox={handleRunExperimentSandbox}
                onRollbackExperiment={handleRollbackExperiment}
              />
            </div>
          </div>
        )}

        {activeNavTab === 'WORLD_MODEL' && (
          <WorldModelView worldModel={state.worldModel} />
        )}

        {activeNavTab === 'PREDICTION' && (
          <PredictionView
            prediction={state.activeTrace?.prediction || null}
            worldModel={state.worldModel}
            environment={state.environment}
          />
        )}

        {activeNavTab === 'MEMORY' && (
          <MemoryView memorySystem={state.memorySystem} />
        )}

        {activeNavTab === 'ENVIRONMENT' && (
          <EnvironmentView
            environment={state.environment}
            onUpdateEnvironment={handleUpdateEnvironment}
          />
        )}

        {activeNavTab === 'LEARNING' && (
          <LearningView
            learningEvents={state.traces.flatMap(t => t.learningEvents)}
            latestError={state.activeTrace?.predictionError || null}
            accuracyHistory={state.overallAccuracyHistory}
          />
        )}

        {activeNavTab === 'METACOGNITION' && (
          <MetacognitionView
            metacognition={state.activeTrace?.metacognition || null}
            experiments={state.experiments}
            currentAccuracy={currentAccuracy}
            onRunExperimentSandbox={handleRunExperimentSandbox}
            onRollbackExperiment={handleRollbackExperiment}
          />
        )}

        {activeNavTab === 'TRACES' && (
          <ObservabilityTrace traces={state.traces} />
        )}

      </main>

      {/* Immersive Control Deck Status Footer */}
      <footer className="mt-auto border-t border-white/[0.06] bg-[#03060c]/90 backdrop-blur-md px-4 py-2.5 text-[11px] text-slate-400 font-mono flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            SYS_ONLINE: ACTIVE
          </span>
          <span className="text-slate-500">|</span>
          <span>LATENCY: <strong className="text-slate-300">12ms</strong></span>
          <span className="text-slate-500">|</span>
          <span>TELEMETRY_RATE: <strong className="text-slate-300">{(1000 / state.cycleIntervalMs).toFixed(1)} Hz</strong></span>
          <span className="text-slate-500">|</span>
          <span>EPISTEMIC_CERTAINTY: <strong className="text-emerald-400 font-semibold">{(currentAccuracy * 100).toFixed(0)}%</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-semibold">AETHERIS COGNITIVE ENGINE v3.4.1</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-slate-400">CLEARANCE: ALPHA</span>
        </div>
      </footer>

      {/* Deep Reasoning & Synthesis Modal (Gemini API Hybrid Component) */}
      <DeepReasoningModal
        isOpen={isDeepReasoningOpen}
        onClose={() => setIsDeepReasoningOpen(false)}
        worldModel={state.worldModel}
        memorySystem={state.memorySystem}
        onApplyInsights={handleApplyInsights}
      />
    </div>
  );
}
