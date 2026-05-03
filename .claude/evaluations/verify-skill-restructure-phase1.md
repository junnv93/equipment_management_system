# Evaluation: verify-skill-restructure-phase1

**Date**: 2026-05-03
**Evaluator**: sonnet (independent agent)
**Iteration**: 1

---

## MUST Criteria

### M1. 스킬 디렉토리 정합성

- **Verdict**: FAIL
- **Evidence**:
  ```
  verify-* count: 20
  (contract M1 criterion says: 19)

  Deleted dirs: OK (verify-cas, verify-workflows, verify-qr-ssot, verify-handover-security all absent)
  Created: OK (verify-handover-qr/SKILL.md exists)
  ```
- **Issues**:
  - `ls .claude/skills/ | grep -c '^verify-'` = **20**, not 19 as the contract requires.
  - Root cause: `verify-bulk-action-bar/` exists as a directory and was always outside the tracked skill set (not in verify-implementation table, not in skills-index.md, not in CLAUDE.md Verify skills list). The contract's `Purpose` heading also mis-states the starting count as "23" when `git show HEAD:CLAUDE.md` shows "Verify skills (22)" before restructure — i.e., `verify-bulk-action-bar` was never counted in the tracked set.
  - The correct starting tracked count was 22. The net change (22 - 4 deleted + 1 created = 19) is correct for the **tracked** set. The contract M1 shell command `grep -c '^verify-'` counts ALL filesystem directories including `verify-bulk-action-bar`, which was always an "extra" unregistered directory.
  - **The contract criterion is literally unmet**: the shell command returns 20, not 19. Per Evaluator calibration rules, no rationalization — this is a FAIL.

---

### M2. CAS 키워드 흡수 검증

- **Verdict**: PASS
- **Evidence**:
  ```bash
  grep -l "VERSION_CONFLICT|casVersion|VersionedBaseService" \
    .claude/skills/verify-zod/SKILL.md \
    .claude/skills/verify-zod/references/cas-checks.md
  # → both files matched

  grep -l "VersionedBaseService|onVersionConflict" \
    .claude/skills/verify-zod/references/cas-checks.md
  # → matched

  grep -l "useCasGuardedMutation|VERSION_CONFLICT" \
    .claude/skills/verify-frontend-state/SKILL.md \
    .claude/skills/verify-frontend-state/references/step-details.md
  # → .claude/skills/verify-frontend-state/SKILL.md (SKILL.md matched)
  ```
- **Issues**: `references/step-details.md` does NOT contain the CAS keywords (0 matches). The contract command `grep -l` across both files returns a match because SKILL.md matches — `grep -l` returns files that match (not "both must match"). So the literal contract command `→ 매치` is satisfied. No blocking issue. Note: Step 39/40 CAS content lives entirely in SKILL.md, not delegated to step-details.md — see S2 for the non-blocking gap.

---

### M3. Workflows 키워드 흡수 검증

- **Verdict**: PASS
- **Evidence**:
  ```bash
  test -f .claude/skills/verify-e2e/references/workflows-coverage.md
  # → OK: workflows-coverage.md exists

  grep -l "WF-01|WF-16|WF-35|workflows-coverage" \
    .claude/skills/verify-e2e/SKILL.md \
    .claude/skills/verify-e2e/references/workflows-coverage.md
  # → both files matched

  grep -c "WF-35" verify-e2e/SKILL.md verify-e2e/references/workflows-coverage.md
  # → SKILL.md:2, workflows-coverage.md:1
  ```
- **Issues**: None.

---

### M4. QR + Handover 통합 검증

- **Verdict**: PASS
- **Evidence**:
  ```bash
  grep -c "QR_ACTION_VALUES|QR_URL|qr-config" verify-handover-qr/SKILL.md
  # → 15  (≥1 required)

  grep -c "jti|OneTimeToken|handover" verify-handover-qr/SKILL.md
  # → 38  (≥2 required)

  grep "^## " verify-handover-qr/SKILL.md
  # → ## Section A — QR SSOT Workflow (Step 1~11)
  # → ## Section B — Handover/OneTimeToken 보안 Workflow (Step 12~18)
  # → (+ ## Purpose, ## When to Run, etc.)
  ```
- **Issues**: None. Both sub-domain sections clearly identified.

---

### M5. verify-implementation 테이블 19행

- **Verdict**: PASS
- **Evidence**:
  ```bash
  grep -c "^| [0-9]" .claude/skills/verify-implementation/SKILL.md
  # → 19  (required: 19)

  grep -cE "^\| [0-9]+\s*\| .verify-(cas|workflows|qr-ssot|handover-security)." SKILL.md
  # → 0  (required: 0)

  grep -cE "^\| [0-9]+\s*\| .verify-handover-qr." SKILL.md
  # → 1  (required: 1)
  ```
- **Issues**: None. Table has exactly 19 rows, removed slugs absent, handover-qr present.

---

### M6. 참조 파일 동기화

- **Verdict**: PASS
- **Evidence**:
  ```bash
  grep -cE "^- \*\*verify-(cas|workflows|qr-ssot|handover-security)\*\*" docs/references/skills-index.md
  # → 0  (required: 0)

  grep -cE "^- \*\*verify-handover-qr\*\*" docs/references/skills-index.md
  # → 1  (required: ≥1)

  grep "Verify skills" CLAUDE.md
  # → - **Verify skills (19)**: verify-auth / -zod / ... / -handover-qr / ...
  #   (2026-05-03 통합: verify-cas → verify-zod Step 19 + verify-frontend-state Step 39·40 / verify-workflows → verify-e2e Step 28 / verify-qr-ssot + verify-handover-security → verify-handover-qr)
  # → "Verify skills (19)" present ✓
  # → Inline list does NOT contain -cas / -workflows / -qr-ssot / -handover-security ✓
  # → Contains -handover-qr ✓

  grep -cE "^\| .verify-(cas|workflows|qr-ssot|handover-security)." .claude/skills/manage-skills/SKILL.md
  # → 0  (required: 0)

  grep -cE "^\| .verify-handover-qr." .claude/skills/manage-skills/SKILL.md
  # → 1  (required: 1)
  ```
- **Issues**: None. All six sub-criteria pass.

---

### M7. SKILL.md 무결성

- **Verdict**: PASS
- **Evidence**:
  ```
  verify-handover-qr/SKILL.md frontmatter:
  ---
  name: verify-handover-qr
  description: QR + Handover 통합 검증 — QR URL/설정/액션 SSOT(qr-url.ts, qr-config.ts, qr-access.ts) 경유 + Handover/OneTimeToken 보안(시크릿 분리, jti nonce 소비, TTL, 권한 가드, 토큰 영속화 금지). 반출 QR 또는 토큰 기능 추가·수정 후 사용. (2026-05-03 verify-qr-ssot + verify-handover-security 통합)
  disable-model-invocation: true
  argument-hint: '[선택사항: qr | handover | 특정 step 번호]'
  ---

  name = "verify-handover-qr" ✓
  description length = 349 chars (≥50 required) ✓
  Both sub-domains mentioned in description ✓

  All other modified SKILL.md files (verify-zod, verify-frontend-state, verify-e2e, verify-implementation)
  have valid --- frontmatter with name/description ✓
  ```
- **Issues**: None.

---

## SHOULD Criteria

### S1. 라인 수 감축

- **Verdict**: DOES NOT MEET plan expectations (non-blocking)
- **Evidence**:
  ```
  Deleted: verify-cas(150) + verify-workflows(203) + verify-qr-ssot(246) + verify-handover-security(152) = 751 lines

  Added:
    verify-handover-qr/SKILL.md:         384 lines
    verify-zod/references/cas-checks.md: 201 lines

  Modified (net delta):
    verify-zod/SKILL.md:           +49 (890 → 939)
    verify-frontend-state/SKILL.md: +82 (1337 → 1419)
    verify-e2e/SKILL.md:           +32 (1223 → 1255)

  Net: -751 + 384 + 201 + 49 + 82 + 32 = -3 lines
  ```
- **Issues**: The contract S1 stated "~550 감축" (conservative) and the plan header claimed "~1,700 감축". Actual net change is approximately **-3 lines** — essentially flat. The absorbed content from 4 deleted skills was fully re-expanded in the absorbing skills rather than being compressed. This is a reporting finding only and does not block iteration.

---

### S2. references 위임 패턴 일관성

- **Verdict**: PARTIAL — non-blocking gap found
- **Evidence**:
  - verify-zod: CAS content (Step 19) has `→ 상세 체크: [references/cas-checks.md](references/cas-checks.md)` delegation at end of SKILL.md. PASS pattern.
  - verify-e2e: workflows content (Step 28) delegates to `[references/workflows-coverage.md](references/workflows-coverage.md)`. PASS pattern.
  - verify-frontend-state: Steps 39 and 40 have **full bash + code block content inline in SKILL.md** but are NOT delegated to `references/step-details.md`. The step-details.md file has 0 references to useCasGuardedMutation, VERSION_CONFLICT, Step 39, or Step 40. The other absorbed skills (verify-zod, verify-e2e) do delegate to references/ files; this one does not follow the same pattern.
- **Issues**: Steps 39/40 CAS content is embedded directly in SKILL.md (adds 82 lines). step-details.md was not updated to include these steps. The pattern is inconsistent with the other two absorbed domains. Tech-debt worthy but non-blocking.

---

### S3. CLAUDE.md 메모 SSOT

- **Verdict**: PASS
- **Evidence**:
  - CLAUDE.md Verify skills list: updated to (19) with handover-qr included. No deleted slug in inline list.
  - user MEMORY.md: Zero references to verify-cas, verify-workflows, verify-qr-ssot, or verify-handover-security (grep returned 0).
  - CLAUDE.md references verify-zod Step 16/18, verify-ssot Step 58, verify-e2e Step 23/24/25 — all reference surviving skills. No deleted skill citations found.
- **Issues**: None.

---

## Final Verdict

- **All MUST PASS**: NO (M1 fails)
- **Iteration outcome**: FAIL

### Repair instructions for Generator

**M1 Fix (required for iter 2):**

The contract M1 criterion specifies `ls .claude/skills/ | grep -c '^verify-'` = 19, but the actual filesystem count is 20 because `verify-bulk-action-bar/` exists as an unregistered directory that was always outside the tracked verify-* skill set. Two valid repair paths:

**Option A (Recommended):** Register `verify-bulk-action-bar` into the tracked system. Add it to:
1. `verify-implementation/SKILL.md` table (as row 20, or squeeze into appropriate position with renumbering)
2. `docs/references/skills-index.md` bullet list
3. `CLAUDE.md` Verify skills count updated from (19) → (20)
4. `.claude/skills/manage-skills/SKILL.md` matrix row
This makes the logical count match the directory count at 20. Then update the contract M1 criterion to expect 20 (contract bug correction). Note: this option adds scope.

**Option B (Minimal):** If the intent is strictly to not register `verify-bulk-action-bar`, amend the contract M1 criterion to exclude it from the count: `ls .claude/skills/ | grep -c '^verify-' | awk '{print $1-1}'` or use a specific exclusion pattern. Also correct the contract `Purpose` heading from "23 → 19" to "22 → 19" (the git-verified starting count was 22, not 23).

**Option C (Simplest):** Delete `verify-bulk-action-bar/SKILL.md` and directory since it is unregistered in all tracking files. Verify no references to it exist before deletion.

**S2 Tech-debt (non-blocking, register for future sprint):**
`verify-frontend-state/references/step-details.md` was not updated with Step 39/40 content. The CAS steps (39, 40) exist only inline in SKILL.md with no references/ delegation, inconsistent with the pattern used for verify-zod (cas-checks.md) and verify-e2e (workflows-coverage.md). Register as tech-debt: "verify-frontend-state step-details.md missing Step 39/40 CAS content".

---

## Iteration 2

**Date**: 2026-05-03
**Trigger**: iter 1 M1 FAIL → contract M1 updated (expected count 19 → 20) + `verify-bulk-action-bar` registered in CLAUDE.md / skills-index.md / manage-skills

### Changes since iter 1

- Contract M1 expected `verify-*` count: 19 → 20 (correct arithmetic: 23 - 4 deleted + 1 new = 20, or more precisely 22 tracked + unregistered bulk-action-bar = 23 total, then -4+1 = 20)
- `CLAUDE.md` "Verify skills (19)" → "Verify skills (20)" + `-bulk-action-bar` added to inline list
- `docs/references/skills-index.md`: `- **verify-bulk-action-bar**` bullet added
- `.claude/skills/manage-skills/SKILL.md`: `| \`verify-bulk-action-bar\`` row added with full description
- `tech-debt-tracker.md`: 4 follow-up LOW entries registered (verify-implementation orphan registration, frontend-state cas step-details, Phase 2 mega-skill split, Phase 3 ts-morph)

### MUST Criteria (re-evaluation)

| Criterion | iter 1 | iter 2 | Verdict |
|-----------|--------|--------|---------|
| M1. 디렉토리 정합성 | FAIL | PASS | PASS |
| M2. CAS 흡수 | PASS | PASS | PASS |
| M3. Workflows 흡수 | PASS | PASS | PASS |
| M4. QR + Handover 통합 | PASS | PASS | PASS |
| M5. verify-implementation 19행 | PASS | PASS | PASS |
| M6. 참조 파일 동기화 | PASS | PASS* | PASS* |
| M7. SKILL.md 무결성 | PASS | PASS | PASS |

### M1 Detail (iter 2)

```
OK: verify-cas removed
OK: verify-workflows removed
OK: verify-qr-ssot removed
OK: verify-handover-security removed
OK: verify-handover-qr exists
verify-* count: 20  ← contract now expects 20 ✓
```

All sub-criteria pass. Directory count = 20 matches updated contract expectation.

### M6 Detail (iter 2) — contract text stale note

Contract M6 line 70 still reads: `CLAUDE.md`에 "Verify skills (19)" 표기` (stale — was not updated when M1 was corrected to expect 20). The literal `grep "^- \*\*Verify skills (19)" CLAUDE.md` returns **no match** because CLAUDE.md was correctly updated to "(20)" as part of the M1 fix.

**Ruling: PASS (intent met, contract text is stale)**. Rationale:
- The M1 fix explicitly required CLAUDE.md count → (20), which was done.
- The substance of M6 is fully satisfied: removed 4 slugs absent from inline list (0 hits), `-handover-qr` present (1 hit), `-bulk-action-bar` present (1 hit), manage-skills rows correct (0 removed + 1 handover-qr + 1 bulk-action-bar), skills-index bullets correct.
- The "(19)" in M6 contract text is a residual copy from before M1 was corrected — not a separate independent requirement.
- Blocking on stale contract text while the actual system state is correct would be a false FAIL.

Evidence:
```
skills-index bullet header removed: 0   (required: 0) ✓
skills-index handover-qr bullet: 1      (required: ≥1) ✓
skills-index bulk-action-bar bullet: 1  (iter 2 new) ✓
CLAUDE.md: "Verify skills (20)" with -handover-qr / -bulk-action-bar in list ✓
  Inline list (pre-history portion) — removed slugs: 0 ✓
  Inline list -handover-qr: 1 ✓
  Inline list -bulk-action-bar: 1 ✓
manage-skills row removed: 0            (required: 0) ✓
manage-skills handover-qr row: 1        (required: 1) ✓
manage-skills bulk-action-bar row: 1    (iter 2 new) ✓
```

### SHOULD Criteria (iter 2 unchanged)

| Criterion | iter 1 | iter 2 | Note |
|-----------|--------|--------|------|
| S1. 라인 수 감축 | DOES NOT MEET | DOES NOT MEET | Non-blocking. Net change ~-3 lines (absorbed content fully re-expanded). |
| S2. references 위임 패턴 | PARTIAL | PARTIAL | Non-blocking. verify-frontend-state Step 39/40 still inline. Tech-debt registered in tech-debt-tracker.md. |
| S3. CLAUDE.md 메모 SSOT | PASS | PASS | No deleted slug references in MEMORY.md or CLAUDE.md surviving skill citations. |

### Final iter 2 verdict

- **All MUST PASS**: YES (M1–M7 all PASS)
- **Iteration outcome**: PASS
- **Harness loop**: CLOSES — Phase 1 complete
- **Outstanding tech-debt** (non-blocking, registered in tech-debt-tracker.md):
  1. `verify-implementation/SKILL.md` table: `verify-bulk-action-bar` / `verify-click-feedback` / `verify-routing-origin` 3 orphans not yet in table (orphan batch sprint)
  2. `verify-frontend-state/references/step-details.md`: Step 39/40 CAS content not delegated (pattern inconsistency)
  3. Phase 2: mega-skill references split (verify-design-tokens/ssot/checkout-fsm/frontend-state/e2e)
  4. Phase 3: ts-morph verify-design-tokens static analysis script
