import { getDayOfWeek } from "./date";
import { DAY_LABELS_JA } from "./types";

export function formatYen(amount: number): string {
  return `${Math.round(amount).toLocaleString("ja-JP")}円`;
}

export function formatDateJa(dateIso: string): string {
  const [, month, day] = dateIso.split("-");
  const dayOfWeek = getDayOfWeek(dateIso);
  return `${Number(month)}/${Number(day)}(${DAY_LABELS_JA[dayOfWeek]})`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}〜${endTime}`;
}
