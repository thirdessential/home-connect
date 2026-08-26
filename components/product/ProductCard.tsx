import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { usePermissions } from "@/hooks/usePermissions";
import { formatPostTime } from "@/lib/dateTime";
import { capitalizeWords, getTruncatedDescription } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Alert, Image, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import VerificationSheet from "../common/VerificationSheet";
import ActionButton from "../inputs/ActionButton";
import LikeButton from "../inputs/LikeButton";
import ConfirmationModal from "../modals/ConfirmationModal";
import FormSheetModal from "../modals/FormSheetModal";
import ReportModal from "../modals/ReportModal";
import { Card } from "../UI/Card";
import ImageTitleHeader from "../UI/ImageTitleHeader";
import OrderProgressBar from "../UI/OrderProgress";
import Skeleton from "../UI/Skeleton";
import { LinearGradient } from "expo-linear-gradient";

type ProductCardProps = {
  productDetails?: any;
  style?: any;
  type?: string;
  loading?: boolean;
  onDelete?: () => Promise<void>;
};

// Small pill used on deal cards to show ACTIVE / PENDING / APPROVED / etc.
// Colors are looked up from a fixed map so every status reads consistently
// across the app.
const STATUS_STYLES: Record<string, { backgroundColor: string; textColor: string }> = {
  ACTIVE: { backgroundColor: "#DCFCE7", textColor: "#15803D" },
  PENDING: { backgroundColor: "#FEF3C7", textColor: "#B45309" },
  APPROVED: { backgroundColor: "#DBEAFE", textColor: "#1D4ED8" },
  REJECTED: { backgroundColor: "#FEE2E2", textColor: "#DC2626" },
  FAILED: { backgroundColor: "#FEE2E2", textColor: "#DC2626" },
  FULL: { backgroundColor: "#E5E7EB", textColor: "#4B5563" },
};
const DEFAULT_STATUS_STYLE = { backgroundColor: "#F3F4F6", textColor: "#374151" };

function StatusBadge({ status }: { status: string }) {
  const capitalizedStatus = status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const { backgroundColor, textColor } =
    STATUS_STYLES[status?.toUpperCase()] ?? DEFAULT_STATUS_STYLE;

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: textColor }]}>{capitalizedStatus}</Text>
    </View>
  );
}

function ProductCard({ productDetails, style, type, loading = false, onDelete }: ProductCardProps) {
  const t = useTheme();
  const isEvent = type === "event";

  const { hasRole } = usePermissions();
  const isGuest = hasRole(UserRole.GUEST);
  const currentUser = useUserStore((state) => state.user);
  const removeDeal = useWholesaleDealStore((state) => state.removeDeal);
  const unverifiedUser =
    !isGuest &&
    !hasRole(UserRole.ADMIN) &&
    currentUser?.isAddressVerified?.status !== verificationStatus.APPROVED;

  // ---- Modal / sheet visibility ------------------------------------------------
  const [verifySheetVisible, setVerifySheetVisible] = useState(false);
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<"deal" | "event" | "user" | null>(null);

  // ---- Navigation / CTA ----------------------------------------------------------
  const handleCtaPress = useCallback(() => {
    if (isGuest) {
      setVerifySheetVisible(true);
      return;
    }
    if (unverifiedUser) {
      setUnverifiedModalVisible(true);
      return;
    }
    if (isEvent) {
      // Events are served exclusively by the MySQL Event API. There is no
      // fallback to the old feed-based details page.
      if (!productDetails?.mysqlEventId) {
        Alert.alert(
          "Event unavailable",
          "This event was created on an older version of the app and can no longer be opened.",
        );
        return;
      }
      router.navigate(`/(shared)/event-details?eventId=${productDetails.mysqlEventId}`);
      return;
    }
    router.navigate(`/(shared)/${productDetails._id}?flow=deal&id=${productDetails._id}`);
  }, [isGuest, unverifiedUser, productDetails?._id, productDetails?.mysqlEventId, isEvent]);

  // Events with a photo use the immersive hero treatment (author + title drawn
  // over the image); without one they fall back to the plain card layout.
  const hasHeroImage = isEvent && !!productDetails?.images?.[0];

  // Same verification gate the CTA uses. Returns true when the action was
  // blocked, matching LikeButton's onBeforeLike contract.
  const handleGatedAction = useCallback(() => {
    if (isGuest) {
      setVerifySheetVisible(true);
      return true;
    }
    if (unverifiedUser) {
      setUnverifiedModalVisible(true);
      return true;
    }
    return false;
  }, [isGuest, unverifiedUser]);

  // Feed comments have no thread UI yet (see report) — the gate is all that
  // runs today, so verified users get no-op rather than a broken screen.
  const handleCommentPress = useCallback(() => {
    handleGatedAction();
  }, [handleGatedAction]);

  const handleShareLegacy = useCallback(async () => {
    if (!productDetails?.title) return;
    try {
      await Share.share({
        title: productDetails.title,
        message: [productDetails.title, productDetails?.description, "Shared via HomeConnect"]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      // Sheet dismissed.
    }
  }, [productDetails?.title, productDetails?.description]);

  const handleCloseSheet = useCallback(() => setVerifySheetVisible(false), []);
  const handleFormSubmit = useCallback(() => setVerifySheetVisible(false), []);
  const handleCloseUnverifiedModal = useCallback(() => setUnverifiedModalVisible(false), []);

  const handleRemovePost = useCallback(() => setConfirmDeleteVisible(true), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!productDetails?._id) {
      throw new Error("Product ID is missing");
    }
    // Simulate API call delay so the confirmation modal's loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [productDetails?._id]);

  const handleSuccessShown = useCallback(() => {
    if (productDetails?._id && !isEvent) {
      removeDeal(productDetails._id);
    }
  }, [productDetails?._id, isEvent, removeDeal]);

  const handleReportProduct = useCallback(() => {
    setReportType(isEvent ? "event" : "deal");
    setReportVisible(true);
  }, [isEvent]);

  const handleReportUser = useCallback(() => {
    setReportType("user");
    setReportVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => setReportVisible(false), []);

  // ---- Derived / formatted display values ----------------------------------------
  // Cheap field lookups consumed as plain strings below — no useMemo needed.
  const userInfo = {
    imageUri: productDetails?.user?.profilePhotoUrl || productDetails?.userId?.profilePhotoUrl,
    name: productDetails?.user?.fullName || productDetails?.userId?.fullName,
  };

  const capitalizedTitle = useMemo(
    () => capitalizeWords(productDetails?.title || ""),
    [productDetails?.title],
  );

  const truncatedDescription = useMemo(
    () => getTruncatedDescription(productDetails?.description || ""),
    [productDetails?.description],
  );

  const formattedPostTime = useMemo(
    () => formatPostTime(productDetails?.createdAt || ""),
    [productDetails?.createdAt],
  );

  // Compact "2h ago" timestamp used by the event header.
  const shortPostTime = useMemo(() => {
    const raw = productDetails?.createdAt;
    if (!raw) return "";
    const ms = Date.now() - new Date(raw).getTime();
    if (!Number.isFinite(ms) || ms < 0) return formattedPostTime;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }, [productDetails?.createdAt, formattedPostTime]);

  // Event date / time rendered as two separate "chips" in the metadata row.
  const eventDateLabel = useMemo(() => {
    const raw = productDetails?.eventDate;
    if (!raw) return "";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }, [productDetails?.eventDate]);

  const eventTimeLabel = useMemo(() => {
    const raw = productDetails?.eventTime;
    if (!raw) return "";
    const m = /^(\d{1,2}):(\d{2})/.exec(String(raw));
    if (!m) return String(raw);
    let h = Number(m[1]);
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m[2]} ${suffix}`;
  }, [productDetails?.eventTime]);

  const rsvpList: any[] = useMemo(
    () => (Array.isArray(productDetails?.rsvps) ? productDetails.rsvps : []),
    [productDetails?.rsvps],
  );
  const joinedCount = rsvpList.length;

  // Header subtitle: "Tower B • B-904 • 2h ago • 🌐" for events, a plain
  // "posted a deal · <time>" line for everything else. Never surface a raw
  // Mongo ObjectId as tower/flat if that field wasn't populated.
  const headerSubtitle = useMemo(() => {
    if (!isEvent) return `posted a deal · ${formattedPostTime}`;

    const isPublicEvent =
      productDetails?.visibility === "public" || productDetails?.isPublic === true;

    return [
      productDetails?.user?.tower ?? productDetails?.userId?.tower ?? productDetails?.towerName,
      productDetails?.user?.flatNo ?? productDetails?.userId?.flatNo ?? productDetails?.flatNo,
      shortPostTime,
      isPublicEvent ? "🌐" : null,
    ]
      .filter((part) => Boolean(part) && !/^[0-9a-fA-F]{24}$/.test(String(part)))
      .join(" • ");
  }, [isEvent, productDetails, shortPostTime]);

  const isVerifiedCreator =
    (productDetails?.user?.isAddressVerified?.status ??
      productDetails?.userId?.isAddressVerified?.status) === verificationStatus.APPROVED;

  const isSameUser =
    typeof productDetails.user === "string"
      ? currentUser?._id === productDetails.user
      : currentUser?._id === productDetails.user?._id;

  if (loading) {
    return <ProductCardSkeleton style={style} />;
  }

  // ---- Deal-only content: title/price row, description, order progress, CTA -----
  const renderDealBody = () => (
    <>
      {productDetails?.images?.[0] && (
        <Image
          source={{ uri: productDetails.images[0] }}
          style={[styles.dealImage, { backgroundColor: t.colors.surfaceAlt }]}
          resizeMode="cover"
        />
      )}

      {productDetails?.title && (
        <View style={styles.titleRow}>
          <View style={styles.titleColumn}>
            <View style={styles.titleTextRow}>
              <Text style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
                {capitalizedTitle}
              </Text>
              <StatusBadge status={productDetails?.dealStatus} />
            </View>
          </View>

          {productDetails.price && (
            <View style={styles.priceColumn}>
              <View style={styles.priceRow}>
                <Text style={styles.sellingPrice}>
                  {COMMON_CONSTANTS.CURRENCY}
                  {productDetails.price.sellingPrice}
                </Text>
                <Text style={styles.unitText}>
                  {" / "}
                  {productDetails.quantityUnit}
                </Text>
              </View>
              {productDetails.price.mrp && (
                <Text style={styles.mrpText}>
                  {COMMON_CONSTANTS.CURRENCY} {productDetails.price.mrp}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {productDetails.description && (
        <Text style={styles.dealDescription} numberOfLines={2} ellipsizeMode="tail">
          {truncatedDescription}
        </Text>
      )}

      {productDetails?.currentOrderedQty > -1 && (
        <View style={styles.dealProgressWrapper}>
          <OrderProgressBar
            current={productDetails.currentOrderedQty}
            total={productDetails.minimumOrderQty}
          />
          <Text style={styles.dealUnlockText}>
            {productDetails.currentOrderedQty} of {productDetails.minimumOrderQty} needed to unlock
            deal!
          </Text>
        </View>
      )}

      {productDetails?.title && (
        <View style={styles.dealActionsRow}>
          {Number(productDetails?.currentOrderedQty) > 0 ? (
            <View style={styles.joinedAvatarsRow}>
              {productDetails?.images?.slice(0, 3).map((img: any, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  style={[styles.joinedImage, idx > 0 && styles.avatarOverlap]}
                />
              ))}
              <Text style={styles.joinedText}>+ {productDetails.currentOrderedQty} joined</Text>
            </View>
          ) : (
            <Text style={styles.firstToJoinText}>Be the first to join this deal!</Text>
          )}

          <ActionButton
            title={productDetails.title ? "Join Deal" : "View Deal"}
            containerStyle={[styles.dealCtaButton, { backgroundColor: t.colors.primary }]}
            textStyle={styles.dealCtaButtonText}
            onPress={handleCtaPress}
          />

          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButtonSmall}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );

  // ---- Event-only content: image, title, description, metadata, progress, ------
  // ---- participants, deadline/price, Join Event CTA, social row ------------------
  const renderEventBody = () => (
    <>
      {productDetails?.title && !hasHeroImage && (
        <Text
          style={[styles.titleText, { color: t.colors.textPrimary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {capitalizedTitle}
        </Text>
      )}

      {productDetails.description && (
        <Text style={styles.eventDescription} numberOfLines={2} ellipsizeMode="tail">
          {truncatedDescription.replace(/\s*\n+\s*/g, " ")}
        </Text>
      )}

      {/* Date • Time • Location — one horizontal metadata row */}
      {!!(eventDateLabel || eventTimeLabel || productDetails?.location) && (
        <View style={styles.metaRow}>
          {!!eventDateLabel && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" style={styles.metaIcon} />
              <Text style={styles.metaText}>{eventDateLabel}</Text>
            </View>
          )}
          {!!eventTimeLabel && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" style={styles.metaIcon} />
              <Text style={styles.metaText}>{eventTimeLabel}</Text>
            </View>
          )}
          {!!productDetails?.location && (
            <View style={styles.metaItemLast}>
              <Ionicons name="location-outline" size={14} color="#6B7280" style={styles.metaIcon} />
              <Text style={styles.metaText} numberOfLines={1}>
                {productDetails.location}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Event type (left) / participant limit (right) — fixed two-column row so
          the right column stays pinned even when the left has no data. */}
      {(productDetails?.eventType || productDetails?.category || productDetails?.maxParticipants) && (
        <View style={styles.infoRow}>
          <View style={[styles.infoColumn, { paddingRight: 8 }]}>
            {(productDetails?.eventType || productDetails?.category) && (
              <>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="people-outline" size={14} color="#9CA3AF" style={styles.infoLabelIcon} />
                  <Text style={styles.infoLabelText}>Event type</Text>
                </View>
                <Text style={styles.infoValueText}>
                  {capitalizeWords(String(productDetails.eventType || productDetails.category))}
                </Text>
              </>
            )}
          </View>

          {!!productDetails?.maxParticipants && (
            <View style={[styles.infoColumn, { paddingLeft: 8 }]}>
              <View style={styles.infoLabelRow}>
                <Ionicons name="people-circle-outline" size={14} color="#9CA3AF" style={styles.infoLabelIcon} />
                <Text style={styles.infoValueText}>
                  {productDetails?.minParticipants ? `${productDetails.minParticipants} min • ` : ""}
                  {productDetails.maxParticipants} max
                </Text>
              </View>
              <Text style={styles.infoLabelText}>participants</Text>
            </View>
          )}
        </View>
      )}

      {/* Spots-filled progress: "N of M spots filled" + "K more needed to unlock" */}
      {Number(productDetails?.maxParticipants) > 0 && (
        <View style={styles.progressWrapper}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressCountText}>
              {joinedCount} of {productDetails.maxParticipants} spots filled
            </Text>
            {Number(productDetails?.minParticipants) > joinedCount && (
              <Text style={styles.progressHintText}>
                {Number(productDetails.minParticipants) - joinedCount} more needed to unlock event
              </Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(0, (joinedCount / Number(productDetails.maxParticipants)) * 100),
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Participant preview: overlapping avatars + "X, Y and N others are attending" */}
      {joinedCount > 0 && (
        <View style={styles.attendeesRow}>
          <View style={styles.avatarStack}>
            {rsvpList.slice(0, 2).map((rsvp: any, idx: number) => (
              <Image
                key={idx}
                source={{ uri: rsvp?.profilePhotoUrl }}
                style={[styles.avatarImage, idx > 0 && styles.avatarOverlap]}
              />
            ))}
            {joinedCount > 2 && (
              <View style={[styles.avatarMoreBubble, styles.avatarOverlap]}>
                <Text style={styles.avatarMoreText}>+{joinedCount - 2}</Text>
              </View>
            )}
          </View>

          <Text style={styles.attendeesText} numberOfLines={2}>
            {rsvpList.slice(0, 2).map((r: any) => r?.fullName).filter(Boolean).join(", ")}
            {joinedCount > 2 ? ` and ${joinedCount - 2} neighbours are attending.` : " are attending."}
          </Text>

          <TouchableOpacity onPress={handleCtaPress} style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: t.colors.primary }]}>See all</Text>
            <Ionicons name="chevron-forward" size={13} color={t.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Registration deadline + participation fee, side by side */}
      {(productDetails?.regDeadline || productDetails?.price) && (
        <View style={styles.infoBoxRow}>
          {productDetails?.regDeadline && (
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.infoBoxText} numberOfLines={2}>
                {formatRegistrationDeadline(productDetails.regDeadline)}
              </Text>
            </View>
          )}
          {productDetails?.price && (
            <View style={styles.infoBox}>
              <Ionicons name="cash-outline" size={16} color="#6B7280" />
              <Text style={styles.infoBoxText}>
                {COMMON_CONSTANTS.CURRENCY}
                {productDetails.price} per participant
              </Text>
            </View>
          )}
        </View>
      )}

      {productDetails?.title && (
        <View style={styles.joinEventWrapper}>
          <ActionButton
            title="Join Event"
            containerStyle={[styles.joinEventButton, { backgroundColor: t.colors.brand }]}
            textStyle={[styles.joinEventButtonText, { color: t.colors.onBrand }]}
            onPress={handleCtaPress}
            rightIconName="arrow-forward"
          />
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButtonLarge}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <LikeButton feedId={productDetails?._id ?? ""} likes={productDetails?.likes} size={18} showCount={false} onBeforeLike={handleGatedAction} />
            <TouchableOpacity onPress={handleCommentPress} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="chatbubble-outline" size={18} color={t.colors.textSecondary} />
              <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>{productDetails?.comments?.length ?? 0}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShareLegacy} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="share-social-outline" size={18} color={t.colors.textSecondary} />
            <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>Share</Text>
          </TouchableOpacity>
        </View>
    </>
  );

  const cardHeader = (
    <ImageTitleHeader
      imageUri={userInfo.imageUri}
      title={userInfo.name || COMMON_CONSTANTS.ANONYMOUS_USER}
      isSameUser={isSameUser}
      badge={isEvent ? "EVENT" : undefined}
      verified={isVerifiedCreator}
      subtitle={headerSubtitle}
      imageSize={40}
      variant={hasHeroImage ? "onImage" : "default"}
      showOptionsMenu={true}
      onRemovePost={handleRemovePost}
      onReportPost={handleReportProduct}
      onReportUser={handleReportUser}
    />
  );

  return (
    <Card
      style={[
        style,
        styles.mainContentWrapper,
        hasHeroImage && styles.heroCardWrapper,
      ]}
    >
      {hasHeroImage ? (
        // Immersive hero: author overlays the top of the photo, title the bottom.
        <View style={[styles.hero, { backgroundColor: t.colors.surfaceAlt }]}>
          <Image
            source={{ uri: productDetails.images[0] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroTop}>{cardHeader}</View>
          <View style={styles.heroTitleWrapper} pointerEvents="none">
            <Text style={styles.heroTitleText} numberOfLines={2} ellipsizeMode="tail">
              {capitalizedTitle}
            </Text>
            {!!(productDetails?.eventType || productDetails?.category) && (
              <View style={styles.heroCategoryPill}>
                <Text style={styles.heroCategoryText}>
                  {capitalizeWords(
                    String(productDetails.eventType || productDetails.category),
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.headerWrapper}>{cardHeader}</View>
      )}

      <View style={[styles.contentWrapper, hasHeroImage && styles.heroContentWrapper]}>
        {isEvent ? renderEventBody() : renderDealBody()}
      </View>

      {verifySheetVisible && (
        <VerificationSheet
          visible={verifySheetVisible}
          onClose={handleCloseSheet}
          onCompleted={handleFormSubmit}
        />
      )}

      {unverifiedModalVisible && (
        <FormSheetModal
          visible={unverifiedModalVisible}
          onClose={handleCloseUnverifiedModal}
          title="Verification Pending"
          subtitle="Please wait for admin approval"
        >
          <View style={styles.unverifiedModalBody}>
            <Text style={[t.typography.body, styles.unverifiedModalText, { color: t.colors.textSecondary }]}>
              Your account is currently under review by the admin. You&apos;ll be able to join deals
              and events once your verification is approved.
            </Text>
            <ActionButton
              title="Got it"
              onPress={handleCloseUnverifiedModal}
              containerStyle={[styles.gotItButton, { backgroundColor: t.colors.primary }]}
              textStyle={[t.typography.button1, { color: "#fff" }]}
            />
          </View>
        </FormSheetModal>
      )}

      <ConfirmationModal
        visible={confirmDeleteVisible}
        onClose={() => setConfirmDeleteVisible(false)}
        onConfirm={handleConfirmDelete}
        onSuccessShown={handleSuccessShown}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        successTitle="Post Deleted!"
        successMessage="Your post has been successfully removed from the feed."
        autoCloseDelay={1500}
      />

      <ReportModal
        visible={reportVisible}
        onClose={handleCloseReportModal}
        reportType={reportType || (isEvent ? "event" : "deal")}
        itemId={
          reportType === "user"
            ? typeof productDetails?.user === "string"
              ? productDetails.user
              : productDetails?.user?._id || productDetails?.userId?._id || ""
            : productDetails?._id || ""
        }
        itemName={
          reportType === "user"
            ? typeof productDetails?.user === "object"
              ? productDetails.user?.fullName || "User"
              : productDetails?.userId?.fullName || "User"
            : productDetails?.title?.substring(0, 50) || (isEvent ? "Event" : "Product")
        }
      />
    </Card>
  );
}

// "Registration closes in 3h" / "in 2d" / "soon" / "closed", derived from the
// event's regDeadline timestamp.
function formatRegistrationDeadline(regDeadline: string | Date): string {
  const diffMs = new Date(regDeadline).getTime() - Date.now();
  if (diffMs <= 0) return "Registration closed";
  const hrs = Math.round(diffMs / (1000 * 60 * 60));
  if (hrs < 1) return "Registration closes soon";
  if (hrs < 24) return `Registration closes in ${hrs}h`;
  return `Registration closes in ${Math.round(hrs / 24)}d`;
}

// Skeleton placeholder shown while a card's data is still loading.
function ProductCardSkeleton({ style }: { style?: any }) {
  return (
    <Card style={[style]}>
      <View style={styles.skeletonHeaderRow}>
        <Skeleton width={44} height={44} borderRadius={22} style={styles.skeletonAvatarSpacer} />
        <View style={styles.skeletonTextColumn}>
          <Skeleton width={120} height={16} style={styles.skeletonNameSpacer} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={180} borderRadius={12} style={styles.skeletonImage} />
      <View style={styles.skeletonTitleRow}>
        <Skeleton width="60%" height={18} />
        <Skeleton width={80} height={24} borderRadius={8} />
      </View>
      <Skeleton width="80%" height={16} style={styles.skeletonDescSpacer} />
      <View style={styles.skeletonFooterRow}>
        <Skeleton width={60} height={16} />
        <Skeleton width={100} height={32} borderRadius={8} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  mainContentWrapper: {
    overflow: 'hidden',
    elevation: 0,
    // Reference uses rounded-xl (12px), not the shared Card's 16.
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#5f5f5f19'
  },
  // A hero card draws its photo edge-to-edge, so the padding moves inside.
  heroCardWrapper: { padding: 0 },
  contentWrapper: { marginTop: 10 },
  heroContentWrapper: { marginTop: 0, padding: 16 },
  headerWrapper: { zIndex: 111 },

  // Immersive event hero — reference is h-64 on a ~390pt screen (~1.5:1).
  hero: { width: "100%", aspectRatio: 1.5, justifyContent: "space-between" },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroTop: { padding: 14 },

  // Images
  dealImage: {
    width: "100%",
    aspectRatio: 2,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    maxHeight: 290,
  },

  heroTitleWrapper: { paddingHorizontal: 16, paddingBottom: 16 },
  heroTitleText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  heroCategoryPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroCategoryText: { color: "#19212d", fontSize: 10, fontWeight: "700" },

  // Title / price (deal header row)
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  titleColumn: { flex: 1 },
  titleTextRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  titleText: { fontWeight: "600", fontSize: 20, color: "#19212d",paddingBottom: 5 },
  priceColumn: { flexDirection: "column", alignItems: "flex-end", flexShrink: 0 },
  priceRow: { flexDirection: "row", alignItems: "baseline" },
  sellingPrice: { color: "#15803D", fontWeight: "700", fontSize: 24, lineHeight: 32 },
  unitText: { color: "#6B7280", fontSize: 14, fontWeight: "500", marginLeft: 4 },
  mrpText: { color: "#6B7280", fontSize: 14, textDecorationLine: "line-through" },

  // Descriptions
  dealDescription: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  eventDescription: { fontSize: 14, color: "#414141", lineHeight: 20, marginBottom: 8 },

  // Date / time / location metadata row (events)
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", rowGap: 4, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  metaItemLast: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  metaIcon: { marginRight: 5 },
  metaText: { fontSize: 12.5, color: "#374151" },

  // Event type / participant-limit two-column row
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  infoColumn: { flex: 1 },
  infoLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  infoLabelIcon: { marginRight: 5 },
  infoLabelText: { fontSize: 11.5, color: "#9CA3AF" },
  infoValueText: { fontSize: 13, color: "#374151", fontWeight: "600" },

  // Spots-filled progress bar
  progressWrapper: { marginBottom: 10 },
  progressHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressCountText: { fontSize: 13.5, fontWeight: "700", color: "#15803D" },
  progressHintText: { fontSize: 11.5, color: "#6B7280", flexShrink: 1, textAlign: "right" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#15803D" },

  // Participant / joined-users avatar stacks (shared by event + deal)
  attendeesRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#E5E7EB",
  },
  avatarOverlap: { marginLeft: -9 },
  avatarMoreBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: { fontSize: 10, fontWeight: "700", color: "#4B5563" },
  attendeesText: { fontSize: 12, color: "#6B7280", marginLeft: 8, flex: 1 },
  seeAllButton: { flexDirection: "row", alignItems: "center", paddingLeft: 6 },
  seeAllText: { fontSize: 12, fontWeight: "600" },

  // Registration deadline / price boxes
  infoBoxRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  infoBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  infoBoxText: { fontSize: 12, color: "#374151", flexShrink: 1 },

  // Deal-only order progress + CTA row
  dealProgressWrapper: { marginTop: 4 },
  dealUnlockText: { color: "#888", fontSize: 12 },
  dealActionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  joinedAvatarsRow: { flexDirection: "row", alignItems: "center" },
  joinedImage: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#fff" },
  joinedText: { color: "#6B7280", fontSize: 14, paddingLeft: 8 },
  firstToJoinText: { color: "#6B7280", fontSize: 14, fontWeight: "500" },
  dealCtaButton: { borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 16 },
  dealCtaButtonText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  deleteButtonSmall: {
    backgroundColor: "#EF4444",
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonLarge: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: "#EF4444",
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  // Join Event CTA + social row
  joinEventWrapper: { marginTop: 8 },
  joinEventButton: { borderRadius: 12, paddingVertical: 14, width: "100%", justifyContent: "center" },
  joinEventButtonText: { fontSize: 15, fontWeight: "700" },

  // Deal status pill
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: "600" },

  // Unverified-user modal
  unverifiedModalBody: { paddingVertical: 20, paddingHorizontal: 16 },
  unverifiedModalText: { marginBottom: 16, textAlign: "center" },
  gotItButton: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center" },

  // Loading skeleton
  skeletonHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  skeletonAvatarSpacer: { marginRight: 12 },
  skeletonTextColumn: { flex: 1 },
  skeletonNameSpacer: { marginBottom: 6 },
  skeletonImage: { marginBottom: 10, marginTop: 12 },
  skeletonTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  skeletonDescSpacer: { marginBottom: 12 },
  skeletonFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
});

// Memoize to prevent unnecessary re-renders when relevant product fields are unchanged
export default memo(ProductCard, (prev, next) => {
  if (
    prev.productDetails === next.productDetails &&
    prev.type === next.type &&
    prev.style === next.style
  ) {
    return true;
  }

  const a = prev.productDetails || {};
  const b = next.productDetails || {};

  return (
    a._id === b._id &&
    a.title === b.title &&
    a.description === b.description &&
    a.createdAt === b.createdAt &&
    a?.price?.sellingPrice === b?.price?.sellingPrice &&
    a?.price?.mrp === b?.price?.mrp &&
    a?.images?.[0] === b?.images?.[0] &&
    prev.style === next.style &&
    prev.type === next.type
  );
});
