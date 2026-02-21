# Competitive Analysis — Objective Tracker

**Date**: 2026-02-21
**Author**: Marketing Strategy Team
**Status**: Living document — update quarterly

---

## Executive Summary

The OKR software market is crowded, consolidating, and increasingly AI-hungry. The top 10 competitors range from lightweight OKR tools (Weekdone, Perdoo) to full people-management suites (Lattice, Leapsome, Culture Amp) to enterprise strategy platforms (WorkBoard/Quantive). Key market shifts in 2025–2026:

- **Microsoft Viva Goals retired** (Dec 2025), displacing thousands of enterprise users
- **WorkBoard acquired Quantive** (May 2025), consolidating the enterprise segment
- **AI is table stakes** — every vendor is adding AI features, but most are shallow (writing assist, summaries). No one does deep, opinionated AI coaching well
- **Engagement fatigue is real** — users universally complain about OKR tools feeling like admin overhead

**Our opportunity**: Build the OKR tool that engineers actually want to use. Not another HR platform bolted onto goals — a purpose-built, AI-coached, developer-friendly objective tracker with beautiful visualisation and conversational interaction via MCP.

---

## 1. Competitor Profiles

### 1.1 Lattice

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | 4.7/5 |
| **Capterra Rating** | 4.5/5 (194 reviews) |
| **Pricing** | ~$11/user/month (Talent Management); Goals is a module add-on |
| **Target** | Growth-stage companies (200–5,000 employees) |

**Key features**: Cascading goals with tree/list/cascade views, performance reviews, compensation, engagement surveys, 1:1s, AI writing assist for reviews.

**What users love**: Modern consumer-grade UI, all-in-one platform, strong integration ecosystem (40+), cascading goal visualisation with Explore page (list/cascade/tree views).

**What users hate**: Cumbersome OKR navigation, filling/updating goals is tedious, no simple check-in flow, limited goal customisation, OKR features weaker than dedicated tools, +2 level cascade depth limit (problematic for deep hierarchies), cascading errors propagate when goals are incorrectly linked.

**USP**: Default choice for growth-stage companies wanting one platform for goals + reviews + compensation. Lattice AI Agent (2025) now supports natural-language goal queries. Mature integration ecosystem.

**Key weakness for us**: Their +2 level cascade depth limit would struggle with our 5-level CTO → IC hierarchy.

**Threat level**: 🟡 Medium — strong brand, but OKR is a secondary feature, not their core.

---

### 1.2 15Five

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | 4.6/5 |
| **Capterra Rating** | 4.7/5 (893 reviews) |
| **Pricing** | Engage: $4/user/month; Perform: $10; Total Platform: $14 |
| **Target** | Mid-market companies prioritising manager enablement |

**Key features**: Weekly check-ins, OKRs with nested/flat/chart views, parent-child alignment with configurable impact, performance reviews, engagement surveys, 1:1 agendas.

**What users love**: Intuitive UI, excellent customer support, weekly check-in ritual, parent-child impact propagation, evidence-based management methodology.

**What users hate**: No confidence levels for OKRs, cannot add check-in notes to KRs, no KPI dashboard, scored 40/100 on AI capabilities, weekly check-ins become repetitive, lacks OKR suggestions, no AI-driven goal writing.

**USP**: People-first weekly check-in workflow that ties OKRs to continuous performance management. Strong research backing from CEBMa.

**Threat level**: 🟡 Medium — good at what they do, but weak on AI and visualisation.

---

### 1.3 Quantive Results (formerly Gtmhub) → Acquired by WorkBoard

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | ~4.7/5 |
| **Pricing** | Custom quotes only (Teams/Business/Enterprise) |
| **Status** | ⚠️ **Acquired by WorkBoard (May 2025)** — customers migrating |

**Key features**: 170+ data integrations, AI-powered StrategyAI, alignment views, automated progress tracking from external data sources, KPI dashboards, confidence scores.

**What users loved**: Data-driven approach, automatic KR progress from integrations (Jira, Salesforce, etc.), powerful analytics.

**What users hated**: Steep learning curve, complex interface delayed adoption, slow performance with large datasets, limited customisation, integration challenges with niche tools.

**USP**: Was the most data-driven OKR platform. Now merged into WorkBoard.

**Threat level**: 🟢 Low — product is being absorbed. Their displaced customers are up for grabs.

---

### 1.4 Weekdone

| Attribute | Detail |
|-----------|--------|
| **Rating** | ~4.5/5 (SaaSworthy, SoftwareFinder) |
| **Capterra Rating** | ~4.5/5 |
| **Pricing** | Free (1–3 users); ~$10.80/user/month; tiered by team size |
| **Target** | Small to mid-sized teams (10–200) |

**Key features**: OKRs + weekly planning (PPP: Plans, Progress, Problems), KPI tracking, weekly automated reports, built-in OKR examples, guided OKR writing tool, Slack/Teams integration.

**What users love**: Simple and intuitive, included OKR coaching from experts, weekly planning ritual, good dashboards.

**What users hate**: No AI-driven goal creation, limited customisation for complex workflows, expensive for larger teams, complex Slack integration setup, overwhelming for small teams new to OKRs.

**USP**: Combines weekly planning with OKR tracking. Includes free human OKR coaching (unusual in the market).

**Threat level**: 🟢 Low — targets much smaller teams than us. No AI, no D3 visualisation.

---

### 1.5 Perdoo

| Attribute | Detail |
|-----------|--------|
| **Capterra Rating** | ~4.5/5 |
| **SoftwareFinder** | 9/10 satisfaction |
| **Pricing** | Professional from ~$10/user/month; Enterprise custom (100+ users) |
| **Target** | SMBs and mid-market (50–500 employees) |

**Key features**: Strategy Map (unique visual: Ultimate Goal → Pillars → OKRs → KPIs), combined OKR + KPI + Initiatives tracking, check-ins with reminders, custom cadences, Jira/Asana/Slack integrations, GraphQL API, horizontal alignment support, "Vince AI Coach" (launched Jan 2026).

**What users love**: Strategy Map is "incredibly powerful", weekly check-in ease, clean modern interface, excellent customer support (9/10), great value for money, generous free tier (5 users), "more alignment options than any other tool".

**What users hate**: Bugs/glitches (data not saving, overwriting), limited customisation for dashboards/reports, no performance management or personal development plans, subpar mobile app, annual billing lock-in, minimum 10 paid licences, performance degrades at scale.

**USP**: The Strategy Map — a unique visualisation connecting company vision → strategic pillars → OKRs → KPIs. Also launched "Vince AI Coach" (Jan 2026) that reviews OKR quality, recommends strategic pillars, and answers methodology questions 24/7 — with escalation to human coaches.

**Threat level**: 🟡 Medium-High — their Strategy Map is genuinely differentiated, and the new Vince AI Coach puts them closer to our AI coaching proposition. We should study both closely.

---

### 1.6 Profit.co

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | ~4.7/5 |
| **Capterra Rating** | ~4.8/5 |
| **Pricing** | Free (5 users); Growth: $9/user/month ($7 annual); Enterprise: custom |
| **Target** | Mid-market to enterprise |

**Key features**: AI authoring for OKRs, Say-Do ratio scoring, vertical & horizontal alignment, modular dashboards, heatmaps, check-in reports, voice/video comments, meeting management, instant PDF/PowerPoint reports.

**What users love**: Feature richness, 24hr customer support (4.9/5), AI-generated OKR drafts, heatmaps for progress vs plan, 8 different OKR views (list, Gantt, progress, alignment, heatmap, hierarchy, scorecard, table), vertical + horizontal alignment.

**What users hate**: Steep learning curve (#1 complaint), "not intuitive" for new users, no bulk OKR import, no check-in history feature, limited Microsoft 365 integration, "difficult to use" per some reviewers, feature bloat overwhelms simpler use cases.

**USP**: Most feature-rich dedicated OKR platform. 17+ AI agents (OKR authoring, quality, alignment, meetings, performance) supporting OpenAI, Gemini, Azure AI, and Claude. Say-Do ratio scoring is unique. Supports both vertical and horizontal alignment.

**Threat level**: 🟡 Medium — feature-rich but suffers from complexity. Their AI authoring is a direct competitor to our Claude integration.

---

### 1.7 Microsoft Viva Goals → RETIRED

| Attribute | Detail |
|-----------|--------|
| **Capterra Rating** | 4.1/5 |
| **TrustRadius** | 8.2/10 (14 reviews) |
| **Pricing** | Was $6/user/month ($12 for Viva Suite) |
| **Status** | ⚠️ **Retired December 31, 2025** |

**What it was**: OKR module within Microsoft Viva (originally Ally.io, acquired 2021). Deep Teams/Outlook/SharePoint integration, Copilot AI for goal creation, 30+ integrations.

**Why it died**: Microsoft deprioritised after low adoption. Enterprise customers are migrating to WorkBoard (Microsoft co-sell partner) or shopping for alternatives.

**Threat level**: 🟢 None — dead product. But the displaced customers are an opportunity.

---

### 1.8 Leapsome

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | 4.8/5 (2,200+ reviews) — **highest in category** |
| **Capterra Rating** | 4.6/5 (95 reviews) |
| **Pricing** | $8–20/user/month; modular at $3–7/module |
| **Target** | Mid-market (50–1,500 employees), European-strong |

**Key features**: All-in-one: HRIS, performance reviews, goals/OKRs, engagement surveys, learning, compensation. Goal tree visualisation, 38 languages, 75+ integrations, 360° feedback, calibration.

**What users love**: Clean modern interface, comprehensive all-in-one platform, goal tree with hierarchical visualisation, excellent customer support, fast rollout, AI Goal Generation from text prompts.

**What users hate**: Goal updates were manual-only for years (no API — recently fixed via Zapier/API, but perception damage lingers), difficult to locate data in UI, notification customisation lacking, complex configuration at scale, learning & development module is weak, pricing scales poorly as you add modules + headcount.

**USP**: Highest-rated people platform on G2. European origin with GDPR compliance and 38 languages. True all-in-one from HRIS to compensation.

**Threat level**: 🟡 Medium — strong brand and ratings, but OKR is one module among many. Their goal tree is basic compared to our D3 cascade.

---

### 1.9 Culture Amp

| Attribute | Detail |
|-----------|--------|
| **G2 Rating** | 4.5/5 |
| **Capterra Rating** | 4.7/5 |
| **Pricing** | Custom (modular: Engage, Perform, Develop) |
| **Target** | Mid-market to enterprise (200–5,000 employees) |

**Key features**: Science-backed engagement surveys (best in class), goal tree view, status tracking (On Track/At Risk/Off Track/Completed), SMARTER goal framework, performance reviews, 1:1s, skills coaching.

**What users love**: Survey capabilities are world-class, benchmarking data, science-backed approach, goal-to-performance review integration.

**What users hate**: "Clunky and less intuitive" UI, goals module much weaker than surveys, "arcane methodology" for completing reviews, oldest goals shown first (!), no team-to-manager goal mapping, company goal visualisation is poor, disjointed feature experience, **scalability problems reported for orgs over 400 employees** (exactly our size), no automated progress tracking.

**USP**: The engagement survey leader. Science-backed people analytics connecting employee sentiment to business outcomes. 1.5 billion data points powering benchmarks.

**Threat level**: 🟢 Low for OKR — their goal module is universally acknowledged as weaker than their survey module. Scalability issues at our exact org size make it a poor fit.

---

### 1.10 WorkBoard

| Attribute | Detail |
|-----------|--------|
| **TrustRadius** | 7.1/10 (10 reviews) |
| **Capterra Rating** | ~4.0/5 |
| **Pricing** | Enterprise only; estimated $600+/user/year |
| **Target** | Large enterprise (1,000+ employees) |

**Key features**: Enterprise OKR management, AI agents (Chief of Staff, Leadership Coach), proprietary WoBoLM language model, Microsoft Copilot integration, executive dashboards, approval workflows, acquired Quantive (2025).

**What users love**: Enterprise-grade strategy execution, executive dashboards, AI agents for alignment and accountability, Workday/Microsoft co-sell partnerships.

**What users hate**: Slow UI, steep learning curve, billing complaints (charged annual fee unexpectedly), poor customer support contact availability, limited customisation for niche use cases.

**USP**: Enterprise strategy execution platform. AI agents for leadership. Microsoft + Workday partnerships. Now owns Quantive's integration library (170+).

**Threat level**: 🟢 Low — targets a completely different segment (Fortune 500). Enterprise pricing and sales motion incompatible with our ~400 person org.

---

## 2. Feature Comparison Matrix

| Feature | Objective Tracker | Lattice | 15Five | Quantive | Weekdone | Perdoo | Profit.co | Leapsome | Culture Amp | WorkBoard |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **OKR Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **4 KR Types** (%, metric, milestone, binary) | ✅ | ❌ | ⚠️ | ✅ | ❌ | ✅ | ✅ | ❌ | ⚠️ | ⚠️ |
| **Cascade Tree Visualisation** | ✅ D3 | ✅ | ⚠️ Chart | ✅ | ⚠️ | ✅ Strategy Map | ⚠️ | ✅ | ⚠️ | ✅ |
| **Force-Directed Network Graph** | 🔜 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Objective Coaching** | ✅ Claude | ⚠️ AI Agent | ❌ | ⚠️ Generic | ❌ | ⚠️ Vince AI | ⚠️ 17 Agents | ⚠️ AI Gen | ❌ | ⚠️ Agents |
| **AI Alignment Validation** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Quality Review** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MCP Server** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Slack Bot** | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Check-in Flow** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **Health Status Indicators** | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Performance Reviews** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Engagement Surveys** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **HRIS / Compensation** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **CSV/Workday Import** | ✅ | ✅ | ⚠️ | ✅ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| **SSO (Okta/Azure AD)** | 🔜 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **API Access** | ✅ REST | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ |
| **Cycle Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dark Mode** | ✅ Default | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Self-Hosted Option** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Open Source** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Key**: ✅ = Full support | ⚠️ = Partial/basic | ❌ = Not available | 🔜 = Planned

---

## 3. Our Strengths

### 🟢 Genuine Differentiators (Nobody Else Has This)

1. **AI-Powered Objective Coaching via Claude** — Not just "AI writing assist" that rewrites sentences. Our Claude integration is an opinionated coach that reviews objectives against a quality framework, validates causal alignment between parent and child objectives, suggests KR measurement types based on context, and provides role-appropriate examples. No competitor does this at this depth.

2. **MCP Server for Conversational OKR Management** — Users can manage objectives, check in, and get coaching entirely through conversation with Claude. This is a fundamentally different interaction model. Zero competitors offer MCP integration.

3. **Force-Directed Network Graph** — When built, this will be the only OKR tool offering a force-directed graph view showing objective connections, natural team clusters, and orphaned objectives floating at the periphery. Every competitor maxes out at tree views.

4. **Self-Hosted / Open Source** — For a ~400 person engineering org, data sovereignty matters. No SaaS vendor offers this. OKR data stays on your infrastructure.

5. **Developer-First Design** — TypeScript throughout, dark mode default, keyboard navigation, REST API, pnpm monorepo. Built by engineers, for engineers. Most OKR tools are designed for HR teams and it shows.

### 🟡 Strong but Shared with Some Competitors

6. **Beautiful D3 Cascade Tree** — Our SVG-based, pannable, zoomable cascade tree with health-coded borders and animated expand/collapse is best-in-class. Lattice, Perdoo, and Leapsome have tree views, but none use D3 with this level of polish.

7. **Four KR Types with Normalisation** — Percentage, metric (increase/decrease), milestone, and binary with proper normalisation to 0–100. Most competitors support fewer types or normalise poorly.

8. **Slack Check-in with AI Follow-up** — Several competitors have Slack bots, but ours asks specific questions per KR, follows up on previous blockers, and celebrates progress. Most competitors send generic "update your OKRs" nudges.

9. **Vertical Visibility Model** — Our strict vertical-only visibility (up your chain + down your tree) is a deliberate design choice. Most tools default to "everyone sees everything" or require complex permission setup.

---

## 4. Our Weaknesses — Ruthlessly Honest

### 🔴 Critical Gaps (Must Close Before Launch)

1. **No SSO** — Every competitor at our scale offers Okta/Azure AD SSO. Password auth is a dealbreaker for any security-conscious engineering org. The auth provider interface is ready but SSO is not implemented.

2. **No Performance Reviews** — Lattice, 15Five, Leapsome, and Culture Amp all tie goals to performance reviews. If an org wants one platform, they'll choose a competitor. We need to decide: partner or build.

3. **No Engagement Surveys** — Same as above. Lattice, 15Five, Leapsome, and Culture Amp offer pulse surveys. We don't.

4. **No Mobile App** — Check-ins need to work on phones. Phase 5 covers mobile responsiveness, but native app users (most of the market) will notice.

5. **JSON File Storage** — The MVP uses flat files. Competitors use proper databases. This limits us to ~400 users and creates scaling questions. The repository abstraction exists, but PostgreSQL migration is "future consideration."

### 🟡 Notable Gaps (Can Differentiate Without, But Would Be Nice)

6. **No Data Source Integrations** — Quantive/WorkBoard can auto-update KRs from Jira, Salesforce, etc. We require manual updates. For an engineering org using Jira/Linear, auto-progress from ticket completion would be huge.

7. **No Jira/Linear Integration** — Related to above. Engineering teams track work in these tools. Progress should flow automatically.

8. **No Goal Templates** — Profit.co and Weekdone offer OKR templates and examples. We rely on AI to guide, but pre-built templates lower the barrier.

9. **No Export to PDF/PowerPoint** — Profit.co can generate instant reports. Leadership reviews often happen in slide decks. We have no export.

10. **No Bulk Import/Export** — Some competitors allow CSV import of existing OKRs. We only import org structure.

11. **No KPI Dashboard** — Perdoo's combined OKR + KPI view is genuinely useful. We track objectives but not standalone KPIs.

---

## 5. Must-Close Feature Gaps (Priority Order)

| Priority | Gap | Reason | Effort |
|----------|-----|--------|--------|
| **P0** | SSO (Okta/Azure AD) | Security requirement for any org >50 people | Medium — auth provider interface exists |
| **P0** | PostgreSQL migration | JSON files won't survive audit or scale | Medium — repository interface exists |
| **P1** | Jira/Linear integration | Auto-update KRs from ticket completion | Medium |
| **P1** | Mobile-responsive check-ins | People check in from phones | Low — Phase 5 |
| **P1** | Export to PDF/CSV | Leadership review requirements | Low |
| **P2** | Goal templates library | Lower adoption barrier | Low |
| **P2** | Standalone KPI tracking | Parity with Perdoo | Medium |
| **P3** | Performance reviews | Parity with all-in-one platforms | High — consider partnering |
| **P3** | Engagement surveys | Parity with all-in-one platforms | High — consider partnering |

---

## 6. Differentiation Opportunities

### 6.1 Where Competitors Are Weak (and We Can Win)

**The "AI that actually helps" gap**: Every vendor is bolting on AI, but most are shallow. Lattice has Writing Assist for reviews. Profit.co has AI authoring (generates OKR drafts). WorkBoard has "AI agents" (marketing-heavy, substance-light). Perdoo's "Vince AI Coach" (Jan 2026) is the closest competitor — it reviews OKR quality and answers methodology questions — but it's built on generic OKR methodology, not your organisation's actual cascade context. **No one** has an opinionated AI coach that:
- Reviews objectives against a structured quality framework
- Validates causal chains in cascade alignment
- Asks probing questions about baselines and targets
- Coaches toward better objectives, not just accepts input
- Follows up on stalled KRs with specific, contextual questions

This is our Claude integration. It's our biggest differentiator and we should make it the centrepiece of our positioning.

**Important nuance**: Profit.co now supports Claude/Anthropic as one of their AI provider options (alongside OpenAI, Gemini, Azure AI). However, their use of Claude is for generic OKR authoring — generating drafts from prompts. Our integration is fundamentally different: Claude has access to the full cascade context, the org hierarchy, the quality framework, and the check-in history. Their Claude writes OKRs; our Claude coaches people toward better OKRs.

**The "conversational OKR" gap**: MCP server means users can interact with their objectives through natural language in any MCP-compatible client. "Show me my objectives" / "Update my latency KR to 180ms" / "How am I doing against my team lead's goals?" This is science fiction to every competitor.

**The "beautiful visualisation" gap**: Most OKR tools have ugly, functional tree views. Our D3 cascade tree with pan/zoom, animated expand/collapse, health-coded node borders, and avatar cards is genuinely beautiful. The planned network graph will be unprecedented in the market.

**The "developer experience" gap**: Most OKR tools are designed for HR. The API is an afterthought (Leapsome had no API until recently). We have a first-class REST API, TypeScript types, and a self-hosted deployment model. This resonates with engineering organisations.

### 6.2 Features That Would Make Us Stand Out

| Feature | Differentiation Impact | Build Effort |
|---------|----------------------|-------------|
| **AI Objective Scoring** — Claude scores each objective 1–10 on clarity, measurability, ambition, alignment, and shows a radar chart | 🔥 High — visual, shareable, gamifiable | Low |
| **"Alignment Gaps" Alert** — AI identifies parent KRs with zero child objectives linked and nudges relevant people | 🔥 High — proactive, not reactive | Low |
| **Conversation-First Check-ins** — Slack bot asks smart questions per KR, not generic prompts | 🔥 High — fixes the #1 complaint (check-ins feel like admin) | Medium |
| **Git-style Objective History** — Full audit trail with diffs showing how objectives evolved over time | 🔥 High — no competitor does this | Low |
| **"What Changed" Weekly Digest** — AI-generated summary of progress across the user's visibility tree | 🔥 High — managers would love this | Medium |
| **Network Graph Exploration** — Force-directed graph showing objective interconnections | 🔥 Very high — unprecedented in market | Medium (Phase 3) |
| **CLI Tool** — `ot status`, `ot checkin`, `ot team` from the terminal | 🔥 High for developer audience | Low |
| **Webhook on KR Update** — Trigger external automations when progress changes | 🔥 Medium — enables DIY integrations | Low |
| **Public Objective Sharing** — Generate a read-only URL for an objective/team to share with stakeholders | 🔥 Medium — useful for cross-team transparency | Low |
| **Automated Progress from Jira/Linear** — KR auto-updates from linked ticket completion | 🔥 Very high — "set it and forget it" | Medium |

---

## 7. Positioning Statement

### For Internal Use

> **Objective Tracker** is the AI-coached objective management platform built for engineering organisations. Unlike generic HR tools that bolt on goal-tracking as an afterthought, Objective Tracker uses Claude to actively coach you toward better objectives, validates alignment across your cascade, and lets you manage everything through conversation. Beautiful D3 visualisations show how individual work connects to company strategy. Self-hosted, developer-friendly, and designed to convert OKR sceptics into engaged participants.

### One-Liner

> **The OKR tool that engineers actually want to use.**

### Key Messages

1. **AI that coaches, not just assists** — Claude doesn't just rewrite your sentences. It challenges your thinking, validates your alignment, and helps you write objectives that drive real outcomes.

2. **Conversational OKR management** — Check in, review progress, and get coaching through natural conversation via Slack or any MCP-compatible client. No forms to fill out.

3. **Beautiful cascade visualisation** — See how your work connects to company strategy through an interactive D3-powered tree and force-directed network graph. Not a static org chart — a living, breathing map of alignment.

4. **Built for engineers, by engineers** — TypeScript, REST API, dark mode, self-hosted, open source. Your OKR data stays on your infrastructure.

5. **Engagement over compliance** — Every design decision favours making objectives feel valuable, not bureaucratic. Micro-interactions, celebrations, smart nudges — not another form to fill out.

---

## 8. Target Positioning Map

```
                    AI Sophistication →
                    Low                          High
                ┌──────────────────────────────────────┐
    Enterprise  │  WorkBoard       ·                    │
                │    ·                                  │
                │  Quantive (†)                         │
                │    ·                                  │
                │                                       │
    Mid-Market  │  Lattice  Leapsome  Profit.co         │
                │    ·        ·          ·              │
                │  15Five   Culture Amp                  │
                │    ·        ·                          │
                │  Perdoo                               │
                │    ·                                  │
    SMB         │  Weekdone              ★ OBJ TRACKER  │
                │    ·                   (sweet spot)    │
                └──────────────────────────────────────┘
                  HR-Led                     Eng-Led
                         ← Buyer →

  ★ = Our position   · = Competitor   † = Acquired/Retired
```

Our sweet spot: **Mid-market engineering organisations (200–1,000 people)** where the CTO/VP Engineering owns the OKR budget, the team is technical, and they want something better than an HR tool repurposed for goals.

---

## 9. Competitive Win/Loss Scenarios

### We Win When…
- The buyer is engineering leadership, not HR
- The org values AI coaching over checkbox compliance
- Data sovereignty / self-hosting matters
- They've tried Lattice/15Five and found goal-setting tedious
- They want beautiful visualisation, not spreadsheet-with-colours
- They want to interact with OKRs conversationally (MCP)
- They've been displaced from Viva Goals or Quantive

### We Lose When…
- The buyer wants an all-in-one HR suite (performance reviews + surveys + compensation)
- SSO is a hard requirement and we haven't shipped it yet
- They need 170+ data integrations out of the box
- Scale exceeds what JSON storage can handle (>500 users)
- They need SOC 2 compliance documentation
- Mobile-native experience is required

---

## 10. Recommended Next Steps

1. **Ship SSO immediately** — This is the #1 blocker for serious adoption
2. **Build Jira/Linear integration** — Auto-updating KRs from ticket data would be a killer feature for our audience
3. **Polish the AI coaching** — Make it the hero of every demo. Record videos showing Claude coaching users through objective writing
4. **Build the network graph** — No competitor has this. It will generate buzz and screenshots
5. **Create a "Displaced from Viva Goals/Quantive?" landing page** — These users are actively shopping right now
6. **Develop a CLI tool** — Low effort, high signal to our developer audience that we're different
7. **Get 10 internal teams using it and collect testimonials** — Social proof matters more than feature lists

---

## Appendix: Pricing Landscape

| Tool | Entry Price | Mid-Tier | Enterprise | Free Tier |
|------|-----------|----------|------------|-----------|
| Objective Tracker | Free (self-hosted) | Free (self-hosted) | Free (self-hosted) | ✅ Unlimited |
| Lattice | ~$11/user/month | ~$11+ modules | Custom | ❌ |
| 15Five | $4/user/month | $10/user/month | $14/user/month | ❌ |
| Weekdone | $10.80/user/month | Tiered by size | Custom | ✅ (1–3 users) |
| Perdoo | €8/user/month (Premium) | €10/user/month (Supreme) | Custom (100+) | ✅ (5 users) |
| Profit.co | $7/user/month (annual) | $9/user/month | Custom | ✅ (5 users) |
| Leapsome | $8/user/month | $11–20/user/month | Custom | ❌ |
| Culture Amp | Custom | Custom | Custom | ❌ |
| WorkBoard | Custom (enterprise) | Custom | ~$50/user/month | ❌ |

**Our pricing advantage**: Self-hosted and open source = $0 licensing cost. The only cost is infrastructure and Anthropic API usage for AI features. For a 400-person org, competitors would charge $3,360–$96,000/year. We charge nothing.

---

*This analysis is based on web research conducted in February 2026. Pricing, features, and ratings change frequently. Verify critical data points before making strategic decisions.*
