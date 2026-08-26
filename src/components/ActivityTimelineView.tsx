import React, { useState } from 'react';
import {
  History,
  Clock,
  Sparkles,
  Brain,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Target,
  Filter,
} from 'lucide-react';
import { ActivityEvent, UserProfile } from '../types/userState';

interface ActivityTimelineViewProps {
  userProfile: UserProfile;
  activities: ActivityEvent[];
}

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({
  userProfile,
  activities,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filterOptions = [
    { id: 'ALL', label: 'All Events' },
    { id: 'TEACH', label: 'Teaching' },
    { id: 'MEMORY_CREATED', label: 'Memories' },
    { id: 'PREDICTION', label: 'Predictions' },
    { id: 'OUTCOME', label: 'Outcomes' },
    { id: 'LESSON', label: 'Lessons' },
    { id: 'RETRIEVAL', label: 'Retrievals' },
  ];

  const safeActivities = activities || [];

  const filteredActivities = safeActivities.filter((act) => {
    if (!act) return false;
    if (filterType === 'ALL') return true;
    return act.type === filterType;
  });

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'TEACH':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'MEMORY_CREATED':
        return <Brain className="w-4 h-4 text-emerald-400" />;
      case 'PREDICTION':
        return <Target className="w-4 h-4 text-sky-400" />;
      case 'OUTCOME':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'LESSON':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'RETRIEVAL':
        return <Brain className="w-4 h-4 text-indigo-400" />;
      case 'DECISION':
        return <Target className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Execution Trace
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Activity Timeline
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            A chronological window into how {userProfile.name} thinks, learns, and updates its memory.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilterType(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === opt.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No activity events recorded for this filter.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
            {filteredActivities.map((act, index) => (
              <div key={act.id || index} className="relative group">
                {/* Node icon on line */}
                <div className="absolute -left-[35px] top-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                  {getEventIcon(act.type)}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{act.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{act.timeString}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    {act.description}
                  </p>

                  {act.details && (
                    <div className="pt-1.5 flex flex-wrap gap-2 text-[10px]">
                      {Object.entries(act.details).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 bg-slate-950 text-slate-400 rounded border border-slate-800"
                        >
                          <span className="text-slate-500">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
