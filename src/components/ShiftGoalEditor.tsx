"use client";

import { DAY_LABELS_JA } from "@/lib/types";
import type { DayOfWeek, ShiftGoal, Workplace } from "@/lib/types";

interface ShiftGoalEditorProps {
  value: ShiftGoal;
  onChange: (next: ShiftGoal) => void;
  workplaces: Workplace[];
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

function defaultCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ShiftGoalEditor({ value, onChange, workplaces }: ShiftGoalEditorProps) {
  const currentMonth = value.currentMonth || defaultCurrentMonth();

  const toggleAvoidDay = (day: DayOfWeek) => {
    const next = value.avoidDays.includes(day)
      ? value.avoidDays.filter((avoided) => avoided !== day)
      : [...value.avoidDays, day];
    onChange({ ...value, avoidDays: next });
  };

  return (
    <div className="space-y-5">
      <label className="block text-sm">
        対象月
        <input
          type="month"
          className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
          value={currentMonth}
          onChange={(event) => onChange({ ...value, currentMonth: event.target.value })}
        />
      </label>

      <label className="block text-sm">
        今月の目標収入(円)
        <input
          type="number"
          className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
          value={value.targetSalary}
          onChange={(event) =>
            onChange({ ...value, targetSalary: Number(event.target.value) })
          }
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          1日の最大労働時間
          <input
            type="number"
            min={1}
            max={12}
            className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
            value={value.maxHoursPerDay}
            onChange={(event) =>
              onChange({ ...value, maxHoursPerDay: Number(event.target.value) })
            }
          />
        </label>
        <label className="text-sm">
          週の最大出勤日数
          <input
            type="number"
            min={1}
            max={7}
            className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
            value={value.maxDaysPerWeek}
            onChange={(event) =>
              onChange({ ...value, maxDaysPerWeek: Number(event.target.value) })
            }
          />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm">避けたい曜日</span>
        <div className="flex flex-wrap gap-2">
          {ALL_DAYS.map((day) => {
            const isAvoided = value.avoidDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleAvoidDay(day)}
                className={
                  isAvoided
                    ? "rounded-full border border-primary bg-primary px-3 py-1 text-sm text-white"
                    : "rounded-full border border-black/20 px-3 py-1 text-sm dark:border-white/20"
                }
              >
                {DAY_LABELS_JA[day]}
              </button>
            );
          })}
        </div>
      </div>

      {workplaces.length > 0 && (
        <label className="block text-sm">
          優先したい職場(任意)
          <select
            className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
            value={value.preferredWorkplaceId ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                preferredWorkplaceId: event.target.value === "" ? null : event.target.value,
              })
            }
          >
            <option value="">指定しない</option>
            {workplaces.map((workplace) => (
              <option key={workplace.id} value={workplace.id}>
                {workplace.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
