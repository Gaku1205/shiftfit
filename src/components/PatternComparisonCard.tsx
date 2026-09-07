import { formatYen } from "@/lib/format";
import type { ComputedShiftPattern } from "@/lib/types";

interface PatternComparisonCardProps {
  pattern: ComputedShiftPattern;
  isSelected: boolean;
  onSelect: () => void;
}

export function PatternComparisonCard({
  pattern,
  isSelected,
  onSelect,
}: PatternComparisonCardProps) {
  return (
    <div
      className={
        isSelected
          ? "space-y-2 rounded-lg border border-primary p-4 ring-2 ring-primary/30"
          : "space-y-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
      }
    >
      <h3 className="font-semibold">{pattern.name}</h3>
      <p className="text-sm opacity-70">{pattern.description}</p>
      <div className="flex justify-between text-sm">
        <span>合計時間</span>
        <span>{pattern.totalHours}時間</span>
      </div>
      <div className="flex justify-between text-sm font-medium">
        <span>見込み給与</span>
        <span>{formatYen(pattern.estimatedSalary)}</span>
      </div>
      {pattern.supportCheck.exceedsLimit && (
        <p className="text-warning text-xs">
          ⚠ このペースが続くと扶養控除の上限を超える可能性があります
        </p>
      )}
      {pattern.exceedsMaxDaysPerWeek && (
        <p className="text-warning text-xs">
          ⚠ 週の最大出勤日数を超える週があります
        </p>
      )}
      <button
        type="button"
        onClick={onSelect}
        className={
          isSelected
            ? "w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white"
            : "w-full rounded border border-black/20 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        }
      >
        {isSelected ? "選択中" : "このプランを選ぶ"}
      </button>
    </div>
  );
}
