# Skillsmith

[![test](https://github.com/aeghaegaghe/skillsmith/actions/workflows/test.yml/badge.svg)](https://github.com/aeghaegaghe/skillsmith/actions/workflows/test.yml)

Once you have more than a few AI agent skill files, they start to rot: a file gets renamed and three references break, a new skill never makes it into the index, required fields quietly go missing. Skillsmith treats your skills folder like a codebase, with a schema for writing them and a linter that catches drift before your agent does.

```bash
npx github:aeghaegaghe/skillsmith ./skills
```

Two pieces:

1. **An authoring schema** ([`docs/skill-schema.md`](./docs/skill-schema.md)). A structured interview that turns a fuzzy workflow into an unambiguous skill file. Every step is classified as **deterministic** (code or API), **judgment** (LLM against an explicit rubric), or **human** (a named owner). A judgment step with no rubric is the most common reason automations quietly break.

2. **A linter** ([`bin/audit.js`](./bin/audit.js)). Walks a folder of skill files and flags broken references, skills missing from the index, and schema gaps, deterministically.

## Usage

Author a new skill: load `docs/skill-schema.md` into your agent session and follow the interview. It produces a single markdown file in the canonical schema, ready to drop into your skills folder.

Lint a folder of skills:

```bash
node bin/audit.js <path-to-skill-folder> [--root <project-root>] [--help] [--version]
```

- `--root <project-root>`: the project root that non-relative refs resolve against. Defaults to the current directory.
- `--help` / `-h`: print the usage line and exit 0.
- `--version` / `-v`: print the installed version and exit 0.

Any other flag, or more than one positional argument, is an error: it exits 2 with a message plus the usage line, rather than being silently ignored.

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
scanned 3 skills/docs + 0 artifacts · 10 path refs (Example/Changelog excluded)

## MISSING PATHS (0)
  (none)

## ORPHANS — not in README (0)
  (none)

## CANONICAL SCHEMA GAPS (0)
  (none)

## UNCLASSIFIED — has frontmatter, no rigor_level (0)
  (none)

## SKIPPED — subfolder has no SKILL.md (0)
  (none)

RESULT: PASS
```

The audit checks five things:
- **Missing paths**: every file a skill links to actually exists. A path is only recognized if it starts with `./`, `../`, or `~/`, or ends with a recognized file extension; URLs and anything inside a fenced code block (a shown command, not a reference) are excluded.
- **Orphans**: every skill file is referenced from the family's `README.md`. If there's no `README.md` at all, this prints `## ORPHANS — skipped (no README.md)` instead of a false "0, clean" (the check never ran, so it doesn't claim to have passed).
- **Schema gaps**: every skill with a `rigor_level` in its frontmatter carries the required fields and sections for that rigor level.
- **Unclassified** (warning, not a failure): any `.md` file (other than `README.md`) that has a frontmatter block but never set `rigor_level`, so it's never skipped silently.
- **Skipped** (warning, not a failure): `.md` files sitting in a subfolder that has no `SKILL.md`. That subfolder is otherwise invisible to every check above, so this is what surfaces it instead of the files just disappearing.

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

## SKIPPED — subfolder has no SKILL.md (0)
  (none)

RESULT: FAIL — 1 issue(s)
```

Exit code 1. See `test/fixtures/` for more worked examples: a substring-orphan case, a CRLF full-rigor file with missing fields, an unclassified file, prose (and a fenced-code command) that shouldn't be mistaken for paths, a subfolder with no `SKILL.md`, and a family with no `README.md` at all.

## Tests

```bash
npm test
```

Runs `test/audit.test.js` (Node's built-in test runner) against the fixtures in `test/fixtures/`.

## Requirements

Node.js 18+. No dependencies.

## License

MIT
