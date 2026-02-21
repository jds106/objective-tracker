# North Star — Design Audit

**Date**: 2026-02-21
**Auditor**: Design & Visual Quality Review
**Scope**: All frontend components in `packages/web/src/`

---

## Philosophy

> Less is more. Consistency breeds trust. Dark mode should feel premium, not compromised.
> Motion should be felt, not seen (200–300ms, ease-out). The cascade tree is THE signature visual — it must be stunning. Function always comes first, but beauty is not optional.

**Mood references**: Linear, Raycast, Vercel Dashboard, Resend. These products prove that developer-facing tools can be visually arresting while remaining supremely functional. North Star should feel like it belongs in that company — dark, quiet, confident, with moments of colour that mean something.

---

## Executive Summary

The codebase has a solid foundation: a coherent dark colour system via custom Tailwind tokens (`surface`, `surface-raised`, `health-*`), consistent use of `indigo` as the primary accent, and a disciplined component architecture. However, the execution falls short of the "beautiful and engaging" standard the spec demands. The issues cluster around six themes:

1. **The cascade tree is functional but not stunning** — it needs to be the hero.
2. **Inconsistent spacing and input styling** across pages and modals.
3. **Animations are underused** — most views mount without any entrance motion.
4. **Typography lacks a clear hierarchy scale** — everything feels the same weight.
5. **Empty states are plain text** rather than moments of delight.
6. **Admin mode visual treatment is heavy-handed** and breaks the calm.

Each section below provides exact file references, class-level specifics, and concrete remediation.

---

## 1. Colour Palette & Contrast

### What's Working

- **Semantic surface tokens** in `tailwind.config.ts` (`surface: #0f172a`, `surface-raised: #1e293b`, `surface-overlay: #334155`) create a clear depth hierarchy. This is excellent practice.
- **Health colours** (`health-on-track: #10b981`, `health-at-risk: #f59e0b`, `health-behind: #ef4444`) map cleanly to emerald/amber/red — universally understood.
- **Indigo-500/600 as primary** (`#6366f1` / `#4f46e5`) is a strong choice for dark mode — vibrant but not fatiguing.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| C1 | Medium | `tailwind.config.ts` | Only 3 surface tones defined. The gap between `surface` (`#0f172a`) and `surface-raised` (`#1e293b`) is large. There's no `surface-sunken` for inset areas (e.g. code blocks in admin, input fields). | Add `surface-sunken: '#0b1120'` and `surface-hover: '#253349'` to the palette. |
| C2 | High | `ProgressRing.tsx:39` | Hardcoded hex `colour = '#6366f1'` bypasses Tailwind's design token system. If the primary accent changes, this ring won't update. | Replace with a Tailwind-aware approach. Pass a CSS variable or use `stroke="currentColor"` with a `text-indigo-500` class on the SVG. |
| C3 | Medium | `TreeLink.tsx:22` | Hardcoded `stroke="#475569"` (slate-600). Same token bypass issue. | Use a CSS custom property: `stroke="var(--color-slate-600)"` or render with a Tailwind class. |
| C4 | Low | `AdminPage.tsx:657` (local `Modal`) | `backdrop-blur-sm` is used on the admin modal overlay but not on the shared `Modal.tsx:42` (`bg-black/60` without blur). Inconsistent depth treatment. | Add `backdrop-blur-sm` to the shared `Modal.tsx` overlay, then remove the local admin Modal entirely (see M1). |
| C5 | Medium | `UserAvatar.tsx:44` | Admin avatars use `bg-red-600` with a warning triangle icon. Red is a strong semantic signal — it reads as "danger/error", not "admin". This creates visual anxiety. | Use `bg-indigo-600` or a new admin-specific colour like `bg-violet-600` with a shield icon instead of a warning triangle. Reserve red exclusively for destructive states. |
| C6 | Medium | `Layout.tsx:23` | Admin mode applies `bg-amber-950/20` to the entire page and `bg-amber-950/40` to the sidebar. This amber wash conflicts with the app's indigo identity and makes the entire UI feel like a warning state. | Use a subtle indicator instead: a thin `border-t-2 border-amber-500` on the sidebar, or a small amber dot next to the logo. The content area should remain neutral. |
| C7 | Low | `ObjectiveCard.tsx:22` | Hover state is `hover:border-slate-600`, a tiny shift from `border-slate-700`. Nearly imperceptible. | Use `hover:border-indigo-500/30` for a more noticeable but still subtle hover — gives a hint of the primary colour. |
| C8 | Low | `AdminPage.tsx:636` (ObjectiveRow) | Status badge colours are ad-hoc: `bg-emerald-500/15 text-emerald-400` for active, `bg-indigo-500/15 text-indigo-400` for completed. The shared `StatusBadge.tsx` uses different mappings (`active = bg-indigo-500/20 text-indigo-300`). Two components, two colour systems for the same data. | Use the shared `StatusBadge` component everywhere. Delete the inline status rendering in `ObjectiveRow`. |

---

## 2. Typography

### What's Working

- Consistent use of `text-sm` for body content and `text-xs` for metadata.
- `font-semibold` and `font-bold` applied deliberately to headings.
- `truncate` used correctly on overflow-prone strings.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| T1 | High | Global | No custom font loaded. The app falls back to the browser's system sans-serif. The `index.html` has no `<link>` to a webfont and `tailwind.config.ts` defines no `fontFamily`. System fonts are fine philosophically, but they should be declared explicitly. | Add `fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] }` to Tailwind config. Load Inter from Google Fonts or bundle it. Inter is the gold standard for UI typography — designed for screens, excellent at small sizes, variable weight support. |
| T2 | Medium | Page headings | All page headings are `text-2xl font-bold text-slate-100` (DashboardPage, CascadeTreePage, TeamPage, ProfilePage, AdminPage). The sub-text is always `text-slate-400` at `text-sm` or implied. There's no formal type scale. | Define a type scale in a shared utility or Tailwind plugin: `heading-1: text-2xl font-bold tracking-tight`, `heading-2: text-lg font-semibold`, `heading-3: text-sm font-semibold uppercase tracking-wider text-slate-400` (for section labels). Use `tracking-tight` on large headings for a more premium feel. |
| T3 | Medium | `StatCards.tsx:29` | The large stat numbers use `text-3xl font-bold text-slate-100`. These are the most important numbers on the dashboard but they have no visual differentiation from headings. | Use `text-4xl font-bold tracking-tight text-white` (note: `text-white`, not `text-slate-100` — the extra brightness creates emphasis). Consider a tabular-nums variant: `font-variant-numeric: tabular-nums` via Tailwind's `tabular-nums` utility so digits don't jump when values change. |
| T4 | Low | `DashboardPage.tsx:53` | Welcome greeting is `text-2xl font-bold` — same size as all other page titles. The dashboard is the home screen; it should feel slightly more prominent. | Use `text-3xl font-bold tracking-tight` for the welcome message. The extra warmth of a larger greeting matters for engagement. |
| T5 | Low | `NotFoundPage.tsx:7` | 404 text is `text-6xl font-bold text-slate-600`. The super-low contrast makes it feel like an afterthought. | Use `text-8xl font-extrabold text-slate-800` with a subtle `bg-gradient-to-b from-slate-700 to-transparent bg-clip-text text-transparent` for a premium fade effect. |
| T6 | Low | Multiple | Labels use both `text-sm font-medium text-slate-300` (LoginPage inputs) and `text-xs font-medium text-slate-400` (MetricConfig labels). Inconsistent label hierarchy. | Standardise: all form labels should be `text-sm font-medium text-slate-300`. Sub-labels (like units or helper text) should be `text-xs text-slate-500`. |

---

## 3. Spacing & Whitespace System

### What's Working

- `space-y-6` for form field groups.
- `gap-3` and `gap-4` used consistently for card grids.
- Sidebar width of `w-64` is a good standard.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| S1 | High | `Layout.tsx:77` | Main content area uses `p-8` (32px). This is generous but creates a large gap with the sidebar. On wide monitors (1440px+), content starts 32px from the sidebar but has no `max-w-*` constraint, so text and cards stretch infinitely. | Add `max-w-7xl mx-auto` inside the main area, or `max-w-6xl` for a tighter, more editorial feel. The cascade tree page should be exempt (full-width). |
| S2 | Medium | `ProfilePage.tsx:105` | `max-w-2xl` constrains the profile, but no other page does this. DashboardPage and TeamPage have no width constraint at all. | Apply `max-w-5xl` to DashboardPage and TeamPage content. CascadeTreePage and AdminPage can remain fluid. |
| S3 | Medium | `DashboardPage.tsx:64–108` | Spacing between sections: `mt-6` (StatCards), `mt-8` (My Objectives), `mt-8` (Recent Activity). The 6→8→8 progression is inconsistent. | Normalise to `mt-8` everywhere, or better: use a section wrapper component with `space-y-10` for major sections (a `py-10` rhythm between dashboard sections). |
| S4 | Medium | Form inputs | Two different input background approaches: `bg-surface` (LoginPage, CascadeFilters, ObjectiveForm) vs `bg-slate-800` (ProfilePage). `bg-surface` resolves to `#0f172a` while `bg-slate-800` is `#1e293b`. These are visually different. | Standardise all form inputs to `bg-surface` with `border-slate-600`. The input should appear slightly inset from the `surface-raised` card it sits within. If the input is on the base surface, use `bg-surface-raised` instead. Rule: input background should always be one tone darker than its container. |
| S5 | Low | `KeyResultList.tsx:51` | KR cards use `bg-surface` (the base surface colour) inside the ObjectiveDetailPage which has no explicit background (inherits the base). This means KR cards are invisible — same background as parent. | Use `bg-surface-raised` for KR cards, or if the detail page uses `bg-surface`, make KR cards `bg-surface-raised` with `border-slate-700`. |
| S6 | Low | Modal padding | Shared `Modal.tsx` uses `px-6 py-4` for content. Admin's local `Modal` uses `p-6`. Inconsistent internal spacing. | Standardise to `p-6` for all modal content areas. |
| S7 | Low | `AdminPage.tsx:137` | Table header uses `text-xs uppercase tracking-wider` — good. But row cells use `px-4 py-3` while the header also uses `px-4 py-3`. Header should have slightly tighter vertical padding. | Header: `px-4 py-2.5`, rows: `px-4 py-3.5`. This creates a visual distinction between label and content. |

---

## 4. Layout & Alignment

### What's Working

- Sidebar navigation is clean — simple links, active state with `bg-indigo-500/20`.
- Dashboard uses a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Flexbox usage is correct throughout.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| L1 | High | `Layout.tsx` | No sidebar icons. Navigation items are text-only (`Dashboard`, `Cascade`, `Team`, `Admin`). This makes the sidebar feel unfinished and harder to scan. | Add Heroicons (outline style) to each nav item. Dashboard = `Squares2x2Icon`, Cascade = `ShareIcon` or a custom tree icon, Team = `UserGroupIcon`, Admin = `CogIcon`. Icon + label with `gap-3`. Icon size `h-5 w-5 text-slate-500`, active: `text-indigo-400`. |
| L2 | Medium | `Layout.tsx:26` | Sidebar has no visual logo mark or app identity beyond text. The logo image at `h-9` is small and purely functional. | Increase logo to `h-10` and add a subtle `ring-1 ring-slate-700` to give it definition against the dark sidebar. Consider adding a `shadow-lg shadow-indigo-500/10` glow for brand presence. |
| L3 | Medium | `CascadeTreePage.tsx:65` | The cascade tree container uses `h-[calc(100vh-4rem)]` — hardcoded offset that assumes the sidebar/header height. Fragile. | Use `h-[calc(100dvh-4rem)]` for dynamic viewport support, or better, make the page a flex child that fills remaining space with `flex-1 overflow-hidden`. |
| L4 | Medium | `ObjectiveDetailPage.tsx` | No visual separation between the header area (title/badges/progress), the edit actions, the key results section, and the check-in timeline. Everything flows in a flat `mt-8` stack. | Add `bg-surface-raised rounded-xl border border-slate-700 p-6` containers around each major section. The header area could have a subtle gradient background or a larger progress ring as a visual anchor. |
| L5 | Low | `CreateObjectiveButton.tsx:9` | The dashed "Create Objective" button has `min-h-[140px]` — a magic number. It should match the height of the `ObjectiveCard` next to it in the grid, but that height is dynamic. | Remove `min-h-[140px]` and let CSS Grid handle equal heights with `grid-auto-rows: minmax(140px, auto)` on the parent, or use `h-full` on both cards. |
| L6 | Low | `AdminPage.tsx:19` | Tab bar uses `flex gap-1 border-b border-slate-700` — the tabs sit directly adjacent to the heading with only `mt-6`. Needs more breathing room. | Add `mt-8` and `mb-2` to the tab container. Consider pill-style tabs instead of underline tabs for a more modern look: `rounded-full bg-surface-raised px-4 py-1.5` with active state `bg-indigo-600 text-white`. |

---

## 5. Visual Hierarchy

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| V1 | High | `DashboardPage.tsx` | The three stat cards and the objective grid have identical visual weight — all use `bg-surface-raised border border-slate-700`. The stats should feel like a summary bar, not three more cards competing with objectives. | Give stat cards a distinct treatment: remove the border, use a subtle `bg-gradient-to-br from-surface-raised to-surface` background, or make them borderless with a slightly larger `text-4xl` number. Alternatively, combine into a single horizontal stat bar. |
| V2 | Medium | `ObjectiveCard.tsx` | All objective cards look identical regardless of health status. The spec calls for "node border colour coded by health status" (only done in the tree). | Add a `border-l-2` or `border-l-3` accent using health colours: `border-l-emerald-500` (on track), `border-l-amber-500` (at risk), `border-l-red-500` (behind), `border-l-slate-600` (not started). Subtle but immediately scannable. |
| V3 | Medium | `CheckInTimeline.tsx` | The timeline dots are uniform `h-3 w-3 rounded-full border-2 border-slate-700 bg-surface-raised`. No colour coding by direction (positive check-in vs negative). | Colour the dots: `bg-emerald-500` for positive changes, `bg-red-500` for negative, `bg-slate-500` for zero change. The timeline should tell a story at a glance. |
| V4 | Medium | `RecentActivity.tsx:64` | All activity dots are `bg-indigo-500`. Same issue — no semantic colour. | Same fix as V3: colour-code by progress direction. |
| V5 | Low | `TeamPage.tsx` | The "Direct Reports" heading (`h3`) has the same style as the "KR Support Summary" heading. When both are visible, there's no visual priority. | Make the KR Support Summary a visually distinct component: give it a coloured top border or a subtle background tint. It's an at-a-glance health check and should stand out from the report list below. |

---

## 6. Animations & Motion (Framer Motion)

### What's Working

- `ProgressRing.tsx` — smooth `strokeDashoffset` animation at 0.8s ease-out. Beautiful.
- `ProgressBar.tsx` — width animation at 0.6s ease-out. Good.
- `TreeLink.tsx` — `pathLength` animation at 0.4s. Excellent for cascade links.
- `TreeNodeCard.tsx` — opacity fade at 0.3s for enter/exit.
- `Modal.tsx` — scale + y animation at 0.2s. Snappy.
- `CascadeTree.tsx` and `ReportCard.tsx` — expand/collapse with `AnimatePresence`.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| A1 | High | `DashboardPage.tsx` | No page entrance animation. The dashboard simply appears. For the home screen — the first thing users see — this feels static and lifeless. | Wrap the page in a `motion.div` with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3, ease: 'easeOut' }}`. Apply the same to all pages via a shared `PageTransition` wrapper. |
| A2 | High | `StatCards.tsx` | Stat cards appear instantly. These are the hero numbers of the dashboard. | Stagger-animate: wrap each card in `motion.div` with `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ delay: index * 0.1, duration: 0.3 }}`. The numbers should count up using a `useCountUp` hook (from 0 to final value over 0.6s). |
| A3 | Medium | `ObjectiveCard.tsx` | Cards appear instantly in the grid. | Stagger cards with `delay: index * 0.05` using Framer Motion's `staggerChildren` on the parent. |
| A4 | Medium | `TreeNodeCard.tsx:38` | Only opacity animation on enter/exit. The nodes should feel like they're growing into place on the tree. | Add `initial={{ opacity: 0, scale: 0.9 }}`, `animate={{ opacity: 1, scale: 1 }}`. Keep duration at 0.3s — the tree should feel organic but not slow. |
| A5 | Medium | `ProgressRing.tsx:46` | Duration of 0.8s is slightly too long. The ring animation fires every mount, including when navigating between pages — stale rings re-animating feels jarring. | Reduce to 0.5s. Add `key={progress}` to only re-animate when the value actually changes (not on every render). Consider using `initial={false}` after first mount to prevent re-animation on navigation. |
| A6 | Low | `Layout.tsx` | Sidebar has no entrance animation. | Animate sidebar with `initial={{ x: -20, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`, `transition={{ duration: 0.3 }}` on first load only. |
| A7 | Low | Login/Register pages | Forms appear without animation on a dark void background. The auth experience should feel welcoming. | Fade up the logo and form card with a staggered entrance: logo first (0.2s delay), then card (0.4s delay). The form card could have a subtle `shadow-xl shadow-indigo-500/5` glow. |
| A8 | Low | `ZoomControls.tsx` | Zoom transitions use `duration(300)` and `duration(500)` (D3 transitions, not Framer). These feel appropriate. | No change needed — just noting these are correctly timed. |

---

## 7. Icon Consistency

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| I1 | High | Global | All icons are inline SVGs, copy-pasted from Heroicons. This means ~15+ raw SVG elements scattered across components, each with slightly different `strokeWidth` values (1, 1.5, 2, 2.5). | Install `@heroicons/react` and use the `outline` (24px, strokeWidth 1.5) variant consistently. This ensures uniform visual weight and reduces bundle clutter. Standardise on `strokeWidth={1.5}` for 24px icons and `strokeWidth={2}` for 16px icons (mini). |
| I2 | Medium | `Layout.tsx` | Navigation has zero icons — only text labels. See L1. | Add Heroicons as described in L1. |
| I3 | Medium | `UserAvatar.tsx:48` | Admin avatar uses an exclamation-triangle icon (`ExclamationTriangleIcon`). This icon conveys danger, not authority. | Replace with a `ShieldCheckIcon` or `StarIcon`. |
| I4 | Low | `EmptyState.tsx` | Empty state icons are passed as children — each caller inlines a different SVG with different `strokeWidth`. The dashboard empty state uses `strokeWidth={1}` while others vary. | Create a standard set of empty state illustrations or at minimum standardise on `strokeWidth={1.5}` for all empty state icons at `h-12 w-12`. Better yet: use a simple, custom illustration component with a subtle gradient or animated element. |
| I5 | Low | `ZoomControls.tsx:12` | Zoom in/out buttons use plain text characters (`+`, `−`) rather than icons. This feels inconsistent with the icon-based UI elsewhere. | Use `PlusIcon` and `MinusIcon` from Heroicons at `h-4 w-4`. |

---

## 8. Dark Mode Quality

### What's Working

- The dark-first approach is correct: `class="dark"` on `<html>`, body styled with `bg-surface text-slate-100 antialiased`.
- Custom surface tokens create genuine depth without relying on Tailwind's default dark colours.
- Border colours (`border-slate-700`) are subtle and well-chosen.
- Focus rings use `focus:ring-indigo-500` consistently.

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| D1 | High | `tailwind.config.ts` | `darkMode: 'class'` is configured but no light mode exists. That's fine for now, but `surface` colours are hardcoded hex values that won't adapt. When light mode arrives, every `bg-surface` and `bg-surface-raised` usage will need to change. | Future-proof: define colours as CSS custom properties in `index.css` under `:root` (light) and `.dark` (dark), then reference them in Tailwind as `rgb(var(--surface))`. This is a Phase 5 concern but worth noting now. |
| D2 | Medium | Form `<select>` elements | `CascadeFilters.tsx`, `MetricConfig.tsx`, `ParentLinkSelector.tsx` — native `<select>` elements on dark backgrounds look different across browsers. The dropdown options often render with white backgrounds in some browsers (Chrome on Windows). | Add a custom select component or at minimum apply `-webkit-appearance: none` and style the dropdown arrow. Alternatively, build a Listbox component using Headless UI for consistent cross-browser rendering. |
| D3 | Medium | `PercentageConfig.tsx:21` | The native range slider with `accent-indigo-500` has poor cross-browser support in dark mode. On some browsers, the track is light grey against the dark card. | Replace with a custom range slider: a `div` track (`bg-slate-700 rounded-full h-2`) with a `motion.div` fill and a draggable thumb. This gives full control over the dark-mode appearance and adds a micro-interaction. |
| D4 | Low | `MilestoneConfig.tsx:57` | Checkbox styling uses `border-slate-600 bg-surface text-indigo-600`. Native checkboxes render inconsistently in dark mode. | Use Tailwind's `@tailwindcss/forms` plugin or a custom toggle checkbox for consistent dark-mode rendering. |
| D5 | Low | Scrollbars | No custom scrollbar styling. In dark mode, the default browser scrollbar (light grey on white) stands out on modal content areas and the cascade tree dropdown. | Add scrollbar styling in `index.css`: `::-webkit-scrollbar { width: 6px; }`, `::-webkit-scrollbar-track { background: transparent; }`, `::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }`. |

---

## 9. Empty States

### What's Working

- A shared `EmptyState` component exists with icon, title, description, and action slots.
- Used in DashboardPage (no objectives) and TeamPage (no reports).

### Issues

| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| E1 | High | `EmptyState.tsx` | The component is functional but uninspired. A `py-12` container with a grey icon, `text-lg` title, and `text-sm` description. For a product that wants to "convert sceptics" into engaged users, empty states are critical first impressions. | Elevate the design: (1) Replace raw SVG icons with a subtle illustration — even a styled SVG composition with indigo/slate gradients. (2) Increase icon container to `h-16 w-16` with a `rounded-2xl bg-indigo-500/10 p-4` wrapper. (3) Add a soft `motion.div` fade-in. (4) Make the title `text-xl font-semibold text-slate-100` and the description `text-sm text-slate-400 max-w-md`. |
| E2 | Medium | `RecentActivity.tsx:53` | "No recent activity" is a plain `text-sm text-slate-500 py-4` string. No icon, no action. | Use the shared `EmptyState` with a `ClockIcon` and a description like "Your check-in history will appear here once you start recording progress." |
| E3 | Medium | `CheckInTimeline.tsx:20` | "No check-ins recorded yet." — plain text. | Same treatment: use `EmptyState` with a timeline-themed icon and an encouraging message. |
| E4 | Medium | `KeyResultList.tsx:42` | "No key results yet." — plain text. | Use `EmptyState` with a `ChartBarIcon`. The action slot should show "Add Key Result" if `canEdit` is true. |
| E5 | Low | `CascadeFilters.tsx` + `D3CascadeTree.tsx:197` | When no cascade data exists, there's `text-sm text-slate-500 py-8 text-center`. For the hero view of the entire app, this is underwhelming. | Create a bespoke empty state for the cascade view: a faded tree illustration (SVG) with text like "Your organisation's cascade will appear here as objectives are created and linked." Add a call-to-action button: "Create your first objective". |
| E6 | Low | `AdminPage.tsx:525,545` | Company/user objectives empty states are inline `rounded-xl bg-surface-raised ... text-center text-slate-500`. Not using the shared component. | Migrate to `EmptyState` for consistency. |

---

## 10. The Cascade Tree — The Signature Visual ★

This is the most important visual in the entire application. The spec calls it the "Primary Navigation" view. It must be stunning. Currently, it's… functional.

### What's Working

- D3 `tree` layout with `nodeSize` produces a clean hierarchical layout.
- `foreignObject` for HTML-in-SVG is the right approach — gives full Tailwind/React power inside nodes.
- Cubic bezier link paths (`C` curves) look organic.
- Framer Motion `AnimatePresence` on nodes and links enables enter/exit animation.
- Zoom controls in the bottom-right are unobtrusive.
- Expand/collapse state is correctly managed via a `Set<string>`.
- Health-based border colours on node cards give immediate visual status.

### Critical Issues

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| CT1 | **Critical** | **Node cards are too small and dense.** `NODE_WIDTH = 240`, `NODE_HEIGHT = 80`. At 80px height, the card packs avatar, title, owner name, progress ring, health badge, and expand button into an unreadably tight space. The `text-xs` text is nearly illegible at default zoom. | Increase to `NODE_WIDTH = 280`, `NODE_HEIGHT = 100`. This gives breathing room. Increase `H_GAP` to 48 and `V_GAP` to 72 for more whitespace between nodes. The tree should feel spacious, not cramped. |
| CT2 | **Critical** | **No visual distinction between hierarchy levels.** Company objectives, Group Head objectives, and IC objectives all render identically. The cascade's entire purpose is to show how strategy flows down — the visual should reinforce this. | Add level-based styling: (1) Company objectives (level 1): `bg-indigo-500/10 border-indigo-500/50`, slightly wider (`320px`), `text-sm font-bold` title. (2) Mid-levels (2-3): standard styling. (3) Lower levels (4-5): slightly smaller nodes (`240px`), `text-xs`. This creates a visual pyramid. |
| CT3 | **High** | **Links are grey and flat.** `stroke="#475569" strokeWidth={1.5} strokeOpacity={0.6}`. On a dark background, these nearly disappear. The connections ARE the cascade — they should be visible and elegant. | Use `stroke="#6366f1"` (indigo-500) at `strokeOpacity={0.25}` for base links. Add a gradient effect: links flowing to "on track" children could be emerald-tinted, "behind" children red-tinted. Increase `strokeWidth` to 2. Add `strokeLinecap="round"`. |
| CT4 | **High** | **No canvas background texture.** The tree sits in `bg-slate-900/50 border border-slate-700`. This is just a slightly darker rectangle. The canvas should feel like an infinite workspace. | Add a subtle dot grid pattern to the SVG background: `<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="0.5" fill="#334155" /></pattern><rect width="100%" height="100%" fill="url(#grid)" />`. This is the standard pattern for canvas-based tools (Figma, Miro, Excalidraw). It provides spatial orientation during pan/zoom. |
| CT5 | **High** | **The expand/collapse interaction is weak.** The chevron is `h-4 w-4 text-slate-500` — tiny and hard to click. The rotation animation is correct but the visual affordance is minimal. | (1) Make the expand button a `h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center` positioned at the bottom-centre of the node card, partially overlapping the card edge (like a connector). (2) Show a child count badge: `3` children. This turns the button into both an affordance and information display. |
| CT6 | **Medium** | **The initial camera position is naive.** `zoomIdentity.translate(containerSize.width / 2, 50)` centres horizontally and offsets 50px from top. If the tree has 20+ nodes, the user sees a tiny cluster and must zoom/pan to find anything. | Implement a "fit to view" calculation on mount: compute the bounding box of all visible nodes, then apply a transform that fits them within the container with 40px padding. The `handleReset` already translates to centre — extend this logic to also compute scale. |
| CT7 | **Medium** | **No minimap.** For a tree with 400 users, pan-and-zoom alone is insufficient. Users will get lost. | Add a minimap in the bottom-left corner: a `120×80px` `<canvas>` or `<svg>` showing a simplified view of the entire tree with a viewport indicator rectangle. This is a Phase 3/5 feature but architecturally important to plan for now. |
| CT8 | **Medium** | **Node hover state is too subtle.** `hover:border-indigo-500/60` is barely noticeable when the card already has a health-coloured border. | On hover: (1) elevate with `shadow-lg shadow-indigo-500/20`, (2) scale to `1.02` with a 150ms transition, (3) increase border opacity. The card should feel interactive, not static. Note: since these are `foreignObject` elements inside SVG, ensure CSS transitions work correctly. |
| CT9 | **Low** | **The zoom controls are purely functional.** Three grey buttons in the corner. | Style them as a connected button group: `rounded-xl bg-surface-raised/80 backdrop-blur-sm border border-slate-700 p-1 shadow-lg`. Buttons inside: `hover:bg-slate-700 rounded-lg`. Add `transition-all duration-150`. The controls should feel premium and float elegantly. |
| CT10 | **Low** | **No animated entry for the entire tree.** When the page loads, all nodes appear simultaneously. | Animate the tree level by level: root nodes appear first, then children after a 150ms stagger, then grandchildren. Use Framer Motion's `transition={{ delay: depth * 0.15 }}` based on node depth. This creates a "cascade" animation that literally shows the cascade flowing down — the most on-brand animation possible. |

---

## 11. Component-Specific Issues

### AdminPage.tsx — Needs the Most Work

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| M1 | High | The admin page defines its own local `Modal` component (line 657) that's separate from the shared `Modal.tsx`. It lacks animations, backdrop blur, and escape key handling. | Delete the local `Modal` and import the shared one. Pass `isOpen={true}` since the admin modals are conditionally rendered. |
| M2 | Medium | The user table has no pagination. With 400 users, this will be a performance and UX problem. | Add client-side pagination: 25 users per page, with page controls at the bottom. Use a simple `currentPage` state with `Math.ceil(filtered.length / 25)` total pages. |
| M3 | Medium | Role badges are toggleable buttons (`onClick={handleRoleToggle}`) but look like static badges. There's no indication they're interactive. | Add a `cursor-pointer` (already present) AND a tooltip: "Click to change role". Add a confirmation step before role changes — accidentally toggling admin is dangerous. |
| M4 | Low | The "Actions" column has three text buttons crammed together. On narrow screens, they'll wrap. | Use an icon-based action menu (three-dot menu → dropdown) instead of inline buttons. This is cleaner and more space-efficient. |

### ProfilePage.tsx

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| P1 | Medium | Success/error messages use inline `div` elements that appear without animation. They also don't auto-dismiss. | Wrap messages in `motion.div` with a slide-down animation. Auto-dismiss success messages after 3 seconds using `setTimeout`. |
| P2 | Low | The avatar upload flow has no drag-and-drop. | Add a drop zone with `onDragOver`/`onDrop` handlers. Show a dashed border and "Drop image here" text when dragging. |

### Login/Register Pages

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| LR1 | Medium | No visual feedback on focus beyond the browser's default ring + the `focus:border-indigo-500`. The input should feel elevated. | Add `focus:shadow-sm focus:shadow-indigo-500/20` for a subtle glow effect. This makes focus feel intentional and premium. |
| LR2 | Low | Error messages appear without animation. | Wrap in `AnimatePresence` and `motion.div` with height + opacity transition. |

---

## 12. Accessibility Audit (Visual)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| ACC1 | High | Contrast ratio of `text-slate-500` (`#64748b`) on `bg-surface` (`#0f172a`) is approximately 3.7:1 — below the WCAG AA threshold of 4.5:1 for small text. Used extensively for metadata and descriptions. | Use `text-slate-400` (`#94a3b8`) for small body text — this achieves ~5.8:1 contrast. Reserve `text-slate-500` for truly decorative or large text only. |
| ACC2 | Medium | `ObjectiveCard.tsx` is a clickable `<Link>` wrapping content, but has no `aria-label` describing what happens on click. Screen readers will read the raw inner text. | Add `aria-label={`View objective: ${objective.title}`}`. |
| ACC3 | Medium | `ReportCard.tsx:50` — the expand/collapse trigger is a `<button>` wrapping the entire card header, but it also contains a `<Link>` to the objective inside the expanded content. Nested interactive elements. | Separate the expand trigger from card content. Make only the chevron area the expand button, not the full-width card header. |
| ACC4 | Low | `TreeNodeCard.tsx:43` — the entire card is a `div` with `onClick` but no `role="button"` or `tabIndex`. It's not keyboard-accessible. | Add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space. |

---

## 13. Recommended Design Tokens

To address the consistency issues above, I recommend extending the Tailwind config with a formal design token system:

```typescript
// tailwind.config.ts — proposed additions
{
  theme: {
    extend: {
      colors: {
        surface: {
          sunken: '#0b1120',    // Deepest — inset areas, code blocks
          DEFAULT: '#0f172a',   // Base canvas
          raised: '#1e293b',    // Cards, modals, sidebar
          overlay: '#334155',   // Tooltips, dropdowns
          hover: '#253349',     // Hover state for raised surfaces
        },
        primary: {
          DEFAULT: '#6366f1',   // indigo-500
          hover: '#818cf8',     // indigo-400
          muted: '#6366f1/20',  // 20% opacity for backgrounds
        },
        health: {
          'on-track': '#10b981',
          'at-risk': '#f59e0b',
          behind: '#ef4444',
          'not-started': '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
}
```

---

## 14. Priority Implementation Order

If I had to fix these in order, optimising for maximum visual impact with minimum code change:

### Quick Wins (< 1 hour each)
1. ✅ **A1** — Page entrance animations via `PageTransition` wrapper (all 6 pages)
2. ✅ **V2** — Health-coloured left border on objective cards (`border-l-[3px]`)
3. ✅ **CT3** — Cascade tree links now indigo (`#6366f1`), `strokeWidth={2}`, `strokeLinecap="round"`
4. ✅ **CT4** — Dot-grid canvas background on cascade tree (24px grid, `#334155` dots)
5. ✅ **L1** — Heroicons added to sidebar navigation (Dashboard, Cascade, Team, Admin)
6. ✅ **C6** — Admin amber wash removed; subtle "Admin Mode" text label kept

### Also Implemented
- ✅ **CT9** — Zoom controls redesigned as connected group with backdrop-blur, proper icons
- ✅ **CT8** — Better tree node hover: `hover:shadow-lg hover:shadow-indigo-500/10`
- ✅ **A4** — Tree nodes animate in with `scale: 0.92 → 1` on enter/exit
- ✅ **A5** — ProgressRing animation reduced to 0.5s (from 0.8s)
- ✅ **C2** — ProgressRing uses `currentColor` (via `text-indigo-500` class) instead of hardcoded hex
- ✅ **C4** — Shared Modal overlay now has `backdrop-blur-sm`
- ✅ **C7** — Objective card hover: `hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5`
- ✅ **V1** — Stat cards differentiated: gradient background, `text-4xl font-bold tracking-tight text-white tabular-nums`
- ✅ **V4** — Activity dots colour-coded: emerald (positive), red (negative), slate (zero change)
- ✅ **D5** — Custom dark scrollbar styling (`.scrollbar-thin` class in `index.css`)
- ✅ **S1** — Main content area constrained to `max-w-6xl mx-auto`
- ✅ **LR1** — Input focus glow on login/register/forgot/reset pages (`focus:shadow-sm focus:shadow-indigo-500/20`)
- ✅ **T4** — Dashboard welcome greeting upgraded to `text-3xl font-bold tracking-tight`
- ✅ **L2** — Logo upgraded to `h-10` with `ring-1 ring-slate-700`

### Medium Effort (1–3 hours each)
7. ✅ **CT1** — Cascade nodes enlarged: `NODE_WIDTH=280`, `NODE_HEIGHT=100`, `H_GAP=48`, `V_GAP=72`
8. ✅ **CT2** — Level-based styling: depth-0 nodes get `bg-indigo-500/[0.07]`, `text-sm font-bold`, "Company" label; mid-levels standard; deep levels lighter text
9. ✅ **CT5** — Expand/collapse redesigned as bottom-centre connector: `h-6 w-6 rounded-full bg-slate-700` with child count in title, hover → indigo
10. ✅ **A2** — Stat cards stagger-animate (0.1s per card) with `useCountUp` hook: numbers animate from 0 → final with ease-out cubic
11. ✅ **T1** — Inter font loaded from Google Fonts; Tailwind `fontFamily.sans` set to `['Inter', 'system-ui', ...]`
12. ✅ **E1** — EmptyState elevated: `motion.div` fade-in, `h-16 w-16 rounded-2xl bg-indigo-500/10` icon wrapper, `text-xl` title. Inline empty states in RecentActivity, CheckInTimeline, KeyResultList migrated to shared component
- ✅ **V3** — CheckInTimeline dots colour-coded: emerald (positive), red (negative), slate (zero change)

### Larger Effort (3+ hours each)
13. ✅ **CT6** — Fit-to-view on cascade tree mount: computes bounding box of all visible nodes, applies scale + translate to fit within container with 60px padding. Reset button also uses fit-to-view.
14. ✅ **CT10** — Level-by-level cascade entrance animation: nodes and links stagger by depth × 120ms. Root nodes appear first, children cascade in after.
15. ✅ **M1** — Admin user table pagination: 25 users/page with page controls, auto-resets on search. Shared `Modal` already in use.
16. ✅ **D2/D3** — Custom `Select` component (animated dropdown with Framer Motion, keyboard support, dark-mode styled) and `RangeSlider` component (draggable thumb, keyboard arrows, indigo fill track). Deployed in CascadeFilters and PercentageConfig.
17. ✅ **I1** — Migrated 20+ inline SVGs to `@heroicons/react/24/outline` across 16 files. Only intentional exceptions remain: ZoomControls (custom), AdminPage progress ring (data viz), TreeNodeCard chevron (animated).

---

## 15. Final Thought

North Star has the bones of a beautiful application. The surface token system, the indigo accent, the Framer Motion foundation, the D3 tree architecture — these are all correct decisions. What's missing is the last 20% of polish that separates "functional dark mode" from "premium dark experience."

The cascade tree is the single highest-leverage improvement. It's the view that will make or break first impressions. A tree with indigo-tinted links flowing down through increasingly specific objectives, nodes that glow with their health status, a dot-grid canvas, and a cascading entrance animation — that's the screenshot that sells the product.

Everything else — the staggered card animations, the count-up stat numbers, the sidebar icons — is table stakes for a modern web app. But the cascade tree? That's the signature. Make it stunning.
