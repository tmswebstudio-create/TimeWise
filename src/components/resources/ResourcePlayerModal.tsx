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
  }, [resource, resource?.currentPlaylistIndex]);

  const activeIndex = resource?.currentPlaylistIndex ?? 0;
  const hasPlaylistVideos = !!(resource?.playlistVideos && resource.playlistVideos.length > 0);
  const activeVideo = hasPlaylistVideos && resource?.playlistVideos ? resource.playlistVideos[activeIndex] : null;

  const duration = activeVideo ? (activeVideo.durationSeconds || 300) : (resource?.durationSeconds || 1800);
  const progressPct = Math.min(100, Math.round((localTime / duration) * 100));
  const isCompleted = resource?.status === 'completed' || progressPct >= 90;

  const isActiveVideoCompleted = !!(resource?.isPlaylist && activeVideo && (resource.completedVideoIds || []).includes(activeVideo.videoId));

  const handleVideoCompletion = () => {
    if (!resource) return;
    if (resource.isPlaylist && activeVideo) {
      const alreadyCompleted = resource.completedVideoIds || [];
      if (!alreadyCompleted.includes(activeVideo.videoId)) {
        const nextCompleted = [...alreadyCompleted, activeVideo.videoId];
        const playlistLen = resource.playlistVideos?.length || 1;
        const isAllDone = nextCompleted.length >= playlistLen;
        
        updateResource(resource.id, {
          completedVideoIds: nextCompleted,
          status: isAllDone ? 'completed' : 'in_progress',
        });
      }
    } else {
      markResourceCompleted(resource.id);
    }
  };

  // Live timer simulation when playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && resource) {
      interval = setInterval(() => {
        setLocalTime((prev) => {
          const next = prev + 1;
          const maxDur = duration;
          if (next >= maxDur) {
            setIsPlaying(false);
            handleVideoCompletion();
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
  }, [isPlaying, resource, duration, activeVideo]);

  if (!isResourcePlayerOpen || !resource) return null;

  const goal = goals.find((g) => g.id === resource.goalId);
  const moduleItem = modules.find((m) => m.id === resource.moduleId);

  const selectPlaylistVideo = (idx: number) => {
    updateResource(resource.id, {
      currentPlaylistIndex: idx,
      currentTime: 0,
    });
    setLocalTime(0);
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
  };

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
            {resource.type === 'youtube' && (resource.videoId || resource.playlistId) ? (
              <iframe
                key={`${iframeKey}-${activeIndex}`}
                src={
                  resource.playlistVideos && resource.playlistVideos.length > 0
                    ? `https://www.youtube-nocookie.com/embed/${
                        resource.playlistVideos[activeIndex].videoId
                      }?start=${Math.floor(localTime)}&autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&rel=0`
                    : resource.playlistId
                    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${resource.playlistId}&autoplay=${
                        isPlaying ? 1 : 0
                      }&enablejsapi=1`
                    : `https://www.youtube-nocookie.com/embed/${resource.videoId}?start=${Math.floor(
                        localTime
                      )}&autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&rel=0`
                }
                title={activeVideo ? activeVideo.title : resource.title}
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
                  {activeVideo ? activeVideo.title : resource.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{activeVideo ? `Video #${activeIndex + 1} of Playlist` : resource.channel ? `By ${resource.channel}` : 'YouTube Video'}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                    {resource.videoCount || (resource.playlistVideos?.length ? resource.playlistVideos.length : 1)} {(resource.videoCount || (resource.playlistVideos?.length ? resource.playlistVideos.length : 1)) === 1 ? 'Video' : 'Videos'}
                  </span>
                </p>
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

                  {resource.isPlaylist && activeVideo ? (
                    isActiveVideoCompleted ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Video Completed</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleVideoCompletion}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Video Completed</span>
                      </button>
                    )
                  ) : (
                    !isCompleted && (
                      <button
                        onClick={handleVideoCompletion}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Completed</span>
                      </button>
                    )
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

            {/* Playlist Videos List */}
            {resource.isPlaylist && resource.playlistVideos && resource.playlistVideos.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span>Playlist Videos</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full font-medium">
                      {activeIndex + 1} / {resource.playlistVideos.length}
                    </span>
                  </h4>
                </div>

                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  {resource.playlistVideos.map((video, idx) => {
                    const isCurrent = idx === activeIndex;
                    const isVideoCompleted = (resource.completedVideoIds || []).includes(video.videoId);
                    return (
                      <button
                        key={`${video.videoId}-${idx}`}
                        onClick={() => selectPlaylistVideo(idx)}
                        className={`w-full text-left p-3.5 flex gap-4 transition-colors items-center hover:bg-slate-100/70 ${
                          isCurrent ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-blue-600 pl-2.5' : ''
                        }`}
                      >
                        {/* Video Thumbnail (Enlarged) */}
                        <div className="relative w-28 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-200 shadow-sm border border-slate-200">
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                            }}
                          />
                          {/* Index Indicator (Top Left) */}
                          <div className="absolute top-1 left-1 bg-slate-900/85 px-1 py-0.5 rounded text-[9px] font-bold text-white leading-none">
                            #{idx + 1}
                          </div>
                          {/* Duration Pill (Bottom Right) */}
                          <div className="absolute bottom-1 right-1 bg-slate-950/85 px-1 py-0.5 rounded text-[9px] font-bold text-white font-tabular leading-none">
                            {formatSecondsToTime(video.durationSeconds || 300)}
                          </div>
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <h5
                            className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
                              isCurrent ? 'text-blue-700' : 'text-slate-800'
                            }`}
                          >
                            {video.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate mt-1">
                            {video.channel || 'YouTube Video'}
                          </p>
                        </div>

                        {/* Badges Column */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                              Now Playing
                            </span>
                          )}
                          {isVideoCompleted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
