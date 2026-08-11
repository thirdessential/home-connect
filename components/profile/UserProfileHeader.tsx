import CircularImage from "@/components/form/CircularImage";
import TitleHeader from "@/components/UI/TitleHeader";
import { User } from "@/store/auth.type";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import InfoRow from "./InfoRow";

const HEADER_HEIGHT = 200;
const AVATAR_SIZE = 100;
const GRADIENT_COLORS = ["#FDBA74", "#FB923C", "#F97316"] as const;
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

interface UserProfileHeaderProps {
  user: User | null | undefined;
  userId?: string;
  initials: string;
  roleDisplay: string;
  societyName: string | null;
  selectedUserRoles?: string[];
  onBack: () => void;
  onCall: () => void;
  onMessage: () => void;
  onRemoveUser: () => void;
  onToggleAdminRole: (userId: string, updatedRoles: string[]) => void;
}

const UserProfileHeader = memo(function UserProfileHeader({
  user,
  userId,
  initials,
  roleDisplay,
  societyName,
  selectedUserRoles,
  onBack,
  onCall,
  onMessage,
  onRemoveUser,
  onToggleAdminRole,
}: UserProfileHeaderProps) {
  const t = useTheme();

  return (
    <>
      {/* Navigation + Gradient + Avatar */}
      <View style={styles.headerWrapper}>
        <TitleHeader
          title="User Profile"
          selectedUserRoles={selectedUserRoles}
          userId={userId}
          onBackPress={onBack}
          showOptionsMenu
          onRemoveUser={onRemoveUser}
          onToggleAdminRole={onToggleAdminRole}
        />

        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.gradientCard}
        />

        <View style={styles.avatarContainer}>
          {user?.profilePhotoUrl ? (
            <CircularImage
              uri={user.profilePhotoUrl}
              size={AVATAR_SIZE}
              mode="view"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}

          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={onCall}
              style={[
                styles.actionButton,
                {
                  backgroundColor: t.colors.surface,
                  borderColor: t.colors.border,
                },
              ]}
            >
              <Ionicons name="call" size={20} color={t.colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={onMessage}
              style={[
                styles.actionButton,
                { backgroundColor: t.colors.textPrimary },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={20}
                color={t.colors.surface}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Profile info */}
      <View style={styles.profileInfo}>
        <Text style={[styles.userName, { color: t.colors.textPrimary }]}>
          {user?.fullName || "User Name"}
        </Text>

        <View style={styles.infoSection}>
          {user?.flatNo && societyName && (
            <InfoRow
              icon="business-outline"
              label="Address"
              value={`${user.flatNo} - ${societyName}`}
            />
          )}
          <InfoRow
            icon="home-outline"
            label="Role"
            value={roleDisplay}
            iconColor="#4ADE80"
          />
          {user?.phone && (
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={user.phone}
              iconColor="#3B82F6"
            />
          )}
          {user?.completeAddress && (
            <InfoRow
              icon="location-outline"
              label="From"
              value={user.completeAddress}
              iconColor="#EF4444"
            />
          )}
        </View>
      </View>
    </>
  );
});

export default UserProfileHeader;

const styles = StyleSheet.create({
  headerWrapper: {
    position: "relative",
    marginBottom: AVATAR_SIZE / 2 + 16,
  },
  gradientCard: {
    width: "100%",
    height: HEADER_HEIGHT,
    borderRadius: 20,
  },
  avatarContainer: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 1.8,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#4ADE80",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  profileInfo: {
    paddingBottom: 24,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  infoSection: {
    gap: 16,
  },
});
