# Objective Tracker — Product & Technical Specification

**Version**: 1.0  
**Date**: 2026-02-11  
**Status**: Draft

---

## 1. Vision & Purpose

Objective Tracker is an internal objective management application that makes goal-setting engaging, transparent, and effective. It visualises how individual work connects to company-level strategy through a cascading graph of objectives, and uses AI to ensure objectives are written to a high standard.

**Core belief**: Objectives drive great outcomes for people. The application must convert sceptics who view objective-setting as admin overhead into engaged participants who see the value of alignment.

---

## 2. Users & Org Structure

### 2.1 Organisation Hierarchy

| Level | Role | Approximate Count |
|-------|------|-------------------|
| 1 | CTO | 1 |
| 2 | Group Head | 3 |
| 3 | Tech Lead | 12 |
| 4 | Team Lead | 48 |
| 5 | Individual Contributor | ~336 |
| **Total** | | **~400** |

### 2.2 Org Structure Creation

The org structure can be created in two ways:

1. **Organic**: Users sign up and specify their manager. The tree builds itself.
2. **Workday CSV Import**: An admin uploads a CSV export from Workday. The system provides a column-mapping UI to identify fields: Employee ID, Full Name, Email, Job Title, Manager ID/Email, Department. The importer builds the full org tree by resolving manager references.

The structure must be flexible — people move teams, new levels can be introduced, and the hierarchy may not be perfectly uniform.

### 2.3 Authentication & Authorisation

**Authentication (MVP)**: Username (email) and password with bcrypt hashing and JWT tokens. The auth layer must be abstracted behind an interface so it can be replaced with SSO (Okta, Azure AD, etc.) in future without touching application code.

```typescript
interface AuthProvider {
  authenticate(credentials: unknown): Promise<AuthResult>;
  validateToken(token: string): Promise<User | null>;
  revokeToken(token: string): Promise<void>;
}
```

**User Roles**:

There are two roles, stored as a `role` field on the User entity:

| Role | Description |
|------|-------------|
| `admin` | Full system access — can see all users, manage the org, create company objectives, and modify any objective. Intended for a small number of system operators. |
| `standard` | Normal user — subject to vertical visibility and edit rules described below. |

**Role assignment**:

- The **first user** to register is automatically assigned the `admin` role. This bootstraps the system without requiring a separate setup step.
- All subsequent users register as `standard` by default.
- An admin can promote any user to `admin` or demote them back to `standard` via the admin panel or API (`PUT /api/admin/users/:id`).
- Role cannot be self-assigned — only an existing admin can change roles.

**Authorisation rules**:

Standard users:

- **Visibility**: Vertical only. A standard user can see objectives for:
  - Themselves
  - Anyone in their direct reporting chain upward (their manager, their manager's manager, etc. up to CTO)
  - Anyone in their reporting tree downward (their reports, their reports' reports, etc.)
  - They **cannot** see objectives for peers in other groups/teams at the same level
- **Editing**: A standard user can edit:
  - Their own objectives
  - The objectives of anyone in their downward reporting tree (managers can edit down)

Admin users:

- **Visibility**: Admins can see **all users** and **all objectives** regardless of reporting chain.
- **Editing**: Admins can edit **any user's objectives** and modify user records (role, department, manager assignment).
- **User management**: Admins can list, update, and delete users. An admin cannot delete themselves.
- **Company objectives**: Only admins can create root-level company objectives (objectives with no owner in the org hierarchy, representing top-level strategic goals).
- **Password resets**: Admins can trigger a password reset for any user, generating a temporary password.
- **Cycle management**: Only admins can create and manage objective cycles.

---

## 3. Data Model

### 3.1 Storage

- One JSON file per user, stored in a configurable directory (default: `./data/users/`)
- One JSON file for org metadata: `./data/org.json`
- One JSON file for cycle configuration: `./data/cycles.json`
- File-based storage is the MVP approach; the data access layer must be abstracted behind a repository interface to allow migration to a database later

### 3.2 Core Entities

#### User

```typescript
type UserRole = 'admin' | 'standard';

interface User {
  id: string;                    // UUID
  email: string;
  displayName: string;
  jobTitle: string;
  managerId: string | null;      // null for CTO / top-level
  level: number;                 // 1 = CTO, 2 = Group Head, etc.
  department?: string;
  avatarUrl?: string;            // Relative path to avatar image, e.g. "/avatars/{userId}.jpg"
  role: UserRole;                // 'admin' or 'standard' (see §2.3)
  createdAt: string;             // ISO 8601
  updatedAt: string;
}
```

#### Objective

```typescript
interface Objective {
  id: string;                    // UUID
  ownerId: string;               // User ID
  cycleId: string;               // Which annual cycle this belongs to
  title: string;                 // Concise objective title
  description: string;           // Brief description of the objective
  parentKeyResultId: string | null; // Links to a KR in the parent's objective (null if unlinked)
  parentObjectiveId: string | null; // The objective that contains the parent KR
  status: ObjectiveStatus;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
  rolledForwardFrom?: string;    // ID of previous cycle's objective if rolled forward
}

type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'rolled_forward';
```

#### Key Result

```typescript
interface KeyResult {
  id: string;                    // UUID
  objectiveId: string;
  title: string;
  type: KeyResultType;
  config: KeyResultConfig;
  progress: number;              // Normalised 0–100 for dashboard aggregation
  checkIns: CheckIn[];
  createdAt: string;
  updatedAt: string;
}

type KeyResultType = 'percentage' | 'metric' | 'milestone' | 'binary';

// Percentage: simple 0–100
interface PercentageConfig {
  type: 'percentage';
  currentValue: number;          // 0–100
}

// Metric: numeric with start, current, target
interface MetricConfig {
  type: 'metric';
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;                  // e.g. "incidents/month", "ms", "%"
  direction: 'increase' | 'decrease'; // Are we trying to go up or down?
}

// Milestone: ordered checkpoints
interface MilestoneConfig {
  type: 'milestone';
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }[];
}

// Binary: done or not done
interface BinaryConfig {
  type: 'binary';
  completed: boolean;
  completedAt?: string;
}

type KeyResultConfig = PercentageConfig | MetricConfig | MilestoneConfig | BinaryConfig;
```

#### Check-In

```typescript
interface CheckIn {
  id: string;
  keyResultId: string;
  userId: string;
  timestamp: string;             // ISO 8601
  previousProgress: number;
  newProgress: number;
  note?: string;                 // Optional reflection
  source: 'web' | 'slack' | 'mcp'; // Where the check-in came from
  configSnapshot?: KeyResultConfig; // Snapshot of config at check-in time
}
```

#### Cycle

```typescript
interface Cycle {
  id: string;
  name: string;                  // e.g. "FY2026"
  startDate: string;             // ISO 8601 date
  endDate: string;
  quarters: Quarter[];
  status: 'planning' | 'active' | 'review' | 'closed';
}

interface Quarter {
  id: string;
  name: string;                  // e.g. "Q1 FY2026"
  startDate: string;
  endDate: string;
  reviewDeadline: string;
}
```

### 3.3 File Structure

```
data/
  org.json                       # Org metadata & structure
  cycles.json                    # Cycle definitions
  users/
    {user-id}.json               # User profile + all their objectives
```

Each user file contains:

```typescript
interface UserFile {
  version: number;               // Optimistic locking — incremented on every write
  user: UserWithPassword;        // Includes passwordHash for auth (stripped before API responses)
  objectives: Objective[];       // All objectives across all cycles
}
```

---

## 4. Objective Cascade Model

### 4.1 How Cascading Works

1. **Company objectives** are created by the CTO at Level 1. These are the roots of the cascade graph.
2. Each company objective has **key results** that define measurable success.
3. A Group Head (Level 2) creates their own objectives. Some of these **link to a specific key result** of a company objective — meaning the Group Head's objective contributes to achieving that key result.
4. This continues down: Tech Leads link to Group Head KRs, Team Leads link to Tech Lead KRs, ICs link to Team Lead KRs.
5. At every level, **unlinked objectives are allowed and expected**. These capture level-specific concerns (e.g. "Reduce support ticket volume by 30%" at Team Lead level, or "Improve team retrospective quality" — things that don't directly cascade from above but matter locally).
6. The further down the hierarchy, the **more concrete and actionable** objectives become.

### 4.2 Cascade Validation

The AI assistant should help ensure:

- Linked objectives have a genuine causal relationship to the parent KR (not just superficial word overlap)
- The mix of linked vs. unlinked objectives is healthy (a person with zero linked objectives may be misaligned; a person with only linked objectives may be missing local concerns)
- Objectives get more specific and actionable at lower levels

### 4.3 Completion Aggregation

- Each key result has a normalised progress value (0–100)
- An objective's overall progress = average of its key results' progress
- A parent key result's "contributed progress" can optionally show the average progress of child objectives linked to it (informational, not auto-calculated — the owner still sets their own KR progress)

---

## 5. Frontend Application

### 5.1 Technology

- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **D3.js** for the network graph visualisation
- A tree layout library (e.g. react-d3-tree or custom) for the hierarchy view
- **Framer Motion** for animations and transitions

### 5.2 Design Philosophy

The UI must be **beautiful and engaging**. This is not an enterprise admin tool — it should feel like a product people *want* to use. Design principles:

- **Dark mode by default** with a light mode option
- **Vibrant accent colours** to indicate progress and health (greens for on-track, ambers for at-risk, reds for behind)
- **Smooth animations** on all transitions — expanding objectives, switching views, updating progress
- **Minimal chrome** — content-first, no unnecessary UI furniture
- **Micro-interactions** — satisfying progress updates, subtle celebrations when objectives are completed
- **Mobile-responsive** — check-ins should work well on a phone

### 5.3 Key Views

#### 5.3.1 Dashboard (Home)

The user's personal dashboard showing:

- **My Objectives**: Cards for each active objective with progress rings/bars
- **Overall Completion**: An aggregated progress metric across all objectives
- **Upcoming Check-ins**: When the next check-in is due
- **Recent Activity**: Latest check-ins from the user and their team
- **Nudges**: AI-generated suggestions (e.g. "Your KR 'Reduce latency to <200ms' hasn't been updated in 3 weeks")

#### 5.3.2 Objective Detail

A full view of a single objective:

- Title, description, status
- Parent linkage (with a visual breadcrumb showing the cascade path up to the company objective)
- Key results with detailed progress visualisation appropriate to type
- Check-in history as a timeline
- Child objectives linked to this objective's KRs (if any — for managers)
- AI assistant sidebar for editing/improving the objective

#### 5.3.3 Cascade Tree View (Primary Navigation)

A top-down hierarchical D3-powered visualisation with pan and zoom:

- Company objectives at the top, laid out using `d3-hierarchy` tree layout
- Expand/collapse nodes to navigate the tree — top two levels expanded by default
- Each node card shows: owner avatar (initials fallback), objective title, owner name, progress ring, health badge
- Node border colour coded by health status: emerald (on track), amber (at risk), red (behind), slate (not started)
- Click a node to navigate to objective detail; expand/collapse button on nodes with children
- Zoom controls (bottom-right): zoom in, zoom out, reset/fit view
- Pan by dragging the canvas; scroll to zoom
- Filter bar above tree: search by title/owner, filter by status or health
- SVG-based rendering with cubic bezier link paths between parent and child nodes
- Animated expand/collapse via Framer Motion `AnimatePresence`

#### 5.3.4 Network Graph View (Exploration)

A force-directed graph showing objective connections:

- Nodes = objectives, sized by level (company objectives are largest)
- Edges = linkages between objectives and parent KRs
- Colour-coded by owner, department, or health status (toggleable)
- Interactive: drag, zoom, hover for details, click to open
- Clusters naturally form around well-aligned teams
- Orphaned objectives (unlinked) float at the periphery — visually highlighting alignment gaps
- Toggle to highlight cross-team connections

#### 5.3.5 Team View (Manager)

For managers, a view of their direct reports' objectives. Only visible in the sidebar navigation if the current user has direct reports.

- **KR Support Summary** — colour-coded cards showing how well each of the manager's key results is supported by linked child objectives: emerald (2+ links), amber (1 link), red (0 links)
- **Report cards** — one per direct report, showing avatar, name, job title, aggregate progress ring, and check-in recency indicator:
  - "Up to date" (emerald) — last check-in within 7 days
  - "Check-in due" (amber) — 7–14 days since last check-in
  - "Overdue" (red) — >14 days since last check-in
  - "No check-ins" (red) — objectives exist but no check-ins recorded
- Each report card is expandable to show individual objectives with title, status badge, health badge, and progress bar, linking to objective detail

#### 5.3.6 Admin Panel

Accessible only to users with `role: 'admin'` (see §2.3). The admin panel provides:

- **User management**: List all users, search, update role/department/manager, delete users, trigger password resets
- **Company objectives**: Create and manage root-level company objectives that sit at the top of the cascade
- **Cycle management**: Create/edit annual cycles and quarters
- **Org structure management**: Manual adjustments to reporting lines
- **Workday CSV import**: Upload and map columns to build the org tree

#### 5.3.7 Profile Page

A user account management page at `/profile`:

- **Avatar section** — shows current avatar (or initials fallback) with upload/change/remove buttons. Accepts PNG, JPEG, or WebP up to 2 MB. Preview shown before upload.
- **Profile details form** — editable display name, job title, and department fields. Changes are reflected immediately across the app (sidebar, cascade tree, team view).
- **Password change** — current password verification followed by new password + confirmation.

#### 5.3.8 AI Assistant Panel

A slide-out panel accessible from any objective editing context:

- Conversational interface powered by Claude
- Reviews objective title, description, and key results
- Suggests improvements for clarity, measurability, and ambition
- Checks alignment with parent objectives
- Helps choose the right KR measurement type
- Provides best-practice examples relevant to the user's role and domain

#### 5.3.9 Bulk Check-in Page

A dedicated page at `/check-in` that allows users to update all their key results in a single flow:

- **Route**: `/check-in`, accessible from the sidebar navigation ("Check-in") and a "Check in on all" button on the dashboard.
- **Eligible objectives**: Filters to `active` or `draft` objectives that have at least one key result.
- **Objective groups**: Each objective is rendered as a card showing its title, status badge, health badge, and a live-updating progress ring that recalculates as the user edits KR configs.
- **Inline KR editing**: Each key result is displayed with an inline `KeyResultConfigForm` in check-in mode:
  - Milestone KRs: Only checkbox toggles are shown (add/remove milestone buttons are hidden).
  - Metric KRs: Only the "Current" value is editable (Start, Target, Unit, Direction are read-only).
  - Percentage and Binary KRs behave as normal.
- **Progress delta**: Each KR card shows the progress change as `old% → new% (±diff%)` with colour coding (emerald for increase, red for decrease).
- **Optional notes**: A collapsible "Add note" textarea on each KR card.
- **Dirty detection**: A KR is considered changed if `calculateProgress(editedConfig) !== calculateProgress(originalConfig)` or a non-empty note was added. Semantically meaningless changes (e.g. dragging a slider away and back) are not counted.
- **Sticky footer bar**: Fixed at the bottom of the viewport showing:
  - Change count (e.g. "3 changes")
  - "Discard" button to reset all edits
  - "Submit all check-ins" button (disabled when no changes or during submission)
- **Submission**: Fires parallel `POST /api/key-results/:id/check-in` requests for all dirty KRs via `Promise.allSettled`. Each KR shows an individual success (green tick) or error (red warning) indicator.
- **Post-submission states**:
  - All succeeded: Footer shows "All check-ins recorded!" with a "Back to Dashboard" link.
  - Partial failure: Footer shows "X of Y failed" with a "Retry failed" button.
- **Unsaved changes warning**: A `beforeunload` event listener warns the user when navigating away with unsaved changes.

---

## 6. AI Assistant Capabilities

The AI assistant is powered by the Anthropic API (Claude) and provides five core capabilities:

### 6.1 Writing Quality Review

When a user creates or edits an objective, the AI reviews it against best practices:

- Is the objective outcome-focused (not output-focused)?
- Is it specific and unambiguous?
- Is it appropriately ambitious but achievable?
- Does the description add meaningful context?
- Are key results truly measurable?

The AI provides specific, actionable suggestions — not generic advice. It should reference the user's actual text and propose concrete rewrites.

**Tone**: Encouraging, coaching-oriented. Never condescending. Frame suggestions as "here's how to make this even stronger" not "this is wrong."

### 6.2 Alignment Coaching

When an objective is linked to a parent KR, the AI evaluates the causal chain:

- Does achieving this objective meaningfully contribute to the parent KR?
- Is the connection direct or tenuous?
- Are there gaps — parent KRs that no one's objectives address?

### 6.3 Key Result Type Guidance

The AI helps users choose the right measurement type:

- Suggests metric-based KRs when there's quantifiable data available
- Recommends milestones for phased projects
- Flags when binary KRs could be made more granular
- Helps set realistic targets by asking about current baselines

### 6.4 Check-in Prompting (via Slack)

During Slack-based check-ins, the AI:

- Asks specific questions about each KR rather than generic "how's it going?"
- Follows up on blockers mentioned in previous check-ins
- Celebrates meaningful progress
- Gently flags stalled KRs

### 6.5 Cycle Review Summaries

At quarterly review time, the AI generates:

- Per-person progress summaries
- Team-level rollups for managers
- Identification of at-risk objectives
- Recommendations for objectives to continue, revise, or retire
- Suggestions for the next quarter's focus areas based on what's stalled or completed

---

## 7. MCP Server

The MCP (Model Context Protocol) server enables Claude to interact with Objective Tracker data conversationally. This is a core integration point.

### 7.1 Tools

The MCP server exposes the following tools:

| Tool | Description |
|------|-------------|
| `list_my_objectives` | List the current user's objectives for the active cycle |
| `get_objective` | Get full details of a specific objective including KRs and check-ins |
| `create_objective` | Create a new objective (with AI quality check before saving) |
| `update_objective` | Update an objective's title, description, status, or parent linkage |
| `add_key_result` | Add a key result to an objective |
| `update_key_result` | Update a key result's progress or configuration |
| `check_in` | Record a check-in against a key result |
| `list_team_objectives` | List objectives for the user's direct reports |
| `get_cascade` | Get the cascade tree from a given objective up to the root or down to the leaves |
| `get_cycle_summary` | Get a progress summary for the current cycle |
| `review_objective_quality` | Run the AI quality review on an objective |
| `suggest_objectives` | Given a parent objective, suggest child objectives appropriate to the user's level |
| `import_org_csv` | Import org structure from a Workday CSV (admin only) |

### 7.2 Resources

The MCP server exposes the following resources:

| Resource | Description |
|----------|-------------|
| `objective://{id}` | An individual objective |
| `user://{id}/objectives` | All objectives for a user |
| `cycle://{id}` | Cycle metadata and status |
| `org://tree` | The full org tree structure |

### 7.3 Prompts

Pre-built prompts for common workflows:

| Prompt | Description |
|--------|-------------|
| `write_objective` | Guided flow to write a high-quality objective |
| `quarterly_review` | Generate a quarterly review summary |
| `check_in_all` | Walk through check-ins for all active KRs |
| `alignment_check` | Review alignment of user's objectives with their manager's |

---

## 8. Slack Integration

### 8.1 Check-in Flow

1. A scheduled job (configurable: weekly/fortnightly/monthly) sends a Slack DM to each user
2. The message lists their active KRs with current progress
3. For each KR, the user can:
   - Tap a button to update progress (opens a modal with the appropriate input for the KR type)
   - Add an optional note
4. The AI reviews the updates and may ask a follow-up question in the thread
5. Updates are synced back to the Objective Tracker data store

### 8.2 Notifications

- **Check-in reminders**: "You have 3 key results due for a check-in"
- **Nudges**: "Your KR 'Reduce build time to <5min' hasn't been updated in 4 weeks"
- **Celebrations**: "Congratulations! You completed your objective 'Launch new CI pipeline'"
- **Review prompts**: "Quarterly review starts next week — here's a summary of your progress"

### 8.3 Slash Commands

| Command | Description |
|---------|-------------|
| `/ot status` | Quick summary of your objectives and progress |
| `/ot checkin` | Start a check-in flow |
| `/ot team` | Summary of your team's progress (managers only) |

---

## 9. Monorepo Structure

```
objective-tracker/
├── package.json                 # Workspace root
├── tsconfig.base.json           # Shared TS config
├── packages/
│   ├── shared/                  # Shared types, utils, validation
│   │   ├── src/
│   │   │   ├── types/           # All TypeScript interfaces (from §3.2)
│   │   │   ├── validation/      # Objective quality rules, input validation
│   │   │   └── utils/           # Date helpers, progress calculators, etc.
│   │   └── package.json
│   ├── server/                  # Backend API
│   │   ├── src/
│   │   │   ├── routes/          # Express/Fastify route handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Data access (JSON file I/O)
│   │   │   ├── auth/            # Auth provider abstraction + password impl
│   │   │   ├── ai/              # Claude API integration
│   │   │   └── importers/       # Workday CSV importer
│   │   └── package.json
│   ├── web/                     # React frontend
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── views/           # Page-level views (from §5.3)
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── services/        # API client
│   │   │   ├── visualisations/  # D3 tree + network graph
│   │   │   └── ai/              # AI assistant panel
│   │   └── package.json
│   ├── mcp/                     # MCP server
│   │   ├── src/
│   │   │   ├── tools/           # Tool implementations (from §7.1)
│   │   │   ├── resources/       # Resource implementations (from §7.2)
│   │   │   └── prompts/         # Prompt implementations (from §7.3)
│   │   └── package.json
│   └── slack/                   # Slack bot
│       ├── src/
│       │   ├── commands/        # Slash command handlers
│       │   ├── interactions/    # Button/modal handlers
│       │   ├── scheduler/       # Check-in scheduling
│       │   └── messages/        # Message templates
│       └── package.json
├── data/                        # JSON file storage (gitignored)
│   ├── org.json
│   ├── cycles.json
│   └── users/
└── docs/                        # Documentation
    └── spec.md                  # This document
```

---

## 10. API Design

### 10.1 REST API Endpoints

**Auth**
- `POST /api/auth/register` — Create account (first user becomes admin, subsequent users are standard). Accepts optional `managerEmail` to resolve manager by email address, and auto-sets level to `manager.level + 1` when not explicitly provided.
- `POST /api/auth/login` — Authenticate and receive JWT
- `POST /api/auth/logout` — Revoke token
- `POST /api/auth/forgot-password` — Request a password reset token (generic response to prevent user enumeration)
- `POST /api/auth/reset-password` — Reset password using a one-time token

**Users**
- `GET /api/users/me` — Current user profile
- `PUT /api/users/me` — Update own profile (displayName, jobTitle, department)
- `POST /api/users/me/avatar` — Upload avatar image (multipart, max 2 MB, PNG/JPEG/WebP)
- `DELETE /api/users/me/avatar` — Remove avatar
- `POST /api/users/me/password` — Change password (requires current password)
- `GET /api/users/:id` — Get user (if in visibility scope)
- `GET /api/users/:id/objectives` — Get objectives for a user (if in visibility scope, filterable by cycle)
- `GET /api/users/me/reports` — Direct reports
- `GET /api/users/me/chain` — Full reporting chain (up to CTO)

**Objectives**
- `GET /api/objectives` — List current user's objectives (filterable by cycle)
- `GET /api/objectives/company` — List company-level objectives (visible to all authenticated users)
- `POST /api/objectives` — Create objective
- `GET /api/objectives/:id` — Get objective detail (includes `canEdit` boolean indicating whether the requester can edit this objective)
- `PUT /api/objectives/:id` — Update objective
- `DELETE /api/objectives/:id` — Delete objective (draft only)
- `GET /api/objectives/:id/cascade` — Get cascade path for objective (visibility-filtered: restricted objectives replaced with placeholders)
- `POST /api/objectives/:id/rollforward` — Roll forward to new cycle

**Key Results**
- `POST /api/objectives/:id/key-results` — Add KR to objective
- `PUT /api/key-results/:id` — Update KR
- `DELETE /api/key-results/:id` — Remove KR
- `POST /api/key-results/:id/check-in` — Record a check-in

**Cascade**
- `GET /api/cascade/tree` — Full cascade tree (scoped to user visibility). Company-level objectives are always included as root nodes. Admin users see the full tree for all users.
- `GET /api/cascade/graph` — Network graph data (scoped to user visibility)

**Objectives — Rollforward**
- `POST /api/objectives/:id/rollforward` — Roll forward an active objective to a new cycle (copies objective + KRs with reset progress, marks original as `rolled_forward`)

**Cycles**
- `GET /api/cycles` — List all cycles
- `GET /api/cycles/active` — Get current active cycle

**AI** (requires `ANTHROPIC_API_KEY` to be configured; returns 503 if not set)
- `POST /api/ai/review` — Review an objective for quality. Accepts `{ objectiveId }`, returns score (1–10), summary, strengths, and categorised suggestions.
- `POST /api/ai/suggest` — Suggest child objectives given a parent. Accepts `{ parentObjectiveId, context? }`, returns 2–3 suggested objectives with key results.
- `POST /api/ai/summarise` — Generate cycle review summary. Accepts `{ userId, cycleId }`, returns overview, highlights, at-risk items, and recommendations.

**Admin** (all endpoints require `role: 'admin'`)
- `POST /api/admin/users` — Create a new user
- `GET /api/admin/users` — List all users
- `PUT /api/admin/users/:id` — Update user (role, department, manager, job title, level, displayName)
- `DELETE /api/admin/users/:id` — Delete user (cannot self-delete)
- `POST /api/admin/users/:id/reset-password` — Generate temporary password for user
- `PUT /api/admin/users/:id/password` — Set a specific password for a user
- `POST /api/admin/users/import` — Bulk import users from CSV data. Accepts `{ rows: [{ email, displayName, jobTitle, department?, managerEmail?, level? }] }`. Returns per-row status (created/skipped/error) and summary counts. Generates random initial passwords.
- `GET /api/admin/objectives` — List all objectives org-wide (resolves owner names when user list is available)
- `POST /api/admin/objectives/company` — Create a root-level company objective
- `POST /api/admin/cycles` — Create a new objective cycle (with quarters)
- `PUT /api/admin/cycles/:id` — Update cycle (name, dates, status). Status transitions are validated: planning→active→review→closed. Only one active cycle allowed at a time.

---

## 11. Progress Calculation

### 11.1 Key Result Progress Normalisation

All KR types are normalised to 0–100 for aggregation:

| Type | Calculation |
|------|-------------|
| Percentage | Direct value (0–100) |
| Metric (increase) | `((current - start) / (target - start)) × 100`, clamped to 0–100 |
| Metric (decrease) | `((start - current) / (start - target)) × 100`, clamped to 0–100 |
| Milestone | `(completed milestones / total milestones) × 100` |
| Binary | `0` or `100` |

### 11.2 Objective Progress

`Objective progress = mean(KR progresses)`

### 11.3 Health Status

Based on progress vs. expected progress (linear interpolation through the cycle):

| Status | Condition |
|--------|-----------|
| 🟢 On Track | Progress ≥ expected - 10% |
| 🟡 At Risk | Progress ≥ expected - 25% |
| 🔴 Behind | Progress < expected - 25% |
| ⚪ Not Started | Progress = 0 and no check-ins |

---

## 12. Development Phases

### Phase 1: Foundation (Weeks 1–3)
- Monorepo setup with shared types
- JSON file storage layer with repository abstraction
- Auth (username/password with JWT)
- Core CRUD API for users, objectives, key results
- Basic React app with routing and auth flow

### Phase 2: Core Experience (Weeks 4–6)
- Objective creation/editing UI with all four KR types
- Dashboard view with progress visualisation
- Cascade tree view (D3-based)
- Parent objective linking workflow
- Check-in recording (web UI)
- Bulk check-in page for updating all KRs in one flow

### Phase 3: AI & Visualisation (Weeks 7–9)
- AI assistant panel (Claude API integration)
- Objective quality review
- Alignment coaching
- Network graph view
- Smooth animations and transitions
- Health status indicators

### Phase 4: Integration (Weeks 10–12)
- MCP server with all tools, resources, and prompts
- Slack bot with check-in flows and notifications
- Workday CSV importer
- Cycle management and quarterly review flow
- Objective rollforward

### Phase 5: Polish (Weeks 13–14)
- Mobile responsiveness
- Performance optimisation
- Dark/light mode
- Celebration animations
- Edge cases and error handling
- Documentation

---

## 13. Configuration

All configuration via environment variables:

```env
# Server
PORT=3000
DATA_DIR=./data
JWT_SECRET=<secret>
JWT_EXPIRY=24h

# AI
ANTHROPIC_API_KEY=<key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Slack
SLACK_BOT_TOKEN=<token>
SLACK_SIGNING_SECRET=<secret>
SLACK_CHECK_IN_CRON="0 09 * * 1"   # Every Monday at 09:00

# MCP
MCP_SERVER_PORT=3001
```

---

## 14. Future Considerations (Out of Scope for MVP)

- SSO integration (Okta/Azure AD)
- Database migration (PostgreSQL)
- Real-time collaboration (WebSockets)
- OKR scoring and grading
- 360° feedback integration
- Integration with Jira/Linear for automatic progress tracking
- Custom reporting and analytics
- Export to PDF/PowerPoint for leadership reviews
- Goal templates and playbooks
- Peer recognition tied to objectives

---

## Appendix A: Objective Quality Framework

The AI assistant evaluates objectives against these criteria:

1. **Outcome-focused**: Describes a desired end-state, not an activity. ❌ "Build a new dashboard" → ✅ "Improve engineering visibility into production health, reducing mean time to detect incidents by 50%"

2. **Specific**: Clear enough that two people would agree on whether it's achieved. ❌ "Improve code quality" → ✅ "Reduce production defect escape rate from 8% to 3%"

3. **Ambitious but achievable**: Stretches capability without being demoralising. The AI should ask about current baselines to calibrate.

4. **Time-appropriate**: Suitable for an annual objective (not too granular, not too vague).

5. **Well-scoped**: Within the owner's sphere of influence. An IC shouldn't own an objective that requires org-wide change.

6. **Meaningfully linked**: If linked to a parent KR, the causal chain is clear and direct.

## Appendix B: Example Cascade

```
[CTO] Objective: "Establish world-class engineering reliability"
  ├── KR1: "Achieve 99.95% platform uptime (from 99.8%)"
  │   └── [Group Head - Platform] Objective: "Build resilient platform infrastructure"
  │       ├── KR1: "Reduce P1 incidents from 12/quarter to 3/quarter"
  │       │   └── [Tech Lead] Objective: "Eliminate top 5 reliability risk areas"
  │       │       ├── KR1: "Complete chaos engineering programme for 3 critical services"
  │       │       │   └── [Team Lead] Objective: "Implement chaos testing for Payment Service"
  │       │       │       ├── KR1 (milestone): "GameDay planned → Executed → Findings remediated"
  │       │       │       │   └── [IC] Objective: "Lead Payment Service GameDay execution"
  │       │       │       │       ├── KR1 (binary): "GameDay runbook written and reviewed"
  │       │       │       │       ├── KR2 (milestone): "Test designed → Dry run → Live run → Retro"
  │       │       │       │       └── KR3 (metric): "Remediate 100% of critical findings within 2 weeks"
  │       │       │       └── KR2 (metric): "Reduce Payment Service error rate from 0.5% to 0.1%"
  │       │       └── KR2: "Reduce mean time to recovery from 45min to 15min"
  │       └── KR2: "Achieve <200ms p99 latency for all critical paths"
  ├── KR2: "Increase deployment frequency to 50 deploys/week (from 20)"
  └── KR3: "Achieve 90% engineer satisfaction with tooling (from 65%)"
```

Note how objectives become progressively more concrete and actionable at each level, and how unlinked objectives (not shown here) would sit alongside these to address level-specific concerns.
