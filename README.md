<div align="center">

# Objective Tracker

**The OKR tool that engineers actually want to use.**

AI-coached objectives. Beautiful cascade visualisation. Conversational management.
Zero licensing fees.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) · [Screenshots](#screenshots) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Why Objective Tracker?

Most OKR software was designed for HR departments to track compliance. Engineers treat objective-setting as a quarterly tax — fill out the form, forget about it, scramble to update numbers before the review.

Objective Tracker is different. It uses Claude to **coach you toward better objectives**, renders your entire cascade as an **interactive D3 visualisation**, and lets you manage everything through **natural conversation** via Slack or any MCP-compatible AI client.

Self-hosted, open source, and built for engineering organisations of 200-1,000 people.

---

## Features

### AI-Powered Coaching

Claude doesn't rewrite your OKRs — it makes you better at writing them.

- **Quality review** — challenges vague language, checks measurability, calibrates ambition
- **Alignment coaching** — validates causal links between your objectives and your manager's key results
- **KR type guidance** — recommends the right measurement type (percentage, metric, milestone, binary)
- **Smart nudges** — flags stale key results with contextual suggestions, not generic reminders
- **Cycle summaries** — AI-generated quarterly reviews with rollups for managers

### Interactive Cascade Visualisation

Your strategy isn't a list — it's a living network.

- **D3 cascade tree** — pan, zoom, expand/collapse across all 5 org levels (CTO → IC)
- **Force-directed network graph** — see how objectives interconnect across teams *(coming soon)*
- **Colour-coded health** — emerald (on track), amber (at risk), red (behind) at a glance
- **Progress rings** — instant visual status on every node

### Conversational OKR Management

Check in from Slack. Review progress in Claude. Never open a dashboard if you don't want to.

- **MCP server** — manage objectives through natural conversation in any MCP-compatible client
- **Slack bot** — context-aware check-in questions per key result, not generic prompts
- **Slash commands** — `/ot status`, `/ot checkin`, `/ot team`
- **Weekly digests** — AI-generated summary of progress across your visibility tree

### Built for Engineers

- **TypeScript throughout** — strict mode, no `any`, shared types across all packages
- **REST API** — well-documented, middleware-based auth and visibility
- **Self-hosted** — deploy on your infrastructure, behind your VPN
- **Dark mode by default** — with light mode for the unconverted
- **JSON file storage** — zero database dependencies; works out of the box

### Engagement Over Compliance

- Framer Motion animations on every transition
- Satisfying micro-interactions when updating progress
- Celebrations when objectives are completed
- A design philosophy that makes people *want* to use it

---

## Screenshots

<!-- Replace these placeholders with actual screenshots -->

<div align="center">

| Dashboard | Cascade Tree |
|:---------:|:------------:|
| ![Dashboard](screenshots/dashboard.png) | ![Cascade Tree](screenshots/cascade-tree.png) |

| Objective Detail | Team View |
|:----------------:|:---------:|
| ![Objective Detail](screenshots/objective-detail.png) | ![Team View](screenshots/team-view.png) |

| AI Coaching | Check-in Flow |
|:-----------:|:-------------:|
| ![AI Coaching](screenshots/ai-coaching.png) | ![Check-in](screenshots/check-in.png) |

</div>

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)

### 1. Clone and install

```bash
git clone https://github.com/your-org/objective-tracker.git
cd objective-tracker
pnpm install
```

### 2. Configure environment

```bash
cp packages/server/.env.example packages/server/.env
```

Edit `.env` with your settings:

```env
PORT=3000
DATA_DIR=./data
JWT_SECRET=change-me-to-a-secure-random-string
JWT_EXPIRY=24h

# Optional: AI coaching features
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Optional: Slack integration
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHECK_IN_CRON="0 09 * * 1"

# Optional: MCP server
MCP_SERVER_PORT=3001
```

### 3. Seed the database

```bash
pnpm --filter @objective-tracker/server seed
```

This creates the admin account (`admin` / `password`) and the initial cycle. Change the admin password before going live.

### 4. Start development

```bash
pnpm dev
```

This starts all packages in parallel:
- **API server** → `http://localhost:3000`
- **Web app** → `http://localhost:5173`

### 5. Run tests

```bash
pnpm test
```

---

## Architecture

### Monorepo Structure

```
objective-tracker/
├── packages/
│   ├── shared/           # Types, Zod validation, utilities
│   ├── server/           # Express REST API + JSON file storage
│   ├── web/              # React + Vite + Tailwind + D3.js
│   ├── mcp/              # MCP server (coming soon)
│   └── slack/            # Slack bot (coming soon)
├── data/                 # JSON file storage (gitignored)
├── docs/
│   ├── spec.md           # Full product specification
│   ├── competitive-analysis.md
│   └── marketing-copy.md
├── vitest.config.ts      # Test runner config
├── tsconfig.base.json    # Shared TypeScript config
└── pnpm-workspace.yaml
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript 5.7 (strict mode) |
| **Backend** | Express 4, Pino logging, Zod validation |
| **Frontend** | React 19, Vite 6, Tailwind CSS 3, Framer Motion 12 |
| **Visualisation** | D3.js (d3-hierarchy, d3-zoom, d3-selection) |
| **AI** | Anthropic API (Claude) |
| **MCP** | Model Context Protocol SDK |
| **Slack** | Bolt for JavaScript (@slack/bolt) |
| **Testing** | Vitest 3, Testing Library, Supertest |
| **Storage** | JSON files (no database required) |
| **Auth** | bcrypt + JWT, abstracted behind `AuthProvider` interface |

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React UI  │────▶│  REST API   │────▶│  JSON Files │
│  (Vite/D3)  │◀────│  (Express)  │◀────│  (data/)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ MCP Server │ │  Slack  │
              │            │ │  Bot    │
              └────────────┘ └─────────┘
                    │             │
                    ▼             ▼
              ┌────────────────────────┐
              │   Claude (Anthropic)   │
              │  Coaching & Summaries  │
              └────────────────────────┘
```

### Key Design Decisions

- **Vertical-only visibility** — users see up their reporting chain and down into their reports, never sideways across peer groups
- **Managers can edit downward** — edit your own objectives and those of anyone in your reporting tree
- **Four KR types** — percentage, metric (increase/decrease), milestone, binary — all normalised to 0-100 for aggregation
- **Unlinked objectives are valid** — not every objective needs to cascade from above; level-specific concerns are healthy
- **AI is opinionated** — Claude actively coaches toward better objectives, not just passively accepts input
- **Auth is pluggable** — `PasswordAuthProvider` for MVP, swap to SSO (Okta, Azure AD) without touching app code
- **No database required** — JSON file storage with optimistic locking and write serialisation keeps deployment simple

### Org Hierarchy

Objective Tracker supports a 5-level cascade:

```
Level 1:  CTO                           (1 person)
Level 2:  Group Heads                   (3 people)
Level 3:  Tech Leads                    (12 people)
Level 4:  Team Leads                    (48 people)
Level 5:  Individual Contributors       (~336 people)
                                        ─────────────
                                        ~400 total
```

Company objectives cascade from CTO through each level, becoming more concrete and actionable at each step. The D3 cascade tree visualises this entire structure interactively.

---

## API Overview

The server exposes a RESTful API at `/api`. Key endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `GET` | `/api/objectives` | List current user's objectives |
| `POST` | `/api/objectives` | Create a new objective |
| `GET` | `/api/objectives/:id` | Get objective with key results |
| `PUT` | `/api/objectives/:id` | Update an objective |
| `POST` | `/api/key-results/:id/check-in` | Record a check-in |
| `GET` | `/api/cascade/tree` | Get the cascade tree |
| `GET` | `/api/users/me/team` | Get direct reports and their objectives |

All endpoints require JWT authentication via `Authorization: Bearer <token>`. See [`docs/spec.md`](docs/spec.md) for the complete API reference.

---

## Roadmap

Objective Tracker is built in phases:

- [x] **Phase 1 — Foundation**: Monorepo, shared types, JSON storage, auth, CRUD API, React shell
- [x] **Phase 2 — Core Experience**: Dashboard, objectives CRUD, D3 cascade tree, check-ins, team view
- [ ] **Phase 3 — AI & Visualisation**: Claude coaching, quality review, network graph
- [ ] **Phase 4 — Integration**: MCP server, Slack bot, CSV import, cycle management
- [ ] **Phase 5 — Polish**: Mobile, performance, dark/light mode toggle, animations, edge cases

### Planned Features

- SSO support (Okta, Azure AD) via pluggable `AuthProvider`
- Force-directed network graph for cross-team exploration
- Jira/Linear integration for automatic KR progress
- CLI tool (`ot status`, `ot checkin`, `ot team`)
- Webhook support for external automations
- Git-style objective history with diffs

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode (parallel) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Type-check all packages |
| `pnpm --filter @objective-tracker/server seed` | Seed database with admin account |

### Project Conventions

- **Strict TypeScript** — no `any`, use `unknown` and narrow
- **Zod validation** — shared schemas between client and server
- **Co-located tests** — `foo.ts` → `foo.test.ts`
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- **British English** — in all user-facing text (organisation, colour, visualisation)

---

## Contributing

Contributions are welcome! Please read the following before submitting a PR:

1. **Read [`docs/spec.md`](docs/spec.md)** — the single source of truth for application behaviour
2. **Keep spec in sync** — if your code changes behaviour, update the spec in the same PR
3. **Write tests** — unit tests for services, integration tests for API endpoints
4. **Follow conventions** — TypeScript strict mode, conventional commits, British English

---

## Licence

MIT

---

<div align="center">

**Built with frustration at every other OKR tool.**

[Get Started](#quick-start) · [Read the Spec](docs/spec.md) · [View Competitive Analysis](docs/competitive-analysis.md)

</div>
