import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Youtube,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  RotateCcw,
  Clipboard,
  Link,
} from 'lucide-react';
import { ResourceType, ResourceSection } from '../../types';
import {
  extractYoutubeVideoId,
  extractYoutubePlaylistId,
  fetchYoutubeMetadata,
  getYoutubeThumbnail,
  fetchYoutubePlaylistVideos,
} from '../../utils/youtubeUtils';
import { formatSecondsToTime } from '../../utils/timeUtils';

export const ResourceFormModal: React.FC = () => {
  const {
    isResourceFormOpen,
    closeResourceForm,
    addResource,
    updateResource,
    resourceToEdit,
    goals,
    modules,
    preselectedGoalId,
    preselectedModuleId,
    openResourcePlayer,
  } = useApp();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ResourceType>('youtube');
  const [section, setSection] = useState<ResourceSection>('learn');
  const [channel, setChannel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [exactDurationSeconds, setExactDurationSeconds] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [thumbnailFallback, setThumbnailFallback] = useState('');
  const [goalId, setGoalId] = useState(preselectedGoalId || goals[0]?.id || '');
  const [moduleId, setModuleId] = useState(preselectedModuleId || '');
  const [description, setDescription] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);

  // YouTube auto-fetch state & smart detection feedback
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchedVideoId, setLastFetchedVideoId] = useState<string | null>(null);
  const [urlMovedNotice, setUrlMovedNotice] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resourceToEdit) {
      setTitle(resourceToEdit.title);
      setUrl(resourceToEdit.url);
      setType(resourceToEdit.type);
      setSection(resourceToEdit.section);
      setChannel(resourceToEdit.channel || '');
      setDurationMinutes(Math.round(resourceToEdit.durationSeconds / 60) || 15);
      setExactDurationSeconds(resourceToEdit.durationSeconds || null);
      setThumbnail(resourceToEdit.thumbnail || '');
      setGoalId(resourceToEdit.goalId);
      setModuleId(resourceToEdit.moduleId);
      setDescription(resourceToEdit.description || '');
      setPlaylistVideos(resourceToEdit.playlistVideos || []);
      setLastFetchedVideoId(resourceToEdit.videoId || null);
      setFetchSuccess(false);
      setFetchError(null);
      setUrlMovedNotice(false);
    } else {
      setTitle('');
      setUrl('');
      setType('youtube');
      setSection('learn');
      setChannel('');
      setDurationMinutes(25);
      setExactDurationSeconds(null);
      setThumbnail('');
      setThumbnailFallback('');
      setPlaylistVideos([]);
      const initialGoal = preselectedGoalId || goals[0]?.id || '';
      setGoalId(initialGoal);
      if (preselectedModuleId) {
        setModuleId(preselectedModuleId);
      } else if (initialGoal) {
        const goalMods = modules.filter((m) => m.goalId === initialGoal);
        if (goalMods.length > 0) setModuleId(goalMods[0].id);
      }
      setDescription('');
      setLastFetchedVideoId(null);
      setFetchSuccess(false);
      setFetchError(null);
      setUrlMovedNotice(false);
    }
  }, [resourceToEdit, preselectedGoalId, preselectedModuleId, isResourceFormOpen, goals, modules]);

  // Set default moduleId when goal changes
  useEffect(() => {
    const goalMods = modules.filter((m) => m.goalId === goalId);
    if (goalMods.length > 0) {
      const isCurrentModValid = goalMods.some((m) => m.id === moduleId);
      if (!isCurrentModValid) {
        setModuleId(goalMods[0].id);
      }
    } else {
      setModuleId('');
    }
  }, [goalId, modules, moduleId]);

  // Execute YouTube auto-fetch
  const executeYoutubeFetch = async (targetUrl: string, manual = false) => {
    const videoId = extractYoutubeVideoId(targetUrl);
    const playlistId = extractYoutubePlaylistId(targetUrl);

    if (!videoId && !playlistId) {
      if (manual) {
        setFetchError('No valid YouTube video or playlist found in URL.');
      }
      return;
    }

    const uniqueId = playlistId || videoId || '';

    // If already fetched this exact ID and not manual trigger, skip
    if (uniqueId === lastFetchedVideoId && !manual && fetchSuccess) {
      return;
    }

    setIsFetchingYoutube(true);
    setFetchError(null);
    setFetchSuccess(false);

    try {
      const meta = await fetchYoutubeMetadata(targetUrl);
      if (meta) {
        setTitle(meta.title);
        setChannel(meta.channel);
        setThumbnail(meta.thumbnail || '');
        setThumbnailFallback(meta.thumbnailFallback || '');
        
        if (meta.isPlaylist && meta.playlistId) {
          const fetchedVids = (meta.playlistVideos && meta.playlistVideos.length > 0)
            ? meta.playlistVideos
            : await fetchYoutubePlaylistVideos(meta.playlistId);

          setPlaylistVideos(fetchedVids);
          const totalSec = fetchedVids && fetchedVids.length > 0
            ? fetchedVids.reduce((sum: number, v: any) => sum + (v.durationSeconds || 300), 0)
            : meta.durationSeconds;

          setDurationMinutes(Math.max(1, Math.round(totalSec / 60)));
          setExactDurationSeconds(totalSec);
        } else {
          setDurationMinutes(meta.durationMinutes);
          setExactDurationSeconds(meta.durationSeconds);
          setPlaylistVideos([]);
        }

        setLastFetchedVideoId(meta.playlistId || meta.videoId);
        setFetchSuccess(true);
        setType('youtube');
      } else if (videoId) {
        // Fallback: we still have the video ID, so thumbnail is guaranteed
        const directThumb = getYoutubeThumbnail(videoId, 'maxres');
        setThumbnail(directThumb);
        setThumbnailFallback(getYoutubeThumbnail(videoId, 'hq'));
        setLastFetchedVideoId(videoId);
        setFetchSuccess(true);
        setType('youtube');
      }
    } catch (err: any) {
      if (videoId) {
        // Fallback: we still have the video ID, so thumbnail is guaranteed
        const directThumb = getYoutubeThumbnail(videoId, 'maxres');
        setThumbnail(directThumb);
        setThumbnailFallback(getYoutubeThumbnail(videoId, 'hq'));
        setLastFetchedVideoId(videoId);
        setFetchSuccess(true);
        setType('youtube');
      }
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  // Auto-fetch YouTube details whenever URL changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setFetchSuccess(false);
    setFetchError(null);

    const detectedId = extractYoutubeVideoId(newUrl) || extractYoutubePlaylistId(newUrl);
    if (detectedId) {
      setType('youtube');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        executeYoutubeFetch(newUrl);
      }, 350);
    }
  };

  // Smart detection for the Title field: if user accidentally pastes/types URL in the Title field
  const handleTitleChange = (newTitle: string) => {
    const detectedId = extractYoutubeVideoId(newTitle) || extractYoutubePlaylistId(newTitle);
    const isUrl = /^https?:\/\//i.test(newTitle.trim()) || !!detectedId;

    if (isUrl) {
      const cleanUrl = newTitle.trim();
      setUrl(cleanUrl);
      setUrlMovedNotice(true);
      setTimeout(() => setUrlMovedNotice(false), 5000);
      handleUrlChange(cleanUrl);
      setTitle('Fetching YouTube title...');
      return;
    }

    setTitle(newTitle);
  };

  const handleTitlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const detectedId = extractYoutubeVideoId(text) || extractYoutubePlaylistId(text);
    if (detectedId || /^https?:\/\//i.test(text.trim())) {
      e.preventDefault();
      const cleanUrl = text.trim();
      setUrl(cleanUrl);
      setUrlMovedNotice(true);
      setTimeout(() => setUrlMovedNotice(false), 5000);
      handleUrlChange(cleanUrl);
      setTitle('Fetching YouTube title...');
    }
  };

  // One-click clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleUrlChange(text.trim());
        }
      }
    } catch {
      // ignore if permissions blocked
    }
  };

  const handleSetQuickDuration = (minutes: number) => {
    setDurationMinutes(minutes);
    setExactDurationSeconds(minutes * 60);
  };

  if (!isResourceFormOpen) return null;

  const goalModules = modules.filter((m) => m.goalId === goalId);
  const detectedVideoId = extractYoutubeVideoId(url) || extractYoutubePlaylistId(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !goalId || !moduleId) return;

    const videoId = type === 'youtube' ? extractYoutubeVideoId(url) || undefined : undefined;
    const playlistId = type === 'youtube' ? extractYoutubePlaylistId(url) || undefined : undefined;
    const finalThumbnail =
      thumbnail ||
      (videoId ? getYoutubeThumbnail(videoId, 'maxres') : undefined) ||
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=320&q=80';

    const durationSeconds =
      exactDurationSeconds && Math.round(exactDurationSeconds / 60) === durationMinutes
        ? exactDurationSeconds
        : durationMinutes * 60;

    if (resourceToEdit) {
      updateResource(resourceToEdit.id, {
        goalId,
        moduleId,
        type,
        section,
        title: title.trim(),
        url: url.trim(),
        channel: channel.trim() || (type === 'youtube' ? 'YouTube Creator' : undefined),
        thumbnail: finalThumbnail,
        durationSeconds,
        videoId: videoId || resourceToEdit.videoId,
        playlistId: playlistId || resourceToEdit.playlistId,
        isPlaylist: !!playlistId || resourceToEdit.isPlaylist,
        playlistVideos: playlistVideos.length > 0 ? playlistVideos : resourceToEdit.playlistVideos,
        currentPlaylistIndex: resourceToEdit.currentPlaylistIndex ?? 0,
        description: description.trim(),
      });
    } else {
      addResource({
        goalId,
        moduleId,
        type,
        section,
        title: title.trim(),
        url: url.trim(),
        channel: channel.trim() || (type === 'youtube' ? 'YouTube Creator' : undefined),
        thumbnail: finalThumbnail,
        durationSeconds,
        videoId,
        playlistId,
        isPlaylist: !!playlistId,
        playlistVideos: playlistVideos,
        currentPlaylistIndex: 0,
        status: 'not_started',
        currentTime: 0,
        description: description.trim(),
        notes: '',
      });
    }

    closeResourceForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm sm:text-base font-heading font-semibold text-slate-900 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600 fill-red-600" />
              <span>{resourceToEdit ? 'Edit Learning Resource' : 'Add Learning Resource'}</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Paste a YouTube link below to automatically fetch title, creator, duration, and thumbnail.
            </p>
          </div>
          <button
            onClick={closeResourceForm}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Smart URL Moved notification (when user pasted into Title) */}
          {urlMovedNotice && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2 animate-in fade-in duration-200">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>YouTube link detected!</strong> Moved your link to the URL field and automatically fetching video details...
              </span>
            </div>
          )}

          {/* PRIMARY: YouTube Link / URL Input Hero Box */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-600 fill-red-600" />
                <span>YouTube Link or Resource URL</span>
                <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 transition-colors shadow-2xs"
                  title="Paste link from clipboard"
                >
                  <Clipboard className="w-3 h-3 text-slate-500" />
                  <span>Paste</span>
                </button>

                {detectedVideoId && (
                  <button
                    type="button"
                    onClick={() => executeYoutubeFetch(url, true)}
                    disabled={isFetchingYoutube}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200 disabled:opacity-50 transition-colors"
                    title="Re-fetch details from YouTube"
                  >
                    {isFetchingYoutube ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Auto-fetch</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="e.g. https://youtu.be/06GNg9iC2yQ or https://www.youtube.com/watch?v=..."
                className="w-full pl-3 pr-24 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-2xs font-medium"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                {isFetchingYoutube && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching
                  </span>
                )}
                {fetchSuccess && !isFetchingYoutube && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Fetched
                  </span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              Supports <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">youtu.be/...</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">youtube.com/watch?v=...</code>, Shorts, and embed links.
            </p>

            {/* Fetch feedback spinner banner */}
            {isFetchingYoutube && (
              <div className="p-2.5 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center gap-2 text-blue-800 text-[11px] animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-600" />
                <span>Automatically fetching YouTube title, creator, duration, and thumbnail...</span>
              </div>
            )}

            {/* LIVE FETCHED PREVIEW CARD */}
            {thumbnail && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3 mt-2">
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 shadow-xs border border-slate-200">
                  <img
                    src={thumbnail}
                    alt={title || 'Video thumbnail'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      if (thumbnailFallback && e.currentTarget.src !== thumbnailFallback) {
                        e.currentTarget.src = thumbnailFallback;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  {durationMinutes > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/85 text-[9px] font-semibold text-white px-1.5 py-0.5 rounded font-tabular">
                      {exactDurationSeconds ? formatSecondsToTime(exactDurationSeconds) : `${durationMinutes}m`}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-5 h-5 text-white fill-white/80" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-fetched YouTube details</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {title || 'YouTube Video'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    <span className="font-medium text-slate-700">{channel || 'Creator'}</span> · {exactDurationSeconds ? formatSecondsToTime(exactDurationSeconds) : `${durationMinutes} min`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>✓ Thumbnail will be displayed on the card</span>
                  </p>
                </div>
              </div>
            )}

            {fetchError && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-amber-800 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>

          {/* Title input with smart detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Resource Title <span className="text-red-500">*</span>
              </label>
              {isFetchingYoutube && (
                <span className="text-[10px] text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Fetching title...
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onPaste={handleTitlePaste}
              placeholder="e.g. Ultimate FREE WordPress eCommerce Website Tutorial"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium bg-white"
            />
          </div>

          {/* Channel / Creator & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Channel / Creator
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="e.g. Jim Fahad Digital"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Duration (Minutes)
                </label>
                {exactDurationSeconds ? (
                  <span className="text-[10px] text-slate-500 font-tabular">
                    Formatted: {formatSecondsToTime(exactDurationSeconds)}
                  </span>
                ) : null}
              </div>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setDurationMinutes(val);
                  setExactDurationSeconds(val * 60);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-tabular"
              />
              {/* Quick duration presets */}
              <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
                {[15, 30, 45, 60, 120, 180, 300].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetQuickDuration(mins)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors shrink-0 ${
                      durationMinutes === mins
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Type and Section dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="youtube">YouTube Video</option>
                <option value="documentation">Documentation</option>
                <option value="article">Article</option>
                <option value="reference">Reference / Tool</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as ResourceSection)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="learn">LEARN (Lectures & Docs)</option>
                <option value="practice">PRACTICE (Exercises & Projects)</option>
                <option value="review">REVIEW (Notes & References)</option>
              </select>
            </div>
          </div>

          {/* Target Goal & Module */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Goal <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={goalId}
                onChange={(e) => {
                  setGoalId(e.target.value);
                  setModuleId('');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="">Select Goal...</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                disabled={!goalId}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white disabled:opacity-50"
              >
                <option value="">Select Module...</option>
                {goalModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code}. {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary or key takeaway of this learning resource..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={closeResourceForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFetchingYoutube}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {resourceToEdit ? 'Save Changes' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
