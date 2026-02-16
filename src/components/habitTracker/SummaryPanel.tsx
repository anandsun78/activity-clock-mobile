import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { HabitAggregate, WeightDelta } from "./types";
import { Card, CardHeader, Chip } from "../shared/Card";
import { WASTE_LIMIT_MINUTES } from "./constants";
import { colors, spacing } from "../../styles/theme";

type SummaryPanelProps = {
  aggregate: HabitAggregate;
  weightDelta: WeightDelta | null;
  historyLoading: boolean;
  startDate: string;
};

const SummaryPanel: React.FC<SummaryPanelProps> = ({
  aggregate,
  weightDelta,
  historyLoading,
  startDate,
}) => {
  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Summary (since {startDate})</Text>
        {historyLoading ? <Chip>Loading</Chip> : <Chip>Aggregated</Chip>}
      </CardHeader>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.statLabel}>BK</Text>
          <Text style={styles.statValue}>{aggregate.BK} min</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.statLabel}>SD</Text>
          <Text style={styles.statValue}>{aggregate.SD} min</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.statLabel}>AP</Text>
          <Text style={styles.statValue}>{aggregate.AP} min</Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Total SD</Text>
          <Text style={styles.statValue}>{aggregate.totalStudy} min</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.statLabel}>Total Waste</Text>
          <Text style={styles.statValue}>{aggregate.totalWaste} min</Text>
        </View>
        <View style={[styles.cell, styles.cellFull]}>
          <Text style={styles.statLabel}>Waste Allowance Delta</Text>
          <Text style={[styles.statValue, aggregate.totalWasteDelta > 0 ? styles.bad : styles.good]}>
            {aggregate.totalWasteDelta > 0 ? `+${aggregate.totalWasteDelta}` : aggregate.totalWasteDelta}
          </Text>
          <Text style={styles.statSub}>
            Sum of (wasted - {WASTE_LIMIT_MINUTES}) on days with input
          </Text>
        </View>

        <View style={[styles.cell, styles.cellFull]}>
          <Text style={styles.statLabel}>Weight Trend</Text>
          {aggregate.firstWeight === null || aggregate.latestWeight === null ? (
            <Text style={styles.statValue}>-</Text>
          ) : (
            <>
              <Text style={styles.statValue}>
                {aggregate.firstWeight} -> {aggregate.latestWeight} lbs
              </Text>
              <Text style={styles.statSub}>
                First: {aggregate.firstWeightDate} | Latest: {aggregate.latestWeightDate}
              </Text>
              {weightDelta && (
                <Text
                  style={[
                    styles.deltaBadge,
                    weightDelta.diff < 0 ? styles.good : weightDelta.diff > 0 ? styles.bad : undefined,
                  ]}
                >
                  {weightDelta.diff > 0 ? "+" : ""}
                  {weightDelta.diff.toFixed(1)} lbs
                  {weightDelta.pct !== null ? ` (${weightDelta.pct}%)` : ""}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg News / day</Text>
          <Text style={styles.statValue}>{aggregate.avgNewsPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.totalNewsAccess} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg Music / day</Text>
          <Text style={styles.statValue}>{aggregate.avgMusicPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.totalMusicListen} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg JL / day</Text>
          <Text style={styles.statValue}>{aggregate.avgJlPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.totalJl} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg BK / day</Text>
          <Text style={styles.statValue}>{aggregate.avgBKPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.BK} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg SD / day</Text>
          <Text style={styles.statValue}>{aggregate.avgSDPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.SD} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg AP / day</Text>
          <Text style={styles.statValue}>{aggregate.avgAPPerDay.toFixed(2)}</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.AP} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg Waste / day</Text>
          <Text style={styles.statValue}>{aggregate.avgWastePerDay.toFixed(2)} min</Text>
          <Text style={styles.statSub}>
            Total: {aggregate.totalWaste} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.cell}>
          <Text style={styles.statLabel}>Avg Total SD / day</Text>
          <Text style={styles.statValue}>{aggregate.avgTotalStudyPerDay.toFixed(2)} min</Text>
          <Text style={styles.statSub}>
            (BK + SD + AP). Total: {aggregate.totalStudy} across {aggregate.daysObserved} day
            {aggregate.daysObserved === 1 ? "" : "s"}
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default SummaryPanel;

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  cell: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  cellFull: {
    width: "100%",
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  statSub: {
    fontSize: 12,
    color: colors.muted,
  },
  deltaBadge: {
    fontSize: 12,
    marginTop: 6,
  },
  bad: {
    color: colors.bad,
  },
  good: {
    color: colors.good,
  },
});
