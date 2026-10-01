import UserAvatar from "@/components/UI/UserAvatar";
import Heading from "@/components/UI/Heading";
import SuccessModal from "@/components/UI/SuccessModal";
import { useToast } from "@/components/common/Toast";
import ReportModal from "@/components/modals/ReportModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import ActionButton from "@/components/inputs/ActionButton";
import { useEventStore } from "@/store/useEventStore";
import { useUserStore } from "@/store/useUserStore";
import { formatPostTime, formatTime12h } from "@/lib/dateTime";
import { getHeight, useTheme } from "@/theme/theme";
import { EventParticipant } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { buildImageUrl } from "@/lib/imageUtils";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { manropeFamily } from "@/theme/fonts";

// Event Details runs ~1.5px smaller than the global type scale (size + line height, family/weight untouched).
const shrink = (typo: any) => {
  const out: any = {};
  for (const k of ["h3", "h5", "body", "small"]) {
    const v = typo[k];
    out[k] = { ...v, fontSize: v.fontSize - 1.5, lineHeight: v.lineHeight - 1.5 };
  }
  return out as typeof typo;
};

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
  // Plain "YYYY-MM-DD" must be read as a calendar date, not a UTC instant,
  // or it shifts by a day in some timezones.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

// "Sat, 26 Sep 2026" from a plain YYYY-MM-DD (calendar date, no tz shift).
const formatEventDateLong = (raw?: string | null) => {
  if (!raw) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
  return `${wd}, ${d.getDate()} ${mo} ${d.getFullYear()}`;
};

const closesLabel = (hours?: number | null) => {
  const h = Number(hours ?? 0);
  if (h <= 0) return "At event start";
  if (h % 24 === 0) return `${h / 24} day${h === 24 ? "" : "s"} before`;
  return `${h} hour${h === 1 ? "" : "s"} before`;
};

// Duration from start/end time strings ("18:30" style). Backend doesn't
// provide a duration field, so it's derived here rather than hardcoded.
// Registration deadline is an absolute instant (ISO) — shown in the device's local time.
const formatDeadline = (raw?: string | null) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} • ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

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

function Avatar({ p, size = 40 }: { p: { name: string; profileImage: string | null; id?: string }; size?: number }) {
  return <UserAvatar uri={p.profileImage} name={p.name} userId={p.id} size={size} />;
}

function DetailRow({ icon, label, children, right, flex, noBorder, grow }: {
  icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; children: React.ReactNode;
  right?: React.ReactNode; flex?: boolean; noBorder?: boolean; grow?: number;
}) {
  const t = useTheme();
  const ty = shrink(t.typography);
  return (
    <View style={[styles.detailRow, flex && { flex: grow ?? 1 }, !noBorder && { borderBottomWidth: 1, borderBottomColor: t.colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: t.colors.brandWeak }]}>
        <Ionicons name={icon} size={20} color={t.colors.brandDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ty.small, { color: t.colors.secondaryText }]}>{label}</Text>
        {children}
      </View>
      {right}
    </View>
  );
}

export default function EventDetailsScreen() {
  const t = useTheme();
  const ty = shrink(t.typography);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const {
    getEvent, joinEvent, cancelParticipant, getParticipants, participants, loading,
    toggleLike,
  } = useEventStore();
  // The store keeps the last opened event; never render it for a different id
  // (was the source of the Sports -> Fitness flash).
  const currentEvent = useEventStore((s) =>
    String(s.currentEvent?.id) === String(eventId) ? s.currentEvent : null,
  );
  const currentUserId = useUserStore((s) => s.user?._id);
  const { width: winWidth } = useWindowDimensions();
  const [heroIndex, setHeroIndex] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setJoining(true);
    try {
      await joinEvent(eventId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Reflect the join immediately; load() below reconciles with the server.
      useEventStore.setState((st) =>
        st.currentEvent && String(st.currentEvent.id) === String(eventId)
          ? { currentEvent: { ...st.currentEvent, currentUserJoined: true, joinedCount: st.currentEvent.joinedCount + 1 } }
          : {},
      );
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

  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);

  const confirmLeave = async () => {
    if (!eventId || !currentUserId) return;
    await cancelParticipant(eventId, currentUserId);
    load();
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

  if (!currentEvent && (loading || !useEventStore.getState().error)) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.white }]}>
        <ActivityIndicator color={t.colors.brandDark} />
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View style={[styles.center, { backgroundColor: t.colors.white }]}>
        <Text style={{ color: t.colors.secondaryText }}>Event not found.</Text>
      </View>
    );
  }

  const e = currentEvent;
  const gallery = (e.images?.length ? e.images : e.image ? [e.image] : []).filter(Boolean).slice(0, 5);

  // Conditions the API rejects a join on. Mirrors the server's own checks so the
  // footer can explain the block instead of surfacing a failed request.
  // Start instant from the plain date/time fields (device-local wall clock, same
  // convention the rest of this screen uses); the server re-checks on join.
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.startDate ?? "");
  const [sh = 0, sm = 0] = (e.startTime ?? "").split(":").map(Number);
  const hasStarted =
    !!startMatch &&
    new Date(+startMatch[1], +startMatch[2] - 1, +startMatch[3], sh || 0, sm || 0).getTime() <= Date.now();
  const joinBlockedReason =
    e.status === "cancelled"
      ? "This event was cancelled"
      : e.registrationClosed || e.status === "closed" || e.status === "completed"
        ? "Registration has closed"
      : hasStarted
        ? "Event has already started"
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
  const joinDT = (d?: string | null, tm?: string | null) =>
    [formatEventDate(d), tm ? formatTime12h(tm) : ""].filter(Boolean).join(" • ");
  const startLabel = joinDT(e.startDate, e.startTime);
  // End date falls back to the start date when only an end time was given.
  const endLabel = e.endDate || e.endTime ? joinDT(e.endDate || e.startDate, e.endTime) : "";

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.white, paddingTop: insets.top }}>
      <View style={[styles.headerRow, { backgroundColor: t.colors.surface }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.headerBtn, { backgroundColor: t.colors.surfaceAlt }]}>
          <Ionicons name="arrow-back" size={20} color={t.colors.text} />
        </Pressable>
        <Text style={{ color: t.colors.brandDark, fontFamily: manropeFamily("800"), fontSize: 23, letterSpacing: -0.5 }}>Event Details</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={onShare} hitSlop={12} style={[styles.headerBtn, { backgroundColor: t.colors.surfaceAlt }]}>
            <Ionicons name="share-outline" size={20} color={t.colors.text} />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={[styles.headerBtn, { backgroundColor: t.colors.surfaceAlt }]}>
            <Ionicons name="ellipsis-vertical" size={20} color={t.colors.text} />
          </Pressable>
        </View>
      </View>
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 60, backgroundColor: t.colors.cardBackground, borderColor: t.colors.border }]}>
            {e.currentUserJoined && (
              <Pressable
                style={styles.menuItem}
                onPress={() => { setMenuOpen(false); setLeaveConfirmVisible(true); }}
              >
                <Ionicons name="exit-outline" size={20} color={t.colors.error} />
                <Text style={[ty.body, { color: t.colors.error, fontFamily: manropeFamily("600") }]}>Leave Event</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.menuItem}
              onPress={() => { setMenuOpen(false); setReportVisible(true); }}
            >
              <Ionicons name="flag-outline" size={20} color={t.colors.text} />
              <Text style={[ty.body, { color: t.colors.text, fontFamily: manropeFamily("600") }]}>Report</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      {eventId && (
        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          reportType="event"
          itemId={eventId}
          itemName={e?.title}
        />
      )}


      <ConfirmationModal
        visible={leaveConfirmVisible}
        onClose={() => setLeaveConfirmVisible(false)}
        onConfirm={confirmLeave}
        title="Leave Event"
        message="Are you sure you want to leave this event?"
        confirmText="Leave"
        cancelText="Cancel"
        isDangerous
        successTitle="Left Event"
        successMessage="You have left this event."
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: FOOTER_SPACE + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {gallery.length > 1 ? (
          <View style={[styles.hero, { backgroundColor: t.colors.surfaceAlt }]}>
            <FlatList
              data={gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => `${u}-${i}`}
              onMomentumScrollEnd={(ev) =>
                setHeroIndex(Math.round(ev.nativeEvent.contentOffset.x / (winWidth - 32)))
              }
              renderItem={({ item }) => (
                <Image
                  source={{ uri: buildImageUrl(item) }}
                  style={{ width: winWidth - 32, height: ((winWidth - 32) * 9) / 16 }}
                  contentFit="cover"
                  transition={150}
                />
              )}
            />
            <View style={styles.heroDots} pointerEvents="none">
              {gallery.map((_, i) => (
                <View
                  key={i}
                  style={[styles.heroDot, i === heroIndex && { width: 18, backgroundColor: t.colors.brand }]}
                />
              ))}
            </View>
          </View>
        ) : (
        <View style={[styles.hero, { backgroundColor: t.colors.surfaceAlt }]}>
          {gallery[0] || e.image ? (
            <Image source={{ uri: buildImageUrl(gallery[0] ?? e.image) }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={[t.colors.brand, t.colors.brandDark]} style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <Ionicons name="calendar-outline" size={56} color={t.colors.onBrand} />
            </LinearGradient>
          )}
        </View>
        )}

        <View style={{ gap: 4 }}>
          <Heading level={1} style={{ fontSize: t.typography.h1.fontSize - 1.5, lineHeight: t.typography.h1.lineHeight - 1.5 }}>{e.title}</Heading>
          {!!e.description && <Text style={[ty.body, { color: t.colors.secondaryText }]}>{e.description}</Text>}
        </View>

        {/* Organizer + category */}
        <View style={styles.organizerRow}>
          {e.organizer ? (
            <>
              <Avatar p={{ name: e.organizer.name, profileImage: e.organizer.profileImage }} size={54} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontFamily: manropeFamily("500"), fontSize: 13, color: t.colors.secondaryText }}>Organised by</Text>
                <Text style={{ fontFamily: manropeFamily("800"), fontSize: 18, lineHeight: 24, color: t.colors.brandDark }} numberOfLines={1}>{e.organizer.name}</Text>
                {organizerLocation ? <Text style={{ fontFamily: manropeFamily("500"), fontSize: 14, color: t.colors.secondaryText }}>{organizerLocation}</Text> : null}
              </View>
            </>
          ) : <View style={{ flex: 1 }} />}
          {!!e.eventType && (
            <View style={[styles.typePill, { backgroundColor: t.colors.brandWeak }]}>
              <Ionicons name="pricetag-outline" size={18} color={t.colors.brandDark} />
              <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: manropeFamily("600"), fontSize: 15, color: t.colors.brandDark }}>{e.eventType}</Text>
            </View>
          )}
        </View>

        {/* Participation card */}
        <View style={[styles.partCard, { backgroundColor: t.colors.brandWeak }]}>
          <View style={styles.partTop}>
            <Text style={{ flex: 1, flexShrink: 1, marginRight: 12, fontFamily: manropeFamily("800"), fontSize: 19, lineHeight: 25, color: t.colors.brandDark }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Do more together</Text>
           
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <View style={{ alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", gap: 8}} > 
            <Ionicons name="people-outline" size={26} color={t.colors.brandDark} />
              <Text style={{ fontFamily: manropeFamily("800"), fontSize: 14, lineHeight: 22, color: t.colors.brandDark }}>{e.joinedCount} / {e.maxParticipants} people</Text>
                </View>
              <Text style={{ fontFamily: manropeFamily("500"), fontSize: 12, color: t.colors.secondaryText }}>{e.maxParticipants} people maximum</Text>
            </View>
            </View>
          </View>
          <View style={styles.partBarRow}>
            <View style={[styles.progressTrack, { backgroundColor: "rgba(120,130,125,0.25)", flex: 1 }]}>
              <View style={[styles.progressFill, { width: `${visualFilledPct}%`, backgroundColor: t.colors.brandDark }]} />
            </View>
            <Pressable onPress={openJoinedUsers} style={styles.seeAll} hitSlop={8}>
              <Text style={{ fontFamily: manropeFamily("600"), fontSize: 14, color: t.colors.brandDark }}>See all</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.brandDark} style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
          <View style={styles.partLabels}>
            <Text style={{ fontFamily: manropeFamily("500"), fontSize: 15, color: t.colors.text }}>{e.joinedCount} joined</Text>
            <Text style={{ fontFamily: manropeFamily("500"), fontSize: 15, color: t.colors.text }}>{e.remainingCapacity} spots left</Text>
          </View>
          {e.minParticipants > 0 && (
            <View style={[styles.confirmNote, { backgroundColor: t.colors.brandDark + "14" }]}>
              <Ionicons name="people-outline" size={22} color={t.colors.brandDark} />
              <Text style={{ flex: 1, fontFamily: manropeFamily("500"), fontSize: 14, lineHeight: 20, color: t.colors.text }}>
                {e.joinedCount >= e.minParticipants
                  ? "Minimum reached — this event is confirmed."
                  : `When ${e.minParticipants} ${e.minParticipants === 1 ? "person joins" : "people join"}, this event will be confirmed.`}
              </Text>
            </View>
          )}
        </View>

        {/* Details list */}
        <View>
          <DetailRow icon="calendar-outline" label="Date">
            <Text style={[ty.h5, { color: t.colors.text }]}>{formatEventDateLong(e.startDate)}</Text>
          </DetailRow>
          <View style={styles.pairRow}>
            <DetailRow icon="time-outline" label="Time" flex noBorder grow={1.6}>
              <Text style={[ty.h5, { color: t.colors.text }]}>
                {e.startTime ? formatTime12h(e.startTime) : "—"}
                {e.endTime ? ` – ${formatTime12h(e.endTime)}` : ""}
              </Text>
              {!!e.endDate && e.endDate !== e.startDate && (
                <Text style={[ty.small, { color: t.colors.secondaryText }]}>Ends {formatEventDateLong(e.endDate)}</Text>
              )}
            </DetailRow>
            {!!duration && (
              <DetailRow icon="stopwatch-outline" label="Duration" flex noBorder grow={1}>
                <Text style={[ty.h5, { color: t.colors.text }]}>{duration}</Text>
              </DetailRow>
            )}
          </View>
          <DetailRow
            icon="location-outline"
            label="Location"
            right={
              <Pressable
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue)}`).catch(() => {})}
                style={[styles.mapBtn, { borderColor: t.colors.border }]}
              >
                <Ionicons name="map-outline" size={16} color={t.colors.brandDark} />
                <Text style={[ty.small, { color: t.colors.text }]}>View on Map</Text>
              </Pressable>
            }
          >
            <Text style={[ty.h5, { color: t.colors.text }]}>{e.venue}</Text>
          </DetailRow>
          <View style={styles.pairRow}>
            <DetailRow icon="pricetag-outline" label="Participation fee" flex noBorder>
              <Text style={[ty.h5, { color: t.colors.text }]}>{e.participationType === "free" ? "Free" : `₹${e.feeAmount}`}</Text>
            </DetailRow>
            <DetailRow icon="time-outline" label="Registration closes" flex noBorder>
              <Text style={[ty.h5, { color: t.colors.text }]}>{closesLabel(e.registrationClosesBeforeHours)}</Text>
            </DetailRow>
          </View>
          {!!e.rulesToBring && (
            <DetailRow icon="footsteps-outline" label="Things to bring" noBorder>
              <Text style={[ty.body, { color: t.colors.text }]}>{e.rulesToBring}</Text>
            </DetailRow>
          )}
        </View>

        <View style={[styles.guidelines, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={t.colors.secondaryText} />
          <View style={{ flex: 1 }}>
            <Text style={[ty.body, { color: t.colors.brandDark, fontFamily: "Manrope_700Bold" }]}>Community guidelines apply.</Text>
            <Text style={[ty.small, { color: t.colors.secondaryText, fontFamily: "Manrope_400Regular" }]}>By joining, you agree to be a respectful and considerate neighbour.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.colors.secondaryText} />
        </View>
      </ScrollView>

      {/* Fixed footer CTA — stays visible while scrolling; ScrollView's bottom
          padding above (FOOTER_SPACE + insets.bottom) keeps content clear of it. */}
      {/* <View style={styles.footerShadow}></View> */}
     
      
      <View style={[styles.footer, { backgroundColor: t.colors.white , borderColor: t.colors.border, paddingBottom: insets.bottom + 16 }]}>
        {e.currentUserJoined ? (
          <View style={[styles.joinedBadge, { backgroundColor: t.colors.brandWeak }]}>
            <Ionicons name="checkmark-circle" size={18} color={t.colors.brandDark} />
            <Text style={[ty.body, { color: t.colors.brandDark, marginLeft: 6, fontFamily: "Manrope_700Bold" }]}>
              You've joined this event
            </Text>
          </View>
        ) : joinBlockedReason ? (
          // The API rejects these cases anyway — say why instead of letting the
          // user tap into a guaranteed error.
          <View style={[styles.joinedBadge, { backgroundColor: t.colors.surfaceAlt }]}>
            <Ionicons name="lock-closed-outline" size={18} color={t.colors.secondaryText} />
            <Text style={[ty.body, { color: t.colors.secondaryText, marginLeft: 6, fontFamily: "Manrope_700Bold" }]}>
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
                <Text style={[ty.h5, { color: t.colors.text }]}>{e.title}</Text>
                <Text style={[ty.small, { color: t.colors.secondaryText, marginTop: 2 }]}>
                  {e.startDate} {e.startTime ? `• ${formatTime12h(e.startTime)}` : ""} • {e.venue}
                </Text>
              </View>
            </View>
            {e.participationType === "paid" ? (
              <View style={[styles.feeNotice, { backgroundColor: t.colors.surfaceAlt }]}>
                <Text style={[ty.body, { color: t.colors.text, fontFamily: "Manrope_700Bold" }]}>₹{e.feeAmount} per participant</Text>
                <Text style={[ty.small, { color: t.colors.secondaryText, marginTop: 2 }]}>
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
            <Text style={[ty.small, { color: t.colors.brandDark, fontFamily: "Manrope_700Bold", marginBottom: 8 }]}>
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
                    <Text style={[ty.body, { color: t.colors.text, fontFamily: "Manrope_700Bold" }]}>{item.name}</Text>
                    <Text style={[ty.small, { color: t.colors.secondaryText }]}>
                      {[cleanLocationPart(item.tower), cleanLocationPart(item.unit)].filter(Boolean).join(" • ") || "—"}
                    </Text>
                    {item.joinedAt ? (
                      <Text style={[ty.small, { color: t.colors.secondaryText }]}>
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
  menu: { position: "absolute", right: 16, minWidth: 180, borderRadius: 16, borderWidth: 1, paddingVertical: 6, elevation: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
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
  heroDots: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 5, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.7)" },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  categoryPill: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  categoryPillText: { color: "#fff", fontFamily: "Manrope_700Bold", fontSize: 12 },
  card: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 12 },
  organizerCard: { gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconCircleSm: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dtRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 },
  dtLabel: { width: 44, fontFamily: "Manrope_600SemiBold" },
  dtValue: { flex: 1, fontFamily: "Manrope_600SemiBold" },
  dtDivider: { height: 1, marginTop: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  pairRow: { flexDirection: "row", gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.2)" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9, maxWidth: "45%", marginLeft: 10, borderRadius: 999 },
  partCard: { borderRadius: 24, padding: 20, gap: 14 },
  partTop: { flexDirection: "row", alignItems: "center" },
  partBarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  seeAll: { flexDirection: "row", alignItems: "center" },
  partLabels: { flexDirection: "row", justifyContent: "space-between" },
  confirmNote: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14 },
  mapBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  guidelines: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
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
  progressTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
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
