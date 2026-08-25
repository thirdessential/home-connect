// New global UI system for post-login screens — deliberately separate from
// theme.ts (which stays untouched). Reuses the existing responsive helpers
// instead of duplicating them.
import { getHeight, getWidth } from "./theme";

export { getHeight, getWidth };

// The reference screens (Home feed, Event cards, bottom nav active state)
// consistently use this dark green as the brand accent — centralized here so
// changing it in one place updates every Global* component.
export const colors = {
  primary: "#15803D",
  primaryDark: "#166534",
  primaryLight: "#DCFCE7",
  background: "#F8FAF9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F1F5F9",
  white: "#FFFFFF",
  black: "#000000",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  orange: "#15803D",
  icon: "#374151",
  disabled: "#D1D5DB",
};

export const darkColors: typeof colors = {
  ...colors,
  background: "#0F172A",
  surface: "#1E293B",
  card: "#1E293B",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  border: "#334155",
  divider: "#334155",
  icon: "#E5E7EB",
  disabled: "#475569",
};

const fontFamily = "System"; // matches theme.ts — no new font introduced

function textStyle(fontSize: number, lineHeight: number, fontWeight: "400" | "600" | "700" | "800" = "600") {
  return { fontFamily, fontSize: getWidth(fontSize), lineHeight: getHeight(lineHeight), fontWeight };
}

// All headings default to SemiBold (600) per spec.
export const typography = {
  h1: textStyle(28, 34, "600"),
  h2: textStyle(24, 30, "600"),
  h3: textStyle(20, 26, "600"),
  h4: textStyle(17, 22, "600"),
  h5: textStyle(15, 20, "600"),
  h6: textStyle(13, 18, "600"),
  body: textStyle(15, 21, "400"),
  bodyMedium: textStyle(15, 21, "600"),
  bodySmall: textStyle(13, 18, "400"),
  caption: textStyle(11, 15, "400"),
  label: textStyle(13, 18, "600"),
  button: textStyle(15, 20, "600"),
};

export const spacing = {
  xs: getWidth(4),
  sm: getWidth(8),
  md: getWidth(12),
  lg: getWidth(16),
  xl: getWidth(24),
  xxl: getWidth(32),
};

export const radius = {
  sm: getWidth(8),
  md: getWidth(12),
  lg: getWidth(16),
  xl: getWidth(20),
  round: 999,
};

export const dimensions = {
  buttonHeight: getHeight(48),
  inputHeight: getHeight(48),
  iconSm: getWidth(18),
  iconMd: getWidth(22),
  iconLg: getWidth(28),
  screenPadding: getWidth(16),
};

export const uiTheme = {
  colors,
  darkColors,
  typography,
  spacing,
  radius,
  dimensions,
  components: {
    buttonHeight: dimensions.buttonHeight,
    inputHeight: dimensions.inputHeight,
  },
};

export type UiTheme = typeof uiTheme;
