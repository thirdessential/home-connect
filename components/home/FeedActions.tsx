import { useTheme } from "@/theme/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  likeCount: string;
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
  const muted = t.colors.textSecondary;

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: shareTitle || "HomeConnect",
        message: [shareTitle, shareBody, "Shared via HomeConnect"]
          .filter(Boolean)
          .join("\n\n"),
      });
    } catch {
      // Sheet dismissed or unavailable.
    }
  }, [shareTitle, shareBody]);

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
        <TouchableOpacity style={styles.action} onPress={onLike} hitSlop={6}>
          <Feather name="thumbs-up" size={ICON} color={isLiked ? "#00840d" : muted } />
          {/* <Ionicons
            name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
            size={ICON}
            color={isLiked ? t.colors.brand : muted}
          /> */}
          <Text style={[styles.label, { color: isLiked ? t.colors.brand : muted }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onComment} hitSlop={6}>
          {/* <Ionicons name="chatbubble-outline" size={ICON} color={muted} /> */}
          <MaterialCommunityIcons name="comment-text-multiple-outline" size={ICON} color={muted} />
          <Text style={[styles.label, { color: muted }]}>{commentCount}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.action} onPress={handleShare} hitSlop={6}>
        <MaterialCommunityIcons name="share-variant-outline" size={ICON} color={muted} />
        {/* <Ionicons name="share-social-outline" size={ICON} color={muted} /> */}
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
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 14, lineHeight: 15 },
});
