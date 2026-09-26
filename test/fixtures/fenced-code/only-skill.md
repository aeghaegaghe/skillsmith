---
name: only-skill
version: 0.1
purpose: Show a command in a fenced code block that must not be treated as a path reference.
rigor_level: lightweight
triggers:
  - "run only skill"
---

# Only Skill

## When to use
Always.

## Inputs
- none

## Steps
1. Run it from the repo root:

```
node bin/audit.js some/pretend/path/does-not-exist.md
```

2. See `./README.md` for context (a real inline reference — must still resolve).

## Output format
None.

## Common failure modes
- none

## Related
- `./README.md`
