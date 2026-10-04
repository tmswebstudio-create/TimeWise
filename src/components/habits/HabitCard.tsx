import React, { useState } from 'react';
import { Habit } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateHabitStreak,
  DayCircleItem,
  getWeekDayCircles,
  getRecentDayCircles,
  get30DayWindowCircles,
} from '../../utils/streakUtils';
import { getTodayDateString } from '../../utils/timeUtils';
import {
  Flame,
  Code,
  Brain,
  Target,
  BookOpen,
  Dumbbell,
  Zap,
  CheckCircle2,
  Trophy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

const formatStartDate = (startDateStr: string, todayStr: string): string => {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const sDate = new Date(sy, sm - 1, sd);
  const tDate = new Date(ty, tm - 1, td);
  const diffTime = tDate.getTime() - sDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const monthName = sDate.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = sDate.getDate();

  if (startDateStr === todayStr) return `Today (Day 1)`;
  if (diffDays === 1) return `Yesterday (${monthName} ${dayNum} · Day 2)`;
  if (diffDays > 1) return `${monthName} ${dayNum} (${diffDays}d ago · Day ${diffDays + 1})`;
  if (diffDays < 0) return `${monthName} ${dayNum} (in ${Math.abs(diffDays)}d)`;
  return `${monthName} ${dayNum}`;
};

interface HabitCardProps {
  habit: Habit;
  viewMode: 'week' | 'recent7' | 'recent14' | 'recent30';
  weekOffset?: number;
  global30Offset?: number;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, viewMode, weekOffset = 0, global30Offset = 0 }) => {
  const { toggleHabitDate, openHabitForm, deleteHabit } = useApp();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMonthView, setShowMonthView] = useState(false);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const today = getTodayDateString();
  const streak = calculateHabitStreak(habit.completedDates || [], today);

  // 30 days window data anchored to habit.startDate with previous/next navigation
  const active30Offset = viewMode === 'recent30' ? global30Offset : monthOffset;
  const window30Data = get30DayWindowCircles(
    active30Offset,
    habit.completedDates,
    today,
    habit.startDate
  );

  // Custom color hex if specified
  const customHex = habit.customColorHex || (habit.color?.startsWith('#') ? habit.color : null);

  // Icon rendering (custom uploaded icon or Lucide preset)
  const renderIcon = (iconName?: string) => {
    if (habit.customIconUrl) {
      return (
        <img
          src={habit.customIconUrl}
          alt={habit.title}
          className="w-5 h-5 object-contain rounded-xs"
        />
      );
    }
    const props = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'Code':
        return <Code {...props} />;
      case 'Brain':
        return <Brain {...props} />;
      case 'Target':
        return <Target {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      case 'Dumbbell':
        return <Dumbbell {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'CheckCircle2':
        return <CheckCircle2 {...props} />;
      case 'Flame':
      default:
        return <Flame {...props} />;
    }
  };

  // Color schemes for habits
  const colorMap: Record<
    string,
    {
      bgLight: string;
      border: string;
      text: string;
      circleBg: string;
      circleBorder: string;
      badgeBg: string;
      flameColor: string;
      ringColor: string;
    }
  > = {
    indigo: {
      bgLight: 'bg-indigo-50/70',
      border: 'border-indigo-100 hover:border-indigo-200',
      text: 'text-indigo-600',
      circleBg: 'bg-indigo-600',
      circleBorder: 'border-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      flameColor: 'text-indigo-500',
      ringColor: 'ring-indigo-400',
    },
    blue: {
      bgLight: 'bg-blue-50/70',
      border: 'border-blue-100 hover:border-blue-200',
      text: 'text-blue-600',
      circleBg: 'bg-blue-600',
      circleBorder: 'border-blue-600',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      flameColor: 'text-blue-500',
      ringColor: 'ring-blue-400',
    },
    emerald: {
      bgLight: 'bg-emerald-50/70',
      border: 'border-emerald-100 hover:border-emerald-200',
      text: 'text-emerald-600',
      circleBg: 'bg-emerald-600',
      circleBorder: 'border-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      flameColor: 'text-emerald-500',
      ringColor: 'ring-emerald-400',
    },
    amber: {
      bgLight: 'bg-amber-50/70',
      border: 'border-amber-100 hover:border-amber-200',
      text: 'text-amber-600',
      circleBg: 'bg-amber-500',
      circleBorder: 'border-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      flameColor: 'text-amber-500',
      ringColor: 'ring-amber-400',
    },
    rose: {
      bgLight: 'bg-rose-50/70',
      border: 'border-rose-100 hover:border-rose-200',
      text: 'text-rose-600',
      circleBg: 'bg-rose-600',
      circleBorder: 'border-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      flameColor: 'text-rose-500',
      ringColor: 'ring-rose-400',
    },
    cyan: {
      bgLight: 'bg-cyan-50/70',
      border: 'border-cyan-100 hover:border-cyan-200',
      text: 'text-cyan-600',
      circleBg: 'bg-cyan-600',
      circleBorder: 'border-cyan-600',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      flameColor: 'text-cyan-500',
      ringColor: 'ring-cyan-400',
    },
    violet: {
      bgLight: 'bg-purple-50/70',
      border: 'border-purple-100 hover:border-purple-200',
      text: 'text-purple-600',
      circleBg: 'bg-purple-600',
      circleBorder: 'border-purple-600',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      flameColor: 'text-purple-500',
      ringColor: 'ring-purple-400',
    },
  };

  const colors = colorMap[habit.color] || colorMap.indigo;

  // Determine which day circles to show
  let dayCircles: DayCircleItem[] = [];
  if (viewMode === 'week') {
    const { days } = getWeekDayCircles(weekOffset, habit.completedDates, today);
    dayCircles = days;
  } else if (viewMode === 'recent14') {
    dayCircles = getRecentDayCircles(14, habit.completedDates, today);
  } else if (viewMode === 'recent30') {
    dayCircles = window30Data.days;
  } else {
    dayCircles = getRecentDayCircles(7, habit.completedDates, today);
  }

  const isCompletedToday = streak.isCompletedToday;

  return (
    <div
      className={`bg-white rounded-2xl border ${colors.border} p-5 shadow-xs transition-all duration-200 hover:shadow-md relative group`}
    >
      {/* Top Header: Icon, Title, Category & Actions */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              customHex ? '' : colors.bgLight + ' ' + colors.text
            } shadow-xs border border-white`}
            style={
              customHex
                ? {
                    backgroundColor: `${customHex}18`,
                    color: customHex,
                    borderColor: `${customHex}35`,
                  }
                : undefined
            }
          >
            {renderIcon(habit.icon)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-heading font-semibold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                {habit.title}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                  customHex ? '' : colors.badgeBg
                }`}
                style={
                  customHex
                    ? {
                        backgroundColor: `${customHex}12`,
                        color: customHex,
                        borderColor: `${customHex}35`,
                      }
                    : undefined
                }
              >
                {habit.category || 'Habit'}
              </span>
            </div>

            {habit.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mb-1">{habit.description}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap mt-1">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {habit.frequency === 'weekdays'
                    ? 'Weekdays (Mon–Fri)'
                    : habit.frequency === 'custom'
                    ? `${habit.targetDaysPerWeek || 5} days / week`
                    : 'Daily commitment'}
                </span>
              </span>

              {/* Start Date display - Bigger, prominent & clearly visible */}
              {habit.startDate && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-800 border border-blue-200/90 rounded-xl font-tabular text-xs font-semibold shadow-2xs transition-all hover:border-blue-300"
                  title={`Habit started on ${habit.startDate}`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>
                    Started: <strong className="font-bold text-blue-900">{formatStartDate(habit.startDate, today)}</strong>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Check-in for Today & Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => toggleHabitDate(habit.id, today)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              isCompletedToday
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80'
            }`}
            title={isCompletedToday ? 'Completed today! Click to undo' : 'Mark done for today'}
          >
            {isCompletedToday ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Done today</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Check today</span>
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => openHabitForm(habit)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit habit"
            aria-label="Edit habit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1 animate-in fade-in">
              <span className="text-[10px] text-red-700 font-medium px-1">Delete?</span>
              <button
                type="button"
                onClick={() => deleteHabit(habit.id)}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete habit"
              aria-label="Delete habit"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Streak Dashboard Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-2.5 mb-4 border border-slate-100">
        {/* 1. Current Streak */}
        <div className="flex items-center gap-2 px-1">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              streak.currentStreak > 0
                ? 'bg-amber-100 text-amber-600 animate-pulse'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-tabular text-slate-900">
                {streak.currentStreak}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {streak.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Streak
            </p>
          </div>
        </div>

        {/* 2. Longest Streak */}
        <div className="flex items-center gap-2 border-l border-slate-200/60 px-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-tabular text-slate-900">
                {streak.longestStreak}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {streak.longestStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Personal Best
            </p>
          </div>
        </div>

        {/* 3. Consistency / Total Completed */}
        <div className="flex items-center gap-2 border-l border-slate-200/60 px-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-tabular text-slate-900">
                {streak.completionRateLast30Days}%
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">last 30d</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Consistency
            </p>
          </div>
        </div>
      </div>

      {/* Date Circles Section (The Streak Maker) */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span>Streak Circles</span>
            <span className="text-[10px] font-normal text-slate-400">
              (click any circle to toggle done)
            </span>
          </p>

          <button
            type="button"
            onClick={() => setShowMonthView(!showMonthView)}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{showMonthView ? 'Hide 30-day view' : '30-day view'}</span>
            {showMonthView ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Primary Circles Row */}
        <div
          className={`grid gap-2 items-center ${
            viewMode === 'recent30'
              ? 'grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5'
              : dayCircles.length === 14
              ? 'grid-cols-7 sm:grid-cols-14'
              : 'grid-cols-7'
          }`}
        >
          {dayCircles.map((day) => {
            const isDone = day.isCompleted;
            const isCurrentToday = day.isToday;
            const isFuture = day.isFuture;

            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                {/* Day of Week Label */}
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider ${
                    isCurrentToday ? 'font-bold text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {day.dayOfWeekShort.slice(0, 3)}
                </span>

                {/* Interactive Circle Button */}
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => !isFuture && toggleHabitDate(habit.id, day.date)}
                  style={
                    isDone && customHex
                      ? {
                          backgroundColor: customHex,
                          borderColor: customHex,
                          color: '#ffffff',
                          boxShadow: `0 2px 8px ${customHex}40`,
                        }
                      : undefined
                  }
                  className={`relative ${
                    viewMode === 'recent30' ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-9 h-9 sm:w-10 sm:h-10'
                  } rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none ${
                    isFuture
                      ? 'bg-slate-50 border border-dashed border-slate-200 text-slate-300 cursor-not-allowed'
                      : isDone
                      ? `${customHex ? '' : colors.circleBg} text-white shadow-xs scale-100 active:scale-95 cursor-pointer ring-offset-2 ring-2 ${customHex ? 'ring-slate-400' : colors.ringColor}`
                      : isCurrentToday
                      ? 'bg-white border-2 border-blue-500 text-slate-700 hover:border-blue-600 hover:bg-blue-50/40 active:scale-95 cursor-pointer ring-2 ring-blue-200/60 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 active:scale-95 cursor-pointer'
                  }`}
                  title={`${day.date}${isCurrentToday ? ' (Today)' : ''} - ${
                    isDone ? 'Completed! Click to undo' : isFuture ? 'Future date' : 'Click to mark done'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3] animate-in zoom-in-75 duration-150" />
                  ) : (
                    <span className="text-xs font-semibold font-tabular leading-none">
                      {day.dayNumber}
                    </span>
                  )}

                  {/* Dot indicator for today */}
                  {isCurrentToday && (
                    <span
                      className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${
                        isDone ? 'bg-white' : 'bg-blue-600 animate-pulse'
                      }`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable 30-Day Heatmap Circles Grid with Left/Right Arrow Navigation */}
      {showMonthView && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>30-Day Window:</span>
              </span>
              <span className="text-slate-700 font-bold font-tabular text-xs bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {window30Data.rangeLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({window30Data.completedCount} / 30 done)
              </span>
            </div>

            {/* Left and Right Arrow Navigation Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev - 1)}
                disabled={!window30Data.canGoPrev}
                className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1 shadow-2xs ${
                  !window30Data.canGoPrev
                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 active:scale-95 cursor-pointer'
                }`}
                title={window30Data.canGoPrev ? 'View previous 30 days' : 'Reached start of habit'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev 30d</span>
              </button>

              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev + 1)}
                disabled={!window30Data.canGoNext}
                className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-semibold flex items-center gap-1 shadow-2xs ${
                  !window30Data.canGoNext
                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 active:scale-95 cursor-pointer'
                }`}
                title="View next 30 days"
              >
                <span>Next 30d</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {monthOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className="px-2 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Days 1–30
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 sm:gap-2">
            {window30Data.days.map((day) => {
              const isDone = day.isCompleted;
              const isCurrentToday = day.isToday;
              const isFuture = day.isFuture;

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={isFuture}
                  onClick={() => !isFuture && toggleHabitDate(habit.id, day.date)}
                  style={
                    isDone && customHex
                      ? {
                          backgroundColor: customHex,
                          borderColor: customHex,
                          color: '#ffffff',
                          boxShadow: `0 2px 6px ${customHex}40`,
                        }
                      : undefined
                  }
                  className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex flex-col items-center justify-center text-xs font-tabular transition-all select-none cursor-pointer ${
                    isFuture
                      ? 'bg-slate-50 border border-dashed border-slate-200 text-slate-300 cursor-not-allowed'
                      : isDone
                      ? `${customHex ? '' : colors.circleBg} text-white font-bold shadow-xs active:scale-95 ring-2 ring-offset-1 ${customHex ? 'ring-slate-400' : colors.ringColor}`
                      : isCurrentToday
                      ? 'border-2 border-blue-500 bg-white font-bold text-blue-600 shadow-xs hover:bg-blue-50'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  title={`${day.date}${isCurrentToday ? ' (Today)' : ''} - ${
                    isDone ? 'Completed! Click to undo' : isFuture ? 'Future date' : 'Click to mark done'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{day.dayNumber}</span>
                  )}
                  {isCurrentToday && (
                    <span
                      className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${
                        isDone ? 'bg-white' : 'bg-blue-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
