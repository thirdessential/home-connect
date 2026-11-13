// components/headers/HomeHeader.tsx
import { usePermissions } from "@/hooks/usePermissions";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { IC_LocationHome, IC_NotificationBell } from "@/assets/images";
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
  const selectedCity = useSocietyStore((s) => s.selectedSociety?.city);
  // Display only: the stored society name is untouched. Max 15 chars including "...".
  const rawName = selectedSocietyName ?? "Guest";
  const displayName = rawName.length > 15 ? `${rawName.slice(0, 12).trimEnd()}...` : rawName;

  const handleSocietyPress = () => {
    router.push("/onboarding/select-society");
  };


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
        {/* Left: society icon, name (+ dropdown) and city below it */}
        {(() => {
          const body = (
            <>
              <IC_LocationHome width={32} height={32} />
              <View style={styles.societyText}>
                <View style={styles.nameRow}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.societyName, { color: t.colors.textPrimary }]}
                  >
                    {displayName}
                  </Text>
                  {canChangeSociety ? (
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={t.colors.textPrimary}
                      style={styles.chevron}
                    />
                  ) : null}
                </View>
                {selectedCity ? (
                  <Text numberOfLines={1} style={[styles.societyCity, { color: t.colors.textSecondary }]}>
                    {selectedCity}
                  </Text>
                ) : null}
              </View>
            </>
          );
          return canChangeSociety ? (
            <TouchableOpacity onPress={handleSocietyPress} style={styles.societyButton}>
              {body}
            </TouchableOpacity>
          ) : (
            <View style={styles.societyButton}>{body}</View>
          );
        })()}

        {/* Right: notification bell with unread dot */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={onBellPress}
          style={[styles.iconButton, { backgroundColor: t.colors.surfaceAlt }]}
        >
          <IC_NotificationBell width={22} height={22} />
          {hasUnread ? (
            <View style={[styles.unreadDot, { borderColor: t.colors.surfaceAlt }]} />
          ) : null}
        </TouchableOpacity>
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
    gap: 10,
    flexShrink: 1, // hug the content (icon + name + arrow); never stretch across the row
    minWidth: 0,
    marginRight: 8,
  },
  societyText: { flexShrink: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  societyName: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    flexShrink: 1,
  },
  societyCity: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    marginTop: 1,
  },
  chevron: {
    marginLeft: 4,
    flexShrink: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
  },
});
