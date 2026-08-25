import NoDataCard from "@/components/common/NoDataCard";
import ProductCard from "@/components/product/ProductCard";
import PollCard from "@/components/UI/PollCard";
import PostCard from "@/components/UI/PostCard";
import { useTheme } from "@/theme/theme";
import { FeedItem } from "@/types/feeds.type";
import { memo, useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

type Props = {
  feeds: FeedItem[];
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent?: React.ComponentProps<typeof FlatList>["ListHeaderComponent"];
  contentPaddingBottom?: number;
};

/**
 * The society feed, rendered with FlatList so long feeds stay virtualized.
 * Card selection by feed type is the only logic here — every card owns its own
 * data/actions (likes, votes, RSVP, report) through the existing stores.
 */
function FeedList({
  feeds,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  contentPaddingBottom = 24,
}: Props) {
  const t = useTheme();

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === "poll") return <PollCard pollId={item._id} />;
    if (item.type === "event")
      return <ProductCard productDetails={item} type="event" />;
    // Anything else (including legacy items with no `type`) renders as a post.
    return <PostCard postData={item} />;
  }, []);

  const keyExtractor = useCallback(
    (item: FeedItem) => `${item.type ?? "post"}-${item._id}`,
    [],
  );

  return (
    <FlatList
      data={feeds}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <NoDataCard
          iconName="newspaper-outline"
          message="No Posts Yet"
          subText="There's nothing to show here yet. Check back later for updates from your society."
        />
      }
      ListFooterComponent={<View style={{ height: contentPaddingBottom }} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={t.colors.primary}
          colors={[t.colors.primary]}
          progressBackgroundColor={t.colors.surface}
        />
      }
      removeClippedSubviews
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={7}
    />
  );
}

export default memo(FeedList);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
});
