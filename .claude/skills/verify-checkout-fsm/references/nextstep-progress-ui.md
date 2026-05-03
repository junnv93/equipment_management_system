# NextStep & Progress UI — verify-checkout-fsm references

> 2026-05-03 verify-checkout-fsm 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: NextStepDescriptor, ProgressStep, ActorVariant, hook/UI, ESCAPE_ACTIONS, findAll/findOne user.team

## Step 24: checkout-api.ts Checkout.meta.nextStep 타입 동기화 (2026-04-24 이후)

Server-Driven UI 파이프라인: `서버 응답 → Checkout.meta.nextStep → useCheckoutNextStep(nextStep) → Zod parse → client fallback`.
프론트엔드 API 타입에 `nextStep` 필드가 없으면 서버 응답이 타입 레벨에서 버려져 항상 client fallback 동작.

```bash
# Checkout.meta에 nextStep 필드 존재 확인
grep -n "nextStep" apps/frontend/lib/api/checkout-api.ts
# 기대: meta?: { availableActions: ...; nextStep?: NextStepDescriptor | null; }
```

**PASS:** `meta.nextStep?: NextStepDescriptor | null` 선언 존재.
**FAIL:** meta 객체에 nextStep 누락 → `useCheckoutNextStep`이 항상 client fallback으로 동작 (설계 의도 역전).

## Step 26: 프론트엔드 handleNextStepAction — CheckoutAction 완전 매핑 (2026-04-24 추가)

`CheckoutDetailClient.tsx`의 `handleNextStepAction`은 FSM `CheckoutAction` 타입의 모든 값을 처리해야 한다.
라우팅 액션(`lender_check`, `borrower_receive` 등)이 `FRONTEND_ROUTES` SSOT를 경유하는지 확인.

```bash
# handleNextStepAction의 case 분기 목록 추출
grep -A60 "handleNextStepAction" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx \
  | grep "case '"
```

```bash
# FRONTEND_ROUTES 경유 라우팅 확인 — 하드코딩 URL 금지
grep -n "router\.push\|href=" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx \
  | grep -v "FRONTEND_ROUTES"
# 결과: 0건 (PASS) — 모든 router.push/href가 FRONTEND_ROUTES 경유
```

```bash
# CheckoutAction 타입에서 정의된 액션 값 목록
grep -A5 "CheckoutAction\s*=" \
  packages/schemas/src/fsm/checkout-fsm.ts \
  | grep "'"
```

**PASS:** `handleNextStepAction`의 모든 `router.push` / `href`가 `FRONTEND_ROUTES` 상수 경유.
**FAIL:** 하드코딩된 URL 리터럴 (`/checkouts/${id}/check`, `/checkouts/${id}/return` 등) 잔존.

## Step 27: 프론트엔드 useCheckoutGroupDescriptors — N+1 방지 + feature flag 완전 제거 (2026-04-26 수정)

`use-checkout-group-descriptors.ts` 훅은 `getNextStep`을 루프 내부에서 호출하는 대신 단일 `useMemo`로 Map을 일괄 계산해야 한다 (N+1 재계산 방지).
`checkout-flags.ts` + `isNextStepPanelEnabled()` feature flag는 2026-04-26 완전 삭제됨 — 훅·컴포넌트 양쪽에 0건이어야 한다.

```bash
# getNextStep이 useMemo 외부(render 함수 직접)에서 호출되는지 확인 — PASS = 없어야 함
grep -n "getNextStep" apps/frontend/hooks/use-checkout-group-descriptors.ts
# useMemo 내부에서만 호출 → OK

# feature flag 완전 제거 확인 — 0건이어야 함 (파일 삭제됨)
grep -rn "isNextStepPanelEnabled\|checkout-flags" \
  apps/frontend/hooks/ \
  apps/frontend/components/checkouts/ \
  apps/frontend/lib/ \
  --include="*.ts" --include="*.tsx"
# 기대: 0건 (PASS) — 1건 이상이면 stale import 또는 재도입 FAIL

# permissions 안정화 — permissions를 먼저 useMemo로 memoize 후 descriptor Map의 dep으로 사용하는지
grep -B2 -A8 "const permissions" apps/frontend/hooks/use-checkout-group-descriptors.ts
# useMemo([userRole]) 패턴 확인
```

```
✅ PASS: getNextStep이 단일 useMemo 내부에서만 호출됨
✅ PASS: isNextStepPanelEnabled() / checkout-flags 참조 0건 (feature flag 완전 제거됨)
✅ PASS: permissions를 별도 useMemo로 먼저 안정화 후 descriptor Map dep으로 사용
```

## Step 34: `resolveActorVariant` 순수 함수 SSOT + `data-variant`/`data-actor-variant` 테스트 선택자 (Sprint 4.1 신규, 2026-04-27 추가)

Sprint 4.1에서 도입된 `resolveActorVariant(nextActor: NextActor): ActorVariant` 순수 함수는
FSM `NextActor` 값을 `components/shared/NextStepPanel.tsx` 내부에서 UI `ActorVariant`(`requester | approver | receiver`)로 변환한다.
이 함수는 `NextActor` enum의 **모든 값**을 처리하는 exhaustive 매핑이어야 하며, 미처리 값에 대한 fallback이 존재해야 한다.
`data-variant` / `data-actor-variant` DOM 속성은 Playwright E2E 셀렉터 기반이므로 hero/compact 분기 양쪽에 반드시 존재해야 한다.

```bash
# resolveActorVariant 함수 정의 확인 (SSOT 위치)
grep -n "function resolveActorVariant\|resolveActorVariant" \
  apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 1건 이상 (정의 + 호출, PASS)

# NextActor 값 목록 확인 (packages/schemas SSOT)
grep -n "NextActor\b" packages/schemas/src/fsm/checkout-fsm.ts | head -10
# 기대: type/enum NextActor 정의 확인

# resolveActorVariant가 모든 NextActor 값을 처리하는지 확인 (switch 또는 Record 패턴)
grep -A 20 "function resolveActorVariant" \
  apps/frontend/components/shared/NextStepPanel.tsx
# 기대: requester/approver/receiver 3 케이스 + default fallback 존재

# data-variant hero/compact 양쪽 존재 확인
grep -c "data-variant" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 3 이상 (floating default + hero + compact 각 1건)

# data-actor-variant hero/compact 양쪽 존재 확인
grep -c "data-actor-variant" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 3 이상 (PASS)
```

**PASS:**
1. `resolveActorVariant` 정의 1건 + `NextActor` 모든 케이스 처리 + fallback 존재
2. `data-variant` 3건 이상 (hero/compact/default 분기 각각)
3. `data-actor-variant` 3건 이상 (hero/compact/default 분기 각각)

**FAIL:**
- `resolveActorVariant` 미존재 → `NextActor → ActorVariant` 변환 로직이 JSX 인라인 조건식으로 분산 (SSOT 위반)
- `NextActor` 새 값 추가 후 `resolveActorVariant` 미업데이트 → fallback으로 모든 신규 액터가 동일 스타일 사용
- `data-variant` 누락 → Playwright 셀렉터 `[data-variant="hero"]` 탐지 불가

**예외:**
- `resolveActorVariant`의 `default` case 반환값 — `NextActor.requester`로 fallback 하는 것은 안전한 UI 기본값

**관련 파일:**
- `apps/frontend/components/shared/NextStepPanel.tsx` — `resolveActorVariant` 정의 + `data-variant`/`data-actor-variant` DOM 속성
- `packages/schemas/src/fsm/checkout-fsm.ts` — `NextActor` 타입 SSOT
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — `WORKFLOW_PANEL_TOKENS.actor` (ActorVariant → 색상 토큰 매핑)

## Step 35: `roleToActorVariant` + `ActorVariant` schemas SSOT + `isMyTurn` `UserRoleValues.SYSTEM_ADMIN` (Sprint fsm-terminal-actor-variant, 2026-04-27)

`ActorVariant` 타입과 `roleToActorVariant` 함수는 `packages/schemas`에서만 정의/export되어야 한다.
frontend(`apps/frontend`)에서 재정의하면 schemas 변경 시 불일치 발생.
`isMyTurn` 로직의 `system_admin` 특수 케이스는 하드코딩 문자열 `'system_admin'`이 아닌 `UserRoleValues.SYSTEM_ADMIN`을 사용해야 한다.

```bash
# ActorVariant frontend 로컬 재정의 금지
grep -rn "type ActorVariant\s*=" apps/frontend/ --include="*.ts" --include="*.tsx"
# 기대: 0건 (PASS) — packages/schemas에만 존재해야 함

# roleToActorVariant frontend 로컬 정의 금지
grep -rn "function roleToActorVariant\|const roleToActorVariant\s*=" apps/frontend/ --include="*.ts" --include="*.tsx"
# 기대: 0건 (PASS) — import only

# roleToActorVariant schemas에서 import 사용 확인
grep -n "roleToActorVariant" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: import 행 + 사용 행 (schemas 경유, PASS)

# isMyTurn system_admin: UserRoleValues 사용, 하드코딩 금지
grep -n "'system_admin'" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 0건 (PASS) — UserRoleValues.SYSTEM_ADMIN 사용

grep -n "UserRoleValues.SYSTEM_ADMIN" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 1건 이상 (PASS)
```

**PASS:**
1. `type ActorVariant` frontend 재정의 0건
2. `roleToActorVariant` frontend 정의 0건, schemas import만 사용
3. `'system_admin'` 하드코딩 0건, `UserRoleValues.SYSTEM_ADMIN` 사용

**FAIL:**
- `type ActorVariant = 'requester' | 'approver' | 'receiver'` frontend 재정의 → schemas 변경 시 불일치
- `function roleToActorVariant` frontend 정의 → SSOT 분산
- `'system_admin'` 리터럴 → UserRole rename 시 silent break

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — `ActorVariant`, `roleToActorVariant`, `UserRoleValues` SSOT
- `apps/frontend/components/shared/NextStepPanel.tsx` — `isMyTurn` 로직

## Step 36: `reachedStepIndex` — `NextStepDescriptor` 3분기 필수 + `computeReachedStepIndex` `terminatedFromStatus` 위임 (Sprint fsm-terminal-actor-variant, 2026-04-27)

`getNextStep`의 3개 return 분기(terminal early-return / no-candidate / 정상 candidate) 모두 `reachedStepIndex` 필드를 포함해야 한다.
누락 시 Zod `NextStepDescriptorSchema.safeParse` 실패 → FSM drift fallback 발동.
`computeReachedStepIndex`는 `terminatedFromStatus` 옵셔널 파라미터를 받아 terminal 상태에서 정확한 단계를 반환해야 한다.

```bash
# NextStepDescriptor 인터페이스에 reachedStepIndex 필드 존재
grep -n "reachedStepIndex" packages/schemas/src/fsm/checkout-fsm.ts
# 기대: 인터페이스 + Zod 스키마 + computeReachedStepIndex 함수 3곳 이상 (PASS)

# getNextStep 3개 return 분기 모두 reachedStepIndex 포함
grep -c "reachedStepIndex," packages/schemas/src/fsm/checkout-fsm.ts
# 기대: 3 이상 (terminal/no-candidate/normal 각 1건, PASS)

# computeReachedStepIndex terminatedFromStatus 파라미터 확인
grep -A 5 "function computeReachedStepIndex" packages/schemas/src/fsm/checkout-fsm.ts
# 기대: terminatedFromStatus?: CheckoutStatus | null 파라미터 존재 (PASS)

# buildNextStep에서 terminatedFromStatus 전달 확인
grep -n "terminatedFromStatus" apps/backend/src/modules/checkouts/checkouts.service.ts | head -5
# 기대: getNextStep 호출부에 terminatedFromStatus 전달 (PASS)
```

**PASS:**
1. `reachedStepIndex` 인터페이스 + Zod 스키마 양쪽 선언
2. `getNextStep` 3개 return 분기 모두 `reachedStepIndex` 포함
3. `computeReachedStepIndex`에 `terminatedFromStatus` 파라미터 존재

**FAIL:**
- `reachedStepIndex` 누락된 return 분기 → Zod safeParse 실패 → FSM drift fallback
- `computeReachedStepIndex`에 `terminatedFromStatus` 없음 → terminal 상태 항상 step 1 반환

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — `computeReachedStepIndex`, `NextStepDescriptor`, `NextStepDescriptorSchema`
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `buildNextStep`

## Step 37: `terminatedFromStatus` 저장 패턴 — terminal 전환 시 직전 status 기록 (Sprint fsm-terminal-actor-variant, 2026-04-27)

`reject` / `borrowerReject` / `cancel` 메서드는 status 전환 직전 `checkout.status`를 `terminatedFromStatus`로 저장해야 한다.
비-terminal 메서드(`approve`, `borrowerApprove`, `startCheckout`, `returnCheckout`, `approveReturn`, `rejectReturn`)에는 `terminatedFromStatus` 설정 없어야 한다.
기존 `updateWithVersion` / `updateCheckoutStatus` CAS 경로는 그대로 유지 — `terminatedFromStatus`는 additionalData에만 추가.

```bash
# terminal 3개 메서드에 terminatedFromStatus 설정 확인
grep -n "terminatedFromStatus" apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: buildNextStep 전달(1건) + reject(1건) + borrowerReject(1건) + cancel(1건) = 4건 이상 (PASS)

# 비-terminal 메서드에 terminatedFromStatus 미설정 확인 (approve/return 계열)
grep -A 30 "async approve\b" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "terminatedFromStatus"
# 기대: 0건 (PASS)

grep -A 30 "async returnCheckout\b" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "terminatedFromStatus"
# 기대: 0건 (PASS)
```

**PASS:**
1. `terminatedFromStatus` 총 4건 이상 (`buildNextStep` + 3개 terminal 메서드)
2. `approve` / `returnCheckout` 등 비-terminal 메서드에 `terminatedFromStatus` 없음

**FAIL:**
- `reject`/`cancel`/`borrowerReject` 중 `terminatedFromStatus` 누락 → terminal 상태 `reachedStepIndex` 항상 1
- 비-terminal 메서드에 `terminatedFromStatus` 설정 → 의미론 오염

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `reject`, `borrowerReject`, `cancel`, `buildNextStep`
- `packages/db/src/schema/checkouts.ts` — `terminatedFromStatus` nullable 컬럼

## Step 39: `useCheckoutNextStep` hook `terminatedFromStatus` 입력 passthrough (2026-04-27 추가)

`computeReachedStepIndex`에 `terminatedFromStatus`가 추가됨(Step 36)에 따라,
프론트엔드 훅 `use-checkout-next-step.ts`도 동일한 파라미터를 입력으로 받아 `getNextStep` 호출에 전달해야 한다.
`UseCheckoutNextStepInput` 인터페이스에 누락 시 caller가 전달할 방법이 없어 terminal 상태에서 항상 step 1이 표시된다.

```bash
# UseCheckoutNextStepInput 인터페이스에 terminatedFromStatus 필드 존재
grep -n "terminatedFromStatus" apps/frontend/hooks/use-checkout-next-step.ts
# 기대: interface 선언(1건) + destructuring(1건) + getNextStep 호출(1건) + useMemo deps(1건) = 4건 이상 (PASS)

# getNextStep 호출에 terminatedFromStatus 전달 확인
grep -A 5 "getNextStep(" apps/frontend/hooks/use-checkout-next-step.ts | grep "terminatedFromStatus"
# 기대: 1건 (PASS)

# useMemo deps에 포함 확인
grep -A 10 "useMemo" apps/frontend/hooks/use-checkout-next-step.ts | grep "terminatedFromStatus"
# 기대: 1건 (PASS)
```

**PASS:**
1. `UseCheckoutNextStepInput` 인터페이스에 `terminatedFromStatus?: CheckoutStatus | null` 필드
2. destructuring에서 수신 후 `getNextStep({ ..., terminatedFromStatus })` 호출 전달
3. `useMemo` deps 배열에 `terminatedFromStatus` 포함

**FAIL:**
- 인터페이스에 `terminatedFromStatus` 없음 → caller가 전달 불가 → terminal 상태 `reachedStepIndex` 항상 1
- `getNextStep` 호출에 미전달 → schemas 함수 파라미터 존재해도 hook 레벨에서 누락
- `useMemo` deps 미포함 → `terminatedFromStatus` 변경 시 재계산 안 됨 (stale closure)

**관련 파일:**
- `apps/frontend/hooks/use-checkout-next-step.ts` — `UseCheckoutNextStepInput`, `getNextStep` 호출부
- `packages/schemas/src/fsm/checkout-fsm.ts` — `computeReachedStepIndex` (Step 36 연동)

## Step 40: compact variant `canAct` 분기 — span/button 이중 렌더 금지 (2026-04-27 추가, 2026-04-28 atom 갱신)

`NextStepPanel.tsx` compact 분기에서 `canAct` 값에 따라 span과 액션 버튼을 **상호 배타적**으로 렌더해야 한다:
- `canAct=false`: `{!canAct && <span>}` — 텍스트 레이블만 (버튼 없음)
- `canAct=true`: `{canAct && <InlineActionButton>}` — 액션 atom만 (레이블 중복 없음)

span이 조건 없이 항상 렌더되면 `canAct=true` 시 동일 텍스트가 span + button 두 곳에 노출되어 스크린리더가 두 번 읽는다.

**Phase 3 (2026-04-28)**: 기존 raw `<button className={WORKFLOW_PANEL_TOKENS.variant.compact.actionButton}>` 패턴은 와이어프레임 04 spec(soft-tint inline action)에 따라 `<InlineActionButton variant={resolveInlineActionVariant({...})}>` atom으로 마이그레이션. 분기 *구조*(`!canAct &&` / `canAct &&`)는 절대 변경하지 않고 element만 swap. 이는 Step 40의 핵심 보호 대상.

```bash
# !canAct span 조건부 렌더 확인
grep -n "!canAct" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 1건 이상 (PASS)

# canAct InlineActionButton 조건부 렌더 확인
grep -n "canAct &&" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 1건 이상 (PASS)

# atom 사용 확인 — Phase 3 마이그레이션 후
grep -n "InlineActionButton" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: import + canAct=true 분기 사용 (compact + hero 양쪽)

# raw <button>이 canAct=true 분기에 잔존하지 않는지 (회귀 방지)
grep -n "WORKFLOW_PANEL_TOKENS\.variant\.\(compact\|hero\)\.actionButton" \
  apps/frontend/components/shared/NextStepPanel.tsx
# 기대: 0 hits (Phase 3에서 토큰 삭제됨)

# stopPropagation 보존 — 행 클릭 충돌 회피
grep -n "stopPropagation" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: ≥ 2 hits (compact action onClick + DropdownMenuTrigger overflow + DropdownMenuItem)
```

**PASS:**
1. `{!canAct && <span>...{t('action.${descriptor.labelKey}')}...}` 패턴 compact 분기에 존재
2. `{canAct && <InlineActionButton>...{t('action.${descriptor.labelKey}')}...}` 패턴 compact 분기에 존재
3. 두 분기가 상호 배타적 — 동일 조건 블록 내 동시 렌더 없음
4. **(Phase 3)** action onClick 핸들러 내부에 `e.stopPropagation()` 보존 — 행 클릭과 충돌 회피
5. **(Phase 3)** atom variant 결정은 `resolveInlineActionVariant({ urgency, nextAction, isMyTurn })` SSOT 헬퍼 경유

**FAIL:**
- span이 `!canAct` 없이 compact 분기 최상위에서 무조건 렌더 → `canAct=true` 시 이중 텍스트
- button이 `canAct` 조건 없이 항상 렌더 → 권한 없는 사용자에게 버튼 노출
- **(Phase 3)** raw `<button className={WORKFLOW_PANEL_TOKENS.variant.compact.actionButton}>` 잔존 → soft-tint 미적용 시각 회귀
- **(Phase 3)** `e.stopPropagation()` 누락 → 행 클릭 vs 버튼 클릭 충돌 (이중 navigation)

**관련 파일:**
- `apps/frontend/components/shared/NextStepPanel.tsx` — compact 분기 (~라인 305-330) + hero canAct true/false (~라인 224-260)
- `apps/frontend/components/ui/inline-action-button.tsx` — Phase 3 atom
- `packages/shared-constants/src/checkout-thresholds.ts` — `resolveInlineActionVariant` 매핑 SSOT
- `apps/frontend/components/shared/NextStepPanel.stories.tsx` — CompactVariantCanAct(canAct=true) + CompactVariantNoAct(canAct=false)

## Step 41: `ProgressStepDescriptor` SSOT + `deriveProgressStepState` 5-state exhaustive (2026-04-28 추가, REVIEW_RESULT.md P0-1)

상세 페이지 통합 stepper(`CheckoutProgressStepper`)를 위해 `NextStepDescriptor`와 보완 관계로 도입된 **`ProgressStepDescriptor[]`** 타입과 **`deriveProgressStepState`** 함수의 정합성을 강제:

1. **타입 분리 — NextStep(현재 1점) vs Progress[](전체 N점)**: 두 타입의 필드 중복 0 보장. `ProgressStepDescriptor`는 schemas/fsm/progress-step.ts 단일 정의.
2. **5-state exhaustive**: `PROGRESS_STEP_STATES = ['done', 'current', 'late', 'future', 'terminated']` const tuple + `as const` + `(typeof ...)[number]` 패턴. terminal 상태(rejected/canceled) 표현 누락 시 reachedStepIndex가 silent break.
3. **`deriveProgressStepState` 4-arg signature**: `(stepIndex, currentStepIndex, isOverdue, termination)`. terminal일 때 currentStepIndex 위치 'terminated', 이전 'done', 이후 'future'.
4. **`TerminationKind` 매핑**: `'rejected' | 'canceled' | null`. hook 측 `deriveTermination(status)` 헬퍼로 status → TerminationKind 변환.
5. **descriptor 클램프 강제**: `Math.min(steps.length - 1, Math.max(0, currentStepIndex - 1))` — schema `.positive()` 만으로는 N+1 silent 통과.

```bash
# ProgressStepState 5-state 정의 확인
grep -n "PROGRESS_STEP_STATES" packages/schemas/src/fsm/progress-step.ts
# 기대: 'done', 'current', 'late', 'future', 'terminated' 5개 (PASS)

# deriveProgressStepState 4-arg 시그니처 확인
grep -A4 "export function deriveProgressStepState" packages/schemas/src/fsm/progress-step.ts
# 기대: termination?: TerminationKind 4번째 인자 존재

# TerminationKind 정의 확인
grep -n "type TerminationKind" packages/schemas/src/fsm/progress-step.ts
# 기대: 'rejected' | 'canceled' | null

# Hook이 reachedStepIndex 우선 + currentStepIndex fallback 패턴 사용하는지
grep -n "reachedStepIndex\|currentStepIndex" apps/frontend/hooks/use-checkout-progress-steps.ts
# 기대: termination !== null && reachedStepIndex > 0 → reachedStepIndex - 1 분기 존재

# 클램프 보장
grep -n "Math.min.*steps.length\|Math.max(0," apps/frontend/hooks/use-checkout-progress-steps.ts
# 기대: descriptor.currentStepIndex 비정상 값 양쪽 클램프
```

**PASS:**
1. `PROGRESS_STEP_STATES` 5-tuple + `ProgressStepState` 타입 동기화
2. `ProgressStepDescriptorSchema` Zod로 wire-level 검증 통로 확보 (향후 backend emit)
3. `deriveProgressStepState` termination 인자 + terminal 분기
4. Hook이 termination 추론 후 reachedStepIndex 사용 (terminal일 때) / currentStepIndex 사용 (비-terminal일 때)
5. `[0, steps.length-1]` 양쪽 클램프

**FAIL:**
- 4-state(terminated 누락) → 반려/취소 stepper "X단계에서 종료" 표현 불가, current처럼 보임
- termination 미전달 → terminal 상태도 'current' 반환 → 시각적 오인식
- 클램프 부재 → descriptor.currentStepIndex=99 시 모든 step이 'done' 잘못 렌더
- ProgressStepDescriptor 필드를 NextStepDescriptor에서 중복 정의 → 보완 관계 깨짐

**관련 파일:**
- `packages/schemas/src/fsm/progress-step.ts` — 단일 정의
- `packages/schemas/src/fsm/index.ts` — re-export
- `apps/frontend/hooks/use-checkout-progress-steps.ts` — descriptor 클램프 + termination 추론
- `apps/frontend/components/checkouts/CheckoutProgressStepper.tsx` — 5-state 시각 (terminated: opacity-60 + line-through + X 아이콘)
- `apps/frontend/components/checkouts/ProgressFlowSection.tsx` — ErrorBoundary 보호 + displayCurrent 클램프

## Step 42: `CheckoutActorContext` SSOT + `TRANSITION_ACTOR_SIDE` 매핑 (rental-approval-workflow-fix, 2026-04-29)

**왜 검증해야 하는가:** rental 2단계 승인에서 lender/borrower 양측 TM이 같은 role(`technical_manager`)이라 permission만으로는 분리 불가. FSM `canPerformAction`/`getNextStep`이 옵셔널 `actorCtx`를 받아 `TRANSITION_ACTOR_SIDE[action]`과 `userTeamId === {lenderTeamId|requesterTeamId}` 일치 검증을 수행해야 함. 누락 시 평택랩 TM이 차용자 측 `borrower_approve` 호출 → 403, 또는 `pending`에서 lender approve 직격 → 400.

```bash
# 1. CheckoutActorContext + TRANSITION_ACTOR_SIDE SSOT 정의
grep -n "CheckoutActorContext\|TRANSITION_ACTOR_SIDE" packages/schemas/src/fsm/checkout-fsm.ts

# 2. blockingReason union에 'actor_team' 포함
grep -n "actor_team" packages/schemas/src/fsm/checkout-fsm.ts

# 3. canPerformAction/getNextStep 시그니처에 옵셔널 actorCtx
grep -A2 "function canPerformAction\|function getNextStep" packages/schemas/src/fsm/checkout-fsm.ts | head -16

# 4. BE service의 actorCtx 합류
grep -n "actorCtx\|CheckoutActorContext\|buildActorCtx" apps/backend/src/modules/checkouts/checkouts.service.ts | head -8

# 5. canBorrowerApprove/canBorrowerReject BE/FE 동기
grep -n "canBorrowerApprove\|canBorrowerReject" apps/backend/src/modules/checkouts/checkouts.service.ts apps/frontend/lib/api/checkout-api.ts

# 6. fsm.blocked.actor_team i18n parity
grep -n "actor_team" apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json
```

**PASS:**
1. `CheckoutActorContext` interface + `TRANSITION_ACTOR_SIDE` Record SSOT
2. `canPerformAction` reason union에 `'actor_team'` 추가, 모든 호출처 업데이트
3. `getNextStep` 우선순위: (1) permission+actor OK, (2) permission only → blockingReason='actor_team', (3) permission 없음
4. BE `calculateAvailableActions`가 actorCtx 기반 단일 helper로 모든 boolean 도출 — 인라인 lenderTeamOk 분기 0
5. FE `CheckoutAvailableActions`에 `canBorrowerApprove`/`canBorrowerReject` 동기
6. `fsm.blocked.actor_team` ko/en parity

**FAIL:**
- actor identity 미반영 → 평택랩 TM이 borrower_approve 버튼 노출 → 403
- canPerformAction 시그니처 변경으로 280-row table test 회귀
- BE/FE drift → 타입 에러 또는 runtime undefined 접근

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — SSOT
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — actorCtx 합류
- `apps/frontend/lib/api/checkout-api.ts` — type sync
- `apps/frontend/messages/{ko,en}/checkouts.json` — fsm.blocked.actor_team

## Step 43: `findAll` server-driven meta 항상 주입 (rental-approval-workflow-fix, 2026-04-29)

**왜 검증해야 하는가:** FE `warnMetaDrift`가 list 응답에서 meta 누락 시 `[FSM drift] meta missing <id>` 경고 발생. `findAll`이 user-specific meta를 매 요청 신선하게 주입해야 함 — cache는 raw items만 (user-agnostic), post-cache step에서 actorCtx 기반 meta 합성. 그렇지 않으면 user A의 meta가 cache로 user B에게 leak.

```bash
# 1. findAll 시그니처 — 옵셔널 user info
grep -B2 -A6 "async findAll" apps/backend/src/modules/checkouts/checkouts.service.ts | head -20

# 2. controller가 user info forward
grep -B2 -A6 "checkoutsService.findAll" apps/backend/src/modules/checkouts/checkouts.controller.ts | head -10

# 3. cache 후 post-process meta 패턴
grep -B1 -A5 "user-specific meta post-process\|cachedResponse.items.map" apps/backend/src/modules/checkouts/checkouts.service.ts

# 4. requesterTeamId 보존 (actorCtx 입력)
grep -n "requesterTeamId" apps/backend/src/modules/checkouts/checkouts.service.ts
```

**PASS:**
1. findAll 시그니처에 `userPermissions?` + `userTeamId?` 옵셔널 인자
2. cache key에 user 정보 미포함 (post-cache 합성)
3. items 매핑에 `requesterTeamId` 보존 (actor identity 평가 입력)
4. user 정보 제공 시 매 요청 fresh meta 합성 — 누락 0

**FAIL:**
- meta가 cache에 포함되면 user 간 leak (보안 위반)
- meta 누락 → `warnMetaDrift` console warning + 잘못된 버튼 노출

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — findAll post-cache meta
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` — user info forward
- `apps/frontend/lib/api/checkout-api.ts:warnMetaDrift` — drift 검출

## Step 44: `getPendingChecks` borrower team EXISTS subquery 패턴 (rental-approval-workflow-fix, 2026-04-29)

**왜 검증해야 하는가:** rental의 `pending` 상태는 차용자 측 TM이 1차 승인해야 하는 단계인데, 신청자(requester)와 borrower TM은 다른 사용자다. `requesterId === userId` 매칭만으로는 borrower TM이 자기 팀의 신청 건을 못 본다 → nav 배지에 "내 차례" 카운트 누락. EXISTS 서브쿼리로 `requester.teamId === userTeamId`를 매칭해야 borrower 팀 멤버 모두에게 노출.

```bash
# 1. getPendingChecks(Count) borrower team EXISTS pattern
grep -B1 -A5 "borrowerTeamPendingCondition\|EXISTS.*users.*team_id" apps/backend/src/modules/checkouts/checkouts.service.ts | head -40

# 2. requester user team join 또는 EXISTS 패턴 — pending status 매칭 포함
grep -n "CSVal.PENDING\|status.*pending" apps/backend/src/modules/checkouts/checkouts.service.ts | head -10
# 기대: getPendingChecks/getPendingChecksCount 양쪽에서 PENDING 분기 존재

# 3. 단일 user (`requesterId === userId`) 매칭만 사용하는 회귀 회피
grep -B2 -A4 "requesterId.*userId" apps/backend/src/modules/checkouts/checkouts.service.ts | grep -A3 "borrowerStatuses"
# 기대: borrowerActionCondition 와 borrowerTeamPendingCondition 분리 — 두 패턴 OR 조합
```

**PASS:**
1. `getPendingChecks` + `getPendingChecksCount` 양쪽이 `borrowerTeamPendingCondition` (EXISTS subquery) 사용
2. EXISTS 서브쿼리가 `users.id = checkouts.requesterId AND users.team_id = userTeamId` 형태
3. 기존 `borrowerActionCondition` (requester action 단계) + 신규 `borrowerTeamPendingCondition` (1차 승인 대기) 둘 다 포함된 OR 조합
4. lender + borrowerAction + borrowerTeamPending 3-way OR 조합 일관성

**FAIL:**
- borrower TM nav 배지에 pending+rental 누락 → 1차 승인 SLA 위반 위험
- 단순히 `borrowerStatuses`에 `PENDING` 추가만 (requesterId 매칭) → 신청자만 자기 신청 보고 borrower TM은 못 봄

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts:getPendingChecks` + `getPendingChecksCount`
- `packages/db/src/schema/checkouts.ts` — `requesterId` FK
- `packages/db/src/schema/users.ts` — `teamId`

## Step 45: `findAll` + `findOne` `user.team` 양측 완전성 (2026-04-29 추가)

**왜 검증해야 하는가:** `findAll`의 `userInfo` 구성에 `team: { id, name, site }`를 추가했지만 `findOne`은 누락. 결과적으로 목록 경로에서는 소속이 표시되지만 단건 조회 경로(CheckoutDetailClient)에서는 여전히 "-". `user.team`을 응답에 포함하는 코드 경로는 반드시 findAll/findOne 양측 모두 동일한 구조를 유지해야 한다.

```bash
# 1. findAll userInfo에 team.site 포함 여부
grep -A10 "const userInfo = item.requester" apps/backend/src/modules/checkouts/checkouts.service.ts | grep "site"
# 기대: teamSite 또는 site 참조 존재

# 2. findOne user 응답에 team.site 포함 여부
grep -A15 "user: userRow\[0\]" apps/backend/src/modules/checkouts/checkouts.service.ts | grep "site"
# 기대: teamSite 또는 site 참조 존재

# 3. frontend 타입 — Checkout.user.team에 site 필드 포함
grep "team\?:" apps/frontend/lib/api/checkout-api.ts | grep "site"
# 기대: site?: string 포함

# 4. approvals/mappers.ts mapCheckoutToApprovalItem — team?.site 직접 접근 (캐스트 금지)
grep "requesterSite" apps/frontend/lib/api/approvals/mappers.ts
# 기대: team?.site 직접 접근, (team as ...) 캐스트 0건
```

**PASS:**
1. `findAll` `userInfo.team` → `{ id, name, site }` 포함
2. `findOne` `user.team` → `{ id, name, site }` 포함 (leftJoin teams)
3. `checkout-api.ts` `team?: { ... site?: string }` 타입 포함
4. `approvals/mappers.ts` `requesterSite: team?.site` 직접 접근 (캐스트 없음)

**FAIL:**
- findAll만 team 포함하고 findOne 누락 → 단건 조회 페이지 소속 "-" 회귀
- `(team as { site?: string })?. site` 캐스트 재도입 → 타입 드리프트 신호

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — findAll userInfo + findOne user
- `apps/frontend/lib/api/checkout-api.ts` — `Checkout.user.team` 타입
- `apps/frontend/lib/api/approvals/mappers.ts` — `mapCheckoutToApprovalItem` requesterSite

## Step 46: ESCAPE_ACTIONS 집합 불변성 + getNextStep 4단계 우선순위 (2026-04-29 추가)

**왜 검증해야 하는가:** cancel/reject/reject_return/borrower_reject를 primary 워크플로우 액션에서 격리. 이 집합이 축소되거나 다른 액션이 추가되면 borrower가 cancel을 primary 액션으로 보게 되는 회귀가 발생. 4단계 우선순위(fullyAvailableMain→permittedOnlyMain→firstMain→fullyAvailableEscape)가 유지되지 않으면 권한 없는 사용자에게 escape 액션이 primary로 노출된다.

```bash
# 1. ESCAPE_ACTIONS 정의 존재 및 4개 멤버 확인
grep -A3 "ESCAPE_ACTIONS" packages/schemas/src/fsm/checkout-fsm.ts | head -8
# 기대: new Set<CheckoutAction>(['cancel', 'reject', 'reject_return', 'borrower_reject'])

# 2. getNextStep 4단계 우선순위 구조 — fullyAvailableMain 변수 존재
grep -n "fullyAvailableMain\|permittedOnlyMain\|firstMain\|fullyAvailableEscape" \
  packages/schemas/src/fsm/checkout-fsm.ts
# 기대: 4개 변수 모두 존재

# 3. candidate 결합 — 4단계 순서 확인
grep -n "fullyAvailableMain ?? permittedOnlyMain ?? firstMain ?? fullyAvailableEscape" \
  packages/schemas/src/fsm/checkout-fsm.ts
# 기대: 1건

# 4. ESCAPE_ACTIONS.has() 필터가 Main 후보에 적용되는지 (escape가 primary로 빠져나가는 회귀 방지)
grep -B1 "fullyAvailableMain\s*=" packages/schemas/src/fsm/checkout-fsm.ts | grep "ESCAPE_ACTIONS"
# 기대: !ESCAPE_ACTIONS.has 필터 존재
```

**PASS:**
1. ESCAPE_ACTIONS 4개 멤버({cancel, reject, reject_return, borrower_reject}) 정확히 일치
2. 4개 후보 변수(fullyAvailableMain/permittedOnlyMain/firstMain/fullyAvailableEscape) 모두 존재
3. `fullyAvailableMain ?? permittedOnlyMain ?? firstMain ?? fullyAvailableEscape ?? transitions[0]` 체인
4. Main 후보에 `!ESCAPE_ACTIONS.has(t.action)` 필터 적용

**FAIL:**
- ESCAPE_ACTIONS 멤버 변경(추가/삭제) → FSM 우선순위 의도 변경 신호, 리뷰 필요
- 4단계 체인 구조 누락 → escape 액션이 primary로 노출될 수 있음
- `!ESCAPE_ACTIONS.has` 필터 없음 → cancel이 primary 디스크립터로 다시 노출

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — ESCAPE_ACTIONS, getNextStep 4단계 우선순위

## Step 48: CheckoutDetailClient availableToCurrentUser guard + canCancel 독립 버튼 (2026-04-29 추가)

**왜 검증해야 하는가:** 권한 없는 사용자가 handleNextStepAction을 호출하면 서버에서 403이 반환되고 페이지가 새로고침됐던 버그. `availableToCurrentUser` early-return guard가 없으면 동일 회귀 발생. cancel 버튼이 독립 UI가 아니라 handleNextStepAction 내 'cancel' case로만 존재하면 cancel 외 다른 primary 액션이 있는 상태에서 취소가 불가능해진다.

```bash
# 1. handleNextStepAction 상단 availableToCurrentUser early-return guard
grep -A3 "handleNextStepAction" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx \
  | grep "availableToCurrentUser"
# 기대: if (!nextStepDescriptor.availableToCurrentUser) return; 존재

# 2. canCancel 독립 버튼 — meta.availableActions.canCancel 게이트
grep -n "canCancel" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: checkout.meta?.availableActions.canCancel 기반 조건부 렌더링 존재

# 3. handleNextStepAction 'cancel' case가 canCancel 게이트와 분리 — cancel case 내에서 직접 dialog open
grep -A5 "case 'cancel'" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx | head -10
# 기대: setDialogState cancel: true 또는 독립 버튼이 직접 dialog open

# 4. nextStep: checkout.meta?.nextStep wiring — useCheckoutNextStep에 서버값 전달
grep -n "nextStep: checkout\.meta" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 1건 (useCheckoutNextStep 훅 호출 인수)
```

**PASS:**
1. `handleNextStepAction` 진입 시 `if (!nextStepDescriptor.availableToCurrentUser) return;` 존재
2. `checkout.meta?.availableActions.canCancel` 조건부 렌더링으로 cancel 버튼 독립 표시
3. cancel 버튼이 nextAction 흐름과 별도로 항상 표시 가능(canCancel=true 시)
4. `nextStep: checkout.meta?.nextStep`이 useCheckoutNextStep 훅에 전달

**FAIL:**
- `availableToCurrentUser` guard 없음 → 권한 없는 사용자 액션 시 403 → 페이지 새로고침 회귀
- `canCancel` 독립 버튼 없음 → 특정 상태에서 취소 불가
- `checkout.meta?.nextStep` wiring 없음 → 서버 actorCtx 기반 계산 무시, 클라이언트 FSM 폴백만 사용

**관련 파일:**
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — handleNextStepAction, canCancel 버튼

## Step 49: `useCheckoutProgressSteps` fallback — `steps.indexOf` 금지, `computeStepIndex` SSOT 경유 필수 (2026-04-29 추가)

**왜 검증해야 하는가:** `CHECKOUT_DISPLAY_STEPS[purpose]`는 시각 표시용 status 배열로, `lender_received` 같이 FSM에는 존재하지만 stepper에 표시하지 않는 status를 포함하지 않는다. `Array.prototype.indexOf`로 이 배열에서 status를 찾으면 -1이 반환되고 묵묵히 index 0(첫 단계 활성화)으로 fallback되어 진행 상태가 항상 1단계를 가리키는 버그가 발생한다. `computeStepIndex(status, purpose)`는 모든 CheckoutStatus를 명시적으로 매핑하므로 어떤 status든 올바른 인덱스를 반환한다.

```bash
# 1. steps.indexOf fallback 금지 확인
grep -n "steps\.indexOf\|\.indexOf(status)" \
  apps/frontend/hooks/use-checkout-progress-steps.ts
# 기대: 0건 (주석 제외). hit 발생 시 computeStepIndex 로 교체 필요.

# 2. computeStepIndex SSOT fallback 존재 확인
grep -n "computeStepIndex" \
  apps/frontend/hooks/use-checkout-progress-steps.ts
# 기대: import 1건 + fallback 사용 1건 이상

# 3. import 경로 — @equipment-management/schemas 경유
grep -n "computeStepIndex" \
  apps/frontend/hooks/use-checkout-progress-steps.ts \
  | grep "from '@equipment-management/schemas'"
# 기대: 0건이면 import 누락 → FAIL (위 grep에서 import 라인 직접 확인)
```

**PASS:**
1. `steps.indexOf(status)` 호출 0건 (주석 내부 제외)
2. `computeStepIndex(status, purpose) - 1` 패턴으로 fallback 계산
3. `computeStepIndex`를 `@equipment-management/schemas`에서 import

**FAIL:**
- `steps.indexOf(status)` 발견 → `lender_received` 등 비-display status에서 항상 1단계 활성화 버그 회귀

**관련 파일:**
- `apps/frontend/hooks/use-checkout-progress-steps.ts` — fallback rawCurrent 계산
- `packages/schemas/src/fsm/checkout-fsm.ts` — `computeStepIndex` SSOT 정의
- `apps/frontend/lib/design-tokens/components/checkout-timeline.ts` — `CHECKOUT_DISPLAY_STEPS` (표시용 배열, 비-display status 미포함)

**발생 이력 (2026-04-29 신설)**: rental `lender_received` 상태에서 진행 stepper가 항상 1단계(승인대기)를 활성화하는 버그. `CHECKOUT_DISPLAY_STEPS.rental`에 `lender_received`가 없어 `indexOf` → -1 → 0 으로 묵묵히 잘못 매핑. `computeStepIndex` SSOT 경유로 수정.

## Step 50: rental `returnCheckout` purpose-aware validation — `workingStatusChecked` 서버 도출, DTO 검증 면제 (2026-04-29 추가)

**왜 검증해야 하는가:** 대여 목적 반입은 4단계 상태확인(외관·작동 상태)이 이미 작동 여부 확인 기록을 대체한다. 모든 목적에 동일하게 `workingStatusChecked` DTO 필드를 검증하면 rental 반입 폼에서 중복 체크박스가 필요해지거나, 상태확인이 이상(abnormal)인 장비의 반입이 차단되는 버그가 발생한다. `workingStatusChecked`의 도메인 의미는 "확인을 수행했다"(performed)이지 "정상이다"(normal)가 아니므로, 이상 상태 장비도 반입은 가능해야 한다.

```bash
# 1. rental purpose 시 DTO workingStatusChecked 검증 면제 확인
grep -A20 "purpose === CPVal.RENTAL" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -A5 "workingStatusChecked"
# 기대: rental 분기 내에서 WORKING_STATUS_REQUIRED 예외를 throw하지 않음

# 2. rental 분기 — condition_checks 서버 도출 패턴
grep -B2 -A5 "resolvedWorkingStatusChecked" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | head -20
# 기대: rental → priorChecks.length > 0, 교정/수리 → returnDto.workingStatusChecked

# 3. resolvedWorkingStatusChecked = priorChecks.length > 0 (performed 의미)
grep -n "priorChecks\.length > 0\|priorChecks\.every" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: priorChecks.length > 0 사용. priorChecks.every(operationStatus === 'normal') 금지
# every(normal) 는 "정상이어야" 의미로 이상 장비 반입 차단 버그 유발.

# 4. updateWithVersion에 resolvedWorkingStatusChecked 전달
grep -n "workingStatusChecked: resolved" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 1건 (returnDto.workingStatusChecked 직접 전달이면 rental 도출 로직 우회)
```

**PASS:**
1. `purpose === CPVal.RENTAL` 분기에서 `WORKING_STATUS_REQUIRED` 예외 없음
2. rental 분기: `priorChecks.length > 0`으로 도출 (not `every(normal)`)
3. `updateWithVersion` 호출에 `resolvedWorkingStatusChecked` 전달 (not `returnDto.workingStatusChecked`)

**FAIL:**
- `if (!returnDto.workingStatusChecked) throw WORKING_STATUS_REQUIRED` 조건이 목적 구분 없이 모든 목적에 적용 → rental 반입 시 DTO 필드 강제 필요 (UX 중복)
- `priorChecks.every(c => c.operationStatus === 'normal')` 패턴 → 이상 상태 장비 반입 차단 버그 (의미론적 오류)
- `workingStatusChecked: returnDto.workingStatusChecked` 직접 전달 (rental 도출 로직 우회)

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — returnCheckout, resolvedWorkingStatusChecked
- `apps/frontend/components/checkouts/ReturnInspectionForm.tsx` — RETURN_INSPECTION_PURPOSE_CONFIG.rental.workingUserProvided=false
- `apps/frontend/app/(dashboard)/checkouts/[id]/return/ReturnCheckoutClient.tsx` — derivedWorkingStatusChecked = conditionChecks.length > 0

**발생 이력 (2026-04-29 신설)**: rental 반입 시 (1) 중복 체크박스 UX 문제, (2) `workingStatusChecked` 의미론적 오류(`every(normal)` → 이상 장비 반입 차단) 동시 발견. purpose-aware 검증 분리 + 서버 도출 패턴으로 수정.

## Step 51: KPI 카드 value-filterStatus 상태 집합 정합성 — `CHECKOUT_STATUS_GROUPS` SSOT 경유 필수 (2026-04-30 추가)

**규칙**: `OutboundCheckoutsTab`의 `useStatCards` 배열에서 각 카드의 `value`(숫자)와 `filterStatus`(클릭 필터)는 반드시 동일한 상태 집합을 기준으로 해야 한다. 백엔드 `getSummary()` 집계 필드와 `getCheckoutStatusGroupFilterValue()` 헬퍼가 같은 `CHECKOUT_STATUS_GROUPS` 상수를 참조할 때만 이 불변성이 보장된다.

**왜 중요한가**: 카드에 표시된 숫자(예: 5)를 클릭했을 때 목록에 5건이 나와야 한다. `value`와 `filterStatus`가 다른 상태 집합을 가리키면 "카드 숫자 ≠ 클릭 후 목록 수"인 UX 버그가 발생한다.

```bash
# 1. getSummary() inProgress 카운트가 CHECKOUT_STATUS_GROUPS.in_progress 경유인지 확인
grep -A5 "inProgress:" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "CHECKOUT_STATUS_GROUPS\|inProgressStatuses"
# 기대: CHECKOUT_STATUS_GROUPS.in_progress 경유 (하드코딩 상태 목록 0건)

# 2. getSummary() returnedToday 카운트가 completed 그룹 경유인지 확인
grep -A3 "returnedToday:" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "CHECKOUT_STATUS_GROUPS\|completedStatuses"
# 기대: CHECKOUT_STATUS_GROUPS.completed 경유

# 3. KPI 카드 checkedOut value가 summary.inProgress 사용인지 확인
grep -B2 -A2 "variantKey: 'checkedOut'" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx \
  | grep "inProgress"
# 기대: value: summary.inProgress (summary.approved 리터럴 0건)

# 4. checkedOut 카드 filterStatus가 SSOT 헬퍼 경유인지 확인
grep -A5 "variantKey: 'checkedOut'" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx \
  | grep "getCheckoutStatusGroupFilterValue"
# 기대: filterStatus: getCheckoutStatusGroupFilterValue('in_progress')

# 5. returned 카드도 filterStatus가 SSOT 헬퍼 경유인지 확인
grep -A5 "variantKey: 'returned'" \
  apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx \
  | grep "getCheckoutStatusGroupFilterValue"
# 기대: filterStatus: getCheckoutStatusGroupFilterValue('completed')
```

**PASS**:
1. `getSummary()` `inProgress` 카운트 → `CHECKOUT_STATUS_GROUPS.in_progress` spread + sql.join
2. `getSummary()` `returnedToday` 카운트 → `CHECKOUT_STATUS_GROUPS.completed` spread + sql.join
3. `useStatCards` 내 `checkedOut.value = summary.inProgress` (not `summary.approved`)
4. `filterStatus = getCheckoutStatusGroupFilterValue('in_progress')` SSOT 헬퍼 경유

**FAIL**:
- `value: summary.approved` + `filterStatus: getCheckoutStatusGroupFilterValue('in_progress')` 조합 → 집합 불일치 (approved ∉ in_progress)
- `inProgress` 카운트가 하드코딩 상태 목록(`'approved','checked_out',...`) 인라인 → CHECKOUT_STATUS_GROUPS SSOT 우회
- `returnedToday` 카운트가 `CSVal.RETURNED` 단일 → completed 그룹 우회 (return_approved 누락)

**올바른 패턴**:
```typescript
// ✅ 백엔드 — SSOT 그룹에서 배열 도출
const inProgressStatuses = [...CHECKOUT_STATUS_GROUPS.in_progress];
const completedStatuses = [...CHECKOUT_STATUS_GROUPS.completed];
inProgress: sql`COUNT(*) FILTER (WHERE status IN (${sql.join(inProgressStatuses.map(s => sql`${s}`), sql`, `)}))`,
returnedToday: sql`COUNT(*) FILTER (WHERE status IN (${sql.join(completedStatuses.map(s => sql`${s}`), sql`, `)}) AND DATE(...) = CURRENT_DATE)`,

// ✅ 프론트엔드 — summary 필드명과 filterStatus가 같은 그룹을 가리킴
{ variantKey: 'checkedOut', value: summary.inProgress, filterStatus: getCheckoutStatusGroupFilterValue('in_progress') }
{ variantKey: 'returned',   value: summary.returnedToday, filterStatus: getCheckoutStatusGroupFilterValue('completed') }

// ❌ WRONG — 집합 불일치
{ value: summary.approved, filterStatus: getCheckoutStatusGroupFilterValue('in_progress') }
// summary.approved = status='approved' 1개, filterStatus = borrower_approved,...,lender_received 6개
```

**관련 파일**:
- `packages/schemas/src/enums/labels.ts` — `CHECKOUT_STATUS_GROUPS` SSOT 정의 (in_progress, completed)
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `getSummary()` inProgress/returnedToday 카운트
- `packages/schemas/src/checkout.ts` — `CheckoutSummary` 인터페이스 (inProgress 필드명)
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — `useStatCards` KPI 카드 배열
