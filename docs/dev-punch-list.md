# Development Punch List

**Generated**: 2026-02-21
**Audit scope**: Full codebase audit — shared, server, web packages
**Current phase**: Phase 2 complete, preparing for Phase 3

---

## Priority 1 — Critical (Security & Data Integrity)

### P1-01: Add rate limiting to auth endpoints
- **Package**: server
- **Files**: `src/app.ts`, new `src/middleware/rate-limit.middleware.ts`
- **Issue**: Auth endpoints (`/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`) have zero brute-force protection
- **Fix**: Add `express-rate-limit` — 5 attempts/15 min on login, 3/hour on register, 3/hour on forgot-password
- **Effort**: S

### P1-02: Add Helmet security headers
- **Package**: server
- **Files**: `src/app.ts`
- **Issue**: No CSP, X-Frame-Options, HSTS, or other security headers
- **Fix**: `app.use(helmet())` with CSP configured for API-only server
- **Effort**: S

### P1-03: Fix path traversal vulnerability in avatar deletion
- **Package**: server
- **Files**: `src/routes/user.routes.ts` lines 114-118
- **Issue**: `avatarUrl` from user data joined directly to `dataDir` — could contain `../` sequences
- **Fix**: Validate `avatarUrl` is relative, contains no `..`, and resolves within `dataDir`
- **Effort**: S

### P1-04: Restrict CORS origin
- **Package**: server
- **Files**: `src/app.ts`
- **Issue**: `cors()` called with no origin restriction — accepts all origins
- **Fix**: Read `FRONTEND_URL` from env, default to `http://localhost:5173` in dev
- **Effort**: S

### P1-05: Add React error boundaries
- **Package**: web
- **Files**: new `src/components/ErrorBoundary.tsx`, `src/App.tsx`
- **Issue**: Any render error crashes the entire application with a white screen
- **Fix**: Create ErrorBoundary component, wrap route outlet and key sections
- **Effort**: S

### P1-06: Add request logging middleware
- **Package**: server
- **Files**: `src/app.ts`
- **Issue**: No HTTP request logging — impossible to debug production issues
- **Fix**: Add `pino-http` middleware for structured request/response logging
- **Effort**: S

---

## Priority 2 — High Impact (Reliability & Quality)

### P2-01: Add visibility service unit tests
- **Package**: server
- **Files**: new `src/services/visibility.service.test.ts`
- **Issue**: Core authorisation logic (`canView`, `canEdit`) has zero direct test coverage
- **Effort**: M

### P2-02: Add cascade service unit tests
- **Package**: server
- **Files**: new `src/services/cascade.service.test.ts`
- **Issue**: Tree traversal and visibility filtering untested — critical for data exposure
- **Effort**: M

### P2-03: Add user routes integration tests
- **Package**: server
- **Files**: new `src/routes/user.routes.test.ts`
- **Issue**: 9 user endpoints completely untested — profile, avatar, password, reports, chain
- **Effort**: M

### P2-04: Add cycle routes integration tests
- **Package**: server
- **Files**: new `src/routes/cycle.routes.test.ts`
- **Issue**: Cycle listing and active cycle endpoints untested
- **Effort**: S

### P2-05: Add cascade routes integration tests
- **Package**: server
- **Files**: new `src/routes/cascade.routes.test.ts`
- **Issue**: Tree endpoint untested — no coverage for visibility filtering or cycle scoping
- **Effort**: S

### P2-06: Add Zod schema validation tests
- **Package**: shared
- **Files**: new `src/validation/*.test.ts`
- **Issue**: All 6 validation schemas untested — edge cases (empty strings, boundary values, invalid enums) not covered
- **Effort**: M

### P2-07: Add date utility tests
- **Package**: shared
- **Files**: new `src/utils/dates.test.ts`
- **Issue**: Date comparison and range-check functions have no tests
- **Effort**: S

### P2-08: Implement lazy loading for routes
- **Package**: web
- **Files**: `src/App.tsx`
- **Issue**: All page components eagerly loaded — bloats initial bundle
- **Fix**: Use `React.lazy()` + `Suspense` for all page-level routes
- **Effort**: S

### P2-09: Add modal focus trap (accessibility)
- **Package**: web
- **Files**: `src/components/Modal.tsx`
- **Issue**: Focus escapes modal — WCAG 2.1 AA violation. No focus restore on close.
- **Fix**: Implement focus trap, auto-focus first interactive element, restore focus on unmount
- **Effort**: S

### P2-10: Add loading states to admin actions
- **Package**: web
- **Files**: `src/pages/AdminPage.tsx`
- **Issue**: Role toggle, password reset, delete — buttons remain active during API calls, enabling double-clicks
- **Fix**: Disable buttons and show spinner during async operations
- **Effort**: S

### P2-11: Add debouncing to search inputs
- **Package**: web
- **Files**: `src/pages/AdminPage.tsx`, `src/components/cascade/CascadeFilters.tsx`, `src/components/objectives/ParentLinkSelector.tsx`
- **Issue**: Filtering 400+ users or tree nodes on every keystroke — laggy on slower devices
- **Fix**: Debounce with 200-300ms delay via `useDeferredValue` or custom `useDebounce` hook
- **Effort**: S

### P2-12: Fix admin schema level constraint
- **Package**: shared
- **Files**: `src/validation/admin.schema.ts` line 8
- **Issue**: Level accepts 1-10 but spec §2.1 defines only 5 levels
- **Fix**: Change `.max(10)` to `.max(5)`
- **Effort**: XS

### P2-13: Add cycle date range validation
- **Package**: shared
- **Files**: `src/validation/cycle.schema.ts`
- **Issue**: No validation that `startDate < endDate` — invalid cycles can be created
- **Fix**: Add `.refine()` to validate date ordering
- **Effort**: XS

---

## Priority 3 — Medium Impact (UX & Maintainability)

### P3-01: Mobile-responsive sidebar
- **Package**: web
- **Files**: `src/components/Layout.tsx`
- **Issue**: Fixed 16rem sidebar takes 25%+ of small screens
- **Fix**: Collapse to hamburger menu below `md` breakpoint
- **Effort**: M

### P3-02: Memoize expensive components
- **Package**: web
- **Files**: `src/components/dashboard/ObjectiveCard.tsx`, `src/components/team/ReportCard.tsx`
- **Issue**: Progress and health recalculated on every render — inefficient with many cards
- **Fix**: Wrap with `React.memo`, memoize calculations with `useMemo`
- **Effort**: S

### P3-03: Add audit logging for admin actions
- **Package**: server
- **Files**: `src/routes/admin.routes.ts`
- **Issue**: User deletions, role changes, password resets are not logged
- **Fix**: Add structured log entries before executing sensitive operations
- **Effort**: S

### P3-04: Centralise bcrypt salt rounds
- **Package**: server
- **Files**: `src/auth/password-auth.provider.ts`, `src/auth/password-reset.service.ts`, `src/routes/admin.routes.ts`
- **Issue**: `SALT_ROUNDS = 12` duplicated in 3 files
- **Fix**: Export from a single auth config module
- **Effort**: XS

### P3-05: Externalise frontend URL
- **Package**: server
- **Files**: `src/services/notification.service.ts` line 9
- **Issue**: Reset URL hardcoded to `http://localhost:5173`
- **Fix**: Read `FRONTEND_URL` from environment config
- **Effort**: XS

### P3-06: Display API error details in UI
- **Package**: web
- **Files**: Multiple pages (Login, Register, Admin, etc.)
- **Issue**: API errors with details field are caught but only generic messages shown to users
- **Fix**: Extract and display `error.details` where available
- **Effort**: S

### P3-07: Fix silent error swallowing
- **Package**: server
- **Files**: `src/routes/admin.routes.ts` lines 129-134
- **Issue**: `catch { }` block swallows all errors when loading company objectives — hides real failures
- **Fix**: Catch only `NotFoundError`, re-throw others
- **Effort**: XS

### P3-08: Add `aria-describedby` for form help text
- **Package**: web
- **Files**: `src/pages/RegisterPage.tsx`, `src/pages/ResetPasswordPage.tsx`
- **Issue**: Password hint ("At least 8 characters") is visual-only — screen readers miss it
- **Fix**: Link hint text via `aria-describedby`
- **Effort**: XS

---

## Priority 4 — Lower Impact (Polish & Future-Proofing)

### P4-01: Add objective service unit tests
- **Package**: server
- **Files**: new `src/services/objective.service.test.ts`
- **Issue**: Status transition validation, cycle checks untested at unit level
- **Effort**: M

### P4-02: Add auth provider unit tests
- **Package**: server
- **Files**: new `src/auth/password-auth.provider.test.ts`
- **Issue**: Authentication, token validation, password change logic untested
- **Effort**: M

### P4-03: Replace `window.confirm` with modal
- **Package**: web
- **Files**: `src/pages/ObjectiveDetailPage.tsx` lines 93, 106
- **Issue**: Native confirm dialog breaks design system consistency
- **Fix**: Use existing `Modal` component for delete/status change confirmations
- **Effort**: S

### P4-04: Add cascade visibility check for path endpoint
- **Package**: server
- **Files**: `src/services/cascade.service.ts` lines 80-92
- **Issue**: `getCascadePath` doesn't verify requester has visibility to the target objective
- **Fix**: Add visibility check before returning cascade path
- **Effort**: S

### P4-05: Add web package test infrastructure
- **Package**: web
- **Files**: new `vitest.config.ts`, test setup files
- **Issue**: Zero test infrastructure — no vitest config, no test utilities, no JSDOM setup
- **Effort**: M

### P4-06: Validate UUID format on route params
- **Package**: server
- **Files**: Multiple route files
- **Issue**: Route `:id` params not validated as UUID format — could cause confusing errors
- **Fix**: Add UUID validation middleware or Zod param schema
- **Effort**: S

### P4-07: Add avatar `loading="lazy"` attribute
- **Package**: web
- **Files**: `src/components/UserAvatar.tsx`
- **Issue**: Avatar images loaded eagerly — impacts performance when many avatars visible
- **Fix**: Add `loading="lazy"` to `<img>` tag
- **Effort**: XS

---

## Effort Key

| Size | Time Estimate |
|------|---------------|
| XS | < 15 min |
| S | 15-60 min |
| M | 1-3 hours |
| L | 3-8 hours |

---

## Status Tracking

| ID | Status | Notes |
|----|--------|-------|
| P1-01 | ✅ Done | `express-rate-limit` on login (10/15min), register (5/hr), password reset (3/hr) |
| P1-02 | ✅ Done | `helmet()` with CSP configured for API server |
| P1-03 | ✅ Done | Path traversal guard via `resolve`/`relative` check in avatar deletion |
| P1-04 | ✅ Done | CORS restricted to `FRONTEND_URL` env var |
| P1-05 | ✅ Done | `ErrorBoundary` component wraps app + each route section |
| P1-06 | ✅ Done | `pino-http` middleware for structured request logging |
| P2-01 | ✅ Done | 20 unit tests: canView (self, upward, downward, cross-peer, company, admin bypass), canEdit (self, downward, deny upward, peers, company) |
| P2-02 | ✅ Done | 13 unit tests: getTree (full tree, nesting, scoping, empty, cycle filter, owner info, company), getCascadePath (full/restricted/empty/unlinked), getVisibleUsers |
| P2-03 | ✅ Done | 17 integration tests: GET/PUT /me, POST /me/password, GET /me/reports, GET /me/chain, GET /:id (visibility), GET /:id/objectives |
| P2-04 | ✅ Done | 4 integration tests: GET /cycles (empty, 401), GET /cycles/active (404, 401) |
| P2-05 | ✅ Done | 5 integration tests: GET /cascade/tree (401, empty, company obj, visibility scope, cycleId filter) |
| P2-06 | ✅ Done | 70 validation tests: all schemas — login, register, forgotPassword, resetPassword, createObjective, updateObjective, 4 KR types, checkIn, createCycle, updateUserAdmin, companyObjective, updateProfile, changePassword |
| P2-07 | ✅ Done | 14 date utility tests: nowISO, toISODate, isBeforeDate, isWithinRange with edge cases |
| P2-08 | ✅ Done | `React.lazy()` + `Suspense` on all page routes |
| P2-09 | ✅ Done | Focus trap, auto-focus, focus restore in Modal — ARIA `role="dialog"` + `aria-modal` |
| P2-10 | ✅ Done | `actionLoading` state disables buttons during async ops |
| P2-11 | ✅ Done | `useDebounce(250ms)` on admin search & cascade filters |
| P2-12 | ✅ Done | Admin schema level max changed from 10 to 5 |
| P2-13 | ✅ Done | `.refine()` on cycle + quarter date ordering |
| P3-01 | ✅ Done | Mobile hamburger menu + slide-in drawer below `md` breakpoint; separate `SidebarContent` component; body scroll lock; close on route change |
| P3-02 | ✅ Done | `React.memo` + `useMemo` on `ObjectiveCard` (progress, health) and `ReportCard` (avgProgress, recency) |
| P3-03 | ✅ Done | Structured audit logs for create/update/delete/reset in admin routes |
| P3-04 | ✅ Done | `BCRYPT_SALT_ROUNDS` config param; single source in auth provider constructor |
| P3-05 | ✅ Done | `FRONTEND_URL` in config; `ConsoleNotificationService` uses it |
| P3-06 | ✅ Done | `getErrorMessage()` utility extracts Zod validation details from `ApiError.details`; applied to all 6 pages (Login, Register, ForgotPassword, ResetPassword, Admin, Profile) |
| P3-07 | ✅ Done | Admin objectives endpoint catches only `NotFoundError`, re-throws others |
| P3-08 | ✅ Done | `aria-describedby` on password fields in Register/ResetPassword/SetPassword |
| P4-01 | ✅ Done | 24 unit tests: getByUserId, getById, create (active/closed/missing cycle), update (all status transitions), delete (draft/non-draft) |
| P4-02 | ✅ Done | 18 unit tests: authenticate (valid/invalid/missing), validateToken (valid/revoked/invalid), revokeToken, verifyPassword, changePassword, hashPassword (static) |
| P4-03 | ✅ Done | `ConfirmModal` component replaces native `window.confirm` in `ObjectiveDetailPage` for objective & key result deletion; loading state + danger variant |
| P4-04 | ✅ Done | `getCascadePath` now checks `visibilityService.canView()` for each objective in the chain; returns `{ restricted: true, id }` for invisible entries |
| P4-05 | ✅ Done | `vitest.config.ts` with jsdom, `@testing-library/react` + `jest-dom` + `user-event`; test setup file; added to root projects; `getErrorMessage` utility test (8 cases) + `ConfirmModal` component test (7 cases) |
| P4-06 | ✅ Done | `validateId()` middleware on all `:id` routes (objectives, users, key-results); UUID v4 + "company" special ID; 9 unit tests |
| P4-07 | ✅ Done | `loading="lazy"` on `UserAvatar` `<img>` tag |
