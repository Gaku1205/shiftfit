"use client";

import type { UserProfile, Workplace } from "@/lib/types";

interface WorkplaceListEditorProps {
  value: UserProfile;
  onChange: (next: UserProfile) => void;
}

function createEmptyWorkplace(): Workplace {
  return {
    id: crypto.randomUUID(),
    name: "",
    hourlyRate: 1000,
    cutoffDay: 31,
    payday: { day: 10, monthOffset: 1 },
  };
}

export function WorkplaceListEditor({ value, onChange }: WorkplaceListEditorProps) {
  const addWorkplace = () => {
    onChange({ ...value, workplaces: [...value.workplaces, createEmptyWorkplace()] });
  };

  const updateWorkplace = (id: string, patch: Partial<Workplace>) => {
    onChange({
      ...value,
      workplaces: value.workplaces.map((workplace) =>
        workplace.id === id ? { ...workplace, ...patch } : workplace,
      ),
    });
  };

  const removeWorkplace = (id: string) => {
    onChange({
      ...value,
      workplaces: value.workplaces.filter((workplace) => workplace.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <label className="block text-sm">
        扶養控除の上限額(円/年)
        <input
          type="number"
          className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
          value={value.supportLimit}
          onChange={(event) =>
            onChange({ ...value, supportLimit: Number(event.target.value) })
          }
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.privacySettings.showScheduleToGroup}
          onChange={(event) =>
            onChange({
              ...value,
              privacySettings: { showScheduleToGroup: event.target.checked },
            })
          }
        />
        グループに自分のシフトを公開する
      </label>

      <div className="space-y-4">
        <h3 className="font-semibold">職場一覧</h3>
        {value.workplaces.length === 0 && (
          <p className="text-sm opacity-60">まだ職場が登録されていません。</p>
        )}
        {value.workplaces.map((workplace) => (
          <div
            key={workplace.id}
            className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex items-start gap-2">
              <input
                type="text"
                placeholder="職場名(例: XXX塾)"
                className="flex-1 rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
                value={workplace.name}
                onChange={(event) =>
                  updateWorkplace(workplace.id, { name: event.target.value })
                }
              />
              <button
                type="button"
                onClick={() => removeWorkplace(workplace.id)}
                className="text-danger text-sm"
              >
                削除
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                時給(円)
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
                  value={workplace.hourlyRate}
                  onChange={(event) =>
                    updateWorkplace(workplace.id, {
                      hourlyRate: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                締め日(月末は31)
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
                  value={workplace.cutoffDay}
                  onChange={(event) =>
                    updateWorkplace(workplace.id, {
                      cutoffDay: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                給料日
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
                  value={workplace.payday.day}
                  onChange={(event) =>
                    updateWorkplace(workplace.id, {
                      payday: { ...workplace.payday, day: Number(event.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-sm">
                支払月
                <select
                  className="mt-1 w-full rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black/20"
                  value={workplace.payday.monthOffset}
                  onChange={(event) =>
                    updateWorkplace(workplace.id, {
                      payday: {
                        ...workplace.payday,
                        monthOffset: Number(event.target.value) === 1 ? 1 : 0,
                      },
                    })
                  }
                >
                  <option value={0}>締め月と同月</option>
                  <option value={1}>翌月</option>
                </select>
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addWorkplace}
          className="w-full rounded border border-dashed border-black/30 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/30 dark:hover:bg-white/5"
        >
          + 職場を追加
        </button>
      </div>
    </div>
  );
}
