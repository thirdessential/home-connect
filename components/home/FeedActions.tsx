import { useToast } from "@/components/common/Toast";
import { useTheme } from "@/theme/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  shareTitle?: string;
  shareBody?: string;
  onLike: () => void;
  onComment: () => void;
  /** The card draws its own full-width divider instead. */
  noDivider?: boolean;
};

const ICON = 18;
// Heart and comment are the primary actions, ~21% larger than the 18 they had (measured on device).
// The Feather message-circle outline fills less of its box than the heart does, so it needs 23.
const ICON_LARGE = 22;
const ICON_COMMENT = 23;
// Every action is ICON_COMMENT tall, so +11 above and below gives a 45pt-tall tap area; the 8pt side
// slop on each of two neighbours exactly fills the 16pt gap between actions (no overlap).
const HIT_SLOP = { top: 11, bottom: 11, left: 8, right: 8 };

/**
 * The one Like / Comment / Share footer used by Event, Post and Poll cards, so
 * icon set, size, spacing and alignment stay identical across all three.
 */
function FeedActions({
  likeCount,
  isLiked,
  commentCount,
  shareTitle,
  shareBody,
  onLike,
  onComment,
  noDivider = false,
}: Props) {
  const t = useTheme();
  const { showToast } = useToast();
  const muted = t.colors.textSecondary;

  const handleShare = useCallback(async () => {
    try {
      // Dismissing the sheet resolves normally; only a real failure throws.
      await Share.share({
        title: shareTitle || "HomeConnect",
        message: [shareTitle, shareBody, "Shared via HomeConnect"]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      showToast("Couldn't open the share sheet. Please try again.", "error");
    }
  }, [shareTitle, shareBody, showToast]);

  return (
    <View
      style={[
        styles.row,
        noDivider
          ? styles.rowFlush
          : { borderTopWidth: 1, borderTopColor: t.colors.border },
      ]}
    >
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.action}
          onPress={onLike}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`${isLiked ? "Unlike" : "Like"}, ${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
          accessibilityState={{ selected: isLiked }}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={ICON_LARGE}
            color={isLiked ? t.colors.brand : muted}
          />
          <Text style={[styles.label, { color: isLiked ? t.colors.brand : muted }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onComment}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`Comments, ${commentCount}`}
        >
          <Feather name="message-circle" size={ICON_COMMENT} color={muted} />
          <Text style={[styles.label, { color: muted }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.action}
        onPress={handleShare}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Share"
      >
        <Ionicons name="share-social-outline" size={ICON} color={muted} />
        <Text style={[styles.label, { color: muted }]}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(FeedActions);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
  },
  rowFlush: { paddingTop: 0, marginTop: 0 },
  group: { flexDirection: "row", alignItems: "center", gap: 16 },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: ICON_COMMENT },
  label: { fontSize: 14, fontFamily: "Manrope_500Medium", lineHeight: 15 },
});
