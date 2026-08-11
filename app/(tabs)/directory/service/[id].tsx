import ActionButton from "@/components/inputs/ActionButton";
import FormSheetModal from "@/components/modals/FormSheetModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import ReportModal from "@/components/modals/ReportModal";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";
import { CustomerReview } from "@/components/reviews/CustomerReview";
import { Card } from "@/components/UI/Card";
import InfoBanner from "@/components/UI/InfoBanner";
import { usePermissions } from "@/hooks/usePermissions";
import { calculateAvgRating, callUser } from "@/lib/utils";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { PricingRow, WorkingHour } from "@/types/business.type";
import { Review } from "@/types/common.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RecommendationCard = memo(
  ({ createdBy, isProfessionalService, theme }: any) => (
    <Card style={styles.recommendationCard}>
      <Ionicons
        name="heart-outline"
        size={18}
        color={theme.colors.primary}
        style={{ marginRight: 8 }}
      />
      <Text
        style={[styles.recommendationText, { color: theme.colors.textPrimary }]}
      >
        {isProfessionalService ? "Recomended" : "Verified"} by
        <Text style={{ fontWeight: "bold" }}> {createdBy.fullName}</Text>
      </Text>
    </Card>
  ),
);
RecommendationCard.displayName = "RecommendationCard";

const DetailsCard = memo(
  ({
    timing,
    address,
    rate,
    isProfessionalService,
    pricingRates,
    theme,
  }: any) => (
    <Card style={styles.detailsCard}>
      {/* Timings */}
      {isProfessionalService && (
        <View style={styles.detailRow}>
          <Ionicons
            name="time"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Timings
            </Text>
            {timing?.map((row: WorkingHour, index: number) => (
              <Text
                key={index}
                style={[
                  styles.detailValue,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {row.displayText}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      {isProfessionalService && (
        <View style={styles.detailRow}>
          <Ionicons
            name="location"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Location
            </Text>
            <Text
              style={[styles.detailValue, { color: theme.colors.textPrimary }]}
            >
              {address}
            </Text>
          </View>
        </View>
      )}

      {/* Fee */}
      {isProfessionalService && (
        <View style={styles.detailRow}>
          <Ionicons
            name="cash"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Consultation Fee
            </Text>
            <Text
              style={[styles.detailValue, { color: theme.colors.textPrimary }]}
            >
              ₹{rate} per visit
            </Text>
          </View>
        </View>
      )}

      {!isProfessionalService && (
        <View style={{ gap: 6 }}>
          <Text>Community Estimates:</Text>
          {pricingRates.map((it: PricingRow, idx: number) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 2,
              }}
              key={idx}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 15, marginRight: 4 }}
              >
                ₹{it?.rate}
              </Text>
              <Text style={{ fontSize: 15, color: theme.colors.textPrimary }}>
                {it?.subtext}
              </Text>
            </View>
          ))}
          <Text>Charges may vary based on workload.</Text>
        </View>
      )}
    </Card>
  ),
);
DetailsCard.displayName = "DetailsCard";

export default function ServiceProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { hasOnly } = usePermissions();
  const isGuest = hasOnly([UserRole.GUEST]);

  const { id } = useLocalSearchParams();
  const professionalServiceList = useDailyHelperStore((s) => s.dailyHelperList);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<"service" | "user" | null>(null);
  const currentUser = useUserStore((s) => s.user);
  const addDailyServiceReview = useDailyHelperStore(
    (s) => s.addDailyServiceReview,
  );

  const selectedService = useMemo(() => {
    if (!id) return null;

    const matchingService = professionalServiceList?.find((p) => p._id === id);
    return matchingService || null;
  }, [id, professionalServiceList]);

  const isProfessionalService =
    selectedService?.serviceType === "professional-services";

  const handleCall = useCallback(() => {
    if (selectedService?.phone) {
      callUser(selectedService?.phone);
    }
  }, [selectedService?.phone]);

  // Calculate top padding based on safe area insets and platform
  const topPadding = useMemo(() => {
    const defaultPadding = Platform.OS === "ios" ? 40 : 24;
    return Math.max(insets.top, defaultPadding);
  }, [insets.top]);

  // Local reviews state for immediate UI update
  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  // Get reviews from store - reviews are populated when business data is fetched
  const reviews = useMemo(() => {
    if (!id) return [];
    // Merge reviews, but filter out duplicates (by userId, comment, and rating)
    const base = selectedService?.reviews || [];
    if (localReviews.length === 0) return base;
    const uniqueLocal = localReviews.filter(
      (local) =>
        !base.some(
          (r) =>
            r.userId === local.userId &&
            r.comment === local.comment &&
            r.rating === local.rating,
        ),
    );
    return [...base, ...uniqueLocal];
  }, [id, selectedService?.reviews, localReviews]);

  const handleOpenAddReviewModal = useCallback(() => {
    setShowAddReviewModal(true);
  }, []);

  const handleCloseAddReviewModal = useCallback(() => {
    setShowAddReviewModal(false);
  }, []);

  const handleOptionsPress = useCallback(() => {
    setOptionsModalVisible(true);
  }, []);

  const handleCloseOptionsModal = useCallback(() => {
    setOptionsModalVisible(false);
  }, []);

  const handleReportService = useCallback(() => {
    setReportType("service");
    setReportVisible(true);
    setOptionsModalVisible(false);
  }, []);

  const handleReportUser = useCallback(() => {
    setReportType("user");
    setReportVisible(true);
    setOptionsModalVisible(false);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setReportVisible(false);
  }, []);

  const handleAddReview = useCallback(
    (
      newReview: Omit<
        Review,
        "_id" | "createdAt" | "userName" | "profilePhotoUrl"
      >,
    ) => {
      if (!selectedService?._id || !currentUser?._id) {
        console.warn("Missing service or user info for review");
        return;
      }
      const updatedReview: Review = {
        userName: currentUser.fullName || "Anonymous",
        userId: currentUser._id,
        profilePhotoUrl: currentUser.profilePhotoUrl || "",
        ...newReview,
      };
      addDailyServiceReview(selectedService._id, updatedReview).then(
        (response: any) => {
          if (response && response.review) {
            setLocalReviews((prev) => [...prev, response.review]);
          } else {
            setLocalReviews((prev) => [...prev, updatedReview]);
          }
          setShowSuccessModal(true);
        },
      );
    },
    [addDailyServiceReview, selectedService?._id, currentUser],
  );

  const ProfileHeaderCard = useMemo(() => {
    return (
      <Card style={styles.profileHeaderCard}>
        <View style={styles.profileAvatarContainer}>
          <Image
            source={{ uri: selectedService?.images?.[0] }}
            style={styles.profileAvatar}
          />
        </View>
        <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
          {selectedService?.name}
        </Text>
        <Text style={[styles.profileSubtitle, { color: theme.colors.primary }]}>
          {selectedService?.categoryId}
        </Text>

        <View style={styles.ratingContainer}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={
                  i < Math.round(calculateAvgRating(reviews))
                    ? "star"
                    : "star-outline"
                }
                size={16}
                color="#FFB800"
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
          <Text
            style={[styles.ratingText, { color: theme.colors.textPrimary }]}
          >
            {calculateAvgRating(reviews).toFixed(1)} ({reviews.length} Reviews)
          </Text>
        </View>
      </Card>
    );
  }, [reviews]);

  const reviewsSection = useMemo(() => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.reviewTitle, { color: theme.colors.textPrimary }]}>
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
  }, [reviews]);

  const ActionCta = useMemo(() => {
    if (isGuest) {
      return (
        <InfoBanner
          type="warning"
          title="Guest Mode"
          description="You cannot make calls or book appointments in guest mode. Please register to access this feature."
        />
      );
    }
    return (
      <View style={styles.actionButtonsRow}>
        <ActionButton
          title={isProfessionalService ? "Book Appointment" : "Call"}
          onPress={handleCall}
          fullWidth
          containerStyle={[
            styles.actionButton,
            styles.callButton,
            { backgroundColor: theme.colors.primary },
          ]}
          leftIcon={<Ionicons name="call" size={20} color="white" />}
          textStyle={styles.callButtonText}
        />
        {isProfessionalService && (
          <ActionButton
            title={""}
            onPress={() => {}}
            containerStyle={[
              styles.actionButton,
              styles.mapButton,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
            leftIcon={
              <Ionicons
                name="location"
                size={20}
                color={theme.colors.primary}
              />
            }
          />
        )}
      </View>
    );
  }, [isGuest, isProfessionalService, handleCall, theme]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: topPadding },
      ]}
    >
      {/* Fixed Header (non-scrollable) */}
      <View style={styles.headerRow}>
        <Text
          style={{
            fontWeight: "bold",
            fontSize: 24,
            padding: 16,
            paddingBottom: 0,
          }}
        >
          Profile
        </Text>
        <View style={styles.iconColumn}>
          <Pressable
            onPress={handleOptionsPress}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityLabel="More options"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {ProfileHeaderCard}

        {/* Action Buttons */}
        {isGuest ? (
          <InfoBanner
            title="Limited Access"
            description={`Your current account type does not have access to view service providers. Please contact support to upgrade your account.`}
            type="danger"
            containerStyle={styles.infoBanner}
          />
        ) : (
          <View style={styles.section}>{ActionCta}</View>
        )}

        {/* Recommendation Card */}
        <View style={styles.section}>
          <RecommendationCard
            createdBy={selectedService?.createdBy}
            isProfessionalService={isProfessionalService}
            theme={theme}
          />
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Details & Timings
          </Text>
          <DetailsCard
            timing={selectedService?.workingHours}
            address={selectedService?.address}
            rate={selectedService?.rate}
            isProfessionalService={isProfessionalService}
            pricingRates={selectedService?.pricingRates}
            theme={theme}
          />
        </View>

        {/* Customer Reviews */}
        {reviewsSection}
      </ScrollView>

      <FormSheetModal
        visible={optionsModalVisible}
        onClose={handleCloseOptionsModal}
        title=""
        subtitle=""
      >
        <View style={styles.optionModalContent}>
          <TouchableOpacity
            onPress={handleReportService}
            style={styles.optionItem}
          >
            <Ionicons name="flag-outline" size={24} color="#374151" />
            <Text style={styles.optionText}>Report Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReportUser}
            style={styles.optionItem}
          >
            <Ionicons name="person-outline" size={24} color="#374151" />
            <Text style={styles.optionText}>Report User</Text>
          </TouchableOpacity>
        </View>
      </FormSheetModal>

      {/* Add Review Modal */}
      <AddReviewModal
        visible={showAddReviewModal}
        onClose={handleCloseAddReviewModal}
        onSubmit={handleAddReview}
        businessName={"test"}
        businessId={"0000"}
        userId={"000"}
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
        reportType={reportType || "service"}
        itemId={
          reportType === "user"
            ? selectedService?.createdBy &&
              typeof selectedService.createdBy === "string"
              ? selectedService.createdBy
              : typeof selectedService?.createdBy === "object"
                ? selectedService.createdBy._id || ""
                : ""
            : selectedService?._id || ""
        }
        itemName={
          reportType === "user"
            ? selectedService?.createdBy &&
              typeof selectedService.createdBy === "object"
              ? selectedService.createdBy.fullName || "User"
              : "User"
            : selectedService?.name?.substring(0, 50) || "Service"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  profileHeaderCard: {
    alignItems: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1F2937",
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
  profileAvatarContainer: {
    marginBottom: 12,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  callButton: {
    flex: 1,
    paddingVertical: 14,
  },
  callButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  mapButton: {
    width: 50,
    height: 50,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  detailsCard: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
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
});
