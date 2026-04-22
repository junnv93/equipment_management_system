# Contract: checkout-fsm-backend (PR-2)

## Scope
`apps/backend/src/modules/checkouts/checkouts.service.ts`에 PR-1 FSM SSOT를 통합.
7개 guard site + `calculateAvailableActions` + `CheckoutWithMeta.meta.nextStep` +
AuditLog + emitAsync `nextActor`.

관련 파일:
- `apps/backend/src/modules/checkouts/checkouts.module.ts` (수정)
- `apps/backend/src/modules/checkouts/checkouts.service.ts` (수정)
- `apps/backend/test/checkouts.fsm.e2e-spec.ts` (신규 ~200 lines)

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | tsc |
| M2 | 기존 `pnpm --filter backend run test -- checkouts` 전부 PASS (error code 변경 회귀 포함) | jest |
| M3 | `pnpm --filter backend run test:e2e -- checkouts.fsm` 신규 테스트 전부 PASS (≥12 케이스) | jest e2e |
| M4 | 7개 guard site 모두 `assertFsmAction` 또는 `canPerformAction` 사용 — `grep -n "assertFsmAction\|canPerformAction(" apps/backend/src/modules/checkouts/checkouts.service.ts` ≥ 8 hits | grep |
| M5 | `calculateAvailableActions` async 제거 — `grep -n "private async calculateAvailableActions" ...` = 0 hits, `grep -n "private calculateAvailableActions" ...` = 1 hit | grep |
| M6 | `CheckoutWithMeta.meta.nextStep` 필드 존재 — `grep -n "nextStep" apps/backend/src/modules/checkouts/checkouts.service.ts` ≥ 1 hit (interface 내부) | grep |
| M7 | `AuditModule`이 `CheckoutsModule.imports`에 추가 — `grep -n "AuditModule" apps/backend/src/modules/checkouts/checkouts.module.ts` ≥ 1 hit | grep |
| M8 | SSOT 준수: `calculateAvailableActions` 내부 `Permission.APPROVE_CHECKOUT\|REJECT_CHECKOUT\|START_CHECKOUT\|CANCEL_CHECKOUT` 하드코딩 0건 (단, `COMPLETE_CHECKOUT`은 `canSubmitConditionCheck` 예외 허용) | grep |
| M9 | 신규 코드에 `any` 타입 0건 — `git diff HEAD -- apps/backend/src/modules/checkouts apps/backend/test/checkouts.fsm.e2e-spec.ts \| grep -E "^\+.*:\s*any\b"` = 0 hits | grep |
| M10 | 기존 7개 error code 제거됨 — `grep -n "CHECKOUT_ONLY_PENDING_CAN_APPROVE\|CHECKOUT_ONLY_PENDING_CAN_REJECT\|CHECKOUT_ONLY_APPROVED_CAN_START\|CHECKOUT_ONLY_CHECKED_OUT_CAN_RETURN\|CHECKOUT_ONLY_RETURNED_CAN_APPROVE\|CHECKOUT_ONLY_RETURNED_CAN_REJECT\|CHECKOUT_ONLY_PENDING_CAN_CANCEL" apps/backend/src/modules/checkouts/checkouts.service.ts` = 0 hits | grep |
| M11 | `update()` 메서드의 `CHECKOUT_ONLY_PENDING_CAN_UPDATE` 체크 유지 (FSM 액션 없음, 범위 외) — `grep -n "CHECKOUT_ONLY_PENDING_CAN_UPDATE" ...` = 1 hit | grep |
| M12 | `getPermissions(` 호출 0건 — `grep -n "getPermissions(" apps/backend/src/modules/checkouts/checkouts.service.ts` = 0 hits (`req.user?.permissions` 사용) | grep |

## SHOULD Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | emitAsync 페이로드에 `nextActor` 포함 (6개 이벤트) — `grep -n "nextActor:" apps/backend/src/modules/checkouts/checkouts.service.ts` ≥ 6 hits | grep |
| S2 | `buildNextStep` private 메서드 존재 — `grep -n "private buildNextStep" ...` = 1 hit | grep |
| S3 | `writeTransitionAudit` 또는 `auditService.create` 호출 (7곳) — `grep -n "writeTransitionAudit\|auditService.create" ...` ≥ 7 hits | grep |
| S4 | `resolveAuditSuffix` 헬퍼 분리 — `grep -n "resolveAuditSuffix\|auditEventSuffix" ...` ≥ 2 hits | grep |
| S5 | `FSM_TO_AUDIT_ACTION` 매핑 테이블 정의 — `grep -n "FSM_TO_AUDIT_ACTION" ...` ≥ 1 hit | grep |
| S6 | E2E 케이스 ≥ 12개 (invalid_transition 5+, forbidden 2+, valid 4+, meta 2) | test count |
| S7 | `cancel()` 시그니처 `req: AuthenticatedRequest` 필수화 (optional 제거) | grep / tsc |
| S8 | `findOne()` 메타에 `nextStep` 포함 — `grep -n "buildNextStep" ...` 호출부 존재 | grep |

## 검증 명령

```bash
# 컴파일
pnpm --filter backend exec tsc --noEmit

# Unit 테스트 (기존 regression)
pnpm --filter backend run test -- checkouts

# E2E 신규 (FSM guard 검증)
pnpm --filter backend run test:e2e -- checkouts.fsm

# Self-audit greps
grep -n "assertFsmAction\|canPerformAction(" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "private async calculateAvailableActions" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "CHECKOUT_ONLY_PENDING_CAN_APPROVE" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "getPermissions(" apps/backend/src/modules/checkouts/checkouts.service.ts
grep -n "nextActor:" apps/backend/src/modules/checkouts/checkouts.service.ts
```

## Out of Scope

- `update()` 메서드: FSM 액션 없음 — 수동 PENDING 체크 유지
- `submitConditionCheck()`: step-based transitions — FSM 미매핑
- Frontend 통합: PR-3+ (`meta.nextStep` 소비자, 에러 코드 매핑)
- i18n 키: PR-8
- NotificationService listener: `nextActor` 소비자는 PR-4+
- `equipment-imports` / `rental-imports` 콜백: 기존 로직 유지

## 리스크

| 리스크 | 완화 |
|--------|------|
| Error code 변경 회귀 | M2 강제, `grep -rn "CHECKOUT_ONLY_" apps/backend/test/` 사전 확인 |
| Identity rule (lender team) FSM 외부 잔존 | calculateAvailableActions AND 결합 + approve() 내 403 체크 유지 |
| AuditAction 유니온 불일치 | `FSM_TO_AUDIT_ACTION` 정적 매핑 + tsc M1 보장 |
| `cancel(req?)` 시그니처 변경 | grep으로 호출자 전수 확인 |
| returnCheckout rental LENDER_RECEIVED 암묵적 허용 | FSM PR-1 invariant 검증 완료 + E2E rental path 케이스 |
