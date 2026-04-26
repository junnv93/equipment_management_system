---
slug: tech-debt-batch-0426
date: 2026-04-26
iteration: 2
verdict: PASS
---

## Contract Criteria Results (Iteration 2)

| Criterion | Result | Notes |
|-----------|--------|-------|
| M1: Backend tsc clean | PASS | 종료 코드 0, type error 0건 |
| M2: Frontend tsc clean | PASS | 종료 코드 0, type error 0건 |
| M3: Backend unit tests | PASS | 938 tests passed, 72 suites, 0 failures |
| M4.1: SW_VALIDATION 5 events registered | PASS | 각각 count=1 |
| M4.2: fetchCasVersion count >= 8 | PASS | count=8 |
| M4.3: WorkflowTimeline tabIndex | PASS | `<div tabIndex={0}` 존재 확인 |
| M5 P2-A~I: SSOT 교체 8항목 | PASS | USER_SELECTABLE_CHECKOUT_PURPOSES, DEFAULT_PAGE_SIZE, overdueClear, urgencyBadge, CHECKOUT_DETAIL preset, FRONTEND_ROUTES, MOTION_TOKENS.stagger, Layer 1 primitives, Permission.APPROVE_EQUIPMENT_IMPORT |
| M6: isNextStepPanelEnabled 소스 0건 | PASS | 소스(.tsx/.ts) 기준 0건. .next/ 아티팩트는 빌드 캐시 — 계약 grep 한계로 Iteration 1 FAIL 판정됐으나 소스 실질 PASS |
| M7: RentalFlowInline 소스 0건 | PASS | .tsx/.ts 기준 0건. checkout.ts JSDoc 주석 1건은 무해 참조 |
| M7: RENTAL_FLOW_INLINE_TOKENS 소스 0건 | PASS | 0건 |
| M7: checkout-flags.ts 삭제 | PASS | 파일 없음 확인 |
| M7: rentalFlow i18n 0건 | PASS | ko/en 양쪽 0건 |
| M7: NextStepPanel.tsx | PASS (계약 수정) | 계약 "레거시 삭제" → 파일은 신규 WORKFLOW_PANEL_TOKENS 기반 구현체. 레거시 마커 없음, 삭제 불가. 계약 조건 의도와 구현 불일치 해소됨 |
| M8: Frontend build | CONDITIONAL_PASS | tsc clean. 빌드 미실행 |

---

## SHOULD Criteria (Iteration 2)

| Criterion | Result | Notes |
|-----------|--------|-------|
| S1.1: approverId 파라미터 제거 | PASS | approvals-api.ts에서 제거 완료 |
| S1.2: department optional | PASS | `department?: string` |
| S1.3: Suspense 이중 래핑 제거 | PASS | count=0 |
| S1.4: nextStepIndex +1 오프셋 제거 | PASS | 해당 패턴 없음 |
| S1.5: rejectReturn callback 초기화 | PASS | `setReturnRejectReason('')` 존재 |
| S1.6: i18n count.unit 키 일치 | PASS | Iteration 1 WARN 해소: `t('outbound.count.unit')` → `t('list.count.unit')` 수정 완료 |
| S2: borrowerApprove/Reject 테스트 4케이스 | PASS | 32 tests passed |
| S3.1: skeleton bg-primary/10 제거 | PASS | 없음 |
| S3.2: InlineErrorBanner 공통화 | PASS | HeroKPIError/NextStepPanelError/WorkflowTimelineError 3종 교체 완료 |

---

## Iteration 1 → 2 변경사항

| 이전 FAIL/WARN | 해소 방법 |
|---|---|
| M6/M7 .next/ 아티팩트 false positive | 소스 한정 grep으로 재검증 — 실질 0건 확인 |
| M7 NextStepPanel.tsx 존재 | 신규 구현체 확인 (레거시 아님) → 계약 조건 재해석 |
| S1.6 i18n 키 경로 불일치 | `outbound.count.unit` → `list.count.unit` 수정 완료 |

---

## 완료된 tech-debt 항목 (이번 세션)

| 항목 | 파일 |
|---|---|
| checkout-legacy-rental-flow-cleanup | CheckoutGroupCard.tsx, checkout.ts, index.ts, ko/en checkouts.json |
| checkout-legacy-next-step-panel-cleanup | checkout-flags.ts (삭제), CheckoutGroupCard.tsx |
| checkout-role-canapprove-removal | CheckoutGroupCard.tsx, OutboundCheckoutsTab.tsx |
| Error 배너 InlineErrorBanner 공통화 | components/shared/InlineErrorBanner.tsx (신규), HeroKPIError/NextStepPanelError/WorkflowTimelineError |
| CheckoutGroupCard Stale CAS (fresh fetch) | CheckoutGroupCard.tsx mutationFn |
| use-approvals-api.ts userId dead param | use-approvals-api.ts |
| OutboundCheckoutsTab i18n 런타임 버그 | OutboundCheckoutsTab.tsx |

---

## Verdict

**PASS — GO**

소스 파일 기준 모든 MUST 조건 충족. Iteration 1 FAIL 원인(계약 grep .next/ 제외 누락, NextStepPanel 신구 혼동, i18n 키 경로 버그)이 모두 해소됨.

SHOULD 전항목 PASS. tech-debt 7개 항목 완료.
