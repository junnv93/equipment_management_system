# Evaluation Report: rental-2step-e2e-pr13
Date: 2026-04-24
Iteration: 1

## Verdict: FAIL

**루프 재실행 필요. M-4(계약 스크립트 출력 기준) 및 M-8(i18n summary 키 누락) 실패.**

---

## MUST Criteria
| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M-1 | tsc --noEmit passes (exit code 0, no `:any` in new files) | PASS | `pnpm --filter frontend exec tsc --noEmit` 출력 없음(exit 0). `:any` grep → "OK" |
| M-2 | spec 파일에 정확히 6개 test() 존재 | PASS | T1/T2/T3/T4/T5/T6 6개 확인 (indented test 패턴 grep 결과) |
| M-3 | `data-testid="your-turn-badge"` 는 YourTurnBadge.tsx에만 존재 | PASS | YourTurnBadge.tsx에 1건, 다른 파일 grep → "OK" |
| M-4 | SSOT 위반 없음 — getNextStep/NextStepDescriptor 재정의 금지 | FAIL | 계약 명시 grep 스크립트가 "FAIL: SSOT 위반" 출력. 실제 원인: `type NextStepDescriptor,` import 라인이 `(type|interface)\s+NextStepDescriptor\b` 패턴에 매칭됨. 실질적 재정의는 없고 전부 `@equipment-management/schemas`에서 import이나, 계약 스크립트 기준 FAIL 판정 |
| M-5 | hex 하드코딩 0 (신규 토큰/컴포넌트/훅 파일) | PASS | grep → "OK" (0건) |
| M-6 | `borrowerApproveCheckout` CAS-Aware (GET→extractVersion→PATCH with version) | PASS | `page.request.get` + `extractVersion(detail)` + `data: { version }` PATCH 확인 |
| M-7 | `getBackendTokenByEmail` 구현 정합 | PASS | `email:${email}` 캐시 키, `?email=${encodeURIComponent(email)}` 쿼리, tokenCache 재사용, 네임스페이스 분리 모두 확인 |
| M-8 | i18n 키 대칭 (ko + en) — `summary` 포함 4개 키 | FAIL | `node -e` 스크립트 exit 10 (`ko missing summary`). ko.yourTurn에 `summary` 키 없음. en.yourTurn에도 `summary` 키 없음. 두 파일 모두 `label/tooltip/count/summaryAria` 4개 존재하나 `summary`는 누락 |
| M-9 | spec body에 userId/approverId/requesterId 수동 주입 금지 | PASS | grep → "OK" (0건) |
| M-10 | `CheckoutGroupCard.tsx` 70%+ 교체 금지 (변경 비율 ≤ 0.30) | PASS | +42/-37 = 79라인 변경, 변경 전 588라인 기준 비율 0.1343 (≤ 0.30) |

---

## SHOULD Criteria
| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S-1 | `YourTurnBadge`에 `role="status"` + `aria-label` 존재 | PASS | 라인 49: `role="status"`, 라인 50: `aria-label={ariaLabel}` 확인 |
| S-2 | `use-checkout-group-descriptors` — `useMemo` 2회 이상 | PASS | grep -c 결과 4 (≥ 2) |
| S-3 | `YourTurnBadge`가 `memo`로 감싸짐 | PASS | `export const YourTurnBadge = memo(YourTurnBadgeInner);` 확인 |
| S-4 | `motion-reduce:animate-none` 포함 | PASS | `checkout-your-turn.ts`에 `critical: '...animate-pulse motion-reduce:animate-none'` 확인 |
| S-5 | spec에 `CheckoutStatusValues` (SSOT) 사용 | PASS | `CheckoutStatusValues as CSVal` import + `CSVal.PENDING/BORROWER_APPROVED/APPROVED` 사용 확인 |
| S-6 | spec 내 장비 ID가 `TEST_EQUIPMENT_IDS` 상수 사용 | PASS | `LENDER_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E` 등 3개 상수 사용 확인 |
| S-7 | 에러 코드 substring 이상 수준 검증 (T5: BORROWER_TEAM_ONLY, T6: BORROWER_APPROVE_RENTAL_ONLY) | PASS | T5: `expect(errorCode).toBe('CHECKOUT_BORROWER_TEAM_ONLY')`, T6: `expect(errorCode).toBe('CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY')` — `.toBe()` 완전 일치 |
| S-8 | en locale `yourTurn.summary` 자연스러운 영어 | N/A | `summary` 키 자체가 존재하지 않음 (M-8 FAIL의 부수 결과). 평가 불가 |

---

## Issues Found

### MUST Failures (loop blockers)

#### M-4: 계약 스크립트 false positive 결과 (FAIL 판정)
- **계약 검증 스크립트 출력**: `FAIL: SSOT 위반`
- **근본 원인**: 계약의 grep 패턴 `(type|interface)\s+NextStepDescriptor\b`이 TypeScript의 `import { type NextStepDescriptor, }` 구문과 매칭됨
- **실제 상태**: `NextStepDescriptor`의 로컬 재정의는 0건. 모든 매칭 라인이 `@equipment-management/schemas` 또는 `@equipment-management/shared-constants`에서 import하는 라인임
  - `CheckoutMiniProgress.tsx:13` — import from `@equipment-management/schemas`
  - `CheckoutGroupCard.tsx:38` — import from `@equipment-management/schemas`
  - `use-checkout-next-step.ts:10` — import from `@equipment-management/schemas`
  - `use-checkout-group-descriptors.ts:6` — import from `@equipment-management/schemas`
- **계약 스크립트 기준**: FAIL (스크립트가 "FAIL" 출력)
- **권고**: 계약 grep 패턴을 `^(export\s+)?(type|interface)\s+NextStepDescriptor\b` (행 시작 앵커)로 수정하거나, 계약 문구대로 "재정의 없음"을 인정하고 이번 FAIL을 grep 패턴 오류로 처리 후 패스 처리. 어느 쪽이든 계약 작성자 판단 필요.

#### M-8: i18n `summary` 키 양쪽 모두 누락
- **파일**: `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json`
- **현재 상태**:
  - ko.yourTurn 보유 키: `tooltip`, `label`, `count`, `summaryAria`
  - en.yourTurn 보유 키: `label`, `tooltip`, `count`, `summaryAria`
  - **누락 키**: `summary` (ko, en 모두)
- **계약 요구**: `['label','tooltip','summary','summaryAria']` 4개 키가 ko/en 모두 존재해야 함
- **검증 명령 결과**: `exit 10 (ko missing summary)`
- **수정 필요**: ko.yourTurn에 `"summary": "..."`, en.yourTurn에 `"summary": "..."` 키 추가

### SHOULD Failures (tech-debt candidates)

#### S-8: en.yourTurn.summary 키 자체 없음
- M-8의 부수 결과. `summary` 키 추가 시 자연스러운 영어 문구(예: "Your turn summary", "Pending action: {count} items")로 작성 필요.

---

## 즉시 반려 조건 점검

| 조건 | 결과 |
|------|------|
| `waitForTimeout` 신뢰성 목적 삽입 | 없음 (grep 0건) |
| CheckoutGroupCard 외 다른 checkout 컴포넌트 무단 수정 | 없음 |
| `test.skip()` 사용 | 없음 (grep 0건) |
| backend 파일 수정 | 없음 (git diff 0건) |
| 신규 auth fixture (storageState) 추가 | 없음 |
| spec body에 hardcoded UUID 포함 | 없음 (grep 0건) |

---

## 결론

**FAIL — 2개 MUST 기준 실패:**
1. **M-4**: 계약 스크립트가 "FAIL: SSOT 위반" 출력. 실질 재정의 없으나 grep 패턴 앰비규이티로 인한 결과. 계약 작성자 확인 후 패턴 수정 또는 통과 처리 필요.
2. **M-8**: ko/en 양쪽에 `yourTurn.summary` 키 누락. 간단한 문자열 2줄 추가로 해결 가능.

M-8은 즉시 수정 가능한 단순 누락이며, M-4는 계약 grep 패턴의 false positive 여부를 계약 작성자가 판단해야 함.
