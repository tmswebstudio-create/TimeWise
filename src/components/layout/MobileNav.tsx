import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckSquare, Compass, BarChart3, Bookmark, Settings } from 'lucide-react';
import { ActiveView } from '../../types';
import { getTodayDateString } from '../../utils/timeUtils';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView, tasks } = useApp();

  const today = getTodayDateString();
  const remainingToday = tasks.filter((t) => t.date === today && t.status !== 'completed').length;

  const items: { id: ActiveView; label: string; icon: typeof CheckSquare; badge?: number }[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: remainingToday > 0 ? remainingToday : undefined },
    { id: 'goals', label: 'Goals', icon: Compass },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 flex items-center justify-around px-2 pb-safe shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          activeView === item.id ||
          (item.id === 'goals' && (activeView === 'goal-detail' || activeView === 'module-detail'));

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-14 min-h-[48px] py-1 transition-colors relative cursor-pointer ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1 rounded-full min-w-3.5 text-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-semibold text-blue-600' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
