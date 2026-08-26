import React from 'react';
import { 
  GraduationCap, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { LearningEvent, PredictionErrorDelta } from '../types/cognitive';

interface LearningViewProps {
  learningEvents: LearningEvent[];
  latestError: PredictionErrorDelta | null;
  accuracyHistory: Array<{ cycle: number; accuracy: number; error: number; brier: number }>;
}

export const LearningView: React.FC<LearningViewProps> = ({
  learningEvents,
  latestError,
  accuracyHistory
}) => {
  return (
    <div id="learning-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Prediction Error as Learning Signal & Multi-Level Updates
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Sections 21, 22, 23 & 54</span>
      </div>

      {/* Top: Latest Error Signal Dashboard */}
      {latestError && (
        <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 font-mono">Latest Cycle Error Diagnostic:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              latestError.direction === 'ACCURATE' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {latestError.direction}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
            <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-mono">Delay Prediction Error</div>
              <div className={`font-mono text-sm font-bold ${Math.abs(latestError.delayErrorDays) > 0.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {latestError.delayErrorDays > 0 ? '+' : ''}{latestError.delayErrorDays} days
              </div>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-mono">Cost Prediction Error</div>
              <div className="font-mono text-sm font-bold text-white">
                ${latestError.costError.toLocaleString()}
              </div>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-mono">Normalized System Error</div>
              <div className="font-mono text-sm font-bold text-amber-400">
                {(latestError.overallNormalizedError * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              <div className="text-[10px] text-slate-400 font-mono">Brier Calibration Score</div>
              <div className="font-mono text-sm font-bold text-cyan-400">
                {latestError.brierScoreContribution.toFixed(3)}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 font-mono pt-1">
            <span className="text-slate-500">Signal Source:</span> {latestError.dominantCause}
          </p>
        </div>
      )}

      {/* Middle: Continuous Learning Curves Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 font-mono">
            Cognitive Adaptation & Calibration Curves Over Cycles:
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Model Accuracy
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Prediction Error
            </span>
          </div>
        </div>

        <div className="h-44 w-full bg-black/40 border border-white/[0.08] rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="cycle" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#060b14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                formatter={(val: number) => [`${(val * 100).toFixed(0)}%`]}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Accuracy" />
              <Line type="monotone" dataKey="error" stroke="#f43f5e" strokeWidth={1.5} dot={{ r: 2 }} name="Error" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Multi-Level Learning Events Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 font-mono">
            Multi-Level Parameter Updates (Levels 1 to 6):
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Total: {learningEvents.length} events logged</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {learningEvents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No learning events recorded yet.</p>
          ) : (
            learningEvents.slice(0, 15).map(event => (
              <div key={event.id} className="p-3 bg-black/40 border border-white/[0.08] rounded-xl space-y-1.5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Level {event.level}: {event.levelName}
                    </span>
                    <span className="font-mono text-xs text-slate-200 font-semibold">{event.parameterChanged}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Cycle #{event.cycle}</span>
                </div>

                <p className="text-xs text-slate-300">{event.description}</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <span className="text-slate-400">{String(event.previousValue)}</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold text-cyan-300">{String(event.newValue)}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] italic">{event.justification}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
