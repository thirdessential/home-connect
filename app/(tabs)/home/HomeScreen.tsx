import { BUSINESS_LIMITS } from "@/assets/constants/common.constant";
import { PRODUCTS_CONSTANTS } from "@/assets/constants/products.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import ProductCarousel from "@/components/business/ProductCarousel";
import AdminDashboardButton from "@/components/home/AdminDashboardButton";
import FeedList from "@/components/home/FeedList";
import HomeFilterChips, { HomeFeedFilter } from "@/components/UI/HomeFilterChips";
import { filterHomeFeed, useHomeFeed } from "@/hooks/useHomeFeed";
import InfoBanner from "@/components/UI/InfoBanner";
import Skeleton from "@/components/UI/Skeleton";
import WelcomeVerificationCard from "@/components/UI/WelcomeVerificationCard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminStore } from "@/store/useAdminStore";
import { useBusinessRegistrationStore } from "@/store/useBusinessRegistrationStore";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useToast } from "@/components/common/Toast";
import { checkInternetConnection } from "@/lib/connectivity";

const handlePressProductItem = () => {};

function HomeScreen() {
  const t = useTheme();
  const { showToast } = useToast();
  const userId = useUserStore((state) => state.user?._id);
  const selectedSocietyId = useSocietyStore((state) => state.selectedSociety?._id);
  // Refresh user/business status on every Home focus. Feed loading is handled
  // once below so the focus effect cannot race it with a duplicate API call.
  useFocusEffect(
    useCallback(() => {
      checkInternetConnection().then((online) => {
        if (!online) return;
        if (userId) fetchUser(userId).catch(() => {});
        loadCurrentBusiness().catch(() => {});
      });
      // Home stays mounted+focused while backgrounded (e.g. admin approves
      // while the user is away); focus alone won't re-fire, so also refetch
      // when the app comes back to foreground.
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active" && userId) {
          checkInternetConnection().then((online) => {
            if (online) fetchUser(userId).catch(() => {});
          });
        }
      });
      return () => sub.remove();
    }, [userId, selectedSocietyId]),
  );
  // Android hardware back on Home: first press warns, second press (within
  // 2s) exits the app. iOS has no hardware back key, so this is a no-op there.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      let lastPress = 0;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        const now = Date.now();
        if (now - lastPress < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastPress = now;
        showToast("Press back again to exit", "info");
        return true;
      });
      return () => sub.remove();
    }, [showToast]),
  );
  const userVerification = useUserStore(
    (state) => state.user?.isAddressVerified,
  );
  const verificationSubmittedAt = useUserStore(
    (state) => state.user?.residentVerification?.submittedAt,
  );
  const pendingBusinessCount = useUserStore(
    (state) => state.user?.pendingBusinessCount,
  );
  const businessStatus = useUserStore((state) => state.user?.businessStatus);
  const fetchUser = useUserStore((state) => state.fetchUser);
  // MySQL business registrations live in their own store, not on user.businessStatus.
  const mysqlBusinessStatus = useBusinessRegistrationStore((state) => state.business?.business_status);
  const loadCurrentBusiness = useBusinessRegistrationStore((state) => state.loadCurrent);
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
  const updateExpiredDeals = useWholesaleDealStore(
    (state) => state.updateExpiredDeals,
  );
  // Feeds the pending-count badge on the admin FAB — admins only.
  const getAllPendingContent = useAdminStore(
    (state) => state.getAllPendingContent,
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
  // A submitted business (pending admin review) counts as "already submitted",
  // so Home must stop nudging the user to verify.
  const hasPendingBusiness =
    businessStatus?.status === verificationStatus.PENDING ||
    mysqlBusinessStatus === "pending" ||
    (pendingBusinessCount ?? 0) > 0;

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

  // Start in loading state to avoid a one-render "No Posts Yet" flash before
  // the persisted feed store or the first network result is available.
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>("all");
  const hasCachedFeeds = useFeedsStore((state) =>
    !!selectedSocietyId && state.isCacheValid(selectedSocietyId),
  );

  // Single consolidated fetch — Promise.allSettled waits for all, uses successes, ignores failures
  const fetchAllData = useCallback(async (sid: string, force = false) => {
    await Promise.allSettled([
      updateExpiredDeals(sid),
      fetchFeedsBySociety(sid, force),
      getAllDealsBySocietyId(sid),
      fetchBusinessBySocietyId(sid),
      getAllApprovedDailyServices(sid),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pending-request count behind the admin FAB badge. Kept out of fetchAllData
  // so the request only ever fires for admins, and re-runs on its own if roles
  // arrive after mount (initSession can refresh them a moment later).
  useEffect(() => {
    if (!isAdmin || !selectedSocietyId) return;
    getAllPendingContent(selectedSocietyId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedSocietyId]);

  // Pull-to-refresh. The feed is the only thing the spinner waits for; the
  // connectivity probe runs alongside it (not before it) and only cuts the
  // spinner short — with a toast — when the device is really offline. Deals,
  // businesses, daily services and the admin badge refresh in the background
  // and update their own stores as they land. Cached content stays on screen
  // throughout.
  const refreshInFlight = useRef(false);
  const onRefresh = useCallback(async () => {
    if (!userId || !selectedSocietyId || refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    let offline = false;
    checkInternetConnection().then((online) => {
      if (online) return;
      offline = true;
      setRefreshing(false);
      refreshInFlight.current = false;
      showToast("No Internet Connection", "warning");
    });
    try {
      await fetchFeedsBySociety(selectedSocietyId, true);
    } finally {
      if (!offline) {
        setRefreshing(false);
        refreshInFlight.current = false;
      }
    }
    Promise.allSettled([
      updateExpiredDeals(selectedSocietyId),
      getAllDealsBySocietyId(selectedSocietyId),
      fetchBusinessBySocietyId(selectedSocietyId),
      getAllApprovedDailyServices(selectedSocietyId),
      ...(isAdmin ? [getAllPendingContent(selectedSocietyId)] : []),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedSocietyId, isAdmin]);

  // Sync user business status — once per session
  useEffect(() => {
    if (!selectedSocietyId) return;

    const feedsCacheValid = useFeedsStore
      .getState()
      .isCacheValid(selectedSocietyId);
    // Cached content renders immediately. The network check and refresh happen
    // in the background, so an offline start never replaces it with No Data.
    setIsLoading(!feedsCacheValid);
    checkInternetConnection().then((online) => {
      if (!online) {
        setIsLoading(false);
        return;
      }
      lastRefreshRef.current = Date.now();
      fetchAllData(selectedSocietyId, true).finally(() => setIsLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSocietyId]);

  // Background refresh when returning to Home or foregrounding the app while
  // Home is focused. Cached feed stays on screen; throttled to avoid duplicate calls.
  const lastRefreshRef = useRef(Date.now());
  useFocusEffect(
    useCallback(() => {
      if (!selectedSocietyId) return;
      const refresh = async () => {
        if (Date.now() - lastRefreshRef.current < 30000) return;
        lastRefreshRef.current = Date.now();
        if (await checkInternetConnection()) {
          useFeedsStore.getState().fetchFeedsBySociety(selectedSocietyId, true);
        }
      };
      refresh();
      const sub = AppState.addEventListener("change", (st) => {
        if (st === "active") refresh();
      });
      return () => sub.remove();
    }, [selectedSocietyId]),
  );

  // Real API when it has data, isolated dummy layer when it doesn't.
  const { items: homeItems, actions: homeActions } = useHomeFeed();
  const visibleFeeds = useMemo(
    () => filterHomeFeed(homeItems, feedFilter),
    [homeItems, feedFilter],
  );

  // Everything above the feed: status banners, filter chips, deals carousel.
  const listHeader = useMemo(
    () => (
      <View>
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
        {isGuest && !hasSubmittedVerification && !hasPendingBusiness && (
          <WelcomeVerificationCard />
        )}
        {pendingReview && (
          <InfoBanner
            title="Verification Pending"
            description="Your request has been submitted. Please wait for admin approval."
            backgroundColor="#ffefb01a"
            borderColor="#db8b00"
            titleColor="#000000"
            descriptionColor="#030303"
          />
        )}
        {hasPendingBusiness && !hasExcessPendingBusinesses && (
          <InfoBanner
            variant="card"
            icon="briefcase-outline"
            title="Verification Pending"
            description="Your business verification request has been submitted. Please wait for admin approval."
          />
        )}
        {hasExcessPendingBusinesses && (
          <InfoBanner
            title="Business Verification Pending"
            description={`You have ${pendingBusinessCount} businesses pending verification. Please wait for admin approval before adding more.`}
            icon="time-outline"
            backgroundColor="#FFF8E7" // soft amber (informational, not an error)
            borderColor="#F5D98A"
            titleColor="#7A4A00" // dark amber/brown
            descriptionColor="#7A4A00"
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
      </View>
    ),
    [
      rejectedUser,
      userVerification?.rejectionReason,
      isGuest,
      hasSubmittedVerification,
      hasPendingBusiness,
      pendingReview,
      hasExcessPendingBusinesses,
      pendingBusinessCount,
      feedFilter,
      activeDeals,
      wholesaleDealsLoading,
    ],
  );

  // Show skeleton loading until all data is loaded — skip during pull-to-refresh
  if (!refreshing && isLoading && !hasCachedFeeds) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.colors.white }}>
        <View style={{ paddingHorizontal: t.spacing.l }}>
          {/* Skeleton for carousel section */}
          <View style={{ marginBottom: 16 }}>
            <Skeleton width="100%" height={180} borderRadius={12} />
          </View>

          {/* Admin-specific skeleton loading */}
          {isAdmin && (
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

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <FeedList
        items={visibleFeeds}
        actions={homeActions}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={listHeader}
        contentPaddingBottom={showVerificationChrome ? 76 : 24}
      />

      {/* Role-gated: renders nothing unless the session carries an admin role. */}
      {/* <AdminDashboardButton bottom={showVerificationChrome ? 110 : 24} /> */}

      {showVerificationChrome && (
        <>
          {/* {!pendingReview && !hasPendingBusiness && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: t.colors.brand }]}
              onPress={() => router.push("/onboarding/verify-role")}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={22} color={t.colors.onBrand} />
              <Text style={[styles.fabLabel, { color: t.colors.onBrand }]}>Verify Now</Text>
            </TouchableOpacity>
          )} */}

          <View style={[styles.lockStrip, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={t.colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockStripTitle, { color: t.colors.textPrimary }]}>
                {pendingReview || hasPendingBusiness
                  ? "Verification Pending"
                  : "Verification is required to interact and access all features."}
              </Text>
              <Text style={[styles.lockStripSubtitle, { color: t.colors.textSecondary }]}>
                {pendingReview || hasPendingBusiness
                  ? "Your verification request has been submitted and is waiting for admin approval."
                  : "Your community. Your safety."}
              </Text>
              {/* Verify Now only exists while nothing has been submitted (or after a rejection). */}
              {!(pendingReview || hasPendingBusiness) && (
              <View style={styles.fabWr}> 
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: t.colors.brand }]}
                onPress={() => router.push("/onboarding/verify-role")}
                activeOpacity={0.85}
              >
                <Ionicons name="shield-checkmark" size={22} color={t.colors.onBrand} />
                <Text style={[styles.fabLabel, { color: t.colors.onBrand }]}>Verify Now</Text>
              </TouchableOpacity>
              </View>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export default memo(HomeScreen);

const styles = StyleSheet.create({
  fabWr:{
    flexDirection: "row",
    alignItems: "center",
  },
  fab: {
    // position: "absolute",
    // right: 16,
    // bottom: 58,
    flexDirection: "row",
    // alignItems: "center",
    marginTop: 10,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 6,
    // elevation: 6,
    // width: 150,
    // textAlign: 'center'
  },
  fabLabel: {
    fontSize: 13,
    fontFamily: "Manrope_700Bold",
  },
  lockStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  lockStripTitle: {
    fontSize: 12.5,
    fontFamily: "Manrope_600SemiBold",
  },
  lockStripSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
});
