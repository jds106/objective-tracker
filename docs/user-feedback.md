# User Feedback: "North Star" OKR Tracker

**Reviewer**: A senior engineer who was perfectly happy with a Google Sheet and a Slack reminder
**Mood**: Somewhere between "mandatory fun" and "involuntary compliance"
**Date**: 2026-02-21
**Revision**: 2 — Second pass after bug fixes, new features, and a general codebase tidy

---

## Executive Summary

Look, I'll be honest. When my manager said "we're rolling out an OKR tool" I literally felt my soul detach from my body and float towards the window. I have shipped code, debugged production fires at 2am, and reverse-engineered undocumented APIs — but nothing fills me with existential dread quite like being told I need to "cascade my objectives" into a web application.

I reviewed this thing a few hours ago, wrote a scathing document, and then — to my genuine surprise — the team actually *fixed things*. Like, immediately. Multiple issues from my first review are resolved. A brand new bulk check-in page appeared. The admin page stopped being a joke. The native `confirm()` dialogs got replaced. I'm... grudgingly impressed? Don't tell them I said that.

Here's the updated teardown.

---

## Flow-by-Flow Teardown

### 1. Login — Actually Fine (4/10 rage)

**Clicks to log in**: 3 (type email, type password, click Sign In). That's the correct number. You don't get a medal for doing the bare minimum but you also don't get yelled at.

**What works:**
- Accepts username OR email. Smart. I'll never remember which one I used to register and I refuse to find out.
- "Forgot password?" link right there. At least when I inevitably forget my 47th password, I won't have to go spelunking.
- The dark theme on login looks genuinely decent. It doesn't look like it was designed by a committee of enterprise architects who think "blue" is a personality.
- The forgot/reset password flow actually works. And in dev mode, the reset token is shown inline so you can test without an email server. Practical. I noticed.

**What still doesn't:**
- No "remember me" checkbox. So I get to log in EVERY. SINGLE. DAY. Do you understand what that does to a person who already resents opening this app? The JWT is 24 hours, which means every Monday morning I'm greeted with a login screen instead of my objectives. This is the app equivalent of making me badge into the building, scan my laptop, AND type a door code. Just remember me.
- No SSO. I have Okta. Everyone has Okta. WHY AM I CREATING ANOTHER PASSWORD?
- The placeholder says "you@company.com" but the label says "Email or username". Pick a story and stick with it.

### 2. Registration — Still Death by Form Fields, but Less Death (5/10 rage, was 6)

**What improved:**
- ~~No manager selection during registration~~ **FIXED.** There's now a "Manager's email" field right on the registration form. Optional, clearly labelled, with a helpful note that says "Your org level is set automatically from your manager." This is huge. The entire cascade model depends on the org tree and now users can self-wire on signup. One less thing for admins to do manually. Grudging applause.
- ~~No department field either~~ **ALSO FIXED.** Department field is right there, optional, next to the manager field. Grid layout, side by side. Clean.
- The password mismatch validation is real-time now — the confirm password field goes red-bordered the moment the passwords diverge, with a little "Passwords do not match" message. This is the correct way to do this. No more "submit → error → retype."

**What still doesn't:**
- **"Job title" is still required.** I maintain this should be optional. My job title is a moving target.
- **No password strength indicator.** Still just "At least 8 characters." I could set my password to `aaaaaaaa` and this form would be perfectly happy about it.
- **No onboarding after registration.** You're still dumped on an empty dashboard with zero guidance. The first-time experience is still "here's a room, figure it out."

### 3. Dashboard — Getting Better (2/10 rage, was 3)

The dashboard was already the least offensive screen. Now it's actually approaching... good?

**What improved:**
- **"Check in on all" button appeared!** Right there in the "My Objectives" heading bar, a little indigo link that says "Check in on all" with a checkmark icon. One click and I'm on the bulk check-in page. This is exactly what I asked for. Someone is reading my feedback and I'm not sure how I feel about that.
- The button only shows when you have objectives with key results. Smart — no point offering a check-in shortcut when there's nothing to check in on.

**What still doesn't:**
- **No AI nudges.** Still waiting for "Your KR hasn't been updated in 3 weeks" to appear here.
- **No quick per-objective check-in.** The "Check in on all" button is great for the weekly blitz, but sometimes I just want to update one objective's KRs without seeing everything. A small check-in icon on each ObjectiveCard would nail this.
- **The empty state when no cycle exists could be warmer.** The amber warning box is fine, but it's generic. For non-admins it says "Contact your administrator to set up an objective cycle." My administrator is a person named Dave who doesn't check Slack. Can we maybe... be more specific about what "set up a cycle" means?

### 4. Creating an Objective — Where Joy Goes to Die (7/10 rage, unchanged)

No changes here. Same issues. I'll keep this brief:
- Description still required. Still shouldn't be.
- No AI review. Still writing objectives in the dark.
- No draft auto-save. Still losing work when modals close.
- Status still starts as "draft." Still an unnecessary extra click to activate.
- No inline KR creation. Still 3 separate workflows stitched with duct tape.

### 5. Adding Key Results — The Click Treadmill (8/10 rage, unchanged)

Still the worst flow in the app. No changes. 25-30 interactions per objective. No inline creation during objective setup. No KR type explanations. No AI guidance. This is the setup cost that makes everyone groan at the start of a cycle.

### 6. Check-ins — Genuinely Improved (3/10 rage, was 7!)

This is where the big improvement landed. Let me be specific about what changed:

**The Bulk Check-in Page (`/check-in`) is REAL and it WORKS.**

The sidebar now has a "Check-in" link between Dashboard and Cascade, with a proper checkmark icon. Click it, and you land on a dedicated page that shows ALL your key results grouped by objective, with inline editing. One page. One submit button. Done.

**What I love (and I hate that I love it):**
- **Live progress deltas on every KR.** As I drag a percentage slider from 45% to 67%, the card header updates in real-time: `45% → 67% (+22%)` in emerald green. Move it backwards? Red. Put it back where it was? The delta disappears and the card reverts to neutral. The dirty detection is smart enough to ignore semantically meaningless changes. This is *thoughtful* engineering.
- **The sticky footer bar.** Always visible at the bottom: shows "3 changes" with a Discard button and a "Submit all check-ins (3)" button. After submission, each KR card flips to a green background with a checkmark — "Check-in recorded" — or red with the error message. The footer changes to "✓ All 5 check-ins recorded!" with a "Back to Dashboard" link. This is a *complete* flow. Start to finish, no loose ends.
- **Parallel submission with per-KR error handling.** Uses `Promise.allSettled` so if one check-in fails, the others still go through. Partial failure shows "2 of 5 failed" with a "Retry 2 failed" button. This is how you handle async operations. I've seen production apps that don't do this.
- **Check-in mode on config forms.** In the bulk check-in, milestone KRs only show checkboxes — no "add milestone" or "remove" buttons. Metric KRs only let you edit the "Current" value — Start, Target, Unit, and Direction are read-only text. This prevents me from accidentally modifying the goal structure during a routine check-in. Small detail, big deal.
- **Objective progress rings update live.** As I toggle milestone checkboxes or move sliders, the objective's progress ring in the header recalculates. I can see the overall objective progress change as I'm checking in. This makes progress feel *real* in a way the individual check-in modal never did.
- **Collapsible notes.** Each KR has a subtle "+ Add note" link. Click it, textarea appears. Don't click it, no clutter. The default state respects the fact that most check-ins don't need a novel attached.
- **Unsaved changes warning.** Navigate away with dirty changes and `beforeunload` fires. Can't accidentally lose check-in work. Thank you.
- **Type badges on each KR.** Colour-coded pills (blue for Percentage, purple for Metric, amber for Milestone, emerald for Binary). At a glance I know what type of input each card expects. Little touch, big clarity.

**What could still be better:**
- **No keyboard shortcut to jump here.** I want `c` from anywhere to go to `/check-in`. Right now it's a click on the sidebar or the dashboard button.
- **The "Check in on all" dashboard button is subtle.** It's a small translucent indigo link. First time I used it, I almost missed it. Consider making it a proper button, maybe with a count badge: "Check in (9 KRs)".
- **No "last checked in X days ago" indicator per KR.** I'd love to see "Last check-in: 12 days ago" on each card so I know which ones are stale.
- **The page reloads objective data after submit.** There's a brief flash when it refetches. Optimistic updates would make the post-submit feel smoother — the success indicators are great but the data momentarily resets before the refetch completes.
- **No animation on the objective group cards.** The dashboard has Framer Motion page transitions and staggered stat cards. The bulk check-in page just... appears. A staggered entrance animation would make it feel consistent with the rest of the app.

### 7. Cascade Tree View — Still Cool (2/10 rage, unchanged)

No changes. Still the best feature. Still needs a minimap, a "show my branch" button, and performance optimisation for scale. The D3 visualisation continues to be the one thing I'd put in a demo.

### 8. Team View — Managers Will Actually Use This (3/10 rage, unchanged)

No changes. KR Support Summary is still brilliant. Check-in recency indicators are still passive-aggressive in the best way. Still needs sorting, filtering, and the ability to create objectives for reports.

### 9. Profile Page — Inoffensive (2/10 rage, unchanged)

Still fine. Still can't see my own email. Still no excitement.

### 10. Admin Page — Significantly Improved (3/10 rage, was 5!)

Someone did WORK here. Let me count the improvements:

**What changed:**
- ~~No pagination~~ **FIXED.** The users table now paginates at 25 per page with prev/next buttons and page numbers. Search resets to page 1 automatically. For 400 users this is the difference between "usable" and "please fire me."
- ~~Objective owner shown as UUID~~ **FIXED.** The objectives tab now resolves owner IDs to actual names via a `userMap` lookup. I can see "Alice Chen" instead of `a3f8d2c1...`. This should have always been this way but I'll take the win.
- **The delete confirmation is now a proper styled modal.** No more native `confirm()` — it uses the new `ConfirmModal` component with a danger variant (red button), loading state, and proper design system styling. Same for KR deletion on the objective detail page. This is a small thing but it eliminates the one UI element that screamed "we didn't finish this."
- **User table is responsive.** Email, Manager, Level, and Department columns hide at different breakpoints (`hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`). On mobile you see Name, Role, and Actions. On a phone, this actually works. The name cell even shows email as a subtitle on small screens.
- **Three tabs: Users, Objectives, Cycles.** The cycles management is new — you can create cycles with quarters, manage status transitions (planning → active → review → closed), and see which quarter is currently active. This is critical admin functionality that was completely missing.
- **Edit user modal** with manager selection that prevents circular hierarchies (excludes the user themselves and their downward reports). This is the kind of validation that prevents org tree corruption.
- **"Set Password" modal** — admins can set a specific password for a user, separate from the "Reset" flow that generates a random temp password. More control, good.
- **Error messages are now dismissible.** The red error bar in admin has a "dismiss" link. Small but important — previously errors just sat there forever, taunting you.

**What still doesn't:**
- **No bulk operations.** Can't select multiple users. For initial onboarding of 400 people, this is still going to be a lot of "click Add User, fill form, submit, repeat."
- **No CSV import.** Still the #1 missing admin feature.
- **The admin page is a 1,600-line single file.** I can see this from reading the source. Three tab components (Users, Objectives, Cycles), each with multiple inline modals (CreateUserModal, EditUserModal, SetPasswordModal, EditObjectiveModal). This is a maintenance nightmare waiting to happen. Split it.
- **The Objectives tab still loads ALL objectives into a flat list.** Even with owner names resolved, for 1,200+ objectives this will be... a scroll. Needs pagination and filtering like the Users tab got.

---

## Cross-Cutting Issues

### No Keyboard Shortcuts
I'm a developer. I live in the keyboard. There are ZERO keyboard shortcuts. No `n` for new objective. No `c` for check-in. No `?` for help. Every interaction requires the mouse. This is 2026, not 2006.

### No Offline or Optimistic Updates
Every action waits for the API response before updating the UI. Create objective? Loading. Check in? Loading. The bulk check-in does optimistic *display* (showing success indicators immediately after the API resolves) but doesn't pre-apply the change optimistically. In a world where every SaaS app does optimistic updates, the loading spinners feel archaic.

### No Undo
Deleted a KR? Gone. Set the wrong progress on a check-in? Tough. There's no undo, no revision history, no "oops I didn't mean that" button. ~~The only safety net is a browser `confirm()` dialog for deletes.~~ **UPDATE**: The native `confirm()` dialogs are gone — replaced with proper `ConfirmModal` components with styled buttons and loading states. A real improvement. But undo itself is still missing.

### Error Handling is "Red Box, Plus Retry Sometimes"
~~No retry buttons. No suggestions.~~ **Partial fix**: `ErrorAlert` components now include `onRetry` callbacks in some places (dashboard, bulk check-in). But the pattern is inconsistent — some pages have retry, some don't. The admin page errors are dismissible now but don't retry. Standardise this.

### Mobile Responsiveness — Actually Exists Now?!
~~The Layout component is a fixed 64px sidebar + main content. No hamburger menu, no collapse, no responsive breakpoint.~~ I take this back. I clearly didn't resize my browser last time. The Layout has a FULL mobile implementation: hamburger button in a fixed top bar, a slide-out drawer with backdrop blur, proper `aria-modal` attributes, and the sidebar closes on route change and prevents body scroll while open. The admin table hides columns at breakpoints. This is... actually responsive. I was wrong. Credit where due.

**But**: The bulk check-in sticky footer uses `fixed bottom-0 left-0 right-0 md:left-64`. On mobile, the footer extends full-width (correct). On desktop, it offsets for the sidebar (correct). But there's no transition between these states — if you resize the browser, the footer doesn't animate. Minor nit. Also the footer content might get cramped on very narrow screens — "Submit all check-ins (3)" is a lot of text for a 320px viewport.

### British English
The spec says "Use British English spelling in user-facing text" and I see "organisation" in the cascade view and "colour" in the code comments. The commitment is there. I'll be watching for "color" to slip in. You've been warned.

---

## The Absence of AI is Still Deafening

The spec dedicates an ENTIRE SECTION (§6) to AI capabilities. Writing quality review. Alignment coaching. KR type guidance. Check-in prompting. Cycle review summaries. NONE OF THIS EXISTS YET. The AI assistant is the single most interesting differentiator of this tool and it's completely missing.

Without AI, this is just... another form-based OKR tracker. A *nicer* one now, with better check-ins and a responsive admin page. But still fundamentally a prettier version of what I could build in Notion.

The AI is what would make me think "OK, this is actually adding value" versus "this is just adding process." Build the AI.

---

## Things That Would Make Me Actually Want to Use This

### OK FINE, if you did THIS I'd actually use it:

1. **Slack-first check-ins.** Don't make me open a web app to say "I moved a metric from 45 to 62." Let me reply to a Slack DM. This is the #1 feature that would change this from "tool I resent" to "tool I tolerate."

2. **AI objective coach.** When I'm staring at a blank "Create Objective" form, give me a button that says "Help me write this." Let me describe what I want in plain English and have the AI turn it into a well-structured objective with suggested KRs and types. This would cut my setup time by 80%.

3. ~~**Bulk check-in flow.**~~ **DONE.** See section 6 above. The `/check-in` page is real, it works, and it's the single biggest UX improvement since my last review. Live progress deltas, smart dirty detection, parallel submission, per-KR success/error indicators, sticky footer, unsaved changes warning. I went from 54 clicks to about 12. I'll actually use this. Highest praise I can give an OKR tool: *I won't actively avoid it.*

4. **Quick check-in from dashboard.** The "Check in on all" link is great for the weekly blitz. But each objective card should also have a small check-in icon that opens a condensed modal for just that objective's KRs. For the "I just finished one thing and want to record it" use case.

5. **Inline KR creation during objective creation.** Still the #1 creation UX problem. One flow. Create objective, add KRs, activate. Three separate workflows stitched with modals and page navigations.

6. **"Show my branch" on cascade tree.** One button that zooms to my objectives and shows my upward chain and downward tree. I don't care about the other 380 people.

7. **SSO/Okta.** Please. For the love of all that is holy. Don't make me remember another password.

8. **Keyboard shortcuts.** `n` = new objective. `c` = check in. `j/k` = navigate list. `/` = search. Give me vim-like efficiency and I might actually respect this tool.

9. **Notification system.** Ping me when my check-in is overdue. Ping my manager when I haven't updated in 3 weeks. Use the AI to generate specific, useful nudges instead of generic "please update your objectives" spam.

10. **Make the first 5 minutes magical.** After registration, don't dump me on an empty dashboard. Walk me through creating my first objective. Show me my manager's objectives I could link to. Suggest KR types. Make the first experience feel guided and intentional, not like being dropped in an empty room with no furniture.

---

## Grudging Praise (Expanded Edition)

Because I'm not a COMPLETE monster, and because they actually fixed things between reviews:

- **The dark theme is good.** Like, legitimately good. The indigo accent colour works. The slate backgrounds don't strain my eyes. It doesn't look like every other "dark mode is just white-mode-inverted-badly" app.
- **The cascade tree visualisation is the best feature.** D3-powered, interactive, well-designed cards, smooth animations. This is the one thing that makes the cascading model feel tangible instead of abstract. Show this in the demo and people will go "ooh."
- **Health-sorted objectives on the dashboard.** A small design choice with big impact. The objectives that need my attention are at the top. This respects my time.
- **The ParentLinkSelector is well-engineered.** Searchable, keyboard-navigable, grouped by context. For a complex interaction, it's handled with care.
- **Framer Motion animations are smooth.** Modal entry/exit, progress ring fills, expand/collapse. It feels alive without being annoying. The right amount of motion.
- **The team view's KR support summary.** Genuinely useful for managers. Colour-coded coverage of your KRs. This is the kind of insight that makes someone go "oh, I should talk to my team about KR3."
- **Check-in progress deltas.** Seeing `45% → 62% (+17%)` with colour coding is a satisfying micro-interaction. It makes progress feel real.

**NEW praise since last review:**

- **The bulk check-in page is the single best feature addition.** I asked for it, they built it, and they built it *well*. The dirty detection, live progress previews, parallel submission, and per-KR success indicators show genuine care about the user experience. This is the feature that converts check-ins from "chore I dread" to "thing I do in 60 seconds on Monday morning." It's the difference between a tool I actively resist and a tool I tolerate.
- **The ConfirmModal killed the native confirm().** Every delete now uses a styled modal with danger-red buttons, loading state, and proper focus management. It's a small polish item but it was the one UI element that screamed "unfinished." Now it doesn't.
- **Registration has manager + department fields.** The org tree can now be built during self-service registration. This was a critical gap. Fixed.
- **Admin pagination.** 25 users per page with search-reset-to-page-1. The users table went from "will explode at scale" to "will work fine at 400."
- **Admin responsive table.** Columns hide at breakpoints. On a phone, you see names, roles, and actions. On a desktop, you see everything. Standard responsive pattern, executed correctly.
- **Cycle management in admin.** Create cycles, manage quarters, transition statuses. This was completely missing before. Now an admin can actually set up the temporal structure that the whole app depends on.
- **The "Check in on all" button on the dashboard.** One click to the bulk check-in. Conditional on having KRs. Positioned perfectly in the "My Objectives" heading bar. This is how you reduce friction — you meet the user where they already are.

---

## Final Verdict (Revised)

This has improved from a **6/10 foundation with 3/10 workflow efficiency** to a solid **7/10 overall**.

The check-in workflow went from abysmal to genuinely good. The admin panel went from embarrassing to functional. Registration went from incomplete to properly self-service. The mobile story went from "I was wrong, it already works" (OK fine, that one's on me). The native `confirm()` dialogs are gone. Real progress.

**What's still holding it back:**
- The complete absence of AI (this is still the elephant in the room)
- The objective + KR creation flow is still too many clicks
- No keyboard shortcuts, no Slack integration, no SSO
- No onboarding experience for first-time users

The gap between "where it is" and "where I'd actually want to use it daily" is narrower now. The bulk check-in closed the biggest one. If the AI lands, and Slack check-ins land, and the creation flow gets streamlined... I might stop doing my OKRs in a Google Sheet.

Might. Don't push it.

— *A reluctant user who is slightly less reluctant than 3 hours ago*
