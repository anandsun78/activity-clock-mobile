import AsyncStorage from "@react-native-async-storage/async-storage";
import { yyyyMmDdLocal } from "../dateUtils";
import type { DayLog } from "../components/activity/types";
import type { HabitData, HabitHistoryMap } from "../components/habitTracker/types";

const KEY_ACTIVITY_NAMES = "activity_clock_activity_names";
const KEY_LAST_STOP = "activity_clock_last_stop";
const KEY_ACTIVITY_LOG_PREFIX = "activity_log_";
const KEY_HABIT_PREFIX = "habit_";

const keyActivityLog = (date: string) => `${KEY_ACTIVITY_LOG_PREFIX}${date}`;
const keyHabit = (date: string) => `${KEY_HABIT_PREFIX}${date}`;

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getActivityNames(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY_ACTIVITY_NAMES);
  const data = safeJsonParse<string[]>(raw, []);
  return Array.isArray(data) ? data : [];
}

export async function addActivityName(name: string): Promise<string[]> {
  const clean = (name || "").trim();
  if (!clean) return getActivityNames();
  const normalized = clean[0].toUpperCase() + clean.slice(1);
  const current = await getActivityNames();
  if (current.includes(normalized)) return current;
  const next = [...current, normalized].sort((a, b) => a.localeCompare(b));
  await AsyncStorage.setItem(KEY_ACTIVITY_NAMES, JSON.stringify(next));
  return next;
}

export async function getActivityLog(date: string): Promise<DayLog> {
  const raw = await AsyncStorage.getItem(keyActivityLog(date));
  const log = safeJsonParse<DayLog>(raw, { date, sessions: [] });
  if (!log || typeof log !== "object") return { date, sessions: [] };
  return { date, sessions: Array.isArray(log.sessions) ? log.sessions : [] };
}

export async function saveActivityLog(log: DayLog): Promise<DayLog> {
  const next = {
    date: log.date,
    sessions: Array.isArray(log.sessions) ? log.sessions : [],
  };
  await AsyncStorage.setItem(keyActivityLog(log.date), JSON.stringify(next));
  return next;
}

export async function appendActivitySession(
  date: string,
  session: { start: string | Date; end: string | Date; activity: string }
): Promise<DayLog> {
  const log = await getActivityLog(date);
  const next = {
    start: new Date(session.start).toISOString(),
    end: new Date(session.end).toISOString(),
    activity: String(session.activity || "").trim(),
  };
  const updated = { ...log, sessions: [...log.sessions, next] };
  return saveActivityLog(updated);
}

export async function deleteActivitySession(
  date: string,
  session: { start: string; end: string; activity: string }
): Promise<DayLog> {
  const log = await getActivityLog(date);
  const updated = {
    ...log,
    sessions: (log.sessions || []).filter((s) => {
      return !(
        new Date(s.start).getTime() === new Date(session.start).getTime() &&
        new Date(s.end).getTime() === new Date(session.end).getTime() &&
        s.activity === session.activity
      );
    }),
  };
  return saveActivityLog(updated);
}

function listDatesInRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(start + "T00:00:00");
  const endKey = end;
  for (let i = 0; i < 40000; i++) {
    const key = yyyyMmDdLocal(cursor);
    if (key > endKey) break;
    dates.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function getActivityLogsRange(
  start: string,
  end: string
): Promise<DayLog[]> {
  const dates = listDatesInRange(start, end);
  const keys = dates.map((d) => keyActivityLog(d));
  const entries = await AsyncStorage.multiGet(keys);
  const map = new Map(entries);
  return dates.map((date) => {
    const raw = map.get(keyActivityLog(date)) ?? null;
    const log = safeJsonParse<DayLog>(raw, { date, sessions: [] });
    return log && log.date ? log : { date, sessions: [] };
  });
}

export async function getHabitData(date: string): Promise<HabitData> {
  const raw = await AsyncStorage.getItem(keyHabit(date));
  const data = safeJsonParse<HabitData>(raw, {});
  return data && typeof data === "object" ? data : {};
}

export async function setHabitData(
  date: string,
  data: HabitData
): Promise<void> {
  await AsyncStorage.setItem(keyHabit(date), JSON.stringify(data || {}));
}

export async function getHabitHistory(
  start: string,
  end: string
): Promise<HabitHistoryMap> {
  const dates = listDatesInRange(start, end);
  const keys = dates.map((d) => keyHabit(d));
  const entries = await AsyncStorage.multiGet(keys);
  const map = new Map(entries);
  const out: HabitHistoryMap = {};
  for (const date of dates) {
    const raw = map.get(keyHabit(date));
    if (!raw) continue;
    const data = safeJsonParse<HabitData>(raw, {});
    if (data && typeof data === "object") out[date] = data;
  }
  return out;
}

export async function getLastStop(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_LAST_STOP);
  } catch {
    return null;
  }
}

export async function setLastStop(value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_LAST_STOP, value);
  } catch {
    // ignore
  }
}
