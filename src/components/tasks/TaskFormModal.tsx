import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Link2,
  ExternalLink,
  Tag,
  Check,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Task, TaskPriority, TaskCategory, Subtask, TaskLink, LinkType } from '../../types';
import { getTodayDateString, formatTaskScheduledDuration } from '../../utils/timeUtils';
import { calculateHabitStreak } from '../../utils/streakUtils';

export const TaskFormModal: React.FC = () => {
  const {
    isTaskFormOpen,
    taskToEdit,
    closeTaskForm,
    addTask,
    updateTask,
    goals,
    modules,
    resources,
    categories,
    addCustomCategory,
    habits,
    addHabit,
  } = useApp();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('Learning');
  const [goalId, setGoalId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [resourceId, setResourceId] = useState<string>('');
  const [habitId, setHabitId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Quick Streak Creation State
  const [isCreatingNewStreak, setIsCreatingNewStreak] = useState(false);
  const [newStreakTitle, setNewStreakTitle] = useState('');
  const [newStreakCategory, setNewStreakCategory] = useState('Learning');
  const [newStreakColor, setNewStreakColor] = useState('amber');
  
  // Custom Category State
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Task Links State
  const [taskLinks, setTaskLinks] = useState<TaskLink[]>([]);
  const [isAddingTaskLink, setIsAddingTaskLink] = useState(false);
  const [taskLinkTitle, setTaskLinkTitle] = useState('');
  const [taskLinkUrl, setTaskLinkUrl] = useState('');
  const [taskLinkType, setTaskLinkType] = useState<LinkType>('docs');

  // Subtasks State with Attached Links
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [addingLinkToSubtaskId, setAddingLinkToSubtaskId] = useState<string | null>(null);
  const [subLinkTitle, setSubLinkTitle] = useState('');
  const [subLinkUrl, setSubLinkUrl] = useState('');
  const [subLinkType, setSubLinkType] = useState<LinkType>('docs');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDate(taskToEdit.date || getTodayDateString());
      setStartTime(taskToEdit.startTime || '09:00');
      setEndTime(taskToEdit.endTime || '10:30');
      setPriority(taskToEdit.priority || 'medium');
      setCategory(taskToEdit.category || 'Learning');
      setGoalId(taskToEdit.goalId || '');
      setModuleId(taskToEdit.moduleId || '');
      setResourceId(taskToEdit.resourceId || '');
      setHabitId(taskToEdit.habitId || '');
      setNotes(taskToEdit.notes || '');
      setSubtasks(taskToEdit.subtasks || []);
      setTaskLinks(taskToEdit.links || []);
    } else {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const endH = String((now.getHours() + 1) % 24).padStart(2, '0');
      setTitle('');
      setDate(getTodayDateString());
      setStartTime(`${h}:${m}`);
      setEndTime(`${endH}:${m}`);
      setPriority('medium');
      setCategory('Learning');
      setGoalId('');
      setModuleId('');
      setResourceId('');
      setHabitId('');
      setNotes('');
      setSubtasks([]);
      setTaskLinks([]);
    }
    setIsAddingCustomCategory(false);
    setCustomCategoryInput('');
    setIsAddingTaskLink(false);
    setAddingLinkToSubtaskId(null);
    setIsCreatingNewStreak(false);
    setNewStreakTitle('');
  }, [taskToEdit, isTaskFormOpen]);

  if (!isTaskFormOpen) return null;

  // Available modules for selected goal
  const availableModules = goalId ? modules.filter((m) => m.goalId === goalId) : [];
  // Available resources for selected module
  const availableResources = moduleId ? resources.filter((r) => r.moduleId === moduleId) : [];

  // Handle Custom Category Creation
  const handleSaveCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    addCustomCategory(trimmed);
    setCategory(trimmed);
    setCustomCategoryInput('');
    setIsAddingCustomCategory(false);
  };

  // Handle adding task link
  const handleAddTaskLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskLinkTitle.trim() || !taskLinkUrl.trim()) return;
    const newLnk: TaskLink = {
      id: `lnk-${Date.now()}`,
      title: taskLinkTitle.trim(),
      url: taskLinkUrl.trim(),
      type: taskLinkType,
    };
    setTaskLinks([...taskLinks, newLnk]);
    setTaskLinkTitle('');
    setTaskLinkUrl('');
    setIsAddingTaskLink(false);
  };

  const handleRemoveTaskLink = (id: string) => {
    setTaskLinks(taskLinks.filter((l) => l.id !== id));
  };

  // Handle Subtask management
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}`,
        title: newSubtaskText.trim(),
        completed: false,
        links: [],
      },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  // Handle Subtask Link addition
  const handleAddSubtaskLink = (subtaskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!subLinkTitle.trim() || !subLinkUrl.trim()) return;
    const newLnk: TaskLink = {
      id: `lnk-sub-${Date.now()}`,
      title: subLinkTitle.trim(),
      url: subLinkUrl.trim(),
      type: subLinkType,
    };
    setSubtasks(
      subtasks.map((st) =>
        st.id === subtaskId
          ? { ...st, links: [...(st.links || []), newLnk] }
          : st
      )
    );
    setSubLinkTitle('');
    setSubLinkUrl('');
    setAddingLinkToSubtaskId(null);
  };

  const handleRemoveSubtaskLink = (subtaskId: string, linkId: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === subtaskId
          ? { ...st, links: (st.links || []).filter((l) => l.id !== linkId) }
          : st
      )
    );
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

  const handleQuickCreateStreak = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newStreakTitle.trim();
    if (!trimmedTitle) return;

    const newHabit = addHabit({
      title: trimmedTitle,
      category: newStreakCategory || category || 'Learning',
      color: newStreakColor || 'amber',
      frequency: 'daily',
      completedDates: [],
      timeLogs: [],
    });

    setHabitId(newHabit.id);
    setIsCreatingNewStreak(false);
    setNewStreakTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit && taskToEdit.id) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        priority,
        category,
        goalId: goalId || null,
        moduleId: moduleId || null,
        resourceId: resourceId || null,
        habitId: habitId || null,
        notes,
        subtasks,
        links: taskLinks,
      });
    } else {
      addTask({
        title: title.trim(),
        date,
        startTime,
        endTime,
        priority,
        status: 'todo',
        category,
        goalId: goalId || null,
        moduleId: moduleId || null,
        resourceId: resourceId || null,
        habitId: habitId || null,
        subtasks,
        links: taskLinks,
        notes,
      });
    }

    closeTaskForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-heading font-semibold text-slate-900">
            {taskToEdit && taskToEdit.id ? 'Edit Task' : 'Schedule New Task'}
          </h2>
          <button
            onClick={closeTaskForm}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Elementor Hero Section"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Date & Time System */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-tabular"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-tabular"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>End Time</span>
                </label>
                {startTime && endTime && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                    total duration - {formatTaskScheduledDuration(startTime, endTime)}
                  </span>
                )}
              </div>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-tabular"
              />
            </div>
          </div>

          {/* Priority & Category with Custom Category Adding Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">Category</label>
                {!isAddingCustomCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Category</span>
                  </button>
                )}
              </div>

              {isAddingCustomCategory ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Category name (e.g. Research, DevOps)"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomCategory}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shrink-0 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomCategory(false);
                      setCustomCategoryInput('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!categories.includes(category) && category && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Learning Goal & Module Connection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Connect to Learning Goal (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Learning Goal</label>
                <select
                  value={goalId}
                  onChange={(e) => {
                    setGoalId(e.target.value);
                    setModuleId('');
                    setResourceId('');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">None (Independent Task)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Module</label>
                <select
                  value={moduleId}
                  disabled={!goalId}
                  onChange={(e) => {
                    setModuleId(e.target.value);
                    setResourceId('');
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">Select Module...</option>
                  {availableModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code}. {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {availableResources.length > 0 && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Target Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Resource (Optional)...</option>
                  {availableResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Habit & Streak Connection & Quick Adding Option */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-slate-50 border border-amber-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Connect to Habit / Streak 🔥</span>
              </div>
              {!isCreatingNewStreak && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewStreak(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Streak</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-amber-700/90 leading-tight">
              Completing this task on its scheduled date will automatically mark the linked streak completed for that day!
            </p>

            {/* Quick Streak Creator Form */}
            {isCreatingNewStreak ? (
              <div className="p-3 bg-white border border-amber-300 rounded-lg space-y-2.5 shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Create New Streak & Link
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewStreak(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">Streak / Habit Name *</label>
                  <input
                    type="text"
                    value={newStreakTitle}
                    onChange={(e) => setNewStreakTitle(e.target.value)}
                    placeholder="e.g. Daily LeetCode Practice, 30 Min Reading"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Category</label>
                    <select
                      value={newStreakCategory}
                      onChange={(e) => setNewStreakCategory(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-amber-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Color Theme</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[
                        { id: 'amber', bg: 'bg-amber-500' },
                        { id: 'blue', bg: 'bg-blue-500' },
                        { id: 'emerald', bg: 'bg-emerald-500' },
                        { id: 'purple', bg: 'bg-purple-500' },
                        { id: 'rose', bg: 'bg-rose-500' },
                      ].map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setNewStreakColor(col.id)}
                          className={`w-5 h-5 rounded-full ${col.bg} transition-all ${
                            newStreakColor === col.id ? 'ring-2 ring-offset-1 ring-slate-700 scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewStreak(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreateStreak}
                    disabled={!newStreakTitle.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3 fill-white" />
                    Create & Link
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <select
                  value={habitId}
                  onChange={(e) => setHabitId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-amber-300/80 rounded-md bg-white focus:outline-none focus:border-amber-500 text-slate-800"
                >
                  <option value="">None (No streak linked)</option>
                  {habits.map((h) => {
                    const streak = calculateHabitStreak(h.completedDates || [], date || getTodayDateString());
                    return (
                      <option key={h.id} value={h.id}>
                        🔥 {h.title} ({streak.currentStreak}d streak • {h.category})
                      </option>
                    );
                  })}
                </select>

                {habitId && (() => {
                  const linkedHabit = habits.find((h) => h.id === habitId);
                  if (!linkedHabit) return null;
                  const streak = calculateHabitStreak(linkedHabit.completedDates || [], date || getTodayDateString());
                  const isDoneOnDate = (linkedHabit.completedDates || []).includes(date);

                  return (
                    <div className="mt-2 p-2 bg-white/90 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-amber-100 text-amber-700">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">
                            {linkedHabit.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Current streak: <strong className="text-amber-600">{streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}</strong>
                            {isDoneOnDate ? ' • Already marked complete for this date' : ' • Will be marked complete when task is done'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHabitId('')}
                        className="text-[11px] text-slate-400 hover:text-red-600 transition-colors px-1.5 py-0.5"
                      >
                        Unlink
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Subtasks with Multiple Link Adding Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subtasks ({subtasks.length})
              </label>
              <span className="text-[11px] text-slate-400">
                Attach custom links to steps below
              </span>
            </div>

            <div className="space-y-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-800 font-medium flex-1">{sub.title}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setAddingLinkToSubtaskId(
                            addingLinkToSubtaskId === sub.id ? null : sub.id
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                          addingLinkToSubtaskId === sub.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600'
                        }`}
                        title="Add link to this subtask"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Attached Subtask Links */}
                  {sub.links && sub.links.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                      {sub.links.map((lnk) => (
                        <div
                          key={lnk.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700"
                        >
                          <span>{getLinkIcon(lnk.type)}</span>
                          <a
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 hover:underline max-w-[150px] truncate"
                          >
                            {lnk.title}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtaskLink(sub.id, lnk.id)}
                            className="text-slate-400 hover:text-red-500 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Subtask Link Form */}
                  {addingLinkToSubtaskId === sub.id && (
                    <div className="p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 mt-2">
                      <span className="text-[11px] font-semibold text-blue-700 block">
                        Add link to: "{sub.title}"
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Link label (e.g. Spec, Figma frame)"
                          value={subLinkTitle}
                          onChange={(e) => setSubLinkTitle(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded"
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={subLinkUrl}
                          onChange={(e) => setSubLinkUrl(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <select
                          value={subLinkType}
                          onChange={(e) => setSubLinkType(e.target.value as LinkType)}
                          className="text-[11px] border border-slate-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="docs">Documentation</option>
                          <option value="figma">Figma</option>
                          <option value="github">GitHub</option>
                          <option value="youtube">YouTube</option>
                          <option value="reference">Reference</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAddingLinkToSubtaskId(null)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleAddSubtaskLink(sub.id, e)}
                            disabled={!subLinkTitle.trim() || !subLinkUrl.trim()}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-[11px] font-medium"
                          >
                            Attach Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Subtask Step Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add subtask step..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs shrink-0"
              >
                Add Step
              </button>
            </div>
          </div>

          {/* Custom Multiple Task Links Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Task Links & References ({taskLinks.length})
              </label>
              {!isAddingTaskLink && (
                <button
                  type="button"
                  onClick={() => setIsAddingTaskLink(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              )}
            </div>

            {/* List of Task Links */}
            {taskLinks.length > 0 && (
              <div className="space-y-1.5">
                {taskLinks.map((lnk) => (
                  <div
                    key={lnk.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <span className="text-sm shrink-0">{getLinkIcon(lnk.type)}</span>
                      <a
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 hover:text-blue-600 truncate"
                      >
                        {lnk.title}
                      </a>
                      <span className="text-[10px] text-slate-400 capitalize shrink-0">
                        ({lnk.type})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTaskLink(lnk.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add Task Link Form */}
            {isAddingTaskLink && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Link title (e.g. Figma Design, API Docs)"
                    value={taskLinkTitle}
                    onChange={(e) => setTaskLinkTitle(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={taskLinkUrl}
                    onChange={(e) => setTaskLinkUrl(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Type:</span>
                    <select
                      value={taskLinkType}
                      onChange={(e) => setTaskLinkType(e.target.value as LinkType)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="docs">Documentation</option>
                      <option value="figma">Figma</option>
                      <option value="github">GitHub</option>
                      <option value="youtube">YouTube</option>
                      <option value="reference">Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTaskLink(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTaskLink}
                      disabled={!taskLinkTitle.trim() || !taskLinkUrl.trim()}
                      className="px-3 py-1 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-40"
                    >
                      Attach
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key notes, reminders, or requirements..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTaskForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs transition-colors"
            >
              {taskToEdit && taskToEdit.id ? 'Save Changes' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
