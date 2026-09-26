# Skillsmith

Author and lint markdown-based "skill" files — the repeatable-process documents that let an LLM agent (Claude, or any other agent runtime) execute a workflow reliably, without re-deriving it from scratch every time.

Two pieces:

1. **A canonical schema + authoring process** ([`docs/skill-schema.md`](./docs/skill-schema.md)) — a structured interview that turns a fuzzy workflow into an unambiguous skill file. Every step in a process gets classified as **deterministic** (code/API), **judgment** (LLM against an explicit rubric), or **human** (named owner, no fake accountability). A process with an unclassified step, or a judgment step with no rubric, is the #1 cause of automations that quietly break.

2. **A consistency linter** ([`bin/audit.js`](./bin/audit.js)) — once you have more than a couple of skills that reference each other, they drift: a file gets renamed and a cross-reference goes dead, a new skill never gets added to the index, a skill's frontmatter falls out of schema. `skillsmith-audit` walks a folder of skill files and catches all three, deterministically.

## Why

Once you're running more than a handful of AI-agent workflows, you have the same problem software has always had: files that reference each other, and no guarantee those references stay true as the set grows. Skillsmith treats a folder of skill files like a small codebase — schema-validated and lint-checked — instead of a pile of prompts.

## Usage

Author a new skill: load `docs/skill-schema.md` into your agent session and follow the interview. It produces a single markdown file in the canonical schema, ready to drop into your skills folder.

Lint a folder of skills:

```bash
node bin/audit.js <path-to-skill-folder> [--root <project-root>]
```

Try it against the bundled example:

```bash
node bin/audit.js examples/weekly-report
```

Expected output:

```
# skillsmith-audit — examples/weekly-report
scanned 3 skills/docs + 0 artifacts · N path refs (Example/Changelog excluded)

## MISSING PATHS (0)
  (none)

## ORPHANS — not in README (0)
  (none)

## CANONICAL SCHEMA GAPS (0)
  (none)

RESULT: PASS
```

The audit checks three things:
- **Missing paths** — every file a skill links to actually exists
- **Orphans** — every skill file is referenced from the family's `README.md`
- **Schema gaps** — every skill with a `rigor_level` in its frontmatter carries the required fields and sections for that rigor level

## Requirements

Node.js 18+. No dependencies.

## License

MIT
