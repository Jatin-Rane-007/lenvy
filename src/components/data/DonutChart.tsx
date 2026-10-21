import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { useTheme } from "@/theme";

export type DonutSegment = {
  key: string;
  value: number;
  /** Raw hex from the theme's category swatches. */
  color: string;
};

export type DonutChartProps = {
  segments: DonutSegment[];
  /** Outer diameter in points. */
  size?: number;
  /** Ring thickness in points. */
  stroke?: number;
  /** Centred label (total, caption) — kept short so it never clips. */
  center?: ReactNode;
};

/**
 * DonutChart (Data tier) — the category mix. Hand-built on react-native-svg
 * instead of pulling in a charting dependency: DESIGN.md wants ten muted
 * swatches coexisting in one ring, which is a dozen lines of arc geometry and
 * keeps the bundle honest.
 *
 * Segments are drawn as dashed strokes on one circle, so a 2-segment ring and
 * a 9-segment ring share the same geometry: each arc is a dash of the ring's
 * circumference, offset by the running total of what came before it.
 */
export function DonutChart({
  segments,
  size = 132,
  stroke = 18,
  center,
}: DonutChartProps) {
  const t = useTheme();
  const radius = (size - stroke) / 2;
  const centerPoint = size / 2;

  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((sum, s) => sum + s.value, 0);
  const circumference = 2 * Math.PI * radius;

  // Hairline gap between arcs, measured along the ring.
  const gap = positive.length > 1 ? circumference * 0.012 : 0;
  let cursor = 0;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <G rotation={-90} originX={centerPoint} originY={centerPoint}>
          {total === 0 ? (
            <Circle
              cx={centerPoint}
              cy={centerPoint}
              r={radius}
              stroke={t.colors.hairlineStrong}
              strokeWidth={stroke}
              fill="none"
            />
          ) : (
            positive.map((s) => {
              const share = (s.value / total) * circumference;
              const drawn = Math.max(share - gap, 1);
              const offset = -cursor;
              cursor += share;
              return (
                <Circle
                  key={s.key}
                  cx={centerPoint}
                  cy={centerPoint}
                  r={radius}
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  fill="none"
                  strokeDasharray={[drawn, circumference - drawn]}
                  strokeDashoffset={offset}
                />
              );
            })
          )}
        </G>
      </Svg>
      {center ? (
        <View
          pointerEvents="none"
          style={{ width: size - stroke * 2, alignItems: "center", gap: 2 }}
        >
          {center}
        </View>
      ) : null}
    </View>
  );
}
