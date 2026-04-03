// src/components/FocusSelector.tsx
//
// Same pattern as MoodSelector but for focus.
// Blue color scale instead of warm scale.
// Different labels reflecting cognitive states.

import { FOCUS_LABELS } from "@/domain/CheckIn";
import { colors, textStyles } from "@/theme";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FocusSelectorProps = {
  value: number;
  onChange: (focus: number) => void;
};

const FOCUS_COLORS: Record<number, string> = {
  1: colors.focus[1],
  2: colors.focus[2],
  3: colors.focus[3],
  4: colors.focus[4],
  5: colors.focus[5],
};

type DotProps = {
  value: number;
  selected: boolean;
  active: boolean;
  onPress: (value: number) => void;
};

function FocusDot({ value, selected, active, onPress }: DotProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.15 : active && !selected ? 0.88 : 1,
        useNativeDriver: true,
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

  const dotColor = FOCUS_COLORS[value];

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
        {FOCUS_LABELS[value].toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

export function FocusSelector({ value, onChange }: FocusSelectorProps) {
  const anySelected = value > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.symbol}>◎</Text>
        <Text style={styles.headerLabel}>FOCUS</Text>
        {value > 0 && (
          <View style={styles.valueDisplay}>
            <Text style={[styles.valueText, { color: FOCUS_COLORS[value] }]}>
              {value}
            </Text>
            <Text style={styles.valueMax}>/5</Text>
          </View>
        )}
      </View>

      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((v) => (
          <FocusDot
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
