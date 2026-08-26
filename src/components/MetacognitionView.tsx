import React from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Play, 
  FlaskConical,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { MetacognitiveDiagnosis, SelfImprovementExperiment } from '../types/cognitive';

interface MetacognitionViewProps {
  metacognition: MetacognitiveDiagnosis | null;
  experiments: SelfImprovementExperiment[];
  currentAccuracy: number;
  onRunExperimentSandbox: (exp: SelfImprovementExperiment) => void;
  onRollbackExperiment: (expId: string) => void;
}

export const MetacognitionView: React.FC<MetacognitionViewProps> = ({
  metacognition,
  experiments,
  currentAccuracy,
  onRunExperimentSandbox,
  onRollbackExperiment
}) => {
  return (
    <div id="metacognition-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Metacognition & Controlled Self-Improvement Experiments
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Sections 25, 26, 27 & 28</span>
      </div>

      {/* Top: Active Introspective Diagnosis */}
      {metacognition ? (
        <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <div className="flex items-center justify-between font-mono">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Introspective Introspection (Cycle #{metacognition.cycle}):
            </span>
            <span className="text-xs font-mono text-purple-300">
              Self-Confidence: {(metacognition.confidenceInSelf * 100).toFixed(0)}%
            </span>
          </div>

          <div className="text-xs font-semibold text-white italic">
            "{metacognition.question}"
          </div>

          <p className="text-xs text-purple-200 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-purple-900/40 font-sans">
            {metacognition.diagnosis}
          </p>

          {metacognition.flawedAssumption && (
            <div className="flex items-center gap-2 text-xs bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-300 font-mono">Identified Model Defect:</span> {metacognition.flawedAssumption}
              </div>
            </div>
          )}

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium font-mono">Assumptions Evaluated Against Reality:</span>
            <ul className="space-y-1">
              {metacognition.assumptionsTested.map((a, idx) => (
                <li key={idx} className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                  <ChevronRight className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-purple-900/40 text-xs text-slate-300 font-mono">
            <span className="font-semibold text-purple-400">Proposed Algorithmic Remedy:</span> {metacognition.proposedRemedy}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No introspective diagnosis logged yet. Execute a cycle to trigger metacognition.</p>
      )}

      {/* Bottom: Controlled Self-Improvement Sandboxed Experiments */}
      <div className="space-y-3 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              Controlled Self-Improvement Architecture Lab:
            </span>
            <p className="text-[11px] text-slate-400">
              Strict scientific loop: Hypothesis → Sandboxed Benchmark → A/B Verification → Safe Deploy / Rollback
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {experiments.map(exp => (
            <div key={exp.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5 hover:border-amber-500/40 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-amber-300">{exp.version}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10">
                    {exp.componentTarget}
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  exp.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]' :
                  exp.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                  exp.status === 'ROLLED_BACK' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                  'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {exp.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-white font-medium">{exp.hypothesis}</p>
                <p className="text-[11px] text-slate-400">Target Weakness: {exp.weaknessAddressed}</p>
              </div>

              {/* Benchmark comparison metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] font-mono">
                <div>Baseline Accuracy: <span className="text-slate-300">{(exp.baselineScore * 100).toFixed(0)}%</span></div>
                <div>Candidate Accuracy: <span className="text-emerald-400 font-bold">{(exp.candidateScore * 100).toFixed(0)}%</span></div>
                <div>Brier Calibration: <span className="text-purple-300">{exp.benchmarkMetrics.calibrationBrier.toFixed(3)}</span></div>
                <div>Relative Compute Cost: <span className="text-slate-300">{exp.benchmarkMetrics.resourceCost}x</span></div>
              </div>

              {/* Actions: Run Sandbox Benchmark or Rollback */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
                {exp.status === 'PROPOSED' && (
                  <button
                    id={`btn-run-sandbox-${exp.id}`}
                    onClick={() => onRunExperimentSandbox(exp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs font-mono font-medium text-amber-200 hover:bg-amber-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Run Sandbox Benchmark</span>
                  </button>
                )}

                {exp.status === 'ACCEPTED' && (
                  <button
                    id={`btn-rollback-${exp.id}`}
                    onClick={() => onRollbackExperiment(exp.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-mono transition-all cursor-pointer"
                    title="Roll back this modification safely"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
