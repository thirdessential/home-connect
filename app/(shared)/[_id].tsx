import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { DEALS_OPTIONS } from "@/assets/mocks/category";
import ReportButton from "@/components/common/ReportButton";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import RegistrationConfirmModal from "@/components/modals/RegistrationConfirmModal";
import EditQuantityModal from "@/components/product/EditQuantityModal";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";
import { CustomerReview } from "@/components/reviews/CustomerReview";
import { Review } from "@/components/reviews/ReviewsBlock";
import { Card } from "@/components/UI/Card";
import HDivider from "@/components/UI/HDivider";
import ImageCarousel from "@/components/UI/ImageCarousel";
import OrderProgressBar from "@/components/UI/OrderProgress";
import TitleHeader from "@/components/UI/TitleHeader";
import { usePermissions } from "@/hooks/usePermissions";
import {
  formatEventDateTime,
  formatPostTime,
  formatToReadableDate,
} from "@/lib/dateTime";
import {
  callUser,
  capitalizeWords,
  sendWhatsAppMessage,
  shareProduct,
} from "@/lib/utils";
import { useProductStore } from "@/store/useBusinessStore";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { OrderData } from "@/types/business.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ProductDetail() {
  const params = useLocalSearchParams<{
    id?: string;
    _id?: string;
    flow?: string;
  }>();
  const id = (params.id ?? params._id) as string | undefined;
  const flow = params.flow as string | undefined;

  const t = useTheme();
  const insets = useSafeAreaInsets();

  // Optimize store subscriptions by using a single selector that combines all needed data
  const {
    updateDeal,
    getAllDealsBySocietyId,
    getDealById,
    upsertWholesaleOrder,
    selectedDeal,
    setSelectedDeal,
  } = useWholesaleDealStore();
  const { hasAnyRole, hasOnly } = usePermissions();

  const { user, getUserOrders } = useUserStore();
  const { updateProduct, getProductById, fetchBusinessBySocietyId } =
    useProductStore();
  const {
    getFeedById,
    feedItem,
    addOrUpdateRSVP,
    removeRSVP,
    removeFeed,
    addReview,
  } = useFeedsStore();

  const isEventFlow = flow === "event";
  const [submitting, setSubmitting] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showRegistrationConfirm, setShowRegistrationConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedProduct, setSelectedProductState] = useState<any>(null);

  // Events are served exclusively by the MySQL Event API (/(shared)/event-details).
  // Nothing in the app routes here with flow=event any more; a stale deep link or
  // a previously shared link is bounced to Home instead of rendering the retired
  // feed-based event UI below.
  useEffect(() => {
    if (!isEventFlow) return;
    Alert.alert(
      "Event unavailable",
      "This event link is no longer supported. Please open the event from your feed.",
    );
    router.replace("/(tabs)/home");
  }, [isEventFlow]);

  // Ensure selected deal is fetched when viewing a deal; clear any previous state first
  useEffect(() => {
    if (!id) return;
    // Clear previous selection immediately to avoid any flash of prior data
    setSelectedDeal(null);
    setSelectedProductState(null);
    if (isEventFlow) {
      getFeedById(String(id));
    } else {
      getDealById(String(id));
    }
  }, [id, isEventFlow, getDealById, setSelectedDeal, getFeedById]);

  // Clear selected deal on unmount to avoid stale data across navigations
  useEffect(() => {
    return () => {
      setSelectedDeal(null);
      setSelectedProductState(null);
    };
  }, [setSelectedDeal]);

  useEffect(() => {
    if (!id) return;
    const key = String(id);

    if (
      !isEventFlow &&
      selectedDeal &&
      String((selectedDeal as any)?._id) === key
    ) {
      setSelectedProductState(selectedDeal as any);
    }

    if (isEventFlow && feedItem && String((feedItem as any)?._id) === key) {
      setSelectedProductState(feedItem as any);
    }
  }, [id, isEventFlow, selectedDeal, feedItem]);

  // Lightweight loader handled in render to avoid conditional hooks

  const handleShare = useCallback(() => {
    if (!selectedProduct || !id) return;
    const name = capitalizeWords(
      (selectedProduct as any)?.title ||
      (selectedProduct as any)?.businessTitle ||
      "Deal",
    );
    const description = (selectedProduct as any)?.description || undefined;
    const price = (selectedProduct as any)?.price?.sellingPrice || undefined;
    // Build a deep link into this screen using expo-linking
    // Only deals are served by this screen — never mint a legacy flow=event link.
    const path = `/(shared)/${id}?flow=deal`;
    const link = ExpoLinking.createURL(path);
    shareProduct({ name, description, price, link });
  }, [selectedProduct, id]);

  // Memoize user data extraction with more specific dependencies
  const userData = useMemo(() => {
    // Extract user data from userId object
    if (
      typeof selectedProduct?.userId === "object" &&
      selectedProduct?.userId !== null
    ) {
      return {
        profilePhotoUrl: (
          selectedProduct?.userId as { profilePhotoUrl?: string }
        )?.profilePhotoUrl,
        fullName: (selectedProduct.userId as { fullName?: string })?.fullName,
        phone: (selectedProduct.userId as { phone?: string })?.phone,
      };
    }

    // Extract user data from user object
    if (
      typeof selectedProduct?.user === "object" &&
      selectedProduct?.user !== null
    ) {
      return {
        profilePhotoUrl: (selectedProduct?.user as { profilePhotoUrl?: string })
          ?.profilePhotoUrl,
        fullName: (selectedProduct.user as { fullName?: string })?.fullName,
        phone: (selectedProduct.user as { phone?: string })?.phone,
      };
    }

    // Default fallback
    return { profilePhotoUrl: undefined, fullName: "Seller" };
  }, [selectedProduct?.userId, selectedProduct?.user]);

  // Memoize price data with more specific dependencies
  const priceData = useMemo(() => {
    return {
      displayPrice: !isEventFlow
        ? selectedProduct?.price?.sellingPrice
        : selectedProduct?.price,
      mrp: selectedProduct?.price?.mrp,
      quantityUnit: !isEventFlow ? selectedProduct?.quantityUnit : "person",
    };
  }, [isEventFlow, selectedProduct?.price, selectedProduct?.quantityUnit]);

  // Memoize review aggregates with specific dependency
  const { avgRating, reviewsCount, filledStars } = useMemo(() => {
    const reviews = (selectedProduct?.reviews || []) as { rating?: number }[];
    const scores = reviews
      .map((r) => Number(r?.rating))
      .filter((n) => !Number.isNaN(n));
    if (!scores.length) {
      return { avgRating: 4.9, reviewsCount: 0, filledStars: 5 };
    }
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const filled = Math.round(avg);
    return {
      avgRating: Number(avg.toFixed(1)),
      reviewsCount: scores.length,
      filledStars: Math.min(5, Math.max(0, filled)),
    };
  }, [selectedProduct?.reviews]);

  // Only show deal options that are enabled on the product with specific dependency
  const visibleDealOptions = useMemo(() => {
    if (!selectedProduct?.dealOptions) {
      return [];
    }

    const opts = selectedProduct.dealOptions as Record<string, boolean>;
    // Map mismatched ids to the backend keys
    const idMap: Record<string, string> = {
      testBeforeAccept: "openBoxDelivery",
    };
    return DEALS_OPTIONS.filter((o: any) => {
      const key = idMap[o.id] ?? o.id;
      return Boolean((opts as any)[key]);
    });
  }, [selectedProduct]);

  // Handler for updating order quantity
  const handleUpdateQuantity = useCallback(
    async (updatedQuantity: number, newTotalAmount?: number) => {
      if (flow !== "deal" || !selectedProduct) return;

      // Guard: block orders past deadline
      const deadlineStr = (selectedProduct as any)?.orderDeadlineDate;
      if (deadlineStr) {
        const today = new Date().toISOString().split("T")[0];
        if (today > deadlineStr) {
          Alert.alert(
            "Deadline Passed",
            "The order deadline for this deal has passed. You cannot place or modify orders.",
          );
          return;
        }
      }

      // Pass the absolute quantity directly from the modal
      const qty = Math.max(0, Math.floor(Number(updatedQuantity) || 0));

      const orderData: OrderData = {
        userId: user?._id,
        quantity: qty,
        amount: newTotalAmount ?? 0,
        status: "confirmed" as const,
        dealerName: user?.fullName || "Anonymous",
        orderedAt: new Date(),
        delivery: {
          address: user?.completeAddress,
          phone: user?.phone || "N/A",
        },
      };
      await upsertWholesaleOrder(String(id), orderData);

      // Targeted refresh of this deal to keep store in sync
      if (id) {
        getDealById(String(id));
      }

      // Refresh user's orders list so My Orders reflects latest totals
      if (user?._id) {
        await getUserOrders(String(user._id));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow, selectedProduct, id, user],
  );

  const handleSubmitReview = useCallback(
    async ({ rating, comment }: { rating: number; comment: string }) => {
      setSubmitting(true);
      try {
        const newReview: Review = {
          userId: user?._id,
          userName: user?.fullName || "Anonymous",
          profilePhotoUrl: user?.profilePhotoUrl || undefined,
          rating,
          comment,
        };
        if (flow === "deal") {
          await updateDeal(
            {
              reviews: [newReview, ...(selectedProduct?.reviews || [])],
            },
            id as string,
          );
          // Targeted refresh for this deal to keep store in sync; avoid clearing/refetching all
          if (id) {
            getDealById(String(id));
          }
        } else if (flow === "business") {
          await updateProduct(
            {
              reviews: [newReview, ...(selectedProduct?.reviews || [])],
            },
            id as string,
          );
          if (id) getProductById(id as string);
        }
      } catch {
        Alert.alert("Error", "Failed to submit review. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, flow, selectedProduct, id],
  );

  const submitReport = useCallback(
    async (reason?: string) => {
      if (flow === "business" && reason && selectedProduct) {
        await updateProduct(
          {
            report: [
              ...(selectedProduct?.report ?? []),
              { userId: user?._id as string, reason },
            ],
            totalReportCount: (selectedProduct?.totalReportCount ?? 0) + 1,
          },
          selectedProduct?._id as string,
        );
        if (user?._id) {
          if (user?.societyId && typeof user.societyId !== "string") {
            await fetchBusinessBySocietyId(user.societyId._id as string);
          } else if (typeof user?.societyId === "string") {
            await fetchBusinessBySocietyId(user.societyId);
          }
        }
      }
      if (flow === "deal" && reason && selectedProduct) {
        await updateDeal(
          {
            report: [
              ...(selectedProduct?.report ?? []),
              { userId: user?._id as string, reason },
            ],
            totalReportCount: (selectedProduct?.totalReportCount ?? 0) + 1,
          },
          selectedProduct?._id as string,
        );
        if (user && user?.societyId && typeof user.societyId !== "string") {
          getAllDealsBySocietyId(user.societyId._id);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flow, selectedProduct, user],
  );

  const handleCloseAddReviewModal = useCallback(() => {
    setShowAddReviewModal(false);
  }, []);

  const handleAddReview = useCallback(
    async (review: Omit<Review, "_id" | "createdAt" | "userName">) => {
      try {
        if (isEventFlow && id && user?._id) {
          await addReview(id, {
            userId: String(user._id),
            rating: review.rating ?? 5,
            comment: review.comment ?? "",
          });
          await getFeedById(id);
        } else {
          await handleSubmitReview({
            rating: review.rating ?? 5,
            comment: review.comment ?? "",
          });
        }
        setShowAddReviewModal(false);
      } catch {
        Alert.alert("Error", "Failed to submit review. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEventFlow, id, user?._id, handleSubmitReview],
  );

  const onCloseEdit = useCallback(() => {
    setIsEditingOrder(false);
  }, []);

  const onOpenRegistration = useCallback(() => {
    if (isEventFlow) {
      // Always allow opening the modal - onConfirmRegistration will handle updates
      setShowRegistrationConfirm(true);
    } else {
      setIsEditingOrder(true);
    }
  }, [isEventFlow]);

  const onCloseRegistration = useCallback(() => {
    setShowRegistrationConfirm(false);
  }, []);

  const onConfirmRegistration = useCallback(
    async (participantCount: number = 1, totalPrice: number = 0) => {
      try {
        if (!user?._id || !isEventFlow) return;

        // Call the backend API to add or update RSVP
        await addOrUpdateRSVP(id as string, {
          userId: String(user._id),
          price: totalPrice,
          participants: participantCount,
          profilePhotoUrl: user?.profilePhotoUrl,
          fullName: user?.fullName,
          verificationStatus: {
            status: verificationStatus.PENDING,
            rejectionReason: null,
          },
        });
        // Refresh the feed to get the latest data
        if (id) {
          await getFeedById(String(id));
        }
      } catch (error) { }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, id, isEventFlow],
  );

  const handleCallUser = useCallback(() => {
    if (selectedProduct?.phone) {
      callUser(selectedProduct.phone);
    }
  }, [selectedProduct?.phone]);

  // console.log('selectedProduct', selectedProduct)

  const isDeadlinePassed = useMemo(() => {
    if (isEventFlow || !selectedProduct?.orderDeadlineDate) return false;
    const today = new Date().toISOString().split("T")[0];
    return today > selectedProduct.orderDeadlineDate;
  }, [isEventFlow, selectedProduct?.orderDeadlineDate]);

  const isOrderDisabled = useMemo(() => {
    if (isEventFlow) return false;
    if (isDeadlinePassed) return true;
    const status = selectedProduct?.dealStatus;
    return status === "FAILED" || status === "CANCELLED" || status === "FULL";
  }, [isEventFlow, isDeadlinePassed, selectedProduct?.dealStatus]);

  const closingSoon = useMemo(() => {
    if (isEventFlow || !selectedProduct?.orderDeadlineDate) return false;
    const deadline = new Date(selectedProduct.orderDeadlineDate);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
  }, [isEventFlow, selectedProduct?.orderDeadlineDate]);

  // Memoize button title with specific dependencies
  const buttonTitle = useMemo(() => {
    if (isEventFlow) {
      const currentUserId = user?._id;
      const existingRsvps = selectedProduct?.rsvps || [];
      const isAlreadyRegistered = existingRsvps.some(
        (rsvp: any) => String(rsvp?.user) === String(currentUserId),
      );

      if (isAlreadyRegistered) {
        return "Edit Registration";
      }
      return `Register Now - ${COMMON_CONSTANTS.CURRENCY}${priceData.displayPrice}`;
    } else {
      if (selectedProduct?.dealStatus === "CANCELLED") {
        return "Deal Cancelled";
      }
      if (selectedProduct?.dealStatus === "FAILED") {
        return "Deal Failed";
      }
      if (selectedProduct?.dealStatus === "FULL") {
        return "Deal Full";
      }
      if (isDeadlinePassed) {
        return "Order Deadline Passed";
      }
      const currentUserId = user?._id ? String(user._id) : "";
      const existingOrders = selectedProduct?.orders || [];
      const myActiveOrder = existingOrders.find((order: any) => {
        const orderUid = order?.userId && typeof order.userId === "object"
          ? String(order.userId?._id || "")
          : String(order?.userId || "");
        return (
          orderUid === currentUserId &&
          order?.status !== "cancelled" &&
          order?.status !== "rejected" &&
          (order?.quantity || 0) > 0
        );
      });
      if (myActiveOrder) {
        return "Update Order";
      }
    }
    return "Order Now";
  }, [priceData, isEventFlow, selectedProduct, user?._id, isDeadlinePassed]);

  // Derive user's previous order quantity from this deal
  const userPreviousOrderQty = useMemo(() => {
    try {
      const orders = (selectedProduct as any)?.orders as {
        userId?: any;
        quantity?: number;
        status?: string;
      }[];
      const uid = user?._id ? String(user._id) : "";
      const mine = Array.isArray(orders)
        ? orders.find((o) => {
            const orderUid = o?.userId && typeof o.userId === "object"
              ? String(o.userId?._id || "")
              : String(o?.userId || "");
            return (
              orderUid === uid &&
              o?.status !== "cancelled" &&
              o?.status !== "rejected"
            );
          })
        : undefined;
      return Number(mine?.quantity) || 0;
    } catch {
      return 0;
    }
  }, [selectedProduct, user?._id]);

  const remainingQuantity = useMemo(() => {
    if (!selectedProduct) return 0;
    const maxQty = Number((selectedProduct as any).maximumOrderQty);
    if (!maxQty || maxQty <= 0) return 999999;
    const currentUserId = user?._id ? String(user._id) : "";
    const orders = (selectedProduct.orders || []) as {
      userId?: any;
      quantity?: number;
      status?: string;
    }[];
    const totalApprovedQtyOthers = orders
      .filter((o) => {
        const orderUid = o?.userId && typeof o.userId === "object"
          ? String(o.userId?._id || "")
          : String(o?.userId || "");
        return (
          orderUid !== currentUserId &&
          (o.status === "approved" ||
            o.status === "confirmed" ||
            o.status === "delivered")
        );
      })
      .reduce((sum, o) => sum + (o.quantity || 0), 0);
    return Math.max(0, maxQty - totalApprovedQtyOthers);
  }, [selectedProduct, user?._id]);

  const isGuest = useMemo(() => hasOnly([UserRole.GUEST]), [hasOnly]);

  const reviewsSection = useMemo(() => {
    const reviews = (selectedProduct?.reviews ?? []) as Review[];
    return (
      <View style={styles.mb24}>
        <Text style={[styles.reviewTitle, { color: t.colors.textPrimary }]}>
          {isEventFlow ? "Event Reviews" : "Customer Reviews"}
        </Text>
        <Card>
          <CustomerReview
            reviews={reviews}
            onAddReview={() => setShowAddReviewModal(true)}
            disabled={isGuest}
          />
        </Card>
      </View>
    );
  }, [selectedProduct?.reviews, isEventFlow, t.colors.textPrimary, isGuest]);

  // Create filtered event details for display
  const eventDetailsToShow = useMemo(() => {
    if (!isEventFlow || !selectedProduct?.eventDetails) return [];

    const eventDetailsMap = {
      freeChildren: {
        name: "Free for Children",
        subtext: "Children can attend for free",
        icon: "people-outline",
      },
      guests: {
        name: "Guests Allowed",
        subtext: "You can bring guests to this event",
        icon: "person-add-outline",
      },
      materials: {
        name: "Materials Provided",
        subtext: "All necessary materials will be provided",
        icon: "briefcase-outline",
      },
      refreshments: {
        name: "Refreshments Included",
        subtext: "Complimentary refreshments will be served",
        icon: "cafe-outline",
      },
    };

    return Object.entries(selectedProduct.eventDetails)
      .filter(([key, value]) => value === true)
      .map(([key]) => eventDetailsMap[key as keyof typeof eventDetailsMap])
      .filter(Boolean);
  }, [isEventFlow, selectedProduct?.eventDetails]);

  // Get current user's existing RSVP participants count
  const userExistingParticipants = useMemo(() => {
    if (!isEventFlow) return 1;
    const currentUserId = user?._id;
    const existingRsvps = selectedProduct?.rsvps || [];
    const userRsvp = existingRsvps.find(
      (rsvp: any) => String(rsvp?.user) === String(currentUserId),
    );
    return userRsvp?.participants || 1;
  }, [isEventFlow, selectedProduct?.rsvps, user?._id]);

  // Check if user is already registered for the event
  const isUserRegistered = useMemo(() => {
    if (!isEventFlow) return false;
    const currentUserId = user?._id;
    const existingRsvps = selectedProduct?.rsvps || [];
    return existingRsvps.some(
      (rsvp: any) => String(rsvp?.user) === String(currentUserId),
    );
  }, [isEventFlow, selectedProduct?.rsvps, user?._id]);

  const handleRemovePost = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleWithdrawRegistration = useCallback(async () => {
    if (!user?._id || !isEventFlow || !id) return;

    // Call the DELETE endpoint to remove RSVP
    // The store will automatically update feedItem with the response
    await removeRSVP(id as string, String(user._id));

    // Refresh the feed to get the latest data as a safety measure
    // This ensures feedItem → selectedProduct → isUserRegistered → buttonTitle are all updated
    if (id) {
      await getFeedById(String(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, isEventFlow]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      if (isEventFlow && id) {
        // Delete feed/event
        await removeFeed(String(id));
      } else if (id) {
        // Delete deal - mark as inactive
        await updateDeal({ isDealActive: false }, String(id));
      }
      setShowDeleteConfirm(false);
      setIsDeleting(true);
      setShowOrderSuccess(true);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEventFlow]);

  // Calculate top padding based on safe area insets and platform
  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === "ios" ? 40 : 0),
    [insets.top],
  );
  return (
    <View
      style={{
        paddingTop: topPadding,
        flex: 1,
        backgroundColor: t.colors.background,
      }}
    >
      <TitleHeader
        title="Event Details"
        subtitle="December 1, 2025"
        onBackPress={() => router.back()}
        showOptionsMenu={true}
        canRemovePost={
          user?._id === selectedProduct?.user?._id ||
          hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        }
        onRemovePost={handleRemovePost}
        onShare={() => console.log("Share pressed")}
        onReportPost={() => console.log("Report post")}
      />
      {!selectedProduct ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Image carousel */}
            <View style={styles.imageCarousel}>
              <ImageCarousel
                images={selectedProduct?.images ?? []}
                height={200}
              />
            </View>

            {/* Title row */}
            <View style={styles.titleRow}>
              {/* Title */}
              <Text
                style={[
                  t.typography.h1,
                  { color: t.colors.textPrimary, marginTop: 8 },
                ]}
              >
                {capitalizeWords(selectedProduct?.title || "")}
              </Text>

              {/* Deal Status & Closing Soon Badges */}
              {flow === "deal" && selectedProduct?.dealStatus && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      backgroundColor:
                        selectedProduct.dealStatus === "UNLOCKED"
                          ? "#D1FAE5"
                          : selectedProduct.dealStatus === "FULL"
                            ? "#E0E7FF"
                            : selectedProduct.dealStatus === "FAILED"
                              ? "#FEE2E2"
                              : selectedProduct.dealStatus === "CANCELLED"
                                ? "#F1F5F9"
                                : "#DBEAFE",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 12,
                        color:
                          selectedProduct.dealStatus === "UNLOCKED"
                            ? "#10B981"
                            : selectedProduct.dealStatus === "FULL"
                              ? "#6366F1"
                              : selectedProduct.dealStatus === "FAILED"
                                ? "#EF4444"
                                : selectedProduct.dealStatus === "CANCELLED"
                                  ? "#94A3B8"
                                  : "#3B82F6",
                      }}
                    >
                      {selectedProduct.dealStatus}
                    </Text>
                  </View>

                  {closingSoon && (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#F97316",
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        🔥 Closing Soon
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text
                  style={[
                    t.typography.h1,
                    styles.priceText,
                    { color: t.colors.primary },
                  ]}
                >
                  {COMMON_CONSTANTS.CURRENCY} {priceData.displayPrice}
                </Text>
                {priceData.mrp && (
                  <Text
                    style={[
                      styles.strikethroughPrice,
                      { color: t.colors.textSecondary },
                    ]}
                  >
                    {COMMON_CONSTANTS.CURRENCY}
                    {priceData.mrp}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.unitContainer}>
              {selectedProduct && (
                <Text
                  style={[
                    t.typography.text,
                    { color: t.colors.textSecondary, fontWeight: "500" },
                  ]}
                >
                  / {priceData.quantityUnit}
                </Text>
              )}
            </View>

            <HDivider thickness={1} />
            {/* Top metrics: rating | badge | reviews */}
            {!isEventFlow && (
              <View style={styles.metricsContainer}>
                {/* Rating block */}
                <View style={styles.metricItem}>
                  <Text
                    style={[
                      styles.metricNumber,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    {avgRating.toFixed(1)}
                  </Text>
                  <View style={styles.starContainer}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Ionicons
                        key={i}
                        name={i < filledStars ? "star" : "star-outline"}
                        size={12}
                        color={i < filledStars ? "#FBBF24" : t.colors.border}
                        style={styles.starIcon}
                      />
                    ))}
                  </View>
                </View>

                {/* Guest favourite */}
                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.shareButton}
                  accessibilityRole="button"
                  accessibilityLabel="Share product"
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={t.colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.shareText,
                      { color: t.colors.textSecondary },
                    ]}
                  >
                    Share Product
                  </Text>
                </TouchableOpacity>

                {/* Reviews count */}
                <View style={styles.metricItem}>
                  <Text
                    style={[
                      styles.metricNumber,
                      { color: t.colors.textPrimary },
                    ]}
                  >
                    {reviewsCount.toString()}
                  </Text>
                  <Text
                    style={[
                      styles.shareText,
                      { color: t.colors.textSecondary },
                    ]}
                  >
                    Reviews
                  </Text>
                </View>
              </View>
            )}
            {isEventFlow && (
              <View style={styles.eventInfoContainer}>
                {/* Date & Time */}
                <View style={styles.eventInfoItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={t.colors.textPrimary}
                    style={styles.eventIcon}
                  />
                  <View style={styles.eventTextContainer}>
                    <Text
                      style={[
                        t.typography.button1,
                        styles.eventLabel,
                        { color: t.colors.textPrimary },
                      ]}
                    >
                      Date & Time
                    </Text>
                    <Text
                      style={[
                        t.typography.text,
                        styles.eventText,
                        { color: t.colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {formatEventDateTime(
                        selectedProduct?.eventDate,
                        selectedProduct?.eventTime,
                      )}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.eventInfoItem}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={t.colors.textPrimary}
                    style={styles.eventIcon}
                  />
                  <View style={styles.eventTextContainer}>
                    <Text
                      style={[
                        t.typography.button1,
                        styles.eventLabel,
                        { color: t.colors.textPrimary },
                      ]}
                    >
                      Location
                    </Text>
                    <Text
                      style={[
                        t.typography.text,
                        styles.eventText,
                        { color: t.colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {selectedProduct?.location}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <HDivider thickness={1} />

            {/* Hosted by section and call button */}
            <View style={styles.hostedByContainer}>
              <CircularImage
                uri={userData.profilePhotoUrl}
                mode="view"
                size={40}
                loading={false}
              />
              <View style={styles.hostedByText}>
                <Text
                  style={[styles.hostedByName, { color: t.colors.textPrimary }]}
                >
                  {userData.fullName}
                </Text>
                <Text
                  style={[
                    styles.hostedBySubtext,
                    { color: t.colors.textSecondary },
                  ]}
                >
                  {isEventFlow ? "Hosted an event" : "posted a deal"} ·{" "}
                  {formatPostTime(selectedProduct?.createdAt ?? "")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCallUser}
                style={[
                  styles.callButton,
                  { backgroundColor: t.colors.primary },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendWhatsAppMessage({ phone: userData.phone })}
                style={[styles.callButton, { backgroundColor: "#25D366" }]}
                accessibilityRole="button"
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <HDivider thickness={1} />

            {/* Assurance list */}
            {!isEventFlow && (
              <View style={styles.assuranceContainer}>
                {visibleDealOptions.map((option, idx) => (
                  <View key={idx} style={styles.assuranceItem}>
                    <View
                      style={[
                        styles.assuranceIcon,
                        { backgroundColor: t.colors.slateColor },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={t.colors.textPrimary}
                      />
                    </View>
                    <View style={styles.assuranceText}>
                      <Text
                        style={[
                          styles.assuranceName,
                          { color: t.colors.textPrimary },
                        ]}
                      >
                        {option.name}
                      </Text>
                      <Text
                        style={[
                          styles.assuranceSubtext,
                          { color: t.colors.textSecondary },
                        ]}
                      >
                        {option.subtext}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {isEventFlow && eventDetailsToShow.length > 0 && (
              <View style={styles.assuranceContainer}>
                {eventDetailsToShow.map((option, idx) => (
                  <View key={idx} style={styles.assuranceItem}>
                    <View
                      style={[
                        styles.assuranceIcon,
                        { backgroundColor: t.colors.slateColor },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={t.colors.textPrimary}
                      />
                    </View>
                    <View style={styles.assuranceText}>
                      <Text
                        style={[
                          styles.assuranceName,
                          { color: t.colors.textPrimary },
                        ]}
                      >
                        {option.name}
                      </Text>
                      <Text
                        style={[
                          styles.assuranceSubtext,
                          { color: t.colors.textSecondary },
                        ]}
                      >
                        {option.subtext}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {eventDetailsToShow.length > 0 || !isEventFlow ? (
              <HDivider thickness={1} />
            ) : null}

            {/* Community Goal */}
            <View>
              {(Number(selectedProduct?.currentOrderedQty) > 0 ||
                selectedProduct?.rsvps?.length > 0) && (
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 16,
                      marginBottom: 12,
                    }}
                  >
                    Community Goal
                  </Text>
                )}
              {Number(selectedProduct?.currentOrderedQty) > 0 ||
                (selectedProduct?.rsvps?.length > 0 && (
                  <Card style={{ marginBottom: 16, padding: 16, elevation: 2 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      {/* Avatars mock */}
                      {/* Social Actions */}
                      {Number(selectedProduct?.currentOrderedQty) > 0 ||
                        (selectedProduct?.rsvps?.length > 0 && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {/* Avatars */}
                              {!isEventFlow &&
                                selectedProduct?.images
                                  ?.slice(0, 2)
                                  .map((img: any, idx: number) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: img }}
                                      style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        borderWidth: 1,
                                        borderColor: "#fff",
                                        marginLeft: idx === 0 ? 0 : -8, // overlap
                                      }}
                                    />
                                  ))}
                              {isEventFlow &&
                                selectedProduct?.rsvps?.length > 0 &&
                                selectedProduct?.rsvps
                                  ?.slice(0, 2)
                                  .map((item: any, idx: number) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: item.profilePhotoUrl }}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: "#fff",
                                        marginLeft: idx === 0 ? 0 : -8, // overlap
                                      }}
                                    />
                                  ))}
                              {Number(selectedProduct?.currentOrderedQty) >
                                0 && (
                                  <Text
                                    style={{
                                      color: "#888",
                                      fontSize: 12,
                                      paddingLeft: 8,
                                    }}
                                  >
                                    +{" "}
                                    {!isEventFlow
                                      ? selectedProduct.currentOrderedQty
                                      : selectedProduct?.rsvps?.length}{" "}
                                    joined
                                  </Text>
                                )}
                            </View>

                            {!isEventFlow && (
                              <Text
                                style={{
                                  marginLeft: 8,
                                  color: t.colors.textSecondary,
                                  paddingBottom: 8,
                                }}
                              >
                                {`${selectedProduct?.currentOrderedQty || 0
                                  } / ${selectedProduct?.minimumOrderQty || 0
                                  } orders placed!`}
                              </Text>
                            )}
                            {isEventFlow && (
                              <Text
                                style={{
                                  ...t.typography.button1,
                                  marginLeft: 8,
                                  color: t.colors.textSecondary,
                                }}
                              >
                                {`${selectedProduct?.registeredParticipants || 0
                                  } / ${selectedProduct?.minParticipants || 0
                                  } spots filled!`}
                              </Text>
                            )}
                          </View>
                        ))}
                    </View>
                    <OrderProgressBar
                      current={
                        (selectedProduct?.currentOrderedQty ||
                          selectedProduct?.registeredParticipants) ??
                        0
                      }
                      total={
                        (selectedProduct?.minimumOrderQty ||
                          selectedProduct?.minParticipants) ??
                        0
                      }
                    />
                    <View style={{ height: 8 }} />
                    {Number(selectedProduct?.currentOrderedQty) > 0 ||
                      (selectedProduct?.rsvps?.length > 0 && (
                        <Text
                          style={{
                            color: t.colors.textPrimary,
                            fontSize: 14,
                            textAlign: "center",
                            backgroundColor: t.colors.lightBackground,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 12,
                            fontWeight: "500",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "600",
                              color: t.colors.primary,
                            }}
                          >
                            {Math.max(
                              (selectedProduct?.minimumOrderQty ||
                                selectedProduct?.minParticipants) -
                              (selectedProduct?.currentOrderedQty ||
                                selectedProduct?.registeredParticipants),
                              0,
                            )}{" "}
                            more {!isEventFlow ? "orders" : "participants"}
                          </Text>{" "}
                          {!isEventFlow
                            ? "to unlock this price!"
                            : "needed to start!"}
                        </Text>
                      ))}
                  </Card>
                ))}
              {(Number(selectedProduct?.currentOrderedQty) === 0 ||
                selectedProduct?.rsvps?.length === 0) && (
                  <Text
                    style={{
                      color: t.colors.primary,
                      fontSize: 18,
                      textAlign: "center",
                      backgroundColor: t.colors.lightBackground,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 20,
                      fontWeight: "600",
                    }}
                  >
                    Hurry up! be the first one to join
                  </Text>
                )}
            </View>

            <HDivider thickness={1} />

            {/* About This Item */}
            <Text
              style={{
                color: t.colors.textPrimary,
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              About This Item
            </Text>
            <Text style={{ color: t.colors.textSecondary, marginBottom: 12 }}>
              {selectedProduct?.description ||
                capitalizeWords(selectedProduct?.title || "")}
            </Text>

            {!isEventFlow && <HDivider thickness={1} />}

            {/* Key Dates & Limits */}
            {!isEventFlow && (
              <Text
                style={{
                  color: t.colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                  marginVertical: 12,
                }}
              >
                Key Dates & Limits
              </Text>
            )}
            {!isEventFlow && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Card
                  style={{
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: t.colors.textPrimary, fontWeight: "500" }}
                  >
                    Order Deadline
                  </Text>
                  <Text style={{ color: t.colors.warning, fontWeight: "700" }}>
                    {formatPostTime(selectedProduct?.orderDeadlineDate || "")}
                  </Text>
                  {selectedProduct?.orderDeadlineDate && (
                    <Text
                      style={{ color: t.colors.textSecondary, marginTop: 4 }}
                    >
                      {formatToReadableDate(selectedProduct?.orderDeadlineDate)}
                    </Text>
                  )}
                </Card>
                <Card style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: t.colors.textSecondary,
                      fontWeight: "500",
                    }}
                  >
                    Est. Delivery
                  </Text>
                  <Text
                    style={{ color: t.colors.textPrimary, fontWeight: "700" }}
                  >
                    {selectedProduct?.estimatedDeliveryDate
                      ? formatToReadableDate(
                        selectedProduct?.estimatedDeliveryDate,
                      )
                      : "--"}
                  </Text>
                  {selectedProduct?.estimatedDeliveryDate && (
                    <Text
                      style={{ color: t.colors.textSecondary, marginTop: 4 }}
                    >
                      In{" "}
                      {formatPostTime(
                        selectedProduct?.estimatedDeliveryDate || "",
                      )}
                    </Text>
                  )}
                </Card>
              </View>
            )}

            {!isEventFlow && <HDivider thickness={1} />}

            {/* Report */}
            {!isEventFlow && (
              <ReportButton
                title={`Report this ${isEventFlow ? "Business" : "Deal"}`}
                message={`Are you sure you want to report ${isEventFlow
                    ? (selectedProduct as any)?.businessTitle ||
                    (selectedProduct as any)?.title ||
                    "this business"
                    : (selectedProduct as any)?.title || "this deal"
                  }?`}
                onReport={async (reason) => {
                  await submitReport(reason);
                }}
                label={`Report ${isEventFlow ? "Business" : "Deal"}`}
                containerStyle={{
                  width: "100%",
                  marginTop: 12,
                  backgroundColor: t.colors.lightBackground,
                }}
              />
            )}
            {/* Customer Reviews */}
            {reviewsSection}
          </ScrollView>

          {/* Sticky bottom CTA */}
          <View
            style={[
              styles.stickyBottom,
              {
                backgroundColor: t.colors.background,
                borderTopColor: t.colors.border,
              },
            ]}
          >
            <ActionButton
              title={buttonTitle}
              onPress={onOpenRegistration}
              variant="primary"
              disabled={isOrderDisabled}
              leftIconName={!isEventFlow && !isOrderDisabled ? "cart-outline" : undefined}
              size="lg"
              containerStyle={[
                styles.actionButton,
                !isOrderDisabled && { backgroundColor: t.colors.primary },
              ]}
            />
          </View>

          {/* Edit Quantity Modal */}

          <EditQuantityModal
            isVisible={isEditingOrder}
            onClose={onCloseEdit}
            onSave={handleUpdateQuantity}
            currentQuantity={
              userPreviousOrderQty || selectedProduct?.minimumOrderQty || 1
            }
            productName={selectedProduct?.title || "Product"}
            minQuantity={1}
            maxQuantity={
              Number((selectedProduct as any)?.maximumOrderQty) || 20
            }
            unitPrice={Number(selectedProduct?.price?.sellingPrice) || 0}
            previousQuantity={userPreviousOrderQty}
            successTitle="Order Updated!"
            successMessage="Your order has been successfully updated."
            errorTitle="Update Failed"
            errorMessage="Could not update your order. Please try again."
            autoCloseDelay={2000}
          />

          <OrderSuccessModal
            visible={showOrderSuccess}
            onDismiss={() => {
              setShowOrderSuccess(false);
              // If we're deleting a post, navigate home after dismissing success modal
              if (isDeleting) {
                setIsDeleting(false);
                router.navigate("/(tabs)/home");
              }
            }}
            title={
              isDeleting
                ? "Post Deleted!"
                : isEventFlow
                  ? "Registration Confirmed!"
                  : "Order Placed!"
            }
            subtitle={
              isDeleting
                ? `Your ${isEventFlow ? "event" : "deal"
                } has been successfully deleted.`
                : isEventFlow
                  ? "You've successfully registered for this event."
                  : "You've successfully joined the deal."
            }
          />

          <AddReviewModal
            visible={showAddReviewModal}
            onClose={handleCloseAddReviewModal}
            onSubmit={handleAddReview}
            businessName={
              isEventFlow
                ? selectedProduct?.title || "Event"
                : selectedProduct?.title || "Deal"
            }
            businessId={selectedProduct?._id || ""}
            userId={user?._id || ""}
          />

          {/* Registration Confirmation Modal */}
          <RegistrationConfirmModal
            visible={showRegistrationConfirm}
            onClose={onCloseRegistration}
            onConfirmAndPay={onConfirmRegistration}
            onWithdraw={handleWithdrawRegistration}
            eventTitle={selectedProduct?.title || "Event"}
            price={selectedProduct?.price || 0}
            maxParticipants={
              selectedProduct?.maxParticipants
                ? parseInt(selectedProduct.maxParticipants as string)
                : 1
            }
            initialParticipants={userExistingParticipants}
            pricePerParticipant={true}
            buttonText="Confirm & Register"
            showWithdrawButton={isUserRegistered}
            withdrawButtonText="Withdraw Registration"
            successTitle="Registration Confirmed!"
            successMessage={
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    fontSize: 16,
                    textAlign: "center",
                    color: "#6B7280",
                  }}
                >
                  You&apos;ve successfully registered for this event.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#F0FDF4",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text
                    style={{ fontSize: 14, color: "#374151", flexShrink: 1 }}
                  >
                    The organizer will contact you on WhatsApp.
                  </Text>
                </View>
              </View>
            }
            autoCloseDelay={3000}
            withdrawSuccessTitle="Registration Withdrawn"
            withdrawSuccessMessage={
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text
                  style={{
                    fontSize: 16,
                    textAlign: "center",
                    color: "#6B7280",
                  }}
                >
                  You have successfully withdrawn from this event.
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    textAlign: "center",
                    color: "#9CA3AF",
                  }}
                >
                  We hope to see you next time!
                </Text>
              </View>
            }
          />

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            visible={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Post"
            message={`Are you sure you want to delete this ${isEventFlow ? "event" : "deal"
              }? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            isDangerous={true}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  mb24: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1F2937",
  },
  imageCarousel: {
    borderRadius: 12,
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  priceText: {
    marginRight: 8,
  },
  strikethroughPrice: {
    fontSize: 16,
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  unitContainer: {
    flexDirection: "row-reverse",
  },
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  starContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  starIcon: {
    marginHorizontal: 1,
  },
  shareButton: {
    alignItems: "center",
    flex: 1,
  },
  shareText: {
    marginTop: 6,
  },
  eventInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  eventInfoItem: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  eventIcon: {
    marginTop: 2,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventLabel: {
    marginBottom: 4,
  },
  eventText: {
    flexShrink: 1,
  },
  hostedByContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  hostedByText: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  hostedByName: {
    fontWeight: "700",
    fontSize: 16,
  },
  hostedBySubtext: {
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  assuranceContainer: {
    paddingVertical: 4,
    marginBottom: 16,
  },
  assuranceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  assuranceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  assuranceText: {
    flex: 1,
  },
  assuranceName: {
    fontWeight: "700",
  },
  assuranceSubtext: {
    marginTop: 2,
  },
  communityGoalTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 12,
  },
  communityCard: {
    marginBottom: 16,
    elevation: 4,
  },
  communityCardContent: {
    padding: 12,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  joinedText: {
    color: "#888",
    fontSize: 12,
    paddingLeft: 8,
  },
  ordersText: {
    marginLeft: 8,
    paddingBottom: 8,
  },
  spacer: {
    height: 8,
  },
  goalText: {
    fontSize: 14,
    textAlign: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontWeight: "500",
  },
  goalHighlight: {
    fontWeight: "600",
  },
  hurryText: {
    fontSize: 18,
    textAlign: "center",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 20,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  description: {
    marginBottom: 12,
  },
  keyDatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 12,
  },
  keyDatesRow: {
    flexDirection: "row",
    gap: 12,
  },
  keyDateCard: {
    flex: 1,
    alignItems: "center",
  },
  deadlineLabel: {
    fontWeight: "500",
  },
  deadlineValue: {
    fontWeight: "700",
  },
  deadlineDate: {
    marginTop: 4,
  },
  reportContainer: {
    width: "100%",
    marginTop: 12,
  },
  stickyBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
  },
});

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(ProductDetail);
