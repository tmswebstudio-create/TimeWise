import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';
import { TimeWiseMark } from './TimeWiseLogo';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA on device home screen
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950">App Installed</h4>
            <p className="text-[11px] text-emerald-700">
              TimeWise is running as an installed application on your device.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If beforeinstallprompt hasn't fired yet (e.g. desktop safari/firefox or already prompt deferred)
      setShowIOSGuide(true);
    }
  };

  // Render Card variant (used in Settings)
  if (variant === 'card') {
    return (
      <>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl shadow-2xs ${className}`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Install TimeWise Mobile App</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">PWA</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Install as a standalone app on your phone, tablet, or desktop for fast offline access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
          </button>
        </div>

        {/* Guided Modal for iOS / Browser Manual installation */}
        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Render Sidebar variant
  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 transition-colors cursor-pointer group ${className}`}
          title="Install TimeWise as a mobile or desktop app"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
            <Download className="w-4 h-4" />
          </div>
          <span className="truncate">Install App</span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Default: Header variant (responsive button)
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${className}`}
        title="Install TimeWise App on your device"
        aria-label="Install App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Install</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

// Reusable iOS / Manual Install Guide Modal
const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <TimeWiseMark className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 id="pwa-install-title" className="font-heading font-bold text-sm text-slate-900">Install TimeWise</h3>
              <p className="text-[11px] text-slate-500">Add to your Home Screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
              1
            </div>
            <p className="pt-0.5">
              Tap the <span className="font-semibold text-slate-900 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline text-blue-600" /> Share</span> button in the Safari toolbar or browser menu.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
              2
            </div>
            <p className="pt-0.5">
              Scroll down and tap <span className="font-semibold text-slate-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-blue-600" /> Add to Home Screen</span>.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
              3
            </div>
            <p className="pt-0.5">
              Tap <span className="font-semibold text-slate-900">Add</span> in the top-right corner to launch TimeWise full-screen like a native app.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
