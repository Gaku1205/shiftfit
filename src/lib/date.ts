import type { DayOfWeek } from "./types";

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

export function parseYearMonth(monthIso: string): YearMonth {
  const [yearStr, monthStr] = monthIso.split("-");
  if (!yearStr || !monthStr) {
    throw new Error(`不正な年月形式です: ${monthIso}`);
  }
  return { year: Number(yearStr), month: Number(monthStr) };
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function addMonths(monthIso: string, offset: number): string {
  const { year, month } = parseYearMonth(monthIso);
  const zeroBased = month - 1 + offset;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = (((zeroBased % 12) + 12) % 12) + 1;
  return formatYearMonth({ year: newYear, month: newMonth });
}

export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

export function resolveDateInMonth(monthIso: string, day: number): string {
  const { year, month } = parseYearMonth(monthIso);
  const clamped = clampDay(year, month, day);
  return `${monthIso}-${String(clamped).padStart(2, "0")}`;
}

export function monthOfDate(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function dayOfDate(dateIso: string): number {
  return Number(dateIso.slice(8, 10));
}

export function getDayOfWeek(dateIso: string): DayOfWeek {
  const { year, month } = parseYearMonth(monthOfDate(dateIso));
  const day = dayOfDate(dateIso);
  return new Date(year, month - 1, day).getDay() as DayOfWeek;
}

/** 指定日が属する週(月曜始まり)の月曜日の日付をISO形式で返す */
export function mondayOfWeek(dateIso: string): string {
  const { year, month } = parseYearMonth(monthOfDate(dateIso));
  const day = dayOfDate(dateIso);
  const date = new Date(year, month - 1, day);
  const dow = date.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diffToMonday);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function enumerateDatesInMonth(monthIso: string): string[] {
  const { year, month } = parseYearMonth(monthIso);
  const total = daysInMonth(year, month);
  return Array.from({ length: total }, (_, i) =>
    resolveDateInMonth(monthIso, i + 1),
  );
}

export function compareTimes(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function durationHours(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number) as [number, number];
  const [endHour, endMinute] = end.split(":").map(Number) as [number, number];
  return (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
}

/** シフト日がどの締め期間(締め日が属する月)に属するかを判定する */
export function resolveCutoffClosingMonth(
  dateIso: string,
  cutoffDay: number,
): string {
  const shiftMonth = monthOfDate(dateIso);
  const { year, month } = parseYearMonth(shiftMonth);
  const clampedCutoff = clampDay(year, month, cutoffDay);
  const day = dayOfDate(dateIso);
  return day <= clampedCutoff ? shiftMonth : addMonths(shiftMonth, 1);
}

/** シフト日・締め日・給料日設定から実際の給料支払日を求める */
export function resolvePayoutDate(
  dateIso: string,
  cutoffDay: number,
  payday: { day: number; monthOffset: 0 | 1 },
): string {
  const closingMonth = resolveCutoffClosingMonth(dateIso, cutoffDay);
  const payoutMonth = addMonths(closingMonth, payday.monthOffset);
  return resolveDateInMonth(payoutMonth, payday.day);
}
