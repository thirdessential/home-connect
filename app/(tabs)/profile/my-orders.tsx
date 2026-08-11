import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { ORDER_CATEGORIES } from "@/assets/mocks/category";
import EmptyState from "@/components/common/EmptyState";
import FilterChips from "@/components/common/FilterChips";
import Badge from "@/components/UI/Badge";
import { Card } from "@/components/UI/Card";
import { formatDate } from "@/lib/dateTime";
import { capitalizeWords } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type OrderItem = {
  qty: number;
  name: string;
};

type Order = {
  id: string;
  dealId?: string; // For navigation to shared/[_id]
  vendorName: string;
  locality?: string;
  status: "Delivered" | "Cancelled" | "On the way" | "Approved" | "Pending" | "Rejected";
  statusColor?: string;
  imageUrl?: string;
  orderedAt: string;
  updatedAt?: string;
  billTotal: number;
  items: OrderItem[];
  sourceType?: string;
};

function QuantityChip({ qty }: { qty: number }) {
  const t = useTheme();
  return (
    <View
      style={[styles.quantityChip, { backgroundColor: t.colors.primaryWeak }]}
    >
      <Text style={styles.quantityChipText}>{qty}x</Text>
    </View>
  );
}

const OrderCard = memo(({ order }: { order: Order }) => {
  const t = useTheme();
  const router = useRouter();

  const handleCardPress = () => {
    if (order.dealId) {
      router.navigate(`/(shared)/${order.dealId}?flow=deal&id=${order.dealId}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleCardPress}
      disabled={!order.dealId}
    >
      <Card style={[styles.orderCard, styles.cardShadow]}>
        {/* Header with Owner badge and Status */}
        <View style={styles.cardHeader}>
          <Badge
            label={capitalizeWords(order.sourceType!)}
            bgColor="#EEF2FF"
            textColor="#4F46E5"
            size="sm"
          />
          <Badge
            label={order.status}
            bgColor={
              order.status === "Approved" || order.status === "Delivered"
                ? "#D1FAE5"
                : order.status === "Cancelled" || order.status === "Rejected"
                  ? "#FEE2E2"
                  : "#FEF3C7"
            }
            textColor={
              order.status === "Approved" || order.status === "Delivered"
                ? "#10B981"
                : order.status === "Cancelled" || order.status === "Rejected"
                  ? "#EF4444"
                  : "#D97706"
            }
            size="sm"
          />
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Image source={{ uri: order.imageUrl }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text
                numberOfLines={1}
                style={[styles.userName, { color: t.colors.textPrimary }]}
              >
                {order.vendorName}
              </Text>
            </View>
            <Text>{order.updatedAt ? formatDate(order.updatedAt) : "N/A"}</Text>
          </View>
        </View>

        {/* Flat/Tower Section */}
        {order.items && order.items.length > 0 && (
          <View style={styles.detailSection}>
            <Text
              style={[styles.detailLabel, { color: t.colors.textSecondary }]}
            >
              Items / Quantity
            </Text>
            <Text
              style={[styles.detailValue, { color: t.colors.textPrimary }]}
              numberOfLines={2}
            >
              {order.items.map((it) => `${it.name} (${it.qty}x)`).join(", ")}
            </Text>
          </View>
        )}

        {/* Footer with Date and Location */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={t.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[styles.footerText, { color: t.colors.textSecondary }]}
            >
              Applied:{" "}
              {order.orderedAt
                ? new Date(order.orderedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons
              name="location-outline"
              size={14}
              color={t.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[styles.footerText, { color: t.colors.textSecondary }]}
            >
              {COMMON_CONSTANTS.CURRENCY} {order.billTotal}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

OrderCard.displayName = "OrderCard";

const SkeletonLoader = memo(() => {
  const t = useTheme();
  return (
    <View style={{ padding: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.orderCard,
            {
              backgroundColor: t.colors.lightBackground,
              marginBottom: 16,
              opacity: 0.6,
            },
          ]}
        >
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <View
              style={[styles.orderImage, { backgroundColor: t.colors.border }]}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  height: 16,
                  backgroundColor: t.colors.border,
                  borderRadius: 4,
                  marginBottom: 8,
                  width: "70%",
                }}
              />
              <View
                style={{
                  height: 14,
                  backgroundColor: t.colors.border,
                  borderRadius: 4,
                  width: "50%",
                }}
              />
            </View>
          </View>
          <View
            style={{
              height: 60,
              backgroundColor: t.colors.border,
              borderRadius: 8,
              marginBottom: 12,
            }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                height: 14,
                backgroundColor: t.colors.border,
                borderRadius: 4,
                width: "40%",
              }}
            />
            <View
              style={{
                height: 14,
                backgroundColor: t.colors.border,
                borderRadius: 4,
                width: "25%",
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
});

SkeletonLoader.displayName = "SkeletonLoader";

export default function MyOrdersScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Select only the user id to minimize re-renders when other user fields change
  const userId = useUserStore((s) => s.user?._id);
  const getUserOrders = useUserStore((s) => s.getUserOrders);
  const userOrders = useUserStore((s) => s.userOrders);
  const userOrdersLoading = useUserStore((s) => s.userOrdersLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(
    ORDER_CATEGORIES[0]?.id,
  );

  // Refetch on screen focus so it's fresh when user navigates back
  useFocusEffect(
    useCallback(() => {
      if (userId) getUserOrders(String(userId));
      return undefined;
    }, [userId, getUserOrders]),
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await getUserOrders(String(userId));
    // Read the latest orders directly from the store to avoid stale closure
    setRefreshing(false);
  }, [userId, getUserOrders]);

  // Map API shape to display shape using real userOrders data
  const data: Order[] = useMemo(() => {
    if (Array.isArray(userOrders) && userOrders.length > 0) {
      // Filter orders by sourceType based on selectedType
      const filteredOrders = userOrders.filter((o: any) => {
        const sourceType = (o?.sourceType || "business").toLowerCase();
        // Map filter types to sourceTypes
        if (selectedType === "product" || selectedType === "business") {
          return sourceType === "business" || !o?.sourceType;
        } else if (selectedType === "deal" || selectedType === "deals") {
          return sourceType === "wholesale";
        } else if (selectedType === "event" || selectedType === "events") {
          return sourceType === "event";
        }
        return false;
      });

      // Map real API data to display format
      return filteredOrders.map((o: any, idx: number) => {
        // For wholesale deals, use the populated creator (source.userId)
        const creator = o?.source?.userId;
        const creatorName =
          typeof creator === "object" && creator?.fullName
            ? creator.fullName
            : o?.dealerName || o?.vendorName || "Order";
        const creatorImage =
          typeof creator === "object" && creator?.profilePhotoUrl
            ? creator.profilePhotoUrl
            : o?.source?.images?.[0] ||
              "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&h=120&fit=crop";

        const rawStatus = o?.status || "approved";
        const cleanStatus = rawStatus === "approved"
          ? "Approved"
          : rawStatus === "cancelled"
            ? "Cancelled"
            : rawStatus === "pending"
              ? "Pending"
              : rawStatus === "rejected"
                ? "Rejected"
                : capitalizeWords(rawStatus);

        return {
          id: String(o?._id || idx),
          dealId: o?.dealId || o?.source?._id || o?._id,
          vendorName:
            o?.sourceType === "wholesale"
              ? creatorName
              : o?.source?.title || o?.businessName || o?.vendorName || "Order",
          locality: o?.source?.locality || o?.locality || undefined,
          status: cleanStatus as any,
          statusColor: cleanStatus === "Approved" ? "#22C55E" : undefined,
          imageUrl: creatorImage,
          orderedAt: o?.orderedAt ? new Date(o.orderedAt).toLocaleString() : "",
          updatedAt: o?.updatedAt,
          billTotal: Number(o?.amount) || 0,
          sourceType: o?.sourceType || undefined,
          items: Array.isArray(o?.items)
            ? o.items.map((it: any) => ({
                qty: Number(it?.qty) || 1,
                name: String(it?.name || "Item"),
              }))
            : [
                {
                  qty: Number(o?.quantity) || 1,
                  name: o?.sourceType === "event" ? "pax" : "Item",
                },
              ],
        };
      });
    }
    // Return empty array if no orders - no mock data
    return [];
  }, [userOrders, selectedType]);

  const listHeaderComponent = useMemo(
    () => (
      <View>
        <FilterChips
          options={ORDER_CATEGORIES || []}
          onChange={setSelectedType}
          initialValue={ORDER_CATEGORIES[0]?.id || "all"}
          horizontal
        />
      </View>
    ),
    [],
  );

  return (
    <>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: t.colors.background }]}
        edges={["left", "right", "bottom"]}
      >
        <View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + 16,
              backgroundColor: t.colors.background,
              borderBottomColor: t.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>
            My Orders
          </Text>
        </View>
        {userOrdersLoading && !refreshing ? (
          <SkeletonLoader />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.colors.primary}
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={(_, index) => ({
              length: 200, // Approximate item height
              offset: 200 * index,
              index,
            })}
            ListHeaderComponent={listHeaderComponent}
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                title="No Orders Yet"
                subtitle="Your order history will appear here once you place your first order."
              />
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  // Order card styles
  orderCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  subText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Legacy styles (can be removed if not used elsewhere)
  sourceTypeText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  orderImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 14,
  },
  orderInfo: {
    flex: 1,
  },
  vendorName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  locality: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemsContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  typeContainer: {
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 13,
    flex: 1,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "800",
  },

  // Quantity chip styles
  quantityChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 28,
    alignItems: "center",
  },
  quantityChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
