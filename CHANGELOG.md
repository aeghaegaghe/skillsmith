# Changelog

## 0.2.1

- **Excluded fenced code blocks from the path scan.** A command shown inside a ``` or ~~~ block (e.g. `node bin/audit.js examples/weekly-report` in a README's usage section) was scanned as a real file reference. This is what made `npx github:aeghaegaghe/skillsmith examples/weekly-report`, run from outside the repo, report a false missing path. Inline single-backtick spans are untouched.
- **New `SKIPPED` section.** A subfolder with no `SKILL.md` was invisible to every check — its `.md` files were never collected at all. They're now surfaced as a warning (not a failure) instead of silently disappearing.
- **Fixed a false-clean orphan check.** A family with no `README.md` used to print `## ORPHANS — not in README (0) (none)`, reading as "checked, all clean" when the check never ran. It now prints `## ORPHANS — skipped (no README.md)`.
- **Added `--help`/`-h` and `--version`/`-v`.** Both exit 0. Any other flag, or more than one positional argument, exits 2 with a specific error plus the usage line instead of being silently ignored or misparsed.
- **CI hardening.** Added top-level `permissions: contents: read` to `.github/workflows/test.yml`.
- **README updates.** Documented the new `SKIPPED` and no-`README.md` cases and the new flags; refreshed the expected-output examples.

## 0.2.0

- **Schema/linter alignment.** The full-process output template and its illustrative example were missing `purpose`/`rigor_level`/`triggers`, so any skill produced by the authoring interview was silently skipped by the linter. Both now carry the required fields, and `rigor_level` is documented as required in the lightweight frontmatter list too.
- **New `UNCLASSIFIED` section.** Any `.md` file (other than `README.md`) with a frontmatter block but no `rigor_level` is now surfaced as a warning instead of being skipped without a trace.
- **Fixed false-positive path detection.** Prose containing slashes (`input/output`, `and/or`) and URL segments (`github.com/foo/bar`) were being reported as missing paths. A path is now only recognized if it starts with `./`, `../`, or `~/`, or ends with a recognized file extension; URLs are stripped from the scan text before matching.
- **Fixed the orphan check's substring false negative.** `report.md` no longer counts as indexed just because the README mentions `send-report.md` — the check now requires a whole-token match, bounded by a non-filename character or string edge.
- **Fixed CRLF handling.** Frontmatter parsing assumed `\n`, so a CRLF file's frontmatter never matched and the file silently skipped the schema check entirely. Every file read now normalizes `\r\n` to `\n` first.
- **Fixed crashes on bad invocations.** `--root` with no following value used to crash with a stack trace; it and a nonexistent `--root` now print a usage line and exit 2 cleanly.
- **Added a test suite.** `test/audit.test.js` (Node's built-in test runner) spawns the CLI against six fixtures in `test/fixtures/`, each isolating one of the cases above, plus three bad-invocation cases. `npm test` runs it.
- **Added CI.** `.github/workflows/test.yml` runs `npm test` on push and pull request across Node 18, 20, and 22.
- **README updates.** Real path-ref count in the expected-output example, an `npx github:aeghaegaghe/skillsmith` install-free run line, a "what a failure looks like" example, a CI badge, and documentation of the `UNCLASSIFIED` section.

## 0.1.0

Initial release: the canonical skill-authoring schema and interview (`docs/skill-schema.md`), the consistency linter (`bin/audit.js`), and a bundled example skill family.
