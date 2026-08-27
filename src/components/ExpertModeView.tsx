import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Globe,
  Brain,
  Sliders,
  TrendingUp,
  Cpu,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { CognitiveSystemState } from '../cognitive/engine';
import { CognitiveCycleFlow } from './CognitiveCycleFlow';
import { WorldModelView } from './WorldModelView';
import { PredictionView } from './PredictionView';
import { MemoryView } from './MemoryView';
import { EnvironmentView } from './EnvironmentView';
import { LearningView } from './LearningView';
import { MetacognitionView } from './MetacognitionView';
import { ObservabilityTrace } from './ObservabilityTrace';
import { KnowledgeFoundationView } from './KnowledgeFoundationView';
import { KnowledgeCore } from '../cognitive/knowledgeCore';

interface ExpertModeViewProps {
  systemState: CognitiveSystemState;
  knowledgeCore?: KnowledgeCore;
  onStepCycle: () => void;
  onToggleAutonomous: () => void;
  onIntervalChange: (ms: number) => void;
  onOpenDeepReasoning: () => void;
  onUpdateEnvironment: (env: any) => void;
}

export const ExpertModeView: React.FC<ExpertModeViewProps> = ({
  systemState,
  knowledgeCore,
  onStepCycle,
  onToggleAutonomous,
  onIntervalChange,
  onOpenDeepReasoning,
  onUpdateEnvironment,
}) => {
  const [activeExpertTab, setActiveExpertTab] = useState<
    'pipeline' | 'knowledgeCore' | 'worldModel' | 'prediction' | 'memory' | 'environment' | 'learning' | 'metacognition' | 'traces'
  >('pipeline');

  const expertTabs = [
    { id: 'pipeline', label: '13-Stage Pipeline', icon: Activity },
    { id: 'knowledgeCore', label: 'General Knowledge Core', icon: BookOpen },
    { id: 'worldModel', label: 'Causal DAG & Epistemics', icon: Globe },
    { id: 'prediction', label: 'Probabilistic Trajectories', icon: Cpu },
    { id: 'memory', label: 'Multi-Layer Memory', icon: Brain },
    { id: 'environment', label: 'Environment Sandbox', icon: Sliders },
    { id: 'learning', label: 'Loss & Brier Curves', icon: TrendingUp },
    { id: 'metacognition', label: 'Metacognitive Sandbox', icon: Layers },
    { id: 'traces', label: 'Raw Audit Traces', icon: FileCode },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Control Strip */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono rounded-lg">
            CYCLE: #{systemState.currentCycle}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            STATUS: {systemState.isRunningAutonomous ? 'AUTONOMOUS ACTIVE' : 'MANUAL STEP'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-expert-step"
            onClick={onStepCycle}
            disabled={systemState.isRunningAutonomous}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-mono rounded-xl border border-slate-700 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            STEP CYCLE
          </button>

          <button
            id="btn-expert-auto"
            onClick={onToggleAutonomous}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl flex items-center gap-1.5 ${
              systemState.isRunningAutonomous
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {systemState.isRunningAutonomous ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                PAUSE
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                RUN AUTO
              </>
            )}
          </button>

          <button
            id="btn-expert-deep-reason"
            onClick={onOpenDeepReasoning}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono rounded-xl flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            DEEP REASON
          </button>
        </div>
      </div>

      {/* Sub-Navigation for Expert Views */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {expertTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeExpertTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveExpertTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Selected Expert Module */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        {activeExpertTab === 'pipeline' && (
          <CognitiveCycleFlow trace={systemState.activeTrace} />
        )}
        {activeExpertTab === 'knowledgeCore' && knowledgeCore && (
          <KnowledgeFoundationView knowledgeCore={knowledgeCore} />
        )}
        {activeExpertTab === 'worldModel' && (
          <WorldModelView worldModel={systemState.worldModel} />
        )}
        {activeExpertTab === 'prediction' && (
          <PredictionView
            prediction={systemState.activeTrace?.prediction}
            environment={systemState.environment}
          />
        )}
        {activeExpertTab === 'memory' && (
          <MemoryView memorySystem={systemState.memorySystem} />
        )}
        {activeExpertTab === 'environment' && (
          <EnvironmentView
            environment={systemState.environment}
            onUpdateEnvironment={onUpdateEnvironment}
          />
        )}
        {activeExpertTab === 'learning' && (
          <LearningView
            learningEvents={(systemState?.traces || []).flatMap((t) => t.learningEvents || []).filter(Boolean)}
            accuracyHistory={systemState?.overallAccuracyHistory || []}
          />
        )}
        {activeExpertTab === 'metacognition' && (
          <MetacognitionView
            metacognition={systemState.activeTrace?.metacognition}
            experiments={systemState.experiments}
          />
        )}
        {activeExpertTab === 'traces' && (
          <ObservabilityTrace traces={systemState.traces} />
        )}
      </div>
    </div>
  );
};
