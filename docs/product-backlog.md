# Product Backlog — Objective Tracker

**Last updated**: 2026-02-21
**Product Owner**: Product & UX Review
**Current state**: Phase 2–3 complete. P0, P1, and P2 stories implemented. 299 tests passing. Admin panel has full user org management, cycle CRUD with status transitions, org tree view, CSV import. AI integration (review/suggest/summarise) via Claude API. Network graph view alongside tree view on cascade page. Objective rollforward to new cycles.

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

## 🟢 P3 — Low (Polish & Delight — Phase 5)

### P3-1: Dark/light mode toggle

**As a** user, **I want to** switch between dark and light themes, **so that** I can use the app comfortably in any lighting.

**Spec reference**: §5.2

**Acceptance criteria**:
- [ ] Toggle in sidebar or settings
- [ ] System preference detection as default
- [ ] Preference persisted in localStorage
- [ ] All components render correctly in both modes
- [ ] Smooth transition animation between modes

---

### P3-2: Celebration animations on completion

**As a** user completing an objective or KR, **I want** a satisfying micro-animation, **so that** achievement feels rewarding.

**Spec reference**: §5.2

**Acceptance criteria**:
- [ ] Confetti or burst animation when a KR reaches 100%
- [ ] Special animation when all KRs complete (objective complete)
- [ ] Subtle but delightful — not disruptive
- [ ] Can be disabled in user preferences

---

### P3-3: Pagination on list endpoints

**As a** user in an org with ~400 people, **I want** paginated results, **so that** pages load quickly and don't transfer excessive data.

**Acceptance criteria**:
- [ ] `GET /api/admin/users` supports `?page=1&limit=50`
- [ ] `GET /api/admin/objectives` supports pagination
- [ ] Admin user table shows pagination controls (prev/next, page numbers)
- [ ] Admin objectives list shows pagination controls
- [ ] Backend iterates lazily or returns total count for efficient pagination

---

### P3-4: Rate limiting on auth endpoints

**As a** system operator, **I want** rate limiting on login, registration, and password reset endpoints, **so that** brute-force attacks are mitigated.

**Acceptance criteria**:
- [ ] Login: max 10 attempts per IP per 15 minutes
- [ ] Register: max 5 per IP per hour
- [ ] Forgot password: max 5 per email per hour
- [ ] Returns 429 with `Retry-After` header
- [ ] Configurable via environment variables

---

### P3-5: CORS configuration

**As a** system operator, **I want** CORS restricted to known origins, **so that** the API isn't accessible from arbitrary websites.

**Current behaviour**: `cors()` with no configuration allows all origins.

**Acceptance criteria**:
- [ ] `ALLOWED_ORIGINS` environment variable (comma-separated)
- [ ] Default in development: `http://localhost:5173`
- [ ] Production: configured per deployment

---

### P3-6: Password strength indicator on registration

**As a** new user, **I want to** see how strong my password is as I type, **so that** I choose a secure password.

**Acceptance criteria**:
- [ ] Visual strength meter (weak/fair/strong/very strong)
- [ ] Inline hints: "Add a number", "Add a special character", "Use 12+ characters"
- [ ] Minimum 8 characters enforced (existing requirement), but meter encourages longer passwords

---

### P3-7: Keyboard navigation improvements

**As a** power user, **I want** full keyboard navigation, **so that** I can move quickly without touching the mouse.

**Acceptance criteria**:
- [ ] Tab order makes sense on every page
- [ ] Escape closes any open modal
- [ ] Enter submits forms
- [ ] Arrow keys navigate list items (objectives, KRs)
- [ ] Focus indicators are visible and consistent

---

### P3-8: Objective detail — back navigation and breadcrumbs

**As a** user on the objective detail page, **I want** a clear way to go back and know where I came from, **so that** I don't feel lost.

**Current behaviour**: The cascade breadcrumb shows the objective's cascade ancestry, but there's no "back to dashboard" or "back to team" breadcrumb, and no browser-back awareness.

**Acceptance criteria**:
- [ ] "← Back" link at the top that goes to the previous page (dashboard, team, or cascade)
- [ ] Or: a secondary breadcrumb: "Dashboard > Objective Title"
- [ ] Back navigation preserves scroll position on the source page

---

### P3-9: Recent activity "View all" with full history

**As a** user on the dashboard, **I want to** see all my recent activity (not just the last 5), **so that** I can review my check-in history.

**Acceptance criteria**:
- [ ] "View all" link below the activity feed
- [ ] Dedicated activity page or expandable section with pagination/infinite scroll
- [ ] Filters by date range and objective

---

### P3-10: Admin panel — edit and delete company objectives

**As an** admin, **I want to** edit and delete company objectives, **so that** I can fix mistakes and manage strategy changes.

**Current behaviour**: Admin can create company objectives but cannot edit or delete them. There is no UI or API support for editing company-level objectives after creation.

**Acceptance criteria**:
- [ ] Edit button on company objective rows in the admin objectives tab
- [ ] Delete button with confirmation (only if no child objectives are linked)
- [ ] Editing uses `PUT /api/objectives/:id` (admin bypass on visibility)
- [ ] Warning shown if deleting would orphan child links

---

### P3-11: Delete objective — check for linked children

**As a** user deleting a draft objective, **I want** a warning if other objectives link to mine, **so that** I don't unknowingly break others' cascade linkages.

**Acceptance criteria**:
- [ ] Before deletion, the backend checks if any objectives have `parentObjectiveId` pointing to the deleted objective
- [ ] If linked children exist, return 409 with a message listing the linked objectives
- [ ] Frontend shows a warning modal with the list of affected objectives
- [ ] Option to proceed anyway (which nullifies the children's `parentObjectiveId`)

---

### P3-12: Shared `CascadeNode` type in the shared package

**As a** developer, **I want** the `CascadeNode` type defined in the shared package, **so that** the server response and frontend consumption are type-safe and consistent.

**Current behaviour**: `CascadeNode` is defined locally in `packages/web/src/services/cascade.api.ts`. The server produces data matching this shape ad-hoc.

**Acceptance criteria**:
- [ ] `CascadeNode` interface added to `packages/shared/src/types/`
- [ ] Server `CascadeService` imports and returns this type
- [ ] Frontend `cascade.api.ts` imports and uses this type
- [ ] Remove the local type definition

---

### P3-13: Consistent type imports in frontend API clients

**As a** developer, **I want** consistent type usage across frontend API clients, **so that** there are no duplicate types or semantic misalignments.

**Current behaviour**:
- `admin.api.ts` re-declares `ApiResponse<T>` locally instead of importing from shared
- `admin.api.ts` imports `UpdateUserInput` (repository-level type) instead of `UpdateUserAdminBody` (schema-level type)
- `auth.api.ts` defines `RegisterFormData` locally when `RegisterInput` exists in shared

**Acceptance criteria**:
- [ ] All frontend API clients import types from `@objective-tracker/shared`
- [ ] No locally duplicated type definitions
- [ ] Frontend types match the Zod schema types (not repository types)

---

### P3-14: Spec sync — document extra endpoints

**As a** developer, **I want** the spec to accurately reflect all implemented endpoints, **so that** spec and code never drift apart.

**Current behaviour**: Four endpoints are implemented but not in `docs/spec.md`:
1. `GET /api/objectives/company`
2. `GET /api/users/:id/objectives`
3. `POST /api/admin/users`
4. `PUT /api/admin/users/:id/password`

**Acceptance criteria**:
- [ ] All four endpoints added to spec §10.1 with descriptions
- [ ] Any future endpoints are added to spec in the same commit

---

### P3-15: Dashboard nudges for stale KRs

**As a** user, **I want** the dashboard to show nudges for KRs that haven't been updated recently, **so that** I remember to check in on my goals.

**Spec reference**: §5.3.1

**Acceptance criteria**:
- [ ] "Nudges" section on the dashboard
- [ ] Shows KRs with no check-in in the last 14+ days
- [ ] Friendly, encouraging tone (not nagging)
- [ ] "Check in now" action link per nudge
- [ ] AI-generated nudge text (Phase 3) or template-based (Phase 2)

---

### P3-16: Cycle switcher in the UI

**As a** user, **I want to** switch between cycles to view historical objectives, **so that** I can review past performance.

**Current behaviour**: `allCycles` is fetched in `CycleContext` but never exposed in the UI. Users can only see the active cycle.

**Acceptance criteria**:
- [ ] Cycle selector dropdown in the Layout header or sidebar
- [ ] Selecting a different cycle filters all views (dashboard, cascade, team) to that cycle
- [ ] Active cycle is the default selection
- [ ] Closed cycles are clearly labelled
- [ ] Read-only mode for closed cycles (no create/edit)

---

### P3-17: Token persistence beyond server restarts

**As a** user, **I want** my reset token and logout to survive server restarts, **so that** the auth system is reliable.

**Current behaviour**: JWT blacklist and password reset tokens are in-memory only. A server restart clears all revoked tokens and pending resets.

**Acceptance criteria**:
- [ ] Token blacklist persisted to a file (or Redis in future)
- [ ] Password reset tokens persisted to a file
- [ ] Tokens survive server restarts
- [ ] Expired tokens are cleaned up on startup

---

### P3-18: Smooth animations on all page transitions

**As a** user navigating the app, **I want** smooth page transition animations, **so that** the app feels polished and intentional.

**Spec reference**: §5.2

**Acceptance criteria**:
- [ ] Framer Motion `AnimatePresence` on route transitions
- [ ] Fade/slide transitions between pages
- [ ] No layout jank during transitions
- [ ] Animations are subtle (200–300ms) — fast enough to not feel slow

---

### P3-19: Empty state improvements across all views

**As a** new user with no objectives, **I want** helpful empty states that guide me on what to do, **so that** I'm not confused by a blank screen.

**Acceptance criteria**:
- [ ] Dashboard empty state: illustration + "Create your first objective" CTA + link to guidance
- [ ] Cascade tree empty state: "No objectives in this cycle yet" + guidance
- [ ] Team view empty state for managers with no reports: "You don't have any direct reports yet. Ask your admin to set up the org structure."
- [ ] Objective detail with no KRs: "Add your first key result to start tracking progress"
- [ ] Each empty state has an appropriate illustration or icon, a title, a description, and (where applicable) an action button

---

### P3-20: Check-in source tracking — show source icon in timeline

**As a** user viewing check-in history, **I want to** see where each check-in came from (web, Slack, or MCP), **so that** I understand my engagement patterns.

**Current behaviour**: The `source` field is stored but not displayed in `CheckInTimeline`.

**Acceptance criteria**:
- [ ] Small icon or label next to each check-in entry (🌐 Web, 💬 Slack, 🤖 MCP)
- [ ] Tooltip with the source name on hover

---

## Appendix: User Journey Map

| Journey | Entry Point | Steps | Gaps Found |
|---------|-------------|-------|------------|
| **New user onboarding** | `/register` | Register → Dashboard → Create Objective → Add KRs | No manager/level on register (P0-4), no guidance empty state (P3-19) |
| **Returning user** | `/login` | Login → Dashboard → View objectives → Check in | Error states hidden (P0-5) |
| **Password recovery** | `/forgot-password` | Forgot → Email → Reset → Login | Working ✅ |
| **Objective creation** | Dashboard CTA | Click create → Fill form → Link to parent → Add KRs | No cycle = no CTA, no explanation (P1-6) |
| **Check-in recording** | Objective detail | Click check-in → Update value → Add note → Save | Working ✅ |
| **Cascade exploration** | `/cascade` sidebar | View tree → Expand nodes → Click to detail | Company objectives missing (P0-2), error states hidden (P0-5) |
| **Team management** | `/team` sidebar | View reports → Expand → Review objectives | Can't edit report objectives (P0-3), error states hidden (P0-5) |
| **Profile management** | Sidebar user link | Avatar → Details → Password | Working ✅ |
| **Admin: user management** | `/admin` | List → Create → Assign manager → Reset password | No org placement (P1-1), weak password validation (P1-10) |
| **Admin: objectives** | `/admin` objectives tab | View all → Create company objectives | Owner shows UUID (P1-3), can't edit/delete (P3-10) |
| **Admin: cycles** | `/admin` cycles tab | List → Create → Transition status | Working ✅ (P1-2, P2-4) |
| **Admin: org tree** | `/admin` org tab | View tree → Verify hierarchy → Spot orphans | Working ✅ (P2-10) |
| **Admin: CSV import** | `/admin` users tab | Upload CSV → Preview → Import | Working ✅ (P2-5) |
| **AI coaching** | Objective detail | Click AI Review → View score + suggestions | Working ✅ (P2-1) — API endpoints for suggest + summarise also ready |
| **Cascade network** | `/cascade` toggle | Switch to Network view → Explore graph → Click node | Working ✅ (P2-2) |
| **Rollforward** | Objective detail | Click Roll Forward → Select cycle → Confirm | Working ✅ (P2-3) |
| **Slack check-in** | — | Not available | Phase 4 (P2-6) |
| **MCP interaction** | — | Not available | Phase 4 (P2-7) |
