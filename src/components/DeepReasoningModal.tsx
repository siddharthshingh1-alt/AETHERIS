import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Brain, 
  ArrowRight, 
  Check, 
  Loader2, 
  Layers, 
  Lightbulb,
  Cpu
} from 'lucide-react';
import { WorldModelState } from '../cognitive/worldModel';
import { MemorySystemState } from '../cognitive/memory';

interface DeepReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldModel: WorldModelState;
  memorySystem: MemorySystemState;
  onApplyInsights: (insights: string[], newConcepts: Array<{ name: string; description: string }>) => void;
}

export const DeepReasoningModal: React.FC<DeepReasoningModalProps> = ({
  isOpen,
  onClose,
  worldModel,
  memorySystem,
  onApplyInsights
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    analysis: string;
    causalInsights: string[];
    discoveredConcepts: Array<{ name: string; confidence: number; description: string }>;
    source: string;
  } | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('Why did Supplier Alpha experience non-linear delivery delays when volume exceeded 80 units?');

  if (!isOpen) return null;

  const handleRunDeepReasoning = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cognitive/deep-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeHypothesis: customPrompt,
          worldEntities: worldModel?.entities || {},
          causalEdges: worldModel?.causalEdges || [],
          recentEpisodes: (memorySystem?.episodicMemory || []).slice(-4)
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Failed to run deep reasoning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyInsights(
        result.causalInsights || [],
        result.discoveredConcepts?.map(c => ({ name: c.name, description: c.description })) || []
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#060b14]/95 border border-white/10 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white font-mono">Deep Metacognitive & Causal Synthesis Subsystem</h3>
              <p className="text-[11px] text-slate-400 font-mono">Server-Side Gemini Model & Symbolic Hybrid Causal Engine (Section 42 & 48)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 font-mono">
            Cognitive Hypothesis / Invariant Inquiry:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 bg-black/50 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="Enter causal hypothesis to synthesize..."
            />
            <button
              onClick={handleRunDeepReasoning}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold font-mono text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Synthesis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-300 flex items-center gap-1 font-mono">
                <Brain className="w-3.5 h-3.5" /> Inductive Causal Synthesis Output:
              </span>
              <span className="font-mono text-[10px] text-slate-400 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                Engine: {result.source}
              </span>
            </div>

            <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-slate-200 leading-relaxed font-sans">
              {result.analysis}
            </div>

            {/* Causal Insights */}
            {result.causalInsights && result.causalInsights.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 font-mono">Distilled Causal Invariants:</span>
                <ul className="space-y-1 text-xs">
                  {result.causalInsights.map((ins, idx) => (
                    <li key={idx} className="p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-indigo-200 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-mono">{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Discovered Latent Concepts */}
            {result.discoveredConcepts && result.discoveredConcepts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 font-mono">Discovered Latent Concepts (Section 48):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.discoveredConcepts.map((conc, idx) => (
                    <div key={idx} className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 font-mono">{conc.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {(conc.confidence * 100).toFixed(0)}% Conf
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{conc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-mono text-slate-300 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold font-mono text-emerald-200 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.25)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Integrate into World Model & Memory</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
