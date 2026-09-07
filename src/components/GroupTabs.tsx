"use client";

import { useState } from "react";
import type { Group, GroupsState } from "@/lib/types";

interface GroupTabsProps {
  value: GroupsState;
  onChange: (next: GroupsState) => void;
}

function createEmptyGroup(name: string, type: string): Group {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    members: [
      { id: crypto.randomUUID(), name: "自分", isSelf: true, shiftEntries: [] },
    ],
  };
}

export function GroupTabs({ value, onChange }: GroupTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const selectGroup = (groupId: string) => {
    onChange({ ...value, activeGroupId: groupId });
  };

  const addGroup = () => {
    const name = newName.trim();
    if (!name) return;
    const group = createEmptyGroup(name, "custom");
    onChange({ groups: [...value.groups, group], activeGroupId: group.id });
    setNewName("");
    setIsAdding(false);
  };

  const removeGroup = (groupId: string) => {
    const groups = value.groups.filter((group) => group.id !== groupId);
    const activeGroupId =
      value.activeGroupId === groupId ? (groups[0]?.id ?? null) : value.activeGroupId;
    onChange({ groups, activeGroupId });
  };

  return (
    <div className="print:hidden flex flex-wrap items-center gap-2">
      {value.groups.map((group) => (
        <div key={group.id} className="flex items-center">
          <button
            type="button"
            onClick={() => selectGroup(group.id)}
            className={
              value.activeGroupId === group.id
                ? "rounded-l bg-primary px-3 py-1.5 text-sm text-white"
                : "rounded-l border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
            }
          >
            {group.name}
          </button>
          <button
            type="button"
            onClick={() => removeGroup(group.id)}
            aria-label={`${group.name}を削除`}
            className={
              value.activeGroupId === group.id
                ? "rounded-r bg-primary px-2 py-1.5 text-sm text-white/70 hover:text-white"
                : "rounded-r border border-l-0 border-black/20 px-2 py-1.5 text-sm opacity-60 hover:opacity-100 dark:border-white/20"
            }
          >
            ×
          </button>
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            autoFocus
            placeholder="グループ名"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addGroup();
              if (event.key === "Escape") setIsAdding(false);
            }}
            className="rounded border border-black/20 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black/20"
          />
          <button
            type="button"
            onClick={addGroup}
            className="rounded bg-primary px-2 py-1.5 text-sm text-white"
          >
            追加
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="rounded border border-dashed border-black/30 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/30 dark:hover:bg-white/5"
        >
          + グループを追加
        </button>
      )}
    </div>
  );
}
