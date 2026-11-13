import EventPhaseBadge from "@/components/event/EventPhaseBadge";
import UserAvatar from "@/components/UI/UserAvatar";
import { phaseUi } from "@/lib/eventPhase";
import { eventCardCta } from "@/lib/eventRegistration";
import { useTheme } from "@/theme/theme";
import { HomeFeedItem } from "@/types/homeFeed.type";
import { ArrowRight, CalendarDays, CircleCheck, Clock, Heart, Lock, MessageSquare, Navigation, Settings, Share2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback } from "react";
import { Image, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useToast } from "@/components/common/Toast";
import { hapticLight } from "@/lib/haptics";
import FeedCardHeader from "./FeedCardHeader";
import { Ionicons } from "@expo/vector-icons";

// Even at 0/24 the bar should read as "a progress bar", not an empty line — a
// small minimum fill communicates that without changing the real numbers.
// Matches the constant already used on the Event Details screen.
const MIN_VISIBLE_PROGRESS_PCT = 3;

type Props = {
  item: HomeFeedItem;
  onLike: () => void;
  onComment: () => void;
  onRsvp: () => void;
  onSeeAll: () => void;
  onMore: () => void;
  onOpen: () => void;
};

const MetaChip = ({ icon: Icon, label }: { icon: any; label: string }) => {
  const t = useTheme();
  return (
    <View style={styles.metaItem}>
      <Icon size={18} strokeWidth={1.75} color={t.colors.textSecondary} />
      <Text style={[styles.metaText, { color: t.colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

/** Event card — immersive hero when there's an image, plain header when not. */
function EventFeedCard({ item, onLike, onComment, onRsvp, onSeeAll, onMore, onOpen }: Props) {
  const t = useTheme();
  const hasHero = !!item.image;
  const joined = item.joined ?? 0;
  const capacity = item.capacity ?? 0;
  const pct = capacity > 0 ? Math.min(100, (joined / capacity) * 100) : 0;
  const displayPct = capacity > 0 ? Math.max(pct, MIN_VISIBLE_PROGRESS_PCT) : 0;
  const reg = eventCardCta(item, capacity > 0 ? "Join Event" : "RSVP");
  const closed = reg.disabled;
  // Ongoing/completed cards stay visible but muted; the card body still opens the
  // read-only details. The status pill and the Like/Comment/Share footer stay at
  // full strength (the footer is not a participation action).
  const phase = phaseUi(item.eventPhase);
  const muted = !!phase?.muted;
  const stillNeeded = Math.max(0, (item.minParticipants ?? 0) - joined);
  const { showToast } = useToast();
  const handleShare = useCallback(async () => {
    hapticLight();
    try {
      await Share.share({
        title: item.title || "HomeConnect",
        message: [item.title, item.description, "Shared via HomeConnect"].filter(Boolean).join("\n\n"),
      });
    } catch {
      showToast("Couldn't open the share sheet. Please try again.", "error");
    }
  }, [item.title, item.description, showToast]);


  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen}
      style={[styles.card, { backgroundColor: t.colors.surface }]}
    >
      <View style={styles.hero}>
        {hasHero ? (
          <Image source={{ uri: item.image }} style={[styles.heroImage, muted && styles.mutedMedia]} resizeMode="cover" />
        ) : (
          // Default visual for events without an image — matches the Event
          // Details screen so the card and details page look consistent.
          <LinearGradient
            colors={[t.colors.brand, t.colors.brandDark]}
            style={[styles.heroImage, muted && styles.mutedMedia]}
          >
            <View style={styles.heroFallbackIcon}>
              <CalendarDays size={40} strokeWidth={1.75} color={t.colors.onBrand} />
            </View>
          </LinearGradient>
        )}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.72)",
            "rgba(0,0,0,0.34)",
            "rgba(0,0,0,0.30)",
            "rgba(0,0,0,0.85)",
          ]}
          locations={[0, 0.26, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.heroInner}>
          {/* Top-left: status pill */}
          <View>
            {!!phase && (
              <View style={styles.phasePill}>
                <EventPhaseBadge label={phase.label} tone={phase.tone} size="sm" solid />

                
              </View>
            )}
          </View>
          {/* Bottom: author (left) and category pill (right) */}
          <View style={styles.heroBottom}>
            <View style={styles.heroAuthor}>
              <FeedCardHeader
                author={item.author}
                meta={item.meta}
                isPublic={false}
                onImage
                showMore={false}
              />
            </View>
            {!!item.category && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={onMore}
          hitSlop={8}
          style={styles.heroMore}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-vertical" size={18} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.bodyContent, muted && styles.mutedContent]}>
          <Text style={[styles.title, { color: t.colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            {!!item.eventDate && <MetaChip icon={CalendarDays} label={item.eventDate} />}
            {!!item.eventTime && <MetaChip icon={Clock} label={item.eventTime} />}
            {!!item.location && <MetaChip icon={Navigation} label={item.location} />}
          </View>

          {/* {!!item.description && (
            <Text
              style={[styles.description, { color: t.colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          )} */}

          {capacity > 0 && (
            <View style={styles.progressBlock}>
              <View style={styles.progressHeader}>
                <Text style={[styles.spotsText, { color: t.colors.textPrimary }]}>
                  {`${joined} spots filled`}
                </Text>
                {stillNeeded > 0 && (
                  <Text style={[styles.progressHint, { color: t.colors.textPrimary }]}>
                    {stillNeeded} More to Unlock
                  </Text>
                )}
              </View>
              <View style={[styles.track, { backgroundColor: t.colors.surfaceAlt }]}>
                <View
                  style={[styles.fill, { width: `${displayPct}%`, backgroundColor: t.isDark ? t.colors.textPrimary : "#000000" }]}
                />
              </View>
            </View>
          )}

          {!!item.attendees?.length && (
            <View style={styles.attendeeRow}>
              <View style={styles.avatarStack}>
                {item.attendees.slice(0, 2).map((a, i) => (
                  <UserAvatar
                    key={a.id}
                    uri={a.avatarUrl}
                    name={a.name}
                    userId={a.userId}
                    size={24}
                    style={[{ borderWidth: 2, borderColor: t.colors.surface }, i > 0 && styles.overlap]}
                  />
                ))}
              </View>
              <Text
                style={[styles.attendeeText, { color: t.colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.attendees.slice(0, 2).map((a) => a.name).join(", ")}
                {item.attendees.length > 2
                  ? ` and ${(item.joined ?? item.attendees.length) - 2} neighbours are attending.`
                  : " are attending."}
              </Text>
              <TouchableOpacity onPress={onSeeAll} hitSlop={6}>
                <Text style={[styles.seeAll, { color: t.colors.brand }]}>See all</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onOpen}
          activeOpacity={0.85}
          disabled={closed}
          accessibilityState={{ disabled: closed }}
          style={[
            styles.cta,
            {
              backgroundColor: (item.isJoined && !reg.isOrganizer) || reg.isOrganizer || closed ? t.colors.surfaceAlt : t.colors.brand,
              opacity: closed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              { color: item.isJoined || reg.isOrganizer || closed ? t.colors.textPrimary : t.colors.onBrand },
            ]}
          >
            {reg.label}
          </Text>
          {(() => {
            const ctaColor = item.isJoined || reg.isOrganizer || closed ? t.colors.textPrimary : t.colors.onBrand;
            const CtaIcon = reg.isOrganizer
              ? Settings
              : item.isJoined
                ? CircleCheck
                : closed
                  ? Lock
                  : capacity > 0
                    ? ArrowRight
                    : CircleCheck;
            return <CtaIcon size={22} strokeWidth={2} color={ctaColor} />;
          })()}
        </TouchableOpacity>
      </View>

      {item.canInteract !== false && (
        <View style={[styles.footer, { borderTopColor: t.colors.border }]}>
          <TouchableOpacity
            style={[styles.action, styles.actionStart]}
            onPress={onLike}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${item.isLiked ? "Unlike" : "Like"}, ${item.likeCount} ${item.likeCount === 1 ? "like" : "likes"}`}
            accessibilityState={{ selected: item.isLiked }}
          >
            <Heart
              size={24}
              strokeWidth={1.75}
              color={item.isLiked ? "#c1121f" : t.colors.textPrimary}
              fill={item.isLiked ? "#c1121f" : "none"}
            />
            <Text style={[styles.actionCount, { color: t.colors.textPrimary }]}>{item.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action, styles.actionCenter]}
            onPress={onComment}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Comments, ${item.commentCount}`}
          >
            <MessageSquare size={24} strokeWidth={1.75} color={t.colors.textPrimary} />
            <Text style={[styles.actionCount, { color: t.colors.textPrimary }]}>{item.commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action, styles.actionEnd]}
            onPress={handleShare}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Share2 size={24} strokeWidth={1.75} color={t.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(EventFeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00000010"
  },
  // Reference hero is h-64 on a ~390pt viewport.
  hero: { width: "100%", aspectRatio: 1.52 },
  heroImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroFallbackIcon: { alignItems: "center", justifyContent: "center" },
  heroInner: { ...StyleSheet.absoluteFill, padding: 16, justifyContent: "space-between" },
  heroMore: { position: "absolute", top: 12, right: 12, padding: 4 },
  heroTitle: { color: "#FFFFFF", fontSize: 20,  fontFamily: "Manrope_700Bold", lineHeight: 28 },
  heroBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroAuthor: { flex: 1, minWidth: 0 },
  categoryPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  categoryText: { fontSize: 14, fontFamily: "Manrope_700Bold", color: "#111111" },
  title: { fontSize: 22, fontFamily: "Manrope_800ExtraBold", lineHeight: 30 },

  plainHeader: { paddingHorizontal: 16, paddingTop: 16 },
  body: { padding: 16, gap: 14 },
  bodyContent: { gap: 14 },
  // Ongoing/completed: dim the photo and the info block, never the pill, CTA or footer.
  mutedMedia: { opacity: 0.5 },
  mutedContent: { opacity: 0.6 },
  phasePill: { marginBottom: 8 },
  plainTitle: { fontSize: 20, fontFamily: "Manrope_700Bold", lineHeight: 28 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 6, columnGap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  metaText: { fontSize: 13, fontFamily: "Manrope_400Regular" ,lineHeight: 16 },

  description: { fontSize: 14, fontFamily: "Manrope_400Regular", lineHeight: 20 },

  progressBlock: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  spotsText: { fontSize: 18, fontFamily: "Manrope_700Bold", lineHeight: 24 },
  spotsCount: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  progressHint: { fontSize: 13, fontFamily: "Manrope_500Medium", flexShrink: 1, textAlign: "right" },
  track: { width: "100%", height: 10, borderRadius: 999, overflow: "hidden" },
  fill: { height: 10, borderRadius: 999 },

  attendeeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarStack: { flexDirection: "row" },
  attendeeAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  attendeeFallback: { alignItems: "center", justifyContent: "center" },
  attendeeInitial: { fontSize: 12,  fontFamily: "Manrope_700Bold" },
  overlap: { marginLeft: -8 },
  attendeeText: { flex: 1, fontSize: 12, fontFamily: "Manrope_500Medium", lineHeight: 16 },
  seeAll: { fontSize: 12,  fontFamily: "Manrope_600SemiBold" },

  cta: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 18,  fontFamily: "Manrope_600SemiBold" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  actionStart: { justifyContent: "flex-start" },
  actionCenter: { justifyContent: "center" },
  actionEnd: { justifyContent: "flex-end" },
  actionCount: { fontSize: 16, fontFamily: "Manrope_500Medium" },
});
