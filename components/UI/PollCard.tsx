import { verificationStatus } from "@/assets/enums/common.enum";
import { usePermissions } from "@/hooks/usePermissions";
import { formatPostTime } from "@/lib/dateTime";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Share, Text, TouchableOpacity, View } from "react-native";
import VerificationSheet from "../common/VerificationSheet";
import FeedActions from "../home/FeedActions";
import ConfirmationModal from "../modals/ConfirmationModal";
import FormSheetModal from "../modals/FormSheetModal";
import OrderSuccessModal from "../modals/OrderSuccessModal";
import ReportModal from "../modals/ReportModal";
import { Card } from "./Card";
import ImageTitleHeader from "./ImageTitleHeader";
import Skeleton from "./Skeleton";

const PollCard = React.memo(function PollCard({
  pollId,
  onDelete,
}: {
  pollId: string;
  onDelete?: () => Promise<void>;
}) {
  const pollData = useFeedsStore((state) =>
    state.feeds.find((f) => f._id === pollId),
  );
  const votePoll = useFeedsStore((state) => state.votePoll);
  const removeFeed = useFeedsStore((state) => state.removeFeed);
  const feedsLoading = useFeedsStore((state) => state.loading);

  const t = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [verifySheetVisible, setVerifySheetVisible] = useState(false);
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<"poll" | "user" | null>(null);
  const { hasRole } = usePermissions();
  const isGuest = hasRole(UserRole.GUEST);
  const currentUser = useUserStore((state) => state.user);
  const unverifiedUser =
    !isGuest &&
    !hasRole(UserRole.ADMIN) &&
    currentUser?.isAddressVerified?.status !== verificationStatus.APPROVED;

  const [deleteSuccessVisible, setDeleteSuccessVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // ── Derived poll state ────────────────────────────────────────────────────

  /** Whether current user is the poll creator */
  const isPollCreator = useMemo(() => {
    if (!currentUser?._id || !pollData?.user) return false;
    if (typeof pollData.user === "string") return pollData.user === currentUser._id;
    return pollData.user?._id === currentUser._id;
  }, [currentUser?._id, pollData?.user]);

  /** Whether current user has already voted (derived from pollData.votes) */
  const hasVoted = useMemo(() => {
    if (!currentUser?._id || !pollData?.votes?.length) return false;
    return pollData.votes.some((v: any) => {
      const vid = typeof v.userId === "string" ? v.userId : v.userId?._id ?? v.userId?.toString();
      return vid === currentUser._id;
    });
  }, [currentUser?._id, pollData?.votes]);

  /** The optionId the current user voted for (if any) */
  const votedOptionId = useMemo(() => {
    if (!currentUser?._id || !pollData?.votes?.length) return null;
    const myVote = pollData.votes.find((v: any) => {
      const vid = typeof v.userId === "string" ? v.userId : v.userId?._id ?? v.userId?.toString();
      return vid === currentUser._id;
    });
    return myVote?.optionId ?? null;
  }, [currentUser?._id, pollData?.votes]);

  /** Sync local selected state with the voted option on mount / when votes change */
  useEffect(() => {
    if (votedOptionId && !selected) {
      setSelected(votedOptionId);
    }
  }, [votedOptionId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Total votes — prefer votes array length as ground truth */
  const totalVotes = useMemo(
    () =>
      pollData?.votes?.length ||
      pollData?.totalVotes ||
      pollData?.options?.reduce((sum: number, o: any) => sum + (o.votes || 0), 0) ||
      0,
    [pollData?.votes, pollData?.totalVotes, pollData?.options],
  );

  /**
   * Show results if:
   *  - current user created the poll  (isPollCreator)
   *  - current user already voted     (hasVoted)
   *  - user just voted in this session (selected !== null)
   *  - poll already has votes          (totalVotes > 0) — optional, shows live count
   */
  const showResults = useMemo(
    () => isPollCreator || hasVoted || selected !== null,
    [isPollCreator, hasVoted, selected],
  );

  // ── Vote count helpers ────────────────────────────────────────────────────

  const getVotes = useCallback(
    (option: any) => {
      // Prefer counting directly from votes array (most accurate)
      if (pollData?.votes?.length) {
        return pollData.votes.filter((v: any) => v.optionId === option.id).length;
      }
      return option.votes || 0;
    },
    [pollData?.votes],
  );

  const getPercent = useCallback(
    (option: any) => {
      if (option.percentage !== undefined && !pollData?.votes?.length) {
        return Math.round(option.percentage);
      }
      const votes = getVotes(option);
      if (totalVotes === 0) return 0;
      return Math.round((votes / totalVotes) * 100);
    },
    [getVotes, totalVotes, pollData?.votes],
  );

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleLikePress = useCallback(() => {
    if (isGuest) { setVerifySheetVisible(true); return true; }
    if (unverifiedUser) { setUnverifiedModalVisible(true); return true; }
    return false;
  }, [isGuest, unverifiedUser]);

  const handleCommentPress = useCallback(() => {
    if (isGuest) { setVerifySheetVisible(true); return; }
    if (unverifiedUser) { setUnverifiedModalVisible(true); return; }
  }, [isGuest, unverifiedUser]);

  const handleCloseSheet = useCallback(() => setVerifySheetVisible(false), []);
  const handleFormSubmit = useCallback(() => setVerifySheetVisible(false), []);
  const handleCloseUnverifiedModal = useCallback(() => setUnverifiedModalVisible(false), []);

  const handleReportPost = useCallback(() => { setReportType("poll"); setReportVisible(true); }, []);
  const handleCloseReportModal = useCallback(() => setReportVisible(false), []);
  const handleRemovePost = useCallback(() => setConfirmDeleteVisible(true), []);
  const handleReportUser = useCallback(() => { }, []);

  // OS share sheet — no deep link, feed polls have no route in the app scheme.
  const handleShare = useCallback(async () => {
    const title = pollData?.title;
    if (!title) return;
    try {
      await Share.share({
        title,
        message: [title, "Shared via HomeConnect"].join("\n\n"),
      });
    } catch {
      // Sheet dismissed or unavailable.
    }
  }, [pollData?.title]);

  const handleConfirmDelete = useCallback(async () => {
    const feedId = pollData?._id;
    if (!feedId) throw new Error("Feed ID is missing");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [pollData?._id]);

  const handleSuccessShown = useCallback(() => {
    const feedId = pollData?._id;
    if (feedId) removeFeed(feedId);
  }, [removeFeed, pollData?._id]);

  // ── Skeleton / null guards ────────────────────────────────────────────────

  if (feedsLoading && !pollData) {
    return (
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        <Skeleton width="90%" height={18} style={{ marginBottom: 16 }} />
        <View style={{ gap: 8 }}>
          <Skeleton width="100%" height={45} borderRadius={8} />
          <Skeleton width="100%" height={45} borderRadius={8} />
          <Skeleton width="100%" height={45} borderRadius={8} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
      </Card>
    );
  }

  if (!pollData) return null;

  return (
    <Card style={{ borderRadius: 12 }}>
      {/* Header */}
      <ImageTitleHeader
        imageUri={
          typeof pollData.user === "object" && pollData.user !== null
            ? pollData.user.profilePhotoUrl
            : undefined
        }
        title={
          typeof pollData.user === "object" && pollData.user !== null
            ? pollData.user.fullName
            : ""
        }
        subtitle={`${formatPostTime(pollData.createdAt ?? "")} • ${hasRole(UserRole.GUEST)
            ? "Pune"
            : `${pollData.towerName ?? ""}, ${pollData.flatNo ?? ""}`
          }`}
        isSameUser={
          typeof pollData.user === "string"
            ? currentUser?._id === pollData.user
            : currentUser?._id === pollData.user?._id
        }
        imageSize={44}
        showOptionsMenu={true}
        onReportPost={handleReportPost}
        onReportUser={handleReportUser}
        onShare={handleShare}
        onRemovePost={handleRemovePost}
      />

      {/* Poll Question */}
      <Text
        style={{
          fontWeight: "600",
          paddingTop: 10,
          fontSize: 15.5,
          color: t.colors.textPrimary,
          marginBottom: 0,
        }}
      >
        {pollData.title}
      </Text>

      {/* Result mode banner */}
      {showResults && (
        <Text style={{ fontSize: 12, color: t.colors.textSecondary, marginTop: 6 }}>
          {isPollCreator
            ? "Your poll · results"
            : hasVoted
              ? "You voted · results"
              : `${totalVotes} vote${totalVotes !== 1 ? "s" : ""}`}
        </Text>
      )}

      {/* Poll Options */}
      <View style={{ marginTop: 10, gap: 8 }}>
        {pollData.options?.map((option: any, index: number) => {
          const isSelected = selected === option.id || votedOptionId === option.id;
          const optVotes = getVotes(option);
          const pct = getPercent(option);

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={showResults ? 1 : 0.8}
              onPress={() => {
                if (isGuest) { setVerifySheetVisible(true); return; }
                if (unverifiedUser) { setUnverifiedModalVisible(true); return; }
                // Prevent voting if already in result mode
                if (showResults) return;
                setSelected(option.id);
                if (currentUser?._id && pollData?._id) {
                  votePoll(pollData._id, option.id, currentUser._id);
                }
              }}
              style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: t.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: isSelected ? t.colors.brand : t.colors.border,
                overflow: "hidden",
              }}
            >
              {/* Progress bar background */}
              {showResults && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: t.colors.brandWeak,
                    borderRadius: 10,
                  }}
                />
              )}

              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 15,
                      color: t.colors.textPrimary,
                    }}
                  >
                    {option.name}
                  </Text>
                  {showResults && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: isSelected ? t.colors.brand : t.colors.textSecondary,
                        marginTop: 2,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {optVotes} vote{optVotes !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>

                {showResults && (
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 14,
                      color: t.colors.brand,
                      minWidth: 38,
                      textAlign: "right",
                    }}
                  >
                    {pct}%
                  </Text>
                )}

                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={t.colors.brand}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total votes footer */}
      {showResults && (
        <Text
          style={{
            fontSize: 12,
            color: t.colors.textSecondary,
            marginTop: 8,
            textAlign: "right",
          }}
        >
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </Text>
      )}

      {/* Social Actions */}
      <FeedActions
        feedId={pollData._id ?? ""}
        likes={pollData.likes}
        commentCount={pollData.comments?.length || 0}
        shareTitle={pollData.title}
        onBeforeAction={handleLikePress}
        onCommentPress={handleCommentPress}
        trailing={
          onDelete ? (
            <TouchableOpacity onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={t.colors.error} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Verification Sheet */}
      {verifySheetVisible && (
        <VerificationSheet
          visible={verifySheetVisible}
          onClose={handleCloseSheet}
          onCompleted={handleFormSubmit}
        />
      )}

      {/* Unverified User Modal */}
      {unverifiedModalVisible && (
        <FormSheetModal
          visible={unverifiedModalVisible}
          onClose={handleCloseUnverifiedModal}
          title="Verification Pending"
          subtitle="Please wait for admin approval"
        >
          <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
            <Text
              style={{
                ...t.typography.body,
                color: t.colors.textSecondary,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Your account is currently under review by the admin. You&apos;ll be able to like and
              comment once your verification is approved.
            </Text>
            <TouchableOpacity
              onPress={handleCloseUnverifiedModal}
              style={{
                backgroundColor: t.colors.primary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ ...t.typography.button1, color: "#fff" }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </FormSheetModal>
      )}

      {/* Delete Success Modal */}
      <OrderSuccessModal
        visible={deleteSuccessVisible}
        onDismiss={() => setDeleteSuccessVisible(false)}
        title="Post Deleted!"
        subtitle="Your post has been successfully removed."
        autoHideMs={1800}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={confirmDeleteVisible}
        onClose={() => setConfirmDeleteVisible(false)}
        onConfirm={handleConfirmDelete}
        onSuccessShown={handleSuccessShown}
        title="Delete Poll?"
        message="Are you sure you want to delete this poll? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        successTitle="Poll Deleted!"
        successMessage="Your poll has been successfully removed from the feed."
        autoCloseDelay={1500}
      />

      {/* Report Modal */}
      <ReportModal
        visible={reportVisible}
        onClose={handleCloseReportModal}
        reportType={reportType || "poll"}
        itemId={
          reportType === "user"
            ? typeof pollData.user === "object" && pollData.user !== null
              ? pollData.user._id || ""
              : pollData.user || ""
            : pollData?._id || ""
        }
        itemName={
          reportType === "user"
            ? typeof pollData.user === "object" && pollData.user !== null
              ? pollData.user.fullName || "User"
              : "User"
            : pollData?.title?.substring(0, 50) || "Poll"
        }
      />
    </Card>
  );
});

export default PollCard;
