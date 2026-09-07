import { buildAvailability } from "@/lib/availability";
import { recomputePatterns } from "@/lib/salary";
import { proposeShiftPatterns } from "@/lib/shiftOptimizer";
import type { ComputedShiftPattern } from "@/lib/types";
import {
  isClassScheduleState,
  isShiftGoal,
  isUserProfile,
} from "@/lib/validators";

interface OptimizeRequestBody {
  profile?: unknown;
  classSchedule?: unknown;
  shiftGoal?: unknown;
}

interface OptimizeResult {
  patterns: ComputedShiftPattern[];
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as OptimizeRequestBody;
  const { profile, classSchedule, shiftGoal } = body;

  if (!isUserProfile(profile)) {
    return Response.json(
      { error: "profile の形式が不正です" },
      { status: 400 },
    );
  }
  if (!isClassScheduleState(classSchedule)) {
    return Response.json(
      { error: "classSchedule の形式が不正です" },
      { status: 400 },
    );
  }
  if (!isShiftGoal(shiftGoal)) {
    return Response.json(
      { error: "shiftGoal の形式が不正です" },
      { status: 400 },
    );
  }
  if (profile.workplaces.length === 0) {
    return Response.json(
      { error: "職場が1件も登録されていません" },
      { status: 400 },
    );
  }
  if (!shiftGoal.currentMonth) {
    return Response.json(
      { error: "対象月が設定されていません" },
      { status: 400 },
    );
  }

  try {
    const candidates = buildAvailability(classSchedule, shiftGoal);
    const rawPatterns = await proposeShiftPatterns(
      candidates,
      profile.workplaces,
      shiftGoal,
    );
    const patterns = recomputePatterns(
      rawPatterns,
      candidates,
      profile.workplaces,
      shiftGoal,
      profile.supportLimit,
    );

    const result: OptimizeResult = { patterns };
    return Response.json(result);
  } catch (error) {
    console.error("[/api/optimize] failed:", error);
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
