import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  Compass,
  BarChart3,
  Bookmark,
  Settings,
  Plus,
  Clock,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Flame,
} from 'lucide-react';
import { ActiveView } from '../../types';
import { getTodayDateString } from '../../utils/timeUtils';
import { TimeWiseLogo, TimeWiseMark } from '../common/TimeWiseLogo';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    tasks,
    bookmarks,
    habits,
    sessions,
    settings,
    openTaskForm,
    isSidebarCollapsed,
    toggleSidebar,
  } = useApp();

  const today = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === today);
  const remainingToday = todayTasks.filter((t) => t.status !== 'completed').length;
  const uncompletedHabitsToday = habits.filter((h) => !(h.completedDates || []).includes(today)).length;

  // Calculate today focus minutes from today sessions
  const todaySessions = sessions.filter(
    (s) => s.timestamp.startsWith(today) || s.timestamp.includes(today)
  );
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetMinutes = settings.dailyTargetMinutes || 180;
  const focusPct = Math.min(100, Math.round((todayFocusMinutes / targetMinutes) * 100));

  const formatHoursMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const navItems: { id: ActiveView; label: string; icon: typeof CheckSquare; badge?: number }[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: remainingToday > 0 ? remainingToday : undefined },
    { id: 'habits', label: 'Habits & Streaks', icon: Flame, badge: uncompletedHabitsToday > 0 ? uncompletedHabitsToday : undefined },
    { id: 'goals', label: 'Learning Goals', icon: Compass },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, badge: bookmarks.length > 0 ? bookmarks.length : undefined },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 select-none transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Zone */}
      {isSidebarCollapsed ? (
        <div className="h-16 flex items-center justify-center border-b border-slate-200">
          <button
            onClick={() => setActiveView('tasks')}
            className="p-1 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center group"
            title="TimeWise - Learning OS"
          >
            <TimeWiseMark className="w-8 h-8 transition-transform group-hover:scale-110" />
          </button>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200">
          <button
            onClick={() => setActiveView('tasks')}
            className="flex items-center gap-2.5 text-left group overflow-hidden"
            title="TimeWise - Learning OS"
          >
            <TimeWiseLogo size="md" subtitle="Learning OS" className="transition-transform group-hover:scale-102" />
          </button>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Action: New Task */}
      <div className="p-3">
        <button
          onClick={() => openTaskForm()}
          className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors shadow-xs ${
            isSidebarCollapsed ? 'p-2.5' : 'px-3.5 py-2.5 text-xs'
          }`}
          title="Schedule Task"
          aria-label="Schedule Task"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Schedule Task</span>}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-2.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeView === item.id ||
            (item.id === 'goals' && (activeView === 'goal-detail' || activeView === 'module-detail'));

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center rounded-lg transition-colors text-left ${
                isSidebarCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2 text-xs font-medium'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </div>

              {!isSidebarCollapsed && item.badge !== undefined && (
                <span className={`text-[10px] font-tabular font-medium px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Focus Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        {!isSidebarCollapsed ? (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Daily Focus Goal</span>
              </div>
              <span className="font-tabular text-[11px] text-slate-500">
                {formatHoursMinutes(todayFocusMinutes)} / {formatHoursMinutes(targetMinutes)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${focusPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-tight flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{focusPct}% completed</span>
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-1"
            title={`Daily Focus: ${formatHoursMinutes(todayFocusMinutes)} / ${formatHoursMinutes(targetMinutes)} (${focusPct}%)`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-tabular font-semibold text-slate-700">{focusPct}%</span>
          </div>
        )}
      </div>
    </aside>
  );
};
