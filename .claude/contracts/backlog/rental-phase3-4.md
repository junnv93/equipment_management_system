---
slug: rental-phase3-4
type: contract
date: 2026-04-24
depends_on: exec-plans/active/2026-04-24-rental-phase3-4.md
---

# Contract: rental-phase3-4 — Scope Guard Branching & Borrower Approval Endpoint

## Scope

**Backend**
- `apps/backend/src/modules/checkouts/checkouts.service.ts`
- `apps/backend/src/modules/checkouts/checkouts.controller.ts`
- `apps/backend/src/modules/checkouts/checkout-error-codes.ts`
- `apps/backend/src/modules/checkouts/dto/borrower-approve-checkout.dto.ts` (신규)
- `apps/backend/src/modules/checkouts/dto/borrower-reject-checkout.dto.ts` (신규)
- `apps/backend/src/modules/checkouts/dto/index.ts`
- `apps/backend/src/modules/checkouts/dto/checkout-response.dto.ts`
- `apps/backend/src/modules/notifications/events/notification-events.ts`

**Frontend**
- `apps/frontend/lib/api/checkout-api.ts`

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 (전체 monorepo) | 빌드 |
| M2 | `borrowerApprove`/`borrowerReject`에서 `enforceScope*`/`enforceSiteAccess` 호출이 `assertFsmAction` 및 reason 검증보다 위에 위치 | 소스 라인 순서 grep |
| M3 | `borrowerApprove`/`borrowerReject`: `req.user.teamId` 미존재 또는 `requester.teamId` 불일치 → `ForbiddenException({ code: CheckoutErrorCode.BORROWER_TEAM_ONLY })` | 소스 확인 |
| M4 | `NOTIFICATION_EVENTS`에 `CHECKOUT_BORROWER_APPROVED: 'checkout.borrowerApproved'`, `CHECKOUT_BORROWER_REJECTED: 'checkout.borrowerRejected'` 추가 | grep notification-events.ts |
| M5 | 서버 부트 시 `EVENT_TO_NOTIFICATION_TYPE` 교차 검증 통과 (`checkout_borrower_approved/rejected`가 NOTIFICATION_TYPE_VALUES에 존재) | grep + 로직 확인 |
| M6 | `checkout-response.dto.ts`에 `borrowerApproverId`, `borrowerApprovedAt`, `borrowerRejectionReason` 3개 필드 + @ApiProperty | grep |
| M7 | `checkout-api.ts`에 `borrowerApproveCheckout`/`borrowerRejectCheckout` 함수 export | grep |
| M8 | `checkout-api.ts` `Checkout` 인터페이스에 `borrowerApproverId?`, `borrowerApprovedAt?`, `borrowerRejectionReason?` 3개 필드 | grep |
| M9 | `any` 타입 0건 (변경된 파일 한정) | rg ': any' |
| M10 | Controller decorator에 `Permission.BORROWER_APPROVE_CHECKOUT` / `Permission.BORROWER_REJECT_CHECKOUT` 상수 사용 (문자열 리터럴 금지) | grep |
| M11 | `assertFsmAction(checkout, 'borrower_approve' ...)` / `assertFsmAction(checkout, 'borrower_reject' ...)` FSM 경유 | grep |
| M12 | `CSVal.BORROWER_APPROVED` / `CSVal.REJECTED` 상수 경유 (문자열 'borrower_approved' 하드코딩 금지) | grep |
| M13 | `borrowerApprove`/`borrowerReject`에서 `updateCheckoutStatus` 경유 CAS (`dto.version` 전달) | 소스 확인 |
| M14 | Controller `@AuditLog({ action: 'approve'/'reject', entityType: 'checkout', entityIdPath: 'params.uuid' })` 존재 | grep |
| M15 | `extractUserId(req)`로 approverId 추출 (Rule 2) | 소스 확인 |
| M16 | 기존 호출자(approve/reject/approveReturn/rejectReturn 등) `enforceScopeFromCheckout` 호출 수정 없이 동작 (default 'lender') | 기존 테스트 통과 |
| M17 | `submitConditionCheck` BORROWER_RECEIVE/BORROWER_RETURN → 'borrower', LENDER_CHECKOUT/LENDER_RETURN → 'lender' actingSide | 소스 확인 |
| M18 | `borrowerApprove`/`borrowerReject`: `purpose !== CPVal.RENTAL` → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY) | 소스 확인 |
| M19 | `borrowerReject`의 reason 검증이 scope/FSM/identity 검증 **이후** 위치 | 라인 순서 확인 |
| M20 | `dto/index.ts`에 2개 신규 DTO re-export 추가 | grep |

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | `borrowerApprove` payload에 `nextActor: resolveNextActor(purpose, CSVal.BORROWER_APPROVED)` 포함 |
| S2 | `borrowerReject` payload에 `nextActor: 'none'` |
| S3 | emitAsync await 사용 (listener Promise 시맨틱) |
| S4 | `getCheckoutItemsWithFirstEquipment` 헬퍼 재사용으로 items + firstEquipment 1회 쿼리 |
| S5 | step→actingSide 매핑 상수가 파일 내 SSOT 상수로 선언 (인라인 삼항 금지) |
| S6 | `borrowerApprove`/`borrowerReject` 단위 테스트 4케이스: (a) 정상승인 (b) 비-rental (c) 스코프외 (d) identity 불일치 |
