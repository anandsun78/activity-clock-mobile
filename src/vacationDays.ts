import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VACATION_STORAGE_KEY = "activity_clock_vacation_days";
const VACATION_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VACATION_LISTENERS = new Set<(days: string[]) => void>();

let cachedVacationDays: string[] | null = null;
let cachedVacationSet = new Set<string>();
let cacheReady = false;
let cachePromise: Promise<void> | null = null;

function normalizeVacationDays(days: string[]) {
  const cleaned = days
    .map((d) => String(d || "").trim())
    .filter((d) => VACATION_DATE_RE.test(d));
  return Array.from(new Set(cleaned)).sort();
}

async function applyVacationDays(days: string[], persist: boolean) {
  const next = normalizeVacationDays(days);
  cachedVacationDays = next;
  cachedVacationSet = new Set(next);
  if (persist) {
    try {
      await AsyncStorage.setItem(VACATION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

async function readStoredVacationDays() {
  try {
    const raw = await AsyncStorage.getItem(VACATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensureVacationCache() {
  if (cacheReady) return;
  if (!cachePromise) {
    cachePromise = (async () => {
      const stored = await readStoredVacationDays();
      await applyVacationDays(stored, false);
      cacheReady = true;
    })();
  }
  await cachePromise;
}

function emitVacationDays(days: string[]) {
  for (const listener of VACATION_LISTENERS) listener(days);
}

export async function initVacationDays() {
  await ensureVacationCache();
}

export function getVacationDays() {
  if (!cacheReady) return [];
  return cachedVacationDays ? [...cachedVacationDays] : [];
}

export async function setVacationDays(days: string[]) {
  const next = await applyVacationDays(days, true);
  emitVacationDays(next);
  return next;
}

export function subscribeVacationDays(listener: (days: string[]) => void) {
  VACATION_LISTENERS.add(listener);
  return () => {
    VACATION_LISTENERS.delete(listener);
  };
}

export function isVacationDay(dateStr?: string | null) {
  if (!cacheReady) return false;
  return !!dateStr && cachedVacationSet.has(dateStr);
}

export function useVacationDays(): [string[], (next: string[]) => void] {
  const [days, setDays] = useState<string[]>(getVacationDays());

  useEffect(() => {
    let mounted = true;
    initVacationDays().then(() => {
      if (mounted) setDays(getVacationDays());
    });
    const unsubscribe = subscribeVacationDays((next) => setDays(next));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback((next: string[]) => {
    void setVacationDays(next);
  }, []);

  return [days, update];
}

export function filterOutVacationMap<T extends Record<string, unknown>>(
  map: Record<string, T>
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) {
    if (!isVacationDay(k)) out[k] = v;
  }
  return out;
}

export function filterOutVacationLogs<T extends { date: string }>(
  logs: T[]
): T[] {
  return logs.filter((l) => !isVacationDay(l.date));
}
