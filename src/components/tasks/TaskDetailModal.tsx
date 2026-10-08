import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  Tag,
  Link2,
  Plus,
  Trash2,
  Copy,
  Edit,
  ExternalLink,
  BookOpen,
  Check,
  AlertCircle,
  Flame,
  Sparkles,
} from 'lucide-react';
import {
  calculateTaskTiming,
  formatTime12h,
  formatTaskScheduledDuration,
  getTodayDateString,
} from '../../utils/timeUtils';
import { calculateHabitStreak } from '../../utils/streakUtils';
import { LinkType } from '../../types';

export const TaskDetailModal: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    toggleTaskComplete,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    addLinkToTask,
    deleteLinkFromTask,
    addLinkToSubtask,
    deleteLinkFromSubtask,
    deleteTask,
    duplicateTask,
    openTaskForm,
    goals,
    modules,
    habits,
    addHabit,
    linkTaskToHabit,
    updateTask,
    currentTime,
    categories,
    addCustomCategory,
  } = useApp();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<LinkType>('docs');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Streak link & inline creator state
  const [isLinkingStreak, setIsLinkingStreak] = useState(false);
  const [isCreatingNewStreak, setIsCreatingNewStreak] = useState(false);
  const [newStreakTitle, setNewStreakTitle] = useState('');
  const [newStreakCategory, setNewStreakCategory] = useState('Learning');
  const [newStreakColor, setNewStreakColor] = useState('amber');

  // Category change & custom category
  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Subtask link state
  const [addingLinkToSubtaskId, setAddingLinkToSubtaskId] = useState<string | null>(null);
  const [subLinkTitle, setSubLinkTitle] = useState('');
  const [subLinkUrl, setSubLinkUrl] = useState('');
  const [subLinkType, setSubLinkType] = useState<LinkType>('docs');

  if (!selectedTaskId) return null;

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const timing = calculateTaskTiming(task, currentTime);
  const goal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;
  const moduleItem = task.moduleId ? modules.find((m) => m.id === task.moduleId) : null;
  const linkedHabit = task.habitId ? habits.find((h) => h.id === task.habitId) : null;
  const isStreakDoneOnDate = linkedHabit?.completedDates?.includes(task.date || '');
  const streakInfo = linkedHabit
    ? calculateHabitStreak(linkedHabit.completedDates || [], task.date || getTodayDateString())
    : null;

  const handleQuickCreateStreak = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newStreakTitle.trim();
    if (!trimmedTitle) return;

    const newHabit = addHabit({
      title: trimmedTitle,
      category: newStreakCategory || task.category || 'Learning',
      color: newStreakColor || 'amber',
      frequency: 'daily',
      completedDates: task.status === 'completed' ? [task.date || getTodayDateString()] : [],
      timeLogs: [],
    });

    linkTaskToHabit(task.id, newHabit.id);
    setIsCreatingNewStreak(false);
    setIsLinkingStreak(false);
    setNewStreakTitle('');
  };

  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleAddSubtaskLink = (subtaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!subLinkTitle.trim() || !subLinkUrl.trim()) return;
    addLinkToSubtask(task.id, subtaskId, {
      title: subLinkTitle.trim(),
      url: subLinkUrl.trim(),
      type: subLinkType,
    });
    setSubLinkTitle('');
    setSubLinkUrl('');
    setAddingLinkToSubtaskId(null);
  };

  const handleSaveCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    addCustomCategory(trimmed);
    updateTask(task.id, { category: trimmed });
    setCustomCategoryInput('');
    setIsAddingCustomCategory(false);
    setIsChangingCategory(false);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    addLinkToTask(task.id, {
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      type: newLinkType,
    });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  const handleSaveNotes = () => {
    updateTask(task.id, { notes: notesDraft });
    setIsEditingNotes(false);
  };

  const getLinkIcon = (type: LinkType) => {
    switch (type) {
      case 'figma':
        return '🎨';
      case 'youtube':
        return '▶️';
      case 'github':
        return '💻';
      case 'docs':
        return '📄';
      case 'reference':
        return '🔗';
      default:
        return '🌐';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                task.priority === 'high'
                  ? 'bg-amber-100 text-amber-800'
                  : task.priority === 'medium'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {task.priority} Priority
            </span>
            <span className="text-slate-300">·</span>
            <div className="relative">
              {!isChangingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsChangingCategory(true)}
                  className="text-xs text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 rounded px-2 py-0.5 flex items-center gap-1 transition-colors"
                  title="Click to change or add custom category"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{task.category}</span>
                </button>
              ) : isAddingCustomCategory ? (
                <form onSubmit={handleSaveCustomCategory} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New category..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="px-2 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(false);
                      setIsChangingCategory(false);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <select
                    value={task.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingCustomCategory(true);
                      } else {
                        updateTask(task.id, { category: e.target.value });
                        setIsChangingCategory(false);
                      }
                    }}
                    className="text-xs border border-slate-300 rounded px-2 py-0.5 bg-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__NEW__">+ Add Custom Category...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsChangingCategory(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setSelectedTaskId(null)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-heading font-semibold text-slate-900 leading-snug">
                {task.title}
              </h2>

              {/* Goal & Module connection */}
              {(goal || moduleItem) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium text-slate-700">{goal?.title}</span>
                  {moduleItem && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span>{moduleItem.code}. {moduleItem.title}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => toggleTaskComplete(task.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                task.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{task.status === 'completed' ? 'Completed' : 'Mark as Done'}</span>
            </button>
          </div>

          {/* Time & Countdown Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2">
              <div className="flex flex-wrap items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-tabular font-medium">
                  {formatTime12h(task.startTime)} → {formatTime12h(task.endTime)}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 rounded">
                  total duration - {formatTaskScheduledDuration(task.startTime, task.endTime)}
                </span>
                <span className="text-slate-400">({task.date})</span>
              </div>

              <div className="font-tabular font-semibold text-xs">
                {timing.state === 'during_task' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    {timing.label}
                  </span>
                )}
                {timing.state === 'near_end' && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {timing.label}
                  </span>
                )}
                {timing.state === 'before_start' && (
                  <span className="text-slate-600">{timing.label}</span>
                )}
                {timing.state === 'ended' && (
                  <span className="text-slate-400">{timing.label}</span>
                )}
                {timing.state === 'completed' && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {timing.label}
                  </span>
                )}
              </div>
            </div>

            {/* Time progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  task.status === 'completed'
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

          {/* Connected Streak / Habit Section */}
          <div className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-slate-50 rounded-xl border border-amber-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Connected Streak / Habit 🔥</span>
              </div>
              {!isLinkingStreak && !isCreatingNewStreak && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLinkingStreak(true)}
                    className="text-[11px] font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 px-2 py-0.5 rounded-md transition-colors"
                  >
                    {linkedHabit ? 'Change Streak' : '+ Link Streak'}
                  </button>
                  {linkedHabit && (
                    <button
                      type="button"
                      onClick={() => linkTaskToHabit(task.id, null)}
                      className="text-[11px] text-slate-400 hover:text-red-600 px-1 py-0.5 transition-colors"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* If actively changing/linking streak */}
            {isLinkingStreak ? (
              <div className="space-y-2 mt-2 pt-2 border-t border-amber-200/60 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Select existing habit or create a new streak:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkingStreak(false);
                      setIsCreatingNewStreak(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {!isCreatingNewStreak ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={task.habitId || ''}
                      onChange={(e) => {
                        linkTaskToHabit(task.id, e.target.value || null);
                        setIsLinkingStreak(false);
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">None (Unlink streak)</option>
                      {habits.map((h) => {
                        const s = calculateHabitStreak(h.completedDates || [], task.date || getTodayDateString());
                        return (
                          <option key={h.id} value={h.id}>
                            🔥 {h.title} ({s.currentStreak}d streak • {h.category})
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewStreak(true)}
                      className="shrink-0 px-2.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuickCreateStreak} className="p-3 bg-white border border-amber-300 rounded-lg space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Quick Create Streak
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewStreak(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      value={newStreakTitle}
                      onChange={(e) => setNewStreakTitle(e.target.value)}
                      placeholder="e.g. Daily LeetCode, Code Review"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-amber-500"
                      autoFocus
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewStreak(false)}
                        className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!newStreakTitle.trim()}
                        className="px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
                      >
                        <Flame className="w-3 h-3 fill-white" />
                        Create & Connect
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : linkedHabit ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white/95 rounded-lg border border-amber-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{linkedHabit.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {linkedHabit.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Current Streak: <strong className="text-amber-600">{streakInfo?.currentStreak} {streakInfo?.currentStreak === 1 ? 'day' : 'days'}</strong>
                      {' • '}
                      Total Done: {streakInfo?.totalCompleted} days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {isStreakDoneOnDate ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Completed for {task.date}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/80">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>Mark task complete to ignite streak</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-white/60 rounded-lg border border-amber-200/50 text-xs text-amber-800">
                <p className="text-[11px]">
                  No streak connected yet. Link this task to a daily habit to automatically build your learning streak!
                </p>
                <button
                  type="button"
                  onClick={() => setIsLinkingStreak(true)}
                  className="shrink-0 ml-3 px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Link Streak</span>
                </button>
              </div>
            )}
          </div>

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subtasks ({completedSubs} / {totalSubs} completed)
              </h3>
            </div>

            <div className="space-y-2 mb-3">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="p-2.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors group space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(task.id, subtask.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </label>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setAddingLinkToSubtaskId(
                            addingLinkToSubtaskId === subtask.id ? null : subtask.id
                          )
                        }
                        className="text-[11px] text-slate-500 hover:text-blue-600 hover:bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                        title="Add custom link to this subtask"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link</span>
                      </button>

                      <button
                        onClick={() => deleteSubtask(task.id, subtask.id)}
                        className="opacity-90 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtask Links List */}
                  {subtask.links && subtask.links.length > 0 && (
                    <div className="pl-7 flex flex-wrap items-center gap-1.5 pt-0.5">
                      {subtask.links.map((lnk) => (
                        <div
                          key={lnk.id}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200/80 transition-colors"
                        >
                          <span className="text-xs">{getLinkIcon(lnk.type)}</span>
                          <a
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1 max-w-[140px] truncate"
                          >
                            <span className="truncate">{lnk.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLinkFromSubtask(task.id, subtask.id, lnk.id);
                            }}
                            className="text-slate-400 hover:text-red-600 ml-0.5 text-xs font-bold leading-none"
                            title="Remove link"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Form to add link to this subtask */}
                  {addingLinkToSubtaskId === subtask.id && (
                    <form
                      onSubmit={(e) => handleAddSubtaskLink(subtask.id, e)}
                      className="ml-7 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 animate-in fade-in duration-100"
                    >
                      <div className="text-[11px] font-medium text-slate-600">
                        Attach Link to "{subtask.title}"
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Link title (e.g. Tutorial, Doc)"
                          value={subLinkTitle}
                          onChange={(e) => setSubLinkTitle(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={subLinkUrl}
                          onChange={(e) => setSubLinkUrl(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>Type:</span>
                          <select
                            value={subLinkType}
                            onChange={(e) => setSubLinkType(e.target.value as LinkType)}
                            className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white"
                          >
                            <option value="docs">Documentation</option>
                            <option value="figma">Figma</option>
                            <option value="youtube">YouTube</option>
                            <option value="github">GitHub</option>
                            <option value="reference">Reference</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingLinkToSubtaskId(null);
                              setSubLinkTitle('');
                              setSubLinkUrl('');
                            }}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!subLinkTitle.trim() || !subLinkUrl.trim()}
                            className="px-2.5 py-0.5 text-xs bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-40"
                          >
                            Add Link
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Links Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Links & References
              </h3>
              <button
                onClick={() => setIsAddingLink(!isAddingLink)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>

            {isAddingLink && (
              <form onSubmit={handleAddLink} className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Link title (e.g. Figma Reference)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Type:</span>
                    <select
                      value={newLinkType}
                      onChange={(e) => setNewLinkType(e.target.value as LinkType)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="docs">Documentation</option>
                      <option value="figma">Figma</option>
                      <option value="youtube">YouTube</option>
                      <option value="github">GitHub</option>
                      <option value="reference">Inspiration/Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-40"
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {task.links.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No links added to this task.</p>
              ) : (
                task.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors group"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-xs text-slate-800 hover:text-blue-600 font-medium truncate flex-1"
                    >
                      <span className="text-sm shrink-0">{getLinkIcon(link.type)}</span>
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                    <button
                      onClick={() => deleteLinkFromTask(task.id, link.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1 ml-2"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Notes
              </h3>
              {!isEditingNotes && (
                <button
                  onClick={() => {
                    setNotesDraft(task.notes);
                    setIsEditingNotes(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit Notes
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Add notes for this task..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed min-h-[50px]">
                {task.notes || <span className="text-slate-400 italic">No notes added.</span>}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                duplicateTask(task.id);
                setSelectedTaskId(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                deleteTask(task.id);
                setSelectedTaskId(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                openTaskForm(task);
                setSelectedTaskId(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
