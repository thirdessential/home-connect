# Admin Scoped Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Society Admins (own societies only) and Super Admins permanently delete posts, polls, completed events, users, services, businesses and reviews, with backend-enforced scope, order history preserved, and delete actions on existing app screens.

**Architecture:** One service module per entity under `src/services/adminDelete/`, sharing a small support module (files, reports, audit, notification, transactions, scope). Existing delete endpoints (`DELETE /api/feed/:feedId`, `DELETE /api/user/:userId`, the directory ones) are extended in place; new `/api/admin/*` endpoints are added only where none exist. Controllers are thin. The app adds menu rows and icons to existing screens and new store actions.

**Tech Stack:** Backend: Express 5 (ESM), mysql2 pool with named placeholders, MariaDB 10.5.25 target, `node:test`. App: Expo Router, Zustand, React Native, `node --test` via sucrase.

**Spec:** `docs/superpowers/specs/2026-10-25-admin-scoped-delete-design.md` (approved 2026-10-25, assumptions A-F, decision G option 1).

**Repos and shorthand.** `BE` = `/Users/apple/Desktop/desktop/ganesh/office-wrok/github/new/home-connect-server`. `APP` = `/Users/apple/Desktop/desktop/ganesh/office-wrok/github/new/home-connect`. `NODE20` = `/Users/apple/.nvm/versions/node/v20.20.2/bin/node`. Paths in task headers are relative to the repo named in the task title.

## Global Constraints

- **No commits.** Steps contain no commit. Do not commit, stage, stash, reset, restore or checkout anything. Another session has uncommitted edits in `BE/src/controllers/feed.controller.js`, `event.controller.js`, `src/services/event.service.js`, `eventLifecycle.service.js`, `feed.service.js`, and in `APP/app/(shared)/event-details.tsx`, `store/useEventStore.ts`, `types/event.type.ts`, `store/useFeedsStore.ts`, `hooks/useHomeFeed.ts`. Re-read a file immediately before editing it and use targeted in-place edits; never rewrite a whole file that contains someone else's changes.
- **Never edit `.env` files. Never deploy.** MySQL only; no MongoDB, no Cloudinary.
- **Run backend scripts with `NODE20`** (the shell default is Node 16.17.1: no global `fetch`, too old for Express 5). App tests and `tsc` run with the default node.
- **Dev database safety.** The only database is the one in `BE/.env` (remote MariaDB `home_connect_db`, treated as the shared dev DB). Never run an existing `BE/tests/*.e2e.mjs` or `*.import-*`/`*.approve-*` script. Tests never call `initMysqlSchema()`. Tests create only their own fixtures (name prefix `ADT-<runSuffix>`, test societies `is_active = 0`), delete only tracked ids gated on that prefix, never run a bare `DELETE FROM`, `TRUNCATE`, `DROP` or `FOREIGN_KEY_CHECKS=0`, never touch the real S3 bucket, and need `ADMIN_DELETE_TEST_CONFIRM=<DB_NAME>`. DB-free unit tests run with `DB_HOST=127.0.0.1 DB_PORT=9`.
- **Authorization.** Role and society scope come only from `req.user` (built from MySQL). Existing record out of scope gives **403**; missing or malformed id gives 404 (or 400 where stated); a record with no society is super-admin only.
- **Response shape.** Success `200 { success: true, code: 200, message, data }`. Failure `{ success: false, code, message, error: message }` (both keys). 403 scope message: `You do not have permission to manage this society.` 500 message: `Error deleting <entity>` after rollback.
- **Deletes.** Permanent, using existing FK cascades. Every multi-table delete runs in one transaction with the row locked `SELECT ... FOR UPDATE`. Orders are archived to `order_history_archive` before the cascade. Open `reports` (`PENDING`, `REVIEWING`) for removed targets become `RESOLVED` with `resolved_by` = actor. Files are removed after commit, only values passing `isS3Key` or `isManagedUploadPath`; a removal failure never fails the request.
- **Audit.** Actions `ADMIN_DELETE_POST`, `ADMIN_DELETE_USER`, `ADMIN_DELETE_BUSINESS`, `ADMIN_DELETE_BUSINESS_LISTING`, `ADMIN_DELETE_REVIEW`, `ADMIN_DELETE_EVENT` (each at most 40 chars). Metadata holds ids, entity type and display name only. A record with no society is console-logged, not written.
- **Notification.** Existing `sendToUser`, payload `{ type: "ADMIN_CONTENT_REMOVED", removedType }` with no `entityType` or `entityId`; best-effort, skipped when the owner is null or is the actor.
- **App.** No new screens. Confirmation uses `ConfirmationModal` with `isDangerous`. The role gate is `usePermissions().hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])`; the backend is the authority. Every delete handler passes `isLoading` to the modal and wraps the call in `createInFlightGuard().run(<key>, ...)` (from `lib/inFlightGuard.ts`) so a double tap sends one request.

## Review Focus

Most likely first. Each line is pinned by a test in the named task.

1. Two deletes of the same record at once (double tap, retry after a timeout): exactly one 200 and one 404, no duplicate archive rows, no 500. (Task 7)
2. MariaDB returns `JSON` columns as strings, and image fields can be null, malformed, or external URLs: cleanup skips them silently and never touches foreign URLs. (Tasks 1 and 4)
3. A stale or demoted admin (admin role but no administered society), and records with no society or no owner: 403 or super-admin-only, and no notification attempt. (Tasks 4, 6, 9)
4. Id forms `1abc`, `0`, `-1`, `abc` and UUIDs: never coerced to row 1; 404 or 400. (Tasks 1, 6, 7)
5. `order_history_archive` missing (backend not restarted yet): a customer's "my orders" must still load. (Task 3)

## File Structure

**Backend (`BE`)**
- Create `src/utils/adminDeleteResponse.js`: `AdminDeleteError`, `ok`, `fail`, `sendDeleteError`.
- Create `src/services/adminDelete/support.js`: ids, files, reports, audit, notification, transaction, scope helpers.
- Create `src/models/orderArchiveSql.model.js` and `src/services/adminDelete/orderArchive.js`: the archive table and its writers/reader.
- Create `src/services/adminDelete/{posts,users,businesses,listings,reviews,directory,events}.js`: one entity each.
- Create `src/controllers/adminDelete.controller.js`: thin handlers for the new endpoints.
- Modify `src/utils/adminScope.js`, `src/models/societyAuditSql.model.js`, `src/database/initMysql.js`, `src/services/orders.service.js`, `src/controllers/feed.controller.js` (`deleteFeed` only), `src/controllers/user.controller.js` (`removeUser` only), `src/routes/user.routes.js`, `src/routes/admin.routes.js`, `src/controllers/adminDirectory.controller.js` (two handlers).
- Create tests: `tests/adminDelete.unit.mjs`, `tests/adminDelete.e2e.mjs`, `tests/helpers/devDbGuard.mjs`, `tests/helpers/adminDeleteFixtures.mjs`; create `docs/admin-delete-api.md`.

**App (`APP`)**
- Create `lib/adminDelete.ts`, `lib/__tests__/adminDelete.test.ts`.
- Modify stores `store/useBusinessStore.ts`, `store/useDailyHelper.ts`, `store/useAdminStore.ts`, `store/useUserStore.ts`, `store/useEventStore.ts` and their types.
- Modify UI `components/home/FeedList.tsx`, `components/UI/TitleHeader.tsx`, `components/reviews/ReviewItem.tsx`, `components/reviews/CustomerReview.tsx`, `app/(tabs)/profile/{user-profile-screen,user-business-screen,admin-request-details}.tsx`, `app/(tabs)/directory/service/[id].tsx`, `app/(tabs)/directory/business/[id].tsx`, `app/(shared)/event-details.tsx`.

---

## Backend

### Task 1: Response contract and shared support (BE)

**Files:** Create `src/utils/adminDeleteResponse.js`, `src/services/adminDelete/support.js`, `tests/adminDelete.unit.mjs`. Modify `src/utils/adminScope.js` (append), `src/models/societyAuditSql.model.js` (`SOCIETY_AUDIT_ACTIONS`: add the six actions, value equal to key).

**Interfaces — Produces:**
```js
// adminDeleteResponse.js
export class AdminDeleteError extends Error { constructor(status, message, extra = {}) } // .status, .extra
export const ok = (res, message, data = {}, extra = {}) => res        // 200 envelope; `extra` merged top-level
export const fail = (res, code, message, extra = {}) => res
export const sendDeleteError = (res, e, entity) => res                // AdminDeleteError -> its status; else console.error + 500
// adminScope.js
export const isAdminOrSuper = (req) => boolean                         // super_admin, or roles include "admin"
// support.js
export const toPositiveInt = (value) => number | null                  // only a positive integer or its pure-digit string
export const rolesOf = (row) => string[]                               // row.roles as array or JSON string; [] otherwise
export const collectStoredFiles = (...values) => string[]              // flatten arrays / JSON-array strings / scalars; trim; dedupe; keep isS3Key || isManagedUploadPath
export const removeStoredFiles = async (files, { removeS3 = removeSocietyS3Object, removeLocal = removeUploadedFile } = {}) => ({ removed, failed })
export const closeOpenReports = async (conn, targets /* [{type, id}] */, actorUserId) => number
export const recordAdminDeleteAudit = async (conn, { societyId, actorUserId, action, metadata }) => void
export const notifyOwner = async (ownerUserId, actorUserId, removedType, label, send = sendToUser) => boolean
export const withTx = async (fn /* (conn) => any */) => any            // getConnection, begin, commit; rollback on throw; always release
export const requireScope = (req, societyId) => void                   // throws AdminDeleteError(403, scope message)
```

- [ ] **Step 1: Write the failing tests** in `tests/adminDelete.unit.mjs` (`node:test`, no DB). Cases and assertions:
  - `toPositiveInt`: `"12"` and `12` give `12`; `"0"`, `"-1"`, `"abc"`, `"1abc"`, `"1.5"`, `["1"]`, `null` give `null`.
  - `collectStoredFiles('["services/5/a.jpg","/uploads/x/b.jpg","https://e.com/c.jpg"]', "services/5/a.jpg", null, "", 7, "not json {")` returns exactly `["services/5/a.jpg","/uploads/x/b.jpg"]`; an actual array input behaves the same; `collectStoredFiles(undefined)` returns `[]`.
  - `removeStoredFiles(["services/5/a.jpg","/uploads/x/b.jpg"], stubs)`: S3 stub called with the key, local stub with the path; a throwing S3 stub gives `{ removed: 1, failed: 1 }` and does not throw.
  - `notifyOwner`: owner `null` and owner equal to actor return `false` without calling `send`; a rejecting `send` returns `false`; success calls `send(ownerId, "Content removed", 'An admin removed your post: "Title".', { type: "ADMIN_CONTENT_REMOVED", removedType: "post" })` and returns `true` (no label gives `An admin removed your post.`).
  - `requireScope`: super admin with any id and with `null` passes; admin with `adminSocietyIds: [3]` passes for `3`, throws `AdminDeleteError` status 403 for `4` and for `null`.
  - `recordAdminDeleteAudit`: `societyId: null` makes no `conn.query` call; with a society it runs one INSERT whose params carry the action and JSON metadata.
  - `closeOpenReports` with a fake conn: no targets returns `0` with no query; two targets issue two UPDATEs (each constrained to `PENDING`/`REVIEWING`, `RESOLVED`, `resolved_by`) and the result sums `affectedRows`.
  - `ok`/`fail`/`sendDeleteError` produce the shapes in Global Constraints; a plain `Error` gives 500 `Error deleting thing`.
- [ ] **Step 2: Run to verify failure.** `cd BE && DB_HOST=127.0.0.1 DB_PORT=9 $NODE20 --test tests/adminDelete.unit.mjs` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the files and signatures above. `closeOpenReports` maps type to the `reports.target_type` enum values as given; `withTx` mirrors `withTx` in `src/services/directory.service.js`.
- [ ] **Step 4: Run to verify pass.** Same command — Expected: `# fail 0`.

### Task 2: Dev-DB e2e harness (BE)

**Files:** Create `tests/helpers/devDbGuard.mjs`, `tests/helpers/adminDeleteFixtures.mjs`, `tests/adminDelete.e2e.mjs`.

**Interfaces — Produces:**
```js
// devDbGuard.mjs
export const assertConfirmedDevDb = () => void   // throws unless ADMIN_DELETE_TEST_CONFIRM === DB_NAME; prints host:port/db (never credentials)
// adminDeleteFixtures.mjs
export const createFixtures = (pool, sfx) => ({
  society(label) => Promise<{ id, uuid }>,                                  // is_active = 0
  user(label, roles, { societyId = null } = {}) => Promise<{ id, token }>,  // full_name `ADT-${sfx} ${label}`, 24-hex mongo_id, phone +999..., token via generateToken({ _id: String(id), roles })
  makeSocietyAdmin(userId, societyId) => Promise<void>,                     // society_admins row
  count(table, whereSql, params) => Promise<number>,
  onCleanup(fn) => void,
  cleanup() => Promise<void>,   // targeted: users (gated on name LIKE 'ADT-%'), societies (same), society_audit_logs for tracked societies, then onCleanup hooks
})
```
`tests/adminDelete.e2e.mjs` mounts the real `admin.routes.js` at `/api/admin`, `feed.routes.js` at `/api/feed`, `user.routes.js` at `/api/user` with `express.json()`; exposes `call(method, path, user, body) => { s, b }`, `t(name, cond, extra)` (PASS/FAIL lines, failure counter), `group(name, fn)` (skipped unless `ADMIN_DELETE_ONLY` is unset or lists it; a throw is reported as FAIL), and always runs `cleanup()` in `finally`; exit code is 1 on any FAIL.

- [ ] **Step 1: Write the harness self-test group `harness`:** record `SELECT COUNT(*)` of users and societies whose names do not start with `ADT-`; create one society, a resident, a society admin (via `makeSocietyAdmin`) and a super admin; assert `count` sees them; run `cleanup()`; assert the test rows are gone and the non-`ADT-` counts are unchanged.
- [ ] **Step 2: Verify the guard.** `cd BE && $NODE20 tests/adminDelete.e2e.mjs` with the confirm variable unset — Expected: prints a refusal, exit code 2, and no database query was made.
- [ ] **Step 3: Implement** the helpers and the guard. Cleanup statements always include both `id IN (?)` and the `ADT-` name condition.
- [ ] **Step 4: Run the group.** `cd BE && ADMIN_DELETE_TEST_CONFIRM=home_connect_db ADMIN_DELETE_ONLY=harness $NODE20 tests/adminDelete.e2e.mjs` — Expected: all PASS, no FAIL, exit 0.

### Task 3: Order-history archive (BE)

**Files:** Create `src/models/orderArchiveSql.model.js`, `src/services/adminDelete/orderArchive.js`. Modify `src/database/initMysql.js` (call `ensureOrderHistoryArchiveTable()` right after `ensureUserOrderPointersTable()`, line ~231), `src/services/orders.service.js` (`getOrderEnvelopes`), `tests/helpers/adminDeleteFixtures.mjs`, `tests/adminDelete.e2e.mjs`.

**Interfaces — Produces:**
```js
// orderArchiveSql.model.js
export const ORDER_HISTORY_ARCHIVE_TABLE = "order_history_archive"
export const ensureOrderHistoryArchiveTable = async () => void            // CREATE TABLE IF NOT EXISTS; columns and keys exactly as spec section 6
// orderArchive.js
export const archiveListingOrders = async (conn, { listingId, actorUserId }) => number          // reason 'listing_deleted'; returns rows inserted
export const archiveCustomerOrders = async (conn, { customerUserId, actorUserId }) => ({ business, wholesale })  // reason 'customer_deleted'
export const getArchivedTitlesForCustomer = async (customerUserId) => Map<string, string>       // key `${source_type}:${source_id}` -> source_title; empty Map on ER_NO_SUCH_TABLE
// fixtures (added): listing(ownerId, societyId, { images }) -> id, order(listingId, customerId, { quantity, amount }) -> id, wholesaleOrder(...) -> id, pointer(customerId, 'business'|'wholesale', sourceId) -> void
```
`getOrderEnvelopes` change: for a `business` pointer whose listing row no longer exists, add `businessName` from the Map; nothing else changes.

- [ ] **Step 1: Write failing e2e group `archive`** (call `ensureOrderHistoryArchiveTable()` in setup; the archive cleanup hook deletes rows where `source_title LIKE 'ADT-%' OR customer_name LIKE 'ADT-%'`): inside `withTx`, `archiveListingOrders` for a listing with two orders inserts 2 rows with `archive_reason='listing_deleted'`, snapshot title/customer/seller names and original quantity, amount, status; running it again inserts 0 (unique key); `archiveCustomerOrders` archives a customer's business and wholesale orders as `customer_deleted` with the right counts; after the listing is deleted directly, `getOrderEnvelopes(customerId)` returns the pointer with `businessName` equal to the archived title; with `pool.query` temporarily replaced by a stub that throws `{ code: 'ER_NO_SUCH_TABLE' }` for any statement mentioning `order_history_archive` (and delegates otherwise), `getArchivedTitlesForCustomer` returns an empty Map and `getOrderEnvelopes` still resolves with the pointer and no `businessName`.
- [ ] **Step 2: Run to verify failure.** `cd BE && ADMIN_DELETE_TEST_CONFIRM=home_connect_db ADMIN_DELETE_ONLY=archive $NODE20 tests/adminDelete.e2e.mjs` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** model, wiring, service and the `getOrderEnvelopes` fallback. Archive writers use `INSERT ... SELECT` joining the order, the listing or deal, the customer and the seller, with `ON DUPLICATE KEY UPDATE id = id`.
- [ ] **Step 4: Run again** — Expected: group `archive` all PASS; then `ADMIN_DELETE_ONLY=harness` still PASS.

### Task 4: Posts and polls (BE)

**Files:** Create `src/services/adminDelete/posts.js`. Modify `src/controllers/feed.controller.js` (`deleteFeed` and its import block only; re-read the file first), `tests/helpers/adminDeleteFixtures.mjs` (add `post(userId, societyId, { type = 'post', images = null })` -> feed id), `tests/adminDelete.e2e.mjs`.

**Interfaces — Consumes:** Task 1 support, `getFeedRow`, `FEED_TYPE`. **Produces:** `deleteFeedAsActor = async (req, feedId) => ({ id, type, byAdmin, filesRemoved })`, throwing `AdminDeleteError`. Controller: `deleteFeed` calls it and answers `ok(res, "Feed deleted", { id })` or `sendDeleteError(res, e, "feed")`.

Rules: owner always allowed. A non-owner must satisfy `isAdminOrSuper(req)` (else 403 `You can only delete your own post`) and `requireScope(req, row.society_id)`; a non-owner admin on `type === 'event'` gets 400 `Events are cancelled, not deleted`. Transaction: lock the row (gone gives 404 `Feed not found`), `closeOpenReports` (`POLL` for polls, `POST` otherwise), delete, audit `ADMIN_DELETE_POST` only when `byAdmin`. After commit: `removeStoredFiles(collectStoredFiles(row.images))` on both paths; `notifyOwner(row.user_id, actor, type, row.title)` only when `byAdmin`.

- [ ] **Step 1: Write failing e2e group `posts`:** unauthenticated gives 401; guest, resident (non-owner) and business tokens give 403 on someone else's post; owner deletes own post (200, row gone, owner path writes no audit row); admin of society A deletes a society-A post (200, comments/votes/likes counts for it are 0, audit row `ADMIN_DELETE_POST` exists, author has a `notifications` row) and gets 403 for a society-B post whose row remains; super admin deletes the society-B post; stale admin (roles `["admin"]`, no `society_admins` row) gets 403; admin on an event feed row gets 400; open `reports` on the post become `RESOLVED` with `resolved_by` set; images `'["services/ADT/a.jpg","https://e.com/x.jpg"]'` as a JSON string, and a `null` and a malformed value, never throw (stub removers record that only the managed values were passed); a post whose author was deleted (`user_id` NULL) deletes cleanly with no notification; owner delete removes a temp file created under the upload root (`/uploads/...`); unknown id `999999999` and `abc` give 404; visibility: before the delete `GET /api/feed/getfeeds/<societyId>` includes the post (assert this first so the check is meaningful) and after the delete it no longer does.
- [ ] **Step 2: Run to verify failure.** `... ADMIN_DELETE_ONLY=posts ...` — Expected: FAIL (admin cases 403, owner file assertion).
- [ ] **Step 3: Implement** the service and edit `deleteFeed` in place.
- [ ] **Step 4: Run** — Expected: group `posts` all PASS.

### Task 5: Users (BE)

**Files:** Create `src/services/adminDelete/users.js`. Modify `src/routes/user.routes.js` (`router.delete("/:userId", authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), removeUser)`; add the two imports), `src/controllers/user.controller.js` (`removeUser` body only; drop imports that become unused), fixtures (add `event(organizerId, societyId, { status = 'active', endTime = null })` -> event id, `joinEvent(eventId, userId)`), `tests/adminDelete.e2e.mjs`.

**Interfaces — Consumes:** Tasks 1 and 3, `findUserRowById`, `buildWhere` (`adminUsers.service.js`), `transitionEvent` (`eventLifecycle.service.js`), `joinedUserIds`, `sendToUsers`, `listBusinessesByUser`, `listPhotos`. **Produces:**
```js
export const assertCanDeleteUser = async (req, target, { isSocietyAdmin, countSuperAdmins, inScope } = {}) => void  // injectable for unit tests
export const deleteUserAsAdmin = async (req, target) => ({ id, feedsDeleted, eventsCancelled, ordersArchived: { business, wholesale } })
```
`assertCanDeleteUser` order: self gives 403 `You cannot delete your own account here.`; target super admin or society admin and caller not super gives 403 `Only a super admin can delete an admin or super admin account.`; target super admin and `countSuperAdmins() <= 1` gives 409 `Cannot delete the last super admin`; non-super caller with `inScope()` false gives 403 (scope message). Default `inScope` runs `buildWhere({ scope: { ids: adminSocietyScope(req) }, superAdmin: false })` with `AND u.id = :id`.
`deleteUserAsAdmin`: collect files (user `profile_photo_url`, `document_url`, `selfie_url`, the user's `businesses` proof/logo/photos, images of their feed items); cancel the target's `active`/`closed` events with `transitionEvent(id, 'cancel', { cancelTitle: 'Event cancelled', cancelReason: 'Organizer account was removed', actorId })` and notify joined users with the same `sendToUsers` payload shape as `cancelEventController` (each best-effort); then one transaction: `archiveCustomerOrders`, `closeOpenReports` (`USER`; `EVENT` for their events; `POST`/`POLL` for their feed items), delete their `feed_items`, delete the user row, audit `ADMIN_DELETE_USER` with the target's `selected_society_id`; after commit remove files. Controller: 404 `User not found`; answers `ok(res, "User removed successfully", { id, ... }, { feedsDeleted })`.

- [ ] **Step 1: Write failing unit tests** in `tests/adminDelete.unit.mjs` for `assertCanDeleteUser` with injected deps: self; society admin vs super-admin target; society admin vs society-admin target; super vs super with count 1 (409) and count 2 (allowed); society admin out of scope (403) and in scope (allowed).
- [ ] **Step 2: Write failing e2e group `users`:** no token 401 and plain resident token 403 on deleting another user (the regression for today's open endpoint) with the target row still present; society admin deletes an in-scope resident (200; their feed items, tokens and notifications gone; audit row); out-of-scope resident gives 403 and remains; society admin gets 403 on an admin and on a super admin target; self gives 403; super admin deletes a resident from any society; unknown id 404; the target's upcoming event is `cancelled` and a joined participant has an `EVENT_STATUS` notification before the cascade, and the event row is gone afterwards; the target's customer orders are archived as `customer_deleted` while orders on the target's own listing survive; open `USER` reports on the target are `RESOLVED`; visibility: after the delete `GET /api/admin/users/<id>` as super admin returns 404.
- [ ] **Step 3: Run to verify failure.** Unit: `... --test tests/adminDelete.unit.mjs`; e2e: `... ADMIN_DELETE_ONLY=users ...` — Expected: FAIL.
- [ ] **Step 4: Implement** the service, route and controller edits.
- [ ] **Step 5: Run both** — Expected: unit `# fail 0`; group `users` all PASS.

### Task 6: Registered businesses (BE)

**Files:** Create `src/services/adminDelete/businesses.js`, `src/controllers/adminDelete.controller.js` (this task adds `run` and `adminDeleteBusiness`). Modify `src/routes/admin.routes.js` (`router.delete("/business/:businessId", adminOnly, adminDeleteBusiness)`, next to the other `/business` routes), fixtures (add `business(userId, societyId, { status = 'approved', logo, proof, photos })` -> id), `tests/adminDelete.e2e.mjs`.

**Interfaces — Produces:** `deleteBusinessAsAdmin = async (req, ref) => ({ id })`; controller helper `run(entity, fn)` where `fn(req)` returns `{ message, data }` and the wrapper answers `ok` or `sendDeleteError`. Uses `findBusinessById(ref)` (UUID or numeric), `listPhotos`.

Rules: missing gives 404 `Business not found`; `requireScope(req, business.society_id)` (no society means super-admin only); transaction: lock, collect `registration_proof`, `logo_url` and photo urls, `closeOpenReports` (none for this type), delete the row, strip `business` from the owner's roles only if no `businesses` rows remain (fall back to `guest` when no roles are left, as `deleteAllBusinessesForUser` does), audit `ADMIN_DELETE_BUSINESS`; after commit remove files and `notifyOwner(business.user_id, actor, 'business', business.business_name)`. Message `Business deleted`.

- [ ] **Step 1: Write failing e2e group `businesses`:** resident and business-role tokens 403; admin deletes an in-scope approved business (200; `business_photos` rows gone; owner loses the `business` role when it was their last, keeps it when they own a second; audit row; owner notification); out-of-scope gives 403 and remains; a draft business with no society gives 403 for the society admin and 200 for the super admin; UUID ref works; ids `1abc`, `0`, `-1`, `abc` give 404 and nothing is deleted (row count for the fixture business unchanged); second delete 404; a business owned by the acting admin deletes with no notification to themselves; a temp local file used as `logo_url` is removed.
- [ ] **Step 2: Run to verify failure** — `... ADMIN_DELETE_ONLY=businesses ...` — Expected: FAIL (route missing).
- [ ] **Step 3: Implement** the service, controller and route.
- [ ] **Step 4: Run** — Expected: group `businesses` all PASS.

### Task 7: Business listings (BE)

**Files:** Create `src/services/adminDelete/listings.js`. Modify `src/controllers/adminDelete.controller.js` (add `adminDeleteBusinessListing`), `src/routes/admin.routes.js` (`router.delete("/business-listings/:id", adminOnly, adminDeleteBusinessListing)`), `tests/adminDelete.e2e.mjs`.

**Interfaces — Consumes:** Tasks 1, 3, `getListingRow(ref)`, `listCatalogue`. **Produces:** `deleteListingAsAdmin = async (req, ref) => ({ id, ordersArchived })`.

Rules: missing 404 `Business listing not found`; `requireScope(req, listing.society_id)`; collect `images`, `profile_photo_url` and each catalogue row's `images`; transaction: lock, `archiveListingOrders`, `closeOpenReports` (`BUSINESS`), delete (catalogue, reports, reviews and orders cascade), audit `ADMIN_DELETE_BUSINESS_LISTING`; after commit remove files and notify the owner when `user_id` is set. Message `Business listing deleted`.

- [ ] **Step 1: Write failing e2e group `listings`:** admin deletes an in-scope listing with two orders (200); `business_listing_orders` for it is empty and `order_history_archive` holds both rows as `listing_deleted`; the customers' `user_order_pointers` rows survive and `getOrderEnvelopes` shows the archived `businessName`; catalogue, reviews and reports rows are gone; out-of-scope 403 and untouched; listing with NULL society 403 for society admin, 200 for super; owner NULL deletes without notification; **concurrency:** two simultaneous DELETEs on the same listing return exactly one 200 and one 404 and the archive holds exactly 2 rows; `1abc`, `0`, `-1`, `abc` give 404; open `BUSINESS` reports become `RESOLVED`; forced failure (wrap `pool.getConnection` so the statement that deletes the listing throws) gives 500 with the standard shape, the listing and its orders still present, and zero archive rows.
- [ ] **Step 2: Run to verify failure** — `... ADMIN_DELETE_ONLY=listings ...` — Expected: FAIL.
- [ ] **Step 3: Implement** the service, handler and route.
- [ ] **Step 4: Run** — Expected: group `listings` all PASS.

### Task 8: Reviews and directory status codes (BE)

**Files:** Create `src/services/adminDelete/reviews.js`, `src/services/adminDelete/directory.js`. Modify `src/controllers/adminDelete.controller.js` (add `adminDeleteListingReview`, `adminDeleteEventReview`), `src/routes/admin.routes.js` (`DELETE /business-listings/:id/reviews/:reviewId`, `DELETE /feed/:feedId/reviews/:reviewId`), `src/controllers/adminDirectory.controller.js` (`deleteDirectory`, `adminDeleteReview` only), fixtures (add `listingReview`, `feedReview`, `directoryEntry`, `directoryReview` helpers), `tests/adminDelete.e2e.mjs`.

**Interfaces — Produces:**
```js
// reviews.js
export const deleteListingReviewAsAdmin = async (req, listingRef, reviewId) => ({ id, avgRating, totalReviews })
export const deleteEventReviewAsAdmin = async (req, feedRef, reviewId) => ({ id })
// directory.js
export const getServiceOwnerInfo = async (directoryId) => ({ ownerId, name }) | null     // daily_services.created_by, name
export const getReviewAuthorId = async (directoryId, reviewId) => number | null
```
Rules: listing review: 404 if listing or review missing or the review belongs to another listing (`Review not found`), `requireScope` on the listing's society, delete, recompute `avg_rating` with the same formula as `addReview` in `businessListing.service.js` (0 when none remain), audit `ADMIN_DELETE_REVIEW`, notify the review author. Event review: feed id resolved with `resolveRefToId("feed_items", ref)`, requires `type === 'event'`, same pattern, no aggregate. Directory: in `deleteDirectory` and `adminDeleteReview`, first `getEntry(id, null)` (404 `Directory entry not found` if absent), then `getEntry(id, adminSocietyScope(req))` and respond 403 with the scope message when it returns null; also notify the service creator (`getServiceOwnerInfo`, read before the delete) and the review author (`getReviewAuthorId`, read before the delete) via `notifyOwner`.

- [ ] **Step 1: Write failing e2e group `reviews`:** listing review delete 200, `avg_rating` recomputed (two reviews 5 and 3 -> delete the 5 -> avg 3.00; delete the last -> 0), review of another listing gives 404, out-of-scope 403, author notified, audit row; event review delete 200 for a type `event` feed and 400 or 404 for a non-event feed; directory service delete by a society admin returns **403** (not 404) for an existing out-of-scope entry, 404 for a missing id, 200 in scope, with the creator notified; directory review delete returns 403 out of scope, 404 for a missing review, 200 in scope; resident token 403 on all four; ids `abc`, `0`, `-1` give 404.
- [ ] **Step 2: Run to verify failure** — `... ADMIN_DELETE_ONLY=reviews ...` — Expected: FAIL.
- [ ] **Step 3: Implement** services, handlers, routes and the two controller edits.
- [ ] **Step 4: Run** — Expected: group `reviews` all PASS.

### Task 9: Completed events (BE)

**Files:** Create `src/services/adminDelete/events.js`. Modify `src/controllers/adminDelete.controller.js` (add `adminDeleteEvent`), `src/routes/admin.routes.js` (`router.delete("/events/:eventId", adminOnly, adminDeleteEvent)`, next to `router.get("/events", ...)`), `tests/adminDelete.e2e.mjs`.

**Precondition:** re-read `src/services/event.service.js` and confirm it exports `getEventRow`, `getEventPhase` and `EVENT_PHASE` (another session's work). If not, stop and report.

**Interfaces — Produces:**
```js
export const isCancelRefused = (row, { now } = {}) => boolean   // row.status === completed || getEventPhase(row, { now }) === 'completed'
export const deleteCompletedEventAsAdmin = async (req, eventRef) => ({ id })
```
Rules: `getEventRow(ref)` missing gives 404 `Event not found`; `requireScope(req, row.society_id)`; not `isCancelRefused` gives 409 `Only completed events can be deleted. Cancel upcoming and ongoing events instead.`; collect `image_url` and the JSON list in `image_urls`; transaction: lock, `closeOpenReports` (`EVENT`), delete (children and feed mirror cascade), audit `ADMIN_DELETE_EVENT`; after commit remove files; `notifyOwner(row.organizer_id, actor, 'event', row.title)`. Message `Event deleted`.

- [ ] **Step 1: Write failing tests.** Unit (in `tests/adminDelete.unit.mjs`): `isCancelRefused` is true for status `completed`, true for an active event whose explicit end time is in the past (pass `now`), false for upcoming, ongoing-without-end and `cancelled`. E2E group `events`: in-scope admin deletes a completed event (200; participants, comments and the `feed_items` mirror gone; open `EVENT` reports `RESOLVED`; organizer notified); upcoming event gives 409 and remains; cancelled gives 409; out-of-scope 403; no-society event 403 for society admin and 200 for super; UUID and numeric refs work; `1abc`, `0`, `abc` give 404; resident 403.
- [ ] **Step 2: Run to verify failure** — unit and `... ADMIN_DELETE_ONLY=events ...` — Expected: FAIL.
- [ ] **Step 3: Implement** the service, handler and route.
- [ ] **Step 4: Run** — Expected: unit `# fail 0`; group `events` all PASS.

### Task 10: Backend wrap-up (BE)

**Files:** Create `docs/admin-delete-api.md`. Modify nothing else.

- [ ] **Step 1: Document** every route in the spec's section 7 table (method, path, who may call, scope rule, success and error codes, side effects) in `docs/admin-delete-api.md`; note that the first backend start creates `order_history_archive`.
- [ ] **Step 2: Full backend run.** `cd BE && DB_HOST=127.0.0.1 DB_PORT=9 $NODE20 --test tests/adminDelete.unit.mjs tests/eventRegistration.unit.mjs tests/societyTowers.unit.mjs` — Expected: `# fail 0`. Then `ADMIN_DELETE_TEST_CONFIRM=home_connect_db $NODE20 tests/adminDelete.e2e.mjs` — Expected: no FAIL lines, exit 0, and the harness's before/after non-`ADT-` row counts equal.
- [ ] **Step 3: Load check, not a boot.** `cd BE && DB_HOST=127.0.0.1 DB_PORT=9 $NODE20 -e "import('./src/database/initMysql.js').then(() => import('./src/routes/admin.routes.js')).then(() => console.log('modules load'))"` — Expected: prints `modules load` (this imports the wiring without running `initMysqlSchema`, which would run any unrecorded one-time migration on the shared DB). Do not start the server; the user's own backend creates `order_history_archive` on its next normal start.

---

## App

### Task 11: Permission helpers (APP)

**Files:** Create `lib/adminDelete.ts`, `lib/__tests__/adminDelete.test.ts`.

**Interfaces — Produces** (relative imports only, so `node --test` can load it):
```ts
export const canAdminDelete = (roles?: readonly string[] | null) => boolean            // admin or super_admin
export const isProtectedUserTarget = (a: { viewerId?: string | null; viewerRoles?: readonly string[] | null; targetId?: string | null; targetRoles?: readonly string[] | null }) => boolean
export const adminDeleteErrorMessage = (err: { status?: number; message?: string } | undefined, fallback: string) => string
export const isCompletedEvent = (phase?: string | null) => boolean                      // phase === "completed"
```
`isProtectedUserTarget` is true when viewer equals target, or the target holds `super_admin`/`admin` and the viewer lacks `super_admin`. `adminDeleteErrorMessage`: 403 gives `You don't have permission to delete this.`; 404 gives `This item no longer exists.`; otherwise `err.message` or the fallback.

- [ ] **Step 1: Write failing tests** covering: roles `["resident"]`, `["guest"]`, `undefined` give false and `["admin"]`, `["super_admin","resident"]` give true; protected target for self, for admin target seen by society admin, for super target seen by society admin; not protected for resident target seen by admin and admin target seen by super admin; the four error-message cases; `isCompletedEvent("completed")` true and others false.
- [ ] **Step 2: Run** `cd APP && npm test` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `lib/adminDelete.ts`.
- [ ] **Step 4: Run** `cd APP && npm test` — Expected: all files pass, `# fail 0`.

### Task 12: Store actions (APP)

**Files:** Modify `store/useBusinessStore.ts`, `store/useDailyHelper.ts`, `store/useAdminStore.ts`, `store/useUserStore.ts`, `store/useEventStore.ts` and their state types (`types/business.type.ts` for `ProductStore` and `DailyHelperStore`; the type blocks inside the other stores; `types/event.type.ts` if the event store type lives there). Re-read `useEventStore.ts` and `types/event.type.ts` first (other session's edits); make additive edits only.

**Interfaces — Produces** (all use `Delete` from `@/lib/httpMethods`, **throw** on failure so screens can toast via `adminDeleteErrorMessage`, and prune local state on success):
```ts
useProductStore:     deleteBusinessListing(id: string): Promise<void>                      // DELETE /api/admin/business-listings/:id ; prunes productList, userProducts, product, businessReviews[id]
                     deleteBusinessListingReview(listingId: string, reviewId: string): Promise<void>   // DELETE /api/admin/business-listings/:listingId/reviews/:reviewId ; prunes businessReviews[listingId]
useDailyHelperStore: adminDeleteService(id: string): Promise<void>                         // DELETE /api/admin/directory/:id ; prunes dailyHelperList, dailyHelper
                     adminDeleteServiceReview(serviceId: string, reviewId: string): Promise<void>      // DELETE /api/admin/directory/:serviceId/reviews/:reviewId ; prunes that service's reviews
useAdminStore:       deleteRegisteredBusiness(ref: string): Promise<void>                  // DELETE /api/admin/business/:ref
                     removeApprovedBusiness(id: string): void                              // local prune of approvedContent.businesses.items
useEventStore:       adminDeleteEvent(eventRef: string | number): Promise<void>            // DELETE /api/admin/events/:ref ; clears currentEvent when it matches
```
Also change `useUserStore.deleteUser` to **rethrow** (set `error`, then `throw`), and to throw `new Error(response?.message || "Failed to delete user")` on a non-success response; its only other caller, `components/common/ReportedContentsView.tsx`, is not imported anywhere.

- [ ] **Step 1: Implement** the actions and type entries.
- [ ] **Step 2: Typecheck.** `cd APP && npx tsc --noEmit` — Expected: no errors in the touched files (the existing `components/UI/Label.tsx` error and anything under files owned by the other session are not yours).
- [ ] **Step 3: `cd APP && npm test`** — Expected: `# fail 0`.

### Task 13: Posts and polls UI (APP)

**Files:** Modify `components/home/FeedList.tsx`.

Behavior: `FeedList` calls `usePermissions()` and computes `isAdmin = canAdminDelete(roles)`; `canDeleteActive` becomes `(item.isOwner || isAdmin)` and `kind` is `post` or `poll`; the confirm message becomes `Are you sure you want to delete this post? This cannot be undone.` (and `poll`). The existing `deleteItem` path is unchanged: `useHomeFeed.deleteItem` throws with `store.error`, which already reaches the toast in `handleConfirmDelete`; a 403 shows `You don't have permission to delete this.` by passing the caught error through `adminDeleteErrorMessage(e, "Failed to delete. Please try again.")`.

- [ ] **Step 1: Implement** in place; no change to `hooks/useHomeFeed.ts`.
- [ ] **Step 2: Typecheck and test** `cd APP && npx tsc --noEmit && npm test` — Expected: no new errors; `# fail 0`.

### Task 14: Users UI and shared header fixes (APP)

**Files:** Modify `components/UI/TitleHeader.tsx`, `app/(tabs)/profile/user-profile-screen.tsx`.

Behavior:
- `TitleHeader`: `handleOptionSelect`'s `useCallback` deps change from `[]` to the callbacks it reads (`onRemoveUser`, `onRemovePost`, `onReportPost`, `onReportUser`, `onShare`, `onCancelEvent`, `onEditEvent`, `onToggleAdminRole`, `userId`), because a first-render closure would otherwise keep a stale or undefined handler. Add an optional prop `removePostLabel?: string` (default `Remove Post`) used for the "Remove Post" row text, and add it to the `areEqual` comparator.
- `user-profile-screen.tsx`: read `usePermissions().roles` and the current user id; compute `canRemoveTarget = canAdminDelete(roles) && !isProtectedUserTarget({ viewerId, viewerRoles: roles, targetId: userId, targetRoles: selectedUser?.roles })`; pass `onRemoveUser={canRemoveTarget ? handleRemoveUser : undefined}`; because `deleteUser` now throws, `handleConfirmDelete`'s existing `catch` shows the error and a failed delete no longer shows "Success".

- [ ] **Step 1: Implement** both edits in place.
- [ ] **Step 2: Typecheck and test** — Expected: no new errors; `# fail 0`.

### Task 15: Services, businesses and reviews UI (APP)

**Files:** Modify `components/reviews/ReviewItem.tsx`, `components/reviews/CustomerReview.tsx`, `app/(tabs)/directory/service/[id].tsx`, `app/(tabs)/directory/business/[id].tsx`, `app/(tabs)/profile/user-business-screen.tsx`, `app/(tabs)/profile/admin-request-details.tsx`.

Behavior:
- `ReviewItem` gets optional `onDelete?: () => void` rendering a small trash icon button in the header row only when provided. `CustomerReview` gets optional `onDeleteReview?: (review: Review) => void` and passes `onDelete` per review only when `review._id` exists; add `onDeleteReview` to its `React.memo` comparator or it is ignored.
- `service/[id].tsx`: for admins, a danger "Delete Service" row in the existing options `FormSheetModal` opens a `ConfirmationModal` (`isDangerous`) that calls `adminDeleteService(selectedService._id)`, then `router.back()`; `onDeleteReview` opens a confirmation that calls `adminDeleteServiceReview(selectedService._id, review._id)`. Include the new handler and admin flag in the `reviewsSection` `useMemo` deps. Errors toast through `adminDeleteErrorMessage`.
- `business/[id].tsx`: for admins pass `onRemovePost={confirmDeleteBusiness}` and `removePostLabel="Delete Business"` to `TitleHeader` (undefined for non-admins, so the row stays hidden), confirm, call `deleteBusinessListing(businessId)`, then `router.back()`; reviews as for services using `deleteBusinessListingReview`, adding the handler to the `reviewsSection` deps.
- `user-business-screen.tsx`: replace the `console.log` stub: the options row (renamed "Delete Business", shown only when `canAdminDelete(roles)`) opens a `ConfirmationModal`, calls `deleteBusinessListing(businessId)` then `useAdminStore.getState().removeApprovedBusiness(businessId)`, then `router.back()`.
- `admin-request-details.tsx`: when `type === "business"` and the viewer `canAdminDelete`, add a danger `ActionButton` "Delete business" below the details, with a `ConfirmationModal`, calling `deleteRegisteredBusiness(data.businessId ?? id)` then `router.back()`.

- [ ] **Step 1: Implement** the six edits in place.
- [ ] **Step 2: Typecheck and test** — Expected: no new errors; `# fail 0`.

### Task 16: Events UI (APP)

**Files:** Modify `app/(shared)/event-details.tsx` (re-read first; the other session edits this file; additive edits only).

Behavior: import `usePermissions` and `canAdminDelete`/`isCompletedEvent`; `isAdmin = canAdminDelete(roles)`. In the existing ⋮ menu, for `isAdmin && !isCreator`: when `isCompletedEvent(phase)` show a danger "Delete event" row that opens a `ConfirmationModal` (`isDangerous`, copy: permanently deletes the event and its participation history, cannot be undone) calling `useEventStore.getState().adminDeleteEvent(eventId)` then `router.back()`; otherwise, when `e.status !== "cancelled"`, show "Manage event" that does `router.push({ pathname: "/(shared)/event-dashboard", params: { eventId } })`. Errors toast through `adminDeleteErrorMessage`. No change to the participant or organizer rows.

- [ ] **Step 1: Implement** in place.
- [ ] **Step 2: Typecheck and test** — Expected: no new errors; `# fail 0`.

### Task 17: Final verification (both repos)

- [ ] **Step 1: App.** `cd APP && npm test` — Expected: `# fail 0`. `npx tsc --noEmit` — Expected: no errors in files this plan touched; list any remaining errors and who owns them.
- [ ] **Step 2: Backend.** Repeat Task 10 Step 2 and report the actual pass and fail counts; note that `tests/eventPhase.unit.mjs` belongs to the other session and its pre-existing failing case is not part of this work.
- [ ] **Step 3: Confirm nothing foreign was touched.** `git status --short` and `git diff --stat` in both repos: every file this plan lists as modified is expected; every other modified or untracked file belongs to another session and must be byte-for-byte unchanged by this work.
- [ ] **Step 4: Report** actual results, what was not run (ESLint cannot start; no device run), and this manual checklist for the user's device: admin deletes a post, a poll, a service, a business and a review; "Remove User" is hidden on self and (for a society admin) on admins; a completed event shows "Delete event" and an upcoming one shows "Manage event"; a society admin gets the permission message on another society's item.

---

## Amendment A (2026-10-26): admin delete on the Home feed cards

User request "Fix Admin Delete Options on All Home Feed Cards". It is a prioritized subset of this plan plus four app tasks (18-21). Run order: Task 4, Task 9, then Tasks 18, 19, 20, 21, then a Home-scope verification (Task 17 trimmed to what was built); the remaining plan tasks resume afterwards.

**Verified root cause.** (1) `components/home/FeedList.tsx:61-65` computes `canDeleteActive = !!item.isOwner && (kind === "post" || kind === "poll")`, so an admin who is not the creator never gets Delete, and events are excluded outright (its comment says event deletion was out of scope). (2) `hooks/useHomeFeed.ts` `deleteItem` can only call `useFeedsStore.removeFeed` -> `DELETE /api/feed/:feedId`, which is owner-only on the backend (`deleteFeed`: 403 `You can only delete your own post`). (3) There is no admin path for completed events (cancel is refused). (4) The Home feed contains no service cards: `HomeFeedKind` is `"event" | "post" | "poll"`; services are managed on `app/(tabs)/directory/service/[id].tsx`.

**Rulings.**
- R12 For upcoming and ongoing events the Home Delete calls the existing cancel endpoint with fixed details (`title: "Event cancelled by admin"`, `reason: "This event was removed by a society admin."`), because the backend requires both fields and the request asks for a plain confirmation popup; an admin who wants a custom reason uses "Manage event" (event dashboard). Participants are still notified by the existing cancel flow.
- R13 UI visibility is role-based (`admin` or `super_admin` from `usePermissions`); the backend decides scope per record and answers 403 outside the admin's society, which the app shows as a toast. Event owners who are not admins keep their existing flow (no Delete on the Home event card).
- R14 The deleted card is removed from the Home store only after the server confirms success (no optimistic removal, so no rollback is needed); the persisted feed cache is pruned in the same step.

### Task 18: Home delete rules (APP)

**Files:** Create `lib/adminDelete.ts` and `lib/__tests__/adminDelete.test.ts` (this task also delivers everything Task 11 specifies).

**Interfaces — Produces** (relative imports only):
```ts
// Task 11 exports, unchanged:
export const canAdminDelete = (roles?: readonly string[] | null) => boolean
export const isProtectedUserTarget = (a: { viewerId?: string | null; viewerRoles?: readonly string[] | null; targetId?: string | null; targetRoles?: readonly string[] | null }) => boolean
export const adminDeleteErrorMessage = (err: { status?: number; message?: string } | undefined, fallback: string) => string
export const isCompletedEvent = (phase?: string | null) => boolean
// new:
export const ADMIN_EVENT_CANCEL_TITLE = "Event cancelled by admin"
export const ADMIN_EVENT_CANCEL_REASON = "This event was removed by a society admin."
export type HomeDeleteMode = "feed" | "event-cancel" | "event-delete"
export type HomeDeleteOption = { mode: HomeDeleteMode; menuLabel: string; confirmTitle: string; confirmMessage: string; successTitle: string }
export const homeDeleteOption = (item: { kind: string; eventPhase?: string | null; isOwner?: boolean }, who: { isAdmin: boolean }) => HomeDeleteOption | null
```
`homeDeleteOption` rules and exact copy: `post` shows for owner or admin: mode `feed`, menuLabel `Delete Post`, confirmTitle `Delete Post?`, confirmMessage `Are you sure you want to delete this post? This action cannot be undone.`, successTitle `Post Deleted`; `poll` identical with `poll`/`Poll`. `event` shows only for admins: phase `cancelled` gives `null`; phase `completed` gives mode `event-delete`, menuLabel `Delete Event`, confirmTitle `Delete Event?`, confirmMessage `This permanently deletes the event and its participation history. This action cannot be undone.`, successTitle `Event Deleted`; any other phase (`upcoming`, `ongoing`, missing) gives mode `event-cancel` with the same label/title/success and confirmMessage `Are you sure you want to delete this event? Registered participants will be notified that it was cancelled. This action cannot be undone.`. Any other kind gives `null`. The constants above must satisfy the backend limits (title at most 70, reason at most 300 characters).

- [ ] **Step 1: Write failing tests** for every Task 11 case (roles `["resident"]`, `["guest"]`, `undefined` false and `["admin"]`, `["super_admin","resident"]` true; protected targets: self, admin target seen by a society admin, super target seen by a society admin; not protected: resident target seen by admin, admin target seen by super admin; the four error-message cases `403` -> `You don't have permission to delete this.`, `404` -> `This item no longer exists.`, other status -> its `message`, none -> fallback; `isCompletedEvent("completed")` true and `"upcoming"`, `undefined` false) plus: `homeDeleteOption` returns `null` for a non-owner resident on a post, a poll and an event, and for an event owner who is not an admin; mode `feed` for an owner post, an admin on someone else's post and poll; for an admin on events: `ongoing`, `upcoming` and missing phase give `event-cancel`, `completed` gives `event-delete`, `cancelled` gives `null`; the exact strings above; unknown kind gives `null`; the two constants' lengths are within 70 and 300.
- [ ] **Step 2: Run** `cd APP && npm test` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `lib/adminDelete.ts`.
- [ ] **Step 4: Run** `cd APP && npm test` — Expected: all files pass, `# fail 0`.

### Task 19: Store actions for Home deletes (APP)

**Files:** Modify `store/useEventStore.ts`, `store/useFeedsStore.ts`, `store/useDailyHelper.ts`, `types/feeds.type.ts`, `types/business.type.ts` (the `DailyHelperStore` interface only) and the event store's state type. Re-read each first: `useEventStore.ts`, `useFeedsStore.ts` and `types/feeds.type.ts` carry another session's uncommitted edits; make additive edits only.

**Interfaces — Produces** (new actions use `Delete` from `@/lib/httpMethods`, **throw** on failure so screens can toast via `adminDeleteErrorMessage`, and change local state only after the server confirmed):
```ts
useEventStore.adminDeleteEvent(eventRef: string | number): Promise<void>      // DELETE /api/admin/events/:eventRef ; clears currentEvent when it matches
useFeedsStore.pruneFeedLocal(match: { feedId?: string; eventId?: string | number }): void   // removes from `feeds` and `feedsByUser` by feed _id or by mysqlEventId; persisted cache follows
useDailyHelperStore.adminDeleteService(id: string): Promise<void>             // DELETE /api/admin/directory/:id ; prunes dailyHelperList and clears dailyHelper when it matches
```

- [ ] **Step 1: Implement** the three actions and their type entries (each interface gets the new member).
- [ ] **Step 2: Typecheck.** `cd APP && npx tsc --noEmit` — Expected: no errors in the touched files (the existing `components/UI/Label.tsx` error and files owned by the other session are not yours).
- [ ] **Step 3: `cd APP && npm test`** — Expected: `# fail 0`.

### Task 20: Admin Delete on the Home cards (APP)

**Files:** Modify `components/home/FeedList.tsx`, `hooks/useHomeFeed.ts` (the `deleteItem` action only; another session has uncommitted edits here, re-read it first and edit in place). No change to the card components.

Behavior:
- `FeedList` calls `usePermissions()` and builds `isAdmin = canAdminDelete(roles)`. For the item whose ⋮ is open, `option = homeDeleteOption(item, { isAdmin })`; when `option` is not `null` the menu gets a danger row with `option.menuLabel`. `deleteTarget` keeps `{ id, kind }` and the `ConfirmationModal` takes `title = option.confirmTitle`, `message = option.confirmMessage`, `successTitle = option.successTitle` (success copy `It has been removed from the feed.`), `confirmText="Delete"`, `cancelText="Cancel"`, `isDangerous`, `isLoading={deleting}`. Cancel makes no request. A `createInFlightGuard` around the confirm handler keeps a double tap to one request. Errors are toasted with `adminDeleteErrorMessage(e, "Failed to delete. Please try again.")` and rethrown so the modal stays open and the card stays.
- `useHomeFeed.deleteItem(id)`: look the item up in `realItems`; for `kind === "event"`: if `mysqlEventId` is missing throw `This event cannot be deleted from here.`; if `eventPhase === "completed"` call `useEventStore.getState().adminDeleteEvent(mysqlEventId)`, otherwise `useEventStore.getState().cancelEvent(mysqlEventId, { title: ADMIN_EVENT_CANCEL_TITLE, reason: ADMIN_EVENT_CANCEL_REASON })`; only after it resolves call `useFeedsStore.getState().pruneFeedLocal({ feedId: id })`. Posts and polls keep the existing `removeFeedApi` path unchanged. The dummy layer is untouched.

- [ ] **Step 1: Implement** in place.
- [ ] **Step 2: Typecheck and test.** `cd APP && npx tsc --noEmit && npm test` — Expected: no new errors in touched files; `# fail 0`.

### Task 21: Event and service detail menus (APP)

**Files:** Modify `app/(shared)/event-details.tsx` (re-read first; other session's edits; additive only), `app/(tabs)/directory/service/[id].tsx`.

Behavior:
- `event-details.tsx`: import `usePermissions`, `canAdminDelete`, `homeDeleteOption`, `adminDeleteErrorMessage`, the two constants. For `isAdmin && !isCreator`, in the existing ⋮ menu: `option = homeDeleteOption({ kind: "event", eventPhase: phase }, { isAdmin })`; when not `null` add a danger "Delete Event" row opening the existing `ConfirmationModal` (`option.confirmTitle`/`confirmMessage`, `isDangerous`, `isLoading`); on confirm run the same two paths as Task 20 (`adminDeleteEvent(eventId)` when completed, otherwise `cancelEvent(eventId, { title: ADMIN_EVENT_CANCEL_TITLE, reason: ADMIN_EVENT_CANCEL_REASON })`), then `useFeedsStore.getState().pruneFeedLocal({ eventId })` and `router.back()`. For non-completed, non-cancelled events also add "Manage event" doing `router.push({ pathname: "/(shared)/event-dashboard", params: { eventId } })`. Errors toast through `adminDeleteErrorMessage` and the screen stays.
- `service/[id].tsx`: for `canAdminDelete(roles)` add a danger "Delete Service" row in the existing options `FormSheetModal`, opening a `ConfirmationModal` (`Delete Service?`, `Are you sure you want to delete this service? This action cannot be undone.`, `isDangerous`, `isLoading`), calling `useDailyHelperStore.getState().adminDeleteService(selectedService._id)` then `router.back()`. Errors toast through `adminDeleteErrorMessage`. No change to approval or publishing logic.

- [ ] **Step 1: Implement** in place.
- [ ] **Step 2: Typecheck and test** — Expected: no new errors in touched files; `# fail 0`.
