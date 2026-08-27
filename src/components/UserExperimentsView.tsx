import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { runBenchmarkExperiment, ExperimentRunResult } from '../cognitive/experimentRunner';
import { ComparativeExperimentReport, TaskComparisonResult, ExperimentSummaryOverview } from '../cognitive/metrics';
import { UserProfile } from '../types/userState';

interface UserExperimentsViewProps {
  userProfile: UserProfile;
}

export const UserExperimentsView: React.FC<UserExperimentsViewProps> = ({ userProfile }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExperimentRunResult | null>(null);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'REPEATED' | 'RELATED' | 'HELD_OUT'>('ALL');

  const handleRunExperiment = () => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const runRes = runBenchmarkExperiment();
        setResult(runRes);
      } catch (err) {
        console.error('Experiment failed:', err);
      } finally {
        setIsRunning(false);
      }
    }, 250);
  };

  const report = result?.report;

  const summary: ExperimentSummaryOverview | null = useMemo(() => {
    if (!report) return null;
    if (report.summary) return report.summary;
    if (report.learningSummary && report.controlSummary && report.delta) {
      return {
        learningSuccessRate: report.learningSummary.overallSuccessRate ?? 0,
        controlSuccessRate: report.controlSummary.overallSuccessRate ?? 0,
        successRateDelta: report.delta.successRateDelta ?? 0,
        meanUtilityDelta: report.delta.utilityDelta ?? 0,
        predictionErrorReduction: report.delta.predictionErrorReduction ?? 0,
        heldOutTransferRate: report.learningSummary.heldOutMetrics?.successRate ?? 0,
        controlHeldOutRate: report.controlSummary.heldOutMetrics?.successRate ?? 0,
      };
    }
    return null;
  }, [report]);

  const taskResults: TaskComparisonResult[] = useMemo(() => {
    if (report?.taskResults && report.taskResults.length > 0) {
      return report.taskResults;
    }
    if (result?.controlRecords && result?.learningRecords) {
      return result.controlRecords.map((ctrl, i) => {
        const learn = result.learningRecords[i];
        return {
          taskId: ctrl.taskId,
          taskFamily: ctrl.taskFamily,
          split: ctrl.split,
          controlRecord: ctrl,
          learningRecord: learn,
          utilityDelta: (learn?.actualOutcome?.netUtility ?? 0) - (ctrl?.actualOutcome?.netUtility ?? 0),
        };
      });
    }
    return [];
  }, [report, result]);

  const filteredTasks = taskResults.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.split === taskFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            Empirical Validation Laboratory
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Experiments & Benchmarks
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Scientifically test whether {userProfile.name}'s memory and learning mechanisms outperform a memoryless baseline.
          </p>
        </div>

        <button
          id="btn-run-benchmark"
          onClick={handleRunExperiment}
          disabled={isRunning}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          {isRunning ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Evaluating 36 Tasks...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run 36-Task Benchmark
            </>
          )}
        </button>
      </div>

      {/* Intro / Setup explanation */}
      {!report && !isRunning && (
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl space-y-6">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-base font-bold text-white">How This Experiment Works</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We execute two parallel agents across identical deterministic operational tasks (Supplier Selection, Resource Allocation, and Freight Timing):
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-sm font-bold text-slate-200">Control Agent (Baseline)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operates purely on static default priors. Memory is wiped between tasks. It cannot learn from delayed shipments or stockout penalties.
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Learning Agent ({userProfile.name})</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stores structured lessons when predictions deviate from reality, retrieves matching experiences, and adapts decisions to maximize net utility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {report && summary && (
        <div className="space-y-6">
          {/* Key Findings Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Success Rate Delta */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Success Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400">
                  {Math.round(summary.learningSuccessRate * 100)}%
                </span>
                <span className="text-xs text-slate-500">
                  vs {Math.round(summary.controlSuccessRate * 100)}% Control
                </span>
              </div>
              <div className="text-xs text-emerald-400 font-medium">
                +{(summary.successRateDelta * 100).toFixed(1)}% Improvement
              </div>
            </div>

            {/* Net Utility Delta */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Mean Net Utility
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-400">
                  +${Math.round(summary.meanUtilityDelta).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Higher profit & lower delay costs
              </div>
            </div>

            {/* Error Reduction */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Prediction Error
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-sky-400">
                  -{(summary.predictionErrorReduction * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Lower Brier loss / tighter calibration
              </div>
            </div>

            {/* Held-Out Generalization */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Held-Out Transfer
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-400">
                  {Math.round(summary.heldOutTransferRate * 100)}%
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Generalization to brand new scenarios
              </div>
            </div>
          </div>

          {/* Task by Task Comparative Explorer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Comparative Task Evaluation</h3>
                <p className="text-xs text-slate-400">
                  Inspect decisions side-by-side on identical tasks
                </p>
              </div>

              {/* Split Filter */}
              <div className="flex items-center gap-1.5">
                {(['ALL', 'REPEATED', 'RELATED', 'HELD_OUT'] as const).map((split) => (
                  <button
                    key={split}
                    onClick={() => setTaskFilter(split)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      taskFilter === split
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {split}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Task</th>
                    <th className="py-2.5 px-3">Family</th>
                    <th className="py-2.5 px-3">Split</th>
                    <th className="py-2.5 px-3">Control Agent</th>
                    <th className="py-2.5 px-3">Learning Agent</th>
                    <th className="py-2.5 px-3 text-right">Outcome Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTasks?.slice(0, 12).map((t) => (
                    <tr key={t.taskId} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{t.taskId}</td>
                      <td className="py-3 px-3 text-slate-400">{t.taskFamily}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                          {t.split}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            t.controlRecord.isOptimalAction
                              ? 'text-emerald-400 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          {t.controlRecord.selectedActionId}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={
                            t.learningRecord.isOptimalAction
                              ? 'text-emerald-400 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          {t.learningRecord.selectedActionId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={
                            t.utilityDelta > 0
                              ? 'text-emerald-400'
                              : t.utilityDelta < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {t.utilityDelta > 0 ? `+$${t.utilityDelta}` : `$${t.utilityDelta}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
