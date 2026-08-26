import { verificationStatus } from "@/assets/enums/common.enum";
import { usePermissions } from "@/hooks/usePermissions";
import { formatPostTime } from "@/lib/dateTime";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  ImageStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import VerificationSheet from "../common/VerificationSheet";
import LikeButton from "../inputs/LikeButton";
import ConfirmationModal from "../modals/ConfirmationModal";
import FormSheetModal from "../modals/FormSheetModal";
import ReportModal from "../modals/ReportModal";
import { Card } from "./Card";
import ImageTitleHeader from "./ImageTitleHeader";
import Skeleton from "./Skeleton";

interface PostProps {
  postData: any;
}

// Content past this length gets truncated behind "See more".
const CONTENT_PREVIEW_LIMIT = 110;

const PostCard = React.memo(function PostCard({
  postData,
  loading = false,
}: PostProps & { loading?: boolean }) {
  const t = useTheme();
  const { width: winWidth } = useWindowDimensions();
  const removeFeed = useFeedsStore((state) => state.removeFeed);
  const [verifySheetVisible, setVerifySheetVisible] = React.useState(false);
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<"post" | "user" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(winWidth);
  const currentUser = useUserStore((state) => state.user);
  const { hasRole } = usePermissions();
  const isGuest = hasRole(UserRole.GUEST);
  const unverifiedUser =
    !isGuest &&
    !hasRole(UserRole.ADMIN) &&
    currentUser?.isAddressVerified?.status !== verificationStatus.APPROVED;
  // The poster's identity is verified but withheld from this viewer until
  // they themselves are verified.
  const locked = isGuest || unverifiedUser;

  const images: string[] = React.useMemo(
    () => (Array.isArray(postData?.images) ? postData.images.filter(Boolean) : []),
    [postData?.images],
  );

  const displayName = locked
    ? "Verified Resident"
    : postData?.user?.fullName || "Resident";
  const displayAvatar = locked ? undefined : postData?.user?.profilePhotoUrl;

  const subtitle = React.useMemo(() => {
    const time = formatPostTime(postData?.createdAt);
    if (locked) return `${time} • ${images.length ? "Photo" : "Update"}`;
    const location = [postData?.towerName, postData?.flatNo]
      .filter(Boolean)
      .join(", ");
    return location ? `${time} • ${location}` : time;
  }, [postData?.createdAt, postData?.towerName, postData?.flatNo, images.length, locked]);

  const contentText: string = postData?.content || "";
  const isLongContent = contentText.length > CONTENT_PREVIEW_LIMIT;
  const visibleContent =
    !expanded && isLongContent
      ? `${contentText.slice(0, CONTENT_PREVIEW_LIMIT).trimEnd()}… `
      : contentText;

  const imageStyle = React.useMemo<ImageStyle>(
    () => ({
      width: carouselWidth,
      height: carouselWidth * 0.62,
      backgroundColor: t.colors.surfaceAlt,
    }),
    [carouselWidth, t.colors.surfaceAlt],
  );

  const contentStyle = React.useMemo(
    () => ({
      fontSize: 15.5,
      lineHeight: 24,
      color: t.colors.textPrimary,
      paddingTop: 10,
      marginBottom: 0,
    }),
    [t.colors.textPrimary],
  );

  const titleStyle = React.useMemo(
    () => ({
      fontSize: 16,
      fontWeight: "700" as const,
      color: t.colors.textPrimary,
      marginTop: images.length ? 12 : 8,
    }),
    [t.colors.textPrimary, images.length],
  );

  // Gate for interactions that require verification. Returns true to signal
  // the caller (e.g. LikeButton's onBeforeLike) that the action was prevented.
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

  const handleCommentPress = useCallback(() => {
    handleGatedAction();
  }, [handleGatedAction]);

  const handleCloseSheet = useCallback(() => {
    setVerifySheetVisible(false);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setVerifySheetVisible(false);
  }, []);

  const handleCloseUnverifiedModal = useCallback(() => {
    setUnverifiedModalVisible(false);
  }, []);

  const handleReportPost = useCallback(() => {
    setReportType("post");
    setReportVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setReportVisible(false);
  }, []);

  const handleRemovePost = useCallback(() => {
    setConfirmDeleteVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const feedId = postData?._id;
    if (!feedId) {
      throw new Error("Feed ID is missing");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [postData?._id]);

  const handleSuccessShown = useCallback(() => {
    const feedId = postData?._id;
    if (feedId) {
      removeFeed(feedId);
    }
  }, [removeFeed, postData?._id]);

  const handleReportUser = useCallback(() => {
    setReportType("user");
    setReportVisible(true);
  }, []);

  const handleShare = useCallback(async () => {
    const body = postData?.title || postData?.content;
    if (!body) return;
    try {
      await Share.share({
        title: postData?.title || "Post from HomeConnect",
        message: [postData?.title, postData?.content, "Shared via HomeConnect"]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      // Sheet dismissed or unavailable.
    }
  }, [postData?.title, postData?.content]);

  // Cards render at the reference's rounded-xl (12), not the shared Card's 16.
  const cardStyle = { padding: 0, overflow: "hidden" as const, borderRadius: 12 };

  const handleImageScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / (carouselWidth || winWidth));
      if (i !== imageIndex) setImageIndex(i);
    },
    [carouselWidth, imageIndex, winWidth],
  );

  if (loading) {
    return (
      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Skeleton
            width={44}
            height={44}
            borderRadius={22}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        <Skeleton
          width="100%"
          height={180}
          borderRadius={12}
          style={{ marginBottom: 10 }}
        />
        <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
          }}
        >
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
      </Card>
    );
  }

  return (
    <Card key={postData?.id} style={cardStyle}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ImageTitleHeader
          imageUri={displayAvatar}
          title={displayName}
          subtitle={subtitle}
          verified={locked}
          isSameUser={currentUser?._id === postData?.user?._id}
          imageSize={44}
          showOptionsMenu
          onReportPost={handleReportPost}
          onReportUser={handleReportUser}
          onShare={handleShare}
          onRemovePost={handleRemovePost}
        />
      </View>

      {images.length > 0 && (
        <View
          style={{ marginTop: 12 }}
          onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width || winWidth)}
        >
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            onMomentumScrollEnd={handleImageScrollEnd}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={imageStyle} resizeMode="cover" />
            )}
            getItemLayout={(_, i) => ({
              length: carouselWidth,
              offset: carouselWidth * i,
              index: i,
            })}
          />
          {images.length > 1 && (
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                {imageIndex + 1}/{images.length}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {postData?.title ? <Text style={titleStyle}>{postData.title}</Text> : null}

        {contentText ? (
          <Text style={contentStyle}>
            {visibleContent}
            {!expanded && isLongContent && (
              <Text
                onPress={() => setExpanded(true)}
                style={{ color: t.colors.primary, fontWeight: "600" }}
              >
                See more
              </Text>
            )}
          </Text>
        ) : null}

        {locked && (
          <TouchableOpacity
            onPress={handleGatedAction}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FDEDE1",
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginTop: 12,
              gap: 8,
            }}
          >
            <Ionicons name="lock-closed" size={14} color="#B45309" />
            <Text style={{ flex: 1, fontSize: 13, color: "#92400E", fontWeight: "500" }}>
              Verify to see who posted this and join the conversation.
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <LikeButton feedId={postData?._id || postData?.id} likes={postData?.likes} size={18} showCount={false} onBeforeLike={handleGatedAction} />
            <TouchableOpacity onPress={handleCommentPress} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="chatbubble-outline" size={18} color={t.colors.textSecondary} />
              <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>{postData?.comments?.length || 0}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShare} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="share-social-outline" size={18} color={t.colors.textSecondary} />
            <Text style={{ color: t.colors.textSecondary, fontSize: 13 }}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {verifySheetVisible && (
        <VerificationSheet
          visible={verifySheetVisible}
          onClose={handleCloseSheet}
          onCompleted={() => {
            handleFormSubmit();
          }}
        />
      )}

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
              Your account is currently under review by the admin. You&apos;ll
              be able to like and comment once your verification is approved.
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
              <Text style={{ ...t.typography.button1, color: "#fff" }}>
                Got it
              </Text>
            </TouchableOpacity>
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
        reportType={reportType || "post"}
        itemId={
          reportType === "user"
            ? postData?.user?._id || ""
            : postData?._id || ""
        }
        itemName={
          reportType === "user"
            ? postData?.user?.fullName || "User"
            : postData?.content?.substring(0, 50) || "Post"
        }
      />
    </Card>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
