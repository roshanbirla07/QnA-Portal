---
version: alpha
name: QnA Portal
description: A focused workspace for developer knowledge, conversations, and career discovery.
colors:
  primary: "#825b00"
  action: "#f5c542"
  on-action: "#181510"
  canvas: "#f6f7f9"
  surface: "#ffffff"
  ink: "#1d2533"
  secondary: "#536074"
  muted: "#667085"
  border: "#e0e4eb"
  success: "#13734a"
  danger: "#b42318"
  dark-canvas: "#08090a"
  dark-surface: "#0f1011"
  dark-ink: "#f7f8f8"
  dark-primary: "#f5c542"
typography:
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "1.65"
  heading:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 750
    lineHeight: "1.2"
    letterSpacing: "-1px"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
rounded:
  control: "8px"
  panel: "12px"
  chip: "6px"
spacing:
  page-max: "1440px"
  desktop-gutter: "32px"
  mobile-gutter: "16px"
  card: "22px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
---

# QnA Portal Design System

## Overview

A developer's shared workspace: useful conversations lead, navigation stays quiet, and career discovery remains close at hand. Product register, English interface, developer audience. Dates and numbers on the migrated feed and rankings use en-IN; there is no Japan-market requirement.

The bundled awesome-design-md Linear study informs surface layering, fine borders, restrained emphasis, and compact navigation. It is a static reference, not a claim about Linear's current website. The approved Linear concept replaces the blue identity with warm yellow actions and selection on a near-black default theme. Explicit light preferences remain supported. The signature is a quiet navigation rail beside readable discussion cards with author identity and an explicit question/article/job label.

Runtime CSS is canonical (Model B). This file documents the accepted system; it does not generate CSS. Avoid ornamental gradients, floating-card animations, fabricated statistics, or large marketing heroes in working screens.

## Colors

Light surfaces separate white content from a cool neutral canvas. Dark surfaces use charcoal rather than saturated navy. Yellow means navigation, focus, selection, or the primary action; green means accepted/helpful outcomes, and red means an error or destructive consequence.

Mapping: colors.canvas → --bg-primary; colors.surface → --bg-card; colors.ink → --text-primary; colors.secondary → --text-secondary; colors.muted → --text-muted; colors.border → --line. colors.primary → --brand-rgb (130 91 0) in light mode, colors.dark-primary → the dark override (245 197 66). Tailwind primary.blue consumes rgb(var(--brand-rgb) / alpha); feature CSS consumes the same role. Solid buttons use --action (#f5c542), --action-hover (#ffda70), and --on-action (#181510); dark text stays legible on yellow in both themes. Light-mode links use the darker amber #825b00 for contrast. Dark canvas/card/secondary surfaces are #08090a / #0f1011 / #191a1b; primary/secondary/muted text is #f7f8f8 / #d0d6e0 / #969ba4 and borders are #23252a. Focus uses --focus. Success and danger use --success/--danger. Change CSS and this document together.

## Typography

Use the installed system sans stack for headings and body; no external font request or late font swap. Headings are compact with modest negative tracking. Discussion titles use 17px/600, body 14px/1.7, navigation 13px, and utility text 11–12px. Monospace is reserved for code. Tabular numerals distinguish rankings and point counts. Keep original member content and names; do not impose truncation on ranking identities.

## Layout

A 1440px shell has a 208px navigation rail and a flexible content column, with a 28px gap and 32px gutters. At 1200px, use a 190px rail and 24px gap/gutters. Below 1024px, navigation becomes a modal drawer. At 768px, use 16px page gutters and a 64px header. The desktop header is also 64px.

The feed owns its optional 264px highlights rail; the shell does not add another rail. Below 1200px the feed highlights move below content. Feed cards have 18px padding and a two-line excerpt. Feed filters use underlined selection, with server-backed topic links above the feed search. Keep the document as the page scroll owner; only the navigation drawer/rail and overflow tables scroll internally. No fixed page height.

## Elevation & Depth

Static cards use tonal separation and 1px borders. A small hover shadow belongs only to navigable feed cards in light mode; dark mode uses borders. Overlays use a restrained dim backdrop. Avoid transform-based hover lift that moves content or controls.

## Shapes

Controls are 8px, panels 12px, and chips 6px. Member avatars use 10px corners, or 8px for compact previews. Keep semantic chips visually quieter than actions. Borders encode boundaries rather than decoration.

## Components

### Foundational states and owners

Shared visual recipes live in frontend/src/index.css: .btn-primary, .glass-button, .input-field, .icon-button, .topic-chip, .surface-card. All have deliberate hover and visible focus; disabled/busy states preserve geometry. PageState owns loading/empty/error treatment for migrated views. Use its loading indicator rather than inventing screen-local loaders.

SearchField owns explicit clear, input focus restoration, and IME-safe Enter. Its owning form commits navigation on submit; these navigation searches do not send autocomplete requests. Avatar owns uploaded photos and missing/failed-image fallback. Eight locally rendered Boring Avatars Beam presets provide friendly default faces; stable user IDs assign the same artwork across profile, directory, feed and rankings, with display name used only when no ID exists. Existing avatar dimensions and corner tokens remain unchanged. The library palette is part of the avatar artwork, not an additional application theme. Its MIT notice ships as frontend/public/boring-avatars-license.txt. Modal uses the native dialog top layer for background isolation, focus containment, Escape, and restoration.

### Navigation and data display

AppShell owns navigation. Use real NavLinks and aria-current; active parent routes remain highlighted. Home and ranking filters are toggle buttons with aria-pressed, not incomplete ARIA tab widgets. Ranking tables retain native table semantics and rank order. On mobile, put contribution counts under the member identity while keeping rank and points visible. Rankings render the server's top 50, never invented paging or rewards.

### Forms, feedback, and overlays

Changed forms use noValidate and app-owned inline feedback. Native month picking is deliberately platform-owned; no authored calendar geometry or locale guarantee is claimed. Month applies to the monthly board; topic applies to topic leaders. Toasts use the existing react-hot-toast provider, themed by canonical CSS variables.

### Iconography and motion

Use the existing Feather react-icons family for navigation and interaction, with visible labels. Icons supplement meaning; icon-only actions have accessible names. Feedback duration is --duration-feedback (160ms); entry is --duration-content (220ms), using --ease-out. A short feed fade and drawer slide communicate arrival. Reduced motion disables meaningful movement. Global scrollbars use tokenized standards properties and WebKit fallbacks, with a forced-colors path.

### Content

Plain labels name actions. Loading, empty, and errors explain the next step. Reputation, post counts, accepted answers, badges, and spotlight come from backend/controllers/ranking.controllers.js. Monthly points are net earned points across all topics in UTC; topic leaders use lifetime topic reputation. Unfiltered topic specialists show each member's highest topic reputation.

## Do's and Don'ts

- Do keep discussion content readable and use the shared controls on new screens.
- Do preserve URL filters and reject stale async results.
- Don't create additional shell sidebars or invent counts, profiles, rewards, or unsupported time ranges.
- Don't use motion as decoration or color as the only state indicator.
- Don't claim this migration fixes legacy create/delete workflows; those require their own reviewed behavior changes.

### Migration ledger

| Previous drift | Resolution |
|---|---|
| Two competing right rails squeezed the home feed | Shell now owns navigation only; Home owns highlights |
| External font loading and isolated blue literals | System typography and theme-aware semantic tokens |
| Offscreen mobile links could receive focus | Closed drawer is unmounted; native modal contains focus when open |
| Rankings used dense text boards and white borders in light mode | Semantic table, visible metrics, real server-backed views |
| Older feature forms/dialogs have separate behavior | Preserve their contracts and migrate in focused follow-up tasks; shared visuals apply now |


### Developer platform identity

The developer directory uses visible logo buttons for its four supported platforms (GitHub, LeetCode, Codeforces, Medium). Brand glyphs come from the existing react-icons Simple Icons package, rendered in the current text color for reliable contrast in both themes. The shared PlatformIdentity recipe in PlatformSummary is reused across directory filters, profile evidence, and connection settings. No new palette or font is introduced. Directory search uses SearchField; loading, error, and empty feedback uses PageState.

### Developer Work summaries and profile setup

DeveloperProfileSettings owns identity editing, publication preferences, and per-account visibility. PlatformSummary owns the reusable Work section in the directory explorer, public profiles, and owner settings. Keep the established system sans, yellow action, neutral surfaces, and platform glyphs. The directory uses a two-column developer card grid above the selected Work detail panel. Cards show public GitHub calendars or repository counts, LeetCode solved counts and contest ratings, Codeforces ratings/ranks, and Medium recent article metadata. A yellow outlined Explore work control identifies the selected person; platform buttons show one public full summary at a time. Below 820px cards stack and a labeled native developer selector remains available. Full profile links lead directly to individual Work pages. Public-profile Work panels use two columns when space permits, with GitHub's calendar spanning the width. Mobile panels stack; stats remain readable in two columns. Green calendar intensity uses the existing success token, and absent calendar data has explanatory text rather than placeholder activity. PageState owns load/error feedback; Modal owns account-removal confirmation.

The explorer mobile Select/Listbox is native: the browser owns option navigation, touch presentation, focus, and keyboard interaction. Its label and current value remain visible; no authored listbox or combobox keyboard model is introduced.

### Linear migration — 27 October 2026

The selected Linear concept is the visual target for the shared shell, feed, developer directory, and public profile. Runtime CSS remains canonical. The existing system font stack avoids external font loading; compact headings, underlined feed filters, neutral topic chips, and layered charcoal surfaces provide the Linear direction. No synthetic member data, contribution cells, contest badges, follower counts, or unsupported Follow actions from the generated concept images are shipped. Existing public-data contracts govern every displayed metric. Preview and full calendars share the date-positioning helper so missing dates remain blank. The directory retains URL-owned developer/work selection, filters, and server pagination. This is an alternative to unmerged Open Hub PR #48, not a dependency on that branch.

Intentional drift resolution: blue/light-default → yellow/dark-default; split navigation list → comparable developer cards with existing Work detail retained. Rollback is a PR revert. No data migration.

### Authentication surfaces

AuthPage owns the login/signup form, local validation, password reveal, pending/errors, and protected-destination restoration. GitHubSignIn owns provider availability and an explicit full-page sign-in action, reusing the existing SiGithub platform logo. GitHubCallback owns the temporary callback exchange and URL cleanup. All surfaces and actions use the current QnA tokens in both themes. Existing accounts confirm their QnA password before linking GitHub; no silent account merge or automatic provider redirect is introduced.
