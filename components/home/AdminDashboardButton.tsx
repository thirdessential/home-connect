import { usePermissions } from "@/hooks/usePermissions";
import { useAdminStore } from "@/store/useAdminStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Floating shortcut into the Admin Dashboard.
 *
 * Visibility comes from the authenticated session's roles (useAuthStore via
 * usePermissions) — never from a prop — and the destination screen is the
 * existing admin dashboard route. The badge shows the real pending-request
 * count already loaded into useAdminStore; it is hidden when there is nothing
 * waiting rather than showing a placeholder number.
 */
function AdminDashboardButton({ bottom = 84 }: { bottom?: number }) {
  const t = useTheme();
  const { hasAnyRole } = usePermissions();
  const isAdmin = useMemo(
    () => hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    [hasAnyRole],
  );
  const pendingCount = useAdminStore((state) => state.pendingContent.totalCount);

  const handlePress = useCallback(() => {
    router.push("/(tabs)/profile/admin-dashboard");
  }, []);

  if (!isAdmin) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Open admin dashboard"
      style={[
        styles.fab,
        {
          bottom,
          backgroundColor: t.colors.brand,
          borderColor: t.colors.surface,
        },
      ]}
    >
      <Ionicons name="shield-checkmark" size={22} color={t.colors.onBrand} />
      <Text style={[styles.label, { color: t.colors.onBrand }]} numberOfLines={2}>
        Admin{"\n"}Dashboard
      </Text>

      {pendingCount > 0 && (
        <View style={[styles.badge, { borderColor: t.colors.surface }]}>
          <Text style={styles.badgeText}>
            {pendingCount > 99 ? "99+" : pendingCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(AdminDashboardButton);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    zIndex: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 7,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
