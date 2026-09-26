import React, { useState } from 'react';
import { Resource } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Play,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Youtube,
  FileText,
  Bookmark,
  ExternalLink,
  User,
  GripVertical,
} from 'lucide-react';
import { formatSecondsToTime } from '../../utils/timeUtils';
import { getYoutubeThumbnail } from '../../utils/youtubeUtils';

interface ResourceCardProps {
  resource: Resource;
  index?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  index,
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
    openResourcePlayer,
    createTaskFromResource,
    openResourceForm,
    deleteResource,
    goals,
    modules,
  } = useApp();

  const [internalDragging, setInternalDragging] = useState(false);
  const [internalDragOver, setInternalDragOver] = useState(false);

  const isDragging = externalDragging ?? internalDragging;
  const isDragOver = externalDragOver ?? internalDragOver;

  const goal = goals.find((g) => g.id === resource.goalId);
  const moduleItem = modules.find((m) => m.id === resource.moduleId);

  const duration = resource.durationSeconds || 1800;
  const progressPct =
    duration > 0
      ? Math.min(100, Math.round((resource.currentTime / duration) * 100))
      : 0;

  const isCompleted = resource.status === 'completed' || progressPct >= 90;

  // Derive thumbnail if not explicitly present but has videoId
  const displayThumbnail =
    resource.thumbnail ||
    (resource.type === 'youtube' && resource.videoId
      ? getYoutubeThumbnail(resource.videoId, 'maxres')
      : null);

  const fallbackThumbnail =
    resource.videoId ? getYoutubeThumbnail(resource.videoId, 'hq') : null;

  const handleDragStart = (e: React.DragEvent) => {
    setInternalDragging(true);
    e.dataTransfer.setData('text/plain', resource.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'resource', id: resource.id }));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, resource.id);
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
      onDragOver(e, resource.id);
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
      onDrop(e, resource.id);
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
      onClick={() => openResourcePlayer(resource)}
      className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-blue-500 shadow-none'
          : isDragOver
          ? 'ring-3 ring-blue-500 ring-offset-2 border-blue-500 scale-[1.02] shadow-lg'
          : 'border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Drop position indicator if dragOver */}
      {isDragOver && (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-blue-600 z-30 animate-pulse rounded-t-2xl" />
      )}

      <div>
        {/* Media Thumbnail Container with Duration Overlay */}
        <div className="relative aspect-video sm:aspect-[16/9.5] w-full bg-slate-950 overflow-hidden">
          {displayThumbnail ? (
            <img
              src={displayThumbnail}
              alt={resource.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (fallbackThumbnail && e.currentTarget.src !== fallbackThumbnail) {
                  e.currentTarget.src = fallbackThumbnail;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 opacity-92 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-slate-800 to-slate-900 text-slate-400 p-6 text-center">
              <BookOpen className="w-10 h-10 mb-2 text-slate-500" />
              <span className="text-xs font-medium text-slate-400">Learning Document</span>
            </div>
          )}

          {/* Dark gradient overlay for bottom text contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Left: Type Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-lg border border-white/15 shadow-xs">
            {resource.type === 'youtube' ? (
              <>
                <Youtube className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>YouTube</span>
              </>
            ) : resource.type === 'documentation' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span className="capitalize">{resource.type}</span>
              </>
            )}
          </div>

          {/* Top Right: Drag Handle & Section badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {/* Drag Handle */}
            <div
              title="Drag to reorder card"
              className="p-1 rounded-md bg-black/60 hover:bg-black/90 backdrop-blur-xs text-slate-300 hover:text-white cursor-grab active:cursor-grabbing transition-colors border border-white/15 shadow-xs flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Section badge (LEARN, PRACTICE, REVIEW) */}
            <div className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
              {resource.section}
            </div>
          </div>

          {/* Duration Badge Overlay */}
          {resource.durationSeconds > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-xs font-tabular text-xs font-semibold text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-white/10">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{formatSecondsToTime(resource.durationSeconds)}</span>
            </div>
          )}

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/5 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-600/90 group-hover:bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-200">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* Card Body - Increased padding and typography size */}
        <div className="p-5 space-y-2.5">
          {/* Goal & Module breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            <span className="truncate text-blue-600 font-semibold">{goal?.title}</span>
            {moduleItem && (
              <>
                <span className="text-slate-300">/</span>
                <span className="truncate text-slate-600">Mod {moduleItem.code}: {moduleItem.title}</span>
              </>
            )}
          </div>

          {/* Video Title - Much bigger & clearer */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
            {resource.title}
          </h3>

          {/* Channel / Creator */}
          {resource.channel && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <User className="w-2.5 h-2.5" />
              </div>
              <span className="truncate">{resource.channel}</span>
            </div>
          )}

          {/* Description snippet if present */}
          {resource.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {resource.description}
            </p>
          )}

          {/* Watch Progress */}
          {progressPct > 0 && (
            <div className="pt-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-tabular mb-1.5">
                <span>{progressPct}% completed</span>
                {isCompleted ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finished
                  </span>
                ) : (
                  <span>
                    {formatSecondsToTime(resource.currentTime)} / {formatSecondsToTime(duration)}
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              createTaskFromResource(resource.id);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Create Practice Task from Resource"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Task</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openResourceForm(resource.goalId, resource.moduleId, resource);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 transition-colors"
            title="Edit resource"
            aria-label="Edit resource"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteResource(resource.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete resource"
            aria-label="Delete resource"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openResourcePlayer(resource);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{resource.currentTime > 0 ? 'Continue' : 'Watch'}</span>
        </button>
      </div>
    </div>
  );
};
