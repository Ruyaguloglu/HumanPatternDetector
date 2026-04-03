// app/(tabs)/insights.tsx
//
// ─── INSIGHTS SCREEN ─────────────────────────────────────────────────────────
//
// This screen is the "output" of the entire product.
// It takes raw check-in data → runs it through the analytics engine
// → displays patterns in human-readable form.
//
// ─── SCREEN STATES ───────────────────────────────────────────────────────────
//
//   LOADING      → data not ready yet
//   COLD START   → insufficient data (< 3 entries)
//   ACTIVE       → enough data, show full insights
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { useCheckins } from '@/hooks/useCheckins';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  SIGNAL_META,
  trendText,
  trendColor,
  stabilityLabel,
  correlationLabel,
  InsightCard,
} from '@/analytics/insights';
import { AnalyticsResult } from '@/analytics/signals';
import { colors, textStyles } from '@/theme';
import { MIN_DATA_POINTS } from '@/analytics/signals';

// ─── Signal Card ──────────────────────────────────────────────────────────────
// The primary card — shows the main behavioral signal prominently.

type SignalCardProps = {
  result: AnalyticsResult;
};

function SignalCard({ result }: SignalCardProps) {
  const meta = SIGNAL_META[result.signal];
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.signalCard,
        {
          borderColor: meta.color + '44',
          backgroundColor: meta.color + '08',
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Top row — symbol + label */}
      <View style={styles.signalTop}>
        <Text style={[styles.signalSymbol, { color: meta.color }]}>
          {meta.symbol}
        </Text>
        <View style={styles.signalTextGroup}>
          <Text style={[styles.signalLabel, { color: meta.color }]}>
            {meta.label}
          </Text>
          <Text style={styles.signalSublabel}>
            Primary behavioral signal
          </Text>
        </View>
        {/* Confidence badge */}
        <View style={[styles.confidenceBadge, { borderColor: meta.color + '44' }]}>
          <Text style={[styles.confidenceText, { color: meta.color }]}>
            {result.signalConfidence}%
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.signalDescription}>
        {meta.description}
      </Text>

      {/* Divider */}
      <View style={[styles.signalDivider, { backgroundColor: meta.color + '22' }]} />

      {/* Bottom — data window info */}
      <Text style={styles.signalMeta}>
        {result.dataPoints} entries · last {result.windowDays} days
      </Text>
    </Animated.View>
  );
}

// ─── Metric Grid ──────────────────────────────────────────────────────────────
// 2×3 grid of key metrics below the signal card.

type MetricItemProps = {
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  delay?: number;
};

function MetricItem({ label, value, subValue, valueColor, delay = 0 }: MetricItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.metricItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[
        styles.metricValue,
        valueColor ? { color: valueColor } : {},
      ]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {subValue && (
        <Text style={styles.metricSubValue}>{subValue}</Text>
      )}
    </Animated.View>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
// Individual observation cards below the metrics grid.

function InsightCardComponent({ card, index }: { card: InsightCard; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.insightCard,
        {
          borderLeftColor: card.color,
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={[styles.insightTitle, { color: card.color }]}>
        {card.title}
      </Text>
      <Text style={styles.insightBody}>{card.body}</Text>
    </Animated.View>
  );
}

// ─── Cold Start Screen ────────────────────────────────────────────────────────
// Shown when user doesn't have enough data yet.
// Sets correct expectations — critical for user retention.

type ColdStartProps = {
  dataPoints: number;
};

function ColdStart({ dataPoints }: ColdStartProps) {
  const remaining = MIN_DATA_POINTS - dataPoints;

  return (
    <View style={styles.coldStartContainer}>
      <Text style={styles.coldStartSymbol}>◈</Text>
      <Text style={styles.coldStartTitle}>Engine warming up</Text>
      <Text style={styles.coldStartSubtitle}>
        {dataPoints === 0
          ? `The pattern engine needs at least ${MIN_DATA_POINTS} check-ins to begin detecting signals.`
          : `${remaining} more ${remaining === 1 ? 'entry' : 'entries'} needed to activate pattern detection.`
        }
      </Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: MIN_DATA_POINTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < dataPoints
                ? { backgroundColor: colors.accent.green }
                : { backgroundColor: colors.border.default },
            ]}
          />
        ))}
      </View>

      <Text style={styles.coldStartHint}>
        {dataPoints}/{MIN_DATA_POINTS} signals recorded
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const { checkins, isLoading } = useCheckins();
  const { result, insightCards, isSufficientData } = useAnalytics(checkins);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Analyzing...</Text>
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
          <Text style={styles.headerLabel}>PATTERN ENGINE</Text>
          <Text style={styles.screenTitle}>Insights</Text>
          <View style={styles.divider} />
        </View>

        {/* Cold start state */}
        {!isSufficientData && (
          <ColdStart dataPoints={checkins.length} />
        )}

        {/* Active state — full insights */}
        {isSufficientData && result && (
          <View style={styles.insightsContent}>

            {/* Primary signal card */}
            <SignalCard result={result} />

            {/* Section label */}
            <Text style={styles.sectionLabel}>KEY METRICS</Text>

            {/* Metrics grid */}
            <View style={styles.metricsGrid}>
              <MetricItem
                label="Stability"
                value={`${result.stabilityScore}%`}
                subValue={stabilityLabel(result.stabilityScore)}
                valueColor={
                  result.stabilityScore >= 60
                    ? colors.accent.green
                    : result.stabilityScore >= 40
                    ? colors.accent.amber
                    : colors.signal.declining
                }
                delay={0}
              />
              <MetricItem
                label="Avg Mood"
                value={result.moodAverage.toString()}
                subValue={`of 5.0`}
                valueColor={colors.mood[Math.round(result.moodAverage) as keyof typeof colors.mood]}
                delay={60}
              />
              <MetricItem
                label="Avg Focus"
                value={result.focusAverage.toString()}
                subValue="of 5.0"
                valueColor={colors.focus[Math.round(result.focusAverage) as keyof typeof colors.focus]}
                delay={120}
              />
              <MetricItem
                label="Volatility"
                value={result.volatilityIndex.toString()}
                subValue="variation index"
                delay={180}
              />
              <MetricItem
                label="Mood Trend"
                value={trendText(result.moodTrend)}
                valueColor={trendColor(result.moodTrend)}
                delay={240}
              />
              <MetricItem
                label="Focus Trend"
                value={trendText(result.focusTrend)}
                valueColor={trendColor(result.focusTrend)}
                delay={300}
              />
            </View>

            {/* Correlation row */}
            <View style={styles.correlationRow}>
              <Text style={styles.correlationLabel}>Mood ↔ Focus</Text>
              <Text style={styles.correlationValue}>
                {correlationLabel(result.moodFocusCorrelation)}
              </Text>
              <Text style={[
                styles.correlationNumber,
                {
                  color: result.moodFocusCorrelation > 0
                    ? colors.accent.green
                    : colors.signal.declining
                },
              ]}>
                {result.moodFocusCorrelation > 0 ? '+' : ''}{result.moodFocusCorrelation}
              </Text>
            </View>

            {/* Insight cards */}
            {insightCards.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>OBSERVATIONS</Text>
                {insightCards.map((card, i) => (
                  <InsightCardComponent key={card.id} card={card} index={i} />
                ))}
              </>
            )}

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
    justifyContent: 'center',
    alignItems: 'center',
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

  // Content
  insightsContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
    marginTop: 8,
  },

  // Signal card
  signalCard: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 10,
    gap: 10,
  },
  signalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signalSymbol: {
    fontSize: 28,
  },
  signalTextGroup: {
    flex: 1,
    gap: 2,
  },
  signalLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signalSublabel: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signalDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  signalDivider: {
    height: 1,
  },
  signalMeta: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    width: '31%',
    padding: 12,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 8,
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metricLabel: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  metricSubValue: {
    fontSize: 9,
    color: colors.text.muted,
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // Correlation row
  correlationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 8,
    gap: 8,
  },
  correlationLabel: {
    ...textStyles.caption,
    color: colors.text.muted,
    flex: 1,
  },
  correlationValue: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  correlationNumber: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Insight cards
  insightCard: {
    padding: 14,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderLeftWidth: 3,
    borderRadius: 8,
    gap: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  insightBody: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Cold start
  coldStartContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  coldStartSymbol: {
    fontSize: 48,
    color: colors.text.muted,
    opacity: 0.3,
    marginBottom: 8,
  },
  coldStartTitle: {
    ...textStyles.sectionTitle,
    color: colors.text.secondary,
  },
  coldStartSubtitle: {
    ...textStyles.body,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  coldStartHint: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 1,
  },
});