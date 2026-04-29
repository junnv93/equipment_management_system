---
slug: sw-validation-ssot
type: contract
created: 2026-04-21
---

# Contract: sw-validation-ssot

## Scope

7개 파일에서 raw 문자열 리터럴을 SSOT 값 객체로 교체.

## Files Changed

| File | Change |
|------|--------|
| `packages/schemas/src/enums/values.ts` | `ValidationTypeValues` 추가 |
| `ValidationActionsBar.tsx` | 4개 status 리터럴 → `ValidationStatusValues.*` |
| `ValidationDetailContent.tsx` | 1개 status + 2개 type 리터럴 교체 |
| `ValidationEditDialog.tsx` | 1개 type 리터럴 교체 |
| `ValidationCreateDialog.tsx` | 3개 type 리터럴 교체 |
| `wf-35-cas-ui-recovery.spec.ts` | `@playwright/test` → auth.fixture |

## MUST Criteria

- [ ] M1: `tsc --noEmit` (frontend + packages) 에러 0
- [ ] M2: `pnpm --filter frontend run lint` 에러 0  
- [ ] M3: `grep -rn "=== 'draft'\|=== 'submitted'\|=== 'approved'\|=== 'rejected'" apps/frontend --include="*.tsx" | grep -v "spec\|test\|messages/"` → 0건
- [ ] M4: `grep -rn "=== 'vendor'\|=== 'self'" apps/frontend --include="*.tsx" | grep -v "spec\|test"` → 0건
- [ ] M5: `ValidationTypeValues` exported from `@equipment-management/schemas`
- [ ] M6: wf-35 파일의 `@playwright/test` import에서 `test`, `expect`가 제거되고 auth.fixture로 교체됨

## SHOULD Criteria

- [ ] S1: `BrowserContext`, `Page`는 type-only import (`import type`)으로 명시
