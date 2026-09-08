import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUiTheme } from "./useUiTheme";

export type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  items: [NavItem, NavItem, NavItem, NavItem];
  activeKey: string;
  centerIcon: keyof typeof Ionicons.glyphMap;
  onCenterPress: () => void;
};

const ANIM_MS = 200;

function TabItem({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const t = useUiTheme();

  const progress = useRef(
    new Animated.Value(active ? 1 : 0)
  ).current;

  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(
      (value) => {
        reduceMotion.current = value;
      }
    );
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: reduceMotion.current ? 0 : ANIM_MS,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const color = active
    ? t.colors.textPrimary
    : t.colors.textMuted;

  return (
    <Pressable
      onPress={item.onPress}
      style={{
        flex: 1,
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
        }}
      >
        <Ionicons
          name={item.icon}
          size={t.dimensions.iconMd}
          color={color}
        />
      </Animated.View>

      <Text
        style={{
          ...t.typography.caption,
          fontWeight: active ? "700" : "400",
          color,
          marginTop: 2,
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

  const CENTER_SIZE = 56;

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

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          backgroundColor: t.colors.surface,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: 20,
          marginHorizontal: 14,
          marginBottom:
            Platform.OS === "ios"
              ? 0
              : Math.max(0, insets.bottom - 8),
          paddingVertical: 8,
          paddingBottom:
            Platform.OS === "ios" ? 30 : 15,
          width: "100%",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {[left, right].map((item) => (
          <TabItem
            key={item.key}
            item={item}
            active={activeKey === item.key}
          />
        ))}

        {/* CENTER CREATE */}
        <View
          style={{
            width: CENTER_SIZE,
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: pressScale }],
            }}
          >
            <Pressable
              onPress={onCenterPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={{
                width: CENTER_SIZE,
                height: CENTER_SIZE,
                borderRadius: CENTER_SIZE / 2,
                backgroundColor: t.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                top: -CENTER_SIZE * 0.55,
                alignSelf: "center",
                borderWidth: 4,
                borderColor: t.colors.surface,
                shadowColor: t.colors.primary,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {/* Same PLUS icon — smoothly rotates 45deg */}
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: centerRotate,
                    },
                  ],
                }}
              >
                <Ionicons
                  name="add"
                  size={t.dimensions.iconLg}
                  color={t.colors.white}
                />
              </Animated.View>
            </Pressable>
          </Animated.View>

          <Text
            style={{
              ...t.typography.caption,
              color: t.colors.primary,
              fontWeight: "700",
              marginTop: CENTER_SIZE * 0.55 + 4,
            }}
          >
            Create
          </Text>
        </View>

        {[right1, right2].map((item) => (
          <TabItem
            key={item.key}
            item={item}
            active={activeKey === item.key}
          />
        ))}
      </View>
    </View>
  );
});

export default GlobalBottomNavigation;