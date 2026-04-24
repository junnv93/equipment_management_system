---
id: reactive-hopping-wolf
title: "타팀 장비 대여(rental) 2-step 승인 워크플로우 아키텍처 개선"
created: 2026-04-24
status: in-progress
root-cause: "rental = lender 단일 주체" 잘못된 도메인 가정
---

# 타팀 장비 대여 워크플로우 전면 개선 계획

## 진단된 Root Cause

"rental은 lender 팀이 단독으로 처리한다"는 초기 설계 가정이 틀렸다.
실제 rental은 **두 주체**가 관여한다:
- **Lender (반출팀)**: 장비 보유·승인·반납 확인
- **Borrower (차용팀)**: 신청·수령·반납

이 가정 오류가 아래 7개 이슈를 동시에 유발했다.

---

## 7개 이슈 목록

| # | 이슈 | 영향 계층 |
|---|------|-----------|
| 1 | `pending → approved` 단일 단계 — borrower 팀 승인 단계 없음 | FSM, 서비스 |
| 2 | `submitConditionCheck`가 step 구분 없이 lender 스코프만 검사 | 서비스 |
| 3 | FSM `assertFsmInvariants`가 rental 경로 불변식 미검증 | FSM |
| 4 | DB에 borrower 승인 이력(approver, timestamp, 사유) 컬럼 없음 | DB 스키마 |
| 5 | `BORROWER_APPROVE/REJECT_CHECKOUT` permission 미정의 | RBAC |
| 6 | scope guard가 borrower 액터 기준 검증 불가 | 스코프 가드 |
| 7 | 알림이 lender 팀에만 발송 — borrower 팀 알림 없음 | 알림 라우팅 |

---

## 구현 Phase 진행 현황

### ✅ Phase 0 — SSOT 확립 (커밋 c59d51c1)
- `Permission.BORROWER_APPROVE/REJECT_CHECKOUT` (shared-constants)
- `CheckoutStatus.BORROWER_APPROVED` (schemas)
- FSM 액션 `borrower_approve`, `borrower_reject` (checkout-fsm.ts)
- 알림 상수 `CHECKOUT_BORROWER_APPROVED/REJECTED` (notification-events.ts)
- i18n 30+ 키 (ko/en checkouts.json)
- 이슈 5 해결

### ✅ Phase 1 — DB 스키마 (커밋 c59d51c1)
- `borrower_approver_id` (uuid, FK → users)
- `borrower_approved_at` (timestamp)
- `borrower_rejection_reason` (text)
- 마이그레이션 0045 적용 완료
- 이슈 4 해결

### ✅ Phase 2 — FSM 전이 (커밋 c59d51c1)
- `pending → borrower_approved → approved` 경로 확립
- `assertFsmInvariants` rental 8단계 불변식
- `computeStepIndex` 시프트 (1-based 8단계)
- 이슈 1, 3 해결

### ✅ Phase 3 — Scope Guard Actor-Side 분기 (커밋 50ad27cb)
- `enforceScopeForBorrower()` private 헬퍼 신설
- `enforceScopeFromCheckout(actingSide: 'lender'|'borrower' = 'lender')` 확장
- `CONDITION_STEP_ACTING_SIDE` 클래스 상수 (step → 'lender'|'borrower')
- `submitConditionCheck`에서 step별 actingSide 자동 결정
- 이슈 2, 6 해결

### ✅ Phase 4 — 서비스 메서드 + API (커밋 50ad27cb)
- `borrowerApprove(uuid, dto, req)` 서비스 메서드
- `borrowerReject(uuid, dto, req)` 서비스 메서드
- 보안 순서: purpose → requester → scope → FSM → identity → reason → CAS
- `PATCH :uuid/borrower-approve`, `PATCH :uuid/borrower-reject` 컨트롤러 라우트
- `BorrowerApproveCheckoutDto`, `BorrowerRejectCheckoutDto` DTO
- `checkout-response.dto.ts` borrower 필드 3개
- `checkout-api.ts` `borrowerApproveCheckout`, `borrowerRejectCheckout` 함수
- 이슈 1 런타임 완결

---

## 🔲 남은 Phase

### Phase 5 — 알림 라우팅 (이슈 7 해결)

**파일**: `apps/backend/src/modules/notifications/config/notification-registry.ts`

`CHECKOUT_BORROWER_APPROVED` 항목 추가:
```typescript
[NOTIFICATION_EVENTS.CHECKOUT_BORROWER_APPROVED]: {
  category: 'checkout',
  priority: 'high',
  titleTemplate: '대여 1차 승인: {{equipmentName}}',
  contentTemplate:
    '{{equipmentName}}({{managementNumber}}) 대여 신청이 차용팀 승인되었습니다. 반출 팀장 최종 승인이 필요합니다.',
  recipientStrategy: {
    type: 'multi',
    strategies: [
      { type: 'actor', field: 'requesterId' },       // 신청자
      { type: 'team', field: 'lenderTeamId' },        // 반출팀 TM 전체
    ],
  },
  linkTemplate: '/checkouts/{{checkoutId}}',
  entityType: 'checkout',
  entityIdField: 'checkoutId',
  equipmentIdField: 'equipmentId',
  emailStrategy: 'immediate',
},
```

`CHECKOUT_BORROWER_REJECTED` 항목 추가:
```typescript
[NOTIFICATION_EVENTS.CHECKOUT_BORROWER_REJECTED]: {
  category: 'checkout',
  priority: 'high',
  titleTemplate: '대여 1차 반려: {{equipmentName}}',
  contentTemplate:
    '{{equipmentName}}({{managementNumber}}) 대여 신청이 차용팀에서 반려되었습니다. 사유: {{reason}}',
  recipientStrategy: { type: 'actor', field: 'requesterId' },
  linkTemplate: '/checkouts/{{checkoutId}}',
  entityType: 'checkout',
  entityIdField: 'checkoutId',
  equipmentIdField: 'equipmentId',
  emailStrategy: 'immediate',
},
```

`approval-sse.listener.ts`에 SSE 핸들러 2개 추가 (CHECKOUT_APPROVED 패턴 복제).

### Phase 6 — 프론트엔드 Detail UI

**파일**: `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`

1. `canBorrowerApprove = can(Permission.BORROWER_APPROVE_CHECKOUT)`
2. `borrowerApproveMutation` + `borrowerRejectMutation` 추가 (approveMutation 패턴)
3. 액션 분기:
   - `PENDING + rental + canBorrowerApprove` → borrower 승인/반려 버튼
   - `BORROWER_APPROVED + canApprove` → lender 최종 승인/반려 버튼 (기존 그대로)
4. Dialog state: `borrowerApprove`, `borrowerReject` boolean 추가
5. i18n: `toasts.borrowerApproveSuccess/Error`, `dialogs.borrowerApproveTitle` 등

### Phase 7 — NextStepPanel borrower_approved 메시지

**파일**: `apps/frontend/hooks/useCheckoutNextStep.ts` (또는 유사 hook)

`BORROWER_APPROVED` 상태일 때 nextStep 메시지:
- 차용팀 TM 시점: "반출 팀장 최종 승인 대기 중"
- 반출팀 TM 시점: "차용 팀 1차 승인 완료 — 최종 승인 필요"

`NextStepPanel` 렌더에서 `borrower_approved` 상태가 정상 표시되는지 확인.

### Phase 8 — PR-5 연계: handleNextStepAction에 borrower 액션 배선

**파일**: `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`

PR-5 exec-plan (`2026-04-24-pr5-checkout-fsm-integration.md`) Phase 3의
`handleNextStepAction` switch에 `borrower_approve`/`borrower_reject` 케이스 추가:
```typescript
case 'borrower_approve':
  setDialogState(prev => ({ ...prev, borrowerApprove: true }));
  break;
case 'borrower_reject':
  setDialogState(prev => ({ ...prev, borrowerReject: true }));
  break;
```

### Phase 9 — tech-debt: borrowerApprove/borrowerReject 유닛 테스트

**파일**: `apps/backend/src/modules/checkouts/checkouts.service.spec.ts`

4 케이스:
- (a) 정상 1차 승인
- (b) 비-rental → `BadRequestException(BORROWER_APPROVE_RENTAL_ONLY)`
- (c) 스코프 외 사용자 → `ForbiddenException`
- (d) `req.user.teamId !== requester.teamId` → `ForbiddenException(BORROWER_TEAM_ONLY)`

기존 `mockReq` fixture + `mockDrizzle.limit(requester user)` 패턴 활용.

### Phase 10 — E2E 통합 검증

rental 2-step 전체 흐름:
1. borrower TM → `/checkouts/create` → rental 신청 (PENDING)
2. borrower TM → `PATCH /borrower-approve` → BORROWER_APPROVED
3. lender TM → `PATCH /approve` → APPROVED
4. 각 단계별 알림 수신 확인
5. borrower TM이 lender 승인 불가 (Permission 게이트)
6. lender TM이 borrower_approve 불가 (BORROWER_TEAM_ONLY)

---

## 보안 불가침 원칙 (모든 Phase 적용)

1. **Scope-먼저**: `enforceScope*` → `assertFsmAction` → 도메인 검증 순서 절대 준수
2. **Identity rule**: `req.user.teamId === requester.teamId` (teamId 없으면 fail-close)
3. **Server-side extraction**: `extractUserId(req)` 경유, body userId 절대 신뢰 금지
4. **SSOT**: Permission/CSVal/FSM action/NOTIFICATION_EVENTS 전부 상수 경유
5. **CAS**: `updateCheckoutStatus(checkout, dto.version, ...)` 경유, 직접 DB 갱신 금지

---

## 참고 파일 위치

| 목적 | 파일 |
|------|------|
| FSM 정의 | `packages/schemas/src/fsm/checkout-fsm.ts` |
| 스코프 가드 | `apps/backend/src/modules/checkouts/checkout-scope.util.ts` |
| 서비스 (Phase 3+4 구현) | `apps/backend/src/modules/checkouts/checkouts.service.ts` |
| 알림 레지스트리 | `apps/backend/src/modules/notifications/config/notification-registry.ts` |
| SSE 리스너 | `apps/backend/src/modules/approvals/approval-sse.listener.ts` |
| Detail UI | `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` |
| PR-5 exec-plan | `.claude/exec-plans/active/2026-04-24-pr5-checkout-fsm-integration.md` |
| tech-debt 추적 | `.claude/exec-plans/tech-debt-tracker.md` |
