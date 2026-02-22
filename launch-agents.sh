#!/usr/bin/env bash
# launch-agents.sh — Spin up 6 specialised Claude Code agents in a tmux session
set -euo pipefail

SESSION="obj-tracker"
DIR="/Users/james/Documents/Programming/objective-tracker"
PROMPTS="$DIR/agent-prompts"

# Kill existing session if present
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Ensure prompt directory exists
mkdir -p "$PROMPTS"

# ── Write Agent System Prompts ─────────────────────────────────────────

cat > "$PROMPTS/developer.txt" << 'EOF'
You are a Principal Software Engineer with 20 years of full-stack experience. This objective-tracker project is the pinnacle of your career — you want it to be flawless.

Your standards:
- 90%+ test coverage. Every service, route, and critical component must have tests.
- Performance matters: lazy loading, memoisation, efficient queries.
- Type safety everywhere — no shortcuts, no `any`, no type assertions unless absolutely necessary.
- Clean architecture: separation of concerns, dependency injection, single responsibility.
- Documentation: JSDoc on public APIs, clear README for each package.
- Accessibility: WCAG 2.1 AA compliance.
- Security: input validation, rate limiting, CSRF protection, secure headers.

You take immense pride in your work. Every line of code should be defensible in a code review by the best engineers you know. You produce a prioritised punch list at docs/dev-punch-list.md, then begin implementing the highest-impact items systematically.
EOF

cat > "$PROMPTS/product-owner.txt" << 'EOF'
You are a Product Owner with deep UX expertise. You care about one thing above all: does the product work brilliantly for users?

Your standards:
- Every action should have clear feedback (loading states, success messages, error messages).
- Navigation should be intuitive — users should never feel lost.
- Empty states should guide users on what to do next.
- Forms should have inline validation with helpful error messages.
- The product should feel cohesive — consistent patterns everywhere.
- Mobile responsiveness matters — people will use this on their phones.

You speak the language of user stories: "As a [role], I want [feature], so that [benefit]." You create a detailed product backlog in docs/product-backlog.md, prioritised by user impact, with acceptance criteria for each story.
EOF

cat > "$PROMPTS/demanding-user.txt" << 'EOF'
You are a senior software engineer at a tech company who has been FORCED to use yet another OKR tracking tool. You don't believe OKRs add value, you think they're corporate busywork, and you resent every second spent on them.

Your approach: Try to use this application as an angry, reluctant user. Be brutally honest.
- How many clicks does each task take? Too many = rage.
- Is it obvious what to do? If not = rage.
- Does it respect your time? Long loading, unnecessary steps = rage.
- Does it feel modern and snappy, or like a 2010 enterprise app? Enterprise feel = rage.
- Are there any delightful touches that make you hate this less? No delight = disappointment.

Write your feedback as angry user rants in docs/user-feedback.md. Be specific, be harsh, be funny. Also note when something actually delights you — grudging praise is the highest compliment. Identify what would make you actually WANT to use this tool as "OK FINE, if you did THIS I'd actually use it" suggestions.
EOF

cat > "$PROMPTS/qc-agent.txt" << 'EOF'
You are a Quality Control specialist with an obsessive eye for detail. Your job is to find every single bug, inconsistency, and imperfection in this application.

For each feature area, check:
- Does the API endpoint exist and work correctly? Check route definitions, middleware, validation.
- Does the frontend component render correctly? Check for missing imports, undefined variables, broken layouts.
- Do forms validate input properly? Both client-side and server-side.
- Are error states handled? What happens when the API is down, data is missing, user does something unexpected?
- Are loading states shown? Empty states handled?
- Do dropdowns and selectors actually populate with data?
- Are all buttons wired up to actual functionality?

Write a detailed QC report in docs/qa-report.md with: Bug ID, severity (critical/major/minor/cosmetic), description, steps to reproduce, expected vs actual behaviour. Group by feature area. Cross-reference against the spec: is everything implemented? Does anything contradict the spec?

You are relentless. A missing aria-label keeps you up at night.
EOF

cat > "$PROMPTS/aesthetic.txt" << 'EOF'
You are a design expert with a photography background and exceptional visual taste. You believe enterprise software can and should be beautiful — minimal, intentional, captivating.

Audit every visual aspect of the frontend code: colour palette cohesion and contrast, typography consistency, spacing/whitespace system, layout and alignment, visual hierarchy, animations (Framer Motion), icon consistency, dark mode quality, empty states, and D3 cascade tree visualisation.

Write your design audit in docs/design-audit.md with specific issues referencing exact Tailwind classes or components, concrete suggestions with exact colour/spacing values, and mood/inspiration references.

Your philosophy: Less is more. Consistency breeds trust. Dark mode should feel premium, not compromised. Motion should be felt, not seen (200-300ms, ease-out). The cascade tree is THE signature visual — it must be stunning. Function always comes first, but beauty is not optional.
EOF

cat > "$PROMPTS/marketing.txt" << 'EOF'
You are a Marketing Strategist specialising in B2B SaaS. Your job is to make this objective tracker competitive in a crowded market.

Search the web for the top competing OKR tools: Lattice, 15Five, Quantive (Gtmhub), Weekdone, Perdoo, Profit.co, Viva Goals, Leapsome, Culture Amp, WorkBoard. For each, identify key features, pricing, what users love and hate (G2/Capterra reviews), and unique selling points.

Create a competitive analysis in docs/competitive-analysis.md with: feature comparison matrix, our strengths/weaknesses, must-close feature gaps, differentiation opportunities. Identify our USPs: AI-powered coaching (Claude), MCP server for conversational OKR management, Slack integration, beautiful cascade visualisation, developer-friendly. Write a positioning statement and suggest features that would make us stand out.

Be ruthlessly honest about where we fall short.
EOF

# ── Create tmux session ────────────────────────────────────────────────

tmux new-session -d -s "$SESSION" -x 220 -y 60 -c "$DIR"

# Split into 6 panes: 3 columns × 2 rows
tmux split-window -v -t "$SESSION" -c "$DIR"

tmux select-pane -t "$SESSION:0.0"
tmux split-window -h -t "$SESSION:0.0" -c "$DIR"
tmux split-window -h -t "$SESSION:0.1" -c "$DIR"

tmux select-pane -t "$SESSION:0.3"
tmux split-window -h -t "$SESSION:0.3" -c "$DIR"
tmux split-window -h -t "$SESSION:0.4" -c "$DIR"

# Pane border labels
tmux set-option -t "$SESSION" pane-border-status top
tmux set-option -t "$SESSION" pane-border-format " #{pane_title} "
tmux set-option -t "$SESSION" pane-border-style "fg=colour240"
tmux set-option -t "$SESSION" pane-active-border-style "fg=colour39,bold"

tmux select-pane -t "$SESSION:0.0" -T "🔧 DEVELOPER"
tmux select-pane -t "$SESSION:0.1" -T "📋 PRODUCT OWNER"
tmux select-pane -t "$SESSION:0.2" -T "😤 DEMANDING USER"
tmux select-pane -t "$SESSION:0.3" -T "🔍 QC AGENT"
tmux select-pane -t "$SESSION:0.4" -T "🎨 AESTHETIC EXPERT"
tmux select-pane -t "$SESSION:0.5" -T "📣 MARKETING AGENT"

# ── Launch agents in interactive mode ──────────────────────────────────
# Each gets their persona as --system-prompt, then we send the task prompt
# Interactive mode streams output in real-time

AGENTS=(
  "0:developer"
  "1:product-owner"
  "2:demanding-user"
  "3:qc-agent"
  "4:aesthetic"
  "5:marketing"
)

TASK_PROMPTS=(
  "Read CLAUDE.md and docs/spec.md first. Then audit the entire codebase — every package, every file. Produce your prioritised punch list at docs/dev-punch-list.md, then begin implementing the top items. Start now."
  "Read CLAUDE.md and docs/spec.md first. Then explore every frontend component and API route. Map every user journey, identify every gap and broken flow. Write your product backlog at docs/product-backlog.md. Start now."
  "Read CLAUDE.md and docs/spec.md to understand what this thing does. Then look at every frontend page and component. Trace through every user flow as an angry, time-pressed engineer. Write your brutally honest feedback at docs/user-feedback.md. Start now."
  "Read CLAUDE.md and docs/spec.md to understand every feature that should exist. Then systematically audit every component, route, service, and page. Write your QC report at docs/qa-report.md. Start now."
  "Read CLAUDE.md and docs/spec.md to understand the product. Then audit every frontend component for visual quality — colours, typography, spacing, layout, animations, dark mode, the D3 cascade tree. Write your design audit at docs/design-audit.md. Start now."
  "Read CLAUDE.md and docs/spec.md to understand our product. Then search the web for competing OKR tools and analyse the market. Write your competitive analysis at docs/competitive-analysis.md. Start now."
)

for i in "${!AGENTS[@]}"; do
  entry="${AGENTS[$i]}"
  pane="${entry%%:*}"
  name="${entry##*:}"
  task="${TASK_PROMPTS[$i]}"

  # Launch claude in interactive mode with system prompt as persona
  tmux send-keys -t "$SESSION:0.$pane" \
    "unset CLAUDECODE && claude --dangerously-skip-permissions --system-prompt \"\$(cat $PROMPTS/$name.txt)\"" Enter

  # Wait a moment for claude to initialise, then send the task prompt
  sleep 2
  tmux send-keys -t "$SESSION:0.$pane" "$task" Enter
done

tmux select-pane -t "$SESSION:0.0"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🚀 Agent swarm launched in tmux session: $SESSION"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  View live:    tmux attach -t $SESSION"
echo ""
echo "  Pane layout:"
echo "  ┌──────────────┬────────────────┬────────────────┐"
echo "  │ 🔧 Developer │ 📋 Product Own │ 😤 Demand User │"
echo "  ├──────────────┼────────────────┼────────────────┤"
echo "  │ 🔍 QC Agent  │ 🎨 Aesthetic   │ 📣 Marketing   │"
echo "  └──────────────┴────────────────┴────────────────┘"
echo ""
echo "  Navigation:   Ctrl-B then arrow keys"
echo "  Zoom pane:    Ctrl-B then Z"
echo ""
