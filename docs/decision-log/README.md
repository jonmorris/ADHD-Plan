# Pending decision-log entries

Each file here is one decision waiting to join the table in [../DECISION-LOG.md](../DECISION-LOG.md):
named `YYYY-MM-DD-short-name.md`, holding exactly one row, `| Date | Kind | Decision | Ref |`.

- `npm run decision-log` checks the entries and prints them, with a count.
- `npm run decision-log -- --fold` (on main, in a commit of its own) moves them into the table and deletes
  the files.
