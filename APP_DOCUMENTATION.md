# Home Connect

## Overview

Home Connect ("Terrace") is a React Native / Expo Router app for residential-society communities: residents, local businesses, and society admins share a feed, run group-buy "wholesale deals," list local services, and organize events. **Stack:** Expo SDK 54, Expo Router v6 (file-based routing, typed routes), React 19 / React Native 0.81, Zustand 5 (state), NativeWind/Tailwind (styling), `expo-image-picker` + Cloudinary (media), `expo-location`, `expo-secure-store`/AsyncStorage (persistence). **Structure:** `app/` (routes, grouped `(auth)`, `(tabs)`, `(shared)`, `onboarding`), `components/` (by domain: UI, form, inputs, modals, admin, common, reviews, product, profile, business, directory, onboarding, auth), `store/` (11 Zustand stores), `lib/` (HTTP client, storage, Cloudinary, helpers), `types/`, `assets/constants` + `assets/mocks`.

This app has 30+ real screens and 100+ components. Coverage below is complete per the brief; density is prioritized over prose, so this runs longer than a 5-minute read — use it as a reference, not a narrative.

---

## Screens

### Auth — Login
**File:** `app/(auth)/login.tsx`
**Purpose:** Landing/branding screen; collect phone number + T&C acceptance, send OTP.

| Item | Type | Function |
|---|---|---|
| Phone input (+91 prefix) | Text input | `keyboardType="phone-pad"`, max 10 digits, strips non-digits |
| T&C checkbox | Checkbox | Toggles `accepted`; required to continue |
| "Terms and Conditions" link | Link | Opens `TermsSheet` modal |
| "Continue" button | Button | Validates 10-digit + accepted → `useAuthStore.sendOtp(mobile)` → `POST /api/auth/send-otp` → navigates to Verify OTP with `phone` param |

**Flow:** enter phone → check/agree to T&C (directly or via sheet's "I Agree") → tap Continue → OTP sent → navigate to Verify OTP. Invalid number or unchecked box shows inline error + toast, blocks navigation.

### Auth — Verify OTP
**File:** `app/(auth)/verify-otp.tsx`
**Purpose:** 6-digit OTP entry for the phone number from Login.

| Item | Type | Function |
|---|---|---|
| Back / edit-number icon | Button | Returns to Login |
| `BoxedOTP` (6 boxes) | OTP input | Single hidden input w/ SMS autofill (`autoComplete="sms-otp"`) |
| "Continue" button | Button | `verifyOtp(phone, otp)` → `POST /api/auth/verify-otp` → stores token/roles/expiresAt → navigates to Location Permission |
| "Resend OTP" / countdown | Button/timer | 28s countdown (`TERRACE_AUTH.RESEND_SECONDS`); re-sends OTP when tappable |

**Flow:** enter/auto-fill 6 digits → Continue → on success routes to onboarding; on failure shows error + lets retry; Resend restarts the timer and re-sends.

### Onboarding — Location Permission
**File:** `app/onboarding/location-permission.tsx`
**Purpose:** Request device location to help gate/filter the society list.

| Item | Type | Function |
|---|---|---|
| "Allow Location" button | Button | Requests OS permission; if granted, captures GPS + reverse-geocodes, saves via `useUserStore.saveLocation` (`POST /api/auth/save-location`), then continues |
| "Not Now" button | Button | Skips capture, continues anyway |

**Flow:** allow (saves location) or skip → either way routes to Select Society. If permission was already granted from a prior session, this happens silently on mount.

### Onboarding — Select Society
**File:** `app/onboarding/select-society.tsx`
**Purpose:** Pick a society to join (ends onboarding as a guest in that society).

| Item | Type | Function |
|---|---|---|
| Society list rows | Button | `selectSociety(society._id)` → `POST /api/society/select` → clears cached content stores → routes to Home |
| "Change"/"Enter manually"/"Can't find society" | Button | **Stubs** — show "coming soon"/"contact admin" toast only |
| Loading overlay / error banner | Feedback | Shown during selection / on failure |

**Flow:** list loads (`GET /api/society/list`, server 403s redirect back to Login or Location Permission if prerequisites unmet) → tap a society → confirmed → land on Home tab as a guest.

### Onboarding — Verify Role
**File:** `app/onboarding/verify-role.tsx`
**Purpose:** Real entry point into resident/business verification, reached from Home's "Verify Now" prompts.

| Item | Type | Function |
|---|---|---|
| Role cards (Resident / Business / Both) | Radio cards | Sets local role selection |
| "Continue" button | Button | Business → Business Registration Wizard; Resident/Both → Verify Step 1 |

### Onboarding — Verify Step 1 (Basic Details)
**File:** `app/onboarding/verify-step1.tsx`
**Purpose:** Collect name/email/tower/flat for resident verification (client-side only, no API call).

| Item | Type | Function |
|---|---|---|
| Full Name / Email fields | Text input | Required name; optional email w/ format check |
| Tower select | Select modal | Options from `useSocietyStore.towerList`; resets flat on change |
| Flat/Unit select | Select modal | Disabled until tower chosen; synthesized `Flat 1..N` list (not fetched) |
| "Continue" button | Button | Validates all fields → forwards data via route params to Step 2 |

### Onboarding — Verify Step 2 (Owner/Tenant + Proof)
**File:** `app/onboarding/verify-step2.tsx`
**Purpose:** Owner/Tenant selection + proof upload; submits verification.

| Item | Type | Function |
|---|---|---|
| Owner / Tenant toggle | Radio | Sets `ownerOrTenant`, reveals proof step |
| Proof-type chips (Aadhaar/Rent Agreement/etc.) | Chips | Label only |
| "Upload Document" | File picker | Picks + crops image, uploads to Cloudinary ("resident-proof" folder); required |
| "Take Selfie" | Camera | Optional Cloudinary upload ("resident-selfies") |
| "Continue" button | Button | `submitVerification(...)` → `POST /api/society/verify` → routes to Confirmation |

### Onboarding — Verify Confirmation
**File:** `app/onboarding/verify-confirmation.tsx`
**Purpose:** Static "submitted, pending review" screen.

| Item | Type | Function |
|---|---|---|
| "Browse Terrace" button | Button | `router.replace("/(tabs)/home")` — no further API call |

### Onboarding — Business Registration Wizard
**File:** `app/onboarding/business/index.tsx`
**Purpose:** 7-step (6 form steps + done screen) resumable business-listing registration, each step saved to the backend individually.

| Step | Items | Function |
|---|---|---|
| 1 — Type | 3 `OptionCard`s (Shop/Service/Home Service) | `startRegistration`/`saveStep1` → `POST/PUT .../registration[/step-1]`, then loads categories |
| 2 — Basic | Business Name, Mobile, Email | `saveStep2` → `PUT .../step-2` |
| 3 — Category | Category select + "Other" option | `saveStep3` → `PUT .../step-3` |
| 4 — Location | Within/Outside Society branch, address fields, "Use my location" | `saveStep4` → `PUT .../step-4`; GPS capture + reverse-geocode for "Outside" |
| 5 — Verify | Registration type select + proof image (if not "not registered") | Uploads proof (multipart), `saveStep5` → `PUT .../step-5` |
| 6 — Details | Description, delivery options, phone, logo (1) + photos (≤5) | Uploads logo/photos (multipart), `saveStep6` → `PUT .../step-6`, then auto-submits |
| 7 — Done | "Go to Home" button | `router.replace("/(tabs)/home")` |

**Flow:** resumes an in-progress draft on mount (`GET /api/business/registration/me`); each step's Continue persists immediately, so the wizard survives app restarts; final submit (`POST .../submit`) flips status to pending review; a rejection banner with reason shows if the admin rejects, allowing resubmission.

### Onboarding — User Type *(dead/unreachable)*
**File:** `app/onboarding/user-type.tsx` — duplicates Verify Role's purpose; no screen links to it. Documented for completeness only.

### Home Tab — Home Feed
**File:** `app/(tabs)/home/index.tsx` + `HomeScreen.tsx`
**Purpose:** Society social feed (posts/polls/events) + wholesale-deals carousel + verification nudges.

| Item | Type | Function |
|---|---|---|
| `HomeHeader` (society name, search, bell, chat) | Header | Society name opens Select Society (SUPER_ADMIN/GUEST only); search/chat show "coming soon"; bell is a static unread dot, no-op |
| Verification/business status banners | Banner | Conditional on `isAddressVerified`/`businessStatus` |
| `WelcomeVerificationCard` | Card | Shown to unverified guests; taps through to Verify Role |
| `HomeFilterChips` (All/Updates/Photos/Polls/Deals/Events) | Filter chips | Client-side filter of the feed list (Deals chip matches nothing — deals render only in the carousel) |
| Wholesale-deal carousel (`ProductCarousel`) | Horizontal cards | `activeDeals`; CTA → deal detail (`/(shared)/[id]?flow=deal`) |
| Feed list (Post/Poll/Event cards) | List | `PostCard`/`PollCard`/`ProductCard(type=event)` from `useFeedsStore.feeds` |
| Pull-to-refresh | Gesture | Re-fetches feeds/deals/businesses/daily-services |
| Floating "Verify Now" FAB + lock strip | Button/banner | Shown to unverified users; → Verify Role |

**Flow:** mount/focus refreshes user + business status (cache-gated, 15-min TTL) → browse filter chips → tap a deal/post/poll/event card to interact or drill in → like/comment/vote/join gated by verification status (guests see a `VerificationSheet`; pending users see a "Verification Pending" sheet) → the global "+" tab-bar button (not on this screen itself) opens `CreatePostModal` from anywhere.

### Directory Tab — Directory Home
**File:** `app/(tabs)/directory/index.tsx` + `directory-home.tsx`
**Purpose:** Society info + 3 category carousels (Local Businesses, Professional Services, Daily Help).

| Item | Type | Function |
|---|---|---|
| `SocietyInfoCard` | Card | Society name/address/flats/residents/maintenance from `useSocietyStore` |
| 3× `ServiceProviderCarousel` | Horizontal cards | Up to 5 items each, from already-loaded `useProductStore`/`useDailyHelperStore`; "View All" → All Services |

### Directory Tab — All Services
**File:** `app/(tabs)/directory/all-services.tsx`
**Purpose:** Full searchable list for one category.

| Item | Type | Function |
|---|---|---|
| Search input | Text input | Client-side name/category filter |
| Provider list cards | List | Avatar, rating, tags; "Call" (disabled for guests, not actually wired), "View Profile" → Business/Service Detail |

### Directory Tab — Business Detail
**File:** `app/(tabs)/directory/business/[id].tsx`
**Purpose:** Full profile of an approved local business.

| Item | Type | Function |
|---|---|---|
| Options menu (⋮) | Button | Report Business / Report User |
| Call / WhatsApp buttons | Button | Opens phone dialer / WhatsApp chat (hidden for guests) |
| Menu Highlights (top 3 catalogue items) | List | Tap is a no-op stub; "View Full Menu" also a no-op stub |
| Shop Details (timings, address) | Info card | — |
| Customer Reviews + "Add Review" | List/Modal | `AddReviewModal` → `POST /api/business/{id}/review` |

### Directory Tab — Service Detail
**File:** `app/(tabs)/directory/service/[id].tsx`
**Purpose:** Profile for a Daily-Help or Professional-Service provider.

| Item | Type | Function |
|---|---|---|
| "Book Appointment"/"Call" | Button | Dials phone (location-icon next to it is a no-op) |
| Details card (timings/location/fee or pricing table) | Info card | Differs by `serviceType` |
| Reviews + "Add Review" | List/Modal | `addDailyServiceReview` — note: `AddReviewModal` here is wired with hardcoded placeholder test props, not the real service ID |

### Business Tab — Community Deals
**File:** `app/(tabs)/business/index.tsx` + `dealsScreen.tsx`
**Purpose:** Browse active wholesale/group-buy deals, filterable by category.

| Item | Type | Function |
|---|---|---|
| Category `FilterChips` | Filter chips | Mock categories (`WHOLESALE_DEALS_CAT`); client-side filter |
| Deal cards (`ProductCard`) | List | Price/MRP, order-progress bar, "Join Deal"/"View Deal" → `/(shared)/[id]?flow=deal` |
| Options menu (⋮) | Button | Report / Remove (own or admin) |

**Flow:** deals load from Home's earlier fetch (this screen doesn't fetch itself) → filter by category → tap CTA (verification-gated) → order/quantity handled on the shared detail page. No deal-creation entry point here — that's via the global "+" button.

### Business Tab — Deals List *(dead/unreachable)*
**File:** `app/(tabs)/business/dealsList.tsx` — not wired into any route or link; duplicate of `dealsScreen` with bespoke styling.

### Profile Tab — Profile Home
**File:** `app/(tabs)/profile/index.tsx` + `profile-screen.tsx`
**Purpose:** Identity/verification status hub + role-filtered links to every other profile screen.

| Item | Type | Function |
|---|---|---|
| Avatar (edit) | Image upload | Uploads to Cloudinary, `updateUser({profilePhotoUrl})` |
| Name + verification badge | Display | From `useUserStore.user` |
| "Update Profile" | Button | Opens `ManageProfileForm` sheet (residents only) |
| My Orders / My Deals / My Events / My Business Account / My Requests / Admin Dashboard rows | Nav | Role-gated visibility (client-side only); route to respective screens |
| "Help & Support" | Button | **No-op stub** |
| "Delete Account" | Button | Opens `DeleteAccount` flow |
| "Logout" | Button | Confirm → `signOut()` → routes to Login |

### Profile Tab — My Orders
**File:** `app/(tabs)/profile/my-orders.tsx`
**Purpose:** Read-only order history (business/wholesale/event), filterable.

| Item | Type | Function |
|---|---|---|
| Type filter chips | Filter | Filters by `sourceType` |
| Order card | Card | Tap → deal/event detail page (`flow=deal`); no cancel/edit on this screen itself |
| Pull-to-refresh | Gesture | `getUserOrders(userId)` |

### Profile Tab — My Requests
**File:** `app/(tabs)/profile/my-requests.tsx`
**Purpose:** Grid of the user's own product/deal listings + event registrations, for quick editing.

| Item | Type | Function |
|---|---|---|
| Type filter chips | Filter | Switches between Products / Deals / Event Registrations sections |
| Product/Deal cards | Card | Tap → edit sheet (`BusinessForm`/`WholesaleDealForm`) → `updateProduct`/`updateDeal` |

Note: grid can include items the user merely *ordered from* (not owns) when built from order history; no ownership check gates the edit action client-side.

### Profile Tab — User Business Screen
**File:** `app/(tabs)/profile/user-business-screen.tsx`
**Purpose:** Admin-facing view of one business's profile + catalogue (reached from Approved Businesses).

| Item | Type | Function |
|---|---|---|
| Options → "Remove User" | Button | **Stub** — logs only, no action |
| Call / Message | Button | **Stubs** |
| Catalogue grid | List | Tap is a **TODO stub**, no navigation |

### Profile Tab — User Profile Screen
**File:** `app/(tabs)/profile/user-profile-screen.tsx`
**Purpose:** Admin view of a resident's profile + feed activity; delete/grant-admin controls.

| Item | Type | Function |
|---|---|---|
| Options → Remove User | Button | Confirm → `deleteUser(userId)` |
| Options → Toggle Admin role | Button | Confirm → `updateUser({roles})` |
| Feed list | List | That user's posts/polls (`getFeedsByUserId`) |

### Profile Tab — Admin Dashboard
**File:** `app/(tabs)/profile/admin-dashboard.tsx` (Admin/Super-Admin only, UI-gated)
**Purpose:** Verification workflow center — stats, pending requests, approved lists, reported content.

| Item | Type | Function |
|---|---|---|
| 5 stat cards (Reported/Pending/Approved Residents/Businesses/Services) | Card | Each switches the dashboard's current view |
| Entity tabs (All/Residents/Businesses/Services) | Tab | Filters the pending-requests list |
| "Sort: Newest First" | Button | **Decorative — no handler wired** |
| Filter panel (status) | Filter | Client-side only |
| Select All / bulk checkboxes | Checkbox | Populates a selection set |
| `BulkActionBar` Approve/Reject | Button | **Stubs** — `Alert.alert` only, no API call |
| Per-request Approve | Button | Approves via the matching store action (business/resident/service) |
| Per-request Reject | Button | Opens `RejectModal` (reason required) |
| "Request More Information" | Button | **Placeholder** — generic alert only |
| Society selector (super-admin) | Modal | Picks which society's data to load |

### Profile Tab — Admin Request Details
**File:** `app/(tabs)/profile/admin-request-details.tsx`
**Purpose:** Generic, schema-less viewer for one pending request's raw fields (no fixed layout — renders whatever the API returns, including image fields by key-name pattern match).

### Profile Tab — Deal Dashboard ("My Deals")
**File:** `app/(tabs)/profile/deal-dashboard.tsx`
**Purpose:** Organizer view of the user's own wholesale deals — stats + order approval.

| Item | Type | Function |
|---|---|---|
| Deal list | List | `getDealsByUserId` |
| Stats grid (revenue/participation/deadline) | Display | Computed client-side |
| Approved/Rejected tabs | Tab | Filters orders |
| Reject (✕) on approved orders | Button | `updateOrderStatus(..., "rejected")` |
| Edit / Cancel Deal (⋮ menu) | Button | `updateDeal`/`removeDeal` |
| Broadcast / Share | Button | **TODO stubs** |

No explicit "approve pending order" action exists on this screen.

### Profile Tab — Event Dashboard (legacy, "My Events")
**File:** `app/(tabs)/profile/event-dashboard.tsx`
**Purpose:** Organizer view for events created via the **old feed-based** system.

| Item | Type | Function |
|---|---|---|
| Event list | List | Feed items where `type==="event"` |
| Pending/Approved participant tabs | Tab | — |
| Approve/Reject participant | Button | `addOrUpdateRSVP(...status)` |
| Edit / Cancel Event (⋮ menu) | Button | `updateFeed`/`removeFeed` |

**Note:** duplicates the newer `(shared)/event-dashboard.tsx` conceptually — see Known Gaps.

### Shared — Update Profile *(broken route)*
`app/(shared)/_layout.tsx` declares a `Stack.Screen name="update-profile"`, but no `update-profile.tsx` file exists in `app/(shared)/`. The route is effectively dead — profile editing actually happens inline via `ManageProfileForm` sheets on Profile Home.

### Shared — Universal Deal/Event Detail
**File:** `app/(shared)/[_id].tsx` (params: `id`, `flow=deal|event`)
**Purpose:** One shared detail page for wholesale deals and legacy feed-events.

| Item | Type | Function |
|---|---|---|
| Image carousel, pricing/date/location blocks | Display | Differ by `flow` |
| Call / WhatsApp host | Button | — |
| Community Goal progress bar | Display | Orders/RSVPs vs. minimum |
| Report button | Button | Appends to item's report list |
| Reviews + Add Review | List/Modal | — |
| Sticky CTA (Order Now / Register Now / etc.) | Button | Deal → `EditQuantityModal` → `upsertWholesaleOrder`; Event → `RegistrationConfirmModal` → `addOrUpdateRSVP`/`removeRSVP` |
| Delete (owner/admin) | Button | Soft-deletes deal or removes feed event |

### Shared — Business Catalogue
**File:** `app/(shared)/businessCatalogue.tsx`
**Purpose:** List of businesses the current user owns.

| Item | Type | Function |
|---|---|---|
| Business cards | List | `useProductStore.userProducts` |
| Edit (pencil) | Button | `BusinessForm` sheet → `updateProduct` |
| "Manage"/"View Catalog" | Button | → Business List (edit or view mode) |

### Shared — Business List
**File:** `app/(shared)/businessList.tsx` (params `id`, `edit`)
**Purpose:** Grid of one business's catalogue items.

| Item | Type | Function |
|---|---|---|
| "Add New Item" (edit mode) | Button | `CatalougeForm` → `addCatalogueItem` |
| Item card | Card | Edit mode → edit sheet; view mode → Catalogue Detail |

### Shared — Catalogue Detail
**File:** `app/(shared)/catalogueDetail.tsx`
**Purpose:** Read-only gallery/spec page for one catalogue item.

| Item | Type | Function |
|---|---|---|
| Image carousel, specs, tags | Display | From cached catalogue item (no direct fetch by ID) |
| "Order or Enquire" | Button | **TODO stub** — no action implemented |

### Shared — Create Event (new)
**File:** `app/(shared)/create-event.tsx`
**Purpose:** 4-step wizard publishing an event to the new MySQL-backed Event API.

| Step | Items | Function |
|---|---|---|
| 1 | Title, type, description, image | Validated |
| 2 | Start/end date & time, venue | Validated |
| 3 | Free/Paid + amount, min/max participants, registration cutoff, rules | Validated |
| 4 | Review + confirmation checkbox | "Publish Event" → `createEvent` → multipart `POST /api/events` |

### Shared — Event Dashboard (new)
**File:** `app/(shared)/event-dashboard.tsx`
**Purpose:** Organizer stats + read-only participant list for a MySQL-backed event.

| Item | Type | Function |
|---|---|---|
| "Cancel Event" | Button | Confirm → `cancelEvent` |
| Stat tiles (participation, revenue) | Display | From `getDashboard` |
| Participants list | List | **Read-only** — backend doesn't yet support removing a single participant (explicit code comment) |

### Shared — Event Details (new)
**File:** `app/(shared)/event-details.tsx`
**Purpose:** Attendee-facing event page.

| Item | Type | Function |
|---|---|---|
| Progress bar (spots filled) | Display | — |
| "See all" joined preview | Button | Opens participants sheet |
| "Join Event" | Button | Confirm sheet → `joinEvent`; paid events note payments happen outside the app |

---

## Shared Components

### UI design system — "classic" (`components/UI`, most widely used)
| Component | Function |
|---|---|
| `Card` | Base white/rounded container — used almost everywhere |
| `Badge` | Colored pill/status label |
| `Select` | Bottom-sheet dropdown (newer sibling of `form/dropdown.tsx`) |
| `ImageCarousel` | Paginated image carousel with dot indicators |
| `ImageTitleHeader` | Feed-card header (avatar, name, verified badge, ⋮ options menu) |
| `TitleHeader` | Generic screen header w/ back + options menu (report/share/remove/cancel/edit) |
| `InfoBanner` | Colored callout (info/success/warning/danger) |
| `PostCard` / `PollCard` | Full feed-item cards (image carousel, like/comment, delete/report, verification gating) |
| `HomeFilterChips` | Home's fixed feed-type filter row |
| `OrderProgress` | Thin progress bar w/ label |
| `Skeleton` | Shimmering loading placeholder |
| `SuccessModal` | Generic success bottom sheet |
| `WelcomeVerificationCard` | Static unverified-guest banner |
| `RobustImage` | Image w/ retry + fallback icon |
| `Chip`, `Heading`, `HDivider`, `Label` | Small text/layout primitives |
| `DashboardStats`, `ShareBtn`, `TabView` | Built but **unused anywhere** (orphaned) |

### UI design system — "Global*" (newer, parallel system, `components/UI`)
`GlobalButton`, `GlobalCard`, `GlobalInput`, `GlobalText`, `GlobalLabel`, `GlobalIconButton` — a second, newer design-system track (own `useUiTheme` bridging into the same dark-mode state). Adoption so far is limited to the Event feature (`create-event`/`event-details`/`event-dashboard`) plus `GlobalBottomNavigation` in the tab bar; most other components (`GlobalButton`, `GlobalCard`, `GlobalText`, etc.) have **zero references** elsewhere — an in-progress migration, not a full replacement.

### Form fields (`components/form`)
| Component | Function |
|---|---|
| `BusinessForm` | Multi-step business-listing form |
| `CatalougeForm` | Stepped catalogue-item form |
| `ServiceForm` | Daily-help/professional-service listing form |
| `WholesaleDealForm` | 3-step group-deal form (embeds `DiscountCalculator`) |
| `PostForm` / `PollForm` | Feed post / poll composers |
| `EventForm` | Legacy feed-event composer |
| `ManageProfileForm` | Resident profile edit form |
| `CloudinaryImagePickerField` / `ImagePickerField` | Multi-image tile pickers (Cloudinary-integrated vs. local-only) |
| `DatePickerField` / `TimePickerField` | Native date/time pickers |
| `dropdown.tsx` (`SelectField`) | "Classic" bottom-sheet category select |
| `CircularImage` | Avatar w/ camera-edit overlay, built on `RobustImage` |

### Inputs (`components/inputs`)
`ActionButton` (primary CTA button, used nearly everywhere), `TextField`/`TextArea` (classic notched-label inputs), `TerraceTextField`/`TerraceSelectField` (onboarding-styled clones), `BoxedOTP` (OTP entry), `DiscountCalculator` (animated %-off calculator for deal/catalogue forms), `LikeButton`. `UnderlineOTP` exists but is unused.

### Modals & sheets (`components/modals`, `components/common`)
`FormSheetModal` (generic bottom-sheet shell nearly everything else is built on), `ConfirmationModal`, `RejectModal` (reason-required reject), `ReportModal` (per-type reason picker, dispatches to the matching store's report action), `RegisterHelperModal`, `RegistrationConfirmModal`, `OrderSuccessModal`, `ViewModal` (built but currently unused — likely superseded by Admin Request Details), `TermsSheet` (login T&C), `VerificationSheet` (guest verification kickoff, embedded from post-creation and card actions), `createPostModal`/`CreatePostModal` (global create hub — deal/business/service/post/poll/event, permission-gated, optimistic-then-real submit pattern), `Toast`/`ToastProvider` (app-wide banner), `ErrorMessage` (persistent inline error banner).

### Reviews (`components/reviews`)
Two parallel patterns: (1) `ReviewsBlock` + `ReviewForm`/`StarPicker` (inline composer, used only on the shared deal/event detail page); (2) `CustomerReview` + `AddReviewModal` (modal composer, used on business/service detail pages). Both use `ReviewItem` + `Star` for display.

### Admin (`components/admin`)
`DashboardHeader`, `StatsSection` (5 stat cards), `PendingRequestsSection` (filter/sort/select-all/approve/reject), `BulkActionBar` (stub), `SocietySelectorModal` (super-admin), `DashboardSkeleton`, `FetchingOverlay`.

### Common (`components/common`, domain-specific)
`HomeHeader`, `SocietyHeader`, `FilterChips`, `DetailCard`, `StatsCard`, `EmptyState`, `NoDataCard`, `ReportButton` (simpler `Alert`-based reporter, used only on the shared detail page), `ReportedContentsView` (admin dashboard), `ApprovedResidentsView`/`ApprovedBusinessView`/`ApprovedDailyServicesView` (admin drill-downs).

### Domain-specific (`components/business`, `components/directory`, `components/product`, `components/profile`, `components/onboarding`, `components/auth`)
`ProductCarousel`, `ServiceProviderCarousel`, `SocietyInfoCard`, `ProductCard` (shared card for deals/events), `ProductDetails` (built but unused), `EditQuantityModal`, `CancelOrderConfirmModal` (unused), `AdminApprovalModal` (unused), `UserProfileHeader`, `ProfileSkeleton`, `InfoRow`, `DeleteAccount`, `TermsSheet`, `TerraceHeader`, `RoleCard` (unused), `RoleUsageStep`, `TerraceStepper`, `GuestSocietyConfirmation`, `ResidentProofStep`.

---

## Data / State / Storage

11 Zustand stores. All persistence (where present) goes through `lib/storage.ts`'s `zustandStorage` — **plain AsyncStorage/localStorage**, not Keychain/SecureStore, despite code comments claiming otherwise.

| Store | Purpose | Persisted? |
|---|---|---|
| `useAuthStore` | Token, roles, expiry, OTP flow, sign-out cascade | Yes (`token`/`roles`/`expiresAt` only) |
| `useUserStore` | Current user profile, admin user lists, orders | Yes (`user` only) |
| `useSocietyStore` | Society list, selected society, towers | Yes (`selectedSociety`+`towerList`; list always refetched) |
| `useProductStore` (business) | Business/service listings, catalogue, reviews | Nominally yes, but `partialize` returns `{}` — **nothing actually persists** |
| `useDailyHelperStore` | Daily-help/professional-service listings | Yes (single item only, not the list) |
| `useFeedsStore` | Posts/polls/events, likes, comments, RSVPs, votes | Yes — **uses raw AsyncStorage directly**, inconsistent with every other store |
| `useWholesaleDealStore` | Group deals + orders | Yes |
| `useAdminStore` | Reported/pending/approved moderation queues | No |
| `useBusinessRegistrationStore` | 6-step business registration wizard state | No |
| `useEventStore` | New MySQL-backed events | No |
| `useUiStore` | Create-post modal visibility, society-switching flag | No (no API calls at all) |

**Sign-out** cascades `.clear()` across all stores except auth itself. **Token/session:** `lib/tokenManager.ts` holds a live in-memory accessor into `useAuthStore`; `services/session.ts` (SecureStore-based) and `lib/storage.ts`'s Keychain helpers are both fully **dead code** — unused anywhere. `initSession()` re-verifies with the server only when the token is within 5 days of expiry; otherwise trusts the local copy (offline-friendly).

---

## Backend & APIs

**Base URL:** `http://<dev-host>:4200` (dev) / `http://13.127.67.104:4200` (prod) — hardcoded, plain HTTP (no TLS); `usesCleartextTraffic` is explicitly enabled in `app.json`. Auth header: `Authorization: Bearer <token>` attached by `lib/httpMethods.ts` on every call except OTP send/verify.

| Area | Key endpoints |
|---|---|
| Auth | `POST /api/auth/send-otp`, `/verify-otp`, `/refresh-token`; `GET /verify-token`; `POST /save-location` |
| Society | `GET /api/society/list`; `POST /select`, `/verify`; `GET /total-residents/count` |
| User | `GET/PATCH/DELETE /api/user/:id`; `GET /:id/orders`; `GET /getUsers/:societyId`; `GET /getPendingUsers/:societyId`; `POST /report/:id` |
| Business | `POST /api/business`; `PATCH /:id`; `GET /fetch/:societyId`, `/user/:userId`, `/product/:id`; catalogue CRUD `/:id/catalogue[...]`; `/review`; `/report/:id`; `PATCH /:id/status` (approve/reject) |
| Business Registration | `GET /api/business/types`, `/categories`, `/registration/me`; `POST /registration`; `PUT /registration/:id/step-1..6`; upload/delete media; `POST /submit` |
| Daily Service | `POST /create`; `GET /approved/:societyId`, `/all/:societyId`, `/:id`; `/review`; `/report/:id` |
| Feed | `GET /getfeeds/:societyId`, `/user/:userId`, `/getFeed/:id`; `POST /create`; `PATCH /:id/like`, `/update/:id`; `DELETE /:id`; `POST /vote/:id`, `/rsvp/:id` (+ `DELETE`); `/report/:id`, `/review/:id` |
| Wholesale Deal | `POST /create`; `GET /getAllDeals/:societyId`, `/getDeal/:id`, `/getDealByUser/:userId`, `/updateExpired/:societyId`; `PATCH/DELETE /:id`; `/report/:id` |
| Orders | `PATCH /api/orders/wholesale/:dealId/orders/:orderId/status`; `POST /:dealId/upsert` |
| Admin | `GET /api/admin/reported/:societyId`, `/pending-requests/:societyId`, `/approved/:societyId`; `PATCH /business/:id/approve\|reject`; `POST /resident/approve` |
| Events (new) | `POST /api/events` (multipart); `GET /:id`, `/:id/participants`, `/:id/dashboard`; `POST /:id/join`; `PATCH /:id/cancel` |
| Media | `POST /api/media/sign` (Cloudinary signed-upload params); `DELETE /api/media/delete` |

**Cloudinary:** signed upload flow — app fetches `{signature, api_key, cloud_name}` from its own backend, then uploads directly to `api.cloudinary.com`. No cloud name is hardcoded client-side.

**Mock/static data** (`assets/mocks/category.ts`): category lists for businesses, daily-help, services, wholesale deals, report reasons, order categories — all hardcoded, not fetched. Note: `BUSINESS_CAT_MOCK` (used by several forms) is a **separate, independent list** from the real `/api/business/categories` endpoint used by the registration wizard — they can disagree.

---

## Navigation Map

```
app/index.tsx (splash/spinner)
 └─ app/_layout.tsx (root Stack; redirects based on auth state)
     ├─ (auth)/login → verify-otp
     ├─ onboarding/location-permission → select-society
     │    └─ verify-role → verify-step1 → verify-step2 → verify-confirmation
     │                   └─ business/index (7-step wizard)
     └─ (tabs)  [custom bottom bar: Home | Business | Directory | Profile, + center "Create" FAB]
         ├─ home/index (feed)
         ├─ business/index → dealsScreen
         ├─ directory/index → directory-home
         │    ├─ all-services
         │    ├─ business/[id]
         │    └─ service/[id]
         └─ profile/index → profile-screen
              ├─ my-orders, my-requests
              ├─ user-business-screen, user-profile-screen
              ├─ admin-dashboard → admin-request-details
              ├─ deal-dashboard
              └─ event-dashboard (legacy)
     (shared) [reachable from any tab]
         ├─ [_id] (deal/event universal detail, ?flow=deal|event)
         ├─ businessCatalogue → businessList → catalogueDetail
         ├─ create-event → event-dashboard (new) / event-details (new)
         └─ update-profile (declared, file missing — dead route)
```

---

## Known Gaps / TODO

**Unreachable / dead screens & components:** `onboarding/user-type.tsx`, `business/dealsList.tsx`, `(shared)/update-profile` (route declared, no file), `components/onboarding/RoleCard.tsx`, `components/inputs/UnderlineOTP.tsx`, `components/product/ProductDetails.tsx`, `components/product/CancelOrderConfirmModal.tsx`, `components/product/AdminApprovalModal.tsx`, `components/modals/ViewModal.tsx`, `components/UI/DashboardStats.tsx`, `ShareBtn.tsx`, `TabView.tsx`, most `Global*` components, `lib/orderAPI.ts` (imports `axios`, which isn't even a dependency), `services/session.ts`, `lib/storage.ts`'s Keychain token helpers.

**Non-functional buttons/stubs:** Home header search/chat/bell icons; Directory "Call" buttons; Business Detail "View Full Menu"/menu-item taps; User Business Screen Call/Message/Remove/catalogue-tap; Profile "Help & Support"; Admin Dashboard "Sort," "Request More Information," and both `BulkActionBar` actions; Deal Dashboard "Broadcast"/"Share"; Catalogue Detail "Order or Enquire"; Select Society's "Change location"/"Enter manually"/"Can't find society."

**Two parallel, non-integrated Event systems:** legacy feed-based events (`useFeedsStore`, managed via `profile/event-dashboard.tsx`, joined via feed RSVP) vs. new MySQL-backed events (`useEventStore`, managed via `(shared)/event-dashboard.tsx`, joined via `/api/events/:id/join`). Both remain live simultaneously; the newer system appears to be the intended replacement (per in-code comments) but the old dashboard hasn't been removed.

**Two parallel UI design systems:** the "classic" `Card`/`Badge`/`TextField`/`theme.ts` system (dominant, used almost everywhere) vs. the newer `Global*` / `uiTheme.ts` system (adopted only in the Event feature so far).

**Storage/security inconsistencies:** auth token is persisted in plaintext AsyncStorage despite code comments claiming Keychain/SecureStore; `useFeedsStore` persists via raw AsyncStorage while every other store uses a shared wrapper; `useProductStore`'s persistence is a no-op; production API traffic is plain HTTP, not HTTPS.

**Data/logic quirks:** My Requests can present items the user merely ordered from (not owns) with a full edit affordance and no client-side ownership check; two different "business categories" sources (`BUSINESS_CAT_MOCK` vs. the real categories endpoint) can disagree; Delete Account doesn't actually delete an owned business (explicit `// TODO` in source) or explicitly clear session state; all role-based screen gating is client-side visibility only — destination screens don't re-check roles themselves.
