// Client-side mirror of the backend's cancel-details rules and error codes
// (home-connect-server event.controller.js: cancelEventController,
// LIFECYCLE_ERRORS, joinEvent). The server stays the authority — these only
// stop an obviously invalid request and turn its errors into readable text.

import type { EventPhase } from "./eventPhase";

export const CANCEL_TITLE_MAX = 70;
export const CANCEL_REASON_MAX = 300;

export type CancelDetailsErrors = { title?: string; reason?: string };

// The server counts code points ([...s].length) after trimming; match that.
const len = (s: string) => Array.from(s).length;

export const validateCancelDetails = (title: string, reason: string) => {
  const t = (title ?? "").trim();
  const r = (reason ?? "").trim();
  const errors: CancelDetailsErrors = {};
  if (!t) errors.title = "Enter a cancellation title";
  else if (len(t) > CANCEL_TITLE_MAX) errors.title = `Title must be ${CANCEL_TITLE_MAX} characters or fewer`;
  if (!r) errors.reason = "Enter a reason for cancelling";
  else if (len(r) > CANCEL_REASON_MAX) errors.reason = `Reason must be ${CANCEL_REASON_MAX} characters or fewer`;
  return { valid: !errors.title && !errors.reason, title: t, reason: r, errors };
};

const errorCodeOf = (e: any): string | undefined => e?.body?.errorCode;
const isNetwork = (e: any) => e?.status == null;

/** User-facing text for a failed PATCH /api/events/:id/cancel. */
export const cancelErrorMessage = (e: any): string => {
  switch (errorCodeOf(e)) {
    case "CANCEL_DETAILS_INVALID":
      return e?.body?.message || "Please check the cancellation title and reason.";
    case "EVENT_COMPLETED":
      return "This event is already completed and can't be cancelled.";
    case "EVENT_NOT_FOUND":
      return "This event no longer exists.";
    case "EVENT_MIN_NOT_MET":
      return "The minimum number of participants hasn't been reached yet.";
    case "REMINDER_COOLDOWN":
      return "A reminder was sent recently. Please wait a few minutes before sending another.";
    case "EVENT_NO_PARTICIPANTS":
      return "There are no confirmed participants to remind yet.";
  }
  if (e?.status === 403) return "Only the organizer can cancel this event.";
  if (e?.status === 404) return "This event no longer exists.";
  if (isNetwork(e)) return "Couldn't reach the server. Check your connection and try again.";
  if (e?.status >= 500) return "Something went wrong on our side. Please try again.";
  return e?.message || "Failed to cancel event";
};

/** User-facing text for a failed leave (PATCH participants/:userId/cancel). */
export const leaveErrorMessage = (e: any): string => {
  if (errorCodeOf(e) === "EVENT_STARTED") return "This event has already started, so you can't leave it.";
  if (errorCodeOf(e) === "EVENT_COMPLETED") return "This event is completed, so your participation can't be changed.";
  if (e?.status === 403) return "You aren't allowed to leave this event.";
  if (e?.status === 404) return "You are no longer registered for this event.";
  if (isNetwork(e)) return "Couldn't reach the server. Check your connection and try again.";
  if (e?.status >= 500) return "Something went wrong on our side. Please try again.";
  return e?.message || "Failed to leave event";
};

/** Join rejected because the caller organizes the event (409 EVENT_ORGANIZER). */
export const isOrganizerJoinError = (e: any) => errorCodeOf(e) === "EVENT_ORGANIZER";

/** Join/leave state conflicts that mean "re-sync from the server". */
export const isEventStateConflict = (e: any) => e?.status === 409;

// ---- close / complete / delay / reminders / event reports -------------------
// Values mirror the server (event.controller.js): delay minutes ∈ {10,30,60},
// reminder offsets ∈ {30,20,10,5,2} (the 60-minute reminder is implicit).

export const DELAY_OPTIONS = [10, 30, 60] as const;
export const REMINDER_OPTIONS = [30, 20, 10, 5, 2] as const;
export const REPORT_TITLE_MAX = 70;
export const REPORT_DESCRIPTION_MAX = 300;

export const isValidDelay = (m: unknown): m is (typeof DELAY_OPTIONS)[number] =>
  typeof m === "number" && (DELAY_OPTIONS as readonly number[]).includes(m);

/** Drops unsupported values and duplicates (the server collapses duplicates too), sorted high → low. */
export const normalizeReminders = (offsets: unknown[]): number[] =>
  Array.from(new Set(offsets.map(Number).filter((n) => (REMINDER_OPTIONS as readonly number[]).includes(n)))).sort(
    (a, b) => b - a,
  );

export const remindersEqual = (a: number[] = [], b: number[] = []) => {
  const x = normalizeReminders(a);
  const y = normalizeReminders(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

export const validateEventReport = (title: string, description: string) => {
  const t = (title ?? "").trim();
  const d = (description ?? "").trim();
  const errors: { title?: string; description?: string } = {};
  if (!t) errors.title = "Enter a title";
  else if (len(t) > REPORT_TITLE_MAX) errors.title = `Title must be ${REPORT_TITLE_MAX} characters or fewer`;
  if (!d) errors.description = "Describe the issue";
  else if (len(d) > REPORT_DESCRIPTION_MAX)
    errors.description = `Description must be ${REPORT_DESCRIPTION_MAX} characters or fewer`;
  return { valid: !errors.title && !errors.description, title: t, description: d, errors };
};

export type LifecycleAction = "close" | "complete" | "delay" | "reminders" | "report" | "start" | "remind";

/** Readable text for a failed lifecycle action; every confirmed errorCode gets its own message. */
export const lifecycleErrorMessage = (e: any, action: LifecycleAction): string => {
  switch (errorCodeOf(e)) {
    case "EVENT_NOT_STARTED":
      return "This event hasn't started yet, so it can't be marked completed.";
    case "EVENT_STARTED":
      return action === "close"
        ? "This event has already started, so registration can't be closed."
        : "This event has already started, so its schedule can't be changed.";
    case "EVENT_CANCELLED":
      return "This event has been cancelled.";
    case "EVENT_COMPLETED":
      return "This event is already completed.";
    case "EVENT_NOT_FOUND":
      return "This event no longer exists.";
  }
  if (e?.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (e?.status === 403)
    return action === "report"
      ? e?.body?.error || "Only participants who joined this event can report an issue."
      : "Only the organizer can do this.";
  if (e?.status === 404) {
    // A real "event not found" is JSON with an error text; a bare/HTML 404 means the route
    // itself isn't served (the connected backend is an older deployment), not a deleted event.
    return e?.body?.error || e?.body?.errorCode
      ? "This event no longer exists."
      : "This feature isn't available on the connected server yet. Please try again after the server is updated.";
  }
  if (e?.status === 400 && (e?.body?.message || e?.body?.error)) return e.body.message || e.body.error;
  if (e?.status === 409 && (e?.body?.message || e?.body?.error)) return e.body.message || e.body.error;
  if (isNetwork(e)) return "Couldn't reach the server. Check your connection and try again.";
  if (e?.status >= 500) return "Something went wrong on our side. Please try again.";
  return e?.message || "Something went wrong. Please try again.";
};

/** A failed participant removal that means the event or the roster changed under the screen: re-sync it. */
export const shouldResyncAfterParticipantError = (e: any): boolean => e?.status === 404 || e?.status === 409;

/** Participant removal by the organizer (PATCH participants/:userId/cancel). */
export const removeParticipantErrorMessage = (e: any): string => {
  if (errorCodeOf(e) === "EVENT_COMPLETED") return "This event is completed, so participants can't be removed.";
  if (e?.status === 403) return "Only the organizer can remove participants.";
  if (e?.status === 404) return "This participant is no longer registered.";
  if (isNetwork(e)) return "Couldn't reach the server. Check your connection and try again.";
  if (e?.status >= 500) return "Something went wrong on our side. Please try again.";
  return e?.message || "Failed to remove participant";
};

/**
 * What organizer actions make sense for a server-reported status and phase
 * (backend still enforces). Close registration / delay / reminders only make
 * sense before the start; End Event stays offered while ongoing (and for a
 * time-ended event nobody marked completed); cancel is gone once completed.
 * No phase (older server) keeps the status-only behavior.
 */
export const organizerActions = (status?: string, phase?: EventPhase) => {
  const live = status === "active" || status === "closed";
  const beforeStart = phase === undefined || phase === "upcoming";
  return {
    canClose: status === "active" && beforeStart,
    canComplete: live,
    canDelay: live && beforeStart,
    canEditReminders: live && beforeStart,
    canCancel: live && phase !== "completed",
  };
};

/**
 * Send Reminder / Start Event availability for the organizer dashboard, from
 * server-reported fields only (the backend re-validates everything). Both are
 * offered only for an upcoming, active/closed event; Start also needs the
 * stored minimum participant count, Reminder needs at least one participant.
 */
export const organizerEventActions = (
  e: { status?: string; eventStartAt?: string | null; hasStarted?: boolean; joined: number; min: number },
  now: number = Date.now(),
) => {
  const live = e.status === "active" || e.status === "closed";
  const startMs = e.eventStartAt ? new Date(e.eventStartAt).getTime() : NaN;
  const started = e.hasStarted ?? (Number.isFinite(startMs) && now >= startMs);
  const upcoming = live && Number.isFinite(startMs) && !started;
  const missing = Math.max(0, e.min - e.joined);
  return {
    showReminder: upcoming,
    canSendReminder: upcoming && e.joined > 0,
    showStart: upcoming,
    canStart: upcoming && missing === 0,
    /** End Event: started, not yet completed/cancelled (backend re-validates). */
    showEnd: live && started,
    startHint: upcoming && missing > 0 ? `${missing} more participant${missing === 1 ? "" : "s"} needed to start` : null,
  };
};
