import { Card } from "@/components/UI/Card";
import { capitalizeWords } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { ServiceProvider } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CircularImage from "../form/CircularImage";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.6; // 60% of screen width

type ServiceProviderCarouselProps = {
  title?: string;
  data: ServiceProvider[];
  onViewAll?: () => void;
};

// Memoized service provider card component
const ServiceProviderCard = memo(({ provider }: { provider: any }) => {
  const t = useTheme();
  const router = useRouter();

  const handleCardPress = useCallback(() => {
    router.navigate(
      `/(tabs)/directory/${provider.productType === "business" ? "business" : "service"
      }/${provider.id}`
    );
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleCardPress}
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
    >
      <Card style={[{ backgroundColor: t.colors.surface }]}>
        <View style={styles.p3FlexGrow}>
          <View style={styles.flexRowGap3Mb2}>
            <View style={styles.avatarImg}>
              <CircularImage
                uri={provider.imageUrl}
                mode="view"
                size={40}
                loading={false}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.providerNameText} numberOfLines={2}>
                {provider.name}
              </Text>
              <Text style={styles.providerCategoryText} numberOfLines={1}>
                {capitalizeWords(provider.category)}
              </Text>
            </View>
          </View>
          <View style={styles.ratingStarsRow}>
            <Ionicons name="star" size={12} color="#facc15" />
            <Text style={styles.ratingValue}>{provider.rating}</Text>
            <Text style={styles.ratingCountText}>({provider.reviewCount})</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewProfileLink}
            onPress={handleCardPress}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color="#15803D"
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

ServiceProviderCard.displayName = "ServiceProviderCard";

const ServiceProviderCarousel = memo(
  ({
    title = "Service Providers",
    data,
    onViewAll,
  }: ServiceProviderCarouselProps) => {
    const t = useTheme();

    const renderItem = useCallback(
      ({ item }: { item: ServiceProvider }) => (
        <ServiceProviderCard provider={item} />
      ),
      []
    );

    const keyExtractor = useCallback((item: ServiceProvider) => item.id, []);

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: CARD_WIDTH + 16, // Include margin
        offset: (CARD_WIDTH + 16) * index,
        index,
      }),
      []
    );

    if (!data || data.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ ...t.typography.h3, color: t.colors.textPrimary }}>
            {title}
          </Text>
          {onViewAll && data.length > 2 && (
            <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: t.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Carousel */}
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          windowSize={6}
          initialNumToRender={4}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          snapToAlignment="start"
        />
      </View>
    );
  }
);

ServiceProviderCarousel.displayName = "ServiceProviderCarousel";

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardContainer: {
    marginRight: 16,
    marginBottom: 12,
  },
  p3FlexGrow: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  flexRowGap3Mb2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginRight: 0,
    flexShrink: 0,
  },
  providerNameText: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 0,
    color: "#1F2937",
  },
  providerCategoryText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 0,
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
    marginBottom: 0,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: "600",
    fontSize: 12,
    color: "#374151",
  },
  ratingCountText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
    backgroundColor: "#FFF",
  },
  viewProfileLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewProfileText: {
    color: "#15803D",
    fontWeight: "600",
    fontSize: 13,
    marginRight: 2,
  },
});

export default ServiceProviderCarousel;
