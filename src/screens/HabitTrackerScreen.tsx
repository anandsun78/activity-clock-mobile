import React, { useMemo } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { yyyyMmDdLocal } from "../dateUtils";
import {
  filterOutVacationMap,
  isVacationDay,
  useVacationDays,
} from "../vacationDays";
import VacationDaysPanel from "../components/VacationDaysPanel";
import {
  HABITS,
  STUDY_KEYS,
  START_DATE,
  WASTE_LIMIT_MINUTES,
} from "../components/habitTracker/constants";
import DailyMetrics from "../components/habitTracker/DailyMetrics";
import HabitList from "../components/habitTracker/HabitList";
import SummaryPanel from "../components/habitTracker/SummaryPanel";
import WeightChartCard from "../components/habitTracker/WeightChartCard";
import type {
  HabitAggregate,
  WeightDelta,
  WeightPoint,
} from "../components/habitTracker/types";
import {
  getStudyValFrom,
  isFiniteNum,
  minutesSince,
  safeAvg,
} from "../components/habitTracker/utils";
import { useHabitData, useHabitHistory } from "../components/habitTracker/hooks";
import { colors, spacing } from "../styles/theme";

const HabitTrackerScreen = () => {
  const today = yyyyMmDdLocal();

  const [vacationDays] = useVacationDays();
  const { habitData, loading, toggleHabit, updateNumber, updateStudy, getStudyVal } =
    useHabitData(today);
  const { history, historyLoading } = useHabitHistory(START_DATE, today);

  const totalStudyMin = useMemo(
    () => STUDY_KEYS.reduce((acc, k) => acc + getStudyVal(k), 0),
    [getStudyVal]
  );

  const hasWastedToday = isFiniteNum(habitData.wastedMin);
  const wastedMin = hasWastedToday ? habitData.wastedMin : 0;
  const wasteDelta = hasWastedToday ? wastedMin - WASTE_LIMIT_MINUTES : 0;
  const overWasteLimit = hasWastedToday && wastedMin > WASTE_LIMIT_MINUTES;

  const minsSinceNews = minutesSince(habitData.lastNewsTs);
  const minsSinceMusic = minutesSince(habitData.lastMusicTs);
  const minsSinceJl = minutesSince(habitData.lastJlTs);

  const lastAnyTs = [
    habitData.lastNewsTs,
    habitData.lastMusicTs,
    habitData.lastJlTs,
  ]
    .filter(Boolean)
    .map((s) => new Date(s).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
  const minsSinceAny = Number.isFinite(lastAnyTs)
    ? Math.max(0, Math.floor((Date.now() - (lastAnyTs as number)) / 60000))
    : null;

  const filteredHistory = useMemo(() => {
    void vacationDays;
    return filterOutVacationMap(history);
  }, [history, vacationDays]);

  const mergedHistory = useMemo(
    () =>
      isVacationDay(today)
        ? filteredHistory
        : { ...filteredHistory, [today]: habitData },
    [filteredHistory, habitData, today]
  );

  const aggregate = useMemo<HabitAggregate>(() => {
    const dates = Object.keys(mergedHistory)
      .filter((d) => d >= START_DATE && d <= today)
      .sort();

    const sums: HabitAggregate = {
      BK: 0,
      SD: 0,
      AP: 0,
      totalStudy: 0,
      totalWaste: 0,
      totalWasteDelta: 0,
      daysCounted: 0,
      firstWeight: null,
      firstWeightDate: null,
      latestWeight: null,
      latestWeightDate: null,
      totalNewsAccess: 0,
      totalMusicListen: 0,
      totalJl: 0,
      avgNewsPerDay: 0,
      avgMusicPerDay: 0,
      avgJlPerDay: 0,
      avgBKPerDay: 0,
      avgSDPerDay: 0,
      avgAPPerDay: 0,
      avgWastePerDay: 0,
      avgTotalStudyPerDay: 0,
      daysObserved: 0,
    };

    for (const d of dates) {
      const day = mergedHistory[d] || {};

      const bk = getStudyValFrom("BK", day);
      const sd = getStudyValFrom("SD", day);
      const ap = getStudyValFrom("AP", day);
      const dayStudy = bk + sd + ap;

      sums.BK += bk;
      sums.SD += sd;
      sums.AP += ap;
      sums.totalStudy += dayStudy;

      const hasWasteDelta = isFiniteNum(day.wasteDelta);
      const hasWastedMin = isFiniteNum(day.wastedMin);
      if (hasWasteDelta || hasWastedMin) {
        if (hasWastedMin) sums.totalWaste += day.wastedMin;
        const dDelta = hasWasteDelta
          ? day.wasteDelta
          : day.wastedMin - WASTE_LIMIT_MINUTES;
        sums.totalWasteDelta += dDelta;
      }

      if (isFiniteNum(day.newsAccessCount))
        sums.totalNewsAccess += day.newsAccessCount;
      if (isFiniteNum(day.musicListenCount))
        sums.totalMusicListen += day.musicListenCount;
      if (isFiniteNum(day.jlCount)) sums.totalJl += day.jlCount;

      const w = Number(day.weight);
      const hasWeight = Number.isFinite(w) && w > 0;

      if (
        dayStudy > 0 ||
        hasWastedMin ||
        hasWeight ||
        isFiniteNum(day.newsAccessCount) ||
        isFiniteNum(day.musicListenCount) ||
        isFiniteNum(day.jlCount)
      ) {
        sums.daysCounted += 1;
      }

      if (hasWeight) {
        if (sums.firstWeight === null) {
          sums.firstWeight = w;
          sums.firstWeightDate = d;
        }
        sums.latestWeight = w;
        sums.latestWeightDate = d;
      }
    }

    const daysObserved = dates.length;
    sums.daysObserved = daysObserved;

    sums.avgNewsPerDay = safeAvg(sums.totalNewsAccess, daysObserved);
    sums.avgMusicPerDay = safeAvg(sums.totalMusicListen, daysObserved);
    sums.avgJlPerDay = safeAvg(sums.totalJl, daysObserved);

    sums.avgBKPerDay = safeAvg(sums.BK, daysObserved);
    sums.avgSDPerDay = safeAvg(sums.SD, daysObserved);
    sums.avgAPPerDay = safeAvg(sums.AP, daysObserved);
    sums.avgWastePerDay = safeAvg(sums.totalWaste, daysObserved);
    sums.avgTotalStudyPerDay = safeAvg(sums.totalStudy, daysObserved);

    return sums;
  }, [mergedHistory, today]);

  const weightSeries = useMemo<WeightPoint[]>(() => {
    const dates = Object.keys(mergedHistory)
      .filter((d) => d >= START_DATE && d <= today)
      .sort();

    const series: WeightPoint[] = [];
    for (const d of dates) {
      const raw = mergedHistory[d] || {};
      const w = Number(raw.weight);
      if (Number.isFinite(w) && w > 0) {
        series.push({ date: d, weight: w });
      }
    }
    return series;
  }, [mergedHistory, today]);

  const weightDelta = useMemo<WeightDelta | null>(() => {
    if (aggregate.firstWeight === null || aggregate.latestWeight === null)
      return null;
    const diff = aggregate.latestWeight - aggregate.firstWeight;
    const pct =
      aggregate.firstWeight > 0
        ? ((diff / aggregate.firstWeight) * 100).toFixed(1)
        : null;
    return { diff, pct };
  }, [aggregate.firstWeight, aggregate.latestWeight]);

  if (loading) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Loading...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>{today}</Text>

      <HabitList
        habits={HABITS}
        habitData={habitData}
        mergedHistory={mergedHistory}
        onToggle={toggleHabit}
      />

      <DailyMetrics
        habitData={habitData}
        getStudyVal={getStudyVal}
        updateNumber={updateNumber}
        updateStudy={updateStudy}
        minsSinceAny={minsSinceAny}
        minsSinceNews={minsSinceNews}
        minsSinceMusic={minsSinceMusic}
        minsSinceJl={minsSinceJl}
        totalStudyMin={totalStudyMin}
        hasWastedToday={hasWastedToday}
        wastedMin={wastedMin}
        wasteDelta={wasteDelta}
        overWasteLimit={overWasteLimit}
      />

      <WeightChartCard series={weightSeries} />

      <SummaryPanel
        aggregate={aggregate}
        weightDelta={weightDelta}
        historyLoading={historyLoading}
        startDate={START_DATE}
      />
      <VacationDaysPanel />
    </ScrollView>
  );
};

export default HabitTrackerScreen;

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
});
