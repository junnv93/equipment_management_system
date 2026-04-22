---
name: verify-checkout-fsm
description: Checkout FSM SSOT 아키텍처 검증 — Dependency Inversion(UserRole import 금지), assertFsmInvariants, CheckoutPermissionKey 동기화, assertFsmAction 헬퍼, calculateAvailableActions sync, FSM_TO_AUDIT_ACTION 커버리지. packages/schemas/src/fsm/** 또는 checkouts.service.ts 변경 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# Checkout FSM SSOT 검증

## Purpose

`packages/schemas/src/fsm/checkout-fsm.ts`에 정의된 Checkout FSM(유한 상태 기계)의 아키텍처 규칙을 검증합니다:

1. **Dependency Inversion 패턴** — `canPerformAction` / `getNextStep` 함수가 `UserRole` 타입을 직접 import하지 않고 `readonly string[]`으로 권한을 받음
2. **`assertFsmInvariants` 호출** — 모듈 로드 시점에 FSM 불변식이 자동 검증되는지 확인
3. **`CheckoutPermissionKey` 로컬 string union** — Permission enum을 직접 import하지 않고 로컬에서 미러링하는 패턴이 `shared-constants`와 동기화되어 있는지 확인
4. **FSM 소비자의 브릿지 패턴** — 컨트롤러/서비스에서 `getPermissions(role)` 결과를 `string[]`으로 전달하는 패턴 준수

## 배경: Dependency Inversion 설계 결정

`packages/schemas`는 `@equipment-management/shared-constants`에 의존하면 순환 의존성이 발생합니다:

```
schemas ← shared-constants ← schemas  (순환!)
```

따라서 FSM 함수는 `Permission` enum을 직접 받지 않고 `readonly string[]`으로 받습니다.
소비자(컨트롤러/서비스)가 `getPermissions(role)` 브릿지를 통해 string[]으로 변환하여 전달합니다.

## When to Run

- `packages/schemas/src/fsm/**` 변경 후
- `CHECKOUT_TRANSITIONS` 테이블 수정 후
- 새 Permission이 `@equipment-management/shared-constants`에 추가된 후 (`CheckoutPermissionKey` 동기화 필요)
- checkout 관련 컨트롤러/서비스에서 FSM 함수 호출 패턴 변경 후
- `checkouts.service.ts` guard/helper 패턴 변경 후 (PR-2 이후)

## Related Files

| File | Purpose |
|---|---|
| `packages/schemas/src/fsm/checkout-fsm.ts` | FSM SSOT — TransitionRule, 상태 전이 테이블, 공개 API |
| `packages/schemas/src/fsm/index.ts` | barrel 재내보내기 |
| `packages/schemas/src/checkout.ts` | `nextStep` 필드 포함 Checkout 응답 스키마 |
| `packages/schemas/src/__tests__/checkout-fsm.test.ts` | FSM 불변식 + 상태 전이 단위 테스트 (55건) |
| `packages/shared-constants/src/permissions.ts` | Permission enum SSOT — `CheckoutPermissionKey` 동기화 기준 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | FSM 소비자 — assertFsmAction, calculateAvailableActions, buildNextStep, FSM_TO_AUDIT_ACTION |

## Workflow

### Step 1: Dependency Inversion — UserRole 직접 import 금지

FSM 파일이 `UserRole` 또는 `Permission` enum을 직접 import하면 순환 의존성 발생.

```bash
# checkout-fsm.ts가 shared-constants나 UserRole을 직접 import하지 않는지 확인
grep -n "from '@equipment-management/shared-constants'" \
  packages/schemas/src/fsm/checkout-fsm.ts
# 결과: 0건 (PASS)

grep -n "UserRole\|Permission\b" \
  packages/schemas/src/fsm/checkout-fsm.ts \
  | grep "^.*import"
# 결과: 0건 (PASS)
```

**PASS:** 0건. **FAIL:** `shared-constants` import 또는 `UserRole`/`Permission` import 발견.

### Step 2: 함수 시그니처 — readonly string[] 패턴

`canPerformAction`, `getNextStep` 함수가 `userPermissions: readonly string[]`을 받는지 확인.

```bash
# 공개 API 함수 시그니처 확인
grep -n "userPermissions" packages/schemas/src/fsm/checkout-fsm.ts \
  | grep -v "^.*//\|^.*\*"
# 기대값: readonly string[] 타입으로 선언된 라인 존재
```

**PASS:** `readonly string[]` 타입 사용. **FAIL:** `UserRole[]` 또는 `Permission[]` 타입 사용.

### Step 3: assertFsmInvariants 모듈 로드 시 실행

모듈 최상위(top-level) 레벨에서 `assertFsmInvariants(CHECKOUT_TRANSITIONS)` 가 호출되어야 함.
import 시점에 FSM 불변식이 자동 검증됩니다.

```bash
# 모듈 최상위 레벨 호출 확인
grep -n "assertFsmInvariants(CHECKOUT_TRANSITIONS)" \
  packages/schemas/src/fsm/checkout-fsm.ts
# 결과: 1건 이상 (함수 정의 내부가 아닌 모듈 최상위에 위치해야 함)
```

**PASS:** 1건 이상 + 함수 정의 외부(모듈 레벨) 위치. **FAIL:** 0건 또는 함수 내부에 위치.

### Step 4: CheckoutPermissionKey와 Permission enum 동기화

`CheckoutPermissionKey` 로컬 string union의 값이 `shared-constants`의 `Permission` enum과 일치하는지 확인.

```bash
# CheckoutPermissionKey 로컬 정의 추출
grep -A 10 "export type CheckoutPermissionKey" \
  packages/schemas/src/fsm/checkout-fsm.ts
```

```bash
# shared-constants의 checkout 관련 Permission 값 확인
grep -n "checkout" packages/shared-constants/src/permissions.ts \
  | grep -v "//\|import"
# 결과와 CheckoutPermissionKey 값을 수동으로 대조
```

**PASS:** `CheckoutPermissionKey`의 모든 값이 `Permission` enum에 대응하는 값으로 존재.
**FAIL:** `Permission` enum에 없는 값이 `CheckoutPermissionKey`에 있거나, checkout 권한이 추가됐는데 `CheckoutPermissionKey`에 없음.

### Step 5: FSM 소비자 브릿지 패턴 — req.user.permissions 경유 (PR-2 이후)

PR-2 이후 서비스에서 `getPermissions(role)` 직접 호출 금지. `req.user?.permissions`(JwtStrategy.validate()에서 파생)를 사용.

```bash
# checkouts.service.ts에 getPermissions( 직접 호출 0건 확인
grep -n "getPermissions(" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)

# userPermissions = req.user?.permissions 패턴 사용 확인
grep -n "req\.user\?\.permissions\|userPermissions" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | head -10
```

```bash
# UserRole을 직접 전달하는 잘못된 패턴 탐지
grep -rn "canPerformAction.*role\b\|getNextStep.*role\b" \
  apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "//\|test\|spec"
# 결과: 0건 (PASS)
```

**PASS:** 서비스에서 `getPermissions(` 0건 + `req.user?.permissions` 경유.
**FAIL:** 서비스에서 `getPermissions(role)` 직접 호출하거나 `role` 값을 직접 전달.

### Step 8: assertFsmAction 헬퍼 존재 및 패턴 (PR-2 이후)

`assertFsmAction`이 private 헬퍼로 존재하고 7개 이상 guard site에서 호출되는지 확인.

```bash
# assertFsmAction 정의 확인
grep -n "private assertFsmAction" apps/backend/src/modules/checkouts/checkouts.service.ts

# 호출 횟수 (7개 guard site 이상)
grep -c "assertFsmAction\|canPerformAction(" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 8 이상 (PASS)

# 기존 레거시 에러 코드 잔존 금지
grep -n "CHECKOUT_ONLY_PENDING_CAN_APPROVE\|CHECKOUT_ONLY_PENDING_CAN_REJECT\|CHECKOUT_ONLY_APPROVED_CAN_START\|CHECKOUT_ONLY_CHECKED_OUT_CAN_RETURN\|CHECKOUT_ONLY_RETURNED_CAN_APPROVE\|CHECKOUT_ONLY_PENDING_CAN_CANCEL" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)
```

**PASS:** assertFsmAction 정의 1건 + 호출 ≥ 8건 + 레거시 에러 코드 0건.
**FAIL:** 정의 없음, 호출 부족, 레거시 에러 코드 잔존.

### Step 9: calculateAvailableActions sync 패턴 (PR-2 이후)

`calculateAvailableActions`가 `async` 키워드 없이 동기 메서드인지 확인.

```bash
# async 잔존 금지
grep -n "private async calculateAvailableActions" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)

grep -n "private calculateAvailableActions" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1건 (PASS)

# Permission 하드코딩 금지 (COMPLETE_CHECKOUT 예외)
grep -n "Permission\." apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "COMPLETE_CHECKOUT"
# 결과: 0건 (PASS)
```

**PASS:** `private async calculateAvailableActions` 0건 + `private calculateAvailableActions` 1건 + Permission 하드코딩 0건.

### Step 10: buildNextStep + findOne 메타 포함 (PR-2 이후)

`buildNextStep` private 메서드가 존재하고 `findOne` 메타 블록에서 호출되는지 확인.

```bash
grep -n "private buildNextStep" apps/backend/src/modules/checkouts/checkouts.service.ts

grep -n "buildNextStep\|nextStep" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "interface\|type\|//" | head -5
```

**PASS:** `private buildNextStep` 1건 + `meta: { availableActions, nextStep }` 조합 존재.
**FAIL:** 둘 중 하나 없음.

### Step 11: FSM_TO_AUDIT_ACTION 모든 CheckoutAction 커버 (PR-2 이후)

`FSM_TO_AUDIT_ACTION` static 매핑이 모든 `CheckoutAction` 값을 커버하는지 확인.

```bash
# FSM_TO_AUDIT_ACTION 매핑 존재 확인
grep -n "FSM_TO_AUDIT_ACTION" apps/backend/src/modules/checkouts/checkouts.service.ts

# CheckoutAction 정의의 모든 액션 수
grep -A5 "export type CheckoutAction" packages/schemas/src/fsm/checkout-fsm.ts | head -20

# 매핑 항목 수 (CheckoutAction 수와 일치해야 함)
grep -A20 "FSM_TO_AUDIT_ACTION" apps/backend/src/modules/checkouts/checkouts.service.ts | head -20
```

**PASS:** `FSM_TO_AUDIT_ACTION`이 `Record<CheckoutAction, AuditAction>` 타입으로 선언 + tsc 통과(완전성 보장).
**FAIL:** `Record<CheckoutAction, AuditAction>` 타입 없음 (부분 커버 시 컴파일 에러로 탐지되지 않음).

### Step 6: CHECKOUT_TRANSITIONS 테이블 완전성 — 단위 테스트 커버리지 확인

테스트 파일이 존재하며 불변식 테스트가 포함되어 있는지 확인.

```bash
# 테스트 파일 존재 확인
ls packages/schemas/src/__tests__/checkout-fsm.test.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# 테스트 수 확인
grep -c "it\|test\b" packages/schemas/src/__tests__/checkout-fsm.test.ts 2>/dev/null || echo "0"
```

**PASS:** 테스트 파일 존재 + 테스트 30건 이상. **FAIL:** 파일 없거나 테스트 수 부족.

### Step 7: nextStep 필드 — 응답 스키마 포함 확인

`packages/schemas/src/checkout.ts`의 Checkout 응답 스키마에 `nextStep` 필드가 포함되어 있는지 확인.

```bash
grep -n "nextStep" packages/schemas/src/checkout.ts
# 결과: nextStep 필드 정의 라인 (선택적 필드)
```

**PASS:** `nextStep` 필드가 `NextStepDescriptorSchema` 타입으로 포함. **FAIL:** 필드 누락.

## Output Format

```markdown
| #  | 검사                              | 상태      | 상세                                   |
|----|-----------------------------------|-----------|----------------------------------------|
| 1  | Dependency Inversion — import 금지 | PASS/FAIL | shared-constants import 위치           |
| 2  | 함수 시그니처 readonly string[]    | PASS/FAIL | 잘못된 타입 사용 위치                  |
| 3  | assertFsmInvariants 모듈 레벨 호출 | PASS/FAIL | 호출 위치 (없거나 함수 내부면 FAIL)   |
| 4  | CheckoutPermissionKey 동기화       | PASS/FAIL | Permission enum 미대응 값 목록         |
| 5  | 소비자 브릿지 패턴                 | PASS/FAIL | role 직접 전달 위치                    |
| 6  | 단위 테스트 커버리지               | PASS/FAIL | 테스트 파일 존재 + 30건 이상           |
| 7  | nextStep 필드 응답 스키마 포함     | PASS/FAIL | checkout.ts 내 누락 여부               |
| 8  | assertFsmAction 헬퍼 + 호출 ≥ 8  | PASS/FAIL | 정의/호출 수 + 레거시 에러 코드 0건   |
| 9  | calculateAvailableActions sync    | PASS/FAIL | async 제거 + Permission 하드코딩 0건   |
| 10 | buildNextStep + findOne 메타       | PASS/FAIL | 정의 + meta.nextStep 조합              |
| 11 | FSM_TO_AUDIT_ACTION 커버리지       | PASS/FAIL | Record<CheckoutAction, AuditAction> 타입 |
```

## Exceptions

1. **`checkout-fsm.ts` 자체의 상수 정의** — `TERMINAL_STATES`, `CAL_REPAIR`, `RENTAL`, `ALL` 등 모듈 내부 상수는 로컬 정의 허용
2. **`assertFsmInvariants` 함수 정의 자체** — 함수 정의 내부 로직은 검사 대상 아님, 모듈 레벨 *호출*만 검사
3. **테스트 파일의 mock 데이터** — `checkout-fsm.test.ts` 내 임시 CheckoutStatus/Purpose 값은 면제
4. **`NextStepDescriptorSchema`의 `z.enum` 인라인 값** — CheckoutAction/NextActor enum 값이 인라인으로 나열되어 있는 것은 Zod 스키마 특성상 허용 (SSOT는 TypeScript type `CheckoutAction`)
