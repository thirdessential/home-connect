import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useUiTheme } from "./useUiTheme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

const GlobalButton = memo(function GlobalButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  const t = useUiTheme();
  const isDisabled = disabled || loading;
  const height = size === "sm" ? t.dimensions.buttonHeight * 0.8 : size === "lg" ? t.dimensions.buttonHeight * 1.15 : t.dimensions.buttonHeight;

  const palette: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: t.colors.primary, text: t.colors.white },
    secondary: { bg: t.colors.primaryLight, text: t.colors.primaryDark },
    outline: { bg: "transparent", text: t.colors.primary, border: t.colors.primary },
    ghost: { bg: "transparent", text: t.colors.primary },
    danger: { bg: t.colors.error, text: t.colors.white },
  };
  const c = isDisabled ? { bg: t.colors.disabled, text: t.colors.white } : palette[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={[
        {
          height,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderRadius: t.radius.round,
          backgroundColor: c.bg,
          borderWidth: c.border ? 1.5 : 0,
          borderColor: c.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: t.spacing.lg,
          opacity: isDisabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <>
          {leftIcon ? <Ionicons name={leftIcon} size={t.dimensions.iconSm} color={c.text} style={{ marginRight: t.spacing.sm }} /> : null}
          <Text style={[t.typography.button, { color: c.text }]}>{title}</Text>
          {rightIcon ? <Ionicons name={rightIcon} size={t.dimensions.iconSm} color={c.text} style={{ marginLeft: t.spacing.sm }} /> : null}
        </>
      )}
    </Pressable>
  );
});

export default GlobalButton;
