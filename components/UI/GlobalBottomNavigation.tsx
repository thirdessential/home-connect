import { Ionicons } from "@expo/vector-icons";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";
import { IC_Create_Plusicon, IC_Deals, IC_Directory, IC_Home, IC_Profile } from "@/assets/images";
import { memo, useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OFFLINE_STRIP_HEIGHT, bottomNavFootprint, offlineStripInset, useBannerState } from "@/lib/offlineStripInset";
import { useUiTheme } from "./useUiTheme";

export type NavItem = {
  key: string;
  label: string;
  onPress: () => void;
};

type Props = {
  items: [NavItem, NavItem, NavItem, NavItem];
  activeKey: string;
  centerIcon: keyof typeof Ionicons.glyphMap;
  onCenterPress: () => void;
};

const ANIM_MS = 200;

// Tab key -> existing SVG icon (assets/images/index.ts).
const TAB_ICONS: Record<string, FC<SvgProps>> = {
  home: IC_Home,
  business: IC_Deals,
  directory: IC_Directory,
  profile: IC_Profile,
};

function TabItem({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const t = useUiTheme();

  // Spec colors in light mode; dark mode keeps the theme tokens so the icons stay visible.
  const color = t.isDark
    ? active ? t.colors.textPrimary : t.colors.textSecondary
    : active ? "#000000" : "#666666b2";
  const Icon = TAB_ICONS[item.key];

  // Light press feedback (scale) on top of the active-tab lift.
  const press = useRef(new Animated.Value(1)).current;
  const pressTo = (v: number) =>
    Animated.spring(press, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Pressable
      onPress={item.onPress}
      onPressIn={() => pressTo(0.92)}
      onPressOut={() => pressTo(1)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Press feedback only: active state changes color, never size or position. */}
      <Animated.View style={{ transform: [{ scale: press }]  }}>
        {Icon ? <Icon width={24} height={24} color={color} /> : null}
      </Animated.View>

      <Text
        style={{
          ...t.typography.caption,
          color,
          fontFamily: "Manrope_700Bold",
          marginTop: 4,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const GlobalBottomNavigation = memo(function GlobalBottomNavigation({
  items,
  activeKey,
  centerIcon,
  onCenterPress,
}: Props) {
  const t = useUiTheme();
  const insets = useSafeAreaInsets();

  const CENTER_SIZE = 48;

  const pressScale = useRef(
    new Animated.Value(1)
  ).current;

  // 0 = plus
  // 1 = rotated 45deg (cross)
  const centerRotation = useRef(
    new Animated.Value(activeKey === "create" ? 1 : 0)
  ).current;

  const [left, right] = [items[0], items[1]];
  const [right1, right2] = [items[2], items[3]];

  const isCreateActive = activeKey === "create";

  /**
   * Animate center + -> x and x -> +
   */
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(
      (reduceMotion) => {
        Animated.timing(centerRotation, {
          toValue: isCreateActive ? 1 : 0,
          duration: reduceMotion ? 0 : ANIM_MS,
          useNativeDriver: true,
        }).start();
      }
    );
  }, [isCreateActive, centerRotation]);

  const centerRotate = centerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const onPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  // Clear the footprint when the nav goes away so the offline strip drops to
  // the system inset on screens without a bottom bar.
  useEffect(() => () => bottomNavFootprint.setValue(0), []);
  const banner = useBannerState();
  const bottomGap = Math.max(insets.bottom, 10);

  return (
    <View
      onLayout={(e) => bottomNavFootprint.setValue(e.nativeEvent.layout.height)}
      // Overlay with no background of its own: only the pill is visible and screen
      // content shows behind it. Empty areas stay touch-through.
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "transparent", paddingHorizontal: 16 }}
    >
      {/* Floating pill */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          minHeight: CENTER_SIZE + 30,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: t.colors.surface,
          // Soft shadow mostly along the TOP edge (negative y offset) so the pill blends into the
          // content scrolling behind it; no extra container is added above the pill.
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: t.isDark ? 0.5 : 0.1,
          shadowRadius: 14,
          elevation: 8,
        }}
      >
        {[left, right].map((item) => (
          <TabItem key={item.key} item={item} active={activeKey === item.key} />
        ))}

        {/* CENTER CREATE */}
        <View style={{ width: CENTER_SIZE + 16, alignItems: "center" }}>
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <Pressable
              onPress={onCenterPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              accessibilityRole="button"
              accessibilityLabel="Create"
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                borderRadius: CENTER_SIZE / 2,
                backgroundColor: t.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* PLUS icon — smoothly rotates 45deg into a close (x) */}
              <Animated.View style={{ transform: [{ rotate: centerRotate }] }}>
                <IC_Create_Plusicon width={24} height={24} color={t.colors.white} />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>

        {[right1, right2].map((item) => (
          <TabItem key={item.key} item={item} active={activeKey === item.key} />
        ))}
      </View>

      {/* Offline banner: below the pill, height is 0 when online (no reserved space). */}
      <Animated.View
        style={{
          height: offlineStripInset,
          overflow: "hidden",
          borderRadius: 12,
          marginTop: 6,
          backgroundColor: banner.online ? "#15803D" : "#B91C1C",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {banner.rendered && banner.online !== null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: OFFLINE_STRIP_HEIGHT }}>
            <Ionicons
              name={banner.online ? "checkmark-circle" : "cloud-offline-outline"}
              size={18}
              color="#fff"
            />
            <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Manrope_700Bold" }}>
              {banner.online ? "Internet Connected" : "No Internet Connection"}
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* System area (gesture bar / home indicator): the real inset. */}
      <View style={{ height: bottomGap }} />
    </View>
  );
});

export default GlobalBottomNavigation;
