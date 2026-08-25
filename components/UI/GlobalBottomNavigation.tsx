import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUiTheme } from "./useUiTheme";

export type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  items: [NavItem, NavItem, NavItem, NavItem]; // 4 side items around the center action
  activeKey: string;
  centerIcon: keyof typeof Ionicons.glyphMap;
  onCenterPress: () => void;
};

// Presentational global bottom navigation matching the reference: white
// rounded top bar, muted inactive items, primary-green active item, a larger
// circular center action floating above the bar. Routing/permission logic
// stays owned by the caller (e.g. app/(tabs)/_layout.tsx) via `onPress`/`items`.
const GlobalBottomNavigation = memo(function GlobalBottomNavigation({ items, activeKey, centerIcon, onCenterPress }: Props) {
  const t = useUiTheme();
  const insets = useSafeAreaInsets();
  const CENTER_SIZE = 56;
  const [left, right] = [items[0], items[1]];
  const [right1, right2] = [items[2], items[3]];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: t.colors.surface,
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
        paddingBottom: insets.bottom,
        height: t.dimensions.buttonHeight + insets.bottom + 12,
      }}
    >
      {[left, right].map((item) => (
        <Pressable key={item.key} onPress={item.onPress} style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name={item.icon} size={t.dimensions.iconMd} color={activeKey === item.key ? t.colors.primary : t.colors.textMuted} />
          <Text style={{ ...t.typography.caption, fontWeight: activeKey === item.key ? "700" : "400", color: activeKey === item.key ? t.colors.primary : t.colors.textMuted }}>
            {item.label}
          </Text>
        </Pressable>
      ))}

      <View style={{ width: CENTER_SIZE, alignItems: "center" }}>
        <Pressable
          onPress={onCenterPress}
          style={{
            width: CENTER_SIZE,
            height: CENTER_SIZE,
            borderRadius: CENTER_SIZE / 2,
            backgroundColor: t.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: -CENTER_SIZE * 0.45,
            borderWidth: 4,
            borderColor: t.colors.surface,
          }}
        >
          <Ionicons name={centerIcon} size={t.dimensions.iconLg} color={t.colors.white} />
        </Pressable>
      </View>

      {[right1, right2].map((item) => (
        <Pressable key={item.key} onPress={item.onPress} style={{ flex: 1, alignItems: "center" }}>
          <Ionicons name={item.icon} size={t.dimensions.iconMd} color={activeKey === item.key ? t.colors.primary : t.colors.textMuted} />
          <Text style={{ ...t.typography.caption, fontWeight: activeKey === item.key ? "700" : "400", color: activeKey === item.key ? t.colors.primary : t.colors.textMuted }}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

export default GlobalBottomNavigation;
