# Evaluation: checkout-fsm-hardening
Date: 2026-04-22
Iteration: 1

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `assertFsmAction`에서 `check.reason === 'forbidden'`일 때 `ForbiddenException` (HTTP 403) throw | PASS | `checkouts.service.ts:212-215` — `check.reason === 'invalid_transition'` 분기 이후 else-path에서 `ForbiddenException({ code: 'CHECKOUT_FORBIDDEN', ... })` throw. `BadRequestException`이 아닌 `ForbiddenException` 확인. |
| M2 | `assertFsmAction`에서 `check.reason === 'invalid_transition'`일 때 여전히 `BadRequestException` (HTTP 400) throw | PASS | `checkouts.service.ts:206-211` — `check.reason === 'invalid_transition'` 조건에서 `BadRequestException({ code: 'CHECKOUT_INVALID_TRANSITION', ... })` throw 확인. |
| M3 | `approve-return` 엔드포인트 guard: `Permission.APPROVE_CHECKOUT` | PASS | `checkouts.controller.ts:595` — `@RequirePermissions(Permission.APPROVE_CHECKOUT)` 확인. |
| M4 | `reject-return` 엔드포인트 guard: `Permission.REJECT_CHECKOUT` | PASS | `checkouts.controller.ts:656` — `@RequirePermissions(Permission.REJECT_CHECKOUT)` 확인. |
| M5 | 7개 `writeTransitionAudit` 호출 전부 try/catch로 감싸고 catch에 `logger.error()` 포함 | PASS | 정확히 7개 확인 (approve:1457, reject:1550, start:1677, submit_return:1822, approve_return:1940, reject_return:2077, cancel:2346). 각 호출 다음 `catch (auditErr) { this.logger.error(...) }` 블록 존재. |
| M6 | E2E spec에서 permission denied 케이스 HTTP status 기대값이 `403`으로 수정됨 | PASS | `checkouts.fsm.e2e-spec.ts:182` — `expect(res.status).toBe(403)`, `checkouts.fsm.e2e-spec.ts:197` — `expect(res.status).toBe(403)`. 두 케이스 모두 403 확인. |
| M7 | `pnpm tsc --noEmit` PASS | PASS | 루트에서 `pnpm tsc --noEmit` 실행 결과 에러 없음 (EXIT:0). |
| M8 | `pnpm test` PASS | PASS | `Test Suites: 72 passed, 72 total`, `Tests: 925 passed, 925 total` (EXIT:0). |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | approve-return guard 변경 시 ApiResponse 403 description도 동기화 | PASS | `checkouts.controller.ts:615` — `@ApiResponse({ status: HttpStatus.FORBIDDEN, description: '기술책임자 권한 없음' })` 존재. APPROVE_CHECKOUT 권한을 요구하는 기술책임자 역할과 일치. |
| S2 | catch 블록 에러 메시지 형식이 기존 logger.error 패턴과 일관성 유지 | PASS | 7개 audit catch 블록 모두 `\`<동작> 감사 로그 기록 실패 — checkoutId: ${uuid}, error: ${auditErr instanceof Error ? auditErr.message : String(auditErr)}\`` 형식으로 일관됨. stack trace를 두 번째 인자로 전달하는 패턴도 통일. |

## ForbiddenException 재던지기 검증 (추가 점검)
모든 FSM 전이 메서드(approve, reject, startCheckout, returnCheckout, approveReturn, rejectReturn, cancel)의 외부 catch 블록이 `ForbiddenException`을 명시적으로 체크하여 logger.error 호출 없이 즉시 re-throw함.
- approve: `1493-1500` — `ForbiddenException` re-throw 확인
- reject: `1590-1597` — `ForbiddenException` re-throw 확인
- startCheckout: `1712-1719` — `ForbiddenException` re-throw 확인
- returnCheckout: `1859-1867` — `ForbiddenException` re-throw 확인 (+ ConflictException 포함)
- approveReturn: `1975-1983` — `ForbiddenException` re-throw 확인 (+ ConflictException 포함)
- rejectReturn: `2115-2123` — `ForbiddenException` re-throw 확인 (+ ConflictException 포함)
- cancel: `2365-2372` — `ForbiddenException` re-throw 확인

모든 메서드에서 ForbiddenException이 외부 catch에 의해 오염(error 로깅)되지 않음.

## Overall Verdict
PASS

## Issues Found
없음. 모든 MUST/SHOULD 기준 충족.

## Repair Instructions
없음.
