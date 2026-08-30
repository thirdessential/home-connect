import { useTheme } from "@/theme/theme";
import { HomeFeedItem } from "@/types/homeFeed.type";
import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import FeedActions from "./FeedActions";
import FeedCardHeader from "./FeedCardHeader";

type Props = {
  item: HomeFeedItem;
  onLike: () => void;
  onComment: () => void;
  onMore: () => void;
};

/** Standard text / photo post. */
function PostFeedCard({ item, onLike, onComment, onMore }: Props) {
  const t = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
      <FeedCardHeader
        author={item.author}
        meta={item.meta}
        isPublic={item.isPublic}
        badge="POSTS"
        onMorePress={onMore}
      />

      {!!item.title && (
        <Text style={[styles.title, { color: t.colors.textPrimary }]}>{item.title}</Text>
      )}

      {!!item.description && (
        <Text style={[styles.body, { color: t.colors.textSecondary }]}>
          {item.description}
        </Text>
      )}

      {!!item.image && (
        <Image
          source={{ uri: item.image }}
          style={[styles.image, { backgroundColor: t.colors.surfaceAlt }]}
          resizeMode="cover"
        />
      )}

      {item.canInteract !== false && (
      <FeedActions
        likeCount={item.likeCount}
        isLiked={item.isLiked}
        commentCount={item.commentCount}
        shareTitle={item.title || "Post from HomeConnect"}
        shareBody={item.description}
        onLike={onLike}
        onComment={onComment}
      />
      )}
    </View>
  );
}

export default memo(PostFeedCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    gap: 16,
    borderWidth: 1,
    borderColor: "#00000010"
  },
  title: { fontSize: 16, fontWeight: "600", letterSpacing: -0.16, marginBottom: -8 },
  body: { fontSize: 13, lineHeight: 20 },
  image: { width: "100%", aspectRatio: 1.6, borderRadius: 8 },
});
