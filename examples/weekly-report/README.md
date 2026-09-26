# weekly-report (example skill family)

A minimal two-skill family used to demonstrate `skillsmith-audit`. It has no real logic — it exists to show the shape a family needs: skill files following the canonical schema, cross-references between them, and a README that indexes every skill.

## Skills

- [`fetch-data.md`](./fetch-data.md) — pulls the week's raw numbers
- [`send-report.md`](./send-report.md) — turns them into a digest and sends it

Run the audit against this folder from the repo root:

```
node bin/audit.js examples/weekly-report
```

It should come back clean. Delete a skill file, or remove one from this README, and re-run it to see the audit catch the drift.
