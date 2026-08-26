import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Brain,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Target,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { UserFriendlyMemoryItem, UserProfile } from '../types/userState';

interface UserLearningViewProps {
  userProfile: UserProfile;
  lessons: UserFriendlyMemoryItem[];
  onOpenWhyModal: (lesson: UserFriendlyMemoryItem) => void;
  onOpenLessonDetail: (lesson: UserFriendlyMemoryItem) => void;
}

export const UserLearningView: React.FC<UserLearningViewProps> = ({
  userProfile,
  lessons,
  onOpenWhyModal,
  onOpenLessonDetail,
}) => {
  const learningTimelineSteps = [
    { num: 1, title: 'Experience', desc: 'A decision is made and an action executes in the environment.' },
    { num: 2, title: 'Prediction', desc: 'AETHERIS projects expected costs, delays, and net outcomes.' },
    { num: 3, title: 'Outcome', desc: 'Real-world ground truth outcomes and consequences are observed.' },
    { num: 4, title: 'Prediction Error', desc: 'Mathematical error evaluates if and why reality differed from expectations.' },
    { num: 5, title: 'Lesson Formed', desc: 'A structured causal lesson is synthesized with empirical confidence.' },
    { num: 6, title: 'Updated Belief', desc: 'Internal model weights and heuristics adjust to prevent recurring errors.' },
    { num: 7, title: 'Future Decision', desc: 'Subsequent decisions retrieve the lesson and select optimized actions.' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Empirical Knowledge Development
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            What I'm Learning
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            How {userProfile.name} adapts its beliefs and improves decision-making through experience.
          </p>
        </div>
      </div>

      {/* Validated Lessons Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Discovered Lessons & Rules</h2>
            <p className="text-xs text-slate-400">
              Causal patterns verified across multiple empirical observations
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {lessons.length} Active Lessons
          </span>
        </div>

        {(!lessons || lessons.length === 0) ? (
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-2xl text-center space-y-3">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-medium text-slate-300">
              No verified lessons formed yet.
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              As {userProfile.name} executes decisions and observes outcomes, it will automatically synthesize lessons when patterns repeat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(lessons || []).map((lesson) => (
              <div
                key={lesson.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        LESSON #{(lesson.id || '0000').slice(-4)}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                        {lesson.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-400">
                        {Math.round((lesson.confidence ?? 0.8) * 100)}% Confidence
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lesson.evidenceCount || 1} observations
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    "{lesson.description}"
                  </p>

                  {lesson.details?.whyBelieveThis && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-300 block">Identified Causal Factor:</span>
                      <p>{lesson.details.whyBelieveThis}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenWhyModal(lesson)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Why did I learn this?
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLessonDetail(lesson)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
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

      {/* Visual Learning Timeline */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            The Experiential Loop
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            How AETHERIS Develops Wisdom
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Unlike static models that forget everything after a prompt, AETHERIS closes the loop between expectation and reality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {learningTimelineSteps.slice(0, 4).map((step) => (
            <div
              key={step.num}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center">
                {step.num}
              </div>
              <div className="text-sm font-bold text-white">{step.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {learningTimelineSteps.slice(4).map((step) => (
            <div
              key={step.num}
              className="p-4 bg-slate-950 rounded-xl border border-indigo-500/20 bg-indigo-950/10 space-y-2 relative"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center">
                {step.num}
              </div>
              <div className="text-sm font-bold text-white">{step.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
