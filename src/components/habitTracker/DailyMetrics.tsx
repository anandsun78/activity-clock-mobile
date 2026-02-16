import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import type { HabitData } from "./types";
import { WASTE_LIMIT_MINUTES } from "./constants";
import { isFiniteNum } from "./utils";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, radius, spacing } from "../../styles/theme";

type DailyMetricsProps = {
  habitData: HabitData;
  getStudyVal: (key: string) => number;
  updateNumber: (key: string, value: string) => void;
  updateStudy: (key: string, value: string) => void;
  minsSinceAny: number | null;
  minsSinceNews: number | null;
  minsSinceMusic: number | null;
  minsSinceJl: number | null;
  totalStudyMin: number;
  hasWastedToday: boolean;
  wastedMin: number;
  wasteDelta: number;
  overWasteLimit: boolean;
};

const DailyMetrics: React.FC<DailyMetricsProps> = ({
  habitData,
  getStudyVal,
  updateNumber,
  updateStudy,
  minsSinceAny,
  minsSinceNews,
  minsSinceMusic,
  minsSinceJl,
  totalStudyMin,
  hasWastedToday,
  wastedMin,
  wasteDelta,
  overWasteLimit,
}) => {
  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Daily Metrics</Text>
        <Chip>Tracked per day</Chip>
        <Chip>
          Since any: {minsSinceAny === null ? "-" : `${minsSinceAny}m`}
        </Chip>
      </CardHeader>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              keyboardType="numeric"
              value={
                habitData.weight !== null && typeof habitData.weight !== "undefined"
                  ? String(habitData.weight)
                  : ""
              }
              placeholder="e.g., 175.2"
              onChangeText={(value) => updateNumber("weight", value)}
              style={[styles.input, { flex: 1 }]}
            />
            <Text style={styles.unit}>lbs</Text>
          </View>
        </View>

        <View style={[styles.metric, overWasteLimit && styles.warn]}>
          <Text style={styles.label}>Wasted (min)</Text>
          <TextInput
            keyboardType="numeric"
            value={hasWastedToday ? String(habitData.wastedMin) : ""}
            placeholder="0"
            onChangeText={(value) => updateNumber("wastedMin", value)}
            style={styles.input}
          />
          <Text style={styles.hint}>
            {overWasteLimit
              ? `Over ${WASTE_LIMIT_MINUTES}m limit`
              : `At or under ${WASTE_LIMIT_MINUTES}m target`}
          </Text>
        </View>

        {[
          { key: "BK", label: "BK (min)" },
          { key: "SD", label: "SD (min)" },
          { key: "AP", label: "AP (min)" },
        ].map((item) => (
          <View key={item.key} style={styles.metric}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput
              keyboardType="numeric"
              value={String(getStudyVal(item.key))}
              placeholder="0"
              onChangeText={(value) => updateStudy(item.key, value)}
              style={styles.input}
            />
          </View>
        ))}

        <View style={styles.metric}>
          <Text style={styles.label}>News Accesses</Text>
          <TextInput
            keyboardType="numeric"
            value={isFiniteNum(habitData.newsAccessCount) ? String(habitData.newsAccessCount) : ""}
            placeholder="0"
            onChangeText={(value) => updateNumber("newsAccessCount", value)}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Last: {minsSinceNews === null ? "-" : `${minsSinceNews}m ago`}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.label}>Music Listens</Text>
          <TextInput
            keyboardType="numeric"
            value={isFiniteNum(habitData.musicListenCount) ? String(habitData.musicListenCount) : ""}
            placeholder="0"
            onChangeText={(value) => updateNumber("musicListenCount", value)}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Last: {minsSinceMusic === null ? "-" : `${minsSinceMusic}m ago`}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.label}>JL</Text>
          <TextInput
            keyboardType="numeric"
            value={isFiniteNum(habitData.jlCount) ? String(habitData.jlCount) : ""}
            placeholder="0"
            onChangeText={(value) => updateNumber("jlCount", value)}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Last: {minsSinceJl === null ? "-" : `${minsSinceJl}m ago`}
          </Text>
        </View>
      </View>

      <View style={styles.totals}>
        <Text style={styles.totalItem}>Total SD: {totalStudyMin} min</Text>
        <Text style={[styles.totalItem, overWasteLimit ? styles.bad : styles.good]}>
          Waste: {wastedMin} min
          {hasWastedToday && (
            <Text style={[styles.delta, wasteDelta > 0 ? styles.bad : styles.good]}>
              {wasteDelta > 0 ? ` +${wasteDelta}` : ` ${wasteDelta}`}
            </Text>
          )}
        </Text>
      </View>
    </Card>
  );
};

export default DailyMetrics;

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
  metric: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  unit: {
    fontSize: 12,
    color: colors.muted,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
  },
  warn: {
    borderColor: colors.warn,
  },
  totals: {
    marginTop: spacing.md,
    gap: 6,
  },
  totalItem: {
    fontSize: 13,
    color: colors.ink,
  },
  delta: {
    fontSize: 12,
  },
  bad: {
    color: colors.bad,
  },
  good: {
    color: colors.good,
  },
});
