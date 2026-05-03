# FSM Core — verify-checkout-fsm references

> 2026-05-03 verify-checkout-fsm 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: assertFsmInvariants, CheckoutPermissionKey, calculateAvailableActions, FSM 테이블, findCheckoutEntity, rental-phase.ts SSOT

## Step 1: Dependency Inversion — UserRole 직접 import 금지

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

## Step 2: 함수 시그니처 — readonly string[] 패턴

`canPerformAction`, `getNextStep` 함수가 `userPermissions: readonly string[]`을 받는지 확인.

```bash
# 공개 API 함수 시그니처 확인
grep -n "userPermissions" packages/schemas/src/fsm/checkout-fsm.ts \
  | grep -v "^.*//\|^.*\*"
# 기대값: readonly string[] 타입으로 선언된 라인 존재
```

**PASS:** `readonly string[]` 타입 사용. **FAIL:** `UserRole[]` 또는 `Permission[]` 타입 사용.

## Step 3: assertFsmInvariants 모듈 로드 시 실행

모듈 최상위(top-level) 레벨에서 `assertFsmInvariants(CHECKOUT_TRANSITIONS)` 가 호출되어야 함.
import 시점에 FSM 불변식이 자동 검증됩니다.

```bash
# 모듈 최상위 레벨 호출 확인
grep -n "assertFsmInvariants(CHECKOUT_TRANSITIONS)" \
  packages/schemas/src/fsm/checkout-fsm.ts
# 결과: 1건 이상 (함수 정의 내부가 아닌 모듈 최상위에 위치해야 함)
```

**PASS:** 1건 이상 + 함수 정의 외부(모듈 레벨) 위치. **FAIL:** 0건 또는 함수 내부에 위치.

## Step 4: CheckoutPermissionKey와 Permission enum 동기화

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

## Step 5: FSM 소비자 브릿지 패턴 — req.user.permissions 경유 (PR-2 이후)

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

## Step 6: CHECKOUT_TRANSITIONS 테이블 완전성 — 단위 테스트 커버리지 확인

테스트 파일이 존재하며 불변식 테스트가 포함되어 있는지 확인.

```bash
# 테스트 파일 존재 확인
ls packages/schemas/src/__tests__/checkout-fsm.test.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# 테스트 수 확인
grep -c "it\|test\b" packages/schemas/src/__tests__/checkout-fsm.test.ts 2>/dev/null || echo "0"
```

**PASS:** 테스트 파일 존재 + 테스트 30건 이상. **FAIL:** 파일 없거나 테스트 수 부족.

## Step 7: nextStep 필드 — 응답 스키마 + 프론트엔드 API 타입 동기화 확인

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

## Step 8: assertFsmAction 헬퍼 존재 및 패턴 (PR-2 이후)

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

## Step 9: calculateAvailableActions sync 패턴 (PR-2 이후)

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

## Step 10: buildNextStep + findOne 메타 포함 (PR-2 이후)

`buildNextStep` private 메서드가 존재하고 `findOne` 메타 블록에서 호출되는지 확인.

```bash
grep -n "private buildNextStep" apps/backend/src/modules/checkouts/checkouts.service.ts

grep -n "buildNextStep\|nextStep" apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep -v "interface\|type\|//" | head -5
```

**PASS:** `private buildNextStep` 1건 + `meta: { availableActions, nextStep }` 조합 존재.
**FAIL:** 둘 중 하나 없음.

## Step 11: FSM_TO_AUDIT_ACTION 모든 CheckoutAction 커버 (PR-2 이후)

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

## Step 12: assertFsmAction HTTP 의미론 — 403/400 분리 (세션 이후)

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

## Step 13: Controller guard ↔ FSM permission 정렬 (세션 이후)

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

## Step 14: writeTransitionAudit best-effort 캡슐화 (세션 이후)

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

## Step 15: 예외 계층 일관화 — 7개 FSM 메서드 catch 블록 (세션 이후)

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

## Step 28: findCheckoutEntity 분리 — 순수 엔티티 취득 패턴 (Sprint 1.1)

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

## Step 29: findOne userPermissions 필수 파라미터 (Sprint 1.1)

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

## Step 30: FSM drift safeParse 가드 — buildNextStep 내부 (Sprint 1.1)

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

## Step 31: findOne 반환 타입 — CheckoutWithMeta 단일 타입 (Sprint 1.1)

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

## Step 32: EXPECTED_ENTRY_COUNT 동적 table test 검증 (Sprint 1.1 신규, 2026-04-26 동적화)

Sprint 1.1에서 신규 도입된 exhaustive table test. 조합 수는 하드코딩 금지 — 반드시 동적 계산:
- `EXPECTED_ENTRY_COUNT = TOTAL_STATUSES * TOTAL_PURPOSES * TOTAL_ROLES` (현재 14×4×5=280)
- describe 문자열에 하드코딩 숫자 금지 → template literal `${EXPECTED_ENTRY_COUNT}` 사용
- `DESCRIPTOR_TABLE`은 `buildDescriptorTable()` 동적 생성 — 상태/목적 추가 시 자동 확장
- `NextStepDescriptorSchema.safeParse()` 모든 조합 검증
- `DESCRIPTOR_TABLE satisfies Record<TableKey, TableRow>` compile-time 완전성 검사

```bash
# table test 파일 존재 확인
ls packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# fixture 파일 존재 확인
ls packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# EXPECTED_ENTRY_COUNT 동적 상수 선언 확인 (하드코딩 금지)
grep -n "EXPECTED_ENTRY_COUNT\s*=" \
  packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts
# 기대: TOTAL_STATUSES * TOTAL_PURPOSES * TOTAL_ROLES 형태 (1건)

# describe 문자열 하드코딩 숫자 탐지 (0건 기대)
grep -n "it('all [0-9]\+ combinations\|it(\"all [0-9]\+ combinations" \
  packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts
# 결과: 0건 (PASS) — template literal 사용 중이어야 함

# buildDescriptorTable 동적 생성 확인
grep -n "buildDescriptorTable\|function buildDescriptorTable" \
  packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts
# 결과: 1건 (PASS)

# satisfies 컴파일 가드 확인
grep -n "satisfies Record<TableKey, TableRow>" \
  packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts
# 결과: 1건 (PASS)
```

**PASS:** 두 파일 모두 EXISTS + `EXPECTED_ENTRY_COUNT` 동적 상수 + `buildDescriptorTable()` + `satisfies Record<TableKey, TableRow>`.
**FAIL:**
- 파일 없음 → Sprint 1.1 구현 누락
- `satisfies` 없음 → 새 status/purpose 추가 시 조합 누락 탐지 불가
- 하드코딩 숫자(예: `'all 280 combinations'`) → `EXPECTED_ENTRY_COUNT` template literal로 교체

## Step 33: rental-phase.ts SSOT exhaustiveness guard (Sprint 1.2 신규)

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

## Step 38: `revokeApproval` `writeTransitionAudit` `isRevocation` 마커 (2026-04-27 추가)

`revokeApproval` 메서드는 FSM `reject` 액션을 재사용하지만, 감사 이력 검색에서 일반 반려와 구분되어야 한다.
`CheckoutAction` 타입에 `'revoke'` 값이 없으므로 `writeTransitionAudit`의 `extraInfo`에
`isRevocation: true` 마커를 추가해 구분한다.

```bash
# revokeApproval의 writeTransitionAudit 호출에 isRevocation 마커 확인
grep -A 10 "async revokeApproval" \
  apps/backend/src/modules/checkouts/checkouts.service.ts \
  | grep "isRevocation"
# 기대: isRevocation: true 1건 (PASS)

# isRevocation 마커가 revokeApproval 외부에 없는지 확인 (다른 메서드 오용 방지)
grep -n "isRevocation" apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: revokeApproval 블록 내 1건만 (PASS)
```

**PASS:** `revokeApproval` `writeTransitionAudit` 호출에 `isRevocation: true` + `revokeReason` + `previousApprovedAt` 3개 extraInfo 키 존재.
**FAIL:** `isRevocation` 없음 → 감사 이력에서 취소 승인과 일반 반려 구분 불가.

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `revokeApproval` 메서드
