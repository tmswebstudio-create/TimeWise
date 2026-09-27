import { Task } from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDurationMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getTaskDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
  let diff = (endH * 60 + endM) - (startH * 60 + startM);
  if (diff < 0) {
    diff += 24 * 60;
  }
  return diff;
}

export function formatTaskScheduledDuration(startTime: string, endTime: string): string {
  const mins = getTaskDurationMinutes(startTime, endTime);
  return formatDurationMinutes(mins);
}

export function formatSecondsToTime(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface TaskTimingInfo {
  state: 'before_start' | 'during_task' | 'near_end' | 'ended' | 'completed';
  label: string;
  elapsedPercent: number;
  remainingSeconds: number;
  isToday: boolean;
}

export function calculateTaskTiming(task: Task, now: Date = new Date()): TaskTimingInfo {
  // If task is completed
  if (task.status === 'completed') {
    let completedLabel = 'Completed';
    if (task.completedAt) {
      try {
        const compDate = new Date(task.completedAt);
        if (!isNaN(compDate.getTime())) {
          const compHours = compDate.getHours();
          const compMinutes = String(compDate.getMinutes()).padStart(2, '0');
          const ampm = compHours >= 12 ? 'PM' : 'AM';
          const h12 = compHours % 12 || 12;
          completedLabel = `Completed at ${h12}:${compMinutes} ${ampm}`;
        }
      } catch {
        completedLabel = 'Completed';
      }
    }
    return {
      state: 'completed',
      label: completedLabel,
      elapsedPercent: 100,
      remainingSeconds: 0,
      isToday: task.date === getTodayDateString(),
    };
  }

  const [year, month, day] = task.date.split('-').map(Number);
  const [startH, startM] = (task.startTime || '09:00').split(':').map(Number);
  const [endH, endM] = (task.endTime || '10:00').split(':').map(Number);

  const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
  const endDate = new Date(year, month - 1, day, endH, endM, 0, 0);

  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const totalDurationMs = Math.max(1000, endMs - startMs);

  const isToday = task.date === getTodayDateString();

  if (nowMs < startMs) {
    const diffMs = startMs - nowMs;
    const diffMinutes = Math.ceil(diffMs / 60000);
    const remainingSec = Math.floor(diffMs / 1000);

    let label = '';
    if (diffMinutes < 60) {
      label = `Starts in ${diffMinutes} min`;
    } else if (diffMinutes < 1440 && isToday) {
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      label = m > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${h}h`;
    } else {
      label = `Starts at ${formatTime12h(task.startTime)}`;
    }

    return {
      state: 'before_start',
      label,
      elapsedPercent: 0,
      remainingSeconds: remainingSec,
      isToday,
    };
  }

  if (nowMs >= startMs && nowMs <= endMs) {
    const remainingMs = endMs - nowMs;
    const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
    const hh = Math.floor(remainingSec / 3600);
    const mm = Math.floor((remainingSec % 3600) / 60);
    const ss = remainingSec % 60;
    const formatted = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} remaining`;

    const elapsed = Math.min(100, Math.max(0, ((nowMs - startMs) / totalDurationMs) * 100));
    const isNearEnd = remainingSec <= 600; // 10 minutes or less

    return {
      state: isNearEnd ? 'near_end' : 'during_task',
      label: formatted,
      elapsedPercent: elapsed,
      remainingSeconds: remainingSec,
      isToday,
    };
  }

  // nowMs > endMs
  return {
    state: 'ended',
    label: 'Time ended',
    elapsedPercent: 100,
    remainingSeconds: 0,
    isToday,
  };
}

export function getGreeting(date: Date = new Date()): string {
  const hours = date.getHours();
  if (hours < 12) return 'Good morning';
  if (hours < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatCurrentDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

export function formatFriendlyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): { dayName: string; dayNum: number; monthName: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return {
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
    monthName: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

export function getRelativeDayLabel(dateStr: string, todayStr: string = getTodayDateString()): string {
  if (dateStr === todayStr) return 'Today';
  const [y1, m1, d1] = dateStr.split('-').map(Number);
  const [y2, m2, d2] = todayStr.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1).getTime();
  const dt2 = new Date(y2, m2 - 1, d2).getTime();
  const diffDays = Math.round((dt1 - dt2) / (1000 * 60 * 60 * 24));
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  return `In ${diffDays}d`;
}

