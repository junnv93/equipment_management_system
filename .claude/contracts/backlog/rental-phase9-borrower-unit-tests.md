---
slug: rental-phase9-borrower-unit-tests
created: 2026-04-24
---

# Contract: rental 2-step Phase 9 — borrowerApprove/borrowerReject 유닛 테스트

## Scope

파일:
1. `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts` — 유닛 테스트 추가
2. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — tech-debt 2건

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `describe('borrowerApprove')` 블록에 (a)~(d) 4 케이스 존재 | grep 패턴 |
| M2 | (a) 정상 승인: `result.status === 'borrower_approved'` + `emitAsync` 호출 확인 | test assertion |
| M3 | (b) 비-rental: `BadRequestException` throw (`purpose: 'calibration'`) | test assertion |
| M4 | (c) 스코프 외: `ForbiddenException` throw (requester.site !== user.site) | test assertion |
| M5 | (d) BORROWER_TEAM_ONLY: `ForbiddenException` throw (`teamId: undefined` mockReq) | test assertion |
| M6 | `pnpm --filter backend run test -- --testPathPattern=checkouts.service.spec` PASS | 실행 결과 |
| M7 | `pnpm --filter backend run tsc --noEmit` PASS | 실행 결과 |
| M8 | 기존 mock 패턴 재사용 (`mockDrizzle.limit`, `mockChain.then`, `mockCacheService.getOrSet`) | 코드 리뷰 |
| M9 | 새 mock 인프라 없음 (mockEventEmitter 변수 추가는 최소 변경으로 허용) | 코드 리뷰 |

## SHOULD Criteria (루프 차단 없음 — tech-debt)

| # | Criterion |
|---|-----------|
| S1 | CheckoutDetailClient: `REJECTED` 카드에 `borrowerRejectionReason` 병렬 표시 |
| S2 | borrowerReject `onErrorCallback`에 `setBorrowerRejectReason('')` 초기화 추가 |

## Test Case Spec

### borrowerApprove (a) — 정상 승인
- `findOne`: `getOrSet.mockResolvedValue(rentalPendingCheckout)` (purpose=rental, status=pending)
- requester: `mockDrizzle.limit.mockResolvedValueOnce([{ site:'suwon', teamId: mockReq.user.teamId }])`
- CAS: `mockDrizzle.returning.mockResolvedValueOnce([borrowerApprovedCheckout])` (status=borrower_approved)
- getAffectedTeamIds: `mockDrizzle.limit.mockResolvedValueOnce([{ teamId: mockReq.user.teamId }])`
- getCheckoutItemsWithFirstEquipment: `mockChain.then` override (items 1개 반환)
- Assert: `result.status === 'borrower_approved'`, `emitAsync` called with `CHECKOUT_BORROWER_APPROVED`

### borrowerApprove (b) — 비-rental
- `getOrSet.mockResolvedValue(calibrationPendingCheckout)` (purpose=calibration)
- `toThrow(BadRequestException)`

### borrowerApprove (c) — 스코프 외
- `getOrSet.mockResolvedValue(rentalPendingCheckout)`
- `mockDrizzle.limit.mockResolvedValueOnce([{ site:'daejeon', teamId:'...' }])` (다른 site)
- `toThrow(ForbiddenException)`

### borrowerApprove (d) — BORROWER_TEAM_ONLY
- `mockReqNoTeam` (teamId: undefined, site: 'suwon')
- `getOrSet.mockResolvedValue(rentalPendingCheckout)`
- `mockDrizzle.limit.mockResolvedValueOnce([{ site:'suwon', teamId: mockReq.user.teamId }])` (requester has teamId, but req has none)
- `toThrow(ForbiddenException)`

## Exclusions

- borrowerReject 미러 테스트는 SHOULD (생략 시 tech-debt 기록)
- Playwright E2E 불필요 (backend unit test only)
- review-architecture 불필요 (신규 파일 없음, 아키텍처 변경 없음)
