import React from 'react';
import { AuthProvider } from './context/AuthContext';
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
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { Toast } from './components/common/Toast';

const AppContent: React.FC = () => {
  const { activeView, isRightPanelOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Center Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200 transition-all ${isRightPanelOpen ? 'max-w-5xl' : 'max-w-6xl'}`}>
          {activeView === 'tasks' && <TasksView />}
          {activeView === 'goals' && <GoalsView />}
          {activeView === 'goal-detail' && <GoalDetailView />}
          {activeView === 'module-detail' && <ModuleDetailView />}
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
      <GlobalSearchModal />
      <AuthModal />
      <Toast />
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

