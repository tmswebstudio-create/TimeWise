import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Habit } from '../../types';
import { compressImageFileToDataUrl } from '../../utils/imageUtils';
import { getTodayDateString, addDays } from '../../utils/timeUtils';
import {
  X,
  Flame,
  Code,
  Brain,
  Target,
  BookOpen,
  Dumbbell,
  Zap,
  CheckCircle2,
  Sparkles,
  Check,
  Plus,
  Upload,
  Pipette,
  Calendar,
} from 'lucide-react';

export const HabitFormModal: React.FC = () => {
  const {
    isHabitFormOpen,
    habitToEdit,
    closeHabitForm,
    addHabit,
    updateHabit,
    habits,
    habitCategories,
    addCustomHabitCategory,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coding');
  const [color, setColor] = useState('indigo');
  const [customColorHex, setCustomColorHex] = useState('#6366F1');
  const [isCustomColor, setIsCustomColor] = useState(false);

  const [icon, setIcon] = useState('Flame');
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);

  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [startDate, setStartDate] = useState<string>(getTodayDateString());

  // Custom Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const availableColors = [
    { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-400' },
    { id: 'blue', name: 'Blue', bg: 'bg-blue-600', ring: 'ring-blue-400' },
    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
    { id: 'amber', name: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
    { id: 'rose', name: 'Rose', bg: 'bg-rose-600', ring: 'ring-rose-400' },
    { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-600', ring: 'ring-cyan-400' },
    { id: 'violet', name: 'Violet', bg: 'bg-purple-600', ring: 'ring-purple-400' },
  ];

  const availableIcons = [
    { id: 'Flame', icon: Flame, label: 'Flame' },
    { id: 'Code', icon: Code, label: 'Code' },
    { id: 'Brain', icon: Brain, label: 'Brain' },
    { id: 'Target', icon: Target, label: 'Target' },
    { id: 'BookOpen', icon: BookOpen, label: 'Book' },
    { id: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
    { id: 'Zap', icon: Zap, label: 'Energy' },
    { id: 'CheckCircle2', icon: CheckCircle2, label: 'Check' },
  ];

  const allCategories = Array.from(
    new Set([
      ...(habitCategories || [
        'Coding',
        'Algorithms',
        'Architecture',
        'Health',
        'Learning',
        'Productivity',
        'General',
      ]),
      ...habits.map((h) => h.category).filter(Boolean),
    ])
  );

  const handleAddCategorySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    addCustomHabitCategory(trimmed);
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 128);
      setCustomIconUrl(dataUrl);
      setIcon('custom');
    } catch (err) {
      console.error('Failed to compress icon image:', err);
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category || 'Coding');
      const habitColor = habitToEdit.color || 'indigo';
      const isHex = habitColor.startsWith('#') || !!habitToEdit.customColorHex;
      setColor(habitColor);
      setIsCustomColor(isHex);
      setCustomColorHex(habitToEdit.customColorHex || (isHex ? habitColor : '#6366F1'));
      setIcon(habitToEdit.icon || 'Flame');
      setCustomIconUrl(habitToEdit.customIconUrl || null);
      setFrequency(habitToEdit.frequency || 'daily');
      setTargetDaysPerWeek(habitToEdit.targetDaysPerWeek || 7);
      setStartDate(habitToEdit.startDate || getTodayDateString());
    } else {
      setTitle('');
      setDescription('');
      setCategory('Coding');
      setColor('indigo');
      setIsCustomColor(false);
      setCustomColorHex('#6366F1');
      setIcon('Flame');
      setCustomIconUrl(null);
      setFrequency('daily');
      setTargetDaysPerWeek(7);
      setStartDate(getTodayDateString());
    }
  }, [habitToEdit, isHabitFormOpen]);

  if (!isHabitFormOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalColor = isCustomColor ? customColorHex : color;
    const finalCustomColorHex = isCustomColor || color.startsWith('#') ? customColorHex : undefined;
    const finalIcon = customIconUrl ? 'custom' : icon;
    const finalStartDate = startDate || getTodayDateString();

    if (habitToEdit) {
      updateHabit(habitToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        color: finalColor,
        customColorHex: finalCustomColorHex,
        icon: finalIcon,
        customIconUrl: customIconUrl || undefined,
        frequency,
        startDate: finalStartDate,
        targetDaysPerWeek: frequency === 'daily' ? 7 : frequency === 'weekdays' ? 5 : targetDaysPerWeek,
      });
    } else {
      addHabit({
        title: title.trim(),
        description: description.trim(),
        category,
        color: finalColor,
        customColorHex: finalCustomColorHex,
        icon: finalIcon,
        customIconUrl: customIconUrl || undefined,
        frequency,
        startDate: finalStartDate,
        targetDaysPerWeek: frequency === 'daily' ? 7 : frequency === 'weekdays' ? 5 : targetDaysPerWeek,
        completedDates: [],
      });
    }

    closeHabitForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeHabitForm}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold text-slate-900">
                {habitToEdit ? 'Edit Habit' : 'Create New Habit & Streak'}
              </h2>
              <p className="text-xs text-slate-500">
                Set up your habit commitment and track daily streak circles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeHabitForm}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Habit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Programming Practice, LeetCode Problem, Read Docs"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Motivation or Details <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Solve at least 1 problem or code 45 minutes every single day."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Category
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Custom Category</span>
                </button>
              )}
            </div>

            {/* Inline Custom Category Creator */}
            {isAddingCategory && (
              <div className="mb-2.5 p-2 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategorySubmit();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                    }
                  }}
                  placeholder="New category name (e.g. Languages, Meditation)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategorySubmit()}
                  disabled={!newCategoryName.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewCategoryName('');
                    setIsAddingCategory(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Icon Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Color Theme */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Color Theme
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {isCustomColor ? customColorHex.toUpperCase() : color}
                </span>
              </div>

              {/* Preset Color Swatches + Custom Color Swatch */}
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                {availableColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColor(c.id);
                      setIsCustomColor(false);
                    }}
                    className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                      !isCustomColor && color === c.id
                        ? `ring-2 ring-offset-2 ${c.ring} scale-110 shadow-xs`
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {!isCustomColor && color === c.id && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                ))}

                {/* Custom Color Swatch with HTML5 color picker */}
                <label
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer overflow-hidden border border-slate-300 shadow-xs ${
                    isCustomColor ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: customColorHex }}
                  title="Pick custom color"
                >
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => {
                      setCustomColorHex(e.target.value);
                      setIsCustomColor(true);
                      setColor(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {isCustomColor ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-xs" />
                  ) : (
                    <Pipette className="w-3 h-3 text-white drop-shadow-xs" />
                  )}
                </label>
              </div>

              {/* Custom Color Hex Input */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-slate-400 font-bold font-mono">#</span>
                <input
                  type="text"
                  maxLength={7}
                  value={customColorHex.replace(/^#/, '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                    const fullHex = `#${raw}`;
                    setCustomColorHex(fullHex);
                    if (raw.length === 6 || raw.length === 3) {
                      setIsCustomColor(true);
                      setColor(fullHex);
                    }
                  }}
                  placeholder="HEX (e.g. FF4500)"
                  className="flex-1 bg-transparent text-xs font-mono font-medium focus:outline-none text-slate-800 uppercase"
                />
                <div
                  className="w-4 h-4 rounded-md border border-slate-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: customColorHex }}
                />
              </div>
            </div>

            {/* Icon */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Icon
                </label>
                <label className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Upload Icon</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />
                </label>
              </div>

              {/* Uploaded Custom Icon Preview */}
              {customIconUrl ? (
                <div className="flex items-center justify-between p-2 bg-blue-50/80 border border-blue-200 rounded-xl mb-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center p-1 bg-white border border-blue-200 shadow-2xs shrink-0"
                      style={isCustomColor ? { borderColor: `${customColorHex}40` } : undefined}
                    >
                      <img
                        src={customIconUrl}
                        alt="Custom Icon"
                        className="w-6 h-6 object-contain rounded-xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">Custom Uploaded Icon</p>
                      <p className="text-[10px] text-slate-500">Active icon</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomIconUrl(null);
                      setIcon('Flame');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                    title="Remove custom icon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null}

              {/* Preset Icons Selection */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {availableIcons.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = !customIconUrl && icon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => {
                        setIcon(ic.id);
                        setCustomIconUrl(null);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                      title={ic.label}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Frequency Commitment */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Target Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  frequency === 'daily'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Daily</div>
                <div className="text-[10px] text-slate-500">7 days / week</div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('weekdays')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  frequency === 'weekdays'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Weekdays</div>
                <div className="text-[10px] text-slate-500">Mon – Fri</div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('custom')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  frequency === 'custom'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-semibold ring-1 ring-blue-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">Custom</div>
                <div className="text-[10px] text-slate-500">{targetDaysPerWeek} days / wk</div>
              </button>
            </div>

            {frequency === 'custom' && (
              <div className="mt-3 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium">Days per week:</span>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={targetDaysPerWeek}
                  onChange={(e) => setTargetDaysPerWeek(Number(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-blue-600 font-tabular w-6 text-center">
                  {targetDaysPerWeek}
                </span>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Habit Start Date</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Tracks starting day
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 bg-white"
              />

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStartDate(getTodayDateString())}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    startDate === getTodayDateString()
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setStartDate(addDays(getTodayDateString(), -1))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    startDate === addDays(getTodayDateString(), -1)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>

                <button
                  type="button"
                  onClick={() => setStartDate(addDays(getTodayDateString(), -7))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    startDate === addDays(getTodayDateString(), -7)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  1 Wk Ago
                </button>

                <button
                  type="button"
                  onClick={() => setStartDate(addDays(getTodayDateString(), -30))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    startDate === addDays(getTodayDateString(), -30)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  30d Ago
                </button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeHabitForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{habitToEdit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
