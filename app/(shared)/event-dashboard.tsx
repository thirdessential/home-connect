import Heading from "@/components/UI/Heading";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { EventParticipant } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.statTile, { borderColor: t.colors.border }]}>
      <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>{label}</Text>
      <Text style={[t.typography.h3, { color: t.colors.text, marginTop: 4 }]}>{value}</Text>
      {sub ? <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}

export default function EventDashboardScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { getDashboard, cancelEvent, dashboard, loading, saving } = useEventStore();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const load = useCallback(() => {
    if (eventId) getDashboard(eventId).catch((e: any) => showToast(e?.message ?? "Failed to load dashboard", "error"));
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleCancelEvent = async () => {
    if (!eventId) return;
    try {
      await cancelEvent(eventId);
      setCancelModalOpen(false);
      showToast("Event cancelled", "success");
      load();
    } catch (e: any) {
      showToast(e?.message ?? "Failed to cancel event", "error");
    }
  };

  if (loading && !dashboard) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator color={t.colors.brandDark} />
      </View>
    );
  }
  if (!dashboard) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <Text style={{ color: t.colors.secondaryText }}>Dashboard not available.</Text>
      </View>
    );
  }

  const { event, statistics, participants, cancelledCount } = dashboard;
  const isCancelled = event.status === "cancelled";

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
        {!isCancelled ? (
          <Pressable onPress={() => setCancelModalOpen(true)} hitSlop={8}>
            <Text style={{ color: "#DC2626", fontWeight: "700" }}>Cancel Event</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.eventCard, { borderColor: t.colors.border, backgroundColor: t.colors.cardBackground }]}>
          <Heading level={4}>{event.title}</Heading>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={t.colors.secondaryText} />
            <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 4 }]}>{event.startDate}</Text>
            {event.startTime ? <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 10 }]}>{event.startTime}</Text> : null}
            <Ionicons name="location-outline" size={14} color={t.colors.secondaryText} style={{ marginLeft: 10 }} />
            <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 4 }]}>{event.venue}</Text>
          </View>
          {isCancelled ? (
            <View style={styles.cancelledBadge}>
              <Text style={{ color: "#B91C1C", fontWeight: "700" }}>This event has been cancelled</Text>
            </View>
          ) : null}

          <Pressable
            style={styles.viewPageRow}
            onPress={() =>
              eventId &&
              router.push({ pathname: "/(shared)/event-details", params: { eventId: String(eventId) } })
            }
          >
            <Ionicons name="eye-outline" size={16} color={t.colors.brandDark} />
            <Text style={[t.typography.small, { color: t.colors.brandDark, fontWeight: "700", marginLeft: 6, flex: 1 }]}>
              View public event page
            </Text>
            <Ionicons name="chevron-forward" size={16} color={t.colors.brandDark} />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatTile label="Participation" value={`${statistics.joinedParticipants} / ${statistics.maximumParticipants}`} sub={`${statistics.percentageFilled}% filled`} />
          <StatTile label="Expected Revenue" value={`₹${statistics.expectedRevenue}`} sub={`₹${statistics.feePerParticipant} per participant`} />
        </View>

        <Heading level={5} style={{ marginTop: 20, marginBottom: 4 }}>
          Participants ({participants.length})
        </Heading>
        {cancelledCount > 0 ? (
          <Text style={[t.typography.small, { color: t.colors.secondaryText, marginBottom: 8 }]}>{cancelledCount} cancelled</Text>
        ) : null}

        {/* Per-participant cancellation isn't available yet on the backend
            (only whole-event cancel exists) — shown read-only with a note. */}
        <View style={[styles.blockerNote, { backgroundColor: t.colors.surfaceAlt }]}>
          <Ionicons name="information-circle-outline" size={16} color={t.colors.secondaryText} />
          <Text style={[t.typography.caption, { color: t.colors.secondaryText, marginLeft: 6, flex: 1 }]}>
            Removing a single participant isn't supported by the backend yet — the list below is read-only.
          </Text>
        </View>

        <FlatList
          data={participants}
          scrollEnabled={false}
          keyExtractor={(p) => p.userId}
          renderItem={({ item }: { item: EventParticipant }) => (
            <View style={[styles.participantRow, { borderColor: t.colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "700" }]}>{item.name}</Text>
                <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>
                  {[item.tower, item.unit].filter(Boolean).join(" • ") || "—"}
                </Text>
              </View>
              <Text style={[t.typography.caption, { color: t.colors.secondaryText }]}>Joined {item.joinedAt}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: t.colors.secondaryText, paddingVertical: 16 }}>No participants yet.</Text>}
        />
      </ScrollView>

      <ConfirmationModal
        visible={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelEvent}
        title="Cancel this event?"
        message="This will cancel the event for all participants. This action cannot be undone."
        confirmText="Cancel Event"
        cancelText="Keep Event"
        isDangerous
        isLoading={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  eventCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, flexWrap: "wrap" },
  cancelledBadge: { marginTop: 10, backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10 },
  viewPageRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  statsGrid: { flexDirection: "row", gap: 12, marginTop: 16 },
  statTile: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14 },
  blockerNote: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, marginBottom: 8 },
  participantRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1 },
});
