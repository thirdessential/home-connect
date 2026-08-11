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
        { paddingTop: insets.top + 16, backgroundColor: t.colors.background },
      ]}
    >
      <View style={styles.row}>
        {canChangeSociety ? (
          <TouchableOpacity
            onPress={handleSocietyPress}
            style={styles.societyButton}
          >
            <Text
              numberOfLines={1}
              style={[styles.societyName, { color: t.colors.textPrimary }]}
            >
              {displayName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={22}
              color={t.colors.textPrimary}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ) : (
          <Text
            numberOfLines={1}
            style={[styles.societyName, { color: t.colors.textPrimary, flex: 1 }]}
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
            <Ionicons name="search-outline" size={22} color={t.colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onBellPress}
            style={styles.iconButton}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={t.colors.textPrimary}
            />
            {hasUnread ? (
              <View style={[styles.unreadDot, { borderColor: t.colors.background }]} />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleComingSoon}
            style={styles.iconButton}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={t.colors.textPrimary}
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
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  societyButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  societyName: {
    fontSize: 22,
    fontWeight: "800",
  },
  chevron: {
    marginLeft: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
