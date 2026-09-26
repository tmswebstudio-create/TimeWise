import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WebsiteBookmark } from '../../types';
import {
  Bookmark,
  Plus,
  Search,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  Layers,
  Folder,
  ArrowUpRight,
  MoreVertical,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getHostname,
  getAvatarFallbackGradient,
} from '../../utils/faviconUtils';

// Helper Hook for Grid Column Tracking (3 cols mobile, 4 sm, 6 md, 8 lg)
export const useGridColumns = () => {
  const [cols, setCols] = useState(() => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w >= 1024) return 8;
    if (w >= 768) return 6;
    if (w >= 640) return 4;
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(8);
      else if (w >= 768) setCols(6);
      else if (w >= 640) setCols(4);
      else setCols(3);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return cols;
};

// Drag Transfer Payload Types
type DragItemType =
  | { type: 'bookmark'; id: string; category: string; subcategory?: string }
  | { type: 'subcategory'; category: string; subcategory: string }
  | { type: 'category'; category: string };

// Individual Circle Card Component
interface CircleCardProps {
  bookmark: WebsiteBookmark;
  index: number;
  total: number;
  cols: number;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onOpen: (bookmark: WebsiteBookmark) => void;
  onEdit: (bookmark: WebsiteBookmark) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCopyUrl: (url: string) => void;
  copiedId: string | null;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, bookmark: WebsiteBookmark) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, bookmark: WebsiteBookmark) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetBookmark: WebsiteBookmark) => void;
}

const CircleBookmarkCard: React.FC<CircleCardProps> = ({
  bookmark,
  index,
  total,
  cols,
  onMoveLeft,
  onMoveRight,
  onMoveTop,
  onMoveBottom,
  onOpen,
  onEdit,
  onDelete,
  onTogglePin,
  onCopyUrl,
  copiedId,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hostname = getHostname(bookmark.url);
  const fallback = getAvatarFallbackGradient(hostname || bookmark.title);

  // Position-aware movement capability
  const canMoveLeft = Boolean(onMoveLeft && index > 0);
  const canMoveRight = Boolean(onMoveRight && index < total - 1);
  const canMoveTop = Boolean(onMoveTop && index >= cols);
  const canMoveBottom = Boolean(onMoveBottom && index + cols < total);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div
      draggable={!isMenuOpen}
      onDragStart={(e) => onDragStart(e, bookmark)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, bookmark)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, bookmark)}
      onClick={() => onOpen(bookmark)}
      className={`flex flex-col items-center group relative select-none w-24 sm:w-28 text-center transition-all cursor-pointer ${
        isDragging ? 'opacity-30 scale-90' : 'opacity-100'
      } ${isDragOver ? 'scale-105' : ''}`}
    >
      {/* Visual Drop Target Highlight when dragged over */}
      {isDragOver && (
        <div className="absolute -inset-1.5 rounded-3xl bg-blue-500/10 border-2 border-dashed border-blue-500 animate-pulse pointer-events-none z-10" />
      )}

      {/* Circle Icon Launchpad Container */}
      <div className="relative">
        
        {/* 3-Dot Options Button in the Left Top Corner */}
        <div
          className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 z-30"
          ref={menuRef}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer ${
              isMenuOpen ? 'opacity-100 ring-2 ring-blue-500/30' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
            title="Bookmark options"
            aria-label="Bookmark options"
          >
            <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Star / Pin option */}
              <button
                type="button"
                onClick={() => {
                  onTogglePin(bookmark.id);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    bookmark.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                  }`}
                />
                <span>{bookmark.isPinned ? 'Unpin from Daily' : 'Pin to Daily'}</span>
              </button>

              {/* Copy URL option */}
              <button
                type="button"
                onClick={() => {
                  onCopyUrl(bookmark.url);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
              >
                {copiedId === bookmark.url ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{copiedId === bookmark.url ? 'Copied!' : 'Copy URL'}</span>
              </button>

              {/* Edit option */}
              <button
                type="button"
                onClick={() => {
                  onEdit(bookmark);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {/* Delete option */}
              <button
                type="button"
                onClick={() => {
                  onDelete(bookmark.id);
                  setIsMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Directional Position Arrows: Top, Bottom, Left, Right (shown according to position) */}
        {/* Top Arrow - row above */}
        {canMoveTop && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveTop?.();
            }}
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer z-30"
            title="Move card up"
            aria-label="Move card up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Bottom Arrow - row below */}
        {canMoveBottom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveBottom?.();
            }}
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer z-30"
            title="Move card down"
            aria-label="Move card down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Left Arrow - previous card */}
        {canMoveLeft && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft?.();
            }}
            className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer z-30"
            title="Move card left"
            aria-label="Move card left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Arrow - next card */}
        {canMoveRight && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight?.();
            }}
            className="absolute top-1/2 -translate-y-1/2 -right-2.5 w-5 h-5 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer z-30"
            title="Move card right"
            aria-label="Move card right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Circular Website Launch Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(bookmark);
          }}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-xs border border-slate-200/90 group-hover:border-blue-400 group-hover:shadow-md group-hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center p-3 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer ${
            isDragOver ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
          title={`Open ${bookmark.title} (${hostname}) - Or drag to reorder`}
          aria-label={`Open ${bookmark.title}`}
        >
          {bookmark.faviconUrl && !imageError ? (
            <img
              src={bookmark.faviconUrl}
              alt={bookmark.title}
              loading="lazy"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full transition-transform group-hover:scale-110 pointer-events-none"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full ${fallback.bgClass} ${fallback.textColor} flex items-center justify-center font-bold text-sm sm:text-base shadow-xs pointer-events-none`}
            >
              {(bookmark.title || hostname || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Micro external link indicator on hover */}
          <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center pointer-events-none">
            <ArrowUpRight className="w-4 h-4 text-blue-600 opacity-80" />
          </div>
        </button>

        {/* Pinned Star Badge on the Right Top */}
        {bookmark.isPinned && (
          <div
            title="Pinned to Daily Needs"
            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border-2 border-white pointer-events-none"
          >
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      {/* Website Name / Title Label */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(bookmark);
        }}
        className="mt-2 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate max-w-[92px] sm:max-w-[104px] leading-tight text-center focus:outline-none cursor-pointer"
        title={bookmark.title}
      >
        {bookmark.title}
      </button>

      {/* Subcategory Label / Visits Indicator */}
      <span className="text-[10px] text-slate-500 truncate max-w-[90px] mt-0.5 leading-tight">
        {bookmark.subcategory || hostname}
      </span>
    </div>
  );
};

export const BookmarksView: React.FC = () => {
  const {
    bookmarks,
    openBookmarkForm,
    deleteBookmark,
    togglePinBookmark,
    recordBookmarkClick,
    reorderBookmarks,
    moveBookmark,
    pinnedBookmarkOrder,
    reorderPinnedBookmarks,
    categoryOrder,
    reorderCategories,
    subcategoryOrder,
    reorderSubcategories,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const gridCols = useGridColumns();

  // Drag states
  const [draggingBookmarkId, setDraggingBookmarkId] = useState<string | null>(null);
  const [dragOverBookmarkId, setDragOverBookmarkId] = useState<string | null>(null);
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [draggingSubcategory, setDraggingSubcategory] = useState<{ category: string; subcategory: string } | null>(null);
  const [dragOverSubcategory, setDragOverSubcategory] = useState<{ category: string; subcategory: string } | null>(null);
  const [isDailyShelfDragOver, setIsDailyShelfDragOver] = useState(false);

  // Extract and order categories based on categoryOrder
  const allCategoriesList = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    const defaultPriority = ['Daily Needs', 'Development', 'Design & UI', 'Learning & Docs', 'Productivity'];
    defaultPriority.forEach((p) => {
      if (bookmarks.some((b) => b.category === p)) set.add(p);
    });

    const list = Array.from(set);
    return list.sort((a, b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [bookmarks, categoryOrder]);

  const categoryTabs = useMemo(() => {
    return ['All', ...allCategoriesList];
  }, [allCategoriesList]);

  // Filtered bookmarks by category and search
  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return bookmarks.filter((b) => {
      const matchesCategory =
        selectedCategory === 'All' ? true : b.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.subcategory && b.subcategory.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    });
  }, [bookmarks, selectedCategory, searchQuery]);

  // Pinned / Daily Needs bookmarks (for top shelf)
  const pinnedBookmarks = useMemo(() => {
    const pinned = bookmarks.filter((b) => b.isPinned);
    return pinned.sort((a, b) => {
      const idxA = pinnedBookmarkOrder.indexOf(a.id);
      const idxB = pinnedBookmarkOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [bookmarks, pinnedBookmarkOrder]);

  // Group filtered bookmarks by Category, and then by Subcategory
  const groupedStructure = useMemo(() => {
    const map: Record<string, Record<string, WebsiteBookmark[]>> = {};

    filteredBookmarks.forEach((b) => {
      const cat = b.category || 'General';
      const sub = b.subcategory || 'General';
      if (!map[cat]) map[cat] = {};
      if (!map[cat][sub]) map[cat][sub] = [];
      map[cat][sub].push(b);
    });

    return map;
  }, [filteredBookmarks]);

  // Ordered list of categories for rendering
  const orderedCategoryNames = useMemo(() => {
    const presentCats = Object.keys(groupedStructure);
    return presentCats.sort((a, b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [groupedStructure, categoryOrder]);

  // Helper to get subcategories in custom/persisted order
  const getOrderedSubcategories = (catName: string, subcategoriesMap: Record<string, WebsiteBookmark[]>) => {
    const subNames = Object.keys(subcategoriesMap);
    const preferred = subcategoryOrder[catName] || [];
    return subNames.sort((a, b) => {
      const idxA = preferred.indexOf(a);
      const idxB = preferred.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  };

  // Open website bookmark
  const handleOpenBookmark = (bookmark: WebsiteBookmark) => {
    recordBookmarkClick(bookmark.id);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(url);
      showToast('URL copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // ------------------ BOOKMARK DRAG HANDLERS ------------------
  const handleBookmarkDragStart = (e: React.DragEvent, bookmark: WebsiteBookmark) => {
    const payload: DragItemType = {
      type: 'bookmark',
      id: bookmark.id,
      category: bookmark.category,
      subcategory: bookmark.subcategory,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingBookmarkId(bookmark.id);
  };

  const handleBookmarkDragEnd = () => {
    setDraggingBookmarkId(null);
    setDragOverBookmarkId(null);
    setIsDailyShelfDragOver(false);
    setDragOverSubcategory(null);
    setDragOverCategory(null);
  };

  const handleBookmarkDragOver = (e: React.DragEvent, targetBookmark: WebsiteBookmark) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingBookmarkId && draggingBookmarkId !== targetBookmark.id) {
      setDragOverBookmarkId(targetBookmark.id);
    }
  };

  const handleBookmarkDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBookmarkId(null);
  };

  const handleBookmarkDropOnBookmark = (e: React.DragEvent, targetBookmark: WebsiteBookmark) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBookmarkId(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data: DragItemType = JSON.parse(rawData);

      if (data.type === 'bookmark') {
        if (data.id === targetBookmark.id) return;

        // If from another category/subcategory, move and position it at targetBookmark
        if (data.category !== targetBookmark.category || data.subcategory !== targetBookmark.subcategory) {
          moveBookmark(data.id, targetBookmark.category, targetBookmark.subcategory, targetBookmark.id);
        } else {
          reorderBookmarks(data.id, targetBookmark.id);
        }
      }
    } catch (err) {
      console.error('Bookmark drop error:', err);
    }
  };

  const handleDailyShelfDropOnBookmark = (e: React.DragEvent, targetBookmark: WebsiteBookmark) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBookmarkId(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data: DragItemType = JSON.parse(rawData);

      if (data.type === 'bookmark') {
        if (data.id === targetBookmark.id) return;
        const sourceBm = bookmarks.find((b) => b.id === data.id);
        if (sourceBm && !sourceBm.isPinned) {
          togglePinBookmark(data.id);
        }
        reorderPinnedBookmarks(data.id, targetBookmark.id);
      }
    } catch (err) {
      console.error('Daily shelf drop error:', err);
    }
  };

  // ------------------ SUBCATEGORY CONTAINER DRAG HANDLERS ------------------
  const handleSubcategoryDragStart = (e: React.DragEvent, category: string, subcategory: string) => {
    e.stopPropagation();
    const payload: DragItemType = { type: 'subcategory', category, subcategory };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSubcategory({ category, subcategory });
  };

  const handleSubcategoryDragOver = (e: React.DragEvent, category: string, subcategory: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSubcategory({ category, subcategory });
  };

  const handleSubcategoryDrop = (e: React.DragEvent, targetCat: string, targetSub: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSubcategory(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data: DragItemType = JSON.parse(rawData);

      if (data.type === 'subcategory') {
        // Reordering subcategories within the same category
        if (data.category === targetCat && data.subcategory !== targetSub) {
          reorderSubcategories(targetCat, data.subcategory, targetSub);
        }
      } else if (data.type === 'bookmark') {
        // Dropping a bookmark card onto this subcategory container
        moveBookmark(data.id, targetCat, targetSub);
      }
    } catch (err) {
      console.error('Subcategory drop error:', err);
    }
  };

  // ------------------ CATEGORY CONTAINER DRAG HANDLERS ------------------
  const handleCategoryDragStart = (e: React.DragEvent, category: string) => {
    const payload: DragItemType = { type: 'category', category };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingCategory(category);
  };

  const handleCategoryDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(category);
  };

  const handleCategoryDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data: DragItemType = JSON.parse(rawData);

      if (data.type === 'category') {
        if (data.category !== targetCategory) {
          reorderCategories(data.category, targetCategory);
        }
      } else if (data.type === 'bookmark') {
        moveBookmark(data.id, targetCategory);
      }
    } catch (err) {
      console.error('Category drop error:', err);
    }
  };

  // ------------------ DAILY NEEDS SHELF DRAG HANDLERS ------------------
  const handleDailyShelfDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDailyShelfDragOver(true);
  };

  const handleDailyShelfDragLeave = () => {
    setIsDailyShelfDragOver(false);
  };

  const handleDailyShelfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDailyShelfDragOver(false);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const data: DragItemType = JSON.parse(rawData);

      if (data.type === 'bookmark') {
        const bm = bookmarks.find((b) => b.id === data.id);
        if (bm && !bm.isPinned) {
          togglePinBookmark(data.id);
          showToast(`Pinned "${bm.title}" to Daily Needs shelf`);
        }
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
              Website Bookmarks
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize daily needs, documentation & tools with auto-fetched favicons and circular launchpads.
          </p>
        </div>

        {/* Actions: Search & + Add Bookmark */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openBookmarkForm(null, selectedCategory !== 'All' ? selectedCategory : undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {/* Top Shelf: "Daily Needs & Pinned Launchpad" with Drop Support */}
      {!searchQuery && pinnedBookmarks.length > 0 && (
        <section
          onDragOver={handleDailyShelfDragOver}
          onDragLeave={handleDailyShelfDragLeave}
          onDrop={handleDailyShelfDrop}
          className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-2xs space-y-4 relative ${
            isDailyShelfDragOver
              ? 'border-amber-400 ring-4 ring-amber-400/20 bg-amber-50/20'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Daily Needs & Pinned Shortcuts
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold font-tabular">
                {pinnedBookmarks.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Use arrows or drag to reorder • Drag any card here to pin
            </span>
          </div>

          {/* Grid of Circle Cards for Daily Needs */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-6 gap-x-2 sm:gap-x-4 pt-1 justify-items-center">
            {pinnedBookmarks.map((bookmark, idx) => (
              <CircleBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                index={idx}
                total={pinnedBookmarks.length}
                cols={gridCols}
                onMoveLeft={idx > 0 ? () => reorderPinnedBookmarks(bookmark.id, pinnedBookmarks[idx - 1].id) : undefined}
                onMoveRight={idx < pinnedBookmarks.length - 1 ? () => reorderPinnedBookmarks(bookmark.id, pinnedBookmarks[idx + 1].id) : undefined}
                onMoveTop={idx >= gridCols ? () => reorderPinnedBookmarks(bookmark.id, pinnedBookmarks[idx - gridCols].id) : undefined}
                onMoveBottom={idx + gridCols < pinnedBookmarks.length ? () => reorderPinnedBookmarks(bookmark.id, pinnedBookmarks[idx + gridCols].id) : undefined}
                onOpen={handleOpenBookmark}
                onEdit={(bm) => openBookmarkForm(bm)}
                onDelete={deleteBookmark}
                onTogglePin={togglePinBookmark}
                onCopyUrl={handleCopyUrl}
                copiedId={copiedId}
                isDragging={draggingBookmarkId === bookmark.id}
                isDragOver={dragOverBookmarkId === bookmark.id}
                onDragStart={handleBookmarkDragStart}
                onDragEnd={handleBookmarkDragEnd}
                onDragOver={handleBookmarkDragOver}
                onDragLeave={handleBookmarkDragLeave}
                onDrop={handleDailyShelfDropOnBookmark}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categoryTabs.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count =
            cat === 'All'
              ? bookmarks.length
              : bookmarks.filter((b) => b.category === cat).length;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
              title={cat === 'All' ? 'View all categories' : `Filter by ${cat}`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-tabular ${
                  isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Grouped Categories & Subcategories */}
      {filteredBookmarks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-sm text-slate-800">
            {searchQuery ? `No bookmarks matching "${searchQuery}"` : 'No bookmarks in this category yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching by a different website name, URL, or subcategory.'
              : 'Add your essential websites, tools, or references. Their icons and names will be auto-generated.'}
          </p>
          <button
            type="button"
            onClick={() => openBookmarkForm(null, selectedCategory !== 'All' ? selectedCategory : undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Bookmark</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedCategoryNames.map((catName, catIndex) => {
            const subcategories = groupedStructure[catName] || {};
            const orderedSubNames = getOrderedSubcategories(catName, subcategories);

            return (
              <div key={catName} className="space-y-6">
                {/* Category Level Header (shown when viewing "All") */}
                {selectedCategory === 'All' && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      {/* Top-Bottom Arrow Buttons for Category */}
                      {orderedCategoryNames.length > 1 && (
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                          <button
                            type="button"
                            disabled={catIndex === 0}
                            onClick={() => reorderCategories(catName, orderedCategoryNames[catIndex - 1])}
                            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Move category up"
                            aria-label="Move category up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={catIndex === orderedCategoryNames.length - 1}
                            onClick={() => reorderCategories(catName, orderedCategoryNames[catIndex + 1])}
                            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Move category down"
                            aria-label="Move category down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <Layers className="w-4 h-4 text-blue-600" />
                      <h3 className="font-heading font-bold text-base text-slate-900">
                        {catName}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-tabular">
                        ({Object.values(subcategories).reduce((sum, list) => sum + list.length, 0)} sites)
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Use arrows to reorder categories
                    </span>
                  </div>
                )}

                {/* Subcategories Blocks */}
                <div className="space-y-6">
                  {orderedSubNames.map((subName, subIndex) => {
                    const list = subcategories[subName] || [];
                    const isSubDragOver =
                      dragOverSubcategory?.category === catName &&
                      dragOverSubcategory?.subcategory === subName;

                    return (
                      <div
                        key={subName}
                        onDragOver={(e) => handleSubcategoryDragOver(e, catName, subName)}
                        onDragLeave={() => setDragOverSubcategory(null)}
                        onDrop={(e) => handleSubcategoryDrop(e, catName, subName)}
                        className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-2xs space-y-4 relative ${
                          isSubDragOver
                            ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-50/30'
                            : 'border-slate-200/80'
                        }`}
                      >
                        {/* Subcategory Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Top-Bottom Arrow Buttons for Subcategory */}
                            {orderedSubNames.length > 1 && (
                              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                                <button
                                  type="button"
                                  disabled={subIndex === 0}
                                  onClick={() => reorderSubcategories(catName, subName, orderedSubNames[subIndex - 1])}
                                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                  title="Move subcategory up"
                                  aria-label="Move subcategory up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={subIndex === orderedSubNames.length - 1}
                                  onClick={() => reorderSubcategories(catName, subName, orderedSubNames[subIndex + 1])}
                                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
                                  title="Move subcategory down"
                                  aria-label="Move subcategory down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <Folder className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              {subName}
                            </h4>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold font-tabular">
                              {list.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              Drag cards to reorder
                            </span>

                            {/* Quick Add To Subcategory */}
                            <button
                              type="button"
                              onClick={() => openBookmarkForm(null, catName, subName)}
                              className="text-[11px] font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Add site to ${subName}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add site</span>
                            </button>
                          </div>
                        </div>

                        {/* Circle Cards Grid with Drag and Drop Support */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-6 gap-x-2 sm:gap-x-4 pt-1 justify-items-center">
                          {list.map((bookmark, idx) => (
                            <CircleBookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              index={idx}
                              total={list.length}
                              cols={gridCols}
                              onMoveLeft={idx > 0 ? () => reorderBookmarks(bookmark.id, list[idx - 1].id) : undefined}
                              onMoveRight={idx < list.length - 1 ? () => reorderBookmarks(bookmark.id, list[idx + 1].id) : undefined}
                              onMoveTop={idx >= gridCols ? () => reorderBookmarks(bookmark.id, list[idx - gridCols].id) : undefined}
                              onMoveBottom={idx + gridCols < list.length ? () => reorderBookmarks(bookmark.id, list[idx + gridCols].id) : undefined}
                              onOpen={handleOpenBookmark}
                              onEdit={(bm) => openBookmarkForm(bm)}
                              onDelete={deleteBookmark}
                              onTogglePin={togglePinBookmark}
                              onCopyUrl={handleCopyUrl}
                              copiedId={copiedId}
                              isDragging={draggingBookmarkId === bookmark.id}
                              isDragOver={dragOverBookmarkId === bookmark.id}
                              onDragStart={handleBookmarkDragStart}
                              onDragEnd={handleBookmarkDragEnd}
                              onDragOver={handleBookmarkDragOver}
                              onDragLeave={handleBookmarkDragLeave}
                              onDrop={handleBookmarkDropOnBookmark}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
