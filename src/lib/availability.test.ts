import { describe, expect, it } from "vitest";
import { buildAvailability } from "./availability";
import type { ClassScheduleState, ShiftGoal } from "./types";

const EMPTY_SCHEDULE: ClassScheduleState = { classes: [], oneOffClasses: [] };

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

describe("buildAvailability", () => {
  it("currentMonthが空文字なら空配列を返す", () => {
    expect(buildAvailability(EMPTY_SCHEDULE, baseGoal({ currentMonth: "" }))).toEqual([]);
  });

  it("授業がなければ月の全日数分のスロットを生成する(2026年8月=31日)", () => {
    const slots = buildAvailability(EMPTY_SCHEDULE, baseGoal());
    expect(slots).toHaveLength(31);
    expect(slots[0]).toEqual({
      date: "2026-08-01",
      dayOfWeek: 6, // 土曜日
      startTime: "08:00",
      endTime: "14:00", // maxHoursPerDay=6でクランプ
    });
  });

  it("avoidDaysに指定した曜日のスロットは生成されない(2026年8月の月曜は3,10,17,24,31日)", () => {
    const slots = buildAvailability(EMPTY_SCHEDULE, baseGoal({ avoidDays: [1] }));
    expect(slots).toHaveLength(31 - 5);
    expect(slots.some((slot) => slot.dayOfWeek === 1)).toBe(false);
  });

  it("授業と重ならない、最も長い空き時間帯を選び maxHoursPerDay で切り詰める", () => {
    // 2026-08-03は月曜日。10:30-12:00に授業がある場合、
    // 空き時間は 08:00-10:30(2.5h) と 12:00-23:00(11h) のうち後者が採用される
    const schedule: ClassScheduleState = {
      classes: [
        {
          id: "c1",
          dayOfWeek: 1,
          startTime: "10:30",
          endTime: "12:00",
          subject: "微積分",
        },
      ],
      oneOffClasses: [],
    };
    const slots = buildAvailability(schedule, baseGoal());
    const monday = slots.find((slot) => slot.date === "2026-08-03");
    expect(monday).toEqual({
      date: "2026-08-03",
      dayOfWeek: 1,
      startTime: "12:00",
      endTime: "18:00",
    });
  });

  it("skipDatesで指定した日は授業がなかったものとして扱われる", () => {
    const schedule: ClassScheduleState = {
      classes: [
        {
          id: "c1",
          dayOfWeek: 1,
          startTime: "10:30",
          endTime: "12:00",
          subject: "微積分",
          skipDates: ["2026-08-03"],
        },
      ],
      oneOffClasses: [],
    };
    const slots = buildAvailability(schedule, baseGoal());
    const monday = slots.find((slot) => slot.date === "2026-08-03");
    expect(monday).toEqual({
      date: "2026-08-03",
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "14:00",
    });
  });

  it("振替(単発)授業も空き時間帯の計算に反映される", () => {
    // 2026-08-05は水曜日。09:00-17:00の振替授業がある場合、
    // 空き時間は 08:00-09:00(1h) と 17:00-23:00(6h) のうち後者が採用される
    const schedule: ClassScheduleState = {
      classes: [],
      oneOffClasses: [
        {
          id: "o1",
          date: "2026-08-05",
          startTime: "09:00",
          endTime: "17:00",
          subject: "振替講義",
        },
      ],
    };
    const slots = buildAvailability(schedule, baseGoal());
    const wednesday = slots.find((slot) => slot.date === "2026-08-05");
    expect(wednesday).toEqual({
      date: "2026-08-05",
      dayOfWeek: 3,
      startTime: "17:00",
      endTime: "23:00",
    });
  });

  it("終日授業で埋まっている日はスロットが生成されない", () => {
    const schedule: ClassScheduleState = {
      classes: [
        {
          id: "c1",
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "23:00",
          subject: "集中講義",
        },
      ],
      oneOffClasses: [],
    };
    const slots = buildAvailability(schedule, baseGoal());
    expect(slots.some((slot) => slot.date === "2026-08-03")).toBe(false);
    // 他の曜日には影響しない
    expect(slots.some((slot) => slot.date === "2026-08-04")).toBe(true);
  });
});
