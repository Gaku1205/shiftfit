import type {
  ClassEntry,
  ClassScheduleState,
  ComputedShiftPattern,
  DayOfWeek,
  Group,
  GroupMember,
  GroupMemberShiftEntry,
  GroupsState,
  OneOffClass,
  PayoutEntry,
  SetupProgress,
  ShiftGoal,
  SupportCheck,
  UserProfile,
  Workplace,
} from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isDayOfWeek(value: unknown): value is DayOfWeek {
  return (
    isNumber(value) && Number.isInteger(value) && value >= 0 && value <= 6
  );
}

export function isWorkplace(value: unknown): value is Workplace {
  if (!isObject(value)) return false;
  const { id, name, hourlyRate, cutoffDay, payday } = value;
  if (
    !isString(id) ||
    !isString(name) ||
    !isNumber(hourlyRate) ||
    !isNumber(cutoffDay)
  ) {
    return false;
  }
  if (!isObject(payday)) return false;
  const { day, monthOffset } = payday;
  if (!isNumber(day)) return false;
  if (monthOffset !== 0 && monthOffset !== 1) return false;
  return true;
}

export function isUserProfile(value: unknown): value is UserProfile {
  if (!isObject(value)) return false;
  const { workplaces, supportLimit, privacySettings } = value;
  if (!Array.isArray(workplaces) || !workplaces.every(isWorkplace)) {
    return false;
  }
  if (!isNumber(supportLimit)) return false;
  if (!isObject(privacySettings)) return false;
  if (!isBoolean(privacySettings.showScheduleToGroup)) return false;
  return true;
}

export function isClassEntry(value: unknown): value is ClassEntry {
  if (!isObject(value)) return false;
  const { id, dayOfWeek, startTime, endTime, subject, skipDates } = value;
  if (
    !isString(id) ||
    !isDayOfWeek(dayOfWeek) ||
    !isString(startTime) ||
    !isString(endTime) ||
    !isString(subject)
  ) {
    return false;
  }
  if (
    skipDates !== undefined &&
    (!Array.isArray(skipDates) || !skipDates.every(isString))
  ) {
    return false;
  }
  return true;
}

export function isOneOffClass(value: unknown): value is OneOffClass {
  if (!isObject(value)) return false;
  const { id, date, startTime, endTime, subject } = value;
  return (
    isString(id) &&
    isString(date) &&
    isString(startTime) &&
    isString(endTime) &&
    isString(subject)
  );
}

export function isClassScheduleState(
  value: unknown,
): value is ClassScheduleState {
  if (!isObject(value)) return false;
  const { classes, oneOffClasses } = value;
  return (
    Array.isArray(classes) &&
    classes.every(isClassEntry) &&
    Array.isArray(oneOffClasses) &&
    oneOffClasses.every(isOneOffClass)
  );
}

export function isShiftGoal(value: unknown): value is ShiftGoal {
  if (!isObject(value)) return false;
  const {
    currentMonth,
    targetSalary,
    maxHoursPerDay,
    maxDaysPerWeek,
    avoidDays,
    preferredWorkplaceId,
  } = value;
  if (
    !isString(currentMonth) ||
    !isNumber(targetSalary) ||
    !isNumber(maxHoursPerDay) ||
    !isNumber(maxDaysPerWeek)
  ) {
    return false;
  }
  if (!Array.isArray(avoidDays) || !avoidDays.every(isDayOfWeek)) {
    return false;
  }
  if (preferredWorkplaceId !== null && !isString(preferredWorkplaceId)) {
    return false;
  }
  return true;
}

export function isSetupProgress(value: unknown): value is SetupProgress {
  if (!isObject(value)) return false;
  const { profile, classSchedule, goal } = value;
  return isBoolean(profile) && isBoolean(classSchedule) && isBoolean(goal);
}

function isGroupMemberShiftEntry(
  value: unknown,
): value is GroupMemberShiftEntry {
  if (!isObject(value)) return false;
  const { id, date, workplaceName, startTime, endTime } = value;
  return (
    isString(id) &&
    isString(date) &&
    isString(workplaceName) &&
    isString(startTime) &&
    isString(endTime)
  );
}

function isGroupMember(value: unknown): value is GroupMember {
  if (!isObject(value)) return false;
  const { id, name, isSelf, shiftEntries } = value;
  return (
    isString(id) &&
    isString(name) &&
    isBoolean(isSelf) &&
    Array.isArray(shiftEntries) &&
    shiftEntries.every(isGroupMemberShiftEntry)
  );
}

function isGroup(value: unknown): value is Group {
  if (!isObject(value)) return false;
  const { id, name, type, members } = value;
  return (
    isString(id) &&
    isString(name) &&
    isString(type) &&
    Array.isArray(members) &&
    members.every(isGroupMember)
  );
}

export function isGroupsState(value: unknown): value is GroupsState {
  if (!isObject(value)) return false;
  const { groups, activeGroupId } = value;
  if (!Array.isArray(groups) || !groups.every(isGroup)) return false;
  if (activeGroupId !== null && !isString(activeGroupId)) return false;
  return true;
}

function isSupportCheck(value: unknown): value is SupportCheck {
  if (!isObject(value)) return false;
  const { projectedAnnual, exceedsLimit, marginRemaining } = value;
  return (
    isNumber(projectedAnnual) &&
    isBoolean(exceedsLimit) &&
    isNumber(marginRemaining)
  );
}

function isPayoutEntry(value: unknown): value is PayoutEntry {
  if (!isObject(value)) return false;
  const { workplaceId, payoutDate, hours, amount } = value;
  return (
    isString(workplaceId) &&
    isString(payoutDate) &&
    isNumber(hours) &&
    isNumber(amount)
  );
}

function isShiftPickShape(value: unknown): boolean {
  if (!isObject(value)) return false;
  const { date, workplaceId, startTime, endTime } = value;
  return (
    isString(date) &&
    isString(workplaceId) &&
    isString(startTime) &&
    isString(endTime)
  );
}

export function isComputedShiftPattern(
  value: unknown,
): value is ComputedShiftPattern {
  if (!isObject(value)) return false;
  const {
    patternId,
    name,
    description,
    shifts,
    totalHours,
    estimatedSalary,
    supportCheck,
    exceedsMaxDaysPerWeek,
    payoutSchedule,
  } = value;
  return (
    isString(patternId) &&
    isString(name) &&
    isString(description) &&
    Array.isArray(shifts) &&
    shifts.every(isShiftPickShape) &&
    isNumber(totalHours) &&
    isNumber(estimatedSalary) &&
    isSupportCheck(supportCheck) &&
    isBoolean(exceedsMaxDaysPerWeek) &&
    Array.isArray(payoutSchedule) &&
    payoutSchedule.every(isPayoutEntry)
  );
}

export function isComputedShiftPatternOrNull(
  value: unknown,
): value is ComputedShiftPattern | null {
  return value === null || isComputedShiftPattern(value);
}
