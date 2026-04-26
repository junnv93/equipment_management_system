---
slug: session-verify-design-tokens
type: contract
date: 2026-04-26
sprint: adhoc
---

# Contract: Session Verify — Design Token SSOT + dark: prefix 전수 제거

## Scope (이번 세션 변경 파일만)

- `apps/frontend/lib/design-tokens/index.ts`
- `apps/frontend/lib/design-tokens/components/non-conformance.ts`
- `apps/frontend/lib/design-tokens/components/equipment.ts`
- `apps/frontend/lib/design-tokens/components/document.ts`
- `apps/frontend/lib/design-tokens/components/calibration.ts`
- `apps/frontend/lib/design-tokens/components/form-templates.ts`
- `apps/frontend/components/non-conformances/NCEditDialog.tsx`
- `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts`

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` (frontend) exit 0 | tsc |
| M2 | `design-tokens/index.ts`에 `REQUIRED_FIELD_TOKENS`, `REQUIRED_FIELD_A11Y` barrel re-export 존재 | grep |
| M3 | `NCEditDialog.tsx`에 서브패스 직접 import 없음 (`@/lib/design-tokens/form-field-tokens`) | grep 0 hit |
| M4 | 변경된 design-token 파일 6개에서 `dark:brand-*` 패턴 없음 | grep 0 hit |
| M5 | `checkout-fsm.table.test.ts` describe 문자열에 하드코딩 숫자 없음 (`EXPECTED_ENTRY_COUNT` template literal 사용) | grep |
| M6 | verify-design-tokens PASS (design-token 레이어 규칙 검증) | skill |
| M7 | verify-ssot PASS (NCEditDialog barrel 경유 확인) | skill |

## Verification Commands

```bash
# M1
cd apps/frontend && pnpm tsc --noEmit 2>&1 | tail -3

# M2
grep "REQUIRED_FIELD_TOKENS\|REQUIRED_FIELD_A11Y" apps/frontend/lib/design-tokens/index.ts

# M3 (0 hit 기대)
grep "from '@/lib/design-tokens/form-field-tokens'" apps/frontend/components/non-conformances/NCEditDialog.tsx

# M4 (0 hit 기대) — 변경된 6개 파일 대상
grep -n "dark:.*brand-" \
  apps/frontend/lib/design-tokens/components/non-conformance.ts \
  apps/frontend/lib/design-tokens/components/equipment.ts \
  apps/frontend/lib/design-tokens/components/document.ts \
  apps/frontend/lib/design-tokens/components/calibration.ts \
  apps/frontend/lib/design-tokens/components/form-templates.ts \
  apps/frontend/lib/design-tokens/index.ts

# M5
grep "EXPECTED_ENTRY_COUNT\|all.*combinations" packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts
```
