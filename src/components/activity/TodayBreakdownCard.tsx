import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { TodayBreakdown } from "./types";
import { fmtM } from "./utils";
import { Bar } from "./ActivityCharts";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, spacing } from "../../styles/theme";

type TodayBreakdownCardProps = {
  todayBreakdown: TodayBreakdown;
};

export default function TodayBreakdownCard({ todayBreakdown }: TodayBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Today Breakdown</Text>
        <Chip>
          Recorded {fmtM(todayBreakdown.totalTracked)}. Since midnight {fmtM(
            todayBreakdown.sinceMidnight
          )}
        </Chip>
      </CardHeader>
      <View style={{ gap: spacing.sm }}>
        {todayBreakdown.rows.map((row) => (
          <View key={row.activity} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{row.activity}</Text>
            <Bar pct={row.pct} />
            <Text style={styles.metricHint}>
              {fmtM(row.minutes)}. {row.pct.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  metricRow: {
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  metricHint: {
    fontSize: 12,
    color: colors.muted,
  },
});
