# Skillsmith

[![test](https://github.com/aeghaegaghe/skillsmith/actions/workflows/test.yml/badge.svg)](https://github.com/aeghaegaghe/skillsmith/actions/workflows/test.yml)

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

Or run it straight from GitHub without installing anything:

```bash
npx github:aeghaegaghe/skillsmith <path-to-skill-folder>
```

Try it against the bundled example:

```bash
node bin/audit.js examples/weekly-report
```

Expected output:

```
# skillsmith-audit — examples/weekly-report
scanned 3 skills/docs + 0 artifacts · 11 path refs (Example/Changelog excluded)

## MISSING PATHS (0)
  (none)

## ORPHANS — not in README (0)
  (none)

## CANONICAL SCHEMA GAPS (0)
  (none)

## UNCLASSIFIED — has frontmatter, no rigor_level (0)
  (none)

RESULT: PASS
```

The audit checks four things:
- **Missing paths** — every file a skill links to actually exists
- **Orphans** — every skill file is referenced from the family's `README.md`
- **Schema gaps** — every skill with a `rigor_level` in its frontmatter carries the required fields and sections for that rigor level
- **Unclassified** — a warning, not a failure: any `.md` file (other than `README.md`) that has a frontmatter block but never set `rigor_level`, so it's never skipped silently

### What a failure looks like

Given a skill that links to a file that doesn't exist:

```
$ node bin/audit.js test/fixtures/missing-path
# skillsmith-audit — test/fixtures/missing-path
scanned 2 skills/docs + 0 artifacts · 3 path refs (Example/Changelog excluded)

## MISSING PATHS (1)
  ✗ [test/fixtures/missing-path/only-skill.md] -> ./does-not-exist.md

## ORPHANS — not in README (0)
  (none)

## CANONICAL SCHEMA GAPS (0)
  (none)

## UNCLASSIFIED — has frontmatter, no rigor_level (0)
  (none)

RESULT: FAIL — 1 issue(s)
```

Exit code 1. See `test/fixtures/` for more worked examples (a substring-orphan case, a CRLF full-rigor file with missing fields, an unclassified file, and prose that shouldn't be mistaken for paths).

## Tests

```bash
npm test
```

Runs `test/audit.test.js` (Node's built-in test runner) against the fixtures in `test/fixtures/`.

## Requirements

Node.js 18+. No dependencies.

## License

MIT
