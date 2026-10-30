// Options for the Home feed card's three-dot sheet. UI visibility only: the server
// re-checks role and the record's society on every delete (403 outside the admin's scope).

export type FeedMenuKind = "post" | "poll" | "event";

export type FeedMenuOption = {
  key: "report-post" | "report-user" | "delete";
  label: string;
  icon: "flag-outline" | "person-outline" | "trash-outline";
  danger?: boolean;
};

const REPORT_OPTIONS: FeedMenuOption[] = [
  { key: "report-post", label: "Report Post", icon: "flag-outline" },
  { key: "report-user", label: "Report User", icon: "person-outline" },
];

const DELETE_LABEL: Record<FeedMenuKind, string> = {
  post: "Delete Post",
  poll: "Delete Poll",
  event: "Delete Event",
};

/**
 * Posts/polls: the owner, or any admin/super admin. Events: admins only (upcoming/ongoing run
 * the existing cancel flow, completed use the admin delete); a cancelled event is already gone.
 */
export const canDeleteFeedItem = (item: { kind: FeedMenuKind; isOwner?: boolean; eventPhase?: string }, isAdmin: boolean): boolean => {
  if (item.kind === "event") return isAdmin && item.eventPhase !== "cancelled";
  return !!item.isOwner || isAdmin;
};

export const getFeedMenuOptions = (
  item: { kind: FeedMenuKind; isOwner?: boolean; eventPhase?: string } | null | undefined,
  isAdmin: boolean,
): FeedMenuOption[] =>
  item && canDeleteFeedItem(item, isAdmin)
    ? [...REPORT_OPTIONS, { key: "delete", label: DELETE_LABEL[item.kind], icon: "trash-outline", danger: true }]
    : REPORT_OPTIONS;
