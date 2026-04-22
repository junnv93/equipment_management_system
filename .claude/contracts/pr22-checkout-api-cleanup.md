---
slug: pr22-checkout-api-cleanup
type: contract
created: 2026-04-22
---

# Contract: PR-22 Checkout API Cleanup

## Scope
6개 파일, 단일 도메인(checkouts), 기존 패턴 적용.

## Changed Files
1. `apps/frontend/lib/api/checkout-api.ts` — 데드코드 제거 + 레거시 필드 정리 + UpdateCheckoutDto SSOT 정렬
2. `apps/frontend/lib/api/approvals-api.ts` — `checkout.userId` fallback 제거
3. `apps/frontend/lib/utils/checkout-group-utils.ts` — `checkout.location` fallback 제거
4. `apps/frontend/components/equipment/CheckoutHistoryTab.tsx` — `checkout.location` fallback 제거
5. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `checkout.location` fallback 제거
6. `apps/backend/src/modules/checkouts/checkouts.controller.ts` — `verifyHandoverToken`에 `@UseInterceptors(ZodSerializerInterceptor)` 추가

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `getCheckoutSummary()` 함수 완전 제거 | `grep getCheckoutSummary apps/frontend/lib/api/checkout-api.ts` → 0 hits |
| M2 | `Checkout` 인터페이스에서 `userId?`, `location?`, `contactNumber?`, `startDate?`, `approvedById?` 레거시 필드 제거 | grep으로 확인 |
| M3 | `UpdateCheckoutDto`가 백엔드 SSOT와 일치: `destination`, `phoneNumber`, `address`, `reason`, `expectedReturnDate`, `notes`, `version` 필드만 보유 | grep으로 확인 |
| M4 | `checkout.userId` fallback 제거 (approvals-api.ts) | grep으로 확인 |
| M5 | `checkout.location` fallback 3개소 제거 | grep으로 확인 |
| M6 | `verifyHandoverToken` 메서드에 `@UseInterceptors(ZodSerializerInterceptor)` 추가 | grep으로 확인 |
| M7 | Frontend tsc --noEmit PASS | `pnpm --filter frontend run tsc --noEmit` |
| M8 | Backend tsc --noEmit PASS | `pnpm --filter backend run tsc --noEmit` |

## SHOULD Criteria

| # | Criterion | Note |
|---|-----------|------|
| S1 | `CheckoutSummary` 인터페이스 유지 (PaginatedResponse 타입 파라미터로 사용 중) | 제거 금지 |
| S2 | `Checkout.notes?` 레거시 필드 — 사용 여부 재확인 후 판단 | 조심스럽게 처리 |
| S3 | 인접 코드 미수정 (수술적 변경) | CLAUDE.md behavioral guideline |

## Out of Scope
- PR-20 (checkouts.service 변경)
- PR-24 (FSM literal 교체)
- 신규 기능 추가
