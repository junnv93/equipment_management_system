# Contract: verify-ssot-split

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-ssot/` mega-skill split)
**Date**: 2026-05-03

## Purpose

Phase 2.2 — verify-ssot (2200 lines, 50 steps) → orchestrator (~800 lines) + 4 신규 references/<sub-domain>.md.

플랜 분류:
- `references/permissions-roles.md` — Permission SSOT, RolePermissionMatrix
- `references/domain-status-literals.md` — status enum 리터럴, switch+assertNever
- `references/threshold-numbers.md` — 임계값/매직넘버 SSOT
- `references/record-satisfies.md` — `Record<EnumKey, ...>` exhaustive

기존 `ssot-checks.md` / `ssot-file-map.md`는 **유지**.

## Files in Scope

| 종류 | 경로 |
|---|---|
| 신규 | `.claude/skills/verify-ssot/references/permissions-roles.md` |
| 신규 | `.claude/skills/verify-ssot/references/domain-status-literals.md` |
| 신규 | `.claude/skills/verify-ssot/references/threshold-numbers.md` |
| 신규 | `.claude/skills/verify-ssot/references/record-satisfies.md` |
| 수정 | `.claude/skills/verify-ssot/SKILL.md` (2200 → ~800 lines) |
| 유지 | `.claude/skills/verify-ssot/references/ssot-checks.md` |
| 유지 | `.claude/skills/verify-ssot/references/ssot-file-map.md` |

## MUST Criteria

### M1. references/ 4 신규 파일 존재 + 비어있지 않음
- `test -f` × 4 (permissions-roles, domain-status-literals, threshold-numbers, record-satisfies)
- 각 파일 lines ≥ 50

### M2. SKILL.md 라인 수 압축
- `wc -l .claude/skills/verify-ssot/SKILL.md` ≤ 900 lines

### M3. 기존 references 보존
- `test -f .claude/skills/verify-ssot/references/ssot-checks.md` 존재
- `test -f .claude/skills/verify-ssot/references/ssot-file-map.md` 존재

### M4. 핵심 SSOT 키워드 보존
- `RolePermissionMatrix` ≥1 hit (permissions-roles.md 또는 SKILL.md)
- `UnifiedApprovalStatus` ≥1 hit
- `LENDER_APPROVAL_PENDING_STATUSES` ≥1 hit
- `dashboard-thresholds\|checkout-thresholds` ≥1 hit
- `EXTENDED_TEXT_MAX_LENGTH` ≥1 hit
- `assertNever` ≥1 hit
- `as const satisfies Record` ≥1 hit
- `useEffectiveRole` ≥1 hit
- `CheckoutDirectionValues` ≥1 hit

### M5. SKILL.md frontmatter + 구조 무결성
- frontmatter `name: verify-ssot` 유지
- `## Purpose`, `## When to Run`, `## Related Files`, `## Workflow`, `## Output Format`, `## Exceptions` 모두 존재
- 4개 references 링크가 SKILL.md에 출현 (≥4)

### M6. 외부 verify-* 스킬에서 verify-ssot/references 직접 참조 0건

## SHOULD Criteria (비차단)

### S1. 각 references 파일 ≤ 1500 lines
### S2. 정보 손실 ≈0 (라인 합 ≈ 원본 ±25%)
### S3. Step 번호/제목 보존

## Verification Commands

```bash
cd /home/kmjkds/equipment_management_system

# M1
echo "=== M1 ==="
for f in permissions-roles domain-status-literals threshold-numbers record-satisfies; do
  test -f .claude/skills/verify-ssot/references/$f.md && echo "OK: $f.md ($(wc -l < .claude/skills/verify-ssot/references/$f.md) lines)" || echo "FAIL: $f.md missing"
done

# M2
echo "=== M2 SKILL.md lines: $(wc -l < .claude/skills/verify-ssot/SKILL.md) ==="

# M3
echo "=== M3 ==="
test -f .claude/skills/verify-ssot/references/ssot-checks.md && echo "OK: ssot-checks.md preserved" || echo "FAIL"
test -f .claude/skills/verify-ssot/references/ssot-file-map.md && echo "OK: ssot-file-map.md preserved" || echo "FAIL"

# M4
echo "=== M4 keywords ==="
for kw in "RolePermissionMatrix" "UnifiedApprovalStatus" "LENDER_APPROVAL_PENDING_STATUSES" "dashboard-thresholds\|checkout-thresholds" "EXTENDED_TEXT_MAX_LENGTH" "assertNever" "as const satisfies Record" "useEffectiveRole" "CheckoutDirectionValues"; do
  count=$(grep -rl "$kw" .claude/skills/verify-ssot/ | wc -l)
  echo "$kw: $count files"
done

# M5
echo "=== M5 ==="
head -5 .claude/skills/verify-ssot/SKILL.md
grep -c "^## " .claude/skills/verify-ssot/SKILL.md
echo "references links: $(grep -c "references/permissions-roles\|references/domain-status-literals\|references/threshold-numbers\|references/record-satisfies" .claude/skills/verify-ssot/SKILL.md)"

# M6
echo "=== M6 ==="
grep -rln "verify-ssot/references" .claude/skills/ | grep -v "verify-ssot/" || echo "OK: 0 external references"
```
