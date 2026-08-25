import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View, type GestureResponderEvent } from "react-native";
import { useUiTheme } from "./useUiTheme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: (e: GestureResponderEvent) => void;
  badgeCount?: number;
  size?: number;
  color?: string;
};

const GlobalIconButton = memo(function GlobalIconButton({ icon, onPress, badgeCount, size, color }: Props) {
  const t = useUiTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ width: t.dimensions.iconLg, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={size ?? t.dimensions.iconMd} color={color ?? t.colors.icon} />
      {badgeCount ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: t.colors.orange,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: t.colors.white, fontSize: 10, fontWeight: "700" }}>{badgeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

export default GlobalIconButton;
