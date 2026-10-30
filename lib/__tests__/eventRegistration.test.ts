import assert from "node:assert/strict";
import { test } from "node:test";
import { canRequestToJoin, isEventFullError, joinRequestBadge, joinRequestErrorMessage, registrationUi } from "../eventRegistration";

test("OPEN / unknown -> enabled join button", () => {
  assert.deepEqual(registrationUi("OPEN"), { label: "Join Event", disabled: false, icon: "arrow-forward" });
  assert.equal(registrationUi(undefined, "RSVP").label, "RSVP");
});
test("FULL -> HOUSEFULL disabled; CLOSED, STARTED, CANCELLED disabled", () => {
  assert.deepEqual([registrationUi("FULL").label, registrationUi("FULL").disabled], ["HOUSEFULL", true]);
  assert.equal(registrationUi("CLOSED").label, "REGISTRATION CLOSED");
  assert.equal(registrationUi("STARTED").label, "EVENT STARTED");
  for (const s of ["CLOSED", "STARTED", "CANCELLED"]) assert.equal(registrationUi(s).disabled, true);
});
test("JOINED shows Joined, never HOUSEFULL", () => {
  assert.equal(registrationUi("JOINED").label, "Joined");
});
test("EVENT_FULL error detection reads the server errorCode", () => {
  assert.equal(isEventFullError({ status: 409, body: { errorCode: "EVENT_FULL" } }), true);
  assert.equal(isEventFullError({ status: 409, body: { errorCode: "EVENT_CLOSED" } }), false);
  assert.equal(isEventFullError(new Error("x")), false);
});
test("join request badges and request eligibility follow server state", () => {
  assert.equal(joinRequestBadge("pending"), "REQUEST PENDING");
  assert.equal(joinRequestBadge("rejected"), "REQUEST REJECTED");
  assert.equal(joinRequestBadge("approved"), null);
  assert.equal(canRequestToJoin({ registrationStatus: "FULL", joinRequest: null }), true);
  assert.equal(canRequestToJoin({ registrationStatus: "FULL", joinRequest: { status: "pending" } }), false);
  for (const s of ["OPEN", "CLOSED", "STARTED", "CANCELLED", "JOINED"]) assert.equal(canRequestToJoin({ registrationStatus: s }), false);
});
test("join request errors map per errorCode", () => {
  assert.match(joinRequestErrorMessage({ status: 409, body: { errorCode: "REQUEST_PENDING" } }), /pending/);
  assert.match(joinRequestErrorMessage({ status: 409, body: { errorCode: "EVENT_FULL" } }), /housefull/);
  assert.match(joinRequestErrorMessage({ status: 409, body: { errorCode: "REQUEST_FINALIZED" } }), /already been decided/);
  assert.match(joinRequestErrorMessage(new Error("x")), /connection/);
});

import { eventCardCta } from "../eventRegistration";

test("organizer never sees Join/Request/Housefull on their own event card", () => {
  for (const registrationStatus of ["OPEN", "FULL", "CLOSED", undefined]) {
    const cta = eventCardCta({ isOwner: true, isJoined: false, registrationStatus });
    assert.equal(cta.label, "YOUR EVENT");
    assert.equal(cta.disabled, false);
    assert.equal(cta.isOrganizer, true);
  }
});

test("other residents keep the server-driven action", () => {
  assert.equal(eventCardCta({ isOwner: false, registrationStatus: "OPEN" }).label, "Join Event");
  assert.equal(eventCardCta({ isOwner: false, registrationStatus: "FULL" }).label, "HOUSEFULL");
  assert.equal(eventCardCta({ isJoined: true, registrationStatus: "OPEN" }).label, "Joined");
});

import { canDecideJoinRequest, joinRequestsEntryLabel } from "../eventRegistration";

test("Approve/Reject only for pending requests", () => {
  assert.equal(canDecideJoinRequest("pending"), true);
  for (const st of ["approved", "rejected", "PENDING", undefined, null]) assert.equal(canDecideJoinRequest(st as any), false);
});

test("entry label shows the real count, never a false zero on failure", () => {
  assert.equal(joinRequestsEntryLabel(3, false), "Join Requests (3)");
  assert.equal(joinRequestsEntryLabel(0, true), "Join Requests (tap to retry)");
});

import { detailsFooterState, joinRequestRejectedMessage } from "../eventRegistration";

const base = { isCreator: false, currentUserJoined: false, registrationStatus: "FULL", joinRequest: null, blockedReason: null };

test("details CTA: full + no request -> event_full (request flow), never pending/rejected", () => {
  assert.equal(detailsFooterState(base), "event_full");
});
test("details CTA: pending only for a pending request, rejected only for a rejected one", () => {
  assert.equal(detailsFooterState({ ...base, joinRequest: { status: "pending" } }), "request_pending");
  assert.equal(detailsFooterState({ ...base, joinRequest: { status: "rejected" } }), "request_rejected");
  assert.equal(detailsFooterState({ ...base, registrationStatus: "OPEN", joinRequest: { status: "pending" } }), "request_pending");
});
test("details CTA: joined, organizer, open, blocked", () => {
  assert.equal(detailsFooterState({ ...base, currentUserJoined: true, joinRequest: { status: "approved" } }), "joined");
  assert.equal(detailsFooterState({ ...base, isCreator: true }), "organizer");
  assert.equal(detailsFooterState({ ...base, registrationStatus: "OPEN" }), "join");
  assert.equal(detailsFooterState({ ...base, registrationStatus: "CLOSED", blockedReason: "REGISTRATION CLOSED" }), "blocked");
  assert.equal(detailsFooterState({ ...base, registrationStatus: "CANCELLED", joinRequest: { status: "pending" }, blockedReason: "EVENT CANCELLED" }), "blocked");
});
test("rejected message never invents a capacity reason", () => {
  assert.equal(joinRequestRejectedMessage(null), "The organizer declined your request.");
  assert.match(joinRequestRejectedMessage("Sorry"), /Sorry/);
});

test("completed registration status shows Completed, never Started", () => {
  assert.equal(registrationUi("COMPLETED").label, "EVENT COMPLETED");
  assert.equal(registrationUi("COMPLETED").disabled, true);
  assert.equal(registrationUi("STARTED").label, "EVENT STARTED");
  assert.equal(detailsFooterState({ isCreator: false, registrationStatus: "COMPLETED", blockedReason: "EVENT COMPLETED" }), "blocked");
});

import { eventRowBadge, phaseBlockedReason } from "../eventRegistration";

test("ongoing: a joined viewer's card is disabled (never an enabled 'Joined')", () => {
  const cta = eventCardCta({ isJoined: true, registrationStatus: "JOINED", eventPhase: "ongoing" });
  assert.deepEqual([cta.label, cta.disabled, cta.isOrganizer], ["Joined", true, false]);
});
test("ongoing/completed: the organizer card is disabled but still flagged as the organizer's", () => {
  for (const eventPhase of ["ongoing", "completed"] as const) {
    const cta = eventCardCta({ isOwner: true, registrationStatus: "OPEN", eventPhase });
    assert.deepEqual([cta.label, cta.disabled, cta.isOrganizer], ["YOUR EVENT", true, true]);
  }
});
test("ongoing/completed: other residents get a read-only locked label, whatever the registration status", () => {
  for (const registrationStatus of ["OPEN", "FULL", "CLOSED", "STARTED", undefined]) {
    const live = eventCardCta({ registrationStatus, eventPhase: "ongoing" });
    assert.deepEqual([live.label, live.disabled, live.icon], ["EVENT IN PROGRESS", true, "lock-closed-outline"]);
    const done = eventCardCta({ registrationStatus, eventPhase: "completed" });
    assert.deepEqual([done.label, done.disabled, done.icon], ["EVENT COMPLETED", true, "lock-closed-outline"]);
  }
});
test("upcoming and missing phase keep today's output unchanged", () => {
  for (const eventPhase of [undefined, "upcoming"] as const) {
    assert.equal(eventCardCta({ registrationStatus: "OPEN", eventPhase }).label, "Join Event");
    assert.equal(eventCardCta({ registrationStatus: "FULL", eventPhase }).disabled, true);
    assert.equal(eventCardCta({ isOwner: true, eventPhase }).disabled, false);
    assert.equal(eventCardCta({ isJoined: true, eventPhase }).disabled, false);
  }
});
test("phaseBlockedReason names ongoing/completed, nothing else", () => {
  assert.equal(phaseBlockedReason("ongoing"), "EVENT IN PROGRESS");
  assert.equal(phaseBlockedReason("completed"), "EVENT COMPLETED");
  for (const p of ["upcoming", "cancelled", undefined] as const) assert.equal(phaseBlockedReason(p), null);
});

test("row badge precedence: join request, then phase label", () => {
  assert.deepEqual(eventRowBadge({ status: "active", eventPhase: "upcoming", joinRequest: { status: "pending" } }, true), { label: "REQUEST PENDING", tone: "neutral" });
  assert.deepEqual(eventRowBadge({ status: "active", eventPhase: "upcoming", joinRequest: { status: "rejected" } }, false), { label: "REQUEST REJECTED", tone: "danger" });
  assert.deepEqual(eventRowBadge({ status: "cancelled", eventPhase: "cancelled" }, false), { label: "CANCELLED", tone: "danger" });
  assert.deepEqual(eventRowBadge({ status: "closed", eventPhase: "ongoing" }, false), { label: "ONGOING", tone: "warning" });
  assert.deepEqual(eventRowBadge({ status: "completed", eventPhase: "completed" }, false), { label: "COMPLETED", tone: "neutral" });
});
test("row badge: JOINED only while upcoming; closed upcoming says REGISTRATION CLOSED", () => {
  assert.deepEqual(eventRowBadge({ status: "active", eventPhase: "upcoming" }, true), { label: "JOINED", tone: "brand" });
  assert.deepEqual(eventRowBadge({ status: "active", eventPhase: "upcoming" }, false), { label: "UPCOMING", tone: "brand" });
  assert.deepEqual(eventRowBadge({ status: "closed", eventPhase: "upcoming" }, false), { label: "REGISTRATION CLOSED", tone: "neutral" });
  assert.equal(eventRowBadge({ status: "closed", eventPhase: "ongoing" }, true).label, "ONGOING");
  assert.equal(eventRowBadge({ status: "completed", eventPhase: "completed" }, true).label, "COMPLETED");
});
test("row badge without a phase (older server) keeps the stored-status labels", () => {
  assert.deepEqual(eventRowBadge({ status: "active" }, true), { label: "JOINED", tone: "brand" });
  assert.deepEqual(eventRowBadge({ status: "active" }, false), { label: "Active", tone: "brand" });
  assert.deepEqual(eventRowBadge({ status: "closed" }, false), { label: "Closed", tone: "neutral" });
  assert.deepEqual(eventRowBadge({ status: "completed" }, false), { label: "Completed", tone: "neutral" });
  assert.deepEqual(eventRowBadge({ status: "cancelled" }, false), { label: "Cancelled", tone: "danger" });
});

test("details footer follows the phase even when registrationStatus is stale (cached payload crossed the start)", () => {
  for (const registrationStatus of ["OPEN", "FULL", "STARTED", "JOINED"]) {
    const stale = { isCreator: false, registrationStatus, joinRequest: null, blockedReason: "EVENT IN PROGRESS" };
    assert.equal(detailsFooterState({ ...stale, eventPhase: "ongoing" }), "blocked");
    assert.equal(detailsFooterState({ ...stale, currentUserJoined: true, eventPhase: "ongoing" }), "blocked");
    assert.equal(detailsFooterState({ ...stale, joinRequest: { status: "pending" }, eventPhase: "ongoing" }), "blocked");
  }
});
test("details footer: completed shows the joined record, everyone else is blocked, organizer unchanged", () => {
  const e = { isCreator: false, registrationStatus: "STARTED", joinRequest: null, blockedReason: "EVENT COMPLETED" };
  assert.equal(detailsFooterState({ ...e, currentUserJoined: true, eventPhase: "completed" }), "joined");
  assert.equal(detailsFooterState({ ...e, eventPhase: "completed" }), "blocked");
  for (const eventPhase of ["ongoing", "completed"] as const) assert.equal(detailsFooterState({ ...e, isCreator: true, eventPhase }), "organizer");
});
test("details footer: upcoming and missing phase keep the registration-driven states", () => {
  const e = { isCreator: false, registrationStatus: "FULL", joinRequest: null, blockedReason: null };
  for (const eventPhase of [undefined, "upcoming"] as const) {
    assert.equal(detailsFooterState({ ...e, eventPhase }), "event_full");
    assert.equal(detailsFooterState({ ...e, registrationStatus: "OPEN", eventPhase }), "join");
  }
});

test("one wording for the same state: the card CTA and the details lock text always agree", () => {
  for (const phase of ["ongoing", "completed"] as const) {
    const cta = eventCardCta({ registrationStatus: "OPEN", eventPhase: phase });
    assert.equal(cta.label, phaseBlockedReason(phase));
  }
});
