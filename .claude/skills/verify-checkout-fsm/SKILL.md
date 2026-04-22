---
name: verify-checkout-fsm
description: Checkout FSM SSOT 아키텍처 검증 — Dependency Inversion(UserRole import 금지), assertFsmInvariants, CheckoutPermissionKey 동기화, assertFsmAction 헬퍼, calculateAvailableActions sync, FSM_TO_AUDIT_ACTION 커버리지, lenderTeam identity-rule 강제 패턴, NO_EQUIPMENT 가드 배치. packages/schemas/src/fsm/** 또는 checkouts.service.ts 변경 후 사용.
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

### Step 12: assertFsmAction HTTP 의미론 — 403/400 분리 (세션 이후)

`assertFsmAction`이 `invalid_transition`→`BadRequestException(400)`, permission denied→`ForbiddenException(403)` 를 구분하는지 확인.

```bash
# invalid_transition → BadRequestException 확인
grep -A 5 "invalid_transition" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "BadRequestException"
# 결과: 1건 이상 (PASS)

# permission denied → ForbiddenException 확인 (BadRequestException 금지)
grep -A 10 "assertFsmAction" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -A5 "check\.reason" | grep "ForbiddenException"
# 결과: 1건 이상 (PASS)

# assertFsmAction 내부에서 BadRequestException을 CHECKOUT_FORBIDDEN에 쓰면 위반
grep -B2 "CHECKOUT_FORBIDDEN" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "BadRequestException"
# 결과: 0건 (PASS)
```

**PASS:** `invalid_transition`→400, `CHECKOUT_FORBIDDEN`→403 분리. **FAIL:** `CHECKOUT_FORBIDDEN`이 `BadRequestException`에 포함.

### Step 13: Controller guard ↔ FSM permission 정렬 (세션 이후)

approve/approve-return/reject-return 엔드포인트가 FSM 전이에서 요구하는 Permission과 동일한 guard를 갖는지 확인.

```bash
# approve 엔드포인트: APPROVE_CHECKOUT 요구
grep -B1 "async approve\b" apps/backend/src/modules/checkouts/checkouts.controller.ts \
  | grep "APPROVE_CHECKOUT"
# 결과: 1건 (PASS)

# approve-return 엔드포인트: APPROVE_CHECKOUT 요구
grep -B3 "approve-return" apps/backend/src/modules/checkouts/checkouts.controller.ts \
  | grep "APPROVE_CHECKOUT"
# 결과: 1건 (PASS)

# reject-return 엔드포인트: REJECT_CHECKOUT 요구
grep -B3 "reject-return" apps/backend/src/modules/checkouts/checkouts.controller.ts \
  | grep "REJECT_CHECKOUT"
# 결과: 1건 (PASS)

# VIEW_CHECKOUTS가 approve/approve-return/reject-return에 잔존하면 위반
grep -A3 "'(:uuid/approve\|:uuid/approve-return\|:uuid/reject-return)" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts \
  | grep "VIEW_CHECKOUTS"
# 결과: 0건 (PASS)
```

**PASS:** approve→APPROVE_CHECKOUT, approve-return→APPROVE_CHECKOUT, reject-return→REJECT_CHECKOUT.
**FAIL:** VIEW_CHECKOUTS가 세 엔드포인트 중 하나에 사용됨.

### Step 14: writeTransitionAudit best-effort 캡슐화 (세션 이후)

`writeTransitionAudit` 메서드 내부에 try/catch가 있고, 콜사이트(7개 메서드)에는 없는지 확인.

```bash
# 메서드 내부 try/catch 확인 (writeTransitionAudit 정의 블록 내)
grep -A 20 "private async writeTransitionAudit" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | grep "try {"
# 결과: 1건 (PASS)

# 콜사이트 주변 try/catch 잔존 금지
# writeTransitionAudit 호출 전후 5줄에 "} catch (auditErr)" 패턴 금지
grep -B2 "await this\.writeTransitionAudit(" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | grep "try {"
# 결과: 0건 (PASS) — 콜사이트에 별도 try 없어야 함
```

**PASS:** 메서드 내부 try/catch 1건 + 콜사이트 try/catch 0건. **FAIL:** 콜사이트에 try/catch 잔존.

### Step 15: 예외 계층 일관화 — 7개 FSM 메서드 catch 블록 (세션 이후)

approve/reject/startCheckout/returnCheckout/approveReturn/rejectReturn/cancel 7개 outer catch 블록이 `ForbiddenException`과 `ConflictException`을 모두 포함하는지 확인.

```bash
# ForbiddenException이 모든 outer catch에 있는지 (7개 메서드 기준)
grep -c "error instanceof ForbiddenException" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 7 이상 (PASS)

# ConflictException이 모든 outer catch에 있는지 (7개 메서드 기준)
grep -c "error instanceof ConflictException" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 7 이상 (PASS) — writeTransitionAudit 외부 catch 포함

# lenderTeam 전용 체크가 ForbiddenException으로 일관화되었는지
grep -B2 "CHECKOUT_LENDER_TEAM_ONLY" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | grep "ForbiddenException"
# 결과: 2건 (approve + rejectReturn, PASS)

grep -B2 "CHECKOUT_LENDER_TEAM_ONLY" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | grep "BadRequestException"
# 결과: 0건 (PASS)
```

**PASS:** ForbiddenException ≥ 7건 + ConflictException ≥ 7건 + lenderTeam ForbiddenException 2건/BadRequestException 0건.
**FAIL:** 어느 하나라도 카운트 미달이거나 BadRequestException으로 잘못 분류.

### Step 16: CheckoutErrorCode SSOT — 인라인 에러 코드 문자열 금지 (2026-04-22 이후)

`checkouts.service.ts`와 `checkouts.controller.ts`에서 `code: 'CHECKOUT_*'` 인라인 문자열을 사용하지 않고 `CheckoutErrorCode` 상수를 경유하는지 확인.

```bash
# service.ts 인라인 에러 코드 문자열 탐지
grep -c "code: 'CHECKOUT_" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0 (PASS)

# controller.ts 인라인 에러 코드 문자열 탐지
grep -c "code: 'CHECKOUT_" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 결과: 0 (PASS)

# CheckoutErrorCode import 확인
grep "from './checkout-error-codes'" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: import 라인 1건 (PASS)
```

**PASS:** service.ts + controller.ts 모두 인라인 `'CHECKOUT_*'` 문자열 0건, `CheckoutErrorCode` import 존재.
**FAIL:** 인라인 문자열 1건 이상 → `checkout-error-codes.ts`에 해당 키 추가 후 참조 전환.

### Step 17: Controller 레이어 경계 — 서비스 중복 검증 금지 (2026-04-22 이후)

컨트롤러가 서비스 레이어의 비즈니스 검증을 복제하지 않는지 확인. reject 반려 사유 검증이 컨트롤러에서 다시 수행되면 에러 메시지가 달라지는 드리프트가 발생한다.

```bash
# controller에서 reason 빈 문자열 직접 검증 탐지
grep -n "reason.*trim\|reason.*length.*0" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 결과: 0건 (PASS) — 서비스 단일 경로

# controller의 BadRequestException 사용이 서비스 로직 복제가 아닌지 확인
grep -n "BadRequestException" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 허용: handover token 상태 검증 등 컨트롤러 전용 흐름
# 금지: 서비스와 동일한 code/message로 throw
```

**PASS:** controller에 `reason.*trim` 패턴 0건. 서비스가 비즈니스 검증 단일 경로.
**FAIL:** controller에서 서비스와 동일한 코드/메시지로 BadRequestException throw → 컨트롤러 블록 제거.

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
| 12 | assertFsmAction HTTP 의미론        | PASS/FAIL | invalid_transition→400, forbidden→403 분리 |
| 13 | Controller guard ↔ FSM 정렬        | PASS/FAIL | approve/approve-return/reject-return guard |
| 14 | writeTransitionAudit 캡슐화        | PASS/FAIL | 메서드 내부 try/catch, 콜사이트 0건    |
| 15 | 예외 계층 일관화 (7개 메서드)       | PASS/FAIL | ForbiddenException+ConflictException ≥7건 |
| 16 | CheckoutErrorCode SSOT 인라인 금지  | PASS/FAIL | service+controller 인라인 'CHECKOUT_*' 0건 |
| 17 | Controller 레이어 경계 준수         | PASS/FAIL | controller reason.trim 중복 검증 0건 |
```

### Step 18: lenderTeam identity-rule 강제 패턴 — approverTeamId 바이패스 금지 (2026-04-22 이후)

RENTAL + lenderTeamId 조건 성립 시 `approverTeamId`의 존재 유무와 **무관하게** identity 검증이 실행되어야 한다.
`&& approverTeamId` 조건이 외부 if에 포함되면 팀 미소속 사용자가 바이패스 가능.

```bash
# approve: 올바른 패턴 — 외부 조건에 approverTeamId 없어야 함
grep -A3 "purpose.*RENTAL.*lenderTeamId\|lenderTeamId.*purpose.*RENTAL" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "approverTeamId" | head -5
# 기대: 'if (checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId)' 형태 존재

# 구버전 바이패스 패턴 탐지 (금지)
grep -n "RENTAL.*lenderTeamId.*approverTeamId\|lenderTeamId.*approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "if ("
# 결과: 0건 (PASS) — && approverTeamId 외부 조건 잔존 금지

# 내부에 !approverTeamId 분기 존재 확인
grep -c "!approverTeamId\|!rejectReturnDto\.approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 2 이상 (approve 1건 + rejectReturn 1건, PASS)
```

**PASS:** 외부 조건에 `&& approverTeamId` 0건 + `!approverTeamId` 분기 ≥ 2건.
**FAIL:** `if (... && lenderTeamId && approverTeamId)` 형태 잔존 → approverTeamId 조건 제거 후 내부 `!approverTeamId` 분기 추가.

### Step 19: NO_EQUIPMENT 가드 배치 — enforceScopeFromData 이전 위치 확인 (2026-04-22 이후)

`approve`와 `rejectReturn`에서 items가 빈 경우 `enforceScopeFromData`가 묵시적으로 통과되지 않도록
`NO_EQUIPMENT` 가드가 scope 검증 **이전**에 위치해야 한다.

```bash
# NO_EQUIPMENT 가드 존재 확인 (approve + rejectReturn 각 1건)
grep -c "NO_EQUIPMENT" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 2 이상 (PASS)

# 가드 패턴: !firstEquip → throw BadRequestException(NO_EQUIPMENT)
grep -n "!firstEquip" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: approve + rejectReturn 각 1건 (PASS)

# 구버전 묵시적 통과 패턴 탐지 (금지): if (firstEquip) { enforceScopeFromData ...}
grep -n "if (firstEquip)" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 조건부 scope 검증 금지
```

**PASS:** `NO_EQUIPMENT` 가드 ≥ 2건 + `if (firstEquip)` 패턴 0건.
**FAIL:** `if (firstEquip) { this.enforceScopeFromData(...) }` 잔존 → `!firstEquip` throw 패턴으로 변환.

## Exceptions

1. **`checkout-fsm.ts` 자체의 상수 정의** — `TERMINAL_STATES`, `CAL_REPAIR`, `RENTAL`, `ALL` 등 모듈 내부 상수는 로컬 정의 허용
2. **`assertFsmInvariants` 함수 정의 자체** — 함수 정의 내부 로직은 검사 대상 아님, 모듈 레벨 *호출*만 검사
3. **테스트 파일의 mock 데이터** — `checkout-fsm.test.ts` 내 임시 CheckoutStatus/Purpose 값은 면제
4. **`NextStepDescriptorSchema`의 `z.enum` 인라인 값** — CheckoutAction/NextActor enum 값이 인라인으로 나열되어 있는 것은 Zod 스키마 특성상 허용 (SSOT는 TypeScript type `CheckoutAction`)
5. **`approveReturn`의 NO_EQUIPMENT 가드 미적용** — 현재 tech-debt로 기록됨 (2026-04-22). 수정 전까지 Step 19는 approve + rejectReturn 2건만 검증.
