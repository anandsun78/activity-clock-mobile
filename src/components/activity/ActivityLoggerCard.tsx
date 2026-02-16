import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { formatLocalDateTime } from "../../dateUtils";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, radius, spacing } from "../../styles/theme";

type ActivityLoggerCardProps = {
  now: Date;
  start: Date;
  elapsedLabel: string;
  nameInput: string;
  minutesInput: string;
  names: string[];
  isBusy?: boolean;
  onNameChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onLog: (activityName?: string, explicitMinutes?: number) => void;
  onUndo: () => void;
  canUndo: boolean;
};

export default function ActivityLoggerCard({
  now,
  start,
  elapsedLabel,
  nameInput,
  minutesInput,
  names,
  isBusy = false,
  onNameChange,
  onMinutesChange,
  onLog,
  onUndo,
  canUndo,
}: ActivityLoggerCardProps) {
  const parsedMinutes = minutesInput ? Number(minutesInput) : undefined;

  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Now</Text>
        <Chip>{formatLocalDateTime(now)}</Chip>
      </CardHeader>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.metaText}>
          Start: <Text style={styles.metaStrong}>{formatLocalDateTime(start)}</Text>
        </Text>
        <Text style={styles.metaText}>
          Elapsed since start: <Text style={styles.metaStrong}>{elapsedLabel}</Text>
        </Text>

        <View style={styles.row}>
          <TextInput
            placeholder='What did you do? e.g., "Gym"'
            value={nameInput}
            onChangeText={onNameChange}
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            placeholder="Minutes"
            value={minutesInput}
            onChangeText={onMinutesChange}
            keyboardType="numeric"
            style={[styles.input, { width: 110 }]}
          />
        </View>

        <View style={styles.row}>
          <Pressable
            style={[styles.primaryButton, isBusy && styles.disabledButton]}
            onPress={() => onLog(undefined, parsedMinutes)}
            disabled={isBusy}
          >
            <Text style={styles.primaryText}>Log segment</Text>
          </Pressable>
          <Pressable
            style={[
              styles.secondaryButton,
              (!canUndo || isBusy) && styles.disabledButton,
            ]}
            onPress={onUndo}
            disabled={!canUndo || isBusy}
          >
            <Text style={styles.secondaryText}>Undo last</Text>
          </Pressable>
        </View>

        <Text style={styles.helpText}>
          Leave minutes empty to log from Start to now. Set minutes to log that many minutes from Start.
        </Text>

        {names.length > 0 && (
          <View>
            <Text style={styles.quickPickLabel}>Quick pick</Text>
            <View style={styles.wrapRow}>
              {names.map((n) => (
                <Pressable
                  key={n}
                  style={styles.chipButton}
                  onPress={() => onLog(n, parsedMinutes)}
                  disabled={isBusy}
                >
                  <Text style={styles.chipText}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
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
  metaText: {
    color: colors.muted,
  },
  metaStrong: {
    color: colors.ink,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
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
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  helpText: {
    fontSize: 12,
    color: colors.muted,
  },
  quickPickLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chipButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  chipText: {
    fontSize: 12,
    color: colors.ink,
  },
});
