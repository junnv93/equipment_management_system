# Exec Plan: fsm-terminal-step-index-semantics + actor-variant-role-mapping-gap

작성일: 2026-04-27
범위: 두 tech-debt HIGH 항목을 단일 패키지(packages/schemas SSOT 1회 변경)로 함께 처리.
관련 항목:
- tech-debt 1: fsm-terminal-step-index-semantics (terminal 상태 reachedStepIndex 의미 부여)
- tech-debt 2: actor-variant-role-mapping-gap (NextStepPanel "내 차례" 뱃지)

---

## 0. 사전 아키텍처 감사

### 0.1 SSOT 분산 위험
- `ActorVariant` 타입은 현재 `apps/frontend/components/shared/NextStepPanel.tsx:39`에 로컬 정의.
  → roleToActorVariant 추가 시 schemas로 승격해야 backend availableActions 결정 로직과
  공유 가능. (SSOT Rule 0)
- `resolveActorVariant(NextActor → ActorVariant)`는 frontend-only로 잔존시키는 게 적절
  (UI 컬러 분기 전용). schemas로 옮기면 시각 결정이 schemas에 누수됨.
  → `ActorVariant`는 schemas로, `resolveActorVariant`는 NextStepPanel.tsx에 유지.

### 0.2 FSM 의미론적 함정 — terminal 상태의 step index
- 현 `computeStepIndex` 매핑은 `rejected: 1, canceled: 1`로 단언되어 있으나
  - rental: pending(1) / borrower_approved(2) / approved(3)에서 모두 reject·cancel 가능
  - non-rental: pending(1) / approved(2)에서 reject·cancel 가능
  → `(status, purpose)`만으로는 "어느 step에서 종료됐는가"를 복원 불가.
  → DB 컬럼 `terminated_from_status` 필요.
- `computeStepIndex`의 1 fallback은 유지(이전 동작과의 호환성·table-test snapshot 보존).
  새 함수 `computeReachedStepIndex(status, purpose, terminatedFromStatus?)` 도입하여
  terminal에 한해 `terminatedFromStatus`로 재계산. 비-terminal·미존재 시 currentStepIndex
  fallback.

### 0.3 NextStepDescriptor 변경의 파급 검증
- `NextStepDescriptorSchema` Zod — `reachedStepIndex` 추가 필요.
- table-test TableRow 발췌 필드 목록에 reachedStepIndex 미포함 → snapshot 변경 없음.
- backend `buildNextStep` — `getNextStep` 호출 시 `terminatedFromStatus` 전달.
- frontend의 `stepLabel`(line 145)은 terminal early-return 이후에 위치 → 표시 영향 없음.

### 0.4 Backend 전이 경로 — terminatedFromStatus 설정 대상
- `reject`, `borrowerReject`, `cancel` 3개 메서드가 대상.
- `approve`, `borrowerApprove`, `startCheckout`, `returnCheckout`, `approveReturn`,
  `rejectReturn` 등 비-terminal 전환 메서드는 미관련 → 손대지 않음.

### 0.5 i18n parity
- ko/en 양쪽에 `checkouts.fsm.yourTurn.label` + `ariaLabel` 신규 키 필요.

### 0.6 Migration 운영 제약
- `pnpm db:generate`는 TTY 필요 → harness 환경 자동 실행 불가.
- nullable 컬럼이라 기존 row는 NULL 채움 → backfill 불필요.
- 사용자가 로컬에서 `pnpm --filter backend run db:generate && db:migrate` 수동 실행.

---

## Phase 1: SSOT 기반 — packages/db + packages/schemas

### 목표
- DB 스키마에 `terminated_from_status` 컬럼 추가 (nullable, no backfill)
- schemas에 `ActorVariant` 타입, `roleToActorVariant`, `computeReachedStepIndex` 추가
- `NextStepDescriptor`에 `reachedStepIndex` 필드 추가
- `getNextStep` signature에 `terminatedFromStatus?` 추가
- `NextStepDescriptorSchema` (Zod) 갱신

### 변경 파일

#### 1.1 `packages/db/src/schema/checkouts.ts`
- `checkouts` 테이블에 다음 컬럼 추가:
  ```ts
  terminatedFromStatus: varchar('terminated_from_status', { length: 50 }).$type<CheckoutStatus>(),
  ```
- 인덱스 추가 불필요 (조회 필터 아님, descriptor 계산 전용).

#### 1.2 `packages/schemas/src/fsm/checkout-fsm.ts`
- `ActorVariant` 타입 export 추가 (NextActor 타입 정의 아래):
  ```ts
  /** UI 표현용 actor 그루핑 (3-way). NextActor(FSM)와 분리: actor는 워크플로 시점 의미. */
  export type ActorVariant = 'requester' | 'approver' | 'receiver';
  ```

- `roleToActorVariant` 함수 export 추가 (getNextStep 위):
  ```ts
  /**
   * UserRole → ActorVariant 매핑 SSOT.
   * string 타입으로 받아 순환 의존성 회피 (schemas ← enums 단방향 유지).
   * system_admin → null (특정 본분 없음, availableToCurrentUser 기반 별도 판단).
   */
  export function roleToActorVariant(role: string): ActorVariant | null {
    switch (role) {
      case 'test_engineer': return 'requester';
      case 'quality_manager':
      case 'lab_manager': return 'approver';
      case 'technical_manager': return 'receiver';
      default: return null;
    }
  }
  ```

- `computeReachedStepIndex` 함수 추가 (computeStepIndex 바로 뒤):
  ```ts
  /**
   * Terminal 상태(rejected, canceled)에서 종료 직전 도달 step 복원.
   * 기존 computeStepIndex의 rejected: 1, canceled: 1 매핑은 호환성을 위해 보존.
   */
  export function computeReachedStepIndex(
    status: CheckoutStatus,
    purpose: CheckoutPurpose,
    terminatedFromStatus?: CheckoutStatus | null
  ): number {
    if ((status === 'rejected' || status === 'canceled') && terminatedFromStatus) {
      return computeStepIndex(terminatedFromStatus, purpose);
    }
    return computeStepIndex(status, purpose);
  }
  ```

- `NextStepDescriptor` 인터페이스에 필드 추가:
  ```ts
  /**
   * 도달 단계 — terminal 상태에서도 의미 있는 step index.
   * 비-terminal: currentStepIndex와 동일.
   * terminal + terminatedFromStatus 있음: computeStepIndex(terminatedFromStatus, purpose).
   * terminal + terminatedFromStatus 없음: currentStepIndex (legacy fallback = 1).
   */
  readonly reachedStepIndex: number;
  ```

- `NextStepDescriptorSchema` Zod에 `reachedStepIndex: z.number().int().positive()` 추가.

- `getNextStep` signature 확장:
  - checkout 입력 타입에 `terminatedFromStatus?: CheckoutStatus | null` 추가
  - `reachedStepIndex` 계산: `computeReachedStepIndex(status, purpose, terminatedFromStatus)`
  - 3개 return 분기(terminal early-return, no-candidate, 정상 candidate) 모두 `reachedStepIndex` 포함

#### 1.3 `packages/schemas/src/__tests__/checkout-fsm.test.ts`
- `computeReachedStepIndex` 신규 describe 블록:
  - non-terminal 상태 → computeStepIndex 결과와 동일
  - rejected + terminatedFromStatus='borrower_approved' (rental) → 2
  - canceled + terminatedFromStatus='approved' (rental) → 3
  - canceled + terminatedFromStatus='approved' (non-rental) → 2
  - rejected + terminatedFromStatus 미제공 → 1 (legacy fallback)
- `roleToActorVariant` 신규 describe 블록:
  - 5개 role 각각의 매핑 케이스 + unknown → null
- 기존 `getNextStep` 케이스에 `reachedStepIndex` 필드 존재 검증 추가

#### 1.4 DB 마이그레이션 (사용자 수동)
```bash
pnpm --filter backend run db:generate   # TTY 필요, 사용자 직접 실행
pnpm --filter backend run db:migrate
```

### 검증
```bash
pnpm --filter @equipment-management/schemas run test
pnpm tsc --noEmit
```

---

## Phase 2: Backend service — terminatedFromStatus 기록 + descriptor 전달

### 목표
- `reject`, `borrowerReject`, `cancel` 3개 메서드가 terminal 전환 시 `terminatedFromStatus` 기록.
- `buildNextStep`이 checkout 엔티티의 `terminatedFromStatus`를 `getNextStep`에 전달.

### 변경 파일

#### 2.1 `apps/backend/src/modules/checkouts/checkouts.service.ts`

- `buildNextStep` 메서드: `getNextStep` 호출 인자에
  `terminatedFromStatus: checkout.terminatedFromStatus ?? null` 추가.

- `reject` 메서드: `updateCheckoutStatus` `additionalData`에
  `terminatedFromStatus: checkout.status` 추가 (rejectionReason 옆).

- `borrowerReject` 메서드: 동일하게 `terminatedFromStatus: checkout.status` 추가.

- `cancel` 메서드: update payload에 `terminatedFromStatus: checkout.status` 추가.

**변경 금지 (수술적 원칙)**: 캐시 무효화, 이벤트 발행, audit 로그, scope 검사 — 모두 인접 코드 수정 금지.

### 검증
```bash
pnpm --filter backend run test
pnpm --filter backend run tsc --noEmit
```

---

## Phase 3: Frontend — actor-variant-role-mapping-gap

### 목표
- `NextStepPanel`이 `currentUserRole`을 실제로 사용하여 `isMyTurn` 판정.
- `isMyTurn === true` & 비-terminal 시 "내 차례" 뱃지 렌더 (`CHECKOUT_YOUR_TURN_BADGE_TOKENS`).
- `system_admin`은 `descriptor.availableToCurrentUser`로 판단.

### 변경 파일

#### 3.1 `apps/frontend/components/shared/NextStepPanel.tsx`

- import 변경:
  - `ActorVariant` schemas에서 import
  - `roleToActorVariant` schemas에서 import
  - `CHECKOUT_YOUR_TURN_BADGE_TOKENS` design-tokens barrel에서 import (이미 있으면 생략)
  - `Bell` lucide icon 추가

- 로컬 `type ActorVariant` 정의 라인 삭제 (line 39).

- props: `currentUserRole: _currentUserRole,` → `currentUserRole,`

- `actorVariant` 계산 바로 아래에 isMyTurn 로직 추가:
  ```ts
  const userActorVariant = currentUserRole ? roleToActorVariant(currentUserRole) : null;
  const isMyTurn = currentUserRole === 'system_admin'
    ? descriptor.availableToCurrentUser
    : userActorVariant !== null && userActorVariant === actorVariant;
  ```

- 인라인 `YourTurnBadge` 컴포넌트 추가 (Helpers 섹션):
  ```tsx
  function YourTurnBadge({ urgency }: { urgency: Urgency }) {
    const t = useTranslations('checkouts.fsm');
    return (
      <span
        role="status"
        aria-label={t('yourTurn.ariaLabel')}
        className={cn(
          CHECKOUT_YOUR_TURN_BADGE_TOKENS.base,
          CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant[urgency]
        )}
        data-testid="your-turn-badge"
        data-urgency={urgency}
      >
        <Bell className={CHECKOUT_YOUR_TURN_BADGE_TOKENS.icon} aria-hidden="true" />
        {t('yourTurn.label')}
      </span>
    );
  }
  ```

- 뱃지 렌더링:
  - hero variant: panelTitle 옆 헤더 영역에 `{isMyTurn && <YourTurnBadge urgency={urgency} />}`
  - inline/floating: stepLabel 위에 뱃지
  - compact: `CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary` 스타일로 축소 표시 또는 border 강조
  - terminal 분기(nextAction === null): 뱃지 렌더 없음 (early-return 유지)

- 비-terminal 컨테이너에 `data-my-turn={isMyTurn ? 'true' : 'false'}` 추가 (E2E hook용).

#### 3.2 `apps/frontend/messages/ko/checkouts.json`
- `fsm` 객체 내 `yourTurn` 키 추가:
  ```json
  "yourTurn": {
    "label": "내 차례",
    "ariaLabel": "내 차례"
  }
  ```

#### 3.3 `apps/frontend/messages/en/checkouts.json`
- 동일 위치:
  ```json
  "yourTurn": {
    "label": "Your Turn",
    "ariaLabel": "Your turn"
  }
  ```

### 검증
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test
```

---

## Phase 4: 통합 검증

### 정적 검증
```bash
pnpm tsc --noEmit
pnpm --filter @equipment-management/schemas run test
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm lint
```

### SSOT grep 검증 (수동)
```bash
# ActorVariant 타입이 schemas에만 1곳 존재하는지 확인
grep -rn "type ActorVariant" apps/frontend packages/
# roleToActorVariant이 frontend에서 import만 하는지 확인 (정의 없음)
grep -rn "roleToActorVariant" apps/frontend packages/
```

### 동작 검증 (사용자 수동 — dev 환경)
1. `pnpm --filter backend run db:generate` → 새 SQL 마이그레이션 1개 생성 확인
2. `pnpm --filter backend run db:migrate` → terminated_from_status 컬럼 추가 확인
3. `pnpm dev` 기동 후:
   - rental pending → borrower_approve → reject → GET detail의 `reachedStepIndex === 2`
   - rental approved → cancel → `reachedStepIndex === 3`
   - non-rental pending → reject → `reachedStepIndex === 1`
   - 본인 차례 checkout에서 "내 차례" 뱃지 시각 확인
   - quality_manager 계정에서 동일 checkout 진입 시 뱃지 미표시

---

## 변경하지 않을 파일

- `packages/schemas/src/fsm/checkout-fsm.ts`의 transitions 테이블, invariant assertions,
  `computeStepIndex` map (rejected: 1, canceled: 1 보존 — 호환성)
- `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` (snapshot 보존)
- `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` (자동 생성)
- backend의 approve/borrowerApprove/startCheckout/returnCheckout/approveReturn/rejectReturn
- NextStepPanel의 hero/inline/compact 분기 내 기존 레이아웃·data-testid·aria 처리

---

## 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| computeStepIndex 매핑 변경으로 table-test snapshot 깨짐 | 기존 매핑 보존, computeReachedStepIndex 별도 신설 |
| terminated_from_status NULL legacy row | computeReachedStepIndex가 currentStepIndex로 fallback (=1, 기존 동작) |
| isMyTurn === true이지만 availableToCurrentUser === false | isMyTurn은 시각 보조; 액션 버튼은 canAct(availableToCurrentUser)로 별도 게이팅 유지 |
| system_admin이 모든 checkout에 뱃지 노이즈 | descriptor.availableToCurrentUser 게이트 → 실제 액션 가능 시에만 표시 |
| 호출처 currentUserRole prop 미전달 | isMyTurn=false로 fail-safe (뱃지 미표시), 기능 무결 |
