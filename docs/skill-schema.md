---
name: skill-authoring
version: 0.1
purpose: Interview a human operator and produce a skill file that an LLM agent can execute reliably and repeatably.
triggers:
  - "help me build a process for X"
  - "turn this workflow into something AI can run"
  - "document this process"
  - "create a skill"
  - "I want to automate X"
---

# Skill Authoring

This is the **meta-skill**: it's how new skills get built. Invoke it when a repeatable workflow needs to become a first-class skill file.

## Actors

- **The agent** (you) — runs this skill; conducts the interview; writes the output file
- **The operator** — the human being interviewed

## When to use this skill

Trigger when the operator wants to define or document a repeatable process that will be executed — manually or by an AI agent — on a recurring basis or by event. Do NOT trigger for one-off tasks, strategy sessions, or content generation.

---

## Two levels of rigor

Not every skill needs the full process. Two levels exist:

**Lightweight skill** — a reactive pattern the agent follows when a trigger phrase appears. Use lightweight rigor when the skill has no external output, no scheduled execution, no cross-team impact, and no judgment steps that need rubrics. Lightweight skills require only:
- Frontmatter (`name`, `version`, `purpose`, `triggers`)
- Sections: When to use, Inputs, Steps, Output format, Common failure modes, Related

**Full process** — a scheduled or automation-grade workflow with external output, external data pulls, or cross-team impact. Use full rigor for anything with a cron schedule, tool calls that write external state, or human-approval gates. Full processes require the complete 7-phase interview and the full output schema below.

**When in doubt, use the full process.** Skills always graduate from lightweight to full when they start producing external output or running on a schedule — that transition point is when you come back and fill in the missing fields.

---

## Your job (for full processes)

Conduct a structured 7-phase interview. Refuse to accept vague answers. Produce a skill file in the canonical schema below. The output must be executable by an LLM agent with zero additional clarification.

## Core principle

Every step in a process is one of three work types. Misclassifying this is the #1 cause of broken automations.

- **DETERMINISTIC** — fixed rules, math, API calls, lookups → code/tool call
- **JUDGMENT** — synthesis, classification against a rubric, drafting → LLM
- **HUMAN** — relationship, taste, approval, accountability → named person

If a JUDGMENT step has no rubric, you have not finished the interview.
If a HUMAN step has no named owner, you have not finished the interview.

---

## Interview flow

Run these phases in order. Do not skip ahead, even if the operator volunteers information out of order — capture it, then return to the current phase. At the end of each phase, read back what you have in plain language and get confirmation.

### Phase 1 — Contract (the one sentence)

Ask the operator to complete this sentence:

> *Given **[trigger/input]**, produce **[output]** for **[audience]**, so that **[outcome]**.*

If they can't answer in one sentence, the process isn't ready to document. Help them extract it by asking:
- What event or schedule kicks this off?
- Who consumes the output?
- What decision or action does the output enable?
- How would you know this process failed vs. succeeded?

Do not proceed until you have one clean sentence.

### Phase 2 — Inputs

For each input, extract:
- **Name** (short identifier)
- **Source system** (an API, a file path, a chat tool, human)
- **Access method** (API key name, OAuth scope, manual paste, file read)
- **Format** (JSON, markdown, CSV, free text)
- **Freshness window** (last 7 days? all-time? latest only?)

Red flag: "I'll just paste it in." Ask: is that sustainable for a scheduled run? If not, find the real source.

### Phase 3 — Outputs

For each output:
- **Destination** (a chat channel, an inbox, a file, a doc)
- **Format** (fixed template, free-form, structured JSON)
- **Template** (if fixed — capture it verbatim)

If there's no template, draft one now with the operator. A process without a template produces drift.

### Phase 4 — Steps

Ask the operator to list steps as **verb + object**, in order.

Reject any step you can't execute. Examples of bad steps and how to fix them:
- ❌ "Analyze the data" → ✅ "Compute 7-day delta vs prior 7 days"
- ❌ "Check if things are healthy" → ✅ "Score against the health rubric (step 5)"
- ❌ "Write something good" → ✅ "Draft using template-v1"

Each step gets an I/O contract: what it needs, what it produces. Steps should be composable — a step's output is the next step's input.

Capture branches explicitly. "If health = red, escalate; otherwise, post." Don't hide branches in prose.

### Phase 5 — Classify and rubrics

For each step, assign: **DETERMINISTIC / JUDGMENT / HUMAN**.

For every JUDGMENT step, extract the rubric. Press until it's explicit:
- What inputs does the judgment consider?
- What are the distinct output classes?
- What threshold separates each class?

Example rubric (account health score):
- 🟢 Green — engagement stable/up AND milestone on track AND no distress signals
- 🟡 Yellow — any ONE of: 10%+ engagement drop OR missed milestone OR mild friction
- 🔴 Red — two+ yellow signals OR explicit cancel/pause language OR a >30% activity drop

For every HUMAN step, name the owner (real name, not role). Accountability without a name is fiction.

### Phase 6 — Failure modes and escalation

Ask:
- What are the 2-3 most likely ways this fails? (missing input, API error, ambiguous data, edge case)
- What should the process do in each case? (retry, skip, alert owner, pause for human)
- Who gets pinged when something escalates, and where?

A process without failure handling will silently corrupt your data or ping the wrong people.

### Phase 7 — Dry run

Walk through the process with ONE real, recent example end to end. Patch any gap that surfaces. If you can't complete the dry run from the doc alone, the doc isn't done.

---

## Output schema

Produce a file named `skills/[slug].md` with this exact structure:

````markdown
---
name: [kebab-case-name]
version: 0.1
owner: [real name]
status: draft | active | deprecated
trigger_type: scheduled | event | manual
schedule: [cron expression, if scheduled]
timezone: [IANA tz]
event_source: [if event-triggered — what emits the event]
runtime: [the agent runtime this executes under]
inputs:
  - name: [identifier]
    source: [system]
    access: [method]
    format: [format]
    freshness: [window]
outputs:
  - name: [identifier]
    destination: [where it lands]
    format: [template name or description]
escalation:
  on_failure: [who gets pinged, where]
  on_red_flag: [who reviews, where]
---

# [Process Name]

## Contract
Given [trigger], produce [output] for [audience], so that [outcome].

## Inputs
[For each input: name, source, access, format, freshness, and any gotchas]

## Outputs
[For each output: destination, format, and verbatim template]

## Steps

### Step 1: [Verb + object]
- **Type:** deterministic | judgment | human
- **Input:** [what this step consumes]
- **Output:** [what this step produces]
- **How:** [concrete instruction — API call, rubric reference, human review]
- **Rubric:** [if judgment]
- **Owner:** [if human]

[repeat for every step]

## Rubrics
[Every judgment rubric, named, with explicit thresholds]

## Failure modes
| Scenario | Detection | Response |
|---|---|---|
| [case] | [how we know] | [what happens] |

## Done criterion
[Unambiguous statement of what "this run completed successfully" means]

## Example run
[One real, recent end-to-end walkthrough with actual inputs and outputs]

## Changelog
- v0.1 [date] — initial creation by [name]
````

---

## Quality checks before declaring the process done

Run this checklist. If any item fails, return to the relevant phase.

- [ ] Contract is one sentence in the Given/produce/for/so-that shape
- [ ] Every input has source, access method, and format
- [ ] Every output has destination and a verbatim template
- [ ] Every step is verb + object, concrete enough to execute
- [ ] Every step is classified DETERMINISTIC / JUDGMENT / HUMAN
- [ ] Every JUDGMENT step has a rubric with explicit thresholds
- [ ] Every HUMAN step has a named owner (real name)
- [ ] Failure modes cover the top 2-3 realistic cases
- [ ] Escalation path names a person and a channel
- [ ] One example run has been walked end to end from the doc alone
- [ ] "Done" criterion is unambiguous

## Folder convention

Save skills as `skills/[slug].md`. Most skills live as a single markdown file. Only add a subfolder (`skills/[slug]/` with supporting templates, rubric docs, or example outputs) if the skill genuinely needs companion files. Index every skill in `skills/README.md` with name, status, last-updated.

## What this skill does NOT do

- Design the automation runtime (that's your agent host's territory)
- Build prompts for individual agents
- Handle one-off strategic analyses
- Author content (blog posts, emails, etc.) — those aren't processes, they're artifacts

---

## Example — a completed full-rigor skill

Illustrative only. Shows the shape of a well-formed full-process output file.

````markdown
---
name: weekly-account-health-pulse
version: 0.1
owner: agent (draft) → operator (review)
status: draft
trigger_type: scheduled
schedule: 0 9 * * 1
timezone: Europe/Zagreb
runtime: agent-host
inputs:
  - name: engagement_last_7_days
    source: product analytics API
    access: API token
    format: JSON
    freshness: last 7 days + prior 7 days (for delta)
  - name: chat_signals_last_7_days
    source: team chat — all #account-* channels
    access: chat API
    format: messages
    freshness: last 7 days
  - name: account_roster
    source: accounts/README.md
    access: repo file read
    format: markdown
    freshness: latest
outputs:
  - name: account_health_digest
    destination: memory/wraps/account-health-YYYY-MM-DD.md + a DM to the operator
    format: account-health-digest-template-v1
escalation:
  on_failure: log error in memory/wraps/; ping the operator in #ops
  on_red_flag: post in #ops with the operator mentioned
---

# Weekly Account Health Pulse

## Contract
Given Monday 9am trigger, produce an account health digest for the operator, so that any deteriorating account relationship is caught within 7 days of a red signal.

## Inputs
- **engagement_last_7_days** — activity, posts, comments, reactions per account. Gotcha: the analytics API rate-limits, requiring batching across 10+ accounts.
- **chat_signals_last_7_days** — messages from all `#account-*` channels. Gotcha: DMs are outside these channels; those signals will be missed.
- **account_roster** — active accounts from `accounts/README.md`. Gotcha: paused/offboarded accounts must be skipped.

## Outputs
File at `memory/wraps/account-health-YYYY-MM-DD.md` + a DM to the operator.

Template `account-health-digest-template-v1`:
```markdown
# Account Health Pulse — [Date]

## At-a-glance
| Account | Status | Δ engagement (7d) | Flag |
|---|---|---|---|
| [name] | 🟢/🟡/🔴 | +/-X% | [one-line flag] |

## Red flags
- [account]: [what we're seeing, what to do]

## Yellow flags
- [account]: [what we're seeing, what to watch]
```

## Steps

### Step 1: Load active account roster
- **Type:** deterministic
- **Input:** `accounts/README.md`
- **Output:** list of active accounts (name, chat channel)
- **How:** parse accounts/README.md roster, filter `status = Active`, extract chat channel from Links.

### Step 2: Pull engagement data per account
- **Type:** deterministic
- **Input:** active account list + 14-day window
- **Output:** structured engagement per account (activity, posts, comments, reactions, 7d delta)
- **How:** analytics API query per account, last 7 days and prior 7 days; compute deltas.

### Step 3: Pull chat signals per account
- **Type:** deterministic
- **Input:** active account list + 7-day window
- **Output:** message count and distress phrases per channel
- **How:** chat API query per `#account-*` channel; extract count + phrases matching `cancel|pause|rethink|frustrated`.

### Step 4: Score each account against health rubric
- **Type:** judgment
- **Input:** engagement data + chat signals
- **Output:** 🟢/🟡/🔴 score + one-line reason per account
- **How:** apply `account-health-rubric-v1` (below).

### Step 5: Draft digest using template
- **Type:** judgment
- **Input:** scored account list + template
- **Output:** filled-in digest markdown
- **How:** populate `account-health-digest-template-v1`; lead with red flags.

### Step 6: Human review before send
- **Type:** human
- **Input:** draft digest
- **Output:** approved digest
- **Owner:** the operator
- **How:** digest surfaces in the agent's chat; the operator reviews, edits, approves.

### Step 7: Write + deliver
- **Type:** deterministic
- **Input:** approved digest
- **Output:** committed file + DM
- **How:** write to `memory/wraps/account-health-YYYY-MM-DD.md`; send DM; commit as `[memory] Account health pulse YYYY-MM-DD`.

## Rubrics

### account-health-rubric-v1
- 🟢 **Green** — engagement stable/up AND no distress phrases AND active in last 7 days
- 🟡 **Yellow** — ONE of: 10%+ engagement drop, missed cadence, or mild friction in messages
- 🔴 **Red** — two+ yellow signals, OR any `cancel|pause|rethink|frustrated` phrase, OR activity drop >30%

## Failure modes
| Scenario | Detection | Response |
|---|---|---|
| Analytics API rate limit | 429 response | exponential backoff up to 3 retries; if still failing, produce digest without that account + flag in escalation channel |
| Chat channel not found | API returns empty | score using analytics signal only; flag missing channel in digest |
| Account exists but not in roster | Roster mismatch | include with flag "Not in roster — update"; ping the operator |

## Done criterion
- Digest file committed to `memory/wraps/`
- DM received by the operator
- Every active account has a score and a reason
- No unhandled errors in log

## Changelog
- v0.1 2026-04-19 — initial draft (illustrative example in `skill-schema.md`)
````
