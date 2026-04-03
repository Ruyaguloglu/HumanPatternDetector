// src/hooks/useAnalytics.ts
//
// Bridge between the analytics engine and the UI screens.
// Screens call this hook — they never import from analytics/ directly.

import { generateInsightCards, InsightCard } from "@/analytics/insights";
import { AnalyticsResult, analyzeCheckins } from "@/analytics/signals";
import { CheckIn } from "@/domain/CheckIn";
import { useMemo } from "react";

type UseAnalyticsReturn = {
  result: AnalyticsResult | null;
  insightCards: InsightCard[];
  isSufficientData: boolean;
};

// useMemo recalculates ONLY when checkins array changes.
// Without it, analytics would recalculate on every render — wasteful.
// With it, analytics run once per new check-in submission.

export function useAnalytics(checkins: CheckIn[]): UseAnalyticsReturn {
  const result = useMemo(() => {
    if (checkins.length === 0) return null;
    return analyzeCheckins(checkins);
  }, [checkins]);

  const insightCards = useMemo(() => {
    if (!result) return [];
    return generateInsightCards(result);
  }, [result]);

  return {
    result,
    insightCards,
    isSufficientData: result?.isSufficientData ?? false,
  };
}
