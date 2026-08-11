import { CTAButtonProps } from "@/types/input.types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useTheme } from "../../theme/theme";

function CTAButton({
  title,
  onPress,
  href,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIconName,
  rightIconName,
  leftIcon,
  rightIcon,
  containerStyle,
  textStyle,
  testID,
  accessibilityLabel,
  iconTop = false,
  iconColor,
}: CTAButtonProps & { iconTop?: boolean; iconColor?: string }) {
  const t = useTheme();
  const isDisabled = disabled || loading;

  // sizing
  const padV =
    size === "sm" ? t.spacing.xs : size === "lg" ? t.spacing.l : t.spacing.m;
  const padH =
    size === "sm" ? t.spacing.m : size === "lg" ? t.spacing.xl : t.spacing.l;
  const font = size === "sm" ? 14 : size === "lg" ? 16 : 15;
  const icon = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  const { bg, text, border } = useMemo(() => {
    if (isDisabled) {
      return {
        bg:
          variant === "primary" || variant === "danger"
            ? "#E5E7EB"
            : t.colors.surface,
        text: "#9CA3AF",
        border: "#D1D5DB",
      };
    }
    switch (variant) {
      case "primary":
        return { bg: t.colors.primary, text: "#fff", border: "transparent" };
      case "secondary":
        return {
          bg: t.colors.primaryWeak,
          text: t.colors.primaryStrong,
          border: t.colors.primary,
        };
      case "outline":
        return {
          bg: t.colors.surface,
          text: t.colors.primary,
          border: t.colors.primary,
        };
      case "ghost":
        return {
          bg: "transparent",
          text: t.colors.primary,
          border: "transparent",
        };
      case "danger":
        return { bg: t.colors.error, text: "#fff", border: "transparent" };
      default:
        return { bg: t.colors.primary, text: "#fff", border: "transparent" };
    }
  }, [isDisabled, variant, t.colors]);

  const handlePress = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    if (href) router.push(href as any);
    onPress?.(e);
  };

  const Left = () =>
    leftIcon ? (
      <View style={{ marginRight: t.spacing.xs }}>{leftIcon}</View>
    ) : leftIconName ? (
      <Ionicons
        name={leftIconName}
        size={icon}
        color={iconColor ?? text}
        style={{
          marginRight: iconTop ? 0 : t.spacing.xs,
          marginBottom: iconTop ? 6 : 0,
        }}
      />
    ) : null;

  const Right = () =>
    rightIcon ? (
      <View style={{ marginLeft: t.spacing.xs }}>{rightIcon}</View>
    ) : rightIconName ? (
      <Ionicons
        name={rightIconName}
        size={icon}
        color={iconColor ?? text}
        style={{ marginLeft: t.spacing.xs }}
      />
    ) : null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      className={
        iconTop
          ? "flex-col items-center justify-center rounded-xl"
          : "flex-row items-center justify-center rounded-xl"
      }
      style={[
        {
          paddingVertical: padV,
          paddingHorizontal: padH,
          backgroundColor: bg,
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
          borderColor: border,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        containerStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={text} />
      ) : iconTop ? (
        <>
          <Left />
          <Text
            style={[
              {
                color: text,
                fontSize: font,
                fontWeight: "700",
                marginTop: 6,
                textAlign: "center",
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Right />
        </>
      ) : (
        <>
          <Left />
          <Text
            style={[
              { color: text, fontSize: font, fontWeight: "700" },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Right />
        </>
      )}
    </TouchableOpacity>
  );
}

CTAButton.displayName = "ActionButton";

export default memo(CTAButton);
