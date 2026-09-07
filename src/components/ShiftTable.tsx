import { durationHours } from "@/lib/date";
import { formatDateJa, formatTimeRange, formatYen } from "@/lib/format";
import type { ComputedShiftPattern, Workplace } from "@/lib/types";

interface ShiftTableProps {
  pattern: ComputedShiftPattern;
  workplaces: Workplace[];
}

export function ShiftTable({ pattern, workplaces }: ShiftTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-black/10 text-left dark:border-white/10">
          <th className="py-1 pr-2 font-medium">日付</th>
          <th className="py-1 pr-2 font-medium">職場</th>
          <th className="py-1 pr-2 font-medium">時間</th>
          <th className="py-1 text-right font-medium">見込み額</th>
        </tr>
      </thead>
      <tbody>
        {pattern.shifts.map((shift) => {
          const workplace = workplaces.find(
            (candidate) => candidate.id === shift.workplaceId,
          );
          const hours = durationHours(shift.startTime, shift.endTime);
          return (
            <tr
              key={`${shift.date}-${shift.workplaceId}`}
              className="border-b border-black/5 dark:border-white/5"
            >
              <td className="py-1.5 pr-2">{formatDateJa(shift.date)}</td>
              <td className="py-1.5 pr-2">{workplace?.name ?? "(不明な職場)"}</td>
              <td className="py-1.5 pr-2">
                {formatTimeRange(shift.startTime, shift.endTime)}
              </td>
              <td className="py-1.5 text-right">
                {workplace ? formatYen(hours * workplace.hourlyRate) : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
