import Heading from "@/components/UI/Heading";
import SuccessModal from "@/components/UI/SuccessModal";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { useEventStore } from "@/store/useEventStore";
import { useUserStore } from "@/store/useUserStore";
import { formatPostTime } from "@/lib/dateTime";
import { getHeight, useTheme } from "@/theme/theme";
import { EventParticipant } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Tower/unit values sometimes carry a raw Mongo ObjectId from stale data —
// never surface that in the UI.
const isRawObjectId = (v: unknown) => /^[0-9a-fA-F]{24}$/.test(String(v ?? ""));
const cleanLocationPart = (v: string | null | undefined) =>
  v && !isRawObjectId(v) ? v : null;

// Even at 0 participants the bar should read as "a progress bar", not an
// empty line — a small minimum fill communicates that without misstating data.
const MIN_VISIBLE_PROGRESS_PCT = 3;

// "29 Aug 2026" from an ISO/plain date string — locale-formatted, not raw.
const formatEventDate = (raw?: string | null) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

// Duration from start/end time strings ("18:30" style). Backend doesn't
// provide a duration field, so it's derived here rather than hardcoded.
const formatDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // crosses midnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
};

// Reserve space above the fixed footer so the last scroll content is never hidden behind it.
// (Matches the footer's own height — was 500, far larger than the ~110pt footer, which
// left a large empty gap at the bottom of the scroll content.)
const FOOTER_SPACE = getHeight(110);

function Avatar({ p, size = 40 }: { p: { name: string; profileImage: string | null }; size?: number }) {
  const t = useTheme();
  if (p.profileImage) {
    return <Image source={{ uri: p.profileImage }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.brandWeak, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: t.colors.brandDark, fontWeight: "700", fontSize: size * 0.35 }}>{initials(p.name)}</Text>
    </View>
  );
}

export default function EventDetailsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const {
    getEvent, joinEvent, getParticipants, currentEvent, participants, loading,
    toggleLike,
  } = useEventStore();
  const currentUserId = useUserStore((s) => s.user?._id);

  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [joinedUsersOpen, setJoinedUsersOpen] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [joining, setJoining] = useState(false);
  const submittingRef = useRef(false);

  // GET /api/events/:id does not return like state, so it is only known after
  // the first toggle — see Remaining notes.
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);

  const load = useCallback(() => {
    if (eventId) getEvent(eventId).catch((e: any) => showToast(e?.message ?? "Failed to load event", "error"));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async () => {
    if (submittingRef.current || !eventId) return;
    submittingRef.current = true;
    setJoining(true);
    try {
      await joinEvent(eventId);
      setJoinSheetOpen(false);
      setJoinedSuccess(true);
      load();
    } catch (e: any) {
      showToast(e?.message ?? "Failed to join event", "error");
    } finally {
      setJoining(false);
      submittingRef.current = false;
    }
  };

  const onShare = () => {
    if (!currentEvent) return;
    Share.share({
      title: currentEvent.title,
      message: `${currentEvent.title}\n${currentEvent.venue}`,
    }).catch(() => {});
  };

  const openJoinedUsers = () => {
    if (eventId)
      getParticipants(eventId).catch((e: any) =>
        showToast(e?.message ?? "Failed to load participants", "error"),
      );
    setJoinedUsersOpen(true);
  };

  // PATCH /api/events/:id/like — response drives both the flag and the count.
  const onToggleLike = async () => {
    if (!eventId || likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await toggleLike(eventId);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch (err: any) {
      showToast(err?.message ?? "Failed to update like", "error");
    } finally {
      setLikeBusy(false);
    }
  };

  if (loading && !currentEvent) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator color={t.colors.brandDark} />
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.background }]}>
        <Text style={{ color: t.colors.secondaryText }}>Event not found.</Text>
      </View>
    );
  }

  const e = currentEvent;

  // Conditions the API rejects a join on. Mirrors the server's own checks so the
  // footer can explain the block instead of surfacing a failed request.
  const joinBlockedReason =
    e.status === "cancelled"
      ? "This event was cancelled"
      : e.remainingCapacity <= 0
        ? "This event is full"
        : e.registrationDeadline && new Date(e.registrationDeadline).getTime() <= Date.now()
          ? "Registration has closed"
          : null;

  const isCreator = !!currentUserId && e.organizer?.userId === currentUserId;

  const joinedPreview = Array.isArray(e.joinedPreview) ? e.joinedPreview : [];
  const rawFilledPct = e.maxParticipants > 0 ? Math.min(100, Math.round((e.joinedCount / e.maxParticipants) * 100)) : 0;
  const visualFilledPct = e.maxParticipants > 0 ? Math.max(rawFilledPct, MIN_VISIBLE_PROGRESS_PCT) : 0;
  const organizerLocation = [cleanLocationPart(e.organizer?.tower), cleanLocationPart(e.organizer?.unit)]
    .filter(Boolean)
    .join(" • ");
  const duration = formatDuration(e.startTime, e.endTime);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.white, paddingTop: insets.top }}>
      <View style={[styles.headerRow, { backgroundColor: t.colors.surface }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.headerBtn, { backgroundColor: t.colors.surfaceAlt }]}>
          <Ionicons name="arrow-back" size={20} color={t.colors.text} />
        </Pressable>
        <Heading level={4}>Event Details</Heading>
        <Pressable onPress={onShare} hitSlop={12} style={[styles.headerBtn, { backgroundColor: t.colors.surfaceAlt }]}>
          <Ionicons name="share-outline" size={20} color={t.colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: FOOTER_SPACE + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: t.colors.surfaceAlt }]}>
          {e.image ? (
            <Image source={{ uri: e.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            // Default visual when the event has no image — same brand
            // gradient + calendar icon used on the Home event card.
            <LinearGradient
              colors={[t.colors.brand, t.colors.brandDark]}
              style={[StyleSheet.absoluteFillObject, styles.heroFallback]}
            >
              <Ionicons name="calendar-outline" size={56} color={t.colors.onBrand} />
            </LinearGradient>
          )}
          {!!e.eventType && (
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag" size={14} color="#fff" />
              <Text style={styles.categoryPillText}>{e.eventType}</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 4 }}>
          <Heading level={2}>{e.title}</Heading>
          {!!e.description && (
            <Text style={[t.typography.body, { color: t.colors.secondaryText }]}>{e.description}</Text>
          )}
        </View>

        {/* Info card: Date & Time / Duration / Location */}
        <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, { backgroundColor: t.colors.brandWeak }]}>
              <Ionicons name="calendar-outline" size={18} color={t.colors.brandDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Date & Time</Text>
              <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "600" }]}>
                {formatEventDate(e.startDate)}
                {e.startTime ? ` • ${e.startTime}` : ""}
                {e.endTime ? ` – ${e.endTime}` : ""}
              </Text>
            </View>
          </View>

          {!!duration && (
            <>
              <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: t.colors.brandWeak }]}>
                  <Ionicons name="time-outline" size={18} color={t.colors.brandDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Duration</Text>
                  <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "600" }]}>{duration}</Text>
                </View>
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, { backgroundColor: t.colors.brandWeak }]}>
              <Ionicons name="location-outline" size={18} color={t.colors.brandDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Location</Text>
              <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "600" }]}>{e.venue}</Text>
            </View>
          </View>
        </View>

        {/* Organizer card */}
        {e.organizer ? (
          <View style={[styles.card, styles.organizerCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <View style={styles.organizerRow}>
              <Avatar p={{ name: e.organizer.name, profileImage: e.organizer.profileImage }} size={48} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Organised by</Text>
                <Text style={[t.typography.h5, { color: t.colors.text }]}>{e.organizer.name}</Text>
                {organizerLocation ? (
                  <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>{organizerLocation}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {/* Participation card */}
        <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconCircle, { backgroundColor: t.colors.surfaceAlt }]}>
              <Ionicons name="people-outline" size={18} color={t.colors.secondaryText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "600", marginBottom: 8 }]}>
                {e.joinedCount} of {e.maxParticipants} spots filled
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: t.colors.surfaceAlt }]}>
                <View style={[styles.progressFill, { width: `${visualFilledPct}%`, backgroundColor: t.colors.brandDark }]} />
              </View>
            </View>
          </View>

          {joinedPreview.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
              <Pressable style={styles.joinedPreviewRow} onPress={openJoinedUsers}>
                <Avatar p={joinedPreview[0]} size={24} />
                <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 8, flex: 1 }]}>
                  <Text style={{ color: t.colors.text, fontWeight: "600" }}>{joinedPreview[0]?.name}</Text>
                  {" and "}
                  {Math.max(0, e.joinedCount - 1)} neighbours are attending.
                </Text>
                <Text style={[t.typography.small, { color: t.colors.brandDark, fontWeight: "700" }]}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={t.colors.brandDark} />
              </Pressable>
            </>
          ) : null}
        </View>

        {/* Meta row: registration close / price */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={[styles.metaCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <View style={[styles.iconCircleSm, { backgroundColor: t.colors.brandWeak }]}>
              <Ionicons name="time-outline" size={16} color={t.colors.brandDark} />
            </View>
            <Text style={[t.typography.small, { color: t.colors.text, fontWeight: "600", flexShrink: 1 }]}>
              Closes {e.registrationClosesBeforeHours}h before
            </Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <View style={[styles.iconCircleSm, { backgroundColor: t.colors.brandWeak }]}>
              <Ionicons name="pricetag-outline" size={16} color={t.colors.brandDark} />
            </View>
            <Text style={[t.typography.small, { color: t.colors.text, fontWeight: "600" }]}>
              {e.participationType === "free" ? "Free" : `₹${e.feeAmount}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer CTA — stays visible while scrolling; ScrollView's bottom
          padding above (FOOTER_SPACE + insets.bottom) keeps content clear of it. */}
      {/* <View style={styles.footerShadow}></View> */}
     
      
      <View style={[styles.footer, { backgroundColor: t.colors.white , borderColor: t.colors.border, paddingBottom: insets.bottom + 16 }]}>
        {e.currentUserJoined ? (
          <View style={[styles.joinedBadge, { backgroundColor: t.colors.brandWeak }]}>
            <Ionicons name="checkmark-circle" size={18} color={t.colors.brandDark} />
            <Text style={[t.typography.body, { color: t.colors.brandDark, marginLeft: 6, fontWeight: "700" }]}>
              You've joined this event
            </Text>
          </View>
        ) : joinBlockedReason ? (
          // The API rejects these cases anyway — say why instead of letting the
          // user tap into a guaranteed error.
          <View style={[styles.joinedBadge, { backgroundColor: t.colors.surfaceAlt }]}>
            <Ionicons name="lock-closed-outline" size={18} color={t.colors.secondaryText} />
            <Text style={[t.typography.body, { color: t.colors.secondaryText, marginLeft: 6, fontWeight: "700" }]}>
              {joinBlockedReason}
            </Text>
          </View>
        ) : (
          <ActionButton
            title="Join Event"
            onPress={() => setJoinSheetOpen(true)}
            variant="primary"
            size="lg"
            fullWidth
            rightIconName="arrow-forward"
            containerStyle={{ backgroundColor: t.colors.brandDark, borderRadius: t.radii.m}}
          />
        )}
      </View>

      {/* Join confirmation bottom sheet */}
      <Modal transparent visible={joinSheetOpen} animationType="slide" onRequestClose={() => setJoinSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setJoinSheetOpen(false)}>
          <Pressable onPress={(ev) => ev.stopPropagation()} style={[styles.sheet, { backgroundColor: t.colors.cardBackground, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHeaderRow}>
              <Heading level={4}>Join Event</Heading>
              <Pressable onPress={() => setJoinSheetOpen(false)}><Ionicons name="close" size={22} color={t.colors.text} /></Pressable>
            </View>
            <View style={styles.sheetEventRow}>
              {e.image ? <Image source={{ uri: e.image }} style={styles.sheetThumb} /> : null}
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[t.typography.h5, { color: t.colors.text }]}>{e.title}</Text>
                <Text style={[t.typography.small, { color: t.colors.secondaryText, marginTop: 2 }]}>
                  {e.startDate} {e.startTime ? `• ${e.startTime}` : ""} • {e.venue}
                </Text>
              </View>
            </View>
            {e.participationType === "paid" ? (
              <View style={[styles.feeNotice, { backgroundColor: t.colors.surfaceAlt }]}>
                <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "700" }]}>₹{e.feeAmount} per participant</Text>
                <Text style={[t.typography.small, { color: t.colors.secondaryText, marginTop: 2 }]}>
                  Terrace doesn't process payments. Please pay the organiser directly.
                </Text>
              </View>
            ) : null}
            <ActionButton
              title="Confirm & Join"
              onPress={handleJoin}
              variant="primary"
              size="lg"
              fullWidth
              loading={joining}
              disabled={joining}
              containerStyle={{ marginTop: 16, backgroundColor: t.colors.brandDark, borderRadius: t.radii.m}}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Joined users bottom sheet */}
      <Modal transparent visible={joinedUsersOpen} animationType="slide" onRequestClose={() => setJoinedUsersOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setJoinedUsersOpen(false)}>
          <Pressable onPress={(ev) => ev.stopPropagation()} style={[styles.sheet, { backgroundColor: t.colors.cardBackground, paddingBottom: insets.bottom + 16, maxHeight: "75%" }]}>
            <View style={styles.sheetHeaderRow}>
              <Heading level={4}>Residents joining this event</Heading>
              <Pressable onPress={() => setJoinedUsersOpen(false)}><Ionicons name="close" size={22} color={t.colors.text} /></Pressable>
            </View>
            <Text style={[t.typography.small, { color: t.colors.brandDark, fontWeight: "700", marginBottom: 8 }]}>
              {e.joinedCount} of {e.maxParticipants} spots filled
            </Text>
            <FlatList
              data={participants}
              keyExtractor={(p) => p.userId}
              ListEmptyComponent={<Text style={{ color: t.colors.secondaryText, paddingVertical: 16 }}>No one has joined yet.</Text>}
              renderItem={({ item }: { item: EventParticipant }) => (
                <View style={styles.participantRow}>
                  <Avatar p={item} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[t.typography.body, { color: t.colors.text, fontWeight: "700" }]}>{item.name}</Text>
                    <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>
                      {[cleanLocationPart(item.tower), cleanLocationPart(item.unit)].filter(Boolean).join(" • ") || "—"}
                    </Text>
                    {item.joinedAt ? (
                      <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>
                        Joined {formatPostTime(item.joinedAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <SuccessModal
        visible={joinedSuccess}
        onClose={() => setJoinedSuccess(false)}
        title="You're in! 🎉"
        subtitle={`You have successfully joined ${e.title}`}
        primaryActionLabel="Done"
        onPrimaryAction={() => setJoinedSuccess(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 2
  },
  footerShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 137,
    height: 12,
    zIndex: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",

    // position: "absolute",
    // left: 0,
    // right: 0,
    // bottom: 200,
    // height: 4,
    // elevation: 8,
    // shadowColor: "#000",
    // backgroundColor: "#000",
    // zIndex: 0
  },
  hero: { width: "100%", aspectRatio: 16 / 9, borderRadius: 24, overflow: "hidden" },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  categoryPill: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  categoryPillText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  card: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 12 },
  organizerCard: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconCircleSm: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginLeft: 52 },
  metaGrid: { marginTop: 14, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { marginLeft: 6 },
  metaCard: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 20, borderWidth: 1,
  },
  organizerRow: { flexDirection: "row", alignItems: "center" },
  progressHeader: { marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  joinedPreviewRow: { flexDirection: "row", alignItems: "center" },
  infoPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  joinedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 16 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetEventRow: { flexDirection: "row", alignItems: "center" },
  sheetThumb: { width: 56, height: 56, borderRadius: 10 },
  feeNotice: { padding: 12, borderRadius: 10, marginTop: 14 },
  participantRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
});
