# verify-implementation Report — tech-debt-residual

## Summary

| verify-* | 대상 파일 | 상태 | 이슈 수 |
|----------|----------|------|---------|
| verify-hardcoding | self-inspections.controller.ts | PASS | 0 |
| verify-hardcoding | checkouts.service.ts | PASS | 0 |
| verify-ssot | self-inspections.controller.ts | PASS | 0 |
| verify-ssot | checkouts.service.ts | PASS | 0 |
| verify-ssot | rental-phase.ts | PASS | 0 |
| verify-auth | self-inspections.controller.ts | PASS | 0 |
| verify-checkout-fsm | checkouts.service.ts | PASS | 0 |
| verify-checkout-fsm | rental-phase.ts | PASS | 0 |
| verify-frontend-state | CheckoutGroupCard.tsx | PASS | 0 |
| verify-design-tokens | CheckoutGroupCard.tsx | PASS | 0 |

## Per-file Results

### 1. `apps/backend/src/modules/self-inspections/self-inspections.controller.ts`

**verify-auth: PASS**
- line 286: `req.user?.roles?.some((r) => r === UserRoleValues.SYSTEM_ADMIN || r === UserRoleValues.TECHNICAL_MANAGER)` — SSOT 상수 비교, 리터럴 비교 없음.
- `roles.some()` 패턴으로 다중 역할 지원, fail-close(`?? false`) 적용.

**verify-ssot: PASS**
- line 28: `import { UserRoleValues } from '@equipment-management/schemas';` — packages 경유 import 확인.
- 로컬 재정의(`type UserRole = ...`, `const ROLES = ...` 등) 0건.

**verify-hardcoding: PASS**
- `'system_admin'`, `'technical_manager'` 문자열 리터럴 잔존 0건.
- 전 scope에서 `UserRoleValues.SYSTEM_ADMIN`, `UserRoleValues.TECHNICAL_MANAGER` 상수 경유.

---

### 2. `apps/backend/src/modules/checkouts/checkouts.service.ts`

**verify-hardcoding: PASS**
- `'5 minutes'`, `"5 minutes"` 문자열 잔존 0건.
- line 3209: `` `Approval can only be revoked within ${APPROVAL_REVOCATION_WINDOW_MS / 60_000} minutes of approval` `` — 동적 계산으로 교체 완료.

**verify-ssot: PASS**
- line 54: `APPROVAL_REVOCATION_WINDOW_MS` import 위치 확인 → `from '@equipment-management/shared-constants'` 블록 내에 포함.
- `packages/shared-constants/src/business-rules.ts` line 185에 단일 정의(`export const APPROVAL_REVOCATION_WINDOW_MS = 300_000`). 모듈·apps 레벨 로컬 재정의 0건.

**verify-checkout-fsm: PASS**
- revokeApproval 로직 순서: `① scope(enforceScopeFromCheckout)` → `② FSM(approved 상태 체크)` → `③ 시간 윈도우(APPROVAL_REVOCATION_WINDOW_MS)` → `④ domain(approverId 일치)`.
- 보안 fail-close 순서(scope → FSM → domain) 준수.
- line 3177 주석에 `✅ fail-close 순서: scope → FSM(approved+5분) → domain(approvedBy===approverId)` 명시.

---

### 3. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`

**verify-frontend-state: PASS**
- `role` 변수: line 106 `const role = (session?.user?.role as UserRole | undefined) ?? 'test_engineer';` — useSession 경유, 단일 선언.
- compact mode (line 330): `<NextStepPanel variant="compact" descriptor={rentalDescriptor} currentUserRole={role} />`
- expanded mode (line 489): `<NextStepPanel variant="compact" descriptor={row.descriptor} currentUserRole={role} ... />` — 두 호출부 모두 동일 `role` 변수 전달, parity 완성.
- `role` 이중관리(useState 별도 선언 등) 0건.

**verify-checkout-fsm: PASS**
- `currentUserRole` prop 추가는 NextStepPanel의 UI 렌더링 결정에만 영향.
- FSM 상태 전이·scope 검증은 서버 측에서 수행 — 클라이언트 prop이 FSM 결정 로직에 영향 없음.

**verify-design-tokens: PASS**
- 이번 변경은 `currentUserRole={role}` prop 추가만 (line 327→330 위치 이동 포함), 신규 인라인 Tailwind 클래스 추가 0건.
- 기존 className은 모두 `CHECKOUT_*_TOKENS`, `FONT`, `MICRO_TYPO`, `CHECKOUT_MOTION` 등 토큰 상수 경유.

---

### 4. `packages/schemas/src/fsm/rental-phase.ts`

**verify-checkout-fsm: PASS**
- `getRentalPhase` 함수 시그니처 변경 없음: `(status: CheckoutStatus, purpose: CheckoutPurpose): RentalPhase | null`.
- 내부 로직(`return RENTAL_STATUS_TO_PHASE[status]`) 변경 없음.
- 추가된 `@design` JSDoc은 non-rental purpose 확장 시 변경해야 할 컴포넌트(`CheckoutPhaseIndicator`, `getPhaseIndex`) 명시 — 아키텍처 invariant 문서화로 적절.

**verify-ssot: PASS**
- `RentalPhase` type: `(typeof RENTAL_PHASES)[number]` — RENTAL_PHASES 배열에서 파생.
- `RENTAL_STATUS_TO_PHASE`: `satisfies Record<CheckoutStatus, RentalPhase | null>` 컴파일 타임 검증 유지.
- 로컬 재정의 0건. 호출부(`CheckoutPhaseIndicator`, `WorkflowTimeline`, `checkout-phase.ts` 디자인 토큰)가 모두 `@equipment-management/schemas` 경유 import.

---

## Total Issues: 0

모든 in-scope 파일 4건에 대해 verify-hardcoding, verify-ssot, verify-auth, verify-checkout-fsm, verify-frontend-state, verify-design-tokens 총 10개 검증 항목 모두 PASS.
