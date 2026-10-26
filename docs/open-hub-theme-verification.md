# Open Hub dark/yellow theme verification

The approved HTML direction is applied through the existing CSS tokens and shared controls. The runtime token source remains `frontend/src/index.css`; `DESIGN.md` records the accepted palette and layout. No sample content from the HTML review is part of the application.

## Changes

- Charcoal default theme and warm yellow actions, links, focus, and selection. Explicit light preferences remain supported; boot and Navbar use the same fallback rule.
- Horizontal desktop navigation with a native More disclosure; the existing modal drawer remains the mobile navigation owner.
- A centered community introduction and three discovery columns backed by the existing discussion, ranking, and job APIs. Topic links and personalized feed filters/cursor behavior remain intact. Discovery loading and partial failures use PageState and an explicit retry.
- Authentication uses shared surfaces and buttons instead of purple/pink gradients. Its existing native validation and service behavior are retained. Signup labels are associated with their inputs.
- Legacy question cards reuse Avatar and topic chips. The job-board header stacks on narrow screens to keep its actions in bounds.

## Checks

| Check | Result |
| --- | --- |
| `npm run lint --workspace frontend` | Pass |
| `CI=true npm test --workspace frontend -- --watchAll=false --runInBand` | 7 suites, 19 tests pass |
| `npm test --workspace backend` | 33 tests pass |
| `CI=true npm run build --workspace frontend` | Pass |
| `npx -p @google/design.md designmd lint DESIGN.md` | 0 errors; 9 unused-token warnings (runtime CSS is canonical) |
| Strict premium design audit compared with main | Same 52 existing findings; no new rule/file/message findings |
| `git diff --check` | Pass |

Chromium exercised Home, Developers, public developer detail, Rankings, Jobs, Companies, Communities, Projects, a topic page, Login, and Signup at 320, 390, 768, 1024, and 1440px. No horizontal document overflow or JavaScript page errors remained. Desktop and mobile screenshots were reviewed.

Interaction checks covered More disclosure Escape/focus restoration, outside dismissal and route closure; mobile modal navigation and focus restoration; light preference persistence; dark document boot before JavaScript; core button/text contrast in both themes; feed loading, empty, error/retry and discovery partial-error recovery. An owner fixture also exercised profile settings and the existing account-removal dialog on mobile. Component tests cover missing/invalid/blocked theme storage and partial discovery retry.

## Limits and retained behavior

Browser checks use explicit API fixtures and do not certify a production database, live external account synchronization, or a live login transaction. No production mutation or deployment was performed. Existing backend tests cover profile privacy and real-calendar parsing; this change introduces no synthetic contribution data or new platform metrics.

The full static audit is not clean: the 52 findings already exist on main, including native authentication form validation diagnostics. These forms receive visual changes, with their existing validation/service contract preserved. Unrelated forms, route-title coverage, and other audit cleanup are outside this theme PR. The historical Tailwind `primary.blue`, `primary.purple`, and `accent.pink` names remain compatibility aliases to the single runtime brand token.
