// src/theme/colors.ts
//
// ─── WHAT IS A DESIGN SYSTEM? ────────────────────────────────────────────────
//
// A design system is a set of rules that make your app look consistent.
// Without it, you end up with 12 slightly different shades of gray
// scattered across 20 files, and changing the brand color means
// editing 47 lines across the entire codebase.
//
// With a centralized color file:
//   - Every color in the app comes from here
//   - Change one value → entire app updates
//   - Naming makes intent clear (colors.status.danger vs '#ef4444')
//
// ─── OUR COLOR PHILOSOPHY ────────────────────────────────────────────────────
//
// HPD is a dark, minimal, data-focused tool.
// The color palette is intentionally constrained:
//
//   Backgrounds: near-black with subtle blue tint (feels technical, calm)
//   Text: layered grays (hierarchy without color noise)
//   Accents: one green, one blue, one amber — each with specific meaning
//   Semantic: red/green/amber for data signals (declining/stable/volatile)
//
// ─────────────────────────────────────────────────────────────────────────────
 
export const colors = {
 
  // ─── Backgrounds ────────────────────────────────────────────────
  // We use a layered system: base → surface → elevated
  // Each layer is slightly lighter, creating visual depth without shadows.
  background: {
    base: '#030712',      // Deepest background (screen backgrounds)
    surface: '#080c14',   // Cards, panels (slightly lighter)
    elevated: '#0d1220',  // Modals, popovers (even lighter)
  },
 
  // ─── Surface (alias for components that use surface directly) ───
  surface: {
    base: '#080c14',
    elevated: '#0d1220',
  },
 
  // ─── Text ────────────────────────────────────────────────────────
  // Never use pure white — it creates too much contrast and eye strain.
  // Use a hierarchy:
  //   primary → main content (headings, important values)
  //   secondary → supporting content (labels, descriptions)
  //   muted → de-emphasized (hints, placeholders, inactive tabs)
  //   disabled → non-interactive elements
  text: {
    primary: '#e2e8f0',     // Near white — titles, key values
    secondary: '#94a3b8',   // Mid gray — body text, labels
    muted: '#4b5563',       // Dark gray — hints, inactive states
    disabled: '#1f2937',    // Very dark — disabled states
  },
 
  // ─── Borders ─────────────────────────────────────────────────────
  // Borders define structure without adding visual weight.
  border: {
    subtle: '#111827',    // Very faint — dividers, card edges
    default: '#1f2937',   // Normal — input borders, section dividers
    strong: '#374151',    // Visible — focused states, important separators
  },
 
  // ─── Accent Colors ───────────────────────────────────────────────
  // Each accent has ONE purpose. Don't mix them.
  //
  //   green  → positive signals, success, stability confirmation
  //   blue   → focus data, information, neutral trends
  //   amber  → warnings, volatility signals, caution states
  //   purple → special/premium state (consistency achievement)
  accent: {
    green: '#6ee7b7',
    greenDim: '#6ee7b722',    // Used for backgrounds/glows
    blue: '#60a5fa',
    blueDim: '#60a5fa22',
    amber: '#fbbf24',
    amberDim: '#fbbf2422',
    purple: '#a78bfa',
    purpleDim: '#a78bfa22',
  },
 
  // ─── Semantic / Signal Colors ────────────────────────────────────
  // These map directly to pattern detection signals.
  // When the analytics engine returns 'VOLATILE', you use signal.volatile.
  // This makes the connection between data and UI explicit.
  signal: {
    stable: '#6ee7b7',      // Green — patterns are regular
    volatile: '#fbbf24',    // Amber — high variation detected
    momentum: '#60a5fa',    // Blue — positive upward trend
    declining: '#f87171',   // Red — downward trend
    consistent: '#a78bfa',  // Purple — strong long-term consistency
  },
 
  // ─── Mood Scale Colors ───────────────────────────────────────────
  // Maps mood values 1–5 to colors.
  // Used in history bars, dots, and trend lines.
  // The scale goes warm-red (low) → warm-orange (mid) → warm-yellow (high)
  // Intuitive: "warmer" = better mood
  mood: {
    1: '#ef4444',   // Red — very low mood
    2: '#f97316',   // Orange — low mood
    3: '#eab308',   // Yellow — neutral
    4: '#84cc16',   // Yellow-green — good
    5: '#22c55e',   // Green — excellent
  },
 
  // ─── Focus Scale Colors ──────────────────────────────────────────
  // Maps focus values 1–5 to colors.
  // Blue scale: dark blue (scattered) → bright blue (locked in)
  // Different hue from mood so they're visually distinct in charts.
  focus: {
    1: '#1d4ed8',   // Dark blue — scattered
    2: '#2563eb',   // Blue — drifting
    3: '#3b82f6',   // Medium blue — present
    4: '#60a5fa',   // Light blue — sharp
    5: '#93c5fd',   // Very light blue — locked in
  },
 
} as const;
 
// ─── TYPE EXPORT ──────────────────────────────────────────────────────────────
// 'as const' above makes every value a literal type (not just 'string').
// This type extracts the color keys so we can use them safely.
// Example use: type MoodValue = keyof typeof colors.mood  →  1 | 2 | 3 | 4 | 5
export type Colors = typeof colors