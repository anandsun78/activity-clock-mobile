import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { SeriesBundle, TrendDay } from "./types";
import { ActivityCardMini, MultiLinePerDay } from "./ActivityCharts";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, spacing } from "../../styles/theme";

type TrendsCardProps = {
  startDateIso: string;
  dayCount: number;
  topN: number;
  trendScope: "All" | "Weekdays" | "Weekends";
  setTrendScope: (value: "All" | "Weekdays" | "Weekends") => void;
  trendDays: number;
  setTrendDays: (value: number) => void;
  mode: "m" | "pct";
  setMode: (value: "m" | "pct") => void;
  chosenActivities: string[];
  series: SeriesBundle;
  filteredTrendDays: TrendDay[];
  selectedLines: Set<string>;
  setSelectedLines: React.Dispatch<React.SetStateAction<Set<string>>>;
  focus: string;
  setFocus: (value: string) => void;
};

export default function TrendsCard({
  startDateIso,
  dayCount,
  topN,
  trendScope,
  setTrendScope,
  trendDays,
  setTrendDays,
  mode,
  setMode,
  chosenActivities,
  series,
  filteredTrendDays,
  selectedLines,
  setSelectedLines,
  focus,
  setFocus,
}: TrendsCardProps) {
  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Trends (since {startDateIso})</Text>
        <Chip>{dayCount} days</Chip>
      </CardHeader>

      <View style={styles.toggleRow}>
        {["All", "Weekdays", "Weekends"].map((k) => (
          <Pressable
            key={k}
            onPress={() => setTrendScope(k as "All" | "Weekdays" | "Weekends")}
            style={[styles.toggle, trendScope === k && styles.toggleActive]}
          >
            <Text style={styles.toggleText}>{k}</Text>
          </Pressable>
        ))}
        {[7, 14, 30, 60].map((n) => (
          <Pressable
            key={n}
            onPress={() => setTrendDays(n)}
            style={[styles.toggle, trendDays === n && styles.toggleActive]}
          >
            <Text style={styles.toggleText}>{n}d</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setMode("m")}
          style={[styles.toggle, mode === "m" && styles.toggleActive]}
        >
          <Text style={styles.toggleText}>Minutes</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("pct")}
          style={[styles.toggle, mode === "pct" && styles.toggleActive]}
        >
          <Text style={styles.toggleText}>% of day</Text>
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        Top {topN} activities in window; others grouped as Other.
      </Text>

      <View style={styles.miniGrid}>
        {chosenActivities.map((a) => (
          <View
            key={a}
            style={{ opacity: focus && focus !== a ? 0.35 : 1 }}
          >
            <ActivityCardMini
              name={a}
              series={series.byActivity}
              mode={mode}
              onFocus={(x) => setFocus(focus === x ? "" : x)}
              focused={focus === a}
            />
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionTitle}>
          {mode === "pct"
            ? "% of day per activity (lines)"
            : "Minutes per day (lines)"}
        </Text>
        <MultiLinePerDay
          days={filteredTrendDays}
          seriesByActivity={series.byActivity}
          selectable={chosenActivities}
          selectedSet={selectedLines}
          mode={mode}
          onToggle={(name) => {
            setSelectedLines((prev) => {
              const next = new Set(prev);
              if (next.has(name)) next.delete(name);
              else next.add(name);
              if (next.size === 0) next.add(name);
              return next;
            });
          }}
        />
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
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceStrong,
  },
  toggleActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  toggleText: {
    fontSize: 12,
    color: colors.ink,
  },
  helperText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  miniGrid: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: spacing.sm,
    color: colors.ink,
  },
});
