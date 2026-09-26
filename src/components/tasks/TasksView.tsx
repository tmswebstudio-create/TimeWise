import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskCard } from './TaskCard';
import { CalendarView } from './CalendarView';
import { EmptyState } from '../common/EmptyState';
import { ProgressBar } from '../common/ProgressBar';
import {
  CheckSquare,
  ListFilter,
  Calendar as CalendarIcon,
  LayoutList,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  CalendarDays,
  ArrowRight,
  History,
  CalendarClock,
  Layers,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import {
  getGreeting,
  formatCurrentDate,
  getTodayDateString,
  formatDurationMinutes,
  addDays,
  formatFriendlyDate,
  formatShortDate,
  getRelativeDayLabel,
  formatTime12h,
} from '../../utils/timeUtils';
import { Task } from '../../types';

type TaskFilterTab = 'selected_day' | 'upcoming' | 'past' | 'all';
type TaskViewMode = 'list' | 'calendar';

export const TasksView: React.FC = () => {
  const {
    tasks,
    setSelectedTaskId,
    openTaskForm,
    currentTime,
    reorderTasks,
    rescheduleIncompleteTasksToToday,
    rescheduleAllOverdueToToday,
    moveRemainingTodayToTomorrow,
  } = useApp();

  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filterTab, setFilterTab] = useState<TaskFilterTab>('selected_day');
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [showOverdueDetails, setShowOverdueDetails] = useState(false);

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const isToday = selectedDate === today;
  const isPast = selectedDate < today;
  const isFuture = selectedDate > today;

  // All overdue incomplete tasks from past days
  const allPastIncompleteTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date < today && t.status !== 'completed')
      .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));
  }, [tasks, today]);

  // Selected date's tasks
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const remainingSelectedDay = selectedDayTasks.filter((t) => t.status !== 'completed').length;
  const completedSelectedDay = selectedDayTasks.filter((t) => t.status === 'completed').length;
  const totalSelectedDay = selectedDayTasks.length;
  const completionPercent = totalSelectedDay > 0 ? Math.round((completedSelectedDay / totalSelectedDay) * 100) : 0;

  // Planned learning time for selected date
  const plannedMinutesSelectedDay = selectedDayTasks
    .filter((t) => t.category === 'Learning' || t.category === 'Practice')
    .reduce((acc, t) => {
      const [sh, sm] = (t.startTime || '09:00').split(':').map(Number);
      const [eh, em] = (t.endTime || '10:00').split(':').map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      return acc + Math.max(0, dur);
    }, 0);

  // All upcoming tasks (date > today)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date > today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [tasks, today]);

  // All past tasks (date < today)
  const pastTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date < today)
      .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));
  }, [tasks, today]);

  // Grouped tasks by date for upcoming & past views
  const groupedUpcoming = useMemo(() => {
    const groups: { [date: string]: Task[] } = {};
    for (const t of upcomingTasks) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }
    return groups;
  }, [upcomingTasks]);

  const groupedPast = useMemo(() => {
    const groups: { [date: string]: Task[] } = {};
    for (const t of pastTasks) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }
    return groups;
  }, [pastTasks]);

  // Day carousel strip: generate 11 days centered around selectedDate (-5 to +5)
  const dayStripDates = useMemo(() => {
    const days: string[] = [];
    for (let i = -5; i <= 5; i++) {
      days.push(addDays(selectedDate, i));
    }
    return days;
  }, [selectedDate]);

  // Quick navigation handlers
  const handlePrevDay = () => setSelectedDate((prev) => addDays(prev, -1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleJumpDays = (count: number) => setSelectedDate((prev) => addDays(prev, count));
  const handleGoToday = () => setSelectedDate(today);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTaskId !== id) {
      setDragOverTaskId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (sourceId && targetId && sourceId !== targetId) {
      reorderTasks(sourceId, targetId);
    }
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. UNFINISHED PAST TASKS NOTICE IN TODAY'S VIEW */}
      {isToday && allPastIncompleteTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-heading font-bold text-amber-950">
                    Unfinished Tasks Notice
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-tabular">
                    {allPastIncompleteTasks.length} Overdue
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  You have <strong className="font-semibold text-amber-950">{allPastIncompleteTasks.length} unfinished {allPastIncompleteTasks.length === 1 ? 'task' : 'tasks'}</strong> from previous days. Carry them over to today to stay on track.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowOverdueDetails(!showOverdueDetails)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>{showOverdueDetails ? 'Hide' : 'Review'}</span>
                {showOverdueDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => rescheduleAllOverdueToToday()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Move All ({allPastIncompleteTasks.length}) to Today</span>
              </button>
            </div>
          </div>

          {/* Collapsible Overdue Tasks List */}
          {showOverdueDetails && (
            <div className="mt-4 pt-3.5 border-t border-amber-200/80 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold px-1">
                <span>Overdue Tasks List:</span>
                <span>Click task to edit or check off</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allPastIncompleteTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-3 bg-white border border-amber-200 hover:border-amber-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-2xs transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 truncate block">
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {formatFriendlyDate(t.date)}
                          </span>
                          <span>·</span>
                          <span>{formatTime12h(t.startTime)} – {formatTime12h(t.endTime)}</span>
                          {t.category && (
                            <>
                              <span>·</span>
                              <span>{t.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        rescheduleIncompleteTasksToToday(t.date);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
                      title="Move this day's tasks to Today"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Move to Today</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Header with Daily Greeting & Past/Future Date Navigator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Daily Command Center
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                  isToday
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : isPast
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {getRelativeDayLabel(selectedDate, today)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 tracking-tight">
              {formatFriendlyDate(selectedDate)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isToday
                ? `${getGreeting(currentTime)}! Here is your learning roadmap for today.`
                : isPast
                ? `Viewing past schedule from ${formatFriendlyDate(selectedDate)}.`
                : `Planning ahead for ${formatFriendlyDate(selectedDate)}.`}
            </p>
          </div>

          {/* Action Bar with Date Switcher & Add Task */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Previous / Next Day Step Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleGoToday}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isToday
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
                title="Go to Today"
              >
                Today
              </button>

              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Any Date (HTML5 Date Input) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                title="Jump directly to any past or future date"
              />
            </div>

            {/* Add Task for This Date */}
            <button
              onClick={() => openTaskForm(null, { date: selectedDate })}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* 3. Interactive Horizontal Day Strip (Week / Timeline Strip) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              <span>Jump to Day</span>
            </span>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => handleJumpDays(-7)}
                className="text-slate-500 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                title="Go back 1 week"
              >
                -1 week
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={() => handleJumpDays(7)}
                className="text-slate-500 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                title="Go forward 1 week"
              >
                +1 week
              </button>
            </div>
          </div>

          {/* Day Cards Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {dayStripDates.map((dateStr) => {
              const { dayName, dayNum, monthName } = formatShortDate(dateStr);
              const isSelected = dateStr === selectedDate;
              const isStripToday = dateStr === today;
              const dayTasksCount = tasks.filter((t) => t.date === dateStr).length;
              const dayDoneCount = tasks.filter((t) => t.date === dateStr && t.status === 'completed').length;
              const allDone = dayTasksCount > 0 && dayDoneCount === dayTasksCount;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dateStr);
                    if (filterTab !== 'selected_day') setFilterTab('selected_day');
                  }}
                  className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[76px] py-2 px-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102 font-semibold'
                      : isStripToday
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 hover:bg-blue-100/70'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${
                      isSelected ? 'text-blue-100' : isStripToday ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {dayName}
                  </span>

                  <span className="text-base sm:text-lg font-heading font-bold font-tabular leading-tight">
                    {dayNum}
                  </span>

                  <span
                    className={`text-[9px] mb-1 font-medium ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {monthName}
                  </span>

                  {/* Task Indicator Badge */}
                  {dayTasksCount > 0 ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-tabular flex items-center gap-0.5 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : allDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {allDone && '✓ '}{dayDoneCount}/{dayTasksCount}
                    </span>
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white/40' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Daily Summary Cards for Selected Date */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Tasks Remaining
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-heading font-semibold text-slate-900 font-tabular">
                {remainingSelectedDay}
              </span>
              <span className="text-[11px] text-slate-400">for {isToday ? 'today' : 'this day'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Completed Tasks
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-heading font-semibold text-emerald-600 font-tabular">
                {completedSelectedDay}
              </span>
              <span className="text-[11px] text-slate-400">
                {totalSelectedDay > 0 ? `(${completionPercent}%)` : 'done'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Planned Learning Time
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-heading font-semibold text-blue-600 font-tabular">
                {formatDurationMinutes(plannedMinutesSelectedDay)}
              </span>
              <span className="text-[11px] text-slate-400">scheduled</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
              <span>Day Progress</span>
              <span className="font-semibold text-slate-800 font-tabular">{completionPercent}%</span>
            </div>
            <ProgressBar progress={completionPercent} color={completionPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'} height="h-2" />
            <span className="text-[10px] text-slate-400 mt-1">
              {totalSelectedDay === 0 ? 'No tasks scheduled' : `${completedSelectedDay} of ${totalSelectedDay} completed`}
            </span>
          </div>
        </div>

        {/* If viewing Today & have remaining tasks: Quick roll-over helper */}
        {isToday && remainingSelectedDay > 0 && (
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>{remainingSelectedDay} tasks</strong> remaining on today's schedule.
              </span>
            </div>
            <button
              onClick={() => moveRemainingTodayToTomorrow()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <span>Move Remaining to Tomorrow</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* If viewing Past Day & have remaining tasks */}
        {isPast && remainingSelectedDay > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                You have <strong>{remainingSelectedDay} unfinished {remainingSelectedDay === 1 ? 'task' : 'tasks'}</strong> on this past day.
              </span>
            </div>
            <button
              onClick={() => rescheduleIncompleteTasksToToday(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reschedule This Day's Unfinished to Today</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Controls Bar: Tabs & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setFilterTab('selected_day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'selected_day'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isToday ? 'Today' : formatShortDate(selectedDate).dayName + ' ' + formatShortDate(selectedDate).dayNum} ({selectedDayTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Upcoming ({upcomingTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'past'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past History ({pastTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>

        {/* View Mode Toggle: List vs Calendar */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* 6. Main Tasks Presentation */}
      {viewMode === 'calendar' ? (
        <CalendarView
          onSelectTask={(id) => setSelectedTaskId(id)}
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
        />
      ) : filterTab === 'selected_day' ? (
        /* SELECTED DAY LIST VIEW */
        <div>
          {selectedDayTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={
                isToday
                  ? 'Your schedule is clear for today.'
                  : isPast
                  ? `No tasks were scheduled for ${formatFriendlyDate(selectedDate)}.`
                  : `No upcoming tasks scheduled for ${formatFriendlyDate(selectedDate)}.`
              }
              description={
                isPast
                  ? 'You can add a retroactive record or review notes for this date.'
                  : `Plan a study block or schedule your learning priorities for ${formatFriendlyDate(selectedDate)}.`
              }
              actionLabel={`Add Task for ${formatFriendlyDate(selectedDate)}`}
              onAction={() => openTaskForm(null, { date: selectedDate })}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>
                  Showing {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'} for {formatFriendlyDate(selectedDate)}
                </span>
                <span className="text-[11px] text-slate-400">Drag to reorder sequence</span>
              </div>

              {selectedDayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable={true}
                  isDragging={draggedTaskId === task.id}
                  isDragOver={dragOverTaskId === task.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onSelect={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : filterTab === 'upcoming' ? (
        /* ALL UPCOMING TASKS (Grouped by Date) */
        <div className="space-y-6">
          {upcomingTasks.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming future tasks scheduled."
              description="Plan your study schedule for tomorrow and the upcoming weeks."
              actionLabel="Schedule Future Task"
              onAction={() => openTaskForm(null, { date: addDays(today, 1) })}
            />
          ) : (
            Object.keys(groupedUpcoming).map((dateKey) => {
              const dayTasksList = groupedUpcoming[dateKey];
              return (
                <div key={dateKey} className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                      <h3 className="font-heading font-bold text-sm text-slate-900">
                        {formatFriendlyDate(dateKey)}
                      </h3>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded-md">
                        {getRelativeDayLabel(dateKey, today)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDate(dateKey);
                        setFilterTab('selected_day');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span>Go to this day</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {dayTasksList.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        draggable={true}
                        isDragging={draggedTaskId === task.id}
                        isDragOver={dragOverTaskId === task.id}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onSelect={() => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : filterTab === 'past' ? (
        /* PAST HISTORY TASKS (Grouped by Date) */
        <div className="space-y-6">
          {pastTasks.length === 0 ? (
            <EmptyState
              icon={History}
              title="No past task records found."
              description="Completed and past tasks will appear here in chronological order."
            />
          ) : (
            Object.keys(groupedPast).map((dateKey) => {
              const dayTasksList = groupedPast[dateKey];
              const completedCount = dayTasksList.filter((t) => t.status === 'completed').length;
              const incompleteCount = dayTasksList.length - completedCount;
              return (
                <div key={dateKey} className="space-y-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <h3 className="font-heading font-bold text-sm text-slate-900">
                        {formatFriendlyDate(dateKey)}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.2 rounded-md">
                        {getRelativeDayLabel(dateKey, today)}
                      </span>
                      <span className="text-xs text-slate-500 font-tabular">
                        ({completedCount}/{dayTasksList.length} completed)
                      </span>
                      {incompleteCount > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          {incompleteCount} unfinished
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {incompleteCount > 0 && (
                        <button
                          onClick={() => rescheduleIncompleteTasksToToday(dateKey)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Move to Today</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDate(dateKey);
                          setFilterTab('selected_day');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <span>Go to this day</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {dayTasksList.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        draggable={true}
                        isDragging={draggedTaskId === task.id}
                        isDragOver={dragOverTaskId === task.id}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        onSelect={() => setSelectedTaskId(task.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ALL TASKS */
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found."
              actionLabel="Add Task"
              onAction={() => openTaskForm()}
            />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                draggable={true}
                isDragging={draggedTaskId === task.id}
                isDragOver={dragOverTaskId === task.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onSelect={() => setSelectedTaskId(task.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
