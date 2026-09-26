---
name: fetch-data
version: 0.1
purpose: Pull this week's raw usage numbers for the weekly report.
rigor_level: lightweight
triggers:
  - "pull this week's numbers"
---

# Fetch Data

## When to use
At the start of the weekly-report flow, before `send-report.md` runs.

## Inputs
- `usage_api` — the product's usage endpoint, last 7 days, JSON.

## Steps
1. Call the usage endpoint for the last 7 days.
2. Compute the delta against the prior 7 days.
3. Hand the result off to `./send-report.md`.

## Output format
A JSON object: `{ metric, value, delta_pct }[]`.

## Common failure modes
- Endpoint timeout → retry once, then skip with a note in the digest.

## Related
- `./send-report.md`
- `./README.md`
