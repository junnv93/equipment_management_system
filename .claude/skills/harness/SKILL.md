---
name: harness
description: 3-Agent harness orchestrator (Planner → Generator → Evaluator loop). Auto-select execution mode based on task complexity. Reuse existing verify-*/review-* skills as Evaluator infrastructure. Trigger on "하네스", "/harness", "harness mode", or when starting non-trivial multi-file implementation tasks.
argument-hint: '[요청 내용] 또는 [mode0|mode1|mode2]'
---

# Harness — Generator-Evaluator Orchestrator

Anthropic의 "Harness Design for Long-Running Apps" 패턴 적용.
기존 verify-*, review-* 스킬을 Evaluator로 재사용하며, 자동 반복 루프로 품질 보장.

## Core Principles

1. **Generate and evaluate separately** — self-evaluation bias is universal; always run Evaluator as independent Agent
2. **Evaluate against contract, not intuition** — contract.md의 명시적 MUST/SHOULD 기준으로만 PASS/FAIL 판정
3. **Be a skeptical evaluator** — identify legitimate issues, then do NOT talk yourself into approving them. If it fails a criterion, it fails. Period.
4. **Constrain deliverables, not implementation** — Planner는 "무엇을" 결정, Generator는 "어떻게" 결정. 구현 세부사항을 과잉 명세하면 cascading error 발생
5. **Reuse existing infrastructure** — 새 검증 로직 작성 금지. verify-*, review-* 스킬을 orchestrate

## Handoff Files

에이전트 간 통신은 파일 기반. 포맷 상세: [references/handoff-formats.md](references/handoff-formats.md)

| File | Path | Producer → Consumer |
|------|------|---------------------|
| **plan.md** | `.claude/plan.md` | Planner → Generator |
| **contract.md** | `.claude/contract.md` | Planner/Harness → Evaluator |
| **evaluation-report.md** | `.claude/evaluation-report.md` | Evaluator → Generator/User |

---

## Step 1: Determine Mode

Use explicit mode if user specifies (`mode0`, `mode1`, `mode2`). Otherwise, analyze request and auto-select.

| Mode | Condition | Execution |
|------|-----------|-----------|
| **0** (Direct) | ≤3 files, no logic change (i18n, config, typo, docs) | Bypass harness |
| **1** (Lightweight) | 4~15 files, single domain, existing patterns | Generator → Evaluator loop |
| **2** (Full) | 15+ files, DB change, new module, multi-domain | Planner → Generator → Evaluator |

Report determination to user in one line and confirm before proceeding. Mode 0 exits this skill immediately.

---

## Step 2: Run Planner (Mode 2 only)

Mode 1 → skip to Step 3.

Launch Planner Agent with the following directives:

- Read CLAUDE.md for project rules and architecture
- Explore related existing code (similar modules, established patterns)
- **Constrain deliverables without over-specifying implementation** — define WHAT each file should achieve, NOT HOW to code it. Detailed technical specs cause cascading errors when assumptions break.
- Generate `.claude/plan.md` — Phase-based plan with files and verification commands
- Generate `.claude/contract.md` — MUST/SHOULD criteria with domain-specific success criteria
- Present both to user for approval before proceeding

---

## Step 3: Prepare contract.md

- **Mode 2**: Already created by Planner in Step 2. Skip.
- **Mode 1**: Auto-generate lightweight contract from changed file analysis.

Read [references/handoff-formats.md](references/handoff-formats.md) for contract.md schema.

Mode 1 default MUST criteria: `tsc --noEmit` + `build` + `verify-implementation PASS` + `backend test PASS`.

Save to `.claude/contract.md`.

---

## Step 4: Run Generator

Implement code per plan.md (Mode 2) or user request (Mode 1).

**Generator constraints:**
- Follow CLAUDE.md Behavioral Guidelines (minimal code, surgical changes)
- Mode 2: do NOT modify files not listed in plan.md
- Do NOT "improve" adjacent code — implement exactly what is asked
- Run self-check after implementation: `tsc --noEmit`, basic build

Proceed to Step 5 when implementation is complete.

---

## Step 5: Run Evaluator

**CRITICAL: Launch as independent Agent.** Do NOT self-evaluate.

Evaluator Agent prompt must include these directives:

```
You are a skeptical QA agent. Your job is to find problems, not to approve work.

IMPORTANT CALIBRATION:
- When you identify a legitimate issue, do NOT rationalize it away
- Do NOT say "this is minor" or "this is acceptable" for genuine failures
- If a contract criterion fails, mark it FAIL regardless of surrounding quality
- Grade against hard thresholds — partial credit does not exist for MUST criteria

Steps:
1. Read .claude/contract.md for success criteria
2. Run build verification (tsc, build, test as applicable)
3. Run verify-implementation workflow (existing 13 verify-* skills)
4. Run review-architecture (Mode 2 only)
5. Compare each MUST criterion against results → PASS/FAIL
6. Track "이전 반복 ��비 변화" to detect repeated failures
7. Write .claude/evaluation-report.md per handoff format

Do NOT modify any code. Report only.
```

Read [references/handoff-formats.md](references/handoff-formats.md) for evaluation-report.md schema.

### Branch on result

| Result | Action |
|--------|--------|
| **All MUST PASS** | → Step 7 (final report) |
| **FAIL + iteration < 3** | → Step 6 (fix loop) |
| **FAIL + same issue 2x consecutive** | → Step 7 with "design-level issue, manual intervention needed" |
| **FAIL + iteration ≥ 3** | → Step 7 with "max iterations reached, manual intervention needed" |

---

## Step 6: Fix Loop

1. Extract FAIL issues from evaluation-report.md
2. Apply fixes per Evaluator's specific repair instructions
3. Return to Step 5

Track iteration count. Detect same-issue recurrence by comparing current FAIL issues against previous evaluation-report.md entries (match by file path + issue description).

---

## Step 7: Final Report

```
## Harness Result

| Item | Result |
|------|--------|
| Mode | Mode {N} |
| Iterations | {N} |
| Verdict | PASS / FAIL (manual intervention) |
| Changed | {N} files, +{X}/-{Y} lines |

### Contract Status
| Criterion | Verdict |
|-----------|---------|

### Next Step
- PASS → run /git-commit
- FAIL → review evaluation-report.md and fix manually
```

---

## Skill Dependency Map

```
harness (this skill — orchestrator only)
  ├── verify-implementation → 13 verify-* skills (unchanged)
  ├── review-architecture (Mode 2, unchanged)
  ├── review-design (frontend changes, unchanged)
  └── git-commit (post-success, unchanged)
```

## Load-Bearing Analysis

Run with `/harness load-bearing`. Quarterly recommended.

1. List all harness components (Planner, contract, evaluation-report, each verify-*)
2. For each: tally issue detection rate over last 5 harness runs
3. Components with 0% detection rate → "removal candidate"
4. Report each component's encoded assumption and whether it remains valid

## Exceptions

1. **Do NOT force harness on Mode 0 tasks** — overkill for typos and config
2. **Evaluator never modifies code** — report only, Generator fixes
3. **SHOULD criteria failures are NOT loop triggers** — only MUST criteria gate the loop
4. **Test file pattern differences are not issues** — inherit verify-* skill exceptions
