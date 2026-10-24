// Presentation of the backend's `registrationStatus` (see home-connect-server
// event.service.js getEventRegistrationStatus). The server decides; the app only
// maps the status to a label — no capacity/time rules live here.

export type RegistrationStatus = "OPEN" | "FULL" | "CLOSED" | "STARTED" | "JOINED" | "CANCELLED" | "COMPLETED";

export type RegistrationUi = { label: string; disabled: boolean; icon: "arrow-forward" | "checkmark-circle" | "lock-closed-outline" };

export const registrationUi = (status?: string | null, fallbackLabel = "Join Event"): RegistrationUi => {
  switch (status) {
    case "JOINED":
      return { label: "Joined", disabled: false, icon: "checkmark-circle" };
    case "FULL":
      return { label: "HOUSEFULL", disabled: true, icon: "lock-closed-outline" };
    case "CLOSED":
      return { label: "REGISTRATION CLOSED", disabled: true, icon: "lock-closed-outline" };
    case "COMPLETED":
      return { label: "EVENT COMPLETED", disabled: true, icon: "lock-closed-outline" };
    case "STARTED":
      return { label: "EVENT STARTED", disabled: true, icon: "lock-closed-outline" };
    case "CANCELLED":
      return { label: "EVENT CANCELLED", disabled: true, icon: "lock-closed-outline" };
    default:
      return { label: fallbackLabel, disabled: false, icon: "arrow-forward" };
  }
};

/** True when a failed join means the event filled up (server `errorCode`). */
export const isEventFullError = (e: any) => e?.body?.errorCode === "EVENT_FULL";

export type JoinRequestStatus = "pending" | "approved" | "rejected";
export type JoinRequest = { id: number; status: JoinRequestStatus; reason?: string | null; createdAt?: string };

/** Badge text for the viewer's own join request (server state). Approved is shown as the normal JOINED state. */
export const joinRequestBadge = (status?: string | null): string | null =>
  status === "pending" ? "REQUEST PENDING" : status === "rejected" ? "REQUEST REJECTED" : null;

export const joinRequestRejectedMessage = (reason?: string | null) =>
  reason
    ? `Your request was rejected: ${reason}`
    : "The organizer declined your request.";

/** The housefull request flow applies only while the server says FULL and no request exists yet. */
export const canRequestToJoin = (e: { registrationStatus?: string; joinRequest?: { status: string } | null }) =>
  e.registrationStatus === "FULL" && !e.joinRequest;

/** Request-to-join / review failures keyed on the server errorCode. */
export const joinRequestErrorMessage = (e: any): string => {
  switch (e?.body?.errorCode) {
    case "REQUEST_PENDING": return "You already have a pending request for this event.";
    case "REQUEST_FINALIZED": return "This request has already been decided.";
    case "EVENT_NOT_FULL": return "This event now has places available — you can join it directly.";
    case "EVENT_FULL": return "This event is housefull — no place is free to approve this request yet.";
    case "EVENT_ORGANIZER": return "You organize this event.";
    case "EVENT_CANCELLED": return "This event has been cancelled.";
    case "EVENT_CLOSED": return "Registration has closed for this event.";
    case "EVENT_STARTED": return "This event has already started.";
    case "EVENT_DUPLICATE": return "You have already joined this event.";
    case "REQUEST_NOT_FOUND": case "EVENT_NOT_FOUND": return "This request or event no longer exists.";
  }
  if (e?.status === 403) return "You aren't allowed to do that.";
  if (e?.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (e?.status == null) return "Couldn't reach the server. Check your connection and try again.";
  return e?.message || "Something went wrong. Please try again.";
};

/**
 * Home-card call to action. The organizer never gets a resident join/request
 * action on their own event (they are not a participant); everyone else keeps
 * the server-driven registrationUi. `isOwner` = feed item's creator is the
 * authenticated user.
 */
export const eventCardCta = (
  item: { isOwner?: boolean; isJoined?: boolean; registrationStatus?: string | null },
  fallbackLabel = "Join Event",
): RegistrationUi & { isOrganizer: boolean } => {
  if (item.isOwner) return { label: "YOUR EVENT", disabled: false, icon: "arrow-forward", isOrganizer: true };
  if (item.isJoined) return { label: "Joined", disabled: false, icon: "checkmark-circle", isOrganizer: false };
  return { ...registrationUi(item.registrationStatus, fallbackLabel), isOrganizer: false };
};

/** Approve/Reject are offered only for a request the server still reports as pending. */
export const canDecideJoinRequest = (status?: string | null) => status === "pending";

/** Organizer-facing label for the dashboard entry point. */
export const joinRequestsEntryLabel = (pendingCount: number, countFailed: boolean) =>
  countFailed ? "Join Requests (tap to retry)" : `Join Requests (${pendingCount})`;

export type DetailsFooterState =
  | "organizer" | "joined" | "request_pending" | "request_rejected" | "event_full" | "blocked" | "join";

/**
 * Event Details bottom CTA, derived only from server-reported fields. A request
 * badge appears solely for a request the server stores as pending/rejected —
 * a full event alone never implies either. "event_full" = full with no request
 * yet (the housefull request-to-join flow); "blocked" = closed/started/cancelled.
 */
export const detailsFooterState = (e: {
  isCreator: boolean;
  currentUserJoined?: boolean;
  registrationStatus?: string;
  joinRequest?: { status: string } | null;
  blockedReason?: string | null;
}): DetailsFooterState => {
  if (e.isCreator) return "organizer";
  if (e.currentUserJoined && e.registrationStatus !== "STARTED") return "joined";
  const open = e.registrationStatus === "FULL" || e.registrationStatus === "OPEN";
  if (open && e.joinRequest?.status === "pending") return "request_pending";
  if (open && e.joinRequest?.status === "rejected") return "request_rejected";
  if (canRequestToJoin(e)) return "event_full";
  if (e.blockedReason) return "blocked";
  return "join";
};
