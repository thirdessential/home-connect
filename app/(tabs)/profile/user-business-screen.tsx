import NoDataCard from "@/components/common/NoDataCard";
import CircularImage from "@/components/form/CircularImage";
import FormSheetModal from "@/components/modals/FormSheetModal";
import Skeleton from "@/components/UI/Skeleton";
import { formatDate } from "@/lib/dateTime";
import {
  getInitials,
  isUserObject,
  isUserWithPhoto,
  validateImageUri,
} from "@/lib/utils";
import { useProductStore } from "@/store/useBusinessStore";
import { useTheme } from "@/theme/theme";
import { BusinessCatalogue } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const HEADER_HEIGHT = 200;
const AVATAR_SIZE = 100;

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor?: string;
}

// InfoRow component - kept for potential future use in product details display
const InfoRow = memo(function InfoRow({
  icon,
  label,
  value,
  iconColor,
}: InfoRowProps) {
  const t = useTheme();
  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: t.colors.lightBackground },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor ?? t.colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: t.colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: t.colors.textPrimary }]}>
          {value}
        </Text>
      </View>
    </View>
  );
});

const CARD_RADIUS = 16;

// Memoized card component with stable props comparison
interface CatalogueCardProps {
  item: BusinessCatalogue;
  onPress: (item: BusinessCatalogue) => void;
}

const CatalogueCardComponent = ({ item, onPress }: CatalogueCardProps) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: validateImageUri(item.images?.[0]) }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.itemType || "Item"}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || "Untitled"}
        </Text>
        <Text style={styles.price}>{`₹${item.price || "0"}`}</Text>
      </View>
    </Pressable>
  );
};
const areEqual = (
  prevProps: CatalogueCardProps,
  nextProps: CatalogueCardProps,
) => {
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.itemType === nextProps.item.itemType &&
    prevProps.item.images?.[0] === nextProps.item.images?.[0] &&
    prevProps.onPress === nextProps.onPress
  );
};

const CatalogueCard = memo(CatalogueCardComponent, areEqual);
export default function UserBusinessScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
  }>();
  const businessId = params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Optimized store selectors - only subscribe to needed data
  const productList = useProductStore((s) => s.productList);
  const singleProduct = useProductStore((s) => s.product);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  // Fetch products if not already loaded
  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) {
        setIsInitialLoading(false);
        return;
      }

      // Skip fetch if this specific business is already in the list
      const alreadyLoaded =
        (productList && productList.some((p) => p._id === businessId)) ||
        singleProduct?._id === businessId;

      if (alreadyLoaded) {
        setIsInitialLoading(false);
        return;
      }
      setIsInitialLoading(true);
      try {
        // Fetch all products
        await useProductStore.getState().getProductById(businessId);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, [businessId, productList, singleProduct]);

  const selectedUser = useMemo(() => {
    if (!businessId) return null;

    // Check the general list first, then fall back to the individually fetched product
    const matchingProduct = productList?.find((p) => p._id === businessId);
    if (matchingProduct) return matchingProduct;

    if (singleProduct?._id === businessId) return singleProduct;

    return null;
  }, [businessId, productList, singleProduct]);

  const isDataReady = !isInitialLoading && selectedUser;

  const selectedProduct = selectedUser;

  const initials = useMemo(() => {
    if (!selectedProduct) return "?";
    const name =
      "fullName" in selectedProduct
        ? (selectedProduct as any).fullName
        : selectedProduct.title;
    return getInitials(name);
  }, [selectedProduct]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOptionsPress = useCallback(() => {
    setOptionsModalVisible(true);
  }, []);

  const handleRemoveUser = useCallback(
    () => console.log("Remove User action", businessId),
    [businessId],
  );

  const handleCall = useCallback(() => {
    // Call action - could open phone dialer
  }, []);

  const handleMessage = useCallback(() => {
    // Message action - could open SMS or in-app chat
  }, []);

  const handleCloseOptionsModal = useCallback(() => {
    setOptionsModalVisible(false);
  }, []);

  // Memoized styles for inline objects to prevent re-creation
  const callButtonStyle = useMemo(
    () => [
      styles.actionButton,
      {
        backgroundColor: t.colors.surface,
        borderColor: t.colors.border,
      },
    ],
    [t.colors.surface, t.colors.border],
  );

  const messageButtonStyle = useMemo(
    () => [styles.actionButton, { backgroundColor: t.colors.textPrimary }],
    [t.colors.textPrimary],
  );

  // Fixed: Use stable callback that memoizes the empty function
  // This prevents FlatList from re-rendering all CatalogueCard items
  const handleCatalogueItemPress = useCallback(() => {
    // TODO: Implement catalogue item press handler if needed
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: BusinessCatalogue }) => (
      <CatalogueCard item={item} onPress={handleCatalogueItemPress} />
    ),
    [handleCatalogueItemPress],
  );

  const keyExtractor = useCallback(
    (item: BusinessCatalogue) => item._id || "",
    [],
  );

  // Memoized header - only depends on navigation handlers
  const HeaderNavigation = useMemo(
    () => (
      <View style={styles.topNavigation}>
        <Pressable onPress={handleBack} style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color={t.colors.textPrimary} />
        </Pressable>
        <Pressable onPress={handleOptionsPress} style={styles.navButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={t.colors.textPrimary}
          />
        </Pressable>
      </View>
    ),
    [handleBack, handleOptionsPress, t.colors.textPrimary],
  );

  // Memoized avatar section - only depends on selectedProduct
  const AvatarSection = useMemo(
    () => (
      <View style={styles.avatarContainer}>
        {selectedProduct?.userId &&
        isUserWithPhoto(selectedProduct.userId) &&
        validateImageUri(selectedProduct.userId.profilePhotoUrl) ? (
          <CircularImage
            uri={validateImageUri(selectedProduct.userId.profilePhotoUrl)}
            size={AVATAR_SIZE}
            mode="view"
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: "#4ADE80" }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <Pressable onPress={handleCall} style={callButtonStyle}>
            <Ionicons name="call" size={20} color={t.colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleMessage} style={messageButtonStyle}>
            <Ionicons
              name="chatbubble-ellipses"
              size={20}
              color={t.colors.surface}
            />
          </Pressable>
        </View>
      </View>
    ),
    [
      selectedProduct,
      initials,
      t.colors.textPrimary,
      t.colors.surface,
      callButtonStyle,
      messageButtonStyle,
      handleCall,
      handleMessage,
    ],
  );

  // Memoized info rows section - only depends on selectedProduct
  const InfoRowsSection = useMemo(
    () => (
      <View style={styles.infoSection}>
        {isUserObject(selectedProduct?.userId) &&
          selectedProduct?.userId?.fullName && (
            <InfoRow
              icon="person-outline"
              label="Seller Name"
              value={selectedProduct.userId.fullName}
            />
          )}
        {isUserObject(selectedProduct?.userId) &&
          selectedProduct?.userId?.phone && (
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={selectedProduct.userId.phone}
              iconColor="#3B82F6"
            />
          )}
        {selectedProduct?.completeAddress && (
          <InfoRow
            icon="location-outline"
            label="Address"
            value={selectedProduct.completeAddress}
            iconColor="#EF4444"
          />
        )}
        {selectedProduct?.category && (
          <InfoRow
            icon="pricetag-outline"
            label="Category"
            value={selectedProduct.category}
            iconColor="#8B5CF6"
          />
        )}
        {selectedProduct?.description && (
          <InfoRow
            icon="document-text-outline"
            label="Description"
            value={
              selectedProduct.description.substring(0, 50) +
              (selectedProduct.description.length > 50 ? "..." : "")
            }
            iconColor="#10B981"
          />
        )}
        {selectedProduct?.createdAt && (
          <InfoRow
            icon="calendar-outline"
            label="Joined since"
            value={formatDate(selectedProduct.createdAt)}
            iconColor="#EF4444"
          />
        )}
      </View>
    ),
    [selectedProduct],
  );

  // Composed ListHeader - uses memoized sub-sections to prevent unnecessary re-renders
  const ListHeader = useMemo(
    () => (
      <>
        <View style={styles.headerWrapper}>
          {HeaderNavigation}
          {/* Decorative gradient/header card */}
          <LinearGradient
            colors={["#FAD0C4", "#F3A184"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          />
          {AvatarSection}
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileInfo}>
          {/* Name */}
          <Text style={styles.profileInfoText}>
            {selectedProduct?.title || "Product"}
          </Text>

          {InfoRowsSection}
        </View>
      </>
    ),
    [HeaderNavigation, AvatarSection, selectedProduct?.title, InfoRowsSection],
  );

  // Memoized Skeleton loading component
  const ProfileSkeleton = useMemo(
    () => (
      <View style={styles.skeletonContainer}>
        {/* Header skeleton */}
        <View style={styles.topNavigation}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Gradient card skeleton */}
        <Skeleton width="100%" height={HEADER_HEIGHT} borderRadius={20} />

        {/* Avatar and action buttons skeleton */}
        <View style={styles.skeletonAvatarRow}>
          <Skeleton
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            borderRadius={AVATAR_SIZE / 2}
          />
          <View style={styles.actionButtonsRow}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <Skeleton width={44} height={44} borderRadius={22} />
          </View>
        </View>

        {/* Name skeleton */}
        <View style={styles.skeletonNameSection}>
          <Skeleton width={180} height={24} borderRadius={8} />
        </View>

        {/* Info rows skeleton */}
        <View style={styles.skeletonInfoSection}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonInfoRow}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <View style={styles.skeletonInfoText}>
                <Skeleton width={60} height={12} borderRadius={4} />
                <Skeleton
                  width={120}
                  height={16}
                  borderRadius={4}
                  style={{ marginTop: 4 }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Feed skeleton */}
        <View style={styles.skeletonFeedSection}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.skeletonFeedCard}>
              <View style={styles.skeletonFeedHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.skeletonFeedHeaderText}>
                  <Skeleton width={100} height={14} borderRadius={4} />
                  <Skeleton
                    width={60}
                    height={10}
                    borderRadius={4}
                    style={{ marginTop: 4 }}
                  />
                </View>
              </View>
              <Skeleton
                width="100%"
                height={100}
                borderRadius={8}
                style={{ marginTop: 12 }}
              />
            </View>
          ))}
        </View>
      </View>
    ),
    [],
  );

  // Show skeleton while loading
  if (!isDataReady) {
    return (
      <SafeAreaProvider>
        <View
          style={[
            styles.container,
            {
              backgroundColor: t.colors.background,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          {ProfileSkeleton}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View
        style={[
          styles.container,
          { backgroundColor: t.colors.background, paddingTop: insets.top + 8 },
        ]}
      >
        {/* {ListHeader} */}
        <View style={styles.gridContainer}>
          <FlatList
            data={selectedProduct?.catalogue || []}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={ListHeader}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.contentContainerStyle}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={6}
            windowSize={5}
            initialNumToRender={6}
            ListEmptyComponent={
              <NoDataCard
                iconName="checkmark-circle"
                message="No Catalogue Items Found"
              />
            }
          />
        </View>
      </View>
      {/* Options Modal */}
      <FormSheetModal
        visible={optionsModalVisible}
        onClose={handleCloseOptionsModal}
        title=""
        subtitle=""
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={handleRemoveUser}
            style={styles.optionItem}
          >
            <Ionicons name="trash-outline" size={24} color="#374151" />
            <Text style={styles.optionText}>Remove User</Text>
          </TouchableOpacity>
        </View>
      </FormSheetModal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerWrapper: {
    position: "relative",
    marginBottom: AVATAR_SIZE / 2 + 16,
  },
  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfoText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  contentContainerStyle: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridContainer: {
    flex: 1,
    backgroundColor: "#FCFBF8",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: CARD_RADIUS,
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 0,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    // Elevation for Android
    elevation: 2,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 4 / 5,
    position: "relative",
    backgroundColor: "#EEE",
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22223B",
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
  gradientCard: {
    width: "100%",
    height: HEADER_HEIGHT,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 24,
    overflow: "hidden",
  },
  avatarContainer: {
    position: "absolute",
    bottom: -AVATAR_SIZE / 1.8,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  profileInfo: {
    paddingBottom: 24,
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonAvatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: -AVATAR_SIZE / 2,
  },
  skeletonNameSection: {
    marginTop: AVATAR_SIZE / 2 + 16,
  },
  skeletonInfoSection: {
    marginTop: 24,
    gap: 16,
  },
  skeletonInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonInfoText: {
    flex: 1,
  },
  skeletonFeedSection: {
    marginTop: 32,
    gap: 16,
  },
  skeletonFeedCard: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  skeletonFeedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skeletonFeedHeaderText: {
    flex: 1,
  },
});
