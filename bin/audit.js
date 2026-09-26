#!/usr/bin/env node
// skillsmith-audit — consistency checks for a skill family AS ONE PRODUCT:
// its skills, artifacts (.html), templates, docs, and their cross-references.
//
// Usage: skillsmith-audit <family-dir> [--root <project-root>]
//   family-dir    path to the skill family (dir with skill .md files + subdir
//                 SKILL.md files + a README.md), relative to cwd or --root
//   --root        project root that absolute-looking refs (e.g. skills/foo.md)
//                 resolve against. Defaults to cwd.
//
// Checks:
//   1. MISSING PATHS  — every literal path referenced anywhere (skills, artifacts,
//      templates) resolves to a real file. Relative refs (./ ../) resolve against
//      the referencing file's directory; other refs resolve against --root.
//      Placeholder paths (< > { } *) are skipped. The Example-run and Changelog
//      sections are excluded (illustrative/historical prose, not live references).
//   2. ORPHANS        — every skill file is referenced in the family README.
//   3. SCHEMA GAPS    — every canonical skill (frontmatter has rigor_level) has the
//      required frontmatter keys + section headers per docs/skill-schema.md.
//   4. UNCLASSIFIED   — (warning, not a failure) any .md file other than README.md
//      that has a frontmatter block but no rigor_level. It's never skipped silently.
//
// Exit 0 = clean, 1 = issues, 2 = bad invocation.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const rootFlagIdx = args.indexOf("--root");
const root = rootFlagIdx !== -1 ? resolve(args[rootFlagIdx + 1]) : process.cwd();
const familyArg = args.filter((a, i) => a !== "--root" && args[i - 1] !== "--root")[0];
if (!familyArg) {
  console.error("usage: skillsmith-audit <family-dir> [--root <project-root>]");
  process.exit(2);
}
const familyDir = resolve(root, familyArg);
const rel = (p) => (p.startsWith(root + "/") ? p.slice(root.length + 1) : p);
if (!existsSync(familyDir)) { console.error(`family dir not found: ${familyDir}`); process.exit(2); }

// ---- collect: skills (.md + subdir SKILL.md), artifacts (.html) ----
function collect(dir) {
  const md = [], html = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(".md")) md.push(join(dir, e.name));
    else if (e.isFile() && e.name.endsWith(".html")) html.push(join(dir, e.name));
    else if (e.isDirectory() && existsSync(join(dir, e.name, "SKILL.md"))) md.push(join(dir, e.name, "SKILL.md"));
  }
  return { md, html };
}
const { md, html } = collect(familyDir);
const readmePath = join(familyDir, "README.md");
const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";

// ---- helpers ----
// A "path" is only ever one of two shapes:
//   (a) starts with ./ ../ or ~/  — an explicit relative/home ref, any trailing chars
//   (b) ends with a recognized file extension — a bare or nested reference like
//       skills/foo.md or foo.md. Anything else (input/output, and/or, a URL segment)
//       is prose, not a path, and is never checked.
const PATH_EXTS = "md|html|htm|json|js|mjs|cjs|ts|yml|yaml|py|sh|txt|csv";
const PATH_RE = new RegExp(
  String.raw`(?:~\/|\.\.?\/)[A-Za-z0-9_.\/<>{}*@-]+` +
  "|" +
  String.raw`(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:${PATH_EXTS})\b`,
  "g"
);
const isPlaceholder = (p) => /[<>{}*]/.test(p);
const clean = (p) => p.replace(/[).,;:`'"!?]+$/, "").replace(/@v?[0-9][^\/]*$/, "");
function toAbs(p, fileDir) {
  if (p.startsWith("~/")) return join(process.env.HOME || "", p.slice(2));
  if (p.startsWith("./") || p.startsWith("../")) return resolve(fileDir, p);
  // bare ref (no ./ ../ ~/ prefix): a plain filename like `fetch-data.md` in prose
  // almost always names a sibling of the file it's mentioned in; a multi-segment
  // ref like `skills/foo.md` is usually written root-relative. Try both.
  const relToFile = resolve(fileDir, p);
  if (existsSync(relToFile)) return relToFile;
  return resolve(root, p);
}
// drop Example-run + Changelog sections before the path scan (narrative/historical)
function stripNarrative(text) {
  return text.split(/\n(?=#{2,3}\s)/).filter((s) => !/^#{2,3}\s+(Example run|Changelog)\b/i.test(s)).join("\n");
}
// URLs contain slash-separated segments (and often file extensions) that read like
// paths but never are — drop them before the path scan runs.
function stripUrls(text) {
  return text.replace(/https?:\/\/\S+/g, "");
}
const frontmatter = (text) => (text.match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];

// ---- 1. missing paths ----
const missing = [];
let checked = 0;
for (const f of [...md, ...html]) {
  const text = stripUrls(stripNarrative(readFileSync(f, "utf8")));
  const dir = dirname(f);
  for (const c of new Set((text.match(PATH_RE) || []).map(clean))) {
    if (!c || /^\.\.?\/?$/.test(c) || isPlaceholder(c)) continue;
    checked++;
    if (!existsSync(toAbs(c, dir))) missing.push({ file: rel(f), ref: c });
  }
}

// ---- 2. orphans ----
// A substring test (`readme.includes(base)`) falsely marks e.g. `report.md` as
// indexed just because the README mentions `send-report.md`. Require the name to
// appear as a whole token — bounded by a non-filename character (or string edge)
// on both sides — so it must be an exact filename/link-target match.
const orphans = [];
if (readme) for (const f of md) {
  if (f === readmePath) continue;
  const base = f.slice(familyDir.length + 1).split("/")[0];
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = new RegExp(`(^|[^A-Za-z0-9_.-])${escaped}($|[^A-Za-z0-9_.-])`);
  if (!boundary.test(readme)) orphans.push(rel(f));
}

// ---- 3. canonical schema conformance (skills only) ----
const FM = ["name", "version", "purpose", "rigor_level", "triggers"];
const FM_FULL = ["owner", "status", "trigger_type", "runtime", "inputs", "outputs", "escalation"];
const SEC = [["## Steps", "## Stages"]];
const SEC_FULL = [["## Contract"], ["## Failure modes"], ["## Done criterion", "## Done criteria"], ["## Changelog"]];
const gaps = [];
const unclassified = [];
for (const f of md) {
  if (f === readmePath) continue;
  const raw = readFileSync(f, "utf8");
  const fm = frontmatter(raw);
  if (!fm) continue;                                            // no frontmatter at all — not a skill file
  if (!/rigor_level:/.test(fm)) { unclassified.push(rel(f)); continue; } // has frontmatter but never classified
  const full = /rigor_level:\s*full/.test(fm);
  const missKeys = [...FM, ...(full ? FM_FULL : [])].filter((k) => !new RegExp(`(^|\\n)\\s*${k}:`).test(fm));
  const missSec = [...SEC, ...(full ? SEC_FULL : [])].filter((alts) => !alts.some((h) => raw.includes(h))).map((a) => a[0]);
  if (missKeys.length || missSec.length) gaps.push({ file: rel(f), missKeys, missSec });
}

// ---- report ----
console.log(`# skillsmith-audit — ${familyArg}`);
console.log(`scanned ${md.length} skills/docs + ${html.length} artifacts · ${checked} path refs (Example/Changelog excluded)\n`);
console.log(`## MISSING PATHS (${missing.length})`);
missing.forEach((m) => console.log(`  ✗ [${m.file}] -> ${m.ref}`)); if (!missing.length) console.log("  (none)");
console.log(`\n## ORPHANS — not in README (${orphans.length})`);
orphans.forEach((o) => console.log(`  ✗ ${o}`)); if (!orphans.length) console.log("  (none)");
console.log(`\n## CANONICAL SCHEMA GAPS (${gaps.length})`);
gaps.forEach((g) => console.log(`  ✗ ${g.file}${g.missKeys.length ? ` | frontmatter: ${g.missKeys.join(", ")}` : ""}${g.missSec.length ? ` | sections: ${g.missSec.join(", ")}` : ""}`));
if (!gaps.length) console.log("  (none)");
console.log(`\n## UNCLASSIFIED — has frontmatter, no rigor_level (${unclassified.length})`);
unclassified.forEach((u) => console.log(`  ! ${u}`)); if (!unclassified.length) console.log("  (none)");
const problems = missing.length + orphans.length + gaps.length;
console.log(`\nRESULT: ${problems === 0 ? "PASS" : "FAIL — " + problems + " issue(s)"}`);
process.exit(problems === 0 ? 0 : 1);
