# Contract: checkout-fsm-schemas (PR-1)

## Scope
`packages/schemas/src/fsm/` 신규 디렉토리 + `checkout.ts` nextStep 필드 추가.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter @equipment-management/schemas exec tsc --noEmit` exit 0 | tsc |
| M2 | `pnpm --filter @equipment-management/schemas test` exit 0 | jest |
| M3 | `assertFsmInvariants()` 모듈 로드 시 예외 없음 | import 후 process 확인 |
| M4 | 13개 CheckoutStatus 모두 `from` 또는 terminal로 등장 | assertFsmInvariants 내부 |
| M5 | terminal states (rejected, canceled, return_approved) out-edge = 0 | assertFsmInvariants 내부 |
| M6 | rental 경로 end-to-end 순회 가능 | assertFsmInvariants 내부 |
| M7 | `packages/schemas/src/index.ts`에서 FSM 타입 re-export 확인 | grep |
| M8 | `CheckoutSchema`에 `nextStep` optional 필드 추가됨 | grep + tsc |
| M9 | SSOT 준수: CheckoutStatus/UserRole/Permission 로컬 재정의 없음 | grep |
| M10 | `any` 타입 사용 0건 (checkout-fsm.ts 내부) | grep |

## SHOULD Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | 단위 테스트 케이스 10개 이상 | test count |
| S2 | getNextStep matrix 테스트 (최소 5개 snapshot) | test |
| S3 | canPerformAction 권한 매트릭스 (5 role × 주요 action) | test |
| S4 | computeStepIndex: calibration=5, rental=8 total steps (computeTotalSteps SSOT) | test |

## Files Expected
- `packages/schemas/src/fsm/checkout-fsm.ts` (신규)
- `packages/schemas/src/fsm/index.ts` (신규)
- `packages/schemas/src/index.ts` (수정: fsm re-export 추가)
- `packages/schemas/src/checkout.ts` (수정: nextStep 필드 추가)
- `packages/schemas/src/__tests__/checkout-fsm.test.ts` (신규)

## Out of Scope
- Backend guard 교체 (PR-2)
- Frontend 컴포넌트 변경 (PR-3+)
- i18n 키 추가 (PR-8)
