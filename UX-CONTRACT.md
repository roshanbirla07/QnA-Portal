# QnA Portal UX Contract

This contract covers the shared navigation/theme/search foundation and the migrated Home and Rankings views. Visual intent and runtime token ownership are in DESIGN.md. Existing create/edit/delete, authentication, company, and job workflows remain separate migration work; this document does not certify them.

## Product context

English developer community; en-IN display on migrated dates/numbers. Rankings monthly boundaries are UTC as defined by the API. Accessibility target: WCAG 2.2 AA; verification covers named controls, native semantics, keyboard focus, responsive layout, and reduced motion.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Public feed / cursor / following | backend/services/feed.service.js and frontend Home's established API calls | API implementation | 2026-10-06 |
| Reputation / badges / rewards | backend/controllers/ranking.controllers.js | Verified server aggregation | 2026-10-06 |
| Protected routes | frontend/src/components/common/PrivateRoute.jsx and backend/middlewares/auth.middleware.js | Existing authorization implementation | 2026-10-06 |
| UI scope | User requested polish, smooth motion, interaction, and PR workflow | Explicit instruction | 2026-10-06 |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Date | Rankings month input | Server YYYY-MM month contract | native, platform-owned | Browser keyboard/typed month |
| Form | Home/Navbar search forms; Rankings filter validation | Owning route and API query contract | explicit submit | SearchField component tests; browser validation |
| Scrollbar | frontend/src/index.css | DESIGN.md runtime mapping | narrow nav/table geometry | Computed style and overflow checks |
| Toast | App react-hot-toast Toaster | Existing notification provider | success / warning / info / error | Shared theme inspection |
| Select/Listbox | Existing native select controls on untouched screens | Existing screen contract | native, platform-owned | Not modified by this migration |

SearchField owns recurring input clear/focus/IME behavior. PageState owns recurring loading/error/empty presentation. Modal owns recurring modal containment; do not duplicate a drawer's focus implementation.

## Dataset navigation and async behavior

- Home: explicit Load more backed by the cursor, reset cursor on filter changes; deduplicate appended identities. Server-backed For You, Questions, Articles, Jobs, and Trending views; filters are shareable in URL.
- Rankings: server returns at most 50 per board. Monthly, all-time, and topic views preserve board/month/topic in URL, including browser Back/Forward. No fabricated page numbers.
- Search fields in the migrated header/Home are transient drafts; committed text is in /search?q=. Submission is explicit, so typing does not dispatch requests.
- Each list effect ignores responses after unmount/filter change. Error state offers explicit retry. Keep failed filter drafts available; do not automatically retry in a loop.
- PageState handles loading/empty/error without exposing raw server messages. There is no optimistic mutation in migrated views.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|
| Navigation search | Submit search form | Destination owns loading | /search?q= | Existing Search page handles API response | Clear returns input focus | frontend/src/services/apis.js |
| Ranking filters | Apply filters | Loading PageState | Same route with URL query | Inline invalid month/slug; retry API failure | First invalid field | backend/controllers/ranking.controllers.js |
| Mobile navigation | Open navigation | Modal entry | Chosen route | Escape/close | Native containment; restore trigger on cancel | AppShell + Modal |
| Theme | Theme icon | Immediate CSS variable change | Stay on route | Works even when storage is blocked | Stay on theme control | Navbar + index.css |
| Ask a question | Navigation link | Protected route handles access | /submitquestion | Existing sign-in/create flow | Existing destination | PrivateRoute |

## Responsive navigation and feedback

Desktop rail is sticky and independently scrollable; mobile drawer uses native dialog.showModal. Background is inert, body scrolling is locked, Escape closes, and the original trigger receives focus when still connected. Navigation links close the drawer; resize to desktop closes it. A skip link targets the content region.

Feed/ranking filter navigation uses ordinary buttons with aria-pressed and browser-native Tab/Enter/Space. No arrow-key tab-list behavior is implied. Rankings table shows contribution metrics under member identity on narrow screens. High-contrast and reduced-motion paths remain operable.

New errors remain inline and actionable. Notifications use the existing shared provider and retain stable placement; critical errors are not toast-only. Existing destructive confirmations are explicitly outside this migration; future changes must use Modal or another maintained accessible primitive.

## Validation and migration

Ranks, rewards, point definitions, permissions, and lifecycle rules remain server-owned. Client month/topic validation mirrors accepted API formats, labels errors, and focuses the first invalid input. Forms use noValidate. Native month popup appearance is accepted as platform-owned.

Migrate legacy forms and confirmations in focused reviewed changes; never disable their existing browser validation globally without replacement. Rollback is the PR revert; no backend schema or data migration is required.

## Verification

Run frontend ESLint, production build, component tests, DESIGN.md lint, static changed-surface audit, and browser checks. Browser fixtures verify UI states; they do not claim live MongoDB/production integration. Compare Home and Rankings in desktop/mobile and light/dark themes. Record remaining full-project static findings separately from changed-surface findings.

