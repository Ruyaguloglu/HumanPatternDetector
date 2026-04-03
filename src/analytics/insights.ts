// src/analytics/insights.ts
//
// ─── WHAT THIS FILE DOES ──────────────────────────────────────────────────────
//
// signals.ts produces numbers and enums.
// This file turns those numbers into human-readable text and UI metadata.
//
// Separation of concerns:
//   signals.ts  → pure math, no text
//   insights.ts → pure text/metadata, no math
//   UI screens  → display only, no logic
//
// ─────────────────────────────────────────────────────────────────────────────

import { colors } from "@/theme";
import { AnalyticsResult, SignalType, TrendDirection } from "./signals";

// ─── Signal Metadata ──────────────────────────────────────────────────────────
// Every signal has a color, icon, label, and description.
// Keeping this in one place means changing a signal's text = one edit.

export type SignalMeta = {
  color: string;
  symbol: string;
  label: string;
  description: string;
};

export const SIGNAL_META: Record<SignalType, SignalMeta> = {
  STABLE: {
    color: colors.signal.stable,
    symbol: "◈",
    label: "Stable Pattern",
    description:
      "Your mood and focus are showing consistent, predictable behavior.",
  },
  VOLATILE: {
    color: colors.signal.volatile,
    symbol: "◇",
    label: "High Volatility",
    description:
      "Significant swings detected. Your emotional and cognitive states are fluctuating.",
  },
  MOMENTUM: {
    color: colors.signal.momentum,
    symbol: "▲",
    label: "Positive Momentum",
    description:
      "Both mood and focus are trending upward. Strong growth pattern detected.",
  },
  DECLINING: {
    color: colors.signal.declining,
    symbol: "▼",
    label: "Declining Trend",
    description:
      "A downward pattern has been detected. Consider your recent habits and recovery.",
  },
  CONSISTENT: {
    color: colors.signal.consistent,
    symbol: "●",
    label: "Strong Consistency",
    description:
      "Exceptional behavioral consistency detected. Your patterns are highly stable.",
  },
};

// ─── Trend Text ───────────────────────────────────────────────────────────────
export function trendText(trend: TrendDirection): string {
  switch (trend) {
    case "rising":
      return "↑ Rising";
    case "falling":
      return "↓ Falling";
    case "flat":
      return "→ Stable";
  }
}

export function trendColor(trend: TrendDirection): string {
  switch (trend) {
    case "rising":
      return colors.accent.green;
    case "falling":
      return colors.signal.declining;
    case "flat":
      return colors.text.muted;
  }
}

// ─── Stability Label ──────────────────────────────────────────────────────────
export function stabilityLabel(score: number): string {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very Low";
}

// ─── Correlation Label ────────────────────────────────────────────────────────
export function correlationLabel(correlation: number): string {
  const abs = Math.abs(correlation);
  const direction = correlation >= 0 ? "positive" : "negative";
  if (abs >= 0.7) return `Strong ${direction}`;
  if (abs >= 0.4) return `Moderate ${direction}`;
  if (abs >= 0.2) return `Weak ${direction}`;
  return "No clear link";
}

// ─── Insight Cards ────────────────────────────────────────────────────────────
// Generates an array of insight text cards from analytics results.
// Each insight is one observation about the user's patterns.
// These are shown on the Insights screen below the main signal card.

export type InsightCard = {
  id: string;
  title: string;
  body: string;
  color: string;
};

export function generateInsightCards(result: AnalyticsResult): InsightCard[] {
  if (!result.isSufficientData) return [];

  const cards: InsightCard[] = [];

  // ─── Mood/Focus relationship insight ──────────────────────────
  if (Math.abs(result.moodFocusCorrelation) >= 0.4) {
    cards.push({
      id: "correlation",
      title:
        result.moodFocusCorrelation > 0
          ? "Mood drives focus"
          : "Mood and focus diverge",
      body:
        result.moodFocusCorrelation > 0
          ? `When your mood is high, your focus tends to follow. Correlation: ${result.moodFocusCorrelation.toFixed(2)}`
          : `Your focus and mood move independently. This can indicate compartmentalization.`,
      color: colors.accent.blue,
    });
  }

  // ─── Volatility insight ────────────────────────────────────────
  if (result.volatilityIndex > 2.0) {
    cards.push({
      id: "volatility",
      title: "High variation detected",
      body: `Your scores vary significantly day to day (index: ${result.volatilityIndex}). Consistent routines may help stabilize patterns.`,
      color: colors.accent.amber,
    });
  } else if (result.volatilityIndex < 0.5 && result.isSufficientData) {
    cards.push({
      id: "stability",
      title: "Remarkably consistent",
      body: `Very low variation in your patterns (index: ${result.volatilityIndex}). Your behavioral baseline is stable.`,
      color: colors.accent.green,
    });
  }

  // ─── Average insight ───────────────────────────────────────────
  if (result.moodAverage >= 4.0 && result.focusAverage >= 4.0) {
    cards.push({
      id: "high_performer",
      title: "High performance window",
      body: `Both mood (${result.moodAverage}) and focus (${result.focusAverage}) are averaging above 4. You are in a strong performance state.`,
      color: colors.accent.green,
    });
  } else if (result.moodAverage <= 2.5) {
    cards.push({
      id: "low_mood",
      title: "Low mood period",
      body: `Your average mood (${result.moodAverage}) has been below midpoint. Monitor sleep, exercise, and recovery patterns.`,
      color: colors.signal.declining,
    });
  }

  // ─── Trend insight ─────────────────────────────────────────────
  if (result.moodTrend === "rising" && result.focusTrend === "rising") {
    cards.push({
      id: "uptrend",
      title: "Upward trajectory",
      body: "Both mood and focus are improving over your recent entries. Positive momentum is building.",
      color: colors.accent.blue,
    });
  }

  return cards;
}
