import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Brain, Shield, Compass, BookOpen, Briefcase, User } from 'lucide-react';
import { UserProfile } from '../types/userState';

interface FirstTimeExperienceProps {
  onCompleteOnboarding: (profile: UserProfile) => void;
  onSkipToDefault: () => void;
}

export const FirstTimeExperience: React.FC<FirstTimeExperienceProps> = ({
  onCompleteOnboarding,
  onSkipToDefault,
}) => {
  const [step, setStep] = useState<number>(0); // 0: Landing, 1: Name, 2: Domain, 3: Context
  const [name, setName] = useState<string>('ARIA');
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['Business', 'Work']);
  const [context, setContext] = useState<string>(
    'I manage inventory, suppliers, and logistics decisions. I want to avoid delayed deliveries and costly stockouts during high demand.'
  );

  const domainOptions = [
    { id: 'Business', label: 'Business & Operations', icon: Briefcase, desc: 'Suppliers, inventory, pricing, logistics' },
    { id: 'Work', label: 'Work & Projects', icon: Compass, desc: 'Planning, scheduling, resource management' },
    { id: 'Study', label: 'Study & Learning', icon: BookOpen, desc: 'Academics, research notes, skill mastery' },
    { id: 'Research', label: 'Scientific & Data', icon: Brain, desc: 'Hypothesis testing, empirical experiments' },
    { id: 'Personal', label: 'Personal Productivity', icon: User, desc: 'Habits, daily planning, goal tracking' },
  ];

  const handleToggleDomain = (d: string) => {
    if (selectedDomains.includes(d)) {
      if (selectedDomains.length > 1) {
        setSelectedDomains(selectedDomains.filter((item) => item !== d));
      }
    } else {
      setSelectedDomains([...selectedDomains, d]);
    }
  };

  const handleFinish = () => {
    const profile: UserProfile = {
      name: name.trim() || 'AETHERIS',
      domains: selectedDomains,
      contextDescription: context,
      createdAt: new Date().toISOString(),
      isOnboarded: true,
    };
    onCompleteOnboarding(profile);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 0: Landing */}
        {step === 0 && (
          <div className="text-center space-y-6 relative z-10 py-4">
            <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-2">
              <Brain className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                Welcome to Aetheris
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Meet Your Learning Machine
              </h1>
              <p className="text-slate-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                An AI companion that remembers real experiences, learns from real outcomes, and becomes more helpful over time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-4">
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Your Experiences
                </div>
                <div className="text-xs text-slate-400">Remembers what happened and why outcomes occurred.</div>
              </div>
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Real Lessons
                </div>
                <div className="text-xs text-slate-400">Updates its beliefs when observations deviate from predictions.</div>
              </div>
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-amber-400" />
                  Transparent
                </div>
                <div className="text-xs text-slate-400">Always explains exactly why it chose an action.</div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-create-aetheris"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                Create My Aetheris
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="btn-open-default-aetheris"
                onClick={onSkipToDefault}
                className="w-full sm:w-auto px-6 py-3.5 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
              >
                Already have one? Open Aetheris
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Naming */}
        {step === 1 && (
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Step 1 of 3</span>
              <span className="text-indigo-400">Identity</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">What should I call your Aetheris?</h2>
              <p className="text-slate-400 text-sm">
                Give your personal learning machine a name. You can change this anytime.
              </p>
            </div>

            <div className="space-y-3">
              <input
                id="input-aetheris-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., ARIA, NOVA, ATLAS..."
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl text-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Suggestions:</span>
                {['ARIA', 'NOVA', 'KAIROS', 'ATLAS', 'SAGE'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                id="btn-step1-next"
                type="button"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Domains */}
        {step === 2 && (
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Step 2 of 3</span>
              <span className="text-indigo-400">Focus Areas</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                What do you want {name} to help you with?
              </h2>
              <p className="text-slate-400 text-sm">
                Select one or more domains. {name} will tailor its memory categorization and lessons to these areas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domainOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDomains.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleDomain(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/70 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold flex items-center justify-between">
                        {opt.label}
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                id="btn-step2-next"
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Context / First Knowledge */}
        {step === 3 && (
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Step 3 of 3</span>
              <span className="text-indigo-400">Context</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                What should {name} know about your environment?
              </h2>
              <p className="text-slate-400 text-sm">
                Describe your goals, constraints, or common decisions in plain English. {name} will structure this into its first memories.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                id="input-aetheris-context"
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. I run a small online retail shop. I order from overseas suppliers and often need to decide whether to pay extra for air freight or risk maritime shipping delays..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {name} will use this context to ground its predictions and retain memory of your operational rules.
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                id="btn-finish-onboarding"
                type="button"
                onClick={handleFinish}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                Start Using {name}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
