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
| Form | Home/Navbar search forms; Rankings filters; QuestionForm | Owning route and API query contract | explicit submit | SearchField tests; question composer validation/browser checks |
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
| Ask a question | Navigation link | Inline duplicate check + disabled submit while posting | /submitquestion then existing postQuestion navigation | Inline validation keeps draft; toast on API failure | First invalid field / existing route focus | QuestionForm + PrivateRoute |

## Responsive navigation and feedback

Desktop rail is sticky and independently scrollable; mobile drawer uses native dialog.showModal. Background is inert, body scrolling is locked, Escape closes, and the original trigger receives focus when still connected. Navigation links close the drawer; resize to desktop closes it. A skip link targets the content region.

Feed/ranking filter navigation uses ordinary buttons with aria-pressed and browser-native Tab/Enter/Space. No arrow-key tab-list behavior is implied. Rankings table shows contribution metrics under member identity on narrow screens. High-contrast and reduced-motion paths remain operable.

New errors remain inline and actionable. Notifications use the existing shared provider and retain stable placement; critical errors are not toast-only. Existing destructive confirmations are explicitly outside this migration; future changes must use Modal or another maintained accessible primitive.

## Validation and migration

Ranks, rewards, point definitions, permissions, and lifecycle rules remain server-owned. Client month/topic validation mirrors accepted API formats, labels errors, and focuses the first invalid input. Forms use noValidate. Native month popup appearance is accepted as platform-owned.

QuestionForm uses app-owned inline validation, preserves entered text after validation/API failure, normalizes up to 10 topic tags, and exposes duplicate suggestions without blocking submission. Other legacy forms and confirmations remain focused follow-up work; never disable their existing browser validation globally without replacement. Rollback is the PR revert; no backend schema or data migration is required.

## Verification

Run frontend ESLint, production build, component tests, DESIGN.md lint, static changed-surface audit, and browser checks. Browser fixtures verify UI states; they do not claim live MongoDB/production integration. Compare Home and Rankings in desktop/mobile and light/dark themes. Record remaining full-project static findings separately from changed-surface findings.



## Developer evidence profiles

Developer profiles are opt-in for directory discovery. Connecting an external account does not automatically make a user discoverable; `candidateProfileVisible` must be enabled separately. Each connected account also has its own public/hidden visibility.

GitHub and Codeforces are synchronized from their public APIs and may be labeled `verified` only after a successful API sync. LeetCode imports selected public statistics through its unofficial GraphQL endpoint, and Medium imports recent article metadata from Medium's official RSS feed. Neither proves the QnA user's ownership of the external account. Treat successful sync as source-data confirmation only, not proof of identity. GraphQL may change without notice; RSS contains only recent accessible stories.

The Developers directory supports factual filtering by name/location, skill evidence, and connected platform. It does not compute, display, or sort by a candidate suitability score. Evidence is shown as source-backed signals such as public repository languages/topics, Codeforces public metrics, and QnA topic reputation. Recruiters/users remain responsible for interpreting that evidence.

Profile sync failures preserve the connected link and surface a failed sync state so users can retry. Removing an account deletes its imported metrics and skill signals. External API timeouts/failures must not block the rest of the QnA profile.

Public developer pages expose only user-approved public accounts and QnA-derived topic evidence. Email, authentication data, private profile information, and hidden external accounts are never included.

The developer directory commits name, skill, and platform filters on explicit Find developers submission. Platform choices are labeled toggle buttons with aria-pressed, including All platforms. Committed filters live in the URL, restore on browser Back/Forward, and Clear filters resets both drafts and URL. Errors offer Try again; no-results offers Clear filters. SearchField and PageState own input and feedback behavior. The directory does not change publishing or per-account visibility permissions.

### Identity editing and Work summaries

- Profile setup uses PATCH /profiles/me/profile for QnA username, display name, headline, publication, and opportunity preferences. A username is required before publishing; field errors preserve the draft and username collisions return 409. Username changes update the public URL. Profile edits never change role or email. Changes are committed through Save profile; reloading with unsaved identity changes uses the browser lifecycle warning, and in-app link navigation offers Keep editing / Discard changes. Browser history navigation follows the existing BrowserRouter behavior.
- Per-account visibility is committed explicitly and independently via PATCH /developer-profiles/me/accounts/:platform. Updating a handle without a visibility override preserves the account's saved visibility. Public detail and directory queries remain publication-gated and include only public accounts. Hidden metrics are visible only to the signed-in owner.
- Directory, public detail, and owner settings reuse PlatformSummary. All quantities represent imported snapshots; missing metrics show Not available. A failed sync preserves the last successful snapshot and is labeled accordingly. Refresh and load errors offer recovery.
- GitHub's calendar is imported from its unauthenticated public contributions page, with no service token forwarded. Each displayed cell retains its actual date, count, and source intensity. No missing days or failed requests are filled with fabricated zeroes. Unavailable/changed markup is a partial failure: repository data remains usable and the calendar is unavailable. Publicly shared anonymized private counts may appear, as on GitHub's public page; private repository details are never imported. The endpoint is not a supported GitHub API and may change.
- Repository/language/star summaries cover at most 100 recently updated public non-fork repositories. Codeforces solved/activity summaries cover at most 200 latest submissions, not lifetime totals. LeetCode contest nulls remain unavailable. Medium includes only recent RSS articles with dates/topics, not full article HTML or all-time totals.
- Calendar SVGs have accessible totals/ranges and a keyboard-accessible expandable daily table. Directory paging uses the existing server page/hasMore contract. Real-browser verification uses explicit API fixtures, with separate live GitHub calendar parsing; it does not certify production MongoDB connectivity.

### Developer card directory and Work explorer

- Developer and Work selections are committed to URL parameters `developer` and `work`. Back/Forward and shared links restore available selections without another directory request. These UI parameters are excluded from API requests. Search submission and pagination reset the selection; missing selections fall back to the first returned developer and an available public platform.
- Desktop uses a two-column card grid with semantic developer selection buttons (aria-pressed) and direct public-profile links. Below the grid, the selected Work detail retains one selected platform summary. Mobile stacks the cards and keeps a labeled native selector. Platform controls are toggle buttons, not ARIA tabs. Hidden accounts contribute neither controls, skills, logos, nor summaries. A developer with no public accounts retains a full-profile link and an explicit empty explanation.

### Linear visual direction

First visits use dark mode before first paint; explicit stored light mode remains supported. Theme controls continue to work with blocked theme storage. Directory cards show only public account snapshots and do not introduce Follow mutations, hiring scores, invented badges, or new API requests. Failed sync states remain labeled in previews and full evidence. Full profiles reuse Avatar fallback, PlatformSummary, contribution daily tables, and topic links. Theme and layout changes do not alter publication, account visibility, or authentication policy.

### Email/password and GitHub sign-in

- Login/signup share AuthPage: app-owned validation, masked password with reveal, correct autocomplete, inline generic login errors, duplicate-submit prevention, and destination restoration from PrivateRoute. Invalid submissions preserve email; failed authentication clears the password. Only a local path is used as a return destination.
- GitHubSignIn fetches public availability and starts a full-page redirect only on click. Loading, configuration failure/retry, disabled and unavailable states leave email/password usable. GitHubCallback exchanges the code once per mount (including StrictMode), removes code/state from browser history and ignores stale responses. Callback failure/cancellation restores password login with inline recovery.
- Server source contracts: backend/controllers/github-auth.controllers.js enforces JSON, exact configured origins, signed HttpOnly purpose-bound expiring state and link proofs, and PKCE S256. backend/services/github-identity.service.js exchanges codes only on the server and reads authenticated GitHub ID and verified primary email. backend/services/github-auth.service.js resolves by stable GitHub ID; email collisions require QnA password proof. Existing role/profile/privacy are retained, and new profiles remain unpublished.
- Signed flow/link cookies expire within ten minutes and clear on completion, cancellation or nonrecoverable errors. Incorrect linking passwords retain the proof for retry. Codes are single-use at GitHub; local cookies are not a server-side one-use ledger. Provider tokens, secrets and private email lists never enter API responses or browser storage. The standard QnA session remains canonical in backend/controllers/user.controllers.js.
- Configuration, GitHub registration and the unique index prerequisite are documented in docs/github-sign-in.md. Provider and database fixtures are explicitly distinguished from live GitHub/MongoDB validation. GitHub login is separate from public developer-platform connections and does not publish or sync activity.

### Default profile avatars

Avatar is the shared owner for photos and fallbacks. A usable photo takes priority; missing or failed sources render one of eight Boring Avatars Beam SVG presets locally. Stable user IDs keep assignment consistent across the directory, selected profile, full profile, feed and rankings; renaming a member does not change their avatar when an ID is available. No external avatar API, email seed, random assignment, browser storage or database backfill is required. The avatar is decorative beside the visible member name. Existing sizes, themes and publication rules remain unchanged.
