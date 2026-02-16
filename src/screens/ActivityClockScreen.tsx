import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import {
  yyyyMmDdLocal,
  diffMinutes,
  startOfDayLocal,
  minutesSinceLocalMidnight,
} from "../dateUtils";
import { filterOutVacationLogs, useVacationDays } from "../vacationDays";
import { DonutChart } from "../components/activity/ActivityCharts";
import {
  aggregateTopN,
  buildSeries,
  isWeekend,
  splitByLocalMidnight,
  upsertTodayInHistory,
} from "../components/activity/helpers";
import type {
  DayLog,
  HistoricalSummary,
  LoggedSegments,
  TodayBreakdown,
} from "../components/activity/types";
import ActivityLoggerCard from "../components/activity/ActivityLoggerCard";
import TodayVsUsualCard from "../components/activity/TodayVsUsualCard";
import TrendsCard from "../components/activity/TrendsCard";
import TodayBreakdownCard from "../components/activity/TodayBreakdownCard";
import SessionsPanel from "../components/activity/SessionsPanel";
import VacationDaysPanel from "../components/VacationDaysPanel";
import { Chip } from "../components/shared/Card";
import {
  addActivityName,
  appendActivitySession,
  deleteActivitySession,
  getActivityLog,
  getActivityLogsRange,
  getActivityNames,
  getLastStop,
  setLastStop,
} from "../storage";
import { colors, spacing } from "../styles/theme";

const START_DATE_ISO = "2026-02-16";
const TOP_N = 7;

function fmtHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function ActivityClockScreen() {
  useKeepAwake();

  const [now, setNow] = useState<Date>(new Date());
  const [start, setStart] = useState<Date>(startOfDayLocal(new Date()));

  const [nameInput, setNameInput] = useState<string>("");
  const [minutesInput, setMinutesInput] = useState<string>("");
  const [names, setNames] = useState<string[]>([]);
  const [todayLog, setTodayLog] = useState<DayLog>({
    date: yyyyMmDdLocal(),
    sessions: [],
  });
  const [history, setHistory] = useState<DayLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [vacationDays] = useVacationDays();

  const [mergeAdjacent, setMergeAdjacent] = useState<boolean>(true);
  const [showGaps, setShowGaps] = useState<boolean>(true);
  const [activityFilter, setActivityFilter] = useState<string>("All");

  const [trendScope, setTrendScope] = useState<"All" | "Weekdays" | "Weekends">(
    "All"
  );
  const [trendDays, setTrendDays] = useState<number>(30);
  const [mode, setMode] = useState<"m" | "pct">("m");
  const [focus, setFocus] = useState<string>("");

  const [lastLogged, setLastLogged] = useState<LoggedSegments>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const today = yyyyMmDdLocal();

        const storedNames = await getActivityNames();
        setNames(Array.isArray(storedNames) ? storedNames : []);

        const loadedToday = await getActivityLog(today);
        setTodayLog(loadedToday);

        if (loadedToday.sessions?.length > 0) {
          const latestEnd = new Date(
            Math.max(
              ...loadedToday.sessions.map((s) =>
                new Date(String(s.end)).getTime()
              )
            )
          );
          setStart(latestEnd);
          await setLastStop(latestEnd.toISOString());
        } else {
          const ls = await getLastStop();
          const candidate = ls ? new Date(ls) : startOfDayLocal();
          const clamped = new Date(
            Math.max(candidate.getTime(), startOfDayLocal().getTime())
          );
          setStart(clamped);
        }

        const logs = await getActivityLogsRange(START_DATE_ISO, today);
        setHistory(logs);
      } catch (e) {
        console.error("ActivityClock load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayBreakdown = useMemo<TodayBreakdown>(() => {
    const totals: Record<string, number> = {};
    for (const s of todayLog.sessions) {
      const m = diffMinutes(s.start, s.end);
      totals[s.activity] = (totals[s.activity] || 0) + m;
    }
    const sinceMidnight = minutesSinceLocalMidnight(now);
    const rows = (Object.entries(totals) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({
        activity: k,
        minutes: v,
        pct: sinceMidnight ? (v / sinceMidnight) * 100 : 0,
      }));

    const totalTracked = Object.values(totals).reduce((a, b) => a + b, 0);
    const untracked = Math.max(0, sinceMidnight - totalTracked);
    if (untracked > 0)
      rows.push({
        activity: "Untracked",
        minutes: untracked,
        pct: sinceMidnight ? (untracked / sinceMidnight) * 100 : 0,
      });

    return { rows, sinceMidnight, totalTracked };
  }, [todayLog, now]);

  const filteredHistory = useMemo(() => {
    void vacationDays;
    return filterOutVacationLogs(history);
  }, [history, vacationDays]);

  const historical = useMemo<HistoricalSummary>(() => {
    const perDayTotals: Record<
      string,
      { totalMinutes: number; daysWithAny: number }
    > = {};
    let dayCount = 0;
    let sumDailyTracked = 0;
    for (const log of filteredHistory) {
      if (!log?.sessions) continue;
      const daily: Record<string, number> = {};
      for (const s of log.sessions)
        daily[s.activity] =
          (daily[s.activity] || 0) + diffMinutes(s.start, s.end);

      const dailyTracked = Object.values(daily).reduce((a, b) => a + b, 0);
      sumDailyTracked += dailyTracked;

      for (const [a, m] of Object.entries(daily)) {
        perDayTotals[a] = perDayTotals[a] || {
          totalMinutes: 0,
          daysWithAny: 0,
        };
        perDayTotals[a].totalMinutes += m;
        perDayTotals[a].daysWithAny += 1;
      }
      dayCount++;
    }
    const avgPerDay = Object.fromEntries(
      Object.entries(perDayTotals).map(([a, v]) => [
        a,
        v.totalMinutes / Math.max(v.daysWithAny, 1),
      ])
    );

    const todayMap = Object.fromEntries(
      todayBreakdown.rows.map((r) => [r.activity, r.minutes])
    );
    const deltas = Object.entries(avgPerDay)
      .map(([a, avgM]) => {
        const todayM = todayMap[a] || 0;
        const delta = todayM - avgM;
        const deltaPct = avgM ? (delta / avgM) * 100 : 0;
        return { activity: a, avgM, todayM, delta, deltaPct };
      })
      .sort((a, b) => b.todayM - a.todayM);

    const avgTrackedPerDay = dayCount > 0 ? sumDailyTracked / dayCount : 0;

    return { avgPerDay, deltas, dayCount, avgTrackedPerDay };
  }, [filteredHistory, todayBreakdown]);

  const trendData = useMemo(() => {
    const todayKey = yyyyMmDdLocal(now);
    const days = filteredHistory.map((log) => {
      const totals: Record<string, number> = {};
      for (const s of log?.sessions || []) {
        const m = diffMinutes(s.start, s.end);
        totals[s.activity] = (totals[s.activity] || 0) + m;
      }

      const tracked = Object.values(totals).reduce((a: number, b) => a + b, 0);
      const denom = log.date === todayKey ? minutesSinceLocalMidnight(now) : 1440;

      const safeDenom = Math.max(1, Math.round(denom));
      const untracked = Math.max(0, safeDenom - Math.min(tracked, safeDenom));

      if (untracked > 0) {
        totals["Untracked"] = (totals["Untracked"] || 0) + untracked;
      }

      return {
        date: log.date,
        weekend: isWeekend(log.date),
        totals,
        totalMin: safeDenom,
      };
    });

    const activities = Array.from(
      new Set(days.flatMap((d) => Object.keys(d.totals)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return { days, activities };
  }, [filteredHistory, now]);

  const filteredTrendDays = useMemo(() => {
    let ds = trendData.days.slice(-trendDays);
    if (trendScope === "Weekdays") ds = ds.filter((d) => !d.weekend);
    if (trendScope === "Weekends") ds = ds.filter((d) => d.weekend);
    return ds;
  }, [trendData.days, trendScope, trendDays]);

  const windowTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of filteredTrendDays) {
      for (const [a, mm] of Object.entries(d.totals)) {
        if (a === "Untracked") continue;
        m[a] = (m[a] || 0) + mm;
      }
    }
    return m;
  }, [filteredTrendDays]);

  const chosenActivities = useMemo(() => {
    const agg = aggregateTopN(windowTotals, TOP_N);
    return Object.keys(agg).sort((a, b) => agg[b] - agg[a]);
  }, [windowTotals]);

  const series = useMemo(() => {
    const mapped = filteredTrendDays.map((d) => {
      const keepSet = new Set(chosenActivities);
      const totals: Record<string, number> = {};
      let other = 0;
      for (const [a, m] of Object.entries(d.totals)) {
        if (a === "Untracked") continue;
        if (keepSet.has(a)) totals[a] = (totals[a] || 0) + m;
        else other += m;
      }
      if (other > 0 && keepSet.has("Other")) totals["Other"] = other;
      return { date: d.date, weekend: d.weekend, totals, totalMin: d.totalMin };
    });
    return buildSeries(mapped, chosenActivities);
  }, [filteredTrendDays, chosenActivities]);

  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const chosenKey = useMemo(
    () => chosenActivities.join("\u0001"),
    [chosenActivities]
  );
  useEffect(() => {
    setSelectedLines((prev: Set<string>) => {
      const next = new Set(
        [...prev].filter((a) => chosenActivities.includes(a))
      );
      if (next.size === 0 && chosenActivities[0]) next.add(chosenActivities[0]);
      return next;
    });
  }, [chosenKey, chosenActivities]);

  const elapsedSeconds = useMemo(
    () => Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000)),
    [start, now]
  );
  const elapsedLabel = useMemo(() => fmtHMS(elapsedSeconds), [elapsedSeconds]);

  async function ensureNamePersisted(name: string) {
    if (!name || names.includes(name)) return;
    const next = await addActivityName(name);
    setNames(next);
  }

  async function logSinceLastStop(activityName?: string, explicitMinutes?: number) {
    const clean = (activityName ?? nameInput).trim();
    if (!clean) return;

    const prevStart = start;

    const minutes = Number(explicitMinutes);
    const useMinutes = Number.isFinite(minutes) && minutes > 0;

    const todayMid = startOfDayLocal();
    const nowD = new Date();

    let sessionStart = new Date(Math.max(start.getTime(), todayMid.getTime()));
    if (sessionStart > nowD) sessionStart = nowD;

    let sessionEnd;
    if (useMinutes) {
      const desiredEnd = new Date(sessionStart.getTime() + minutes * 60 * 1000);
      sessionEnd = desiredEnd.getTime() > nowD.getTime() ? nowD : desiredEnd;
    } else {
      sessionEnd = nowD;
    }

    if (sessionEnd <= sessionStart) return;

    const segments = splitByLocalMidnight(sessionStart, sessionEnd);

    const segmentsForUndo = segments.map((seg) => ({
      start: seg.start.toISOString(),
      end: seg.end.toISOString(),
      activity: clean,
    }));

    let latestTodayDoc: DayLog | null = null;

    for (const seg of segments) {
      const dateStr = yyyyMmDdLocal(seg.start);
      const updated = await appendActivitySession(dateStr, {
        start: seg.start,
        end: seg.end,
        activity: clean,
      });
      setHistory((prev) => upsertTodayInHistory(prev, updated));
      if (dateStr === yyyyMmDdLocal()) {
        latestTodayDoc = updated;
      }
    }

    if (latestTodayDoc) setTodayLog(latestTodayDoc);

    await ensureNamePersisted(clean);

    const newStart = sessionEnd;
    setStart(newStart);
    await setLastStop(newStart.toISOString());

    setLastLogged({
      prevStart: prevStart.toISOString(),
      segments: segmentsForUndo,
    });

    setNameInput("");
    setMinutesInput("");
  }

  async function undoLast() {
    if (!lastLogged || !lastLogged.segments?.length) return;

    const { prevStart, segments } = lastLogged;

    try {
      for (const seg of segments) {
        const dateStr = yyyyMmDdLocal(new Date(seg.start));
        await deleteActivitySession(dateStr, seg);
      }

      const today = yyyyMmDdLocal();
      const d = await getActivityLog(today);
      setTodayLog(d && d.date ? d : { date: today, sessions: [] });

      setHistory((prev) =>
        prev.map((day) => {
          const dateStr = day.date;
          const filteredSessions = (day.sessions || []).filter((sess) => {
            return !segments.some((seg) => {
              const segDate = yyyyMmDdLocal(new Date(seg.start));
              return (
                segDate === dateStr &&
                new Date(sess.start).getTime() === new Date(seg.start).getTime() &&
                new Date(sess.end).getTime() === new Date(seg.end).getTime() &&
                sess.activity === seg.activity
              );
            });
          });
          return { ...day, sessions: filteredSessions };
        })
      );

      if (prevStart) {
        const ps = new Date(prevStart);
        setStart(ps);
        await setLastStop(ps.toISOString());
      }

      setLastLogged(null);
    } catch (e) {
      console.error("Undo failed", e);
    }
  }

  const sessionsSorted = useMemo(
    () =>
      (todayLog.sessions || [])
        .slice()
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [todayLog.sessions]
  );

  const mergedSessions = useMemo(() => {
    if (!mergeAdjacent) return sessionsSorted;
    const out: typeof sessionsSorted = [];
    const MAX_GAP_MIN = 3;
    for (const s of sessionsSorted) {
      const last = out[out.length - 1];
      if (
        last &&
        last.activity === s.activity &&
        diffMinutes(last.end, s.start) <= MAX_GAP_MIN
      ) {
        last.end = s.end;
      } else {
        out.push({ ...s });
      }
    }
    return out;
  }, [sessionsSorted, mergeAdjacent]);

  const withGaps = useMemo(() => {
    if (!showGaps) return mergedSessions;
    const res: any[] = [];
    for (let i = 0; i < mergedSessions.length; i++) {
      const cur = mergedSessions[i];
      res.push(cur);
      const next = mergedSessions[i + 1];
      if (next) {
        const gapMin = diffMinutes(cur.end, next.start);
        if (gapMin >= 5) {
          res.push({
            start: cur.end,
            end: next.start,
            activity: "__GAP__",
            gapMin,
          });
        }
      }
    }
    return res;
  }, [mergedSessions, showGaps]);

  const filteredSessions = useMemo(
    () =>
      activityFilter === "All"
        ? withGaps
        : withGaps.filter(
            (s) => s.activity === activityFilter || s.activity === "__GAP__"
          ),
    [withGaps, activityFilter]
  );

  const totalTodayMins = useMemo(
    () =>
      (sessionsSorted || []).reduce(
        (acc, s) => acc + diffMinutes(s.start, s.end),
        0
      ),
    [sessionsSorted]
  );

  const activitiesToday = useMemo(
    () =>
      Array.from(
        new Set(
          (todayLog.sessions || [])
            .map((s) => s.activity)
            .filter((a) => a && a !== "__GAP__")
        )
      ).sort((a, b) => a.localeCompare(b)),
    [todayLog.sessions]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Activity Clock</Text>

      <ActivityLoggerCard
        now={now}
        start={start}
        elapsedLabel={elapsedLabel}
        nameInput={nameInput}
        minutesInput={minutesInput}
        names={names}
        onNameChange={setNameInput}
        onMinutesChange={setMinutesInput}
        onLog={logSinceLastStop}
        onUndo={undoLast}
        canUndo={Boolean(lastLogged)}
      />

      <View style={{ marginBottom: spacing.lg }}>
        <DonutChart rows={todayBreakdown.rows} />
      </View>

      <TodayVsUsualCard
        todayBreakdown={todayBreakdown}
        historical={historical}
        startDateIso={START_DATE_ISO}
      />

      <TrendsCard
        startDateIso={START_DATE_ISO}
        dayCount={historical.dayCount}
        topN={TOP_N}
        trendScope={trendScope}
        setTrendScope={setTrendScope}
        trendDays={trendDays}
        setTrendDays={setTrendDays}
        mode={mode}
        setMode={setMode}
        chosenActivities={chosenActivities}
        series={series}
        filteredTrendDays={filteredTrendDays}
        selectedLines={selectedLines}
        setSelectedLines={setSelectedLines}
        focus={focus}
        setFocus={setFocus}
      />

      <VacationDaysPanel />

      <TodayBreakdownCard todayBreakdown={todayBreakdown} />

      <SessionsPanel
        filteredSessions={filteredSessions}
        sessionsSorted={sessionsSorted}
        mergeAdjacent={mergeAdjacent}
        showGaps={showGaps}
        activityFilter={activityFilter}
        setMergeAdjacent={setMergeAdjacent}
        setShowGaps={setShowGaps}
        setActivityFilter={setActivityFilter}
        activitiesToday={activitiesToday}
        totalTodayMins={totalTodayMins}
      />
      {loading && (
        <View style={styles.loadingRow}>
          <Chip>Loading...</Chip>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  loadingRow: {
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
});
