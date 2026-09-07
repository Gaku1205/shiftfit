import { describe, expect, it } from "vitest";
import { recomputePatterns } from "./salary";
import type { AvailabilitySlot, RawShiftPattern, ShiftGoal, Workplace } from "./types";

const CANDIDATES: AvailabilitySlot[] = [
  { date: "2026-08-03", dayOfWeek: 1, startTime: "12:00", endTime: "18:00" },
  { date: "2026-08-04", dayOfWeek: 2, startTime: "08:00", endTime: "14:00" },
  { date: "2026-08-05", dayOfWeek: 3, startTime: "09:00", endTime: "15:00" },
  { date: "2026-08-10", dayOfWeek: 1, startTime: "08:00", endTime: "14:00" },
];

const WORKPLACES: Workplace[] = [
  {
    id: "wp_01",
    name: "XXX塾",
    hourlyRate: 1200,
    cutoffDay: 25,
    payday: { day: 10, monthOffset: 1 },
  },
  {
    id: "wp_02",
    name: "YYY飲食店",
    hourlyRate: 1000,
    cutoffDay: 25,
    payday: { day: 5, monthOffset: 1 },
  },
];

function baseGoal(overrides: Partial<ShiftGoal> = {}): ShiftGoal {
  return {
    currentMonth: "2026-08",
    targetSalary: 50000,
    maxHoursPerDay: 6,
    maxDaysPerWeek: 4,
    avoidDays: [],
    preferredWorkplaceId: null,
    ...overrides,
  };
}

const SUPPORT_LIMIT = 1_030_000;

describe("recomputePatterns", () => {
  it("正常なシフト案から時間・給与・扶養控除・支払日を計算する", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "効率重視パターン",
        description: "最短日数で目標達成",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(pattern).toBeDefined();
    expect(pattern?.totalHours).toBe(6);
    expect(pattern?.estimatedSalary).toBe(7200);
    expect(pattern?.supportCheck).toEqual({
      projectedAnnual: 86400,
      exceedsLimit: false,
      marginRemaining: 943600,
    });
    expect(pattern?.exceedsMaxDaysPerWeek).toBe(false);
    expect(pattern?.payoutSchedule).toEqual([
      { workplaceId: "wp_01", payoutDate: "2026-09-10", hours: 6, amount: 7200 },
    ]);
  });

  it("候補枠に存在しない日付のシフトは除外される", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "テスト",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
          { date: "2026-08-99", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(pattern?.shifts).toHaveLength(1);
    expect(pattern?.shifts[0]?.date).toBe("2026-08-03");
  });

  it("存在しない職場IDのシフトは除外される", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "テスト",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_99", startTime: "12:00", endTime: "18:00" },
        ],
      },
    ];
    const result = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(result).toHaveLength(0);
  });

  it("候補枠の時間範囲を超えるシフトは除外される", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "テスト",
        description: "",
        shifts: [
          // 候補は12:00-18:00までなのに19:00まで働く案 → 範囲外
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "19:00" },
        ],
      },
    ];
    const result = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(result).toHaveLength(0);
  });

  it("同一パターン内で日付が重複する場合は最初の1件のみ採用する", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "テスト",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "13:00", endTime: "17:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(pattern?.shifts).toHaveLength(1);
    expect(pattern?.shifts[0]).toEqual({
      date: "2026-08-03",
      workplaceId: "wp_01",
      startTime: "12:00",
      endTime: "18:00",
    });
  });

  it("有効なシフトが1件も残らないパターンは結果から除外される", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "全滅パターン",
        description: "",
        shifts: [{ date: "2026-08-99", workplaceId: "wp_99", startTime: "00:00", endTime: "01:00" }],
      },
      {
        name: "有効パターン",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
        ],
      },
    ];
    const result = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("有効パターン");
    expect(result[0]?.patternId).toBe("pattern_1");
  });

  it("週内の勤務日数がmaxDaysPerWeekを超える場合exceedsMaxDaysPerWeekがtrueになる", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "週3日パターン",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
          { date: "2026-08-04", workplaceId: "wp_01", startTime: "08:00", endTime: "14:00" },
          { date: "2026-08-05", workplaceId: "wp_01", startTime: "09:00", endTime: "15:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(
      raw,
      CANDIDATES,
      WORKPLACES,
      baseGoal({ maxDaysPerWeek: 2 }),
      SUPPORT_LIMIT,
    );
    expect(pattern?.exceedsMaxDaysPerWeek).toBe(true);
  });

  it("同一職場・同一締め期間内の複数シフトは支払スケジュールで合算される", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "複数シフト",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
          { date: "2026-08-10", workplaceId: "wp_01", startTime: "08:00", endTime: "14:00" },
          { date: "2026-08-05", workplaceId: "wp_02", startTime: "09:00", endTime: "15:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(raw, CANDIDATES, WORKPLACES, baseGoal(), SUPPORT_LIMIT);
    // payoutDateの昇順でソートされるため、9/5払い(wp_02)が9/10払い(wp_01)より先になる
    expect(pattern?.payoutSchedule).toEqual([
      { workplaceId: "wp_02", payoutDate: "2026-09-05", hours: 6, amount: 6000 },
      { workplaceId: "wp_01", payoutDate: "2026-09-10", hours: 12, amount: 14400 },
    ]);
  });

  it("扶養控除上限を超える見込みの場合exceedsLimitがtrueになる", () => {
    const raw: RawShiftPattern[] = [
      {
        name: "稼ぎすぎパターン",
        description: "",
        shifts: [
          { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
        ],
      },
    ];
    const [pattern] = recomputePatterns(
      raw,
      CANDIDATES,
      WORKPLACES,
      baseGoal(),
      1000, // 極端に低い上限にして必ず超過させる
    );
    expect(pattern?.supportCheck.exceedsLimit).toBe(true);
  });
});
