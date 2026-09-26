import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  X,
  CheckSquare,
  Compass,
  Layers,
  Bookmark,
  ArrowRight,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    tasks,
    goals,
    modules,
    resources,
    bookmarks,
    recordBookmarkClick,
    setSelectedTaskId,
    setActiveView,
    openResourcePlayer,
  } = useApp();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'goals' | 'modules' | 'resources' | 'bookmarks'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setFilterType('all');
    }
  }, [isSearchOpen]);

  // Global keydown listener for Cmd/Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    : [];

  const matchedGoals = q
    ? goals.filter((g) => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    : [];

  const matchedModules = q
    ? modules.filter((m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q))
    : [];

  const matchedResources = q
    ? resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.channel?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
    : [];

  const matchedBookmarks = q
    ? bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          (b.subcategory && b.subcategory.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q))
      )
    : [];

  const totalResults =
    (filterType === 'all' || filterType === 'tasks' ? matchedTasks.length : 0) +
    (filterType === 'all' || filterType === 'goals' ? matchedGoals.length : 0) +
    (filterType === 'all' || filterType === 'modules' ? matchedModules.length : 0) +
    (filterType === 'all' || filterType === 'resources' ? matchedResources.length : 0) +
    (filterType === 'all' || filterType === 'bookmarks' ? matchedBookmarks.length : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsSearchOpen(false)}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, learning goals, modules, tutorials... (e.g. Elementor, Grid, C)"
            className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Filter Tags */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setFilterType('tasks')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'tasks'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Tasks ({matchedTasks.length})
          </button>
          <button
            onClick={() => setFilterType('goals')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'goals'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Goals ({matchedGoals.length})
          </button>
          <button
            onClick={() => setFilterType('modules')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'modules'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Modules ({matchedModules.length})
          </button>
          <button
            onClick={() => setFilterType('resources')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'resources'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Resources ({matchedResources.length})
          </button>
          <button
            onClick={() => setFilterType('bookmarks')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterType === 'bookmarks'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Bookmarks ({matchedBookmarks.length})
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Type to search across tasks, learning goals, modules, and video tutorials.
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No results found for "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tasks Results */}
              {(filterType === 'all' || filterType === 'tasks') && matchedTasks.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Tasks ({matchedTasks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchedTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setIsSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-tabular shrink-0">
                          {task.startTime} – {task.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Goals Results */}
              {(filterType === 'all' || filterType === 'goals') && matchedGoals.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Learning Goals ({matchedGoals.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchedGoals.map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => {
                          setActiveView('goal-detail', goal.id);
                          setIsSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {goal.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {goal.category} · {goal.progress}% complete
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules Results */}
              {(filterType === 'all' || filterType === 'modules') && matchedModules.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Modules ({matchedModules.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchedModules.map((moduleItem) => {
                      const goal = goals.find((g) => g.id === moduleItem.goalId);
                      return (
                        <div
                          key={moduleItem.id}
                          onClick={() => {
                            if (goal) setActiveView('module-detail', goal.id, moduleItem.id);
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="text-xs font-semibold text-slate-900 block truncate">
                                {moduleItem.code}. {moduleItem.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                Course: {goal?.title || 'Unknown'} · {moduleItem.progress}%
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resources Results */}
              {(filterType === 'all' || filterType === 'resources') && matchedResources.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Resources ({matchedResources.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchedResources.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => {
                          openResourcePlayer(res);
                          setIsSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {res.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {res.type.toUpperCase()}{res.channel ? ` · ${res.channel}` : ''}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Website Bookmarks Results */}
              {(filterType === 'all' || filterType === 'bookmarks') && matchedBookmarks.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Website Bookmarks ({matchedBookmarks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchedBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        onClick={() => {
                          recordBookmarkClick(bm.id);
                          window.open(bm.url, '_blank', 'noopener,noreferrer');
                          setIsSearchOpen(false);
                        }}
                        className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                            {bm.faviconUrl ? (
                              <img src={bm.faviconUrl} alt={bm.title} className="w-4 h-4 object-contain rounded-full" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                              {bm.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {bm.category} · {bm.subcategory || 'General'} · <span className="font-mono text-slate-400">{bm.url}</span>
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
