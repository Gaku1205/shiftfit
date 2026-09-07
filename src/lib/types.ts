export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=日 1=月 2=火 3=水 4=木 5=金 6=土

export const DAY_LABELS_JA: Record<DayOfWeek, string> = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

export interface Workplace {
  id: string;
  name: string;
  hourlyRate: number;
  /** 1-31。月の実日数を超える場合は月末に丸める(例: 2月に31を指定→28/29日) */
  cutoffDay: number;
  payday: { day: number; monthOffset: 0 | 1 };
}

export interface UserProfile {
  workplaces: Workplace[];
  supportLimit: number;
  privacySettings: { showScheduleToGroup: boolean };
}

export interface ClassEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  subject: string;
  /** この曜日パターンが休講になる日付(ISO yyyy-mm-dd)の一覧 */
  skipDates?: string[];
}

export interface OneOffClass {
  id: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string;
  endTime: string;
  subject: string;
}

export interface ClassScheduleState {
  classes: ClassEntry[];
  oneOffClasses: OneOffClass[];
}

export interface ShiftGoal {
  /** "" の場合は未設定(フォーム側で当日の月を初期値として補完する) */
  currentMonth: string; // "YYYY-MM"
  targetSalary: number;
  maxHoursPerDay: number;
  maxDaysPerWeek: number;
  avoidDays: DayOfWeek[];
  preferredWorkplaceId: string | null;
}

export interface AvailabilitySlot {
  date: string; // ISO yyyy-mm-dd
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ShiftPick {
  date: string;
  workplaceId: string;
  startTime: string;
  endTime: string;
}

/** Claude APIの生出力。数値の集計は一切含まない(salary.tsで再計算するため) */
export interface RawShiftPattern {
  name: string;
  description: string;
  shifts: ShiftPick[];
}

export interface PayoutEntry {
  workplaceId: string;
  payoutDate: string; // ISO yyyy-mm-dd
  hours: number;
  amount: number;
}

export interface SupportCheck {
  projectedAnnual: number;
  exceedsLimit: boolean;
  marginRemaining: number;
}

/** RawShiftPatternをTypeScript側で検証・再計算した結果 */
export interface ComputedShiftPattern {
  patternId: string;
  name: string;
  description: string;
  shifts: ShiftPick[];
  totalHours: number;
  estimatedSalary: number;
  supportCheck: SupportCheck;
  exceedsMaxDaysPerWeek: boolean;
  payoutSchedule: PayoutEntry[];
}

export interface GroupMemberShiftEntry {
  id: string;
  date: string;
  workplaceName: string;
  startTime: string;
  endTime: string;
}

export interface GroupMember {
  id: string;
  name: string;
  isSelf: boolean;
  shiftEntries: GroupMemberShiftEntry[];
}

export interface Group {
  id: string;
  name: string;
  type: string;
  members: GroupMember[];
}

export interface GroupsState {
  groups: Group[];
  activeGroupId: string | null;
}

export interface SetupProgress {
  profile: boolean;
  classSchedule: boolean;
  goal: boolean;
}
