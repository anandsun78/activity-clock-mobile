import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { colorForActivity, fmtM } from "./utils";
import type { DonutRow, TrendDay, TrendPoint, TrendSeries } from "./types";
import { colors, radius, spacing } from "../../styles/theme";

type DonutChartProps = { rows: DonutRow[] };

export function DonutChart({ rows }: DonutChartProps) {
  const size = 180;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const filtered = rows.filter((r) => r.pct > 0.2);
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.border}
            strokeWidth={stroke}
          />
          {filtered.map((r) => {
            const len = (r.pct / 100) * circ;
            const dasharray = `${len} ${circ - len}`;
            const dashoffset = circ * offset;
            offset += r.pct / 100;
            return (
              <Circle
                key={r.activity}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colorForActivity(r.activity)}
                strokeWidth={stroke}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
              />
            );
          })}
        </G>
        <SvgText
          x="50%"
          y="50%"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize="14"
          fill={colors.ink}
        >
          Today (%)
        </SvgText>
      </Svg>
      <View style={styles.legend}>
        {filtered.map((r) => (
          <View key={r.activity} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colorForActivity(r.activity) },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.legendLabel} numberOfLines={1}>
                {r.activity}
              </Text>
              <Text style={styles.legendSub}>
                {r.pct.toFixed(1)}% - {Math.round(r.minutes)}m
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

type BarProps = { pct: number };

export function Bar({ pct }: BarProps) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.max(0, Math.min(100, pct)).toFixed(2)}%` },
        ]}
      />
    </View>
  );
}

type MultiLinePerDayProps = {
  days: TrendDay[];
  seriesByActivity: TrendSeries;
  selectable: string[];
  selectedSet: Set<string>;
  onToggle: (name: string) => void;
  mode: "m" | "pct";
};

export function MultiLinePerDay({
  days,
  seriesByActivity,
  selectable,
  selectedSet,
  onToggle,
  mode,
}: MultiLinePerDayProps) {
  const pad = { l: 44, r: 12, t: 10, b: 26 };
  const W = 760;
  const H = 240;
  const stepX = days.length > 1 ? (W - pad.l - pad.r) / (days.length - 1) : 0;

  const visibles = selectable.filter((a) => selectedSet.has(a));
  const key = mode === "pct" ? "pct" : "m";

  let maxY;
  if (mode === "pct") {
    const maxSeen = Math.max(
      1,
      ...visibles.flatMap((a) =>
        (seriesByActivity[a] || []).map((p) => p.pct || 0)
      )
    );
    maxY = Math.min(100, Math.max(25, Math.ceil(maxSeen / 10) * 10));
  } else {
    const maxSeen = Math.max(
      1,
      ...visibles.flatMap((a) =>
        (seriesByActivity[a] || []).map((p) => p.m || 0)
      )
    );
    maxY = Math.max(60, Math.ceil(maxSeen / 30) * 30);
  }
  const yToPix = (v: number) => pad.t + (1 - v / maxY) * (H - pad.t - pad.b);

  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={W} height={H}>
          {days.map((d, i) =>
            d.weekend && stepX > 0 ? (
              <Rect
                key={`wk-${i}`}
                x={pad.l + i * stepX - stepX / 2}
                y={pad.t}
                width={stepX}
                height={H - pad.t - pad.b}
                fill={colors.slate}
                opacity={0.12}
              />
            ) : null
          )}

          <Line
            x1={pad.l}
            y1={H - pad.b}
            x2={W - pad.r}
            y2={H - pad.b}
            stroke={colors.border}
          />
          <Line
            x1={pad.l}
            y1={pad.t}
            x2={W - pad.r}
            y2={H - pad.b}
            stroke={colors.border}
          />

          {[0, 0.25, 0.5, 0.75, 1].map((fr) => {
            const y = yToPix(fr * maxY);
            const label = mode === "pct" ? `${Math.round(fr * maxY)}%` : fmtM(fr * maxY);
            return (
              <React.Fragment key={fr}>
                <Line
                  x1={pad.l}
                  y1={y}
                  x2={W - pad.r}
                  y2={y}
                  stroke={colors.border}
                  opacity={0.4}
                />
                <SvgText
                  x={pad.l - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={colors.muted}
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {days.map((d, i) =>
            i % labelEvery === 0 ? (
              <SvgText
                key={d.date}
                x={pad.l + i * stepX}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill={colors.muted}
              >
                {d.date.slice(5)}
              </SvgText>
            ) : null
          )}

          {visibles.map((name) => {
            const pts = seriesByActivity[name] || [];
            const d = pts
              .map(
                (p, i) =>
                  `${i === 0 ? "M" : "L"}${pad.l + i * stepX},${yToPix(
                    p[key] || 0
                  )}`
              )
              .join(" ");
            const c = colorForActivity(name);
            return <Path key={name} d={d} fill="none" stroke={c} strokeWidth={2} />;
          })}
        </Svg>
      </ScrollView>

      <View style={styles.toggleWrap}>
        {selectable.map((name) => {
          const active = selectedSet.has(name);
          const c = colorForActivity(name);
          return (
            <Pressable
              key={name}
              onPress={() => onToggle(name)}
              style={[
                styles.toggle,
                {
                  borderColor: active ? c : colors.border,
                  backgroundColor: active ? colors.surface : colors.surfaceStrong,
                },
              ]}
            >
              <View style={[styles.legendDot, { backgroundColor: c, opacity: active ? 1 : 0.35 }]} />
              <Text style={styles.toggleText}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type SparklineProps = {
  points: TrendPoint[];
  mode?: "m" | "pct";
  color: string;
  height?: number;
  pad?: number;
};

export function Sparkline({ points, mode = "m", color, height = 44, pad = 4 }: SparklineProps) {
  const w = 160;
  const h = height;
  const key = mode === "pct" ? "pct" : "m";
  const vals = points.map((p) => p[key]);
  const max = Math.max(1, ...vals);
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const weekendRects = points.map((p, i) =>
    p.weekend ? (
      <Rect
        key={`wk-${i}`}
        x={pad + i * stepX - stepX / 2}
        y={pad}
        width={stepX}
        height={h - pad * 2}
        fill={colors.slate}
        opacity={0.12}
      />
    ) : null
  );
  const linePts = points
    .map(
      (p, i) =>
        `${pad + i * stepX},${pad + (1 - p[key] / max) * (h - pad * 2)}`
    )
    .join(" ");
  const last = points[points.length - 1];
  const lastVal = last ? last[key] : 0;
  return (
    <Svg width={w} height={h}>
      <Rect x="0" y="0" width={w} height={h} fill={colors.surface} rx={8} />
      {weekendRects}
      <Polyline fill="none" stroke={color} strokeWidth={2} points={linePts} />
      {points.length > 0 && (
        <Circle
          cx={pad + (points.length - 1) * stepX}
          cy={pad + (1 - lastVal / max) * (h - pad * 2)}
          r={2.5}
          fill={color}
        />
      )}
    </Svg>
  );
}

type ActivityCardMiniProps = {
  name: string;
  series: TrendSeries;
  mode: "m" | "pct";
  onFocus: (name: string) => void;
  focused: boolean;
};

export function ActivityCardMini({ name, series, mode, onFocus, focused }: ActivityCardMiniProps) {
  const color = colorForActivity(name);
  const v = series[name] || [];
  const last = v[v.length - 1];
  const metric = mode === "pct" ? `${(last?.pct ?? 0).toFixed(0)}%` : fmtM(last?.m ?? 0);
  return (
    <Pressable
      onPress={() => onFocus(name)}
      style={[
        styles.miniCard,
        { borderColor: focused ? color : colors.border },
      ]}
    >
      <View style={styles.miniHeader}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.miniTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.miniMetric}>{metric}</Text>
      </View>
      <Sparkline points={v} mode={mode} color={color} />
      <Text style={styles.miniSub}>
        {mode === "pct"
          ? "Last days (% of day). Shaded = weekend."
          : "Last days (minutes). Shaded = weekend."}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  donutWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
  },
  legend: {
    flex: 1,
    minWidth: 220,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.ink,
  },
  legendSub: {
    fontSize: 12,
    color: colors.muted,
  },
  barTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 10,
    overflow: "hidden",
  },
  barFill: {
    height: 10,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  toggleWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    color: colors.ink,
  },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    flex: 1,
  },
  miniMetric: {
    fontSize: 12,
    color: colors.muted,
  },
  miniSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
});
