import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import { verificationStatus } from "@/assets/enums/common.enum";
import { EVENT_CANCEL_REASONS } from "@/assets/mocks/category";
import NoDataCard from "@/components/common/NoDataCard";
import CircularImage from "@/components/form/CircularImage";
import EventForm from "@/components/form/EventForm";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import FormSheetModal from "@/components/modals/FormSheetModal";
import { Card } from "@/components/UI/Card";
import OrderProgressBar from "@/components/UI/OrderProgress";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Memoized Event List Item Component
const EventListItem = memo(({ event, theme, onPress }: any) => {
  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.7}>
      <Card style={styles.eventListCard}>
        <View style={styles.eventListContent}>
          <Image source={{ uri: event.image }} style={styles.eventListImage} />
          <View style={styles.eventListInfo}>
            <Text
              style={[
                styles.eventListTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              {event.title}
            </Text>
            <Text
              style={[styles.eventListPrice, { color: theme.colors.primary }]}
            >
              {event.price === 0
                ? "Free"
                : `${COMMON_CONSTANTS.CURRENCY}${event.price}`}{" "}
              • {event.goal} {event.unit}
            </Text>
            <OrderProgressBar
              current={event.currentProgress}
              total={event.goal}
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

// Memoized Event Info Component
const EventInfoCard = memo(({ eventData, theme }: any) => {
  const progressPercentage = useMemo(
    () => (eventData.currentProgress / eventData.goal) * 100,
    [eventData.currentProgress, eventData.goal],
  );

  return (
    <Card>
      <View style={styles.eventHeader}>
        <Image source={{ uri: eventData.image }} style={styles.eventImage} />
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
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${progressPercentage}%`,
              },
            ]}
          />
        </View>
      </View>
    </Card>
  );
});
EventInfoCard.displayName = "EventInfoCard";

// Memoized Stat Card Component
const StatCard = memo(
  ({ label, value, description, valueColor, descriptionColor }: any) => (
    <Card style={styles.statCard}>
      <Text style={[styles.statLabel, { color: valueColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.statDescription, { color: descriptionColor }]}>
        {description}
      </Text>
    </Card>
  ),
);
StatCard.displayName = "StatCard";

// Memoized Participant Card with approve/reject actions
const ParticipantCard = memo(
  ({ rsvpItem, theme, onApprove, onReject, isApproved }: any) => {
    const AVATAR_COLORS = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
    ];
    const colorIndex = rsvpItem.fullName
      ? rsvpItem.fullName.charCodeAt(0) % AVATAR_COLORS.length
      : 0;
    const initials = rsvpItem.fullName
      ? rsvpItem.fullName
          .split(" ")
          .slice(0, 2)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
      : "?";

      // console.log("===============================================================");
      // console.log("test", rsvpItem.verificationStatus.status)

    return (
      <Card style={styles.participantCard}>
        <View style={styles.participantContent}>
          {rsvpItem.profilePhotoUrl ? (
            <CircularImage uri={rsvpItem.profilePhotoUrl} size={44} />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: AVATAR_COLORS[colorIndex] },
              ]}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          <View style={styles.participantInfo}>
            <Text
              style={[styles.requestName, { color: theme.colors.textPrimary }]}
            >
              {rsvpItem.fullName || "Unknown"}
            </Text>
            <Text
              style={[
                styles.requestDetails,
                { color: theme.colors.textSecondary },
              ]}
            >
              {rsvpItem.participants || 1}{" "}
              {(rsvpItem.participants || 1) === 1 ? "person" : "people"} •{" "}
              {!rsvpItem.price || rsvpItem.price === 0
                ? "Free"
                : `${COMMON_CONSTANTS.CURRENCY}${rsvpItem.price}`}
            </Text>
          </View>

          <View style={styles.participantActions}>

            <TouchableOpacity
              style={styles.actionBtnReject}
              onPress={() => onReject(rsvpItem.user || rsvpItem._id)}
            >
              <Ionicons name="close" size={16} color="#EF4444" />
            </TouchableOpacity>

            {!isApproved && (
              <TouchableOpacity
                style={styles.actionBtnApprove}
                onPress={() => {onApprove(rsvpItem.user || rsvpItem._id)}}
              >
                <Ionicons name="checkmark" size={16} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  },
);
ParticipantCard.displayName = "ParticipantCard";

export default function EventRequestScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const selectedEventRef = useRef<any>(null);

  // Store hooks
  const { user } = useUserStore();
  const {
    feedsByUser,
    getFeedsByUserId,
    loading,
    getFeedById,
    feedItem,
    updateFeed,
    removeFeed,
    removeRSVP,
    addOrUpdateRSVP,
  } = useFeedsStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loadingFeedDetails, setLoadingFeedDetails] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [participantTab, setParticipantTab] = useState<"pending" | "approved">(
    "pending",
  );

    // const user = useUserStore((s) => s.user);


  // console.log("Feeds by user:", user);
  // console.log("participantTab by user:", participantTab);

  // Fetch user's events on mount
  useEffect(() => {
    if (user?._id) {
      getFeedsByUserId(user._id);
    }
  }, [user?._id, getFeedsByUserId]);


  // console.log("Feeds by user:", user?._id);

  // Keep ref in sync with selectedEvent
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
  }, [selectedEvent]);

  // Filter only event type feeds and map to event format
  const eventsData = useMemo(
    () =>
      feedsByUser
        .filter((feed) => feed.type === "event")
        .map((feed) => ({
          id: feed._id,
          title: feed.title || "Untitled Event",
          price: parseInt(feed.price || "0"),
          image: feed.images?.[0] || "https://via.placeholder.com/80",
          goal: parseInt(feed.maxParticipants || "0"),
          unit: "People",
          currentProgress:
            feed.registeredParticipants || feed.rsvps?.length || 0,
          approvedRevenue: 0, // Calculate based on your business logic
          projectedRevenue: 0, // Calculate based on your business logic
          deadline: feed.regDeadline
            ? new Date(feed.regDeadline).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })
            : "N/A",
          daysRemaining: feed.regDeadline
            ? Math.ceil(
                (new Date(feed.regDeadline).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0,
          leadTime: `${new Date(feed.eventDate || "").toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
            },
          )} at ${feed.eventTime}`,
          leadTimeDescription: "Event to delivery",
          location: feed.location,
          eventTime: feed.eventTime,
          description: feed.description,
          minParticipants: feed.minParticipants,
          eventDetails: feed.eventDetails,
          rsvps: feed.rsvps || [],
        })),
    [feedsByUser],
  );

  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === "ios" ? 40 : 24),
    [insets.top],
  );

  const handleEventSelect = useCallback(
    (event: any) => {
      setSelectedEvent(event);
      setParticipantTab("pending");
      getFeedById(event.id);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [slideAnim, getFeedById],
  );

  const handleBackToList = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedEvent(null);
    });
  }, [slideAnim]);

  const handleApproveParticipant = useCallback(async (userId: string) => {
    const currentEvent = selectedEventRef.current;
    // console.log("Approving userId:", userId, "for eventId:", currentEvent?.id);
    if (!currentEvent?.id) return;
    await addOrUpdateRSVP(currentEvent.id, {
      userId,
      verificationStatus: {
        status: verificationStatus.APPROVED,
      },
    });
    await getFeedById(currentEvent.id);
    if (user?._id) await getFeedsByUserId(user._id);
  }, []);

  const handleRejectParticipant = useCallback(async (userId: string) => {
    const currentEvent = selectedEventRef.current;
    if (!currentEvent?.id) return;
    await addOrUpdateRSVP(currentEvent.id, {
      userId,
      verificationStatus: {
        status: verificationStatus.REJECTED,
      },
    });
    await getFeedById(currentEvent.id);
    if (user?._id) await getFeedsByUserId(user._id);
  }, []);

  const registeredParticipants = useMemo(
    () =>
      feedItem?._id === selectedEvent?.id
        ? feedItem?.rsvps || []
        : selectedEvent?.rsvps || [],
    [selectedEvent, feedItem],
  );

  const pendingParticipants = useMemo(
    () =>
      registeredParticipants.filter(
        (r: any) => !r.status || r.status === verificationStatus.PENDING,
      ),
    [registeredParticipants],
  );

  const approvedParticipants = useMemo(
    () =>
      registeredParticipants.filter(
        (r: any) => r.status === verificationStatus.APPROVED,
      ),
    [registeredParticipants],
  );

  const displayedParticipants = useMemo(
    () =>
      participantTab === "pending" ? pendingParticipants : approvedParticipants,
    [participantTab, pendingParticipants, approvedParticipants],
  );

  const statsData = useMemo(
    () =>
      selectedEvent
        ? [
            {
              label: "APPROVED REVENUE",
              value: `₹${selectedEvent.rsvps
                .reduce((sum: number, rsvp: any) => {
                  const price = parseFloat(rsvp.price || 0);
                  return sum + price;
                }, 0)
                .toLocaleString()}`,
              description: "From approved orders",
              valueColor: theme.colors.textPrimary,
              descriptionColor: theme.colors.textSecondary,
            },
            {
              label: "TOTAL REGISTRATIONS",
              value: `${selectedEvent.currentProgress.toLocaleString()}`,
              description: "Inc. pending requests",
              valueColor: theme.colors.primary,
              descriptionColor: theme.colors.textSecondary,
            },
            {
              label: "REGISTRATION DEADLINE",
              value: selectedEvent.deadline,
              description: `${selectedEvent.daysRemaining} days remaining`,
              valueColor: theme.colors.textPrimary,
              descriptionColor: "#EF4444",
            },
            {
              label: "EVENT DETAILS",
              value: selectedEvent.leadTime,
              description: selectedEvent.leadTimeDescription,
              valueColor: theme.colors.textPrimary,
              descriptionColor: theme.colors.textSecondary,
            },
          ]
        : [],
    [selectedEvent, theme.colors],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: any }) => (
      <ParticipantCard
        rsvpItem={item}
        theme={theme}
        onApprove={handleApproveParticipant}
        onReject={handleRejectParticipant}
        isApproved={participantTab === "approved"}
      />
    ),
    [theme, handleApproveParticipant, handleRejectParticipant, participantTab],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) =>
      item.id || item._id || item.userId || index.toString(),
    [],
  );

  const renderEventListItem = useCallback(
    ({ item }: { item: any }) => (
      <EventListItem event={item} theme={theme} onPress={handleEventSelect} />
    ),
    [theme, handleEventSelect],
  );

  const handleCancelEvent = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const currentEvent = selectedEventRef.current;
    if (currentEvent?.id) {
      try {
        await removeFeed(currentEvent.id);
        // Need to show reason to end customer: Pending
        setShowDeleteConfirm(false);
        // Refresh the feed list
        if (user?._id) {
          await getFeedsByUserId(user._id);
        }
        // Navigate back to list
        handleBackToList();
      } catch (error) {
        console.error("Error deleting event:", error);
        setShowDeleteConfirm(false);
      }
    }
  }, []);

  const handleEditEvent = useCallback(async () => {
    const currentEvent = selectedEventRef.current;
    if (currentEvent?.id) {
      setModalVisible(true);
      setLoadingFeedDetails(true);
      try {
        await getFeedById(currentEvent.id);
        setEditingEventId(currentEvent.id);
      } catch (error) {
        console.error("Error fetching feed details:", error);
      } finally {
        setLoadingFeedDetails(false);
      }
    }
  }, [getFeedById]);

  const closeManage = useCallback(() => {
    setModalVisible(false);
    setEditingEventId(null);
    setLoadingFeedDetails(false);
    setSubmitStatus("idle");
  }, []);

  // Define the onEventSubmit handler
  const onEventSubmit = useCallback(
    async (data: any) => {
      if (editingEventId) {
        setSubmitStatus("submitting");
        try {
          await updateFeed(editingEventId, {
            ...feedItem,
            ...data,
            type: "event",
          });
          setSubmitStatus("success");
          // Refresh the feed list
          if (user?._id) {
            await getFeedsByUserId(user._id);
          }
          // Navigate to home after a short delay
          setTimeout(() => {
            setModalVisible(false);
            setEditingEventId(null);
            setSubmitStatus("idle");
            router.push("/(tabs)/profile");
          }, 2000);
        } catch (error) {
          console.error("Error updating event:", error);
          setSubmitStatus("error");
        }
      }
    },
    [editingEventId, updateFeed, feedItem, user?._id, getFeedsByUserId],
  );

  // Prepare initial data for EventForm from feedItem
  const eventFormInitialData = useMemo(() => {
    if (!editingEventId || !feedItem || feedItem._id !== editingEventId) {
      return undefined;
    }
    return {
      banner: feedItem.images?.[0] || "",
      title: feedItem.title || "",
      description: feedItem.description || "",
      price: feedItem.price || "",
      isFree: !feedItem.price || feedItem.price === "0",
      location: feedItem.location || "",
      eventDate: feedItem.eventDate || "",
      eventTime: feedItem.eventTime || "",
      regDeadline: feedItem.eventDate || "",
      minParticipants: feedItem.minParticipants || "",
      maxParticipants: feedItem.maxParticipants || "",
      details: {
        materials: feedItem.eventDetails?.materials || false,
        refreshments: feedItem.eventDetails?.refreshments || false,
        freeChildren: feedItem.eventDetails?.freeChildren || false,
        guests: feedItem.eventDetails?.guests || false,
      },
    };
  }, [editingEventId, feedItem]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: topPadding },
      ]}
    >
      {/* Header */}
      <TitleHeader
        title={selectedEvent ? selectedEvent.title : "Events Dashboard"}
        onBackPress={selectedEvent ? handleBackToList : router.back}
        showOptionsMenu={!!selectedEvent}
        onCancelEvent={handleCancelEvent}
        onEditEvent={handleEditEvent}
      />

      {/* Event List View */}
      {!selectedEvent && (
        <>
          {loading && feedsByUser.length === 0 ? (
            <EventListSkeleton />
          ) : (
            <FlatList
              data={eventsData}
              renderItem={renderEventListItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.eventListContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <NoDataCard
                  iconName="reader-outline"
                  message="No Events Available"
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </>
      )}

      {/* Event Detail View with Animation */}
      {selectedEvent && (
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
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Event Info Card */}
            <EventInfoCard eventData={selectedEvent} theme={theme} />

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {statsData.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </View>

            {/* Registered Participants */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Registered Participants
              </Text>
            </View>

            {/* Pending / Approved Tabs */}
            <View
              style={[
                styles.tabRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  participantTab === "pending" && {
                    borderBottomWidth: 2,
                    borderBottomColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setParticipantTab("pending")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        participantTab === "pending"
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Pending ({pendingParticipants.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  participantTab === "approved" && {
                    borderBottomWidth: 2,
                    borderBottomColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setParticipantTab("approved")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        participantTab === "approved"
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Approved ({approvedParticipants.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Participant List */}
            <FlatList
              data={displayedParticipants}
              renderItem={renderRequestItem}
              keyExtractor={keyExtractor}
              scrollEnabled={false}
              ListEmptyComponent={
                <NoDataCard
                  iconName="people-outline"
                  message={
                    participantTab === "pending"
                      ? "No pending requests"
                      : "No approved participants"
                  }
                />
              }
            />
          </ScrollView>
        </Animated.View>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Cancellation & Warning Logic"
        message="Are you sure you want to cancel this event? This action cannot be undone. Frequent cancellations can lead to account deactivation"
        confirmText="Cancel"
        cancelText="Keep"
        isDangerous={true}
        dropdownOptions={EVENT_CANCEL_REASONS}
        dropdownLabel="Select Reason for Cancellation"
      />

      <FormSheetModal
        visible={modalVisible}
        onClose={closeManage}
        title="Edit Event"
        scroll={true}
      >
        {loadingFeedDetails ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading event details...</Text>
          </View>
        ) : submitStatus === "submitting" ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Updating event...</Text>
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
              Your event has been updated successfully.
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
              Failed to update event. Please try again after some time.
            </Text>
            <ActionButton
              title="Close"
              onPress={closeManage}
              containerStyle={styles.closeButton}
            />
          </View>
        ) : (
          <EventForm
            onSubmit={onEventSubmit}
            onBack={() => setModalVisible(false)}
            initialData={eventFormInitialData}
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
  // eventCard: {
  //   marginBottom: 16,
  // },
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
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    // marginBottom: 16,
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
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rsvpCard: {
    padding: 12,
  },
  participantCard: {
    padding: 12,
  },
  participantContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnReject: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnApprove: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  requestContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
