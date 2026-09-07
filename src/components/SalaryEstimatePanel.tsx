import { formatDateJa, formatYen } from "@/lib/format";
import type { ComputedShiftPattern, Workplace } from "@/lib/types";

interface SalaryEstimatePanelProps {
  pattern: ComputedShiftPattern;
  workplaces: Workplace[];
}

export function SalaryEstimatePanel({
  pattern,
  workplaces,
}: SalaryEstimatePanelProps) {
  const workplaceName = (id: string) =>
    workplaces.find((workplace) => workplace.id === id)?.name ?? "(不明な職場)";

  return (
    <div className="space-y-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <h2 className="font-semibold">給与見積もり: {pattern.name}</h2>
      <div className="text-2xl font-bold">{formatYen(pattern.estimatedSalary)}</div>

      <div>
        <h3 className="text-sm font-medium">支払スケジュール</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {pattern.payoutSchedule.map((entry) => (
            <li
              key={`${entry.workplaceId}-${entry.payoutDate}`}
              className="flex justify-between"
            >
              <span>
                {formatDateJa(entry.payoutDate)} 支払い(
                {workplaceName(entry.workplaceId)})
              </span>
              <span>{formatYen(entry.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className={
          pattern.supportCheck.exceedsLimit
            ? "bg-danger/10 text-danger rounded p-3 text-sm"
            : "bg-primary/10 rounded p-3 text-sm"
        }
      >
        {pattern.supportCheck.exceedsLimit ? (
          <p>
            ⚠ このペースだと年間{formatYen(pattern.supportCheck.projectedAnnual)}
            になり、扶養控除の上限を超える見込みです。
          </p>
        ) : (
          <p>
            このペースなら年間
            {formatYen(pattern.supportCheck.projectedAnnual)}
            の見込みで、扶養控除まであと
            {formatYen(pattern.supportCheck.marginRemaining)}
            の余裕があります。
          </p>
        )}
      </div>
    </div>
  );
}
