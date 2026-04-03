// app/(tabs)/trends.tsx
//
// ─── TRENDS SCREEN ───────────────────────────────────────────────────────────
//
// Visualizes mood and focus data over time as line charts.
//
// ─── WHY WE BUILD CHARTS OURSELVES ──────────────────────────────────────────
//
// Chart libraries (Victory, Recharts, etc.) are heavy — 300KB+ added to
// your bundle. For simple line charts, that's unnecessary.
//
// We use React Native's built-in View components to build charts.
// The technique: position View elements absolutely within a container,
// calculated from data values mapped to pixel coordinates.
//
// ─── THE CHART MATH ──────────────────────────────────────────────────────────
//
// To draw a line chart, we need to convert data values to pixel positions.
//
// X axis = time (index of entry in array)
// Y axis = value (1-5 score)
//
// Formula:
//   xPos = (index / (totalPoints - 1)) * chartWidth
//   yPos = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
//
// Why subtract from chartHeight for Y?
//   Screen coordinates go TOP to BOTTOM (0 = top, height = bottom).
//   Data values go BOTTOM to TOP (1 = low, 5 = high).
//   So we invert: higher value = smaller Y position = higher on screen.
//
// ─────────────────────────────────────────────────────────────────────────────

import { CheckIn } from "@/domain/CheckIn";
import { useCheckins } from "@/hooks/useCheckins";
import { colors, textStyles } from "@/theme";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Chart Constants ──────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HORIZONTAL_PADDING = 48; // space for y-axis labels
const CHART_WIDTH = SCREEN_WIDTH - 48 - CHART_HORIZONTAL_PADDING;
const CHART_HEIGHT = 120;
const MIN_VAL = 1;
const MAX_VAL = 5;
const DOT_RADIUS = 4;

// ─── Coordinate Calculator ────────────────────────────────────────────────────
// Converts a data point (index, value) to pixel coordinates (x, y).

function toCoords(
  index: number,
  value: number,
  totalPoints: number,
): { x: number; y: number } {
  const x =
    totalPoints === 1
      ? CHART_WIDTH / 2
      : (index / (totalPoints - 1)) * CHART_WIDTH;

  const y =
    CHART_HEIGHT - ((value - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;

  return { x, y };
}

// ─── Line Segment ─────────────────────────────────────────────────────────────
// Draws a single line between two points using a rotated View.
//
// React Native has no native line drawing primitive.
// The technique: create a thin View (height: 2), position it at the
// start point, set its width to the distance between points,
// then rotate it to the correct angle.
//
// This is a well-known React Native pattern for drawing lines
// without SVG or canvas libraries.

type LineSegmentProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
};

function LineSegment({ x1, y1, x2, y2, color }: LineSegmentProps) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={{
        position: "absolute",
        left: x1,
        top: y1 - 1,
        width: length,
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
        transformOrigin: "left center",
        transform: [{ rotate: `${angle}deg` }],
        opacity: 0.85,
      }}
    />
  );
}

// ─── Chart Component ──────────────────────────────────────────────────────────
// Renders a complete line chart for a given data series.

type ChartProps = {
  data: CheckIn[];
  valueKey: "mood" | "focus";
  lineColor: string;
  label: string;
};

function LineChart({ data, valueKey, lineColor, label }: ChartProps) {
  // Need at least 2 points to draw a line
  const hasEnoughData = data.length >= 2;

  // Grid line values for Y axis — marks at 1, 2, 3, 4, 5
  const gridValues = [1, 2, 3, 4, 5];

  return (
    <View style={styles.chartContainer}>
      {/* Chart header */}
      <View style={styles.chartHeader}>
        <Text style={[styles.chartLabel, { color: lineColor }]}>
          {label.toUpperCase()}
        </Text>
        {data.length > 0 && (
          <Text style={styles.chartLatest}>
            Latest: {data[data.length - 1][valueKey]}
          </Text>
        )}
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          {[5, 4, 3, 2, 1].map((v) => (
            <Text key={v} style={styles.yAxisLabel}>
              {v}
            </Text>
          ))}
        </View>

        {/* Plot area */}
        <View
          style={[
            styles.plotArea,
            { width: CHART_WIDTH, height: CHART_HEIGHT },
          ]}
        >
          {/* Grid lines */}
          {gridValues.map((v) => {
            const y =
              CHART_HEIGHT -
              ((v - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;
            return <View key={v} style={[styles.gridLine, { top: y }]} />;
          })}

          {/* Not enough data message */}
          {!hasEnoughData && data.length === 1 && (
            <View style={styles.singlePointNote}>
              <Text style={styles.singlePointText}>
                One more entry to see a line
              </Text>
            </View>
          )}

          {/* Line segments between points */}
          {hasEnoughData &&
            data.map((entry, i) => {
              if (i === 0) return null;
              const prev = data[i - 1];
              const { x: x1, y: y1 } = toCoords(
                i - 1,
                prev[valueKey],
                data.length,
              );
              const { x: x2, y: y2 } = toCoords(
                i,
                entry[valueKey],
                data.length,
              );
              return (
                <LineSegment
                  key={entry.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  color={lineColor}
                />
              );
            })}

          {/* Data point dots */}
          {data.map((entry, i) => {
            const { x, y } = toCoords(i, entry[valueKey], data.length);
            const isLast = i === data.length - 1;
            return (
              <View
                key={entry.id}
                style={[
                  styles.dot,
                  {
                    left: x - DOT_RADIUS,
                    top: y - DOT_RADIUS,
                    backgroundColor: isLast ? lineColor : lineColor + "88",
                    borderColor: isLast ? lineColor : "transparent",
                    width: isLast ? DOT_RADIUS * 2 + 2 : DOT_RADIUS * 2,
                    height: isLast ? DOT_RADIUS * 2 + 2 : DOT_RADIUS * 2,
                    borderRadius: isLast ? DOT_RADIUS + 1 : DOT_RADIUS,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* X axis — date labels for first and last entry */}
      {data.length >= 2 && (
        <View style={styles.xAxis}>
          <Text style={styles.xAxisLabel}>
            {new Date(data[0].timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.xAxisLabel}>
            {new Date(data[data.length - 1].timestamp).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              },
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
// Quick summary stats shown above the charts.

type StatsRowProps = {
  checkins: CheckIn[];
};

function StatsRow({ checkins: data }: StatsRowProps) {
  if (data.length === 0) return null;

  const moods = data.map((c) => c.mood);
  const focuses = data.map((c) => c.focus);
  const avg = (arr: number[]) =>
    (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);

  const daysSinceFirst = Math.floor(
    (Date.now() - data[0].timestamp) / (1000 * 60 * 60 * 24),
  );

  return (
    <View style={styles.statsRow}>
      {[
        { label: "ENTRIES", value: data.length.toString() },
        { label: "AVG MOOD", value: avg(moods) },
        { label: "AVG FOCUS", value: avg(focuses) },
        { label: "DAYS", value: daysSinceFirst.toString() },
      ].map((stat) => (
        <View key={stat.label} style={styles.statItem}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptySymbol}>∿</Text>
      <Text style={styles.emptyTitle}>No trend data yet</Text>
      <Text style={styles.emptySubtitle}>
        Charts appear after your first check-in.{"\n"}
        Tap Log to record today's signal.
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrendsScreen() {
  const { checkins, isLoading } = useCheckins();

  // Sort oldest first for correct chart direction (left = past, right = present)
  const sorted = checkins.slice().sort((a, b) => a.timestamp - b.timestamp);

  // Show last 30 entries maximum — charts get crowded beyond this
  const chartData = sorted.slice(-30);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>SIGNAL TRENDS</Text>
          <Text style={styles.screenTitle}>Trends</Text>
          <View style={styles.divider} />
        </View>

        {checkins.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.content}>
            {/* Summary stats */}
            <StatsRow checkins={chartData} />

            {/* Mood chart */}
            <LineChart
              data={chartData}
              valueKey="mood"
              lineColor={colors.mood[3]}
              label="Mood"
            />

            {/* Focus chart */}
            <LineChart
              data={chartData}
              valueKey="focus"
              lineColor={colors.focus[3]}
              label="Focus"
            />

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors.mood[3] },
                  ]}
                />
                <Text style={styles.legendText}>Mood (1–5)</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: colors.focus[3] },
                  ]}
                />
                <Text style={styles.legendText}>Focus (1–5)</Text>
              </View>
              <Text style={styles.legendNote}>
                Showing last {Math.min(checkins.length, 30)} entries
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  screenTitle: {
    ...textStyles.screenTitle,
    color: colors.text.primary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statLabel: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1,
  },

  // Chart
  chartContainer: {
    gap: 8,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartLabel: {
    ...textStyles.label,
    letterSpacing: 2,
  },
  chartLatest: {
    ...textStyles.caption,
    color: colors.text.muted,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    width: CHART_HORIZONTAL_PADDING - 8,
    height: CHART_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  yAxisLabel: {
    ...textStyles.hint,
    color: colors.text.muted,
    lineHeight: 10,
  },
  plotArea: {
    position: "relative",
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 6,
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dot: {
    position: "absolute",
    borderWidth: 2,
  },
  singlePointNote: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  singlePointText: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1,
  },

  // X axis
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: CHART_HORIZONTAL_PADDING,
  },
  xAxisLabel: {
    ...textStyles.hint,
    color: colors.text.muted,
  },

  // Legend
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...textStyles.caption,
    color: colors.text.muted,
  },
  legendNote: {
    ...textStyles.hint,
    color: colors.text.muted,
    marginLeft: "auto",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptySymbol: {
    fontSize: 40,
    color: colors.text.muted,
    opacity: 0.3,
    marginBottom: 8,
  },
  emptyTitle: {
    ...textStyles.sectionTitle,
    color: colors.text.secondary,
  },
  emptySubtitle: {
    ...textStyles.body,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 22,
  },
});
