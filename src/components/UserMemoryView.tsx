import React, { useState } from 'react';
import {
  Brain,
  Search,
  Sparkles,
  Bookmark,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { MemoryCategory, UserFriendlyMemoryItem, UserProfile } from '../types/userState';

interface UserMemoryViewProps {
  userProfile: UserProfile;
  memories: UserFriendlyMemoryItem[];
  onSelectMemory: (memory: UserFriendlyMemoryItem) => void;
  onNavigateToChat: () => void;
  onForgetMemory: (memoryId: string) => void;
}

export const UserMemoryView: React.FC<UserMemoryViewProps> = ({
  userProfile,
  memories,
  onSelectMemory,
  onNavigateToChat,
  onForgetMemory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Array<{ id: MemoryCategory; label: string }> = [
    { id: 'ALL', label: 'All Memories' },
    { id: 'EXPERIENCES', label: 'Experiences' },
    { id: 'FACTS', label: 'Facts' },
    { id: 'LESSONS', label: 'Lessons' },
    { id: 'PREFERENCES', label: 'Preferences' },
    { id: 'SKILLS', label: 'Skills' },
  ];

  const safeMemories = memories || [];

  const filteredMemories = safeMemories.filter((mem) => {
    if (!mem) return false;
    const matchesCat = selectedCategory === 'ALL' || mem.category === selectedCategory;
    const title = mem.title || '';
    const desc = mem.description || '';
    const matchesQuery =
      !searchQuery.trim() ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const getSourceBadge = (source: UserFriendlyMemoryItem['source']) => {
    switch (source) {
      case 'TAUGHT_BY_YOU':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-md">
            TAUGHT BY YOU
          </span>
        );
      case 'OBSERVED':
        return (
          <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-semibold rounded-md">
            OBSERVED
          </span>
        );
      case 'INFERRED':
        return (
          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-md">
            INFERRED
          </span>
        );
      case 'LEARNED':
        return (
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold rounded-md">
            LEARNED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Info Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Structured Memory System
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Your Memory
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Everything {userProfile.name} has experienced, been taught, or learned from real outcomes.
          </p>
        </div>

        <button
          id="btn-teach-memory"
          onClick={onNavigateToChat}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Teach a New Fact
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? memories.length
                : memories.filter((m) => m.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <Brain className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-medium text-slate-300">
            {memories.length === 0
              ? "You haven't taught me anything yet."
              : 'No memories match your filter criteria.'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {memories.length === 0
              ? `Tell ${userProfile.name} about your operational rules, constraints, or preferences.`
              : 'Try selecting a different category or clearing your search term.'}
          </p>
          {memories.length === 0 && (
            <button
              onClick={onNavigateToChat}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-xl"
            >
              Teach Me Something
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              onClick={() => onSelectMemory(mem)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {getSourceBadge(mem.source)}
                  <span className="text-[11px] font-semibold text-emerald-400">
                    {Math.round(mem.confidence * 100)}% Confidence
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {mem.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {mem.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {mem.evidenceCount
                    ? `${mem.evidenceCount} experiences`
                    : mem.source === 'TAUGHT_BY_YOU'
                    ? 'Direct knowledge'
                    : '1 observation'}
                </span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium text-xs">
                  View Detail
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
