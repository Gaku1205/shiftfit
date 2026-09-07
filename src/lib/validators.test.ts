import { describe, expect, it } from "vitest";
import {
  isClassScheduleState,
  isComputedShiftPatternOrNull,
  isGroupsState,
  isSetupProgress,
  isShiftGoal,
  isUserProfile,
  isWorkplace,
} from "./validators";

describe("isWorkplace", () => {
  it("正しい形のオブジェクトを受理する", () => {
    expect(
      isWorkplace({
        id: "wp_01",
        name: "XXX塾",
        hourlyRate: 1200,
        cutoffDay: 25,
        payday: { day: 10, monthOffset: 1 },
      }),
    ).toBe(true);
  });

  it("paydayのmonthOffsetが0や1以外なら拒否する", () => {
    expect(
      isWorkplace({
        id: "wp_01",
        name: "XXX塾",
        hourlyRate: 1200,
        cutoffDay: 25,
        payday: { day: 10, monthOffset: 2 },
      }),
    ).toBe(false);
  });

  it("必須フィールドが欠けていれば拒否する", () => {
    expect(isWorkplace({ id: "wp_01", name: "XXX塾" })).toBe(false);
  });

  it("nullやプリミティブは拒否する", () => {
    expect(isWorkplace(null)).toBe(false);
    expect(isWorkplace("wp_01")).toBe(false);
  });
});

describe("isUserProfile", () => {
  it("正しい形のプロフィールを受理する", () => {
    expect(
      isUserProfile({
        workplaces: [],
        supportLimit: 1030000,
        privacySettings: { showScheduleToGroup: true },
      }),
    ).toBe(true);
  });

  it("workplacesの要素が不正なら拒否する", () => {
    expect(
      isUserProfile({
        workplaces: [{ id: "wp_01" }],
        supportLimit: 1030000,
        privacySettings: { showScheduleToGroup: true },
      }),
    ).toBe(false);
  });
});

describe("isClassScheduleState", () => {
  it("空のスケジュールを受理する", () => {
    expect(isClassScheduleState({ classes: [], oneOffClasses: [] })).toBe(
      true,
    );
  });

  it("dayOfWeekが範囲外なら拒否する", () => {
    expect(
      isClassScheduleState({
        classes: [
          {
            id: "c1",
            dayOfWeek: 7,
            startTime: "10:30",
            endTime: "12:00",
            subject: "微積分",
          },
        ],
        oneOffClasses: [],
      }),
    ).toBe(false);
  });
});

describe("isShiftGoal", () => {
  it("正しい形の目標を受理する", () => {
    expect(
      isShiftGoal({
        currentMonth: "2026-08",
        targetSalary: 50000,
        maxHoursPerDay: 6,
        maxDaysPerWeek: 4,
        avoidDays: [1],
        preferredWorkplaceId: null,
      }),
    ).toBe(true);
  });

  it("avoidDaysに不正な曜日が含まれれば拒否する", () => {
    expect(
      isShiftGoal({
        currentMonth: "2026-08",
        targetSalary: 50000,
        maxHoursPerDay: 6,
        maxDaysPerWeek: 4,
        avoidDays: [9],
        preferredWorkplaceId: null,
      }),
    ).toBe(false);
  });
});

describe("isSetupProgress", () => {
  it("3つのbooleanフィールドを検証する", () => {
    expect(
      isSetupProgress({ profile: true, classSchedule: false, goal: false }),
    ).toBe(true);
    expect(isSetupProgress({ profile: true, classSchedule: false })).toBe(
      false,
    );
  });
});

describe("isGroupsState", () => {
  it("空のグループ状態を受理する", () => {
    expect(isGroupsState({ groups: [], activeGroupId: null })).toBe(true);
  });

  it("メンバーの形が不正なら拒否する", () => {
    expect(
      isGroupsState({
        groups: [
          {
            id: "grp_01",
            name: "XXX塾 バイト仲間",
            type: "workplace",
            members: [{ id: "u1" }],
          },
        ],
        activeGroupId: null,
      }),
    ).toBe(false);
  });
});

describe("isComputedShiftPatternOrNull", () => {
  it("nullを受理する", () => {
    expect(isComputedShiftPatternOrNull(null)).toBe(true);
  });

  it("破損したLocalStorageデータを拒否する", () => {
    expect(isComputedShiftPatternOrNull({ foo: "bar" })).toBe(false);
  });

  it("正しい形のパターンを受理する", () => {
    expect(
      isComputedShiftPatternOrNull({
        patternId: "1",
        name: "効率重視パターン",
        description: "最短日数で目標達成",
        shifts: [
          { date: "2026-08-05", workplaceId: "wp_01", startTime: "16:00", endTime: "22:00" },
        ],
        totalHours: 6,
        estimatedSalary: 7200,
        supportCheck: {
          projectedAnnual: 86400,
          exceedsLimit: false,
          marginRemaining: 943600,
        },
        exceedsMaxDaysPerWeek: false,
        payoutSchedule: [
          { workplaceId: "wp_01", payoutDate: "2026-09-10", hours: 6, amount: 7200 },
        ],
      }),
    ).toBe(true);
  });
});
