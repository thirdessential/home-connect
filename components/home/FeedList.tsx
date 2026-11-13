import FormSheetModal from "@/components/modals/FormSheetModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import VerificationGateModal from "@/components/common/VerificationGateModal";
import { useToast } from "@/components/common/Toast";
import NoDataCard from "@/components/common/NoDataCard";
import { useVerificationGate } from "@/hooks/useVerificationGate";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/roles";
import { getFeedMenuOptions } from "@/lib/feedMenu";
import { useTheme } from "@/theme/theme";
import { HomeFeedActions, HomeFeedItem } from "@/types/homeFeed.type";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { createInFlightGuard } from "@/lib/inFlightGuard";
import { Flag, Trash2, User } from "lucide-react-native";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AttendeesSheet from "./AttendeesSheet";
import CommentsSheet from "./CommentsSheet";
import ReportModal, { ReportType } from "@/components/modals/ReportModal";
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
  const { requireVerified, gate, closeGate } = useVerificationGate();
  const { hasAnyRole } = usePermissions();
  const isAdmin = hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [attendeesFor, setAttendeesFor] = useState<string | null>(null);
  const [moreFor, setMoreFor] = useState<string | null>(null);
  // Frozen at the moment Delete is tapped so the confirm dialog's wording
  // ("post" vs "poll") can't flip mid-flow once the item leaves `items`.
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; kind: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: ReportType; id: string; name?: string } | null>(null);

  const byId = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items],
  );

  const activeMoreItem = moreFor ? byId[moreFor] : null;
  // Visibility rules live in lib/feedMenu.ts; the backend re-checks role and society scope.
  const menuOptions = useMemo(() => getFeedMenuOptions(activeMoreItem, isAdmin), [activeMoreItem, isAdmin]);

  const handleMoreSelect = useCallback(
    (key: string) => {
      if (key === "delete") {
        if (activeMoreItem) setDeleteTarget({ id: activeMoreItem.id, kind: activeMoreItem.kind });
        setMoreFor(null);
        return;
      }
      if (key === "report-post" && activeMoreItem) {
        setReportTarget({ type: activeMoreItem.kind as ReportType, id: activeMoreItem.id, name: activeMoreItem.title });
        setMoreFor(null);
        return;
      }
      if (key === "report-user" && activeMoreItem) {
        setReportTarget({ type: "user", id: activeMoreItem.author.authorId ?? "", name: activeMoreItem.author.name });
        setMoreFor(null);
        return;
      }
      setMoreFor(null);
    },
    [activeMoreItem],
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
        onLike: () => {
          if (!requireVerified("action")) return;
          hapticLight();
          actions.toggleLike(item.id);
        },
        onComment: () => {
          if (!requireVerified("action")) return;
          hapticLight();
          setCommentsFor(item.id);
        },
        onMore: () => {
          if (!requireVerified("action")) return;
          setMoreFor(item.id);
        },
      };
      if (item.kind === "event")
        return (
          <EventFeedCard
            item={item}
            {...common}
            onRsvp={() => {
              // Join Event must never call the join API for a guest/unverified
              // user — block before any store/API call happens.
              if (!requireVerified("action")) return;
              // Immediate feedback + one join request per event at a time.
              hapticMedium();
              void joinGuard.run(item.id, () => Promise.resolve(actions.toggleRsvp(item.id)));
            }}
            onSeeAll={() => setAttendeesFor(item.id)}
            onOpen={() => {
              // Navigation is blocked before it happens — no brief open + redirect.
              if (!requireVerified("page")) return;
              if (!item.mysqlEventId) {
                showToast("This event was created on an older version of the app and can no longer be opened.", "error");
                return;
              }
              router.navigate(`/(shared)/event-details?eventId=${item.mysqlEventId}`);
            }}
          />
        );
      if (item.kind === "poll")
        return (
          <PollFeedCard
            item={item}
            {...common}
            onVote={(optionId) => {
              if (!requireVerified("action")) return;
              actions.vote(item.id, optionId);
            }}
          />
        );
      return <PostFeedCard item={item} {...common} />;
    },
    [actions, requireVerified, showToast],
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

      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportType={reportTarget.type}
          itemId={reportTarget.id}
          itemName={reportTarget.name}
        />
      )}

      <CommentsSheet
        visible={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        comments={commentsFor ? (byId[commentsFor]?.comments ?? []) : []}
        feedId={commentsFor ?? undefined}
        onSubmit={async (text, parentCommentId) => {
          if (commentsFor) await actions.addComment(commentsFor, text, parentCommentId);
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
          title={activeMoreItem?.kind === "event" ? "Event Options" : activeMoreItem?.kind === "poll" ? "Poll Options" : "Post Options"}
          compactHeader
          scroll={false}
        >
          <View style={styles.moreWrap}>
            {menuOptions.map((o, i) => {
              const color = o.danger ? "#DC2626" : t.colors.textPrimary;
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => handleMoreSelect(o.key)}
                  style={[styles.moreItem, i < menuOptions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.border }]}
                >
                  {(() => { const I = MENU_ICONS[o.key]; return <I size={22} strokeWidth={1.75} color={color} />; })()}
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
        title={`Delete ${deleteTarget?.kind === "poll" ? "Poll" : deleteTarget?.kind === "event" ? "Event" : "Post"}?`}
        message={
          deleteTarget?.kind === "event"
            ? "Are you sure you want to delete this event? Registered participants will be notified. This action cannot be undone."
            : `Are you sure you want to delete this ${deleteTarget?.kind === "poll" ? "poll" : "post"}? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        successTitle={deleteTarget?.kind === "poll" ? "Poll Deleted" : deleteTarget?.kind === "event" ? "Event Deleted" : "Post Deleted"}
        successMessage="It has been removed from the feed."
        autoCloseDelay={900}
      />

      <VerificationGateModal visible={gate.visible} mode={gate.mode} onClose={closeGate} />
    </>
  );
}

export default memo(FeedList);

const joinGuard = createInFlightGuard();

const MENU_ICONS = { "report-post": Flag, "report-user": User, delete: Trash2 } as const;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 5, flexGrow: 1 },
  moreWrap: { paddingHorizontal: 8, paddingBottom: 4 },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 56,
    paddingVertical: 14,
  },
  moreLabel: { fontSize: 16, fontFamily: "Manrope_600SemiBold" },
});
