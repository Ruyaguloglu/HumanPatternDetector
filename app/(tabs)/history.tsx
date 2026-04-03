// app/(tabs)/history.tsx
//
// ─── HISTORY SCREEN ──────────────────────────────────────────────────────────
//
// Displays all check-in entries in reverse chronological order.
// Most recent entry first — what happened today/yesterday is most relevant.
//
// ─── WHY FLATLIST INSTEAD OF SCROLLVIEW? ─────────────────────────────────────
//
// ScrollView renders ALL children at once — even the ones off screen.
// With 500 entries, ScrollView renders 500 items into memory. Slow and heavy.
//
// FlatList is a virtualized list — it only renders items currently visible
// on screen plus a small buffer. Scroll down → old items unmount,
// new items mount. Memory stays low regardless of data size.
//
// Rule: any list with unknown or potentially large length → use FlatList.
//
// ─────────────────────────────────────────────────────────────────────────────

import { CheckIn, FOCUS_LABELS, MOOD_LABELS } from "@/domain/CheckIn";
import { useCheckins } from "@/hooks/useCheckins";
import { colors, textStyles } from "@/theme";
import { useEffect, useRef } from "react";
import { Animated, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Date Formatting ──────────────────────────────────────────────────────────
// Converts a timestamp to a human-readable relative label.
// "Today", "Yesterday", or "Mon · Mar 17"
//
// Why not use a library like moment.js or date-fns?
// Our needs are simple. Adding a library for 10 lines of logic
// increases bundle size unnecessarily. Write it yourself when it's simple.

function formatEntryDate(timestamp: number): string {
  const entryDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(entryDate, today)) return "Today";
  if (isSameDay(entryDate, yesterday)) return "Yesterday";

  return entryDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Entry Card Component ─────────────────────────────────────────────────────
// Each row in the list. Extracted as its own component because:
// 1. FlatList renders it many times — keeping it lean matters
// 2. It has its own visual logic (colors, bars)
// 3. Separation of concerns — list management vs item display

type EntryCardProps = {
  entry: CheckIn;
  index: number;
};

function EntryCard({ entry, index }: EntryCardProps) {
  // Staggered fade-in animation — each card fades in slightly after the previous
  // Creates a cascade effect that feels polished without being distracting
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = Math.min(index * 40, 300); // cap delay at 300ms
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

  const moodColor = colors.mood[entry.mood as keyof typeof colors.mood];
  const focusColor = colors.focus[entry.focus as keyof typeof colors.focus];
  const dateLabel = formatEntryDate(entry.timestamp);
  const isToday = dateLabel === "Today";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Left — date */}
      <View style={styles.cardDate}>
        <Text
          style={[styles.dateText, isToday && { color: colors.accent.green }]}
        >
          {dateLabel}
        </Text>
        {isToday && <View style={styles.todayDot} />}
      </View>

      {/* Right — mood and focus bars */}
      <View style={styles.cardBars}>
        {/* Mood row */}
        <View style={styles.barRow}>
          <Text style={[styles.barSymbol, { color: moodColor }]}>◐</Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: `${(entry.mood / 5) * 100}%`,
                  backgroundColor: moodColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.barValue, { color: moodColor }]}>
            {entry.mood}
          </Text>
          <Text style={styles.barLabel}>{MOOD_LABELS[entry.mood]}</Text>
        </View>

        {/* Focus row */}
        <View style={styles.barRow}>
          <Text style={[styles.barSymbol, { color: focusColor }]}>◎</Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: `${(entry.focus / 5) * 100}%`,
                  backgroundColor: focusColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.barValue, { color: focusColor }]}>
            {entry.focus}
          </Text>
          <Text style={styles.barLabel}>{FOCUS_LABELS[entry.focus]}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Empty State Component ────────────────────────────────────────────────────
// Shown when user has no entries yet.
// Gives context — tells user what to do next.

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptySymbol}>◈</Text>
      <Text style={styles.emptyTitle}>No signals yet</Text>
      <Text style={styles.emptySubtitle}>
        Your first check-in will appear here.{"\n"}
        Tap Log to record today's signal.
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { checkins, isLoading } = useCheckins();

  // Reverse for newest-first display.
  // slice() creates a copy before reversing — never mutate state directly.
  const sorted = checkins.slice().reverse();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SIGNAL HISTORY</Text>
        <Text style={styles.screenTitle}>History</Text>
        <Text style={styles.entryCount}>
          {checkins.length} {checkins.length === 1 ? "entry" : "entries"}{" "}
          recorded
        </Text>
        <View style={styles.divider} />
      </View>

      {/* List */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <EntryCard entry={item} index={index} />
        )}
        contentContainerStyle={[
          styles.listContent,
          sorted.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        // Performance optimizations for FlatList:
        removeClippedSubviews={true} // unmount off-screen items
        maxToRenderPerBatch={10} // render 10 items per batch
        windowSize={10} // keep 10 screens worth in memory
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 2,
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
    marginBottom: 4,
  },
  entryCount: {
    ...textStyles.caption,
    color: colors.text.muted,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 8,
  },
  listEmpty: {
    flex: 1,
  },

  // Entry card
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 8,
    gap: 16,
  },
  cardDate: {
    width: 72,
    gap: 4,
  },
  dateText: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.green,
  },
  cardBars: {
    flex: 1,
    gap: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barSymbol: {
    fontSize: 10,
    width: 12,
  },
  barTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "700",
    width: 12,
    textAlign: "right",
  },
  barLabel: {
    ...textStyles.hint,
    color: colors.text.muted,
    width: 56,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingTop: 80,
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
    ...textStyles.caption,
    color: colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.5,
  },
});
