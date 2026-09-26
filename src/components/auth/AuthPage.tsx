import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TimeWiseLogo, TimeWiseMark } from '../common/TimeWiseLogo';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Compass,
  Check,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Demo interactive state in hero showcase
  const [demoChecked, setDemoChecked] = useState<[boolean, boolean, boolean]>([true, false, false]);
  const [demoSeconds, setDemoSeconds] = useState(1425); // 23m 45s

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDemoTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Password strength assessment
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Very Weak', color: 'bg-rose-400' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      // error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setLocalError(null);
    clearAuthError();
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
    } catch (err) {
      // Handled
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Quick fill demo user for easy grading or inspection
  const fillDemoCredentials = () => {
    setEmail('demo.learner@timewise.io');
    setPassword('demo123456');
    setLocalError(null);
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Modern Ambient Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-[35%] left-[30%] w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none animate-float-slow" />

      {/* Grid Pattern Texture Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TimeWiseMark className="w-8 h-8 text-blue-500" />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-base tracking-tight text-white">TimeWise</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Learning OS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/80 transition-all hover:border-slate-600"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Try Instant Guest Mode</span>
          </button>
        </div>
      </header>

      {/* Main Content: Split Desktop Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Visual Showcase & Interactive Live Simulation (Desktop) */}
          <div className="lg:col-span-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header copy */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Intentional Study & Execution OS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white leading-[1.15]">
                Master your time.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
                  Conquer the learning curve.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                Stop juggling scattered notes and fragmented tabs. Plan structured goals, block study sessions, and track every video lecture to mastery.
              </p>
            </div>

            {/* Interactive Live Preview Card */}
            <div className="relative rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 shadow-2xl space-y-5 animate-float-slow max-w-lg">
              {/* Card Header with Live Timer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-200">Active Focus Session</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 text-xs font-tabular text-blue-400 font-bold border border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDemoTimer(demoSeconds)}</span>
                </div>
              </div>

              {/* Task Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Goal: Distributed Systems</span>
                  <span className="font-tabular font-medium text-slate-300">Module 03</span>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Raft Consensus Algorithm & Leader Election
                </h4>
              </div>

              {/* Interactive Demo Subtasks */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Interactive Checkpoints
                </span>
                {[
                  'Review term numbers and election timeout logic',
                  'Simulate split vote network partition scenarios',
                  'Implement log replication heartbeat in Go',
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = [...demoChecked] as [boolean, boolean, boolean];
                      next[idx] = !next[idx];
                      setDemoChecked(next);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors ${
                      demoChecked[idx]
                        ? 'bg-blue-950/40 text-slate-400 line-through'
                        : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        demoChecked[idx]
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {demoChecked[idx] && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>

              {/* Live Mini Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
                <div className="p-2 rounded-lg bg-slate-800/40">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-semibold">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>14 Days</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Study Streak</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/40">
                  <div className="text-[11px] text-blue-400 font-semibold font-tabular">
                    3h 15m
                  </div>
                  <span className="text-[10px] text-slate-500">Today Focused</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/40">
                  <div className="text-[11px] text-emerald-400 font-semibold font-tabular">
                    92%
                  </div>
                  <span className="text-[10px] text-slate-500">Target Pace</span>
                </div>
              </div>
            </div>

            {/* Quiet Feature Indicators */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Google Firebase Sync</span>
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>Milestone Hierarchies</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>Custom YouTube Timestamp Tracking</span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span>100% Private</span>
            </div>
          </div>

          {/* Right Column: Modern Sign In / Sign Up Form Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl border border-slate-200/80 text-slate-900 relative">
              
              {/* Card Top / Header */}
              <div className="space-y-2 text-center pb-2">
                <div className="inline-flex p-2.5 rounded-2xl bg-blue-50 text-blue-600 mb-1">
                  <TimeWiseMark className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="text-xs text-slate-500">
                  {mode === 'signin'
                    ? 'Sign in to access your synchronized study OS and goals.'
                    : 'Get started in seconds. No credit card required.'}
                </p>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl my-5 relative">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="block text-xs font-medium text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Fill Demo Login
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator on sign up */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="pt-1.5 space-y-1 animate-in fade-in duration-150">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Password strength: <strong className="text-slate-700">{strength.label}</strong></span>
                        <span>Min. 6 characters</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In to TimeWise' : 'Create My Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  <span className="bg-white px-3">Or explore instantly</span>
                </div>
              </div>

              {/* Prominent Instant Guest Login Card */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isGuestLoading || isSubmitting}
                className="w-full p-3.5 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 hover:from-blue-100/70 hover:to-indigo-50 hover:border-blue-400 transition-all text-left flex items-center justify-between group shadow-xs hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Continue as Guest</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 font-semibold">
                        Instant
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      No password required · Sandbox & Cloud ready
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  {isGuestLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
              </button>

              {/* Bottom Security Guarantee */}
              <p className="text-center text-[10px] text-slate-400 mt-5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by Firebase Auth & Google Cloud Firestore</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400">
        <span>TimeWise Learning OS · Focus, Structure & Real Time Mastery</span>
      </footer>
    </div>
  );
};
