---
name: verify-checkout-fsm
description: Checkout FSM SSOT 아키텍처 검증 — Dependency Inversion(UserRole import 금지), assertFsmInvariants, CheckoutPermissionKey 동기화, assertFsmAction 헬퍼, calculateAvailableActions sync, FSM_TO_AUDIT_ACTION 커버리지, lenderTeam identity-rule 강제 패턴, NO_EQUIPMENT 가드 배치, findCheckoutEntity 분리(Step 28), findOne userPermissions 필수(Step 29), FSM drift safeParse(Step 30), findOne CheckoutWithMeta 단일 반환(Step 31), 280 table test 존재(Step 32), rental-phase.ts SSOT exhaustiveness guard(Step 33). packages/schemas/src/fsm/** 또는 checkouts.service.ts 변경 후 사용.
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
| `packages/schemas/src/fsm/rental-phase.ts` | RentalPhase SSOT — RENTAL_STATUS_TO_PHASE, getRentalPhase, getPhaseIndex, @ts-expect-error negative test (Sprint 1.2 신규) |
| `packages/schemas/src/fsm/index.ts` | barrel 재내보내기 |
| `packages/schemas/src/checkout.ts` | `nextStep` 필드 포함 Checkout 응답 스키마 |
| `packages/schemas/src/__tests__/checkout-fsm.test.ts` | FSM 불변식 + 상태 전이 단위 테스트 (55건) |
| `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` | 280 조합 exhaustive table test (Sprint 1.1 신규) |
| `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` | DESCRIPTOR_TABLE baseline fixture — `getNextStep()` 런타임 동적 계산 |
| `packages/shared-constants/src/permissions.ts` | Permission enum SSOT — `CheckoutPermissionKey` 동기화 기준 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | FSM 소비자 — assertFsmAction, calculateAvailableActions, buildNextStep, FSM_TO_AUDIT_ACTION |
| `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` | 프론트엔드 FSM 소비자 — handleNextStepAction dispatcher, CheckoutAction 전체 매핑 |

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

### Step 7: nextStep 필드 — 응답 스키마 + 프론트엔드 API 타입 동기화 확인

`packages/schemas/src/checkout.ts`의 Checkout 응답 스키마에 `nextStep` 필드가 포함되어 있는지, AND 프론트엔드 API 타입(`checkout-api.ts:Checkout.meta`)에도 동기화되어 있는지 확인.

```bash
# backend schema 확인
grep -n "nextStep" packages/schemas/src/checkout.ts
# 결과: nextStep 필드 정의 라인 (선택적 필드)

# frontend API 타입 동기화 확인 (Server-Driven UI 파이프라인 완결)
grep -n "nextStep" apps/frontend/lib/api/checkout-api.ts
# 결과: Checkout.meta에 nextStep?: NextStepDescriptor | null 포함
```

**PASS:**
- backend: `nextStep` 필드가 `NextStepDescriptorSchema` 타입으로 포함
- frontend: `Checkout.meta.nextStep?: NextStepDescriptor | null` 선언
  (이 필드가 없으면 `useCheckoutNextStep`이 서버 응답을 무시하고 항상 client fallback으로 동작)

**FAIL:** 둘 중 하나라도 누락.

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
| 18 | lenderTeam identity-rule 강제       | PASS/FAIL | 외부 && approverTeamId 0건 + !approverTeamId ≥ 1건 (approve만) |
| 19 | NO_EQUIPMENT 가드 배치              | PASS/FAIL | ≥ 4건 + if (firstEquip) 0건 |
| 20 | rejectReturn checkTeamPermission unconditional | PASS/FAIL | rejectReturnDto.approverTeamId 0건 + req.user?.teamId 직접 참조 |
| 21 | checkTeamPermission ClassificationEnum SSOT | PASS/FAIL | 하드코딩 'general_emc'/'general_rf' 0건 + ClassificationEnum.enum.* 참조 |
| 22 | firstEquip 취득 패턴 — items[0] 기준        | PASS/FAIL | values().next().value 0건 + get(items[0].equipmentId) ≥ 3건 |
| 23 | rejectReturn reason 검증 순서 — scope/FSM 이후 | PASS/FAIL | REJECTION_REASON_REQUIRED 라인 > enforceScopeFromData 라인 |
| 24 | checkout-api.ts Checkout.meta.nextStep 타입 동기화 | PASS/FAIL | meta.nextStep?: NextStepDescriptor \| null 선언 존재 |
| 25 | borrower 액터 identity-rule 강제 (2026-04-24 상시) | PASS/FAIL | scope-먼저 순서 + lenderTeamId payload + 프론트 독립 const |
| 26 | handleNextStepAction FRONTEND_ROUTES 완전 매핑 | PASS/FAIL | router.push/href 인라인 URL 0건 |
| 27 | useCheckoutGroupDescriptors N+1 방지 + feature flag | PASS/FAIL | getNextStep useMemo 단독 + isNextStepPanelEnabled 2곳 |
| 28 | findCheckoutEntity 분리 — 순수 엔티티 취득 | PASS/FAIL | private findCheckoutEntity 1건 + this.findCheckoutEntity ≥ 2건 |
| 29 | findOne userPermissions 필수 파라미터 (no ?) | PASS/FAIL | userPermissions? 0건 |
| 30 | FSM drift safeParse 가드 — buildNextStep 내 | PASS/FAIL | NextStepDescriptorSchema.safeParse + [FSM drift] Logger.warn |
| 31 | findOne 반환 타입 — CheckoutWithMeta 단일 | PASS/FAIL | Promise<CheckoutWithMeta> 선언 + 유니온 타입 0건 |
| 32 | 280 table test 존재 (Sprint 1.1 신규) | PASS/FAIL | checkout-fsm.table.test.ts + fixtures/descriptor-table.ts |
```

### Step 18: lenderTeam identity-rule 강제 패턴 — approverTeamId 바이패스 금지 (2026-04-22 이후)

RENTAL + lenderTeamId 조건 성립 시 `approverTeamId`의 존재 유무와 **무관하게** identity 검증이 실행되어야 한다.
`&& approverTeamId` 조건이 외부 if에 포함되면 팀 미소속 사용자가 바이패스 가능.

`approve`만 RENTAL identity-rule 대상 (rejectReturn의 identity-rule은 `approve`와 동일 진입점에서 처리).

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

# approve 내부에 !approverTeamId 분기 존재 확인 (1건)
grep -n "!approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1건 이상 (approve identity-rule 분기, PASS)
```

**PASS:** 외부 조건에 `&& approverTeamId` 0건 + `!approverTeamId` 분기 ≥ 1건.
**FAIL:** `if (... && lenderTeamId && approverTeamId)` 형태 잔존 → approverTeamId 조건 제거 후 내부 `!approverTeamId` 분기 추가.

> **Note (2026-04-22):** `rejectReturn`의 `approverTeamId`는 더 이상 DTO 경유가 아닌 `req.user?.teamId` 직접 참조 (Rule 2 패턴 통일). `rejectReturnDto.approverTeamId` 참조는 더 이상 존재하지 않으므로 grep 패턴에서 제거.

### Step 19: NO_EQUIPMENT 가드 배치 — enforceScopeFromData 이전 위치 확인 (2026-04-22 이후)

`approve`, `approveReturn`, `rejectReturn`에서 items가 빈 경우 `enforceScopeFromData`가 묵시적으로 통과되지 않도록
`NO_EQUIPMENT` 가드가 scope 검증 **이전**에 위치해야 한다.

```bash
# NO_EQUIPMENT 가드 존재 확인 (approve + approveReturn + rejectReturn + 기타 포함 4건 이상)
grep -c "NO_EQUIPMENT" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 4 이상 (PASS)

# 가드 패턴: !firstEquip → throw BadRequestException(NO_EQUIPMENT)
grep -n "!firstEquip\|!firstEquipment" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: approve + approveReturn + rejectReturn 각 1건 이상 (PASS)

# 구버전 묵시적 통과 패턴 탐지 (금지): if (firstEquip) { enforceScopeFromData ...}
grep -n "if (firstEquip)" apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 조건부 scope 검증 금지
```

**PASS:** `NO_EQUIPMENT` 가드 ≥ 4건 + `if (firstEquip)` 패턴 0건.
**FAIL:** `if (firstEquip) { this.enforceScopeFromData(...) }` 잔존 → `!firstEquip` throw 패턴으로 변환.

### Step 20: rejectReturn checkTeamPermission unconditional 패턴 (checkout-lender-guard-p1p3 세션 이후)

`rejectReturn`에서 `checkTeamPermission`이 `approverTeamId` 유무와 무관하게 for 루프 내에서 **무조건** 호출되어야 한다.
`approverTeamId`가 없으면 `approverClassification`이 `undefined`이 되고, `checkTeamPermission`은 `undefined`를 허용해야 한다.
이전 패턴: `if (equip && approverTeamId)` → 승인자 팀 미제공 시 장비 분류 검증 바이패스 가능.

> **2026-04-22 업데이트:** `approverTeamId`는 더 이상 DTO에서 전달받지 않고 `req.user?.teamId` 직접 참조 (Rule 2 통일).
> `if (rejectReturnDto.approverTeamId)` 패턴은 더 이상 존재하지 않으며, `const approverTeamId = req.user?.teamId` + `if (approverTeamId)` 패턴을 사용.

```bash
# rejectReturn 내부에서 approverTeamId = req.user?.teamId 직접 참조 확인 (Rule 2)
grep -A5 "async rejectReturn" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "req.user"
# 기대: req.user?.teamId 참조 라인 존재

# for 루프가 if (approverTeamId) 블록 밖에 위치하는지 확인
grep -A 30 "let approverClassification" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -B5 "checkTeamPermission" | head -15
# 기대: for (const item of items) 루프가 if (approverTeamId) 블록 밖에 위치

# 금지 패턴: rejectReturnDto.approverTeamId DTO 필드 참조 잔존 (Rule 2 위반)
grep -n "rejectReturnDto\.approverTeamId" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — DTO 필드 경유 금지, req.user?.teamId 직접 참조 필수
```

**PASS:** `rejectReturnDto.approverTeamId` 참조 0건 + `req.user?.teamId` 직접 참조 존재 + `for (const item of items)` 루프가 `if (approverTeamId)` 블록 외부에 위치 + 루프 내 `this.checkTeamPermission(equip, approverClassification)` 호출.
**FAIL:** `rejectReturnDto.approverTeamId` 참조 잔존(Rule 2 위반) 또는 `checkTeamPermission`이 `if (approverTeamId)` 블록 내부에 포함되어 미소속 사용자 장비 분류 검증 바이패스됨.

### Step 21: checkTeamPermission ClassificationEnum SSOT — 하드코딩 금지 (2026-04-22 이후)

`checkTeamPermission`에서 팀 분류 비교 시 `'general_emc'`, `'general_rf'` 문자열 리터럴을 하드코딩하면 안 됩니다.
`ClassificationEnum.enum.general_emc` / `ClassificationEnum.enum.general_rf` SSOT 참조를 사용해야 합니다.

```bash
# ClassificationEnum import 확인
grep -n "ClassificationEnum" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | head -5
# 기대: ClassificationEnum import 라인 존재

# SSOT 참조 확인
grep -n "ClassificationEnum\.enum\." \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: general_emc, general_rf 각 1건 이상

# 하드코딩 잔존 탐지 (금지)
grep -n "'general_emc'\|'general_rf'\|\"general_emc\"\|\"general_rf\"" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 하드코딩 금지
```

**PASS:** `ClassificationEnum` import 존재 + `ClassificationEnum.enum.general_emc/general_rf` 참조 + 하드코딩 0건.
**FAIL:** `'general_emc'` / `'general_rf'` 문자열 리터럴 잔존 → `ClassificationEnum.enum.*` SSOT 참조로 교체.

### Step 22: firstEquip 취득 패턴 — items 배열 순서 기준 (2026-04-24 이후)

`approve`, `approveReturn`, `rejectReturn` 세 메서드에서 `firstEquip`을 취득할 때
`equipmentMap.values().next().value` 패턴은 캐시 혼합 시 `items[0]`과 다른 장비를 반환할 수 있다.
`findByIds`는 캐시 히트 항목을 먼저 Map에 삽입하므로 `values()` 순서가 비결정적이다.
반드시 `equipmentMap.get(items[0].equipmentId)` 패턴을 사용해야 한다.

```bash
# 금지 패턴: values().next().value 취득 (캐시 혼합 시 Map 삽입 순서 비결정성)
grep -n "equipmentMap\.values()\.next()\.value" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)

# 올바른 패턴 확인: items 배열 순서 기준 취득 (3건 이상)
grep -c "equipmentMap\.get(items\[0\]\.equipmentId)" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 3 이상 (approve + approveReturn + rejectReturn, PASS)
```

**PASS:** `values().next().value` 패턴 0건 + `get(items[0].equipmentId)` 패턴 ≥ 3건.
**FAIL:** `values().next().value` 잔존 → `items.length > 0 ? equipmentMap.get(items[0].equipmentId) : undefined` 패턴으로 교체.

### Step 23: rejectReturn reason 검증 순서 — scope/FSM 이후 위치 (2026-04-24 이후)

`rejectReturn`에서 `reason` 빈값 검증이 `enforceScopeFromData` + `assertFsmAction` 이전에 위치하면,
스코프 외 사용자가 `REJECTION_REASON_REQUIRED` 오류를 수신하여 checkout 상태를 역추론할 수 있다.
`reason` 검증은 scope/FSM 검증 이후에 위치해야 한다.

```bash
# REJECTION_REASON_REQUIRED가 enforceScopeFromData보다 이전에 위치하는지 탐지
# (라인 번호 비교: REJECTION_REASON_REQUIRED 라인 > enforceScopeFromData rejectReturn 라인)
python3 - <<'EOF'
import subprocess, re

content = open('apps/backend/src/modules/checkouts/checkouts.service.ts').read()
lines = content.split('\n')

reject_return_start = next(
  i for i, l in enumerate(lines) if 'async rejectReturn(' in l
)
scope_line = next(
  (i for i, l in enumerate(lines[reject_return_start:], reject_return_start)
   if 'enforceScopeFromData(' in l), None
)
reason_line = next(
  (i for i, l in enumerate(lines[reject_return_start:], reject_return_start)
   if 'REJECTION_REASON_REQUIRED' in l), None
)

if scope_line and reason_line:
  if reason_line > scope_line:
    print(f"PASS: reason check (L{reason_line+1}) after scope check (L{scope_line+1})")
  else:
    print(f"FAIL: reason check (L{reason_line+1}) BEFORE scope check (L{scope_line+1})")
else:
  print("WARN: could not locate both lines")
EOF
# 기대: PASS: reason check (L...) after scope check (L...)
```

**PASS:** `REJECTION_REASON_REQUIRED` 라인 번호 > `enforceScopeFromData` 라인 번호 (rejectReturn 메서드 내).
**FAIL:** reason 검증이 scope 검증보다 앞에 위치 → reason 검증 블록을 `assertFsmAction` 이후로 이동.

### Step 24: checkout-api.ts Checkout.meta.nextStep 타입 동기화 (2026-04-24 이후)

Server-Driven UI 파이프라인: `서버 응답 → Checkout.meta.nextStep → useCheckoutNextStep(nextStep) → Zod parse → client fallback`.
프론트엔드 API 타입에 `nextStep` 필드가 없으면 서버 응답이 타입 레벨에서 버려져 항상 client fallback 동작.

```bash
# Checkout.meta에 nextStep 필드 존재 확인
grep -n "nextStep" apps/frontend/lib/api/checkout-api.ts
# 기대: meta?: { availableActions: ...; nextStep?: NextStepDescriptor | null; }
```

**PASS:** `meta.nextStep?: NextStepDescriptor | null` 선언 존재.
**FAIL:** meta 객체에 nextStep 누락 → `useCheckoutNextStep`이 항상 client fallback으로 동작 (설계 의도 역전).

### Step 25: borrower 액터 identity-rule 강제 (2026-04-24 구현 완료, 상시 검사)

rental 2-step 승인 워크플로우의 `borrowerApprove`/`borrowerReject` 메서드:

- `req.user.teamId === checkout.requester.teamId` 강제 (차용 팀 TM만 승인 가능)
- scope 검증 호출이 `assertFsmAction`보다 먼저 실행 — scope-먼저 원칙 준수
- emitAsync payload에 `lenderTeamId` 포함 — composite 알림 전략(`CHECKOUT_BORROWER_APPROVED`) 전제 조건
- 프론트엔드에서 `canBorrowerApprove`/`canBorrowerReject`를 독립 const로 선언 — 인라인 조건 중복 금지

```bash
# borrowerApprove 메서드 구현 확인
grep -c "async borrowerApprove" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1 이상 (PASS) — 0이면 Phase 구현 누락
```

```bash
# scope-먼저 원칙: scope 검증이 assertFsmAction보다 앞에 위치하는지 확인
python3 - <<'EOF'
content = open('apps/backend/src/modules/checkouts/checkouts.service.ts').read()
lines = content.split('\n')
ba_start = next((i for i, l in enumerate(lines) if 'async borrowerApprove(' in l), None)
if ba_start is None:
    print("FAIL: borrowerApprove 미구현")
else:
    fsm_line = next((i for i, l in enumerate(lines[ba_start:], ba_start) if 'assertFsmAction' in l), None)
    scope_line = next((i for i, l in enumerate(lines[ba_start:], ba_start)
                       if 'enforceScopeFromData' in l or 'enforceScopeForBorrower' in l), None)
    if scope_line and fsm_line and scope_line < fsm_line:
        print(f"PASS: scope 검증(L{scope_line+1}) -> assertFsmAction(L{fsm_line+1}) 순서 정상")
    elif scope_line and fsm_line:
        print(f"FAIL: scope 검증(L{scope_line+1})이 assertFsmAction(L{fsm_line+1}) 이후 -- 순서 위반")
    else:
        print(f"WARN: scope_line={scope_line}, fsm_line={fsm_line} -- 수동 확인 필요")
EOF
```

```bash
# borrowerApprove emitAsync payload에 lenderTeamId 포함 확인 (composite 알림 전략 전제 조건)
grep -A20 "emitAsync(NOTIFICATION_EVENTS.CHECKOUT_BORROWER_APPROVED" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "lenderTeamId"
# 결과: lenderTeamId 포함 라인 1건 (PASS)
```

```bash
# 프론트엔드 canBorrowerApprove / canBorrowerReject 독립 const 선언 확인
grep -n "canBorrowerApprove\|canBorrowerReject" \
  "apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx"
# 결과: const 선언 각 1건 이상 (PASS) — 인라인 조건 중복 금지
```

**PASS:**

1. `borrowerApprove` 메서드 ≥ 1건 (구현됨)
2. scope 검증 라인 번호 < `assertFsmAction` 라인 번호 (scope-먼저)
3. `emitAsync` payload에 `lenderTeamId` 포함
4. 프론트엔드 `canBorrowerApprove`/`canBorrowerReject` 독립 const 선언 존재

**FAIL:**

- borrowerApprove 미구현 → Phase 3+4 구현 체크
- scope 검증이 assertFsmAction 이후 → 순서 교정 (보안 fail-close 규칙)
- payload에 `lenderTeamId` 누락 → composite 알림 전략 silent drop
- 프론트엔드에서 `can(Permission.BORROWER_APPROVE_CHECKOUT)` 인라인 중복 → 독립 const 추출

### Step 26: 프론트엔드 handleNextStepAction — CheckoutAction 완전 매핑 (2026-04-24 추가)

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

## Exceptions

1. **`checkout-fsm.ts` 자체의 상수 정의** — `TERMINAL_STATES`, `CAL_REPAIR`, `RENTAL`, `ALL` 등 모듈 내부 상수는 로컬 정의 허용
2. **`assertFsmInvariants` 함수 정의 자체** — 함수 정의 내부 로직은 검사 대상 아님, 모듈 레벨 *호출*만 검사
3. **테스트 파일의 mock 데이터** — `checkout-fsm.test.ts` 내 임시 CheckoutStatus/Purpose 값은 면제
4. **`NextStepDescriptorSchema`의 `z.enum` 인라인 값** — CheckoutAction/NextActor enum 값이 인라인으로 나열되어 있는 것은 Zod 스키마 특성상 허용 (SSOT는 TypeScript type `CheckoutAction`)
5. **RENTAL purpose의 `reject_return` FSM 미지원** — FSM `reject_return` 전이는 `purposes: CAL_REPAIR`만 허용. RENTAL 반출의 `rejectReturn` 호출 시 `assertFsmAction`에서 INVALID_TRANSITION으로 차단되므로, `rejectReturn` 내부의 `LENDER_TEAM_ONLY` 체크는 RENTAL에 대해 dead code. Step 20은 CAL_REPAIR 목적 흐름만 검증 대상.
6. **`mockChain.then` 테스트 패턴** — `chain.where.then` 오버라이드가 불가한 jest mock 제약으로 `mockChain.then`을 직접 오버라이드하는 패턴은 테스트 전용 관용구. 서비스 코드 검증 대상 아님.

### Step 27: 프론트엔드 useCheckoutGroupDescriptors — N+1 방지 + feature flag 게이팅 (2026-04-24 추가)

`use-checkout-group-descriptors.ts` 훅은 `getNextStep`을 루프 내부에서 호출하는 대신 단일 `useMemo`로 Map을 일괄 계산해야 한다 (N+1 재계산 방지).
`isNextStepPanelEnabled()` feature flag가 훅 내부와 소비 컴포넌트(`CheckoutGroupCard.tsx`) 양쪽에 적용되어야 한다.

```bash
# getNextStep이 useMemo 외부(render 함수 직접)에서 호출되는지 확인 — PASS = 없어야 함
grep -n "getNextStep" apps/frontend/hooks/use-checkout-group-descriptors.ts
# useMemo 내부에서만 호출 → OK

# feature flag 게이팅 확인
grep -n "isNextStepPanelEnabled" \
  apps/frontend/hooks/use-checkout-group-descriptors.ts \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 최소 2곳 이상 존재 (훅 + 컴포넌트)

# permissions 안정화 — permissions를 먼저 useMemo로 memoize 후 descriptor Map의 dep으로 사용하는지
grep -B2 -A8 "const permissions" apps/frontend/hooks/use-checkout-group-descriptors.ts
# useMemo([userRole]) 패턴 확인
```

```
✅ PASS: getNextStep이 단일 useMemo 내부에서만 호출됨
✅ PASS: isNextStepPanelEnabled() 가드가 훅 + 컴포넌트 양쪽에 존재
✅ PASS: permissions를 별도 useMemo로 먼저 안정화 후 descriptor Map dep으로 사용
```

### Step 28: findCheckoutEntity 분리 — 순수 엔티티 취득 패턴 (Sprint 1.1)

Sprint 1.1에서 `findOne`의 역할을 두 레이어로 분리:
- `findCheckoutEntity` (private): 캐시/DB 취득 전담 — 순수 `Checkout` 엔티티 반환
- `findOne` (public): 메타 조립 전담 — `availableActions` + `nextStep`을 항상 포함한 `CheckoutWithMeta` 반환

이 분리가 없으면 내부 11개 메서드가 `findOne`을 재호출하여 불필요한 meta 조립이 반복 실행된다.

```bash
# private findCheckoutEntity 존재 확인
grep -n "private async findCheckoutEntity" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1건 (PASS) — 0건이면 Sprint 1.1 미구현

# 내부 메서드가 findCheckoutEntity를 경유하는지 확인 (최소 2건 이상)
grep -c "this\.findCheckoutEntity" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 11 이상 (findOne 1 + 내부 10 호출, PASS)

# 내부 메서드가 잘못 findOne을 재호출하는지 탐지 (FAIL 패턴)
grep -n "await this\.findOne(" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "^.*findOne\b.*async\|findOne.*userPermissions"
# 기대: findOne 정의 라인만 존재, 내부 재호출 0건
```

**PASS:** `findCheckoutEntity` 1건 + `this.findCheckoutEntity` 호출 ≥ 11건 + 내부 메서드의 `findOne` 재호출 0건.
**FAIL:** `findCheckoutEntity` 미존재(Sprint 1.1 누락) 또는 내부 메서드가 `findOne`을 직접 호출(meta 이중 조립).

### Step 29: findOne userPermissions 필수 파라미터 (Sprint 1.1)

Sprint 1.1 이전에는 `findOne(uuid: string, userPermissions?: readonly string[])` — `?` 선택적 파라미터였다.
이 경우 `if (userPermissions)` 분기가 생겨 일부 응답 경로에서 meta가 누락된다.
Sprint 1.1에서 `userPermissions: readonly string[]` (필수)로 변경하여 meta가 항상 조립됨을 보장한다.

```bash
# findOne 시그니처 확인: userPermissions 필수 선언
grep -n "async findOne(" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: userPermissions: readonly string[] (? 없음)

# 선택적 파라미터 잔존 탐지 (금지)
grep -n "userPermissions?" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "findOne\|async"
# 결과: 0건 (PASS)

# if (userPermissions) 조건부 분기 잔존 탐지 (금지)
grep -n "if (userPermissions)" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS) — 조건부 meta 조립 경로 존재 금지
```

**PASS:** `userPermissions?` 선언 0건 + `if (userPermissions)` 조건 0건.
**FAIL:** `userPermissions?` 선택적 잔존 → `?` 제거 후 컨트롤러/서비스 모든 `findOne` 호출에 `req.user?.permissions ?? []` 추가.

### Step 30: FSM drift safeParse 가드 — buildNextStep 내부 (Sprint 1.1)

`buildNextStep`이 `getNextStep()`을 호출한 후 결과를 `NextStepDescriptorSchema.safeParse()`로 검증하여,
FSM 구현이 Zod 스키마와 어긋날 경우 `Logger.warn('[FSM drift]...')`으로 경보.
런타임에서 스키마/구현 간 드리프트를 감지하기 위한 안전망이다.

```bash
# buildNextStep 내부에 NextStepDescriptorSchema.safeParse 확인
grep -n "NextStepDescriptorSchema\|safeParse" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: safeParse 호출 1건 이상 (PASS)

# FSM drift 경고 로그 확인
grep -n "\[FSM drift\]" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 1건 이상 (PASS)

# NextStepDescriptorSchema import 확인 (packages/schemas 경유)
grep -n "NextStepDescriptorSchema" \
  apps/backend/src/modules/checkouts/checkouts.service.ts | head -3
# 결과: import + safeParse 호출 라인 포함 (PASS)
```

**PASS:** `NextStepDescriptorSchema.safeParse` 호출 ≥ 1건 + `[FSM drift]` Logger.warn ≥ 1건.
**FAIL:** safeParse 없음 → FSM 드리프트가 런타임에서 무증상으로 클라이언트로 전달됨.

### Step 31: findOne 반환 타입 — CheckoutWithMeta 단일 타입 (Sprint 1.1)

Sprint 1.1 이후 `findOne`은 항상 `Promise<CheckoutWithMeta>`를 반환해야 한다.
유니온 타입 `Checkout | CheckoutWithMeta`가 존재하면 소비자가 조건부 narrowing을 해야 하며,
meta 누락 경로가 묵시적으로 허용된다.

```bash
# findOne 반환 타입 확인
grep -n "async findOne.*Promise" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: Promise<CheckoutWithMeta> (PASS)

# 유니온 타입 혼재 탐지 (금지)
grep -n "Checkout | CheckoutWithMeta\|CheckoutWithMeta | Checkout" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 결과: 0건 (PASS)

# type cast (as Promise<CheckoutWithMeta>) 잔존 탐지 (금지 — 타입 시스템 우회)
grep -n "as Promise<CheckoutWithMeta>" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts
# 결과: 0건 (PASS)
```

**PASS:** `Promise<CheckoutWithMeta>` 단일 반환 + 유니온 0건 + controller type cast 0건.
**FAIL:** 유니온 타입 잔존 → `findCheckoutEntity` + `buildNextStep` 분리 패턴으로 교체.

### Step 32: 280 table test 존재 확인 (Sprint 1.1 신규)

Sprint 1.1에서 신규 도입된 exhaustive table test:
- `CHECKOUT_STATUS_VALUES` × `CHECKOUT_PURPOSE_VALUES` × `FIXTURE_ROLE_VALUES` = 14 × 4 × 5 = 280 조합
- `NextStepDescriptorSchema.safeParse()` 모든 조합 검증
- `toMatchSnapshot()` behavioral regression guard
- `DESCRIPTOR_TABLE satisfies Record<TableKey, TableRow>` compile-time 완전성 검사

```bash
# table test 파일 존재 확인
ls packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"
# 결과: EXISTS (PASS)

# fixture 파일 존재 확인
ls packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"
# 결과: EXISTS (PASS)

# 조합 수 계산 상수 확인
grep -n "EXPECTED_ENTRY_COUNT\|280" \
  packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts | head -5

# satisfies 컴파일 가드 확인 (runtime + compile-time 이중 보장)
grep -n "satisfies Record<TableKey, TableRow>" \
  packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts
# 결과: 1건 (PASS)
```

**PASS:** 두 파일 모두 EXISTS + `satisfies Record<TableKey, TableRow>` 컴파일 가드 존재.
**FAIL:** 파일 없음 → Sprint 1.1 구현 누락. `satisfies` 없음 → 새 status/purpose 추가 시 조합 누락 탐지 불가.

### Step 33: rental-phase.ts SSOT exhaustiveness guard (Sprint 1.2 신규)

Sprint 1.2에서 신규 도입된 `rental-phase.ts`의 두 가지 컴파일 타임 안전장치 확인:
1. `RENTAL_STATUS_TO_PHASE satisfies Record<CheckoutStatus, RentalPhase | null>` — 새 CheckoutStatus 추가 시 자동 컴파일 에러
2. `@ts-expect-error` 네거티브 테스트 — 불완전 매핑이 실제로 타입 에러를 발생시킴을 증명

```bash
# 파일 존재 확인
ls packages/schemas/src/fsm/rental-phase.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"
# 결과: EXISTS (PASS)

# satisfies Record<CheckoutStatus, RentalPhase | null> 컴파일 가드 확인
grep -n "satisfies Record<CheckoutStatus, RentalPhase | null>" \
  packages/schemas/src/fsm/rental-phase.ts
# 결과: 1건 (PASS)

# @ts-expect-error 네거티브 테스트 존재 확인
grep -n "ts-expect-error" \
  packages/schemas/src/fsm/rental-phase.ts
# 결과: 1건 이상 (PASS)

# circular dep 방지 — shared-constants import 없어야 함
grep -n "from '@equipment-management/shared-constants'" \
  packages/schemas/src/fsm/rental-phase.ts
# 결과: 0건 (PASS)

# rental-phase.ts가 checkout-fsm.ts에서 re-export되는지 확인
grep -n "rental-phase" \
  packages/schemas/src/fsm/checkout-fsm.ts | head -5
# 결과: import + re-export 라인 포함 (PASS)
```

**PASS:** rental-phase.ts 존재 + satisfies 가드 1건 + @ts-expect-error 1건 이상 + shared-constants import 0건 + checkout-fsm.ts re-export 존재.
**FAIL:** 파일 없음 → Sprint 1.2 구현 누락. satisfies/ts-expect-error 없음 → CheckoutStatus 추가 시 RENTAL_STATUS_TO_PHASE 누락 컴파일 에러 미발생. circular dep 발견 → packages/schemas 빌드 실패.
