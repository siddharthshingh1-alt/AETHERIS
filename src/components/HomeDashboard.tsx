import React from 'react';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  FlaskConical,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, UserFriendlyMemoryItem, ActivityEvent, AppNavTab } from '../types/userState';

interface HomeDashboardProps {
  userProfile: UserProfile;
  totalMemoriesCount: number;
  totalLessonsCount: number;
  totalBehaviorsCount: number;
  learningProgressPct: number; // calculated from real accuracy / calibration
  recentLessons: UserFriendlyMemoryItem[];
  recentActivities: ActivityEvent[];
  onNavigate: (tab: AppNavTab) => void;
  onOpenLessonDetail: (lesson: UserFriendlyMemoryItem) => void;
  onOpenWhyModal: (lesson: UserFriendlyMemoryItem) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userProfile,
  totalMemoriesCount,
  totalLessonsCount,
  totalBehaviorsCount,
  learningProgressPct,
  recentLessons,
  recentActivities,
  onNavigate,
  onOpenLessonDetail,
  onOpenWhyModal,
}) => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Active Learning Environment
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {userProfile.name}
          </h1>
          <p className="text-slate-400 text-sm">
            Learning from your experiences, decisions, and observations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-home-teach"
            onClick={() => onNavigate('CHAT')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Teach or Ask {userProfile.name}
          </button>
          <button
            id="btn-home-experiment"
            onClick={() => onNavigate('EXPERIMENTS')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            Run Test
          </button>
        </div>
      </div>

      {/* Four Big Stats Cards (Real Runtime Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memories */}
        <div
          onClick={() => onNavigate('MEMORY')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Memories
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight">
              {totalMemoriesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Recorded episodes & facts</div>
          </div>
        </div>

        {/* Lessons */}
        <div
          onClick={() => onNavigate('LEARNING')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lessons
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight">
              {totalLessonsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Validated empirical patterns</div>
          </div>
        </div>

        {/* Learned Behaviors */}
        <div
          onClick={() => onNavigate('LEARNING')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Behaviors
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight">
              {totalBehaviorsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Adapted decision rules</div>
          </div>
        </div>

        {/* Learning Progress / Calibration */}
        <div
          onClick={() => onNavigate('EXPERIMENTS')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Progress
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tracking-tight">
              {Math.round(learningProgressPct)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Prediction calibration rate</div>
          </div>
        </div>
      </div>

      {/* Main Grid: What I'm Learning + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: What I'm Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">What I'm Learning</h2>
              <p className="text-xs text-slate-400">
                Patterns and lessons {userProfile.name} has formed from real evidence
              </p>
            </div>
            <button
              onClick={() => onNavigate('LEARNING')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              View All Lessons
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(!recentLessons || recentLessons.length === 0) ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-medium text-slate-300">
                I haven't observed enough evidence to form a lesson yet.
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Teach me a rule in Chat or run a decision task in Experiments to help me build evidence.
              </p>
              <button
                onClick={() => onNavigate('CHAT')}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700 inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Teach Me Something
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(recentLessons || []).slice(0, 3).map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold rounded-md">
                          LESSON
                        </span>
                        <span className="text-xs text-slate-400">
                          {lesson.evidenceCount ? `${lesson.evidenceCount} experiences` : 'Verified rule'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white mt-1.5">
                        {lesson.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-emerald-400">
                        {Math.round((lesson.confidence ?? 0.8) * 100)}% Confidence
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {lesson.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenWhyModal(lesson)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Why did I learn this?
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLessonDetail(lesson)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                    >
                      View Evidence
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-400">Chronological machine events</p>
            </div>
            <button
              onClick={() => onNavigate('ACTIVITY')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Full Log
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            {(!recentActivities || recentActivities.length === 0) ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No recent activity recorded yet.
              </div>
            ) : (
              (recentActivities || []).slice(0, 5).map((act, index) => (
                <div key={act.id || index} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 text-indigo-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{act.title}</span>
                      <span className="text-[11px] text-slate-500">{act.timeString}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-normal">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
