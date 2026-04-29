---
slug: rental-phase5-8
title: "rental 2-step 승인 워크플로우 Phase 5~8"
created: 2026-04-24
plan: .claude/plans/reactive-hopping-wolf.md
---

# Contract: rental-phase5-8

## Scope

| Phase | 영역 | 파일 |
|-------|------|------|
| Phase 5 | 알림 라우팅 | notification-registry.ts, approval-sse.listener.ts, checkouts.service.ts |
| Phase 6 | Detail UI | CheckoutDetailClient.tsx |
| Phase 7 | FSM i18n | ko/checkouts.json, en/checkouts.json |
| Phase 8 | handleNextStepAction 배선 | CheckoutDetailClient.tsx |

---

## MUST Criteria (모두 PASS 필요)

### M-1: TypeScript 컴파일
- `pnpm --filter backend run tsc --noEmit` → 에러 0
- `pnpm --filter frontend run tsc --noEmit` → 에러 0

### M-2: 빌드
- `pnpm --filter backend run build` → 성공
- `pnpm --filter frontend run build` → 성공 (또는 tsc PASS 확인으로 대체)

### M-3: Phase 5 — 알림 레지스트리
- `notification-registry.ts`에 `CHECKOUT_BORROWER_APPROVED` 항목 존재
- `notification-registry.ts`에 `CHECKOUT_BORROWER_REJECTED` 항목 존재
- `CHECKOUT_BORROWER_APPROVED`의 recipientStrategy → `type: 'composite'` (requesterId actor + lenderTeamId team)
- `CHECKOUT_BORROWER_REJECTED`의 recipientStrategy → `type: 'actor', field: 'requesterId'`
- 레지스트리 항목에 하드코딩 문자열 상수명 없음 — NOTIFICATION_EVENTS 경유

### M-4: Phase 5 — SSE 리스너
- `APPROVAL_AFFECTING_EVENTS` 배열에 `CHECKOUT_BORROWER_APPROVED` 포함
- `APPROVAL_AFFECTING_EVENTS` 배열에 `CHECKOUT_BORROWER_REJECTED` 포함

### M-5: Phase 5 — 서비스 payload
- `checkouts.service.ts` borrowerApprove emitAsync payload에 `lenderTeamId` 필드 존재
- `lenderTeamId` 값이 `checkout.lenderTeamId` 경유 (하드코딩 금지)

### M-6: Phase 6 — Permission SSOT
- `canBorrowerApprove = can(Permission.BORROWER_APPROVE_CHECKOUT)` 존재 (문자열 리터럴 금지)

### M-7: Phase 6 — 상태 비교 SSOT
- borrower 액션 분기에서 `CSVal.PENDING`, `CSVal.BORROWER_APPROVED`, `CPVal.RENTAL` 사용 (문자열 리터럴 금지)

### M-8: Phase 6 — Mutation 존재
- `borrowerApproveMutation` (useOptimisticMutation) 존재
- `borrowerRejectMutation` (useOptimisticMutation) 존재
- 각각 `checkoutApi.borrowerApproveCheckout`, `checkoutApi.borrowerRejectCheckout` 호출

### M-9: Phase 6 — Dialog 상태
- `dialogState`에 `borrowerApprove`, `borrowerReject` boolean 필드 존재
- borrower 반려 Dialog에 `borrowerRejectReason` 텍스트 입력 상태 존재

### M-10: Phase 7 — i18n 갭 없음
- `ko/checkouts.json` `fsm.action.borrower_approve` 키 존재 (빈 문자열 금지)
- `ko/checkouts.json` `fsm.hint.pendingBorrowerApprove` 키 존재
- `en/checkouts.json` 동일 2개 키 존재
- `ko/checkouts.json` `dialogs.borrowerApproveTitle` 등 borrower Dialog 키 6개 존재
- `en/checkouts.json` 동일 6개 키 존재

### M-11: Phase 8 — handleNextStepAction 배선
- `handleNextStepAction` switch에 `case 'borrower_approve':` 존재
- `handleNextStepAction` switch에 `case 'borrower_reject':` 존재
- 각 케이스에서 dialogState를 열도록 setDialogState 호출

### M-12: 보안 — setQueryData 금지
- mutation onSuccess에서 `setQueryData` 호출 없음
- version increment: `(old?.version ?? checkout.version) + 1` 패턴 사용

---

## SHOULD Criteria (실패해도 루프 차단 없음)

### S-1: LegacyActionsBlock 버튼 추가
- PENDING + rental + canBorrowerApprove → 1차 승인/반려 버튼 렌더
- BORROWER_APPROVED + canApprove → 기존 lender 최종 승인/반려 버튼 (기존 로직 유지)

### S-2: isAnyNextStepMutationPending 업데이트
- `borrowerApproveMutation.isPending || borrowerRejectMutation.isPending` 포함

### S-3: 접근성
- borrower Dialog에 `aria-required`, `aria-invalid` 속성 존재

---

## Out of Scope

- Phase 9: borrowerApprove/borrowerReject 유닛 테스트 (tech-debt-tracker 등록됨)
- Phase 10: E2E 통합 검증 (다음 세션)
- PR-5 본체 구현 (별도 exec-plan)
