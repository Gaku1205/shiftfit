"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClassScheduleEditor } from "@/components/ClassScheduleEditor";
import { ShiftGoalEditor } from "@/components/ShiftGoalEditor";
import { WorkplaceListEditor } from "@/components/WorkplaceListEditor";
import {
  useClassSchedule,
  useProfile,
  useSetupProgress,
  useShiftGoal,
} from "@/hooks/useAppStorage";

const STEPS = ["profile", "classSchedule", "goal"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  profile: "プロフィール",
  classSchedule: "授業スケジュール",
  goal: "シフト目標",
};

function defaultCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SetupPage() {
  const router = useRouter();
  const [profile, setProfile, isProfileHydrated] = useProfile();
  const [classSchedule, setClassSchedule, isClassScheduleHydrated] =
    useClassSchedule();
  const [shiftGoal, setShiftGoal, isShiftGoalHydrated] = useShiftGoal();
  const [setupProgress, setSetupProgress, isProgressHydrated] =
    useSetupProgress();

  // ハイドレーション前はsetupProgressが常に未完了扱いなので"profile"から始まるが、
  // ハイドレーション後は既存の進捗を反映して自動的に再計算される(useSyncExternalStoreによる再描画)。
  // manualStepを操作した以降はユーザーの手動ナビゲーションを優先する。
  const resumeStep: Step = !setupProgress.profile
    ? "profile"
    : !setupProgress.classSchedule
      ? "classSchedule"
      : "goal";
  const [manualStep, setManualStep] = useState<Step | null>(null);
  const step = manualStep ?? resumeStep;
  const stepIndex = STEPS.indexOf(step);

  const isHydrated =
    isProfileHydrated &&
    isClassScheduleHydrated &&
    isShiftGoalHydrated &&
    isProgressHydrated;

  const goNext = () => {
    if (step === "profile") {
      setSetupProgress((prev) => ({ ...prev, profile: true }));
      setManualStep("classSchedule");
    } else if (step === "classSchedule") {
      setSetupProgress((prev) => ({ ...prev, classSchedule: true }));
      setManualStep("goal");
    } else {
      if (!shiftGoal.currentMonth) {
        setShiftGoal({ ...shiftGoal, currentMonth: defaultCurrentMonth() });
      }
      setSetupProgress((prev) => ({ ...prev, goal: true }));
      router.push("/");
    }
  };

  const goBack = () => {
    if (step === "classSchedule") setManualStep("profile");
    else if (step === "goal") setManualStep("classSchedule");
  };

  if (!isHydrated) {
    return <div className="p-8 text-sm opacity-60">読み込み中...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-sm opacity-60">
          ステップ {stepIndex + 1} / {STEPS.length}: {STEP_LABELS[step]}
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === "profile" && (
        <WorkplaceListEditor value={profile} onChange={setProfile} />
      )}
      {step === "classSchedule" && (
        <ClassScheduleEditor value={classSchedule} onChange={setClassSchedule} />
      )}
      {step === "goal" && (
        <ShiftGoalEditor
          value={shiftGoal}
          onChange={setShiftGoal}
          workplaces={profile.workplaces}
        />
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          disabled={step === "profile"}
          className="rounded px-4 py-2 text-sm disabled:opacity-30"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={goNext}
          className="rounded bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          {step === "goal" ? "完了してダッシュボードへ" : "次へ"}
        </button>
      </div>
    </div>
  );
}
