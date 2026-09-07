"use client";

import { buildShiftCsv, triggerCsvDownload } from "@/lib/csvExport";
import type { ComputedShiftPattern, Workplace } from "@/lib/types";

interface ExportPanelProps {
  pattern: ComputedShiftPattern;
  workplaces: Workplace[];
}

export function ExportPanel({ pattern, workplaces }: ExportPanelProps) {
  const handleDownloadCsv = () => {
    const csv = buildShiftCsv(pattern, workplaces);
    triggerCsvDownload(`shiftfit_${pattern.patternId}.csv`, csv);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print:hidden flex flex-wrap gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <button
        type="button"
        onClick={handleDownloadCsv}
        className="rounded border border-black/20 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        CSVをダウンロード
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="rounded border border-black/20 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        印刷 / PDFとして保存
      </button>
    </div>
  );
}
