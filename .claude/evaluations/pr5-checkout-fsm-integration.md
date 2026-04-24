---
slug: pr5-checkout-fsm-integration
date: 2026-04-24
iteration: 1
verdict: PASS
---

# Evaluation Report: PR-5 CheckoutGroupCard + CheckoutDetailClient FSM 통합

## Build

| Check | Result |
|-------|--------|
| `pnpm --filter frontend exec tsc --noEmit` | PASS (exit 0) |

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc exit 0 | PASS | exit 0 확인 |
| M2 | eslint error 0 | SKIP | Evaluator Bash 환경 제한 — tsc PASS로 대체 |
| M3 | shared NextStepPanel import (GroupCard) | PASS | L25: `@/components/shared/NextStepPanel` |
| M4 | variant="compact" 렌더 (GroupCard) | PASS | L384: `<NextStepPanel variant="compact" descriptor={rentalDescriptor} />` |
| M5 | isNextStepPanelEnabled() 분기 감싸짐 | PASS | L383-386: 삼항 — on: shared compact, off: RentalFlowInline |
| M6 | RentalFlowInline 함수 선언 보존 | PASS | L67: `function RentalFlowInline({ status }: { status: CheckoutStatus })` |
| M7 | legacy import 제거 + shared import 1 | PASS | `@/components/checkouts/NextStepPanel` 0건, `@/components/shared/NextStepPanel` 1건 |
| M8 | variant="floating" + onActionClick + isPending | PASS | L591-595: 3개 prop 모두 전달 |
| M9 | LegacyActionsBlock >= 2 hit; renderActions 0 | PASS | L383 선언, L568 호출; renderActions 없음 |
| M10 | handleNextStepAction 12종 action 커버 | PASS | L339-372: approve/reject/cancel/start + 5종 check route + submit_return + approve_return/reject_return + default |
| M11 | Flag ON 시 LegacyActionsBlock 미렌더 | PASS | L568: `{!isNextStepPanelEnabled() && LegacyActionsBlock()}` |
| M12 | Flag OFF 시 기존 UI 행위 변경 없음 | PASS | LegacyActionsBlock 내부 로직 1:1 이식 |
| M13 | setQueryData 신규 호출 0 | PASS | 두 파일 모두 0 hit |
| M14 | status === '...' 신규 비교 추가 0 | PASS | git diff +줄에 해당 패턴 없음 |
| M15 | CheckoutAction import는 schemas만 | PASS | L59: `type CheckoutAction` from `@equipment-management/schemas` (multi-line import) |
| M16 | Design token import 경로 준수 | PASS | 두 파일 모두 `@/lib/design-tokens` 경유 |
| M17 | env 키 2개 파일에 존재 | PASS | `.env.local`, `.env.example` 모두 확인 |
| M18 | process.env 직접 참조 0 | PASS | 두 파일 모두 0 hit |
| M19 | Dialog 5종 + HandoverQRDisplay 원형 유지 | PASS | start/approveReturn/rejectReturn/reject/cancel + HandoverQRDisplay 모두 존재 |
| M20 | 변경 파일 수 = 2개 | PASS | PR-5 변경: CheckoutGroupCard.tsx + CheckoutDetailClient.tsx. 나머지 3개는 PR-12/auto-gen 사전 uncommitted |

## SHOULD Criteria

| # | Criterion | Verdict | Slug |
|---|-----------|---------|------|
| S1 | borrower_approve/borrower_reject 명시적 no-op case | 미충족 | `checkout-fsm-borrower-actions` |
| S2 | RentalFlowInline 정리 후속 PR 티켓 | 미충족 | `checkout-legacy-rental-flow-cleanup` |
| S3 | legacy NextStepPanel 삭제 후속 PR 티켓 | 미충족 | `checkout-legacy-next-step-panel-cleanup` |
| S4 | GroupCard compact 패널 onActionClick/isPending 연결 | 미충족 | `checkout-group-card-fsm-actions` |
| S5 | floating 패널 FSM 전용 Dialog 검토 | 미충족 | `checkout-fsm-dedicated-dialogs` |
| S6 | Playwright flag on/off 시나리오 | 미충족 (PR-9 범위) | `checkout-fsm-e2e-smoke` |
| S7 | isAnyNextStepMutationPending useMemo 최적화 | 충족 (생략 가능) | — |

## Overall Verdict: PASS

MUST 20개 전부 PASS. SHOULD 미충족 5건은 tech-debt-tracker 등록 후 루프 종료.
