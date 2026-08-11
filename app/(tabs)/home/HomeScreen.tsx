import { BUSINESS_LIMITS } from "@/assets/constants/common.constant";
import { PRODUCTS_CONSTANTS } from "@/assets/constants/products.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import ProductCarousel from "@/components/business/ProductCarousel";
import NoDataCard from "@/components/common/NoDataCard";
import ProductCard from "@/components/product/ProductCard";
import HomeFilterChips, { HomeFeedFilter } from "@/components/UI/HomeFilterChips";
import InfoBanner from "@/components/UI/InfoBanner";
import PollCard from "@/components/UI/PollCard";
import PostCard from "@/components/UI/PostCard";
import Skeleton from "@/components/UI/Skeleton";
import WelcomeVerificationCard from "@/components/UI/WelcomeVerificationCard";
import { usePermissions } from "@/hooks/usePermissions";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { FeedItem } from "@/types/feeds.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const handlePressProductItem = () => {};

const matchesFilter = (item: FeedItem, filter: HomeFeedFilter) => {
  if (filter === "all") return true;
  if (filter === "polls") return item.type === "poll";
  if (filter === "events") return item.type === "event";
  const hasImages = Array.isArray(item.images) && item.images.length > 0;
  if (filter === "photos") return hasImages;
  if (filter === "updates") return item.type === "post" && !hasImages;
  // "deals" has no corresponding feed item — wholesale deals render via the
  // ProductCarousel above, not as feed cards.
  return false;
};

function HomeScreen() {
  const t = useTheme();
  const userId = useUserStore((state) => state.user?._id);
  const userVerification = useUserStore(
    (state) => state.user?.isAddressVerified,
  );
  const verificationSubmittedAt = useUserStore(
    (state) => state.user?.residentVerification?.submittedAt,
  );
  const pendingBusinessCount = useUserStore(
    (state) => state.user?.pendingBusinessCount,
  );
  const selectedSocietyId = useSocietyStore(
    (state) => state.selectedSociety?._id,
  );
  const activeDeals = useWholesaleDealStore((state) => state.activeDeals);
  const wholesaleDealsLoading = useWholesaleDealStore((state) => state.loading);
  const { hasRole, hasAnyRole } = usePermissions();
  const getAllDealsBySocietyId = useWholesaleDealStore(
    (state) => state.getAllDealsBySocietyId,
  );
  const fetchFeedsBySociety = useFeedsStore(
    (state) => state.fetchFeedsBySociety,
  );
  const fetchBusinessBySocietyId = useProductStore(
    (state) => state.fetchBusinessBySocietyId,
  );
  const getAllApprovedDailyServices = useDailyHelperStore(
    (state) => state.getAllApprovedDailyServices,
  );
  const feeds = useFeedsStore((state) => state.feeds);
  const updateExpiredDeals = useWholesaleDealStore(
    (state) => state.updateExpiredDeals,
  );

  // Role only changes to "resident" once an admin approves — so a submitted-
  // but-still-pending user is still technically a "guest" role-wise. Use the
  // actual submission timestamp to tell "never submitted" apart from
  // "awaiting admin review".
  const hasSubmittedVerification = !!verificationSubmittedAt;
  const rejectedUser = userVerification?.status === verificationStatus.REJECTED;
  const pendingReview =
    hasSubmittedVerification && userVerification?.status === verificationStatus.PENDING;
  const hasExcessPendingBusinesses =
    (pendingBusinessCount ?? 0) >= BUSINESS_LIMITS.MAX_BUSINESSES_PER_USER;

  // Memoize admin check so it's a stable boolean, not a new function call each render
  const isAdmin = useMemo(
    () => hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
    [hasAnyRole],
  );

  const isGuest = useMemo(() => hasRole(UserRole.GUEST), [hasRole]);

  // Drives the top banner, floating FAB and bottom lock strip — anyone who
  // isn't yet an approved resident/admin sees the verification chrome.
  const showVerificationChrome =
    isGuest || (!isAdmin && userVerification?.status !== verificationStatus.APPROVED);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>("all");

  // Single consolidated fetch — Promise.allSettled waits for all, uses successes, ignores failures
  const fetchAllData = useCallback(async (sid: string) => {
    await Promise.allSettled([
      updateExpiredDeals(sid),
      fetchFeedsBySociety(sid),
      getAllDealsBySocietyId(sid),
      fetchBusinessBySocietyId(sid),
      getAllApprovedDailyServices(sid),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    if (!userId || !selectedSocietyId) return;
    setRefreshing(true);
    await fetchAllData(selectedSocietyId);
    setRefreshing(false);
  }, [userId, selectedSocietyId, fetchAllData]);

  // Sync user business status — once per session
  useEffect(() => {
    if (!selectedSocietyId) return;

    const feedsCacheValid = useFeedsStore
      .getState()
      .isCacheValid(selectedSocietyId);
    const dealsCacheValid = (() => {
      const { lastFetchedAt } = useWholesaleDealStore.getState();
      return !!lastFetchedAt && Date.now() - lastFetchedAt < 15 * 60 * 1000;
    })();

    // If both caches are valid, skip the loading spinner entirely
    if (feedsCacheValid && dealsCacheValid) {
      fetchAllData(selectedSocietyId); // still refetch silently in background
      return;
    }

    // Cache is stale or empty — show spinner and fetch
    setIsLoading(true);
    fetchAllData(selectedSocietyId).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSocietyId]);

  const memoizedComponents = useMemo(() => {
    const items = feeds
      .filter((item: FeedItem) => matchesFilter(item, feedFilter))
      .map((item: FeedItem) => {
        if (item.type === "post") {
          return <PostCard key={item._id} postData={item} />;
        }
        if (item.type === "poll") {
          return <PollCard key={item._id} pollId={item._id} />;
        }
        if (item.type === "event") {
          return (
            <ProductCard
              key={`event-${item._id}`}
              productDetails={item}
              type="event"
            />
          );
        }
        return null;
      })
      .filter(Boolean);

    if (items.length === 0) {
      return (
        <NoDataCard
          iconName="newspaper-outline"
          message="No Posts Yet"
          subText="There's nothing to show here yet. Check back later for updates from your society."
        />
      );
    }

    return items;
  }, [feeds, feedFilter]);
  // Show skeleton loading until all data is loaded — skip during pull-to-refresh
  if (!refreshing && isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }}>
        <View style={{ paddingHorizontal: t.spacing.l }}>
          {/* Skeleton for carousel section */}
          <View style={{ marginBottom: 16 }}>
            <Skeleton width="100%" height={180} borderRadius={12} />
          </View>

          {/* Admin-specific skeleton loading */}
          {isAdmin && (
            <>
              {/* Skeleton for stats/users section */}
              <View style={{ marginBottom: 16 }}>
                <Skeleton
                  width="100%"
                  height={16}
                  borderRadius={8}
                  style={{ marginBottom: 8 }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Skeleton width="48%" height={80} borderRadius={12} />
                  <Skeleton width="48%" height={80} borderRadius={12} />
                </View>
              </View>
            </>
          )}

          {/* Regular user or common skeleton for feed items */}
          {[1, 2, 3].map((index) => (
            <View key={index} style={{ marginBottom: 16 }}>
              <Skeleton
                width="100%"
                height={20}
                borderRadius={8}
                style={{ marginBottom: 8 }}
              />
              <Skeleton
                width="80%"
                height={16}
                borderRadius={8}
                style={{ marginBottom: 12 }}
              />
              <Skeleton width="100%" height={200} borderRadius={12} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // const getPushToken = async () => {
  //   // Alert.alert("push notifinction")
    
  //   const { status } = await Notifications.requestPermissionsAsync();

  //   if (status !== "granted") {
  //     console.log("Permission denied");
  //     return;
  //   }

  //   const token = await Notifications.getExpoPushTokenAsync();

  //   console.log("EXPO TOKEN =>", token.data);
  // };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: showVerificationChrome ? 76 : 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.primary}
            colors={[t.colors.primary]}
          />
        }
      >
        <View style={{ paddingHorizontal: t.spacing.l }}>
          {rejectedUser && (
            <InfoBanner
              title="Request Rejected"
              description={`Your approval is rejected by the admin due to ${userVerification?.rejectionReason}, please contact support for further assistance.`}
              backgroundColor="#FEF3C7" // amber-100
              borderColor="#F59E0B" // amber-500
              titleColor="#92400E" // amber-700
              descriptionColor="#92400E" // amber-700
            />
          )}
          {isGuest && !hasSubmittedVerification && <WelcomeVerificationCard />}
          {pendingReview && (
            <InfoBanner
              title="Verification Pending"
              description="Your request has been submitted. Please wait for admin approval."
              backgroundColor="#FEF3C7" // amber-100
              borderColor="#F59E0B" // amber-500
              titleColor="#92400E" // amber-700
              descriptionColor="#92400E" // amber-700
            />
          )}
          {hasExcessPendingBusinesses && (
            <InfoBanner
              title="Business Verification Pending"
              description={`You have ${pendingBusinessCount} businesses pending verification. Please wait for admin approval before adding more.`}
              backgroundColor="#FEE2E2" // red-100
              borderColor="#EF4444" // red-500
              titleColor="#991B1B" // red-800
              descriptionColor="#991B1B" // red-800
            />
          )}

          <HomeFilterChips selected={feedFilter} onSelect={setFeedFilter} />

          <ProductCarousel
            products={activeDeals ?? []}
            onPressProductItem={handlePressProductItem}
            ctaName={PRODUCTS_CONSTANTS.VIEW_DEAL_}
            key={PRODUCTS_CONSTANTS.WHOLESALE_DEAL_ID}
            loading={wholesaleDealsLoading}
          />
          {memoizedComponents}
        </View>
      </ScrollView>

      {showVerificationChrome && (
        <>
          {!pendingReview && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: t.colors.primary }]}
              onPress={() => router.push("/onboarding/verify-role")}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
              <Text style={styles.fabLabel}>Verify Now</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.lockStrip, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color="#EA580C" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockStripTitle, { color: t.colors.textPrimary }]}>
                {pendingReview
                  ? "Your request is pending admin approval."
                  : "Verification is required to interact and access all features."}
              </Text>
              <Text style={[styles.lockStripSubtitle, { color: t.colors.textSecondary }]}>
                Your community. Your safety.
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export default memo(HomeScreen);

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  lockStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  lockStripTitle: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  lockStripSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
