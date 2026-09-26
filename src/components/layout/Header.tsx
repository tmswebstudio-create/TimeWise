import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Compass,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  LogOut,
  User,
  Cloud,
  ChevronDown,
} from 'lucide-react';
import { TimeWiseMark } from '../common/TimeWiseLogo';

export const Header: React.FC = () => {
  const {
    activeView,
    goals,
    modules,
    selectedGoalId,
    selectedModuleId,
    setActiveView,
    setIsSearchOpen,
    isRightPanelOpen,
    toggleRightPanel,
    isSidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const { user, isGuest, signOutUser, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentGoal = goals.find((g) => g.id === selectedGoalId);
  const currentModule = modules.find((m) => m.id === selectedModuleId);

  // User initials
  const displayName = user?.displayName || (isGuest ? 'Guest Learner' : 'Learner');
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'TW';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Zone 1: Sidebar Toggle + Contextual Breadcrumb / Title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Mobile Logo Mark */}
        <div className="md:hidden flex items-center gap-2 mr-1">
          <button
            onClick={() => setActiveView('tasks')}
            className="hover:opacity-85 transition-opacity"
            title="TimeWise"
          >
            <TimeWiseMark className="w-7 h-7" />
          </button>
        </div>

        {/* Breadcrumb Navigation for Nested Views only */}
        {activeView === 'goal-detail' && currentGoal && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveView('goals')}
              className="hover:text-blue-600 transition-colors flex items-center gap-1 text-slate-600 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Goals</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">{currentGoal.title}</span>
          </div>
        )}

        {activeView === 'module-detail' && currentGoal && currentModule && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveView('goals')}
              className="hover:text-blue-600 transition-colors hidden sm:inline cursor-pointer"
            >
              Goals
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <button
              type="button"
              onClick={() => setActiveView('goal-detail', currentGoal.id)}
              className="hover:text-blue-600 transition-colors truncate max-w-[120px] text-slate-600 cursor-pointer"
            >
              {currentGoal.title}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">
              {currentModule.code}. {currentModule.title}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2 & 3: Global Search + Primary Actions + Right Panel Toggle + User Account */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-500 text-xs rounded-lg transition-colors border border-slate-200/60"
          title="Search tasks, goals, modules, resources (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </button>

        {/* User Account / Auth Trigger */}
        <div className="relative" ref={userMenuRef}>
          {user ? (
            <div>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title={`${displayName} (${user.email || 'Guest'})`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-heading font-semibold text-xs ring-2 ring-blue-100">
                  {initials}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {user.email || (isGuest ? 'Temporary Guest Session' : 'No email')}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 font-medium">
                      <Cloud className="w-3 h-3" />
                      <span>Connected to Firebase Firestore</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveView('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await signOutUser();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Right Panel Collapse / Expand Button located after Sign-In */}
        <div className="pl-1 sm:pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={toggleRightPanel}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isRightPanelOpen
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700 bg-white'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold shadow-xs'
            }`}
            title={isRightPanelOpen ? 'Collapse right focus panel' : 'Expand right focus panel'}
            aria-label={isRightPanelOpen ? 'Collapse right focus panel' : 'Expand right focus panel'}
          >
            {isRightPanelOpen ? (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Panel</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline text-blue-700">Focus Panel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
