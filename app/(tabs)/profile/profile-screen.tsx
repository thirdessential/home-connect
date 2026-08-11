import { verificationStatus } from "@/assets/enums/common.enum";
import Badge from "@/components/UI/Badge";
import { Card } from "@/components/UI/Card";
import HDivider from "@/components/UI/HDivider";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import FormSheetModal from "@/components/modals/FormSheetModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import DeleteAccount from "@/components/profile/DeleteAccount";
import { usePermissions } from "@/hooks/usePermissions";
import { useImageUpload } from "@/lib/cloudinary";
import { ManageProfilePayload } from "@/store/auth.type";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ManageProfileForm from "../../../components/form/ManageProfileForm";

// Static styles — defined once at module level, never recreated
const staticStyles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardMargin: { marginTop: 16, marginBottom: 0, paddingBottom: 0 },
  logoutBtn: { borderRadius: 12, paddingVertical: 12, marginBottom: 8 },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  listDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    opacity: 0.4,
  },
  listIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listLabel: { flex: 1, fontSize: 16 },
  cardPadding: { padding: 16 },
  quickLinksInner: { paddingHorizontal: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  infoRowText: { marginLeft: 8, flex: 1 },
  flexOne: { flex: 1 },
});

// Extracted outside the parent component so it has a stable identity across renders.
// Previously defined inside useMemo — that caused React to see a new component
// type on every theme change, forcing unmount/remount of all list rows.
const ListRow = memo(function ListRowCmp({
  label,
  icon,
  onPress,
  isLast,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={staticStyles.listRow}>
      <View
        style={[
          staticStyles.listIconWrap,
          { backgroundColor: t.colors.slateColor },
        ]}
      >
        <Ionicons name={icon} size={18} color={t.colors.textPrimary} />
      </View>
      <Text style={[staticStyles.listLabel, { color: t.colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={t.colors.textSecondary}
      />
      {!isLast && (
        <View
          style={[
            staticStyles.listDivider,
            { backgroundColor: t.colors.border },
          ]}
        />
      )}
    </Pressable>
  );
});

const SectionTitle = memo(function SectionTitle({
  children,
}: {
  children: string;
}) {
  const t = useTheme();

  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: "700",
        color: t.colors.textPrimary,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
});

export default function ProfileScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Narrow selectors to avoid full-store subscriptions
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const updateUserField = useUserStore((s) => s.updateUserField);
  const signOut = useAuthStore((s) => s.signOut);
  const societyName = useSocietyStore((state) => state?.selectedSociety?.name);
  const { hasRole, hasAnyRole } = usePermissions();

  // Only the two dynamic values belong in useMemo — static keys moved to staticStyles
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          paddingTop: Math.max(insets.top, 12) + 30,
          paddingBottom: 10,
          paddingHorizontal: 16,
          marginHorizontal: -16,
          marginTop: -16,
        },
        updateProfileBtn: {
          borderRadius: 10,
          backgroundColor: t.colors.primary,
          paddingVertical: 12,
        },
      }),
    [
      t.colors.background,
      t.colors.lightBackground,
      t.colors.primary,
      insets.top,
    ],
  );

  // Local avatar preview state (updates instantly when selecting a new photo)
  const [avatarUri, setAvatarUri] = useState<string | undefined>(
    user?.profilePhotoUrl || undefined,
  );
  const { upload } = useImageUpload();
  const onChangeAvatar = useCallback(
    async (uri: string) => {
      setAvatarUri(uri); // immediate UI update
      try {
        // Upload to Cloudinary (use 'profiles' folder for user avatars)
        const result = await upload(uri, "profiles");
        if (result?.secure_url && user?._id) {
          // Persist Cloudinary URL to user profile
          await updateUser({ profilePhotoUrl: result.secure_url }, user._id);
          updateUserField("profilePhotoUrl", result.secure_url);
        } else {
          // fallback: just update local
          updateUserField("profilePhotoUrl", uri);
        }
      } catch {
        // fallback: just update local
        updateUserField("profilePhotoUrl", uri);
      }
    },
    [upload, updateUser, updateUserField, user?._id],
  );

  // Narrow dep: only fullName + role changes should recompute
  const name = useMemo(() => {
    if (!user) return "";
    if (hasRole(UserRole.BUSINESS)) return user.fullName || "Business User";
    if (hasRole(UserRole.ADMIN)) return user.fullName || "Admin";
    if (hasRole(UserRole.RESIDENT)) return user.fullName || "Resident";
    if (hasRole(UserRole.GUEST)) return "Guest";
    return user.fullName || "User";
  }, [user?.fullName, hasRole]);

  // Trivial derivations — useMemo overhead exceeds savings, derive directly
  const phone = user?.phone || "N/A";
  const address =
    user?.completeAddress || societyName || "No address available";

  const isUserVerified = useMemo(() => {
    return (
      hasAnyRole([UserRole.RESIDENT, UserRole.BUSINESS]) &&
      user?.isAddressVerified?.status === verificationStatus.APPROVED
    );
  }, [hasAnyRole, user?.isAddressVerified?.status]);

  const verificationBadge = useMemo(() => {
    if (isUserVerified) {
      return {
        label: "Verified",
        icon: "checkmark" as const,
        color: t.colors.success,
        iconBgColor: t.colors.success,
      };
    }
    if (
      hasAnyRole([UserRole.RESIDENT, UserRole.BUSINESS]) &&
      user?.isAddressVerified?.status === verificationStatus.REJECTED
    ) {
      return {
        label: "Rejected",
        icon: "close-circle-outline" as const,
        color: t.colors.error,
        iconBgColor: t.colors.error,
      };
    }
    if (hasAnyRole([UserRole.RESIDENT, UserRole.BUSINESS])) {
      return {
        label: "Pending",
        icon: "time-outline" as const,
        color: t.colors.warning,
        iconBgColor: t.colors.warning,
      };
    }
    return {
      label: "Not verified",
      icon: "alert-circle-outline" as const,
      color: t.colors.error,
      iconBgColor: t.colors.error,
    };
  }, [
    isUserVerified,
    hasAnyRole,
    user?.isAddressVerified?.status,
    t.colors.success,
    t.colors.warning,
    t.colors.error,
  ]);

  const onLogout = useCallback(() => {
    setLogoutConfirmVisible(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    signOut();
    router.replace("/(auth)/login");
    setLogoutConfirmVisible(false);
  }, [signOut, router]);

  // Stable noop handler for Help & Support
  const onHelpSupport = useCallback(() => { }, []);

  // Navigation callbacks to avoid recreating inline lambdas each render
  const goMyRequests = useCallback(() => {
    router.navigate("/profile/my-requests");
  }, [router]);
  const goMyOrders = useCallback(() => {
    router.navigate("/profile/my-orders");
  }, [router]);
  const goAdminDashboard = useCallback(() => {
    router.navigate("/profile/admin-dashboard");
  }, [router]);
  const goBusinessCatalog = useCallback(() => {
    router.navigate("/(shared)/businessCatalogue");
  }, [router]);

  // Manage Profile modal state
  const [manageVisible, setManageVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const onManageProfile = useCallback(() => {
    setManageVisible(true);
  }, []);

  const closeManage = useCallback(() => {
    setManageVisible(false);
  }, []);

  const onSubmitManage = useCallback(
    async (payload: ManageProfilePayload) => {
      if (!user?._id) return closeManage();
      try {
        let updatedRoles = Array.isArray(user?.roles)
          ? user.roles.filter((r) => r !== "guest")
          : user?.roles;
        if (
          Array.isArray(updatedRoles) &&
          !updatedRoles.includes(UserRole.RESIDENT)
        ) {
          updatedRoles.push(UserRole.RESIDENT);
        }
        await updateUser(
          {
            fullName: payload.fullName,
            societyId: payload.societyId,
            tower: payload.towerId,
            flatNo: payload.flatNo,
            roles: updatedRoles,
            profilePhotoUrl:
              user.profilePhotoUrl ||
              "https://randomuser.me/api/portraits/men/1.jpg",
            completeAddress: payload.completeAddress,
            isAddressVerified: payload.isAddressVerified,
          },
          user._id,
        );
        // Close sheet first, then briefly after show success overlay
        closeManage();
        setSuccessVisible(true);
      } catch (error) {
        console.error("[ProfileScreen] ❌ Profile update failed:", error);
      }
    },
    [updateUser, user?._id, user?.roles, user?.profilePhotoUrl, closeManage],
  );

  const closeDeleteModal = useCallback(() => setDeleteModalVisible(false), []);
  const closeSuccessModal = useCallback(() => setSuccessVisible(false), []);

  const goEventDashboard = useCallback(() => {
    router.navigate("/profile/event-dashboard");
  }, [router]);

  const goDealDashboard = useCallback(() => {
    router.navigate("/profile/deal-dashboard");
  }, [router]);

  const onDeleteAccount = useCallback(() => {
    setDeleteModalVisible(true);
  }, []);

  return (
    <>
      <ScrollView
        contentContainerStyle={staticStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Curved header below notch */}
        <View style={dynamicStyles.headerContainer}>
          <View style={staticStyles.avatarRow}>
            <CircularImage
              uri={avatarUri ?? user?.profilePhotoUrl ?? undefined}
              mode="edit"
              onChange={onChangeAvatar}
              size={100}
              loading={false}
            />
            <View style={staticStyles.flexOne}>
              <View style={staticStyles.nameRow}>
                <Text
                  style={{ ...t.typography.h2, color: t.colors.textPrimary }}
                >
                  {name}
                </Text>
                {!hasAnyRole([UserRole.ADMIN, UserRole.GUEST]) && (
                  <Badge size="sm" {...verificationBadge} />
                )}
              </View>
              {phone ? (
                <Text style={{ color: t.colors.textSecondary, marginTop: 6 }}>
                  {phone}
                </Text>
              ) : null}
              {/* Render email if available on user shape */}
              {(user as any)?.email ? (
                <Text style={{ color: t.colors.textSecondary, marginTop: 2 }}>
                  {(user as any).email}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Personal profile card */}
        <Card style={staticStyles.cardMargin}>
          <View style={staticStyles.cardPadding}>
            <SectionTitle>My Personal Profile</SectionTitle>
            {address.length > 0 && (
              <View style={staticStyles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={t.colors.textSecondary}
                />
                <Text
                  style={[
                    staticStyles.infoRowText,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {address}
                </Text>
              </View>
            )}
            {phone && (
              <View style={staticStyles.infoRow}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={t.colors.textSecondary}
                />
                <Text
                  style={[
                    staticStyles.infoRowText,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {phone}
                </Text>
              </View>
            )}
            {hasRole(UserRole.RESIDENT) && (
              <ActionButton
                title="Update Profile"
                onPress={onManageProfile}
                variant="primary"
                size="lg"
                containerStyle={dynamicStyles.updateProfileBtn}
                fullWidth
              />
            )}
          </View>
        </Card>

        <HDivider thickness={2} />

        {/* Quick links card (before Logout) */}
        <Card>
          <View style={staticStyles.quickLinksInner}>
            {/* Build rows */}
            {!hasRole(UserRole.GUEST) && (
              <ListRow
                label="My Orders"
                icon="heart-outline"
                onPress={goMyOrders}
              />
            )}
            {hasAnyRole([UserRole.BUSINESS, UserRole.ADMIN, UserRole.RESIDENT, UserRole.SUPER_ADMIN]) && (
              <ListRow
                label="My Deals"
                icon="heart-outline"
                onPress={goDealDashboard}
              />
            )}
            {hasAnyRole([UserRole.BUSINESS, UserRole.RESIDENT]) && (
              <ListRow
                label="My Events"
                icon="heart-outline"
                onPress={goEventDashboard}
              />
            )}
            {hasRole(UserRole.BUSINESS) && (
              <ListRow
                label="My Business Account"
                icon="storefront-outline"
                onPress={goBusinessCatalog}
              />
            )}
            {!hasRole(UserRole.GUEST) && !hasRole(UserRole.ADMIN) && (
              <ListRow
                label="My Requests"
                icon="document-outline"
                onPress={goMyRequests}
              />
            )}
            {hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]) && (
              <ListRow
                label="Admin Dashboard"
                icon="help-circle-outline"
                onPress={goAdminDashboard}
              />
            )}
            <ListRow
              label="Help & Support"
              icon="help-circle-outline"
              onPress={onHelpSupport}
              isLast
            />
          </View>
        </Card>

        {/* Delete */}
        <ActionButton
          title="Delete Account"
          onPress={onDeleteAccount}
          variant="danger"
          size="lg"
          leftIconName="log-out-outline"
          containerStyle={staticStyles.logoutBtn}
          fullWidth
        />

        {/* Logout */}
        <ActionButton
          title="Logout"
          onPress={onLogout}
          variant="outline"
          size="lg"
          leftIconName="log-out-outline"
          containerStyle={staticStyles.logoutBtn}
          fullWidth
        />
      </ScrollView>
      {/* Manage Profile Form Sheet */}
      <FormSheetModal
        visible={manageVisible}
        onClose={closeManage}
        title="Manage Personal Profile"
        subtitle="Update your name and address details"
        dismissOnBackdrop={true}
      >
        {manageVisible ? (
          <ManageProfileForm
            onCancel={closeManage}
            onSubmit={onSubmitManage}
            showMobileField={false}
          />
        ) : null}
      </FormSheetModal>

      {/* Manage Profile Form Sheet */}
      <FormSheetModal
        visible={deleteModalVisible}
        onClose={closeDeleteModal}
        title="Delete Account"
        dismissOnBackdrop={true}
      >
        {deleteModalVisible ? <DeleteAccount /> : null}
      </FormSheetModal>

      {/* Success overlay after profile update */}
      <OrderSuccessModal
        visible={successVisible}
        onDismiss={closeSuccessModal}
        title="Profile updated"
        subtitle="Your personal details were saved."
        autoHideMs={1800}
      />

      <ConfirmationModal
        visible={logoutConfirmVisible}
        onClose={() => setLogoutConfirmVisible(false)}
        onConfirm={handleConfirmLogout}
        title="Logout"
        message="Are you sure to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={false}
      />
    </>
  );
}
