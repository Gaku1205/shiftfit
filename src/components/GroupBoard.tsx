import { formatDateJa, formatTimeRange } from "@/lib/format";
import type { Group } from "@/lib/types";

interface GroupBoardProps {
  group: Group;
}

const MEMBER_ACCENTS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-violet-500",
  "border-l-cyan-500",
];

export function GroupBoard({ group }: GroupBoardProps) {
  if (group.members.length === 0) {
    return <p className="text-sm opacity-60">まだメンバーがいません。</p>;
  }

  return (
    <div className="space-y-4">
      {group.members.map((member, index) => (
        <div
          key={member.id}
          className={`${MEMBER_ACCENTS[index % MEMBER_ACCENTS.length]} rounded border-l-4 bg-black/[0.02] p-3 dark:bg-white/[0.03]`}
        >
          <h3 className="font-medium">
            {member.name}
            {member.isSelf && (
              <span className="ml-2 text-xs opacity-60">(自分)</span>
            )}
          </h3>
          {member.shiftEntries.length === 0 ? (
            <p className="mt-1 text-sm opacity-60">
              {member.isSelf
                ? "シフト未公開または未選択です"
                : "シフト未登録"}
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm">
              {[...member.shiftEntries]
                .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
                .map((entry) => (
                  <li key={entry.id}>
                    {formatDateJa(entry.date)} {entry.workplaceName}{" "}
                    {formatTimeRange(entry.startTime, entry.endTime)}
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
