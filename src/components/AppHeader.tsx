import React from 'react';
import {
  Brain,
  Home,
  MessageSquare,
  Sparkles,
  Layers,
  History,
  FlaskConical,
  Settings,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { AppNavTab, AppMode, UserProfile } from '../types/userState';

interface AppHeaderProps {
  userProfile: UserProfile;
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  mode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  // Real status indicators
  learningStatus: 'NORMAL' | 'LIMITED_EVIDENCE' | 'LOW_CONFIDENCE';
  memoryCount: number;
  lessonCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userProfile,
  activeTab,
  onSelectTab,
  mode,
  onToggleMode,
  learningStatus,
  memoryCount,
  lessonCount,
}) => {
  const tabs = [
    { id: 'HOME' as AppNavTab, label: 'Home', icon: Home },
    { id: 'CHAT' as AppNavTab, label: 'Chat', icon: MessageSquare },
    { id: 'MEMORY' as AppNavTab, label: 'Memory', icon: Brain, badge: memoryCount },
    { id: 'LEARNING' as AppNavTab, label: 'Learning', icon: Sparkles, badge: lessonCount },
    { id: 'ACTIVITY' as AppNavTab, label: 'Activity', icon: History },
    { id: 'EXPERIMENTS' as AppNavTab, label: 'Experiments', icon: FlaskConical },
    { id: 'SETTINGS' as AppNavTab, label: 'Settings', icon: Settings },
  ];

  const getStatusBadge = () => {
    switch (learningStatus) {
      case 'NORMAL':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Learning normally</span>
            <span className="sm:hidden">Learning</span>
          </div>
        );
      case 'LIMITED_EVIDENCE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="hidden sm:inline">Limited evidence</span>
            <span className="sm:hidden">Limited</span>
          </div>
        );
      case 'LOW_CONFIDENCE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="hidden sm:inline">Low confidence</span>
            <span className="sm:hidden">Low</span>
          </div>
        );
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Bar: Brand, Status, Mode Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Machine Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  {userProfile.name}
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700 font-medium">
                  {userProfile.domains[0] || 'Operations'}
                </span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                Your Personal Learning Machine
              </div>
            </div>
          </div>

          {/* Center / Right: Status & Mode Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status indicator */}
            {getStatusBadge()}

            {/* Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                id="btn-mode-simple"
                onClick={() => onToggleMode('SIMPLE')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  mode === 'SIMPLE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simple Mode
              </button>
              <button
                id="btn-mode-expert"
                onClick={() => onToggleMode('EXPERT')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  mode === 'EXPERT'
                    ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Expert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 py-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id.toLowerCase()}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
