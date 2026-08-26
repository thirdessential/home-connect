// components/headers/HomeHeader.tsx
import { usePermissions } from "@/hooks/usePermissions";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "./Toast";

type Props = {
  onBellPress?: () => void;
  hasUnread?: boolean;
};

export default function HomeHeader({ onBellPress, hasUnread }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const { hasAnyRole } = usePermissions();
  const canChangeSociety = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.GUEST]);
  const selectedSocietyName = useSocietyStore((s) => s.selectedSociety?.name);
  const displayName = selectedSocietyName ?? "Guest";

  const handleSocietyPress = () => {
    router.push("/onboarding/select-society");
  };

  const handleComingSoon = () => showToast("Coming soon", "info");

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 12,
          backgroundColor: t.colors.surface,
          borderBottomColor: t.colors.border,
        },
      ]}
    >
      
      <View style={styles.headerRow}>
       

        {canChangeSociety ? (
          <TouchableOpacity
            onPress={handleSocietyPress}
            style={styles.societyButton}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.societyName, { color: t.colors.brand }]}
            >
              {displayName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={t.colors.brand}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ) : (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.societyName, styles.societyNameFull, { color: t.colors.brand }]}
          >
            {displayName}
          </Text>
        )}

        <View style={styles.iconRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleComingSoon}
            style={styles.iconButton}
          >
            <Ionicons name="search-outline" size={22} color={t.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onBellPress}
            style={styles.iconButton}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={t.colors.textSecondary}
            />
            {hasUnread ? (
              <View style={[styles.unreadDot, { borderColor: t.colors.surface }]} />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleComingSoon}
            style={styles.iconButton}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={t.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // backgroundColor: "#000"
  },
  headerRowGredint:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '250%',
    width: "120%",
    zIndex: 0
  },
  societyButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0, // required for numberOfLines truncation to respect flex, not content width
    marginRight: 8,
  },
  societyName: {
    fontSize: 20,
    fontWeight: "700",
    flexShrink: 1,
  },
  societyNameFull: {
    flex: 1,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 2,
    flexShrink: 0,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
  },
});
