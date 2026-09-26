import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { calculateTaskTiming, formatSecondsToTime, getTodayDateString } from '../../utils/timeUtils';
import { ProgressBar } from '../common/ProgressBar';

export const ContextualRightPanel: React.FC = () => {
  const {
    tasks,
    resources,
    goals,
    modules,
    sessions,
    openResourcePlayer,
    setSelectedTaskId,
    currentTime,
    isRightPanelOpen,
    toggleRightPanel,
  } = useApp();

  // If collapsed, completely hide from layout (collapse and expand is controlled from Header)
  if (!isRightPanelOpen) {
    return null;
  }

  const today = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === today);

  // Planned learning minutes today
  const plannedMinutes = todayTasks.reduce((acc, t) => {
    const [sh, sm] = t.startTime.split(':').map(Number);
    const [eh, em] = t.endTime.split(':').map(Number);
    const dur = Math.max(0, eh * 60 + em - (sh * 60 + sm));
    return acc + (isNaN(dur) ? 0 : dur);
  }, 0);

  const plannedHours = Math.floor(plannedMinutes / 60);
  const plannedMins = plannedMinutes % 60;
  const plannedStr = plannedMinutes > 0 ? (plannedHours > 0 ? `${plannedHours}h ${plannedMins}m` : `${plannedMins}m`) : '0m';

  // Completed resources count
  const completedVideosCount = resources.filter((r) => r.status === 'completed').length;

  // Find currently active running task
  const activeTask = todayTasks.find((t) => {
    if (t.status === 'completed') return false;
    const timing = calculateTaskTiming(t, currentTime);
    return timing.state === 'during_task' || timing.state === 'near_end';
  });

  // Find last studied unfinished resource
  const continueResource = resources.find(
    (r) => r.status === 'in_progress' && r.currentTime > 0
  ) || resources[0];

  const continueGoal = continueResource ? goals.find((g) => g.id === continueResource.goalId) : null;
  const continueModule = continueResource ? modules.find((m) => m.id === continueResource.moduleId) : null;

  const continuePct = continueResource && continueResource.durationSeconds > 0
    ? Math.round((continueResource.currentTime / continueResource.durationSeconds) * 100)
    : 0;

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay when open */}
      <div
        onClick={toggleRightPanel}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 xl:hidden animate-in fade-in duration-150"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 p-5 flex flex-col gap-5 overflow-y-auto shadow-2xl xl:shadow-none xl:sticky xl:top-0 xl:h-screen xl:shrink-0 xl:z-20 xl:flex transition-all duration-200 animate-in slide-in-from-right-4 duration-150">
        {/* Panel Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Focus & Quick Actions</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Contextual</span>
        </div>

        {/* 1. Continue Learning Block */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Continue Learning
            </span>
            {continueGoal && (
              <span className="text-[11px] text-blue-600 font-medium truncate max-w-[120px]">
                {continueGoal.title}
              </span>
            )}
          </div>

          {continueResource ? (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                    {continueResource.title}
                  </h4>
                  {continueModule && (
                    <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                      Module {continueModule.code} · {continueModule.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress & Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-tabular">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-700">
                    {formatSecondsToTime(continueResource.currentTime)} / {formatSecondsToTime(continueResource.durationSeconds)} ({continuePct}%)
                  </span>
                </div>
                <ProgressBar progress={continuePct} height="h-1.5" color="bg-blue-600" />
              </div>

              <button
                onClick={() => openResourcePlayer(continueResource)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Playback</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-slate-300" />
              <span>No in-progress study resources</span>
            </div>
          )}
        </div>

        {/* 2. Active Scheduled Focus Task */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
            Current Schedule
          </span>

          {(() => {
            if (!activeTask) {
              return (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-center space-y-1">
                  <Clock className="w-5 h-5 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium text-slate-700">No active scheduled task</p>
                  <p className="text-[11px] text-slate-400">Next session begins at scheduled slot</p>
                </div>
              );
            }

            const timing = calculateTaskTiming(activeTask, currentTime);
            const isNearEnd = timing.state === 'near_end';
            const completedSubs = activeTask.subtasks.filter((s) => s.completed).length;

            return (
              <div
                onClick={() => setSelectedTaskId(activeTask.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isNearEnd
                    ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
                    : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                  <span className="font-tabular text-slate-500 font-medium">
                    {activeTask.startTime} - {activeTask.endTime}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                  {activeTask.title}
                </h4>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500">Remaining</span>
                  <span className={`font-tabular font-bold ${isNearEnd ? 'text-amber-700' : 'text-blue-700'}`}>
                    {timing.label}
                  </span>
                </div>

                {activeTask.subtasks.length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Subtasks</span>
                    <span className="font-tabular font-semibold text-slate-700">
                      {completedSubs} / {activeTask.subtasks.length} completed
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 3. Daily Learning Summary */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
            Today's Overview
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Tasks Completed</span>
              <span className="font-tabular font-semibold text-slate-900">
                {todayTasks.filter((t) => t.status === 'completed').length} / {todayTasks.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Planned Learning</span>
              <span className="font-tabular font-semibold text-slate-900">{plannedStr}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Resources Finished</span>
              <span className="font-tabular font-semibold text-slate-900">{completedVideosCount} completed</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
