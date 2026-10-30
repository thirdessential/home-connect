import assert from "node:assert/strict";
import { test } from "node:test";
import { canDeleteFeedItem, getFeedMenuOptions } from "../feedMenu";

const keys = (o: ReturnType<typeof getFeedMenuOptions>) => o.map((x) => x.key);

test("admin sees Delete on another user's post, poll and upcoming/ongoing/completed event", () => {
  for (const kind of ["post", "poll"] as const)
    assert.deepEqual(keys(getFeedMenuOptions({ kind, isOwner: false }, true)), ["report-post", "report-user", "delete"]);
  for (const eventPhase of ["upcoming", "ongoing", "completed"])
    assert.equal(canDeleteFeedItem({ kind: "event", isOwner: false, eventPhase }, true), true);
});

test("admin sees Delete on their own post and poll", () => {
  for (const kind of ["post", "poll"] as const) assert.equal(canDeleteFeedItem({ kind, isOwner: true }, true), true);
});

test("Delete label names the content type", () => {
  const label = (kind: "post" | "poll" | "event") => getFeedMenuOptions({ kind, eventPhase: "upcoming" }, true).at(-1)?.label;
  assert.equal(label("post"), "Delete Post");
  assert.equal(label("poll"), "Delete Poll");
  assert.equal(label("event"), "Delete Event");
});

test("owner (non-admin) keeps Delete on own post/poll; nobody else non-admin gets it", () => {
  assert.equal(canDeleteFeedItem({ kind: "post", isOwner: true }, false), true);
  assert.equal(canDeleteFeedItem({ kind: "poll", isOwner: true }, false), true);
  assert.equal(canDeleteFeedItem({ kind: "post", isOwner: false }, false), false);
  assert.equal(canDeleteFeedItem({ kind: "poll" }, false), false);
});

test("non-admin never gets event Delete, even as the organizer (existing manage flow applies)", () => {
  assert.equal(canDeleteFeedItem({ kind: "event", isOwner: true, eventPhase: "upcoming" }, false), false);
});

test("cancelled event has no Delete for admins", () => {
  assert.equal(canDeleteFeedItem({ kind: "event", eventPhase: "cancelled" }, true), false);
});

test("Hide from feed is never offered", () => {
  for (const isAdmin of [true, false])
    for (const kind of ["post", "poll", "event"] as const)
      assert.ok(!getFeedMenuOptions({ kind, isOwner: true, eventPhase: "upcoming" }, isAdmin).some((o) => /hide/i.test(o.key + o.label)));
  assert.deepEqual(keys(getFeedMenuOptions(null, true)), ["report-post", "report-user"]);
});
