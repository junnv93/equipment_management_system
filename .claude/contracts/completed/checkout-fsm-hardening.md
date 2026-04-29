# Contract: checkout-fsm-hardening

## Scope
PR-2 tech-debt 3건: assertFsmAction 403 변환, controller guard 정렬, writeTransitionAudit 실패 로깅.

## Changed Files
1. `apps/backend/src/modules/checkouts/checkouts.service.ts`
2. `apps/backend/src/modules/checkouts/checkouts.controller.ts`
3. `apps/backend/test/checkouts.fsm.e2e-spec.ts`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `assertFsmAction`에서 `check.reason === 'forbidden'`일 때 `ForbiddenException` (HTTP 403) throw | grep `ForbiddenException` in assertFsmAction block |
| M2 | `assertFsmAction`에서 `check.reason === 'invalid_transition'`일 때 여전히 `BadRequestException` (HTTP 400) throw | grep `BadRequestException` in assertFsmAction block |
| M3 | `approve-return` 엔드포인트 guard: `Permission.APPROVE_CHECKOUT` | grep APPROVE_CHECKOUT near approve-return |
| M4 | `reject-return` 엔드포인트 guard: `Permission.REJECT_CHECKOUT` | grep REJECT_CHECKOUT near reject-return |
| M5 | 7개 `writeTransitionAudit` 호출 전부 try/catch로 감싸고 catch에 `logger.error()` 포함 | grep `writeTransitionAudit` + catch block |
| M6 | E2E spec에서 permission denied 케이스 HTTP status 기대값이 `403`으로 수정됨 | grep `toBe(403)` in fsm spec |
| M7 | `pnpm --filter backend run tsc --noEmit` PASS | compile check |
| M8 | `pnpm --filter backend run test` PASS | unit test |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | approve-return guard 변경 시 ApiResponse 403 description도 동기화 |
| S2 | catch 블록 에러 메시지 형식이 기존 logger.error 패턴과 일관성 유지 |

## Out of Scope
- CheckoutErrorCode enum 도입 (별도 LOW 항목)
- E2E 격리 재검증 (HIGH 항목, 별도 처리)
- 기타 인접 코드 리팩토링
