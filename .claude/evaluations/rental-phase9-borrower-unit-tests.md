# Evaluation Report: rental-phase9-borrower-unit-tests
Date: 2026-04-24
Iteration: 1

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `describe('borrowerApprove')` 블록에 (a)~(d) 4 케이스 존재 | PASS | Lines 754–856: `describe('borrowerApprove')` with exactly 4 `it()` cases: (a) 정상 1차 승인, (b) 비-rental, (c) 스코프 외, (d) BORROWER_TEAM_ONLY |
| M2 | (a) 정상 승인: `result.status === 'borrower_approved'` + `emitAsync` 호출 확인 | PASS | Line 805: `expect(result.status).toBe('borrower_approved')`. Lines 806–809: `expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('checkout.borrowerApproved', expect.objectContaining({ checkoutId }))` — `'checkout.borrowerApproved'` === `NOTIFICATION_EVENTS.CHECKOUT_BORROWER_APPROVED` |
| M3 | (b) 비-rental: `BadRequestException` throw (`purpose: 'calibration'`) | PASS | Lines 812–821: `getOrSet` returns checkout with `purpose: 'calibration'`, asserts `rejects.toThrow(BadRequestException)` |
| M4 | (c) 스코프 외: `ForbiddenException` throw (requester.site !== user.site) | PASS | Lines 823–833: requester DB returns `site: 'daejeon'` (user site is 'suwon'), asserts `rejects.toThrow(ForbiddenException)` |
| M5 | (d) BORROWER_TEAM_ONLY: `ForbiddenException` throw (`teamId: undefined` mockReq) | PASS | Lines 835–855: `mockReqNoTeam` has `teamId: undefined`, requester DB returns `site: 'suwon'` (site passes), asserts `rejects.toThrow(ForbiddenException)` |
| M6 | 테스트 실행 결과 all PASS | **FAIL** | `pnpm --filter backend run test -- --testPathPattern=checkouts.service.spec` exits with code 1: "No tests found" — pnpm/jest shell escaping causes `--testPathPattern\=checkouts.service.spec` (backslash) to match nothing. However, `npx jest --testPathPattern="checkouts.service.spec"` (contract verification step의 대체 명령) PASS — 32/32 tests pass. 컨트랙트 표의 명령 문법과 실제 jest 동작이 불일치함. |
| M7 | tsc --noEmit 양쪽 모두 에러 없음 | PASS | `npx tsc --noEmit` (backend, cwd=apps/backend): exit 0, no TypeScript errors. `npx tsc --noEmit` (frontend, cwd=apps/frontend): exit 0, no TypeScript errors. `pnpm --filter X run tsc` 실패는 "tsc" script 미등록 때문이며 실제 타입 오류 없음. |
| M8 | 기존 mock 패턴 재사용 (`mockDrizzle.limit`, `mockChain.then`, `mockCacheService.getOrSet`) | PASS | borrowerApprove (a): `mockCacheService.getOrSet.mockResolvedValue`, `mockDrizzle.limit.mockResolvedValueOnce`, `mockDrizzle.returning.mockResolvedValueOnce`, `mockChain.then` override — 모두 기존 `approve`, `approveReturn` 패턴과 동일 |
| M9 | mockEventEmitter 추가가 최소 변경 (beforeEach 내 pattern-matched) | PASS | Lines 33, 141–145: `let mockEventEmitter` 변수 선언 + `beforeEach` 내 `useValue: (mockEventEmitter = { emit, emitAsync, on })` 할당. 새 헬퍼/factory 없음, 기존 `mockImportsService` inline-assign 패턴 그대로 적용 |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | CheckoutDetailClient: `REJECTED` 카드에 `borrowerRejectionReason` 병렬 표시 | PASS | Lines 1000–1010: `checkout.status === CSVal.REJECTED && (checkout.borrowerRejectionReason \|\| checkout.rejectionReason)` 가드 + `<p>{checkout.borrowerRejectionReason ?? checkout.rejectionReason}</p>` |
| S2 | borrowerReject `onErrorCallback`에 `setBorrowerRejectReason('')` 초기화 추가 | PASS | Lines 316–318: `onErrorCallback: () => { setDialogState(…); setBorrowerRejectReason(''); }` |

## Overall: FAIL

## Issues to Fix (FAIL only)

### M6: `pnpm --filter backend run test -- --testPathPattern=checkouts.service.spec` 명령 실패

**원인**: pnpm이 `--` 이후 인자를 jest에 전달할 때 `=` 문자를 `\=`로 이스케이프하여 jest가 패턴을 인식하지 못함. 결과: "No tests found, exiting with code 1".

**실제 테스트 상태**: 32개 전체 통과. `npx jest --testPathPattern="checkouts.service.spec"` 또는 `pnpm --filter backend exec jest --testPathPattern="checkouts.service.spec"`로 실행 시 PASS.

**수정 방법 (둘 중 하나)**:
1. 컨트랙트 M6 검증 명령을 `npx jest --testPathPattern="checkouts.service.spec"` (또는 `pnpm --filter backend exec jest ...`)로 수정
2. `package.json`의 `test` 스크립트를 `jest "$@"` 형태로 변경하여 pnpm 이스케이프 문제 우회

**구현 자체의 결함은 없음**: 테스트 코드와 프로덕션 코드 모두 정상. M6 실패는 컨트랙트에 기재된 검증 명령의 문법 오류에서 비롯됨.
