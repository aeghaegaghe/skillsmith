---
name: send-report
version: 0.1
purpose: Turn this week's numbers into a digest and send it to the team.
rigor_level: lightweight
triggers:
  - "send the weekly report"
---

# Send Report

## When to use
After `fetch-data.md` has produced this week's numbers.

## Inputs
- The metric list from `./fetch-data.md`.

## Steps
1. Sort metrics by absolute delta, largest first.
2. Draft a short digest: one line per metric.
3. Send it to the team channel.

## Output format
A markdown digest, one line per metric: `metric: value (Δ delta_pct%)`.

## Common failure modes
- No metrics moved more than 1% → send a one-line "quiet week" note instead of an empty digest.

## Related
- `./fetch-data.md`
- `./README.md`
