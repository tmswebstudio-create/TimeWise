import React, { useState } from 'react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatTime12h,
  calculateTaskTiming,
  getTodayDateString,
  addDays,
  formatFriendlyDate,
  getRelativeDayLabel,
} from '../../utils/timeUtils';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Flame,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectTask: (taskId: string) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectTask,
  selectedDate: externalDate,
  onDateChange,
}) => {
  const { tasks, habits, openTaskForm, deleteTask, currentTime } = useApp();
  const [internalDate, setInternalDate] = useState(getTodayDateString());

  const selectedDate = externalDate || internalDate;
  const setDate = (newDate: string) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
  const today = getTodayDateString();
  const isToday = selectedDate === today;

  // Filter tasks for selected date
  const dayTasks = tasks.filter((t) => t.date === selectedDate);

  // Navigate date
  const handlePrevDay = () => {
    setDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setDate(today);
  };

  // Convert time "HH:mm" to minutes from 08:00
  const timeToMinutesFromStart = (timeStr: string) => {
    const [h, m] = (timeStr || '08:00').split(':').map(Number);
    const startHour = 8;
    return Math.max(0, (h - startHour) * 60 + m);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Calendar Header Navigation */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-2xs"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-2xs"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shadow-2xs ${
              isToday
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Today
          </button>

          {/* Date Picker Input */}
          <div className="relative flex items-center ml-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            />
          </div>

          <span className="text-xs font-medium text-slate-500 hidden sm:inline ml-1">
            ({getRelativeDayLabel(selectedDate, today)})
          </span>
        </div>

        <button
          onClick={() => openTaskForm(null, { date: selectedDate })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task Block</span>
        </button>
      </div>

      {/* Hourly Schedule View */}
      <div className="relative overflow-x-auto min-w-[500px] p-4">
        <div className="relative divide-y divide-slate-100">
          {hours.map((hour) => {
            const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`;
            const hourLabel12 = formatTime12h(hourLabel);

            return (
              <div key={hour} className="flex items-start min-h-[58px] group">
                {/* Time gutter */}
                <div className="w-20 shrink-0 text-right pr-4 font-tabular text-xs text-slate-400 select-none pt-0.5">
                  {hourLabel12}
                </div>

                {/* Grid line & block container */}
                <div className="flex-1 relative border-l border-slate-200 pl-3 min-h-[58px]">
                  {/* Subtle half-hour dashed line */}
                  <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-100 -z-0" />
                </div>
              </div>
            );
          })}

          {/* Render Scheduled Tasks as Absolutely Positioned Blocks */}
          <div className="absolute top-0 bottom-0 left-20 right-0 pointer-events-none pl-3">
            {dayTasks.map((task) => {
              const startMinutes = timeToMinutesFromStart(task.startTime);
              const endMinutes = timeToMinutesFromStart(task.endTime);
              const durationMinutes = Math.max(30, endMinutes - startMinutes);

              // 58px per hour => ~0.9666px per minute
              const topPx = (startMinutes / 60) * 58;
              const heightPx = Math.max(48, (durationMinutes / 60) * 58 - 4);

              const timing = calculateTaskTiming(task, currentTime);
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                  }}
                  className={`group/cal absolute left-3 right-4 rounded-xl border p-2.5 transition-all shadow-xs pointer-events-auto cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-75'
                      : timing.state === 'during_task'
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 ring-2 ring-blue-200'
                      : 'bg-white border-blue-200/80 hover:border-blue-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-semibold text-xs truncate">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-tabular text-[10px] text-slate-500">
                        {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover/cal:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskForm(task);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit task"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <span className="truncate">{task.category}</span>
                      {task.habitId && (() => {
                        const lh = habits.find((h) => h.id === task.habitId);
                        if (!lh) return null;
                        const isDone = lh.completedDates?.includes(task.date || '');
                        return (
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isDone ? 'bg-amber-100 text-amber-800' : 'bg-orange-50 text-orange-700'
                            }`}
                            title={`Streak: ${lh.title} (${isDone ? 'Completed' : 'Pending'})`}
                          >
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span className="truncate max-w-[80px]">{lh.title}</span>
                          </span>
                        );
                      })()}
                    </div>
                    {task.subtasks?.length > 0 && (
                      <span className="font-tabular text-[10px]">
                        {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
