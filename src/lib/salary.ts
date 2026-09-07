import {
  compareTimes,
  durationHours,
  mondayOfWeek,
  resolvePayoutDate,
} from "./date";
import type {
  AvailabilitySlot,
  ComputedShiftPattern,
  PayoutEntry,
  RawShiftPattern,
  ShiftGoal,
  ShiftPick,
  Workplace,
} from "./types";

function findCandidate(
  candidates: AvailabilitySlot[],
  date: string,
): AvailabilitySlot | undefined {
  return candidates.find((candidate) => candidate.date === date);
}

function findWorkplace(
  workplaces: Workplace[],
  workplaceId: string,
): Workplace | undefined {
  return workplaces.find((workplace) => workplace.id === workplaceId);
}

function isShiftWithinCandidate(
  shift: ShiftPick,
  candidate: AvailabilitySlot,
): boolean {
  if (compareTimes(shift.startTime, shift.endTime) >= 0) return false;
  if (compareTimes(shift.startTime, candidate.startTime) < 0) return false;
  if (compareTimes(shift.endTime, candidate.endTime) > 0) return false;
  return true;
}

/**
 * Claudeが返したシフトのうち、候補枠に存在しない日付・未知の職場・
 * 候補枠の時間範囲を超えるもの・同一パターン内の日付重複を取り除く。
 * ツールスキーマのenum制約で大半は防げるが、念のためここでも再検証する。
 */
function sanitizeShifts(
  shifts: ShiftPick[],
  candidates: AvailabilitySlot[],
  workplaces: Workplace[],
): ShiftPick[] {
  const seenDates = new Set<string>();
  const valid: ShiftPick[] = [];
  for (const shift of shifts) {
    if (seenDates.has(shift.date)) continue;
    const candidate = findCandidate(candidates, shift.date);
    if (!candidate) continue;
    const workplace = findWorkplace(workplaces, shift.workplaceId);
    if (!workplace) continue;
    if (!isShiftWithinCandidate(shift, candidate)) continue;
    seenDates.add(shift.date);
    valid.push(shift);
  }
  return valid;
}

function computeTotalHours(shifts: ShiftPick[]): number {
  return shifts.reduce(
    (sum, shift) => sum + durationHours(shift.startTime, shift.endTime),
    0,
  );
}

function computeEstimatedSalary(
  shifts: ShiftPick[],
  workplaces: Workplace[],
): number {
  return shifts.reduce((sum, shift) => {
    const workplace = findWorkplace(workplaces, shift.workplaceId);
    if (!workplace) return sum;
    return (
      sum + durationHours(shift.startTime, shift.endTime) * workplace.hourlyRate
    );
  }, 0);
}

function computeExceedsMaxDaysPerWeek(
  shifts: ShiftPick[],
  maxDaysPerWeek: number,
): boolean {
  const countsByWeek = new Map<string, number>();
  for (const shift of shifts) {
    const week = mondayOfWeek(shift.date);
    countsByWeek.set(week, (countsByWeek.get(week) ?? 0) + 1);
  }
  return [...countsByWeek.values()].some((count) => count > maxDaysPerWeek);
}

function computePayoutSchedule(
  shifts: ShiftPick[],
  workplaces: Workplace[],
): PayoutEntry[] {
  const buckets = new Map<string, PayoutEntry>();
  for (const shift of shifts) {
    const workplace = findWorkplace(workplaces, shift.workplaceId);
    if (!workplace) continue;
    const payoutDate = resolvePayoutDate(
      shift.date,
      workplace.cutoffDay,
      workplace.payday,
    );
    const key = `${workplace.id}__${payoutDate}`;
    const hours = durationHours(shift.startTime, shift.endTime);
    const amount = hours * workplace.hourlyRate;
    const existing = buckets.get(key);
    if (existing) {
      existing.hours += hours;
      existing.amount += amount;
    } else {
      buckets.set(key, {
        workplaceId: workplace.id,
        payoutDate,
        hours,
        amount,
      });
    }
  }
  return [...buckets.values()].sort((a, b) =>
    a.payoutDate < b.payoutDate ? -1 : a.payoutDate > b.payoutDate ? 1 : 0,
  );
}

/**
 * 月間の見込み給与を12倍して年間換算する。
 * サーバー側にシフト履歴を保存しないMVPでは、実績ベースの年間集計ができないため、
 * 「このペースが1年続いたら」という月次ペース換算が扶養控除超過を判断する唯一の指標となる。
 */
function computeSupportCheck(estimatedSalary: number, supportLimit: number) {
  const projectedAnnual = estimatedSalary * 12;
  return {
    projectedAnnual,
    exceedsLimit: projectedAnnual > supportLimit,
    marginRemaining: supportLimit - projectedAnnual,
  };
}

/**
 * Claude APIが返したシフト案(RawShiftPattern)を検証し、
 * 時間・給与・扶養控除・支払スケジュールをTypeScript側で再計算する。
 * LLMの算数は信用せず、候補枠(AvailabilitySlot)と職場情報から全て再導出する。
 * 有効なシフトが1件も残らなかったパターンは結果から除外する。
 */
export function recomputePatterns(
  rawPatterns: RawShiftPattern[],
  candidates: AvailabilitySlot[],
  workplaces: Workplace[],
  shiftGoal: ShiftGoal,
  supportLimit: number,
): ComputedShiftPattern[] {
  const results: ComputedShiftPattern[] = [];
  let index = 0;
  for (const raw of rawPatterns) {
    const shifts = sanitizeShifts(raw.shifts, candidates, workplaces);
    if (shifts.length === 0) continue;

    index += 1;
    const totalHours = computeTotalHours(shifts);
    const estimatedSalary = computeEstimatedSalary(shifts, workplaces);

    results.push({
      patternId: `pattern_${index}`,
      name: raw.name,
      description: raw.description,
      shifts,
      totalHours,
      estimatedSalary,
      supportCheck: computeSupportCheck(estimatedSalary, supportLimit),
      exceedsMaxDaysPerWeek: computeExceedsMaxDaysPerWeek(
        shifts,
        shiftGoal.maxDaysPerWeek,
      ),
      payoutSchedule: computePayoutSchedule(shifts, workplaces),
    });
  }
  return results;
}
