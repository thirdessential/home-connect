import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DELAY_OPTIONS,
  isValidDelay,
  lifecycleErrorMessage,
  normalizeReminders,
  organizerActions,
  remindersEqual,
  removeParticipantErrorMessage,
  validateEventReport,
  cancelErrorMessage,
  isOrganizerJoinError,
  leaveErrorMessage,
  validateCancelDetails,
} from "../eventLifecycle";

test("cancel details are trimmed and accepted", () => {
  const r = validateCancelDetails("  Rain  ", " Heavy rain forecast ");
  assert.deepEqual([r.valid, r.title, r.reason], [true, "Rain", "Heavy rain forecast"]);
});
test("empty and whitespace-only cancel details are rejected", () => {
  const r = validateCancelDetails("   ", "");
  assert.equal(r.valid, false);
  assert.ok(r.errors.title && r.errors.reason);
});
test("length limits: 70 ok / 71 rejected, 300 ok / 301 rejected", () => {
  assert.equal(validateCancelDetails("a".repeat(70), "b".repeat(300)).valid, true);
  assert.ok(validateCancelDetails("a".repeat(71), "b").errors.title);
  assert.ok(validateCancelDetails("a", "b".repeat(301)).errors.reason);
});
test("limits count code points like the server", () => {
  assert.equal(validateCancelDetails("😀".repeat(70), "x").valid, true);
});
test("cancel error mapping uses server errorCode/status", () => {
  const e400 = { status: 400, body: { errorCode: "CANCEL_DETAILS_INVALID", message: "title is required" } };
  assert.equal(cancelErrorMessage(e400), "title is required");
  assert.match(cancelErrorMessage({ status: 409, body: { errorCode: "EVENT_COMPLETED" } }), /completed/);
  assert.match(cancelErrorMessage({ status: 403, body: {} }), /organizer/);
  assert.match(cancelErrorMessage({ status: 404, body: {} }), /no longer exists/);
  assert.match(cancelErrorMessage(new Error("Network request failed")), /connection/);
  assert.match(cancelErrorMessage({ status: 500, body: {} }), /our side/);
});
test("leave error mapping and organizer join detection", () => {
  assert.match(leaveErrorMessage({ status: 404 }), /no longer registered/);
  assert.match(leaveErrorMessage(new Error("x")), /connection/);
  assert.equal(isOrganizerJoinError({ status: 409, body: { errorCode: "EVENT_ORGANIZER" } }), true);
  assert.equal(isOrganizerJoinError({ status: 409, body: { errorCode: "EVENT_FULL" } }), false);
});

test("delay accepts only 10/30/60", () => {
  assert.deepEqual([...DELAY_OPTIONS], [10, 30, 60]);
  assert.equal(isValidDelay(30), true);
  assert.equal(isValidDelay(15), false);
  assert.equal(isValidDelay("30"), false);
  assert.equal(isValidDelay(null), false);
});
test("reminders: unsupported dropped, duplicates collapsed, sorted", () => {
  assert.deepEqual(normalizeReminders([10, 10, "5", 7, 60, 30]), [30, 10, 5]);
  assert.equal(remindersEqual([10, 30], [30, 10, 10]), true);
  assert.equal(remindersEqual([], [5]), false);
});
test("event report validation mirrors server limits", () => {
  assert.equal(validateEventReport("  ", "x").valid, false);
  assert.equal(validateEventReport("a".repeat(70), "b".repeat(300)).valid, true);
  assert.ok(validateEventReport("a".repeat(71), "b").errors.title);
  assert.ok(validateEventReport("a", "b".repeat(301)).errors.description);
});
test("lifecycle error codes map to distinct messages", () => {
  const m = (errorCode: string, status = 409) => lifecycleErrorMessage({ status, body: { errorCode } }, "complete");
  assert.match(m("EVENT_NOT_STARTED"), /hasn't started/);
  assert.match(m("EVENT_STARTED"), /already started/);
  assert.match(m("EVENT_CANCELLED"), /cancelled/);
  assert.match(m("EVENT_COMPLETED"), /completed/);
  assert.match(lifecycleErrorMessage({ status: 429 }, "delay"), /Too many/);
  assert.match(lifecycleErrorMessage({ status: 403 }, "close"), /organizer/);
  assert.match(lifecycleErrorMessage({ status: 400, body: { error: "minutes must be one of: 10, 30, 60" } }, "delay"), /minutes must/);
  assert.match(lifecycleErrorMessage(new Error("x"), "close"), /connection/);
});
test("participant removal errors and organizer action availability", () => {
  assert.match(removeParticipantErrorMessage({ status: 403 }), /organizer/);
  assert.match(removeParticipantErrorMessage({ status: 404 }), /no longer registered/);
  assert.deepEqual(organizerActions("active"), { canClose: true, canComplete: true, canDelay: true, canEditReminders: true, canCancel: true });
  assert.equal(organizerActions("closed").canClose, false);
  assert.equal(organizerActions("closed").canDelay, true);
  for (const st of ["cancelled", "completed"]) assert.ok(Object.values(organizerActions(st)).every((v) => !v));
});
test("404 without a server error body is a missing route, not a deleted event", () => {
  assert.match(lifecycleErrorMessage({ status: 404, body: {} }, "report"), /isn't available/);
  assert.match(lifecycleErrorMessage({ status: 404, body: { error: "Event not found" } }, "report"), /no longer exists/);
  assert.match(lifecycleErrorMessage({ status: 404, body: { errorCode: "EVENT_NOT_FOUND" } }, "delay"), /no longer exists/);
});

import { organizerEventActions } from "../eventLifecycle";

const future = new Date(Date.now() + 3600_000).toISOString();
test("organizer Start/Reminder availability follows server state", () => {
  const ok = organizerEventActions({ status: "active", eventStartAt: future, joined: 3, min: 2 });
  assert.deepEqual([ok.showReminder, ok.canSendReminder, ok.showStart, ok.canStart, ok.startHint], [true, true, true, true, null]);
  const short = organizerEventActions({ status: "active", eventStartAt: future, joined: 1, min: 3 });
  assert.equal(short.canStart, false);
  assert.equal(short.startHint, "2 more participants needed to start");
  assert.equal(short.canSendReminder, true);
  assert.equal(organizerEventActions({ status: "active", eventStartAt: future, joined: 0, min: 1 }).canSendReminder, false);
});
test("no Start/Reminder once started, cancelled or completed", () => {
  const past = new Date(Date.now() - 1000).toISOString();
  for (const e of [
    { status: "active", eventStartAt: past },
    { status: "cancelled", eventStartAt: future },
    { status: "completed", eventStartAt: future },
    { status: "active", eventStartAt: null },
  ]) {
    const a = organizerEventActions({ ...e, joined: 5, min: 1 });
    assert.deepEqual([a.showReminder, a.showStart], [false, false]);
  }
});

test("End Event only after start and before completion/cancel; Start hides once started", () => {
  const up = organizerEventActions({ status: "active", eventStartAt: future, hasStarted: false, joined: 2, min: 1 });
  assert.deepEqual([up.showStart, up.showEnd], [true, false]);
  const live = organizerEventActions({ status: "active", eventStartAt: future, hasStarted: true, joined: 2, min: 1 });
  assert.deepEqual([live.showStart, live.showReminder, live.showEnd], [false, false, true]);
  assert.equal(organizerEventActions({ status: "closed", hasStarted: true, eventStartAt: future, joined: 2, min: 1 }).showEnd, true);
  for (const status of ["completed", "cancelled"]) {
    assert.equal(organizerEventActions({ status, hasStarted: true, eventStartAt: future, joined: 2, min: 1 }).showEnd, false);
  }
});
test("server hasStarted wins over a skewed client clock", () => {
  const a = organizerEventActions({ status: "active", eventStartAt: future, hasStarted: true, joined: 1, min: 1 });
  assert.equal(a.showStart, false);
});
