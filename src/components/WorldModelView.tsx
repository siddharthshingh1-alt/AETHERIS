import React, { useState } from 'react';
import { 
  Globe, 
  GitFork, 
  ShieldCheck, 
  HelpCircle, 
  Layers, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { WorldModelState } from '../cognitive/worldModel';
import { EpistemicStatus, WorldEntity } from '../types/cognitive';

interface WorldModelViewProps {
  worldModel: WorldModelState;
}

export const WorldModelView: React.FC<WorldModelViewProps> = ({ worldModel }) => {
  const [activeTab, setActiveTab] = useState<'ENTITIES' | 'CAUSAL_DAG' | 'EPISTEMIC'>('CAUSAL_DAG');
  const [epistemicFilter, setEpistemicFilter] = useState<string>('ALL');

  const entitiesList: WorldEntity[] = worldModel?.entities ? Object.values(worldModel.entities) : [];

  const epistemicList = worldModel?.epistemicRegistry || [];
  const filteredStatements = epistemicFilter === 'ALL' 
    ? epistemicList 
    : epistemicList.filter(s => s.status === epistemicFilter);

  const getStatusBadge = (status: EpistemicStatus) => {
    switch (status) {
      case 'FACT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_6px_rgba(52,211,153,0.3)]">FACT</span>;
      case 'BELIEF':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_6px_rgba(6,182,212,0.3)]">BELIEF</span>;
      case 'HYPOTHESIS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">HYPOTHESIS</span>;
      case 'ASSUMPTION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">ASSUMPTION</span>;
      case 'INFERENCE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">INFERENCE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div id="world-model-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4">
      {/* View Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">Persistent World Model & Causal Graph</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            v{worldModel.version}.0
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] p-0.5 rounded-lg text-xs">
          <button
            id="tab-causal-dag"
            onClick={() => setActiveTab('CAUSAL_DAG')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-mono ${activeTab === 'CAUSAL_DAG' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Causal DAG ({worldModel.causalEdges.length})
          </button>
          <button
            id="tab-entities"
            onClick={() => setActiveTab('ENTITIES')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-mono ${activeTab === 'ENTITIES' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Entities ({entitiesList.length})
          </button>
          <button
            id="tab-epistemic"
            onClick={() => setActiveTab('EPISTEMIC')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-mono ${activeTab === 'EPISTEMIC' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Epistemic Registry ({worldModel.epistemicRegistry.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Causal DAG */}
      {activeTab === 'CAUSAL_DAG' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Explicit Causal Relationships & Dynamic Influence Weights (Section 6 & 14)</span>
            <span className="text-[11px]">Range: -1.0 (Inhibits) to +1.0 (Amplifies)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {worldModel.causalEdges.map(edge => {
              const sourceEntity = worldModel.entities[edge.sourceEntityId]?.name || edge.sourceEntityId;
              const targetEntity = worldModel.entities[edge.targetEntityId]?.name || edge.targetEntityId;
              return (
                <div key={edge.id} className="p-3 bg-black/40 border border-white/[0.08] rounded-xl space-y-2 hover:border-cyan-500/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 font-mono">
                      <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate max-w-[140px] text-white">{sourceEntity}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="truncate max-w-[140px] text-cyan-300">{targetEntity}</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                      {edge.influenceWeight > 0 ? '+' : ''}{edge.influenceWeight}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                    {edge.relationship}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.06] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {edge.empiricalSupportCount} Supported
                      </span>
                      {edge.falsificationCount > 0 && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <X className="w-3 h-3" /> {edge.falsificationCount} Falsified
                        </span>
                      )}
                    </div>
                    <span>Confidence: {(edge.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Entities */}
      {activeTab === 'ENTITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entitiesList.map(entity => (
            <div key={entity.id} className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[180px] font-mono">{entity.name}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-cyan-300 border border-white/10">
                  {entity.type}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-y border-white/[0.06]">
                <span className="text-slate-400">Reliability Index:</span>
                <span className={`font-mono font-bold ${entity.reliabilityScore > 0.85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(entity.reliabilityScore * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium font-mono">Entity Attributes:</span>
                {Object.values(entity.properties).map(prop => (
                  <div key={prop.key} className="flex items-center justify-between text-[11px] bg-white/[0.02] px-2 py-1 rounded font-mono border border-white/[0.04]">
                    <span className="text-slate-400">{prop.key}:</span>
                    <span className="text-slate-200 font-semibold">{String(prop.value)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {entity.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-slate-400 border border-white/[0.06]">#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Epistemic Registry */}
      {activeTab === 'EPISTEMIC' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-400 font-mono">Section 9: Distinguishing Facts, Beliefs, Hypotheses, Assumptions, Inferences</span>
            
            <div className="flex items-center gap-1 bg-black/40 border border-white/[0.08] p-0.5 rounded-lg text-[11px] font-mono">
              {['ALL', 'FACT', 'BELIEF', 'HYPOTHESIS', 'ASSUMPTION', 'INFERENCE'].map(f => (
                <button
                  key={f}
                  onClick={() => setEpistemicFilter(f)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${epistemicFilter === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredStatements.map(stmt => (
              <div key={stmt.id} className="p-3 bg-black/40 border border-white/[0.08] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(stmt.status)}
                    <span className="text-xs text-slate-200 leading-snug">{stmt.statement}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Evidence: {stmt.evidenceIds.join(', ') || 'Initial prior'}</span>
                    {stmt.counterEvidenceIds.length > 0 && (
                      <span className="text-rose-400">Counter-evidence: {stmt.counterEvidenceIds.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-400">Confidence</div>
                    <div className="text-xs font-bold text-cyan-300">{(stmt.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
