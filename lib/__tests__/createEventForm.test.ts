import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_CLOSES_HOURS,
  DEFAULT_MAX_PARTICIPANTS,
  END_DAY_OPTIONS,
  END_HOUR_OPTIONS,
  MAX_EVENT_PARTICIPANTS,
  MIN_EVENT_PARTICIPANTS,
  buildCreateEventPayload,
  computeEnd,
  defaultSchedule,
  defaultStartParts,
  initialEventFormValues,
  stepMaxParticipants,
  stepMinParticipants,
  textAreaHeights,
  toLocalParts,
  validateEventForm,
  validateEventStep,
  visibleFieldErrors,
  type EventFormValues,
} from "../createEventForm";

// All dates are built from local components, so the suite is timezone-independent.
const at = (y: number, mo: number, d: number, h: number, mi: number, s = 0, ms = 0) =>
  new Date(y, mo - 1, d, h, mi, s, ms);
const minutesBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60000;
const partsToLocal = (p: { date: string; time: string }) => {
  const [y, mo, d] = p.date.split("-").map(Number);
  const [h, mi] = p.time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi);
};

// A fully valid form, 5 hours after NOW, used as the base for the validation tests.
const NOW = at(2026, 10, 24, 10, 0);
const valid = (over: Partial<EventFormValues> = {}): EventFormValues => ({
  ...initialEventFormValues(NOW),
  title: "Weekend Cricket",
  eventType: "Sports",
  description: "Friendly match for everyone",
  venue: "Central Ground",
  ...over,
});

// ---- 1. Description is a real multi-line field --------------------------------------------------

test("multi-line description keeps its line breaks in the payload (only outer whitespace is trimmed)", () => {
  const description = "  Line one\nLine two\n\nLine four  ";
  const payload = buildCreateEventPayload(valid({ description }));
  assert.equal(payload.description, "Line one\nLine two\n\nLine four");
});

test("a multi-line description within 300 chars validates; newlines count toward the limit", () => {
  assert.equal(validateEventStep(1, valid({ description: "a\nb\nc\nd\ne" }), NOW).description, undefined);
  assert.ok(validateEventStep(1, valid({ description: "a\n".repeat(151) }), NOW).description);
  assert.equal(validateEventStep(1, valid({ description: "x".repeat(300) }), NOW).description, undefined);
});

test("text area is a tall, bounded box that scrolls internally instead of looking like a one-line input", () => {
  const h = textAreaHeights(4, 22, 8);
  assert.equal(h.minHeight, 4 * 22 + 2 * 8);
  assert.ok(h.maxHeight > h.minHeight, "long text must scroll inside a capped box");
  assert.ok(textAreaHeights(1, 22, 8).minHeight < h.minHeight);
  assert.ok(textAreaHeights(0, 22, 8).minHeight >= 22 + 16, "never smaller than one line");
});

// ---- 2 & 3. Next Step marks every invalid field; fixing a field clears it -----------------------

test("step 1 flags every missing required field at once, not just the first", () => {
  const errs = validateEventStep(1, valid({ title: "", eventType: null, description: "" }), NOW);
  assert.deepEqual(Object.keys(errs).sort(), ["description", "eventType", "title"]);
  for (const msg of Object.values(errs)) assert.ok(msg && msg.length > 0);
});

test("step 2 flags venue and a bad schedule together", () => {
  const errs = validateEventStep(
    2,
    valid({ venue: "  ", startDate: "2026-10-24", startTime: "10:30", endDate: "2026-10-24", endTime: "10:30" }),
    NOW,
  );
  assert.ok(errs.venue, "venue");
  assert.ok(errs.startTime, "start inside the 2h lead window");
  assert.ok(errs.endTime, "end equal to start");
});

test("step 3 flags fee, participants and registration cutoff together", () => {
  const errs = validateEventStep(
    3,
    valid({ participationType: "paid", feeAmount: "", minParticipants: 1, maxParticipants: 25, closesHours: "3", startDate: "2026-10-24", startTime: "12:30" }),
    NOW,
  );
  assert.ok(errs.feeAmount, "fee");
  assert.ok(errs.maxParticipants, "max above 20");
  assert.ok(errs.minParticipants, "min below 2");
  assert.ok(errs.closesHours, "cutoff already passed");
});

test("a fully valid form has no errors on any step", () => {
  assert.deepEqual(validateEventForm(valid(), NOW), {});
});

test("publish-time validation also requires the confirmation checkbox", () => {
  assert.deepEqual(Object.keys(validateEventForm(valid({ agree: false }), NOW, { requireAgree: true })), ["agree"]);
  assert.deepEqual(validateEventForm(valid({ agree: true }), NOW, { requireAgree: true }), {});
});

test("only fields flagged by a failed Next stay red, and they clear the moment the value is corrected", () => {
  const bad = valid({ title: "", description: "" });
  const flagged = Object.keys(validateEventStep(1, bad, NOW)) as any[];
  assert.deepEqual(Object.keys(visibleFieldErrors(flagged, validateEventStep(1, bad, NOW))).sort(), ["description", "title"]);

  const fixedTitle = { ...bad, title: "Cricket" };
  assert.deepEqual(Object.keys(visibleFieldErrors(flagged, validateEventStep(1, fixedTitle, NOW))), ["description"]);

  const fixedBoth = { ...fixedTitle, description: "Some words here" };
  assert.deepEqual(visibleFieldErrors(flagged, validateEventStep(1, fixedBoth, NOW)), {});
});

test("fields never flagged are not shown as errors (no red before the user presses Next)", () => {
  const live = validateEventStep(1, valid({ title: "", description: "" }), NOW);
  assert.deepEqual(visibleFieldErrors([], live), {});
});

test("validation does not mutate or reset the entered values", () => {
  const v = valid({ title: "", description: "keep me" });
  const copy = JSON.stringify(v);
  validateEventForm(v, NOW, { requireAgree: true });
  assert.equal(JSON.stringify(v), copy);
});

// ---- 4-7. Default schedule ---------------------------------------------------------------------

test("start date defaults to today's local date", () => {
  const now = at(2026, 10, 24, 10, 0);
  assert.equal(defaultStartParts(now).date, "2026-10-24");
  assert.equal(initialEventFormValues(now).startDate, "2026-10-24");
});

test("start time defaults to 2h30 after the current time (not a fixed 2:30)", () => {
  assert.equal(defaultStartParts(at(2026, 10, 24, 10, 0)).time, "12:30");
  assert.equal(defaultStartParts(at(2026, 10, 24, 15, 40)).time, "18:10");
  assert.equal(defaultStartParts(at(2026, 10, 24, 3, 5)).time, "05:35");
});

test("start time is rounded UP to the next 5-minute mark", () => {
  assert.equal(defaultStartParts(at(2026, 10, 24, 10, 3)).time, "12:35");
  assert.equal(defaultStartParts(at(2026, 10, 24, 10, 0, 30)).time, "12:35");
  assert.equal(defaultStartParts(at(2026, 10, 24, 10, 0, 0, 1)).time, "12:35");
  assert.equal(defaultStartParts(at(2026, 10, 24, 10, 25)).time, "12:55");
});

test("default start is always in the future and clears the 2-hour lead rule, minute by minute for 2 days", () => {
  // Mid-July: no DST changeover in common timezones, so wall-clock arithmetic is unambiguous.
  const base = at(2026, 7, 10, 0, 0).getTime();
  for (let m = 0; m < 2 * 24 * 60; m++) {
    const now = new Date(base + m * 60000 + 13_000);
    const start = partsToLocal(defaultStartParts(now));
    const lead = minutesBetween(now, start);
    assert.ok(lead >= 150, `lead ${lead} < 150 at ${now.toString()}`);
    assert.ok(lead < 156, `lead ${lead} too large at ${now.toString()}`);
  }
});

test("a start that crosses midnight rolls to the next calendar date", () => {
  assert.deepEqual(defaultStartParts(at(2026, 10, 24, 22, 10)), { date: "2026-10-25", time: "00:40" });
  assert.deepEqual(defaultStartParts(at(2026, 10, 31, 21, 45)), { date: "2026-11-01", time: "00:15" });
  assert.deepEqual(defaultStartParts(at(2026, 12, 31, 23, 0)), { date: "2027-01-01", time: "01:30" });
});

test("end defaults to one calendar day after the start date and one hour after the start time", () => {
  const s = defaultSchedule(at(2026, 10, 24, 10, 0));
  assert.deepEqual(s, { startDate: "2026-10-24", startTime: "12:30", endDate: "2026-10-25", endTime: "13:30" });
});

test("default end date crosses month and year boundaries by calendar day; end time wraps past midnight", () => {
  // start 23:40 -> end time 00:40 (time of day wraps), end date is still start date + 1 day
  const a = defaultSchedule(at(2026, 10, 24, 21, 10));
  assert.deepEqual(a, { startDate: "2026-10-24", startTime: "23:40", endDate: "2026-10-25", endTime: "00:40" });
  // start Jan 1 00:00 -> end Jan 2 01:00
  const b = defaultSchedule(at(2026, 12, 31, 21, 30));
  assert.deepEqual(b, { startDate: "2027-01-01", startTime: "00:00", endDate: "2027-01-02", endTime: "01:00" });
  // month end
  assert.equal(defaultSchedule(at(2026, 10, 31, 10, 0)).endDate, "2026-11-01");
  // leap day
  assert.equal(computeEnd("2028-02-28", "10:00", 1, 1).endDate, "2028-02-29");
});

test("end dropdown options are the original ones: 1/2/3/7/14 days and 1/2/3/6/12 hours", () => {
  assert.deepEqual([...END_DAY_OPTIONS], [1, 2, 3, 7, 14]);
  assert.deepEqual([...END_HOUR_OPTIONS], [1, 2, 3, 6, 12]);
});

test("toLocalParts uses local fields, zero-padded, so dates never shift a day", () => {
  assert.deepEqual(toLocalParts(at(2026, 1, 5, 0, 5)), { date: "2026-01-05", time: "00:05" });
  assert.deepEqual(toLocalParts(at(2026, 12, 31, 23, 59)), { date: "2026-12-31", time: "23:59" });
});

test("the default schedule passes the form's own validation", () => {
  for (const hour of [0, 6, 12, 18, 21, 23]) {
    const now = at(2026, 10, 24, hour, 17);
    const v = valid(defaultSchedule(now));
    assert.deepEqual(validateEventStep(2, v, now), {}, `hour ${hour}`);
    assert.deepEqual(validateEventStep(3, v, now), {}, `hour ${hour} (registration cutoff)`);
  }
});

// ---- End date/time follows the start until the user customises it ------------------------------

test("end follows the start: changing the start date/time moves the default end (1 day / 1 hour)", () => {
  assert.deepEqual(computeEnd("2026-10-24", "15:00", 1, 1), { endDate: "2026-10-25", endTime: "16:00" });
  assert.deepEqual(computeEnd("2026-10-27", "15:00", 1, 1), { endDate: "2026-10-28", endTime: "16:00" });
  assert.deepEqual(computeEnd("2026-10-24", "23:30", 1, 1), { endDate: "2026-10-25", endTime: "00:30" });
});

test("end date and end time are independent: each dropdown only changes its own part", () => {
  assert.deepEqual(computeEnd("2026-10-24", "15:00", 3, 1), { endDate: "2026-10-27", endTime: "16:00" });
  assert.deepEqual(computeEnd("2026-10-24", "15:00", 1, 6), { endDate: "2026-10-25", endTime: "21:00" });
  assert.deepEqual(computeEnd("2026-10-24", "15:00", 14, 12), { endDate: "2026-11-07", endTime: "03:00" });
});

test("a customised end (days/hours after start) is kept when the start moves", () => {
  const custom = { days: 7, hours: 3 };
  const before = computeEnd("2026-10-24", "15:00", custom.days, custom.hours);
  const after = computeEnd("2026-10-26", "09:00", custom.days, custom.hours);
  assert.deepEqual(before, { endDate: "2026-10-31", endTime: "18:00" });
  assert.deepEqual(after, { endDate: "2026-11-02", endTime: "12:00" });
});

test("computeEnd always lands after the start, so the default end passes validation", () => {
  for (const hours of END_HOUR_OPTIONS) {
    for (const days of END_DAY_OPTIONS) {
      for (const startTime of ["00:00", "09:15", "12:00", "23:55"]) {
        const end = computeEnd("2026-10-24", startTime, days, hours);
        const v = valid({ startDate: "2026-10-24", startTime, endDate: end.endDate, endTime: end.endTime });
        assert.equal(validateEventStep(2, v, NOW).endDate, undefined, `${days}d ${hours}h @${startTime}`);
        assert.equal(validateEventStep(2, v, NOW).endTime, undefined, `${days}d ${hours}h @${startTime}`);
      }
    }
  }
});

test("end must be strictly after start; equal or earlier is rejected on the right field", () => {
  const base = { startDate: "2026-10-24", startTime: "13:00" };
  assert.ok(validateEventStep(2, valid({ ...base, endDate: "2026-10-24", endTime: "13:00" }), NOW).endTime, "equal");
  assert.ok(validateEventStep(2, valid({ ...base, endDate: "2026-10-24", endTime: "12:00" }), NOW).endTime, "earlier same day");
  assert.ok(validateEventStep(2, valid({ ...base, endDate: "2026-10-23", endTime: "18:00" }), NOW).endDate, "earlier date");
  assert.deepEqual(validateEventStep(2, valid({ ...base, endDate: "2026-10-24", endTime: "13:01" }), NOW), {});
  assert.deepEqual(validateEventStep(2, valid({ ...base, endDate: "2026-10-25", endTime: "00:30" }), NOW), {}, "next-day end is fine");
});

test("start earlier than 2 hours from now, or in the past, is rejected", () => {
  assert.ok(validateEventStep(2, valid({ startDate: "2026-10-24", startTime: "11:59", endDate: "2026-10-24", endTime: "15:00" }), NOW).startTime);
  assert.equal(validateEventStep(2, valid({ startDate: "2026-10-24", startTime: "12:00", endDate: "2026-10-24", endTime: "15:00" }), NOW).startTime, undefined);
  assert.ok(validateEventStep(2, valid({ startDate: "2026-10-23", startTime: "20:00", endDate: "2026-10-24", endTime: "15:00" }), NOW).startDate);
});

// ---- 8 & 9. Participants -----------------------------------------------------------------------

test("participants: allowed range is 2..20, and the form defaults to min 2 / max 5 (not 2)", () => {
  assert.equal(MIN_EVENT_PARTICIPANTS, 2);
  assert.equal(MAX_EVENT_PARTICIPANTS, 20);
  assert.equal(DEFAULT_MAX_PARTICIPANTS, 5);
  const v = initialEventFormValues(NOW);
  assert.equal(v.maxParticipants, 5);
  assert.equal(v.minParticipants, 2);
});

test("maximum participants accepts 2 through 20 and rejects everything else", () => {
  for (const max of [2, 5, 10, 19, 20]) {
    assert.equal(validateEventStep(3, valid({ minParticipants: 2, maxParticipants: max }), NOW).maxParticipants, undefined, `max ${max}`);
  }
  assert.match(validateEventStep(3, valid({ maxParticipants: 21 }), NOW).maxParticipants ?? "", /2.*20|20/);
  assert.ok(validateEventStep(3, valid({ maxParticipants: 100 }), NOW).maxParticipants);
  assert.ok(validateEventStep(3, valid({ minParticipants: 2, maxParticipants: 1 }), NOW).maxParticipants, "below 2");
  assert.ok(validateEventStep(3, valid({ maxParticipants: 0 }), NOW).maxParticipants);
  assert.ok(validateEventStep(3, valid({ maxParticipants: 5.5 }), NOW).maxParticipants);
  assert.ok(validateEventStep(3, valid({ maxParticipants: Number.NaN }), NOW).maxParticipants);
});

test("minimum participants must be at least 2 and cannot exceed maximum", () => {
  assert.ok(validateEventStep(3, valid({ minParticipants: 1 }), NOW).minParticipants, "below 2");
  assert.ok(validateEventStep(3, valid({ minParticipants: 0 }), NOW).minParticipants);
  const errs = validateEventStep(3, valid({ minParticipants: 8, maxParticipants: 5 }), NOW);
  assert.ok(errs.minParticipants, "min > max");
  assert.ok(errs.maxParticipants, "max < min");
  assert.deepEqual(validateEventStep(3, valid({ minParticipants: 5, maxParticipants: 5 }), NOW), {});
  assert.deepEqual(validateEventStep(3, valid({ minParticipants: 2, maxParticipants: 20 }), NOW), {});
});

test("steppers keep max in min..20 and min in 2..max", () => {
  assert.equal(stepMaxParticipants(5, 2, +1), 6);
  assert.equal(stepMaxParticipants(20, 2, +1), 20, "max can't go above 20");
  assert.equal(stepMaxParticipants(5, 2, -1), 4);
  assert.equal(stepMaxParticipants(3, 3, -1), 3, "max can't go below min");
  assert.equal(stepMaxParticipants(2, 2, -1), 2, "max can't go below 2");
  assert.equal(stepMinParticipants(2, 5, -1), 2, "min can't go below 2");
  assert.equal(stepMinParticipants(2, 5, +1), 3);
  assert.equal(stepMinParticipants(5, 5, +1), 5, "min can't pass max");
  assert.equal(stepMinParticipants(2, 2, +1), 2, "min can't pass a max of 2");
});

test("steppers recover from a half-typed (empty / out-of-range) maximum instead of producing NaN or <2", () => {
  assert.equal(stepMaxParticipants(Number.NaN, 2, +1), 3);
  assert.equal(stepMaxParticipants(Number.NaN, 2, -1), 2);
  assert.equal(stepMinParticipants(2, Number.NaN, +1), 3);
  assert.equal(stepMinParticipants(3, 1, -1), 2, "max typed as 1: min still never drops below 2");
  assert.equal(stepMinParticipants(2, 1, +1), 2);
  assert.equal(stepMaxParticipants(30, 2, -1), 20, "typed 30 steps back into range");
});

test("typed maximum is validated: empty and out-of-range values flag the field, in-range clears it", () => {
  const flagged = (max: number) => validateEventStep(3, valid({ minParticipants: 2, maxParticipants: max }), NOW).maxParticipants;
  assert.ok(flagged(Number.NaN), "empty");
  assert.ok(flagged(1), "1");
  assert.ok(flagged(21), "21");
  assert.ok(flagged(150), "150");
  for (const ok of [2, 15, 20]) assert.equal(flagged(ok), undefined, String(ok));
  // flagged by Next, then corrected -> disappears
  const bad = valid({ maxParticipants: 25 });
  const keys = Object.keys(validateEventStep(3, bad, NOW)) as any[];
  assert.ok(visibleFieldErrors(keys, validateEventStep(3, bad, NOW)).maxParticipants);
  assert.equal(visibleFieldErrors(keys, validateEventStep(3, { ...bad, maxParticipants: 20 }, NOW)).maxParticipants, undefined);
});

// ---- 10. Registration closes -------------------------------------------------------------------

test("Registration Closes defaults to 'At event start' (existing value '0') and is sent as 0 hours", () => {
  assert.equal(DEFAULT_CLOSES_HOURS, "0");
  assert.equal(initialEventFormValues(NOW).closesHours, "0");
  assert.equal(buildCreateEventPayload(valid()).registrationclosesbefore, 0);
});

test("a user-chosen closing option is respected, and an already-passed cutoff is rejected", () => {
  assert.equal(buildCreateEventPayload(valid({ closesHours: "6" })).registrationclosesbefore, 6);
  const near = valid({ startDate: "2026-10-24", startTime: "12:30", endDate: "2026-10-24", endTime: "13:30", closesHours: "3" });
  assert.ok(validateEventStep(3, near, NOW).closesHours);
  assert.equal(validateEventStep(3, { ...near, closesHours: "0" }, NOW).closesHours, undefined);
});

// ---- 11 & 12. Values survive; the API payload is exactly what the backend reads ----------------

test("validation and step changes leave user-edited values untouched", () => {
  const edited = valid({ title: "My title", venue: "Terrace", endDate: "2026-10-27", endTime: "20:00", minParticipants: 3, maxParticipants: 8, closesHours: "12" });
  validateEventStep(1, edited, NOW);
  validateEventStep(2, edited, NOW);
  validateEventStep(3, edited, NOW);
  const payload = buildCreateEventPayload(edited);
  assert.equal(payload.eventtitle, "My title");
  assert.equal(payload.venue, "Terrace");
  assert.equal(payload.enddate, "2026-10-27");
  assert.equal(payload.endtime, "20:00");
  assert.equal(payload.minimumparticipants, 3);
  assert.equal(payload.maximumparticipants, 8);
  assert.equal(payload.registrationclosesbefore, 12);
});

test("create-event payload matches the backend field names, formats and types", () => {
  const payload = buildCreateEventPayload(valid({ rules: "  Bring water  " }));
  assert.deepEqual(payload, {
    eventtitle: "Weekend Cricket",
    eventtype: "Sports",
    description: "Friendly match for everyone",
    startdate: "2026-10-24",
    starttime: "12:30",
    enddate: "2026-10-25",
    endtime: "13:30",
    venue: "Central Ground",
    participationtype: "free",
    minimumparticipants: 2,
    maximumparticipants: 5,
    registrationclosesbefore: 0,
    rulesthingstobring: "Bring water",
  });
  assert.match(payload.startdate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(payload.starttime!, /^\d{2}:\d{2}$/);
});

test("paid events send a numeric fee; free events never carry one; empty rules are omitted", () => {
  const paid = buildCreateEventPayload(valid({ participationType: "paid", feeAmount: "150" }));
  assert.equal(paid.participationfeeamount, 150);
  const free = buildCreateEventPayload(valid({ participationType: "free", feeAmount: "150" }));
  assert.equal("participationfeeamount" in free, false);
  assert.equal("rulesthingstobring" in free, false);
});
