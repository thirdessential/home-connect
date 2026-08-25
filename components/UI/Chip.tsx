import { useTheme } from "@/theme/theme";
import { memo } from "react";
import {
  Pressable,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type ChipVariant = "default" | "selected" | "success" | "error" | "disabled";

type Props = {
  label: string;
  variant?: ChipVariant;
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

// Global Chip primitive shared by post-login screens (Event type, category
// tags, status pills, etc). Global look driven by theme tokens; per-usage
// overrides via `style`.
const Chip = memo(function Chip({ label, variant = "default", onPress, style, disabled }: Props) {
  const t = useTheme();
  const isDisabled = disabled || variant === "disabled";

  const palette: Record<ChipVariant, { bg: string; text: string; border: string }> = {
    default: { bg: t.colors.surfaceAlt, text: t.colors.text, border: t.colors.border },
    selected: { bg: t.colors.brandWeak, text: t.colors.brandDark, border: t.colors.brand },
    success: { bg: t.colors.brandWeak, text: t.colors.brandDark, border: "transparent" },
    error: { bg: "#FEF2F2", text: "#DC2626", border: "transparent" },
    disabled: { bg: t.colors.surfaceAlt, text: t.colors.secondaryText, border: "transparent" },
  };
  const c = palette[isDisabled ? "disabled" : variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={[
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: c.border === "transparent" ? 0 : 1,
          borderRadius: t.radii.round,
          paddingVertical: t.spacing.xs,
          paddingHorizontal: t.spacing.m,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={[t.typography.small, { color: c.text, fontWeight: "600" }]}>{label}</Text>
    </Pressable>
  );
});

export default Chip;
