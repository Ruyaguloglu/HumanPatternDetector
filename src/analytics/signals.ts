// src/analytics/signals.ts
//
// ─── THE PATTERN DETECTION ENGINE ────────────────────────────────────────────
//
// This file contains every mathematical function the engine uses.
// These are all PURE FUNCTIONS — meaning:
//
//   1. Same input always produces same output
//   2. No side effects (no storage, no UI, no network)
//   3. No external dependencies — just TypeScript math
//
// Why pure functions?
//   - Easy to test (input → output, no setup needed)
//   - Easy to reason about (no hidden state)
//   - Can run anywhere (phone, server, tests)
//   - Composable — you can chain them together cleanly
//
// ─────────────────────────────────────────────────────────────────────────────

import { CheckIn } from "@/domain/CheckIn";

// ─── RESULT TYPES ─────────────────────────────────────────────────────────────

export type SignalType =
  | "STABLE"
  | "VOLATILE"
  | "MOMENTUM"
  | "DECLINING"
  | "CONSISTENT";

export type TrendDirection = "rising" | "falling" | "flat";

export type AnalyticsResult = {
  // Signal
  signal: SignalType;
  signalConfidence: number; // 0-100, how confident we are in the signal

  // Averages
  moodAverage: number; // 1.0 - 5.0
  focusAverage: number; // 1.0 - 5.0

  // Stability
  stabilityScore: number; // 0 - 100
  volatilityIndex: number; // 0.0 - 4.0

  // Trends
  moodTrend: TrendDirection;
  focusTrend: TrendDirection;

  // Correlation
  moodFocusCorrelation: number; // -1.0 to 1.0

  // Meta
  dataPoints: number; // how many entries analyzed
  windowDays: number; // how many days the window covers
  isSufficientData: boolean; // false if < 3 entries (engine unreliable)
};

// ─── MINIMUM DATA THRESHOLD ───────────────────────────────────────────────────
// The engine needs at least this many entries to produce reliable signals.
// Below this, results would be statistically meaningless.
export const MIN_DATA_POINTS = 3;
export const ANALYSIS_WINDOW = 14; // analyze last 14 days

// ─── MATH UTILITIES ───────────────────────────────────────────────────────────

// Average (mean) of an array of numbers
// Example: average([2, 4, 6]) → 4.0
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Variance — measures how spread out values are from the mean
// Low variance = values cluster around the mean (stable)
// High variance = values are all over the place (volatile)
//
// Formula: average of squared differences from mean
// Why squared? So negative and positive differences don't cancel out.
// Example: variance([3,3,3,3]) → 0.0 (perfectly stable)
//          variance([1,5,1,5]) → 4.0 (maximum volatile on 1-5 scale)
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return average(squaredDiffs);
}

// Pearson Correlation Coefficient
// Measures the LINEAR relationship between two number arrays.
//
// Returns a value from -1.0 to +1.0:
//   +1.0 = perfect positive correlation (when mood goes up, focus always goes up)
//    0.0 = no relationship
//   -1.0 = perfect negative correlation (when mood goes up, focus always goes down)
//
// This is real statistics used in data science worldwide.
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const meanX = average(x);
  const meanY = average(y);

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0,
  );

  const denominatorX = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  const denominatorY = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const denominator = Math.sqrt(denominatorX * denominatorY);

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// Trend Direction
// Compares the average of the first half vs the second half.
// If second half average is meaningfully higher → rising
// If meaningfully lower → falling
// Otherwise → flat
//
// Why halves instead of first vs last point?
// Single points are noisy. A bad day at the end doesn't mean declining.
// Averages of halves are more reliable signals.
function trendDirection(values: number[]): TrendDirection {
  if (values.length < 3) return "flat";

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const firstAvg = average(firstHalf);
  const secondAvg = average(secondHalf);
  const delta = secondAvg - firstAvg;

  // Threshold of 0.4 on a 1-5 scale = meaningful change
  // Below this threshold = noise, not signal
  if (delta > 0.4) return "rising";
  if (delta < -0.4) return "falling";
  return "flat";
}

// ─── STABILITY SCORE ──────────────────────────────────────────────────────────
// Converts variance into a human-readable 0-100 stability score.
//
// Max possible variance on a 1-5 scale:
//   Worst case = alternating 1 and 5: variance = 4.0
//
// We normalize against this maximum, then invert
// (high variance = low stability)
function stabilityScore(moodValues: number[], focusValues: number[]): number {
  const moodVar = variance(moodValues);
  const focusVar = variance(focusValues);
  const combinedVariance = (moodVar + focusVar) / 2;
  const maxVariance = 4.0;
  const normalized = Math.min(combinedVariance / maxVariance, 1);
  return Math.round((1 - normalized) * 100);
}

// ─── SIGNAL CLASSIFICATION ────────────────────────────────────────────────────
// Takes computed metrics and returns the primary behavioral signal.
//
// Priority order matters — we check the most extreme conditions first.
// A volatile AND declining pattern → VOLATILE takes priority.
//
// These thresholds are intentionally conservative.
// Better to say STABLE when uncertain than to alarm the user falsely.

function classifySignal(
  stability: number,
  moodTrend: TrendDirection,
  focusTrend: TrendDirection,
  moodAvg: number,
  correlation: number,
): { signal: SignalType; confidence: number } {
  // VOLATILE: high instability regardless of direction
  if (stability < 40) {
    return {
      signal: "VOLATILE",
      confidence: Math.round((40 - stability) * 2.5),
    };
  }

  // MOMENTUM: both mood and focus trending upward
  if (moodTrend === "rising" && focusTrend === "rising") {
    return { signal: "MOMENTUM", confidence: 75 };
  }

  // DECLINING: mood falling
  if (moodTrend === "falling" && moodAvg < 3.0) {
    return { signal: "DECLINING", confidence: 70 };
  }

  // CONSISTENT: high stability + good averages + positive correlation
  if (stability >= 75 && moodAvg >= 3.5 && correlation > 0.3) {
    return { signal: "CONSISTENT", confidence: Math.round(stability * 0.9) };
  }

  // Default: STABLE
  return { signal: "STABLE", confidence: stability };
}

// ─── MAIN ANALYSIS FUNCTION ───────────────────────────────────────────────────
// This is the only function exported for external use.
// Everything above is internal implementation detail.
//
// Takes the full array of check-ins, analyzes the most recent window,
// returns a complete AnalyticsResult.

export function analyzeCheckins(checkins: CheckIn[]): AnalyticsResult {
  // ─── Filter to analysis window ──────────────────────────────────
  // Only analyze the most recent ANALYSIS_WINDOW days.
  // Older data would dilute recent patterns.
  const cutoff = Date.now() - ANALYSIS_WINDOW * 24 * 60 * 60 * 1000;
  const windowEntries = checkins
    .filter((c) => c.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp); // oldest first for trend calc

  const dataPoints = windowEntries.length;
  const isSufficientData = dataPoints >= MIN_DATA_POINTS;

  // ─── Insufficient data — return minimal result ───────────────────
  if (!isSufficientData) {
    return {
      signal: "STABLE",
      signalConfidence: 0,
      moodAverage:
        dataPoints > 0 ? average(windowEntries.map((c) => c.mood)) : 0,
      focusAverage:
        dataPoints > 0 ? average(windowEntries.map((c) => c.focus)) : 0,
      stabilityScore: 0,
      volatilityIndex: 0,
      moodTrend: "flat",
      focusTrend: "flat",
      moodFocusCorrelation: 0,
      dataPoints,
      windowDays: ANALYSIS_WINDOW,
      isSufficientData: false,
    };
  }

  // ─── Extract value arrays ────────────────────────────────────────
  const moods = windowEntries.map((c) => c.mood);
  const focuses = windowEntries.map((c) => c.focus);

  // ─── Calculate metrics ───────────────────────────────────────────
  const moodAvg = average(moods);
  const focusAvg = average(focuses);
  const moodVar = variance(moods);
  const focusVar = variance(focuses);
  const volatility = parseFloat(((moodVar + focusVar) / 2).toFixed(2));
  const stability = stabilityScore(moods, focuses);
  const moodTrend = trendDirection(moods);
  const focusTrend = trendDirection(focuses);
  const correlation = parseFloat(pearsonCorrelation(moods, focuses).toFixed(2));
  const { signal, confidence } = classifySignal(
    stability,
    moodTrend,
    focusTrend,
    moodAvg,
    correlation,
  );

  return {
    signal,
    signalConfidence: confidence,
    moodAverage: parseFloat(moodAvg.toFixed(1)),
    focusAverage: parseFloat(focusAvg.toFixed(1)),
    stabilityScore: stability,
    volatilityIndex: volatility,
    moodTrend,
    focusTrend,
    moodFocusCorrelation: correlation,
    dataPoints,
    windowDays: ANALYSIS_WINDOW,
    isSufficientData: true,
  };
}
