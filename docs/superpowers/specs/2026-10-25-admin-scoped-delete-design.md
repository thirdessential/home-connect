# Admin scoped delete — design

Date: 2026-10-25 (revised after review feedback the same day)
Repos: `home-connect` (Expo mobile app) and `home-connect-server` (Express 5 + MySQL backend, sibling folder)
Status: **approved by the user on 2026-10-25**, including assumptions A-F and decision G (option 1). Implementation plan: `docs/superpowers/plans/2026-10-25-admin-scoped-delete.md`. No application code has been written or changed yet.

## 1. Goal

Society Admins and Super Admins can delete any post, poll, event, user, service, business or review inside their authorized scope, regardless of who created it.

- A Society Admin acts only on records that belong to a society they administer.
- A Super Admin acts on records in every society.
- Authorization is enforced on the backend. The client never supplies roles or society ids that the server trusts.
- Every delete asks for confirmation in the app first.
- MySQL is the only database. No MongoDB, no Cloudinary. Nothing is deployed.

### Decisions already made with the user

- Deletes are **permanent** (hard delete using the existing FK cascades), not soft delete.
- **Events keep the existing cancel flow** instead of being hard-deleted, with one exception: **completed events** (which cancel refuses) get a scoped admin permanent delete (decision G).
- Reuse existing endpoints where they exist. Add endpoints only where nothing exists.
- **Order history is never lost** when a business listing or a user is deleted (section 6).
- Out-of-scope deletes return **403**, including on the existing directory endpoints (section 5.1).
- Post-image cleanup also runs when the owner deletes their own post.
- Event-review deletion gets a backend endpoint only. **No new app screen in this task**: every app change is a menu row or icon on an existing screen.
- Owners are notified of admin deletions through the existing notification system.

### Non-goals

- No soft-delete columns, no undo or restore.
- No change to the old `CreatePostModal`, `VerificationSheet` or the unused `ReportedContentsView`.
- No retention or purge policy for the order archive.
- Not touched: `.env` files, deploy scripts, the web frontend.

## 2. Current state (verified in code)

| Entity | Today |
|---|---|
| Services | `DELETE /api/admin/directory/:id` does a scoped permanent delete in a transaction. A society admin cannot delete an entry shared with another society. Out-of-scope entries currently return 404. Reviews: `DELETE /api/admin/directory/:id/reviews/:reviewId`, also 404 when out of scope. |
| Posts, polls | `DELETE /api/feed/:feedId` is owner-only. It does not remove image files. Admins can delete only through reported content. |
| Events | `PATCH /api/events/:eventId/cancel` and `GET .../dashboard` already accept the organizer or an in-scope admin and return 403 otherwise. The cancel notifies the organizer and joined participants (never the actor). Cancelled events are excluded from the feed and counted separately on the dashboard. |
| Users | `DELETE /api/user/:userId` (`removeUser`) sits behind `authenticate` only, so any logged-in user can delete any account. It also deletes the target's feed items. |
| Registered businesses (`businesses`) | Only the owner can delete (`deleteMyBusinessAccount`). Files go through `removeStoredFile`, and the `business` role is stripped. No admin delete. |
| Business listings (`business_listings`) | No delete endpoint. Reported-content deletion removes the row with no file cleanup. |
| Reviews | Directory reviews: admin delete exists. Business-listing reviews and event reviews (`feed_reviews`): none. |
| Authorization helpers | `authenticate`, `authorize(...roles)`, `adminSocietyScope`, `canAdminSociety`, `requireSocietyAccess`. `req.user.adminSocietyIds` comes from MySQL (`society_admins`). |
| Notifications | `sendToUser(userId, title, body, data)` in `utils/notification.service.js`. The app's `notificationRoute` sends any notification without a known `entityType` to the Notifications page. |
| Audit | `society_audit_logs`: `society_id INT NOT NULL`, no FK on society, `actor_user_id` FK `SET NULL`, `action VARCHAR(40)`. |
| Tests | `tests/*.e2e.mjs` on a disposable local MySQL (`tests/helpers/localMysql.mjs`), and `node --test` in the app's `lib/__tests__`. |

## 3. Verified foreign-key map

How this was verified, twice:

1. The backend's own `initMysqlSchema()` plus every model `ensure*` function were run on a fresh throwaway MySQL 9.6 (loopback only, now stopped): 52 tables, 85 foreign keys.
2. **The database configured in the backend `.env`** (MariaDB 10.5.25, database `home_connect_db`) was audited read-only: the session was set to `READ ONLY`, and only `information_schema` was queried, so no row data was read and nothing was written. Result: the same 52 tables and 86 foreign keys, the 85 above plus `feed_comments.parent_comment_id` (`CASCADE`, so replies are removed with their parent comment). That migration needs MariaDB, which is why the MySQL 9.6 build lacked it. `order_history_archive` does not exist yet.

Every cascade statement below holds for the configured database.

**Parents this feature deletes and what hangs off them**

| Parent row deleted | Children (all `ON DELETE CASCADE` unless noted) |
|---|---|
| `feed_items` | `feed_options`, `feed_votes`, `feed_comments`, `feed_likes`, `feed_reports`, `feed_reviews`, `feed_rsvps` |
| `businesses` | `business_photos` only. Nothing else references it, so no order data hangs off it. |
| `business_listings` | `business_listing_catalogue`, `business_listing_reports`, `business_listing_reviews`, **`business_listing_orders`** |
| `daily_services` | pricing rates, reports, reviews, society links, user links, working hours |
| `users` | see below |

**`users` (the account being deleted)**

- `CASCADE`: `events.organizer_id` (and through `events`, its `feed_items` mirror, participants, comments, likes, join requests, reports, history, jobs), `businesses.user_id`, `society_admins.user_id`, every row the user authored or took part in (comments, likes, votes, RSVPs, reviews, reports filed, join requests, participants), `notifications`, `user_tokens`, `refresh_tokens`, `requests`, `user_reports` (both sides), `user_order_pointers`, **`business_listing_orders.user_id`**, **`wholesale_deal_orders.user_id`**.
- `SET NULL`: `feed_items.user_id`, `business_listings.user_id`, `wholesale_deals.user_id`, `daily_services.created_by`, `daily_service_reviews.created_by_admin_id`, `businesses.reviewed_by`, `reports.resolved_by`, `event_lifecycle_history.actor_id`, `event_reports.handled_by`, `society_admins.created_by`, `society_audit_logs.actor_user_id`.

**No foreign key at all (polymorphic or intentional)**

- `user_order_pointers.source_id` (the customer's "my orders" list) points at listings, deals or events by id only.
- `reports.target_id` (the unified admin report queue) points at its target by id only.
- `notifications` carry `entityId` in JSON.
- `society_audit_logs.society_id`.

**What this means for the design**

1. Posts, services and registered businesses cascade cleanly, with the two follow-ups below.
2. **Orders are the only historical records the cascades would destroy**: `business_listing_orders` (when a listing is deleted, or its customer is) and `wholesale_deal_orders` (when its customer is deleted). Section 6 handles them.
3. Deleting a business owner does **not** touch their listings, deals or directory entries (`SET NULL`), so orders received by those survive.
4. `user_order_pointers` survives a listing delete, because it has no FK. The customer's history list keeps its rows, but today they render without a title.
5. `reports` rows for a deleted target would become orphans: still open in the queue and invisible to society admins (their scope check joins through the target). Every delete in this design therefore closes open reports for its target in the same transaction (section 5).

## 4. Authorization model (backend)

Applies to every endpoint in section 7.

1. `authenticate` first. Missing or invalid token gives 401.
2. `authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)` on all admin routes. Guest, resident and business give 403.
3. Scope check against the record's own `society_id`, read from MySQL:
   - Super admin: always allowed.
   - Admin: allowed only if `society_id` is in `req.user.adminSocietyIds`.
   - A record with no society is super-admin only.
4. **A record that exists but is out of scope returns 403** (`requireSocietyAccess`). Unknown or malformed ids return 404 or 400. The existence check runs before the scope check, and both run before any write.
5. Society ids, roles and user ids are never read from the body, query or token claims.

### Extra rules for deleting users

- Nobody can delete their own account through this endpoint (403). Self-service stays on `DELETE /api/user/resident-account` and `DELETE /api/business/account`.
- A target who is a **super admin** or a **society admin** (a `society_admins` row) can be deleted only by a super admin.
- The last remaining super admin cannot be deleted (409).
- A society admin's reach over a target user is the same as the admin Users list: the target's `selected_society_id`, an administered society, or a non-draft business in a society the caller administers. This runs the exported `buildWhere` from `adminUsers.service.js` with `AND u.id = :id`, not new SQL.

## 5. Shared pieces (backend)

- **Responses:** new `src/utils/adminDeleteResponse.js` with one `ok()` / `fail()` pair that produces the shapes in section 7.
- **Audit:** `SOCIETY_AUDIT_ACTIONS` gets `ADMIN_DELETE_POST`, `ADMIN_DELETE_USER`, `ADMIN_DELETE_BUSINESS`, `ADMIN_DELETE_BUSINESS_LISTING`, `ADMIN_DELETE_REVIEW`, `ADMIN_DELETE_EVENT`. Metadata holds ids, entity type and display name only, never phone, email or document keys. A record with no society is logged to the console, not the table (same as the directory today).
- **Report queue:** every delete below closes the open reports for the targets it removes, inside its transaction: `UPDATE reports SET status='RESOLVED', resolved_at=NOW(), resolved_by=<actor> WHERE target_type=? AND target_id=? AND status IN ('PENDING','REVIEWING')`. Target types by delete: a post gives POST or POLL; a listing gives BUSINESS; a user gives USER, plus EVENT for events they organize and POST or POLL for their feed items. The directory purge already clears its own reports. **Known limit:** `COMMENT` reports whose comments disappear in a cascade are not auto-closed, because `reports.target_id` can mean a `feed_comments` or an `event_comments` id and a blind match could close an unrelated report. Today's owner-delete path has the same gap.
- **Owner notification:** the existing `sendToUser`, best-effort and never blocking the delete, only when the owner exists and is not the actor. The payload is `{ type: "ADMIN_CONTENT_REMOVED", removedType }` with no `entityType` or `entityId`, so the app opens the Notifications page and never deep-links to a deleted record. No app change is needed. Owners: post author, registered-business owner, listing owner, service creator (`created_by`, when set), review author. Events already notify through the cancel flow. Deleted users get none.
- **Files:** collected before the delete, removed after the transaction commits. Only values passing `isS3Key` or `isManagedUploadPath` are touched, so external URLs are left alone. A removal failure is logged and never fails the request.
- **Transactions:** every multi-table delete runs in one transaction with the target row locked (`SELECT ... FOR UPDATE`), like `deleteEntryPermanently`. Any error rolls everything back, including the archive writes in section 6.

## 6. Order history is preserved

**Approach: archive inside the delete transaction, with no change to existing tables or FKs.**

A new additive table `order_history_archive`, created by an `ensure*` function wired into `initMysqlSchema` (`CREATE TABLE IF NOT EXISTS`, which MariaDB 10.5 supports). Like `society_audit_logs`, it has no foreign keys on the data it records, on purpose, so it outlives the rows it describes.

| Column | Notes |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT` primary key |
| `source_type` | `ENUM('business','wholesale')` |
| `source_id` | listing or deal id, no FK |
| `source_title` | snapshot of the listing or deal title |
| `seller_user_id`, `seller_name` | snapshot, no FK |
| `customer_user_id`, `customer_name` | snapshot, no FK |
| `original_order_id` | id of the order row that was archived |
| `quantity`, `amount`, `status` | copied as they were (`status` as `VARCHAR(20)`, so order-status changes never break it) |
| `ordered_at`, `order_updated_at` | original timestamps |
| `delivery_address`, `delivery_contact_person`, `delivery_phone` | copied; the contact person is NULL for wholesale |
| `archive_reason` | `ENUM('listing_deleted','customer_deleted')` |
| `archived_by_user_id` | FK to `users`, `ON DELETE SET NULL`, like the audit table |
| `archived_at` | default `CURRENT_TIMESTAMP` |

Keys: `UNIQUE (source_type, original_order_id)`, so a row is archived at most once and re-runs are safe; indexes on `(source_type, source_id)` and `customer_user_id`.

**When it runs (always before the cascade, in the same transaction)**

- Deleting a **business listing**: every `business_listing_orders` row for it is archived (`listing_deleted`), then the listing is deleted.
- Deleting a **user**: every `business_listing_orders` and `wholesale_deal_orders` row where that user is the customer is archived (`customer_deleted`), then the user is deleted. Orders received by that user's listings and deals are untouched, because those parents survive (`SET NULL`).
- Deleting a registered business, post, service or review: nothing to archive (verified in section 3).

**What the customer sees**

`user_order_pointers` rows are left alone on a listing delete. `getOrderEnvelopes` in `orders.service.js` gets a small fallback: when a pointer's source row no longer exists, it reads the archive row for `(source_type, source_id, customer)` and fills `businessName` from `source_title`. `my-orders.tsx` already reads `businessName`, so the app needs no change.

**Privacy.** The archive holds delivery details. It is never returned by any API, only the title fallback above, and only to the customer who placed the order. A retention or purge policy is out of scope.

## 7. API contract

| | |
|---|---|
| Success | `200 { success: true, code: 200, message, data: { id, ... } }` |
| Failure | `{ success: false, code, message, error: message }` (both keys, matching `requireSocietyAccess`) |
| 400 | Malformed id, or an admin deleting an event feed row |
| 401 | No or invalid token (existing middleware body) |
| 403 | Role, scope (record exists but out of the caller's societies), or a protected target (self, admin, super admin) |
| 404 | Record not found. A second delete of the same record is a 404. |
| 409 | Last super admin |
| 500 | `Error deleting <entity>`. The transaction has rolled back and nothing was removed or archived. |

Routes in this change:

- `DELETE /api/feed/:feedId` (reused, extended)
- `DELETE /api/user/:userId` (reused, locked down)
- `DELETE /api/admin/directory/:id` and `.../:id/reviews/:reviewId` (reused, 404 becomes 403 for out-of-scope)
- `DELETE /api/admin/business/:businessId` (new)
- `DELETE /api/admin/business-listings/:id` (new)
- `DELETE /api/admin/business-listings/:id/reviews/:reviewId` (new)
- `DELETE /api/admin/feed/:feedId/reviews/:reviewId` (new, backend only)
- `DELETE /api/admin/events/:eventId` (new, completed events only, decision G)

## 8. Per-entity behavior

### 8.1 Services and directory reviews — reuse, status code corrected

`deleteDirectory` and `adminDeleteReview` already scope and delete permanently. They currently collapse "missing" and "out of scope" into one 404. Change: look the entry up without scope first (404 if absent), then apply scope (403 if out of the caller's societies). The existing rule that a society admin cannot delete a shared entry stays and is already a 403. The service creator is notified (section 5), and a review's author is notified when a review is deleted.

### 8.2 Posts and polls — reuse `DELETE /api/feed/:feedId`

- **Owner path:** unchanged, plus image cleanup. Both paths share one code path, so the owner's own delete now removes the post's image files as well.
- **Admin path:** a non-owner is allowed if admin or super admin and `existing.society_id` is in scope (section 4).
- A non-owner admin targeting `type = 'event'` gets 400 ("Events are cancelled, not deleted"). The owner path keeps its current behavior.
- The `feed_items` delete cascades per section 3. Open reports for the post are closed. The author is notified. Audit: `ADMIN_DELETE_POST` with the feed's `society_id`.

### 8.3 Events — no backend change

Admins use the existing `PATCH /api/events/:eventId/cancel` (organizer or in-scope admin, already 403 otherwise). It requires a title and reason, notifies participants and the organizer, and drops the event from feeds. The transition is refused for completed events, and another session's in-progress change keeps completed events on the Home feed, so completed events use the delete below (decision G, section 12).

**Completed events — new `DELETE /api/admin/events/:eventId`.** Allowed only when cancel would be refused: stored status `completed`, or `getEventPhase(row) === 'completed'` (explicit end time passed). Any other event gets 409 ("Use cancel for upcoming and ongoing events"). Scope: `events.society_id`; an event with no society is super-admin only. One transaction: lock the event row, close open `EVENT` reports, delete the row (participants, comments, likes, join requests, reports, history, jobs and the feed mirror cascade), write the audit row (`ADMIN_DELETE_EVENT`). After commit: remove the event's image files (`image_url` and the JSON list in `image_urls`). The organizer is notified when they are not the actor. No order archive is needed, because events carry no order rows.

### 8.4 Users — reuse `DELETE /api/user/:userId`, locked down

Route changes to `authenticate, authorize(ADMIN, SUPER_ADMIN)`. In the controller:

1. Resolve the target with the existing `findUserRowById`. Not found gives 404.
2. Apply section 4's extra rules (self, super admin, society admin, last super admin, scope).
3. Collect files: profile photo, `document_url`, `selfie_url`, the user's registered-business files (proof, logo, photos), and images of the user's feed items.
4. Cancel the target's active events through the existing lifecycle (`transitionEvent` "cancel") with the fixed reason "Organizer account was removed", so participants are notified before the row cascades away. Each cancel is best-effort.
5. One transaction: archive the user's customer-side orders (section 6), close open reports for the targets listed in section 5, delete the user's feed items (the FK is `SET NULL`, so this keeps today's behavior), delete the user row, write the audit row (`ADMIN_DELETE_USER`, society = the target's `selected_society_id`).
6. After commit: remove the files. The user's refresh tokens cascade, and their access token stops working at once because `loadAuthUser` finds no row.
7. Survives on purpose: listings and their orders, deals and their orders, and directory entries the user created (all `SET NULL`).

The response keeps today's top-level `feedsDeleted` and adds `data`.

### 8.5 Registered businesses — new `DELETE /api/admin/business/:businessId`

- Added to `admin.routes.js` next to the existing `/business/*` routes.
- Scope: `businesses.society_id`. A business with no society, such as an unsubmitted draft, is super-admin only. Any status can be deleted.
- Transaction: lock the row, collect the registration proof, logo and photos, delete the row (photos cascade), strip the `business` role from the owner only if they have no other `businesses` rows (same rule as `deleteAllBusinessesForUser`, falling back to `guest`), write the audit row.
- After commit: remove the files with the same logic as `removeStoredFile`. Notify the owner.

### 8.6 Business listings — new `DELETE /api/admin/business-listings/:id`

- Scope: `business_listings.society_id`.
- Transaction: lock the row, archive its orders (section 6), close open `BUSINESS` reports, delete the row (catalogue, reports and reviews cascade), write the audit row. After commit: remove image files on the listing and its catalogue rows. Notify the owner when `user_id` is set.
- Reported-content deletion for `BUSINESS` is unchanged.

### 8.7 Reviews

- **Business-listing review:** `DELETE /api/admin/business-listings/:id/reviews/:reviewId`. 404 if the review does not belong to the listing, scope via the listing's society, delete the row, and recompute `avg_rating` with the same formula as `addReview` (0 when none remain). The author is notified.
- **Event review:** `DELETE /api/admin/feed/:feedId/reviews/:reviewId`. Requires `type = 'event'`, and the review must belong to the feed. Scope via the feed's society. There is no stored aggregate to recompute. **Backend only; the app has no event-review screen and none is added.**
- **Directory (service) review:** section 8.1.
- Audit: `ADMIN_DELETE_REVIEW`.

## 9. Mobile app

Role and scope are enforced by the backend. The app only decides whether to show an action, using `usePermissions().hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])`. **No new screens.**

- **Confirmation:** `components/modals/ConfirmationModal.tsx` with `isDangerous`. Copy states what is deleted and that it cannot be undone. Confirm is disabled while the request runs, and a `createInFlightGuard` stops double taps.
- **Posts and polls:** `components/home/FeedList.tsx` shows Delete when the viewer is the owner or an admin, via the existing `useFeedsStore.removeFeed`.
- **Events:** `event-details.tsx` menu gets "Manage event" for admins, opening the existing `event-dashboard.tsx` flow with its title-and-reason cancel dialog. For a **completed** event the menu shows "Delete event" (danger, with the confirmation modal) instead, calling the new endpoint.
- **Users:** the existing "Remove User" row in `user-profile-screen.tsx` stays, and a helper hides it for the viewer's own profile and, for a society admin, for admin accounts. The backend still enforces it.
- **Services:** the `directory/service/[id].tsx` menu gets a danger row calling `DELETE /api/admin/directory/:id`.
- **Businesses:** the `directory/business/[id].tsx` menu gets a danger row for the business-listing endpoint. The stub in `user-business-screen.tsx` (the admin approved-business detail, which works on business-listing ids) calls the same endpoint. Registered businesses (the 7-step registrations, shown to admins on `admin-request-details.tsx` with `type=business`) get a danger "Delete business" button there, calling the registered-business endpoint.
- **Reviews:** `ReviewItem.tsx` gets a delete icon for admins (service and business-listing reviews), passed down through `CustomerReview.tsx`.
- **After success:** remove the item from the local store and go back from a detail screen. Errors show the backend `message` in a toast, and a 403 shows "You don't have permission".
- **Testable logic:** a small pure helper in `lib/` (`canAdminDelete`, `isProtectedUserTarget`, error-message mapping).

## 10. Testing

### Test environment and safety rules

The only database is the one in the backend `.env`: a remote MariaDB 10.5.25 that is treated as the shared development database. There is no separate local or live copy to fall back on, so these rules apply to every test that touches it.

- **Existing e2e scripts are never run against it.** Most of them wipe tables (`DELETE FROM` every table with `FOREIGN_KEY_CHECKS=0`), and several have no loopback guard at all (for example `directory.e2e.mjs`). Only the DB-free unit tests may run.
- **No schema init from tests.** `initMysqlSchema()` runs every `ensure*` DDL plus any one-time data migration not yet recorded in `_migrations` (for example `005_activate_only_configured_society` deactivates every society but one). All 15 existing migrations are recorded in the configured database (checked read-only), so a normal boot will not re-run them, but a migration another session adds would run on the next boot. Tests therefore never call it. They call only the single `ensure*` function for the new archive table.
- **Own fixtures only.** The new test creates its own societies, users and records with a unique run suffix, inserted by SQL as the existing `mk*` helpers do (no S3 or society provisioning). Every created row id is tracked.
- **Targeted cleanup only.** Cleanup deletes just the tracked ids, in `finally`, and each delete is gated on the row still carrying the run suffix. No bare `DELETE FROM <table>`, no `TRUNCATE` or `DROP`, no `FOREIGN_KEY_CHECKS=0`.
- **Explicit opt-in.** The script refuses to run unless `ADMIN_DELETE_TEST_CONFIRM` equals the configured database name. It prints the host, port and database (credentials never) before doing anything.
- **No real storage or push.** File-removal tests create temp files under the local upload root and assert they are removed. S3 removal is covered with a stub, because the `.env` AWS keys point at a real bucket. Fixture users have no push tokens, so nothing is sent to a device.
- **Rollback is tested without DDL.** The test wraps `pool.getConnection` so the final statement of a transaction throws, instead of installing a trigger on the shared schema.
- **DB-free unit tests** cover the pure logic (scope decisions, user-target guard, response shapes, archive row mapping, the app helper). They run anywhere, and the backend ones run with `DB_HOST` forced to a dead loopback port as a second safety net.

### Backend — new `tests/adminDelete.e2e.mjs`

Structured like `tests/adminUsers.e2e.mjs` and reusing its fixture helpers, but following the rules above instead of its `clear()` and `initMysqlSchema()` calls.

- **Roles:** no token gives 401. Guest, resident and business tokens give 403 on every endpoint in section 7. An owner still deletes their own post. A resident cannot delete another user's post (403).
- **Scope (403):** admin of society A deletes in A and gets 403 in B, with the record untouched. A super admin deletes in both. A no-society record is super-admin only. The directory service and review endpoints return 403, not 404, for an existing out-of-scope entry, and 404 for a missing one.
- **Posts:** cascade rows (comments, votes, likes) are gone. Image files are removed on **both** the owner and the admin path. An admin on an event feed row gets 400. Open reports for the post are RESOLVED. The author gets a notification.
- **Users:** the unauthenticated or regular-user call that works today now fails (regression for the hole). A society admin deletes an in-scope resident, gets 403 out of scope, and cannot delete an admin or super admin. Self-delete gives 403. Last super admin gives 409. A super admin deletes anyone else. Their feed items and tokens are gone, active events are cancelled with participants notified, and reports targeting them are closed.
- **Order history:**
  - Deleting a listing with orders leaves `business_listing_orders` empty for it and `order_history_archive` holding every row with the right snapshot and `listing_deleted`. The customer's `user_order_pointers` rows survive, and `getOrderEnvelopes` returns the archived title as `businessName`.
  - Deleting a customer archives their business and wholesale orders as `customer_deleted`. A deleted business owner's listings and the orders on them are unchanged.
  - Archiving twice does not duplicate rows.
- **Businesses and listings:** scope, cascade, `business` role stripped only when it was the owner's last business, second delete gives 404. A temporary file under the upload root is created and asserted removed.
- **Reviews:** deleted, `avg_rating` recomputed, a review belonging to a different parent gives 404, scope enforced. The event-review endpoint is covered too. The review author is notified.
- **Completed events:** an in-scope admin deletes a completed event (children and feed mirror gone, open EVENT reports closed, organizer notified). An upcoming or ongoing event gets 409. An out-of-scope or no-society event gives 403 for a society admin and succeeds for a super admin.
- **Invalid ids:** `abc`, `0`, `-1` and an unknown numeric id give 400 or 404 as in section 7.
- **Failure handling:** the wrapped connection (see the rules above) makes the last statement of the delete transaction throw. The test asserts a 500 with the standard shape, the parent row and its orders still present, and nothing written to `order_history_archive`.
- **Visibility:** after each delete, the feed list, admin dashboard counts and relevant GETs show no trace of the record.

### App — new `lib/__tests__/adminDelete.test.ts`

`node --test` via sucrase, like the existing tests: the role gate, the protected-user rule and error-message mapping. The screens cannot be exercised on a device here. The final report will say what was and was not run.

## 11. Safety and rollout

- The only database is the one configured in the backend `.env` (remote MariaDB 10.5.25, treated as the shared development database). Both `.env` files stay as they are.
- Nothing is deployed. Backend and app changes stay uncommitted until the user asks.
- The FK map in section 3 was checked against the configured database, read-only. The new `order_history_archive` table is created by the backend's normal boot-time `initMysqlSchema`, so **the first backend start after this change adds that table to the configured database**. It is additive (`CREATE TABLE IF NOT EXISTS`) and changes no existing table.
- **Re-check on 2026-10-25 (before implementation):** the other session's uncommitted work is an "event phase" feature (upcoming, ongoing, completed, cancelled): backend `event.controller.js`, `event.service.js`, `eventLifecycle.service.js`, `feed.controller.js`, `feed.service.js`, the untracked `tests/eventPhase.*.mjs`, and many app files (event screens, `useFeedsStore.ts`, `useHomeFeed.ts`, new `lib/eventPhase.ts` and `lib/feedCache.ts`). None of it edits `deleteFeed`, `removeUser`, the directory delete endpoints, the business or review code, or `FeedList.tsx`, so this design's edit points are unaffected, except `feed.controller.js` and `event-details.tsx`, which both designs touch and must be edited in place. Their `event.service.js` was modified minutes before this re-check, so it is still moving.
- **Concurrent edits:** at the time of writing, another session has uncommitted changes in files this design also edits. Backend: `src/controllers/feed.controller.js`, `event.controller.js`, `src/services/feed.service.js`, `event.service.js`, `eventLifecycle.service.js`. App: `app/(shared)/event-details.tsx`, `store/useFeedsStore.ts`, `hooks/useHomeFeed.ts`, `components/home/FeedActions.tsx`. Section 2 was read before some of those edits landed. The plan must start by re-reading these files at their current state, edit them in place without reverting or restaging anyone else's changes, and re-check the facts in section 2 that depend on them.
- Ship backend first. Old app builds keep working: the same admin-only user-delete endpoint now actually checks the caller.
- Breaking changes: `DELETE /api/user/:userId` returns 403 for non-admins (the app's only caller is the admin "Remove User" screen), and the two directory endpoints return 403 instead of 404 for out-of-scope entries.

## 12. Decisions and remaining assumptions

**Confirmed by the user**

1. Owners are notified of admin deletions, through the existing notification system.
2. Order history is preserved, not cascaded (section 6).
3. Post-image cleanup also works when the owner deletes their own post.
4. Event-review deletion is a backend endpoint only, with no new app screen.
5. Out-of-scope deletes return 403.

**Assumptions I made. Please confirm or change.**

A. The order archive is a new additive table instead of an ALTER of `business_listing_orders`. Relaxing its `NOT NULL` column and FK would keep rows in place, but it changes an existing table and drops and re-adds an FK on a live system.
B. User deletion also archives orders **placed by** the deleted user (as a customer), not only orders on a deleted listing. This is the same data-loss class, so I included it.
C. Customers who ordered from a deleted listing are not notified. Only owners are.
D. The archive keeps delivery address and phone with no purge date.
E. Notifications use the generic `ADMIN_CONTENT_REMOVED` type with no deep link, so the app needs no change.
F. Open reports on a deleted target are marked RESOLVED, not deleted, to keep the audit trail.

**Decision G — completed events: decided, option 1.** Another session's in-progress change keeps ongoing and completed events visible on the Home feed. Cancel is refused for a completed event (`transitionEvent` returns `COMPLETED`, also once an explicit end time has passed). So under "events use cancel", an admin has no way to remove a completed event, for example an abusive one, from the feed. Options:

1. **Recommended:** keep cancel for upcoming and ongoing events, and give admins a scoped permanent delete for events that cancel refuses (completed or ended). Same authorization, audit row and report-closing as the other deletes. No order archive is needed, because events carry no order rows. Participation history for that one event goes with it.
2. Allow an admin to cancel a completed event. This is the smallest change, but it breaks the other session's rule that completed events are frozen history.
3. Leave it. Admins cannot remove completed events.
