# Decisions

The reasoning behind decisions, one section each, newest at the bottom. Index: [DECISION-LOG.md](DECISION-LOG.md).
Deferred work lives in [TODO.md](../TODO.md). Most earlier decisions have their why only in git history
(commit messages and pull request descriptions); add a section here when one is revisited.

## Ship from main on a green build

The owner asked for pull requests to be merged automatically once they're approved. The CI build (tests,
then a production build) is the gate: a pull request merges when it passes, and main deploys to GitHub
Pages on its own.

## Plan options set in Edit, shown as chips

The owner wanted a plan's options (Sequential, Deferrable, Project, bonuses) changed in the Edit flow, not
on the plan's page, but still visible there. The page shows only the options that are on, as small chips,
and nothing when none are.

## Reorders are permanent

Reordering on Today and in Manage both change the plan's own order, so there is one order and no "Reset to
default order". The owner asked that either reorder make a lasting change.

## Projects

Some groups are one-off projects: each task is done once and stays done until the whole project is. A
Project plan has one-time tasks only; ticked ones stay on Today (shown done) until the last is ticked, then
the group leaves Today and the plan shows Complete. The owner chose the plan-level option in Manage over a
group flag on Today.

## Tap opens an action bar in place

Tapping a task used to open the edit form. The owner wanted quick actions (Defer, Not done, Half done, Edit)
and judged a modal too heavy, so a bar opens under the row instead. The → defer icon moved into the bar.

## Priorities carry over

Unfinished priorities (and the do-next task) roll into the next day until done, and an Unlimited option
joins Do next and Top 3. A day's own list, once changed, is kept as is.

## Groups are plans

An empty, switched-off plan couldn't be picked on Today, so a second group was made with the same name in
different case, and it never appeared in Manage. Groups and plans are now one thing: every plan is offered
on Today, a group made on Today becomes a plan, and names are unique ignoring case.

## Drop a task from its action bar

The owner wanted a quick way to delete a task without opening its form. **Drop** joins the action bar: after
a confirm, the task leaves the list from today on, and its history stays (the same as Remove in the form).
It was first called Abandon; the owner chose Drop as the softer name.

## Decision log

Decisions are indexed one line each in DECISION-LOG.md. Pending entries are separate files in
`docs/decision-log/` because rows appended to the end of one table by parallel branches always conflict;
they are folded into the table on main.
