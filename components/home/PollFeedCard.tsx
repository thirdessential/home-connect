import { useTheme } from "@/theme/theme";
import { HomeFeedItem } from "@/types/homeFeed.type";
import { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FeedActions from "./FeedActions";
import FeedCardHeader from "./FeedCardHeader";

type Props = {
  item: HomeFeedItem;
  onLike: () => void;
  onComment: () => void;
  onVote: (optionId: string) => void;
  onMore: () => void;
};

/** Community poll. Results render once the user has voted. */
function PollFeedCard({ item, onLike, onComment, onVote, onMore }: Props) {
  const t = useTheme();
  const total = item.totalVotes ?? 0;
  const voted = !!item.votedOptionId;

  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
      <FeedCardHeader
        author={item.author}
        meta={item.meta}
        isPublic={item.isPublic}
        badge="POLL"
        onMorePress={onMore}
      />

      <View style={styles.block}>
        {!!item.title && (
          <Text style={[styles.question, { color: t.colors.textPrimary }]}>
            {item.title}
          </Text>
        )}

        <View style={styles.options}>
          {(item.options ?? []).map((o, index) => {
            const optionKey =
              o?.id != null && String(o.id).length
                ? String(o.id)
                : `${item.id}-option-${index}`;
            const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
            const selected =
              item.votedOptionId != null && String(item.votedOptionId) === optionKey;
            return (
              <TouchableOpacity
                key={optionKey}
                activeOpacity={voted ? 1 : 0.8}
                onPress={() => !voted && onVote(optionKey)}
                style={[
                  styles.option,
                  {
                    backgroundColor: t.colors.surfaceAlt,
                    borderColor: selected ? t.colors.brand : t.colors.border,
                    borderWidth: selected ? 1.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: selected ? t.colors.brandWeak : t.colors.border,
                      opacity: selected ? 1 : 0.55,
                    },
                  ]}
                />
                <View style={styles.optionRow}>
                  <View style={styles.optionLabelWrap}>
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: t.colors.textPrimary,
                          fontWeight: selected ? "600" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {o.name}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={15} color={t.colors.brand} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionPct,
                      { color: selected ? t.colors.brand : t.colors.textSecondary },
                    ]}
                  >
                    {pct}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.footnote, { color: t.colors.textSecondary }]}>
          {total} vote{total === 1 ? "" : "s"}
          {item.pollEndsLabel ? ` • ${item.pollEndsLabel}` : ""}
          {voted ? " • You voted" : ""}
        </Text>
      </View>

      <FeedActions
        likeCount={item.likeCount}
        isLiked={item.isLiked}
        commentCount={item.commentCount}
        shareTitle={item.title}
        onLike={onLike}
        onComment={onComment}
      />
    </View>
  );
}

export default memo(PollFeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    gap: 16,
    borderWidth: 1,
    borderColor: "#00000010"
  },
  block: { gap: 12 },
  question: { fontSize: 16, fontWeight: "600", letterSpacing: -0.16, lineHeight: 22 },
  options: { gap: 8 },
  option: { borderRadius: 8, borderWidth: 1, padding: 12, overflow: "hidden" },
  optionFill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  optionLabel: { fontSize: 13, lineHeight: 20, flexShrink: 1 },
  optionPct: { fontSize: 13, fontWeight: "700", marginLeft: 8 },
  footnote: { fontSize: 11, lineHeight: 16 },
});
