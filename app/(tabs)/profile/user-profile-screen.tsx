import NoDataCard from "@/components/common/NoDataCard";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import ProductCard from "@/components/product/ProductCard";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import UserProfileHeader from "@/components/profile/UserProfileHeader";
import PollCard from "@/components/UI/PollCard";
import PostCard from "@/components/UI/PostCard";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id?: string }>();

  // Store selectors
  const viewedUser = useUserStore((s) => s.viewedUser);
  const viewedUserLoading = useUserStore((s) => s.viewedUserLoading);
  const approvedResidents = useUserStore((s) => s.approvedResidents);
  const userFeeds = useFeedsStore((s) => s.feedsByUser);
  const feedsLoading = useFeedsStore((s) => s.loading);

  // ── State ──────────────────────────────────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdminRoleConfirm, setShowAdminRoleConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);
  const [optimisticRoles, setOptimisticRoles] = useState<string[] | null>(null);
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<{
    userId: string;
    updatedRoles: string[];
    isAdding: boolean;
  } | null>(null);

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    useUserStore.getState().fetchViewedUser(userId).catch(console.error);
    useFeedsStore.getState().getFeedsByUserId(userId).catch(console.error);
    return () => {
      useUserStore.getState().setViewedUser(null);
      useFeedsStore.getState().setFeedsByUser([]);
    };
  }, [userId]);

  useEffect(() => {
    if (!showSuccessModal && successMessage?.title === "Success") {
      setOptimisticRoles(null);
    }
  }, [showSuccessModal, successMessage?.title]);

  // ── Derived data ───────────────────────────────────────────────────────
  const selectedUser = useMemo(() => {
    if (!viewedUser) return null;
    return optimisticRoles
      ? { ...viewedUser, roles: optimisticRoles }
      : viewedUser;
  }, [viewedUser, optimisticRoles]);

  const isDataReady = !!selectedUser && !viewedUserLoading;

  const initials = useMemo(() => {
    if (!selectedUser?.fullName) return "?";
    const names = selectedUser.fullName.trim().split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0).toUpperCase() +
      names[names.length - 1].charAt(0).toUpperCase()
    );
  }, [selectedUser?.fullName]);

  const roleDisplay = useMemo(() => {
    const roleMap: Record<string, string> = {
      resident: "Resident",
      owner: "Residing Owner",
      tenant: "Tenant",
      admin: "Admin",
      business: "Business Owner",
    };
    return (
      selectedUser?.roles?.map((r) => roleMap[r] || r).join(" • ") || "Member"
    );
  }, [selectedUser?.roles]);

  const societyName = useMemo(() => {
    if (!selectedUser?.societyId) return null;
    return typeof selectedUser.societyId !== "string"
      ? (selectedUser.societyId?.name ?? "N/A")
      : selectedUser.societyId;
  }, [selectedUser?.societyId]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleBack = useCallback(() => router.back(), [router]);
  const handleRemoveUser = useCallback(() => setShowDeleteConfirm(true), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await useUserStore.getState().deleteUser(userId);
      setShowDeleteConfirm(false);
      setSuccessMessage({
        title: "Success",
        subtitle: "User deleted successfully.",
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowDeleteConfirm(false);
      setSuccessMessage({
        title: "Error",
        subtitle: error?.message || "Failed to delete user.",
      });
      setShowSuccessModal(true);
    } finally {
      setIsDeleting(false);
    }
  }, [userId]);

  const handleToggleAdminRole = useCallback(
    (targetUserId: string, updatedRoles: string[]) => {
      setPendingRoleUpdate({
        userId: targetUserId,
        updatedRoles,
        isAdding: updatedRoles.includes(UserRole.ADMIN),
      });
      setShowAdminRoleConfirm(true);
    },
    [],
  );

  const handleConfirmAdminRoleChange = useCallback(async () => {
    if (!pendingRoleUpdate) return;
    const { userId: targetUserId, updatedRoles, isAdding } = pendingRoleUpdate;
    setOptimisticRoles(updatedRoles);
    try {
      await useUserStore
        .getState()
        .updateUser({ roles: updatedRoles }, targetUserId);
      await useUserStore.getState().fetchViewedUser(targetUserId);
      if (approvedResidents) {
        useUserStore
          .getState()
          .setApprovedResidents(
            approvedResidents.map((r) =>
              r._id === targetUserId ? { ...r, roles: updatedRoles } : r,
            ),
          );
      }
      setShowAdminRoleConfirm(false);
      setPendingRoleUpdate(null);
      setSuccessMessage({
        title: "Success",
        subtitle: isAdding
          ? "Admin role granted successfully!"
          : "Admin role removed successfully!",
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      setOptimisticRoles(null);
      setShowAdminRoleConfirm(false);
      setPendingRoleUpdate(null);
      setSuccessMessage({
        title: "Error",
        subtitle: error?.message || "Failed to update admin role.",
      });
      setShowSuccessModal(true);
    }
  }, [pendingRoleUpdate, approvedResidents]);

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderFeedItem = useCallback(
    ({ item }: { item: (typeof userFeeds)[0] }) => {
      if (item?.type === "post")
        return <PostCard postData={item} loading={feedsLoading} readOnly />;
      if (item?.type === "poll") return <PollCard pollId={item._id} pollData={item} readOnly />;
      if (item?.type === "event")
        return (
          <ProductCard
            productDetails={item}
            type="event"
            loading={feedsLoading}
            readOnly
          />
        );
      return null;
    },
    [feedsLoading],
  );

  const keyExtractor = useCallback(
    (item: (typeof userFeeds)[0]) => item._id,
    [],
  );

  const listHeader = useMemo(
    () => (
      <UserProfileHeader
        user={selectedUser}
        userId={userId}
        roleDisplay={roleDisplay}
        societyName={societyName}
      />
    ),
    [selectedUser, userId, roleDisplay, societyName],
  );

  // Back + options menu stay pinned above the scrolling content.
  const topBar = (
    <TitleHeader
      title="User Profile"
      selectedUserRoles={selectedUser?.roles ?? undefined}
      userId={userId}
      onBackPress={handleBack}
      showOptionsMenu={isDataReady}
      onRemoveUser={handleRemoveUser}
      onToggleAdminRole={handleToggleAdminRole}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isDataReady) {
    return (
      <SafeAreaProvider>
        <View
          style={[
            styles.container,
            {
              backgroundColor: t.colors.white,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          {topBar}
          <ProfileSkeleton />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View
        style={[
          styles.container,
          { backgroundColor: t.colors.white, paddingTop: insets.top + 8 },
        ]}
      >
        {topBar}
        <FlatList
          data={userFeeds}
          renderItem={renderFeedItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            feedsLoading ? null : (
              <NoDataCard iconName="reader-outline" message="No posts, events or polls yet." />
            )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.flatListContent, { paddingBottom: insets.bottom + 16 }]}
        />
      </View>

      <OrderSuccessModal
        visible={showSuccessModal}
        onDismiss={() => {
          setShowSuccessModal(false);
          if (!isDeleting && successMessage?.title === "Success") router.back();
        }}
        title={successMessage?.title || "Success"}
        subtitle={
          successMessage?.subtitle || "Operation completed successfully."
        }
        autoHideMs={1600}
      />

      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
      />

      <ConfirmationModal
        visible={showAdminRoleConfirm}
        onClose={() => {
          setShowAdminRoleConfirm(false);
          setPendingRoleUpdate(null);
        }}
        onConfirm={handleConfirmAdminRoleChange}
        title={
          pendingRoleUpdate?.isAdding ? "Grant Admin Role" : "Remove Admin Role"
        }
        message={
          pendingRoleUpdate?.isAdding
            ? "Are you sure you want to grant admin privileges to this user? They will have access to admin features and controls."
            : "Are you sure you want to remove admin privileges from this user? They will lose access to admin features."
        }
        confirmText={
          pendingRoleUpdate?.isAdding ? "Grant Admin" : "Remove Admin"
        }
        cancelText="Cancel"
        isDangerous={!pendingRoleUpdate?.isAdding}
        successTitle={
          pendingRoleUpdate?.isAdding
            ? "Admin Role Granted!"
            : "Admin Role Removed!"
        }
        successMessage={
          pendingRoleUpdate?.isAdding
            ? "User now has admin privileges."
            : "Admin privileges have been revoked."
        }
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
