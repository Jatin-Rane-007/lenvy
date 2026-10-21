import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type SparklineProps = {
  /** Oldest → newest. Fewer than two points renders nothing at all. */
  values: number[];
  width: number;
  height?: number;
  color: string;
  strokeWidth?: number;
};

/**
 * Sparkline (Data tier) — the whisper-thin line under the hero balance
 * (DESIGN.md, signature moment 1). It is decoration-free by construction:
 * no axis, no labels, no invented history. If the ledger can't fill two
 * points, it renders nothing.
 */
export function Sparkline({
  values,
  width,
  height = 36,
  color,
  strokeWidth = 2,
}: SparklineProps) {
  const points = values.filter((v) => Number.isFinite(v));
  if (points.length < 2 || width <= 0) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = strokeWidth;
  const drawable = height - pad * 2;

  const step = width / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * step;
    const y = pad + drawable - ((v - min) / span) * drawable;
    return [x, y] as const;
  });

  const d = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  return (
    <View style={{ width, height }} accessible={false}>
      <Svg width={width} height={height}>
        <Path
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.4}
        />
      </Svg>
    </View>
  );
}
