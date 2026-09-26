---
name: send-report
version: 0.1
purpose: Send the digest.
rigor_level: lightweight
triggers:
  - "send report"
---

# Send Report

## When to use
After `./fetch-data.md` runs.

## Inputs
- the metric list

## Steps
1. Draft the digest.
2. Send it.

## Output format
Markdown.

## Common failure modes
- nothing moved → send a quiet note.

## Related
- `./fetch-data.md`
