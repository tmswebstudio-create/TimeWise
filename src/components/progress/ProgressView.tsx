import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../common/ProgressBar';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Play,
  Bookmark,
  Calendar,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatDurationMinutes, getTodayDateString } from '../../utils/timeUtils';

export const ProgressView: React.FC = () => {
  const {
    tasks,
    goals,
    resources,
    sessions,
    settings,
    setActiveView,
  } = useApp();

  const today = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed').length;

  const completedVideos = resources.filter(
    (r) => r.type === 'youtube' && r.status === 'completed'
  ).length;

  const completedResources = resources.filter((r) => r.status === 'completed').length;

  // Calculate today focus minutes from today sessions
  const todaySessions = sessions.filter(
    (s) => s.timestamp.startsWith(today) || s.timestamp.includes(today)
  );
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetMinutes = settings.dailyTargetMinutes || 180;
  const todayHours = Math.floor(todayFocusMinutes / 60);
  const todayMins = todayFocusMinutes % 60;
  const todayHoursStr = todayFocusMinutes > 0 ? (todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`) : '0m';

  // Dynamic Weekly study days (Last 7 days)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayIndex = new Date().getDay();

  const weeklyData = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const dayName = daysOfWeek[i];
    // Find sessions that match this day of week in current week
    const dayMinutes = sessions
      .filter((s) => {
        const sessionDate = new Date(s.timestamp);
        return sessionDate.getDay() === i;
      })
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const h = (dayMinutes / 60).toFixed(1);
    return {
      day: dayName,
      minutes: dayMinutes,
      label: dayMinutes > 0 ? `${h}h` : '0h',
      isToday: i === currentDayIndex,
    };
  });

  const totalWeeklyMinutes = weeklyData.reduce((acc, d) => acc + d.minutes, 0);
  const totalWeeklyHours = Math.floor(totalWeeklyMinutes / 60);
  const totalWeeklyMins = totalWeeklyMinutes % 60;
  const weeklyTotalStr = totalWeeklyMinutes > 0 ? `${totalWeeklyHours}h ${totalWeeklyMins}m` : '0h';

  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 120);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
          Analytics & Reflection
        </span>
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 tracking-tight">
          Learning Progress
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Objective metrics on task completion, study volume, and curriculum milestones.
        </p>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tasks Today</span>
            </div>
            <div className="font-tabular font-bold text-lg text-slate-900">
              {completedTodayTasks} / {todayTasks.length}
            </div>
            <span className="text-[11px] text-slate-400">
              {todayTasks.length > 0
                ? `${Math.round((completedTodayTasks / todayTasks.length) * 100)}% completion`
                : 'No tasks scheduled'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Today's Learning</span>
            </div>
            <div className="font-tabular font-bold text-lg text-slate-900">
              {todayHoursStr}
            </div>
            <span className="text-[11px] text-slate-400">Target: {Math.round(targetMinutes / 60)}h daily</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Play className="w-3.5 h-3.5 text-red-500" />
              <span>Videos Watched</span>
            </div>
            <div className="font-tabular font-bold text-lg text-slate-900">
              {completedVideos} completed
            </div>
            <span className="text-[11px] text-slate-400">Across all courses</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Total Resources</span>
            </div>
            <div className="font-tabular font-bold text-lg text-slate-900">
              {completedResources} finished
            </div>
            <span className="text-[11px] text-slate-400">Out of {resources.length} active</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Weekly Study Volume & Goals Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study Volume Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold text-slate-900">
                Weekly Study Hours
              </h3>
              <p className="text-xs text-slate-500">Distribution over the current week</p>
            </div>
            <span className="font-tabular text-xs font-semibold text-blue-600">
              {weeklyTotalStr} Total
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 pb-2">
            <div className="h-44 flex items-end justify-between gap-3 px-2">
              {weeklyData.map((d) => {
                const heightPct = Math.round((d.minutes / maxMinutes) * 100);
                const isCurrentDay = d.isToday;

                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="font-tabular text-[10px] text-slate-400">
                      {d.label}
                    </span>

                    <div className="w-full bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden max-w-[36px]">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isCurrentDay
                            ? 'bg-blue-600'
                            : d.minutes > 0
                            ? 'bg-slate-300 hover:bg-slate-400'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <span
                      className={`text-xs font-medium ${
                        isCurrentDay ? 'text-blue-600 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Learning Goals Mastery Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-semibold text-slate-900">
                Curriculum Mastery
              </h3>
              <p className="text-xs text-slate-500">Progress across active learning goals</p>
            </div>
            <button
              onClick={() => setActiveView('goals')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {goals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setActiveView('goal-detail', goal.id)}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{goal.title}</span>
                  <span className="font-tabular font-semibold text-blue-600">
                    {goal.progress}%
                  </span>
                </div>
                <ProgressBar progress={goal.progress} height="h-2" />
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-tabular pt-0.5">
                  <span>{formatDurationMinutes(goal.totalLearningTimeMinutes)} logged</span>
                  <span>{goal.lastStudiedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEARNING HISTORY TIMELINE (Section 17) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-semibold text-slate-900">
              Learning Activity History
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of completed lectures, study sessions, and docs read
            </p>
          </div>
          <span className="font-tabular text-xs text-slate-500">
            {sessions.length} sessions logged
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {sessions.map((sess) => {
            const goal = goals.find((g) => g.id === sess.goalId);

            return (
              <div
                key={sess.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    {sess.activityType === 'Video Lecture' ? (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {sess.resourceTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{sess.activityType}</span>
                      {goal && (
                        <>
                          <span>·</span>
                          <span className="truncate">{goal.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 font-tabular">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {sess.durationMinutes} minutes
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {sess.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
