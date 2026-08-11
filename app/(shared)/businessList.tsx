import NoDataCard from "@/components/common/NoDataCard";
import CatalougeForm from "@/components/form/CatalougeForm";
import ActionButton from "@/components/inputs/ActionButton";
import FormSheetModal from "@/components/modals/FormSheetModal";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";
import { useProductStore } from "@/store/useBusinessStore";
import { useTheme } from "@/theme/theme";
import { BusinessCatalogue } from "@/types/business.type";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
          source={{ uri: item.images?.[0] || "" }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.itemType}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.price}>{`₹${item.price}`}</Text>
      </View>
    </Pressable>
  );
};

// Custom comparison function for memo - only re-render if relevant props change
const areEqual = (
  prevProps: CatalogueCardProps,
  nextProps: CatalogueCardProps
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

export default function BusinessList() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    edit?: string;
  }>();
  const id = params.id as string | undefined;
  const isEdit = params.edit === "true";
  const insets = useSafeAreaInsets();
  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === "ios" ? 40 : 40),
    [insets.top]
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Catalogue item added.");
  const [selectedItem, setSelectedItem] = useState<BusinessCatalogue | null>(
    null
  );

  const addCatalogueItem = useProductStore((s) => s.addCatalogueItem);
  const updateCatalogueItem = useProductStore((s) => s.updateCatalogueItem);
  const getCatalogueByBusinessId = useProductStore(
    (s) => s.getCatalogueByBusinessId
  );
  const clearStore = useProductStore((s) => s.clear);
  const businessCatalogueList = useProductStore((s) => s.product?.catalogue);

  useEffect(() => {
    if (id) {
      getCatalogueByBusinessId(id);
    }
    return () => {
      clearStore();
    };
  }, [id, getCatalogueByBusinessId, clearStore]);

  const handleAddItem = useCallback(() => {
    setSelectedItem(null); // Clear selected item for new item
    setShowAddModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowAddModal(false);
    setSelectedItem(null);
  }, []);

  const handleSuccessDismiss = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  const handleSubmit = useCallback(
    async (data: BusinessCatalogue) => {
      const catalogueItem: BusinessCatalogue = {
        ...data,
        businessId: id,
      };

      // Create a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: BusinessCatalogue = {
        ...catalogueItem,
        _id: tempId,
      };

      if (selectedItem?._id) {
        // Editing existing item - update UI immediately with optimistic update
        const current = useProductStore.getState();
        const currentCatalogue = current.product?.catalogue || [];
        const optimisticCatalogue = currentCatalogue.map((item) =>
          item._id === selectedItem._id
            ? { ...item, ...catalogueItem, _id: item._id }
            : item
        );
        useProductStore.setState({
          product: current.product
            ? { ...current.product, catalogue: optimisticCatalogue }
            : { catalogue: optimisticCatalogue },
        });

        setSuccessMessage("Catalogue item updated.");
        setShowAddModal(false);
        setSelectedItem(null);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);

        // API call in background
        try {
          await updateCatalogueItem(id!, selectedItem._id, catalogueItem);
        } catch (error) {
          console.error("Failed to update catalogue item:", error);
          // Optionally refresh the list to get latest data if update fails
          try {
            await getCatalogueByBusinessId(id!);
          } catch (refreshError) {
            console.error("Failed to refresh catalogue:", refreshError);
          }
        }
      } else {
        // Adding new item - show optimistic update immediately
        const current = useProductStore.getState();
        const currentCatalogue = current.product?.catalogue || [];

        // Ensure all required fields are present in optimistic item
        const safeOptimisticItem: BusinessCatalogue = {
          _id: tempId,
          title: optimisticItem.title || "",
          description: optimisticItem.description || "",
          price: optimisticItem.price || 0,
          images: Array.isArray(optimisticItem.images)
            ? optimisticItem.images
            : [],
          itemType: optimisticItem.itemType || "",
          unit: optimisticItem.unit || "",
          inStock: optimisticItem.inStock || "",
          tags: Array.isArray(optimisticItem.tags) ? optimisticItem.tags : [],
          businessId: optimisticItem.businessId || id,
        };

        useProductStore.setState({
          product: current.product
            ? {
                ...current.product,
                catalogue: [...currentCatalogue, safeOptimisticItem],
              }
            : { catalogue: [safeOptimisticItem] },
        });

        setSuccessMessage("Catalogue item added.");
        setShowAddModal(false);
        setSelectedItem(null);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);

        // API call in background
        try {
          await addCatalogueItem(id!, catalogueItem);
        } catch (error) {
          console.error("Failed to add catalogue item:", error);
          // Remove optimistic item if API fails
          try {
            const updatedCatalogue = (
              useProductStore.getState().product?.catalogue || []
            ).filter((item) => item._id !== tempId);
            useProductStore.setState({
              product: useProductStore.getState().product
                ? {
                    ...useProductStore.getState().product,
                    catalogue: updatedCatalogue,
                  }
                : { catalogue: updatedCatalogue },
            });
          } catch (rollbackError) {
            console.error(
              "Failed to rollback optimistic update:",
              rollbackError
            );
          }
        }
      }
    },
    [
      id,
      addCatalogueItem,
      updateCatalogueItem,
      getCatalogueByBusinessId,
      selectedItem,
    ]
  );

  const handleCardPress = useCallback(
    (item: BusinessCatalogue) => {
      if (isEdit) {
        // In edit mode, open form with pre-populated data
        setSelectedItem(item);
        setShowAddModal(true);
      } else {
        // In view mode, navigate to detail page
        router.push({
          pathname: "/(shared)/catalogueDetail",
          params: { catalogueId: item._id, businessId: id },
        });
      }
    },
    [router, id, isEdit]
  );

  const renderItem = useCallback(
    ({ item }: { item: BusinessCatalogue }) => (
      <CatalogueCard item={item} onPress={() => handleCardPress(item)} />
    ),
    [handleCardPress]
  );

  const keyExtractor = useCallback(
    (item: BusinessCatalogue) => item._id || "",
    []
  );

  const catalogueData = useMemo(
    () => businessCatalogueList || [],
    [businessCatalogueList]
  );

  const containerStyle = useMemo(
    () => ({
      paddingTop: topPadding,
      flex: 1,
      backgroundColor: t.colors.background,
    }),
    [topPadding, t.colors.background]
  );

  const contentContainerStyle = useMemo(() => ({ padding: 12 }), []);

  return (
    <View style={containerStyle}>
      <Text style={styles.pageHeading}>
        {isEdit ? "Edit Catalogue" : "My Catalogue"}
      </Text>
      {isEdit && (
        <View style={styles.addCtaSection}>
          <ActionButton
            title="Add New Item"
            onPress={handleAddItem}
            fullWidth
            variant="outline"
            leftIconName="add-outline"
            containerStyle={styles.addCtaButton}
            textStyle={styles.addCtaText}
          />
        </View>
      )}
      <View style={styles.gridContainer}>
        <FlatList
          data={catalogueData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={contentContainerStyle}
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

      <FormSheetModal
        visible={showAddModal}
        onClose={handleModalClose}
        title={selectedItem ? "Edit Item" : "Add New Item"}
      >
        <CatalougeForm
          key={selectedItem?._id || "new"}
          initial={selectedItem || undefined}
          onSubmit={handleSubmit}
        />
      </FormSheetModal>
      <OrderSuccessModal
        visible={showSuccessModal}
        onDismiss={handleSuccessDismiss}
        title="Success!"
        subtitle={successMessage}
        autoHideMs={1500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addCtaSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "column",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  addCtaButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
    gap: 8,
  },
  addCtaIconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  addCtaIcon: {
    fontSize: 20,
    color: "#6B7280",
    fontWeight: "bold",
    marginTop: -2,
  },
  addCtaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22223B",
  },
  gridContainer: {
    flex: 1,
    backgroundColor: "#FCFBF8",
  },
  pageHeading: {
    fontWeight: "bold",
    fontSize: 24,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
});
