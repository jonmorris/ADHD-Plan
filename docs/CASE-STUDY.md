# Case study: ADHD Plan

A running, modular case study of ADHD Plan, a phone-first planning app for daily tasks, routines and
projects, built for [[who it's for: the owner, or a wider audience]]. It is a repo-only record, never built
or shipped. Facts and dates come from [DECISION-LOG.md](DECISION-LOG.md) and the reasoning from
[DECISIONS.md](DECISIONS.md). This file is where they become a story.

## How this file works

- **Modules, not chapters.** Each `##` section stands alone, so a write-up can pick modules and drop the rest
  without leaving a gap.
- Every module opens with an italic tag line: **Core** (spine of any version), **Optional** (long form or a
  specific audience, named in brackets), and **Evidence**: what to show beside the text, with `[ ]` while it
  hasn't been captured.
- **Running.** When work is worth telling, add or amend a module and a row in *Log of additions*. Facts and
  dates come from DECISION-LOG.md. This file is where they become a story.
- **Placeholders** go in `[[double brackets]]` for the owner to fill in (role, tools, metrics,
  reflections). Never invent those.

## Suggested cuts

| Form | Modules |
|---|---|
| Short | 1, 2, 3, 11 |
| Standard | 1, 2, 3, 4, 5, 7, 9, 11 |
| Long | All, 1–12 |

## 1. Overview

*Core. Evidence: [ ] app icon and Today screen on a phone; [ ] one-line timeline graphic.*

- **What:** ADHD Plan, an installable web app (PWA) for the day's tasks, routines ("plans"), reminders and
  priorities, with an optional dollars mode that turns done tasks into a reward balance.
- **Role:** [[your role: e.g. product owner, designer, developer]].
- **Timeline:** first commit 22 October 2026; 69 pull requests merged by 19 November 2026, in bursts
  (22–24 October, 5–12 November, 14–19 November).
- **Tools:** Vite, Preact and TypeScript; data kept on the device (IndexedDB); Vitest; GitHub Actions
  deploying to GitHub Pages; built with Claude Code as a collaborator. [[anything else you used: design
  tools, devices tested on]].

## 2. The problem

*Core. Evidence: [ ] [[a before photo or description of the old system: paper list, other apps]].*

[[Why you needed this: what broke down with existing to-do apps or routines, in your words.]]

What the history shows about the problem: the app started as a habit tracker and became a daily checklist on
day one, then kept adding ways to make a long list feel smaller: one task to "do next", a short list of
priorities, collapsed or one-at-a-time groups, and rows that shrink once done. Each points at the same need:
[[name it, e.g. "seeing only what matters now without losing the rest"]].

## 3. Reframing the brief

*Core. Evidence: [ ] the three tab bars side by side: Today / Playbook / Analytics → Today / Manage /
Account.*

The brief moved twice. A habit tracker became a **daily task checklist** (22 October). Then the notes tab, the
Playbook, grew **built-in plans** (Clean Mama, Morning routine, ADHD protection, Lifting) that switch whole
routines on and off, and plans became the backbone: notes pages were removed (10 November) and the tab was
renamed **Manage** (12 November). The last step made it explicit: **groups and plans are one thing**
(19 November), after an empty plan couldn't be picked on Today and a near-duplicate group crept in.

[[What changed in your thinking: why routines mattered more than notes.]]

## 4. Plans: routines, sequences and projects

*Optional [product and design audiences]. Evidence: [ ] a plan page with its option chips; [ ] a sequential
group on Today with "Show 2 more"; [ ] a project group showing 2/3.*

One idea, a plan, absorbed several kinds of work:

- **Routines** repeat on a schedule and can earn a daily or weekly bonus.
- **Sequential** plans show one task at a time, so a routine reads as a next step, not a wall.
- **Deferrable** plans let a repeating task be skipped for the day without counting as missed.
- **Projects** (14 November) hold one-time tasks that stay ticked until the whole project is done, then
  leave Today.

The options moved once: first edited on the plan's page, then back into Edit with only the options that are
on shown as chips (a reversal on 12 November, DECISIONS.md → Plan options set in Edit, shown as chips).

## 5. Rewards without guilt: the dollars mode

*Optional [product and behaviour-design audiences]. Evidence: [ ] a Today screen in dollars mode with value
pills; [ ] the Cash out card; [[a photo of what a cash-out bought, if you want]].*

From 5 November tasks can carry a dollar value and plans a daily or weekly bonus, kept as a separate tally
from the plain count. Earnings build a balance that can be **cashed out** for a real reward (11 November). A
**penalty** for a task marked ✕ came later and is opt-in per task, defaulting to the task's value
(12 November). Half done earns nothing, by design.

[[Did it change behaviour? What you spent cash-outs on, and whether penalties helped or hurt.]]

## 6. Focus: one thing, three things, or as many as it takes

*Optional [product audiences]. Evidence: [ ] the Do next highlight; [ ] Priorities carrying over to the
next day.*

Priorities started as a top three held down on a task (6 November). **Do next**, a single focus task, was
added as the alternative (8 November), then **Unlimited** joined them, and unfinished priorities now
**carry over** to the next day (17 November). The highlight takes its colour from the chosen accent.

## 7. Designing for a phone, used in passing

*Core for a design audience, otherwise Optional. Evidence: [ ] a short screen recording: tap a task, the
action bar opens, defer; [ ] done and ✕ rows shrunk to one line.*

Decisions shaped by one-handed, glanceable use:

- **Hold** a checkbox for ✕ (not done); hold a name to make it a priority.
- **Tap** a task to open an **action bar in place** (Defer, Not done, Half done, Edit) instead of a full
  form; a modal was judged too heavy (14 November).
- **Done and ✕ tasks shrink** to one line (12 November); the dollar value is a pill in a fixed column that
  fills with the accent colour when earned.
- The phone's **back button** closes what's open (24 October); holding a task no longer selects its text
  on iPhone (12 November).
- A calm, minimal restyle with the Inter font and four accent colours (12 November).

## 8. Engineering: offline, local, always current

*Optional [engineering audience]. Evidence: [ ] the CI workflow; [ ] the Version line on the Account tab.*

The app is a PWA with all data on the device (IndexedDB) and an export for backups, so it works offline and
needs no account. Every pull request runs the tests and a production build; main deploys itself to GitHub
Pages. Because installed web apps cling to old versions, the app checks for an update when opened or
resumed and shows a **Version** line (build time and commit) so a phone's version can be read at a glance.

[[Why local-only rather than an account and a server: your reasons.]]

## 9. Saying no on the record

*Core. Evidence: [ ] the Deferred and Reversed rows of DECISION-LOG.md.*

Some of the clearest decisions were removals and reversals, logged rather than quietly undone:

- **Deferred:** the default state of a fresh install (keep the personal starter plans, start empty, or ship
  only generic ones) stays an open question in TODO.md.
- **Reversed:** notes pages removed from the Playbook; dismiss and defer merged into one action; plan
  options moved back into Edit; tapping a task opens actions instead of the editor.

[[Anything you chose not to build at all, and why.]]

## 10. Quality

*Optional [engineering audience]. Evidence: [ ] test run output; [ ] the checkbox centring measurements.*

The logic lives in small, tested modules (tasks, plans, money, priorities, reminders): 110 tests as of
19 November. Changes were checked in a real browser at phone size before merging, including simulated dates
for carry-over and projects. Two examples:

- A reorder made in Manage sometimes didn't show on Today. The cause was a sort comparator that compared
  tasks inconsistently once more than one plan was on; a test that shuffles every plan reproduced it, and
  the fix made every pair compare the same way (12 November).
- The tick in the done checkbox sat about 2px low; it was measured from enlarged screenshots and centred to
  within half a pixel (12 November).

## 11. Outcome and reflection

*Core. Evidence: [ ] [[a usage metric: days used, tasks done, streaks]]; [ ] [[a quote or note from
daily use]].*

[[What the app does for you now, in a sentence or two.]]

[[What you'd do differently.]]

[[What you learned about designing for ADHD, or for yourself.]]

## 12. Working with an AI collaborator

*Optional [audiences interested in process or AI-assisted work]. Evidence: [ ] a sample request and the pull
request it became.*

The app was built in conversation with Claude Code: requests came in plain language, and each became a small pull request that merged itself once the build passed. Clarifying questions came
before larger features (Projects, the Account tab, the restyle), and screenshots from a headless browser
stood in for checking on the device.

[[How this changed how you work: what you delegated, what you kept, where it went wrong.]]

## Log of additions

| Date | Module | Change |
|---|---|---|
| 2026-11-19 | All | First draft from git history and the decision log |
