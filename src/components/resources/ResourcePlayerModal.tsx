import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  PlusCircle,
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { formatSecondsToTime } from '../../utils/timeUtils';
import { ProgressBar } from '../common/ProgressBar';

export const ResourcePlayerModal: React.FC = () => {
  const {
    isResourcePlayerOpen,
    activePlayingResource,
    closeResourcePlayer,
    updateResourcePlayback,
    markResourceCompleted,
    createTaskFromResource,
    goals,
    modules,
    updateResource,
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const resource = activePlayingResource;

  useEffect(() => {
    if (resource) {
      setLocalTime(resource.currentTime || 0);
      setNotesDraft(resource.notes || '');
      setIsPlaying(false);
    }
  }, [resource]);

  // Live timer simulation when playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && resource) {
      interval = setInterval(() => {
        setLocalTime((prev) => {
          const next = prev + 1;
          const maxDur = resource.durationSeconds || 1000;
          if (next >= maxDur) {
            setIsPlaying(false);
            markResourceCompleted(resource.id);
            return maxDur;
          }
          // Update persistence every 5 seconds
          if (next % 5 === 0) {
            updateResourcePlayback(resource.id, next, maxDur);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, resource]);

  if (!isResourcePlayerOpen || !resource) return null;

  const goal = goals.find((g) => g.id === resource.goalId);
  const moduleItem = modules.find((m) => m.id === resource.moduleId);

  const duration = resource.durationSeconds || 1800;
  const progressPct = Math.min(100, Math.round((localTime / duration) * 100));
  const isCompleted = resource.status === 'completed' || progressPct >= 90;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = parseInt(e.target.value, 10);
    setLocalTime(newSeconds);
    updateResourcePlayback(resource.id, newSeconds, duration);
  };

  const handleStartFromBeginning = () => {
    setLocalTime(0);
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
    updateResourcePlayback(resource.id, 0, duration);
  };

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (!nextState) {
      updateResourcePlayback(resource.id, localTime, duration);
    }
  };

  const handleSaveNotes = () => {
    updateResource(resource.id, { notes: notesDraft });
    setIsEditingNotes(false);
  };

  const handleClose = () => {
    updateResourcePlayback(resource.id, localTime, duration);
    setIsPlaying(false);
    closeResourcePlayer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs overflow-hidden">
            <span className="font-semibold text-blue-600 truncate">{goal?.title}</span>
            {moduleItem && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 truncate">{moduleItem.title}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {resource.type}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Viewport */}
        <div className="flex-1 overflow-y-auto">
          {/* Video or Document Container */}
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
            {resource.type === 'youtube' && resource.videoId ? (
              <iframe
                key={iframeKey}
                src={`https://www.youtube-nocookie.com/embed/${resource.videoId}?start=${Math.floor(
                  localTime
                )}&autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&rel=0`}
                title={resource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="p-8 text-center text-white space-y-3">
                <BookOpen className="w-12 h-12 mx-auto text-blue-400" />
                <h3 className="text-base font-medium max-w-md">{resource.title}</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  {resource.description || 'Open documentation article in separate reading frame.'}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>Open Resource Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Interactive Playback & Learning Memory Bar */}
          <div className="p-5 bg-white border-b border-slate-200 space-y-4">
            {/* Title & Channel */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-900 leading-snug">
                  {resource.title}
                </h2>
                {resource.channel && (
                  <p className="text-xs text-slate-500 mt-0.5">By {resource.channel}</p>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 shrink-0">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    {progressPct}% watched
                  </span>
                )}
              </div>
            </div>

            {/* Video Learning Memory: Scrubber & Progress */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-tabular">
                <span className="font-semibold text-slate-900">
                  {formatSecondsToTime(localTime)} / {formatSecondsToTime(duration)}
                </span>
                <span className="text-slate-500">
                  {localTime > 0 ? `Saved position at ${formatSecondsToTime(localTime)}` : 'At beginning'}
                </span>
              </div>

              {/* Scrubber slider */}
              <input
                type="range"
                min="0"
                max={duration}
                value={localTime}
                onChange={handleScrub}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              {/* Actions row: Continue / Reset / Complete */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? 'Pause' : localTime > 0 ? `Continue from ${formatSecondsToTime(localTime)}` : 'Play'}</span>
                  </button>

                  <button
                    onClick={handleStartFromBeginning}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start from Beginning</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => createTaskFromResource(resource.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Create Task</span>
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={() => markResourceCompleted(resource.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Completed</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Study Notes on this Resource */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Personal Study Notes
                </h4>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit Notes
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Capture code snippets, timestamps, or takeaways from this video..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-700 leading-relaxed min-h-[50px]">
                  {resource.notes || (
                    <span className="text-slate-400 italic">No notes taken yet.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
