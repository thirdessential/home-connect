import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { BUSINESS_CAT_MOCK, ORDER_CATEGORIES } from "@/assets/mocks/category";
import FilterChips from "@/components/common/FilterChips";
import BusinessForm from "@/components/form/BusinessForm";
import WholesaleDealForm from "@/components/form/WholesaleDealForm";
import FormSheetModal from "@/components/modals/FormSheetModal";
import Badge from "@/components/UI/Badge";
import { getTruncatedDescription, shareProduct } from "@/lib/utils";
import { useProductStore } from "@/store/useBusinessStore";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RequestGridCard = memo(function RequestGridCard({
  item,
  onPress,
}: {
  item: any;
  onPress?: () => void;
}) {
  if (!item) return null;

  const cover = item?.images?.[0];
  const isDeal =
    "dealStatus" in (item || {}) || "orderDeadlineDate" in (item || {});
  const chip =
    item?.itemType || item?.category || (isDeal ? "Deal" : "Product");
  const title = item?.businessTitle || item?.name || item?.title || "Untitled";
  const sellingPrice = item?.price?.sellingPrice || "";
  // Derive status for display (business vs deal)
  const rawStatus = isDeal
    ? item?.dealStatus ||
      (item?.isDealActive === false
        ? "Inactive"
        : item?.isDealActive
          ? "Active"
          : item?.verificationStatus?.status)
    : item?.verificationStatus?.status ||
      item?.isBusinessVerified?.status ||
      item?.status;
  const statusText = (rawStatus || "Pending").toString();
  const s = statusText.toLowerCase();
  let statusBg = "#E5E7EB"; // slate-200
  let statusFg = "#1F2937"; // slate-800
  if (s.includes("approve") || s.includes("active")) {
    statusBg = "#DCFCE7"; // green-100
    statusFg = "#065F46"; // green-800
  } else if (s.includes("pend")) {
    statusBg = "#FEF3C7"; // amber-100
    statusFg = "#92400E"; // amber-900
  } else if (
    s.includes("reject") ||
    s.includes("inactive") ||
    s.includes("close")
  ) {
    statusBg = "#FEE2E2"; // red-100
    statusFg = "#991B1B"; // red-900
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 14,
      }}
    >
      <View style={{ height: 160, backgroundColor: "#f3f4f6" }}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "#111827",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            opacity: 0.9,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
            {chip}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1f2937",
            height: 30,
          }}
        >
          {getTruncatedDescription(title || "Untitled")}
        </Text>
        {/* Status row */}
        <Badge
          label={`Status: ${statusText}`}
          textColor={statusFg}
          size="xs"
          bgColor={statusBg}
          style={{
            alignSelf: "flex-start",
            marginTop: 6,
          }}
        />
        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {sellingPrice ? (
            <Text style={{ fontWeight: "800", color: "#0f172a" }}>
              {COMMON_CONSTANTS.CURRENCY} {sellingPrice}
              {item?.unit ? ` / ${item.unit}` : ""}
            </Text>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() =>
              shareProduct({
                name: title || "Untitled",
                description: item?.description || "",
                price: sellingPrice || "",
              })
            }
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={{
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="share-social-outline" size={16} color="#ea580c" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function MyRequestsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [manageVisible, setManageVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>(
    ORDER_CATEGORIES[0].id,
  );
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Constants for filter types
  const FILTER_TYPES = {
    ALL: "all",
    PRODUCT: "product",
    DEAL: "deal",
    EVENT: "event",
  };
  const getUserOrders = useUserStore((s) => s.getUserOrders);
  const userOrders = useUserStore((s) => s.userOrders);
  const userId = useUserStore((s) => s.user?._id) as string | undefined;
  // Select only the required pieces from each store to avoid unnecessary re-renders
  const getUserBusinesses = useProductStore((s) => s.getUserBusinesses);
  const productLoading = useProductStore((s) => s.loading);
  const productError = useProductStore((s) => s.error);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const userProducts = useProductStore((s) => s.userProducts);
  const getDealsByUserId = useWholesaleDealStore((s) => s.getDealsByUserId);
  const usersDeal = useWholesaleDealStore((s) => s.usersDeal);
  const dealLoading = useWholesaleDealStore((s) => s.loading);
  const dealError = useWholesaleDealStore((s) => s.error);
  const rejectedUser =
    userId &&
    useUserStore.getState().user?.isAddressVerified?.status ===
      verificationStatus.REJECTED;

  useEffect(() => {
    if (userId) {
      try {
        // getUserBusinesses(userId);
        // getDealsByUserId(userId);
        getUserOrders(userId);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  }, [userId, getUserOrders]);

  // Filter orders by type (product/deal/event registrations)
  const productOrders = useMemo(() => {
    const orders = Array.isArray(userOrders) ? userOrders : [];
    return orders.filter(
      (order: any) => order?.sourceType === "business" || !order?.sourceType,
    );
  }, [userOrders]);

  const dealOrders = useMemo(() => {
    const orders = Array.isArray(userOrders) ? userOrders : [];
    return orders.filter((order: any) => order?.sourceType === "wholesale");
  }, [userOrders]);

  const eventOrders = useMemo(() => {
    // Only show events when "all" or "event" filter is selected
    if (selectedType !== "all" && selectedType !== "event") return [];

    const orders = Array.isArray(userOrders) ? userOrders : [];
    return orders.filter(
      (order: any) =>
        order?.sourceType === "event" || order?.status === "registered",
    );
  }, [userOrders, selectedType]);

  const businessData = useMemo(() => {
    // Only show product orders when "all" or "product" filter is selected
    if (selectedType !== "all" && selectedType !== "product") return [];

    // Use userOrders if available, otherwise fall back to userProducts
    const items =
      productOrders.length > 0
        ? productOrders.map((order: any) => ({
            ...order.source,
            _id: order.sourceId || order.feedId,
            orderId: order._id,
            orderStatus: order.status,
          }))
        : Array.isArray(userProducts)
          ? userProducts
          : [];
    return items;
  }, [selectedType, userProducts, productOrders]);

  const dealsData = useMemo(() => {
    // Only show deals when "all" or "deal" filter is selected
    if (selectedType !== "all" && selectedType !== "deal") return [];

    // Use userOrders if available, otherwise fall back to usersDeal
    const deals =
      dealOrders.length > 0
        ? dealOrders.map((order: any) => ({
            ...order.source,
            _id: order.sourceId || order.feedId,
            orderId: order._id,
            orderStatus: order.status,
          }))
        : Array.isArray(usersDeal)
          ? usersDeal
          : [];
    return deals;
  }, [selectedType, usersDeal, dealOrders]);

  // Stable styles and renderers to avoid re-renders
  const columnWrapperStyle = useMemo(
    () => ({ gap: 12, paddingHorizontal: 16 }),
    [],
  );
  const listContentStyle = useMemo(
    () => ({ paddingBottom: 8, paddingTop: 8 }),
    [],
  );
  // Helpers
  const isDealItem = useCallback(
    (it: any) =>
      Boolean(
        (it && typeof it === "object" && "dealStatus" in it) ||
        (it && typeof it === "object" && "orderDeadlineDate" in it),
      ),
    [],
  );
  const openManage = useCallback((it: any) => {
    if (!it) return;
    setSelectedItem(it);
    setManageVisible(true);
  }, []);

  const closeManage = useCallback(() => {
    setManageVisible(false);
    setSelectedItem(null);
  }, []);
  const mapBusinessInitial = useCallback((it: any) => {
    if (!it) return undefined;
    return {
      title: it?.businessTitle || it?.name || it?.title || "",
      category: it?.category || "",
      description: it?.description || "",
      businessPhone: it?.businessPhone || it?.phone || "",
      address: it?.address || it?.businessAddress || it?.completeAddress || "",
      unit: it?.unit || "",
      price:
        typeof it?.price?.sellingPrice === "string"
          ? Number(it?.price?.sellingPrice) || 0
          : (it?.price?.sellingPrice ?? 0),
      images: Array.isArray(it?.images) ? it.images : [],
    } as any;
  }, []);
  const updateDeal = useWholesaleDealStore((s) => s.updateDeal);
  const onSubmitWholesaleDeal = useCallback(
    async (data?: any) => {
      try {
        const id = selectedItem?._id as string | undefined;
        if (!id) {
          Alert.alert("Error", "Missing deal id");
          return;
        }

        if (!selectedItem || !data) {
          Alert.alert("Error", "Missing required data");
          return;
        }

        // Merge with existing and strip undefined to avoid overwriting fields unintentionally
        const merged = { ...(selectedItem || {}), ...(data || {}) } as Record<
          string,
          any
        >;
        const patch: Record<string, any> = {};
        for (const key in merged) {
          if (merged[key] !== undefined) patch[key] = merged[key];
        }

        await updateDeal(patch, id);

        if (userId) {
          await getDealsByUserId(userId);
        }

        const err = useWholesaleDealStore.getState().error;
        if (err) {
          Alert.alert("Update failed", err);
          return;
        }

        Alert.alert("Success", "Deal updated successfully");
        closeManage();
      } catch (error) {
        console.error("Error updating deal:", error);
        Alert.alert("Error", "Failed to update deal");
      }
    },
    [updateDeal, selectedItem, closeManage, getDealsByUserId, userId],
  );
  const onSubmitBusiness = useCallback(
    async (data?: any) => {
      try {
        const id = selectedItem?._id as string | undefined;
        if (!id) {
          Alert.alert("Error", "Missing business id");
          return;
        }

        if (!selectedItem || !data) {
          Alert.alert("Error", "Missing required data");
          return;
        }

        // Map BusinessFormData to Partial<Product>
        const existingPrice = selectedItem?.price || {};
        const selling =
          data?.price != null
            ? String(data.price)
            : existingPrice?.sellingPrice || "";
        const mrp = existingPrice?.mrp || "";
        let discountPrcnt = existingPrice?.discountPrcnt || "";
        let saveAmount = existingPrice?.saveAmount || "";

        if (mrp && selling && !isNaN(Number(mrp)) && !isNaN(Number(selling))) {
          const mrpNum = Number(mrp);
          const sellNum = Number(selling);
          const discount = mrpNum > 0 ? ((mrpNum - sellNum) / mrpNum) * 100 : 0;
          discountPrcnt = discount.toFixed(2);
          saveAmount = (mrpNum - sellNum).toString();
        }

        const patch: any = {
          title: data?.title || "",
          category: data?.category || "",
          description: data?.description || "",
          businessPhone: data?.businessPhone || "",
          completeAddress: data?.address || "",
          unit: data?.unit || "",
          images: Array.isArray(data?.images)
            ? data.images
            : selectedItem?.images || [],
          price: {
            mrp: mrp,
            sellingPrice: selling,
            discountPrcnt: discountPrcnt,
            saveAmount: saveAmount,
          },
        };

        // Remove undefined to avoid wiping fields unintentionally
        Object.keys(patch).forEach(
          (k) => patch[k] === undefined && delete patch[k],
        );

        await updateProduct(patch, id);

        if (userId) {
          await getUserBusinesses(userId);
        }

        const err = useProductStore.getState().error;
        if (err) {
          Alert.alert("Update failed", err);
          return;
        }

        Alert.alert("Success", "Business updated successfully");
        closeManage();
      } catch (error) {
        console.error("Error updating business:", error);
        Alert.alert("Error", "Failed to update business");
      }
    },
    [selectedItem, updateProduct, userId, getUserBusinesses, closeManage],
  );
  const keyExtractor = useCallback(
    (it: any, idx: number) => String(it?._id ?? `item-${idx}`),
    [],
  );

  const renderGridItem = useCallback(
    ({ item }: { item: any }) => {
      if (!item) return null;
      return <RequestGridCard item={item} onPress={() => openManage(item)} />;
    },
    [openManage],
  );
  const Separator = useCallback(() => <View style={{ height: 0 }} />, []);

  // Calculate top padding based on safe area insets and platform
  const topPadding = Math.max(insets.top, Platform.OS === "ios" ? 40 : 40);

  return (
    <View
      style={{
        paddingTop: topPadding,
        flex: 1,
        backgroundColor: t.colors.background,
      }}
    >
      <View style={{}}>
        <Text style={{ fontWeight: "bold", fontSize: 24, padding: 16 }}>
          My Requests
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={businessData}
        keyExtractor={keyExtractor}
        renderItem={renderGridItem}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        contentContainerStyle={listContentStyle}
        ListHeaderComponent={useMemo(
          () => (
            <View style={styles.filterWrapper}>
              <FilterChips
                options={ORDER_CATEGORIES || []}
                onChange={setSelectedType}
                initialValue={selectedFilter}
                horizontal
              />
            </View>
          ),
          [selectedFilter],
        )}
        ListFooterComponent={useMemo(
          () => (
            <>
              {(dealsData?.length || 0) > 0 ? (
                <View style={{ paddingTop: 4, paddingBottom: 8 }}>
                  <Text
                    style={{
                      ...t.typography.h3,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      marginBottom: 4,
                    }}
                  >
                    Deals ({dealsData?.length || 0})
                  </Text>
                  <FlatList
                    data={dealsData || []}
                    keyExtractor={keyExtractor}
                    renderItem={renderGridItem}
                    numColumns={2}
                    columnWrapperStyle={columnWrapperStyle}
                    contentContainerStyle={listContentStyle}
                    ItemSeparatorComponent={Separator}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    removeClippedSubviews
                    windowSize={5}
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    updateCellsBatchingPeriod={50}
                  />
                </View>
              ) : null}
              {(eventOrders?.length || 0) > 0 ? (
                <View style={{ paddingTop: 4, paddingBottom: 8 }}>
                  <Text
                    style={{
                      ...t.typography.h3,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      marginBottom: 4,
                    }}
                  >
                    Event Registrations ({eventOrders?.length || 0})
                  </Text>
                  <FlatList
                    data={eventOrders || []}
                    keyExtractor={keyExtractor}
                    renderItem={renderGridItem}
                    numColumns={2}
                    columnWrapperStyle={columnWrapperStyle}
                    contentContainerStyle={listContentStyle}
                    ItemSeparatorComponent={Separator}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    removeClippedSubviews
                    windowSize={5}
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    updateCellsBatchingPeriod={50}
                  />
                </View>
              ) : null}
            </>
          ),
          [
            t,
            dealsData,
            eventOrders,
            Separator,
            keyExtractor,
            renderGridItem,
            columnWrapperStyle,
            listContentStyle,
          ],
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="folder-outline"
              size={64}
              color={t.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: t.colors.textPrimary }]}>
              No Requests Yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: t.colors.textSecondary }]}
            >
              Your business and deal requests will appear here once you create
              your first listing.
            </Text>
          </View>
        }
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />

      {/* Manage Modal */}
      <FormSheetModal
        visible={manageVisible}
        onClose={closeManage}
        title={
          isDealItem(selectedItem) ? "Manage Wholesale Deal" : "Manage Business"
        }
        subtitle={
          isDealItem(selectedItem)
            ? "Update your deal details"
            : "Update your product details"
        }
        dismissOnBackdrop={true}
      >
        {selectedItem ? (
          isDealItem(selectedItem) ? (
            <WholesaleDealForm
              initialData={selectedItem}
              onSubmit={onSubmitWholesaleDeal}
              onBack={closeManage}
              submitLabel="Update Deal"
              loading={dealLoading || false}
              error={dealError || null}
            />
          ) : (
            <BusinessForm
              categories={BUSINESS_CAT_MOCK || []}
              initialData={mapBusinessInitial(selectedItem)}
              onSubmit={onSubmitBusiness}
              submitLabel="Update Business"
              loading={productLoading || false}
              error={productError || null}
            />
          )
        ) : null}
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  filterWrapper: {
    paddingHorizontal: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
