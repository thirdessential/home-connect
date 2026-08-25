// "My Events" — index of the events the signed-in user organized.
//
// Events themselves live in the MySQL Event API (see store/useEventStore.ts).
// This screen is only an index: it reads the user's own feed rows to find which
// events they created, then hands off to /(shared)/event-dashboard, which owns
// participants, stats and cancellation. No event state is managed here.
//
// The feed is used as the index because the Event API exposes no "list my
// events" endpoint. Rows without a mysqlEventId predate the Event API and are
// filtered out — they have nothing to open.

import NoDataCard from "@/components/common/NoDataCard";
import Skeleton from "@/components/UI/Skeleton";
import TitleHeader from "@/components/UI/TitleHeader";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { FeedItem } from "@/types/feeds.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EventRow = memo(function EventRow({
  event,
  onPress,
}: {
  event: FeedItem;
  onPress: (eventId: string) => void;
}) {
  const t = useTheme();
  const cover = event.images?.[0];
  const joined = event.registeredParticipants ?? event.rsvps?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
      onPress={() => onPress(String(event.mysqlEventId))}
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
        <Text style={[styles.rowTitle, { color: t.colors.textPrimary }]} numberOfLines={1}>
          {event.title || "Untitled event"}
        </Text>
        {!!(event.eventDate || event.eventTime) && (
          <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {[event.eventDate, event.eventTime].filter(Boolean).join(" • ")}
          </Text>
        )}
        <Text style={[styles.rowMeta, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {joined}
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

  const userId = useUserStore((s) => s.user?._id);
  const feedsByUser = useFeedsStore((s) => s.feedsByUser);
  const loading = useFeedsStore((s) => s.loading);
  const getFeedsByUserId = useFeedsStore((s) => s.getFeedsByUserId);

  const load = useCallback(() => {
    if (userId) void getFeedsByUserId(userId);
  }, [userId, getFeedsByUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // Only events that exist in the Event API can be opened.
  const events = useMemo(
    () => (feedsByUser ?? []).filter((f) => f.type === "event" && f.mysqlEventId),
    [feedsByUser],
  );

  const openDashboard = useCallback((eventId: string) => {
    router.push({ pathname: "/(shared)/event-dashboard", params: { eventId } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <EventRow event={item} onPress={openDashboard} />,
    [openDashboard],
  );

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <TitleHeader title="My Events" onBackPress={() => router.back()} />

      {loading && events.length === 0 ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={76} borderRadius={12} style={styles.skeleton} />
          ))}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
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
              message="No Events Yet"
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
  rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowMeta: { fontSize: 12, marginTop: 1 },
});
