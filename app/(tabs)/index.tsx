// app/(tabs)/index.tsx
//
// ─── THE MOST IMPORTANT SCREEN ───────────────────────────────────────────────
//
// This is the core product loop:
//   User opens app → selects mood → selects focus → taps submit → done
//
// Target: under 10 seconds total interaction time.
//
// ─── SCREEN STATES ───────────────────────────────────────────────────────────
//
// This screen has 3 distinct states:
//
//   1. READY    → user hasn't checked in today, selectors visible
//   2. SAVING   → submit tapped, waiting for storage write
//   3. DONE     → checked in today, confirmation shown
//
// We use a single 'screenState' variable to control which UI renders.
// This is cleaner than multiple boolean flags that can conflict.
//
// ─────────────────────────────────────────────────────────────────────────────

import { FocusSelector } from "@/components/FocusSelector";
import { MoodSelector } from "@/components/MoodSelector";
import { FOCUS_LABELS, MOOD_LABELS } from "@/domain/CheckIn";
import { useCheckins } from "@/hooks/useCheckins";
import { colors, textStyles } from "@/theme";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Screen State Type ────────────────────────────────────────────────────────
type ScreenState = "ready" | "saving" | "done";

export default function CheckInScreen() {
  // ─── Data Hook ──────────────────────────────────────────────────
  const { addCheckin, hasCheckedInToday, todaysCheckin } = useCheckins();

  // ─── Local UI State ──────────────────────────────────────────────
  const [mood, setMood] = useState<number>(0);
  const [focus, setFocus] = useState<number>(0);
  const [screenState, setScreenState] = useState<ScreenState>(
    // Initialize directly to 'done' if already checked in today.
    // This handles app restarts mid-day correctly.
    hasCheckedInToday ? "done" : "ready",
  );

  // ─── Sync screen state when hook loads data ──────────────────────
  // useCheckins loads data asynchronously. When it finishes,
  // hasCheckedInToday updates. We need to react to that change.
  useEffect(() => {
    if (hasCheckedInToday) {
      setScreenState("done");
    }
  }, [hasCheckedInToday]);

  // ─── Animations ─────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fade + slide up on mount — subtle entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Submit Handler ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!mood || !focus) return;
    setScreenState("saving");
    const success = await addCheckin(mood, focus);
    if (success) {
      setScreenState("done");
    } else {
      // If save failed, return to ready state so user can try again
      setScreenState("ready");
    }
  };

  const canSubmit = mood > 0 && focus > 0 && screenState === "ready";

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
              .toUpperCase()}
          </Text>
          <Text style={styles.screenTitle}>Daily Signal</Text>
          <View style={styles.divider} />
        </View>

        {/* ── READY STATE — show selectors ── */}
        {screenState === "ready" && (
          <View style={styles.selectorsContainer}>
            <MoodSelector value={mood} onChange={setMood} />
            <FocusSelector value={focus} onChange={setFocus} />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                canSubmit ? styles.submitActive : styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.submitText, { opacity: canSubmit ? 1 : 0.3 }]}
              >
                RECORD SIGNAL
              </Text>
            </TouchableOpacity>

            <Text style={styles.hintText}>
              {!mood && !focus
                ? "select mood and focus"
                : !mood
                  ? "select your mood"
                  : !focus
                    ? "select your focus"
                    : "ready to record"}
            </Text>
          </View>
        )}

        {/* ── SAVING STATE ── */}
        {screenState === "saving" && (
          <View style={styles.centerState}>
            <Text style={styles.savingText}>Recording...</Text>
          </View>
        )}

        {/* ── DONE STATE — confirmation ── */}
        {screenState === "done" && <DoneState checkin={todaysCheckin} />}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Done State Component ─────────────────────────────────────────────────────
// Extracted into its own component to keep CheckInScreen clean.
// Shows today's recorded values with a confirmation message.

type DoneStateProps = {
  checkin: { mood: number; focus: number } | undefined;
};

function DoneState({ checkin }: DoneStateProps) {
  // Fade in animation for the confirmation screen
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const moodColor = checkin
    ? colors.mood[checkin.mood as keyof typeof colors.mood]
    : colors.text.muted;
  const focusColor = checkin
    ? colors.focus[checkin.focus as keyof typeof colors.focus]
    : colors.text.muted;

  return (
    <Animated.View style={[styles.doneContainer, { opacity: fadeAnim }]}>
      {/* Confirmation symbol */}
      <Text style={styles.doneSymbol}>◉</Text>
      <Text style={styles.doneTitle}>Logged.</Text>
      <Text style={styles.doneSubtitle}>Pattern engine updated.</Text>

      {/* Today's values */}
      {checkin && (
        <View style={styles.doneValues}>
          <View style={styles.doneValueItem}>
            <Text style={[styles.doneValueNumber, { color: moodColor }]}>
              {checkin.mood}
            </Text>
            <Text style={styles.doneValueLabel}>MOOD</Text>
            <Text style={[styles.doneValueDesc, { color: moodColor }]}>
              {MOOD_LABELS[checkin.mood]}
            </Text>
          </View>

          <View style={styles.doneDivider} />

          <View style={styles.doneValueItem}>
            <Text style={[styles.doneValueNumber, { color: focusColor }]}>
              {checkin.focus}
            </Text>
            <Text style={styles.doneValueLabel}>FOCUS</Text>
            <Text style={[styles.doneValueDesc, { color: focusColor }]}>
              {FOCUS_LABELS[checkin.focus]}
            </Text>
          </View>
        </View>
      )}

      {/* Next check-in hint */}
      <Text style={styles.nextHint}>Next signal tomorrow</Text>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  content: {
    flex: 1,
    padding: 24,
  },

  // Header
  header: {
    marginBottom: 36,
  },
  dateLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
    marginBottom: 6,
  },
  screenTitle: {
    ...textStyles.screenTitle,
    color: colors.text.primary,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // Selectors
  selectorsContainer: {
    flex: 1,
    paddingTop: 32,
  },

  // Submit button
  submitButton: {
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  submitActive: {
    borderColor: colors.text.primary,
  },
  submitDisabled: {
    borderColor: colors.border.default,
  },
  submitText: {
    ...textStyles.button,
    color: colors.text.primary,
    letterSpacing: 2,
  },
  hintText: {
    ...textStyles.hint,
    color: colors.text.muted,
    textAlign: "center",
    letterSpacing: 1,
  },

  // Saving state
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  savingText: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 2,
  },

  // Done state
  doneContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  doneSymbol: {
    fontSize: 48,
    color: colors.accent.green,
    marginBottom: 8,
  },
  doneTitle: {
    ...textStyles.screenTitle,
    color: colors.text.primary,
  },
  doneSubtitle: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  doneValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
    marginBottom: 24,
  },
  doneValueItem: {
    alignItems: "center",
    gap: 4,
  },
  doneValueNumber: {
    fontSize: 36,
    fontWeight: "700",
  },
  doneValueLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
  },
  doneValueDesc: {
    ...textStyles.caption,
    letterSpacing: 1,
  },
  doneDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border.subtle,
  },
  nextHint: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1.5,
  },
});
