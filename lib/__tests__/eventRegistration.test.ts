import assert from "node:assert/strict";
import { test } from "node:test";
import { isEventFullError, registrationUi } from "../eventRegistration";

test("OPEN / unknown -> enabled join button", () => {
  assert.deepEqual(registrationUi("OPEN"), { label: "Join Event", disabled: false, icon: "arrow-forward" });
  assert.equal(registrationUi(undefined, "RSVP").label, "RSVP");
});
test("FULL -> SOLD OUT disabled; CLOSED, STARTED, CANCELLED disabled", () => {
  assert.deepEqual([registrationUi("FULL").label, registrationUi("FULL").disabled], ["SOLD OUT", true]);
  assert.equal(registrationUi("CLOSED").label, "REGISTRATION CLOSED");
  assert.equal(registrationUi("STARTED").label, "EVENT STARTED");
  for (const s of ["CLOSED", "STARTED", "CANCELLED"]) assert.equal(registrationUi(s).disabled, true);
});
test("JOINED shows Joined, never SOLD OUT", () => {
  assert.equal(registrationUi("JOINED").label, "Joined");
});
test("EVENT_FULL error detection reads the server errorCode", () => {
  assert.equal(isEventFullError({ status: 409, body: { errorCode: "EVENT_FULL" } }), true);
  assert.equal(isEventFullError({ status: 409, body: { errorCode: "EVENT_CLOSED" } }), false);
  assert.equal(isEventFullError(new Error("x")), false);
});
