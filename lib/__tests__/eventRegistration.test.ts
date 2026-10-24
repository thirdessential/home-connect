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
