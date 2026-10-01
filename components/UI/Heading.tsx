import { manropeFamily } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

type Level = 1 | 2 | 3 | 4 | 5 | 6;

type Props = {
  level?: Level; // 1-6, default 3
  children: React.ReactNode;
  color?: string; // overrides the level's default heading color
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

// Global H1-H6 typography primitive for post-login screens. Pulls size from
// theme.typography.hN and color from theme.colors.headingN — both centrally
// configurable — while still accepting a `style`/`color` override per usage.
const Heading = memo(function Heading({
  level = 3,
  children,
  color,
  style,
  numberOfLines,
}: Props) {
  const t = useTheme();
  const typographyKey = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const colorKey = `heading${level}` as
    | "heading1"
    | "heading2"
    | "heading3"
    | "heading4"
    | "heading5"
    | "heading6";
  // Family comes from the typography token (weight-specific Manrope file); a
  // per-usage fontWeight override is mapped to its file. fontWeight is dropped: with a custom family, Android/iOS look up
  // a "bold" variant of that family and fall back to the system font when only
  // the weight-specific file (Manrope_700Bold / _800ExtraBold) is registered.
  const { fontWeight, fontFamily, ...flat } = StyleSheet.flatten([
    t.typography[typographyKey],
    { color: color ?? t.colors[colorKey] },
    style,
  ]) as TextStyle;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[flat, { fontFamily: fontWeight ? manropeFamily(fontWeight) : (fontFamily ?? manropeFamily("400")) }]}
    >
      {children}
    </Text>
  );
});

export default Heading;
