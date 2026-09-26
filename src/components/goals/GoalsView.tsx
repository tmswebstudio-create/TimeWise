import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProgressBar } from '../common/ProgressBar';
import { EmptyState } from '../common/EmptyState';
import {
  Compass,
  Plus,
  BookOpen,
  Clock,
  Layers,
  Play,
  ArrowRight,
  Edit,
  Trash2,
  GripVertical,
  ImageIcon,
} from 'lucide-react';
import { formatDurationMinutes } from '../../utils/timeUtils';
import { LearningGoal } from '../../types';

export const GoalsView: React.FC = () => {
  const {
    goals,
    modules,
    resources,
    setActiveView,
    openGoalForm,
    deleteGoal,
    reorderGoals,
  } = useApp();

  // Drag-and-drop state
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedGoalId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'goal', id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGoalId !== id) {
      setDragOverGoalId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving target
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedGoalId || e.dataTransfer.getData('text/plain');
    if (sourceId && targetId && sourceId !== targetId) {
      reorderGoals(sourceId, targetId);
    }
    setDraggedGoalId(null);
    setDragOverGoalId(null);
  };

  const handleDragEnd = () => {
    setDraggedGoalId(null);
    setDragOverGoalId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Curriculum & Mastery
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              <GripVertical className="w-3 h-3" />
              Drag cards to reorder
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
            Learning Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured modular courses, verified resources, and real-time study progress. Drag cards to organize your curriculum priorities.
          </p>
        </div>

        <button
          onClick={() => openGoalForm()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Grid of Learning Goal Cards with Drag & Drop */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Create your first learning goal."
          description="Group your study modules, tutorials, documentation, and practice tasks into cohesive curriculums."
          actionLabel="Create Learning Goal"
          onAction={() => openGoalForm()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {goals.map((goal) => {
            const goalModules = modules.filter((m) => m.goalId === goal.id);
            const completedModules = goalModules.filter((m) => m.status === 'completed').length;
            const totalModules = goalModules.length || 10;
            const goalResources = resources.filter((r) => r.goalId === goal.id);
            const isDragging = draggedGoalId === goal.id;
            const isDragOver = dragOverGoalId === goal.id;

            return (
              <div
                key={goal.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, goal.id)}
                onDragOver={(e) => handleDragOver(e, goal.id)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, goal.id)}
                onClick={() => setActiveView('goal-detail', goal.id)}
                className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isDragging
                    ? 'opacity-40 scale-95 border-dashed border-blue-500 shadow-none'
                    : isDragOver
                    ? 'ring-3 ring-blue-500 ring-offset-2 border-blue-500 scale-[1.02] shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Visual Drop Bar Indicator */}
                {isDragOver && (
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-blue-600 z-30 animate-pulse rounded-t-2xl" />
                )}

                <div>
                  {/* Visual Cover Asset with Error Fallback Container */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    {goal.coverImage ? (
                      <img
                        src={goal.coverImage}
                        alt={goal.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                        onError={(e) => {
                          // Display fallback background container if custom link fails
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                    {/* Top Left: Category badge */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className="text-[11px] font-semibold text-white/95 bg-slate-950/75 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/15 shadow-xs">
                        {goal.category}
                      </span>
                    </div>

                    {/* Top Right: Drag Handle & Progress badge */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                      {/* Drag Grip Handle */}
                      <div
                        title="Drag to reorder goal card"
                        className="p-1 rounded-md bg-black/60 hover:bg-black/90 backdrop-blur-xs text-slate-300 hover:text-white cursor-grab active:cursor-grabbing transition-colors border border-white/15 shadow-xs flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Progress percentage on cover */}
                      <div className="font-tabular text-xs font-bold text-white bg-blue-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                        {goal.progress}%
                      </div>
                    </div>

                    {/* Goal Title overlay at bottom of cover */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5">
                      <h3 className="text-base font-heading font-bold text-white drop-shadow-sm truncate">
                        {goal.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3.5">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {goal.description}
                    </p>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 font-tabular mb-1.5">
                        <span>Curriculum Progress</span>
                        <span className="font-semibold text-slate-800">{goal.progress}%</span>
                      </div>
                      <ProgressBar progress={goal.progress} height="h-2" />
                    </div>

                    {/* Metadata Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Modules</span>
                        <span className="font-tabular font-medium text-slate-700">
                          {completedModules} / {totalModules}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Resources</span>
                        <span className="font-tabular font-medium text-slate-700">
                          {goalResources.length} items
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Study Time</span>
                        <span className="font-tabular font-medium text-slate-700">
                          {formatDurationMinutes(goal.totalLearningTimeMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Last studied: {goal.lastStudiedAt}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoalForm(goal);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                      title="Edit goal"
                      aria-label="Edit goal"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGoal(goal.id);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Delete goal"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView('goal-detail', goal.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
