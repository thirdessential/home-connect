import CircularImage from "@/components/form/CircularImage";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import ReportModal from "@/components/modals/ReportModal";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";
import { CustomerReview } from "@/components/reviews/CustomerReview";
import { Card } from "@/components/UI/Card";
import InfoBanner from "@/components/UI/InfoBanner";
import TitleHeader from "@/components/UI/TitleHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { callUser, sendWhatsAppMessage } from "@/lib/utils";
import { useProductStore } from "@/store/useBusinessStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { ProductStore } from "@/types/business.type";
import { Review } from "@/types/common.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

const productStoreSelector = (state: ProductStore) => ({
  loading: state.loading,
  getProductById: state.getProductById,
  businessList: state.productList,
  product: state.product,
  addOrUpdateBusinessReview: state.addOrUpdateBusinessReview,
  businessReviews: state.businessReviews,
  updateProduct: state.updateProduct,
});

interface ProfileHeaderCardProps {
  business: any;
  theme: any;
}

const ProfileHeaderCard = memo(
  ({ business, theme }: ProfileHeaderCardProps) => {
    const rating = parseFloat(business?.rating?.average) || 0;
    const reviewCount = business?.rating?.count || 0;

    return (
      <View
        style={[
          styles.profileHeaderCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.profileAvatarContainer}>
          {business?.images.length > 0 ? (
            <CircularImage uri={business.images[0]} size={96} mode="view" />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <Ionicons name="storefront" size={48} color="#15803D" />
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{business?.title}</Text>
        <Text style={styles.profileSubtitle}>{business?.category}</Text>

        {rating > 0 && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(rating) ? "star" : "star-outline"}
                  size={16}
                  color="#FFB800"
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating.toFixed(1)} ({reviewCount} Reviews)
            </Text>
          </View>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.business?._id === next.business?._id &&
    prev.business?.title === next.business?.title &&
    prev.business?.category === next.business?.category &&
    prev.business?.image === next.business?.image &&
    prev.business?.rating === next.business?.rating &&
    prev.theme === next.theme,
);
ProfileHeaderCard.displayName = "ProfileHeaderCard";

interface ActionButtonsProps {
  businessPhone: string;
  theme: any;
  onCall: () => void;
  onMessage: () => void;
}

const ActionButtons = memo(
  ({ businessPhone, theme, onCall, onMessage }: ActionButtonsProps) => {
    return (
      <View style={styles.actionButtonsRow}>
        <Pressable
          onPress={onCall}
          style={[
            styles.actionButton,
            styles.callButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.callButtonText}>Call Shop</Text>
        </Pressable>
        <Pressable
          onPress={onMessage}
          style={[
            styles.actionButton,
            styles.messageButton,
            { borderColor: theme.colors.primary },
          ]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.messageButtonText, { color: theme.colors.primary }]}
          >
            Whatsapp
          </Text>
        </Pressable>
      </View>
    );
  },
  (prev, next) =>
    prev.businessPhone === next.businessPhone && prev.theme === next.theme,
);
ActionButtons.displayName = "ActionButtons";

interface ProductItemProps {
  item: any;
  theme: any;
  onPress: () => void;
}

const ProductItem = memo(
  ({ item, theme, onPress }: ProductItemProps) => {
    return (
      <Pressable onPress={onPress} style={styles.productItem}>
        <View style={styles.productThumbContainer}>
          {item?.images?.[0] ? (
            <CircularImage uri={item.images[0]} size={50} mode="view" />
          ) : (
            <View
              style={[
                styles.productThumb,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons
                name="image"
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: theme.colors.textPrimary }]}
          >
            {item?.title}
          </Text>
          <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
            ₹{item?.price}
          </Text>
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.item?._id === next.item?._id &&
    prev.item?.title === next.item?.title &&
    prev.item?.price === next.item?.price &&
    prev.theme === next.theme,
);
ProductItem.displayName = "ProductItem";

interface DetailItemProps {
  icon: string;
  label: string;
  value: string;
  theme: any;
}

const DetailItem = memo(
  ({ icon, label, value, theme }: DetailItemProps) => {
    return (
      <View style={styles.detailItemRow}>
        <View style={styles.detailIconBox}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.detailTextContainer}>
          <Text
            style={[styles.detailLabel, { color: theme.colors.textSecondary }]}
          >
            {label}
          </Text>
          <Text
            style={[styles.detailValue, { color: theme.colors.textPrimary }]}
          >
            {value}
          </Text>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.icon === next.icon &&
    prev.label === next.label &&
    prev.value === next.value &&
    prev.theme === next.theme,
);
DetailItem.displayName = "DetailItem";

export default function BusinessScreen() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { hasOnly } = usePermissions();
  const isGuest = hasOnly([UserRole.GUEST]);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<"business" | "user" | null>(
    null,
  );
  const requestedBusinessRef = useRef<string | null>(null);

  const {
    loading,
    getProductById,
    businessList,
    product,
    addOrUpdateBusinessReview,
    businessReviews,
    updateProduct,
  } = useProductStore(useShallow(productStoreSelector));
  const { user } = useUserStore();

  // Normalize id (use first element if an array) so it's always a string | undefined
  const businessId = Array.isArray(id) ? id[0] : id;

  // Get reviews from store - reviews are populated when business data is fetched
  const reviews = useMemo(() => {
    if (!businessId) return [];
    return businessReviews?.[businessId] || [];
  }, [businessId, businessReviews]);

  // Calculate top padding based on safe area insets and platform
  const topPadding = useMemo(() => {
    const defaultPadding = Platform.OS === "ios" ? 40 : 24;
    return Math.max(insets.top, defaultPadding);
  }, [insets.top]);

  const business = useMemo(() => {
    if (!businessId) return null;
    const matchFromList = businessList?.find((b) => b._id === businessId);
    if (matchFromList) return matchFromList;
    if (product && product._id === businessId) {
      return product;
    }
    return null;
  }, [businessId, businessList, product]);

  useEffect(() => {
    if (!businessId || business || !getProductById) {
      return;
    }
    if (requestedBusinessRef.current === businessId) {
      return;
    }
    requestedBusinessRef.current = businessId;
    getProductById(businessId);
  }, [businessId, business, getProductById]);

  useEffect(() => {
    return () => {
      requestedBusinessRef.current = null;
      useProductStore.setState({ product: null });
    };
  }, []);

  const highlightedItems = useMemo(() => {
    if (!business?.catalogue || business.catalogue.length === 0) {
      return [];
    }
    return business.catalogue.slice(0, 3);
  }, [business?.catalogue]);
  const menuHighlights = useMemo(() => {
    if (highlightedItems.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Menu Highlights
        </Text>
        <View
          style={[styles.menuCard, { backgroundColor: theme.colors.surface }]}
        >
          {highlightedItems.map((item: any) => (
            <ProductItem
              key={item._id}
              item={item}
              theme={theme}
              onPress={() => {}}
            />
          ))}
          {(business?.catalogue?.length ?? 0) > 3 && (
            <Pressable onPress={() => {}} style={styles.viewFullMenuButton}>
              <Text
                style={[
                  styles.viewFullMenuText,
                  { color: theme.colors.primary },
                ]}
              >
                View Full Menu
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }, [highlightedItems, business?.catalogue?.length, theme]);

  const detailsSection = useMemo(() => {
    return (
      <View style={styles.sectionContainer}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Shop Details
        </Text>
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <DetailItem
            icon="time"
            label="Timings"
            value={business?.shopTimings?.name || "N/A"}
            theme={theme}
          />
          <View
            style={[
              styles.detailDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />
          <DetailItem
            icon="location"
            label="Address"
            value={business?.completeAddress || "N/A"}
            theme={theme}
          />
        </View>
      </View>
    );
  }, [business?.shopTimings?.name, business?.completeAddress, theme]);

  const businessPhone = useMemo(() => {
    if (!business) return "";
    return business.businessPhone || business.phone || "";
  }, [business]);

  const handleCall = useCallback(() => {
    if (businessPhone) {
      callUser(businessPhone);
    }
  }, [businessPhone]);

  const handleWhatsapp = useCallback(() => {
    if (businessPhone) {
      sendWhatsAppMessage({ phone: businessPhone });
    }
  }, [businessPhone]);

  const handleAddReview = useCallback(
    (
      newReview: Omit<
        Review,
        "_id" | "createdAt" | "userName" | "profilePhotoUrl"
      >,
    ) => {
      if (!user?._id || !business?._id) {
        alert("Unable to submit review. Please try again.");
        return;
      }

      // Call the store method which handles optimistic updates
      addOrUpdateBusinessReview(business._id, user._id, {
        rating: newReview.rating ?? 0,
        comment: newReview.comment ?? "",
        userName: user.fullName || "Anonymous",
        profilePhotoUrl: user.profilePhotoUrl || "",
      })
        .then(async (result) => {
          // if (business?._id) {
          //   await updateProduct({ avgRating: avgRating }, business._id);
          // }
          if (result) setShowSuccessModal(true);
        })
        .catch((error) => {
          console.error("Error adding review:", error);
          alert("Failed to add review. Please try again.");
        });
    },
    [],
  );

  const handleOpenAddReviewModal = useCallback(() => {
    setShowAddReviewModal(true);
  }, []);

  const handleCloseAddReviewModal = useCallback(() => {
    setShowAddReviewModal(false);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleOptionsPress = useCallback(() => {
    setReportType("business");
    setReportVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setReportVisible(false);
  }, []);

  const handleReportUser = useCallback(() => {
    setReportType("user");
    setReportVisible(true);
  }, []);

  const reviewsSection = useMemo(() => {
    return (
      <View style={styles.sectionContainer}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Customer Reviews
        </Text>
        <Card>
          <CustomerReview
            reviews={reviews}
            onAddReview={handleOpenAddReviewModal}
            disabled={isGuest}
          />
        </Card>
      </View>
    );
  }, [reviews, handleOpenAddReviewModal, theme]);

  if (loading && !business) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Business not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: topPadding },
      ]}
    >
      <TitleHeader
        title="Profile"
        subtitle="December 1, 2025"
        onBackPress={handleBackPress}
        showOptionsMenu={true}
        onReportPost={handleOptionsPress}
        onReportUser={handleReportUser}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileSection}>
          <ProfileHeaderCard business={business} theme={theme} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isGuest ? (
            <InfoBanner
              type="warning"
              title="Guest Mode"
              description="You cannot call or message businesses in guest mode. Please register to access this feature."
            />
          ) : (
            <ActionButtons
              businessPhone={businessPhone}
              theme={theme}
              onCall={handleCall}
              onMessage={handleWhatsapp}
            />
          )}
        </View>

        {/* Menu Highlights */}
        {menuHighlights}

        {/* Shop Details */}
        {detailsSection}

        {/* Customer Reviews */}
        {reviewsSection}
      </ScrollView>

      {/* Add Review Modal */}
      <AddReviewModal
        visible={showAddReviewModal}
        onClose={handleCloseAddReviewModal}
        onSubmit={handleAddReview}
        businessName={business?.title}
        businessId={business?._id}
        userId={user?._id}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        visible={showSuccessModal}
        onDismiss={() => setShowSuccessModal(false)}
        title="Review Submitted!"
        subtitle="Your review has been added successfully."
      />
      {/* Report Modal */}
      <ReportModal
        visible={reportVisible}
        onClose={handleCloseReportModal}
        reportType={reportType || "business"}
        itemId={
          reportType === "user"
            ? business?.userId && typeof business.userId === "string"
              ? business.userId
              : typeof business?.userId === "object" && business?.userId?._id
                ? business.userId._id
                : ""
            : business?._id || ""
        }
        itemName={
          reportType === "user"
            ? business?.userId && typeof business.userId === "object"
              ? business.userId.fullName || "User"
              : "User"
            : business?.title?.substring(0, 50) || "Business"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  optionModalContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileHeaderCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileAvatarContainer: {
    marginBottom: 16,
  },
  profileAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#4B5563",
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  callButton: {
    backgroundColor: "#15803D",
  },
  callButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  messageButton: {
    borderWidth: 1,
    backgroundColor: "white",
  },
  messageButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1F2937",
  },
  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productThumbContainer: {
    marginRight: 12,
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1F2937",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
  },
  viewFullMenuButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewFullMenuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803D",
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 12,
  },
  detailIconBox: {
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  iconColumn: {
    flexDirection: "column",
    paddingRight: 12,
    justifyContent: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
});
