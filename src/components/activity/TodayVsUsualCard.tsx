import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { HistoricalSummary, TodayBreakdown } from "./types";
import { fmtM } from "./utils";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, spacing } from "../../styles/theme";

type TodayVsUsualCardProps = {
  todayBreakdown: TodayBreakdown;
  historical: HistoricalSummary;
  startDateIso: string;
};

function DeltaBadge({
  todayVal,
  avgVal,
  invert = false,
}: {
  todayVal: number;
  avgVal: number;
  invert?: boolean;
}) {
  if (!avgVal) return null;
  const pct = ((todayVal - avgVal) / avgVal) * 100;
  const good = invert ? pct < 0 : pct > 0;
  const bad = invert ? pct > 0 : pct < 0;
  return (
    <Text
      style={[
        styles.deltaBadge,
        good && styles.deltaGood,
        bad && styles.deltaBad,
      ]}
    >
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </Text>
  );
}

export default function TodayVsUsualCard({
  todayBreakdown,
  historical,
  startDateIso,
}: TodayVsUsualCardProps) {
  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Today vs Usual</Text>
        <Chip>
          {historical.dayCount} days since {startDateIso}
        </Chip>
      </CardHeader>

      <View style={styles.statBlock}>
        <Text style={styles.statLabel}>Total tracked today</Text>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{fmtM(todayBreakdown.totalTracked)}</Text>
          {historical.avgTrackedPerDay > 0 && (
            <DeltaBadge
              todayVal={todayBreakdown.totalTracked}
              avgVal={historical.avgTrackedPerDay}
            />
          )}
        </View>
        <Text style={styles.statSub}>
          Usual: {fmtM(historical.avgTrackedPerDay)} / day
        </Text>
      </View>

      {historical.deltas
        .filter((d) => d.activity !== "Untracked")
        .slice(0, 6)
        .map((d) => (
          <View style={styles.statBlock} key={d.activity}>
            <Text style={styles.statLabel}>{d.activity}</Text>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>{fmtM(d.todayM)}</Text>
              {d.avgM > 0 && <DeltaBadge todayVal={d.todayM} avgVal={d.avgM} />}
            </View>
            <Text style={styles.statSub}>
              Usual: {fmtM(d.avgM)}. Delta {d.avgM ? `${d.delta >= 0 ? "+" : ""}${fmtM(d.delta)}` : "-"}
            </Text>
          </View>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  statBlock: {
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  statSub: {
    fontSize: 12,
    color: colors.muted,
  },
  deltaBadge: {
    fontSize: 12,
    color: colors.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deltaGood: {
    borderColor: colors.good,
    color: colors.good,
  },
  deltaBad: {
    borderColor: colors.bad,
    color: colors.bad,
  },
});
