import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Globe,
  Clock,
  User,
  RotateCcw,
  Download,
  CheckCircle2,
  Sliders,
  Cloud,
  Trash2,
  LogIn,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    clearAllUserData,
    tasks,
    goals,
    modules,
    resources,
    sessions,
  } = useApp();

  const { user, isGuest, signOutUser, openAuthModal } = useAuth();

  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Dhaka');
  const [dailyHours, setDailyHours] = useState(
    Math.round((settings.dailyTargetMinutes || 180) / 60) || 3
  );
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(
    settings.timeFormat || '12h'
  );
  const [name, setName] = useState(settings.name || user?.displayName || 'Alex Rivera');

  useEffect(() => {
    if (settings.name) setName(settings.name);
    if (settings.timezone) setTimezone(settings.timezone);
    if (settings.dailyTargetMinutes) setDailyHours(Math.round(settings.dailyTargetMinutes / 60));
    if (settings.timeFormat) setTimeFormat(settings.timeFormat);
  }, [settings]);

  const timezones = [
    { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
    { value: 'America/New_York', label: 'America/New York (EDT/EST, GMT-4/5)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (PDT/PST, GMT-7/8)' },
    { value: 'America/Chicago', label: 'America/Chicago (CDT/CST, GMT-5/6)' },
    { value: 'Europe/London', label: 'Europe/London (BST/GMT, GMT+1/0)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CEST/CET, GMT+2/1)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, GMT+9)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, GMT+8)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, GMT+5:30)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST, GMT+10)' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      timezone,
      dailyTargetMinutes: dailyHours * 60,
      timeFormat,
      name,
    });
  };

  const handleExportJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      user: {
        uid: user?.uid,
        email: user?.email,
        name,
      },
      tasks,
      goals,
      modules,
      resources,
      sessions,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timewise-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
              Account & Engine Preferences
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 tracking-tight">
              System Settings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your Firebase Cloud account, timezone, and daily focus target.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <Cloud className="w-3.5 h-3.5" />
              <span>Firebase: timewise-16f3e</span>
            </span>
          </div>
        </div>
      </div>

      {/* Account / Auth Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-heading font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Firebase Authentication & Cloud Storage</span>
        </h3>

        {user ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  {user.displayName || name || 'Learner'}
                </span>
                {isGuest ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-semibold">
                    Guest Mode
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified User
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.email || 'Temporary guest session'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Data is isolated to your UID: <code className="font-mono text-[10px] bg-slate-200 px-1 py-0.5 rounded">{user.uid}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={signOutUser}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-blue-950">You are currently browsing offline</h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Sign in with your Email & Password to automatically sync your tasks and goals across devices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
        {/* Profile */}
        <div>
          <h3 className="text-sm font-heading font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Profile Information</span>
          </h3>
          <div className="max-w-md">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
            />
          </div>
        </div>

        {/* Timezone & Timing System Configuration */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-heading font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Timezone & Time Engine</span>
          </h3>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Active Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                TimeWise computes live task countdowns using your browser clock and timezone configuration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Daily Learning Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Time Display Format
                </label>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
                >
                  <option value="12h">12-hour (10:00 AM)</option>
                  <option value="24h">24-hour (10:00)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Save */}
        <div className="pt-2 flex justify-start">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Data Management & Starter Kit Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-heading font-semibold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-600" />
          <span>Data Storage & Cloud Sync Controls</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          TimeWise maintains your data directly in your isolated Firebase Firestore database. All new user accounts begin with a 100% clean, blank slate. If you would like sample templates, you can optionally load the Starter Kit or reset anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Load sample starter kit with template courses and tasks?')) {
                resetToDemoData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Starter Kit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all tasks, goals, modules, and sessions to a completely clean slate?')) {
                clearAllUserData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data (Clean Slate)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
