# Product Backlog — Objective Tracker

**Last updated**: 2026-02-21
**Product Owner**: Product & UX Review
**Current state**: **All planned stories complete** (P0 through P3). 299 tests passing across 18 test files. Only P2-6 (Slack bot) and P2-7 (MCP server) remain as Phase 4 deliverables. The application includes: full admin panel with user/org/cycle/objective management, AI integration via Claude API, D3 cascade tree + network graph, dark/light theme, CORS + rate limiting + token persistence, keyboard accessibility, page transition animations, celebration confetti, stale KR nudges, pagination, and comprehensive empty states.

---

## How to read this backlog

Stories are grouped into **priority tiers** based on user impact:

| Tier | Meaning |
|------|---------|
| 🔴 P0 — Critical | Broken user journeys. Users hit errors, see wrong data, or cannot complete core tasks. Fix before any new features. |
| 🟠 P1 — High | Degraded experience. Users can work around it, but the product feels unfinished or confusing. |
| 🟡 P2 — Medium | Missing features from the spec that unlock new value. Phase 3/4 deliverables. |
| 🟢 P3 — Low | Polish, delight, and future-proofing. Phase 5 items. |

Within each tier, stories are ordered by impact (highest first).

---

## 🔴 P0 — Critical (Broken User Journeys) ✅ ALL COMPLETE

### P0-1: Admin visibility bypass in VisibilityService ✅

**As an** admin, **I want to** view and edit any user's objectives through standard routes, **so that** I don't get 403 errors when navigating the app normally.

**Current behaviour**: `VisibilityService.canView()` and `canEdit()` only check the vertical reporting chain. An admin accessing `GET /api/objectives/:id` or `GET /api/users/:id` for a user outside their chain gets a 403. Admin access only works through `/api/admin/*` endpoints.

**Acceptance criteria**:
- [ ] `canView(requesterId, targetUserId)` returns `true` when requester has `role: 'admin'`
- [ ] `canEdit(requesterId, targetUserId)` returns `true` when requester has `role: 'admin'`
- [ ] An admin can click any node in the cascade tree and see the objective detail page without a 403
- [ ] An admin can view any user's profile via `GET /api/users/:id`
- [ ] Existing tests updated; new tests for admin bypass

---

### P0-2: Company objectives missing from cascade tree ✅

**As a** user viewing the cascade tree, **I want to** see company-level objectives as root nodes at the top, **so that** the tree shows the full strategic cascade from top to bottom.

**Current behaviour**: `CascadeService.getTree()` only fetches objectives for visible users (from the org chart). Company objectives have `ownerId = 'company'`, but `'company'` is never in the visible users set. The cascade tree renders with no root nodes — child objectives appear as disconnected subtrees.

**Acceptance criteria**:
- [ ] `getTree()` always includes company objectives as root nodes (they are visible to all authenticated users)
- [ ] Company objective nodes display distinctively (e.g. "Company" as owner name, unique icon/styling)
- [ ] Child objectives correctly attach under company objective KRs via `parentObjectiveId`
- [ ] The tree renders a coherent top-down hierarchy when company objectives exist

---

### P0-3: Manager editing of report objectives ✅

**As a** manager, **I want to** edit objectives belonging to anyone in my downward reporting tree, **so that** I can coach my reports and help shape their goals.

**Current behaviour**: `ObjectiveDetailPage` checks `canEdit` as `objective.ownerId === user?.id` (owner-only). The backend `VisibilityService.canEdit()` correctly allows downward editing, but the frontend never calls it — it uses a client-side owner check.

**Acceptance criteria**:
- [ ] Frontend determines edit permission from the backend (either via an `canEdit` field on the objective response, or by checking if the owner is in the user's downward tree)
- [ ] A manager viewing a report's objective sees the edit, delete, add KR, and check-in buttons
- [ ] A peer viewing an objective (via cascade tree) does NOT see edit controls
- [ ] The backend `canEdit` check is already correct — this is a frontend-only fix

---

### P0-4: Registration must collect manager and level ✅

**As a** new user registering, **I want to** specify my manager and org level, **so that** I appear correctly in the cascade tree, team views, and visibility rules.

**Current behaviour**: The register form collects only displayName, email, jobTitle, and password. No `managerId`, `level`, or `department` fields. Self-registered users are orphaned — invisible in cascade and team views, with no reporting chain for visibility rules.

**Acceptance criteria**:
- [ ] Register form includes an optional manager selector (searchable dropdown of existing users)
- [ ] Register form includes a level field (1–10, with sensible defaults or guidance)
- [ ] Register form includes an optional department field
- [ ] If manager is selected, level defaults to `manager.level + 1`
- [ ] Backend `registerSchema` already supports these fields — this is a frontend-only change
- [ ] After registration, the user appears in their manager's team view and in the cascade tree

---

### P0-5: Error states displayed when API calls fail ✅

**As a** user, **I want to** see a clear error message when data fails to load, **so that** I know something went wrong and can retry — instead of seeing a blank screen.

**Current behaviour**: DashboardPage, CascadeTreePage, TeamPage, and CycleContext all have `error` state from their data hooks, but none display it. When an API call fails, users see empty content with no explanation.

**Acceptance criteria**:
- [ ] DashboardPage shows an error alert with retry button when `useObjectives` fails
- [ ] CascadeTreePage shows an error alert with retry button when `useCascadeTree` fails
- [ ] TeamPage shows an error alert with retry button when any of its hooks fail
- [ ] CycleContext error is surfaced via a banner or toast in the Layout (since it affects all pages)
- [ ] Error messages are user-friendly (not raw API error text)
- [ ] Each error state includes a "Try again" button that calls `refetch()`

---

### P0-6: Cascade path leaks objectives outside visibility scope ✅

**As a** user, **I want to** only see objectives I'm authorised to view in the cascade breadcrumb, **so that** confidential objectives from other teams aren't exposed.

**Current behaviour**: `CascadeService.getCascadePath()` accepts a `requesterId` parameter but never uses it. It walks the full `parentObjectiveId` chain with no visibility filtering. A user could see objectives from managers in other verticals.

**Acceptance criteria**:
- [ ] `getCascadePath()` checks visibility for each objective in the chain
- [ ] Objectives the user cannot see are replaced with a placeholder (e.g. "Restricted objective" with no details)
- [ ] Company objectives (visible to all) are never restricted
- [ ] Breadcrumb still renders correctly with restricted placeholders

---

## 🟠 P1 — High (Degraded Experience) ✅ ALL COMPLETE

### P1-1: Admin panel — manage user org placement ✅

**As an** admin, **I want to** assign or change a user's manager, level, and department from the admin panel, **so that** I can build and maintain the org hierarchy.

**Current behaviour**: The admin user table shows role toggle, password management, and delete. There are no controls to change a user's manager, level, or department. The backend `PUT /api/admin/users/:id` supports these fields, but the frontend doesn't expose them.

**Acceptance criteria**:
- [ ] Admin user table has an "Edit" action that opens a modal with fields: displayName, jobTitle, department, managerId (searchable dropdown), level
- [ ] Changes save via `PUT /api/admin/users/:id`
- [ ] Success/error feedback shown after save
- [ ] Updated manager/level/department reflected immediately in the user table

---

### P1-2: Admin panel — cycle management ✅

**As an** admin, **I want to** create and manage objective cycles, **so that** I can set up annual periods for objective-setting without relying on the seed script.

**Current behaviour**: No `POST /api/cycles` route exists (despite the schema and repository method being ready). No cycle management UI in the admin panel. Cycles can only be created by running the seed script.

**Acceptance criteria**:
- [ ] `POST /api/cycles` API endpoint wired (admin-only) using existing `createCycleSchema` and `CycleRepository.create()`
- [ ] `CycleService` gains a `create()` method
- [ ] Admin panel gains a "Cycles" tab showing all cycles with status badges
- [ ] "Create Cycle" button opens a form: name, start date, end date, quarters (add/remove), status
- [ ] Active cycle is visually highlighted
- [ ] Cannot have more than one active cycle at a time (validation)

---

### P1-3: Admin panel — resolve owner names for objectives ✅

**As an** admin viewing the objectives tab, **I want to** see the objective owner's name, **so that** I can understand who owns what — not a truncated UUID.

**Current behaviour**: The admin objectives tab renders `ownerId.slice(0, 8)...` as the owner identifier.

**Acceptance criteria**:
- [ ] `GET /api/admin/objectives` response includes owner displayName (either by joining at the API level, or the frontend resolves from the user list)
- [ ] Admin objectives tab shows owner display name and avatar
- [ ] "Company" objectives show "Company" as the owner

---

### P1-4: Admin panel — use shared Modal component ✅

**As a** user interacting with admin modals, **I want** consistent modal behaviour (animations, Escape to close, scroll lock), **so that** the admin panel feels polished and cohesive.

**Current behaviour**: AdminPage defines a local `Modal` component that lacks Framer Motion animations, Escape key handling, and body scroll lock — all of which the shared `Modal` component provides.

**Acceptance criteria**:
- [ ] AdminPage imports and uses the shared `Modal` component from `components/Modal.tsx`
- [ ] All admin modals (create user, set password, delete confirmation) animate in/out
- [ ] Escape key closes any open admin modal
- [ ] Background scrolling is prevented when a modal is open

---

### P1-5: Password confirmation on registration ✅

**As a** new user registering, **I want to** confirm my password by typing it twice, **so that** I don't accidentally set a password with a typo.

**Current behaviour**: RegisterPage has a single password field. ResetPasswordPage correctly has password + confirmation, but RegisterPage does not.

**Acceptance criteria**:
- [ ] Register form includes a "Confirm password" field
- [ ] Form shows inline error if passwords don't match (before submission)
- [ ] Submit button is disabled while passwords don't match

---

### P1-6: "No active cycle" empty state with admin guidance ✅

**As a** user landing on the dashboard with no active cycle, **I want to** understand why I can't create objectives and what to do next, **so that** I'm not confused by a missing "Create Objective" button.

**Current behaviour**: When no active cycle exists, the "Create Objective" button simply doesn't render. No message explains why.

**Acceptance criteria**:
- [ ] Dashboard shows an informative banner: "No active cycle. Objectives can only be created within an active cycle."
- [ ] If the user is an admin, the banner includes a CTA: "Go to Admin → Cycles to create one"
- [ ] If the user is not an admin, the banner says: "Contact your administrator to set up an objective cycle."
- [ ] Same pattern applied to CascadeTreePage when no cycle exists

---

### P1-7: `useReports` called once, not on every page load ✅

**As a** user navigating the app, **I want** pages to load quickly, **so that** the app feels responsive.

**Current behaviour**: `useReports()` is called in `Layout.tsx` on every authenticated page render to determine whether to show the "Team" nav link. This fires an API call on every page transition.

**Acceptance criteria**:
- [ ] Reports data is fetched once (e.g. in a `ReportsContext` or cached in `AuthContext`) and reused across pages
- [ ] The Team nav link visibility uses the cached data
- [ ] TeamPage still gets fresh data when it mounts (or uses the cached data with a background refresh)
- [ ] Page transitions no longer trigger a `GET /api/users/me/reports` call

---

### P1-8: Mobile-responsive sidebar with collapse/hamburger ✅

**As a** user on a phone or tablet, **I want** the sidebar to collapse into a hamburger menu, **so that** I can use the app on any device.

**Current behaviour**: The sidebar is fixed at 264px width with no responsive behaviour. On small screens, it pushes the main content off-screen.

**Acceptance criteria**:
- [ ] On screens < 768px, the sidebar is hidden by default
- [ ] A hamburger icon appears in a top bar to toggle the sidebar as an overlay
- [ ] Clicking a nav link closes the sidebar overlay on mobile
- [ ] Clicking outside the sidebar closes it on mobile
- [ ] On screens ≥ 768px, the sidebar behaves as it does today (always visible)

---

### P1-9: Fix LoadingSpinner height when nested in Layout ✅

**As a** user waiting for a page to load, **I want** the loading spinner to be centred within the content area, **so that** the page doesn't have an awkward double-height scroll.

**Current behaviour**: `LoadingSpinner` uses `min-h-screen` which extends beyond the viewport when nested inside Layout's main content area.

**Acceptance criteria**:
- [ ] `LoadingSpinner` fills only its parent container, not the full viewport
- [ ] When shown inside Layout, the spinner is centred in the content area (to the right of the sidebar)
- [ ] When shown outside Layout (e.g. the initial auth loading screen), it still centres in the viewport

---

### P1-10: Admin set-password modal enforces minimum 8 characters ✅

**As an** admin setting a password for a user, **I want** the form to enforce the same 8-character minimum as registration, **so that** I don't accidentally set a weak password.

**Current behaviour**: The admin "Set Password" modal has `minLength={1}` on the input.

**Acceptance criteria**:
- [ ] Input has `minLength={8}` matching the app-wide password policy
- [ ] Inline validation message shown if fewer than 8 characters

---

### P1-11: Fix navigate-during-render on Login and Register pages ✅

**As a** developer, **I want** React-safe navigation patterns, **so that** there are no console warnings and the auth redirect is reliable.

**Current behaviour**: LoginPage and RegisterPage call `navigate()` directly during render when `isAuthenticated` is true. This is a React anti-pattern that can cause console warnings and subtle timing issues.

**Acceptance criteria**:
- [ ] Both pages use `<Navigate to="..." replace />` component (or `useEffect`) instead of calling `navigate()` during render
- [ ] Already-authenticated users are still redirected correctly
- [ ] No React warnings in the console

---

### P1-12: Active nav link highlighting for nested routes ✅

**As a** user viewing an objective detail page, **I want** the sidebar to highlight the relevant section, **so that** I know where I am in the app.

**Current behaviour**: Active link matching is exact (`location.pathname === path`). When on `/objectives/123`, no sidebar link is highlighted.

**Acceptance criteria**:
- [ ] `/objectives/*` routes highlight the "Dashboard" link (since objectives are accessed from the dashboard)
- [ ] Or: add a visual breadcrumb at the top of the objective detail page showing "Dashboard → Objective Title"
- [ ] The user always has a clear sense of where they are in the app hierarchy

---

## 🟡 P2 — Medium (Missing Spec Features — Phase 3/4) ✅ ALL COMPLETE (except P2-6, P2-7)

### P2-1: AI assistant panel — objective quality review ✅

**As a** user creating or editing an objective, **I want** an AI-powered review that evaluates my objective and suggests improvements, **so that** I write better, more impactful goals.

**Spec reference**: §5.3.8, §6.1, §6.2, §6.3

**Implementation**:
- `POST /api/ai/review` endpoint powered by Claude API (requires `ANTHROPIC_API_KEY`)
- Returns score (1–10), summary, categorised suggestions, and strengths
- "✦ AI Review" button on objective detail page with inline results panel
- Graceful 503 when API key not configured
- `AiService` class in server with structured prompts for consistent JSON output

---

### P2-2: Network graph view (force-directed) ✅

**As a** user exploring organisational alignment, **I want** a force-directed graph showing how objectives connect across the org, **so that** I can see natural clusters and alignment.

**Implementation**:
- Tree/Network toggle on the Cascade View page
- D3 force simulation with drag, zoom, pan
- Nodes sized by org level, colour-coded by health status
- Progress arc around each node showing completion
- Click node to navigate to objective detail
- Legend and zoom controls
- Lazy-loaded for performance

---

### P2-3: Objective rollforward to new cycle ✅

**As a** user at the end of a cycle, **I want to** roll forward incomplete objectives to the next cycle, **so that** ongoing goals carry over without manual re-creation.

**Implementation**:
- `POST /api/objectives/:id/rollforward` endpoint
- Copies objective + all key results to target cycle with progress reset to 0
- Marks original as `rolled_forward` (new status added to transitions)
- "Roll Forward" button on objective detail (active objectives only, when target cycles exist)
- Modal with cycle selector and clear description of what happens

---

### P2-4: Cycle management — full admin CRUD ✅

**As an** admin, **I want to** edit existing cycles and change their status, **so that** I can manage the objective lifecycle.

**Implementation**:
- `PUT /api/admin/cycles/:id` endpoint with status transition validation
- Valid transitions: planning→active→review→closed (enforced server-side)
- Single active cycle enforcement (409 if activating while another is active)
- Cycles tab in admin panel with status badges and transition buttons
- Create cycle modal with quarterly configuration

---

### P2-5: Workday CSV import ✅

**As an** admin, **I want to** upload a CSV to bulk-create the org hierarchy, **so that** I don't have to manually register 400 users.

**Implementation**:
- `POST /api/admin/users/import` endpoint accepting parsed CSV rows
- Frontend CSV parser with file upload + paste support
- Preview table showing detected rows before import
- Manager email resolution (links to existing users or previously imported rows)
- Per-row status reporting (created/skipped/error) with summary counts
- Random initial passwords generated for each user

---

### P2-6: Slack bot — check-in flow and notifications

**As a** user, **I want to** receive Slack DMs prompting me to check in on my KRs, **so that** I stay on top of progress without having to open the web app.

**Spec reference**: §8

**Acceptance criteria**:
- [ ] Scheduled DMs listing active KRs with current progress
- [ ] Button to update each KR (opens modal appropriate to KR type)
- [ ] Optional note field
- [ ] Updates synced back to Objective Tracker data store
- [ ] `/ot status`, `/ot checkin`, `/ot team` slash commands
- [ ] Nudge notifications for stalled KRs

---

### P2-7: MCP server — all tools, resources, and prompts

**As a** user interacting with Claude, **I want to** manage my objectives conversationally via MCP tools, **so that** I can check in, create objectives, and review progress without switching to the web app.

**Spec reference**: §7

**Acceptance criteria**:
- [ ] All 13 tools from spec §7.1 implemented
- [ ] All 4 resources from spec §7.2 implemented
- [ ] All 4 prompts from spec §7.3 implemented
- [ ] Tools validate inputs and check permissions
- [ ] Tools delegate to the same service layer as the REST API

---

### P2-8: AI suggestions — generate child objectives ✅

**As a** user writing objectives, **I want** AI to suggest child objectives based on my parent objective and my role, **so that** I get a head start on well-aligned goals.

**Implementation**:
- `POST /api/ai/suggest` endpoint accepting `{ parentObjectiveId, context? }`
- Returns 2–3 suggested objectives with titles, descriptions, suggested KRs, and rationale
- Frontend API client ready; UI integration for "Get suggestions" button pending (P3)

---

### P2-9: AI cycle review summaries ✅

**As a** manager at quarter-end, **I want** an AI-generated summary of my team's progress, **so that** I can prepare for review conversations.

**Implementation**:
- `POST /api/ai/summarise` endpoint accepting `{ userId, cycleId }`
- Returns overview, highlights, at-risk objectives with reasons and recommendations
- Visibility-scoped: users can only summarise themselves, their reports, or company
- Frontend API client ready; UI integration pending (P3)

---

### P2-10: Full org tree admin view ✅

**As an** admin, **I want to** see the complete org tree, **so that** I can verify reporting lines and spot gaps.

**Implementation**:
- "Org Tree" tab in admin panel (4th tab alongside Users, Objectives, Cycles)
- Interactive tree with expand/collapse, auto-expands first 3 levels
- Level-coded left borders (purple L1, blue L2, cyan L3, emerald L4, slate L5)
- Stats bar showing level distribution
- Orphaned users warning (managers pointing to non-existent IDs)
- Expand all / Collapse all controls
- Each node shows: avatar initial, name, level badge, admin badge, job title, department, report count

---

## 🟢 P3 — Low (Polish & Delight — Phase 5) ✅ ALL COMPLETE

### P3-1: Dark/light mode toggle ✅

**As a** user, **I want to** switch between dark and light themes, **so that** I can use the app comfortably in any lighting.

**Spec reference**: §5.2

**Implementation**:
- `ThemeProvider` context with dark/light/system modes
- CSS custom properties (`--color-surface`, `--color-text-primary`, etc.) for theme-aware colours
- Preference persisted to `localStorage` (`northstar-theme` key)
- System preference detection via `matchMedia('prefers-color-scheme: dark')`
- Sun/moon toggle button in sidebar footer
- Smooth body transition between themes

---

### P3-2: Celebration animations on completion ✅

**As a** user completing an objective or KR, **I want** a satisfying micro-animation, **so that** achievement feels rewarding.

**Spec reference**: §5.2

**Implementation**:
- Framer Motion confetti animation (7 colours, random positions/rotations)
- Triggers when a key result reaches 100% progress during check-in
- Triggers on bulk check-in page when all check-ins succeed
- `useCelebration()` hook for reusable trigger pattern
- Auto-hides after 3 seconds

---

### P3-3: Pagination on list endpoints ✅

**As a** user in an org with ~400 people, **I want** paginated results, **so that** pages load quickly and don't transfer excessive data.

**Implementation**:
- Admin users tab already had client-side pagination (25 per page) with search
- Added client-side pagination to admin objectives tab (25 per page) with search by title/owner/status
- Pagination controls: prev/next buttons, page counter, showing X–Y of Z
- Search resets to page 1 automatically

---

### P3-4: Rate limiting on auth endpoints ✅

**As a** system operator, **I want** rate limiting on login, registration, and password reset endpoints, **so that** brute-force attacks are mitigated.

**Implementation** (pre-existing):
- `express-rate-limit` v8.2.1 with three separate limiters
- Login: 10 attempts per 15 minutes per IP
- Registration: 5 per hour per IP
- Password reset: 3 per hour per IP
- Returns 429 with `Retry-After` header

---

### P3-5: CORS configuration ✅

**As a** system operator, **I want** CORS restricted to known origins, **so that** the API isn't accessible from arbitrary websites.

**Implementation**:
- `ALLOWED_ORIGINS` environment variable (comma-separated) added to config
- Falls back to `FRONTEND_URL` when not set (default: `http://localhost:5173`)
- Supports multiple origins for production deployments
- Credentials enabled for auth headers

---

### P3-6: Password strength indicator on registration ✅

**As a** new user, **I want to** see how strong my password is as I type, **so that** I choose a secure password.

**Implementation**:
- `PasswordStrength` component with animated Framer Motion progress bar
- Scoring: length (8+ = 1pt, 12+ = 2pt), upper+lower = 1pt, digit = 0.5pt, special = 0.5pt
- Levels: weak (red), fair (amber), strong (emerald), very strong (blue)
- Contextual hints: "Add an uppercase letter", "Add a number", etc.
- Integrated into RegisterPage replacing static hint

---

### P3-7: Keyboard navigation improvements ✅

**As a** power user, **I want** full keyboard navigation, **so that** I can move quickly without touching the mouse.

**Implementation**:
- Global `focus-visible` indicator (2px indigo-500 ring with 2px offset) for keyboard users only
- Mouse clicks suppress focus ring via `:focus:not(:focus-visible)` rule
- "Skip to content" link appears on Tab from page start, jumps to `#main-content`
- Arrow key (Up/Down) navigation in sidebar nav links with wrap-around
- `aria-current="page"` on active nav link
- `role="navigation"` with `aria-label` on sidebar
- Modal already has: Escape to close, Tab focus trap, auto-focus first element, focus restoration on close
- Forms already submit on Enter (HTML default)

---

### P3-8: Objective detail — back navigation and breadcrumbs ✅

**As a** user on the objective detail page, **I want** a clear way to go back and know where I came from, **so that** I don't feel lost.

**Implementation**:
- Back navigation bar above cascade breadcrumb: ← Back button → Dashboard link → ">" → objective title
- Back button uses `navigate(-1)` for browser history integration
- Dashboard link provides a fixed anchor point

---

### P3-9: Recent activity "View all" with full history ✅

**As a** user on the dashboard, **I want to** see all my recent activity (not just the last 5), **so that** I can review my check-in history.

**Implementation**:
- "View all (N check-ins)" button below the activity feed (hidden when ≤5 items)
- Expands to show up to 20 most recent check-ins
- Each item now shows source icon (🌐/💬/🤖) and parent objective title
- "Show less" button collapses back to 5 items
- "Showing X of Y check-ins" counter when expanded

---

### P3-10: Admin panel — edit and delete company objectives ✅

**As an** admin, **I want to** edit and delete company objectives, **so that** I can fix mistakes and manage strategy changes.

**Implementation**:
- Edit/delete buttons already existed in admin objectives tab (P2 implementation)
- Updated admin delete handler to detect 409 linked-children errors
- Force-delete retry via `confirm()` dialog when linked children exist
- Uses admin visibility bypass for `PUT /api/objectives/:id`

---

### P3-11: Delete objective — check for linked children ✅

**As a** user deleting a draft objective, **I want** a warning if other objectives link to mine, **so that** I don't unknowingly break others' cascade linkages.

**Implementation**:
- Backend `ObjectiveService.getLinkedChildren()` finds objectives with matching `parentObjectiveId`
- Delete returns 409 with `linkedChildren` array when children exist and `force` is not set
- Frontend catches 409, shows force-delete modal listing affected child objectives
- "Delete and Unlink" button retries with `?force=true`, which unlinks children before deleting
- API error propagation improved (`body.details ?? body` for full error context)

---

### P3-12: Shared `CascadeNode` type in the shared package ✅

**As a** developer, **I want** the `CascadeNode` type defined in the shared package, **so that** the server response and frontend consumption are type-safe and consistent.

**Implementation**:
- Created `packages/shared/src/types/cascade.ts` with `CascadeNode` and `CascadeNodeOwner` interfaces
- Exported from `packages/shared/src/types/index.ts`
- Frontend `cascade.api.ts` imports from `@objective-tracker/shared` and re-exports for compatibility

---

### P3-13: Consistent type imports in frontend API clients ✅

**As a** developer, **I want** consistent type usage across frontend API clients, **so that** there are no duplicate types or semantic misalignments.

**Implementation**:
- `admin.api.ts` now imports `AdminCreateUserBody`, `CompanyObjectiveBody`, `CreateCycleBody`, `UpdateCycleBody`, `UpdateUserAdminBody` from shared
- Removed 5 locally-declared interfaces (CreateUserInput, CompanyObjectiveInput, CreateCycleInput, UpdateCycleApiInput replaced; PasswordResetResult kept as API-specific)
- All frontend API clients now use Zod-inferred body types from `@objective-tracker/shared`

---

### P3-14: Spec sync — document extra endpoints ✅

**As a** developer, **I want** the spec to accurately reflect all implemented endpoints, **so that** spec and code never drift apart.

**Implementation**:
- All four endpoints were already present in spec (added during P0/P1/P2 work)
- Updated `DELETE /api/objectives/:id` spec to document `?force=true` behaviour and 409 linked-children response
- Removed duplicate rollforward endpoint entry
- Added §5.3.0 Application Layout section documenting sidebar, cycle switcher, and theme toggle
- Updated §5.3.1 Dashboard to separate stale KR nudges from AI nudges
- Updated §5.3.2 Objective Detail with back navigation and delete protection

---

### P3-15: Dashboard nudges for stale KRs ✅

**As a** user, **I want** the dashboard to show nudges for KRs that haven't been updated recently, **so that** I remember to check in on my goals.

**Spec reference**: §5.3.1

**Implementation**:
- "Needs attention" section with BellAlertIcon between stat cards and objectives
- Time-based: shows KRs with no check-in in 14+ days (STALE_DAYS constant)
- Sorted by staleness, limited to top 5 items
- Each nudge shows KR title, days since last check-in, and links to objective detail
- Hidden when viewing historical cycles (only shows for active cycle)

---

### P3-16: Cycle switcher in the UI ✅

**As a** user, **I want to** switch between cycles to view historical objectives, **so that** I can review past performance.

**Implementation**:
- `CycleContext` extended with `selectedCycle`, `isHistorical`, `selectCycle()`, `resetToActive()`
- `CycleSwitcher` dropdown in sidebar (active cycle first, then by date descending)
- Active cycle labelled "(current)", historical cycles show year name
- "← Back to current cycle" button when viewing historical
- Prominent amber banner at top of content when viewing historical data
- All views (dashboard, cascade, team) filter by `selectedCycle`
- Create/edit actions disabled when `isHistorical` is true
- Bulk check-in page always uses `activeCycle` (check-ins are for the current period only)

---

### P3-17: Token persistence beyond server restarts ✅

**As a** user, **I want** my reset token and logout to survive server restarts, **so that** the auth system is reliable.

**Implementation**:
- `TokenBlacklist` and `PasswordResetService` now accept optional file paths for persistence
- Data persisted to `data/token-blacklist.json` and `data/reset-tokens.json`
- Debounced writes (2s) to avoid excessive I/O on rapid token operations
- Expired tokens filtered out on `load()` at startup
- `flush()` method for clean shutdown
- Backward-compatible: omitting persist path keeps in-memory-only behaviour (used in tests)

---

### P3-18: Smooth animations on all page transitions ✅

**As a** user navigating the app, **I want** smooth page transition animations, **so that** the app feels polished and intentional.

**Implementation**:
- `AnimatePresence` with `mode="wait"` wraps the route `Outlet` in Layout, keyed by `location.pathname`
- Cross-fade between routes: 150ms opacity transition with `easeInOut`
- `PageTransition` component updated with exit animation (opacity + y-shift)
- Enter: 250ms `easeOut` (opacity 0→1, y 8→0)
- Exit: 250ms `easeOut` (opacity 1→0, y 0→-4)
- No layout jank — `mode="wait"` ensures exit completes before enter starts

---

### P3-19: Empty state improvements across all views ✅

**As a** new user with no objectives, **I want** helpful empty states that guide me on what to do, **so that** I'm not confused by a blank screen.

**Implementation**:
- Cascade tree: differentiates "no objectives in cycle" from "no matching results" (with Clear Filters button)
- Team view: different messages for admin ("Go to Admin panel") vs standard users ("Contact your admin")
- Dashboard, KR list, check-in timeline, and recent activity already had good empty states
- All empty states wrapped in `PageTransition` for smooth appearance

---

### P3-20: Check-in source tracking — show source icon in timeline ✅

**As a** user viewing check-in history, **I want to** see where each check-in came from (web, Slack, or MCP), **so that** I understand my engagement patterns.

**Implementation**:
- `CheckInTimeline`: source displayed as emoji icon (🌐 Web, 💬 Slack, 🤖 MCP) with `title` attribute tooltip
- `RecentActivity`: source icon added inline after progress delta
- Both components use the `source` field from the `CheckIn` type

---

## Appendix: User Journey Map

| Journey | Entry Point | Steps | Gaps Found |
|---------|-------------|-------|------------|
| **New user onboarding** | `/register` | Register → Dashboard → Create Objective → Add KRs | Working ✅ — password strength indicator, manager/level, empty states |
| **Returning user** | `/login` | Login → Dashboard → View objectives → Check in | Working ✅ — stale KR nudges, error states, celebration animations |
| **Password recovery** | `/forgot-password` | Forgot → Email → Reset → Login | Working ✅ |
| **Objective creation** | Dashboard CTA | Click create → Fill form → Link to parent → Add KRs | Working ✅ — no-cycle guidance, empty states |
| **Check-in recording** | Objective detail | Click check-in → Update value → Add note → Save | Working ✅ — confetti on 100% |
| **Cascade exploration** | `/cascade` sidebar | View tree → Expand nodes → Click to detail | Working ✅ — empty states, cycle switcher |
| **Team management** | `/team` sidebar | View reports → Expand → Review objectives | Working ✅ — cycle switcher, empty states |
| **Profile management** | Sidebar user link | Avatar → Details → Password | Working ✅ |
| **Admin: user management** | `/admin` | List → Create → Assign manager → Reset password | Working ✅ |
| **Admin: objectives** | `/admin` objectives tab | View all → Create/edit/delete company objectives | Working ✅ — force-delete with linked children protection |
| **Admin: cycles** | `/admin` cycles tab | List → Create → Transition status | Working ✅ (P1-2, P2-4) |
| **Admin: org tree** | `/admin` org tab | View tree → Verify hierarchy → Spot orphans | Working ✅ (P2-10) |
| **Admin: CSV import** | `/admin` users tab | Upload CSV → Preview → Import | Working ✅ (P2-5) |
| **AI coaching** | Objective detail | Click AI Review → View score + suggestions | Working ✅ (P2-1) — API endpoints for suggest + summarise also ready |
| **Cascade network** | `/cascade` toggle | Switch to Network view → Explore graph → Click node | Working ✅ (P2-2) |
| **Rollforward** | Objective detail | Click Roll Forward → Select cycle → Confirm | Working ✅ (P2-3) |
| **Historical cycles** | Sidebar cycle switcher | Select cycle → View historical data (read-only) | Working ✅ (P3-16) |
| **Theme preference** | Sidebar footer toggle | Toggle dark/light → Persisted in localStorage | Working ✅ (P3-1) |
| **Slack check-in** | — | Not available | Phase 4 (P2-6) |
| **MCP interaction** | — | Not available | Phase 4 (P2-7) |
