import type {
  ClassScheduleState,
  ComputedShiftPattern,
  GroupsState,
  SetupProgress,
  ShiftGoal,
  UserProfile,
} from "./types";

export const DEFAULT_SUPPORT_LIMIT = 1_030_000;

export const EMPTY_PROFILE: UserProfile = {
  workplaces: [],
  supportLimit: DEFAULT_SUPPORT_LIMIT,
  privacySettings: { showScheduleToGroup: true },
};

export const EMPTY_CLASS_SCHEDULE: ClassScheduleState = {
  classes: [],
  oneOffClasses: [],
};

export const EMPTY_SHIFT_GOAL: ShiftGoal = {
  currentMonth: "",
  targetSalary: 50000,
  maxHoursPerDay: 6,
  maxDaysPerWeek: 4,
  avoidDays: [],
  preferredWorkplaceId: null,
};

export const EMPTY_GROUPS_STATE: GroupsState = {
  groups: [],
  activeGroupId: null,
};

export const INITIAL_SETUP_PROGRESS: SetupProgress = {
  profile: false,
  classSchedule: false,
  goal: false,
};

export const EMPTY_SELECTED_PATTERN: ComputedShiftPattern | null = null;
