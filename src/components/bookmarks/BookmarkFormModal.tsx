import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Globe,
  Star,
  ExternalLink,
  Sparkles,
  Bookmark,
  Check,
  FolderPlus,
  Layers,
  FileText,
  Clipboard,
} from 'lucide-react';
import {
  normalizeUrl,
  getHostname,
  getFaviconUrl,
  inferWebsiteName,
  suggestCategoryAndSubcategory,
  DEFAULT_BOOKMARK_TAXONOMY,
  getAvatarFallbackGradient,
} from '../../utils/faviconUtils';

export const BookmarkFormModal: React.FC = () => {
  const {
    isBookmarkFormOpen,
    closeBookmarkForm,
    bookmarkToEdit,
    preselectedBookmarkCategory,
    preselectedBookmarkSubcategory,
    addBookmark,
    updateBookmark,
    categories,
    addCustomCategory,
  } = useApp();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Daily Needs');
  const [subcategory, setSubcategory] = useState('General');
  const [isPinned, setIsPinned] = useState(false);
  const [notes, setNotes] = useState('');

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const [userEditedTitle, setUserEditedTitle] = useState(false);

  // Available categories: built-in taxonomy keys + app categories
  const allCategories = Array.from(
    new Set([...Object.keys(DEFAULT_BOOKMARK_TAXONOMY), ...categories, 'Daily Needs', 'Development'])
  );

  // Suggested subcategories for currently chosen category
  const suggestedSubcategories = DEFAULT_BOOKMARK_TAXONOMY[category] || [
    'General',
    'Documentation',
    'Tools',
    'Tutorials',
  ];

  // Initialize or reset when modal opens or bookmarkToEdit changes
  useEffect(() => {
    if (bookmarkToEdit) {
      setUrl(bookmarkToEdit.url);
      setTitle(bookmarkToEdit.title);
      setCategory(bookmarkToEdit.category || 'Daily Needs');
      setSubcategory(bookmarkToEdit.subcategory || 'General');
      setIsPinned(!!bookmarkToEdit.isPinned);
      setNotes(bookmarkToEdit.notes || '');
      setIsCustomCategory(false);
      setUserEditedTitle(true);
      setImageError(false);
    } else {
      const initialCat = preselectedBookmarkCategory || 'Daily Needs';
      const initialSubcat = preselectedBookmarkSubcategory || 'General';
      setUrl('');
      setTitle('');
      setCategory(initialCat);
      setSubcategory(initialSubcat);
      setIsPinned(initialCat === 'Daily Needs');
      setNotes('');
      setIsCustomCategory(false);
      setUserEditedTitle(false);
      setImageError(false);
    }
  }, [bookmarkToEdit, isBookmarkFormOpen, preselectedBookmarkCategory, preselectedBookmarkSubcategory]);

  if (!isBookmarkFormOpen) return null;

  // Real-time URL parsing & favicon URL
  const normalizedUrl = normalizeUrl(url);
  const hostname = getHostname(url);
  const liveFaviconUrl = normalizedUrl ? getFaviconUrl(normalizedUrl) : '';
  const fallbackDesign = getAvatarFallbackGradient(hostname || title || 'bookmark');

  // Handle URL change: auto-fetch favicon, infer title, and suggest category/subcategory
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setImageError(false);

    if (value.trim().length > 3) {
      const inferred = inferWebsiteName(value);
      if (!userEditedTitle && inferred) {
        setTitle(inferred);
      }

      // If user hasn't specified category or it's new
      if (!bookmarkToEdit && (!preselectedBookmarkCategory || preselectedBookmarkCategory === 'Daily Needs')) {
        const suggestion = suggestCategoryAndSubcategory(value);
        if (suggestion.category) {
          setCategory(suggestion.category);
          setSubcategory(suggestion.subcategory);
        }
      }
    }
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          handleUrlChange(clipText);
        }
      }
    } catch (e) {
      // Clipboard access denied or unsupported
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const finalUrl = normalizeUrl(url);
    const finalHostname = getHostname(finalUrl);
    const finalTitle = title.trim() || inferWebsiteName(finalUrl) || finalHostname || 'Website';
    const finalFavicon = getFaviconUrl(finalUrl);
    const finalCat = isCustomCategory && customCategoryInput.trim() ? customCategoryInput.trim() : category;

    if (isCustomCategory && customCategoryInput.trim()) {
      addCustomCategory(customCategoryInput.trim());
    }

    if (bookmarkToEdit) {
      updateBookmark(bookmarkToEdit.id, {
        url: finalUrl,
        title: finalTitle,
        faviconUrl: finalFavicon,
        category: finalCat,
        subcategory: subcategory.trim() || 'General',
        isPinned,
        notes: notes.trim(),
      });
    } else {
      addBookmark({
        url: finalUrl,
        title: finalTitle,
        faviconUrl: finalFavicon,
        category: finalCat,
        subcategory: subcategory.trim() || 'General',
        isPinned,
        notes: notes.trim(),
      });
    }

    closeBookmarkForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBookmarkForm();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                {bookmarkToEdit ? 'Edit Website Bookmark' : 'Add Website Bookmark'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Auto-fetches high-res favicon & generates circle launchpad card
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeBookmarkForm}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Live Circle Card Preview Zone */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Live Circle Card Preview</span>
            </span>

            {/* Circle Card Preview */}
            <div className="flex flex-col items-center gap-2 group cursor-default">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white shadow-md border-2 border-slate-200 flex items-center justify-center p-3.5 transition-all group-hover:scale-105 group-hover:border-blue-400">
                  {liveFaviconUrl && !imageError ? (
                    <img
                      src={liveFaviconUrl}
                      alt={title || 'Favicon'}
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-full"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${fallbackDesign.bgClass} ${fallbackDesign.textColor} flex items-center justify-center font-bold text-base shadow-xs`}
                    >
                      {(title || hostname || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {isPinned && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border-2 border-white">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>

              {/* Title & Category Under Circle */}
              <div className="text-center max-w-[150px]">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {title || (hostname ? hostname : 'Enter URL below')}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center justify-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-medium">
                    {category}
                  </span>
                  {subcategory && subcategory !== 'General' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 font-medium truncate max-w-[80px]">
                      {subcategory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {hostname && (
              <span className="mt-2.5 text-[10px] text-slate-400 font-mono">
                {hostname}
              </span>
            )}
          </div>

          {/* Website URL Input with Live Favicon Fetch */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Website URL <span className="text-rose-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste URL</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="e.g. github.com, https://figma.com, stackoverflow.com"
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                autoFocus={!bookmarkToEdit}
              />
              {normalizedUrl && (
                <a
                  href={normalizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1"
                  title="Test link in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Favicon is automatically extracted and cached for high-resolution displays.
            </p>
          </div>

          {/* Title / Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Website Name / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setUserEditedTitle(true);
              }}
              placeholder="e.g. GitHub, Figma, MDN Web Docs"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Category & Subcategory Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isCustomCategory ? 'Choose Preset' : '+ New Category'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="e.g. Cloud & DevOps"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setCategory(nextCat);
                    const defaultSubs = DEFAULT_BOOKMARK_TAXONOMY[nextCat];
                    if (defaultSubs && defaultSubs.length > 0) {
                      setSubcategory(defaultSubs[0]);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subcategory */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Subcategory</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  list="subcategory-suggestions"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Documentation, Code Repositories"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <datalist id="subcategory-suggestions">
                  {suggestedSubcategories.map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Quick Subcategory Pills for Fast Selection */}
          {suggestedSubcategories.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Subcategories:</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedSubcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubcategory(sub)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                      subcategory === sub
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pin to Daily Needs Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pin to Daily Needs</h4>
                <p className="text-[10px] text-slate-500">
                  Feature prominently on the top launchpad shelf for quick daily access
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                isPinned ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                  isPinned ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes / Purpose (Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Main project repo, design tokens, reference documentation"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={closeBookmarkForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{bookmarkToEdit ? 'Save Changes' : 'Add to Bookmarks'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
