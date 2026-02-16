import { yyyyMmDdLocal, startOfDayLocal } from "../../dateUtils";
import { isVacationDay } from "../../vacationDays";
import { LEGACY_MAP } from "./constants";
import type { HabitHistoryMap } from "./types";

export const isFiniteNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v);

export const asNumOrNull = (v: unknown) =>
  isFiniteNum(v) ? (v as number) : null;

export const safeAvg = (num: number, den: number) => (den > 0 ? num / den : 0);

export const minutesSince = (iso?: string | null) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
};

export function getHabitStreak(habitName: string, historyMap: HabitHistoryMap) {
  let streak = 0;
  let cursor = new Date(startOfDayLocal(new Date()));
  for (let i = 0; i < 3660; i++) {
    const key = yyyyMmDdLocal(cursor);
    if (isVacationDay(key)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    const day = historyMap[key];
    if (!day || !day[habitName]) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function getStudyValFrom(k: string, data: Record<string, any>) {
  const study = (data && data.study) || {};
  if (isFiniteNum(study[k])) return study[k];
  const legacyKey = LEGACY_MAP[k];
  if (legacyKey && isFiniteNum(study[legacyKey])) return study[legacyKey];
  return 0;
}
