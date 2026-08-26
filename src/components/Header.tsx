import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Zap, 
  Brain, 
  Activity, 
  Layers, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { CognitivePhase } from '../types/cognitive';

interface HeaderProps {
  currentCycle: number;
  currentPhase: CognitivePhase;
  isRunningAutonomous: boolean;
  cycleIntervalMs: number;
  accuracy: number;
  onToggleAutonomous: () => void;
  onStepCycle: () => void;
  onReset: () => void;
  onChangeInterval: (ms: number) => void;
  onOpenDeepReasoning: () => void;
  isDeepReasoningLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCycle,
  currentPhase,
  isRunningAutonomous,
  cycleIntervalMs,
  accuracy,
  onToggleAutonomous,
  onStepCycle,
  onReset,
  onChangeInterval,
  onOpenDeepReasoning,
  isDeepReasoningLoading
}) => {
  return (
    <header id="app-header" className="bg-[#040812]/90 backdrop-blur-xl border-b border-white/[0.08] text-slate-100 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Title & System Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase font-mono">Aetheris Cognitive Architecture</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                  Closed-Loop Core
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Predictive Modeling • Multi-Layer Memory • Error Feedback • Self-Improvement</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono">
              <span className="text-slate-400">Cycle:</span>
              <span className="text-cyan-400 font-bold">#{currentCycle}</span>
            </div>
          </div>
        </div>

        {/* Cognitive Metrics & Status Pills */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-xs">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">Cognitive State:</span>
            <span className="font-semibold font-mono text-cyan-300 uppercase tracking-wider text-[11px]">
              {isRunningAutonomous ? 'Autonomous Loop' : (currentPhase === 'IDLE' ? 'Operational' : currentPhase)}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Cycle:</span>
            <span className="font-mono font-bold text-white text-xs">#{currentCycle}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Model Accuracy:</span>
            <span className="font-mono font-bold text-emerald-300">{(accuracy * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Runtime Control Panel */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Speed Selector */}
          <div className="flex items-center bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.08] text-xs">
            <span className="text-[10px] uppercase font-mono text-slate-400 px-2">Rate:</span>
            <button
              id="btn-speed-fast"
              onClick={() => onChangeInterval(800)}
              className={`px-2 py-1 rounded text-xs transition-all cursor-pointer font-mono ${cycleIntervalMs <= 1000 ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              0.8s
            </button>
            <button
              id="btn-speed-normal"
              onClick={() => onChangeInterval(1500)}
              className={`px-2 py-1 rounded text-xs transition-all cursor-pointer font-mono ${cycleIntervalMs === 1500 ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              1.5s
            </button>
            <button
              id="btn-speed-slow"
              onClick={() => onChangeInterval(3000)}
              className={`px-2 py-1 rounded text-xs transition-all cursor-pointer font-mono ${cycleIntervalMs >= 3000 ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              3.0s
            </button>
          </div>

          {/* Step 1 Cycle */}
          <button
            id="btn-step-cycle"
            onClick={onStepCycle}
            disabled={isRunningAutonomous}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:border-cyan-500/30"
            title="Execute exactly 1 full cognitive cycle"
          >
            <StepForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Step Cycle</span>
          </button>

          {/* Autonomous Loop Run/Pause */}
          <button
            id="btn-toggle-autonomous"
            onClick={onToggleAutonomous}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all shadow-md cursor-pointer ${
              isRunningAutonomous 
                ? 'bg-amber-600/90 hover:bg-amber-500 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
            }`}
          >
            {isRunningAutonomous ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Autonomous</span>
              </>
            )}
          </button>

          {/* Gemini Deep Cognitive Synthesis */}
          <button
            id="btn-gemini-deep-reasoning"
            onClick={onOpenDeepReasoning}
            disabled={isDeepReasoningLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer border border-indigo-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Deep Synthesis</span>
          </button>

          {/* Reset System */}
          <button
            id="btn-reset-system"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Reset system to initial state"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
