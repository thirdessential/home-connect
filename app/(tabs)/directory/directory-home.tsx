import { verificationStatus } from "@/assets/enums/common.enum";
import ServiceProviderCarousel from "@/components/directory/ServiceProviderCarousel";
import SocietyInfoCard from "@/components/directory/SocietyInfoCard";
import { getVerificationStatus } from "@/lib/adminHelper";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { ServiceProvider } from "@/types/common.type";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DirectoryHome() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Use a selector to only subscribe to productList changes and avoid unnecessary re-renders
  const businessList = useProductStore(
    useCallback((state) => state.productList, []),
  );
  const businessLoading = useProductStore((s) => s.loading);

  const serviceList = useDailyHelperStore(
    useCallback((state) => state.dailyHelperList, []),
  );
  const serviceLoading = useDailyHelperStore((s) => s.loading);

  const societyId = useSocietyStore((s) => s.selectedSociety?._id);
  const fetchBusinessBySocietyId = useProductStore((s) => s.fetchBusinessBySocietyId);
  const getAllApprovedDailyServices = useDailyHelperStore((s) => s.getAllApprovedDailyServices);

  // Directory reads only from these two MySQL-backed stores. Neither list is
  // guaranteed populated if this tab is opened before Home ever fetched them
  // (or after a create-flow redirect from a different society), so refresh
  // both real endpoints on every focus — same actions Home already uses, no
  // new API/store logic.
  useFocusEffect(
    useCallback(() => {
      if (!societyId) return;
      fetchBusinessBySocietyId(societyId);
      getAllApprovedDailyServices(societyId);
    }, [societyId, fetchBusinessBySocietyId, getAllApprovedDailyServices]),
  );

  // Memoize the mapped business data to prevent unnecessary recalculations
  const mappedBusinessData = useMemo<ServiceProvider[]>(() => {
    if (!businessList || !Array.isArray(businessList)) {
      return [];
    }
    const approvedBusinesses = businessList.filter(
      (business) =>
        getVerificationStatus(business, "business") ===
        verificationStatus.APPROVED,
    );

    return approvedBusinesses.map(
      (business: any): ServiceProvider => ({
        businessPhone: business.businessPhone,
        catalogue: business.catalogue || [],
        category: business.category,
        city: business.city,
        completeAddress: business.completeAddress,
        createdAt: business.createdAt,
        id: business._id || business.id,
        name: business.title || business.name || "Business",
        rating: parseFloat(business.rating) || 4.5,
        reviewCount: business.reviewCount || 0,
        imageUrl:
          business.images?.[0] ||
          business.imageUrl ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        productType: "business",
      }),
    );
  }, [businessList]);

  const { dailyHelpData, professionalServicesData } = useMemo<{
    dailyHelpData: ServiceProvider[];
    professionalServicesData: ServiceProvider[];
  }>(() => {
    if (!serviceList || !Array.isArray(serviceList)) {
      return { dailyHelpData: [], professionalServicesData: [] };
    }
    const dailyHelpData: ServiceProvider[] = [];
    const professionalServicesData: ServiceProvider[] = [];
    serviceList.forEach((service: any) => {
      const mapped: ServiceProvider = {
        id: service._id || service.id,
        name: service.title || service.name || "Service",
        category: service.categoryId || "Service",
        rating: parseFloat(service.averageRating) || 4.5,
        reviewCount: service.reviews?.length || 0,
        productType:
          service.serviceType === "daily-help"
            ? "daily-helper"
            : "professional-service",
        imageUrl:
          service.imageUrl ||
          service.images?.[0] ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      };
      if (service.serviceType === "daily-help") {
        dailyHelpData.push(mapped);
      } else if (service.serviceType === "professional-services") {
        professionalServicesData.push(mapped);
      }
    });
    return { dailyHelpData, professionalServicesData };
  }, [serviceList]);

  // View all handlers for each category
  const handleViewAllBusinesses = useCallback(() => {
    router.navigate({
      pathname: "/(tabs)/directory/all-services",
      params: { type: "business" },
    });
  }, [router]);

  const handleViewAllProfessionalServices = useCallback(() => {
    router.navigate({
      pathname: "/(tabs)/directory/all-services",
      params: { type: "professional-services" },
    });
  }, [router]);

  const handleViewAllDailyHelp = useCallback(() => {
    router.navigate({
      pathname: "/(tabs)/directory/all-services",
      params: { type: "daily-help" },
    });
  }, [router]);

  // Calculate top padding based on safe area insets and platform
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 40);

  return (
    <View
      style={{
        paddingTop: topPadding,
        flex: 1,
        backgroundColor: t.colors.white,
      }}
    >
      {/* Fixed Header (non-scrollable) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontWeight: "800", fontSize: 24, color: t.colors.textPrimary }}>
          Directory
        </Text>
        <Text style={{ fontSize: 13.5, color: t.colors.textSecondary, marginTop: 2 }}>
          Services and businesses in your society
        </Text>
      </View>
      <ScrollView
        style={{
          backgroundColor: t.colors.white,
          paddingHorizontal: t.spacing.l,
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Society Information Card */}
        <SocietyInfoCard />

        {(serviceLoading && !serviceList) || (businessLoading && !businessList) ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.brand} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel(t)}>SERVICES</Text>
            <ServiceProviderCarousel
              title="Professional Services"
              data={professionalServicesData.slice(0, 5)}
              onViewAll={handleViewAllProfessionalServices}
            />
            <ServiceProviderCarousel
              title="Daily Help"
              data={dailyHelpData.slice(0, 5)}
              onViewAll={handleViewAllDailyHelp}
            />

            <Text style={styles.sectionLabel(t)}>BUSINESS</Text>
            <ServiceProviderCarousel
              title="Local Businesses"
              data={mappedBusinessData.slice(0, 5)}
              onViewAll={handleViewAllBusinesses}
            />
          </>
        )}

        {/* Additional content can be added here */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = {
  sectionLabel: (t: ReturnType<typeof useTheme>) => ({
    fontSize: 12.5,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
    color: t.colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  }),
};
