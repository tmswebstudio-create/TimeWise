import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ContextualRightPanel } from './components/layout/ContextualRightPanel';

import { TasksView } from './components/tasks/TasksView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { TaskFormModal } from './components/tasks/TaskFormModal';

import { GoalsView } from './components/goals/GoalsView';
import { GoalDetailView } from './components/goals/GoalDetailView';
import { GoalFormModal } from './components/goals/GoalFormModal';
import { ModuleFormModal } from './components/goals/ModuleFormModal';
import { ModuleDetailView } from './components/goals/ModuleDetailView';

import { ResourcePlayerModal } from './components/resources/ResourcePlayerModal';
import { ResourceFormModal } from './components/resources/ResourceFormModal';

import { ProgressView } from './components/progress/ProgressView';
import { BookmarksView } from './components/bookmarks/BookmarksView';
import { BookmarkFormModal } from './components/bookmarks/BookmarkFormModal';
import { HabitsView } from './components/habits/HabitsView';
import { HabitFormModal } from './components/habits/HabitFormModal';
import { HabitTimeTrackerModal } from './components/habits/HabitTimeTrackerModal';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { TimeWiseMark } from './components/common/TimeWiseLogo';
import { Toast } from './components/common/Toast';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeView, isRightPanelOpen } = useApp();

  // Initial loading splash screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
            <TimeWiseMark className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-md animate-ping" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-heading font-semibold text-sm tracking-wide text-slate-200">TimeWise</p>
          <p className="text-xs text-slate-400">Loading your learning workspace...</p>
        </div>
      </div>
    );
  }

  // 1. FIRST PAGE: If user is not authenticated and not in guest session, show the AuthPage
  if (!user) {
    return <AuthPage />;
  }

  // 2. MAIN WORKSPACE: Shown once user signs in, creates account, or logs in as guest
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Center Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 transition-all ${isRightPanelOpen ? 'max-w-5xl' : 'max-w-6xl'}`}>
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'habits' && <HabitsView />}
          {activeView === 'goals' && <GoalsView />}
          {activeView === 'goal-detail' && <GoalDetailView />}
          {activeView === 'module-detail' && <ModuleDetailView />}
          {activeView === 'bookmarks' && <BookmarksView />}
          {activeView === 'progress' && <ProgressView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Desktop Right Contextual Panel */}
      <ContextualRightPanel />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Interactive Overlays & Modals */}
      <TaskDetailModal />
      <TaskFormModal />
      <GoalFormModal />
      <ModuleFormModal />
      <ResourcePlayerModal />
      <ResourceFormModal />
      <BookmarkFormModal />
      <HabitFormModal />
      <HabitTimeTrackerModal />
      <GlobalSearchModal />
      <AuthModal />
      <Toast />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

