# Event phases: show upcoming, ongoing and completed events, disable the ended ones

Status: **DRAFT — awaiting review. Nothing in this spec is implemented.**
Date: 2026-10-25
Repos: `home-connect` (Expo app) and `home-connect-server` (Node/Express + MySQL). The user explicitly authorized edits to both.

## 1. Goal

Old and ongoing events stay **visible** in the Home feed and in user profiles, but ongoing and completed ones render **disabled** with a clear status label. Upcoming events keep working exactly as today. The server enforces the same rules, so a disabled button is never the only guard.

### Requirements confirmed by the user
- Keep **all** past events in the feed indefinitely (no 7-day window).
- Show **upcoming, ongoing and completed** events, each with a clear status label.
- Visually disable ongoing and completed cards and their restricted actions.
- Same behavior for **Created** and **Joined** events in profiles.
- Event details stay reachable read-only wherever they are today.
- Preserve capacity, registration, cancellation and authorization rules.
- Use the existing MySQL date/time columns and IST (UTC+05:30) handling.
- MySQL stays the single source of truth. No MongoDB, no Cloudinary, no new tables or columns, no new endpoints.
- Nothing deployed; nothing touches production.

## 2. Findings: how it works today

| Area | Today | Source |
|---|---|---|
| Status source | `registrationStatus` (`OPEN/FULL/CLOSED/STARTED/JOINED/CANCELLED/COMPLETED`), built from `start_date`/`start_time` pinned to `+05:30`. `STARTED` covers both "ongoing" and "ended but never marked completed". `COMPLETED` only appears when the stored `status` is `completed`. | `home-connect-server/src/services/event.service.js` (`getEventRegistrationStatus`, `eventStartAt`) |
| Auto-complete | A job completes an event at its end instant, but only when an explicit `end_time` exists. | `eventLifecycle.service.js` (`completionEndAt`), `jobs/eventStart.job.js` |
| Feed hides ended events | `listFeedsBySociety` excludes anything not `active`, past its registration cutoff, or already started. The app filters again client-side. **This is the opposite of the new requirement.** | `feed.service.js:264`, `hooks/useHomeFeed.ts:201` |
| Join enforcement | Already correct: `joinEventTx` re-checks under a row lock and returns 409 `EVENT_STARTED` / `EVENT_CLOSED` / `EVENT_CANCELLED` / `EVENT_FULL`. Join-request create/approve use the same check. | `event.service.js:225`, `eventJoinRequest.service.js` |
| Other lifecycle guards | `delay`, `start`, `reminders`, manual reminder already reject once started. `cancel` is rejected only when completed. **`close` has no started/ended guard.** | `eventLifecycle.service.js` |
| Leave / remove participant | **No time or status guard at all.** The app only hides "Leave Event" for stored `completed`/`cancelled`. | `event.controller.js:1000`, `event-details.tsx` menu |
| Legacy RSVP | `POST/DELETE /api/feed/rsvp/:feedId` take `userId` from the body, are **unauthenticated**, and check no timing. A bypass of Event API join rules. | `feed.routes.js:41,45`, `feed.controller.js:316` |
| Event edit | Not implemented. The dashboard's "Edit Event" only shows a toast, and no update endpoint exists. Nothing to enforce. | `event-dashboard.tsx:412` |
| Feed card | CTA is already disabled for `STARTED`/`COMPLETED`. A joined viewer's status is overridden to `JOINED`, so a **joined user's ongoing event looks fully active**. No muted card, no status pill. | `EventFeedCard.tsx`, `useHomeFeed.ts:123` |
| My Events (own profile) | Created/Joined tabs, filtered by **derived stored status** (Active/Completed/Closed/Cancelled). There is no ongoing state: an ongoing event lands under "Closed" because its registration cutoff has passed. | `profile/event-dashboard.tsx`, `event.controller.js:respondWithEventPage` |
| Another user's profile | Shows that user's created event feed items through read-only `ProductCard` (CTA "View Event Details"). Their *joined* events are not exposed, and no endpoint exists. | `user-profile-screen.tsx`, `ProductCard.tsx` |
| Admin phases | Admin events listing already has `upcoming/ongoing/past/completed/cancelled`. Same intent, slightly different end rules (see D1). Left untouched. | `adminEvents.service.js` (`PHASE_SQL`) |
| Timezone | Dates are IST wall-clock; the server pins `+05:30`. The API already sends ISO instants (`eventStartsAt`, `registrationClosesAt`). | `event.service.js` |

Baselines run before writing this spec: app `npm test` **93/93 pass**; server `eventRegistration.unit.mjs` **11/11 pass**, once pointed at loopback. The server `.env` points at a remote database, and the repo's test guard refuses it. See section 7.

## 3. Design

### 3.1 One derived value: `eventPhase`

New pure function in `event.service.js`:

```
getEventPhase(row, { now = Date.now() }) -> "upcoming" | "ongoing" | "completed" | "cancelled"
```

Rules, evaluated in order:
1. stored `status = cancelled` → `cancelled`
2. stored `status = completed` → `completed`
3. explicit end instant exists and `now >= end` → `completed`
4. `now >= start` → `ongoing`
5. otherwise → `upcoming`

- **Start** uses the existing `eventStartAt(row)` (IST-pinned). `now >= start` is the same boundary `getEventRegistrationStatus` already uses for `STARTED`.
- **End** is the *explicit* end instant: `end_date` (defaults to start date) + `end_time`, IST-pinned, and only valid when `end_time` exists and the end is not before the start. This is exactly today's `completionEndAt`. I move its body into `event.service.js` as `explicitEventEndAt` and make `completionEndAt` delegate to it. That gives one definition and avoids a circular import. Behavior is unchanged.
- **End boundary:** `now >= end` means completed, matching the instant the auto-complete job fires.
- `now` is always **server time** and is injectable, so tests pin exact boundaries.
- The phase is **never stored and never accepted from a client**. It is recomputed from `events` columns on every read.

`eventPhase` is *additive*. `status`, `registrationStatus`, `canJoin` and every existing field keep their current meaning, so nothing existing changes shape.

### 3.2 API changes (additive)

| Endpoint | Change |
|---|---|
| `GET /api/feed/getfeeds/:societyId` | **Query change:** include every non-cancelled event that has started or completed, in addition to today's open upcoming events. Adds `eventPhase` and `eventEndsAt` (ISO) to each event item (next row). |
| `eventTiming()` in `feed.service.js` (used by the single-feed and batch readers, so also `getFeed/:id` and `GET /api/feed/user/:userId`) | Adds `eventPhase` and `eventEndsAt` next to the existing `eventStartsAt` / `registrationStatus`. |
| `serializeEvent()` in `event.controller.js` (used by `GET /api/events/:id`, `my-events`, `joined-events`, dashboard, cancel) | Adds `eventPhase`, `eventStartsAt`, `eventEndsAt`. |
| `GET /api/events/my-events` and `joined-events` | New optional `?phase=upcoming\|ongoing\|completed\|cancelled`. An unknown value returns 400. Existing `status` filtering is unchanged and still works, so old app builds are unaffected. If both are sent, both apply. |

New feed SQL condition for event rows (non-event rows untouched):

```
f.mysql_event_id IS NULL
OR ( e.status <> 'cancelled'
     AND ( e.status = 'completed'
           OR START <= IST_NOW                                   -- ongoing or completed
           OR ( e.status = 'active'                              -- upcoming: exactly as today
                AND (e.registration_closes_at IS NULL OR e.registration_closes_at > IST_NOW) ) ) )
```

`START` and `IST_NOW` use the expressions already in this query (`UTC_TIMESTAMP() + INTERVAL 330 MINUTE`).

**Old app builds keep working.** They filter client-side with `isEventUnjoinable(registrationClosesAt, eventStartsAt)`. Both fields stay in the payload, so old builds keep hiding started events and show no change.

### 3.3 Backend enforcement matrix

"Behavior change" rows are the only places existing server behavior moves. Everything else is already enforced and gets tests.

| Action | upcoming | ongoing | completed | Status |
|---|---|---|---|---|
| Join (`POST /:id/join`) | existing rules | 409 `EVENT_STARTED` | 409 `EVENT_CLOSED` | Already enforced. Tests only; error codes unchanged. |
| Request to join / approve request | existing rules | rejected | rejected | Already enforced. Tests only. |
| Legacy `POST/DELETE /api/feed/rsvp/:feedId` on an event feed item (`mysql_event_id` set) | existing | **409** | **409** | **Behavior change** (closes the bypass). Legacy items with no `mysql_event_id` are untouched. |
| Self-leave (`PATCH /:id/participants/:uid/cancel`, self) | allowed | **409 `EVENT_STARTED`** | **409 `EVENT_COMPLETED`** | **Behavior change** (D3). |
| Organizer removes a participant | allowed | allowed | **409 `EVENT_COMPLETED`** | **Behavior change** (D3). Historical participation is frozen once completed. |
| Close registration (`PATCH /:id/close`) | allowed | **409 `EVENT_STARTED`** | existing `EVENT_COMPLETED` | **Behavior change** (D5). Registration is already closed by the start. |
| Cancel event | allowed | allowed | existing `EVENT_COMPLETED` | Unchanged. |
| Complete / End event | needs started | allowed | idempotent | Unchanged. |
| Delay, reminders, manual reminder, start now | allowed | existing `EVENT_STARTED` | existing | Already enforced. Tests only. |
| Event like / comment / report-an-issue | allowed | allowed | allowed | Unchanged (D4). |

Authorization is untouched: ownership and role checks (`canManage`, `canView`, JWT identity) run before any phase check, so a 403/404 is never replaced by a phase error. Errors reuse the existing `{ success:false, code, message, errorCode }` shape and the existing `errorCode` names (`EVENT_STARTED`, `EVENT_COMPLETED`).

### 3.4 Mobile app

**One helper, `lib/eventPhase.ts` (pure, unit-tested)**
- `type EventPhase = "upcoming" | "ongoing" | "completed" | "cancelled"`.
- `effectivePhase(serverPhase, startsAtIso, endsAtIso, now)` takes the server phase and **only moves it forward**: upcoming → ongoing → completed. It never moves it back, and never enables anything. It uses server-supplied UTC instants, so device timezone is irrelevant. This stops a long-open feed from showing an enabled Join on an event that just started.
- `phaseUi(phase)` returns `{ label, tone, disabled, muted }`: UPCOMING / ONGOING / COMPLETED. Tones map to theme tokens, not hard-coded colors, so light and dark mode both stay readable.

**Screens**

| Place | Change |
|---|---|
| `useHomeFeed.ts` | Map `eventPhase`. Keep dropping legacy events with no `mysqlEventId`. Drop the `isEventUnjoinable` filter (ended events must show). `toggleRsvp` returns early for non-upcoming phases so no API call can fire. Joined-user override to `JOINED` no longer hides the phase. |
| `EventFeedCard.tsx` | Status pill (UPCOMING / ONGOING / COMPLETED) in the hero header via the existing `Badge`. Ongoing/completed: card content muted (reduced opacity), pill stays full contrast, CTA disabled with a read-only label. The card body still opens Event Details. Like/comment/share stay enabled (D4). |
| `lib/eventRegistration.ts` (`eventCardCta`, `detailsFooterState`) | Take the phase into account. Non-participants see an "ended/in progress" lock state, participants keep "Joined", the organizer keeps "YOUR EVENT". Disabled CTAs make no API call. |
| `ProductCard.tsx` (another user's profile) | Same pill and muted style for event items. The existing read-only "View Event Details" navigation stays enabled. |
| `profile/event-dashboard.tsx` (My Events: Created and Joined) | Chips become phase-based: **Upcoming · Ongoing · Completed · Cancelled** (D2). Rows get the same pill, with muted style for ongoing/completed. Rows stay tappable (Created → dashboard, Joined → details). The "JOINED" badge shows only for upcoming. Existing join-request badges are kept. |
| `store/useEventStore.ts` | `fetchEventPage` sends `phase`. |
| `event-details.tsx` | Footer and menu use the phase: no Join/Request-to-Join, and no "Leave Event" once ongoing or completed. Details content stays read-only visible. |
| `event-dashboard.tsx` (organizer) + `organizerActions` in `lib/eventLifecycle.ts` | Close Registration disabled once started. End Event and Cancel stay available while ongoing. Everything read-only once completed. |

**Muted look.** The card content is dimmed, while the status pill and the card border stay at full strength. Disabled controls use the theme's disabled tokens. This keeps the current layout and hierarchy with no new card design.

**Not changed:** other users' *joined* events stay private (no endpoint exists, and none is added).

### 3.5 Files expected to change

Server: `src/services/event.service.js`, `src/services/eventLifecycle.service.js`, `src/services/feed.service.js`, `src/controllers/event.controller.js`, `src/controllers/feed.controller.js`, `docs/event-lifecycle-api-reference.md` (additive fields), new `tests/eventPhase.unit.mjs` and `tests/eventPhase.e2e.mjs`.

App: new `lib/eventPhase.ts` and `lib/__tests__/eventPhase.test.ts`. Edits to `hooks/useHomeFeed.ts`, `components/home/EventFeedCard.tsx`, `components/product/ProductCard.tsx`, `lib/eventRegistration.ts`, `lib/eventLifecycle.ts`, `app/(tabs)/profile/event-dashboard.tsx`, `app/(shared)/event-details.tsx`, `app/(shared)/event-dashboard.tsx`, `store/useEventStore.ts`, and the types (`types/event.type.ts`, `types/homeFeed.type.ts`, `types/feeds.type.ts`).

`git status` already shows unrelated uncommitted app edits (`create-poll`, `create-service`, `FeedActions`, onboarding, etc.). They are not touched by this work.

## 4. Decisions that need your confirmation

Each one has a default. Approving the spec as written accepts all of them.

- **D1. Events with no end time.** Default: such an event stays **ongoing** until the organizer ends it. This matches today's auto-complete rule ("never auto-complete without a valid end") and never mislabels a live event as completed. The app form already requires an end time, so this only affects legacy or API-created events. Alternative: treat the end as the start time, as the admin listing does. That would show those events as completed one second after they start.
- **D2. My Events chips.** Default: replace Active/Completed/Closed/Cancelled with **Upcoming/Ongoing/Completed/Cancelled**. Every event then lands in exactly one chip, and registration-closed upcoming events show a badge instead of a separate chip. Alternative: keep the four chips and add "Ongoing". Time-ended events would still sit under "Closed".
- **D3. Leaving and removing.** Default: a participant **cannot leave** an ongoing or completed event, and the organizer **cannot remove** participants from a completed event (can still do so while ongoing, for moderation).
- **D4. Likes, comments, share.** Default: stay **enabled** on ongoing and completed events. They are discussion, not participation, and no existing rule limits them.
- **D5. Organizer actions.** Default: Close Registration is blocked once started. Cancel stays allowed while ongoing (blocked when completed, as today). End Event stays available while ongoing.
- **D6. What stays out of the Home feed.** Default (unchanged): cancelled events, and upcoming events whose registration cutoff has passed. Neither is ongoing or old. Both still appear in profile lists with their existing badges.

## 5. Timezone and boundary handling

- All comparisons are server-side on IST-pinned instants (`+05:30`). The client receives ISO UTC instants and compares instants, never wall-clock strings, so the device's timezone cannot flip a phase.
- The server's own timezone is irrelevant: date columns are read with UTC getters, as today.
- The feed SQL uses the existing `UTC_TIMESTAMP() + INTERVAL 330 MINUTE` IST-now expression.
- Boundaries: `now == start` → ongoing; `now == end` → completed; one millisecond earlier is the previous phase. The admin listing uses `END < now`, so it differs from the app by exactly one instant at the end boundary. It is left untouched.

## 6. Risks and observations

- **Unbounded feed (your explicit choice).** `getfeeds` returns the whole society feed in one response with no pagination. Keeping every past event forever makes it grow without limit. It is correct as specified, but I recommend a pagination follow-up later. It is out of scope here.
- **Pre-existing gaps, reported and not fixed:** `PATCH /api/feed/update/:feedId` and the legacy RSVP routes are unauthenticated. The RSVP guard in 3.3 closes the join-bypass part only for ended events. Authentication on those routes would be a separate change.
- A device with a wrong clock can show a card as ongoing or completed early, because `effectivePhase` only advances. It can never enable a button, and the server re-checks every action.
- The feed filter change touches a hot read path. The e2e suite covers inclusion rules, and the single query shape is kept.

## 7. Testing plan

**Environment safety.** The server `.env` points at a remote database; the suite's guard refused it when I tried. All server tests run **only** against a disposable local MySQL: a throwaway `mysqld` in a temp dir on `127.0.0.1:33999` with `DB_NAME=hc_test`, using the repo's existing helpers (`assertLocalDb`, `shimPreload`). If that cannot be started, I will say the e2e layer did not run and will not report it as passing.

**Layers**
- Server unit (pure, no DB): `tests/eventPhase.unit.mjs`.
- Server e2e (HTTP + local MySQL): `tests/eventPhase.e2e.mjs`.
- App unit: `lib/__tests__/eventPhase.test.ts`, plus extensions to `eventRegistration.test.ts` and `eventLifecycle.test.ts`, run with `npm test`.
- UI check: the repo has **no component-render test setup** (its tests are pure functions run with `node --test`). Cards and rows are tested through pure view-model functions (label, tone, disabled, muted, tap behavior). The actual rendering is verified by running the app on the simulator, with screenshots in light and dark mode. I will not add a render-test dependency without your OK.

**Your ten cases**

| # | Case | Where |
|---|---|---|
| 1 | Upcoming events shown and interactive | App view-model; server e2e feed includes an open upcoming event |
| 2 | Ongoing events in the feed, disabled | Server e2e (feed includes it, `eventPhase=ongoing`); app view-model (muted, CTA disabled, no join call) |
| 3 | Completed events in the feed, disabled | Same, for stored-`completed` and time-ended-but-still-active |
| 4 | Creator's profile: ongoing and completed disabled | Server e2e (`my-events?phase=`); app row view-model |
| 5 | Participant's profile: ongoing and completed disabled | Server e2e (`joined-events?phase=`); app row view-model |
| 6 | Join rejected at API level for ineligible events | Server e2e: ongoing → 409 `EVENT_STARTED`; completed → 409 `EVENT_CLOSED`; legacy RSVP → 409 |
| 7 | Cards still open read-only details | App view-model (card and row still navigate; CTA does not call the API) |
| 8 | Status at start and end boundaries | Server unit with injected `now`: start − 1 ms, start, end − 1 ms, end |
| 9 | Timezone differences | Server unit run under `TZ=UTC`, `TZ=Asia/Kolkata` and `TZ=America/Los_Angeles` give identical phases; app test with device-style offsets |
| 10 | Capacity, registration and authorization unchanged | Existing `eventRegistration.unit.mjs`, `eventLifecycle.e2e.mjs`, `eventJoinRequest.e2e.mjs` re-run; new e2e asserts a non-organizer still gets 403 before any phase error |

Also covered: `explicitEventEndAt` matches the old `completionEndAt` on fixtures (D1 events, no end date, end before start), the `phase` query validation, and old `status` filtering still working.

**Reporting.** I will run the app and server suites and report exact pass/fail counts. Anything I could not run, I will say so.

## 8. Out of scope

New endpoints or columns, event editing (not implemented today), admin `phase` changes, authentication of the legacy feed routes, feed pagination, other users' joined-event lists, any production or deploy action.

## 9. After approval

I will write the implementation plan (`superpowers:writing-plans`), then build test-first: the server phase function and feed query first, then enforcement, then the app.
