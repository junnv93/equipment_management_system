---
name: generate-prompts
description: >
  Scan codebase for actionable issues and generate verified harness prompts.
  Auto-archive completed items and filter false positives.
  Use when: user asks to scan codebase, generate new prompts, review existing prompts,
  clean up completed items, or says "프롬프트 생성", "코드베이스 스캔", "새 프롬프트",
  "/generate-prompts". Also triggers on "프롬프트 리뷰", "프롬프트 정리".
---

# generate-prompts

Scan → Verify → Generate harness prompts for `example-prompts.md`.

**Critical rule: Never trust 1st-pass scan results. Always verify with Read/Grep before writing a prompt.**

## Workflow

### 1 + 2. Load & Scan (simultaneously)

**In the same message**, do both:

**Step 1** — Read `.claude/skills/harness/references/example-prompts.md`. Note completed (~~strikethrough~~), in-progress, and pending items.

**Step 2** — Launch 3 background Explore agents **in parallel** (use prompts from [references/scan-prompts.md](references/scan-prompts.md)):

| Agent | name | subagent_type | domain |
|-------|------|---------------|--------|
| A | `scan-backend` | `Explore` | Backend: TODO/FIXME, security, perf, dead code |
| B | `scan-frontend` | `Explore` | Frontend: TODO/FIXME, hardcoding, a11y, error.tsx |
| C | `scan-infra` | `Explore` | Infra/packages: enums, indexes, CI, env |

Set `run_in_background: true` on all 3. You will be notified when each completes.
Each agent must report findings with `file:line`.

### 3. Verify findings (CRITICAL — never skip)

Wait for all 3 scan agents. Then verify.

**< 10 findings total** → verify directly with Read/Grep:
```
"X is missing" → Read the file, confirm it's actually missing
"Decorator missing" → Read the full controller
"Index missing" → Read the schema's index section
```

**≥ 10 findings** → launch 3 parallel Explore agents to verify by domain:
- `verify-backend` (subagent_type: Explore) — verifies Agent A findings
- `verify-frontend` (subagent_type: Explore) — verifies Agent B findings
- `verify-infra` (subagent_type: Explore) — verifies Agent C findings

If a scan agent's findings need clarification, use `SendMessage({to: "scan-backend"})` rather than re-scanning.

Classify each finding:
- **Confirmed** → write prompt
- **False positive** → exclude, record in archive with reason
- **Needs user input** → ask user (domain decisions like FK policy, permission removal)

### 4. Write prompts

Format per finding (confirmed only):

```markdown
### {title} (Mode {0|1|2})

\`\`\`
{problem — what's wrong, verified locations with file:line}
{action — what to do}
검증: {success criteria}
\`\`\`
```

Mode: 0 (≤3 files) / 1 (4-15 files) / 2 (15+ or DB change)

Priority: 🔴 CRITICAL (security) → 🟠 HIGH (perf/gaps) → 🟡 MEDIUM (quality) → 🟢 LOW (polish)

### 5. Archive completed items

Move to `<details>` archive section:
- ~~Strikethrough~~ items
- Items with merged PRs (check `git log`)
- Items confirmed as already implemented

False positives → separate `<details>` section with lessons learned.

### 6. Update example-prompts.md

Write final prompts to `.claude/skills/harness/references/example-prompts.md`:
- Update header date
- Add new items under priority sections
- Move completed/false-positive to archive

### 7. User review

Present summary and ask for confirmation:

```
| Priority | New | Archived | False Positive |
|----------|-----|----------|----------------|

### Items needing your decision
{domain questions}
```

## Exceptions

1. Never delete completed items — archive them (lessons learned)
2. Never include unverified findings — Step 3 is mandatory
3. Never make domain decisions autonomously — ask user
4. Test file TODO/FIXME → classify as MEDIUM or lower

## Related Files

| File | Purpose |
|------|---------|
| [references/scan-prompts.md](references/scan-prompts.md) | Agent prompts for Step 2 |
| `.claude/skills/harness/references/example-prompts.md` | Prompt storage (SSOT) |
| `.claude/skills/harness/SKILL.md` | Harness skill (prompt consumer) |
