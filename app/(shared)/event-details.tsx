import Chip from "@/components/UI/Chip";
import Heading from "@/components/UI/Heading";
import SuccessModal from "@/components/UI/SuccessModal";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { useEventStore } from "@/store/useEventStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, useTheme } from "@/theme/theme";
import { EventParticipant } from "@/types/event.type";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

// Reserve space above the fixed footer so the last scroll content is never hidden behind it.
const FOOTER_SPACE = getHeight(500);

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
    toggleLike, getComments, addComment, deleteComment, comments, commentsLoading,
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

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

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

  const openComments = () => {
    setCommentsOpen(true);
    if (eventId)
      getComments(eventId).catch((e: any) =>
        showToast(e?.message ?? "Failed to load comments", "error"),
      );
  };

  const onAddComment = async () => {
    const text = commentText.trim();
    if (!eventId || !text || commentBusy) return;
    setCommentBusy(true);
    try {
      await addComment(eventId, text);
      setCommentText("");
    } catch (err: any) {
      showToast(err?.message ?? "Failed to add comment", "error");
    } finally {
      setCommentBusy(false);
    }
  };

  const onDeleteComment = async (commentId: number) => {
    if (!eventId || commentBusy) return;
    setCommentBusy(true);
    try {
      await deleteComment(eventId, commentId);
    } catch (err: any) {
      showToast(err?.message ?? "Failed to delete comment", "error");
    } finally {
      setCommentBusy(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text} />
        </Pressable>
        <Heading level={4}>Event Details</Heading>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
      contentContainerStyle={{ paddingBottom: FOOTER_SPACE + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {e.image ? <Image source={{ uri: e.image }} style={styles.hero} contentFit="cover" /> : null}

        <View style={{ padding: 20 }}>
          <Chip label={e.eventType} variant="selected" style={{ marginBottom: 8 }} />
          <Heading level={2}>{e.title}</Heading>
          <Text style={[t.typography.body, { color: t.colors.secondaryText, marginTop: 6 }]}>{e.description}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={t.colors.secondaryText} />
              <Text style={[t.typography.small, styles.metaText, { color: t.colors.text }]}>{e.startDate}</Text>
            </View>
            {e.startTime ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={t.colors.secondaryText} />
                <Text style={[t.typography.small, styles.metaText, { color: t.colors.text }]}>{e.startTime}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={t.colors.secondaryText} />
              <Text style={[t.typography.small, styles.metaText, { color: t.colors.text }]}>{e.venue}</Text>
            </View>
          </View>

          {e.organizer ? (
            <View style={styles.organizerRow}>
              <Avatar p={{ name: e.organizer.name, profileImage: e.organizer.profileImage }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>Organised by</Text>
                <Text style={[t.typography.h5, { color: t.colors.text }]}>{e.organizer.name}</Text>
                {organizerLocation ? (
                  <Text style={[t.typography.small, { color: t.colors.secondaryText }]}>{organizerLocation}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <View style={styles.progressHeader}>
              <Text style={[t.typography.body, { color: t.colors.text }]}>
                <Text style={{ fontWeight: "800" }}>{e.joinedCount}</Text> of {e.maxParticipants} spots filled
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: t.colors.surfaceAlt }]}>
              <View style={[styles.progressFill, { width: `${visualFilledPct}%`, backgroundColor: t.colors.brandDark }]} />
            </View>
          </View>

          {joinedPreview.length > 0 ? (
            <Pressable style={styles.joinedPreviewRow} onPress={openJoinedUsers}>
              <View style={{ flexDirection: "row" }}>
                {joinedPreview.slice(0, 3).map((p, i) => (
                  <View key={p.userId} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                    <Avatar p={p} size={32} />
                  </View>
                ))}
              </View>
              <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 8, flex: 1 }]}>
                {joinedPreview[0]?.name} and {Math.max(0, e.joinedCount - 1)} neighbours are attending.
              </Text>
              <Text style={[t.typography.small, { color: t.colors.brandDark, fontWeight: "700" }]}>See all</Text>
            </Pressable>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={[styles.infoPill, { backgroundColor: t.colors.surfaceAlt }]}>
              <Ionicons name="time-outline" size={14} color={t.colors.secondaryText} />
              <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 4 }]}>
                Closes {e.registrationClosesBeforeHours}h before
              </Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: t.colors.surfaceAlt }]}>
              <Ionicons name="pricetag-outline" size={14} color={t.colors.secondaryText} />
              <Text style={[t.typography.small, { color: t.colors.text, marginLeft: 4 }]}>
                {e.participationType === "free" ? "Free" : `₹${e.feeAmount} per participant`}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Fixed footer CTA — stays visible while scrolling; ScrollView's bottom
          padding above (FOOTER_SPACE + insets.bottom) keeps content clear of it. */}
      <View style={[styles.footer, { backgroundColor: t.colors.background, borderTopColor: t.colors.border, paddingBottom: insets.bottom + 16 }]}>
        {/* Like / Comments / (creator) Manage Event */}
        <View style={styles.actionRow}>
          <Pressable onPress={onToggleLike} disabled={likeBusy} style={styles.actionBtn} hitSlop={8}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={22}
              color={liked ? t.colors.error : t.colors.secondaryText}
            />
            {likeCount !== null && (
              <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 6 }]}>
                {likeCount}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={openComments} style={styles.actionBtn} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={20} color={t.colors.secondaryText} />
            <Text style={[t.typography.small, { color: t.colors.secondaryText, marginLeft: 6 }]}>
              Comments
            </Text>
          </Pressable>

          {isCreator && (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(shared)/event-dashboard", params: { eventId: String(eventId) } })
              }
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color={t.colors.brandDark} />
              <Text style={[t.typography.small, { color: t.colors.brandDark, marginLeft: 6, fontWeight: "700" }]}>
                Manage Event
              </Text>
            </Pressable>
          )}
        </View>

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

      {/* Comments bottom sheet */}
      <Modal transparent visible={commentsOpen} animationType="slide" onRequestClose={() => setCommentsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCommentsOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: t.colors.background, paddingBottom: insets.bottom + 16 }]}>
          <Heading level={4}>Comments</Heading>

          {commentsLoading && comments.length === 0 ? (
            <ActivityIndicator color={t.colors.brandDark} style={{ marginVertical: 24 }} />
          ) : comments.length === 0 ? (
            <Text style={[t.typography.body, { color: t.colors.secondaryText, textAlign: "center", marginVertical: 24 }]}>
              No comments yet. Be the first to say something.
            </Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => String(c.id)}
              style={{ maxHeight: getHeight(900) }}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Avatar p={{ name: item.user.name, profileImage: item.user.profileImage }} size={34} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[t.typography.small, { color: t.colors.textPrimary, fontWeight: "700" }]}>
                      {item.user.name || "Resident"}
                    </Text>
                    <Text style={[t.typography.body, { color: t.colors.textPrimary }]}>{item.text}</Text>
                  </View>
                  {item.user.userId === currentUserId && (
                    <Pressable onPress={() => onDeleteComment(item.id)} disabled={commentBusy} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={t.colors.secondaryText} />
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor={t.colors.secondaryText}
              style={[styles.commentInput, { color: t.colors.textPrimary, borderColor: t.colors.border }]}
              multiline
            />
            <ActionButton
              title="Post"
              onPress={onAddComment}
              variant="primary"
              disabled={!commentText.trim() || commentBusy}
              loading={commentBusy}
            />
          </View>
        </View>
      </Modal>

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
  actionRow: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center" },
  commentRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10 },
  commentInputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 12 },
  commentInput: {
    flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, maxHeight: 90,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  // heroWrapper: { padding: 10, overflow: 'hidden', backgroundColor: "#00842c30" },
  hero: { width: "100%", height: "90%", objectFit: 'cover', borderBottomEndRadius: 20, borderBottomLeftRadius: 20  },
  metaGrid: { marginTop: 14, gap: 8 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { marginLeft: 6 },
  organizerRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  progressHeader: { marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  joinedPreviewRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  infoPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  joinedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetEventRow: { flexDirection: "row", alignItems: "center" },
  sheetThumb: { width: 56, height: 56, borderRadius: 10 },
  feeNotice: { padding: 12, borderRadius: 10, marginTop: 14 },
  participantRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
});
