import { useToast } from "@/components/common/Toast";
import { hapticLight } from "@/lib/haptics";
import { useTheme } from "@/theme/theme";
import { Heart, MessageSquare, Share2 } from "lucide-react-native";
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
    hapticLight();
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
      <TouchableOpacity
        style={[styles.action, styles.actionStart]}
        onPress={onLike}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${isLiked ? "Unlike" : "Like"}, ${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
        accessibilityState={{ selected: isLiked }}
      >
        <Heart
          size={24}
          strokeWidth={1.75}
          color={isLiked ? "#c1121f" : t.colors.textPrimary}
          fill={isLiked ? "#c1121f" : "none"}
        />
        <Text style={[styles.label, { color: t.colors.textPrimary }]}>{likeCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.action, styles.actionCenter]}
        onPress={onComment}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Comments, ${commentCount}`}
      >
        <MessageSquare size={24} strokeWidth={1.75} color={t.colors.textPrimary} />
        <Text style={[styles.label, { color: t.colors.textPrimary }]}>{commentCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.action, styles.actionEnd]}
        onPress={handleShare}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Share"
      >
        <Share2 size={24} strokeWidth={1.75} color={t.colors.textPrimary} />
        <Text style={[styles.label, { color: t.colors.textPrimary }]}>Share</Text>
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
  action: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  actionStart: { justifyContent: "flex-start" },
  actionCenter: { justifyContent: "center" },
  actionEnd: { justifyContent: "flex-end" },
  label: { fontSize: 16, fontFamily: "Manrope_500Medium" },
});
