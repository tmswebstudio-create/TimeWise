import { getTodayDateString, addDays } from './timeUtils';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  completionRateLast30Days: number;
  streakStatus: 'hot' | 'warm' | 'cold' | 'none';
}

export interface DayCircleItem {
  date: string; // YYYY-MM-DD
  dayOfWeekShort: string; // 'Mon', 'Tue'
  dayLetter: string; // 'M', 'T', 'W'
  dayNumber: number; // 1 - 31
  streakDayIndex?: number; // 1, 2, 3... (Day 1 of streak, Day 2, etc.)
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  isCompleted: boolean;
  isStreakStartDate?: boolean; // true if this date is the habit's startDate
}

/**
 * Calculates current streak, longest streak, and stats for a set of completed dates.
 * If habitStartDate is provided, discards any dates strictly before habitStartDate.
 */
export function calculateHabitStreak(
  completedDates: string[] = [],
  todayStr: string = getTodayDateString(),
  habitStartDate?: string
): StreakInfo {
  const validDates = habitStartDate
    ? completedDates.filter((d) => d >= habitStartDate)
    : completedDates;

  if (!validDates || validDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      isCompletedToday: false,
      isCompletedYesterday: false,
      completionRateLast30Days: 0,
      streakStatus: 'none',
    };
  }

  const completedSet = new Set(validDates);
  const totalCompleted = completedSet.size;

  const yesterdayStr = addDays(todayStr, -1);
  const isCompletedToday = completedSet.has(todayStr);
  const isCompletedYesterday = completedSet.has(yesterdayStr);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = isCompletedToday ? todayStr : yesterdayStr;

  // If neither today nor yesterday is completed, current streak is 0
  if (isCompletedToday || isCompletedYesterday) {
    while (completedSet.has(checkDate) && (!habitStartDate || checkDate >= habitStartDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  }

  // Calculate longest streak across all time
  const sortedDates = Array.from(completedSet)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDateStr: string | null = null;

  for (const dateStr of sortedDates) {
    if (!prevDateStr) {
      runningStreak = 1;
    } else {
      const expectedNext = addDays(prevDateStr, 1);
      if (dateStr === expectedNext) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDateStr = dateStr;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Calculate completion rate in the last 30 days
  let countLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = addDays(todayStr, -i);
    if (habitStartDate && dStr < habitStartDate) continue;
    if (completedSet.has(dStr)) {
      countLast30++;
    }
  }
  const completionRateLast30Days = Math.round((countLast30 / 30) * 100);

  // Status badge
  let streakStatus: 'hot' | 'warm' | 'cold' | 'none' = 'none';
  if (currentStreak >= 7) streakStatus = 'hot';
  else if (currentStreak >= 3) streakStatus = 'warm';
  else if (currentStreak >= 1) streakStatus = 'cold';

  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    isCompletedToday,
    isCompletedYesterday,
    completionRateLast30Days,
    streakStatus,
  };
}

/**
 * Generates an array of day items for a habit.
 * Starts strictly from habitStartDate when provided, ensuring NO DATES before habitStartDate are added.
 */
export function getRecentDayCircles(
  daysCount: number = 7,
  completedDates: string[] = [],
  todayStr: string = getTodayDateString(),
  habitStartDate?: string
): DayCircleItem[] {
  const completedSet = new Set(completedDates);
  const items: DayCircleItem[] = [];

  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const todayDateObj = new Date(tYear, tMonth - 1, tDay);

  if (habitStartDate) {
    const [sy, sm, sd] = habitStartDate.split('-').map(Number);
    const startDateObj = new Date(sy, sm - 1, sd);
    const diffDays = Math.round((todayDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

    // If the habit started recently (within daysCount days or in the future),
    // start strictly from habitStartDate!
    let startDStr = habitStartDate;
    if (diffDays >= daysCount) {
      // Habit has been running longer than daysCount days:
      // Show the active cycle containing today, aligned to habitStartDate
      const cycleIndex = Math.floor(diffDays / daysCount);
      startDStr = addDays(habitStartDate, cycleIndex * daysCount);
    }

    for (let i = 0; i < daysCount; i++) {
      const dStr = addDays(startDStr, i);
      // Strictly ignore any date before habitStartDate
      if (dStr < habitStartDate) continue;

      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLetter = dayName.charAt(0);
      const dayNumber = dateObj.getDate();

      const isToday = dStr === todayStr;
      const isFuture = dateObj.getTime() > todayDateObj.getTime();
      const isPast = dateObj.getTime() < todayDateObj.getTime();
      const isCompleted = completedSet.has(dStr);

      const streakDayIndex =
        Math.round((dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      items.push({
        date: dStr,
        dayOfWeekShort: dayName,
        dayLetter,
        dayNumber,
        streakDayIndex,
        isToday,
        isFuture,
        isPast,
        isCompleted,
        isStreakStartDate: dStr === habitStartDate,
      });
    }

    return items;
  }

  // Fallback if no habitStartDate is passed
  for (let i = daysCount - 1; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayLetter = dayName.charAt(0);
    const dayNumber = dateObj.getDate();

    const isToday = dStr === todayStr;
    const isFuture = dateObj.getTime() > todayDateObj.getTime();
    const isPast = dateObj.getTime() < todayDateObj.getTime();
    const isCompleted = completedSet.has(dStr);

    items.push({
      date: dStr,
      dayOfWeekShort: dayName,
      dayLetter,
      dayNumber,
      isToday,
      isFuture,
      isPast,
      isCompleted,
    });
  }

  return items;
}

/**
 * Generates full week days for a habit.
 * If habitStartDate is provided, ensures circles start on habitStartDate and NO PREVIOUS DATE is added.
 */
export function getWeekDayCircles(
  offsetWeeks: number = 0,
  completedDates: string[] = [],
  todayStr: string = getTodayDateString(),
  habitStartDate?: string
): { days: DayCircleItem[]; weekLabel: string; canGoPrev?: boolean } {
  const completedSet = new Set(completedDates);
  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const todayDateObj = new Date(tYear, tMonth - 1, tDay);

  let startDateObj: Date | null = null;
  if (habitStartDate) {
    const [sy, sm, sd] = habitStartDate.split('-').map(Number);
    startDateObj = new Date(sy, sm - 1, sd);
  }

  // When habitStartDate is provided:
  // For this specific streak, start the Streak Circles dates from the date the specific streak started!
  // Don't add any previous date.
  if (habitStartDate && startDateObj) {
    const diffDays = Math.round((todayDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    // Number of 7-day cycles from habitStartDate to today
    const currentCycleIndex = Math.max(0, Math.floor(Math.max(0, diffDays) / 7));
    // Active cycle with offsetWeeks
    const cycleIndex = Math.max(0, currentCycleIndex + offsetWeeks);
    const startDStr = addDays(habitStartDate, cycleIndex * 7);

    const days: DayCircleItem[] = [];
    for (let i = 0; i < 7; i++) {
      const dStr = addDays(startDStr, i);
      // Strictly do not add any previous date
      if (dStr < habitStartDate) continue;

      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLetter = dayName.charAt(0);
      const dayNumber = dateObj.getDate();

      const isToday = dStr === todayStr;
      const isFuture = dateObj.getTime() > todayDateObj.getTime();
      const isPast = dateObj.getTime() < todayDateObj.getTime();
      const isCompleted = completedSet.has(dStr);

      const streakDayIndex =
        Math.round((dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      days.push({
        date: dStr,
        dayOfWeekShort: dayName,
        dayLetter,
        dayNumber,
        streakDayIndex,
        isToday,
        isFuture,
        isPast,
        isCompleted,
        isStreakStartDate: dStr === habitStartDate,
      });
    }

    const firstDay = days[0];
    const lastDay = days[days.length - 1];
    let weekLabel = 'Streak Period';
    if (firstDay && lastDay) {
      const [fy, fm, fd] = firstDay.date.split('-').map(Number);
      const [ly, lm, ld] = lastDay.date.split('-').map(Number);
      const fObj = new Date(fy, fm - 1, fd);
      const lObj = new Date(ly, lm - 1, ld);
      const fMonth = fObj.toLocaleDateString('en-US', { month: 'short' });
      const lMonth = lObj.toLocaleDateString('en-US', { month: 'short' });
      const dateRangeText =
        fMonth === lMonth
          ? `${fMonth} ${fObj.getDate()} – ${lObj.getDate()}, ${fObj.getFullYear()}`
          : `${fMonth} ${fObj.getDate()} – ${lMonth} ${lObj.getDate()}, ${fObj.getFullYear()}`;
      weekLabel = `${dateRangeText} (Days ${cycleIndex * 7 + 1}–${cycleIndex * 7 + 7})`;
    }

    return {
      days,
      weekLabel,
      canGoPrev: cycleIndex > 0, // Cannot navigate to dates before habitStartDate
    };
  }

  // Fallback Monday-Sunday calendar week
  const baseDate = new Date(tYear, tMonth - 1, tDay);
  baseDate.setDate(baseDate.getDate() + offsetWeeks * 7);

  const dayOfWeek = baseDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const days: DayCircleItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${dayNum}`;

    const isToday = dStr === todayStr;
    const isFuture = dStr > todayStr;
    const isPast = dStr < todayStr;
    const isCompleted = completedSet.has(dStr);

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayLetter = dayName.charAt(0);

    days.push({
      date: dStr,
      dayOfWeekShort: dayName,
      dayLetter,
      dayNumber: d.getDate(),
      isToday,
      isFuture,
      isPast,
      isCompleted,
    });
  }

  const startMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });

  const weekLabel =
    startMonth === endMonth
      ? `${startMonth} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`
      : `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${monday.getFullYear()}`;

  return { days, weekLabel };
}

export interface Window30Result {
  days: DayCircleItem[];
  rangeLabel: string;
  cycleLabel?: string;
  startDate: string;
  endDate: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  completedCount: number;
}

/**
 * Generates an array of 30 days for a habit.
 * If habitStartDate is provided, it starts precisely from habitStartDate (Days 1–30, Days 31–60, etc.)
 * Otherwise, it falls back to a sliding window relative to today.
 */
export function get30DayWindowCircles(
  offsetWindows: number = 0,
  completedDates: string[] = [],
  todayStr: string = getTodayDateString(),
  habitStartDate?: string
): Window30Result {
  const completedSet = new Set(completedDates);
  const items: DayCircleItem[] = [];

  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const todayDateObj = new Date(tYear, tMonth - 1, tDay);

  let startDStr: string;
  let endDStr: string;
  let canGoPrev = true;
  let canGoNext = true;
  let cycleLabel = '';

  if (habitStartDate) {
    // Offset represents 30-day challenge cycles from the start date (Cycle 0: Days 1-30, Cycle 1: Days 31-60, etc.)
    const cycleIndex = Math.max(0, offsetWindows);
    const shiftDays = cycleIndex * 30;
    startDStr = addDays(habitStartDate, shiftDays);
    endDStr = addDays(startDStr, 29);

    canGoPrev = cycleIndex > 0;
    const [ey, em, ed] = endDStr.split('-').map(Number);
    const endDateObj = new Date(ey, em - 1, ed);
    // Allow navigating up to 1 cycle ahead of today
    canGoNext = endDateObj.getTime() < todayDateObj.getTime() + 45 * 24 * 60 * 60 * 1000;

    const startDayNum = cycleIndex * 30 + 1;
    const endDayNum = (cycleIndex + 1) * 30;
    cycleLabel = `Days ${startDayNum}–${endDayNum}`;
  } else {
    // Sliding window ending on shifted today
    const windowShift = offsetWindows * 30;
    endDStr = addDays(todayStr, windowShift);
    startDStr = addDays(endDStr, -29);
    canGoPrev = true;
    canGoNext = offsetWindows < 0;
  }

  let completedCount = 0;

  for (let i = 0; i < 30; i++) {
    const dStr = addDays(startDStr, i);
    // Strictly do not add any date before habitStartDate
    if (habitStartDate && dStr < habitStartDate) continue;

    const [y, m, d] = dStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayLetter = dayName.charAt(0);
    const dayNumber = dateObj.getDate();

    const isToday = dStr === todayStr;
    const isFuture = dateObj.getTime() > todayDateObj.getTime();
    const isPast = dateObj.getTime() < todayDateObj.getTime();
    const isCompleted = completedSet.has(dStr);

    if (isCompleted) {
      completedCount++;
    }

    const streakDayIndex = habitStartDate
      ? Math.round(
          (dateObj.getTime() -
            new Date(
              Number(habitStartDate.split('-')[0]),
              Number(habitStartDate.split('-')[1]) - 1,
              Number(habitStartDate.split('-')[2])
            ).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : undefined;

    items.push({
      date: dStr,
      dayOfWeekShort: dayName,
      dayLetter,
      dayNumber,
      streakDayIndex,
      isToday,
      isFuture,
      isPast,
      isCompleted,
      isStreakStartDate: habitStartDate ? dStr === habitStartDate : undefined,
    });
  }

  const [sy, sm, sd] = startDStr.split('-').map(Number);
  const startDateObj = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endDStr.split('-').map(Number);
  const endDateObj = new Date(ey, em - 1, ed);

  const startMonth = startDateObj.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDateObj.toLocaleDateString('en-US', { month: 'short' });

  const formattedDateRange =
    startDateObj.getFullYear() === endDateObj.getFullYear()
      ? `${startMonth} ${startDateObj.getDate()} – ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()}`
      : `${startMonth} ${startDateObj.getDate()}, ${startDateObj.getFullYear()} – ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()}`;

  const rangeLabel = cycleLabel ? `${formattedDateRange} (${cycleLabel})` : formattedDateRange;

  return {
    days: items,
    rangeLabel,
    cycleLabel,
    startDate: startDStr,
    endDate: endDStr,
    canGoNext,
    canGoPrev,
    completedCount,
  };
}
