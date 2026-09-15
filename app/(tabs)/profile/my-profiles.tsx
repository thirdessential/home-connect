// "My Profiles" — account management inner page, opened from the main
// Profile screen the same way My Events/My Reports open theirs (TitleHeader +
// pushed route). Houses: Edit User Profile (name/email), Resident/Business
// account creation or management (derived from the authenticated user's own
// roles — never a client-only flag), and Delete Account.

import { Card } from "@/components/UI/Card";
import TitleHeader from "@/components/UI/TitleHeader";
import { useToast } from "@/components/common/Toast";
import ManageProfileForm from "@/components/form/ManageProfileForm";
import FormSheetModal from "@/components/modals/FormSheetModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import EditUserProfileForm, {
  EditUserProfilePayload,
} from "@/components/profile/EditUserProfileForm";
import { usePermissions } from "@/hooks/usePermissions";
import { ManageProfilePayload } from "@/store/auth.type";
import { verificationStatus } from "@/assets/enums/common.enum";
import { useBusinessRegistrationStore } from "@/store/useBusinessRegistrationStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Row = memo(function Row({
  label,
  icon,
  onPress,
  isLast,
  danger,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  const t = useTheme();
  const iconWrapBg = danger ? t.colors.error + "1A" : t.colors.brandWeak;
  const color = danger ? t.colors.error : t.colors.textPrimary;
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
        <Ionicons name={icon} size={20} color={danger ? t.colors.error : t.colors.brand} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={t.colors.textSecondary} />
      {!isLast && (
        <View style={[styles.divider, { backgroundColor: t.colors.border, left: 70 }]} />
      )}
    </Pressable>
  );
});

export default function MyProfilesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const { hasRole } = usePermissions();
  const societyName = useSocietyStore((state) => state?.selectedSociety?.name);
  const phone = user?.phone || "N/A";
  const address = user?.completeAddress || societyName || "No address available";

  const { showToast } = useToast();
  const hasResident = hasRole(UserRole.RESIDENT);
  const hasBusiness = hasRole(UserRole.BUSINESS);
  const businessStatus = useBusinessRegistrationStore((s) => s.business?.business_status);
  const loadBusiness = useBusinessRegistrationStore((s) => s.loadCurrent);
  // Existing business_status enum ("draft"|"pending"|"approved"|"rejected") —
  // only a pending submission should block re-entering the creation wizard.
  const isBusinessPending = businessStatus === "pending";

  useEffect(() => {
    if (!hasBusiness) loadBusiness().catch(() => {});
  }, [hasBusiness, loadBusiness]);

  const [personalProfileVisible, setPersonalProfileVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [manageResidentVisible, setManageResidentVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", subtitle: "" });

  const closeEditProfile = useCallback(() => setEditProfileVisible(false), []);
  const closeManageResident = useCallback(() => setManageResidentVisible(false), []);
  const closeSuccess = useCallback(() => setSuccessVisible(false), []);

  const onSubmitEditProfile = useCallback(
    async (payload: EditUserProfilePayload) => {
      if (!user?._id || submitting) return;
      setSubmitting(true);
      try {
        await updateUser({ fullName: payload.fullName, email: payload.email }, user._id);
        setEditProfileVisible(false);
        setSuccessMessage({
          title: "Profile updated",
          subtitle: "Your name and email were saved.",
        });
        setSuccessVisible(true);
      } catch (error) {
        console.error("[MyProfiles] Edit user profile failed:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [updateUser, user?._id, submitting],
  );

  // Same payload shape/API call as the previous "Update profile" flow on the
  // main Profile screen — just relocated here as "Manage Your Resident Account".
  const onSubmitManageResident = useCallback(
    async (payload: ManageProfilePayload) => {
      if (!user?._id) return closeManageResident();
      try {
        let updatedRoles = Array.isArray(user?.roles)
          ? user.roles.filter((r) => r !== "guest")
          : user?.roles;
        if (Array.isArray(updatedRoles) && !updatedRoles.includes(UserRole.RESIDENT)) {
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
              user.profilePhotoUrl || "https://randomuser.me/api/portraits/men/1.jpg",
            completeAddress: payload.completeAddress,
            // Editing an already-approved resident must not bounce them back
            // to pending — the form defaults to PENDING for the first-time
            // verification flow it's also used for, so only trust that
            // default when the user isn't already approved.
            isAddressVerified:
              user.isAddressVerified?.status === verificationStatus.APPROVED
                ? user.isAddressVerified
                : payload.isAddressVerified,
          },
          user._id,
        );
        closeManageResident();
        setSuccessMessage({
          title: "Resident details updated",
          subtitle: "Your resident account details were saved.",
        });
        setSuccessVisible(true);
      } catch (error) {
        console.error("[MyProfiles] Resident update failed:", error);
      }
    },
    [updateUser, user?._id, user?.roles, user?.profilePhotoUrl, closeManageResident],
  );

  // Reuse the existing verification/business-onboarding flows verbatim —
  // same routes VerificationGateModal/HomeScreen already push to.
  const goCreateResident = useCallback(() => router.push("/onboarding/verify-role"), []);
  const goCreateBusiness = useCallback(() => {
    if (isBusinessPending) {
      showToast("Your business account is under verification. Please wait.", "info");
      return;
    }
    router.push("/onboarding/business");
  }, [isBusinessPending, showToast]);
  const goManageBusiness = useCallback(() => router.push("/(shared)/businessCatalogue"), []);
  const openPersonalProfile = useCallback(() => setPersonalProfileVisible(true), []);
  const openEditProfile = useCallback(() => setEditProfileVisible(true), []);
  const openManageResident = useCallback(() => setManageResidentVisible(true), []);
  const openDelete = useCallback(() => router.push("/profile/delete-account"), []);

  const accountOptions = useMemo(() => {
    const items: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
      { key: "personal-profile", label: "My Personal Profile", icon: "person-circle-outline", onPress: openPersonalProfile },
      { key: "edit-profile", label: "Edit User Profile", icon: "person-outline", onPress: openEditProfile },
    ];
    // Independent per role — a Resident-only (or Business-only) user must
    // still be able to manage the role they already have, not just be
    // offered to create the one they don't.
    if (hasResident) {
      items.push({ key: "manage-resident", label: "Manage Your Resident Account", icon: "home-outline", onPress: openManageResident });
    } else {
      items.push({ key: "create-resident", label: "Create Your Resident Account", icon: "home-outline", onPress: goCreateResident });
    }
    if (hasBusiness) {
      items.push({ key: "manage-business", label: "Manage Your Business Account", icon: "storefront-outline", onPress: goManageBusiness });
    } else {
      items.push({ key: "create-business", label: "Create Your Business Account", icon: "storefront-outline", onPress: goCreateBusiness });
    }
    return items;
  }, [hasResident, hasBusiness, openPersonalProfile, openEditProfile, openManageResident, goManageBusiness, goCreateBusiness, goCreateResident]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <TitleHeader title="My Profiles" onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.card, styles.cardPadding]}>
          <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>My personal profile</Text>
          {address.length > 0 && (
            <>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: t.colors.brandWeak }]}>
                  <Ionicons name="location-outline" size={18} color={t.colors.brand} />
                </View>
                <View style={styles.infoRowText}>
                  <Text style={[styles.infoLabel, { color: t.colors.textSecondary }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: t.colors.textPrimary }]}>{address}</Text>
                </View>
              </View>
              <View style={[styles.infoDivider, { backgroundColor: t.colors.border }]} />
            </>
          )}
          {phone && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: t.colors.brandWeak }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={t.colors.brand} />
              </View>
              <View style={styles.infoRowText}>
                <Text style={[styles.infoLabel, { color: t.colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: t.colors.textPrimary }]}>{phone}</Text>
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          {accountOptions.map((item, index) => (
            <Row
              key={item.key}
              label={item.label}
              icon={item.icon}
              onPress={item.onPress}
              isLast={index === accountOptions.length - 1}
            />
          ))}
        </Card>

        <Card style={styles.card}>
          <Row label="Delete Account" icon="trash-bin-outline" onPress={openDelete} danger isLast />
        </Card>
      </ScrollView>

      <FormSheetModal
        visible={personalProfileVisible}
        onClose={() => setPersonalProfileVisible(false)}
        title="My Personal Profile"
        dismissOnBackdrop
      >
        <View style={{ paddingVertical: 8, gap: 12 }}>
          <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>Name</Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 15, marginTop: -8 }}>{user?.fullName || "-"}</Text>
          <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>Email</Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 15, marginTop: -8 }}>{user?.email || "-"}</Text>
          <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>Phone</Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 15, marginTop: -8 }}>{user?.phone || "-"}</Text>
          <Text style={{ color: t.colors.textSecondary, fontSize: 12 }}>Address</Text>
          <Text style={{ color: t.colors.textPrimary, fontSize: 15, marginTop: -8 }}>{user?.completeAddress || "-"}</Text>
        </View>
      </FormSheetModal>

      <FormSheetModal
        visible={editProfileVisible}
        onClose={closeEditProfile}
        title="Edit User Profile"
        subtitle="Update your name and email"
        dismissOnBackdrop={!submitting}
      >
        {editProfileVisible ? (
          <EditUserProfileForm
            initialName={user?.fullName}
            initialEmail={user?.email}
            submitting={submitting}
            onCancel={closeEditProfile}
            onSubmit={onSubmitEditProfile}
          />
        ) : null}
      </FormSheetModal>

      <FormSheetModal
        visible={manageResidentVisible}
        onClose={closeManageResident}
        title="Manage Your Resident Account"
        subtitle="Update your resident details"
        dismissOnBackdrop
      >
        {manageResidentVisible ? (
          <ManageProfileForm
            onCancel={closeManageResident}
            onSubmit={onSubmitManageResident}
            showMobileField={false}
            submitLabel="Save"
          />
        ) : null}
      </FormSheetModal>

      <OrderSuccessModal
        visible={successVisible}
        onDismiss={closeSuccess}
        title={successMessage.title}
        subtitle={successMessage.subtitle}
        autoHideMs={1800}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  card: { marginBottom: 16, padding: 0 },
  cardPadding: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: "Manrope_700Bold", marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoRowText: { flex: 1, paddingTop: 2 },
  infoLabel: { fontFamily: "Manrope_600SemiBold" },
  infoValue: { fontSize: 14, fontFamily: "Manrope_600SemiBold", lineHeight: 20, marginTop: 2 },
  infoDivider: { height: 1, marginLeft: 48, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  label: { flex: 1, fontSize: 15, fontFamily: "Manrope_500Medium" },
  divider: {
    position: "absolute",
    right: 0,
    bottom: 0,
    height: 1,
    opacity: 0.4,
  },
});
