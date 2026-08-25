import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import NoDataCard from "@/components/common/NoDataCard";
import CircularImage from "@/components/form/CircularImage";
import WholesaleDealForm from "@/components/form/WholesaleDealForm";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { Card } from "@/components/UI/Card";
import OrderProgressBar from "@/components/UI/OrderProgress";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { shareProduct } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useWholesaleDealStore } from "@/store/useWholesaleDealStore";
import { useTheme } from "@/theme/theme";
import { WholesaleDeal } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Memoized Event List Item Component
const EventListItem = memo(({ dealListCard, theme, onPress }: any) => {
  return (
    <TouchableOpacity onPress={() => onPress(dealListCard)} activeOpacity={0.7}>
      <Card style={styles.eventListCard}>
        <View style={styles.eventListContent}>
          {dealListCard?.image ? (
            <View style={[styles.avatar, { backgroundColor: "#4ECDC4" }]}>
              <Text style={styles.avatarText}>
                {dealListCard.title?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          ) : (
            <CircularImage uri={dealListCard.image} size={48} />
          )}
          <View style={styles.eventListInfo}>
            <Text
              style={[
                styles.eventListTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              {dealListCard.title}
            </Text>
            <Text
              style={[styles.eventListPrice, { color: theme.colors.primary }]}
            >
              {dealListCard.price === 0
                ? "Free"
                : `${COMMON_CONSTANTS.CURRENCY}${dealListCard.price}`}{" "}
              • {dealListCard.goal} {dealListCard.unit}
            </Text>
            <OrderProgressBar
              current={dealListCard.currentProgress}
              total={dealListCard.goal}
              showLabel={true}
            />
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
});
EventListItem.displayName = "EventListItem";

// Event List Skeleton Component
const EventListSkeleton = memo(() => (
  <View style={styles.eventListContainer}>
    {[1, 2, 3].map((index) => (
      <View key={index}>
        <Card style={styles.eventListCard}>
          <View style={styles.eventListContent}>
            <Skeleton width={60} height={60} borderRadius={8} />
            <View style={styles.eventListInfo}>
              <Skeleton width="80%" height={16} style={{ marginBottom: 4 }} />
              <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
              <View style={styles.eventListProgressSection}>
                <View style={{ flex: 1 }}>
                  <Skeleton height={6} borderRadius={3} />
                </View>
                <Skeleton width={60} height={12} style={{ marginLeft: 8 }} />
              </View>
            </View>
            <Skeleton width={20} height={20} borderRadius={10} />
          </View>
        </Card>
        {index < 3 && <View style={{ height: 12 }} />}
      </View>
    ))}
  </View>
));
EventListSkeleton.displayName = "EventListSkeleton";

// Helper function to generate color from string
const getColorFromString = (str: string): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#FFE66D",
    "#95E1D3",
    "#F38181",
    "#AA96DA",
    "#FCBAD3",
    "#A8E6CF",
    "#FFD3B6",
    "#FFA07A",
    "#98D8C8",
    "#C7CEEA",
    "#FFDAC1",
    "#B5EAD7",
    "#E2F0CB",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to extract tower/building from address
const extractTower = (address: string): string => {
  if (!address) return "N/A";
  const towerMatch = address.match(/Tower\s+[A-Z0-9]+/i);
  if (towerMatch) return towerMatch[0];
  const blockMatch = address.match(/Block\s+[A-Z0-9]+/i);
  if (blockMatch) return blockMatch[0];
  return "N/A";
};

// Memoized Event Info Component
const EventInfoCard = memo(({ eventData, theme }: any) => {
  return (
    <Card style={styles.eventCard}>
      <View style={styles.eventHeader}>
        {/* <Image source={{ uri: eventData.image }} style={styles.eventImage} /> */}
        {eventData?.image ? (
          <View style={[styles.avatar, { backgroundColor: "#4ECDC4" }]}>
            <Text style={styles.avatarText}>
              {eventData.title?.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        ) : (
          <CircularImage uri={eventData.image} size={48} />
        )}
        <View style={styles.eventInfo}>
          <Text
            style={[styles.eventTitle, { color: theme.colors.textPrimary }]}
          >
            {eventData.title}
          </Text>
          <Text style={[styles.eventPrice, { color: theme.colors.primary }]}>
            ₹{eventData.price}
          </Text>
          <Text
            style={[styles.eventGoal, { color: theme.colors.textSecondary }]}
          >
            Goal: {eventData.goal} {eventData.unit}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text
            style={[
              styles.progressLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            PROGRESS
          </Text>
          <Text style={[styles.progressValue, { color: theme.colors.primary }]}>
            {eventData.currentProgress} / {eventData.goal} {eventData.unit}
          </Text>
        </View>
        <OrderProgressBar
          current={eventData.currentProgress}
          total={eventData.goal}
          showLabel={false}
        />
      </View>
    </Card>
  );
});
EventInfoCard.displayName = "EventInfoCard";

// Memoized Stat Card Component
const StatCard = memo(
  ({ label, value, description, valueColor, descriptionColor }: any) => (
    <Card style={styles.statCard}>
      <Text style={[styles.statLabel, { color: valueColor }]}> {label} </Text>
      <Text style={[styles.statValue, { color: valueColor }]}> {value} </Text>
      <Text style={[styles.statDescription, { color: descriptionColor }]}>
        {description}
      </Text>
    </Card>
  ),
);
StatCard.displayName = "StatCard";

// Memoized Request Card Component
const RequestCard = memo(
  ({ request, activeTab, theme, onReject }: any) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestContent}>
        {request.profilePhotoUrl ? (
          <CircularImage uri={request.profilePhotoUrl} size={48} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: request.color }]}>
            <Text style={styles.avatarText}> {request.initials} </Text>
          </View>
        )}

        <View style={styles.requestInfo}>
          <Text
            style={[styles.requestName, { color: theme.colors.textPrimary }]}
          >
            {request.name}
          </Text>
          <Text
            style={[
              styles.requestDetails,
              { color: theme.colors.textSecondary },
            ]}
          >
            {request.quantity} • {COMMON_CONSTANTS.CURRENCY}
            {request.amount}
          </Text>
        </View>

        {/* Approved orders show Reject action; rejected orders are read-only */}
        {activeTab === "approved" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(request.id)}
            >
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        {activeTab === "rejected" && (
          <View
            style={[
              styles.actionButton,
              {
                backgroundColor: "#FEE2E2",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                width: 80,
                opacity: 0.8

              },
            ]}
          >
            <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700" }}>
              Rejected
            </Text>
          </View>
        )}
      </View>
    </Card>
  ),
);
RequestCard.displayName = "RequestCard";

export default function EventRequestScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"approved" | "rejected">("approved");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const currentDealRef = useRef<any>(null);

  // Store hooks
  const { user } = useUserStore();
  const {
    usersDeal,
    getDealsByUserId,
    loading,
    selectedDeal,
    setSelectedDeal,
    getDealById,
    updateDeal,
    removeDeal,
    updateOrderStatus,
  } = useWholesaleDealStore();
  const [currentDeal, setCurrentDeal] = useState<any>(null);
  const [loadingDealView, setLoadingDealView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [loadingDealDetails, setLoadingDealDetails] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  // Fetch user's deals on mount
  useEffect(() => {
    if (user?._id) {
      getDealsByUserId(user._id);
    }
  }, [user?._id, getDealsByUserId]);

  // Keep ref in sync with currentDeal
  useEffect(() => {
    currentDealRef.current = currentDeal;
  }, [currentDeal]);

  // Filter and map deals to display format
  const dealsData = useMemo(
    () =>
      (usersDeal || []).map((deal: WholesaleDeal) => ({
        id: deal._id,
        title: deal.title || "Untitled Deal",
        price: deal.price?.sellingPrice
          ? parseFloat(deal.price.sellingPrice)
          : 0,
        image: deal.images?.[0] || "https://via.placeholder.com/80",
        goal: deal.minimumOrderQty || 0,
        unit: deal.unit || "Units",
        currentProgress: deal.currentOrderedQty || 0,
        approvedRevenue: `₹${deal.orders
          ?.reduce((sum: number, orderItem: any) => {
            const price = parseFloat(orderItem.amount || 0);
            return sum + price;
          }, 0)
          .toLocaleString()}`,
        totalParticipation: deal?.currentOrderedQty || 0,
        deadline: deal.orderDeadlineDate
          ? new Date(deal.orderDeadlineDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })
          : "N/A",
        daysRemaining: deal.orderDeadlineDate
          ? Math.ceil(
              (new Date(deal.orderDeadlineDate).getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
        leadTime: deal.estimatedDeliveryDate
          ? new Date(deal.estimatedDeliveryDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })
          : "N/A",
        leadTimeDescription: "Order to delivery",
        description: deal.description,
      })),
    [usersDeal],
  );

  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === "ios" ? 40 : 24),
    [insets.top],
  );

  const handleDealSelect = useCallback(
    async (deal: any) => {
      setCurrentDeal(deal);
      setLoadingDealView(true);

      // Start animation immediately
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Set selectedDeal immediately from usersDeal array
      const fullDeal = usersDeal?.find((d) => d._id === deal.id);
      if (fullDeal) {
        setSelectedDeal(fullDeal);
      }

      // Fetch full deal details including orders in background
      if (deal.id) {
        await getDealById(deal.id);
      }

      setLoadingDealView(false);
    },
    [slideAnim, getDealById, usersDeal, setSelectedDeal],
  );

  const handleBackToList = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentDeal(null);
    });
  }, [slideAnim]);

  const handleApprove = useCallback(
    (id: string) => {
      if (selectedDeal?._id) {
        updateOrderStatus(selectedDeal._id, id, "approved").then(() => {
          if (user?._id) getDealsByUserId(user._id);
          getDealById(selectedDeal._id!);
        });
      }
    },
    [selectedDeal?._id, updateOrderStatus, getDealsByUserId, getDealById, user?._id],
  );

  const handleReject = useCallback(
    (id: string) => {
      if (selectedDeal?._id) {
        updateOrderStatus(selectedDeal._id, id, "rejected").then(() => {
          if (user?._id) getDealsByUserId(user._id);
          getDealById(selectedDeal._id!);
        });
      }
    },
    [selectedDeal?._id, updateOrderStatus, getDealsByUserId, getDealById, user?._id],
  );

  // Broadcasting to society members needs a server-side notification endpoint,
  // which the API does not expose yet. Kept inert rather than faking a send.
  const handleBroadcast = useCallback(() => {
    Alert.alert(
      "Broadcast unavailable",
      "Sending a broadcast to your society is not supported yet.",
    );
  }, []);

  const handleShare = useCallback(() => {
    if (!selectedDeal) return;
    void shareProduct({
      name: selectedDeal.title ?? "Deal",
      description: selectedDeal.description,
      price: selectedDeal.price?.sellingPrice,
      link: `homeconnect://deal/${selectedDeal._id}`,
    });
  }, [selectedDeal]);

  const handleTabChange = useCallback((tab: "approved" | "rejected") => {
    setActiveTab(tab);
  }, []);

  // Map orders from selectedDeal to request format
  const pendingRequests = useMemo(() => {
    if (!selectedDeal?.orders) return [];
    return selectedDeal.orders
      .filter((order: any) => order.status === "pending")
      .map((order: any) => {
        const populatedUser =
          typeof order.userId === "object" && order.userId !== null
            ? order.userId
            : null;
        const userName =
          populatedUser?.fullName ||
          order?.dealerName ||
          "Anonymous User";

        return {
          id: order._id,
          name: userName,
          quantity: `${order.quantity} ${currentDeal?.unit || "Units"}`,
          tower: extractTower(order.delivery?.address || ""),
          initials: getInitials(userName),
          color: getColorFromString(userName),
          profilePhotoUrl: populatedUser?.profilePhotoUrl || null,
          amount: order.amount,
          phone: order.delivery?.phone,
        };
      });
  }, [selectedDeal?.orders, currentDeal?.unit]);

  const approvedRequests = useMemo(() => {
    if (!selectedDeal?.orders) return [];
    return selectedDeal.orders
      .filter(
        (order: any) =>
          order.status === "approved" ||
          order.status === "confirmed" ||
          order.status === "delivered",
      )
      .map((order: any) => {
        const populatedUser =
          typeof order.userId === "object" && order.userId !== null
            ? order.userId
            : null;
        const userName =
          populatedUser?.fullName ||
          order?.dealerName ||
          "Unknown User";
        const userId =
          populatedUser?._id || order.userId || order._id;

        return {
          id: order._id || userId,
          name: userName,
          quantity: `${order.quantity} ${currentDeal?.unit || "Units"}`,
          tower: extractTower(order.delivery?.address || ""),
          initials: getInitials(userName),
          color: getColorFromString(String(userId)),
          profilePhotoUrl: populatedUser?.profilePhotoUrl || null,
          amount: order.amount,
          phone: order.delivery?.phone,
        };
      });
  }, [selectedDeal?.orders, currentDeal?.unit]);

  const rejectedRequests = useMemo(() => {
    if (!selectedDeal?.orders) return [];
    return selectedDeal.orders
      .filter((order: any) => order.status === "rejected" || order.status === "cancelled")
      .map((order: any) => {
        const populatedUser =
          typeof order.userId === "object" && order.userId !== null
            ? order.userId
            : null;
        const userName =
          populatedUser?.fullName ||
          order?.dealerName ||
          "Unknown User";
        const userId = populatedUser?._id || order.userId || order._id;
        return {
          id: order._id || userId,
          name: userName,
          quantity: `${order.quantity} ${currentDeal?.unit || "Units"}`,
          tower: extractTower(order.delivery?.address || ""),
          initials: getInitials(userName),
          color: getColorFromString(String(userId)),
          profilePhotoUrl: populatedUser?.profilePhotoUrl || null,
          amount: order.amount,
          phone: order.delivery?.phone,
        };
      });
  }, [selectedDeal?.orders, currentDeal?.unit]);

  const currentRequests = useMemo(
    () => activeTab === "approved" ? approvedRequests : rejectedRequests,
    [activeTab, approvedRequests, rejectedRequests],
  );

  const statsData = useMemo(
    () =>
      currentDeal
        ? [
            {
              label: "APPROVED REVENUE",
              value: `${currentDeal.approvedRevenue.toLocaleString()}`,
              description: "From approved orders",
              valueColor: theme.colors.textPrimary,
              descriptionColor: theme.colors.textSecondary,
            },
            {
              label: "TOTAL PARTICIPATION",
              value: `${currentDeal.totalParticipation.toLocaleString()}`,
              description: "Inc. pending requests",
              valueColor: theme.colors.primary,
              descriptionColor: theme.colors.textSecondary,
            },
            {
              label: "DEADLINE",
              value: currentDeal.deadline,
              description: `${currentDeal.daysRemaining} days remaining`,
              valueColor: theme.colors.textPrimary,
              descriptionColor: "#EF4444",
            },
            {
              label: "LEAD TIME",
              value: currentDeal.leadTime,
              description: currentDeal.leadTimeDescription,
              valueColor: theme.colors.textPrimary,
              descriptionColor: theme.colors.textSecondary,
            },
          ]
        : [],
    [currentDeal, theme.colors],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: any }) => (
      <RequestCard
        request={item}
        activeTab={activeTab}
        theme={theme}
        onReject={handleReject}
      />
    ),
    [activeTab, theme, handleReject],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const renderDealListItem = useCallback(
    ({ item }: { item: any }) => (
      <EventListItem
        dealListCard={item}
        theme={theme}
        onPress={handleDealSelect}
      />
    ),
    [theme, handleDealSelect],
  );

  const handleCancelDeal = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const currentDeal = currentDealRef.current;
    if (currentDeal?.id) {
      try {
        await removeDeal(currentDeal.id);
        setShowDeleteConfirm(false);
        // Refresh the deal list
        if (user?._id) {
          await getDealsByUserId(user._id);
        }
        // Navigate back to list
        handleBackToList();
      } catch (error) {
        console.error("Error deleting deal:", error);
        setShowDeleteConfirm(false);
      }
    }
  }, [removeDeal, user?._id, getDealsByUserId, handleBackToList]);

  const handleEditDeal = useCallback(async () => {
    const currentDeal = currentDealRef.current;
    if (currentDeal?.id) {
      setEditingDealId(currentDeal.id);
      setModalVisible(true);
      setLoadingDealDetails(true);
      try {
        await getDealById(currentDeal.id);
        setEditingDealId(currentDeal.id);
      } catch (error) {
        console.error("Error fetching deal details:", error);
      } finally {
        setLoadingDealDetails(false);
      }
    }
  }, []);

  const closeManage = useCallback(() => {
    setModalVisible(false);
    setEditingDealId(null);
    setLoadingDealDetails(false);
    setSubmitStatus("idle");
  }, []);

  // Define the onDealSubmit handler
  const onDealSubmit = useCallback(
    async (data: any) => {
      if (editingDealId) {
        setSubmitStatus("submitting");
        try {
          await updateDeal({ ...selectedDeal, ...data }, editingDealId);
          setSubmitStatus("success");
          // Refresh the deal list
          if (user?._id) {
            await getDealsByUserId(user._id);
          }
          // Navigate to profile after a short delay
          setTimeout(() => {
            setModalVisible(false);
            setEditingDealId(null);
            setSubmitStatus("idle");
            router.push("/(tabs)/profile");
          }, 2000);
        } catch (error) {
          console.error("Error updating deal:", error);
          setSubmitStatus("error");
        }
      }
    },
    [editingDealId, selectedDeal, updateDeal, user?._id, getDealsByUserId],
  );

  // Prepare initial data for WholesaleDealForm from dealItem
  const dealFormInitialData = useMemo(() => {
    if (!editingDealId || !selectedDeal || selectedDeal._id !== editingDealId) {
      return undefined;
    }
    return {
      images: selectedDeal.images || [],
      title: selectedDeal.title || "",
      description: selectedDeal.description || "",
      price: selectedDeal.price,
      orderDeadlineDate: selectedDeal.orderDeadlineDate || "",
      minimumOrderQty: selectedDeal.minimumOrderQty || 0,
      maximumOrderQty: selectedDeal.maximumOrderQty || 0,
      unit: selectedDeal.unit || "",
      estimatedDeliveryDate: selectedDeal.estimatedDeliveryDate || "",
    };
  }, [editingDealId, selectedDeal]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: topPadding },
      ]}
    >
      {/* Header */}
      <TitleHeader
        title={currentDeal ? currentDeal.title : "Deals Dashboard"}
        onBackPress={currentDeal ? handleBackToList : router.back}
        showOptionsMenu={!!currentDeal}
        onCancelEvent={handleCancelDeal}
        onEditEvent={handleEditDeal}
      />

      {/* Deal List View */}
      {!currentDeal && (
        <>
          {loading && (!usersDeal || usersDeal.length === 0) ? (
            <EventListSkeleton />
          ) : (
            <FlatList
              data={dealsData}
              renderItem={renderDealListItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.eventListContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <NoDataCard
                  iconName="reader-outline"
                  message="No Deals Available"
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </>
      )}

      {/* Deal Detail View with Animation */}
      {currentDeal && (
        <Animated.View
          style={[
            styles.detailContainer,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          {loadingDealView ? (
            <View style={[styles.scrollContent, { paddingTop: 16 }]}>
              {/* Deal Info Card Skeleton */}
              <Card style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Skeleton width={80} height={80} borderRadius={8} />
                  <View style={[styles.eventInfo, { marginLeft: 12 }]}>
                    <Skeleton
                      width="80%"
                      height={16}
                      style={{ marginBottom: 4 }}
                    />
                    <Skeleton
                      width="40%"
                      height={20}
                      style={{ marginBottom: 4 }}
                    />
                    <Skeleton width="60%" height={13} />
                  </View>
                </View>
                <View style={styles.progressSection}>
                  <Skeleton height={8} borderRadius={4} />
                </View>
              </Card>

              {/* Stats Grid Skeleton */}
              <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((index) => (
                  <Card key={index} style={styles.statCard}>
                    <Skeleton
                      width="60%"
                      height={11}
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton
                      width="80%"
                      height={18}
                      style={{ marginBottom: 4 }}
                    />
                    <Skeleton width="70%" height={12} />
                  </Card>
                ))}
              </View>

              {/* Tabs Skeleton */}
              <View style={styles.tabsContainer}>
                <Skeleton width="45%" height={40} />
                <Skeleton width="45%" height={40} />
              </View>

              {/* Request List Skeleton */}
              {[1, 2, 3].map((index) => (
                <Card key={index} style={styles.requestCard}>
                  <View style={styles.requestContent}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <View style={[styles.requestInfo, { marginLeft: 12 }]}>
                      <Skeleton
                        width="60%"
                        height={15}
                        style={{ marginBottom: 2 }}
                      />
                      <Skeleton width="80%" height={13} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Deal Info Card */}
              <EventInfoCard eventData={currentDeal} theme={theme} />

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {statsData.map((stat, index) => (
                  <StatCard key={index} {...stat} />
                ))}
              </View>

              {/* Tabs: Approved (default) | Rejected */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "approved" && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => handleTabChange("approved")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "approved"
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                      },
                      activeTab === "approved" && styles.activeTabText,
                    ]}
                  >
                    Approved ({approvedRequests.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "rejected" && [
                      styles.activeTab,
                      { borderBottomColor: "#EF4444" },
                    ],
                  ]}
                  onPress={() => handleTabChange("rejected")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          activeTab === "rejected"
                            ? "#EF4444"
                            : theme.colors.textSecondary,
                      },
                      activeTab === "rejected" && styles.activeTabText,
                    ]}
                  >
                    Rejected ({rejectedRequests.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Request List */}
              <FlatList
                data={currentRequests}
                renderItem={renderRequestItem}
                keyExtractor={keyExtractor}
                scrollEnabled={false}
              />
            </ScrollView>
          )}

          {/* Bottom Action Buttons */}
          <View
            style={[
              styles.bottomActions,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <ActionButton
              title="Broadcast"
              onPress={handleBroadcast}
              leftIcon={<Ionicons name="megaphone" size={20} color="white" />}
              containerStyle={styles.broadcastButton}
            />

            <ActionButton
              title="Share"
              onPress={handleShare}
              variant="outline"
              leftIcon={
                <Ionicons
                  name="share-social"
                  size={20}
                  color={theme.colors.primary}
                />
              }
              containerStyle={styles.shareButton}
              textStyle={{ color: theme.colors.primary }}
            />
          </View>
        </Animated.View>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Cancel Deal"
        message="Are you sure you want to cancel this deal? This action cannot be undone."
        confirmText="Cancel"
        cancelText="Keep"
        isDangerous={true}
      />

      <FormSheetModal
        visible={modalVisible}
        onClose={closeManage}
        title="Edit Deal"
        scroll={true}
      >
        {loadingDealDetails ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}> Loading deal details...</Text>
          </View>
        ) : submitStatus === "submitting" ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}> Updating deal...</Text>
          </View>
        ) : submitStatus === "success" ? (
          <View style={styles.messageContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color="#10B981"
              style={styles.messageIcon}
            />
            <Text style={[styles.messageTitle, { color: "#10B981" }]}>
              Success!
            </Text>
            <Text style={styles.messageText}>
              Your deal has been updated successfully.
            </Text>
          </View>
        ) : submitStatus === "error" ? (
          <View style={styles.messageContainer}>
            <Ionicons
              name="alert-circle"
              size={64}
              color="#EF4444"
              style={styles.messageIcon}
            />
            <Text style={[styles.messageTitle, { color: "#EF4444" }]}>
              Error!
            </Text>
            <Text style={styles.messageText}>
              Failed to update deal. Please try again after some time.
            </Text>
            <ActionButton
              title="Close"
              onPress={closeManage}
              containerStyle={styles.closeButton}
            />
          </View>
        ) : (
          <WholesaleDealForm
            onSubmit={onDealSubmit}
            onBack={() => setModalVisible(false)}
            initialData={dealFormInitialData}
            isEdit={true}
          />
        )}
      </FormSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventListCard: {
    padding: 0,
  },
  eventListContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  eventListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  eventListInfo: {
    flex: 1,
  },
  eventListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventListPrice: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventListProgressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventListProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  eventListProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  eventListProgressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  eventPrice: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventGoal: {
    fontSize: 13,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  requestCard: {
    padding: 12,
  },
  requestContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  requestDetails: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
  },
  approveButton: {
    backgroundColor: "#D1FAE5",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  broadcastButton: {
    flex: 2,
  },
  shareButton: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  messageContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messageIcon: {
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  closeButton: {
    minWidth: 120,
  },
});
