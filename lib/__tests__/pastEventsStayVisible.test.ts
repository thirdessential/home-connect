import assert from "node:assert/strict";
import { test } from "node:test";
import { dedupeFeeds } from "../feedCache";
import { effectivePhase, isHiddenFromHome, phaseUi } from "../eventPhase";
import { eventCardCta } from "../eventRegistration";

// The original requirement, end to end through the app's pure steps: every past event stays in the
// Home feed however old its post is, ongoing/completed ones render disabled, and nothing else changes.
const DAY = 86_400_000;
const NOW = Date.parse("2030-03-01T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();
const feed = (_id: string, type: string, postedDaysAgo: number, o: any = {}): any => ({
  _id,
  type,
  createdAt: iso(NOW - postedDaysAgo * DAY),
  ...o,
});

// What `GET /api/feed/getfeeds/:societyId` now returns, posted long ago.
const response = [
  feed("completed-stored", "event", 40, { eventPhase: "completed", eventStartsAt: iso(NOW - 39 * DAY), eventEndsAt: iso(NOW - 39 * DAY + 3_600_000), registrationClosesAt: iso(NOW - 40 * DAY) }),
  feed("completed-time-ended", "event", 10, { eventPhase: "completed", eventStartsAt: iso(NOW - 5 * DAY), eventEndsAt: iso(NOW - 5 * DAY + 3_600_000) }),
  feed("ongoing-multiday", "event", 6, { eventPhase: "ongoing", eventStartsAt: iso(NOW - DAY), eventEndsAt: iso(NOW + DAY) }),
  feed("ongoing-no-end", "event", 90, { eventPhase: "ongoing", eventStartsAt: iso(NOW - 80 * DAY), eventEndsAt: null }),
  feed("upcoming-open", "event", 3, { eventPhase: "upcoming", eventStartsAt: iso(NOW + 5 * DAY), registrationClosesAt: iso(NOW + 4 * DAY) }),
  feed("upcoming-cutoff-passed", "event", 1, { eventPhase: "upcoming", eventStartsAt: iso(NOW + DAY), registrationClosesAt: iso(NOW - 3_600_000) }),
  feed("cancelled", "event", 1, { eventPhase: "cancelled" }),
  feed("old-post", "post", 40),
  feed("old-poll", "poll", 30),
  feed("fresh-post", "post", 0.5),
];

// Same steps the Home feed takes: store prune, then useHomeFeed's visibility rule.
const home = (now = NOW) =>
  dedupeFeeds(response).filter(
    (f: any) => f.type !== "event" || !isHiddenFromHome({ eventPhase: effectivePhase(f.eventPhase, f.eventStartsAt, f.eventEndsAt, now), registrationClosesAt: f.registrationClosesAt, eventStartsAt: f.eventStartsAt }, now),
  );
const ids = (xs: any[]) => xs.map((x) => x._id);

test("all past and ongoing events stay on Home however old their post is; posts and polls too (no age rule); only the server/phase rules drop events", () => {
  assert.deepEqual(ids(home()), ["completed-stored", "completed-time-ended", "ongoing-multiday", "ongoing-no-end", "upcoming-open", "old-post", "old-poll", "fresh-post"]);
});

test("they are still there years later (no expiry for events)", () => {
  const later = NOW + 3 * 365 * DAY;
  const kept = ids(home(later));
  for (const id of ["completed-stored", "completed-time-ended", "ongoing-multiday", "ongoing-no-end"]) assert.ok(kept.includes(id), id);
  // an event shown as ongoing from a cache that is years old advances to completed, and stays visible
  const multi = home(later).find((f: any) => f._id === "ongoing-multiday");
  assert.equal(effectivePhase(multi.eventPhase, multi.eventStartsAt, multi.eventEndsAt, later), "completed");
  assert.equal(effectivePhase("ongoing", iso(NOW - 80 * DAY), null, later), "ongoing"); // no end: never completed by the client
});

test("ongoing and completed events render disabled and muted; upcoming stays interactive", () => {
  for (const f of home()) {
    if (f.type !== "event") continue;
    const phase = effectivePhase(f.eventPhase, f.eventStartsAt, f.eventEndsAt, NOW);
    const ui = phaseUi(phase);
    const cta = eventCardCta({ registrationStatus: "OPEN", eventPhase: phase });
    if (phase === "ongoing" || phase === "completed") {
      assert.deepEqual([ui?.muted, ui?.disabled, cta.disabled], [true, true, true], f._id);
    } else {
      assert.deepEqual([ui?.muted, ui?.disabled, cta.disabled], [false, false, false], f._id);
    }
  }
});

test("the viewer's own role does not re-enable an ended event (joined viewer and organizer)", () => {
  for (const phase of ["ongoing", "completed"] as const) {
    assert.equal(eventCardCta({ isJoined: true, registrationStatus: "JOINED", eventPhase: phase }).disabled, true);
    assert.equal(eventCardCta({ isOwner: true, registrationStatus: "OPEN", eventPhase: phase }).disabled, true);
  }
});
