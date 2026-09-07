import Anthropic from "@anthropic-ai/sdk";
import type {
  AvailabilitySlot,
  RawShiftPattern,
  ShiftGoal,
  Workplace,
} from "./types";

const MODEL = "claude-sonnet-5";

function buildRecordShiftPatternsTool(
  candidateDates: string[],
  workplaceIds: string[],
): Anthropic.Tool {
  return {
    name: "record_shift_patterns",
    description:
      "候補となる空き時間枠(日付ごとの利用可能な時間範囲)から、傾向の異なる2〜3種類のシフト案を作成して記録する",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        patterns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "日本語のプラン名(例: 効率重視プラン、ゆったりプラン)",
              },
              description: {
                type: "string",
                description: "このプランの特徴を1〜2文で説明する",
              },
              shifts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: {
                      type: "string",
                      enum: candidateDates,
                      description: "候補一覧のdateの中から選ぶこと",
                    },
                    workplaceId: {
                      type: "string",
                      enum: workplaceIds,
                      description: "職場一覧のworkplaceIdの中から選ぶこと",
                    },
                    startTime: {
                      type: "string",
                      description:
                        "HH:mm形式。その日の候補時間枠の範囲内に収めること",
                    },
                    endTime: {
                      type: "string",
                      description:
                        "HH:mm形式。startTimeより後で、候補時間枠の範囲内に収めること",
                    },
                  },
                  required: ["date", "workplaceId", "startTime", "endTime"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "description", "shifts"],
            additionalProperties: false,
          },
        },
      },
      required: ["patterns"],
      additionalProperties: false,
    },
  };
}

function buildUserPrompt(
  candidates: AvailabilitySlot[],
  workplaces: Workplace[],
  shiftGoal: ShiftGoal,
): string {
  const candidateLines = candidates
    .map((slot) => `- ${slot.date}: ${slot.startTime}〜${slot.endTime}`)
    .join("\n");
  const workplaceLines = workplaces
    .map((wp) => `- ${wp.id}: ${wp.name}(時給${wp.hourlyRate}円)`)
    .join("\n");
  const preferredLine = shiftGoal.preferredWorkplaceId
    ? `- 優先したい職場ID: ${shiftGoal.preferredWorkplaceId}\n`
    : "";
  const avoidLine =
    shiftGoal.avoidDays.length > 0
      ? `(避けたい曜日は候補一覧作成時点で既に除外済みです)\n`
      : "";

  return `大学生のアルバイトのシフトを提案してください。

【候補となる空き時間枠】(この日付・時間帯の中からしか選べません)
${candidateLines}

【職場一覧】
${workplaceLines}

【今月の目標】
- 目標収入: ${shiftGoal.targetSalary}円
- 1日の最大労働時間: ${shiftGoal.maxHoursPerDay}時間
- 週の最大出勤日数: ${shiftGoal.maxDaysPerWeek}日
${preferredLine}${avoidLine}
傾向の異なる2〜3パターンのシフト案(例: 最短日数で目標達成を目指す案、複数日に分散して余裕を持たせる案など)を作成してください。各シフトの時間帯は、対応する日付の候補時間枠の範囲内に必ず収めてください。`;
}

function isRawShiftPickShape(
  value: unknown,
): value is RawShiftPattern["shifts"][number] {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.date === "string" &&
    typeof record.workplaceId === "string" &&
    typeof record.startTime === "string" &&
    typeof record.endTime === "string"
  );
}

function isRawShiftPattern(value: unknown): value is RawShiftPattern {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    Array.isArray(record.shifts) &&
    record.shifts.every(isRawShiftPickShape)
  );
}

function isRawShiftPatternsInput(
  value: unknown,
): value is { patterns: RawShiftPattern[] } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.patterns) && record.patterns.every(isRawShiftPattern)
  );
}

/**
 * 候補空き時間枠(availability.ts で生成)から、Claude APIに複数のシフト案を提案させる。
 * 数値の集計(合計時間・給与・扶養控除判定)はここでは行わない — salary.ts で再計算する。
 */
export async function proposeShiftPatterns(
  candidates: AvailabilitySlot[],
  workplaces: Workplace[],
  shiftGoal: ShiftGoal,
): Promise<RawShiftPattern[]> {
  if (candidates.length === 0) {
    throw new Error(
      "シフトを提案できる空き時間枠がありません。授業スケジュールや避けたい曜日の設定を見直してください。",
    );
  }
  if (workplaces.length === 0) {
    throw new Error("職場が1件も登録されていません。");
  }

  const candidateDates = [...new Set(candidates.map((slot) => slot.date))];
  const workplaceIds = workplaces.map((workplace) => workplace.id);
  const tool = buildRecordShiftPatternsTool(candidateDates, workplaceIds);

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [
      {
        role: "user",
        content: buildUserPrompt(candidates, workplaces, shiftGoal),
      },
    ],
  });

  const toolUseBlock = response.content.find(
    (block) => block.type === "tool_use",
  );
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error(
      "Claude APIからシフト案を取得できませんでした(tool_useブロックが見つかりません)",
    );
  }

  if (!isRawShiftPatternsInput(toolUseBlock.input)) {
    throw new Error("Claude APIの応答が期待した構造と一致しませんでした");
  }

  return toolUseBlock.input.patterns;
}
