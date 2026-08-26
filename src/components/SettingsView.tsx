import React, { useState } from 'react';
import {
  Settings,
  Brain,
  Shield,
  Trash2,
  Save,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types/userState';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onClearUserMemory: () => void;
  onResetToDefault: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  onClearUserMemory,
  onResetToDefault,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [context, setContext] = useState(userProfile.contextDescription);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || userProfile.name,
      contextDescription: context,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Machine Configuration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings & Memory Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Customize {userProfile.name}'s identity, environment parameters, and memory isolation.
          </p>
        </div>
      </div>

      {/* Core vs User Learning Architecture Principle */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Shield className="w-4 h-4 text-emerald-400" />
          Memory Isolation & Safety Architecture
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              CORE AETHERIS (Immutable)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Contains the core cognitive architecture, deterministic reasoning mechanisms, probabilistic models, and evaluation engines. Maintained safely at system-level.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              USER AETHERIS ({userProfile.name})
            </div>
            <p className="text-slate-400 leading-relaxed">
              Contains your personal operational memories, user-taught facts, custom preferences, and empirical decision lessons. Stored and managed exclusively by you.
            </p>
          </div>
        </div>
      </div>

      {/* Profile & Identity Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
        <h2 className="text-base font-bold text-white">Identity & Context</h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">AETHERIS Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Environment & Business Context</label>
            <textarea
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Changes will take effect immediately.
          </span>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Settings Saved' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Clear Memory & Reset */}
      <div className="bg-slate-900 border border-rose-900/30 p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          Memory Management & Reset
        </h2>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Clear User Memories & Lessons</div>
              <div className="text-xs text-slate-400">
                Purges all episodic recordings, user-taught facts, and learned heuristics.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all user memories and lessons?')) {
                  onClearUserMemory();
                }
              }}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors shrink-0"
            >
              Clear Memory
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Reset Setup & Onboarding</div>
              <div className="text-xs text-slate-400">
                Re-opens the first-time setup wizard to create a brand new machine profile.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Re-run onboarding wizard from scratch?')) {
                  onResetToDefault();
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0"
            >
              Reset Machine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
