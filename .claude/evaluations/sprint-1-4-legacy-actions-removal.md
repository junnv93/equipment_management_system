# Evaluation: sprint-1-4-legacy-actions-removal
Date: 2026-04-24
Iteration: 1

## MUST Criteria Results

| ID  | Criterion | Result | Evidence |
|-----|-----------|--------|----------|
| M1  | `pnpm --filter frontend run tsc --noEmit` 에러 0건 | PASS | 명령 출력 없음 (0 errors) |
| M2  | `grep -n "isNextStepPanelEnabled" CheckoutDetailClient.tsx` 결과 0건 | PASS | grep EXIT:1 (매칭 없음) |
| M3  | `grep -n "LegacyActionsBlock" CheckoutDetailClient.tsx` 결과 0건 | PASS | grep EXIT:1 (매칭 없음) |
| M4  | `checkout-flags.ts`가 `return true` 단일 반환 (process.env 참조 없음) | PASS | `return true` 확인. `process.env`는 JSDoc 주석에만 등장, 실 코드 참조 0건 |
| M5  | `CheckoutDetailClient.tsx` 내 permission vars 참조 0건 | PASS | grep EXIT:1 (매칭 없음) |
| M6  | `CheckoutDetailClient.tsx` 내 dead imports/state 참조 0건 | PASS | grep EXIT:1 (handoverQrOpen, HandoverQRDisplay, tQr, QrCode, CheckCheck, useAuth 모두 없음) |
| M7  | NextStepPanel이 조건 없이 직접 렌더됨 | PASS | line 486-493: `<ErrorBoundary>` + `<NextStepPanel>` 직접 렌더, isNextStepPanelEnabled 래퍼 없음 |
| M8  | 모바일 bottom sheet 조건에서 `isNextStepPanelEnabled()` 제거 | PASS | line 1110: `{nextStepDescriptor.nextAction !== null && ...}` — isNextStepPanelEnabled() 없음 |
| M9  | `.env.local`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 줄 없음 | PASS | grep 결과 NOT FOUND |
| M10 | `.env.example`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 줄 없음 | PASS | grep 결과 NOT FOUND |
| M11 | tech-debt-tracker.md에서 flag 상시화 항목 [x] 체크 완료 | PASS | line 39, 120 모두 `[x]` 체크, Sprint 1.4 완료 메모 포함 |
| M12 | `handleNextStepAction`이 여전히 정의되고 `borrower_approve`/`borrower_reject` case 포함 | PASS | line 395-434: 함수 정의 확인, borrower_approve(line 425), borrower_reject(line 428) case 포함 |
| M13 | 모든 Dialog 컴포넌트 여전히 정의 | PASS | reject(line 957), start(line 839), approveReturn(line 884), rejectReturn(line 908), cancel(line 1007), borrowerApprove(line 1035), borrowerReject(line 1065) — 7개 전부 확인 |

## SHOULD Criteria Results

| ID  | Criterion | Result | Note |
|-----|-----------|--------|------|
| S1  | `pnpm --filter frontend run test` PASS | PASS | 12 suites, 182 tests, 0 failures. NextStepPanel.test.tsx 포함 |
| S2  | verify-checkout-fsm Step 19 (NO_EQUIPMENT guard ≥ 4건), Step 32 (280 table test) 확인 | PASS | NO_EQUIPMENT 4건 확인, if(firstEquip) 0건, checkout-fsm.table.test.ts 파일 존재 확인 |
| S3  | tech-debt-tracker에 `checkout-legacy-next-step-panel-cleanup` 항목의 트리거 조건 활성화 표시 | PASS | line 84: `⚡ 트리거 활성화(Sprint 1.4 완료)` 표시 확인. checkout-legacy-rental-flow-cleanup도 동일(line 83) |

## Issues Found

### MUST Failures (loop triggers)
없음.

### SHOULD Failures (tech-debt candidates)
없음.

### 참고 관찰 (실패 아님)

1. **checkout-flags.ts `@deprecated` 주석**: `isNextStepPanelEnabled()` 함수 자체는 아직 파일에 남아 있으며 `@deprecated` 주석이 달려 있음. 이는 계약 M4가 요구하는 "return true 단일 반환"을 만족하며, 함수 제거는 `checkout-legacy-next-step-panel-cleanup` 항목(트리거 활성화됨)으로 이연 처리됨 — 계획된 상태로 FAIL 아님.

2. **CheckoutGroupCard.tsx 잔여 참조**: `isNextStepPanelEnabled()` 호출이 CheckoutGroupCard.tsx에 6건 잔존. 이는 Sprint 1.4 스코프 외이며 `checkout-legacy-rental-flow-cleanup` 트리거 항목으로 명시적으로 추적됨 — 계획된 상태로 FAIL 아님.

3. **process.env 주석**: checkout-flags.ts line 4의 `process.env` 언급은 JSDoc 주석이며 실 코드 참조 없음. M4 기준 충족.

## Verdict: PASS

모든 13개 MUST 기준 통과. 모든 3개 SHOULD 기준 통과.
TypeScript 에러 0건, Jest 테스트 182건 전량 통과.
LegacyActionsBlock 완전 제거 및 isNextStepPanelEnabled() 상시화 정상 구현 확인.
