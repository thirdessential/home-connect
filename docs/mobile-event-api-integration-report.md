# Mobile ↔ Backend Event API — Integration Report (mobile repo update)

Source audit: `home-connect-server/docs/mobile-event-api-integration-report.md` (it does not exist in this repo; this file is the mobile-side update). Contracts below were re-read from `home-connect-server/src/routes/event.routes.js` and `src/controllers/event.controller.js`.

## 1. Summary
**Broken:** Cancel Event sent `{}`; backend requires `title` (≤70) + `reason` (≤300) → 400 `CANCEL_DETAILS_INVALID`. Organizer saw a Join button (`isCreator` computed, never used) → 409 `EVENT_ORGANIZER`. Leave Event had no error handling: `confirmLeave` rejected into `ConfirmationModal`, which only `console.error`s → no message for the user. Event types lacked 6 lifecycle fields.

**Fixed:** all four, plus the participant-removal false success. **Added (second pass):** close registration, complete, delay, edit reminders (organizer menu on the dashboard) and event-specific issue reports (participant submit on details, organizer list/status on dashboard). All new UI is typechecked and unit-helper-tested only — **not runtime-verified**.

Also found: the old dashboard cancel handler caught its own error, so `ConfirmationModal` showed a false "Success!" on failure. The new dialog no longer uses `ConfirmationModal` for cancel. The *participant*-removal handler had the same swallow-and-succeed bug; fixed in the second pass (it now toasts a mapped message and re-throws, so the modal never shows success on failure).

## 2. Changed files
| File | Reason |
|---|---|
| `lib/eventLifecycle.ts` (new) | Cancel-details validation (trim, 70/300 code-point limits like server), error-code → message mapping for cancel/leave, `isOrganizerJoinError` |
| `lib/__tests__/eventLifecycle.test.ts` (new) | Unit tests for the above |
| `store/useEventStore.ts` | `cancelEvent(eventId, {title, reason})` sends exact body; merges server `event` into `currentEvent` only after success |
| `app/(shared)/event-dashboard.tsx` | New cancel dialog with title/reason inputs, inline errors, counters, pending lock, keeps input on failure, closes only on success |
| `app/(shared)/event-details.tsx` | Organizer footer state (no Join); `confirmLeave` try/catch + in-flight guard + toast + rethrow; Join handles `EVENT_ORGANIZER` |
| `components/event/OrganizerLifecycleModals.tsx` (new) | Organizer "Manage event" menu, Delay modal (10/30/60), Reminders modal (30/20/10/5/2), organizer Issue-reports modal (list + status moves), participant Report-an-issue modal |
| `lib/eventLifecycle.ts` (extended) | `lifecycleErrorMessage` (per errorCode), delay/reminder/report validators, `organizerActions(status)`, `removeParticipantErrorMessage` |
| `store/useEventStore.ts` (extended) | `closeRegistration`, `completeEvent`, `delayEvent`, `setEventReminders`, `submitEventReport`, `getEventReports`, `updateEventReportStatus`; shared `runLifecycle` merges the server `event` only after success |
| `app/(shared)/event-dashboard.tsx` (extended) | "More" now opens the organizer menu; close/complete use ConfirmationModal (throws on failure → no false success); closed/completed/delay banners; participant-removal fix |
| `app/(shared)/event-details.tsx` (extended) | "Report an issue" for joined non-organizers; Leave hidden for cancelled/completed |
| `lib/__tests__/eventLifecycle.test.ts` (extended) | +5 tests (delay, reminders, report validation, error codes, action availability) |
| `types/event.type.ts` | Added `EventReport`; added `reminderOffsets, delayMinutes, completedAt, registrationClosedAt, cancelTitle, cancelReason` (optional, verified in `serializeEvent`) |

No backend, DB, or dependency changes.

## 3. Endpoint matrix (23 registered in `event.routes.js`, recounted; matches the audit)
All under `/api/events`, JWT required; `GET /:id` is optionalAuth. Status: **I** integrated (static review) · **F** fixed · **N** new this pass (implemented, not runtime-verified).

| # | Method & path | Body / notes | Mobile caller → screen | Status |
|---|---|---|---|---|
| 1 | POST `/` | multipart, non-guest, optional `reminders` | `createEvent` → create-event | I |
| 2 | GET `/my-events` | | `getMyEvents`, `fetchEventPage` | I |
| 3 | GET `/joined-events` | | `fetchEventPage` | I |
| 4 | GET `/my-reports` | | – (generic my-reports screen kept) | not required |
| 5 | GET `/my-event-reports` | | – | not required (organizer uses #14 per event) |
| 6 | GET `/:id` | | `getEvent` → event-details | I |
| 7 | POST `/:id/join` | 409 `EVENT_ORGANIZER/FULL/CLOSED/STARTED/CANCELLED/DUPLICATE` | `joinEvent` | I + F |
| 8 | GET `/:id/participants` | `?status=cancelled` | `getParticipants`, `getCancelledParticipants` | I |
| 9 | GET `/:id/dashboard` | | `getDashboard` | I |
| 10 | PATCH `/:id/cancel` | `{title≤70, reason≤300}` | `cancelEvent` → dashboard cancel dialog | F |
| 11 | PATCH `/:id/close` | none; `active→closed`; 409 `EVENT_CANCELLED/COMPLETED` | `closeRegistration` → dashboard menu | N |
| 12 | PATCH `/:id/complete` | none; 409 `EVENT_NOT_STARTED/CANCELLED` | `completeEvent` → dashboard menu | N |
| 13 | POST `/:id/reports` | `{title≤70, description≤300}`; joined only; 403/409/429 | `submitEventReport` → event-details menu | N |
| 14 | GET `/:id/reports` | organizer/admin | `getEventReports` → dashboard "Issue reports" | N |
| 15 | GET `/:id/reports/:reportId` | reporter or organizer | – (list already carries the fields shown) | not required |
| 16 | PATCH `/:id/reports/:reportId` | `{status}`; open→in_review/resolved/dismissed, in_review→resolved/dismissed | `updateEventReportStatus` → dashboard | N |
| 17 | PATCH `/:id/delay` | `{minutes ∈ 10,30,60}`; 409 `EVENT_STARTED/CANCELLED/COMPLETED`; 10/min | `delayEvent` → dashboard Delay modal | N |
| 18 | PUT `/:id/reminders` | `{reminders:[30,20,10,5,2 subset]}`; 409 terminal/started; 10/min | `setEventReminders` → dashboard Reminders modal | N |
| 19 | PATCH `/:id/participants/:userId/cancel` | self or organizer/admin | `cancelParticipant` → details (Leave), dashboard (Remove) | I + F |
| 20 | PATCH `/:id/like` | | `toggleLike` | I |
| 21 | POST `/:id/comments` | | `addComment` | I |
| 22 | GET `/:id/comments` | | `getComments` | I |
| 23 | DELETE `/:id/comments/:commentId` | | `deleteComment` | I |

Contracts for cancel are unchanged from the previous pass (200 returns `event`; 400 `CANCEL_DETAILS_INVALID` with `errors`; 403/404/409 `EVENT_COMPLETED`). Close/complete/delay/reminders return `200 { event }` which the store merges into an open details screen only after success; the dashboard is then reloaded. Event statuses: `active|closed|cancelled|completed`; there is no "delayed" status — only `delayMinutes`.

## 4. UI behaviour by state
- **Open/active:** residents Join; organizer sees organizer footer and the Manage menu (close, delay, reminders, complete, reports, cancel). Joined residents can Leave.
- **Full / Closed / Started:** unchanged — driven by server `registrationStatus` (Join hidden with a reason). Closing registration shows a "Registration is closed" banner on the dashboard and removes "Close registration" from the menu; it never marks the event cancelled.
- **Cancelled / Completed:** menu offers only Issue reports; Leave hidden on details; banners shown; cancel/close/delay/reminders/complete not offered.
- **Delayed:** "Delayed by N min in total" from `delayMinutes`; times shown are the server's adjusted times.
- **Failures** never show success: close/complete use `ConfirmationModal`, which only shows success if the handler resolves, and handlers toast once and re-throw. Delay/reminders/report modals keep input and show inline errors; 409s re-sync.
- **Complete before start:** the action is offered; the server's `409 EVENT_NOT_STARTED` is shown as "This event hasn't started yet…". The app does not guess start time locally.

## 5. Reports decision
`POST /api/reports` (generic, target `EVENT`, existing "Report" menu item, my-reports, society-reports) is **kept unchanged** — it is content moderation and also serves non-event targets. The event-specific system is a different purpose (post-start issue to the organizer, statuses open/in_review/resolved/dismissed), so it is added **beside** it under "Report an issue" / "Issue reports"; nothing is submitted to both, replaced, migrated or hidden. Not done: showing event reports in `my-reports.tsx` (`GET /my-reports` not wired) — needs a product decision on one combined history.

## 6. Tests actually run
| Command | Result |
|---|---|
| `npm test` | 28/28 pass (23 prior + 5 new) |
| `npx tsc --noEmit -p .` | only the pre-existing `components/UI/Label.tsx(20,106)` error (`typography.label` has no `fontWeight`); none in changed files. Left untouched (unrelated). |
| `npx eslint …` | Still crashes before linting: installed `zod-validation-error@3.5.4` has no `./v4` export, which `eslint-plugin-react-hooks@7.1.1` (via `eslint-config-expo`) requires. Fix would be a dependency bump (to 4.x) — not applied. |

## 7. Not verified / limitations
No backend suite, live API, emulator/device, or component/render tests were run (no RN test renderer in the repo). Every screen change in §2 is typechecked only, so the checklist items (create→join→leave→cancel→close→complete→delay→reminders→reports→comments/likes, auth failure) are **unverified at runtime**. Backend ref states its own e2e suite passed 141/141; I did not re-run it. No backend, MySQL or dependency changes.

## 8. Open product decisions
1. **Delay vs registration cutoff:** backend does not move the cutoff (documented "pending decision"); the Delay modal says so. No mobile rule invented.
2. **Combined report history** in `my-reports.tsx` (generic + event-specific).
3. **"Edit Event"** header button remains a placeholder: there is no backend update-event route.
4. Event-report entry shows for any joined non-organizer on a non-cancelled event; the server rejects before start (409), so the user sees its message.
5. Old app builds sending no cancel body get 400 (backend decision).

## 9. Report-an-issue popup fixes (follow-up)
- **"This event no longer exists" root cause (confirmed):** `.env` sets `EXPO_PUBLIC_MY_TERRACE_APP_BACKEND=live`. An unauthenticated probe of `https://api.myterraceapp.com` returned Express's HTML `Cannot POST /api/events/1/reports` (and `/delay`) while `/join` returned 401 — the deployed server does not have the new event-report/delay/reminder routes. The mobile layer mapped every 404 to "event no longer exists". The event id sent (route param `eventId`, numeric or UUID) is accepted by the local backend's `getEventRow`; no id bug found. **Not fixed by code:** the backend needs deploying (or set `EXPO_PUBLIC_MY_TERRACE_APP_BACKEND=development` and run the local server). Mobile fix: a 404 without a JSON error body now reads "This feature isn't available on the connected server yet"; a real `Event not found` JSON still reads "no longer exists". Submit is also blocked if the id is missing.
- **Popup:** own modal shell — backdrop is no longer tappable; X button in the header (and Android back via `onRequestClose`) close it, both blocked while submitting. Fixed header + `KeyboardAvoidingView` + `ScrollView` (`keyboardShouldPersistTaps="handled"`) keep title/description visible and Submit reachable.
- **Focus:** inputs/textarea use `theme.colors.brand` (green in light and dark) when focused; red when invalid.
- **Tests:** `npm test` 29/29; `tsc` only the old Label.tsx error. Not run: simulator/device checks, live submission, backend suite (no backend change, no schema change).

## 10. Event Details error investigation (follow-up)
- **Message source:** the only code that emits "This feature isn't available on the connected server yet…" is the 404 branch of `lifecycleErrorMessage` (`lib/eventLifecycle.ts`). It is used only by the organizer actions, event-reports modal and Report-an-issue submit — **not** by the Event Details load, which toasts the server's own message (`getEvent` → `GET /api/events/:id`).
- **Live server (`api.myterraceapp.com`, per `.env`), unauthenticated probes:** `GET /api/events/1` → JSON `Event not found` (route exists), `/1/dashboard`, `/1/participants`, `/1/join` → 401 (exist); `/1/reports` (GET/POST) and `/1/delay` → Express HTML `Cannot GET/POST` (missing). Conclusion: the deployed backend predates the lifecycle/report routes; this matches `home-connect-server` having uncommitted lifecycle changes. **Deployment of the backend is still required**; nothing was deployed, `.env` was not changed.
- Event Details on the live server therefore cannot be shown to be broken by this message; if it appears when only opening details, it comes from a modal/action on that flow hitting a missing route. I could not reproduce an Event Details failure without an authenticated session.
- **Backend verification (isolated local MySQL 9.6, port 33999, scratch datadir, shut down afterwards):** `tests/eventLifecycle.e2e.mjs` 141 passed / 0 failed, covering event-report creation/persistence. No backend or schema change.

## 11. HOUSEFULL + join requests
**Root causes.** "SOLD OUT" was just the label `registrationUi("FULL")` returned. Capacity could not exceed the maximum through `POST /join` (it already re-checks under `events … FOR UPDATE`), so no over-capacity path existed there; there was **no** request/approval infrastructure, so it was added. Historical data over capacity was not looked for in a live DB (none touched).

**Backend (`home-connect-server`, MySQL only, no deploy):** new table `event_join_requests` (created by `ensureEventTables`, additive): `UNIQUE(event_id,user_id)`, indexes `(event_id,status)` / `(user_id)`, FKs to events/users `ON DELETE CASCADE`, statuses `pending|approved|rejected`, `reason`, `reviewed_by`, `reviewed_at`. Only `event_participants.status='joined'` consumes capacity. Files: `src/models/eventSql.model.js`, `src/services/eventJoinRequest.service.js`, `src/controllers/eventJoinRequest.controller.js`, `src/routes/event.routes.js`, `src/controllers/event.controller.js` (adds `housefull`, viewer `joinRequest` on `GET /:id`, exports `canView`), `tests/eventJoinRequest.e2e.mjs`.

| Route | Auth | Notes |
|---|---|---|
| POST `/api/events/:id/join-requests` | JWT, non-guest, 10/min | only while status is FULL; 409 `EVENT_NOT_FULL / REQUEST_PENDING / REQUEST_FINALIZED / EVENT_DUPLICATE / EVENT_ORGANIZER / EVENT_CANCELLED / EVENT_CLOSED / EVENT_STARTED` |
| GET `/api/events/:id/join-requests/me` | JWT | own request or `null` |
| GET `/api/events/:id/join-requests?status=` | organizer/admin | `{pendingCount, requests}` |
| PATCH `/api/events/:id/join-requests/:requestId/approve` | organizer/admin | one transaction: event row lock → request still pending → capacity & lifecycle re-check → participant insert/reactivate → request approved. 409 `EVENT_FULL` leaves it pending |
| PATCH `…/reject` `{reason?}` | organizer/admin | pending → rejected (+reason); 409 `REQUEST_FINALIZED` if already decided |
| GET `/api/events/my-join-requests` | JWT | caller's pending/rejected requests as event objects with `joinRequest` |

Identity and permissions come from the token/stored organizer only. Notifications (existing `sendToUser`, after commit, never rolled back, dedupe key `event-join-request:<id>:created|approved|rejected`): `EVENT_JOIN_REQUEST` → organizer, `EVENT_JOIN_REQUEST_APPROVED` / `…_REJECTED` → requester. A rejected user cannot re-request (unique row); approval of an already-joined user just closes the request.

**Mobile:** `registrationUi("FULL")` now says HOUSEFULL (cards, details). Details footer: HOUSEFULL + max/joined text + **Request to Join** (server `FULL` and no request); REQUEST PENDING / REQUEST REJECTED (+ reason or the capacity message) from `event.joinRequest`; JOINED only from the confirmed state. My Events → Joined (Active, page 1) prepends the viewer's pending/rejected requests from `/my-join-requests` and labels confirmed ones JOINED. Dashboard "Manage event" gains **Join requests (n)** with Approve/Reject, per-row lock, 409s re-sync. Notification `EVENT_JOIN_REQUEST` routes to the dashboard (opens the list); approved/rejected route to event details. Files: `lib/eventRegistration.ts`, `lib/notificationRoute.ts`, `store/useEventStore.ts`, `types/event.type.ts`, `components/event/OrganizerLifecycleModals.tsx`, `app/(shared)/event-details.tsx`, `app/(shared)/event-dashboard.tsx`, `app/(tabs)/profile/event-dashboard.tsx`, tests.

**Tests actually run.** Isolated local MySQL 9.6 (127.0.0.1:33999, scratch datadir, shut down): `eventJoinRequest.e2e.mjs` 39/39 (capacity, pending/rejected don't count, approval/reject, auth, finalized, notification rows exactly once, 3-way race for last place → exactly one wins and count==max, cancelled event); regression `eventRegistration` 20/20, `eventLifecycle` 141/141. `eventUuid.e2e.mjs` has 2 failures (complete/cancel by UUID) that are pre-existing: that older test predates the lifecycle rules (complete before start → 409, cancel needs title/reason); untouched. Mobile: `npm test` 31/31, `tsc` only the old `Label.tsx` error.
**Not done / unverified:** no device/simulator run, no real push delivery (test users have no device tokens; notification *rows* verified), no component tests, ESLint still crashes, backend not deployed (live server lacks these routes). Not implemented: re-request after rejection, pending-request cancellation by the user, capacity-edit validation (there is no update-event route).
