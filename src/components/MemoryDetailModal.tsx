import React, { useState } from 'react';
import {
  X,
  Brain,
  Sparkles,
  ShieldCheck,
  Edit3,
  Trash2,
  Check,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserFriendlyMemoryItem } from '../types/userState';

interface MemoryDetailModalProps {
  memory: UserFriendlyMemoryItem | null;
  onClose: () => void;
  onCorrectMemory: (memoryId: string, correctedText: string, note: string) => void;
  onForgetMemory: (memoryId: string) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  onClose,
  onCorrectMemory,
  onForgetMemory,
}) => {
  if (!memory) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [correctedDescription, setCorrectedDescription] = useState(memory.description);
  const [correctionNote, setCorrectionNote] = useState('');

  const getSourceBadge = () => {
    switch (memory.source) {
      case 'TAUGHT_BY_YOU':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg">
            TAUGHT BY YOU
          </span>
        );
      case 'OBSERVED':
        return (
          <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold rounded-lg">
            SYSTEM OBSERVED
          </span>
        );
      case 'INFERRED':
        return (
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-lg">
            SYSTEM INFERRED
          </span>
        );
      case 'LEARNED':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg">
            LEARNED LESSON
          </span>
        );
    }
  };

  const handleSaveCorrection = () => {
    if (correctedDescription.trim()) {
      onCorrectMemory(memory.id, correctedDescription.trim(), correctionNote.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {getSourceBadge()}
              <span className="text-xs text-slate-400">
                Confidence: {Math.round(memory.confidence * 100)}%
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {memory.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit / Correction Mode vs Normal Display */}
        {isEditing ? (
          <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                What should AETHERIS remember instead?
              </label>
              <textarea
                rows={3}
                value={correctedDescription}
                onChange={(e) => setCorrectedDescription(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Reason for correction (optional):
              </label>
              <input
                type="text"
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="e.g., Supplier Alpha recently upgraded their warehouse..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Correction
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Description / Statement */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Current Memory
              </div>
              <p className="text-slate-200 leading-relaxed">{memory.description}</p>
            </div>

            {/* WHAT HAPPENED (If episodic / observational) */}
            {memory.details?.whatHappened && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  What Happened
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Expected:</span>
                    <span className="text-slate-300 font-medium">
                      {memory.details.whatHappened.expected || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Actual:</span>
                    <span className="text-slate-300 font-medium">
                      {memory.details.whatHappened.actual || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Error Delta:</span>
                    <span className="text-amber-400 font-medium">
                      {memory.details.whatHappened.predictionError || '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* WHAT I LEARNED */}
            {memory.details?.whatLearned && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  What I Learned
                </div>
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
                  {memory.details.whatLearned}
                </div>
              </div>
            )}

            {/* WHY I BELIEVE THIS & EVIDENCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">
                  Why I believe this:
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {memory.details?.whyBelieveThis ||
                    `Formed from ${memory.evidenceCount || 1} empirical experiences with high statistical consistency.`}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">
                  Evidence & Usage:
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div>
                    Evidence: <span className="font-semibold text-white">{memory.evidenceCount || 1} observations</span>
                  </div>
                  <div>
                    Decisions Influenced: <span className="font-semibold text-emerald-400">{memory.timesInfluenced || 0} times</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Correction History if any */}
            {memory.details?.userCorrectionHistory && memory.details.userCorrectionHistory.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-400">Correction History:</span>
                <div className="space-y-1">
                  {memory.details.userCorrectionHistory.map((c, i) => (
                    <div key={i} className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                      <span className="text-slate-500">{new Date(c.correctedAt).toLocaleTimeString()}:</span> Updated from "{c.previousValue}" {c.userNote ? `(${c.userNote})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onForgetMemory(memory.id)}
            className="px-3 py-1.5 text-rose-400 hover:text-rose-300 text-xs font-medium rounded-lg hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Forget Memory
          </button>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Correct
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
