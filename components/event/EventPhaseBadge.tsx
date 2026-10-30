import Badge from "@/components/UI/Badge";
import type { PhaseTone } from "@/lib/eventPhase";
import { useTheme } from "@/theme/theme";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  tone: PhaseTone;
  /** "xs" for list rows, "sm" for cards. */
  size?: "xs" | "sm";
  /** Solid pill for drawing over a photo; otherwise the tinted Badge used elsewhere in the app. */
  solid?: boolean;
};

/**
 * The event status pill (UPCOMING / ONGOING / COMPLETED / CANCELLED, plus the My
 * Events row labels). Colors come from the theme or readable fixed pairs, so it
 * stays legible in light and dark mode and is never dimmed with a muted card.
 */
function EventPhaseBadge({ label, tone, size = "xs", solid = false }: Props) {
  const t = useTheme();

  if (solid) {
    const solidStyle = {
      brand: { bg: t.colors.brand, fg: t.colors.onBrand },
      warning: { bg: "#F59E0B", fg: "#1F1300" },
      neutral: { bg: "rgba(255,255,255,0.92)", fg: "#1F2937" },
      danger: { bg: "#DC2626", fg: "#FFFFFF" },
    }[tone];
    return (
      <View style={[styles.pill, { backgroundColor: solidStyle.bg }]} accessibilityLabel={`Status: ${label}`}>
        <Text style={[styles.pillText, { color: solidStyle.fg }]}>{label}</Text>
      </View>
    );
  }

  const color = {
    brand: t.colors.brandDark,
    warning: t.isDark ? "#FBBF24" : "#B45309",
    neutral: t.colors.textSecondary,
    danger: t.isDark ? "#F87171" : "#DC2626",
  }[tone];
  return <Badge label={label} color={color} size={size} />;
}

export default memo(EventPhaseBadge);

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, letterSpacing: 0.4, fontFamily: "Manrope_700Bold" },
});
