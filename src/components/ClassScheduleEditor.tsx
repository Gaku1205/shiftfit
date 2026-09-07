"use client";

import { useState } from "react";
import { DAY_LABELS_JA } from "@/lib/types";
import type { ClassEntry, ClassScheduleState, DayOfWeek } from "@/lib/types";

interface ClassScheduleEditorProps {
  value: ClassScheduleState;
  onChange: (next: ClassScheduleState) => void;
}

interface Period {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

const DAY_OPTIONS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_PERIODS: Period[] = [
  { id: "p1", label: "1限", startTime: "09:00", endTime: "10:30" },
  { id: "p2", label: "2限", startTime: "10:40", endTime: "12:10" },
  { id: "p3", label: "3限", startTime: "13:00", endTime: "14:30" },
  { id: "p4", label: "4限", startTime: "14:40", endTime: "16:10" },
  { id: "p5", label: "5限", startTime: "16:20", endTime: "17:50" },
];

export function ClassScheduleEditor({ value, onChange }: ClassScheduleEditorProps) {
  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS);

  const findEntry = (day: DayOfWeek, period: Period): ClassEntry | undefined =>
    value.classes.find(
      (entry) =>
        entry.dayOfWeek === day &&
        entry.startTime === period.startTime &&
        entry.endTime === period.endTime,
    );

  const updatePeriodTime = (
    periodId: string,
    field: "startTime" | "endTime",
    newValue: string,
  ) => {
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;
    const oldStart = period.startTime;
    const oldEnd = period.endTime;
    const nextTimes = { startTime: period.startTime, endTime: period.endTime, [field]: newValue };

    setPeriods(periods.map((p) => (p.id === periodId ? { ...p, ...nextTimes } : p)));

    // 既に登録済みのコマも編集後の時刻に追従させる
    onChange({
      ...value,
      classes: value.classes.map((entry) =>
        entry.startTime === oldStart && entry.endTime === oldEnd
          ? { ...entry, startTime: nextTimes.startTime, endTime: nextTimes.endTime }
          : entry,
      ),
    });
  };

  const registerCell = (day: DayOfWeek, period: Period) => {
    onChange({
      ...value,
      classes: [
        ...value.classes,
        {
          id: crypto.randomUUID(),
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          subject: "",
        },
      ],
    });
  };

  const removeEntry = (entryId: string) => {
    onChange({
      ...value,
      classes: value.classes.filter((entry) => entry.id !== entryId),
    });
  };

  const updateSubject = (entryId: string, subject: string) => {
    onChange({
      ...value,
      classes: value.classes.map((entry) =>
        entry.id === entryId ? { ...entry, subject } : entry,
      ),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-70">
        授業がある時限をクリックして登録してください(科目名はあとから任意で入力できます)。
      </p>

      <details className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
        <summary className="cursor-pointer font-medium">時限の時刻を編集</summary>
        <div className="mt-3 space-y-2">
          {periods.map((period) => (
            <div key={period.id} className="flex items-center gap-2">
              <span className="w-10 shrink-0">{period.label}</span>
              <input
                type="time"
                value={period.startTime}
                onChange={(event) =>
                  updatePeriodTime(period.id, "startTime", event.target.value)
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
              <span>〜</span>
              <input
                type="time"
                value={period.endTime}
                onChange={(event) =>
                  updatePeriodTime(period.id, "endTime", event.target.value)
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
            </div>
          ))}
        </div>
      </details>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-16 border border-black/10 p-2 dark:border-white/10">
                時限
              </th>
              {DAY_OPTIONS.map((day) => (
                <th
                  key={day}
                  className="border border-black/10 p-2 dark:border-white/10"
                >
                  {DAY_LABELS_JA[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <th className="border border-black/10 p-2 text-left font-normal dark:border-white/10">
                  {period.label}
                  <div className="text-xs opacity-60">
                    {period.startTime}〜{period.endTime}
                  </div>
                </th>
                {DAY_OPTIONS.map((day) => {
                  const entry = findEntry(day, period);
                  return (
                    <td
                      key={day}
                      className="border border-black/10 p-1 align-top dark:border-white/10"
                    >
                      {entry ? (
                        <div className="bg-primary/90 relative rounded p-1.5 pr-5 text-white">
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            aria-label={`${DAY_LABELS_JA[day]}曜${period.label}を削除`}
                            className="absolute top-0.5 right-1 text-xs leading-none text-white/70 hover:text-white"
                          >
                            ×
                          </button>
                          <input
                            type="text"
                            placeholder="科目名(任意)"
                            value={entry.subject}
                            onChange={(event) =>
                              updateSubject(entry.id, event.target.value)
                            }
                            className="w-full rounded border-0 bg-white/20 px-1.5 py-1 text-xs text-white placeholder-white/70 focus:bg-white/30 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => registerCell(day, period)}
                          aria-label={`${DAY_LABELS_JA[day]}曜${period.label}を登録`}
                          className="h-9 w-full rounded hover:bg-black/5 dark:hover:bg-white/5"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
