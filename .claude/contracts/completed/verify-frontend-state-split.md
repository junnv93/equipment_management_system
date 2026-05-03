# Contract: verify-frontend-state-split

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-frontend-state/` mega-skill split)
**Date**: 2026-05-03

## Purpose

Phase 2.4 — verify-frontend-state (1345 lines, 41 steps) → orchestrator (~600 lines) + 3 신규 references.

플랜 분류:
- `references/tanstack-query-cas.md` — CAS 흡수분(Step 39·40) + setQueryData 금지 + onError snapshot rollback
- `references/dynamic-import-ssr.md` — 동적 import, server-only 경계, sessionStorage TTL
- `references/cache-invalidation.md` — invalidateKeys, prefix-match, *CacheInvalidation 클래스

기존 `step-details.md`는 유지 (호환성).

## Files in Scope

| 종류 | 경로 |
|---|---|
| 신규 | `.claude/skills/verify-frontend-state/references/tanstack-query-cas.md` |
| 신규 | `.claude/skills/verify-frontend-state/references/dynamic-import-ssr.md` |
| 신규 | `.claude/skills/verify-frontend-state/references/cache-invalidation.md` |
| 수정 | `.claude/skills/verify-frontend-state/SKILL.md` (1345 → ~700 lines) |
| 유지 | `.claude/skills/verify-frontend-state/references/step-details.md` |

## MUST Criteria

### M1. 3 신규 references 파일 존재 + ≥50 lines
### M2. SKILL.md ≤800 lines
### M3. 기존 step-details.md 보존
### M4. 핵심 키워드 보존 (≥1 file 출현):
- `useOptimisticMutation`
- `useCasGuardedMutation`
- `setQueryData` (금지 패턴 — 0건 허용 컨텍스트 명시)
- `VERSION_CONFLICT`
- `invalidateKeys`
- `CacheInvalidation`
- `runWithConcurrency`
- `useUndoableState`
- `dynamic\(`
- `sessionStorage`

### M5. SKILL.md 구조: frontmatter + 6 sections + ≥3 references 링크
### M6. 외부 verify-* 직접 참조 0건

## Verification Commands

```bash
cd /home/kmjkds/equipment_management_system

echo "=== M1 ==="
for f in tanstack-query-cas dynamic-import-ssr cache-invalidation; do
  test -f .claude/skills/verify-frontend-state/references/$f.md && echo "OK: $f.md ($(wc -l < .claude/skills/verify-frontend-state/references/$f.md) lines)" || echo "FAIL: $f.md missing"
done

echo "=== M2 SKILL.md lines: $(wc -l < .claude/skills/verify-frontend-state/SKILL.md) ==="

echo "=== M3 ==="
test -f .claude/skills/verify-frontend-state/references/step-details.md && echo "OK: step-details.md preserved" || echo "FAIL"

echo "=== M4 keywords ==="
for kw in "useOptimisticMutation" "useCasGuardedMutation" "VERSION_CONFLICT" "invalidateKeys" "CacheInvalidation" "runWithConcurrency" "useUndoableState" "dynamic(" "sessionStorage"; do
  count=$(grep -rl "$kw" .claude/skills/verify-frontend-state/ | wc -l)
  echo "$kw: $count files"
done

echo "=== M5 ==="
head -7 .claude/skills/verify-frontend-state/SKILL.md
echo "sections: $(grep -c '^## ' .claude/skills/verify-frontend-state/SKILL.md)"
echo "references links: $(grep -c 'references/tanstack-query-cas\|references/dynamic-import-ssr\|references/cache-invalidation' .claude/skills/verify-frontend-state/SKILL.md)"

echo "=== M6 ==="
grep -rln "verify-frontend-state/references" .claude/skills/ | grep -v "verify-frontend-state/" || echo "OK: 0 external refs"
```
