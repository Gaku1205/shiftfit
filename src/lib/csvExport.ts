import { durationHours, getDayOfWeek } from "./date";
import { DAY_LABELS_JA } from "./types";
import type { ComputedShiftPattern, Workplace } from "./types";

const CSV_HEADERS = ["日付", "曜日", "職場", "開始", "終了", "時間", "見込み額"];

function escapeCsvField(field: string): string {
  if (/[",\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** シフトパターンをCSV文字列に変換する(BOM付与はtriggerCsvDownload側で行う) */
export function buildShiftCsv(
  pattern: ComputedShiftPattern,
  workplaces: Workplace[],
): string {
  const sortedShifts = [...pattern.shifts].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  const rows = sortedShifts.map((shift) => {
    const workplace = workplaces.find(
      (candidate) => candidate.id === shift.workplaceId,
    );
    const hours = durationHours(shift.startTime, shift.endTime);
    return [
      shift.date,
      DAY_LABELS_JA[getDayOfWeek(shift.date)],
      workplace?.name ?? "",
      shift.startTime,
      shift.endTime,
      String(hours),
      workplace ? String(Math.round(hours * workplace.hourlyRate)) : "",
    ].map(escapeCsvField);
  });

  return [CSV_HEADERS, ...rows].map((row) => row.join(",")).join("\r\n");
}

/** ブラウザでCSVファイルのダウンロードを開始する(Excel向けにUTF-8 BOMを付与) */
export function triggerCsvDownload(filename: string, csvContent: string): void {
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
