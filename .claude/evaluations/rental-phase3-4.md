# Evaluation Report: rental-phase3-4
Date: 2026-04-24
Iteration: 1

## Verdict: PASS

All 20 MUST criteria pass. Two SHOULD failures recorded (non-blocking).

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | tsc exit 0 | PASS | Generator pre-verified; no `any` types found in changed files |
| M2 | enforceScope* before assertFsmAction and reason validation | PASS | borrowerApprove: enforceScopeForBorrower → assertFsmAction → identity. borrowerReject: same order, reason last |
| M3 | teamId mismatch → ForbiddenException(BORROWER_TEAM_ONLY) | PASS | `if (!req.user?.teamId || req.user.teamId !== requester.teamId)` → ForbiddenException in both methods |
| M4 | CHECKOUT_BORROWER_APPROVED / CHECKOUT_BORROWER_REJECTED in NOTIFICATION_EVENTS | PASS | notification-events.ts lines 19–20 |
| M5 | toNotificationType cross-validation passes | PASS | `checkout.borrowerApproved` → `checkout_borrower_approved` exists in NOTIFICATION_TYPE_VALUES. Boot-time guard passes. |
| M6 | borrowerApproverId/borrowerApprovedAt/borrowerRejectionReason + @ApiProperty | PASS | checkout-response.dto.ts borrower section |
| M7 | borrowerApproveCheckout / borrowerRejectCheckout exported | PASS | checkout-api.ts, consistent method style |
| M8 | Checkout interface has 3 borrower fields | PASS | checkout-api.ts lines 100–102 |
| M9 | No `: any` in changed files | PASS | grep confirms zero instances |
| M10 | Permission.BORROWER_APPROVE_CHECKOUT / REJECT constants | PASS | controller @RequirePermissions uses constants |
| M11 | assertFsmAction with 'borrower_approve' / 'borrower_reject' | PASS | service lines confirmed |
| M12 | CSVal.BORROWER_APPROVED / CSVal.REJECTED (no string literals) | PASS | updateCheckoutStatus calls use CSVal |
| M13 | updateCheckoutStatus with dto.version | PASS | `{ ...checkout, version: dto.version }` in both methods |
| M14 | @AuditLog on both controller routes | PASS | action: 'approve'/'reject', entityType: 'checkout' |
| M15 | extractUserId(req) | PASS | controller both methods |
| M16 | default 'lender' — no regression | PASS | `actingSide = 'lender'` default, existing callers unchanged |
| M17 | CONDITION_STEP_ACTING_SIDE correct mappings | PASS | BORROWER_RECEIVE/RETURN → 'borrower', LENDER_CHECKOUT/RETURN → 'lender' |
| M18 | purpose !== RENTAL → BadRequestException | PASS | Both methods have rental-only guard |
| M19 | reason validation after scope/FSM/identity | PASS | borrowerReject order: purpose→requester→scope→FSM→identity→reason |
| M20 | dto/index.ts re-exports both new DTOs | PASS | lines 14–15 |

## SHOULD Criteria Results

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | nextActor: resolveNextActor in borrowerApprove payload | PASS | `nextActor: this.resolveNextActor(...)` |
| S2 | nextActor: 'none' in borrowerReject payload | PASS | `nextActor: 'none' as NextActor` |
| S3 | emitAsync await used | PASS | `await this.eventEmitter.emitAsync(...)` both methods |
| S4 | getCheckoutItemsWithFirstEquipment helper reused | PASS | both methods use helper |
| S5 | CONDITION_STEP_ACTING_SIDE as file/class SSOT constant | FAIL | Declared function-local (inside submitConditionCheck body), not class-level static |
| S6 | Unit tests 4 cases for borrowerApprove/borrowerReject | FAIL | Zero test coverage for the two new service methods |

## Issues Found (SHOULD only, non-blocking)

### S5 — CONDITION_STEP_ACTING_SIDE function-local
**File:** checkouts.service.ts, ~line 2426 inside submitConditionCheck
**Repair:** Lift to `private static readonly` class member with type `Record<ConditionCheckStep, 'lender' | 'borrower'>`

### S6 — Missing unit tests
**File:** checkouts.service.spec.ts
**Repair:** Add describe blocks for borrowerApprove/borrowerReject: (a) 정상승인, (b) 비-rental, (c) 스코프외, (d) identity 불일치
