import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers } from 'lucide-react';
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
    } else {
      setTitle('');
      setCode('01');
      setOrder(1);
      setDescription('');
      setStatus('not_started');
      setProgress(0);
      setNotes('');
      setGoalId(preselectedGoalId || selectedGoalId || goals[0]?.id || '');
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
