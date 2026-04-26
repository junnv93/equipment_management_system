---
slug: session-verify-design-tokens
iteration: 2
date: 2026-04-26
---
# Evaluation Report

## Summary

**PASS** — Iteration 1의 M4/M6 FAIL 원인이었던 `equipment.ts:389` `dark:data-[state=active]:bg-brand-info`는 업데이트된 Step 21 예외 조항(`data-[state=*]:bg-ul-*` + `dark:data-[state=*]:bg-brand-*` 페어링 명시)에 의해 **합법적 예외로 판정**. 동일 파일 L92 `'text-ul-midnight dark:text-brand-info'`도 동일 예외에 해당. M1~M5 전체 PASS, M6(verify-design-tokens Step 21) PASS, M7(verify-ssot NCEditDialog) PASS. Step 13 Dead Token 4건은 INFO 수준(FAIL 임계 5개 미달)으로 유지.

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | `pnpm tsc --noEmit` (frontend) exit 0 | **PASS** | exit code 0, 에러 0건 (`grep -c "error TS"` → 0) |
| M2 | `design-tokens/index.ts`에 `REQUIRED_FIELD_TOKENS`, `REQUIRED_FIELD_A11Y` barrel re-export 존재 | **PASS** | `export { REQUIRED_FIELD_TOKENS, REQUIRED_FIELD_A11Y } from './form-field-tokens';` 확인 |
| M3 | `NCEditDialog.tsx`에 서브패스 직접 import 없음 | **PASS** | grep 0 hit. L15: `from '@/lib/design-tokens'` 배럴 경유 확인 |
| M4 | 변경된 design-token 파일 6개에서 `dark:brand-*` 패턴 — ul-* 비페어링 건 없음 | **PASS** | equipment.ts 2건 모두 ul-midnight 페어링 예외 (L92, L389). 상세 아래 참조 |
| M5 | `checkout-fsm.table.test.ts` describe에 `EXPECTED_ENTRY_COUNT` template literal 사용 | **PASS** | L26 상수 정의, L33/L86 template literal `${EXPECTED_ENTRY_COUNT}` 사용 확인 |
| M6 | verify-design-tokens PASS | **PASS** | Step 21 예외 조항 업데이트로 L389 합법화. Step 13 Dead Token 4건 INFO 수준 |
| M7 | verify-ssot PASS (NCEditDialog barrel 경유 확인) | **PASS** | `REQUIRED_FIELD_TOKENS`, `REQUIRED_FIELD_A11Y`, `CONFIRM_PREVIEW_TOKENS`, `NC_DIALOG_TOKENS` 모두 `@/lib/design-tokens` 배럴 경유. 로컬 enum/타입 재정의 없음 |

---

## Skill Results

| Skill | Target | Result | Issues |
|-------|--------|--------|--------|
| verify-design-tokens | `apps/frontend/lib/design-tokens/` (6개 변경 파일) | **PASS** | Step 13: Dead Token 4개 (INFO, FAIL 임계 미달) |
| verify-ssot | `apps/frontend/components/non-conformances/NCEditDialog.tsx` | **PASS** | 배럴 import 경유 확인, SSOT 위반 없음 |

---

## M4 상세 분석 — equipment.ts `dark:brand-*` 2건

### L389: `dark:data-[state=active]:bg-brand-info` — PASS (예외)

```typescript
active:
  'data-[state=active]:bg-ul-midnight data-[state=active]:text-white dark:data-[state=active]:bg-brand-info dark:data-[state=active]:text-ul-midnight',
```

**판정 근거:**
- 라이트 모드 베이스: `data-[state=active]:bg-ul-midnight` → `ul-midnight`은 CSS 변수가 아닌 Tailwind 커스텀 색상
- 다크 모드 대체: `dark:data-[state=active]:bg-brand-info` → brand CSS 변수로 완전히 다른 색상 계열로 대체
- Step 21 업데이트 예외 조항: *`data-[state=*]:bg-ul-*` + `dark:data-[state=*]:bg-brand-*` 페어링*에 해당
- 코드 변경 없음 — 기존 라인 그대로 유지, 예외 규칙이 확대되어 커버

### L92: `'text-ul-midnight dark:text-brand-info'` — PASS (예외)

```typescript
textColor: 'text-ul-midnight dark:text-brand-info',
```

**판정 근거:**
- 라이트 모드: `text-ul-midnight` (non-CSS-var 커스텀 색상)
- 다크 모드: `dark:text-brand-info` (brand CSS 변수 대체)
- Step 21 원 예외 조항에 이 패턴이 **명시 예시**로 포함 (`'text-ul-midnight dark:text-brand-info'`)
- Iteration 1에서도 예외 허용 판정 유지

---

## INFO Items (FAIL 임계 미달)

### Step 13: Dead Token 4개

**FAIL 임계: ≥5개 → 현재 4개, INFO 수준**

| Token | 파일 | 외부 사용 수 |
|-------|------|-------------|
| `EQUIPMENT_CARD_TOKENS` | equipment.ts | 0 |
| `EQUIPMENT_HEADER_TOKENS` | equipment.ts | 0 |
| `EQUIPMENT_TAB_TOKENS` | equipment.ts | 0 |
| `NC_ELAPSED_DAYS_TOKENS` | non-conformance.ts | 0 |

tech-debt-tracker 등록 권고 (즉각 삭제 불필요).

---

## Iteration History

| Iteration | Date | Result | Key Change |
|-----------|------|--------|------------|
| 1 | 2026-04-26 | **FAIL** | M4 FAIL: L389 `dark:data-[state=active]:bg-brand-info` 예외 조항 미포함 |
| 2 | 2026-04-26 | **PASS** | Step 21 예외 조항 확대 — `data-[state=*]:bg-ul-*` + `dark:data-[state=*]:bg-brand-*` 페어링 명시 적용 |

---

## Verification Command Results

| Command | Expected | Actual | Status |
|---------|----------|--------|--------|
| M1: pnpm tsc --noEmit | exit 0 | exit 0, 에러 0건 | PASS |
| M2: grep REQUIRED_FIELD_TOKENS/A11Y in index.ts | 1+ hit | 1 hit | PASS |
| M3: grep direct import in NCEditDialog | 0 hit | 0 hit | PASS |
| M4: grep dark:.*brand- in 6 token files | 0 hit (비페어링) | 2 hits 모두 ul-midnight 페어링 예외 | PASS |
| M5: grep EXPECTED_ENTRY_COUNT in checkout-fsm table test | 1+ hit | 5 hits (상수 정의 1 + 사용 4) | PASS |
| Step 21 exception read: SKILL.md grep | 예외 패턴 data-[state=*] 포함 | 포함 확인 (`data-[state=active]:bg-ul-midnight dark:data-[state=active]:bg-brand-info` 명시) | PASS |
| verify-ssot NCEditDialog: barrel import | @/lib/design-tokens 경유 | REQUIRED_FIELD_TOKENS/A11Y/CONFIRM_PREVIEW_TOKENS/NC_DIALOG_TOKENS 모두 배럴 경유 | PASS |
