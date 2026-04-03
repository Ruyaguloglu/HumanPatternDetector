// src/theme/typography.ts
import { TextStyle } from 'react-native';

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const lineHeight = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1,
  wider: 1.5,
} as const;

// ─── Text Styles ──────────────────────────────────────────────────────────────
// Each style is typed as TextStyle directly.
// No 'as const' on the object — that conflicts with TextStyle casting.

export const textStyles: Record<string, TextStyle> = {

  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },

  dataValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  dataValueSmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  },

  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wider,
  },

  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },

  hint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },

  button: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wider,
  },

};