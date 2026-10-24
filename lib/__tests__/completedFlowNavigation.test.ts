import assert from "node:assert/strict";
import { test } from "node:test";
import { interceptBackOnConfirmation, leaveCompletedFlow } from "../completedFlowNavigation";

test("leaveCompletedFlow pops to the destination instead of pushing/resetting", () => {
  const calls: any[] = [];
  leaveCompletedFlow({ dismissTo: (h) => calls.push(h) }, "/(tabs)/home");
  assert.deepEqual(calls, ["/(tabs)/home"]);
});

test("Back on confirmation is intercepted once, then allowed while leaving", () => {
  let prevented = 0;
  const ev = { preventDefault: () => prevented++ };
  const leaving = { current: false };
  assert.equal(interceptBackOnConfirmation(ev, leaving), true);
  assert.equal(prevented, 1);
  leaving.current = true;
  assert.equal(interceptBackOnConfirmation(ev, leaving), false);
  assert.equal(prevented, 1);
});
