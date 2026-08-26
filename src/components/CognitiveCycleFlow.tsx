import React, { useState } from 'react';
import { 
  Eye, 
  Binary, 
  Globe, 
  Database, 
  TrendingUp, 
  Cpu, 
  Compass, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  GraduationCap, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { CognitiveCycleTrace } from '../types/cognitive';

interface CognitiveCycleFlowProps {
  activeTrace: CognitiveCycleTrace | null;
  currentCycle: number;
}

interface StepItem {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const STEPS: StepItem[] = [
  { id: 'OBSERVE', name: '1. Observe', shortLabel: 'Observe', icon: Eye, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', description: 'Continuous multi-source sensor & environment telemetry ingestion' },
  { id: 'PERCEIVE', name: '2. Perceive & Represent', shortLabel: 'Perceive', icon: Binary, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', description: 'Structures raw observations into salient state representations' },
  { id: 'WORLD', name: '3. World Model', shortLabel: 'World', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', description: 'Persistent entity states, causal edges, epistemic classifications' },
  { id: 'MEMORY', name: '4. Retrieve Memory', shortLabel: 'Memory', icon: Database, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', description: 'Retrieves relevant semantic rules, procedural skills, past episodes' },
  { id: 'PREDICT', name: '5. Multi-Step Predict', shortLabel: 'Predict', icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', description: 'Generates multi-step forward states S0->S1->S2 with uncertainty' },
  { id: 'REASON', name: '6. Reason & Simulate', shortLabel: 'Simulate', icon: Cpu, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30', description: 'Counterfactual scenario simulation (What if action A vs B?)' },
  { id: 'PLAN', name: '7. Plan & Subgoals', shortLabel: 'Plan', icon: Compass, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30', description: 'Hierarchical goal decomposition into risk-adjusted action plan' },
  { id: 'ACT', name: '8. Execute Action', shortLabel: 'Act', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', description: 'Dispatches explicit action schema to environment sandbox' },
  { id: 'CONSEQUENCE', name: '9. Observe Outcome', shortLabel: 'Outcome', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', description: 'Measures empirical delay, cost, yield, and quality' },
  { id: 'ERROR', name: '10. Calculate Error', shortLabel: 'Error Δ', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', description: 'prediction_error = actual - predicted (delay, cost, Brier score)' },
  { id: 'LEARN', name: '11. Multi-Level Learn', shortLabel: 'Learn (1-6)', icon: GraduationCap, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', description: 'Levels 1-6: Facts, Causal weights, Skills, Strategy, Meta-learning' },
  { id: 'METACOGNITION', name: '12. Metacognition', shortLabel: 'Metacognition', icon: HelpCircle, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', description: 'Introspective diagnosis: Where was model wrong and why?' },
  { id: 'SELF_IMPROVE', name: '13. Self-Improvement', shortLabel: 'Self-Improve', icon: Sparkles, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', description: 'Controlled sandbox experiments, benchmarking & safe versioning' },
];

export const CognitiveCycleFlow: React.FC<CognitiveCycleFlowProps> = ({ activeTrace, currentCycle }) => {
  const [selectedStepId, setSelectedStepId] = useState<string>('ERROR');

  const getStepContent = (stepId: string) => {
    if (!activeTrace) {
      return <p className="text-xs text-slate-400">Run a cycle or start autonomous loop to inspect live cognitive flow artifacts.</p>;
    }

    switch (stepId) {
      case 'OBSERVE':
      case 'PERCEIVE':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-300">Raw Environmental Perceptions:</div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              {activeTrace.perception.map((p, idx) => (
                <li key={idx} className="leading-relaxed bg-slate-800/60 p-1.5 rounded border border-slate-700/50">{p}</li>
              ))}
            </ul>
          </div>
        );
      case 'WORLD':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-300">World Model Updates This Cycle:</div>
            {activeTrace.worldModelUpdates.length > 0 ? (
              <ul className="space-y-1.5">
                {activeTrace.worldModelUpdates.map((u, idx) => (
                  <li key={idx} className="p-1.5 bg-blue-950/40 border border-blue-800/40 rounded text-blue-200 font-mono text-[11px]">{u}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic">World model entities verified in steady state.</p>
            )}
          </div>
        );
      case 'MEMORY':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-300">Active Invariant Rules Retrieved:</div>
            <ul className="space-y-1.5">
              {activeTrace.retrievedMemories.map((m, idx) => (
                <li key={idx} className="p-1.5 bg-indigo-950/40 border border-indigo-800/40 rounded text-indigo-200">{m}</li>
              ))}
            </ul>
          </div>
        );
      case 'PREDICT':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-300">Chosen Modal Trajectory:</span>
              <span className="font-mono text-purple-400 font-bold">P = {(activeTrace.prediction.chosenTrajectory.probability * 100).toFixed(0)}%</span>
            </div>
            <div className="p-2 bg-purple-950/40 border border-purple-800/50 rounded-lg space-y-1">
              <p className="text-slate-200 font-medium">{activeTrace.prediction.chosenTrajectory.stateDescription}</p>
              <p className="text-slate-400">{activeTrace.prediction.reasoningSummary}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-purple-900/50 text-[11px]">
                <div>Expected Extra Delay: <span className="font-bold text-white">+{activeTrace.prediction.expectedDelayDays} days</span></div>
                <div>Expected Cost: <span className="font-bold text-white">${activeTrace.prediction.expectedCost.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        );
      case 'REASON':
      case 'PLAN':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-pink-300">Selected Action: {activeTrace.plan.selectedAction.title}</div>
            <p className="text-slate-400">{activeTrace.plan.selectedAction.rationale}</p>
            <div className="mt-2">
              <span className="text-slate-400 font-medium">Subgoals Decomposed:</span>
              <ul className="mt-1 space-y-1">
                {activeTrace.plan.subgoals.map((sg, idx) => (
                  <li key={idx} className="text-slate-300 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-pink-400" />
                    <span>{sg}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'ACT':
      case 'CONSEQUENCE':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Actual Real-World Outcome:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeTrace.actualObservation.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {activeTrace.actualObservation.status}
              </span>
            </div>
            <div className="p-2 bg-slate-800/80 border border-slate-700 rounded-lg space-y-1.5">
              <p className="text-slate-200">{activeTrace.actualObservation.notes}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1.5 border-t border-slate-700">
                <div>Actual Extra Delay: <span className="font-bold text-white">+{activeTrace.actualObservation.actualDelayDays} days</span></div>
                <div>Actual Cost: <span className="font-bold text-white">${activeTrace.actualObservation.actualCost.toLocaleString()}</span></div>
                <div>Inventory Δ: <span className="font-bold text-white">+{activeTrace.actualObservation.actualInventoryDelta} units</span></div>
                <div>Customer Satisfaction: <span className="font-bold text-emerald-400">{(activeTrace.actualObservation.actualCustomerSatisfaction * 100).toFixed(0)}%</span></div>
              </div>
            </div>
          </div>
        );
      case 'ERROR':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-300">Prediction Error Delta (Reality - Model):</span>
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                activeTrace.predictionError.direction === 'ACCURATE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {activeTrace.predictionError.direction}
              </span>
            </div>
            <div className="p-2.5 bg-rose-950/30 border border-rose-800/40 rounded-lg space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Delay Δ</div>
                  <div className="font-mono font-bold text-sm text-white">
                    {activeTrace.predictionError.delayErrorDays > 0 ? '+' : ''}{activeTrace.predictionError.delayErrorDays}d
                  </div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Normalized Error</div>
                  <div className="font-mono font-bold text-sm text-amber-400">
                    {(activeTrace.predictionError.overallNormalizedError * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Brier Contribution</div>
                  <div className="font-mono font-bold text-sm text-purple-400">
                    {activeTrace.predictionError.brierScoreContribution.toFixed(3)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-rose-200 leading-relaxed font-mono">
                Root Cause: {activeTrace.predictionError.dominantCause}
              </p>
            </div>
          </div>
        );
      case 'LEARN':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-teal-300">Multi-Level Learning Events Triggered ({activeTrace.learningEvents.length}):</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activeTrace.learningEvents.map(e => (
                <div key={e.id} className="p-2 bg-teal-950/40 border border-teal-800/40 rounded text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300">Level {e.level}: {e.levelName}</span>
                    <span className="font-mono text-slate-400">{e.parameterChanged}</span>
                  </div>
                  <p className="text-slate-200">{e.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{String(e.previousValue)}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-teal-400" />
                    <span className="font-bold text-teal-300">{String(e.newValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'METACOGNITION':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-violet-300">Introspective Diagnosis:</div>
            <div className="p-2.5 bg-violet-950/30 border border-violet-800/40 rounded-lg space-y-2">
              <p className="font-medium text-slate-200 italic">"{activeTrace.metacognition.question}"</p>
              <p className="text-violet-200 leading-relaxed">{activeTrace.metacognition.diagnosis}</p>
              {activeTrace.metacognition.flawedAssumption && (
                <div className="p-1.5 bg-rose-900/40 border border-rose-700/50 rounded text-rose-200 text-[11px]">
                  <span className="font-bold">Flawed Assumption:</span> {activeTrace.metacognition.flawedAssumption}
                </div>
              )}
              <div className="text-[11px] text-slate-300 pt-1 border-t border-violet-900/50">
                <span className="font-semibold text-violet-400">Proposed Strategy Remedy:</span> {activeTrace.metacognition.proposedRemedy}
              </div>
            </div>
          </div>
        );
      case 'SELF_IMPROVE':
        return (
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-amber-300">Controlled Self-Improvement Proposal:</div>
            {activeTrace.selfImprovementProposal ? (
              <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{activeTrace.selfImprovementProposal.version}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {activeTrace.selfImprovementProposal.status}
                  </span>
                </div>
                <p className="text-slate-200">{activeTrace.selfImprovementProposal.hypothesis}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-amber-900/50">
                  <div>Target: <span className="font-mono text-amber-300">{activeTrace.selfImprovementProposal.componentTarget}</span></div>
                  <div>Sandbox Score: <span className="font-bold text-emerald-400">{(activeTrace.selfImprovementProposal.candidateScore * 100).toFixed(0)}%</span></div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic">No new architecture modification needed this cycle. System parameters are well-calibrated.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="cognitive-cycle-flow-section" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Continuous 13-Phase Cognitive Pipeline</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Autonomous Feedforward & Recurrent
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Select any phase below to inspect live causal state artifacts</span>
      </div>

      {/* Horizontal Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-13 gap-1.5 pb-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isSelected = selectedStepId === step.id;
          return (
            <button
              key={step.id}
              id={`step-btn-${step.id.toLowerCase()}`}
              onClick={() => setSelectedStepId(step.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected 
                  ? `${step.color} ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-[1.03] bg-white/[0.08]` 
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-semibold tracking-tight truncate w-full font-mono">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Data Inspector Box */}
      <div className="mt-3.5 p-3.5 bg-black/40 border border-white/[0.08] rounded-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 font-mono">
              Phase Data Inspector: <span className="text-cyan-300 font-bold">{STEPS.find(s => s.id === selectedStepId)?.name}</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">Cycle #{currentCycle - 1 > 0 ? currentCycle - 1 : 1} Telemetry Trace</span>
        </div>
        {getStepContent(selectedStepId)}
      </div>
    </section>
  );
};
