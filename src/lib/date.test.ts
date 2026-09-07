import { describe, expect, it } from "vitest";
import {
  addMonths,
  compareTimes,
  daysInMonth,
  durationHours,
  enumerateDatesInMonth,
  getDayOfWeek,
  mondayOfWeek,
  resolveCutoffClosingMonth,
  resolveDateInMonth,
  resolvePayoutDate,
} from "./date";

describe("daysInMonth", () => {
  it("31日ある月を正しく返す", () => {
    expect(daysInMonth(2026, 8)).toBe(31);
  });

  it("平年の2月は28日", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it("うるう年の2月は29日", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
});

describe("addMonths", () => {
  it("年をまたがない加算", () => {
    expect(addMonths("2026-08", 1)).toBe("2026-09");
  });

  it("年をまたぐ加算", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("年をまたぐ減算", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("0を加算すると変化しない", () => {
    expect(addMonths("2026-05", 0)).toBe("2026-05");
  });
});

describe("resolveDateInMonth", () => {
  it("実在する日はそのまま使う", () => {
    expect(resolveDateInMonth("2026-08", 15)).toBe("2026-08-15");
  });

  it("月末を超える日は実際の月末にクランプする", () => {
    expect(resolveDateInMonth("2026-02", 31)).toBe("2026-02-28");
  });
});

describe("enumerateDatesInMonth", () => {
  it("月の全日数分の日付を生成する", () => {
    const dates = enumerateDatesInMonth("2026-04");
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-04-01");
    expect(dates[29]).toBe("2026-04-30");
  });
});

describe("getDayOfWeek", () => {
  it("既知の日付の曜日を正しく返す(2024-01-01は月曜日)", () => {
    expect(getDayOfWeek("2024-01-01")).toBe(1);
  });

  it("既知の日付の曜日を正しく返す(2000-01-01は土曜日)", () => {
    expect(getDayOfWeek("2000-01-01")).toBe(6);
  });
});

describe("compareTimes", () => {
  it("早い時刻が小さいと判定される", () => {
    expect(compareTimes("09:00", "10:30")).toBeLessThan(0);
  });

  it("同じ時刻は0", () => {
    expect(compareTimes("09:00", "09:00")).toBe(0);
  });

  it("遅い時刻が大きいと判定される", () => {
    expect(compareTimes("18:00", "09:00")).toBeGreaterThan(0);
  });
});

describe("durationHours", () => {
  it("時間差を計算する", () => {
    expect(durationHours("16:00", "22:00")).toBe(6);
  });

  it("分単位も考慮する", () => {
    expect(durationHours("09:30", "12:00")).toBe(2.5);
  });
});

describe("mondayOfWeek", () => {
  it("月曜日自身はそのまま返す(2026-08-03は月曜日)", () => {
    expect(mondayOfWeek("2026-08-03")).toBe("2026-08-03");
  });

  it("週の途中の日は同じ週の月曜日を返す(2026-08-05は水曜日)", () => {
    expect(mondayOfWeek("2026-08-05")).toBe("2026-08-03");
  });

  it("日曜日は前日までの週の月曜日を返す(2026-08-09は日曜日)", () => {
    expect(mondayOfWeek("2026-08-09")).toBe("2026-08-03");
  });

  it("月をまたぐ週も正しく処理する", () => {
    // 2026-09-01は火曜日 → 週の月曜は2026-08-31
    expect(mondayOfWeek("2026-09-01")).toBe("2026-08-31");
  });
});

describe("resolveCutoffClosingMonth", () => {
  it("締め日以前のシフトは当月の締め期間に属する", () => {
    expect(resolveCutoffClosingMonth("2026-08-20", 25)).toBe("2026-08");
  });

  it("締め日を過ぎたシフトは翌月の締め期間に属する", () => {
    expect(resolveCutoffClosingMonth("2026-08-27", 25)).toBe("2026-09");
  });

  it("締め日がちょうどの場合は当月に属する", () => {
    expect(resolveCutoffClosingMonth("2026-08-25", 25)).toBe("2026-08");
  });
});

describe("resolvePayoutDate", () => {
  it("締め日25日・翌月10日払いの場合、締め日以前のシフトは翌月払い", () => {
    expect(resolvePayoutDate("2026-08-20", 25, { day: 10, monthOffset: 1 })).toBe(
      "2026-09-10",
    );
  });

  it("締め日を過ぎたシフトはさらに1ヶ月後払いになる", () => {
    expect(resolvePayoutDate("2026-08-27", 25, { day: 10, monthOffset: 1 })).toBe(
      "2026-10-10",
    );
  });

  it("給料日が月末を超える場合はクランプされる", () => {
    // 締め期間は2026-02、支払いは翌月(2026-03)の31日 → 3月は31日まであるのでそのまま
    expect(resolvePayoutDate("2026-02-10", 31, { day: 31, monthOffset: 1 })).toBe(
      "2026-03-31",
    );
  });
});
