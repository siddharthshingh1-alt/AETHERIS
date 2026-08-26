import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ChevronRight, 
  Terminal, 
  Layers, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CognitiveCycleTrace } from '../types/cognitive';

interface ObservabilityTraceProps {
  traces: CognitiveCycleTrace[];
}

export const ObservabilityTrace: React.FC<ObservabilityTraceProps> = ({ traces }) => {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(
    traces.length > 0 ? traces[0].cycleNumber : null
  );

  const activeTrace = traces.find(t => t.cycleNumber === selectedCycle) || traces[0];

  return (
    <div id="observability-trace-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Deep Cognitive Observability & Audit Traces (Section 66)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Answers: "Why did the system make this decision?"</span>
      </div>

      {traces.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No cycle traces available yet. Execute a cycle to record execution audit logs.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Cycle selector sidebar */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
              Historical Cycles:
            </span>
            {traces.map(tr => (
              <button
                key={tr.cycleNumber}
                onClick={() => setSelectedCycle(tr.cycleNumber)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  (activeTrace?.cycleNumber === tr.cycleNumber) 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'bg-black/40 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">Cycle #{tr.cycleNumber}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{tr.actionExecuted.title}</div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  tr.actualObservation.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {tr.actualObservation.status}
                </span>
              </button>
            ))}
          </div>

          {/* Detailed Trace Breakdown */}
          {activeTrace && (
            <div className="lg:col-span-3 space-y-3.5 bg-black/40 p-4 border border-white/[0.08] rounded-xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    Cycle #{activeTrace.cycleNumber}
                  </span>
                  <span className="text-xs text-white font-bold font-mono">{activeTrace.actionExecuted.title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{activeTrace.timestamp}</span>
              </div>

              {/* 1. Perception & Working Memory */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-cyan-300 font-mono">1. Perception & Working Memory Focus:</span>
                <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-slate-300 text-[11px]">
                  <div><span className="text-slate-400 font-mono">Goal:</span> {activeTrace.workingMemorySnapshot.activeGoal}</div>
                  <div><span className="text-slate-400 font-mono">Observations:</span> {activeTrace.perception.join(' | ')}</div>
                </div>
              </div>

              {/* 2. Retrieved Semantic Invariants */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-indigo-300 font-mono">2. Retrieved Memory Invariants:</span>
                <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-slate-300 text-[11px]">
                  {activeTrace.retrievedMemories.map((m, idx) => (
                    <div key={idx}>• {m}</div>
                  ))}
                </div>
              </div>

              {/* 3. Prediction & Rationale */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-purple-300 font-mono">3. Forward Prediction & Rationale:</span>
                <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-slate-300 text-[11px] font-mono">
                  <div>Expected Delay: +{activeTrace.prediction.expectedDelayDays} days</div>
                  <div>Expected Cost: ${activeTrace.prediction.expectedCost.toLocaleString()}</div>
                  <div>Confidence: {(activeTrace.prediction.confidence * 100).toFixed(0)}%</div>
                  <div className="text-purple-300 pt-0.5">{activeTrace.prediction.reasoningSummary}</div>
                </div>
              </div>

              {/* 4. Action & Actual Consequence */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-emerald-300 font-mono">4. Action Executed & Empirical Consequence:</span>
                <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-slate-300 text-[11px]">
                  <div><span className="text-slate-400 font-mono">Action:</span> {activeTrace.actionExecuted.title} ({activeTrace.actionExecuted.rationale})</div>
                  <div><span className="text-slate-400 font-mono">Actual Outcome:</span> {activeTrace.actualObservation.notes} (Actual Delay: +{activeTrace.actualObservation.actualDelayDays}d)</div>
                </div>
              </div>

              {/* 5. Error Signal & Parameter Updates */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-rose-300 font-mono">5. Prediction Error & Learning Adaptations:</span>
                <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-slate-300 text-[11px]">
                  <div><span className="text-slate-400 font-mono">Delay Error Δ:</span> {activeTrace.predictionError.delayErrorDays > 0 ? '+' : ''}{activeTrace.predictionError.delayErrorDays} days ({activeTrace.predictionError.direction})</div>
                  <div><span className="text-slate-400 font-mono">Learning Updates:</span> {activeTrace.learningEvents.map(e => `[${e.levelName}] ${e.description}`).join('; ')}</div>
                </div>
              </div>

              {/* 6. Metacognitive Conclusion */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-purple-300 font-mono">6. Metacognitive Introspection:</span>
                <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/40 text-purple-200 text-[11px] leading-relaxed">
                  {activeTrace.metacognition.diagnosis}
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
