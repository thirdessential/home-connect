// Where an event is on its timeline. The server derives `eventPhase` from MySQL
// (home-connect-server event.service.js getEventPhase, IST-pinned); the app only
// maps it to labels / disabled states. Registration rules stay in
// eventRegistration.ts — this file never decides whether something can be joined.

import { isEventUnjoinable } from "./dateTime";

export type EventPhase = "upcoming" | "ongoing" | "completed" | "cancelled";

const PHASES: readonly string[] = ["upcoming", "ongoing", "completed", "cancelled"];

export const isEventPhase = (v: unknown): v is EventPhase => typeof v === "string" && PHASES.includes(v);

const instantMs = (iso?: string | null): number | null => {
  const n = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(n) ? n : null;
};

/**
 * The server phase, moved forward (never back) when a cached payload has since
 * crossed its start/end. It is evaluated whenever a list or screen re-renders
 * (new data, focus), not on a timer. Uses the server's ISO instants, so the
 * device's timezone is irrelevant, and it never enables anything: the server
 * re-checks every action. No explicit end instant means the client never completes an
 * event on its own. Returns undefined for a missing/unknown phase (older
 * server) so callers keep today's behavior.
 */
export const effectivePhase = (
  serverPhase: unknown,
  startsAt?: string | null,
  endsAt?: string | null,
  now: number = Date.now(),
): EventPhase | undefined => {
  if (!isEventPhase(serverPhase)) return undefined;
  if (serverPhase === "cancelled" || serverPhase === "completed") return serverPhase;
  const end = instantMs(endsAt);
  if (end !== null && now >= end) return "completed";
  const start = instantMs(startsAt);
  if (start !== null && now >= start) return "ongoing";
  return serverPhase;
};

export type PhaseTone = "brand" | "warning" | "neutral" | "danger";

export type PhaseUi = { label: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED"; tone: PhaseTone; disabled: boolean; muted: boolean };

/** Status pill + disabled/muted flags. null when the phase is unknown (nothing is shown or muted). */
export const phaseUi = (phase?: EventPhase | null): PhaseUi | null => {
  switch (phase) {
    case "upcoming":
      return { label: "UPCOMING", tone: "brand", disabled: false, muted: false };
    case "ongoing":
      return { label: "ONGOING", tone: "warning", disabled: true, muted: true };
    case "completed":
      return { label: "COMPLETED", tone: "neutral", disabled: true, muted: true };
    case "cancelled":
      return { label: "CANCELLED", tone: "danger", disabled: false, muted: false };
    default:
      return null;
  }
};

/** True once the event is under way or over. Admitting new people (join requests, invites) is no longer valid. */
export const hasEventStarted = (phase?: EventPhase | null): boolean => phase === "ongoing" || phase === "completed";

/**
 * Whether a row belongs under an "Upcoming" list (e.g. a pending join request in My Events → Joined → Upcoming).
 * Uses the effective phase, so a cached row that has since started drops out; no phase (older server) keeps it.
 */
export const isUpcomingListItem = (
  e: { eventPhase?: unknown; eventStartsAt?: string | null; eventEndsAt?: string | null },
  now: number = Date.now(),
): boolean => isPhaseInteractive(effectivePhase(e.eventPhase, e.eventStartsAt, e.eventEndsAt, now));

/** Participation actions (join / request / leave) make sense only before the start. Unknown phase stays interactive; the server enforces. */
export const isPhaseInteractive = (phase?: EventPhase | null): boolean => phase === undefined || phase === null || phase === "upcoming";

/**
 * Home feed visibility. Ongoing and completed events stay; cancelled events and
 * upcoming events past their registration cutoff are dropped (the server omits
 * them on a fresh fetch — this covers cached lists). Without a phase (older
 * server) the previous rule applies unchanged.
 */
export const isHiddenFromHome = (
  i: { eventPhase?: EventPhase; registrationClosesAt?: string | null; eventStartsAt?: string | null },
  now: number = Date.now(),
): boolean => {
  if (!i.eventPhase) return isEventUnjoinable(i.registrationClosesAt, i.eventStartsAt, now);
  if (i.eventPhase === "cancelled") return true;
  if (i.eventPhase === "upcoming") {
    const closes = instantMs(i.registrationClosesAt);
    return closes !== null && closes <= now;
  }
  return false;
};
