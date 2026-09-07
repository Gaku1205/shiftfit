"use client";

import {
  EMPTY_CLASS_SCHEDULE,
  EMPTY_GROUPS_STATE,
  EMPTY_PROFILE,
  EMPTY_SELECTED_PATTERN,
  EMPTY_SHIFT_GOAL,
  INITIAL_SETUP_PROGRESS,
} from "@/lib/defaults";
import { STORAGE_KEYS } from "@/lib/storage";
import {
  isClassScheduleState,
  isComputedShiftPatternOrNull,
  isGroupsState,
  isSetupProgress,
  isShiftGoal,
  isUserProfile,
} from "@/lib/validators";
import { useLocalStorageState } from "./useLocalStorageState";

export function useProfile() {
  return useLocalStorageState(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE,
    isUserProfile,
  );
}

export function useClassSchedule() {
  return useLocalStorageState(
    STORAGE_KEYS.classSchedule,
    EMPTY_CLASS_SCHEDULE,
    isClassScheduleState,
  );
}

export function useShiftGoal() {
  return useLocalStorageState(
    STORAGE_KEYS.shiftGoal,
    EMPTY_SHIFT_GOAL,
    isShiftGoal,
  );
}

export function useGroups() {
  return useLocalStorageState(
    STORAGE_KEYS.groups,
    EMPTY_GROUPS_STATE,
    isGroupsState,
  );
}

export function useSetupProgress() {
  return useLocalStorageState(
    STORAGE_KEYS.setupProgress,
    INITIAL_SETUP_PROGRESS,
    isSetupProgress,
  );
}

export function useSelectedPattern() {
  return useLocalStorageState(
    STORAGE_KEYS.selectedPattern,
    EMPTY_SELECTED_PATTERN,
    isComputedShiftPatternOrNull,
  );
}
