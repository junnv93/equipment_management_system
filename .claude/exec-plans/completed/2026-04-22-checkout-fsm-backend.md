# Exec Plan: checkout-fsm-backend (PR-2)

**날짜**: 2026-04-22
**슬러그**: checkout-fsm-backend
**모드**: Mode 2 (Full — SSOT 통합 + AuditLog 연결 + E2E 신규)

---

## Scope

PR-1에서 도입한 `@equipment-management/schemas`의 FSM SSOT를 백엔드 가드/메타 계산에 전면 적용한다.

| # | 영역 | 변경 메커니즘 |
|---|------|--------------|
| 1 | 상태전이 가드 7곳 | `canPerformAction(checkout, action, userPermissions)` 위임 |
| 2 | `calculateAvailableActions` | Permission 하드코딩 맵 → FSM 호출 + identity-rule 보강 |
| 3 | `CheckoutWithMeta.meta.nextStep` | 신규 필드 `NextStepDescriptor` 포함 |
| 4 | AuditLog | FSM `auditEventSuffix` 기반 각 전이 성공 후 기록 |
| 5 | emitAsync payload | `nextActor` 필드 추가 (FSM `getTransitionsFor` 파생) |
| 6 | E2E 검증 | `checkouts.fsm.e2e-spec.ts` 신규 |

**범위 외**:
- `update()` (FSM 액션 없음 — 수동 PENDING 체크 유지)
- `submitConditionCheck()` (step-based transitions, FSM 액션 미대응)
- Frontend 연동 (PR-3~)
- i18n 키 (PR-8)

---

## Architecture Decision

### 1. Permission 브리지
컨트롤러 `req.user.permissions`(line 311)가 이미 JWT에서 추출되어 서비스로 전달 가능.
서비스 내부에서 `getPermissions(role)` **재호출 금지** — `req.user?.permissions ?? []`를 지역 상수로 보관.

```typescript
const userPermissions: readonly string[] = req.user?.permissions ?? [];
this.assertFsmAction(checkout, 'approve', userPermissions);
```

### 2. `assertFsmAction` 헬퍼
```typescript
private assertFsmAction(
  checkout: Pick<Checkout, 'status' | 'purpose'>,
  action: CheckoutAction,
  userPermissions: readonly string[],
): void {
  const check = canPerformAction(checkout, action, userPermissions);
  if (check.ok) return;
  const code =
    check.reason === 'invalid_transition'
      ? 'CHECKOUT_INVALID_TRANSITION'
      : 'CHECKOUT_FORBIDDEN';
  const message =
    check.reason === 'invalid_transition'
      ? `Action "${action}" not allowed from status "${checkout.status}" (purpose: ${checkout.purpose})`
      : `Missing required permission for action "${action}"`;
  throw new BadRequestException({ code, message });
}
```

기존 에러 코드 `CHECKOUT_ONLY_PENDING_CAN_APPROVE` 등 7종 → `CHECKOUT_INVALID_TRANSITION` / `CHECKOUT_FORBIDDEN` 2종으로 통일.

### 3. Identity rule 보강 (`calculateAvailableActions`)
FSM은 role 기반 permission만 검사. rental approve의 `lenderTeamId === userTeamId` 같은 **identity rule**은 FSM 외부에서 AND 결합:

```typescript
private calculateAvailableActions(
  checkout: Checkout,
  userPermissions: readonly string[],
  userTeamId?: string,
): CheckoutAvailableActions {
  const baseCanApprove = canPerformAction(checkout, 'approve', userPermissions).ok;
  const lenderTeamOk =
    checkout.purpose !== CPVal.RENTAL ||
    !checkout.lenderTeamId ||
    checkout.lenderTeamId === userTeamId;

  return {
    canApprove: baseCanApprove && lenderTeamOk,
    canReject: canPerformAction(checkout, 'reject', userPermissions).ok,
    canStart: canPerformAction(checkout, 'start', userPermissions).ok,
    canReturn: canPerformAction(checkout, 'submit_return', userPermissions).ok,
    canApproveReturn: canPerformAction(checkout, 'approve_return', userPermissions).ok,
    canRejectReturn: canPerformAction(checkout, 'reject_return', userPermissions).ok,
    canCancel: canPerformAction(checkout, 'cancel', userPermissions).ok,
    // step-based (FSM 미매핑) — 기존 로직 유지
    canSubmitConditionCheck:
      checkout.purpose === CPVal.RENTAL &&
      ([CSVal.APPROVED, CSVal.LENDER_CHECKED, CSVal.BORROWER_RECEIVED, CSVal.BORROWER_RETURNED] as string[]).includes(checkout.status) &&
      userPermissions.includes(Permission.COMPLETE_CHECKOUT),
  };
}
```

`async` 제거 — DB 조회 없음. 호출 지점(`findOne` line 864-876)도 `await` 제거.

### 4. NextStep 메타 + buildNextStep
```typescript
export interface CheckoutWithMeta extends Checkout {
  meta: {
    availableActions: CheckoutAvailableActions;
    nextStep: NextStepDescriptor;  // ← 신규
  };
}

private buildNextStep(
  checkout: Checkout,
  userPermissions: readonly string[],
): NextStepDescriptor {
  return getNextStep(checkout, userPermissions);
}
```

### 5. AuditLog 연결
AuditModule은 `@Global()` + `exports: [AuditService]` 이미 존재 → CheckoutsModule.imports에만 추가.
`FSM_TO_AUDIT_ACTION` 정적 매핑 테이블로 CheckoutAction → AuditAction 변환.

```typescript
private static readonly FSM_TO_AUDIT_ACTION: Record<CheckoutAction, AuditAction> = {
  approve: 'approve',
  reject: 'reject',
  cancel: 'cancel',
  start: 'checkout',
  lender_check: 'checkout',
  borrower_receive: 'checkout',
  mark_in_use: 'checkout',
  borrower_return: 'return',
  lender_receive: 'return',
  submit_return: 'return',
  approve_return: 'approve',
  reject_return: 'reject',
};

private resolveAuditSuffix(
  checkout: Pick<Checkout, 'status' | 'purpose'>,
  action: CheckoutAction,
): string {
  const rule = CHECKOUT_TRANSITIONS.find(
    (t) =>
      t.from === checkout.status &&
      t.action === action &&
      (t.purposes.length === 0 || t.purposes.includes(checkout.purpose)),
  );
  return rule?.auditEventSuffix ?? 'unknown';
}

private async writeTransitionAudit(
  checkout: Pick<Checkout, 'status' | 'purpose' | 'reason'>,
  action: CheckoutAction,
  entityId: string,
  nextStatus: CheckoutStatus,
  req: AuthenticatedRequest,
): Promise<void> {
  await this.auditService.create({
    userId: req.user?.userId ?? null,
    userName: req.user?.name ?? 'system',
    userRole: (req.user?.role ?? 'system') as AuditLogUserRole,
    action: CheckoutsService.FSM_TO_AUDIT_ACTION[action],
    entityType: 'checkout' as AuditEntityType,
    entityId,
    entityName: checkout.reason ?? undefined,
    details: {
      fsmEvent: `checkout.${this.resolveAuditSuffix(checkout, action)}`,
      from: checkout.status,
      to: nextStatus,
      purpose: checkout.purpose,
    },
    userSite: req.user?.site,
    userTeamId: req.user?.teamId,
  });
}
```

### 6. emitAsync nextActor

```typescript
private resolveNextActor(
  purpose: Checkout['purpose'],
  nextStatus: CheckoutStatus,
): NextActor {
  const next = getTransitionsFor(nextStatus, purpose);
  return next[0]?.nextActor ?? 'none';
}
```

각 emitAsync payload에 `nextActor: this.resolveNextActor(checkout.purpose, CSVal.APPROVED)` 추가.

---

## 파일 목록

| Phase | 파일 | 변경 유형 |
|-------|------|----------|
| 1 | `apps/backend/src/modules/checkouts/checkouts.module.ts` | 수정 — AuditModule import |
| 2 | `apps/backend/src/modules/checkouts/checkouts.service.ts` | 수정 — 7 guard + helpers + calculateAvailableActions + buildNextStep + CheckoutWithMeta + AuditService 주입 |
| 3 | `apps/backend/test/checkouts.fsm.e2e-spec.ts` | 신규 ~200 lines |

---

## Phase 1 — AuditModule 배선

**파일**: `apps/backend/src/modules/checkouts/checkouts.module.ts`

```typescript
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    EquipmentModule,
    TeamsModule,
    CacheModule,
    AuditModule,   // ← 추가
    forwardRef(() => EquipmentImportsModule),
  ],
})
```

**검증**: `pnpm --filter backend exec tsc --noEmit`

---

## Phase 2 — 서비스 FSM 통합

**파일**: `apps/backend/src/modules/checkouts/checkouts.service.ts`

### 2.1 Imports 확장
```typescript
import {
  canPerformAction,
  getNextStep,
  getTransitionsFor,
  CHECKOUT_TRANSITIONS,
  type CheckoutAction,
  type NextActor,
  type NextStepDescriptor,
} from '@equipment-management/schemas';
import { AuditService } from '../audit/audit.service';
import type { AuditAction, AuditEntityType, AuditLogUserRole } from '@equipment-management/schemas';
```

### 2.2 Constructor — AuditService 주입
기존 constructor 파라미터 뒤에 `private readonly auditService: AuditService` 추가.

### 2.3 CheckoutWithMeta 확장
`meta.nextStep: NextStepDescriptor` 필드 추가.

### 2.4 Private 헬퍼 4종 신규
- `assertFsmAction(checkout, action, permissions): void`
- `resolveAuditSuffix(checkout, action): string`
- `resolveNextActor(purpose, nextStatus): NextActor`
- `buildNextStep(checkout, permissions): NextStepDescriptor`
- `writeTransitionAudit(checkout, action, entityId, nextStatus, req): Promise<void>`

정적 필드: `FSM_TO_AUDIT_ACTION: Record<CheckoutAction, AuditAction>`

### 2.5 `calculateAvailableActions` 재구현
- `async` → sync (return type `CheckoutAvailableActions`, no `Promise`)
- 7개 액션 → `canPerformAction` 위임
- `canSubmitConditionCheck` 기존 로직 유지 (step-based)
- `findOne()` 호출부 `await` 제거

### 2.6 Guard 7곳 치환

| 메서드 | 교체 전 | 교체 후 |
|--------|---------|--------|
| `approve` (L1302) | `if (checkout.status !== CSVal.PENDING) throw BadRequest(CHECKOUT_ONLY_PENDING_CAN_APPROVE)` | `this.assertFsmAction(checkout, 'approve', userPermissions)` |
| `reject` (L1413) | `if (checkout.status !== CSVal.PENDING) throw BadRequest(CHECKOUT_ONLY_PENDING_CAN_REJECT)` | `this.assertFsmAction(checkout, 'reject', userPermissions)` |
| `startCheckout` (L1495) | `if (checkout.status !== CSVal.APPROVED) throw BadRequest(CHECKOUT_ONLY_APPROVED_CAN_START)` | `this.assertFsmAction(checkout, 'start', userPermissions)` |
| `returnCheckout` (L1602) | `if (checkout.status !== CSVal.CHECKED_OUT) throw BadRequest(CHECKOUT_ONLY_CHECKED_OUT_CAN_RETURN)` | `this.assertFsmAction(checkout, 'submit_return', userPermissions)` — rental LENDER_RECEIVED도 자동 허용 |
| `approveReturn` (L1738) | `if (checkout.status !== CSVal.RETURNED) throw BadRequest(CHECKOUT_ONLY_RETURNED_CAN_APPROVE)` | `this.assertFsmAction(checkout, 'approve_return', userPermissions)` |
| `rejectReturn` (L1840) | `if (checkout.status !== CSVal.RETURNED) throw BadRequest(CHECKOUT_ONLY_RETURNED_CAN_REJECT)` | `this.assertFsmAction(checkout, 'reject_return', userPermissions)` |
| `cancel` (L2145) | `if (checkout.status !== CSVal.PENDING) throw BadRequest(CHECKOUT_ONLY_PENDING_CAN_CANCEL)` | `this.assertFsmAction(checkout, 'cancel', userPermissions)` |

각 `userPermissions = req.user?.permissions ?? []` (지역 상수).

`cancel(req?)` → `cancel(req: AuthenticatedRequest)` 필수화 (audit log userId 보장).
`remove()` 호출부도 req 전달 확인.

### 2.7 AuditLog + nextActor 추가

각 전이 성공 직후:
```typescript
const updated = await this.updateCheckoutStatus(...);  // 또는 updateWithVersion

await this.writeTransitionAudit(checkout, 'approve', uuid, CSVal.APPROVED, req);

const affectedTeams = await this.getAffectedTeamIds(checkout);
await this.invalidateCache(affectedTeams.length > 0 ? affectedTeams : undefined, uuid);

await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CHECKOUT_APPROVED, {
  // ...기존 필드
  nextActor: this.resolveNextActor(checkout.purpose, CSVal.APPROVED as CheckoutStatus),
  timestamp: new Date(),
});
```

**검증**:
```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run test -- checkouts
grep -n "checkout\.status !== CSVal\." apps/backend/src/modules/checkouts/checkouts.service.ts
# update()의 1개만 남아야 함
```

---

## Phase 3 — E2E 신규

**파일**: `apps/backend/test/checkouts.fsm.e2e-spec.ts`

### 테스트 케이스 (≥12개)

**A. invalid_transition (5+개):**
1. pending 상태에서 `start` → 400 CHECKOUT_INVALID_TRANSITION
2. pending 상태에서 `submit_return` → 400 CHECKOUT_INVALID_TRANSITION
3. pending 상태에서 `approve_return` → 400 CHECKOUT_INVALID_TRANSITION
4. approved 상태에서 `approve` (재승인) → 400 CHECKOUT_INVALID_TRANSITION
5. returned 상태에서 `approve` 재시도 → 400 CHECKOUT_INVALID_TRANSITION

**B. permission denied (2+개):**
6. test_engineer가 pending에 `approve` → 400 CHECKOUT_FORBIDDEN
7. test_engineer가 returned에 `approve_return` → 400 CHECKOUT_FORBIDDEN

**C. 올바른 흐름 (calibration end-to-end):**
8. pending → approve → 200
9. approved → start (calibration) → 201
10. checked_out → submit_return → 201
11. returned → approve_return → 200

**D. NextStep 메타 스냅샷:**
12. pending GET → `meta.nextStep.nextAction === 'approve'`, `nextActor === 'logistics'`
13. return_approved GET → `meta.nextStep.nextAction === null`, `nextActor === 'none'`

---

## Build Sequence

- [ ] **Phase 1** AuditModule imports 추가 → `tsc --noEmit` 통과
- [ ] **Phase 2.1-2.4** imports / constructor / CheckoutWithMeta / 헬퍼 5종 → `tsc` 통과
- [ ] **Phase 2.5** calculateAvailableActions async 제거 + findOne await 제거 → `tsc` 통과
- [ ] **Phase 2.6** guard 7곳 치환 → `grep "checkout.status !== CSVal"` = update() 1곳만
- [ ] **Phase 2.7** AuditLog + emitAsync nextActor → `pnpm --filter backend run test -- checkouts`
- [ ] **Phase 3** E2E 신규 → `pnpm --filter backend run test:e2e -- checkouts.fsm`
- [ ] **커밋**: `feat(checkouts): integrate FSM SSOT — guards + meta.nextStep + audit + nextActor (PR-2)`

---

## Critical Notes

- **returnCheckout** rental `LENDER_RECEIVED` 자동 허용 — FSM 테이블에 `submit_return: lender_received → returned (RENTAL)` 등록되어 있음
- **CAS layer 분리** — FSM은 전이 가능성만 판정, 낙관적 락은 `updateWithVersion` 별개 레이어
- **AuditLog 실패 non-blocking** — `AuditService.create` 내부에서 tx 미주입 시 catch/log
- **`meta.nextStep` additive** — 프론트엔드 기존 코드 영향 없음, PR-3+에서 소비
- **Error code 변경 회귀 주의** — 기존 e2e에서 `CHECKOUT_ONLY_*` 코드 체크하는 테스트 있으면 수정 필요

```bash
# 사전 영향도 확인
grep -rn "CHECKOUT_ONLY_" apps/backend/test/
```
