import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AUDIT = join(ROOT, "bin", "audit.js");

function run(familyDir) {
  return spawnSync(process.execPath, [AUDIT, familyDir], { cwd: ROOT, encoding: "utf8" });
}

test("clean family passes with no issues", () => {
  const res = run("test/fixtures/clean");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## MISSING PATHS \(0\)/);
  assert.match(res.stdout, /## ORPHANS.*\(0\)/);
  assert.match(res.stdout, /## CANONICAL SCHEMA GAPS \(0\)/);
  assert.match(res.stdout, /## UNCLASSIFIED.*\(0\)/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("a real missing path is caught", () => {
  const res = run("test/fixtures/missing-path");
  assert.equal(res.status, 1);
  assert.match(res.stdout, /## MISSING PATHS \(1\)/);
  assert.match(res.stdout, /does-not-exist\.md/);
  assert.match(res.stdout, /RESULT: FAIL/);
});

test("prose with slashes and a URL is not flagged as a path", () => {
  const res = run("test/fixtures/prose-slashes");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## MISSING PATHS \(0\)/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("orphan check isn't fooled by a substring match", () => {
  const res = run("test/fixtures/substring-orphan");
  assert.equal(res.status, 1);
  assert.match(res.stdout, /## ORPHANS.*\(1\)/);
  assert.match(res.stdout, /report\.md/);
  assert.match(res.stdout, /RESULT: FAIL/);
});

test("a broken CRLF full-rigor file is still checked, not skipped", () => {
  const res = run("test/fixtures/crlf-fullrigor");
  assert.equal(res.status, 1);
  assert.match(res.stdout, /## CANONICAL SCHEMA GAPS \(1\)/);
  assert.match(res.stdout, /broken-full\.md/);
  assert.match(res.stdout, /RESULT: FAIL/);
});

test("a file with frontmatter but no rigor_level warns without failing", () => {
  const res = run("test/fixtures/unclassified");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## UNCLASSIFIED.*\(1\)/);
  assert.match(res.stdout, /loose-doc\.md/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("a command shown in a fenced code block is not treated as a path", () => {
  const res = run("test/fixtures/fenced-code");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## MISSING PATHS \(0\)/);
  assert.doesNotMatch(res.stdout, /does-not-exist/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("a subfolder with no SKILL.md warns as SKIPPED, not failed", () => {
  const res = run("test/fixtures/skipped-subfolder");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## SKIPPED.*\(1\)/);
  assert.match(res.stdout, /notes\/draft\.md/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("a family with no README.md skips the orphan check instead of reporting a false clean", () => {
  const res = run("test/fixtures/no-readme");
  assert.equal(res.status, 0);
  assert.match(res.stdout, /## ORPHANS — skipped \(no README\.md\)/);
  assert.doesNotMatch(res.stdout, /## ORPHANS — not in README/);
  assert.match(res.stdout, /RESULT: PASS/);
});

test("bad invocation: missing family-dir exits 2 with usage", () => {
  const res = spawnSync(process.execPath, [AUDIT], { cwd: ROOT, encoding: "utf8" });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /usage: skillsmith-audit/);
});

test("bad invocation: --root with no value exits 2, no stack trace", () => {
  const res = spawnSync(process.execPath, [AUDIT, "test/fixtures/clean", "--root"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(res.status, 2);
  assert.doesNotMatch(res.stderr, /at file:/); // no stack trace
  assert.match(res.stderr, /--root requires a value/);
});

test("bad invocation: --root pointing at a nonexistent dir exits 2, no stack trace", () => {
  const res = spawnSync(process.execPath, [AUDIT, "test/fixtures/clean", "--root", "/no/such/dir"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(res.status, 2);
  assert.doesNotMatch(res.stderr, /at file:/);
  assert.match(res.stderr, /root not found/);
});
