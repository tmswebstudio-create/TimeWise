import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../common/ProgressBar';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Code,
  FileText,
  CheckCircle2,
  Plus,
  PlusCircle,
  ExternalLink,
  Clock,
  Bookmark,
  Check,
  Calendar,
  Edit,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { formatSecondsToTime } from '../../utils/timeUtils';
import { getYoutubeThumbnail } from '../../utils/youtubeUtils';
import { ResourceSection, Resource } from '../../types';

export const ModuleDetailView: React.FC = () => {
  const {
    goals,
    modules,
    resources,
    tasks,
    selectedGoalId,
    selectedModuleId,
    setActiveView,
    openResourcePlayer,
    openResourceForm,
    deleteResource,
    createTaskFromResource,
    setSelectedTaskId,
    openTaskForm,
    deleteTask,
    updateModule,
    openModuleForm,
    deleteModule,
    reorderResources,
    toggleModuleComplete,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ResourceSection>('learn');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  // Drag-and-drop state
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [dragOverResourceId, setDragOverResourceId] = useState<string | null>(null);

  const goal = goals.find((g) => g.id === selectedGoalId);
  const moduleItem = modules.find((m) => m.id === selectedModuleId);

  if (!goal || !moduleItem) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-sm mb-4">Module not found.</p>
        <button
          onClick={() => setActiveView('goals')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  const moduleResources = resources.filter((r) => r.moduleId === moduleItem.id);
  const learnResources = moduleResources.filter((r) => r.section === 'learn');
  const practiceResources = moduleResources.filter((r) => r.section === 'practice');
  const reviewResources = moduleResources.filter((r) => r.section === 'review');

  const moduleTasks = tasks.filter((t) => t.moduleId === moduleItem.id);

  const isResourceDone = (r: Resource) =>
    r.status === 'completed' || (r.durationSeconds > 0 && r.currentTime >= r.durationSeconds * 0.9);

  const completedResourcesCount = moduleResources.filter(isResourceDone).length;
  const completedTasksCount = moduleTasks.filter((t) => t.status === 'completed').length;
  const totalRes = moduleResources.length;
  const totalTasks = moduleTasks.length;

  const allMaterialsDone = totalRes > 0 && completedResourcesCount === totalRes;
  const allTasksDone = totalTasks > 0 ? completedTasksCount === totalTasks : true;
  const isFullyCompleted = totalRes > 0 && allMaterialsDone && allTasksDone;
  const displayProgress = totalRes === 0 && totalTasks === 0 ? 0 : isFullyCompleted ? 100 : moduleItem.progress;

  const handleSaveNotes = () => {
    updateModule(moduleItem.id, { notes: notesDraft });
    setIsEditingNotes(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedResourceId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverResourceId !== id) {
      setDragOverResourceId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedResourceId || e.dataTransfer.getData('text/plain');
    if (sourceId && targetId && sourceId !== targetId) {
      reorderResources(sourceId, targetId);
    }
    setDraggedResourceId(null);
    setDragOverResourceId(null);
  };

  const handleDragEnd = () => {
    setDraggedResourceId(null);
    setDragOverResourceId(null);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => setActiveView('goal-detail', goal.id)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {goal.title}</span>
        </button>
      </div>

      {/* MODULE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                {goal.title} · Module {moduleItem.code}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${
                  isFullyCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : displayProgress > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {isFullyCompleted ? '✓ Completed' : displayProgress > 0 ? 'In Progress' : 'Not Started'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 tracking-tight">
              {moduleItem.code}. {moduleItem.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {moduleItem.description}
            </p>
          </div>

          {/* Module Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => toggleModuleComplete(moduleItem.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs ${
                isFullyCompleted
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
              title={isFullyCompleted ? 'Mark module in-progress' : 'Mark all materials completed'}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isFullyCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{isFullyCompleted ? 'Completed' : 'Mark All Completed'}</span>
            </button>

            <button
              onClick={() => openModuleForm(moduleItem)}
              className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Edit
            </button>

            <button
              onClick={() => openResourceForm(goal.id, moduleItem.id)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Resources</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {completedResourcesCount} / {moduleResources.length} Done
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tasks</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {completedTasksCount} / {moduleTasks.length} Completed
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Time</span>
              <span className="font-semibold text-blue-600 font-tabular">
                {formatSecondsToTime(moduleResources.reduce((acc, r) => acc + (r.durationSeconds || 0), 0))}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-56 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-tabular">
              <span>Progress</span>
              <span className="font-semibold text-slate-700">{displayProgress}%</span>
            </div>
            <ProgressBar
              progress={displayProgress}
              color={isFullyCompleted ? 'bg-emerald-500' : 'bg-blue-600'}
              height="h-2"
            />
          </div>
        </div>
      </div>

      {/* CURRICULUM SECTIONS (Tabs: LEARN, PRACTICE, REVIEW) */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 max-w-fit">
          <button
            onClick={() => setActiveTab('learn')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'learn'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>LEARN ({learnResources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'practice'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>PRACTICE ({practiceResources.length + moduleTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'review'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>REVIEW ({reviewResources.length})</span>
          </button>
        </div>

        {/* Tab 1: LEARN (Videos, Docs, Articles) */}
        {activeTab === 'learn' && (
          <div className="space-y-3">
            {learnResources.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-white text-xs text-slate-500">
                No learning lectures or tutorials in this module yet.
              </div>
            ) : (
              learnResources.map((res) => (
                <ResourceItemRow
                  key={res.id}
                  resource={res}
                  draggable={true}
                  isDragging={draggedResourceId === res.id}
                  isDragOver={dragOverResourceId === res.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  onPlay={() => openResourcePlayer(res)}
                  onCreateTask={() => createTaskFromResource(res.id)}
                  onEdit={() => openResourceForm(goal.id, moduleItem.id, res)}
                  onDelete={() => deleteResource(res.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: PRACTICE (Tasks & Active Coding Exercises) */}
        {activeTab === 'practice' && (
          <div className="space-y-4">
            {/* Connected Practice Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Scheduled Practice Tasks ({moduleTasks.length})
                </h4>
                <button
                  onClick={() =>
                    openTaskForm(null, {
                      goalId: goal.id,
                      moduleId: moduleItem.id,
                      category: 'Practice',
                      title: `Practice ${moduleItem.title}`,
                    })
                  }
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Practice Task</span>
                </button>
              </div>

              {moduleTasks.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-white text-xs text-slate-500 text-center">
                  No practice tasks scheduled for this module yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {moduleTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            t.status === 'completed'
                              ? 'line-through text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-tabular shrink-0">
                        <span>{t.startTime} – {t.endTime}</span>
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskForm(t);
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
                              deleteTask(t.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Practice Interactive Resources (e.g. Grid Garden, Codepen) */}
            {practiceResources.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                  Interactive Practice Resources ({practiceResources.length})
                </h4>
                <div className="space-y-3">
                  {practiceResources.map((res) => (
                    <ResourceItemRow
                      key={res.id}
                      resource={res}
                      draggable={true}
                      isDragging={draggedResourceId === res.id}
                      isDragOver={dragOverResourceId === res.id}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      onPlay={() => openResourcePlayer(res)}
                      onCreateTask={() => createTaskFromResource(res.id)}
                      onEdit={() => openResourceForm(goal.id, moduleItem.id, res)}
                      onDelete={() => deleteResource(res.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: REVIEW (Notes, Cheat Sheets, Summaries) */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {/* Module Personal Notes */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Module Key Takeaways & Notes
                </h4>
                {!isEditingNotes && (
                  <button
                    onClick={() => {
                      setNotesDraft(moduleItem.notes);
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
                    rows={4}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Write key notes, formulas, gotchas, or concepts learned..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
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
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed min-h-[60px]">
                  {moduleItem.notes || (
                    <span className="text-slate-400 italic">
                      No notes recorded yet. Click Edit Notes to capture insights.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Saved Review Resources */}
            {reviewResources.length > 0 && (
              <div className="space-y-3">
                {reviewResources.map((res) => (
                  <ResourceItemRow
                    key={res.id}
                    resource={res}
                    draggable={true}
                    isDragging={draggedResourceId === res.id}
                    isDragOver={dragOverResourceId === res.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onPlay={() => openResourcePlayer(res)}
                    onCreateTask={() => createTaskFromResource(res.id)}
                    onEdit={() => openResourceForm(goal.id, moduleItem.id, res)}
                    onDelete={() => deleteResource(res.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Row representation for each resource item inside module view
interface ResourceItemRowProps {
  resource: Resource;
  onPlay: () => void;
  onCreateTask: () => void;
  onEdit: () => void;
  onDelete: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

const ResourceItemRow: React.FC<ResourceItemRowProps> = ({
  resource,
  onPlay,
  onCreateTask,
  onEdit,
  onDelete,
  draggable = true,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}) => {
  const isVideo = resource.type === 'youtube';
  const isCompleted = resource.status === 'completed';
  const progressPct =
    resource.durationSeconds > 0
      ? Math.min(100, Math.round((resource.currentTime / resource.durationSeconds) * 100))
      : 0;

  const thumb =
    resource.thumbnail ||
    (resource.type === 'youtube' && resource.videoId
      ? getYoutubeThumbnail(resource.videoId, 'hq')
      : null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', resource.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(e, resource.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(e, resource.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) onDrop(e, resource.id);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
      onDrop={handleDrop}
      className={`group bg-white border rounded-2xl p-4 sm:p-4.5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDragging
          ? 'opacity-40 scale-98 border-dashed border-blue-500'
          : isDragOver
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Drag Handle Grip */}
        <div
          title="Drag to reorder"
          className="p-1 rounded text-slate-300 group-hover:text-slate-500 hover:text-slate-800 cursor-grab active:cursor-grabbing transition-colors mt-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Media Thumbnail or Type Icon */}
        <div
          onClick={onPlay}
          className="relative w-28 h-18 sm:w-32 sm:h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 cursor-pointer group-hover:ring-2 ring-blue-500 transition-all shadow-xs"
        >
          {thumb ? (
            <img
              src={thumb}
              alt={resource.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
          )}

          {/* Video Duration Overlay */}
          {resource.durationSeconds > 0 && (
            <span className="absolute bottom-1 right-1 font-tabular text-[10px] font-semibold text-white bg-black/85 px-1.5 py-0.5 rounded shadow-xs">
              {formatSecondsToTime(resource.durationSeconds)}
            </span>
          )}

          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <Play className="w-5 h-5 text-white fill-white/80" />
          </div>
        </div>

        {/* Resource Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {resource.type}
            </span>
            {resource.channel && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-600 font-medium">{resource.channel}</span>
              </>
            )}
            {isCompleted && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Completed
              </span>
            )}
          </div>

          <h4
            onClick={onPlay}
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug line-clamp-2"
          >
            {resource.title}
          </h4>

          {/* Watch Progress */}
          {isVideo && progressPct > 0 && !isCompleted && (
            <div className="flex items-center gap-2 mt-2 max-w-xs">
              <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="font-tabular text-[10px] text-slate-500 font-medium">
                {progressPct}% watched
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        {/* Create Task Button */}
        <button
          onClick={onCreateTask}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          title="Create a study or practice task from this resource"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Create Task</span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          title="Edit resource"
          aria-label="Edit resource"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete resource"
          aria-label="Delete resource"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onPlay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{resource.currentTime > 0 ? 'Continue' : 'Open'}</span>
        </button>
      </div>
    </div>
  );
};
