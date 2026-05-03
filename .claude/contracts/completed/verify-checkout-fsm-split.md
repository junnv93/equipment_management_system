# Contract: verify-checkout-fsm-split

**Mode**: 2 (Full)
**Domain**: meta-skills (`.claude/skills/verify-checkout-fsm/` mega-skill split)
**Date**: 2026-05-03

## Purpose

Phase 2.3 — verify-checkout-fsm (1754 lines, 52 steps) → orchestrator (~700 lines) + 3 신규 references.

플랜 분류:
- `references/fsm-core.md` — assertFsmInvariants, CheckoutPermissionKey, calculateAvailableActions, FSM 테이블 검증
- `references/scope-identity.md` — checkout-scope, identity-rule, items[0] 패턴, lenderTeam/borrower 검증
- `references/nextstep-progress-ui.md` — NextStepDescriptor, ProgressStep, ActorVariant, hook/UI

## Files in Scope

| 종류 | 경로 |
|---|---|
| 신규 | `.claude/skills/verify-checkout-fsm/references/fsm-core.md` |
| 신규 | `.claude/skills/verify-checkout-fsm/references/scope-identity.md` |
| 신규 | `.claude/skills/verify-checkout-fsm/references/nextstep-progress-ui.md` |
| 수정 | `.claude/skills/verify-checkout-fsm/SKILL.md` (1754 → ~700 lines) |

## MUST Criteria

### M1. 3 신규 references 파일 존재 + ≥50 lines
### M2. SKILL.md ≤800 lines
### M3. 핵심 키워드 보존 (각 ≥1 file 출현):
- `assertFsmInvariants`
- `CheckoutPermissionKey`
- `calculateAvailableActions`
- `lenderTeam` 또는 `identity-rule`
- `firstEquip` 또는 `items\[0\]`
- `NextStepDescriptor`
- `ProgressStepDescriptor`
- `resolveActorVariant`
- `ESCAPE_ACTIONS`
- `revokeApproval`

### M4. SKILL.md 구조: frontmatter + 6 sections + ≥3 references 링크
### M5. 외부 verify-* 직접 참조 0건

## SHOULD Criteria
- 각 references ≤ 1500 lines
- 라인 합 ≈ 원본 ±25%

## Verification Commands

```bash
cd /home/kmjkds/equipment_management_system

echo "=== M1 ==="
for f in fsm-core scope-identity nextstep-progress-ui; do
  test -f .claude/skills/verify-checkout-fsm/references/$f.md && echo "OK: $f.md ($(wc -l < .claude/skills/verify-checkout-fsm/references/$f.md) lines)" || echo "FAIL: $f.md missing"
done

echo "=== M2 SKILL.md lines: $(wc -l < .claude/skills/verify-checkout-fsm/SKILL.md) ==="

echo "=== M3 keywords ==="
for kw in "assertFsmInvariants" "CheckoutPermissionKey" "calculateAvailableActions" "lenderTeam" "firstEquip" "NextStepDescriptor" "ProgressStepDescriptor" "resolveActorVariant" "ESCAPE_ACTIONS" "revokeApproval"; do
  count=$(grep -rl "$kw" .claude/skills/verify-checkout-fsm/ | wc -l)
  echo "$kw: $count files"
done

echo "=== M4 ==="
head -7 .claude/skills/verify-checkout-fsm/SKILL.md
echo "sections: $(grep -c '^## ' .claude/skills/verify-checkout-fsm/SKILL.md)"
echo "references links: $(grep -c 'references/fsm-core\|references/scope-identity\|references/nextstep-progress-ui' .claude/skills/verify-checkout-fsm/SKILL.md)"

echo "=== M5 ==="
grep -rln "verify-checkout-fsm/references" .claude/skills/ | grep -v "verify-checkout-fsm/" || echo "OK: 0 external refs"
```
