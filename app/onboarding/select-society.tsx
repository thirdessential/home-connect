// app/onboarding/select-society.tsx
import {
  SELECT_SOCIETY_SCREEN,
  TERRACE_COLORS,
} from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useToast } from "@/components/common/Toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUiStore } from "@/store/useUiStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Society } from "@/types/society.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// A society plus the extra presentational fields shown in the design.
type SocietyListItem = Society & { image?: string; distance?: string };

const keyExtractor = (item: SocietyListItem) => item._id;

const SOCIETY_FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=300";

export default function SelectSociety() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // Narrow selectors — each subscribes only to the slice it needs
  const societies = useSocietyStore((s) => s.societies);
  const storeLoading = useSocietyStore((s) => s.loading);
  const storeErrorStep = useSocietyStore((s) => s.errorStep);
  const getAllSociety = useSocietyStore((s) => s.getAllSociety);
  const selectSocietyOnServer = useSocietyStore((s) => s.selectSociety);
  const setSelectedSociety = useSocietyStore((s) => s.setSelectedSociety);
  const userId = useUserStore((s) => s.user?._id);
  const setSocietySwitching = useUiStore((s) => s.setSocietySwitching);
  const clearAllStoreData = useAuthStore((s) => s.clearAllStoreData);

  const [isSelecting, setIsSelecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref instead of state — guards the initial fetch without triggering a re-render
  const didFetchRef = useRef(false);
  // Refs for values read inside stable callbacks — avoids stale closures with [] deps
  const isSelectingRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (societies.length === 0 && !didFetchRef.current) {
      didFetchRef.current = true;
      getAllSociety().catch((error) => {
        console.error("Failed to load societies:", error?.message || error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The society list is gated server-side: if OTP verification or the saved
  // location is missing, send the user back to complete that step instead of
  // leaving them stuck on an empty/errored list.
  useEffect(() => {
    if (storeErrorStep === "verify-otp") {
      router.replace("/(auth)/login");
    } else if (storeErrorStep === "save-location") {
      router.replace("/onboarding/location-permission");
    }
  }, [storeErrorStep, router]);

  const listData: SocietyListItem[] = societies as SocietyListItem[];

  const handleChooseSociety = useCallback(
    async (society: Society) => {
      if (isSelectingRef.current) return;
      if (!userIdRef.current) {
        console.warn("User ID is undefined. Cannot select society.");
        router.replace("/(auth)/login");
        return;
      }
      isSelectingRef.current = true;
      setIsSelecting(true);
      setSocietySwitching(true);
      try {
        const confirmedSociety = await selectSocietyOnServer(society._id);
        if (!confirmedSociety) {
          throw new Error("Failed to select society");
        }
        clearAllStoreData();
        setSelectedSociety(confirmedSociety, confirmedSociety?.towers || []);
        router.replace("/(tabs)/home");
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "An error occurred while selecting society";
        setErrorMessage(errorMsg);
        isSelectingRef.current = false;
        setIsSelecting(false);
        setSocietySwitching(false);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    },
    [clearAllStoreData, router, selectSocietyOnServer, setSelectedSociety, setSocietySwitching],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: SocietyListItem }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isSelecting}
        onPress={() => handleChooseSociety(item)}
        style={styles.societyCard}
      >
        <Image
          source={{ uri: item.image ?? SOCIETY_FALLBACK_IMAGE }}
          style={styles.societyImage}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.societyInfo}>
          <Text style={styles.societyName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.locality ? (
            <Text style={styles.societyLocality} numberOfLines={1}>
              {item.locality}
            </Text>
          ) : null}
          {item.distance ? (
            <Text style={styles.societyDistance}>{item.distance}</Text>
          ) : null}
        </View>
        <View style={{marginRight: 10}}>
          <Ionicons
            name="chevron-forward"
            size={getWidth(20)}
            color={TERRACE_COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>
    ),
    [isSelecting, handleChooseSociety],
  );

  const ListHeader = useMemo(
    () => (
      <View>
        <TerraceHeader compact onBack={goBack} />

        <Text style={styles.title}>{SELECT_SOCIETY_SCREEN.title}</Text>
        <Text style={styles.subtitle}>{SELECT_SOCIETY_SCREEN.subtitle}</Text>

        {/* Location card */}
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.pinCircle}>
              <Ionicons
                name="location"
                size={getWidth(22)}
                color={TERRACE_COLORS.orange}
              />
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationTitle}>
                {SELECT_SOCIETY_SCREEN.yourLocation}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {SELECT_SOCIETY_SCREEN.defaultAddress}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              hitSlop={8}
              onPress={() => showToast(SELECT_SOCIETY_SCREEN.manualToast, "info")}
            >
              <Text style={styles.changeText}>{SELECT_SOCIETY_SCREEN.change}</Text>
              <Ionicons
                name="pencil"
                size={getWidth(15)}
                color={TERRACE_COLORS.orange}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{SELECT_SOCIETY_SCREEN.or}</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={styles.manualRow}
            onPress={() => showToast(SELECT_SOCIETY_SCREEN.manualToast, "info")}
          >
            <Ionicons
              name="location-outline"
              size={getWidth(18)}
              color={TERRACE_COLORS.orange}
            />
            <Text style={styles.manualText}>
              {SELECT_SOCIETY_SCREEN.enterManually}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          {SELECT_SOCIETY_SCREEN.activeSocieties}
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <ErrorMessage
              type="unknown"
              message={errorMessage}
              showIcon
              iconName="alert-circle-outline"
            />
          </View>
        ) : null}
      </View>
    ),
    [errorMessage, goBack, showToast],
  );

  const ListFooter = useMemo(
    () => (
      <View>
        <TouchableOpacity
          style={styles.cantFindCard}
          activeOpacity={0.8}
          onPress={() => showToast(SELECT_SOCIETY_SCREEN.cantFindToast, "info")}
        >
          <View style={styles.cantFindShield}>
            <Ionicons
              name="shield-checkmark"
              size={getWidth(22)}
              color={TERRACE_COLORS.orange}
            />
          </View>
          <View style={styles.cantFindTextWrap}>
            <Text style={styles.cantFindTitle}>
              {SELECT_SOCIETY_SCREEN.cantFindTitle}
            </Text>
            <Text style={styles.cantFindSub}>
              {SELECT_SOCIETY_SCREEN.cantFindSub}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={getWidth(20)}
            color={TERRACE_COLORS.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons
            name="lock-closed-outline"
            size={getWidth(15)}
            color={TERRACE_COLORS.textMuted}
          />
          <Text style={styles.footerText}>{SELECT_SOCIETY_SCREEN.footer}</Text>
        </View>
      </View>
    ),
    [showToast],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + getHeight(8) }]}>
      {storeLoading && societies.length === 0 ? (
        <>
          {ListHeader}
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={TERRACE_COLORS.orange} />
          </View>
        </>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + getHeight(16) },
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
        />
      )}

      {isSelecting ? (
        <View style={styles.fullPageLoader}>
          <ActivityIndicator size="large" color={TERRACE_COLORS.orange} />
        </View>
      ) : null}
    </View>
  );
}

const EmptyState = memo(function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No societies found.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  listContent: {
    paddingHorizontal: getWidth(20),
  },
  title: {
    fontSize: getWidth(28),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(18),
  },
  subtitle: {
    fontSize: getWidth(15),
    lineHeight: getHeight(22),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(8),
    paddingHorizontal: getWidth(20),
  },
  locationCard: {
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(16),
    borderWidth: 1,
    borderColor: TERRACE_COLORS.inputBorder + 90,
    padding: getWidth(16),
    marginTop: getHeight(22),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinCircle: {
    width: getWidth(44),
    height: getWidth(44),
    borderRadius: getWidth(22),
    backgroundColor: TERRACE_COLORS.screenBg,
    borderWidth: 1,
    borderColor: TERRACE_COLORS.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(12),
  },
  locationTextWrap: {
    flex: 1,
  },
  locationTitle: {
    fontSize: getWidth(16),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
  },
  locationAddress: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(2),
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: getWidth(4),
    marginLeft: getWidth(8),
  },
  changeText: {
    fontSize: getWidth(14),
    fontWeight: "600",
    color: TERRACE_COLORS.orange,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: getHeight(14),
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TERRACE_COLORS.inputBorder,
  },
  orText: {
    marginHorizontal: getWidth(12),
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: getWidth(8),
  },
  manualText: {
    fontSize: getWidth(15),
    fontWeight: "600",
    color: TERRACE_COLORS.orange,
  },
  sectionLabel: {
    fontSize: getWidth(16),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    marginTop: getHeight(24),
    marginBottom: getHeight(12),
  },
  societyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.screenBg,
    borderRadius: getWidth(16),
    borderWidth: 1,
    borderColor: TERRACE_COLORS.inputBorder + 80,
    padding: getWidth(5),
    marginBottom: getHeight(14),
  },
  societyImage: {
    width: getWidth(100),
    minHeight: getWidth(80),
    borderRadius: getWidth(12),
    backgroundColor: "#EDE7DD",
    marginRight: getWidth(14),

  },
  societyInfo: {
    flex: 1,
    padding: getWidth(10),
  },
  societyName: {
    fontSize: getWidth(17),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
  },
  societyLocality: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(4),
  },
  societyDistance: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(4),
  },
  cantFindCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TERRACE_COLORS.orangeTint,
    borderRadius: getWidth(16),
    padding: getWidth(16),
    marginTop: getHeight(6),
  },
  cantFindShield: {
    width: getWidth(44),
    height: getWidth(44),
    borderRadius: getWidth(22),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: getWidth(12),
  },
  cantFindTextWrap: {
    flex: 1,
  },
  cantFindTitle: {
    fontSize: getWidth(16),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
  },
  cantFindSub: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginTop: getHeight(2),
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(22),
  },
  footerText: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
  errorContainer: {
    marginBottom: getHeight(12),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullPageLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop: getHeight(24),
  },
  emptyStateText: {
    fontSize: getWidth(14),
    color: TERRACE_COLORS.textMuted,
  },
});
