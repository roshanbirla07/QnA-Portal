# Profile summary and rating history follow-up

The public profile now omits individual Codeforces problem/submission and GitHub repository-name lists. Aggregate statistics, GitHub's actual contribution calendar/languages and Medium writing remain. Codeforces current/max ratings and ranks replace the decorative neutral ring. LeetCode retains its real solved-difficulty gauge and contest percentile.

Both contest platforms share RatingHistory: a dated SVG plot with actual contest points, proportional elapsed time, rating bounds, touch-readable HTML axis labels and a keyboard-operable expandable data table. One point is shown without an invented trend; equal ratings never divide by zero. Missing/failed history offers refresh guidance; a successful empty history reports no rated contests. No synthetic baseline, rating maximum or available-problem denominator is introduced.

PlatformLogo is shared by directory rows, profile headers, filters and settings. LeetCode is amber, Codeforces has yellow/blue/red bars, and GitHub/Medium retain theme-aware monochrome marks. The existing dark/yellow application palette remains.

## Source and operational behavior

- Codeforces imports anonymous `user.rating` records (`newRating`, `ratingUpdateTimeSeconds`, `contestName`). Official contract: https://codeforces.com/apiHelp/methods#user.rating and https://codeforces.com/apiHelp/objects#RatingChange.
- LeetCode uses a separate `userContestRankingHistory` GraphQL query, including only attended entries with a valid source rating/date. A live read of lee215 returned 27 points, from Weekly Contest 16A to Weekly Contest 416, during validation. This is a read-only smoke check, not a production account sync.
- A live Codeforces read timed out in this environment; mapping, empty and optional-failure behavior were validated with explicit provider fixtures. No successful live Codeforces check is claimed.
- Optional history fetch failure leaves core statistics available. Existing public/hidden account and profile-publication controls are unchanged. No authentication, configuration, dependencies or schema migration changed. Additional provider calls reuse existing timeout behavior.
- After deploying, use the existing account Refresh action to populate history for older snapshots. No production sync, database write or deployment was performed here.
- Backend still retains repository/submission metadata for compatibility; this change removes the displayed lists.

## Validation

- Frontend: 9 suites, 37 tests passed, including source-only graphs, no named problem/repository lists, table values, one point and missing versus empty data.
- Backend: 47 tests passed, including attended-history filtering, chronological date/rating mapping, missing/empty history, optional-provider failure and preservation of core statistics.
- Frontend lint, targeted backend ESLint 8 checks, production build and git diff --check passed.
- Built UI passed Playwright checks with explicit API fixtures at 320, 390, 768 and 1440px in dark/light themes: graph point counts, keyboard disclosure, platform colors, no named lists, one-point/empty/failed history, hidden accounts/private contacts, navigation/filter restoration, retry and profile editing. No page JavaScript errors. Screenshots were inspected on desktop and narrow mobile.
- Strict design audit retains 49 pre-existing findings and adds none. It does not fully pass. DESIGN frontmatter parses; updated brand artwork and graph ownership are documented with runtime CSS.
