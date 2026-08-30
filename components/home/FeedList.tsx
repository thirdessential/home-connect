import FormSheetModal from "@/components/modals/FormSheetModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useToast } from "@/components/common/Toast";
import NoDataCard from "@/components/common/NoDataCard";
import { useTheme } from "@/theme/theme";
import { HomeFeedActions, HomeFeedItem } from "@/types/homeFeed.type";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AttendeesSheet from "./AttendeesSheet";
import CommentsSheet from "./CommentsSheet";
import EventFeedCard from "./EventFeedCard";
import PollFeedCard from "./PollFeedCard";
import PostFeedCard from "./PostFeedCard";

type Props = {
  items: HomeFeedItem[];
  actions: HomeFeedActions;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent?: React.ComponentProps<typeof FlatList>["ListHeaderComponent"];
  contentPaddingBottom?: number;
};

const MORE_OPTIONS = [
  { key: "report-post", label: "Report Post", icon: "flag-outline" },
  { key: "report-user", label: "Report User", icon: "person-outline" },
  { key: "hide", label: "Hide from feed", icon: "eye-off-outline" },
] as const;

/** Virtualized Home feed. Card selection + sheet plumbing only. */
function FeedList({
  items,
  actions,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  contentPaddingBottom = 24,
}: Props) {
  const t = useTheme();
  const { showToast } = useToast();
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [attendeesFor, setAttendeesFor] = useState<string | null>(null);
  const [moreFor, setMoreFor] = useState<string | null>(null);
  // Frozen at the moment Delete is tapped so the confirm dialog's wording
  // ("post" vs "poll") can't flip mid-flow once the item leaves `items`.
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; kind: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const byId = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items],
  );

  const activeMoreItem = moreFor ? byId[moreFor] : null;
  // Scoped to post/poll only — event deletion isn't part of this feature.
  const canDeleteActive =
    !!activeMoreItem?.isOwner &&
    (activeMoreItem.kind === "post" || activeMoreItem.kind === "poll");
  const menuOptions = canDeleteActive && activeMoreItem
    ? [
        ...MORE_OPTIONS,
        {
          key: "delete",
          label: activeMoreItem.kind === "poll" ? "Delete Poll" : "Delete Post",
          icon: "trash-outline" as const,
          danger: true,
        },
      ]
    : MORE_OPTIONS;

  const handleMoreSelect = useCallback(
    (key: string) => {
      if (key === "delete") {
        if (activeMoreItem) setDeleteTarget({ id: activeMoreItem.id, kind: activeMoreItem.kind });
        setMoreFor(null);
        return;
      }
      setMoreFor(null);
      showToast(
        key === "hide" ? "Hidden from your feed" : "Report submitted for review",
        "info",
      );
    },
    [showToast, activeMoreItem],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await actions.deleteItem(deleteTarget.id);
    } catch (e: any) {
      showToast(e?.message || "Failed to delete. Please try again.", "error");
      throw e;
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, actions, showToast]);

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedItem }) => {
      const common = {
        onLike: () => actions.toggleLike(item.id),
        onComment: () => setCommentsFor(item.id),
        onMore: () => setMoreFor(item.id),
      };
      if (item.kind === "event")
        return (
          <EventFeedCard
            item={item}
            {...common}
            onRsvp={() => actions.toggleRsvp(item.id)}
            onSeeAll={() => setAttendeesFor(item.id)}
          />
        );
      if (item.kind === "poll")
        return (
          <PollFeedCard
            item={item}
            {...common}
            onVote={(optionId) => actions.vote(item.id, optionId)}
          />
        );
      return <PostFeedCard item={item} {...common} />;
    },
    [actions],
  );

  const keyExtractor = useCallback((item: HomeFeedItem) => item.id, []);

  return (
    <>
      <FlatList
        data={items}
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
            tintColor={t.colors.brand}
            colors={[t.colors.brand]}
            progressBackgroundColor={t.colors.surface}
          />
        }
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
      />

      <CommentsSheet
        visible={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        comments={commentsFor ? (byId[commentsFor]?.comments ?? []) : []}
        onSubmit={async (text) => {
          if (commentsFor) await actions.addComment(commentsFor, text);
        }}
      />

      <AttendeesSheet
        visible={!!attendeesFor}
        onClose={() => setAttendeesFor(null)}
        attendees={attendeesFor ? (byId[attendeesFor]?.attendees ?? []) : []}
      />

      {!!moreFor && (
        <FormSheetModal
          visible={!!moreFor}
          onClose={() => setMoreFor(null)}
          title=""
          subtitle=""
        >
          <View style={styles.moreWrap}>
            {menuOptions.map((o) => {
              const danger = "danger" in o && o.danger;
              const color = danger ? "#DC2626" : t.colors.textPrimary;
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => handleMoreSelect(o.key)}
                  style={[styles.moreItem, { borderBottomColor: t.colors.border }]}
                >
                  <Ionicons name={o.icon} size={22} color={color} />
                  <Text style={[styles.moreLabel, { color }]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormSheetModal>
      )}

      <ConfirmationModal
        visible={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
        title="Are you sure?"
        message={`Are you sure you want to delete this ${deleteTarget?.kind === "poll" ? "poll" : "post"}?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        successTitle={deleteTarget?.kind === "poll" ? "Poll Deleted" : "Post Deleted"}
        successMessage="It has been removed from the feed."
        autoCloseDelay={900}
      />
    </>
  );
}

export default memo(FeedList);

const styles = StyleSheet.create({
  content: { paddingHorizontal: 5, flexGrow: 1 },
  moreWrap: { paddingHorizontal: 16, paddingVertical: 8 },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  moreLabel: { fontSize: 15 },
});
