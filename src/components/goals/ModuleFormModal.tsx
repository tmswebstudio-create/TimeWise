import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, Upload, Image } from 'lucide-react';
import { Module, ModuleStatus } from '../../types';

export const ModuleFormModal: React.FC = () => {
  const {
    isModuleFormOpen,
    moduleToEdit,
    closeModuleForm,
    addModule,
    updateModule,
    goals,
    preselectedGoalId,
    selectedGoalId,
  } = useApp();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('01');
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ModuleStatus>('not_started');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [goalId, setGoalId] = useState(preselectedGoalId || selectedGoalId || goals[0]?.id || '');
  const [icon, setIcon] = useState('💻');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Limit size to 2MB for Firestore friendliness
      setUploadError('Image size exceeds 2MB limit.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageUrl(base64String);
      setIcon(''); // Clear icon preset when a custom image is uploaded
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (moduleToEdit) {
      setTitle(moduleToEdit.title);
      setCode(moduleToEdit.code);
      setOrder(moduleToEdit.order);
      setDescription(moduleToEdit.description);
      setStatus(moduleToEdit.status);
      setProgress(moduleToEdit.progress);
      setNotes(moduleToEdit.notes || '');
      setGoalId(moduleToEdit.goalId);
      setIcon(moduleToEdit.icon || '💻');
      setImageUrl(moduleToEdit.imageUrl || '');
    } else {
      setTitle('');
      setCode('01');
      setOrder(1);
      setDescription('');
      setStatus('not_started');
      setProgress(0);
      setNotes('');
      setGoalId(preselectedGoalId || selectedGoalId || goals[0]?.id || '');
      setIcon('💻');
      setImageUrl('');
    }
  }, [moduleToEdit, isModuleFormOpen, preselectedGoalId, selectedGoalId, goals]);

  if (!isModuleFormOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goalId) return;

    if (moduleToEdit) {
      updateModule(moduleToEdit.id, {
        title: title.trim(),
        code: code.trim() || '01',
        order: Number(order) || 1,
        description: description.trim(),
        status,
        progress: Number(progress) || 0,
        notes: notes.trim(),
        goalId,
        icon,
        imageUrl: imageUrl.trim() || undefined,
      });
    } else {
      addModule({
        goalId,
        title: title.trim(),
        code: code.trim() || '01',
        order: Number(order) || 1,
        description: description.trim(),
        status,
        progress: Number(progress) || 0,
        notes: notes.trim(),
        icon,
        imageUrl: imageUrl.trim() || undefined,
      });
    }

    closeModuleForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-heading font-semibold text-slate-900">
            {moduleToEdit ? 'Edit Curriculum Module' : 'Add Curriculum Module'}
          </h2>
          <button
            onClick={closeModuleForm}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Goal <span className="text-red-500">*</span>
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="01"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Order
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-tabular text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ModuleStatus)}
                className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Responsive Design & Flexbox"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of topics covered in this module..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Module Icon / Image Option
            </label>
            <div className="space-y-2">
              {/* Presets Grid */}
              <div className="flex flex-wrap gap-2">
                {['💻', '📚', '🧠', '🔬', '🎨', '⚙️', '🌐', '📊', '🔧', '🚀', '✏️', '🏆'].map((emojiPreset) => (
                  <button
                    key={emojiPreset}
                    type="button"
                    onClick={() => {
                      setIcon(emojiPreset);
                      setImageUrl(''); // Clear custom URL if selecting an emoji preset
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all ${
                      icon === emojiPreset && !imageUrl
                        ? 'bg-blue-50 border-blue-500 scale-105 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {emojiPreset}
                  </button>
                ))}
              </div>

              {/* Upload Image Option */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-blue-50/60 flex items-center justify-center shrink-0 border border-blue-200/50">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Image className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <h5 className="text-xs font-semibold text-slate-800">
                      {imageUrl && imageUrl.startsWith('data:') ? 'Uploaded Image Active' : 'Upload Custom Icon/Image'}
                    </h5>
                    <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP (Max 2MB)</p>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <p className="text-[10px] text-red-600 font-medium">{uploadError}</p>
              )}

              {/* Custom Image URL or Custom Emoji */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">
                    Custom Emoji Icon
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={icon}
                    onChange={(e) => {
                      setIcon(e.target.value);
                      setImageUrl('');
                    }}
                    placeholder="e.g. 🎯"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">
                    Or Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 truncate"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Progress ({progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10) || 0)}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModuleForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs transition-colors"
            >
              {moduleToEdit ? 'Save Changes' : 'Add Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
