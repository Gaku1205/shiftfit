"use client";

import { useState } from "react";
import type { Group, GroupMember, GroupMemberShiftEntry } from "@/lib/types";

interface GroupMemberFormProps {
  group: Group;
  onChange: (next: Group) => void;
}

function createEmptyMember(name: string): GroupMember {
  return { id: crypto.randomUUID(), name, isSelf: false, shiftEntries: [] };
}

function createEmptyShiftEntry(): GroupMemberShiftEntry {
  return {
    id: crypto.randomUUID(),
    date: "",
    workplaceName: "",
    startTime: "09:00",
    endTime: "17:00",
  };
}

export function GroupMemberForm({ group, onChange }: GroupMemberFormProps) {
  const [newMemberName, setNewMemberName] = useState("");

  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    onChange({ ...group, members: [...group.members, createEmptyMember(name)] });
    setNewMemberName("");
  };

  const removeMember = (memberId: string) => {
    onChange({
      ...group,
      members: group.members.filter((member) => member.id !== memberId),
    });
  };

  const addShiftEntry = (memberId: string) => {
    onChange({
      ...group,
      members: group.members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              shiftEntries: [...member.shiftEntries, createEmptyShiftEntry()],
            }
          : member,
      ),
    });
  };

  const updateShiftEntry = (
    memberId: string,
    entryId: string,
    patch: Partial<GroupMemberShiftEntry>,
  ) => {
    onChange({
      ...group,
      members: group.members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              shiftEntries: member.shiftEntries.map((entry) =>
                entry.id === entryId ? { ...entry, ...patch } : entry,
              ),
            }
          : member,
      ),
    });
  };

  const removeShiftEntry = (memberId: string, entryId: string) => {
    onChange({
      ...group,
      members: group.members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              shiftEntries: member.shiftEntries.filter(
                (entry) => entry.id !== entryId,
              ),
            }
          : member,
      ),
    });
  };

  const nonSelfMembers = group.members.filter((member) => !member.isSelf);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="仲間の名前"
          value={newMemberName}
          onChange={(event) => setNewMemberName(event.target.value)}
          className="flex-1 rounded border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-black/20"
        />
        <button
          type="button"
          onClick={addMember}
          className="rounded bg-primary px-4 py-2 text-sm text-white"
        >
          メンバーを追加
        </button>
      </div>

      {nonSelfMembers.length === 0 && (
        <p className="text-sm opacity-60">
          まだ仲間が登録されていません。名前を入力して追加してください。
        </p>
      )}

      {nonSelfMembers.map((member) => (
        <div
          key={member.id}
          className="space-y-2 rounded border border-black/10 p-3 dark:border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{member.name}</span>
            <button
              type="button"
              onClick={() => removeMember(member.id)}
              className="text-danger text-xs"
            >
              メンバーを削除
            </button>
          </div>
          {member.shiftEntries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-2 text-sm"
            >
              <input
                type="date"
                value={entry.date}
                onChange={(event) =>
                  updateShiftEntry(member.id, entry.id, { date: event.target.value })
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
              <input
                type="text"
                placeholder="職場名"
                value={entry.workplaceName}
                onChange={(event) =>
                  updateShiftEntry(member.id, entry.id, {
                    workplaceName: event.target.value,
                  })
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
              <input
                type="time"
                value={entry.startTime}
                onChange={(event) =>
                  updateShiftEntry(member.id, entry.id, {
                    startTime: event.target.value,
                  })
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
              <input
                type="time"
                value={entry.endTime}
                onChange={(event) =>
                  updateShiftEntry(member.id, entry.id, { endTime: event.target.value })
                }
                className="rounded border border-black/20 px-2 py-1 dark:border-white/20 dark:bg-black/20"
              />
              <button
                type="button"
                onClick={() => removeShiftEntry(member.id, entry.id)}
                className="text-danger"
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addShiftEntry(member.id)}
            className="w-full rounded border border-dashed border-black/30 px-3 py-1.5 text-xs hover:bg-black/5 dark:border-white/30 dark:hover:bg-white/5"
          >
            + シフトを追加
          </button>
        </div>
      ))}
    </div>
  );
}
