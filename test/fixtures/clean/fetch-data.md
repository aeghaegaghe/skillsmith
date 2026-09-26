---
name: fetch-data
version: 0.1
purpose: Pull raw numbers.
rigor_level: lightweight
triggers:
  - "pull numbers"
---

# Fetch Data

## When to use
Before send-report.md runs.

## Inputs
- an API

## Steps
1. Call the API.
2. Hand off to `./send-report.md`.

## Output format
JSON.

## Common failure modes
- timeout → retry once.

## Related
- `./send-report.md`
