"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GroupBoard } from "@/components/GroupBoard";
import { GroupMemberForm } from "@/components/GroupMemberForm";
import { GroupTabs } from "@/components/GroupTabs";
import {
  useGroups,
  useProfile,
  useSelectedPattern,
  useSetupProgress,
} from "@/hooks/useAppStorage";
import type {
  ComputedShiftPattern,
  Group,
  GroupMemberShiftEntry,
  Workplace,
} from "@/lib/types";

function resolveGroupForDisplay(
  group: Group,
  selectedPattern: ComputedShiftPattern | null,
  workplaces: Workplace[],
  showScheduleToGroup: boolean,
): Group {
  return {
    ...group,
    members: group.members.map((member) => {
      if (!member.isSelf) return member;
      if (!showScheduleToGroup || !selectedPattern) {
        return { ...member, shiftEntries: [] };
      }
      const shiftEntries: GroupMemberShiftEntry[] = selectedPattern.shifts.map(
        (shift) => ({
          id: `${shift.date}-${shift.workplaceId}`,
          date: shift.date,
          workplaceName:
            workplaces.find((workplace) => workplace.id === shift.workplaceId)
              ?.name ?? "(不明な職場)",
          startTime: shift.startTime,
          endTime: shift.endTime,
        }),
      );
      return { ...member, shiftEntries };
    }),
  };
}

export default function GroupsPage() {
  const router = useRouter();
  const [profile, , isProfileHydrated] = useProfile();
  const [groups, setGroups, isGroupsHydrated] = useGroups();
  const [selectedPattern, , isSelectedPatternHydrated] = useSelectedPattern();
  const [setupProgress, , isProgressHydrated] = useSetupProgress();

  const isHydrated =
    isProfileHydrated &&
    isGroupsHydrated &&
    isSelectedPatternHydrated &&
    isProgressHydrated;

  useEffect(() => {
    if (isHydrated && !setupProgress.profile) {
      router.replace("/setup");
    }
  }, [isHydrated, setupProgress.profile, router]);

  if (!isHydrated) {
    return <div className="p-8 text-sm opacity-60">読み込み中...</div>;
  }

  if (!setupProgress.profile) {
    // /setup へのリダイレクト待ちの一瞬だけ表示される
    return null;
  }

  const activeGroup =
    groups.groups.find((group) => group.id === groups.activeGroupId) ?? null;

  const updateActiveGroup = (nextGroup: Group) => {
    setGroups({
      ...groups,
      groups: groups.groups.map((group) =>
        group.id === nextGroup.id ? nextGroup : group,
      ),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold">グループ</h1>
        <p className="mt-1 text-sm opacity-70">
          グループのメンバーと、それぞれのシフトを共有・確認できます(この端末内でのみ保存されます)。
        </p>
      </div>

      <GroupTabs value={groups} onChange={setGroups} />

      {!activeGroup && (
        <p className="text-sm opacity-60">
          まだグループがありません。上の「+ グループを追加」から作成してください。
        </p>
      )}

      {activeGroup && (
        <>
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-3 font-semibold">シフトボード</h2>
            <GroupBoard
              group={resolveGroupForDisplay(
                activeGroup,
                selectedPattern,
                profile.workplaces,
                profile.privacySettings.showScheduleToGroup,
              )}
            />
          </div>

          <div className="print:hidden rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-3 font-semibold">メンバーとシフトの編集</h2>
            <GroupMemberForm group={activeGroup} onChange={updateActiveGroup} />
          </div>
        </>
      )}
    </div>
  );
}
