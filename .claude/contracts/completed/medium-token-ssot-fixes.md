---
slug: medium-token-ssot-fixes
type: contract
date: 2026-04-26
sprint: adhoc
sprint_step: adhoc
---

# Contract: Medium Token SSOT Fixes

## Context

3개의 MEDIUM tech-debt 항목 해소:
1. `NCEditDialog.tsx` — `form-field-tokens` 직접 서브패스 import → barrel index.ts 경유
2. `non-conformance.ts:96` — `dark:` prefix CSS 변수 자동 전환 체계 위반 제거
3. `checkout-descriptor-phase-fields.md` M2·M13 — "208 entry" 하드코딩 → 동적 참조 교체

항목 3(overdueClear icon), 4(aria-label "건")는 이미 처리됨 — 이번 계약 범위 외.

---

## Scope

### 수정 대상
- `apps/frontend/lib/design-tokens/index.ts` — form-field-tokens barrel re-export 섹션 추가
- `apps/frontend/components/non-conformances/NCEditDialog.tsx:10` — 직접 서브패스 import → barrel import
- `apps/frontend/lib/design-tokens/components/non-conformance.ts:96` — dark: prefix 2개 클래스 제거
- `.claude/contracts/checkout-descriptor-phase-fields.md` — M2·M13 "208 entry" → `EXPECTED_ENTRY_COUNT` 동적 참조

### 수정 금지
- NCEditDialog.tsx 10번 줄 이외 로직 변경 금지
- form-field-tokens.ts 내부 로직 변경 금지
- non-conformance.ts:96 이외 다른 토큰 변경 금지

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` exit 0 | tsc 통과 |
| M2 | `NCEditDialog.tsx:10`에 `form-field-tokens` 직접 경로 import 없음 | `grep "from '@/lib/design-tokens/form-field-tokens'" apps/frontend/components/non-conformances/NCEditDialog.tsx` = 0 hit |
| M3 | `@/lib/design-tokens` 배럴에서 `REQUIRED_FIELD_TOKENS`, `REQUIRED_FIELD_A11Y` export 확인 | `grep "REQUIRED_FIELD_TOKENS\|REQUIRED_FIELD_A11Y" apps/frontend/lib/design-tokens/index.ts` = 1+ hit |
| M4 | `non-conformance.ts` statusAlert에 `dark:` prefix 없음 | `grep "dark:" apps/frontend/lib/design-tokens/components/non-conformance.ts` = 0 hit |
| M5 | contract M2·M13에 "208" 숫자 없음 | `grep "208" .claude/contracts/checkout-descriptor-phase-fields.md` = 0 hit |
| M6 | contract M2·M13가 `EXPECTED_ENTRY_COUNT` 또는 `TOTAL_STATUSES × TOTAL_PURPOSES × TOTAL_ROLES` 동적 참조 언급 | grep 확인 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `index.ts` form-field-tokens 섹션에 "Layer 2: Form Field" 주석 추가 | `form-field-barrel-comment` |

---

## Verification Commands

```bash
# M1
pnpm --filter frontend run tsc --noEmit

# M2 - 0 hit 기대
grep "from '@/lib/design-tokens/form-field-tokens'" apps/frontend/components/non-conformances/NCEditDialog.tsx

# M3 - 1+ hit 기대
grep "REQUIRED_FIELD_TOKENS\|REQUIRED_FIELD_A11Y" apps/frontend/lib/design-tokens/index.ts

# M4 - 0 hit 기대
grep "dark:" apps/frontend/lib/design-tokens/components/non-conformance.ts

# M5 - 0 hit 기대
grep "208" .claude/contracts/checkout-descriptor-phase-fields.md
```
