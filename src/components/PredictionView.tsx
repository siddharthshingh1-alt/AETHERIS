import React, { useState } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PredictionOutcome, EnvironmentState } from '../types/cognitive';
import { WorldModelState } from '../cognitive/worldModel';
import { simulateCounterfactualOptions, CounterfactualCandidate } from '../cognitive/reasoning';

interface PredictionViewProps {
  prediction: PredictionOutcome | null;
  worldModel: WorldModelState;
  environment: EnvironmentState;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  prediction,
  worldModel,
  environment
}) => {
  const [simulatedUnits, setSimulatedUnits] = useState<number>(100);

  const counterfactuals: CounterfactualCandidate[] = simulateCounterfactualOptions(
    worldModel,
    environment,
    simulatedUnits
  );

  return (
    <div id="prediction-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Multi-Step Prediction & Counterfactual Simulation Studio
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Sections 4, 11, 12, 15 & 16</span>
      </div>

      {/* Part 1: Latest Cycle Multi-Step Trajectories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 font-mono">Active Multi-Step Trajectory Projections:</span>
          {prediction && (
            <span className="text-xs font-mono text-purple-300">
              Confidence Score: {(prediction.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {prediction ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {prediction.candidateFutures.map((future, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 backdrop-blur-md transition-all ${
                  future.step === 2 
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30' 
                    : 'bg-black/40 border-white/[0.08]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wider">
                      {idx === 0 ? 'Optimistic Path' : (idx === 1 ? 'Expected Modal Path' : 'Adverse Path')}
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                      P = {(future.probability * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-snug mb-2.5">{future.stateDescription}</p>

                  <div className="space-y-1 text-[11px] bg-black/40 p-2.5 rounded-lg border border-white/[0.06] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Extra Delay:</span>
                      <span className="text-white font-bold">+{future.expectedMetrics.delayDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">95% CI Interval:</span>
                      <span className="text-purple-300 font-bold">[{future.confidenceInterval[0].toFixed(1)}d, {future.confidenceInterval[1].toFixed(1)}d]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Projected Cash Δ:</span>
                      <span className="text-slate-300">-${Math.abs(future.expectedMetrics.cashDelta).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Projected Customer Sat:</span>
                      <span className="text-emerald-400 font-bold">{(future.expectedMetrics.customerSatisfaction * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 font-mono">Key Uncertainty Vectors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {future.uncertaintyFactors.map((u, uIdx) => (
                      <span key={uIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No prediction generated yet. Step a cognitive cycle to initialize trajectory modeling.</p>
        )}
      </div>

      {/* Part 2: Interactive Counterfactual Simulation Lab */}
      <div className="pt-3 border-t border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-slate-200 font-mono">Interactive Counterfactual Simulation Lab:</span>
            <p className="text-[11px] text-slate-400">Simulate "What if we took action X instead of Y?" across order volumes and supplier pathways.</p>
          </div>

          {/* Slider for simulated volume */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <span className="text-xs text-slate-300 font-mono">Test Batch:</span>
            <input
              type="range"
              min={40}
              max={200}
              step={10}
              value={simulatedUnits}
              onChange={(e) => setSimulatedUnits(Number(e.target.value))}
              className="w-24 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-purple-300 w-14 text-right">{simulatedUnits} units</span>
          </div>
        </div>

        {/* Counterfactual Options Ranking Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {counterfactuals.map((candidate, idx) => (
            <div key={idx} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5 hover:border-purple-500/40 transition-all shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-bold text-purple-300 font-mono">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{candidate.action.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{candidate.action.rationale}</p>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-[10px] text-slate-400">Net Utility</span>
                  <div className="text-xs font-bold text-emerald-400">+{candidate.netExpectedValue}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] font-mono">
                <div>Direct Cost: <span className="font-bold text-white">${candidate.action.cost.toLocaleString()}</span></div>
                <div>Expected Delay: <span className="font-bold text-purple-300">+{candidate.prediction.expectedDelayDays} days</span></div>
                <div>Modal Prob: <span className="font-bold text-white">{(candidate.prediction.chosenTrajectory.probability * 100).toFixed(0)}%</span></div>
                <div>Risk Category: <span className="font-bold text-amber-300">{candidate.riskCategory}</span></div>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-1 text-[11px]">
                {candidate.pros.map((p, pIdx) => (
                  <div key={pIdx} className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
                {candidate.cons.map((c, cIdx) => (
                  <div key={cIdx} className="text-rose-400 flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
