# Marketing Copy — Objective Tracker Landing Page

**Version**: 1.0
**Date**: 2026-02-21
**Status**: Draft for review

---

## Tagline

> **The OKR tool that engineers actually want to use.**

### Alternate taglines (A/B test candidates)

- "Objectives that drive outcomes, not admin."
- "AI-coached OKRs. Beautiful alignment. Zero licensing fees."
- "Stop filling out forms. Start having conversations about goals."
- "From company strategy to individual commits — see the whole picture."

---

## Hero Section

### Headline

**Your objectives deserve better than a spreadsheet with colours.**

### Sub-headline

Objective Tracker is the AI-coached goal management platform built for engineering organisations. Set better objectives, see how your work connects to company strategy, and check in through natural conversation — not another form.

### Hero CTA

**Get started — it's free** | [View the cascade demo →]

### Social proof line

*Built for teams of 200–1,000. Self-hosted. Open source. Your data never leaves your infrastructure.*

---

## Problem Statement Block

### Heading: "OKR tools weren't built for you."

Most OKR software was designed for HR departments to track compliance. The result? Engineers treat objective-setting as a quarterly tax — fill out the form, forget about it, scramble to update numbers before the review.

**Sound familiar?**

- Objectives that are copy-pasted from last quarter
- Key results nobody checks until the deadline
- A cascade view that's just an org chart with extra steps
- AI that rewrites your sentences but doesn't challenge your thinking
- Check-ins that feel like filing a report, not having a conversation

**There's a better way.**

---

## Feature Highlights

### 1. AI That Coaches, Not Just Assists

**Claude doesn't rewrite your OKRs — it makes you better at writing them.**

Other tools bolt on AI to auto-generate generic objectives. Objective Tracker uses Claude to actively coach you: challenging vague language, validating alignment with your team's cascade, suggesting the right measurement type for each key result, and flagging when your objectives are too safe or too ambitious.

It's the difference between a spell-checker and a writing mentor.

- Reviews objective quality against proven frameworks
- Validates causal alignment with parent objectives — not just keyword matching
- Recommends the right KR type (percentage, metric, milestone, or binary)
- Provides role-specific examples relevant to your domain
- Nudges you when objectives haven't been updated in weeks

---

### 2. Conversational OKR Management

**Check in from Slack. Review progress in Claude. Never open a dashboard if you don't want to.**

Objective Tracker exposes a full MCP (Model Context Protocol) server, so you can manage your objectives through natural conversation in any MCP-compatible client. Plus, a Slack bot that asks smart, context-aware questions about each key result — not generic "how's it going?" prompts.

```
You:  "How's my team doing on the platform migration?"

Claude: "3 of 5 key results are on track. The API latency KR
         hasn't been updated in 12 days — Sarah's last check-in
         flagged a dependency on the infrastructure team. Want me
         to surface her blockers?"
```

- Full MCP server for conversational interaction with any AI client
- Slack bot with intelligent, per-KR check-in questions
- Weekly AI-generated digest of progress across your visibility tree
- Natural language queries: "Show me all at-risk objectives in my org"

---

### 3. See the Whole Picture

**Interactive cascade visualisation that actually reveals something.**

Your strategy isn't a list — it's a living network. Objective Tracker renders your entire objective cascade as an interactive D3-powered tree with pan, zoom, and drill-down. See how the CTO's company objectives flow through five levels down to individual contributors. Watch clusters form around well-aligned teams. Spot orphaned objectives floating at the edges.

- **Cascade tree**: Top-down D3 hierarchy with expand/collapse, colour-coded by health status
- **Network graph**: Force-directed visualisation showing objective interconnections across teams
- **Progress rings**: Instant visual status on every node — emerald, amber, red
- **Filter and search**: Find any objective by title, owner, status, or health

No other OKR tool gives you this level of visual insight into organisational alignment.

---

### 4. Built for Engineers, by Engineers

**TypeScript. REST API. Dark mode. Self-hosted. Open source.**

We didn't build another bloated SaaS platform. Objective Tracker is a clean TypeScript monorepo you deploy on your own infrastructure. Your objective data never leaves your network. The REST API is well-documented and extensible. The frontend is React + Vite + Tailwind with Framer Motion animations that make the interface feel alive.

- Self-hosted: deploy on your infrastructure, behind your VPN
- Open source: inspect, extend, contribute
- Dark mode by default (with light mode for the unconverted)
- Four key result types: percentage, metric (increase/decrease), milestone, binary
- JSON file storage for simplicity — no database to manage
- Extensible via REST API, MCP server, and webhooks

---

### 5. Engagement Over Compliance

**Every pixel is designed to make objectives feel valuable, not bureaucratic.**

Smooth Framer Motion transitions. Satisfying micro-interactions when you update progress. Celebrations when objectives are completed. AI nudges that feel helpful, not nagging. A design philosophy that prioritises making people *want* to engage with their goals.

- Progress updates that feel satisfying, not tedious
- Smart nudges when KRs are stale — not calendar reminders, contextual suggestions
- Weekly digests that tell you what matters, not everything that happened
- A cascade view that makes alignment visible and beautiful
- Check-ins that ask the right questions, not the same questions

---

## Comparison Block

### Heading: "How we compare"

| | Objective Tracker | Lattice | 15Five | Profit.co |
|---|---|---|---|---|
| **AI coaching** | Deep, opinionated coaching by Claude | Basic AI Agent | ❌ (scored 40/100) | Generic AI authoring |
| **Cascade depth** | Unlimited (5-level tested) | +2 levels max | Parent-child only | Unlimited |
| **Conversational management** | MCP server + Slack bot | ❌ | ❌ | ❌ |
| **Cascade visualisation** | D3 tree + force-directed graph | List/cascade view | Nested/flat/chart | 8 views |
| **Self-hosted option** | ✅ Free, open source | ❌ SaaS only | ❌ SaaS only | ❌ SaaS only |
| **Price (400 users/year)** | **$0** | ~$52,800 | ~$19,200+ | ~$33,600 |

---

## Pricing Block

### Heading: "Free. Actually free."

Objective Tracker is open source and self-hosted. No per-seat fees. No feature gates. No enterprise tier with the features you actually need.

**Your only costs:**
- Infrastructure to run a Node.js app (you probably already have this)
- Anthropic API usage for AI coaching features (~$0.003 per coaching interaction)

**What competitors charge for 400 users:**

| Tool | Annual cost |
|---|---|
| Lattice | ~$52,800 |
| Profit.co | ~$33,600 |
| Weekdone | ~$51,840 |
| 15Five | ~$19,200–$67,200 |
| **Objective Tracker** | **$0** |

The money you save could fund an entire engineering team. Or a very nice offsite.

---

## "Displaced?" Block

### Heading: "Coming from Viva Goals or Quantive?"

Microsoft retired Viva Goals in December 2025. WorkBoard acquired Quantive in May 2025. If you're one of the thousands of teams looking for a new home for your OKRs, we built Objective Tracker with you in mind.

**Migrate in minutes:**
- CSV import from Workday builds your org tree automatically
- Column-mapping UI — no scripting required
- Your 5-level hierarchy works out of the box (unlike tools limited to +2 cascade depth)
- AI coaching helps your team write *better* objectives during the migration, not just port the old ones

**[Import your team →]**

---

## Technical Credibility Block

### Heading: "Under the hood"

```
objective-tracker/
├── packages/shared/     # Types, validation, utilities
├── packages/server/     # Express REST API
├── packages/web/        # React + Vite + Tailwind + D3.js
├── packages/mcp/        # MCP server for conversational OKR management
└── packages/slack/      # Slack bot with intelligent check-ins
```

- **TypeScript throughout** — strict mode, no `any`
- **Express REST API** — well-structured, middleware-based auth and visibility
- **React + Vite** — fast builds, hot module replacement
- **D3.js** — custom cascade tree and force-directed network graph
- **Framer Motion** — smooth, intentional animations on every transition
- **Zod validation** — shared schemas between client and server
- **JSON file storage** — zero database dependencies for deployment simplicity
- **MCP SDK** — full Model Context Protocol server implementation

---

## Final CTA Block

### Heading: "Your team's objectives are too important for another checkbox tool."

Objective Tracker gives your engineering org AI coaching that makes objectives better, visualisation that makes alignment visible, and conversational interaction that makes check-ins painless.

Self-hosted. Open source. Beautiful. Free.

**[Deploy Objective Tracker →]** | [Read the docs →] | [Star on GitHub →]

---

## SEO / Meta Copy

**Page title**: Objective Tracker — AI-Coached OKRs for Engineering Teams

**Meta description**: Free, open-source OKR platform with AI coaching by Claude, interactive D3 cascade visualisation, MCP conversational management, and Slack integration. Built for engineering orgs. Self-hosted.

**Keywords**: OKR software, objective tracking, AI OKR coaching, cascade visualisation, engineering OKR tool, self-hosted OKR, open source goals, MCP server, Viva Goals alternative, Quantive alternative, free OKR tool

---

## Messaging Guidelines

### Voice and Tone

- **Confident, not arrogant**: We know we're different. We don't need to trash competitors.
- **Technical, not jargon-heavy**: Our audience is engineers. They appreciate precision but not buzzwords.
- **Opinionated, not preachy**: We have strong views about how OKRs should work. We share them as perspective, not dogma.
- **British English**: organisation, colour, visualisation, summarise. This is a deliberate choice that signals attention to detail.

### Words We Use

- "Coaching" (not "assist" or "copilot" — we're more than a text generator)
- "Cascade" (not "alignment" — it's more visual and specific)
- "Conversational" (not "chat-based" — it implies intelligence, not just messaging)
- "Engagement" (not "adoption" — we care about whether people find value, not just whether they log in)
- "Beautiful" (not "modern" — every tool claims to be modern)

### Words We Avoid

- "Platform" (overused; say "tool" or be specific)
- "Leverage" (say "use")
- "Synergy" (just... no)
- "Best-in-class" (let the product speak)
- "Seamless" (nothing is seamless; be honest about what integrates and what doesn't)
- "Revolutionary" (incremental honesty beats revolutionary hype)

---

*This copy is designed for a product landing page. Adjust tone for different channels: more casual for developer community posts, more metric-driven for CTO-targeted ads, more visual for Product Hunt launch.*
