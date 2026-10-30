# Event Phases (upcoming / ongoing / completed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (chosen: native, one session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep ongoing and completed events visible in the feed and in profiles, but disabled with a status label, and make the server enforce the same rules.

**Architecture:** The server derives one additive field, `eventPhase`, from existing MySQL date/time columns (IST-pinned) and returns it on feed items and event payloads. The feed query stops excluding started events. A few unguarded mutations get phase checks. The app maps `eventPhase` through one pure helper (`lib/eventPhase.ts`) into labels, muted styling and disabled CTAs.

**Tech Stack:** Server: Node 20, Express 5, mysql2, `node:test` (`.mjs`). App: Expo/React Native, TypeScript, `node -r sucrase/register --test lib/__tests__/*.test.ts`.

**Spec:** `docs/superpowers/specs/2026-10-25-event-phase-disabled-states-design.md` (approved with defaults D1–D6).

**Repos:** app = `/Users/apple/Desktop/desktop/ganesh/office-wrok/github/new/home-connect`; server = `/Users/apple/Desktop/desktop/ganesh/office-wrok/github/new/home-connect-server` (explicitly authorized).

## Global Constraints

- MySQL is the only source of truth. No MongoDB, no Cloudinary, no new tables, columns, endpoints or dependencies.
- IST handling: all instants are `+05:30`-pinned via `eventStartAt`; `now` is server time and injectable.
- Boundaries: `now >= start` → ongoing; `now >= end` → completed (explicit end only: `end_time` present, end ≥ start).
- `eventPhase` is additive. `status`, `registrationStatus`, `canJoin` and existing error codes (`EVENT_STARTED`, `EVENT_CLOSED`, `EVENT_COMPLETED`) are unchanged.
- Authorization (403/404) always runs before any phase check.
- Server tests run **only** against a disposable local MySQL on `127.0.0.1:33999`, `DB_NAME=hc_test`. The server `.env` points at a remote DB and must never be used by tests.
- No commits (the app tree has unrelated uncommitted edits and none were requested). Do not touch those files.
- Untouched on purpose: admin `PHASE_SQL`, event editing, other users' joined lists, feed pagination.

## Review Focus

1. Event with `end_date` but no `end_time` → `ongoing`, never instantly `completed` (D1). Pinned in Task 1.
2. Invalid end (end before start) is ignored, not read as "already ended". Pinned in Task 1.
3. A joined viewer's ongoing event card is disabled (today it shows an enabled "Joined"). Pinned in Task 5.
4. An organizer's own ongoing event card is disabled but they can still reach the dashboard to End Event. Pinned in Tasks 5 and 7.
5. New app against an older server (no `eventPhase`) stays interactive and never mutes; the server still enforces. Pinned in Task 4.

---

## Task 0: Disposable local MySQL

**Files:** none in repos. Data dir lives in the scratchpad.

**Interfaces:** Produces env for later tasks: `DB_HOST=127.0.0.1 DB_PORT=33999 DB_USER=root DB_PASSWORD= DB_NAME=hc_test JWT_SECRET=test`.

- [ ] **Step 1:** Initialize and start `mysqld` (Homebrew 9.6) with `--initialize-insecure` into `<scratchpad>/mysql-data`, listening on `127.0.0.1:33999`, in the background.
- [ ] **Step 2:** Create database `hc_test`. Verify with `mysql -h127.0.0.1 -P33999 -uroot -e "select 1"`. Expected: returns `1`.
- [ ] **Step 3:** Run `tests/eventRegistration.unit.mjs` with the env above. Expected: 11 pass.

## Task 1: Server phase function

**Files:** Modify `src/services/event.service.js`, `src/services/eventLifecycle.service.js:71` (`completionEndAt`). Create `tests/eventPhase.unit.mjs`.

**Interfaces:**
- Produces in `event.service.js`: `explicitEventEndAt(row): Date | null` (body moved verbatim from `completionEndAt`); `EVENT_PHASE = { UPCOMING, ONGOING, COMPLETED, CANCELLED }` (values lowercase strings); `getEventPhase(row, { now = Date.now() } = {}): "upcoming" | "ongoing" | "completed" | "cancelled"`.
- `eventLifecycle.service.js` keeps its exported `completionEndAt`, now `export const completionEndAt = explicitEventEndAt` imported from `event.service.js`.

- [ ] **Step 1: Write failing tests** in `tests/eventPhase.unit.mjs` (same header/style as `eventRegistration.unit.mjs`). Fixture: start `2030-01-10 20:00` IST, end `2030-01-10 22:00`. Tests: `upcoming one ms before start`, `ongoing exactly at start`, `ongoing one ms before end`, `completed exactly at end`, `stored completed wins even if start is in the future`, `stored cancelled wins over time`, `no end_time stays ongoing long after start (D1)`, `end_date without end_time stays ongoing`, `end before start is ignored: ongoing after start, not completed`, `end_date defaults to start date`, `multi-day end_date`, `same phase under TZ=UTC / Asia/Kolkata / America/Los_Angeles` (spawn `process.execPath` with `TZ` set, compare outputs), `completionEndAt equals explicitEventEndAt on every fixture`.
- [ ] **Step 2:** Run `node --import ./tests/helpers/shimPreload.mjs --test tests/eventPhase.unit.mjs` with the Task 0 env. Expected: FAIL (`getEventPhase` is not exported).
- [ ] **Step 3:** Implement the three exports. Start via `eventStartAt`; `getEventPhase` follows the order in spec §3.1. Make `completionEndAt` delegate.
- [ ] **Step 4:** Re-run this file plus `eventRegistration.unit.mjs`. Expected: all pass.

## Task 2: Server read paths (feed query, serializers, phase filter)

**Files:** Modify `src/services/feed.service.js` (`eventTiming`, `listFeedsBySociety`), `src/controllers/event.controller.js` (`serializeEvent`, `respondWithEventPage`). Create `tests/eventPhase.e2e.mjs` (reuse the guards, `mk`, `call`, fixture cleanup and mocked push transports from `tests/eventLifecycle.e2e.mjs`).

**Interfaces:**
- Consumes: `getEventPhase`, `explicitEventEndAt` (Task 1).
- Produces: feed event items gain `eventPhase` and `eventEndsAt` (ISO | null). `serializeEvent` gains `eventPhase`, `eventStartsAt` (ISO | null), `eventEndsAt`. `GET /api/events/my-events` and `joined-events` accept `?phase=upcoming|ongoing|completed|cancelled`; any other value → 400 `{ errorCode: "INVALID_PHASE" }`; `status` and `phase` both apply when given.

- [ ] **Step 1: Write failing e2e tests** (insert events directly in SQL like the existing suite, with IST wall-clock times relative to now): `feed includes an open upcoming event with eventPhase=upcoming`, `feed includes an ongoing event (status active, started, end in future)`, `feed includes a time-ended event still stored active as completed`, `feed includes a stored-completed event`, `feed still excludes cancelled`, `feed still excludes an upcoming event past its registration cutoff`, `feed still excludes a stored-closed upcoming event`, `feed items carry registrationClosesAt and eventStartsAt unchanged`, `my-events?phase=ongoing returns only ongoing`, `joined-events?phase=completed returns only completed`, `phase=bogus is 400 INVALID_PHASE`, `status filter alone behaves as before`, `GET /api/feed/user/:id event items carry eventPhase`.
- [ ] **Step 2:** Run `tests/eventPhase.e2e.mjs` with the Task 0 env. Expected: FAIL on the new assertions.
- [ ] **Step 3:** Implement. In `listFeedsBySociety` replace the event condition with the SQL in spec §3.2 (reuse the existing `IST_NOW` expression and `START` expression). `eventTiming` adds `eventPhase: getEventPhase(ev)` and `eventEndsAt: explicitEventEndAt(ev)?.toISOString() ?? null`. `serializeEvent` adds the three fields. `respondWithEventPage` validates `phase` and filters on `getEventPhase` of the raw row (not the derived `status`).
- [ ] **Step 4:** Re-run the e2e file. Expected: all pass.

## Task 3: Server enforcement

**Files:** Modify `src/controllers/event.controller.js` (`cancelParticipantController`), `src/services/eventLifecycle.service.js` (`transitionEvent` close and cancel branches), `src/controllers/feed.controller.js` (`addOrUpdateRSVP`, `removeRSVP`). Extend `tests/eventPhase.e2e.mjs`.

**Interfaces:** Consumes `getEventPhase`, existing `lifecycleFail(res, "STARTED" | "COMPLETED")` (409 with `errorCode` `EVENT_STARTED` / `EVENT_COMPLETED`). Produces matrix rows from spec §3.3 marked "Behavior change".

- [ ] **Step 1: Write failing e2e tests:** `join ongoing → 409 EVENT_STARTED`, `join stored-completed → 409 EVENT_CLOSED`, `join time-ended active → 409 EVENT_STARTED`, `join-request on ongoing → rejected`, `self-leave ongoing → 409 EVENT_STARTED`, `self-leave completed → 409 EVENT_COMPLETED`, `self-leave upcoming still 200`, `organizer removes participant while ongoing → 200`, `organizer removes participant when completed → 409 EVENT_COMPLETED`, `non-organizer removing someone else → 403 even when completed (authorization first)`, `close registration on ongoing → 409 EVENT_STARTED`, `close on upcoming still 200`, `cancel while ongoing still 200`, `cancel when phase completed (time-ended, stored active) → 409 EVENT_COMPLETED`, `complete on ongoing still 200`, `delay/reminders/start on ongoing → 409 EVENT_STARTED` (already enforced, pinned), `legacy POST /api/feed/rsvp on an ongoing event feed item → 409`, `legacy DELETE rsvp on completed → 409`, `legacy rsvp on a feed item with no mysql_event_id unchanged`, `capacity: join full event still 409 EVENT_FULL`, `join duplicate still 409 EVENT_DUPLICATE`.
- [ ] **Step 2:** Run the e2e file. Expected: FAIL on the behavior-change tests only.
- [ ] **Step 3:** Implement. Self-leave: after participant lookup, phase ongoing → `STARTED`, completed → `COMPLETED`; removing someone else: completed → `COMPLETED`. `transitionEvent` close: reject `STARTED` when `now >= eventStartAt`; cancel (non-auto): reject `COMPLETED` when `getEventPhase(event) === "completed"`. Check every caller of `transitionEvent(..., "close")` first (registration-deadline jobs must keep working before start). RSVP routes: when the feed row has `mysql_event_id`, load `getEventRow` and reject ongoing/completed with 409 `{ success:false, code:409, message, errorCode }`.
- [ ] **Step 4:** Run the full server set with the Task 0 env: `eventPhase.unit.mjs`, `eventRegistration.unit.mjs`, `eventPhase.e2e.mjs`, `eventLifecycle.e2e.mjs`, `eventJoinRequest.e2e.mjs`, `eventUuid.e2e.mjs`, `feedUuid.e2e.mjs`. Expected: all pass. Fix only regressions this change caused. Report any pre-existing failure separately.
- [ ] **Step 5:** Add the additive fields to `docs/event-lifecycle-api-reference.md` (one short section).

## Task 4: App phase helper

**Files:** Create `lib/eventPhase.ts`, `lib/__tests__/eventPhase.test.ts`. Modify `types/event.type.ts`, `types/feeds.type.ts`, `types/homeFeed.type.ts`.

**Interfaces (produces):**
- `type EventPhase = "upcoming" | "ongoing" | "completed" | "cancelled"`.
- `isEventPhase(v: unknown): v is EventPhase`.
- `effectivePhase(serverPhase: unknown, startsAt?: string | null, endsAt?: string | null, now = Date.now()): EventPhase | undefined` — returns `undefined` for an unknown server phase; only moves upcoming → ongoing → completed using ISO instants; `cancelled` and `completed` never change.
- `type PhaseTone = "brand" | "warning" | "neutral" | "danger"`; `phaseUi(phase?: EventPhase): { label: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED"; tone: PhaseTone; disabled: boolean; muted: boolean } | null` (`null` when phase is undefined; `disabled`/`muted` true for ongoing and completed only).
- `isPhaseInteractive(phase?: EventPhase): boolean` — true for `undefined` and `upcoming`.
- `isHiddenFromHome(i: { eventPhase?: EventPhase; registrationClosesAt?: string | null }, now = Date.now()): boolean` — true for `cancelled`, or effective `upcoming` whose `registrationClosesAt` has passed.
- `eventRowBadge(e: { status: string; eventPhase?: EventPhase; joinRequest?: { status: string } | null }, joined: boolean): { label: string; tone: PhaseTone }` — order: join-request badge, then cancelled, then phase label, with `JOINED` only for upcoming and "REGISTRATION CLOSED" for upcoming with derived status `closed`.
- Types gain: `EventRecord.eventPhase/eventStartsAt/eventEndsAt`, `FeedItem.eventPhase/eventEndsAt`, `HomeFeedItem.eventPhase`.

- [ ] **Step 1: Write failing tests:** `server upcoming stays upcoming before start`, `advances to ongoing at start`, `advances to completed at end`, `never regresses from completed`, `never regresses from ongoing when the clock is earlier`, `ignores device timezone (same instant, different TZ env)`, `unknown/missing server phase returns undefined and never mutes (older server)`, `phaseUi labels/tones/muted/disabled per phase`, `isPhaseInteractive`, `isHiddenFromHome keeps ongoing/completed, hides cancelled and closed-cutoff upcoming`, `eventRowBadge precedence and JOINED only for upcoming`.
- [ ] **Step 2:** `npm test`. Expected: new tests FAIL (module missing); the existing 93 still pass.
- [ ] **Step 3:** Implement the module and type additions.
- [ ] **Step 4:** `npm test`. Expected: all pass.

## Task 5: App registration/CTA helpers

**Files:** Modify `lib/eventRegistration.ts`, `lib/eventLifecycle.ts` (`organizerActions`), `lib/__tests__/eventRegistration.test.ts`, `lib/__tests__/eventLifecycle.test.ts`.

**Interfaces:**
- `eventCardCta(item: { isOwner?; isJoined?; registrationStatus?; eventPhase?: EventPhase }, fallbackLabel?)` — same return shape. For `ongoing`/`completed`: organizer → `{ label: "YOUR EVENT", disabled: true, isOrganizer: true }`; joined → `{ label: "Joined", disabled: true }`; others → `{ label: "EVENT IN PROGRESS" | "EVENT ENDED", disabled: true, icon: "lock-closed-outline" }`. Without a phase, or `upcoming`, output is byte-for-byte the current behavior.
- `phaseBlockedReason(phase?: EventPhase): string | null` — "EVENT IN PROGRESS" / "EVENT COMPLETED" / null.
- `organizerActions(status?: string, phase?: EventPhase)` — `canClose`, `canDelay`, `canEditReminders` require upcoming or no phase; `canComplete` unchanged; `canCancel` additionally false when phase is `completed`.

- [ ] **Step 1: Write failing tests:** `ongoing: joined viewer's card is disabled` (Review Focus 3), `ongoing: organizer card is disabled but flagged isOrganizer` (4), `completed non-participant gets EVENT ENDED`, `no phase and upcoming outputs are unchanged` (re-assert the existing expectations), `phaseBlockedReason`, `organizerActions: close/delay/reminders only before start; complete still offered while ongoing; cancel hidden when completed`.
- [ ] **Step 2:** `npm test`. Expected: new tests fail.
- [ ] **Step 3:** Implement the signatures above.
- [ ] **Step 4:** `npm test`. Expected: all pass.

## Task 6: App feed

**Files:** Modify `hooks/useHomeFeed.ts`, `components/home/EventFeedCard.tsx`.

**Interfaces:** Consumes Tasks 4–5. `toHomeFeedItem` sets `eventPhase: effectivePhase(f.eventPhase, f.eventStartsAt, f.eventEndsAt)`.

- [ ] **Step 1:** In `useHomeFeed`, replace the `isEventUnjoinable` filter with `isHiddenFromHome`; keep the legacy no-`mysqlEventId` filter. Map `eventPhase`. In `toggleRsvp`, return early when `!isPhaseInteractive(item.eventPhase)` before any API call.
- [ ] **Step 2:** In `EventFeedCard`, render the status pill with the existing `Badge` (tones mapped to theme colors, dark-mode-safe), dim hero and body for `muted` phases while the pill, footer actions and card border stay full strength (D4), use `eventCardCta` with the phase, and keep the card body `onPress={onOpen}` read-only navigation. CTA `disabled` must not call `onOpen`.
- [ ] **Step 3:** `npx tsc --noEmit`. Expected: no new errors versus the baseline (record the baseline error count first).
- [ ] **Step 4:** `npm test`. Expected: all pass.

## Task 7: App profiles

**Files:** Modify `store/useEventStore.ts` (`fetchEventPage(kind, phase, page, limit)`; check every caller), `app/(tabs)/profile/event-dashboard.tsx`, `components/product/ProductCard.tsx`.

- [ ] **Step 1:** My Events: chips become Upcoming / Ongoing / Completed / Cancelled (default Upcoming), sending `phase` instead of `status`. Rows use `eventRowBadge`, `effectivePhase` and muted styling for ongoing/completed, stay tappable (Created → `/(shared)/event-dashboard`, Joined → `/(shared)/event-details`). Keep join-request badges, the Joined-tab pending-request merge (now on the Upcoming chip) and empty states ("No Upcoming Events" etc.).
- [ ] **Step 2:** `ProductCard` (readOnly event items on another user's profile): same pill and muted style; the "View Event Details" CTA stays enabled. Non-readOnly use of `ProductCard` for events must keep working.
- [ ] **Step 3:** `npx tsc --noEmit` and `npm test`. Expected: no new type errors; all pass.

## Task 8: App details and organizer dashboard

**Files:** Modify `app/(shared)/event-details.tsx`, `app/(shared)/event-dashboard.tsx`, `components/event/OrganizerLifecycleModals.tsx` (menu gating only).

- [ ] **Step 1:** Details: `joinBlockedReason` prefers `phaseBlockedReason(effectivePhase(e.eventPhase, e.eventStartsAt, e.eventEndsAt))`; "Leave Event" menu item requires `isPhaseInteractive(phase)` in addition to today's conditions; no join sheet can open for non-upcoming phases; content stays read-only visible.
- [ ] **Step 2:** Dashboard: pass the event's phase into `organizerActions` (menu: Close registration hidden once started; Cancel hidden when completed); End Event and the existing `organizerEventActions` stay as they are.
- [ ] **Step 3:** `npx tsc --noEmit` and `npm test`. Expected: no new type errors; all pass.

## Task 9: Full verification

- [ ] **Step 1:** Re-run every server file listed in Task 3 Step 4 and `npm test` in the app; record exact counts.
- [ ] **Step 2:** `npx tsc --noEmit` in the app; compare to baseline.
- [ ] **Step 3:** Run the app on the iOS simulator against a local server on the throwaway DB if the dev build is feasible; screenshot feed, My Events and another user's profile in light and dark mode. If not feasible, say so and do not claim visual verification.
- [ ] **Step 4:** Stop the throwaway `mysqld`. Write the final report (findings, files, behavior, API changes, tests with counts, remaining issues).

## Self-review notes

- Spec coverage: §3.1 → Task 1; §3.2 → Task 2; §3.3 → Task 3; §3.4 → Tasks 4–8; §5 → Tasks 1, 4; §7 cases 1–10 → Tasks 1–5 plus Task 9; D1 → Task 1; D2 → Task 7; D3 and D5 → Task 3, 5, 8; D4 → Task 6; D6 → Task 2.
- Names are consistent across tasks: `getEventPhase`, `explicitEventEndAt`, `effectivePhase`, `phaseUi`, `isPhaseInteractive`, `isHiddenFromHome`, `eventRowBadge`, `phaseBlockedReason`.
