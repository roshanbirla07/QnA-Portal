---
version: alpha
name: QnA Portal
description: A focused workspace for developer knowledge, conversations, and career discovery.
colors:
  primary: "#f4c95d"
  action: "#f4c95d"
  on-action: "#211b0d"
  canvas: "#101216"
  surface: "#191c22"
  ink: "#eff1f5"
  secondary: "#c0c6d0"
  muted: "#a6adba"
  border: "#30353f"
  success: "#8cd5ad"
  danger: "#ffb4ab"
  light-canvas: "#ffffff"
  light-surface: "#ffffff"
  light-ink: "#1f2937"
  light-primary: "#80530b"
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
  panel: "10px"
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

The approved Open Hub concept draws on Hugging Face's community taxonomy, compact navigation, and public work discovery. The user selected its charcoal dark theme with warm yellow accents. This is an independent QnA identity: keep the existing platform logos and real product content; do not import the HTML review's fictional posts, people, or metrics.

Runtime CSS is canonical (Model B). This file documents the accepted system; it does not generate CSS. Dark is the first-visit default. An explicitly stored light preference remains supported; blocked storage also defaults to dark. The document boot script and Navbar resolve that preference identically to avoid a light first paint.

## Colors

Charcoal canvas (#101216), raised neutral surfaces (#191c22), cool gray secondary surfaces (#22262e), and fine borders carry hierarchy. Warm yellow means primary actions, links, focus, and selected controls. Green remains success; red remains error/destructive feedback. Do not apply yellow to every topic or decorative surface. Primary buttons pair yellow fill with dark ink, including in light mode.

Mapping: colors.canvas → --bg-primary; colors.surface → --bg-card; colors.ink → --text-primary; colors.secondary → --text-secondary; colors.muted → --text-muted; colors.border → --line. colors.primary → --brand-rgb (244 201 93), with dark amber (128 83 11) for legible light-mode links. Tailwind primary.blue and its legacy purple/pink aliases consume the same runtime brand token; their historical names do not prescribe separate palettes. Solid controls use --action/--on-action, hover uses --action-hover, focus uses --focus, and success/danger use their existing semantic tokens. Change CSS and this document together.

## Typography

Use the installed system sans stack for headings and body; no external font request or late font swap. Headings are compact with modest negative tracking. Discussion titles use 19px/650, body 14px/1.7, navigation 13px, and utility text 11–12px. Monospace is reserved for code. Tabular numerals distinguish rankings and point counts. Keep original member content and names; do not impose truncation on ranking identities.

## Layout

A 1440px shell has compact horizontal discovery navigation and a flexible content region with 32px desktop gutters (24px below 1200px). Home, Developers, Projects, Jobs, Companies, Communities, and Rankings are primary destinations. More holds the remaining existing destinations and topic links; it closes on route changes, outside interaction, or Escape. Below 1024px the existing native modal drawer owns navigation; below 768px gutters are 16px and the header is 64px.

Home opens with a centered community introduction, a real topic row, and three compact discovery columns for conversations, contributing developers, and opportunities, all sourced from existing APIs. The personalized feed follows with its existing URL filters, cursor loading, and two-column cards when space permits. Discovery and feed cards stack on phones. Keep the document as the page scroll owner; only the drawer, More dropdown, and overflow tables scroll internally. No fixed page height.

## Elevation & Depth

Static cards use tonal separation and 1px borders. A small hover shadow belongs only to navigable feed cards in light mode; dark mode uses borders. Overlays use a restrained dim backdrop. Avoid transform-based hover lift that moves content or controls.

## Shapes

Controls are 8px, panels 10px, and chips 6px. Member avatars use 10px corners, or 8px for compact previews. Keep semantic chips visually quieter than actions. Borders encode boundaries rather than decoration.

## Components

### Foundational states and owners

Shared visual recipes live in frontend/src/index.css: .btn-primary, .glass-button, .input-field, .icon-button, .topic-chip, .surface-card. All have deliberate hover and visible focus; disabled/busy states preserve geometry. PageState owns loading/empty/error treatment for migrated views. Use its loading indicator rather than inventing screen-local loaders.

SearchField owns explicit clear, input focus restoration, and IME-safe Enter. Its owning form commits navigation on submit; these navigation searches do not send autocomplete requests. Avatar owns initials and failed-image fallback. Modal uses the native dialog top layer for background isolation, focus containment, Escape, and restoration.

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
| Two competing right rails squeezed the home feed | Shell owns top navigation; Home owns its discovery columns and feed |
| External font loading and isolated blue literals | System typography and theme-aware semantic tokens |
| Offscreen mobile links could receive focus | Closed drawer is unmounted; native modal contains focus when open |
| Rankings used dense text boards and white borders in light mode | Semantic table, visible metrics, real server-backed views |
| Older feature forms/dialogs have separate behavior | Preserve their contracts and migrate in focused follow-up tasks; shared visuals apply now |


### Developer platform identity

The developer directory uses visible logo buttons for its four supported platforms (GitHub, LeetCode, Codeforces, Medium). Brand glyphs come from the existing react-icons Simple Icons package, rendered in the current text color for reliable contrast in both themes. The shared PlatformIdentity recipe in PlatformSummary is reused across directory filters, profile evidence, and connection settings. Platform identity consumes the canonical palette and typography. Directory search uses SearchField; loading, error, and empty feedback uses PageState.

### Developer Work summaries and profile setup

DeveloperProfileSettings owns identity editing, publication preferences, and per-account visibility. PlatformSummary owns the reusable Work section in the directory explorer, public profiles, and owner settings. Keep the established system sans, yellow action, neutral surfaces, and platform glyphs. The directory uses a 270px developer list beside a flexible detail panel. Selected people use a subtle yellow surface and border; platform buttons show one public summary at a time. On smaller screens a labeled native developer selector stacks above the detail panel, avoiding a long list before the work. Public-profile Work panels use two columns when space permits, with GitHub's calendar spanning the width. Mobile panels stack; stats remain readable in two columns. Green calendar intensity uses the existing success token, and absent calendar data has explanatory text rather than placeholder activity. PageState owns load/error feedback; Modal owns account-removal confirmation.

The explorer mobile Select/Listbox is native: the browser owns option navigation, touch presentation, focus, and keyboard interaction. Its label and current value remain visible; no authored listbox or combobox keyboard model is introduced.

### Approved Open Hub rollout

The charcoal/yellow palette replaces the former light/blue default. Shared control tokens, compact top navigation, homepage hierarchy, authentication surfaces, and the legacy question-card avatar/chips move together. SearchField, PageState, Avatar, Modal, data access, profile publication, and account visibility retain their existing owners. The static review remains a design reference; none of its sample data ships.
