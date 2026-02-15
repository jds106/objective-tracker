# CLAUDE.md — Objective Tracker

## Project Overview

Objective Tracker is an internal OKR-style objective management application that cascades company-level objectives down through a 5-level org hierarchy (CTO → Group Heads → Tech Leads → Team Leads → ICs, ~400 people). It uses AI (Claude) to ensure objectives are high quality, and is itself exposed as an MCP server for conversational interaction.

Full specification: `docs/spec.md` — read this first for complete context.

**Spec Sync Requirement**: `docs/spec.md` is the single source of truth for application behaviour. Whenever a feature is added, changed, or removed in code, the spec must be updated in the same change to reflect the new state. This includes: new API endpoints, changes to data models, new UI views, modified authorisation rules, and any behavioural changes. The spec should always accurately describe what the application does — never let code and spec drift apart.

## Tech Stack

- **Language**: TypeScript throughout (strict mode, no `any`)
- **Backend**: Node.js with Express
- **Frontend**: React with Vite, Tailwind CSS, Framer Motion, D3.js
- **MCP Server**: TypeScript using the MCP SDK
- **Slack Bot**: Bolt for JavaScript (@slack/bolt)
- **Testing**: Vitest for unit/integration tests
- **Package Manager**: pnpm with workspaces
- **Node version**: 20+

## Monorepo Structure

```
objective-tracker/
├── CLAUDE.md
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── packages/
│   ├── shared/               # Types, validation, utilities
│   ├── server/               # Express REST API
│   ├── web/                  # React frontend
│   ├── mcp/                  # MCP server
│   └── slack/                # Slack bot
├── data/                     # JSON file storage (gitignored)
│   ├── org.json
│   ├── cycles.json
│   └── users/
└── docs/
    └── spec.md
```

## Code Conventions

### General
- Use ES modules (`import`/`export`), never CommonJS
- Use `const` by default, `let` only when reassignment is needed, never `var`
- Prefer `async`/`await` over raw Promises
- Use descriptive variable names; avoid abbreviations except for common idioms (`i`, `j` for loop indices, `e` for events, `err` for errors)
- All times should use 24hr format (e.g. `14:30`, not `2:30 PM`)
- Use ISO 8601 for all date/time strings in data
- Use British English spelling in user-facing text (e.g. "organisation", "colour", "summarise")

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- Prefer `interface` over `type` for object shapes
- All shared types live in `packages/shared/src/types/`
- Use discriminated unions for variant types (e.g. `KeyResultConfig`)
- Export types explicitly: `export type { Objective }` or `export interface Objective {}`

### Backend (packages/server)
- RESTful API design following the endpoints in docs/spec.md §10
- All data access goes through repository interfaces — never read/write JSON files directly from route handlers or services
- Auth is abstracted behind `AuthProvider` interface — the MVP implements `PasswordAuthProvider`
- Use middleware for auth validation, visibility checks, and error handling
- Validate all request bodies using zod schemas (co-located with shared types)
- Return consistent error responses: `{ error: string, details?: unknown }`
- Log with structured JSON (use pino)

### Frontend (packages/web)
- Functional components only, no class components
- Use React hooks for state management (useState, useReducer, useContext)
- No global state library for MVP — use Context + hooks
- Co-locate component styles with components
- Use Tailwind utility classes; extract to component classes only when repeated 3+ times
- Animations via Framer Motion — all transitions should feel smooth and intentional
- Dark mode by default
- Accessible: proper ARIA labels, keyboard navigation, sufficient contrast

### Data Layer
- One JSON file per user in `data/users/{user-id}.json`
- Org metadata in `data/org.json`
- Cycle config in `data/cycles.json`
- All file I/O is async and uses `fs/promises`
- Implement optimistic locking with a `version` field to prevent write conflicts
- The repository interface must be database-agnostic:

```typescript
interface ObjectiveRepository {
  getByUserId(userId: string): Promise<Objective[]>;
  getById(id: string): Promise<Objective | null>;
  create(objective: CreateObjectiveInput): Promise<Objective>;
  update(id: string, updates: UpdateObjectiveInput): Promise<Objective>;
  delete(id: string): Promise<void>;
}
```

### MCP Server (packages/mcp)
- Implement tools, resources, and prompts as defined in docs/spec.md §7
- Each tool should validate inputs, check permissions, and return structured responses
- Tools should be thin wrappers that delegate to the same service layer used by the REST API
- The MCP server and REST server share the `packages/shared` types and can share service logic

### Testing
- Unit tests for all service-layer business logic
- Integration tests for API endpoints
- Test files live next to the source files: `foo.ts` → `foo.test.ts`
- Use descriptive test names: `it('should return 403 when user lacks visibility to target objective')`
- Test the four key result types thoroughly — progress normalisation is critical

## Git Conventions

- Branch naming: `feature/description`, `fix/description`, `chore/description`
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`)
- Keep commits atomic — one logical change per commit
- Don't commit the `data/` directory (it's gitignored)

## Development Phases

Build in this order (see docs/spec.md §12 for full detail):

1. **Phase 1 — Foundation**: Monorepo setup, shared types, JSON storage, auth, CRUD API, basic React shell
2. **Phase 2 — Core Experience**: Objective CRUD UI, dashboard, cascade tree view, check-ins
3. **Phase 3 — AI & Visualisation**: Claude integration, quality review, network graph
4. **Phase 4 — Integration**: MCP server, Slack bot, CSV import, cycle management
5. **Phase 5 — Polish**: Mobile, performance, dark/light mode, animations, edge cases

## Environment Variables

```env
PORT=3000
DATA_DIR=./data
JWT_SECRET=<generate-a-secure-secret>
JWT_EXPIRY=24h
ANTHROPIC_API_KEY=<your-key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514
SLACK_BOT_TOKEN=<token>
SLACK_SIGNING_SECRET=<secret>
SLACK_CHECK_IN_CRON="0 09 * * 1"
MCP_SERVER_PORT=3001
```

## Key Design Decisions

- **Visibility is vertical only**: Users see up their reporting chain and down into their reports. No sideways visibility across peer groups.
- **Managers can edit downward**: A user can edit their own objectives and those of anyone in their downward reporting tree.
- **Four KR types**: percentage, metric, milestone, binary. All normalised to 0–100 for aggregation.
- **Unlinked objectives are valid**: Not every objective needs to cascade from above. Level-specific objectives are expected and healthy.
- **AI is opinionated**: The Claude integration should actively coach users toward better objectives, not just passively accept whatever they type.
- **Engagement over compliance**: Every UI decision should favour making objectives feel valuable, not bureaucratic.
