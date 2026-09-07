"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExportPanel } from "@/components/ExportPanel";
import { PatternComparisonCard } from "@/components/PatternComparisonCard";
import { SalaryEstimatePanel } from "@/components/SalaryEstimatePanel";
import { ShiftGoalSummaryCard } from "@/components/ShiftGoalSummaryCard";
import { ShiftTable } from "@/components/ShiftTable";
import {
  useClassSchedule,
  useProfile,
  useSelectedPattern,
  useSetupProgress,
  useShiftGoal,
} from "@/hooks/useAppStorage";
import type { ComputedShiftPattern } from "@/lib/types";

interface OptimizeResponse {
  patterns?: ComputedShiftPattern[];
  error?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, , isProfileHydrated] = useProfile();
  const [classSchedule, , isClassScheduleHydrated] = useClassSchedule();
  const [shiftGoal, , isShiftGoalHydrated] = useShiftGoal();
  const [setupProgress, , isProgressHydrated] = useSetupProgress();
  const [selectedPattern, setSelectedPattern] = useSelectedPattern();

  const [patterns, setPatterns] = useState<ComputedShiftPattern[] | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHydrated =
    isProfileHydrated &&
    isClassScheduleHydrated &&
    isShiftGoalHydrated &&
    isProgressHydrated;
  const isSetupComplete = setupProgress.profile && setupProgress.goal;

  useEffect(() => {
    if (isHydrated && !isSetupComplete) {
      router.replace("/setup");
    }
  }, [isHydrated, isSetupComplete, router]);

  if (!isHydrated) {
    return <div className="p-8 text-sm opacity-60">読み込み中...</div>;
  }

  if (!isSetupComplete) {
    // /setup へのリダイレクト待ちの一瞬だけ表示される
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, classSchedule, shiftGoal }),
      });
      const data = (await response.json()) as OptimizeResponse;
      if (!response.ok || !data.patterns) {
        throw new Error(data.error ?? "シフト提案の生成に失敗しました");
      }
      setPatterns(data.patterns);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "不明なエラーが発生しました",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <ShiftGoalSummaryCard goal={shiftGoal} />

      <div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="print:hidden rounded bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {isGenerating ? "生成中..." : "候補プランを生成"}
        </button>
        {error && <p className="text-danger mt-2 text-sm">{error}</p>}
      </div>

      {patterns && patterns.length === 0 && (
        <p className="text-sm opacity-70">
          条件に合うシフト案が見つかりませんでした。目標や授業スケジュールを見直してください。
        </p>
      )}

      {patterns && patterns.length > 0 && (
        <div className="print:hidden grid gap-4 sm:grid-cols-2">
          {patterns.map((pattern) => (
            <PatternComparisonCard
              key={pattern.patternId}
              pattern={pattern}
              isSelected={selectedPattern?.patternId === pattern.patternId}
              onSelect={() => setSelectedPattern(pattern)}
            />
          ))}
        </div>
      )}

      {selectedPattern && (
        <div className="space-y-4">
          <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-2 font-semibold">
              シフト表: {selectedPattern.name}
            </h2>
            <ShiftTable pattern={selectedPattern} workplaces={profile.workplaces} />
          </div>
          <SalaryEstimatePanel
            pattern={selectedPattern}
            workplaces={profile.workplaces}
          />
          <ExportPanel pattern={selectedPattern} workplaces={profile.workplaces} />
        </div>
      )}
    </div>
  );
}
