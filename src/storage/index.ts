import AsyncStorage from "@react-native-async-storage/async-storage";
import { yyyyMmDdLocal } from "../dateUtils";
import type { DayLog } from "../components/activity/types";
import type { HabitData, HabitHistoryMap } from "../components/habitTracker/types";
import {
  ACTIVITY_LOGS_ENDPOINT,
  ACTIVITY_NAMES_ENDPOINT,
  CONTENT_TYPE_JSON,
  HABITS_ENDPOINT,
} from "../constants/api";

const KEY_LAST_STOP = "activity_clock_last_stop";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function fetchText(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  return { res, text };
}

export async function getActivityNames(): Promise<string[]> {
  try {
    const { res, text } = await fetchText(ACTIVITY_NAMES_ENDPOINT);
    if (!res.ok) return [];
    const data = safeJsonParse<string[]>(text, []);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getActivityNames failed", err);
    return [];
  }
}

export async function addActivityName(name: string): Promise<string[]> {
  const clean = (name || "").trim();
  if (!clean) return getActivityNames();
  const normalized = clean[0].toUpperCase() + clean.slice(1);
  const current = await getActivityNames();
  if (current.includes(normalized)) return current;
  try {
    const { res } = await fetchText(ACTIVITY_NAMES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": CONTENT_TYPE_JSON },
      body: JSON.stringify({ name: normalized }),
    });
    if (!res.ok) return current;
    const next = [...current, normalized].sort((a, b) => a.localeCompare(b));
    return next;
  } catch (err) {
    console.error("addActivityName failed", err);
    return current;
  }
}

export async function getActivityLog(date: string): Promise<DayLog> {
  try {
    const { res, text } = await fetchText(
      `${ACTIVITY_LOGS_ENDPOINT}?date=${encodeURIComponent(date)}`
    );
    if (!res.ok) return { date, sessions: [] };
    const data = safeJsonParse<DayLog>(text, { date, sessions: [] });
    if (!data || typeof data !== "object") return { date, sessions: [] };
    return {
      date,
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };
  } catch (err) {
    console.error("getActivityLog failed", err);
    return { date, sessions: [] };
  }
}

export async function appendActivitySession(
  date: string,
  session: { start: string | Date; end: string | Date; activity: string }
): Promise<DayLog> {
  const next = {
    start: new Date(session.start).toISOString(),
    end: new Date(session.end).toISOString(),
    activity: String(session.activity || "").trim(),
  };
  try {
    const { res, text } = await fetchText(
      `${ACTIVITY_LOGS_ENDPOINT}?date=${encodeURIComponent(date)}`,
      {
        method: "POST",
        headers: { "Content-Type": CONTENT_TYPE_JSON },
        body: JSON.stringify({ session: next }),
      }
    );
    if (!res.ok) return { date, sessions: [] };
    const data = safeJsonParse<DayLog>(text, { date, sessions: [] });
    return data && data.date ? data : { date, sessions: [] };
  } catch (err) {
    console.error("appendActivitySession failed", err);
    return { date, sessions: [] };
  }
}

export async function deleteActivitySession(
  date: string,
  session: { start: string; end: string; activity: string }
): Promise<DayLog> {
  try {
    const { res, text } = await fetchText(
      `${ACTIVITY_LOGS_ENDPOINT}?date=${encodeURIComponent(date)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": CONTENT_TYPE_JSON },
        body: JSON.stringify({ session }),
      }
    );
    if (!res.ok) return { date, sessions: [] };
    const data = safeJsonParse<DayLog>(text, { date, sessions: [] });
    return data && data.date ? data : { date, sessions: [] };
  } catch (err) {
    console.error("deleteActivitySession failed", err);
    return { date, sessions: [] };
  }
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
  const logs: DayLog[] = [];
  for (const date of dates) {
    const log = await getActivityLog(date);
    logs.push(log);
  }
  return logs;
}

export async function getHabitData(date: string): Promise<HabitData> {
  try {
    const { res, text } = await fetchText(
      `${HABITS_ENDPOINT}/${encodeURIComponent(date)}`
    );
    if (!res.ok) return {};
    const json = safeJsonParse<{ data?: HabitData }>(text, {});
    const data = json?.data || {};
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    console.error("getHabitData failed", err);
    return {};
  }
}

export async function setHabitData(
  date: string,
  data: HabitData
): Promise<void> {
  try {
    await fetchText(`${HABITS_ENDPOINT}/${encodeURIComponent(date)}`, {
      method: "POST",
      headers: { "Content-Type": CONTENT_TYPE_JSON },
      body: JSON.stringify({ data: data || {} }),
    });
  } catch (err) {
    console.error("setHabitData failed", err);
  }
}

export async function getHabitHistory(
  start: string,
  end: string
): Promise<HabitHistoryMap> {
  try {
    const url = `${HABITS_ENDPOINT}?from=${encodeURIComponent(
      start
    )}&to=${encodeURIComponent(end)}`;
    const { res, text } = await fetchText(url);
    if (!res.ok) return {};
    const json = safeJsonParse<any>(text, {});
    const raw = json?.data || json?.items || json || {};
    if (Array.isArray(raw)) {
      const map: HabitHistoryMap = {};
      for (const item of raw) {
        const d = item?.date || item?._id || "";
        if (typeof d === "string" && d) map[d] = item;
      }
      return map;
    }
    if (typeof raw === "object" && raw) return raw as HabitHistoryMap;
    return {};
  } catch (err) {
    console.error("getHabitHistory failed", err);
    return {};
  }
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
