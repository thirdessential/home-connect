// "My Events" — Created Events (organized by the signed-in user) and Joined
// Events (successfully joined), each with status filters. Created: index of every event the user organized, with its
// actual status. Reads GET /api/events/my-events (ownership from the JWT, not
// a client-supplied id), then hands off to /(shared)/event-dashboard, which
// owns participants, stats and cancellation. No event state is managed here.

import Badge from "@/components/UI/Badge";
import NoDataCard from "@/components/common/NoDataCard";
import UserAvatar from "@/components/UI/UserAvatar";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { useEventStore } from "@/store/useEventStore";
import { useTheme } from "@/theme/theme";
import { EventRecord } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
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
  joined = false,
}: {
  event: EventRecord;
  onPress: (eventId: string) => void;
  joined?: boolean;
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
          <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: t.colors.white }]}>
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
        {!!event.venue && (
          <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {event.venue}
          </Text>
        )}
        <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {event.joinedCount}
          {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} joined
          {!joined ? ` • ${event.commentCount ?? 0} comments` : ""}
        </Text>
        {joined && event.organizer ? (
          <View style={styles.organizerLine}>
            <UserAvatar uri={event.organizer.profileImage} name={event.organizer.name} size={18} />
            <Text style={[styles.rowMeta, { color: t.colors.textSecondary, marginTop: 0 }]} numberOfLines={1}>
              {event.organizer.name}
            </Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={t.colors.textSecondary} />
    </TouchableOpacity>
  );
});

type Tab = "created" | "joined";
type Bucket = { items: EventRecord[]; page: number; hasMore: boolean; loading: boolean; error: string | null; loaded: boolean };
const EMPTY_BUCKET: Bucket = { items: [], page: 0, hasMore: false, loading: false, error: null, loaded: false };

export default function MyEventsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const fetchEventPage = useEventStore((s) => s.fetchEventPage);

  const [tab, setTab] = useState<Tab>("created");
  const [filter, setFilter] = useState<StatusFilter>("active");
  // One bucket per tab+status, so Created and Joined data can never mix.
  const [buckets, setBuckets] = useState<Record<string, Bucket>>({});
  const inFlight = useRef<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const keyOf = (tb: Tab, st: StatusFilter) => `${tb}:${st}`;
  const bucket = buckets[keyOf(tab, filter)] ?? EMPTY_BUCKET;

  const load = useCallback(
    async (tb: Tab, st: StatusFilter, page: number) => {
      const key = keyOf(tb, st);
      const flightKey = `${key}:${page}`;
      if (inFlight.current.has(flightKey)) return; // no duplicate requests
      inFlight.current.add(flightKey);
      setBuckets((b) => ({ ...b, [key]: { ...(b[key] ?? EMPTY_BUCKET), loading: true, error: null } }));
      try {
        const res = await fetchEventPage(tb, st, page);
        setBuckets((b) => {
          const prev = b[key] ?? EMPTY_BUCKET;
          const merged = page === 1 ? res.events : [...prev.items, ...res.events];
          // De-duplicate by id (a refresh racing pagination must not repeat cards).
          const seen = new Set<string>();
          const items = merged.filter((e) => (seen.has(String(e.id)) ? false : (seen.add(String(e.id)), true)));
          return { ...b, [key]: { items, page, hasMore: res.hasMore, loading: false, error: null, loaded: true } };
        });
      } catch (e: any) {
        setBuckets((b) => ({
          ...b,
          [key]: { ...(b[key] ?? EMPTY_BUCKET), loading: false, loaded: true, error: e?.message || "Couldn't load events" },
        }));
      } finally {
        inFlight.current.delete(flightKey);
      }
    },
    [fetchEventPage],
  );

  // Refresh the visible list whenever the screen is focused or the tab/filter
  // changes (cancelling an event elsewhere is reflected on return).
  useFocusEffect(
    useCallback(() => {
      void load(tab, filter, 1);
    }, [load, tab, filter]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(tab, filter, 1);
    setRefreshing(false);
  }, [load, tab, filter]);

  const onEndReached = useCallback(() => {
    if (bucket.hasMore && !bucket.loading) void load(tab, filter, bucket.page + 1);
  }, [bucket.hasMore, bucket.loading, bucket.page, load, tab, filter]);

  const openCreated = useCallback((eventId: string) => {
    router.push({ pathname: "/(shared)/event-dashboard", params: { eventId } });
  }, []);
  const openJoined = useCallback((eventId: string) => {
    router.push({ pathname: "/(shared)/event-details", params: { eventId } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: EventRecord }) => (
      <EventRow event={item} joined={tab === "joined"} onPress={tab === "joined" ? openJoined : openCreated} />
    ),
    [tab, openCreated, openJoined],
  );

  const statusLabel = FILTERS.find((f) => f.key === filter)?.label ?? "";
  const showSkeleton = bucket.loading && bucket.items.length === 0;
  const showError = !!bucket.error && bucket.items.length === 0;

  const empty = () => {
    // Overall-empty (no events at all) vs. empty only for this status.
    const isActiveFilter = filter === "active";
    if (tab === "created") {
      return (
        <View style={styles.emptyWrap}>
          <NoDataCard
            iconName="calendar-outline"
            message={isActiveFilter ? "No Created Events" : `No ${statusLabel} Events`}
            subText="Events you organize will appear here."
          />
          {isActiveFilter ? (
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: t.colors.brand }]} onPress={() => router.push("/(shared)/create-event")}>
              <Text style={[styles.emptyBtnText, { color: t.colors.onBrand }]}>Create Event</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <NoDataCard
          iconName="people-outline"
          message={isActiveFilter ? "No Joined Events" : `No ${statusLabel} Events`}
          subText="Events you join will appear here."
        />
        {isActiveFilter ? (
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: t.colors.brand }]} onPress={() => router.push("/(tabs)/home")}>
            <Text style={[styles.emptyBtnText, { color: t.colors.onBrand }]}>Explore Events</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.white, paddingTop: insets.top }]}>
      <TitleHeader title="My Events" onBackPress={() => router.back()} />

      {/* Primary tabs */}
      <View style={styles.tabRow}>
        {([
          { key: "created", label: "Created Events", icon: "calendar-outline" },
          { key: "joined", label: "Joined Events", icon: "people-outline" },
        ] as const).map((tb) => {
          const active = tb.key === tab;
          return (
            <TouchableOpacity
              key={tb.key}
              onPress={() => setTab(tb.key)}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.tab,
                { backgroundColor: active ? t.colors.brand : t.colors.white, borderColor: active ? t.colors.brand : t.colors.border },
              ]}
            >
              <Ionicons name={tb.icon} size={18} color={active ? t.colors.onBrand : t.colors.textPrimary} />
              <Text style={[styles.tabLabel, { color: active ? t.colors.onBrand : t.colors.textPrimary }]}>{tb.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
                <Text style={[styles.filterChipLabel, { color: isSelected ? t.colors.onBrand : t.colors.textPrimary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={76} borderRadius={12} style={styles.skeleton} />
          ))}
        </View>
      ) : showError ? (
        <View style={styles.emptyWrap}>
          <NoDataCard iconName="cloud-offline-outline" message="Couldn't load events" subText={bucket.error ?? undefined} />
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: t.colors.brand }]} onPress={() => load(tab, filter, 1)}>
            <Text style={[styles.emptyBtnText, { color: t.colors.onBrand }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bucket.items}
          keyExtractor={(item) => `${tab}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            bucket.items.length === 0 && styles.listEmpty,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={bucket.loading && bucket.items.length > 0 ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
          ListEmptyComponent={bucket.loaded ? empty() : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  tabLabel: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  organizerLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  emptyBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontFamily: "Manrope_600SemiBold" },
  filterRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  filterChipLabel: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
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
  rowTitle: { fontSize: 15, fontFamily: "Manrope_600SemiBold", marginBottom: 2, flexShrink: 1 },
  rowMeta: { fontSize: 12, marginTop: 1 },
});
