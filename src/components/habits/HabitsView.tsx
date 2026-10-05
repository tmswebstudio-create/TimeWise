import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HabitCard } from './HabitCard';
import {
  getTodayDateString,
  formatDurationHuman,
  formatSecondsToTime,
  getHabitDateTrackedMinutes,
  getHabitTotalTrackedMinutes,
} from '../../utils/timeUtils';
import { calculateHabitStreak, getWeekDayCircles, get30DayWindowCircles } from '../../utils/streakUtils';
import {
  Flame,
  Plus,
  Trophy,
  CheckCircle2,
  Check,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  FlameKindling,
  TrendingUp,
  X,
  Clock,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';

export const HabitsView: React.FC = () => {
  const {
    habits,
    openHabitForm,
    addHabit,
    habitCategories,
    addCustomHabitCategory,
    activeHabitTimer,
    openTimeTracker,
    cancelHabitTimer,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'pending_today' | 'done_today' | 'streaks'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'recent7' | 'recent14' | 'recent30'>('week');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [global30Offset, setGlobal30Offset] = useState<number>(0);

  // Active Timer Ticker
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number>(0);
  useEffect(() => {
    if (!activeHabitTimer) {
      setActiveTimerSeconds(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - activeHabitTimer.startTimestamp) / 1000));
      setActiveTimerSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeHabitTimer]);

  const activeTimerHabit = habits.find((h) => h.id === activeHabitTimer?.habitId);

  // Inline Category Creator on Filter Bar
  const [isAddingCategoryBar, setIsAddingCategoryBar] = useState(false);
  const [newCategoryBarName, setNewCategoryBarName] = useState('');

  const today = getTodayDateString();

  // Calculate global summary stats
  const totalHabits = habits.length;

  const completedTodayCount = habits.filter((h) =>
    (h.completedDates || []).includes(today)
  ).length;

  const totalCompletedAllTime = habits.reduce(
    (sum, h) => sum + (h.completedDates?.length || 0),
    0
  );

  const totalHabitMinutesToday = habits.reduce(
    (sum, h) => sum + getHabitDateTrackedMinutes(h.timeLogs, today),
    0
  );

  // Highest streak
  let bestActiveStreak = 0;
  let bestHabitTitle = '';
  habits.forEach((h) => {
    const s = calculateHabitStreak(h.completedDates || [], today);
    if (s.currentStreak > bestActiveStreak) {
      bestActiveStreak = s.currentStreak;
      bestHabitTitle = h.title;
    }
  });

  // Categories present in habits & custom habit categories
  const categories = Array.from(
    new Set([
      ...(habitCategories || ['Coding', 'Algorithms', 'Architecture', 'Health', 'Learning', 'Productivity', 'General']),
      ...habits.map((h) => h.category || 'General'),
    ])
  );

  // Filter habits
  const filteredHabits = habits.filter((habit) => {
    const isDoneToday = (habit.completedDates || []).includes(today);
    const streak = calculateHabitStreak(habit.completedDates || [], today);

    if (filterTab === 'pending_today' && isDoneToday) return false;
    if (filterTab === 'done_today' && !isDoneToday) return false;
    if (filterTab === 'streaks' && streak.currentStreak < 3) return false;

    if (selectedCategory !== 'all' && (habit.category || 'General') !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Week range label if in week mode
  const { weekLabel } = getWeekDayCircles(weekOffset, [], today);

  // 30 days window info if in 30-day view
  const window30 = get30DayWindowCircles(global30Offset, [], today);

  const allCompletedToday = totalHabits > 0 && completedTodayCount === totalHabits;

  const handleAddCategorySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryBarName.trim();
    if (!trimmed) return;
    addCustomHabitCategory(trimmed);
    setSelectedCategory(trimmed);
    setNewCategoryBarName('');
    setIsAddingCategoryBar(false);
  };

  // Quick template creator
  const handleCreateTemplate = (title: string, category: string, color: string, icon: string) => {
    addHabit({
      title,
      description: `Daily ${title.toLowerCase()} to master skills and maintain focus.`,
      category,
      color,
      icon,
      frequency: 'daily',
      targetDaysPerWeek: 7,
      completedDates: [today],
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Flame className="w-5 h-5 fill-white" />
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
              Habit Tracker & Streak Maker
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Build unshakeable daily habits. Click circles for each date to log completion and ignite your streaks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openHabitForm()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Active Dynamic Timer Floating Banner */}
      {activeHabitTimer && activeTimerHabit && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Active Habit Stopwatch
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping inline-block" />
              </div>
              <h3 className="font-heading font-bold text-base text-white truncate mt-0.5">
                {activeTimerHabit.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-2xl sm:text-3xl font-black font-tabular tracking-tight bg-black/20 px-3 py-1 rounded-xl">
              {formatSecondsToTime(activeTimerSeconds)}
            </span>

            <button
              type="button"
              onClick={() => openTimeTracker(activeTimerHabit.id, today)}
              className="px-3.5 py-2 text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-emerald-800" />
              <span>Stop & Save Log</span>
            </button>

            <button
              type="button"
              onClick={() => cancelHabitTimer(activeTimerHabit.id)}
              className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
              title="Discard timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Motivational Banner & Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Today's Completion */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">Completed Today</span>
            <CheckCircle2
              className={`w-4 h-4 ${
                allCompletedToday ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-slate-900">
              {completedTodayCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {totalHabits} habits</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${totalHabits > 0 ? (completedTodayCount / totalHabits) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Card 2: Highest Active Streak */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">Top Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-slate-900">
              {bestActiveStreak}
            </span>
            <span className="text-xs text-slate-400 font-medium">days 🔥</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate" title={bestHabitTitle || 'Start a habit'}>
            {bestHabitTitle ? `${bestHabitTitle}` : 'Keep going!'}
          </p>
        </div>

        {/* Card 3: Tracked Today Time */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">Tracked Today</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-slate-900">
              {formatDurationHuman(totalHabitMinutesToday)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total practice time today</p>
        </div>

        {/* Card 4: Total Completed Days */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">Total Check-ins</span>
            <Trophy className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-slate-900">
              {totalCompletedAllTime}
            </span>
            <span className="text-xs text-slate-400 font-medium">days tracked</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total historical logs</p>
        </div>

        {/* Card 5: Active Habits Count */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium">Active Habits</span>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-tabular text-slate-900">
              {totalHabits}
            </span>
            <span className="text-xs text-slate-400 font-medium">routines</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Daily commitments</p>
        </div>
      </div>

      {/* Celebration Banner when all habits done */}
      {allCompletedToday && totalHabits > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base">
                All Habits Completed Today! 🔥
              </h3>
              <p className="text-xs text-emerald-100">
                You checked off all {totalHabits} daily commitments. Your streak is on fire!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-white/20 backdrop-blur-xs text-xs font-bold rounded-full">
            100% Complete
          </span>
        </div>
      )}

      {/* 3. Toolbar & Category Filter Bar (Only when habits exist) */}
      {totalHabits > 0 && (
        <>
          {/* Toolbar: View Mode (Week / 7d / 14d / 30d) & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            {/* Left: Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Habits ({totalHabits})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('pending_today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterTab === 'pending_today'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Need Today ({totalHabits - completedTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('done_today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  filterTab === 'done_today'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Done Today ({completedTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('streaks')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterTab === 'streaks'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>3+ Days Streak</span>
              </button>
            </div>

            {/* Right: Date Range Selector & Week Navigation */}
            <div className="flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
              {viewMode === 'week' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Previous week"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-medium text-slate-700 px-1 font-tabular whitespace-nowrap">
                    {weekOffset === 0 ? 'This Week' : weekLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    disabled={weekOffset >= 0}
                    className={`p-1 rounded transition-colors ${
                      weekOffset >= 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer'
                    }`}
                    title="Next week"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {weekOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setWeekOffset(0)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              {viewMode === 'recent30' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setGlobal30Offset((prev) => prev - 1)}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title="Previous 30 days"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-medium text-slate-700 px-1 font-tabular whitespace-nowrap">
                    {global30Offset === 0 ? 'Past 30 Days' : window30.rangeLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => setGlobal30Offset((prev) => prev + 1)}
                    disabled={!window30.canGoNext}
                    className={`p-1 rounded transition-colors ${
                      !window30.canGoNext
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer'
                    }`}
                    title="Next 30 days"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {global30Offset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setGlobal30Offset(0)}
                      className="text-[10px] font-semibold text-blue-600 hover:underline ml-1"
                    >
                      Latest
                    </button>
                  )}
                </div>
              )}

              {/* View Mode Toggle: Week vs 7 Days vs 14 Days vs 30 Days */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('week');
                    setWeekOffset(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'week'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('recent7')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'recent7'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('recent14')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'recent14'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('recent30');
                    setGlobal30Offset(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'recent30'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Bar with Custom Category Option */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Inline Category Creator on Filter Bar */}
            {isAddingCategoryBar ? (
              <div className="flex items-center gap-1 bg-white border border-blue-300 rounded-lg px-2 py-0.5 shadow-xs animate-in fade-in zoom-in-95">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryBarName}
                  onChange={(e) => setNewCategoryBarName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategorySubmit();
                    else if (e.key === 'Escape') setIsAddingCategoryBar(false);
                  }}
                  placeholder="Category name..."
                  className="w-28 text-xs focus:outline-none font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategorySubmit()}
                  disabled={!newCategoryBarName.trim()}
                  className="text-blue-600 hover:text-blue-800 font-bold px-1"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategoryBar(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCategoryBar(true)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Category</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* 5. Habit Cards List */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              viewMode={viewMode}
              weekOffset={weekOffset}
              global30Offset={global30Offset}
            />
          ))}
        </div>
      ) : habits.length > 0 ? (
        /* Filter returned empty */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-semibold text-slate-800 text-sm">
            No habits match this filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching filter tabs or selecting &quot;All Habits&quot; to see your complete routine.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterTab('all');
              setSelectedCategory('all');
            }}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Empty State: No habits created yet */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-6">
          <div className="relative w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8 fill-amber-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-heading font-bold text-slate-900 text-base sm:text-lg">
              Start Your First Habit Streak
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Consistency is built one circle at a time. Click a template below to add your first habit or create a custom one.
            </p>
          </div>

          {/* Quick starter templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <button
              type="button"
              onClick={() => handleCreateTemplate('Programming Practice', 'Coding', 'indigo', 'Code')}
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                  Programming Practice
                </p>
                <p className="text-[10px] text-slate-400">Daily algorithmic coding</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateTemplate('System Design & Docs', 'Architecture', 'blue', 'Brain')}
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                  System Design & Docs
                </p>
                <p className="text-[10px] text-slate-400">Architectural reading</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateTemplate('LeetCode / Problem Solving', 'Algorithms', 'emerald', 'Target')}
              className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">
                  Daily Problem Solving
                </p>
                <p className="text-[10px] text-slate-400">1 question each day</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleCreateTemplate('Daily Fitness Workout', 'Health', 'rose', 'Dumbbell')}
              className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-rose-600">
                  Daily Workout
                </p>
                <p className="text-[10px] text-slate-400">Health & exercise</p>
              </div>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => openHabitForm()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              + Create Custom Habit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
