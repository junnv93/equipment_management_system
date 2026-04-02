---
name: harness
description: 3-Agent harness orchestrator (Planner → Generator → Evaluator loop). Auto-select execution mode based on task complexity. Reuse existing verify-*/review-* skills as Evaluator infrastructure. Trigger on "하네스", "/harness", "harness mode", or when starting non-trivial multi-file implementation tasks.
argument-hint: '[요청 내용] 또는 [mode0|mode1|mode2|load-bearing|entropy]'
---

# Harness — Generator-Evaluator Orchestrator

OpenAI "Harness Engineering" 패턴 적용.
기존 verify-*, review-* 스킬을 Evaluator로 재사용하며, 자동 반복 루프로 품질 보장.

## Core Principles

1. **Generate and evaluate separately** — self-evaluation bias is universal; always run Evaluator as independent Agent
2. **Evaluate against contract, not intuition** — contract.md의 명시적 MUST/SHOULD 기준으로만 PASS/FAIL 판정
3. **Be a skeptical evaluator** — identify legitimate issues, then do NOT talk yourself into approving them. If it fails a criterion, it fails. Period.
4. **Constrain deliverables, not implementation** — Planner는 "무엇을" 결정, Generator는 "어떻게" 결정. 구현 세부사항을 과잉 명세하면 cascading error 발생
5. **Reuse existing infrastructure** — 새 검증 로직 작성 금지. verify-*, review-* 스킬을 orchestrate
6. **Repository is the record system** — 실행 계획, 완료된 작업, 기술 부채는 모두 `.claude/exec-plans/`에 버전 관리. 외부 채팅/문서에 있는 컨텍스트는 에이전트가 볼 수 없음
7. **Repair cost < waiting cost** — SHOULD 기준 실패는 루프 차단 없이 후속 PR로 처리

## References

- **Handoff formats**: [references/handoff-formats.md](references/handoff-formats.md) — contract/evaluation-report/exec-plan 스키마
- **Example prompts**: [references/example-prompts.md](references/example-prompts.md) — 도메인별 Mode 0/1/2 실전 프롬프트 예시

## Handoff Files

에이전트 간 통신은 파일 기반. 포맷 상세: [references/handoff-formats.md](references/handoff-formats.md)

**Slug 규칙**: 작업 시작 시 kebab-case slug를 결정 (예: `loading-tsx`, `monitoring-cache-stats`).
이 slug를 contract와 evaluation-report 파일명에 사용하여 **다중 세션 동시 실행 시 충돌 방지**.

| File | Path | Producer → Consumer |
|------|------|---------------------|
| **exec-plan** | `.claude/exec-plans/active/YYYY-MM-DD-{slug}.md` | Planner → Generator |
| **contract** | `.claude/contracts/{slug}.md` | Planner/Harness → Evaluator |
| **evaluation-report** | `.claude/evaluations/{slug}.md` | Evaluator → Generator/User |

완료된 계획: `active/` → `completed/`로 이동 (Step 7).
기술 부채 추적: `.claude/exec-plans/tech-debt-tracker.md` (누적 관리).

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
- **Context management**: 실행 계획에 상세 내용을 담되, 에이전트가 필요한 정보에 순차적으로 접근할 수 있도록 구성. 한 파일에 모든 것을 넣지 않는다 — 목차에서 심층 문서로 단계적 진입.
- Generate `.claude/exec-plans/active/YYYY-MM-DD-{slug}.md` — Phase-based plan with files and verification commands. `docs/exec-plans/` 디렉토리가 없으면 자동 생성.
- Generate `.claude/contracts/{slug}.md` — MUST/SHOULD criteria with domain-specific success criteria
- Present both to user for approval before proceeding

---

## Step 3: Prepare contract.md

- **Mode 2**: Already created by Planner in Step 2. Skip.
- **Mode 1**: Auto-generate lightweight contract from changed file analysis.

Read [references/handoff-formats.md](references/handoff-formats.md) for contract.md schema.

Mode 1 default MUST criteria: `tsc --noEmit` + `build` + `verify-implementation PASS` + `backend test PASS`.

Save to `.claude/contracts/{slug}.md`. Create `.claude/contracts/` directory if it doesn't exist.

---

## Step 4: Run Generator

Implement code per exec-plan (Mode 2) or user request (Mode 1).

**Generator constraints:**
- Follow CLAUDE.md Behavioral Guidelines (minimal code, surgical changes)
- Mode 2: do NOT modify files not listed in exec-plan
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
1. Read .claude/contracts/{slug}.md for success criteria
2. Run build verification (tsc, build, test as applicable)
3. Run verify-implementation workflow (existing 13 verify-* skills)
4. Run review-architecture (Mode 2 only)
5. [Frontend changes] Run playwright-e2e for runtime browser verification
   - 변경된 라우트의 렌더링, 인터랙션, 에러 상태를 브라우저에서 직접 확인
   - 정적 검증(tsc)이 잡지 못하는 런타임 동작 검증
6. Compare each MUST criterion against results → PASS/FAIL
7. Track "이전 반복 대비 변화" to detect repeated failures
8. Write .claude/evaluations/{slug}.md per handoff format

Do NOT modify any code. Report only.
```

Read [references/handoff-formats.md](references/handoff-formats.md) for evaluations/{slug}.md schema.

### Branch on result

| Result | Action |
|--------|--------|
| **All MUST PASS** | → Step 7 (final report) |
| **FAIL + iteration < 3** | → Step 6 (fix loop) |
| **FAIL + same issue 2x consecutive** | → Step 7 with "design-level issue, manual intervention needed" |
| **FAIL + iteration ≥ 3** | → Step 7 with "max iterations reached, manual intervention needed" |

**SHOULD 기준 실패는 루프 차단하지 않는다.** evaluations/{slug}.md에 기록하고 Step 7에서 후속 작업으로 분류.

---

## Step 6: Fix Loop

1. Extract FAIL issues from evaluations/{slug}.md
2. Apply fixes per Evaluator's specific repair instructions
3. Return to Step 5

Track iteration count. Detect same-issue recurrence by comparing current FAIL issues against previous evaluations/{slug}.md entries (match by file path + issue description).

---

## Step 7: Final Report

### 7a: 실행 계획 라이프사이클 완료

```bash
# active → completed 이동
mv .claude/exec-plans/active/YYYY-MM-DD-{slug}.md \
   .claude/exec-plans/completed/YYYY-MM-DD-{slug}.md

# SHOULD 실패 항목이 있으면 tech-debt-tracker.md에 추가
# 형식: - [ ] {이슈} — {파일:라인} — {날짜}
```

Mode 1은 plan 파일 없으므로 생략.

### 7b: PR 라이프사이클 (PASS 시)

```
PASS → /git-commit → PR 생성 → 에이전트 리뷰어 할당 권장
```

PR 생성 후 에이전트 리뷰가 가능한 경우(review-architecture, review-design 등):
에이전트 리뷰어가 모두 통과할 때까지 `/harness` 루프를 재진입하지 않고 리뷰 피드백만 처리.
판단이 필요한 경우에만 사용자에게 에스컬레이션.

### 7c: Final Summary

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

### Post-merge Actions
- PASS → /git-commit 실행 후 PR 생성
- SHOULD 실패 항목 → tech-debt-tracker.md 확인
- FAIL → evaluations/{slug}.md 검토 후 수동 수정
- 엔트로피 점검 권장: `/harness entropy` (3회 이상 반복된 경우)
```

---

## Entropy Management (`/harness entropy`)

코드베이스 엔트로피는 에이전트 처리량에 비례해 증가한다.
가비지 컬렉션처럼 조금씩 자주 정리하는 것이 한꺼번에 갚는 것보다 훨씬 낫다.

### 황금 원칙 체크리스트

에이전트가 코드를 생성할 때 반복적으로 위반하는 패턴을 주기적으로 점검:

1. **SSOT 드리프트** — 로컬 재정의된 타입/상수가 있는가? (`verify-ssot`)
2. **하드코딩 확산** — API 경로, 쿼리키, 에러코드가 인라인으로 박혔는가? (`verify-hardcoding`)
3. **레이어 위반** — 아키텍처 경계를 넘는 직접 임포트가 생겼는가? (`review-architecture`)
4. **컨텍스트 비대화** — CLAUDE.md 또는 AGENTS.md가 단일 거대 매뉴얼로 변하고 있는가?
   - 300줄 초과 시: 주제별 `references/` 파일로 분리 권장
5. **죽은 exec-plan** — `active/`에 30일 이상 완료되지 않은 계획이 있는가?

### 실행

`/harness entropy` 호출 시:
1. 위 5개 항목을 순서대로 점검
2. 위반 항목을 `tech-debt-tracker.md`에 기록
3. 자동 수정 가능한 것은 Mode 1 harness로 즉시 처리
4. 설계 판단이 필요한 것은 사용자에게 제시

### 정기 실행 권장

3회 이상 harness를 실행했다면 주기적 entropy 점검을 권장한다.
`/schedule` 스킬로 자동화 가능: 예) 매주 월요일 `/harness entropy`

---

## Load-Bearing Analysis (`/harness load-bearing`)

Quarterly recommended.

1. List all harness components (Planner, contract, evaluation-report, each verify-*)
2. For each: tally issue detection rate over last 5 harness runs
3. Components with 0% detection rate → "removal candidate"
4. Report each component's encoded assumption and whether it remains valid

---

## Skill Dependency Map

```
harness (this skill — orchestrator only)
  ├── verify-implementation → 13 verify-* skills (unchanged)
  ├── review-architecture (Mode 2, unchanged)
  ├── review-design (frontend changes, unchanged)
  ├── playwright-e2e (frontend runtime verification, Step 5)
  └── git-commit (post-success, unchanged)
```

---

## Exceptions

1. **Do NOT force harness on Mode 0 tasks** — overkill for typos and config
2. **Evaluator never modifies code** — report only, Generator fixes
3. **SHOULD criteria failures are NOT loop triggers** — record in tech-debt-tracker, handle in follow-up PR
4. **Test file pattern differences are not issues** — inherit verify-* skill exceptions
5. **Frontend-only changes** — playwright-e2e를 Evaluator 마지막 단계에 추가 (브라우저 없으면 생략)
