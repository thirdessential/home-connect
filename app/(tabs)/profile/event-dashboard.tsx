// "My Events" — index of every event the signed-in user organized, with its
// actual status. Reads GET /api/events/my-events (ownership from the JWT, not
// a client-supplied id), then hands off to /(shared)/event-dashboard, which
// owns participants, stats and cancellation. No event state is managed here.

import Badge from "@/components/UI/Badge";
import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { EventRecord } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "#16A34A" },
  cancelled: { label: "Cancelled", color: "#DC2626" },
  closed: { label: "Closed", color: "#6B7280" },
  completed: { label: "Completed", color: "#2563EB" },
};

// Reused verbatim from app/(shared)/event-dashboard.tsx so the date/time
// shown here matches the rest of the event flow (Dashboard/Details/Create).
function formatDateShort(raw?: string | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

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

type StatusFilter = "active" | "completed" | "closed" | "cancelled";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
];

const EventRow = memo(function EventRow({
  event,
  onPress,
}: {
  event: EventRecord;
  onPress: (eventId: string) => void;
}) {
  const t = useTheme();
  const cover = event.image;
  const badge = STATUS_BADGE[event.status] ?? { label: event.status, color: t.colors.textSecondary };

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
      onPress={() => onPress(String(event.id))}
      activeOpacity={0.7}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: t.colors.background }]}>
          <Ionicons name="calendar-outline" size={22} color={t.colors.textSecondary} />
        </View>
      )}

      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]} numberOfLines={1}>
            {event.title || "Untitled event"}
          </Text>
          <Badge label={badge.label} color={badge.color} size="xs" />
        </View>
        {!!(event.startDate || event.startTime) && (
          <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {[formatDateShort(event.startDate), event.startTime ? formatTime12h(event.startTime) : null]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        )}
        <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {event.joinedCount}
          {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} joined
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={t.colors.textSecondary} />
    </TouchableOpacity>
  );
});

export default function MyEventsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const allEvents = useEventStore((s) => s.myEvents);
  const loading = useEventStore((s) => s.loading);
  const getMyEvents = useEventStore((s) => s.getMyEvents);
  const [filter, setFilter] = useState<StatusFilter>("active");

  const load = useCallback(() => {
    void getMyEvents();
  }, [getMyEvents]);

  useEffect(() => {
    load();
  }, [load]);

  // Status comes straight from the DB-backed /my-events response — never
  // inferred from date/time on the client.
  const events = useMemo(
    () => allEvents.filter((e) => e.status === filter),
    [allEvents, filter],
  );

  const openDashboard = useCallback((eventId: string) => {
    router.push({ pathname: "/(shared)/event-dashboard", params: { eventId } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: EventRecord }) => <EventRow event={item} onPress={openDashboard} />,
    [openDashboard],
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <TitleHeader title="My Events" onBackPress={() => router.back()} />
      <View> 
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
      
        {FILTERS.map((f) => {
          const isSelected = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? t.colors.brand : t.colors.surface,
                  borderColor: isSelected ? t.colors.brand : t.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  { color: isSelected ? t.colors.onBrand : t.colors.textPrimary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
        </View>

      {loading && events.length === 0 ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={76} borderRadius={12} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            events.length === 0 && styles.listEmpty,
          ]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <NoDataCard
              iconName="calendar-outline"
              message={`No ${FILTERS.find((f) => f.key === filter)?.label} Events`}
              subText="Events you organize will appear here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  filterChipLabel: { fontSize: 12, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  skeletons: { paddingHorizontal: 16, paddingTop: 12 },
  skeleton: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, marginLeft: 12 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2, flexShrink: 1 },
  rowMeta: { fontSize: 12, marginTop: 1 },
});
