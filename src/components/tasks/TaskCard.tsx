import React, { useState } from 'react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calculateTaskTiming,
  formatTime12h,
} from '../../utils/timeUtils';
import {
  Check,
  Clock,
  Link2,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ExternalLink,
  Edit,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  isDragging: externalDragging,
  isDragOver: externalDragOver,
}) => {
  const {
    toggleTaskComplete,
    deleteTask,
    openTaskForm,
    goals,
    modules,
    setActiveView,
    currentTime,
  } = useApp();

  const [internalDragging, setInternalDragging] = useState(false);
  const [internalDragOver, setInternalDragOver] = useState(false);

  const isDragging = externalDragging ?? internalDragging;
  const isDragOver = externalDragOver ?? internalDragOver;

  const timing = calculateTaskTiming(task, currentTime);
  const goal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;
  const moduleItem = task.moduleId ? modules.find((m) => m.id === task.moduleId) : null;

  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtaskLinks = task.subtasks.reduce((sum, s) => sum + (s.links?.length || 0), 0);
  const totalAllLinks = task.links.length + totalSubtaskLinks;

  const isCompleted = task.status === 'completed';

  // Priority color indicators
  const priorityColors = {
    high: 'text-amber-600 bg-amber-50 border-amber-200',
    medium: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  const handleDragStart = (e: React.DragEvent) => {
    setInternalDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'task', id: task.id }));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, task.id);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setInternalDragging(false);
    setInternalDragOver(false);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setInternalDragOver(true);
    }
    if (onDragOver) {
      onDragOver(e, task.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setInternalDragOver(false);
    if (onDragLeave) {
      onDragLeave(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setInternalDragOver(false);
    setInternalDragging(false);
    if (onDrop) {
      onDrop(e, task.id);
    }
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelect}
      className={`group relative bg-white border rounded-xl p-4 sm:p-4.5 transition-all duration-150 cursor-pointer shadow-xs ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-blue-500'
          : isDragOver
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
          : isCompleted
          ? 'border-slate-200 bg-slate-50/40 opacity-80 hover:border-slate-300'
          : timing.state === 'during_task'
          ? 'border-blue-300 ring-1 ring-blue-100 bg-white hover:border-blue-400'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Drag Handle Grip */}
        <div
          title="Drag to reorder task"
          className="p-1 rounded text-slate-300 group-hover:text-slate-500 hover:text-slate-800 cursor-grab active:cursor-grabbing transition-colors mt-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 hover:border-blue-600 bg-white'
          }`}
          aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as completed'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Top row: Goal/Module relation & Priority */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-1">
            {goal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveView('goal-detail', goal.id);
                }}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate max-w-[160px]"
              >
                {goal.title}
              </button>
            )}

            {moduleItem && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 font-normal truncate max-w-[160px]">
                  {moduleItem.code}. {moduleItem.title}
                </span>
              </>
            )}

            {!goal && task.category && (
              <span className="text-slate-500 font-normal">{task.category}</span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${
                  priorityColors[task.priority]
                }`}
              >
                {task.priority}
              </span>

              <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaskForm(task);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Edit task"
                  aria-label="Edit task"
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
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Title */}
          <h3
            className={`text-sm font-semibold tracking-tight leading-snug mb-2 ${
              isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-blue-600'
            }`}
          >
            {task.title}
          </h3>

          {/* Time & Live Countdown Section */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-slate-600 font-tabular text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatTime12h(task.startTime)}</span>
                <span className="text-slate-300">→</span>
                <span>{formatTime12h(task.endTime)}</span>
              </div>

              {/* Countdown Label */}
              <div className="flex items-center gap-1 font-tabular text-xs">
                {timing.state === 'during_task' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    {timing.label}
                  </span>
                )}
                {timing.state === 'near_end' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {timing.label}
                  </span>
                )}
                {timing.state === 'before_start' && (
                  <span className="text-slate-500 font-medium">{timing.label}</span>
                )}
                {timing.state === 'ended' && (
                  <span className="text-slate-400 font-normal">{timing.label}</span>
                )}
                {timing.state === 'completed' && (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {timing.label}
                  </span>
                )}
              </div>
            </div>

            {/* Scheduled Time Progress Bar */}
            <div className="relative w-full bg-slate-200 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-1000 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : timing.state === 'near_end'
                    ? 'bg-amber-500'
                    : timing.state === 'during_task'
                    ? 'bg-blue-600'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${timing.elapsedPercent}%` }}
              />
            </div>
          </div>

          {/* Footer Metadata: Subtasks & Links */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {totalSubtasks > 0 && (
                <span className="font-tabular text-[11px] text-slate-500 flex items-center gap-1">
                  <span className={completedSubtasks === totalSubtasks ? 'text-emerald-600 font-semibold' : ''}>
                    {completedSubtasks} / {totalSubtasks} subtasks
                  </span>
                </span>
              )}

              {totalAllLinks > 0 && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1" title={`${task.links.length} task links, ${totalSubtaskLinks} subtask links`}>
                  <Link2 className="w-3 h-3 text-slate-400" />
                  <span>{totalAllLinks} {totalAllLinks === 1 ? 'link' : 'links'}</span>
                </span>
              )}
            </div>

            {task.notes && (
              <span className="text-[11px] text-slate-400 truncate max-w-[200px] hidden sm:inline">
                {task.notes}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
