import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Line, Polyline, Circle, Text as SvgText } from "react-native-svg";
import type { WeightPoint } from "./types";
import { Card, CardHeader, Chip } from "../shared/Card";
import { colors, spacing } from "../../styles/theme";

type WeightChartCardProps = {
  series: WeightPoint[];
};

const WeightChartCard: React.FC<WeightChartCardProps> = ({ series }) => {
  if (series.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Text style={styles.headerText}>Weight (graph)</Text>
          <Chip>Trend over time</Chip>
        </CardHeader>
        <Text style={styles.emptyText}>
          No weight data yet. Add some daily weights to see the graph.
        </Text>
      </Card>
    );
  }

  const width = 600;
  const height = 220;
  const padding = 32;

  const weights = series.map((p) => p.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);

  const margin = 0.5;
  minW -= margin;
  maxW += margin;

  if (minW === maxW) {
    minW -= 1;
    maxW += 1;
  }

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const xForIndex = (i: number) => {
    if (series.length === 1) return width / 2;
    return padding + (i / (series.length - 1)) * innerWidth;
  };

  const yForWeight = (w: number) => {
    const t = (w - minW) / (maxW - minW || 1);
    return padding + (1 - t) * innerHeight;
  };

  const points = series
    .map((p, i) => `${xForIndex(i)},${yForWeight(p.weight)}`)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <Text style={styles.headerText}>Weight (graph)</Text>
        <Chip>Trend over time</Chip>
      </CardHeader>

      <View style={styles.chartWrap}>
        <Svg width={width} height={height}>
          <Line
            x1="24"
            y1={height - 24}
            x2={width - 24}
            y2={height - 24}
            stroke={colors.border}
            strokeWidth={1}
          />
          <Line
            x1="24"
            y1="24"
            x2="24"
            y2={height - 24}
            stroke={colors.border}
            strokeWidth={1}
          />

          <Polyline fill="none" stroke={colors.accent} strokeWidth={2} points={points} />

          {series.map((p, i) => (
            <Circle
              key={p.date}
              cx={xForIndex(i)}
              cy={yForWeight(p.weight)}
              r={4}
              fill={colors.accent}
            />
          ))}

          <SvgText x="28" y="32" fontSize="10" fill={colors.muted}>
            {maxW.toFixed(1)} lbs
          </SvgText>
          <SvgText x="28" y={height - 28} fontSize="10" fill={colors.muted}>
            {minW.toFixed(1)} lbs
          </SvgText>

          <SvgText
            x={xForIndex(0)}
            y={height - 10}
            fontSize="9"
            textAnchor="middle"
            fill={colors.muted}
          >
            {series[0].date.slice(5)}
          </SvgText>
          <SvgText
            x={xForIndex(series.length - 1)}
            y={height - 10}
            fontSize="9"
            textAnchor="middle"
            fill={colors.muted}
          >
            {series[series.length - 1].date.slice(5)}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          First: {series[0].weight.toFixed(1)} lbs ({series[0].date})
        </Text>
        <Text style={styles.footerText}>
          Latest: {series[series.length - 1].weight.toFixed(1)} lbs ({
            series[series.length - 1].date
          })
        </Text>
      </View>
    </Card>
  );
};

export default WeightChartCard;

const styles = StyleSheet.create({
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  emptyText: {
    color: colors.muted,
  },
  chartWrap: {
    overflow: "hidden",
  },
  footer: {
    marginTop: spacing.md,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.muted,
  },
});
