import { formatYen } from "@/lib/format";
import type { ShiftGoal } from "@/lib/types";

interface ShiftGoalSummaryCardProps {
  goal: ShiftGoal;
}

export function ShiftGoalSummaryCard({ goal }: ShiftGoalSummaryCardProps) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <h2 className="font-semibold">{goal.currentMonth} の目標</h2>
      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
        <dt className="opacity-60">目標収入</dt>
        <dd>{formatYen(goal.targetSalary)}</dd>
        <dt className="opacity-60">1日の上限</dt>
        <dd>{goal.maxHoursPerDay}時間</dd>
        <dt className="opacity-60">週の上限</dt>
        <dd>{goal.maxDaysPerWeek}日</dd>
      </dl>
    </div>
  );
}
