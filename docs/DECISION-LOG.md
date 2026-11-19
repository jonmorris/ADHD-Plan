# Decision log

A dated index of the decisions made on ADHD Plan, one line each. It is a pointer, not a second source of
truth: each row's **Ref** names the file and section where the reasoning lives. That is mostly:

- [DECISIONS.md](DECISIONS.md): the why behind decisions, one section each
- [TODO.md](../TODO.md): work deferred, with the open question
- the CI workflow, [.github/workflows/ci.yml](../.github/workflows/ci.yml), for how the app is built and shipped
- git history (commit messages and pull request descriptions) for earlier decisions with nothing written
  elsewhere

This file and the case study ([CASE-STUDY.md](CASE-STUDY.md)) are repo-only records. They are never built
or shipped with the app.

## How to keep this file

- **Add a file, not a row.** A new decision goes in [`docs/decision-log/`](decision-log/) as its own file
  named `YYYY-MM-DD-short-name.md` (lowercase, hyphenated), holding exactly one table row. Never edit the
  table on a branch: rows appended to the same last line by parallel branches always conflict, and separate
  files never do.
- **Fold on main.** `npm run decision-log -- --fold` appends the waiting entries to the end of the table in
  filename order (date, then name) and deletes their files. Run it on main, in a commit of its own, whenever
  the folder gets long. `npm run decision-log` on its own checks the entries and prints them.
- **One row per decision, not per commit.** A reversed decision gets a new row of kind Reversed. The old row
  stays.
- **Say the decision, not the change** ("Groups and plans are one thing", not "edit plans.ts").
- **Kind** is one of: Product, Design, Content, Engineering, Process, Deferred, Reversed. Content covers the
  built-in plans the app ships with. The list lives in one place in code, `KINDS` in
  [scripts/decision-log-lib.ts](../scripts/decision-log-lib.ts).
- **Ref** names the file → section holding the why. If no why is written anywhere, write it there first
  (usually a new section in DECISIONS.md).

`npm test` checks every pending entry, so CI fails on a malformed one.

## Log

| Date | Kind | Decision | Ref |
|---|---|---|---|
| 2026-10-22 | Process | The project is kept out of search engines | git history (c8d5316, robots.txt) |
| 2026-10-22 | Engineering | An offline-first web app (PWA) in Vite, Preact and TypeScript, with data kept on the device | git history (1ed656f) |
| 2026-10-22 | Product | A daily task checklist rather than a habit tracker | git history (220c1cb) |
| 2026-10-22 | Product | A Playbook tab for notes and an Analytics tab beside Today | git history (#1) |
| 2026-10-22 | Product | The app is named ADHD Plan | git history (#2) |
| 2026-10-22 | Engineering | CI tests and builds every change; main deploys to GitHub Pages from a gh-pages branch | .github/workflows/ci.yml; git history (#2, #3) |
| 2026-10-23 | Product | Past and future days can be viewed, and past days ticked | git history (#5, #9) |
| 2026-10-23 | Product | Repeating tasks can stop on an end date | git history (#5) |
| 2026-10-23 | Product | Tasks can be bulk-added from Playbook pages | git history (#7) |
| 2026-10-23 | Content | The Playbook ships built-in plans, starting with Clean Mama | git history (#8) |
| 2026-10-23 | Product | Half done is opt-in per task, off by default | git history (#10) |
| 2026-10-24 | Product | A ✕ (not done) state, set by holding the checkbox | git history (#11) |
| 2026-10-24 | Product | Tasks sit in named, collapsible groups | git history (#12, #13) |
| 2026-10-24 | Content | Morning routine, ADHD protection and Lifting plans added | git history (#13, #14, #15) |
| 2026-10-24 | Product | New tasks go to the top of their list | git history (#14) |
| 2026-10-24 | Process | Pull requests merge themselves once the build passes | DECISIONS.md → Ship from main on a green build |
| 2026-10-24 | Product | Plans are editable in the app: their tasks, order, and new or deleted plans | git history (#16) |
| 2026-10-24 | Engineering | The phone's back button closes the open sheet, page or tab | git history (#17) |
| 2026-11-05 | Product | Sequential plans show their tasks one at a time | git history (#18) |
| 2026-11-05 | Product | Dollars mode: tasks carry a value and plans a daily and weekly bonus, tallied apart from the count | git history (#19, #20, #23) |
| 2026-11-05 | Product | One-off tasks can be deferred to the next day | git history (#22) |
| 2026-11-06 | Product | Reminders: notes above the list that are dismissed rather than ticked, in types with icons | git history (#24, #28, #32) |
| 2026-11-06 | Product | Priorities: hold a task to make it one of the day's top three | git history (#25) |
| 2026-11-06 | Product | Periodic tasks fall due a set time after they were last done | git history (#26) |
| 2026-11-06 | Engineering | The app updates itself when opened or resumed, and shows its version | git history (#31) |
| 2026-11-07 | Design | The theme can be System, Light or Dark | git history (#35) |
| 2026-11-07 | Deferred | The default state of a fresh install is left undecided | TODO.md |
| 2026-11-08 | Product | Do next: one focus task, as an alternative to the top three | git history (#38) |
| 2026-11-08 | Product | A plan can allow its repeating tasks to be skipped for the day | git history (#39) |
| 2026-11-10 | Reversed | Notes pages removed from the Playbook (their data kept in backups) | git history (#42) |
| 2026-11-11 | Product | Earnings build a balance that can be cashed out | git history (#43) |
| 2026-11-12 | Reversed | Dismiss and defer merged into one action | git history (#45) |
| 2026-11-12 | Design | A calm, minimal look: Inter font and a choice of four accent colours | git history (#46) |
| 2026-11-12 | Product | Analytics becomes Account: a dashboard, the full analytics, and every setting | git history (#48, #50) |
| 2026-11-12 | Product | The Playbook tab is renamed Manage | git history (#49) |
| 2026-11-12 | Reversed | Plan options are set in Edit and shown as chips, not edited on the plan page | DECISIONS.md → Plan options set in Edit, shown as chips |
| 2026-11-12 | Design | A task's dollar value is a pill in its own column, filled when earned | git history (#53, #55) |
| 2026-11-12 | Product | Today and Manage share one lasting order for a plan's tasks, with no reset | DECISIONS.md → Reorders are permanent |
| 2026-11-12 | Product | A task can carry a penalty for ✕, defaulting to its value | git history (#58) |
| 2026-11-12 | Design | Done and ✕ tasks shrink to one line | git history (#59, #60, #61) |
| 2026-11-14 | Product | Project plans: one-time tasks that stay done until the project is complete | DECISIONS.md → Projects |
| 2026-11-14 | Reversed | Tapping a task opens an action bar in place instead of the edit form | DECISIONS.md → Tap opens an action bar in place |
| 2026-11-17 | Product | Unfinished priorities carry over, and priorities can be unlimited | DECISIONS.md → Priorities carry over |
| 2026-11-17 | Product | A reminder can stay until it's dismissed | git history (#68) |
| 2026-11-19 | Product | Groups and plans are one thing, with unique names | DECISIONS.md → Groups are plans |
