import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Compass, Image as ImageIcon, Sparkles, Link, Check, ExternalLink } from 'lucide-react';
import { LearningGoal } from '../../types';

// Curated high-quality image presets for quick selection
const IMAGE_PRESETS = [
  {
    name: 'Frontend & React',
    category: 'Frontend Engineering',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Web Design & CSS',
    category: 'Design & Frontend',
    url: '/src/assets/images/goal_cover_webdesign_1790353826065.jpg',
  },
  {
    name: 'Fullstack & Backend',
    category: 'Backend & APIs',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'AI & Data Science',
    category: 'AI & Machine Learning',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Systems & C / Rust',
    category: 'Systems & Architecture',
    url: '/src/assets/images/goal_cover_cprogramming_1790353839928.jpg',
  },
  {
    name: 'WordPress & CMS',
    category: 'CMS & Web',
    url: '/src/assets/images/goal_cover_wordpress_1790353812080.jpg',
  },
  {
    name: 'Mobile Apps (iOS/Android)',
    category: 'Mobile Development',
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'DevOps & Cloud',
    category: 'Cloud & Infrastructure',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'UI/UX Design Systems',
    category: 'UI/UX Design',
    url: 'https://images.unsplash.com/photo-1581291518655-9523b932edcf?q=80&w=800&auto=format&fit=crop',
  },
];

export const GoalFormModal: React.FC = () => {
  const {
    isGoalFormOpen,
    goalToEdit,
    closeGoalForm,
    addGoal,
    updateGoal,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend Engineering');
  const [coverImage, setCoverImage] = useState('/src/assets/images/goal_cover_webdesign_1790353826065.jpg');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setDescription(goalToEdit.description || '');
      setCategory(goalToEdit.category || 'Frontend Engineering');
      setCoverImage(goalToEdit.coverImage || '/src/assets/images/goal_cover_webdesign_1790353826065.jpg');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Frontend Engineering');
      setCoverImage('/src/assets/images/goal_cover_webdesign_1790353826065.jpg');
    }
    setImageError(false);
  }, [goalToEdit, isGoalFormOpen]);

  if (!isGoalFormOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedCover = coverImage.trim() || '/src/assets/images/goal_cover_webdesign_1790353826065.jpg';

    if (goalToEdit) {
      updateGoal(goalToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        coverImage: trimmedCover,
      });
    } else {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        coverImage: trimmedCover,
        progress: 0,
        totalLearningTimeMinutes: 0,
        lastStudiedAt: 'Just created',
      });
    }

    closeGoalForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-heading font-semibold text-slate-900">
              {goalToEdit ? 'Edit Learning Goal' : 'Create Learning Goal'}
            </h2>
          </div>
          <button
            onClick={closeGoalForm}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js & Fullstack React"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Frontend Engineering, Systems, Mobile"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description & Curriculum Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you will master, modules, and key milestones..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Image Link Input Section */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Cover Image Link / URL</span>
              </label>
              <span className="text-[10px] text-slate-400">Paste any image URL or choose a preset</span>
            </div>

            <div className="relative">
              <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setImageError(false);
                }}
                placeholder="https://images.unsplash.com/... or image link"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Live Cover Preview */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mt-2 shadow-xs group">
              {coverImage && !imageError ? (
                <img
                  src={coverImage}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center bg-linear-to-br from-slate-800 to-slate-900">
                  <ImageIcon className="w-8 h-8 mb-1.5 text-slate-500" />
                  <span className="text-xs font-medium">Image Preview Unavailable</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Please check the image URL or select a preset below</span>
                </div>
              )}

              {/* Scrim overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

              {/* Category Badge Preview */}
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-semibold text-white bg-slate-950/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/15">
                  {category || 'Category'}
                </span>
              </div>

              {/* Goal Title Preview */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-xs font-heading font-bold text-white truncate block drop-shadow-sm">
                  {title || 'Goal Title Preview'}
                </span>
              </div>
            </div>

            {/* Quick Image Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Cover Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_PRESETS.map((preset) => {
                  const isSelected = coverImage === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setCoverImage(preset.url);
                        setImageError(false);
                        if (!category || category === 'Frontend Engineering') {
                          setCategory(preset.category);
                        }
                      }}
                      className={`relative h-14 rounded-lg overflow-hidden border text-left p-1.5 transition-all group cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-blue-600 border-blue-600 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 group-hover:bg-slate-950/40 transition-colors" />
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="self-end w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeGoalForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              {goalToEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
