import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { HabitData, HabitHistoryMap } from "./types";
import { getHabitStreak } from "./utils";
import { colors, radius, spacing } from "../../styles/theme";

type HabitListProps = {
  habits: string[];
  habitData: HabitData;
  mergedHistory: HabitHistoryMap;
  onToggle: (habit: string) => void;
};

const HabitList: React.FC<HabitListProps> = ({
  habits,
  habitData,
  mergedHistory,
  onToggle,
}) => {
  return (
    <View style={styles.list}>
      {habits.map((habit) => {
        const done = habitData[habit] || false;
        const streak = getHabitStreak(habit, mergedHistory);
        return (
          <View key={habit} style={styles.cell}>
            <Pressable
              style={[styles.card, done && styles.cardDone]}
              onPress={() => onToggle(habit)}
            >
              <View style={styles.row}>
                <View style={styles.checkbox}>
                  <View style={[styles.checkboxInner, done && styles.checkboxChecked]} />
                </View>
                <Text style={styles.label}>{habit}</Text>
              </View>
              <Text style={[styles.streak, streak > 0 && styles.streakActive]}>
                Streak {streak}d
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

export default HabitList;

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  cell: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cardDone: {
    borderColor: colors.good,
    backgroundColor: "#ecfdf5",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.good,
  },
  label: {
    flex: 1,
    color: colors.ink,
    fontWeight: "600",
  },
  streak: {
    marginTop: 6,
    fontSize: 12,
    color: colors.muted,
  },
  streakActive: {
    color: colors.accent,
    fontWeight: "700",
  },
});
