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

**항상 수행** (scan 없이 review/정리만 할 때도 포함):

example-prompts.md에서 제거 대상:
- ~~Strikethrough~~ + ✅ 항목 (merged PR 또는 완료 확인)
- tech-debt-tracker.md `closure` 언급 항목 (grep으로 교차 확인)
- 섹션 헤더의 모든 하위 항목이 완료된 섹션
- 활성 프롬프트 0건인 background-only 섹션 헤더

아카이브 대상 파일 (도메인별):
- `archive-domain.md` — 장비/검출/교정/반출/팀/SW 도메인 기능
- `archive-design.md` — UI/UX 디자인 개선 (반출입 페이지, 컴포넌트 redesign)
- `archive-infra.md` — CI/CD, 테스트 인프라, E2E 설정
- `archive-export.md` — 양식 export, DOCX 생성

False positives → `archive-domain.md` 하단 False Positive 섹션에 이유와 함께 기록.

### 6. Update example-prompts.md

Write final prompts to `.claude/skills/harness/references/example-prompts.md`:
- 헤더 날짜(`마지막 정리일`) 업데이트
- 신규 항목을 우선순위 섹션에 추가
- 완료/false-positive → 해당 archive-*.md 로 이동
- 완료된 모든 strikethrough 제거 (빈 sprint 헤더 포함)

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
