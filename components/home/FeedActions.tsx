import { useFeedsStore } from "@/store/useFeedsStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  feedId: string;
  likes?: any[];
  commentCount?: number;
  /** Text used for the OS share sheet. */
  shareTitle?: string;
  shareBody?: string;
  /** Returns true when the action was blocked by the verification gate. */
  onBeforeAction?: () => boolean;
  onCommentPress?: () => void;
  trailing?: React.ReactNode;
};

const ICON_SIZE = 18;

/**
 * The single Like / Comment / Share footer shared by Event, Post and Poll
 * cards so all three stay visually identical. Likes go through the existing
 * `useFeedsStore.toggleLike` (PATCH /api/feed/:feedId/like) — the same action
 * LikeButton uses — so the count persists server-side.
 */
function FeedActions({
  feedId,
  likes,
  commentCount = 0,
  shareTitle,
  shareBody,
  onBeforeAction,
  onCommentPress,
  trailing,
}: Props) {
  const t = useTheme();
  const toggleLike = useFeedsStore((state) => state.toggleLike);
  const userId = useUserStore((state) => state.user?._id);

  const hasLiked = useMemo(() => {
    if (!userId || !likes) return false;
    return likes.some((like: any) =>
      typeof like === "string" ? like === userId : like?._id === userId,
    );
  }, [likes, userId]);

  const handleLike = useCallback(() => {
    if (onBeforeAction?.()) return;
    if (feedId && userId) toggleLike(feedId, userId);
  }, [onBeforeAction, feedId, userId, toggleLike]);

  const handleShare = useCallback(async () => {
    if (!shareTitle && !shareBody) return;
    try {
      await Share.share({
        title: shareTitle || "HomeConnect",
        message: [shareTitle, shareBody, "Shared via HomeConnect"]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      // Sheet dismissed or unavailable — nothing to recover from.
    }
  }, [shareTitle, shareBody]);

  const muted = t.colors.textSecondary;

  return (
    <View style={[styles.row, { borderTopColor: t.colors.border }]}>
      <View style={styles.group}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons
            name={hasLiked ? "thumbs-up" : "thumbs-up-outline"}
            size={ICON_SIZE}
            color={hasLiked ? t.colors.brand : muted}
          />
          <Text style={[styles.count, { color: hasLiked ? t.colors.brand : muted }]}>
            {likes?.length ?? 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={ICON_SIZE} color={muted} />
          <Text style={[styles.count, { color: muted }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.group}>
        <TouchableOpacity style={styles.action} onPress={handleShare}>
          <Ionicons name="arrow-redo-outline" size={ICON_SIZE} color={muted} />
          <Text style={[styles.count, { color: muted }]}>Share</Text>
        </TouchableOpacity>
        {trailing}
      </View>
    </View>
  );
}

export default memo(FeedActions);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  group: { flexDirection: "row", alignItems: "center", gap: 16 },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  count: { fontSize: 13, fontWeight: "500" },
});
