import { useTheme } from "@/theme/theme";
import { HomeFeedItem } from "@/types/homeFeed.type";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FeedActions from "./FeedActions";
import FeedCardHeader from "./FeedCardHeader";

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
};

const MetaChip = ({ icon, label, tinted }: { icon: any; label: string; tinted: boolean }) => {
  const t = useTheme();
  return (
    <View style={styles.metaItem}>
      <Ionicons
        name={icon}
        size={16}
        color={tinted ? t.colors.brand : t.colors.textSecondary}
      />
      <Text style={[styles.metaText, { color: t.colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

/** Event card — immersive hero when there's an image, plain header when not. */
function EventFeedCard({ item, onLike, onComment, onRsvp, onSeeAll, onMore }: Props) {
  const t = useTheme();
  const hasHero = !!item.image;
  const joined = item.joined ?? 0;
  const capacity = item.capacity ?? 0;
  const pct = capacity > 0 ? Math.min(100, (joined / capacity) * 100) : 0;
  const displayPct = capacity > 0 ? Math.max(pct, MIN_VISIBLE_PROGRESS_PCT) : 0;
  const stillNeeded = Math.max(0, (item.minParticipants ?? 0) - joined);

  return (
    <View
      style={[styles.card, { backgroundColor: t.colors.surface }]}
    >
      {hasHero ? (
        <View style={styles.hero}>
          <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
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
            <FeedCardHeader
              author={item.author}
              meta={item.meta}
              isPublic={item.isPublic}
              badge="EVENT"
              onImage
              onMorePress={onMore}
            />
            <View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {!!item.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.plainHeader}>
          <FeedCardHeader
            author={item.author}
            meta={item.meta}
            isPublic={item.isPublic}
            badge="EVENT"
            onMorePress={onMore}
          />
        </View>
      )}

      <View style={styles.body}>
        {!hasHero && !!item.title && (
          <Text style={[styles.plainTitle, { color: t.colors.textPrimary }]}>
            {item.title}
          </Text>
        )}

        <View style={styles.metaRow}>
          {!!item.eventDate && (
            <MetaChip icon="calendar-clear-outline" label={item.eventDate} tinted={hasHero} />
          )}
          {!!item.eventTime && (
            <MetaChip icon="time-outline" label={item.eventTime} tinted={hasHero} />
          )}
          {!!item.location && (
            <MetaChip icon="location-outline" label={item.location} tinted={hasHero} />
          )}
        </View>

        {!!item.description && (
          <Text style={[styles.description, { color: t.colors.textSecondary }]}>
            {item.description}
          </Text>
        )}

        {capacity > 0 && (
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={[styles.spotsText, { color: t.colors.textPrimary }]}>
                <Text style={[styles.spotsCount, { color: t.colors.brand }]}>{joined}</Text>
                {` of ${capacity} spots filled`}
              </Text>
              {stillNeeded > 0 && (
                <Text style={[styles.progressHint, { color: t.colors.textSecondary }]}>
                  {stillNeeded} more needed to unlock event
                </Text>
              )}
            </View>
            <View style={[styles.track, { backgroundColor: t.colors.surfaceAlt }]}>
              <View
                style={[styles.fill, { width: `${displayPct}%`, backgroundColor: t.colors.brand }]}
              />
            </View>
          </View>
        )}

        {!!item.attendees?.length && (
          <View style={styles.attendeeRow}>
            <View style={styles.avatarStack}>
              {item.attendees.slice(0, 2).map((a, i) =>
                a.avatarUrl ? (
                  <Image
                    key={a.id}
                    source={{ uri: a.avatarUrl }}
                    style={[
                      styles.attendeeAvatar,
                      { borderColor: t.colors.surface },
                      i > 0 && styles.overlap,
                    ]}
                  />
                ) : (
                  <View
                    key={a.id}
                    style={[
                      styles.attendeeAvatar,
                      styles.attendeeFallback,
                      { borderColor: t.colors.surface, backgroundColor: t.colors.brand },
                      i > 0 && styles.overlap,
                    ]}
                  >
                    <Text style={[styles.attendeeInitial, { color: t.colors.onBrand }]}>
                      {a.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ),
              )}
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

        <TouchableOpacity
          onPress={onRsvp}
          activeOpacity={0.85}
          style={[
            styles.cta,
            { backgroundColor: item.isJoined ? t.colors.surfaceAlt : t.colors.brand },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              { color: item.isJoined ? t.colors.textPrimary : t.colors.onBrand },
            ]}
          >
            {item.isJoined ? "Joined" : capacity > 0 ? "Join Event" : "RSVP"}
          </Text>
          <Ionicons
            name={
              item.isJoined
                ? "checkmark-circle"
                : capacity > 0
                  ? "arrow-forward"
                  : "checkmark-circle-outline"
            }
            size={18}
            color={item.isJoined ? t.colors.textPrimary : t.colors.onBrand}
          />
        </TouchableOpacity>
      </View>

      {item.canInteract !== false && (
        <View style={[styles.footer, { borderTopColor: t.colors.border }]}>
          <FeedActions
            noDivider
            likeCount={item.likeCount}
            isLiked={item.isLiked}
            commentCount={item.commentCount}
            shareTitle={item.title}
            shareBody={item.description}
            onLike={onLike}
            onComment={onComment}
          />
        </View>
      )}
    </View>
  );
}

export default memo(EventFeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#00000010"
  },
  // Reference hero is h-64 on a ~390pt viewport.
  hero: { width: "100%", aspectRatio: 1.52 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroInner: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: "space-between" },
  heroTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", lineHeight: 28, letterSpacing: -0.4 },
  categoryPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#ffffff35",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#ffffff", letterSpacing: -0.4 },

  plainHeader: { paddingHorizontal: 16, paddingTop: 16 },
  body: { padding: 16, gap: 14 },
  plainTitle: { fontSize: 20, fontWeight: "700", lineHeight: 28, letterSpacing: -0.4 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 6, columnGap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  metaText: { fontSize: 13, lineHeight: 16, letterSpacing: -0.4 },

  description: { fontSize: 14, lineHeight: 20, letterSpacing: -0.4 },

  progressBlock: { gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  spotsText: { fontSize: 12, lineHeight: 16, letterSpacing: -0.4 },
  spotsCount: { fontSize: 14, fontWeight: "700", letterSpacing: -0.4 },
  progressHint: { fontSize: 12, flexShrink: 1, textAlign: "right", letterSpacing: -0.4 },
  track: { width: "100%", height: 8, borderRadius: 999, overflow: "hidden" },
  fill: { height: 8, borderRadius: 999 },

  attendeeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarStack: { flexDirection: "row" },
  attendeeAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  attendeeFallback: { alignItems: "center", justifyContent: "center" },
  attendeeInitial: { fontSize: 12, fontWeight: "700", letterSpacing: -0.4 },
  overlap: { marginLeft: -8 },
  attendeeText: { flex: 1, fontSize: 12, lineHeight: 16, letterSpacing: -0.4 },
  seeAll: { fontSize: 12, fontWeight: "600", letterSpacing: -0.4 },

  cta: {
    height: 45,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 18, fontWeight: "600", letterSpacing: -0.4 },

  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
});
