---
version: alpha
name: QnA Portal
description: A focused workspace for developer knowledge, conversations, and career discovery.
colors:
  primary: "#2463eb"
  action: "#245bd8"
  on-action: "#ffffff"
  canvas: "#f6f7f9"
  surface: "#ffffff"
  ink: "#1d2533"
  secondary: "#536074"
  muted: "#667085"
  border: "#e0e4eb"
  success: "#13734a"
  danger: "#b42318"
  dark-canvas: "#12151b"
  dark-surface: "#1b2029"
  dark-ink: "#f1f3f8"
  dark-primary: "#8eabff"
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

The bundled awesome-design-md Linear study informs surface layering, fine borders, restrained emphasis, and compact navigation. It is a static reference, not a claim about Linear's current website. Preserve QnA Portal's blue identity and light default, with a charcoal dark theme. The signature is a quiet navigation rail beside readable discussion cards with author identity and an explicit question/article/job label.

Runtime CSS is canonical (Model B). This file documents the accepted system; it does not generate CSS. Avoid ornamental gradients, floating-card animations, fabricated statistics, or large marketing heroes in working screens.

## Colors

Light surfaces separate white content from a cool neutral canvas. Dark surfaces use charcoal rather than saturated navy. Blue means navigation, focus, selection, or the primary action; green means accepted/helpful outcomes, and red means an error or destructive consequence.

Mapping: colors.canvas → --bg-primary; colors.surface → --bg-card; colors.ink → --text-primary; colors.secondary → --text-secondary; colors.muted → --text-muted; colors.border → --line. colors.primary → --brand-rgb (36 99 235), colors.dark-primary → the dark override (142 171 255). Tailwind primary.blue consumes rgb(var(--brand-rgb) / alpha); feature CSS consumes the same role. Solid buttons use --action/--on-action, not the link token, so white text stays legible in both themes. Focus uses --focus. Success and danger use --success/--danger. Change CSS and this document together.

## Typography

Use the installed system sans stack for headings and body; no external font request or late font swap. Headings are compact with modest negative tracking. Discussion titles use 19px/650, body 14px/1.7, navigation 13px, and utility text 11–12px. Monospace is reserved for code. Tabular numerals distinguish rankings and point counts. Keep original member content and names; do not impose truncation on ranking identities.

## Layout

A 1440px shell has a 208px navigation rail and a flexible content column, with a 36px gap and 32px gutters. At 1200px, use a 190px rail and 24px gap/gutters. Below 1024px, navigation becomes a modal drawer. At 768px, use 16px page gutters and a 64px header.

The feed owns its optional 264px highlights rail; the shell does not add another rail. Below 1200px the feed highlights move below content. Feed cards have 22px padding, reduced to 18px on mobile. Keep the document as the page scroll owner; only the navigation drawer/rail and overflow tables scroll internally. No fixed page height.

## Elevation & Depth

Static cards use tonal separation and 1px borders. A small hover shadow belongs only to navigable feed cards in light mode; dark mode uses borders. Overlays use a restrained dim backdrop. Avoid transform-based hover lift that moves content or controls.

## Shapes

Controls are 8px, panels 12px, and chips 6px. Member avatars use 10px corners, or 8px for compact previews. Keep semantic chips visually quieter than actions. Borders encode boundaries rather than decoration.

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
| Two competing right rails squeezed the home feed | Shell now owns navigation only; Home owns highlights |
| External font loading and isolated blue literals | System typography and theme-aware semantic tokens |
| Offscreen mobile links could receive focus | Closed drawer is unmounted; native modal contains focus when open |
| Rankings used dense text boards and white borders in light mode | Semantic table, visible metrics, real server-backed views |
| Older feature forms/dialogs have separate behavior | Preserve their contracts and migrate in focused follow-up tasks; shared visuals apply now |

