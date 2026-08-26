import React from 'react';
import {
  X,
  Brain,
  Sparkles,
  Target,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export interface DecisionExplanationData {
  queryTitle: string;
  chosenAction: string;
  confidence: number;
  
  // Reasoning Pillars
  currentSituation: {
    contextSummary: string;
    keyVariables: Array<{ name: string; value: string | number; status?: 'normal' | 'warning' | 'alert' }>;
  };
  relevantMemories: Array<{
    id?: string;
    title: string;
    relevanceScore: number;
    influencedDecision: boolean;
    confidence?: number;
    lessonSnippet?: string;
    source?: string;
  }>;
  lessonsApplied: string[];
  causalComparison?: {
    beforeMemory: {
      actionName: string;
      delayDays: number | string;
      cost: number | string;
      expectedUtility: number | string;
      confidence: number | string;
    };
    afterMemory: {
      actionName: string;
      delayDays: number | string;
      cost: number | string;
      expectedUtility: number | string;
      confidence: number | string;
    };
    decisionChanged: boolean;
    delayDelta: number | string;
    utilityDelta: number | string;
  };
  prediction: {
    expectedCostOrDelay: string;
    expectedNetUtility: number;
    projectedOutcome: string;
  };
  alternativesConsidered: Array<{
    actionName: string;
    projectedUtility: number;
    whyRejected: string;
  }>;
  finalDecisionReasoning: string;
}

interface DecisionExplanationModalProps {
  data: DecisionExplanationData | null;
  onClose: () => void;
}

export const DecisionExplanationModal: React.FC<DecisionExplanationModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded-md">
                <Brain className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Transparent Decision Trace
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Why I Chose This Decision
            </h2>
            <p className="text-xs text-slate-400">
              Query: "{data.queryTitle}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Summary Pill */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
              Selected Action
            </span>
            <span className="text-base font-bold text-white">{data.chosenAction}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">Overall Confidence</span>
            <span className="text-sm font-bold text-emerald-400">
              {Math.round(data.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* 7 Pillars Breakdown */}
        <div className="space-y-5 text-xs sm:text-sm">
          {/* 1. Current Situation */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">1</span>
              Current Situation & Parameters
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <p className="text-slate-300 leading-relaxed">{data.currentSituation.contextSummary}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {data.currentSituation.keyVariables.map((v, i) => (
                  <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block truncate">{v.name}</span>
                    <span
                      className={`text-xs font-semibold ${
                        v.status === 'alert'
                          ? 'text-rose-400'
                          : v.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {v.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Relevant Memories & Lessons */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">2</span>
              Retrieved Memories & Lessons
            </div>
            <div className="space-y-2">
              {data.relevantMemories.length === 0 ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs italic">
                  No relevant previous experience was retrieved for this scenario.
                </div>
              ) : (
                data.relevantMemories.map((mem, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mem.id && (
                          <span className="font-mono text-[10px] text-indigo-400 font-semibold">
                            #{mem.id}
                          </span>
                        )}
                        <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                          {mem.title}
                        </span>
                      </div>
                      {mem.lessonSnippet && (
                        <div className="text-xs text-slate-400">"{mem.lessonSnippet}"</div>
                      )}
                      {mem.source && (
                        <div className="text-[10px] text-slate-500">Source: {mem.source}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono">
                          Rel: {Math.round(mem.relevanceScore * 100)}%
                        </span>
                        {mem.confidence !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono">
                            Conf: {Math.round(mem.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <span className={`block text-[10px] font-medium ${mem.influencedDecision ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {mem.influencedDecision ? '✓ Influenced Prediction' : 'Considered Prior'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Causal Impact Comparison (Before Memory vs After Memory) */}
          {data.causalComparison && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">3</span>
                Causal Memory Chain: Before vs. After Experience
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold flex items-center justify-between">
                      <span>Baseline (Memory OFF)</span>
                      <span className="text-slate-500">{typeof data.causalComparison.beforeMemory.confidence === 'number' ? `${Math.round(data.causalComparison.beforeMemory.confidence * 100)}%` : data.causalComparison.beforeMemory.confidence}</span>
                    </div>
                    <div className="text-slate-200 font-sans font-semibold text-xs truncate">
                      {data.causalComparison.beforeMemory.actionName}
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/60">
                      <div className="flex justify-between">
                        <span>Delay:</span>
                        <span className="text-slate-300">{data.causalComparison.beforeMemory.delayDays}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="text-slate-300">${data.causalComparison.beforeMemory.cost}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>Net Utility:</span>
                        <span>{data.causalComparison.beforeMemory.expectedUtility}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/30 space-y-1.5">
                    <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-sans font-bold flex items-center justify-between">
                      <span>Experience-Informed (Memory ON)</span>
                      <span className="text-emerald-400">{typeof data.causalComparison.afterMemory.confidence === 'number' ? `${Math.round(data.causalComparison.afterMemory.confidence * 100)}%` : data.causalComparison.afterMemory.confidence}</span>
                    </div>
                    <div className="text-white font-sans font-semibold text-xs truncate">
                      {data.causalComparison.afterMemory.actionName}
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-indigo-500/20">
                      <div className="flex justify-between">
                        <span>Delay:</span>
                        <span className="text-indigo-200">{data.causalComparison.afterMemory.delayDays}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="text-indigo-200">${data.causalComparison.afterMemory.cost}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400">
                        <span>Net Utility:</span>
                        <span>{data.causalComparison.afterMemory.expectedUtility}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-sans">Decision Causal Shift:</span>
                  <span className={`font-semibold font-sans ${data.causalComparison.decisionChanged ? 'text-amber-400' : 'text-slate-300'}`}>
                    {data.causalComparison.decisionChanged
                      ? `Flipped from "${data.causalComparison.beforeMemory.actionName.split('(')[0].trim()}" → "${data.causalComparison.afterMemory.actionName.split('(')[0].trim()}"`
                      : 'Choice Unchanged (Utility Confirmed)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Projected Prediction */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">4</span>
              Projected Prediction
            </div>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-[11px]">Outcome Forecast:</span>
                <span className="text-slate-200 font-medium">{data.prediction.projectedOutcome}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Expected Net Utility:</span>
                <span className="text-emerald-400 font-bold">
                  {data.prediction.expectedNetUtility > 0
                    ? `+$${data.prediction.expectedNetUtility.toLocaleString()}`
                    : `$${data.prediction.expectedNetUtility.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Alternatives Considered */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">5</span>
              Alternatives Considered & Rejected
            </div>
            <div className="space-y-2">
              {data.alternativesConsidered.map((alt, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-300">{alt.actionName}</span>
                    <p className="text-slate-500 text-[11px]">{alt.whyRejected}</p>
                  </div>
                  <div className="text-right shrink-0 text-slate-400 font-mono">
                    Score: {alt.projectedUtility}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6 & 7. Final Reasoning Summary */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">5</span>
              Final Decision Synthesis
            </div>
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl text-slate-200 leading-relaxed text-xs sm:text-sm">
              {data.finalDecisionReasoning}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
