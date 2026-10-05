import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HabitTimeLog } from '../../types';
import {
  getTodayDateString,
  getCurrentTimeString24h,
  formatTime12h,
  formatDurationHuman,
  formatDurationMinutes,
  calculateDurationBetweenTimes,
  formatSecondsToTime,
  getHabitDateTrackedMinutes,
  getHabitTotalTrackedMinutes,
  getHabitTimeLogsForDate,
  getHabitDatesWithLogs,
} from '../../utils/timeUtils';
import {
  Clock,
  Play,
  Square,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

interface HabitTimeTrackerModalProps {
  initialTab?: 'timer' | 'manual' | 'logs';
}

export const HabitTimeTrackerModal: React.FC<HabitTimeTrackerModalProps> = ({
  initialTab = 'manual',
}) => {
  const {
    habits,
    isTimeTrackerOpen,
    activeTimeTrackingHabitId,
    timeTrackerInitialDate,
    closeTimeTracker,
    addHabitTimeLog,
    deleteHabitTimeLog,
    updateHabitTimeLog,
    activeHabitTimer,
    startHabitTimer,
    stopHabitTimer,
    cancelHabitTimer,
    toggleHabitDate,
  } = useApp();

  // Find the selected habit
  const habit = useMemo(
    () => habits.find((h) => h.id === activeTimeTrackingHabitId),
    [habits, activeTimeTrackingHabitId]
  );

  const today = getTodayDateString();

  // Active tab: 'timer' | 'manual' | 'logs'
  const [activeTab, setActiveTab] = useState<'timer' | 'manual' | 'logs'>(initialTab);

  // Selected date for viewing daily logs
  const [selectedLogsDate, setSelectedLogsDate] = useState<string>(
    timeTrackerInitialDate || today
  );

  // Update selected date whenever initial date or habit opens
  useEffect(() => {
    if (isTimeTrackerOpen) {
      if (timeTrackerInitialDate) {
        setSelectedLogsDate(timeTrackerInitialDate);
        setManualDate(timeTrackerInitialDate);
      } else {
        setSelectedLogsDate(today);
        setManualDate(today);
      }

      // If timer is already running for this habit, switch to timer tab by default
      if (activeHabitTimer && activeHabitTimer.habitId === activeTimeTrackingHabitId) {
        setActiveTab('timer');
      }
    }
  }, [isTimeTrackerOpen, timeTrackerInitialDate, activeHabitTimer, activeTimeTrackingHabitId, today]);

  // ------------------------------------------------------------------
  // MANUAL ENTRY STATE
  // ------------------------------------------------------------------
  const [manualDate, setManualDate] = useState<string>(today);
  const [manualStartTime, setManualStartTime] = useState<string>('09:00');
  const [manualStopTime, setManualStopTime] = useState<string>('10:00');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualMarkCompleted, setManualMarkCompleted] = useState<boolean>(true);
  const [manualError, setManualError] = useState<string | null>(null);

  // Automatically calculate duration whenever manual start or stop time changes!
  const manualCalculatedMinutes = useMemo(() => {
    if (!manualStartTime || !manualStopTime) return 0;
    return calculateDurationBetweenTimes(manualStartTime, manualStopTime);
  }, [manualStartTime, manualStopTime]);

  // Quick preset helper
  const applyPresetDuration = (minutesToAdd: number) => {
    if (!manualStartTime) return;
    const [h, m] = manualStartTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const totalMinutes = (h * 60 + m + minutesToAdd) % (24 * 60);
    const endH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    setManualStopTime(`${endH}:${endM}`);
  };

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit) return;
    setManualError(null);

    if (!manualStartTime || !manualStopTime) {
      setManualError('Please specify both Start Time and Stop Time.');
      return;
    }

    if (manualCalculatedMinutes <= 0) {
      setManualError('Calculated duration must be greater than 0 minutes.');
      return;
    }

    addHabitTimeLog(
      habit.id,
      {
        habitId: habit.id,
        date: manualDate || today,
        startTime: manualStartTime,
        endTime: manualStopTime,
        durationMinutes: manualCalculatedMinutes,
        notes: manualNotes.trim() || undefined,
      },
      manualMarkCompleted
    );

    // Reset notes and switch to logs tab for immediate feedback
    setManualNotes('');
    setSelectedLogsDate(manualDate || today);
    setActiveTab('logs');
  };

  // ------------------------------------------------------------------
  // DYNAMIC TIMER STATE & TICKER
  // ------------------------------------------------------------------
  const isThisHabitTiming = Boolean(
    activeHabitTimer && habit && activeHabitTimer.habitId === habit.id
  );

  const [timerSecondsElapsed, setTimerSecondsElapsed] = useState<number>(0);
  const [timerNotes, setTimerNotes] = useState<string>('');
  const [timerMarkCompleted, setTimerMarkCompleted] = useState<boolean>(true);

  useEffect(() => {
    if (!isThisHabitTiming || !activeHabitTimer) {
      setTimerSecondsElapsed(0);
      return;
    }

    const updateTicker = () => {
      const diffMs = Date.now() - activeHabitTimer.startTimestamp;
      setTimerSecondsElapsed(Math.max(0, Math.floor(diffMs / 1000)));
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [isThisHabitTiming, activeHabitTimer]);

  const handleStartTimer = () => {
    if (!habit) return;
    startHabitTimer(habit.id);
  };

  const handleStopAndSaveTimer = () => {
    if (!habit) return;
    stopHabitTimer(habit.id, timerNotes, timerMarkCompleted);
    setTimerNotes('');
    setSelectedLogsDate(today);
    setActiveTab('logs');
  };

  const handleCancelTimer = () => {
    if (!habit) return;
    cancelHabitTimer(habit.id);
    setTimerNotes('');
  };

  // ------------------------------------------------------------------
  // EDIT LOG STATE (INLINE EDIT IN LOGS TAB)
  // ------------------------------------------------------------------
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editStopTime, setEditStopTime] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const editCalculatedMinutes = useMemo(() => {
    if (!editStartTime || !editStopTime) return 0;
    return calculateDurationBetweenTimes(editStartTime, editStopTime);
  }, [editStartTime, editStopTime]);

  const startEditingLog = (log: HabitTimeLog) => {
    setEditingLogId(log.id);
    setEditStartTime(log.startTime);
    setEditStopTime(log.endTime);
    setEditDate(log.date);
    setEditNotes(log.notes || '');
  };

  const cancelEditingLog = () => {
    setEditingLogId(null);
  };

  const saveEditedLog = (logId: string) => {
    if (!habit) return;
    if (!editStartTime || !editStopTime || editCalculatedMinutes <= 0) return;

    updateHabitTimeLog(habit.id, logId, {
      date: editDate,
      startTime: editStartTime,
      endTime: editStopTime,
      durationMinutes: editCalculatedMinutes,
      notes: editNotes.trim() || undefined,
    });
    setEditingLogId(null);
  };

  // ------------------------------------------------------------------
  // DATE NAVIGATION FOR DAILY LOGS SECTION
  // ------------------------------------------------------------------
  const changeSelectedDateByDays = (delta: number) => {
    const [y, m, d] = selectedLogsDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedLogsDate(`${ny}-${nm}-${nd}`);
  };

  // All logs for the habit
  const habitLogs = useMemo(() => habit?.timeLogs || [], [habit]);

  // Logs for the currently selected specific date
  const selectedDateLogs = useMemo(() => {
    return getHabitTimeLogsForDate(habitLogs, selectedLogsDate);
  }, [habitLogs, selectedLogsDate]);

  // Total tracked time on the selected specific date
  const selectedDateTotalMinutes = useMemo(() => {
    return getHabitDateTrackedMinutes(habitLogs, selectedLogsDate);
  }, [habitLogs, selectedLogsDate]);

  // Total tracked time all-time
  const totalAllTimeMinutes = useMemo(() => {
    return getHabitTotalTrackedMinutes(habitLogs);
  }, [habitLogs]);

  // Dates with logs
  const datesWithLogs = useMemo(() => {
    return getHabitDatesWithLogs(habitLogs);
  }, [habitLogs]);

  // Check if selected date is marked completed in habit.completedDates
  const isSelectedDateCompleted = Boolean(
    habit?.completedDates?.includes(selectedLogsDate)
  );

  if (!isTimeTrackerOpen || !habit) {
    return null;
  }

  // Custom habit color or fallback
  const customHex = habit.customColorHex || (habit.color?.startsWith('#') ? habit.color : '#3B82F6');

  // Format readable selected date string
  const formatReadableDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const isToday = dateStr === today;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const formatted = dateObj.toLocaleDateString('en-US', options);
    return isToday ? `${formatted} (Today)` : formatted;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-time-tracker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: customHex }}
            >
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="habit-time-tracker-title"
                  className="font-heading text-lg font-bold text-slate-900 truncate"
                >
                  {habit.title}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {habit.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Time Tracker & Daily Logs</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  All-time: {formatDurationHuman(totalAllTimeMinutes)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeTimeTracker}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Manual Time Input</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Dynamic Live Timer</span>
            {isThisHabitTiming && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Logs by Date</span>
            {habitLogs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
                {habitLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[72vh] overflow-y-auto">
          {/* ============================================================== */}
          {/* TAB 1: MANUAL TIME INPUT                                       */}
          {/* ============================================================== */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveManualLog} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Enter the time you started and the time you stopped. The total duration
                  will be <strong>automatically calculated</strong> and recorded in your daily streak log.
                </p>
              </div>

              {manualError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {manualError}
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    max={today}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setManualDate(today)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Start Time & Stop Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Started Time</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {formatTime12h(manualStartTime)}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-tabular"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Stopped Time</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {formatTime12h(manualStopTime)}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={manualStopTime}
                    onChange={(e) => setManualStopTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-tabular"
                    required
                  />
                </div>
              </div>

              {/* Quick Duration Preset Buttons */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                  Quick adjustments from start time:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => applyPresetDuration(mins)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                    >
                      +{mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setManualStartTime('09:00');
                      setManualStopTime('10:00');
                    }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* AUTOMATICALLY CALCULATED DURATION BANNER */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                      Calculated Duration
                    </span>
                    <p className="text-xl font-bold font-tabular text-emerald-950">
                      {formatDurationHuman(manualCalculatedMinutes)}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      From {formatTime12h(manualStartTime)} to {formatTime12h(manualStopTime)} ({manualCalculatedMinutes} mins)
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  Auto Calculated
                </span>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g., Practiced tree traversal algorithms, 3 problems solved"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Checkbox: Mark Completed for this date */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={manualMarkCompleted}
                  onChange={(e) => setManualMarkCompleted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <span>Mark habit completed for {manualDate}</span>
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Increments your daily streak circle when checked
                  </p>
                </div>
              </label>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTimeTracker}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualCalculatedMinutes <= 0}
                  className="px-5 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Time Log</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DYNAMIC LIVE TIMER                                      */}
          {/* ============================================================== */}
          {activeTab === 'timer' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                {isThisHabitTiming ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-3 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Tracking In Real-Time</span>
                    </div>

                    <div className="text-5xl sm:text-6xl font-black font-tabular tracking-tight text-slate-900 my-2">
                      {formatSecondsToTime(timerSecondsElapsed)}
                    </div>

                    <p className="text-xs text-slate-500">
                      Started at {formatTime12h(activeHabitTimer?.startTimeStr || '')} today
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-3">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Stopwatch Ready</span>
                    </div>

                    <div className="text-5xl sm:text-6xl font-black font-tabular tracking-tight text-slate-300 my-2">
                      00:00:00
                    </div>

                    <p className="text-xs text-slate-500">
                      Click play below to dynamically track your habit as you practice.
                    </p>
                  </>
                )}
              </div>

              {/* Dynamic Timer Actions */}
              {isThisHabitTiming ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Session Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={timerNotes}
                      onChange={(e) => setTimerNotes(e.target.value)}
                      placeholder="What are you currently accomplishing?"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timerMarkCompleted}
                      onChange={(e) => setTimerMarkCompleted(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">
                        Mark habit completed for today upon stopping
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Updates today's streak circle with completion flame
                      </p>
                    </div>
                  </label>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelTimer}
                      className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard Session</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopAndSaveTimer}
                      className="px-6 py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 cursor-pointer transition-all flex items-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop & Save Log</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    className="w-full max-w-sm py-3.5 text-base font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Start Dynamic Tracking</span>
                  </button>

                  {/* Inform user if another timer is running */}
                  {activeHabitTimer && activeHabitTimer.habitId !== habit.id && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                      Notice: Another timer is currently running for a different habit. Starting this will switch active focus.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: DAILY TIME LOGS BY SPECIFIC DATE                        */}
          {/* ============================================================== */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Date Header & Navigation Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeSelectedDateByDays(-1)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
                      title="Previous day"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <input
                        type="date"
                        value={selectedLogsDate}
                        onChange={(e) => setSelectedLogsDate(e.target.value)}
                        className="text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => changeSelectedDateByDays(1)}
                      disabled={selectedLogsDate >= today}
                      className={`p-1.5 rounded-lg border shadow-2xs ${
                        selectedLogsDate >= today
                          ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer'
                      }`}
                      title="Next day"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {selectedLogsDate !== today && (
                      <button
                        type="button"
                        onClick={() => setSelectedLogsDate(today)}
                        className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Today
                      </button>
                    )}
                  </div>

                  {/* Summary of this specific date */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-medium text-slate-500">Date Total:</span>
                    <span className="text-sm font-bold font-tabular text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                      {formatDurationHuman(selectedDateTotalMinutes)}
                    </span>
                    {isSelectedDateCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Flame className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                        <span>Done</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Date Pills: Dates with existing logs */}
                {datesWithLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Dates with recorded sessions:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {datesWithLogs.map((dStr) => {
                        const dayMinutes = getHabitDateTrackedMinutes(habitLogs, dStr);
                        const isSelected = dStr === selectedLogsDate;
                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setSelectedLogsDate(dStr)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{dStr === today ? 'Today' : dStr.slice(5)}</span>
                            <span className="ml-1 text-[10px] opacity-80">
                              ({formatDurationMinutes(dayMinutes)})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* List of Time Logs for the Specific Date */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sessions on {formatReadableDate(selectedLogsDate)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setManualDate(selectedLogsDate);
                      setActiveTab('manual');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add log for this date</span>
                  </button>
                </div>

                {selectedDateLogs.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      No time logs on {formatReadableDate(selectedLogsDate)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      You haven't recorded a time session for this habit on this date yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setManualDate(selectedLogsDate);
                        setActiveTab('manual');
                      }}
                      className="mt-3 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Time for {selectedLogsDate}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateLogs.map((log) => {
                      const isEditing = editingLogId === log.id;

                      if (isEditing) {
                        return (
                          <div
                            key={log.id}
                            className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3"
                          >
                            <span className="text-xs font-bold text-blue-900 block">
                              Edit Session Log
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={editStartTime}
                                  onChange={(e) => setEditStartTime(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                  Stop Time
                                </label>
                                <input
                                  type="time"
                                  value={editStopTime}
                                  onChange={(e) => setEditStopTime(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                Notes
                              </label>
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                placeholder="Session notes"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-bold text-emerald-800 font-tabular">
                                Duration: {formatDurationHuman(editCalculatedMinutes)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={cancelEditingLog}
                                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEditedLog(log.id)}
                                  className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={log.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 font-tabular">
                                  {formatTime12h(log.startTime)} – {formatTime12h(log.endTime)}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-tabular">
                                  {formatDurationHuman(log.durationMinutes)}
                                </span>
                              </div>
                              {log.notes && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate" title={log.notes}>
                                  {log.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => startEditingLog(log)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit time log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteHabitTimeLog(habit.id, log.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete time log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggle Habit Completed Check-in for this specific date */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 p-3 rounded-xl">
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    Streak check-in for {selectedLogsDate}:
                  </span>
                  <span
                    className={`ml-1.5 font-bold ${
                      isSelectedDateCompleted ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {isSelectedDateCompleted ? 'Completed 🔥' : 'Not marked done'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleHabitDate(habit.id, selectedLogsDate)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isSelectedDateCompleted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isSelectedDateCompleted ? 'Unmark done' : 'Mark done for this date'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
