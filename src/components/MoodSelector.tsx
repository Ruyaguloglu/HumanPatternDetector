// src/components/MoodSelector.tsx
//
// ─── WHAT THIS COMPONENT DOES ────────────────────────────────────────────────
//
// Renders 5 selectable dots for mood input (1-5).
// Each dot has a color, a label, and a selected state.
//
// ─── COMPONENT DESIGN PRINCIPLES ─────────────────────────────────────────────
//
// 1. This component is DUMB — it knows nothing about storage or business logic.
//    It receives a value and a callback. That's it.
//    Parent controls the state. This just displays and reports taps.
//
// 2. Props are typed explicitly — no guessing what this component needs.
//
// 3. Single responsibility — MoodSelector ONLY handles mood selection.
//    Focus selection is a separate component.
//
// ─────────────────────────────────────────────────────────────────────────────

import { MOOD_LABELS } from "@/domain/CheckIn";
import { colors, textStyles } from "@/theme";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Props Type ───────────────────────────────────────────────────────────────
type MoodSelectorProps = {
  value: number; // currently selected mood (0 = nothing selected)
  onChange: (mood: number) => void; // called when user taps a dot
};

// ─── Mood Dot Colors ──────────────────────────────────────────────────────────
// Each mood value maps to a specific color from our design system.
const MOOD_COLORS: Record<number, string> = {
  1: colors.mood[1],
  2: colors.mood[2],
  3: colors.mood[3],
  4: colors.mood[4],
  5: colors.mood[5],
};

// ─── Single Dot Component ─────────────────────────────────────────────────────
// Extracted as its own component so each dot manages its own animation.
// This is a key React pattern: when items in a list need individual behavior,
// extract them into their own component.

type DotProps = {
  value: number;
  selected: boolean;
  active: boolean; // true if ANY dot is selected (dims unselected dots)
  onPress: (value: number) => void;
};

function MoodDot({ value, selected, active, onPress }: DotProps) {
  // ─── Animation ──────────────────────────────────────────────────
  // Animated.Value is a special React Native value that can be
  // smoothly interpolated. We use it to scale the dot on selection.
  //
  // useRef stores the Animated.Value without causing re-renders.
  // (useState would cause re-render on every animation frame — too slow)

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // When selected: scale up to 1.15, full opacity
    // When not selected but another is: scale down to 0.85, dim
    // When nothing selected: all normal size, full opacity
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.15 : active && !selected ? 0.88 : 1,
        useNativeDriver: true, // runs animation on native thread — smooth
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: selected ? 1 : active && !selected ? 0.35 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, active]);

  const dotColor = MOOD_COLORS[value];

  return (
    <TouchableOpacity
      onPress={() => onPress(value)}
      activeOpacity={0.8}
      style={styles.dotContainer}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: selected ? dotColor : "transparent",
            borderColor: dotColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            // Glow effect when selected
            shadowColor: selected ? dotColor : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: selected ? 0.6 : 0,
            shadowRadius: selected ? 12 : 0,
            elevation: selected ? 8 : 0,
          },
        ]}
      />
      <Text
        style={[
          styles.dotLabel,
          {
            color: selected ? dotColor : colors.text.muted,
            opacity: active && !selected ? 0.4 : 1,
          },
        ]}
      >
        {MOOD_LABELS[value].toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const anySelected = value > 0;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.symbol}>◐</Text>
        <Text style={styles.headerLabel}>MOOD</Text>
        {value > 0 && (
          <View style={styles.valueDisplay}>
            <Text style={[styles.valueText, { color: MOOD_COLORS[value] }]}>
              {value}
            </Text>
            <Text style={styles.valueMax}>/5</Text>
          </View>
        )}
      </View>

      {/* 5 dots in a row */}
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((v) => (
          <MoodDot
            key={v}
            value={v}
            selected={value === v}
            active={anySelected}
            onPress={onChange}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  symbol: {
    fontSize: 14,
    color: colors.text.muted,
  },
  headerLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginLeft: "auto",
    gap: 2,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "700",
  },
  valueMax: {
    ...textStyles.caption,
    color: colors.text.muted,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dotContainer: {
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  dotLabel: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
