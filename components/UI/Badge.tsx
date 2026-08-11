import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, ReactNode, useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type Size = "xs" | "sm" | "md" | "lg";

export type BadgeProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconElement?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  iconPosition?: "left" | "right";
  color?: string;
  textColor?: string;
  bgColor?: string;
  outline?: boolean;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
};

function hexToRgba(hex: string, alpha = 0.15) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Badge({
  label,
  icon,
  iconElement,
  iconBgColor,
  iconColor,
  iconPosition = "left",
  color,
  textColor,
  bgColor,
  outline = false,
  size = "md",
  style,
  textStyle,
  iconStyle,
  iconContainerStyle,
  onPress,
  testID,
}: BadgeProps) {
  const t = useTheme();

  const dims = useMemo(
    () =>
      ({
        xs: {
          padV: 4,
          padH: 8,
          icon: 12,
          iconWrap: 8,
          font: 10,
          gap: 4,
          radius: t.radii.m,
        },
        sm: {
          padV: 4,
          padH: 8,
          icon: 16,
          iconWrap: 18,
          font: 12,
          gap: 6,
          radius: t.radii.pill,
        },
        md: {
          padV: 6,
          padH: 10,
          icon: 14,
          iconWrap: 20,
          font: 13,
          gap: 8,
          radius: t.radii.pill,
        },
        lg: {
          padV: 8,
          padH: 12,
          icon: 16,
          iconWrap: 22,
          font: 14,
          gap: 8,
          radius: t.radii.pill,
        },
      })[size],
    [size, t.radii.m, t.radii.pill],
  );

  const { mainColor, computedBg, borderColor, labelColor, computedIconColor } =
    useMemo(() => {
      const m = color ?? t.colors.primary;
      const bg = outline ? "transparent" : (bgColor ?? hexToRgba(m, 0.16));
      const b = outline ? m : "transparent";
      const lbl = textColor ?? m;
      const ic = iconColor ?? (iconBgColor ? "#fff" : lbl);
      return {
        mainColor: m,
        computedBg: bg,
        borderColor: b,
        labelColor: lbl,
        computedIconColor: ic,
      };
    }, [
      color,
      t.colors.primary,
      outline,
      bgColor,
      textColor,
      iconColor,
      iconBgColor,
    ]);

  const Container = onPress ? TouchableOpacity : View;

  const IconNode = useMemo(
    () =>
      iconElement ??
      (icon ? (
        <Ionicons name={icon} size={dims.icon} color={computedIconColor} />
      ) : null),
    [iconElement, icon, dims.icon, computedIconColor],
  );

  const iconWrapStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const base: ViewStyle = {
      width: dims.iconWrap,
      height: dims.iconWrap,
      borderRadius: dims.iconWrap / 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        iconBgColor ?? (icon ? hexToRgba(mainColor, 0.2) : "transparent"),
    };
    return [base, iconContainerStyle];
  }, [dims.iconWrap, iconBgColor, icon, mainColor, iconContainerStyle]);

  const IconWithBg =
    icon || iconElement ? (
      <View style={iconWrapStyle}>
        <View style={iconStyle}>{IconNode}</View>
      </View>
    ) : null;

  const containerBaseStyle = useMemo(
    () => ({
      paddingVertical: dims.padV,
      paddingHorizontal: dims.padH,
      borderRadius: dims.radius,
      backgroundColor: computedBg,
      borderWidth: 1,
      borderColor,
    }),
    [dims.padV, dims.padH, dims.radius, computedBg, borderColor],
  );

  const labelStyleMemo = useMemo(
    () => ({
      color: labelColor,
      fontSize: dims.font,
      fontWeight: "700" as const,
    }),
    [labelColor, dims.font],
  );

  const leftSpacerStyle = useMemo(
    () => ({ marginRight: dims.gap }),
    [dims.gap],
  );
  const rightSpacerStyle = useMemo(
    () => ({ marginLeft: dims.gap }),
    [dims.gap],
  );

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? "button" : "text"}
      testID={testID}
      className="flex-row items-center"
      style={[containerBaseStyle, style]}
    >
      {iconPosition === "left" && IconWithBg ? (
        <View style={leftSpacerStyle}>{IconWithBg}</View>
      ) : null}

      <Text numberOfLines={1} style={[labelStyleMemo, textStyle]}>
        {label}
      </Text>

      {iconPosition === "right" && IconWithBg ? (
        <View style={rightSpacerStyle}>{IconWithBg}</View>
      ) : null}
    </Container>
  );
}

export default memo(Badge);
