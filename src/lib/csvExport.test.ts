import { describe, expect, it } from "vitest";
import { buildShiftCsv } from "./csvExport";
import type { ComputedShiftPattern, Workplace } from "./types";

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
    name: "カフェ,喫茶店",
    hourlyRate: 1000,
    cutoffDay: 25,
    payday: { day: 5, monthOffset: 1 },
  },
];

function buildPattern(
  shifts: ComputedShiftPattern["shifts"],
): ComputedShiftPattern {
  return {
    patternId: "pattern_1",
    name: "テスト",
    description: "",
    shifts,
    totalHours: 0,
    estimatedSalary: 0,
    supportCheck: { projectedAnnual: 0, exceedsLimit: false, marginRemaining: 0 },
    exceedsMaxDaysPerWeek: false,
    payoutSchedule: [],
  };
}

describe("buildShiftCsv", () => {
  it("ヘッダー行と日付昇順のデータ行を生成する", () => {
    const csv = buildShiftCsv(
      buildPattern([
        { date: "2026-08-10", workplaceId: "wp_01", startTime: "08:00", endTime: "14:00" },
        { date: "2026-08-03", workplaceId: "wp_01", startTime: "12:00", endTime: "18:00" },
      ]),
      WORKPLACES,
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("日付,曜日,職場,開始,終了,時間,見込み額");
    // 8/3も8/10もどちらも月曜日
    expect(lines[1]).toBe("2026-08-03,月,XXX塾,12:00,18:00,6,7200");
    expect(lines[2]).toBe("2026-08-10,月,XXX塾,08:00,14:00,6,7200");
  });

  it("職場名にカンマが含まれる場合はダブルクォートで囲む", () => {
    const csv = buildShiftCsv(
      buildPattern([
        { date: "2026-08-05", workplaceId: "wp_02", startTime: "09:00", endTime: "15:00" },
      ]),
      WORKPLACES,
    );
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe('2026-08-05,水,"カフェ,喫茶店",09:00,15:00,6,6000');
  });

  it("シフトが0件の場合はヘッダーのみを返す", () => {
    const csv = buildShiftCsv(buildPattern([]), WORKPLACES);
    expect(csv).toBe("日付,曜日,職場,開始,終了,時間,見込み額");
  });
});
