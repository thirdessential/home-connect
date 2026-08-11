import { verificationStatus } from "@/assets/enums/common.enum";
import EmptyState from "@/components/common/EmptyState";
import CircularImage from "@/components/form/CircularImage";
import ActionButton from "@/components/inputs/ActionButton";
import { Card } from "@/components/UI/Card";
import InfoBanner from "@/components/UI/InfoBanner";
import TitleHeader from "@/components/UI/TitleHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { getVerificationStatus } from "@/lib/adminHelper";
import { useProductStore } from "@/store/useBusinessStore";
import { useDailyHelperStore } from "@/store/useDailyHelper";
import { useTheme } from "@/theme/theme";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Service Provider Card - matches design
const ServiceProviderListCard = memo(
  ({
    item,
    onCall,
    onViewProfile,
    isGuest,
  }: {
    item: any;
    onCall: () => void;
    onViewProfile: () => void;
    isGuest: boolean;
  }) => {
    const theme = useTheme();
    const tags = item.tags || [];

    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <CircularImage
            uri={item.image}
            size={54}
            mode="view"
            loading={false}
          />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.category, { color: theme.colors.textSecondary }]}
            >
              {item.category}
            </Text>
          </View>
        </View>

        <View style={styles.rating}>
          <Ionicons name="star" size={14} color="#facc15" />
          <Text style={[styles.ratingValue, { color: theme.colors.primary }]}>
            {item.rating}
          </Text>
          <Text
            style={[styles.reviewCount, { color: theme.colors.textSecondary }]}
          >
            ({item.reviewCount})
          </Text>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag: string, idx: number) => (
              <View
                key={idx}
                style={[styles.tag, { backgroundColor: theme.colors.surface }]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <ActionButton
            title="Call"
            variant="outline"
            size="md"
            onPress={onCall}
            disabled={isGuest}
            containerStyle={styles.callButton}
          />
          <ActionButton
            title="View Profile"
            variant="primary"
            size="md"
            onPress={onViewProfile}
            containerStyle={styles.viewProfileButton}
          />
        </View>
      </Card>
    );
  },
);
ServiceProviderListCard.displayName = "ServiceProviderListCard";

export default function AllServicesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const { hasOnly } = usePermissions();
  const isGuest = hasOnly([UserRole.GUEST]);

  // Store selectors
  const dailyHelperList = useDailyHelperStore((s) => s.dailyHelperList);
  const businessList = useProductStore((s) => s.productList);

  // Determine title and get appropriate data
  const { title, rawData } = useMemo(() => {
    switch (type) {
      case "daily-help":
        return {
          title: "All Daily Help",
          rawData: (dailyHelperList || []).filter(
            (s: any) => s.serviceType === "daily-help",
          ),
        };
      case "professional-services":
        return {
          title: "All Professional Services",
          rawData: (dailyHelperList || []).filter(
            (s: any) => s.serviceType === "professional-services",
          ),
        };
      case "business":
        return {
          title: "All Businesses",
          rawData: (businessList || []).filter(
            (b: any) =>
              getVerificationStatus(b, "business") ===
              verificationStatus.APPROVED,
          ),
        };
      default:
        return { title: "Service Providers", rawData: [] };
    }
  }, [type, dailyHelperList, businessList]);

  // Map raw data to card format
  const mappedData = useMemo(
    () =>
      rawData.map((item: any) => ({
        id: item._id || item.id,
        name: item.name || item.title || "Unknown",
        category: item.categoryId || item.category || "Service",
        image:
          item.images?.[0] ||
          item.imageUrl ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        rating: parseFloat(item.averageRating || item.rating) || 4.5,
        reviewCount: item.reviews?.length || item.reviewCount || 0,
        tags: item.skills || item.tags || [],
        originalItem: item,
      })),
    [rawData],
  );

  // Filter by search query
  const filteredData = useMemo(
    () =>
      mappedData.filter(
        (item: any) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [mappedData, searchQuery],
  );

  const handleCall = useCallback((item: any) => {
    // TODO: Implement call functionality
  }, []);

  const handleViewProfile = useCallback(
    (item: any) => {
      router.navigate(
        `/(tabs)/directory/${
          type === "business" ? "business" : "service"
        }/${item.id}`,
      );
    },
    [router, type],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ServiceProviderListCard
        item={item}
        onCall={() => handleCall(item)}
        onViewProfile={() => handleViewProfile(item)}
        isGuest={isGuest}
      />
    ),
    [handleCall, handleViewProfile, isGuest],
  );

  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 24);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Header */}
      <TitleHeader
        title={title}
        onBackPress={router.back}
        showOptionsMenu={false}
      />

      {/* Guest Info Banner */}
      {isGuest && (
        <InfoBanner
          title="Limited Access"
          description={`Your current account type does not have access to view service providers. Please contact support to upgrade your account.`}
          type="danger"
          containerStyle={styles.infoBanner}
        />
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
        <TextInput
          placeholder="Search by name, tag, or service..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No Results Found"
            subtitle={
              searchQuery
                ? "Try adjusting your search criteria."
                : "No service providers available."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewCount: {
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  callButton: {
    flex: 1,
  },
  viewProfileButton: {
    flex: 1.2,
  },
});
