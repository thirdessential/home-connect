import { COMMON_CONSTANTS } from "@/assets/constants/common.constant";
import Heading from "@/components/UI/Heading";
import Skeleton from "@/components/UI/Skeleton";
import { useToast } from "@/components/common/Toast";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { EventParticipant } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INITIAL_VISIBLE_PARTICIPANTS = 8;
const PARTICIPANTS_PAGE_SIZE = 10;

// Even at 0% the bar should read as "a progress bar", not an empty line —
// matches the convention already used on Event Details / the home feed card.
const MIN_VISIBLE_PROGRESS_PCT = 3;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Tower/unit values sometimes carry a raw Mongo ObjectId from stale data —
// never surface that in the UI (same guard as Event Details).
const isRawObjectId = (v: unknown) => /^[0-9a-fA-F]{24}$/.test(String(v ?? ""));
const cleanLocationPart = (v: string | null | undefined) =>
  v && !isRawObjectId(v) ? v : null;

// "Sun, 3 Aug"
function formatDateShort(raw?: string | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// "07:00:00" | "07:00" -> "7:00 AM"
function formatTime12h(raw?: string | null): string {
  if (!raw) return "";
  const [hStr, mStr] = raw.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// ISO datetime -> "today, 4:00 PM" or "3 Aug, 4:00 PM"
function formatDateTimeLabel(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return sameDay ? `today, ${time}` : `${formatDateShort(iso)}, ${time}`;
}

// ISO datetime -> "28 Jul, 10:30 AM"
function formatJoinedAt(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return `${formatDateShort(iso)}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

// Countdown to an ISO datetime -> "2h 15m" / "3d 4h" / "Closed"
function formatCountdown(iso?: string | null): { label: string; closed: boolean } {
  if (!iso) return { label: "—", closed: false };
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return { label: "—", closed: false };
  const diff = target - Date.now();
  if (diff <= 0) return { label: "Closed", closed: true };
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days >= 1) return { label: `${days}d ${hours}h`, closed: false };
  if (hours >= 1) return { label: `${hours}h ${minutes}m`, closed: false };
  return { label: `${minutes}m`, closed: false };
}

// "5 days" / "Today" / "Tomorrow" / "Started"
function formatDaysUntil(iso?: string | null): string {
  if (!iso) return "—";
  const target = new Date(iso);
  if (isNaN(target.getTime())) return "—";
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(target) - startOfDay(now)) / 86400000);
  if (diffDays < 0) return "Started";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays} days`;
}

function Avatar({ p, size = 44 }: { p: { name: string; profileImage: string | null }; size?: number }) {
  const t = useTheme();
  if (p.profileImage) {
    return (
      <Image
        source={{ uri: p.profileImage }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.brandWeak,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: t.colors.brandDark, fontWeight: "700", fontSize: size * 0.35 }}>
        {initials(p.name)}
      </Text>
    </View>
  );
}

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.headerAction}>
      <Ionicons name={icon} size={22} color={t.colors.text} />
      <Text style={[t.typography.caption, { color: t.colors.text, marginTop: 4 }]}>{label}</Text>
    </Pressable>
  );
}

function ParticipantRow({
  item,
  onCancel,
  showCancel,
}: {
  item: EventParticipant;
  onCancel?: () => void;
  showCancel: boolean;
}) {
  const t = useTheme();
  const location = [cleanLocationPart(item.tower), cleanLocationPart(item.unit)]
    .filter(Boolean)
    .join(" • ");
  return (
    <View style={[styles.participantRow, { borderColor: t.colors.border }]}>
      <Avatar p={{ name: item.name, profileImage: item.profileImage }} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={[t.typography.body, { color: t.colors.text, fontWeight: "700" }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {!!location && (
          <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>{location}</Text>
        )}
        <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 2 }]}>
          Joined {formatJoinedAt(item.joinedAt)}
        </Text>
      </View>
      {showCancel && (
        <Pressable onPress={onCancel} style={styles.cancelBtn} hitSlop={8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

function DashboardSkeleton() {
  const t = useTheme();
  return (
    <View style={{ padding: 20 }}>
      <View
        style={[
          styles.eventCard,
          { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground, flexDirection: "row" },
        ]}
      >
        <Skeleton width={90} height={90} borderRadius={14} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Skeleton width="80%" height={20} style={{ marginBottom: 10 }} />
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.statCell, { borderColor: t.colors.border }]}>
            <Skeleton width="70%" height={12} style={{ marginBottom: 10 }} />
            <Skeleton width="50%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={12} />
          </View>
        ))}
      </View>
      <Skeleton width="100%" height={220} borderRadius={16} />
    </View>
  );
}

export default function EventDashboardScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const {
    getDashboard,
    cancelEvent,
    cancelParticipant,
    getCancelledParticipants,
    dashboard,
    cancelledParticipants,
    loading,
    saving,
  } = useEventStore();

  const [cancelEventModalOpen, setCancelEventModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EventParticipant | null>(null);
  const [cancelledModalOpen, setCancelledModalOpen] = useState(false);
  const [cancelledLoading, setCancelledLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PARTICIPANTS);

  const load = useCallback(() => {
    if (eventId) getDashboard(eventId).catch((e: any) => showToast(e?.message ?? "Failed to load dashboard", "error"));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelEvent = async () => {
    if (!eventId) return;
    try {
      await cancelEvent(eventId);
      setCancelEventModalOpen(false);
      showToast("Event cancelled", "success");
      load();
    } catch (e: any) {
      showToast(e?.message ?? "Failed to cancel event", "error");
    }
  };

  const handleCancelParticipant = async () => {
    if (!eventId || !cancelTarget) return;
    try {
      await cancelParticipant(eventId, cancelTarget.userId);
      setCancelTarget(null);
      showToast("Participation cancelled", "success");
      load();
    } catch (e: any) {
      showToast(e?.message ?? "Failed to cancel participation", "error");
    }
  };

  const openCancelledModal = () => {
    setCancelledModalOpen(true);
    if (!eventId) return;
    setCancelledLoading(true);
    getCancelledParticipants(eventId)
      .catch((e: any) => showToast(e?.message ?? "Failed to load cancelled participants", "error"))
      .finally(() => setCancelledLoading(false));
  };

  const onEditEvent = () => showToast("Editing events isn't available yet", "info");

  const onCreateNotification = () => showToast("Sending notifications isn't available yet", "info");

  const onInviteParticipants = () => {
    if (!dashboard) return;
    const { event } = dashboard;
    const when = [formatDateShort(event.startDate), event.startTime ? formatTime12h(event.startTime) : null]
      .filter(Boolean)
      .join(" • ");
    Share.share({
      title: event.title,
      message: `Join "${event.title}"${when ? ` on ${when}` : ""} at ${event.venue}!`,
    }).catch(() => {});
  };

  const visibleParticipants = useMemo(
    () => dashboard?.participants.slice(0, visibleCount) ?? [],
    [dashboard?.participants, visibleCount],
  );
  const remainingCount = (dashboard?.participants.length ?? 0) - visibleParticipants.length;

  if (loading && !dashboard) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top }}>
        <DashboardSkeleton />
      </View>
    );
  }
  if (!dashboard) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={40} color={t.colors.secondaryText} />
        <Text style={{ color: t.colors.secondaryText, marginTop: 12 }}>Dashboard not available.</Text>
        <Pressable onPress={load} style={{ marginTop: 16 }}>
          <Text style={{ color: t.colors.brandDark, fontWeight: "700" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { event, statistics, participants, cancelledCount } = dashboard;
  const isCancelled = event.status === "cancelled";
  const displayFillPct = statistics.maximumParticipants > 0
    ? Math.max(statistics.percentageFilled, statistics.joinedParticipants > 0 ? MIN_VISIBLE_PROGRESS_PCT : 0)
    : 0;
  const deadline = formatCountdown(statistics.registrationDeadline);
  const isPaid = event.participationType === "paid";

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Heading level={4}>Event Dashboard</Heading>
          <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>As organiser</Text>
        </View>
        <HeaderAction icon="create-outline" label="Edit Event" onPress={onEditEvent} />
        <View style={{ width: 16 }} />
        <HeaderAction
          icon="ellipsis-vertical"
          label="More"
          onPress={() => !isCancelled && setCancelEventModalOpen(true)}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={[styles.eventCard, { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground }]}>
          {event.image ? (
            <Image source={{ uri: event.image }} style={styles.eventImage} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={[t.colors.brand, t.colors.brandDark]}
              style={[styles.eventImage, styles.eventImageFallback]}
            >
              <Ionicons name="calendar-outline" size={30} color={t.colors.onBrand} />
            </LinearGradient>
          )}

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Heading level={4} numberOfLines={2}>{event.title}</Heading>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color={t.colors.brandDark} />
                <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 5 }]}>
                  {formatDateShort(event.startDate)}
                </Text>
              </View>
              {!!event.startTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={15} color={t.colors.brandDark} />
                  <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 5 }]}>
                    {formatTime12h(event.startTime)}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={t.colors.brandDark} />
                <Text
                  style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 5 }]}
                  numberOfLines={1}
                >
                  {event.venue}
                </Text>
              </View>
            </View>

            <View style={styles.tagsRow}>
              {!!event.eventType && (
                <View style={[styles.tag, { backgroundColor: t.colors.brandWeak }]}>
                  <Ionicons name="pricetag-outline" size={14} color={t.colors.brandDark} />
                  <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 6 }]}>
                    {event.eventType}
                  </Text>
                </View>
              )}
              <View style={[styles.tag, { backgroundColor: t.colors.brandWeak }]}>
                <Ionicons
                  name={event.visibility === "community" ? "eye-outline" : "globe-outline"}
                  size={14}
                  color={t.colors.brandDark}
                />
                <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 6 }]}>
                  {event.visibility === "community" ? "Profile visible to residents" : "Public event"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isCancelled && (
          <View style={[styles.cancelledBadge, { marginBottom: 16 }]}>
            <Text style={{ color: "#B91C1C", fontWeight: "700" }}>This event has been cancelled</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={[styles.statCell, { borderColor: t.colors.border }]}>
            <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Participation</Text>
            <Text style={[t.typography.h3, { color: t.colors.brandDark, marginTop: 10 }]}>
              {statistics.joinedParticipants} / {statistics.maximumParticipants}
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 6 }]}>
              Spots filled
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${displayFillPct}%`, backgroundColor: t.colors.brandDark },
                ]}
              />
            </View>
            <Text style={[t.typography.caption, { color: t.colors.brandDark, fontWeight: "700", marginTop: 4 }]}>
              {statistics.percentageFilled}%
            </Text>
          </View>

          <View style={[styles.statCell, { borderColor: t.colors.border }]}>
            <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Expected Revenue</Text>
            {isPaid ? (
              <>
                <Text style={[t.typography.h3, { color: t.colors.brandDark, marginTop: 10 }]}>
                  {COMMON_CONSTANTS.CURRENCY}
                  {statistics.expectedRevenue}
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 6 }]}>
                  Total expected revenue
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 8 }]}>
                  {COMMON_CONSTANTS.CURRENCY}
                  {statistics.feePerParticipant} per participant
                </Text>
              </>
            ) : (
              <>
                <Text style={[t.typography.h3, { color: t.colors.brandDark, marginTop: 10 }]}>Free</Text>
                <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 6 }]}>
                  No paid registration
                </Text>
              </>
            )}
          </View>

          <View style={[styles.statCell, { borderColor: t.colors.border }]}>
            <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Deadline</Text>
            <Text
              style={[
                t.typography.h3,
                { color: deadline.closed ? t.colors.error : t.colors.warning, marginTop: 10 },
              ]}
            >
              {deadline.label}
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 6 }]}>
              {deadline.closed ? "Registration closed" : "left to join"}
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 8 }]}>
              Registration closes{"\n"}
              {formatDateTimeLabel(statistics.registrationDeadline)}
            </Text>
          </View>

          <View style={[styles.statCell, { borderColor: t.colors.border }]}>
            <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Event in</Text>
            <Text style={[t.typography.h3, { color: t.colors.text, marginTop: 10 }]}>
              {formatDaysUntil(statistics.eventStartAt)}
            </Text>
            <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 6 }]}>
              {formatDateShort(event.startDate)}
            </Text>
            {!!event.startTime && (
              <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 8 }]}>
                {formatTime12h(event.startTime)}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.participantsCard, { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground }]}>
          <View style={styles.participantsHeader}>
            <Heading level={5}>Participants ({participants.length})</Heading>
            <Pressable onPress={openCancelledModal} hitSlop={8} style={styles.cancelledLink}>
              <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>
                View cancelled ({cancelledCount})
              </Text>
              <Ionicons name="chevron-forward" size={16} color={t.colors.secondaryText} />
            </Pressable>
          </View>

          <FlatList
            data={visibleParticipants}
            scrollEnabled={false}
            keyExtractor={(p) => p.userId}
            renderItem={({ item }) => (
              <ParticipantRow
                item={item}
                showCancel={!isCancelled}
                onCancel={() => setCancelTarget(item)}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: t.colors.secondaryText, paddingVertical: 16, textAlign: "center" }}>
                No participants yet.
              </Text>
            }
          />

          {remainingCount > 0 && (
            <Pressable
              style={[styles.moreParticipants, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}
              onPress={() => setVisibleCount((c) => c + PARTICIPANTS_PAGE_SIZE)}
            >
              <Text style={[t.typography.small, { color: t.colors.brandDark, fontWeight: "700" }]}>
                {remainingCount} more participant{remainingCount === 1 ? "" : "s"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={t.colors.brandDark} />
            </Pressable>
          )}
        </View>

        {!isCancelled && (
          <View style={styles.bottomActions}>
            <Pressable
              style={[styles.actionCard, { backgroundColor: t.colors.brandDark }]}
              onPress={onCreateNotification}
            >
              <Ionicons name="megaphone-outline" size={26} color={t.colors.onBrand} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: t.colors.onBrand, fontWeight: "700", fontSize: 15 }}>
                  Create a notification
                </Text>
                <Text style={{ color: "#DCEFE5", fontSize: 12, marginTop: 2 }}>
                  Remind or update all participants
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.actionCard, styles.inviteAction, { borderColor: t.colors.border }]}
              onPress={onInviteParticipants}
            >
              <Ionicons name="share-social-outline" size={26} color={t.colors.brandDark} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: t.colors.brandDark, fontWeight: "700", fontSize: 15 }}>
                  Invite more participants
                </Text>
                <Text style={{ color: t.colors.secondaryText, fontSize: 12, marginTop: 2 }}>
                  Share with residents
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={14} color={t.colors.secondaryText} />
          <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginLeft: 6 }]}>
            Only you can see this dashboard
          </Text>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={cancelEventModalOpen}
        onClose={() => setCancelEventModalOpen(false)}
        onConfirm={handleCancelEvent}
        title="Cancel this event?"
        message="This will cancel the event for all participants. This action cannot be undone."
        confirmText="Cancel Event"
        cancelText="Keep Event"
        isDangerous
        isLoading={saving}
      />

      <ConfirmationModal
        visible={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelParticipant}
        title="Cancel this participant?"
        message={`Are you sure you want to cancel this event participation for ${cancelTarget?.name ?? "this resident"}?`}
        confirmText="Cancel"
        cancelText="Keep"
        isDangerous
        isLoading={saving}
      />

      <Modal
        visible={cancelledModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCancelledModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.cancelledSheet,
              { backgroundColor: t.colors.background, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.cancelledHeader}>
              <Heading level={5}>Cancelled participants ({cancelledCount})</Heading>
              <Pressable onPress={() => setCancelledModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={t.colors.text} />
              </Pressable>
            </View>
            {cancelledLoading ? (
              <View style={{ paddingVertical: 24 }}>
                <Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 10 }} />
                <Skeleton width="100%" height={56} borderRadius={12} />
              </View>
            ) : (
              <FlatList
                data={cancelledParticipants}
                keyExtractor={(p) => p.userId}
                renderItem={({ item }) => <ParticipantRow item={item} showCancel={false} />}
                ListEmptyComponent={
                  <Text style={{ color: t.colors.secondaryText, textAlign: "center", paddingVertical: 24 }}>
                    No cancelled participants.
                  </Text>
                }
                style={{ maxHeight: "100%" }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  headerAction: { alignItems: "center", justifyContent: "center" },

  eventCard: { flexDirection: "row", borderWidth: 1, borderRadius: 16, padding: 16 },
  eventImage: { width: 90, height: 90, borderRadius: 14 },
  eventImageFallback: { alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", maxWidth: "100%" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tag: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },

  cancelledBadge: { backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16, marginBottom: 16 },
  statCell: { flexBasis: "47%", flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: 14 },
  progressTrack: { width: "100%", height: 6, borderRadius: 10, backgroundColor: "#E8EEEB", overflow: "hidden", marginTop: 10 },
  progressFill: { height: "100%", borderRadius: 10 },

  participantsCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  participantsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cancelledLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  participantRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  cancelBtn: { height: 36, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1.5, borderColor: "#F04438", alignItems: "center", justifyContent: "center" },
  cancelBtnText: { color: "#D92D20", fontWeight: "700", fontSize: 13 },
  moreParticipants: { marginTop: 8, height: 48, borderRadius: 11, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },

  bottomActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  actionCard: { flexBasis: "100%", flexGrow: 1, minHeight: 78, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center" },
  inviteAction: { borderWidth: 1, backgroundColor: "#FBFDFC" },

  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  cancelledSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  cancelledHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
});
