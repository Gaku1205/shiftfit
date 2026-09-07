import {
  compareTimes,
  durationHours,
  enumerateDatesInMonth,
  getDayOfWeek,
} from "./date";
import type {
  AvailabilitySlot,
  ClassScheduleState,
  DayOfWeek,
  ShiftGoal,
} from "./types";

/** バイト可能とみなす時間帯の上下限。18歳未満の深夜労働制限などの法規制はMVPスコープ外。 */
const WORKABLE_START = "08:00";
const WORKABLE_END = "23:00";

interface TimeWindow {
  startTime: string;
  endTime: string;
}

function getOccupiedWindows(
  classSchedule: ClassScheduleState,
  date: string,
  dayOfWeek: DayOfWeek,
): TimeWindow[] {
  const windows: TimeWindow[] = [];
  for (const entry of classSchedule.classes) {
    if (entry.dayOfWeek !== dayOfWeek) continue;
    if (entry.skipDates?.includes(date)) continue;
    windows.push({ startTime: entry.startTime, endTime: entry.endTime });
  }
  for (const oneOff of classSchedule.oneOffClasses) {
    if (oneOff.date !== date) continue;
    windows.push({ startTime: oneOff.startTime, endTime: oneOff.endTime });
  }
  return windows;
}

function clipWindow(
  window: TimeWindow,
  start: string,
  end: string,
): TimeWindow | null {
  const clippedStart =
    compareTimes(window.startTime, start) > 0 ? window.startTime : start;
  const clippedEnd =
    compareTimes(window.endTime, end) < 0 ? window.endTime : end;
  if (compareTimes(clippedStart, clippedEnd) >= 0) return null;
  return { startTime: clippedStart, endTime: clippedEnd };
}

function mergeWindows(windows: TimeWindow[]): TimeWindow[] {
  const sorted = [...windows].sort((a, b) =>
    compareTimes(a.startTime, b.startTime),
  );
  const merged: TimeWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && compareTimes(window.startTime, last.endTime) <= 0) {
      if (compareTimes(window.endTime, last.endTime) > 0) {
        last.endTime = window.endTime;
      }
    } else {
      merged.push({ ...window });
    }
  }
  return merged;
}

/** 占有時間帯を除いた自由時間帯のうち最長のものを1つ返す */
function findLargestFreeWindow(
  workableStart: string,
  workableEnd: string,
  occupied: TimeWindow[],
): TimeWindow | null {
  const clipped = occupied
    .map((window) => clipWindow(window, workableStart, workableEnd))
    .filter((window): window is TimeWindow => window !== null);
  const merged = mergeWindows(clipped);

  const gaps: TimeWindow[] = [];
  let cursor = workableStart;
  for (const window of merged) {
    if (compareTimes(cursor, window.startTime) < 0) {
      gaps.push({ startTime: cursor, endTime: window.startTime });
    }
    if (compareTimes(window.endTime, cursor) > 0) {
      cursor = window.endTime;
    }
  }
  if (compareTimes(cursor, workableEnd) < 0) {
    gaps.push({ startTime: cursor, endTime: workableEnd });
  }

  if (gaps.length === 0) return null;
  return gaps.reduce((largest, gap) =>
    durationHours(gap.startTime, gap.endTime) >
    durationHours(largest.startTime, largest.endTime)
      ? gap
      : largest,
  );
}

function addHoursToTime(time: string, hours: number): string {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  const totalMinutes = Math.min(
    hour * 60 + minute + Math.round(hours * 60),
    23 * 60 + 59,
  );
  const cappedHour = Math.floor(totalMinutes / 60);
  const cappedMinute = totalMinutes % 60;
  return `${String(cappedHour).padStart(2, "0")}:${String(cappedMinute).padStart(2, "0")}`;
}

function capWindowLength(window: TimeWindow, maxHours: number): string {
  const cappedByMax = addHoursToTime(window.startTime, maxHours);
  return compareTimes(cappedByMax, window.endTime) < 0
    ? cappedByMax
    : window.endTime;
}

/**
 * 授業スケジュールとシフト目標から、対象月の日付ごとの候補空き時間枠を1つずつ生成する。
 * 避けたい曜日はスキップし、各日は最長の空き時間帯を maxHoursPerDay で切り詰めて返す。
 * この事前クランプにより、Claudeへ渡す候補枠は常に1日の上限時間内に収まる。
 */
export function buildAvailability(
  classSchedule: ClassScheduleState,
  shiftGoal: ShiftGoal,
): AvailabilitySlot[] {
  if (!shiftGoal.currentMonth) return [];

  const slots: AvailabilitySlot[] = [];
  for (const date of enumerateDatesInMonth(shiftGoal.currentMonth)) {
    const dayOfWeek = getDayOfWeek(date);
    if (shiftGoal.avoidDays.includes(dayOfWeek)) continue;

    const occupied = getOccupiedWindows(classSchedule, date, dayOfWeek);
    const free = findLargestFreeWindow(WORKABLE_START, WORKABLE_END, occupied);
    if (!free) continue;

    const cappedEnd = capWindowLength(free, shiftGoal.maxHoursPerDay);
    if (compareTimes(free.startTime, cappedEnd) >= 0) continue;

    slots.push({
      date,
      dayOfWeek,
      startTime: free.startTime,
      endTime: cappedEnd,
    });
  }
  return slots;
}
