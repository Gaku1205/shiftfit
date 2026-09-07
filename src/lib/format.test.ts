import { describe, expect, it } from "vitest";
import { formatDateJa, formatTimeRange, formatYen } from "./format";

describe("formatYen", () => {
  it("3桁区切りのカンマを入れて円を付与する", () => {
    expect(formatYen(50000)).toBe("50,000円");
  });

  it("小数は四捨五入する", () => {
    expect(formatYen(7199.6)).toBe("7,200円");
  });
});

describe("formatDateJa", () => {
  it("月/日(曜日)の形式で表示する(2026-08-03は月曜日)", () => {
    expect(formatDateJa("2026-08-03")).toBe("8/3(月)");
  });
});

describe("formatTimeRange", () => {
  it("開始〜終了の形式で表示する", () => {
    expect(formatTimeRange("16:00", "22:00")).toBe("16:00〜22:00");
  });
});
