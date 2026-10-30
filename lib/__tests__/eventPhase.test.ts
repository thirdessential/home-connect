import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePhase, hasEventStarted, isEventPhase, isHiddenFromHome, isPhaseInteractive, isUpcomingListItem, phaseUi } from "../eventPhase";

// 20:00–22:00 IST on 2030-01-10, as the server sends it (ISO UTC instants).
const START = "2030-01-10T14:30:00.000Z";
const END = "2030-01-10T16:30:00.000Z";
const at = (iso: string) => new Date(iso).getTime();

test("isEventPhase accepts only the four server values", () => {
  for (const p of ["upcoming", "ongoing", "completed", "cancelled"]) assert.equal(isEventPhase(p), true);
  for (const p of ["past", "STARTED", "", null, undefined, 3]) assert.equal(isEventPhase(p), false);
});

test("server upcoming stays upcoming before start", () => {
  assert.equal(effectivePhase("upcoming", START, END, at(START) - 1), "upcoming");
});
test("advances upcoming to ongoing at the start instant", () => {
  assert.equal(effectivePhase("upcoming", START, END, at(START)), "ongoing");
});
test("advances ongoing to completed at the end instant", () => {
  assert.equal(effectivePhase("ongoing", START, END, at(END) - 1), "ongoing");
  assert.equal(effectivePhase("ongoing", START, END, at(END)), "completed");
});
test("a cached upcoming event that is already over advances straight to completed", () => {
  assert.equal(effectivePhase("upcoming", START, END, at(END) + 60_000), "completed");
});
test("no end instant: the client never completes an event on its own", () => {
  assert.equal(effectivePhase("upcoming", START, null, at(START) + 10 * 86_400_000), "ongoing");
  assert.equal(effectivePhase("ongoing", START, undefined, at(END) + 86_400_000), "ongoing");
});
test("never regresses: completed stays completed with an earlier clock", () => {
  assert.equal(effectivePhase("completed", START, END, at(START) - 1), "completed");
});
test("never regresses: ongoing stays ongoing with an earlier clock", () => {
  assert.equal(effectivePhase("ongoing", START, END, at(START) - 10_000), "ongoing");
});
test("cancelled never changes, whatever the clock says", () => {
  for (const now of [at(START) - 1, at(START) + 1, at(END) + 1]) assert.equal(effectivePhase("cancelled", START, END, now), "cancelled");
});
test("a server-completed event stays completed even while the clock is inside its window (ended early by the organizer)", () => {
  for (const now of [at(START) - 1, at(START), at(START) + 60_000, at(END) - 1, at(END) + 1]) {
    assert.equal(effectivePhase("completed", START, END, now), "completed");
  }
  assert.equal(effectivePhase("completed", START, null, at(START) + 60_000), "completed");
});
test("malformed instants are ignored, the server phase is kept", () => {
  assert.equal(effectivePhase("upcoming", "not-a-date", "also-bad", Date.now()), "upcoming");
});
test("device timezone is irrelevant: the same instants written as Z or +05:30 give the same phases under any TZ", () => {
  // 20:00 and 22:00 IST, each written three ways. Every combination must classify identically everywhere.
  const starts = [START, "2030-01-10T20:00:00+05:30", "2030-01-10T20:00:00.000+05:30"];
  const ends = [END, "2030-01-10T22:00:00+05:30", "2030-01-10T22:00:00.000+05:30"];
  const prev = process.env.TZ;
  try {
    const localOffsets = new Set<number>();
    const results: string[] = [];
    for (const tz of ["UTC", "Asia/Kolkata", "America/Los_Angeles", "Pacific/Auckland"]) {
      process.env.TZ = tz;
      // Proof the switch took effect: the same wall-clock components map to a different UTC offset per zone.
      localOffsets.add(new Date(2030, 0, 10, 20, 0).getTimezoneOffset());
      for (const st of starts) {
        for (const en of ends) {
          results.push(
            [
              effectivePhase("upcoming", st, en, at(START) - 1),
              effectivePhase("upcoming", st, en, at(START)),
              effectivePhase("upcoming", st, en, at(END) - 1),
              effectivePhase("upcoming", st, en, at(END)),
            ].join(","),
          );
        }
      }
    }
    assert.equal(localOffsets.size, 4, "changing process.env.TZ must change the local offset, otherwise this test proves nothing");
    assert.deepEqual(new Set(results), new Set(["upcoming,ongoing,ongoing,completed"]));
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
});
test("older server (no eventPhase): undefined in, undefined out — nothing is muted", () => {
  assert.equal(effectivePhase(undefined, START, END, at(END) + 1), undefined);
  assert.equal(effectivePhase(null, START, END), undefined);
  assert.equal(effectivePhase("garbage", START, END), undefined);
  assert.equal(phaseUi(undefined), null);
  assert.equal(isPhaseInteractive(undefined), true);
});

test("phaseUi: label, tone, disabled and muted per phase", () => {
  assert.deepEqual(phaseUi("upcoming"), { label: "UPCOMING", tone: "brand", disabled: false, muted: false });
  assert.deepEqual(phaseUi("ongoing"), { label: "ONGOING", tone: "warning", disabled: true, muted: true });
  assert.deepEqual(phaseUi("completed"), { label: "COMPLETED", tone: "neutral", disabled: true, muted: true });
  assert.deepEqual(phaseUi("cancelled"), { label: "CANCELLED", tone: "danger", disabled: false, muted: false });
});

test("isPhaseInteractive: only upcoming (or unknown) allows participation actions", () => {
  assert.equal(isPhaseInteractive("upcoming"), true);
  for (const p of ["ongoing", "completed", "cancelled"] as const) assert.equal(isPhaseInteractive(p), false);
});

test("isHiddenFromHome keeps ongoing and completed events visible", () => {
  const closesAt = "2030-01-09T00:00:00.000Z"; // long past
  assert.equal(isHiddenFromHome({ eventPhase: "ongoing", registrationClosesAt: closesAt }, at(START) + 1), false);
  assert.equal(isHiddenFromHome({ eventPhase: "completed", registrationClosesAt: closesAt }, at(END) + 1), false);
});
test("isHiddenFromHome hides cancelled and upcoming events past their registration cutoff", () => {
  assert.equal(isHiddenFromHome({ eventPhase: "cancelled" }, at(START)), true);
  assert.equal(isHiddenFromHome({ eventPhase: "upcoming", registrationClosesAt: "2030-01-10T13:30:00.000Z" }, at(START) - 60_000), true);
  assert.equal(isHiddenFromHome({ eventPhase: "upcoming", registrationClosesAt: "2030-01-10T13:30:00.000Z" }, at(START) - 3_600_000 - 1), false);
  assert.equal(isHiddenFromHome({ eventPhase: "upcoming", registrationClosesAt: null }, at(START) - 1), false);
});
test("isHiddenFromHome falls back to the old rule for an older server", () => {
  assert.equal(isHiddenFromHome({ registrationClosesAt: null, eventStartsAt: START }, at(START) + 1), true);
  assert.equal(isHiddenFromHome({ registrationClosesAt: null, eventStartsAt: START }, at(START) - 1), false);
});

test("hasEventStarted: only ongoing and completed (cancelled and unknown keep today's behavior)", () => {
  assert.equal(hasEventStarted("ongoing"), true);
  assert.equal(hasEventStarted("completed"), true);
  for (const p of ["upcoming", "cancelled", undefined, null] as const) assert.equal(hasEventStarted(p), false);
});

test("isUpcomingListItem: only a not-yet-started event belongs under Upcoming", () => {
  const e = (eventPhase: any) => ({ eventPhase, eventStartsAt: START, eventEndsAt: END });
  assert.equal(isUpcomingListItem(e("upcoming"), at(START) - 1), true);
  assert.equal(isUpcomingListItem(e("ongoing"), at(START) + 1), false);
  assert.equal(isUpcomingListItem(e("completed"), at(END) + 1), false);
  assert.equal(isUpcomingListItem(e("cancelled"), at(START) - 1), false);
  // a cached "upcoming" row that has since started no longer belongs there
  assert.equal(isUpcomingListItem(e("upcoming"), at(START)), false);
  // older server (no phase): shown, exactly as before
  assert.equal(isUpcomingListItem({ eventStartsAt: START }, at(END) + 1), true);
});
