# Contract: verify-e2e-split

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-e2e/` mega-skill split)
**Date**: 2026-05-03

## Purpose

Phase 2.5 — verify-e2e (1255 lines, 34 steps) → orchestrator (~600 lines) + 2 신규 references.

플랜 분류:
- `references/auth-fixtures.md` — TestRole 4-place SSOT, fixture 권한 격리, scope spec actor (Step 23·24·25 — pnpm verify:e2e-actors 자동화 참조)
- `references/locator-patterns.md` — value-based selector, helper SSOT, ARIA 셀렉터

기존 유지:
- `references/workflows-coverage.md` — Phase 1.2에서 verify-workflows 흡수 시 작성됨
- `references/step-details.md` — 기존 위임 패턴

## Files in Scope

| 종류 | 경로 |
|---|---|
| 신규 | `.claude/skills/verify-e2e/references/auth-fixtures.md` |
| 신규 | `.claude/skills/verify-e2e/references/locator-patterns.md` |
| 수정 | `.claude/skills/verify-e2e/SKILL.md` (1255 → ~700 lines) |
| 유지 | `.claude/skills/verify-e2e/references/workflows-coverage.md` |
| 유지 | `.claude/skills/verify-e2e/references/step-details.md` |

## MUST Criteria

### M1. 2 신규 references 파일 존재 + ≥50 lines
### M2. SKILL.md ≤800 lines
### M3. 기존 references 보존:
- `workflows-coverage.md` 존재
- `step-details.md` 존재

### M4. 핵심 키워드 보존 (≥1 file 출현):
- `TestRole`
- `loginAs`
- `system_admin\|systemAdmin`
- `verify:e2e-actors`
- `value-based selector\|input\[value=\|fillForm`
- `WF-01\|WF-16` (workflows-coverage.md 보존 검증)
- `storageState`

### M5. SKILL.md 구조: frontmatter + 6 sections + ≥2 references 링크 (auth-fixtures, locator-patterns)
### M6. 외부 verify-* 직접 참조 0건

## Verification Commands

```bash
cd /home/kmjkds/equipment_management_system

echo "=== M1 ==="
for f in auth-fixtures locator-patterns; do
  test -f .claude/skills/verify-e2e/references/$f.md && echo "OK: $f.md ($(wc -l < .claude/skills/verify-e2e/references/$f.md) lines)" || echo "FAIL: $f.md missing"
done

echo "=== M2 SKILL.md lines: $(wc -l < .claude/skills/verify-e2e/SKILL.md) ==="

echo "=== M3 ==="
test -f .claude/skills/verify-e2e/references/workflows-coverage.md && echo "OK: workflows-coverage.md preserved" || echo "FAIL"
test -f .claude/skills/verify-e2e/references/step-details.md && echo "OK: step-details.md preserved" || echo "FAIL"

echo "=== M4 keywords ==="
for kw in "TestRole" "loginAs" "system_admin\|systemAdmin" "verify:e2e-actors" "WF-01" "storageState"; do
  count=$(grep -rl "$kw" .claude/skills/verify-e2e/ | wc -l)
  echo "$kw: $count files"
done

echo "=== M5 ==="
head -7 .claude/skills/verify-e2e/SKILL.md
echo "sections: $(grep -c '^## ' .claude/skills/verify-e2e/SKILL.md)"
echo "references links: $(grep -c 'references/auth-fixtures\|references/locator-patterns' .claude/skills/verify-e2e/SKILL.md)"

echo "=== M6 ==="
grep -rln "verify-e2e/references" .claude/skills/ | grep -v "verify-e2e/" || echo "OK: 0 external refs"
```
