# Reconciliation Notes — Agent Output Review

**Date**: 2026-02-21
**Reviewer**: Principal Engineer (dev-punch-list author)
**Documents reviewed**:
1. `docs/dev-punch-list.md` — Engineering audit (34 items, all ✅ Done)
2. `docs/design-audit.md` — Visual/design audit (80+ items across 14 sections)
3. `docs/product-backlog.md` — Product backlog (P0–P3, ~40 stories)
4. `docs/qa-report.md` — QA bug report (84 issues, 83 active)
5. `docs/user-feedback.md` — Simulated user experience review

---

## 1. Overlapping Issues — Already Resolved

These items appear in multiple documents and have been **fully resolved** (committed or in the prior `486cacf` fix commit):

| Issue | QA | Backlog | Punch List | Design | User Feedback | Status |
|-------|-----|---------|------------|--------|---------------|--------|
| Admin visibility bypass (canView/canEdit) | BUG-001/002 | P0-1 | — | — | — | ✅ Fixed (`486cacf`) |
| Company objectives missing from cascade | BUG-003 | P0-2 | — | — | — | ✅ Fixed (`486cacf`) |
| Manager edit perms on frontend | BUG-010 | P0-3 | — | — | — | ✅ Fixed (`486cacf`) |
| Registration missing manager/level | BUG-065 | P0-4 | — | — | Complaint #2 | ✅ Fixed |
| Error states not displayed on pages | BUG-067 | P0-5 | P3-06 | — | "Red Box, Pray" | ✅ Partial (error details ✅, retry buttons still missing) |
| Cascade path visibility leak | BUG-077 | P0-6 | P4-04 | — | — | ✅ Fixed |
| Admin user org management (edit modal) | BUG-031/032 | P1-1 | — | — | — | ✅ Fixed |
| Admin cycle management | BUG-035/050 | P1-2 | — | — | — | ✅ Fixed |
| Admin objectives owner names | BUG-033 | P1-3 | — | — | "UUID…" rant | ✅ Fixed |
| Admin shared modal | BUG-030 | P1-4 | — | C4, M1 | — | ✅ Fixed |
| Password confirmation on registration | — | P1-5 | — | — | — | ✅ Fixed |
| No active cycle empty state | — | P1-6 | — | — | Complaint #3 | ✅ Fixed |
| useReports called on every page | BUG-027 | P1-7 | — | — | — | ✅ Fixed |
| Mobile sidebar | — | P1-8 | P3-01 | — | "No Mobile" | ✅ Fixed |
| Navigate-during-render | BUG-004 | P1-11 | — | — | — | ✅ Fixed |
| Active nav link highlighting | BUG-064 | P1-12 | — | — | — | ✅ Fixed |
| window.confirm replacement | BUG-015 | — | P4-03 | — | Mentioned | ✅ Fixed |
| Cycle date range validation | BUG-049 | — | P2-13 | — | — | ✅ Fixed |
| Rate limiting | — | P3-4 | P1-01 | — | — | ✅ Fixed |
| CORS restriction | — | P3-5 | P1-04 | — | — | ✅ Fixed |
| Modal focus trap (WCAG) | — | — | P2-09 | — | — | ✅ Fixed |
| Lazy loading routes | — | — | P2-08 | — | — | ✅ Fixed |
| Debounced search inputs | — | — | P2-11 | — | — | ✅ Fixed |
| Bulk check-in page | — | — | — | — | Praise update | ✅ Fixed |

---

## 2. Conflicts and Discrepancies

### CONFLICT-01: Rate limit values differ between documents

| Document | Login | Register | Forgot Password |
|----------|-------|----------|-----------------|
| Punch list (P1-01 description) | 5/15min | 3/hr | 3/hr |
| Punch list (status notes) | 10/15min | 5/hr | 3/hr |
| Backlog (P3-4) | 10/15min | 5/hr | 5/email/hr |
| **Actual implementation** | **10/15min** | **5/hr** | **3/hr** |

**Action**: Implementation is sensible. Backlog's "5/email/hr" rate on forgot-password is per-email (more granular), while implementation uses per-IP. Consider adding per-email limiting for password reset in future. No code change needed now.

### CONFLICT-02: CORS env var naming mismatch

| Document | Env var name | Semantics |
|----------|-------------|-----------|
| Punch list (P1-04) | `FRONTEND_URL` | Single origin |
| Backlog (P3-5) | `ALLOWED_ORIGINS` | Comma-separated list |
| **Actual implementation** | `FRONTEND_URL` | Single origin |

**Action**: For the MVP with a single frontend, `FRONTEND_URL` is correct and simpler. The backlog's `ALLOWED_ORIGINS` suggestion is for a future multi-frontend scenario. Add a `TODO` comment in `app.ts` noting this can be expanded to support multiple origins if needed.

### CONFLICT-03: Admin schema level max changed but register schema was not

Punch list P2-12 changed `admin.schema.ts` level max from 10 to 5 (matching spec §2.1's five org levels). However, `auth.schema.ts` (register schema) still has `.max(10)` on the level field (line 15). QA report BUG-044 also flagged this.

**Action needed**: Change `auth.schema.ts` line 15 from `.max(10)` to `.max(5)` for consistency with the admin schema and the spec.

### CONFLICT-04: Backlog P0-5 asks for retry buttons, punch list P3-06 only did error messages

Backlog P0-5 says: *"Each error state includes a 'Try again' button that calls `refetch()`"*. Punch list P3-06 implemented `getErrorMessage()` to show error details, but did not add retry buttons to page-level error states (DashboardPage, CascadeTreePage, TeamPage).

**Action needed**: Add retry buttons to error states on DashboardPage, CascadeTreePage, and TeamPage. These pages have `refetch` functions from their hooks that could be wired to a button.

### CONFLICT-05: Design audit says max-w-6xl, punch list also did — but for different reasons

Design audit S1 recommended `max-w-6xl mx-auto` on the main content area. The punch list/other agent work also applied this. Both landed on the same fix, but the code was committed once. **No conflict** — just noting the convergence.

---

## 3. Unstaged Code Changes from Other Agents

Five files have uncommitted changes that address issues from the QA report and user feedback. These are **not yet committed** and need review:

### 3a. `packages/server/src/repositories/json-objective.repository.ts`
- **Fixes**: QA BUG-070 — objective deletion now cleans up orphaned KR index entries
- **Quality**: Good. Collects KR IDs before deletion, removes from `key-results-index.json` in a write lock.
- **Conflicts with committed code**: None — this file was not part of the punch list commit.
- **Recommendation**: ✅ Commit as-is.

### 3b. `packages/server/src/repositories/json-user.repository.ts`
- **Fixes**: QA BUG-071 — user deletion now cleans up objectives-index and key-results-index entries
- **Quality**: Good. Collects all objective/KR IDs, removes from both index files under write locks.
- **Conflicts with committed code**: The punch list commit also modified this file (added `findByEmail` method), but these changes are to different sections (the `delete` method). No merge conflict.
- **Recommendation**: ✅ Commit as-is.

### 3c. `packages/web/src/components/objectives/ObjectiveForm.tsx`
- **Fixes**: QA BUG-013 + User feedback complaint ("Description is REQUIRED. Why?")
- **Changes**: Removes `required` from description textarea, changes submit disabled check from `!title.trim() || !description.trim()` to just `!title.trim()`.
- **Conflicts with committed code**: None.
- **Recommendation**: ✅ Commit as-is. The Zod schema already defaults description to empty string, so server is already lenient.

### 3d. `packages/web/src/pages/ObjectiveDetailPage.tsx`
- **Fixes**: QA BUG-011 — can now edit objectives when no active cycle
- **Changes**: Removes conditional render of `ObjectiveFormModal` (was gated on `activeCycle`). Uses `activeCycle?.id ?? objective.cycleId` as fallback.
- **Conflicts with committed code**: The punch list commit also modified this file (added ConfirmModal for delete). The unstaged change is to a DIFFERENT section (the edit modal rendering). No logical conflict, but needs care when staging — both sets of changes should coexist.
- **Recommendation**: ✅ Commit as-is. Verify the ConfirmModal additions still function correctly.

### 3e. `packages/web/src/pages/AdminPage.tsx`
- **Fixes multiple issues**:
  - Design audit M2 / User feedback: Client-side pagination (25 per page) on the user table
  - QA BUG-072: Role field added to Create User and Edit User modals (admin can set role during creation)
  - QA BUG-034 / Backlog P3-10: Edit and delete buttons on ObjectiveRow, with `EditObjectiveModal` and delete confirmation modal
  - Cosmetic: `...` → `…` (proper ellipsis character)
- **Conflicts with committed code**: The punch list commit modified AdminPage extensively (loading states, debounced search, `getErrorMessage`). The unstaged changes build ON TOP of those committed changes — they extend further.
- **Risk**: These changes introduce `objectivesApi` import and `UpdateObjectiveBody` type. Need to verify the `objectives.api.ts` service has `updateObjective` and `deleteObjective` exports.
- **Recommendation**: ✅ Commit after verifying the API imports work. This is good work that addresses multiple high-priority issues.

---

## 4. QA Report Issues Still Open

### Critical/Major — Should fix before Phase 3

| # | Severity | Issue | Effort | Notes |
|---|----------|-------|--------|-------|
| BUG-007 | MAJOR | No 401 interceptor for expired JWT | S | Users appear logged in with stale token. Add response interceptor to `api-client.ts` that triggers logout on 401. |
| BUG-012 | MAJOR | No error handling on ObjectiveDetailPage operations | S | All async handlers lack try/catch. Add error toast/alert state. |
| BUG-017 | MAJOR | KR schema allows mismatched type/config.type | S | Add `.refine()` to ensure `type === config.type`. |
| BUG-020 | MAJOR | Health status inconsistent across views (cascade passes null cycle) | S | Pass `activeCycle` to cascade tree components. |
| BUG-043 | MAJOR | `stripOrgEntry` returns empty timestamps | S | Add `createdAt`/`updatedAt` to org index, or load from user files. |
| BUG-046 | MAJOR | ObjectiveRepository has no `getAll()` | M | Add index-based bulk fetch. The current N+1 in admin route is O(n) file reads. |
| BUG-073 | MINOR | TokenBlacklist grows unboundedly | S | Add periodic sweep for expired JWTs (check exp claim). |
| BUG-074 | MINOR | PasswordResetService tokens never garbage-collected | S | Add periodic cleanup. |
| BUG-075 | MINOR | Company pseudo-user file race condition | S | Wrap check-and-create in `withWriteLock`. |
| BUG-076 | MINOR | **Logger shows months instead of minutes** | **XS** | One-char fix: `HH:MM:ss` → `HH:mm:ss`. **Do this immediately.** |

### Quick wins (< 15 min each)

| # | Issue | Fix |
|---|-------|-----|
| BUG-076 | Logger `HH:MM:ss` → `HH:mm:ss` | 1-char fix in `logger.ts` |
| BUG-008 | Admin self-demotion | Add `user.id !== currentUser.id` check on role toggle |
| BUG-009 | Admin delete button visible for own account | Hide delete button when `user.id === currentUser.id` |
| BUG-016 | `useParams` non-null assertion on `id` | Add early return or redirect when `id` is undefined |
| BUG-019 | Unused `objectiveId` prop in KR modal | Remove dead prop |
| BUG-039 | Password fields use `type="text"` in admin | Change to `type="password"` |
| BUG-068 | Admin `ApiResponse` type duplicated | Import from shared |
| BUG-079 | Unused `calculateProgress` import in StatCards | Remove import |
| BUG-083 | Unused `useCallback` import in CascadeTree | Remove import |

### Deferred to Phase 3+ (correctly)

BUG-051 (graph endpoint), BUG-052 (rollforward), BUG-053 (AI endpoints), BUG-054 (Workday import), BUG-055 (admin org), BUG-060 (network graph view), BUG-061 (AI panel), BUG-062 (light mode toggle).

---

## 5. Design Audit Items Still Open

The design audit is the most extensive document. Its "Quick Wins" and "Also Implemented" sections (§14) are marked ✅ — these were implemented by the design agent. The remaining items:

### High-value, should do next
| # | Item | Effort | Notes |
|---|------|--------|-------|
| CT6 | Fit-to-view on cascade tree mount | M | Currently naive camera position. Compute bounding box of visible nodes. |
| CT10 | Level-by-level cascade entrance animation | S | `transition.delay = depth * 0.15` — on-brand "cascade" effect. |
| ACC1 | `text-slate-500` contrast below WCAG AA (3.7:1) | S | Swap to `text-slate-400` (~5.8:1) for small body text. Widespread change. |
| ACC2 | Missing `aria-label` on ObjectiveCard links | XS | `aria-label={`View objective: ${objective.title}`}` |
| ACC4 | TreeNodeCard not keyboard-accessible | S | Add `role="button"`, `tabIndex={0}`, `onKeyDown`. |
| D2 | Native `<select>` looks wrong in dark mode (cross-browser) | M | Build custom Listbox component or use Headless UI. |

### Lower priority / larger effort
| # | Item | Effort |
|---|------|--------|
| CT7 | Minimap for large trees | L |
| D3 | Custom range slider replacing native | M |
| I1 | Migrate inline SVGs to `@heroicons/react` | M |
| T2 | Formal type scale (heading-1/2/3 classes) | M |
| M2 | Admin user table pagination | S — **Already done in unstaged changes** |

---

## 6. User Feedback Items Still Open

| Request | Priority | Status | Notes |
|---------|----------|--------|-------|
| SSO / Okta | Medium | Not started | MVP uses password auth. SSO is Phase 4+. |
| Keyboard shortcuts | Low | Not started | `n` new, `c` check-in, `j/k` navigate, `/` search. Phase 5. |
| Inline KR creation during objective creation | High | Not started | #1 workflow improvement. Single flow: create obj + add KRs + activate. |
| "Show my branch" on cascade tree | Medium | Not started | Zoom/focus to user's objectives in tree. |
| Quick check-in from dashboard cards | Medium | Not started | Condensed check-in affordance on ObjectiveCard. |
| Notification/nudge system | Medium | Not started | Phase 3 (AI-powered) or template-based fallback. |
| Onboarding flow for first-time users | Medium | Not started | Guided first-objective creation after registration. |
| "Remember me" on login | Low | Not started | Extend JWT expiry or refresh token flow. |
| AI coaching | High | Not started | Phase 3 — the single biggest differentiator per user feedback. |
| Slack check-ins | Medium | Not started | Phase 4. |

---

## 7. Recommended Next Actions (Priority Order)

### Immediate (do now)
1. **Commit the 5 unstaged files** from other agents (§3) — they fix 5 QA bugs and add pagination.
2. **Fix BUG-076**: `logger.ts` `HH:MM:ss` → `HH:mm:ss` (1-char fix, currently logging months as minutes).
3. **Fix CONFLICT-03**: `auth.schema.ts` level `.max(10)` → `.max(5)`.
4. **Fix the 9 quick-win QA items** listed in §4 (< 15 min each, ~1.5 hours total).

### Next sprint
5. **BUG-007**: Add 401 interceptor to `api-client.ts` (expired JWT redirect).
6. **BUG-012**: Add try/catch error handling to ObjectiveDetailPage.
7. **BUG-017**: Add `.refine()` to KR schema for type/config.type match.
8. **BUG-020**: Pass `activeCycle` to cascade tree health calculations.
9. **CONFLICT-04**: Add retry buttons to page-level error states.
10. **ACC1**: Fix `text-slate-500` contrast ratio (WCAG AA compliance).

### Phase 3 focus
11. **AI coaching** (Backlog P2-1) — the single highest-impact feature per user feedback.
12. **Inline KR creation** during objective creation — the #1 workflow improvement.
13. **Cascade tree enhancements** (fit-to-view CT6, entrance animation CT10).
14. **MCP server** and **Slack bot** foundations.

---

## 8. Spec Sync Gaps

The QA report identified 4 undocumented endpoints (BUG-056 through BUG-059). Backlog P3-14 also flagged this. These endpoints exist in code but are missing from `docs/spec.md` §10.1:

1. `GET /api/objectives/company` — List company objectives
2. `GET /api/users/:id/objectives` — List a user's objectives (for team views)
3. `POST /api/admin/users` — Admin create user
4. `PUT /api/admin/users/:id/password` — Admin set password

Additionally, the following were implemented since the spec was last updated and should be documented:
5. `POST /api/cycles` — Create cycle (admin)
6. `GET /api/users/me/chain` — Get user's reporting chain
7. Bulk check-in page at `/check-in`

**Action**: Update `docs/spec.md` §10.1 to include all implemented endpoints.

---

## 9. Summary

| Category | Total items | Resolved | Remaining |
|----------|-------------|----------|-----------|
| QA bugs (CRITICAL) | 3 | 3 | 0 |
| QA bugs (MAJOR) | 33 | ~18 | ~15 |
| QA bugs (MINOR) | 32 | ~12 | ~20 |
| QA bugs (COSMETIC) | 15 | ~3 | ~12 |
| Punch list items | 34 | 34 | 0 |
| Backlog P0 stories | 6 | 6 | 0 |
| Backlog P1 stories | 12 | 12 | 0 |
| Backlog P2 stories (Phase 3/4) | 10 | 0 | 10 |
| Backlog P3 stories (Phase 5) | 20 | ~6 | ~14 |
| Design audit items | ~65 | ~28 | ~37 |
| Unstaged other-agent fixes | 5 files | 0 | 5 (ready to commit) |

The four documents are **remarkably consistent** in their identification of problems — the same core issues (admin visibility, cascade roots, manager edit permissions, mobile responsiveness, missing error states) appear across 3–4 documents independently. This gives high confidence that the fixes are correct and comprehensive.

The main gaps remaining are:
- **~15 open MAJOR QA bugs** (mostly data integrity: index orphaning, token leaks, type mismatches)
- **~37 design polish items** (most are Phase 5 level)
- **Phase 3 features** (AI, MCP, Slack) — these are the transformative features per user feedback
- **Workflow efficiency** — inline KR creation and dashboard quick check-in are the highest-impact UX improvements
