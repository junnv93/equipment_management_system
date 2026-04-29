# Exec Plan: checkout-step-actor-timestamp

**날짜**: 2026-04-29  
**슬러그**: checkout-step-actor-timestamp  
**모드**: Mode 2 (Full)

## 배경

반출 상세 페이지 진행 흐름 stepper에서 **모든 단계**에 날짜/시간+담당자 표시.
현재 PENDING(done)만 표시되고, APPROVED/BORROWER_APPROVED 등 중간 단계는 buildStepMeta fallback 누락.

## 데이터 갭 분석

| Status | 백엔드 필드 | FE 타입 선언 | buildStepMeta fallback |
|---|---|---|---|
| pending | createdAt + user(requester) | YES | YES (OK) |
| borrower_approved | borrowerApprovedAt, borrowerApproverId | YES | **누락** |
| approved | approvedAt, approverId | YES | **누락** |
| lender_checked | lenderConfirmedAt, lenderConfirmedBy | **FE 타입 누락** | **누락** |
| checked_out | checkoutDate | YES | scheduledAt만 (done 시 timestamp 미사용) |
| in_use | checkoutDate fallback | YES | **누락** |
| borrower_returned | actualReturnDate, returnerId | FE returnerId 누락 | scheduledAt만 |
| returned | actualReturnDate | YES | scheduledAt만 |
| return_approved | returnApprovedAt, returnApprovedBy | YES | scheduledAt만 |

## Phase 1 (MUST): 프론트엔드 데이터 레이어

### 변경 파일

1. **`apps/frontend/lib/api/checkout-api.ts`**
   - Checkout 인터페이스에 누락 필드 추가:
     - `lenderConfirmedAt?: string`
     - `lenderConfirmedBy?: string`
     - `returnerId?: string`
     - `terminatedFromStatus?: CheckoutStatus`
     - `borrowerApprover?: { id: string; name: string; email: string } | null`
     - `approver?: { id: string; name: string; email: string } | null`
     - `lenderConfirmer?: { id: string; name: string; email: string } | null`
     - `returner?: { id: string; name: string; email: string } | null`
     - `returnApprover?: { id: string; name: string; email: string } | null`

2. **`apps/frontend/hooks/use-checkout-progress-steps.ts`**
   - `StepMetaInput`에 신규 timestamp/actor 필드 추가 (12개)
   - `buildStepMeta` switch에 누락된 6개 case 추가:
     - `borrower_approved` → borrowerApprovedAt + borrowerApprover
     - `approved` → approvedAt + approver (또는 approvedBy)
     - `lender_checked` → lenderConfirmedAt (없으면 checkoutDate) + lenderConfirmer
     - `in_use` → checkoutDate fallback
     - `borrower_returned` → actualReturnDate + returner
     - `return_approved` → returnApprovedAt + returnApprover
   - `checked_out`: scheduledAt 유지 + done 시 timestamp=checkoutDate 추가
   - `returned`: scheduledAt 유지 + done 시 timestamp=actualReturnDate 추가
   - audit event 우선순위 유지 (event 있으면 항상 event 우선)

3. **`apps/frontend/components/checkouts/ProgressFlowSection.tsx`**
   - `CheckoutLike` (또는 직접 Props)에 신규 필드 Pick 추가
   - `useCheckoutProgressSteps` 호출에 신규 입력 매핑

## Phase 2 (SHOULD): 백엔드 actor 이름 hydration

### 변경 파일

4. **`apps/backend/src/modules/checkouts/checkouts.service.ts`**
   - `findOne()` 에서 5개 actor user leftJoin/batch fetch 추가:
     - borrowerApprover (borrowerApproverId)
     - approver (approverId)
     - lenderConfirmer (lenderConfirmedBy)
     - returner (returnerId)
     - returnApprover (returnApprovedBy)
   - 응답에 5개 user 객체 (`{id, name, email} | null`) 포함
   - 기존 응답 키 유지 (breaking change 없음)

5. **`apps/frontend/lib/api/checkout-api.ts`** (Phase 1과 동일 파일 — Phase 2 사용분 포함)

## Phase 3/4 (MUST): 렌더링 검증 + SSOT 가드

- `CheckoutProgressStepper.tsx` — 변경 없음, 기존 `timestamp && state !== 'future'` 분기 유지
- CHECKOUT_DISPLAY_STEPS ∪ {rejected, canceled} 합집합이 buildStepMeta를 exhaustively cover하도록 TypeScript 컴파일타임 체크 추가

## 검증 명령어

```bash
# Phase 1 후
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint

# Phase 2 후 (BE)
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --testPathPattern checkouts.service

# 전체
pnpm tsc --noEmit
pnpm lint
pnpm test
```

## 롤백

- Phase별 독립 커밋 → 필요 시 `git revert <sha>` 단계별 원복
- DB 스키마 변경 없음 — migration rollback 불필요
