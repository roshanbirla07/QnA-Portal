# People-first developer profiles

The approved directory/profile design replaces the previous split explorer. Directory rows contain identity, biography, public skills and platform logos. A full-row native link opens the separate public profile. The old selection buttons, platform preview cards, mobile developer picker and inline selected Work panel are removed.

## Scope and source contracts

- Shared Avatar, SearchField, PageState, platform logos, theme tokens and PlatformSummary remain canonical. No dependency or backend configuration change.
- Profile sections are URL-backed Overview, Coding, Projects, Writing and About links. They group the same fetched public snapshot without additional requests. Browser Back and the Developers link preserve the originating directory filters and page.
- About and Location are editable through the existing settings form and PATCH endpoint, within the existing schema limits. Existing publication, dirty-draft, visibility and ownership behavior remains unchanged.
- LeetCode's ring depicts known solved Easy/Medium/Hard counts; an incomplete or inconsistent breakdown has no fabricated progress. No available-question denominator is invented. Contest Top % comes directly from the snapshot. Codeforces has a neutral numeric rating ring, not a percentage toward a fabricated maximum.
- GitHub contribution cells retain their imported dates/counts, including missing-date gaps. Repositories/languages and Medium articles retain existing scope/date disclosures. Unsupported achievements, rating-history series, education and experience are not generated from the design's sample data.
- Share uses the canonical public URL. Clipboard errors or insecure browser contexts provide a focused selectable link. Contact details shows only supplied public website/LinkedIn/GitHub links; account email and phone are never displayed.

## Validation

- Frontend: 9 suites / 34 tests passed, including directory-to-profile navigation, filter/page restoration, explicit platform filters, empty/error/retry behavior, stale-response protection, hidden account exclusion, contact privacy, sharing fallback, genuine metric rendering, and biography/location editing.
- Backend: 45 tests passed. No backend source changed.
- Frontend lint, production build and `git diff --check` passed. DESIGN front matter parses; existing runtime palette and token mapping are unchanged.
- Browser: built frontend with explicit API fixtures; keyboard activation of directory rows; separate profile; URL sections and Back without refetch; share/contact; source-only calendar/percentile; hidden/private exclusions; retained directory query and paging; empty/error/retry; 320/390/768/1440px; dark/light; mobile section navigation; biography/location save and reload. No JavaScript errors.
- Strict premium audit: 49 existing findings, down from 50 at the base commit; no new findings. The removed mobile selector eliminates one unresolved ownership finding. Unrelated legacy findings are not represented as fixed.

## Limits

Browser data is a fixture, not a live account or production MongoDB. External sync services and production data were not modified. A direct LeetCode probe timed out in this runtime; no live provider validation is claimed. No deployment, migration or production write was performed.
