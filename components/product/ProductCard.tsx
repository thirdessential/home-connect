import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { usePermissions } from "@/hooks/usePermissions";
import { formatEventDateTime, formatPostTime } from "@/lib/dateTime";
import { capitalizeWords, getTruncatedDescription } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import VerificationSheet from "../common/VerificationSheet";
import ActionButton from "../inputs/ActionButton";
import ConfirmationModal from "../modals/ConfirmationModal";
import FormSheetModal from "../modals/FormSheetModal";
import ReportModal from "../modals/ReportModal";
import { Card } from "../UI/Card";
import ImageTitleHeader from "../UI/ImageTitleHeader";
import OrderProgressBar from "../UI/OrderProgress";
import Skeleton from "../UI/Skeleton";

function ProductCard({
  productDetails,
  style,
  type,
  loading = false,
  onDelete,
}: {
  productDetails?: any;
  style?: any;
  type?: string;
  loading?: boolean;
  onDelete?: () => Promise<void>;
}) {
  const t = useTheme();
  const { hasRole } = usePermissions();
  const isGuest = hasRole(UserRole.GUEST);
  const currentUser = useUserStore((state) => state.user);
  const removeDeal = useWholesaleDealStore((state) => state.removeDeal);
  const unverifiedUser =
    !isGuest &&
    !hasRole(UserRole.ADMIN) &&
    currentUser?.isAddressVerified?.status !== verificationStatus.APPROVED;
  const [verifySheetVisible, setVerifySheetVisible] = useState(false);
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<
    "deal" | "event" | "user" | null
  >(null);

  const handleCtaPress = useCallback(() => {
    if (isGuest) {
      setVerifySheetVisible(true);
      return;
    }
    if (unverifiedUser) {
      setUnverifiedModalVisible(true);
      return;
    }
    router.navigate(
      `/(shared)/${productDetails._id}?flow=${type === "event" ? "event" : "deal"
      }&id=${productDetails._id}`,
    );
  }, [isGuest, unverifiedUser, productDetails?._id, type]);

  const handleCloseSheet = useCallback(() => {
    setVerifySheetVisible(false);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setVerifySheetVisible(false);
  }, []);

  const handleCloseUnverifiedModal = useCallback(() => {
    setUnverifiedModalVisible(false);
  }, []);

  // Memoized computed values to prevent expensive recalculations
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

  const handleRemovePost = useCallback(() => {
    // Show confirmation modal first
    setConfirmDeleteVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const productId = productDetails?._id;
    if (!productId) {
      throw new Error("Product ID is missing");
    }

    // Simulate API call delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, [productDetails?._id]);

  const handleSuccessShown = useCallback(() => {
    const productId = productDetails?._id;
    if (productId && type !== "event") {
      removeDeal(productId);
    }
  }, [productDetails?._id, type, removeDeal]);

  const handleReportProduct = useCallback(() => {
    setReportType(type === "event" ? "event" : "deal");
    setReportVisible(true);
  }, [type]);

  const handleReportUser = useCallback(() => {
    setReportType("user");
    setReportVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setReportVisible(false);
  }, []);

  const userInfo = useMemo(
    () => ({
      imageUri:
        productDetails?.user?.profilePhotoUrl ||
        productDetails?.userId?.profilePhotoUrl,
      name: productDetails?.user?.fullName || productDetails?.userId?.fullName,
    }),
    [
      productDetails?.user?.profilePhotoUrl,
      productDetails?.userId?.profilePhotoUrl,
      productDetails?.user?.fullName,
      productDetails?.userId?.fullName,
    ],
  );


  const displayDealStatus = useMemo(() => {
    if (type === "event") return null;


    const DealStatus = productDetails?.dealStatus
    return DealStatus

  }, [
    type,
    productDetails?.dealStatus,
  ]);


  if (loading) {
    // Skeleton UI for loading state
    return (
      <Card style={[style]}>
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
          style={{ marginBottom: 10, marginTop: 12 }}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Skeleton width="60%" height={18} />
          <Skeleton width={80} height={24} borderRadius={8} />
        </View>
        <Skeleton width="80%" height={16} style={{ marginBottom: 12 }} />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Skeleton width={60} height={16} />
          <Skeleton width={100} height={32} borderRadius={8} />
        </View>
      </Card>
    );
  }


  const StatusBedge = ({ status }: { status: string }) => {

    // let capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const capitalizedStatus = status
      .split("_")
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");


    const getStatusStyle = () => {
      switch (status?.toUpperCase()) {
        case "ACTIVE":
          return {
            backgroundColor: "#DCFCE7",
            textColor: "#15803D",
          };

        case "PENDING":
          return {
            backgroundColor: "#FEF3C7",
            textColor: "#B45309",
          };

        case "APPROVED":
          return {
            backgroundColor: "#DBEAFE",
            textColor: "#1D4ED8",
          };

        case "REJECTED":
        case "FAILED":
          return {
            backgroundColor: "#FEE2E2",
            textColor: "#DC2626",
          };

        case "FULL":
          return {
            backgroundColor: "#E5E7EB",
            textColor: "#4B5563",
          };

        default:
          return {
            backgroundColor: "#F3F4F6",
            textColor: "#374151",
          };
      }
    };

    const { backgroundColor, textColor } = getStatusStyle();

    return (
      <View style={[{
        backgroundColor,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
      }]}>
        <Text style={[{
          color: textColor, fontSize: 12,
          fontWeight: "600",
        }]}>
          {capitalizedStatus}
        </Text>
      </View>
    );
  }


  return (
    <Card style={[style]}>
      {/* User Header */}
      <ImageTitleHeader
        imageUri={userInfo.imageUri}
        title={userInfo.name || COMMON_CONSTANTS.ANONYMOUS_USER}
        isSameUser={
          typeof productDetails.user === "string"
            ? currentUser?._id === productDetails.user
            : currentUser?._id === productDetails.user?._id
        }
        subtitle={`posted a deal · ${formattedPostTime}`}
        imageSize={44}
        showOptionsMenu={true}
        onRemovePost={handleRemovePost}
        onReportPost={handleReportProduct}
        onReportUser={handleReportUser}
      />

      
      {/* Main Content Wrapper */}
      <View style={{ marginTop: 12 }}>
        {/* Image */}
        {productDetails?.images?.[0] && (
          <Image
            source={{ uri: productDetails.images[0] }}
            style={{
              width: "100%",
              aspectRatio: 2,
              borderRadius: 12,
              marginBottom: 10,
              backgroundColor: t.colors.surfaceAlt,
              overflow: "hidden",
              maxHeight: 290,
            }}
            resizeMode="cover"
          />
        )}
        {/* Title & Price */}
        {productDetails?.title && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {/* <View style={{flexDirection: 'row'}}> */}
            <View
              style={{
                flex: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 16,
                    color: "#1F2937",
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {capitalizedTitle}
                </Text>

                {type !== "event" && (
                  <StatusBedge status={productDetails?.dealStatus} />
                )}
              </View>
            </View>
            
            {/* </View> */}
            {productDetails.price && type !== "event" && (
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "flex-end",
                  flexShrink: 0,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text
                    style={{
                      color: "#EA580C",
                      fontWeight: "700",
                      fontSize: 24,
                      lineHeight: 32,
                    }}
                  >
                    {COMMON_CONSTANTS.CURRENCY}
                    {productDetails.price.sellingPrice}
                  </Text>
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 14,
                      fontWeight: "500",
                      marginLeft: 4,
                    }}
                  >
                    {" / "}
                    {productDetails.quantityUnit}
                  </Text>
                </View>
                {productDetails.price.mrp && (
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 14,
                      textDecorationLine: "line-through",
                    }}
                  >
                    {COMMON_CONSTANTS.CURRENCY} {productDetails.price.mrp}
                  </Text>
                )}
              </View>
            )}
            {productDetails.price && type === "event" && (
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...t.typography.h3,
                    color: "#EA580C",
                    fontSize: 24,
                  }}
                >
                  {productDetails.price}
                </Text>
                <Text style={{ ...t.typography.text, marginLeft: 2 }}>
                  {" / "}
                  {"person"}
                </Text>
              </View>
            )}
          </View>
        )}
        {/* Description */}
        {productDetails.description && type !== "event" && (
          <Text
            style={{
              fontSize: 14,
              color: "#4B5563",
              lineHeight: 20,
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {truncatedDescription}
          </Text>
        )}
        {productDetails.description && type === "event" && (
          <View
            style={{
              display: "flex",
              gap: 8,
              flexDirection: "row",
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <Ionicons
              name={"calendar-outline"}
              size={20}
              color={"#6B7280"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                ...t.typography.text,
                color: "#444",
                marginBottom: 8,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {formatEventDateTime(
                productDetails?.eventDate,
                productDetails?.eventTime,
              )}
            </Text>
          </View>
        )}
        {/* Order Progress */}
        {productDetails?.currentOrderedQty > -1 && (
          <View style={{ marginTop: 4 }}>
            <OrderProgressBar
              current={productDetails.currentOrderedQty}
              total={productDetails.minimumOrderQty}
            />
            <Text style={{ color: "#888", fontSize: 12 }}>
              {productDetails.currentOrderedQty} of{" "}
              {productDetails.minimumOrderQty} needed to unlock deal!
            </Text>
          </View>
        )}

        {/* Status + Action */}
        {productDetails?.title && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            {/* Left status label */}
            {type === "event" ? (
              (productDetails?.rsvps?.length ?? 0) > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* Avatars */}
                  {productDetails?.rsvps
                    ?.slice(0, 3)
                    .map((item: any, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: item.profilePhotoUrl }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: "#fff",
                          marginLeft: idx === 0 ? 0 : -8,
                        }}
                      />
                    ))}
                  {Number(productDetails?.rsvps?.length) > 0 && (
                    <Text
                      style={{ color: "#6B7280", fontSize: 14, paddingLeft: 8 }}
                    >
                      + {productDetails.rsvps.length} joined
                    </Text>
                  )}
                </View>
              ) : (
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Be the first to join this event!
                </Text>
              )
            ) : null}
            {/* Social Actions */}
            {type !== "event" ? (
              Number(productDetails?.currentOrderedQty) > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* Avatars */}
                  {productDetails?.images
                    ?.slice(0, 3)
                    .map((img: any, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: "#fff",
                          marginLeft: idx === 0 ? 0 : -8,
                        }}
                      />
                    ))}
                  {Number(productDetails?.currentOrderedQty) > 0 && (
                    <Text
                      style={{ color: "#6B7280", fontSize: 14, paddingLeft: 8 }}
                    >
                      + {productDetails.currentOrderedQty} joined
                    </Text>
                  )}
                </View>
              ) : (
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Be the first to join this deal!
                </Text>
              )
            ) : null}

            {/* Right CTA */}
            <ActionButton
              title={
                type !== "event"
                  ? productDetails.title
                    ? "Join Deal"
                    : "View Deal"
                  : "Register"
              }
              containerStyle={{
                backgroundColor: t.colors.primary,
                borderRadius: 9999,
                paddingVertical: 8,
                paddingHorizontal: 16,
              }}
              textStyle={{ fontSize: 14, fontWeight: "600", color: "#fff" }}
              onPress={handleCtaPress}
            />
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={{
                  backgroundColor: "#EF4444",
                  borderRadius: 50,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginLeft: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Verification Sheet for Guest Users - only render when needed */}
      {verifySheetVisible && (
        <VerificationSheet
          visible={verifySheetVisible}
          onClose={handleCloseSheet}
          onCompleted={() => {
            handleFormSubmit();
          }}
        />
      )}

      {/* Unverified User Modal - only render when needed */}
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
              be able to join deals and events once your verification is
              approved.
            </Text>
            <ActionButton
              title="Got it"
              onPress={handleCloseUnverifiedModal}
              containerStyle={{
                backgroundColor: t.colors.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: "center",
              }}
              textStyle={{ ...t.typography.button1, color: "#fff" }}
            />
          </View>
        </FormSheetModal>
      )}

      {/* Delete Confirmation Modal */}
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
        reportType={reportType || (type === "event" ? "event" : "deal")}
        itemId={
          reportType === "user"
            ? productDetails?.user && typeof productDetails.user === "string"
              ? productDetails.user
              : productDetails?.user?._id || productDetails?.userId?._id || ""
            : productDetails?._id || ""
        }
        itemName={
          reportType === "user"
            ? productDetails?.user && typeof productDetails.user === "object"
              ? productDetails.user.fullName || "User"
              : productDetails?.userId?.fullName || "User"
            : productDetails?.title?.substring(0, 50) ||
            (type === "event" ? "Event" : "Product")
        }
      />
    </Card>
  );
}

// Memoize to prevent unnecessary re-renders when relevant product fields are unchanged
export default memo(ProductCard, (prev, next) => {
  // Quick reference check first - if objects are the same, no need for deep comparison
  if (
    prev.productDetails === next.productDetails &&
    prev.type === next.type &&
    prev.style === next.style
  ) {
    return true;
  }

  const a = prev.productDetails || {};
  const b = next.productDetails || {};

  // Essential fields comparison for performance
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

// Render a reusable VerificationSheet when guest tries CTA
// Placed outside memo comparator to avoid interfering; actual rendering is inside ProductCard Card via state
