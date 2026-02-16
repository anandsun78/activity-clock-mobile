import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { yyyyMmDdLocal } from "../dateUtils";
import { useVacationDays } from "../vacationDays";
import { colors, radius, spacing } from "../styles/theme";

export default function VacationDaysPanel() {
  const [days, setDays] = useVacationDays();
  const [input, setInput] = useState<string>("");
  const today = yyyyMmDdLocal();

  const sortedDays = useMemo(() => [...days].sort(), [days]);

  const addDay = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (days.includes(trimmed)) {
      setInput("");
      return;
    }
    setDays([...days, trimmed]);
    setInput("");
  };

  const removeDay = (value: string) => {
    setDays(days.filter((d) => d !== value));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Vacation Days</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Excluded from streaks and analytics</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={input}
          onChangeText={setInput}
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable style={styles.button} onPress={() => addDay(input)}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
        <Pressable
          style={[styles.button, days.includes(today) && styles.disabledButton]}
          onPress={() => addDay(today)}
          disabled={days.includes(today)}
        >
          <Text style={styles.buttonText}>Add today</Text>
        </Pressable>
        {days.length > 0 && (
          <Pressable style={styles.ghostButton} onPress={() => setDays([])}>
            <Text style={styles.ghostText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {sortedDays.length === 0 ? (
        <Text style={styles.emptyText}>No vacation days yet.</Text>
      ) : (
        <View style={styles.list}>
          {sortedDays.map((day) => (
            <View key={day} style={styles.pill}>
              <Text style={styles.pillText}>{day}</Text>
              <Pressable onPress={() => removeDay(day)}>
                <Text style={styles.removeText}>x</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    color: colors.muted,
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.md,
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
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  ghostButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  ghostText: {
    color: colors.ink,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyText: {
    color: colors.muted,
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  pillText: {
    color: colors.ink,
    fontSize: 12,
  },
  removeText: {
    color: colors.bad,
    fontWeight: "700",
  },
});
