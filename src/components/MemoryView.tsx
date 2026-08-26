import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  Sparkles, 
  Flame, 
  BookOpen, 
  Wrench, 
  Brain, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { MemorySystemState } from '../cognitive/memory';

interface MemoryViewProps {
  memorySystem: MemorySystemState;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ memorySystem }) => {
  const [activeLayer, setActiveLayer] = useState<'WORKING' | 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL' | 'META'>('EPISODIC');

  return (
    <div id="memory-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4">
      {/* Header & Memory Layer Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Multi-Layer Memory Architecture & Consolidation
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {memorySystem.totalConsolidatedEpisodes} Consolidated
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] p-0.5 rounded-lg text-xs overflow-x-auto max-w-full">
          <button
            id="tab-mem-working"
            onClick={() => setActiveLayer('WORKING')}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer font-mono ${activeLayer === 'WORKING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Working
          </button>
          <button
            id="tab-mem-episodic"
            onClick={() => setActiveLayer('EPISODIC')}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer font-mono ${activeLayer === 'EPISODIC' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Episodic ({memorySystem.episodicMemory.length})
          </button>
          <button
            id="tab-mem-semantic"
            onClick={() => setActiveLayer('SEMANTIC')}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer font-mono ${activeLayer === 'SEMANTIC' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Semantic ({memorySystem.semanticMemory.length})
          </button>
          <button
            id="tab-mem-procedural"
            onClick={() => setActiveLayer('PROCEDURAL')}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer font-mono ${activeLayer === 'PROCEDURAL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Procedural ({memorySystem.proceduralMemory.length})
          </button>
          <button
            id="tab-mem-meta"
            onClick={() => setActiveLayer('META')}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer font-mono ${activeLayer === 'META' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Meta-Memory ({memorySystem.metaMemory.length})
          </button>
        </div>
      </div>

      {/* Layer 1: Working Memory */}
      {activeLayer === 'WORKING' && (
        <div className="space-y-3">
          <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-semibold text-slate-300">Active Primary Goal:</span>
              <span className="text-[10px] text-cyan-400">Attention Budget: {(memorySystem.workingMemory.attentionBudgetUsed * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs text-white font-medium bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
              {memorySystem.workingMemory.activeGoal}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">Active Decomposed Subgoals:</span>
              <ul className="space-y-1 text-xs">
                {memorySystem.workingMemory.activeSubgoals.map((sg, idx) => (
                  <li key={idx} className="text-slate-300 flex items-start gap-1.5 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{sg}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">Active Hypotheses Under Active Investigation:</span>
              <ul className="space-y-1 text-xs">
                {memorySystem.workingMemory.activeHypotheses.map((h, idx) => (
                  <li key={idx} className="text-purple-300 bg-purple-950/20 border border-purple-800/30 p-2 rounded-lg text-[11px]">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Layer 2: Episodic Memory */}
      {activeLayer === 'EPISODIC' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Chronological Experience Stream (Predictions vs Outcomes + Surprise Signal)</span>
            <span className="text-[11px]">Latest {memorySystem.episodicMemory.length} Episodes</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {[...memorySystem.episodicMemory].reverse().map(ep => (
              <div key={ep.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-md">
                      Cycle #{ep.cycle}
                    </span>
                    <span className="text-xs text-slate-200 font-medium truncate max-w-[220px]">
                      {ep.actionTaken.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[10px] text-slate-400">Surprise:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ep.surpriseScore > 0.4 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {(ep.surpriseScore * 100).toFixed(0)}%
                    </span>
                    {ep.consolidated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        Consolidated
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300">{ep.context}</p>

                {/* Prediction vs Actual comparison */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] font-mono">
                  <div className="space-y-0.5 border-r border-white/[0.06] pr-2">
                    <div className="text-[10px] text-purple-400 font-bold uppercase">Predicted Trajectory</div>
                    <div>Extra Delay: +{ep.predictedOutcome.expectedDelayDays}d</div>
                    <div>Cost: ${ep.predictedOutcome.expectedCost.toLocaleString()}</div>
                    <div>Confidence: {(ep.predictedOutcome.confidence * 100).toFixed(0)}%</div>
                  </div>
                  <div className="space-y-0.5 pl-2">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Actual Reality</div>
                    <div>Extra Delay: +{ep.actualOutcome.actualDelayDays}d ({ep.predictionError.delayErrorDays > 0 ? '+' : ''}{ep.predictionError.delayErrorDays}d Δ)</div>
                    <div>Cost: ${ep.actualOutcome.actualCost.toLocaleString()}</div>
                    <div>Status: {ep.actualOutcome.status}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 italic pt-1 border-t border-white/[0.06]">
                  <span className="font-semibold text-cyan-300 not-italic font-mono">Distilled Key Insight:</span> {ep.keyInsight}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 3: Semantic Memory */}
      {activeLayer === 'SEMANTIC' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-mono">
            Generalized Domain Invariants & Abstracted Principles (Distilled from Multi-Episode Experience)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memorySystem.semanticMemory.map(rule => (
              <div key={rule.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase font-mono">{rule.domain}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    Conf: {(rule.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                  "{rule.invariantRule}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/[0.06] font-mono">
                  <span>Generality Score: {(rule.generalityScore * 100).toFixed(0)}%</span>
                  <span>Supporting Episodes: {rule.supportingEpisodeIds.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 4: Procedural Memory */}
      {activeLayer === 'PROCEDURAL' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-mono">
            Learned Skills, Action Playbooks & Dynamic Success Rates (Section 7.4)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {memorySystem.proceduralMemory.map(skill => (
              <div key={skill.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[150px] font-mono">{skill.name}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      skill.successRate > 0.85 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {(skill.successRate * 100).toFixed(0)}% Win
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">{skill.description}</p>

                  <div className="space-y-1 text-[10px] text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                    <div className="font-semibold text-slate-400 font-mono">Execution Steps:</div>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {skill.steps.map((st, idx) => (
                        <li key={idx} className="truncate">{st}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Executions: {skill.executionCount}</span>
                  <span className="text-cyan-300">Trigger: {skill.triggerCondition}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 5: Meta-Memory */}
      {activeLayer === 'META' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400 font-mono">
            System Knowledge About Its Own Knowledge & Competence Boundaries (Section 7.5)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {memorySystem.metaMemory.map(meta => (
              <div key={meta.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 truncate max-w-[160px] font-mono">{meta.domain}</span>
                  <span className="font-mono text-xs font-bold text-white bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-md">
                    {(meta.competenceLevel * 100).toFixed(0)}% Competent
                  </span>
                </div>

                <div className="text-[11px] space-y-1">
                  <div className="text-emerald-400 font-semibold font-mono">Known Strengths:</div>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {meta.knownStrengths.map((s, idx) => (
                      <li key={idx} className="truncate">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-[11px] space-y-1">
                  <div className="text-rose-400 font-semibold font-mono">Known Model Weaknesses:</div>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {meta.knownWeaknesses.map((w, idx) => (
                      <li key={idx} className="truncate">{w}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 font-mono">
                  <span className="font-semibold text-purple-300">Uncertainty Boundary:</span> {meta.uncertaintyBoundaries.join('; ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
