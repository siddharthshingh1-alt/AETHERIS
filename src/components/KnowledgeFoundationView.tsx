import React, { useState } from 'react';
import {
  Brain,
  Search,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { KnowledgeCore } from '../cognitive/knowledgeCore';
import { Concept, Relationship, EpistemicStatus, ConceptProperty } from '../types/knowledge';

interface KnowledgeFoundationViewProps {
  knowledgeCore: KnowledgeCore;
  onRefresh?: () => void;
}

export const KnowledgeFoundationView: React.FC<KnowledgeFoundationViewProps> = ({ knowledgeCore, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'KNOW' | 'UNCERTAIN' | 'GRAPH' | 'LOGS'>('KNOW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const allConcepts = knowledgeCore?.getAllConcepts ? knowledgeCore.getAllConcepts() : [];
  const allRelationships = knowledgeCore?.getAllRelationships ? knowledgeCore.getAllRelationships() : [];
  const beliefUpdates = knowledgeCore?.getBeliefUpdateHistory ? knowledgeCore.getBeliefUpdateHistory() : [];

  // Filtered concepts
  const filteredConcepts = allConcepts.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeSubTab === 'KNOW') {
      return c.confidence >= 0.70 && c.status !== 'CONTRADICTED' && c.status !== 'REJECTED';
    }
    if (activeSubTab === 'UNCERTAIN') {
      return (
        c.confidence < 0.70 ||
        c.status === 'HYPOTHESIS' ||
        c.status === 'CONTRADICTED' ||
        c.evidence.contradictingCount > 0
      );
    }
    return true;
  });

  const getStatusBadge = (status: EpistemicStatus) => {
    switch (status) {
      case 'SEEDED':
        return (
          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold rounded-md">
            SEEDED
          </span>
        );
      case 'USER_TAUGHT':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded-md">
            USER TAUGHT
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold rounded-md">
            VALIDATED
          </span>
        );
      case 'HYPOTHESIS':
        return (
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold rounded-md">
            HYPOTHESIS
          </span>
        );
      case 'CONTRADICTED':
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold rounded-md">
            CONTRADICTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-semibold rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Brain className="w-4 h-4" />
            General Knowledge Core (Phase 1)
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Domain-Independent Ontology & Common Sense</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Represents concepts, extensible relationships, source provenance, and multi-observation evidence across
            physical objects, computing, finance, temporal logic, and human teaching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <div className="text-lg font-bold text-white">{allConcepts.length}</div>
            <div className="text-[10px] text-slate-400 font-medium">Concepts</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <div className="text-lg font-bold text-indigo-400">{allRelationships.length}</div>
            <div className="text-[10px] text-slate-400 font-medium">Relations</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('KNOW')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'KNOW'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          What I Know ({allConcepts.filter((c) => c.confidence >= 0.7 && c.status !== 'CONTRADICTED').length})
        </button>

        <button
          onClick={() => setActiveSubTab('UNCERTAIN')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'UNCERTAIN'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          What I Am Uncertain About (
          {
            allConcepts.filter(
              (c) => c.confidence < 0.7 || c.status === 'HYPOTHESIS' || c.status === 'CONTRADICTED'
            ).length
          }
          )
        </button>

        <button
          onClick={() => setActiveSubTab('GRAPH')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'GRAPH'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Relationship Graph ({allRelationships.length})
        </button>

        <button
          onClick={() => setActiveSubTab('LOGS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSubTab === 'LOGS'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Belief Update History ({beliefUpdates.length})
        </button>
      </div>

      {/* Search Input */}
      {(activeSubTab === 'KNOW' || activeSubTab === 'UNCERTAIN') && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts (e.g. Kettle, Apple, Python, Deadline, Revenue)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Cards Grid */}
      {(activeSubTab === 'KNOW' || activeSubTab === 'UNCERTAIN') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConcepts.map((concept) => {
            const rels = knowledgeCore.getRelationshipsForConcept(concept.id);
            return (
              <div
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(concept.status)}
                    <span className="text-[11px] font-semibold text-emerald-400">
                      {Math.round(concept.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {concept.name}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Category: {concept.category}</div>
                  </div>

                  {concept.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{concept.description}</p>
                  )}

                  {/* Outgoing relationships summary */}
                  {rels.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Relationships ({rels.length})
                      </div>
                      <div className="space-y-1">
                        {rels.slice(0, 2).map((r) => (
                          <div key={r.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span className="text-indigo-400 font-semibold">{r.predicate}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate text-slate-200">{r.targetDescription || r.targetConceptId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Evidence: {concept.evidence.supportingCount} supporting
                    {concept.evidence.contradictingCount > 0 ? `, ${concept.evidence.contradictingCount} contra` : ''}
                  </span>
                  <span className="text-indigo-400 font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Graph View */}
      {activeSubTab === 'GRAPH' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Full Relationship Graph ({allRelationships.length} edges)</h3>
            <div className="text-xs text-slate-400">Domain-Independent Conceptual Triples</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-3 font-semibold">Source Concept</th>
                  <th className="py-2 px-3 font-semibold">Predicate</th>
                  <th className="py-2 px-3 font-semibold">Target Concept / Object</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Confidence</th>
                  <th className="py-2 px-3 font-semibold">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allRelationships.map((r) => {
                  const source = knowledgeCore.getConcept(r.sourceConceptId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-white">{source?.name || r.sourceConceptId}</td>
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{r.predicate}</td>
                      <td className="py-2.5 px-3 text-slate-200">{r.targetDescription || r.targetConceptId}</td>
                      <td className="py-2.5 px-3">{getStatusBadge(r.status)}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">{Math.round(r.confidence * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{r.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Belief History */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Belief Update & Evidence History</h3>
            <div className="text-xs text-slate-400">{beliefUpdates.length} Recorded Updates</div>
          </div>

          {beliefUpdates.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No belief revision events logged yet. Seed beliefs are at baseline equilibrium.
            </div>
          ) : (
            <div className="space-y-3">
              {beliefUpdates.map((ev) => (
                <div key={ev.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{ev.targetId}</span>
                    <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Status: <span className="text-rose-400">{ev.previousStatus}</span> →{' '}
                      <span className="text-emerald-400">{ev.newStatus}</span>
                    </span>
                    <span className="text-slate-400">
                      Confidence: {Math.round(ev.previousConfidence * 100)}% →{' '}
                      <span className="text-indigo-400 font-bold">{Math.round(ev.newConfidence * 100)}%</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                    {ev.rationale}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Concept Detail Modal */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedConcept.status)}
                  <span className="text-xs text-slate-400 font-mono">ID: {selectedConcept.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{selectedConcept.name}</h2>
                <div className="text-xs text-indigo-400 font-semibold">Category: {selectedConcept.category}</div>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {selectedConcept.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedConcept.description}
              </p>
            )}

            {/* Properties */}
            {Object.keys(selectedConcept.properties).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-semibold text-slate-400">Concept Properties</h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                  {Object.entries(selectedConcept.properties).map(([k, p]) => {
                    const prop = p as ConceptProperty;
                    const displayVal =
                      prop && typeof prop === 'object' && 'value' in prop
                        ? typeof prop.value === 'object'
                          ? JSON.stringify(prop.value)
                          : String(prop.value)
                        : String(p);
                    return (
                      <div key={k} className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-mono">{k}:</span>
                        <span className="font-semibold text-white">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outgoing & Incoming Relationships */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-semibold text-slate-400">Connected Relationships</h4>
              <div className="space-y-2">
                {knowledgeCore.getRelationshipsForConcept(selectedConcept.id).map((r) => (
                  <div
                    key={r.id}
                    className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-indigo-400">{r.predicate}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-white">{r.targetDescription || r.targetConceptId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(r.status)}
                      <span className="text-emerald-400 font-semibold">{Math.round(r.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provenance & Evidence */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Source: {selectedConcept.source}</span>
              <span>Evidence items: {selectedConcept.evidence.history.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
