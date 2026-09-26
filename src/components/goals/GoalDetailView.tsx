import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../common/ProgressBar';
import {
  Compass,
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatDurationMinutes, formatSecondsToTime } from '../../utils/timeUtils';
import { Resource } from '../../types';

export const GoalDetailView: React.FC = () => {
  const {
    goals,
    modules,
    resources,
    tasks,
    selectedGoalId,
    setActiveView,
    openGoalForm,
    deleteGoal,
    openModuleForm,
    deleteModule,
    openResourcePlayer,
    openResourceForm,
  } = useApp();

  const goal = goals.find((g) => g.id === selectedGoalId);

  if (!goal) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 text-sm mb-4">Goal not found.</p>
        <button
          onClick={() => setActiveView('goals')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  const goalModules = modules
    .filter((m) => m.goalId === goal.id)
    .sort((a, b) => a.order - b.order);

  const goalResources = resources.filter((r) => r.goalId === goal.id);

  const isModuleFinished = (m: (typeof modules)[0]) => {
    const mRes = resources.filter((r) => r.moduleId === m.id);
    const mTasks = tasks.filter((t) => t.moduleId === m.id);
    if (mRes.length === 0 && mTasks.length === 0) return false;
    const isDone = (r: Resource) =>
      r.status === 'completed' || (r.durationSeconds > 0 && r.currentTime >= r.durationSeconds * 0.9);
    const allResDone = mRes.length > 0 && mRes.every(isDone);
    const allTasksDone = mTasks.length > 0 ? mTasks.every((t) => t.status === 'completed') : true;
    return allResDone && allTasksDone;
  };

  const completedModules = goalModules.filter((m) => isModuleFinished(m)).length;

  // Find last unfinished resource to feature in "CONTINUE LEARNING"
  const unfinishedResource =
    goalResources.find((r) => r.status === 'in_progress' && r.currentTime > 0) ||
    goalResources.find((r) => r.status === 'not_started') ||
    goalResources[0];

  const unfinishedModule = unfinishedResource
    ? goalModules.find((m) => m.id === unfinishedResource.moduleId)
    : goalModules[0];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => setActiveView('goals')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Goals</span>
        </button>
      </div>

      {/* Goal Hero Header (Course Platform Style) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={goal.coverImage}
            alt={goal.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Header Title inside Scrim */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                {goal.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                {goal.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => openGoalForm(goal)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-medium border border-white/20 transition-colors"
                title="Edit Goal"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Goal</span>
              </button>
              <button
                onClick={() => {
                  deleteGoal(goal.id);
                  setActiveView('goals');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xs text-white text-xs font-medium border border-red-300/30 transition-colors"
                title="Delete Goal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Goal Description & Curriculum Stats Bar */}
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-3xl">
            {goal.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Overall Progress</span>
              <span className="font-tabular font-semibold text-slate-900 text-base">
                {goal.progress}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Modules Completed</span>
              <span className="font-tabular font-semibold text-slate-900 text-base">
                {completedModules} / {goalModules.length}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Total Resources</span>
              <span className="font-tabular font-semibold text-slate-900 text-base">
                {goalResources.length} items
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Learning Time</span>
              <span className="font-tabular font-semibold text-slate-900 text-base">
                {formatDurationMinutes(goal.totalLearningTimeMinutes)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent "CONTINUE LEARNING" Card */}
      {unfinishedResource && unfinishedModule && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block">
                Continue Learning
              </span>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  Module {unfinishedModule.code}: {unfinishedModule.title}
                </span>
                <span>·</span>
                <span className="font-tabular text-blue-600 font-semibold">
                  {unfinishedModule.progress}% complete
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-900 truncate">
                Last resource: "{unfinishedResource.title}"
              </h3>

              {unfinishedResource.currentTime > 0 && (
                <p className="text-xs text-slate-500 font-tabular">
                  Stopped at {formatSecondsToTime(unfinishedResource.currentTime)} / {formatSecondsToTime(unfinishedResource.durationSeconds)}
                </p>
              )}
            </div>

            <button
              onClick={() => openResourcePlayer(unfinishedResource)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {unfinishedResource.currentTime > 0
                  ? `Continue from ${formatSecondsToTime(unfinishedResource.currentTime)}`
                  : 'Start Resource'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modules System: Ordered Chapters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-heading font-semibold text-slate-900">
              Curriculum Modules ({goalModules.length})
            </h2>
            <span className="text-xs text-slate-500">
              Click any module to access lectures, practice exercises & notes
            </span>
          </div>

          <button
            type="button"
            onClick={() => openModuleForm(null, goal.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Module</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {goalModules.map((moduleItem) => {
            const moduleResources = resources.filter((r) => r.moduleId === moduleItem.id);
            const moduleTasks = tasks.filter((t) => t.moduleId === moduleItem.id);

            const isResourceDone = (r: Resource) =>
              r.status === 'completed' || (r.durationSeconds > 0 && r.currentTime >= r.durationSeconds * 0.9);

            const completedResCount = moduleResources.filter(isResourceDone).length;
            const completedTasksCount = moduleTasks.filter((t) => t.status === 'completed').length;
            const totalRes = moduleResources.length;
            const totalTasks = moduleTasks.length;

            const allMaterialsDone = totalRes > 0 && completedResCount === totalRes;
            const allTasksDone = totalTasks > 0 ? completedTasksCount === totalTasks : true;
            const isFullyCompleted = totalRes > 0 && allMaterialsDone && allTasksDone;

            const isStarted =
              !isFullyCompleted &&
              (completedResCount > 0 ||
                completedTasksCount > 0 ||
                (totalRes > 0 && moduleItem.progress > 0));

            const displayProgress = totalRes === 0 && totalTasks === 0 ? 0 : isFullyCompleted ? 100 : moduleItem.progress;

            return (
              <div
                key={moduleItem.id}
                onClick={() => setActiveView('module-detail', goal.id, moduleItem.id)}
                className={`group bg-white border rounded-xl p-4 sm:p-5 transition-all duration-150 cursor-pointer shadow-xs hover:border-slate-300 hover:shadow-sm flex items-center justify-between gap-4 ${
                  isFullyCompleted
                    ? 'border-slate-200 bg-slate-50/50'
                    : isStarted
                    ? 'border-blue-200 ring-1 ring-blue-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Module Code Badge / Status Icon / Custom Icon / Custom Image */}
                  {moduleItem.imageUrl ? (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 shadow-xs border border-slate-200/60 bg-slate-100 flex items-center justify-center">
                      <img
                        src={moduleItem.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-heading font-bold shrink-0 transition-colors border ${
                        isFullyCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : isStarted
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-slate-50 text-slate-500 border-slate-200/80'
                      }`}
                    >
                      {moduleItem.icon ? (
                        <span className="text-xl sm:text-2xl">{moduleItem.icon}</span>
                      ) : isFullyCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <span className="text-xs font-mono font-bold">{moduleItem.code}</span>
                      )}
                    </div>
                  )}

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {moduleItem.code}. {moduleItem.title}
                      </h3>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.2 rounded border capitalize ${
                          isFullyCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isStarted
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isFullyCompleted
                          ? 'Completed'
                          : isStarted
                          ? 'In Progress'
                          : 'Not Started'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-normal line-clamp-1 mb-2">
                      {moduleItem.description}
                    </p>

                    {/* Metadata & Progress */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="font-tabular text-[11px]">
                        {completedResCount}/{moduleResources.length} {moduleResources.length === 1 ? 'material' : 'materials'} done
                      </span>
                      {moduleTasks.length > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-tabular text-[11px]">
                            {completedTasksCount}/{moduleTasks.length} tasks
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isFullyCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${displayProgress}%` }}
                          />
                        </div>
                        <span className="font-tabular text-[11px] font-medium text-slate-700">
                          {displayProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModuleForm(moduleItem, goal.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="Edit module"
                    aria-label="Edit module"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(moduleItem.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete module"
                    aria-label="Delete module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all pl-1">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
