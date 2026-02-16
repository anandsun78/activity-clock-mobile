import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { diffMinutes, formatLocalTime } from "../../dateUtils";
import { colorForActivity, fmtM } from "./utils";
import { colors, radius, spacing } from "../../styles/theme";

type SessionItem = {
  start: string;
  end: string;
  activity: string;
  gapMin?: number;
};

type SessionsPanelProps = {
  title?: string;
  filteredSessions: SessionItem[];
  sessionsSorted: SessionItem[];
  mergeAdjacent: boolean;
  showGaps: boolean;
  activityFilter: string;
  setMergeAdjacent: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGaps: React.Dispatch<React.SetStateAction<boolean>>;
  setActivityFilter: (name: string) => void;
  activitiesToday: string[];
  totalTodayMins: number;
};

const SessionsPanel: React.FC<SessionsPanelProps> = ({
  title = "Today's Sessions",
  filteredSessions,
  sessionsSorted,
  mergeAdjacent,
  showGaps,
  activityFilter,
  setMergeAdjacent,
  setShowGaps,
  setActivityFilter,
  activitiesToday,
  totalTodayMins,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {(sessionsSorted || []).length} entries - {fmtM(totalTodayMins)} total
          </Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, mergeAdjacent && styles.toggleActive]}
          onPress={() => setMergeAdjacent((v) => !v)}
        >
          <Text style={styles.toggleText}>
            {mergeAdjacent ? "Merge duplicates" : "Merge duplicates"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggle, showGaps && styles.toggleActive]}
          onPress={() => setShowGaps((v) => !v)}
        >
          <Text style={styles.toggleText}>{showGaps ? "Show gaps" : "Show gaps"}</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.toggle, activityFilter === "All" && styles.toggleActive]}
          onPress={() => setActivityFilter("All")}
        >
          <Text style={styles.toggleText}>All</Text>
        </Pressable>
        {activitiesToday.map((a) => (
          <Pressable
            key={a}
            style={[
              styles.toggle,
              activityFilter === a && styles.toggleActive,
              { borderColor: activityFilter === a ? colorForActivity(a) : colors.border },
            ]}
            onPress={() => setActivityFilter(a)}
          >
            <View
              style={[styles.dot, { backgroundColor: colorForActivity(a) }]}
            />
            <Text style={styles.toggleText}>{a}</Text>
          </Pressable>
        ))}
      </View>

      {filteredSessions.length === 0 ? (
        <Text style={styles.emptyText}>
          No sessions match your filters. Try turning off the filter or logging a session.
        </Text>
      ) : (
        <View style={styles.sessionGrid}>
          {filteredSessions.map((s, i) => {
            const isGap = s.activity === "__GAP__";
            const dur = isGap ? fmtM(s.gapMin || 0) : fmtM(diffMinutes(s.start, s.end));
            const actColor = isGap ? colors.bad : colorForActivity(s.activity);

            return (
              <View
                key={`${s.activity}-${i}`}
                style={[styles.sessionCard, isGap && styles.sessionGap]}
              >
                <View style={styles.sessionHead}>
                  <View style={styles.sessionTitle}>
                    <View style={[styles.dot, { backgroundColor: actColor }]} />
                    <Text style={styles.sessionLabel}>
                      {isGap ? "Gap (Untracked)" : s.activity}
                    </Text>
                  </View>
                  <Text style={styles.sessionDur}>{dur}</Text>
                </View>
                <Text style={styles.sessionTime}>
                  {formatLocalTime(s.start)} - {formatLocalTime(s.end)}
                </Text>
                {isGap && (
                  <Text style={styles.sessionHint}>
                    No activity logged between these times.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default SessionsPanel;

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
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
  },
  toggleActive: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  toggleText: {
    fontSize: 12,
    color: colors.ink,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
  },
  sessionGrid: {
    gap: spacing.sm,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  sessionGap: {
    borderColor: colors.bad,
  },
  sessionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sessionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  sessionDur: {
    fontSize: 12,
    color: colors.muted,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.muted,
  },
  sessionHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
});
