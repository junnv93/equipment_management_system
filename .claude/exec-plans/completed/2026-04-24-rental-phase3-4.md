---
slug: rental-phase3-4
type: exec-plan
date: 2026-04-24
status: active
depends_on: c59d51c1 (Phase 0~2 SSOT established)
---

# Exec Plan: Rental Phase 3+4 — Scope Guard Actor-Side Branching & Borrower Approval Endpoint

## Goal

대여(rental) 2-step 승인 워크플로우의 런타임 완결: (1) 스코프 가드를 borrower 액터 기준으로 분기시켜 차용 팀 TM이 자신의 scope에서 FSM 검증 받게 만들고 (2) `borrowerApprove` / `borrowerReject` 서비스 + 라우트 + DTO + 알림 이벤트 + 프론트 API 클라이언트를 추가하여 `pending → borrower_approved → approved` 경로를 완성한다.

## Security Invariants (불가침)

1. **Scope-먼저 원칙**: `enforceScope*` 호출이 FSM(`assertFsmAction`)·도메인 검증(reason trim, CAS)보다 먼저 실행
2. **Identity rule**: borrower 메서드는 `req.user.teamId === requester.teamId` 강제. 미존재 시 ForbiddenException
3. **Server-side extraction**: approverId는 `extractUserId(req)` 경유. Rule 2
4. **SSOT**: Permission/CheckoutStatus/FSM action/NotificationEvent 전부 상수 경유. 문자열 리터럴 금지
5. **CAS**: `updateCheckoutStatus` 경유 `dto.version` 기반 optimistic lock

## Phase 3: Scope Guard Actor-Side Branching

### P3-1. checkouts.service.ts — `enforceScopeForBorrower` 추가 (line 1064 이후)

private 헬퍼. rental 전용. requesterSite/requesterTeamId 받아 `enforceSiteAccess` 1회 호출.

```
private enforceScopeForBorrower(
  checkout: { purpose: string },
  requesterSite: string,
  requesterTeamId: string | null,
  req: AuthenticatedRequest
): void
```

### P3-2. checkouts.service.ts — `enforceScopeFromCheckout` 에 `actingSide` 추가

기존 시그니처에 `actingSide: 'lender' | 'borrower' = 'lender'` 추가.
- 'borrower' + rental: users 테이블 join 1회로 requesterId → { site, teamId } 조회 후 `enforceScopeForBorrower`
- 'borrower' + 비-rental: BadRequestException

### P3-3. checkouts.service.ts — `submitConditionCheck` 스코프 분기

step→actingSide 상수 맵 파일 상단에 선언:
```
const CONDITION_STEP_ACTING_SIDE: Record<string, 'lender' | 'borrower'> = {
  [CCSVal.LENDER_CHECKOUT]: 'lender',
  [CCSVal.BORROWER_RECEIVE]: 'borrower',
  [CCSVal.BORROWER_RETURN]: 'borrower',
  [CCSVal.LENDER_RETURN]: 'lender',
};
```
line 2151 호출부를 `await this.enforceScopeFromCheckout(checkout, req, CONDITION_STEP_ACTING_SIDE[dto.step] ?? 'lender')` 로 교체.

## Phase 4: Service Methods + DTOs + Routes + Events + Frontend

### NF-1. dto/borrower-approve-checkout.dto.ts (신규)

approve-checkout.dto.ts 미러. `borrowerApproveCheckoutSchema = z.object({ ...versionedSchema, notes: z.string().optional() })`.

### NF-2. dto/borrower-reject-checkout.dto.ts (신규)

reject-checkout.dto.ts 미러. `borrowerRejectCheckoutSchema = z.object({ ...versionedSchema, reason: z.string().min(1, VM.approval.rejectReason.required) })`.

### MF-1. dto/index.ts — 2줄 추가

`export * from './borrower-approve-checkout.dto'` + `export * from './borrower-reject-checkout.dto'`

### MF-2. checkout-error-codes.ts — 에러 코드 2개 추가

`BORROWER_APPROVE_RENTAL_ONLY: 'CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY'`
`BORROWER_TEAM_ONLY: 'CHECKOUT_BORROWER_TEAM_ONLY'`

### MF-3. notification-events.ts — 이벤트 상수 2개 추가 (CHECKOUT_REJECTED 직후)

`CHECKOUT_BORROWER_APPROVED: 'checkout.borrowerApproved'`
`CHECKOUT_BORROWER_REJECTED: 'checkout.borrowerRejected'`

→ `toNotificationType`으로 `checkout_borrower_approved/rejected` 변환 = Phase 0 SSOT 교차 검증 통과.

### MF-4. checkouts.service.ts — `borrowerApprove` 신설 (approve() 직후)

실행 순서:
1. validateUuid x2
2. findOne
3. purpose !== RENTAL → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY)
4. users join 1회 → { site, teamId } (requesterId 기준)
5. **enforceScopeForBorrower** ← scope 먼저
6. assertFsmAction(checkout, 'borrower_approve', permissions) ← FSM
7. identity rule: req.user.teamId !== requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY)
8. items + firstEquipment 조회 (알림용)
9. CAS: updateCheckoutStatus → CSVal.BORROWER_APPROVED, borrowerApproverId, borrowerApprovedAt
10. writeTransitionAudit('borrower_approve', ...)
11. invalidateCache
12. emitAsync CHECKOUT_BORROWER_APPROVED (nextActor: resolveNextActor)
13. return updated

### MF-5. checkouts.service.ts — `borrowerReject` 신설 (borrowerApprove 직후)

실행 순서:
1-7: borrowerApprove와 동일
8. reason trim 검증 (scope/FSM/identity 이후!) ← 보안 fail-close 순서
9. items + firstEquipment 조회
10. CAS: updateCheckoutStatus → CSVal.REJECTED, borrowerApproverId, borrowerRejectionReason
11. writeTransitionAudit, invalidateCache
12. emitAsync CHECKOUT_BORROWER_REJECTED (nextActor: 'none')
13. return updated

### MF-6. checkouts.controller.ts — 라우트 2개 (reject 직후)

`PATCH :uuid/borrower-approve` — Permission.BORROWER_APPROVE_CHECKOUT, BorrowerApproveCheckoutValidationPipe, @AuditLog approve
`PATCH :uuid/borrower-reject` — Permission.BORROWER_REJECT_CHECKOUT, BorrowerRejectCheckoutValidationPipe, @AuditLog reject

### MF-7. dto/checkout-response.dto.ts — borrower 필드 3개

`borrowerApproverId?: string | null`, `borrowerApprovedAt?: Date | null`, `borrowerRejectionReason?: string | null`

### MF-8. frontend/lib/api/checkout-api.ts — Checkout 인터페이스 + 함수 2개

인터페이스에 `borrowerApproverId?: string`, `borrowerApprovedAt?: string`, `borrowerRejectionReason?: string` 추가.
함수: `borrowerApproveCheckout(id, version, notes?)`, `borrowerRejectCheckout(id, version, reason)`.

## Verification Commands

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm tsc --noEmit
pnpm --filter backend run test -- --testPathPattern=checkouts
```
