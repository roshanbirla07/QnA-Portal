# UI polish verification — 6 October 2026

The awesome-design-md Linear study informed this migration. QnA Portal retains its blue identity and light default.

## Scope

Shared navigation, mobile drawer, themes, controls, search-clear primitive, avatar fallback, Home feed, Rankings, and theme-aware accents on question/topic/article readers. No backend/schema changes. Navbar Ask now navigates to the existing protected composer route, matching Home's action.

## Checks

- Frontend ESLint passed.
- Production build compiled successfully.
- Jest: 2 suites, 3 tests passed (home navigation/empty state, search clear/focus, IME Enter).
- DESIGN.md lint: 0 errors. Informational orphan-token warnings remain because runtime CSS is canonical and prose documents theme mappings.
- Strict static audit of an exact copy of changed surfaces: 0 findings. Date ownership declared native; scrollbar, form, toast owners documented in UX-CONTRACT.md.
- Chromium browser fixtures: 1440×1000, 768×900, 390×844, 320×720; no page overflow.
- Home and Rankings visually inspected in light/dark themes.
- Verified search clear/focus, ranking board URL state, invalid topic feedback, loading/error/retry/empty states, signed-in current-user rank, drawer focus containment, Escape focus restoration, navigation closure, and reduced motion.
- Browser runtime recorded no uncaught page errors.

The browser harness intercepts API calls with synthetic fixtures. It does not verify live production data, MongoDB, real sign-in, or create/edit/delete operations.

## Re-run

Run npm ci, npm run lint --workspace frontend, npm run build --workspace frontend, and CI=true npm test --workspace frontend -- --watchAll=false --runInBand.

For browser QA, provide the existing config loader with a local_config.js exporting apiBaseUrl = "http://localhost:5001"; this configuration is not committed. After building, run node frontend/scripts/verify-ui.cjs with Playwright available. The harness serves the production build itself, mocks localhost:5001, and writes screenshots to the OS temporary directory. PLAYWRIGHT_MODULE and UI_BROWSER_PATH optionally select a test runner/binary. A normal Playwright installation can use its bundled browser. No live backend is required.

## Legacy audit boundary

The full-source static audit remains unsuccessful with 45 existing-form findings: 28 forms without explicit app validation ownership and 17 textarea markup evidence gaps. Global CSS supplies resize:none, but the auditor expects explicit shared/markup ownership. These untouched create/edit flows retain their validation behavior; adding noValidate without replacement would weaken it.

Manual review also found existing browser confirmations in MyPending, MyPosts, and QuestionDetail. They are outside this visual/read-only migration and are recorded in the design migration ledger. New/changed navigation, Home, and Rankings contain no browser dialogs or clickable non-semantic elements.

There is no formatter/typecheck/Storybook/accessibility command configured in this JavaScript repository. This pass provides keyboard/semantic checks, not a claim of a full WCAG audit.

