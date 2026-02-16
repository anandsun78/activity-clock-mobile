import { useCallback, useEffect, useState } from "react";
import { EVENT_KEYS, WASTE_LIMIT_MINUTES } from "./constants";
import type { HabitData, HabitHistoryMap } from "./types";
import { asNumOrNull, getStudyValFrom } from "./utils";
import { getHabitData, getHabitHistory, setHabitData } from "../../storage";

export function useHabitData(today: string) {
  const [habitData, setHabitDataState] = useState<HabitData>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const run = async () => {
      try {
        const d = await getHabitData(today);
        if (typeof d.weight === "string") {
          const n = Number(d.weight);
          if (Number.isFinite(n)) d.weight = n;
        }
        setHabitDataState(d || {});
      } catch (err) {
        console.error("Error loading habits:", err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [today]);

  const saveHabits = useCallback(
    async (updated: HabitData) => {
      const computed = { ...updated };
      const wm = asNumOrNull(updated.wastedMin);
      if (wm !== null) {
        computed.wasteDelta = wm - WASTE_LIMIT_MINUTES;
      } else {
        delete computed.wasteDelta;
      }

      setHabitDataState(computed);
      try {
        await setHabitData(today, computed);
      } catch (err) {
        console.error("Error saving habits:", err);
      }
    },
    [today]
  );

  const toggleHabit = useCallback(
    (habit: string) => {
      const updated = { ...habitData, [habit]: !habitData[habit] };
      saveHabits(updated);
    },
    [habitData, saveHabits]
  );

  const updateNumber = useCallback(
    (key: string, value: string | number) => {
      const v = Number(value);
      const nextVal = Number.isFinite(v) ? Math.max(0, v) : 0;

      const prevRaw = habitData[key];
      const prev = Number.isFinite(prevRaw) ? prevRaw : 0;

      const updated = { ...habitData, [key]: nextVal };

      if (key in EVENT_KEYS) {
        if (nextVal > prev) {
          updated[EVENT_KEYS[key]] = new Date().toISOString();
        }
      }

      saveHabits(updated);
    },
    [habitData, saveHabits]
  );

  const updateStudy = useCallback(
    (key: string, value: string | number) => {
      const v = Number(value);
      const curStudy = habitData.study || {};
      const study = {
        ...curStudy,
        [key]: Number.isFinite(v) ? Math.max(0, v) : 0,
      };
      const updated = { ...habitData, study };
      saveHabits(updated);
    },
    [habitData, saveHabits]
  );

  const getStudyVal = useCallback(
    (k: string) => getStudyValFrom(k, habitData),
    [habitData]
  );

  return {
    habitData,
    loading,
    toggleHabit,
    updateNumber,
    updateStudy,
    getStudyVal,
  };
}

export function useHabitHistory(startDate: string, today: string) {
  const [history, setHistory] = useState<HabitHistoryMap>({});
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  useEffect(() => {
    const run = async () => {
      setHistoryLoading(true);
      try {
        const map = await getHabitHistory(startDate, today);
        setHistory(map);
      } catch (err) {
        console.error("Error loading history:", err);
        setHistory({});
      } finally {
        setHistoryLoading(false);
      }
    };
    run();
  }, [startDate, today]);

  return { history, historyLoading };
}
