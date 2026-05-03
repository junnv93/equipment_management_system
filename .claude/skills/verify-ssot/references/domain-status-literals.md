# Domain Status Literals SSOT — verify-ssot references

> 2026-05-03 verify-ssot 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: status enum 리터럴 직접 비교 금지, ESLint 3-layer 차단, ConditionCheckStep, CheckoutDirectionValues, UserSelectableCheckoutPurpose, isPurposeCompatibleWithEquipment.

## Step 19: 프론트엔드 도메인 Status/Type 리터럴 비교 SSOT

프론트엔드 컴포넌트에서 `ValidationStatus`, `ValidationType` 등 도메인 enum 값을 raw 문자열 리터럴로
직접 비교하는 패턴 탐지. `ValidationStatusValues.DRAFT` 등 SSOT 상수를 경유해야 함.

**19a: ValidationStatus 리터럴 비교 탐지**
```bash
grep -rn "=== 'draft'\|=== 'submitted'\|=== 'approved'\|=== 'rejected'" \
  apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "spec\|test\|\.d\.ts\|messages/"
# 결과: 0건 (ValidationStatusValues.DRAFT 등 SSOT 경유)
```

**19b: ValidationType 리터럴 비교 탐지**
```bash
grep -rn "=== 'vendor'\|=== 'self'\|=== 'internal'" \
  apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "spec\|test\|\.d\.ts\|messages/"
# 결과: 0건 (ValidationTypeValues.VENDOR/SELF 등 SSOT 경유)
```

**19c: 도메인 폼 아이템 타입 loose index signature 금지**
```bash
grep -rn "interface.*{[[:space:]]*\[key: string\]: string" \
  apps/frontend --include="*.tsx" --include="*.ts" \
  | grep -v "spec\|test\|\.d\.ts"
# 결과: 0건 (AcquisitionOrProcessingItem / ControlItem SSOT 타입 사용)
```

**PASS:** 세 탐지 명령어 모두 0건.
**FAIL:** raw 리터럴 비교 또는 loose index signature 발견 시 SSOT 타입으로 교체.

---

## Step 21: ConditionCheckStepValues SSOT + ExportData 도메인 Step 리터럴

`conditionChecks.step` 필드 비교 시 `'lender_checkout'`/`'lender_return'` 문자열 리터럴 사용 금지.
`ConditionCheckStepValues.LENDER_CHECKOUT` / `LENDER_RETURN` SSOT 경유 필수.

**21a: conditionCheck step 리터럴 직접 사용 탐지**
```bash
grep -rn "'lender_checkout'\|'lender_return'\|\"lender_checkout\"\|\"lender_return\"" \
  apps/backend/src --include="*.ts"
# 결과: 0건 (ConditionCheckStepValues 상수로만 참조해야 함)
```

**21b: ConditionCheckStepValues 올바른 import 경로 확인**
```bash
grep -rn "ConditionCheckStepValues" apps/backend/src --include="*.ts" | grep "from '@equipment-management/schemas'"
# 결과: 사용 파일마다 schemas import 확인
```

**PASS:** 21a 0건.
**FAIL:** step 리터럴 직접 비교.

---

## Step 22: ESLint 3-layer domain status 리터럴 차단 검증

`apps/backend/.eslintrc.js`의 `no-restricted-syntax`에 3개 selector가 모두 정의되어 있는지 확인.
각 selector는 domain status 리터럴의 다른 사용 패턴을 커버한다:

| Layer | Selector | 탐지 패턴 |
|---|---|---|
| 1 | `BinaryExpression` | `entity.status === 'draft'` (직접 비교) |
| 2 | `Property` | `{ status: 'approved' }` (객체 할당) |
| 3 | `CallExpression` | `eq(table.status, 'pending')` (함수 인자) |

**22a: BinaryExpression selector 존재 확인**
```bash
grep -n "BinaryExpression\[operator" apps/backend/.eslintrc.js | grep "status"
# 결과: 1건 이상 (selector 정의)
```

**22b: Property selector 존재 확인**
```bash
grep -n "Property\[key\.name" apps/backend/.eslintrc.js | grep "status"
# 결과: 1건 이상 (selector 정의)
```

**22c: CallExpression selector 존재 확인**
```bash
grep -n "CallExpression\[arguments" apps/backend/.eslintrc.js | grep "status"
# 결과: 1건 이상 (selector 정의)
```

**22d: controller override에도 동일 3-layer 포함 확인**
```bash
grep -c "BinaryExpression\|Property\[key\|CallExpression\[arguments" apps/backend/.eslintrc.js
# 결과: 6건 이상 (전역 3 + controller override 3)
```

**22e: ESLint 실제 통과 확인 (리터럴 0건)**
```bash
pnpm --filter backend run lint 2>&1 | grep "no-restricted-syntax" | grep -v "node_modules" | head -20
# 결과: 0건 (lint 에러 없음)
```

**22f: ESLint dynamic import selector — `ImportExpression` 사용 확인 (2026-04-30 추가)**

`@typescript-eslint/parser` v6+에서 `import('node:crypto')` 같은 dynamic import 표현식은
`CallExpression` 노드가 아닌 `ImportExpression` 노드로 파싱된다.
selector가 `CallExpression[callee.type='Import']`이면 **조건이 match되지 않아 silent fail** 발생.
반드시 `ImportExpression[source.value='node:crypto']` 형식을 사용해야 한다.

```bash
# ImportExpression selector 존재 확인 (PASS 패턴)
grep -n "ImportExpression\[source\.value=" apps/backend/.eslintrc.js
# 기대: crypto 관련 2건 이상 (node:crypto + crypto)

# CallExpression[callee.type='Import'] 잔존 탐지 (FAIL 패턴 — silent fail)
grep -n "CallExpression\[callee\.type=.Import.\]" apps/backend/.eslintrc.js
# 기대: 0건 (이 패턴은 @typescript-eslint/parser v6+에서 dynamic import 미탐지)
```

**PASS:**
- `ImportExpression[source.value='node:crypto']` 및 `ImportExpression[source.value='crypto']` 존재
- `CallExpression[callee.type='Import']` 0건

**FAIL:**
- `CallExpression[callee.type='Import']` 잔존 → `ImportExpression[source.value='...']`으로 교체
- `ImportExpression` selector 누락 → dynamic import 차단 룰이 무효화되어 `node:crypto` 직접 import 탐지 불가

**발생 이력 (2026-04-30)**: tech-debt-batch-0430 Phase C에서 verify-implementation FAIL 탐지. 백엔드 ESLint `no-restricted-imports` 룰에 `CallExpression[callee.type='Import']` 4곳이 `ImportExpression[source.value='...']`으로 교체됨.

**PASS:** 3-layer selector 모두 존재 + ImportExpression selector 검증 통과 + lint 에러 0건.
**FAIL:** selector 누락 또는 lint 에러 발생.

> **연계:** verify-hardcoding Step 23(export allowlist 상태 리터럴)과 상호 보완 — ESLint가 BinaryExpression/Property/CallExpression을 정적으로 차단하고, Step 23은 배열 요소로 사용된 리터럴을 grep으로 탐지.

---

## Step 25: design-token 헬퍼 함수 내 status literal 직접 비교 금지

`apps/frontend/lib/design-tokens/components/*.ts` 파일 내 헬퍼 함수(예: `getCheckoutRowClasses`,
`getEquipmentRowClasses` 등)에서 도메인 상태값을 raw 문자열 리터럴(`'overdue'`, `'pending'` 등)로
직접 비교하는 패턴 탐지. 반드시 `CheckoutStatusValues.OVERDUE`, `EquipmentStatusValues.ACTIVE` 등
SSOT `*Values` 상수를 경유해야 한다.

**규칙 근거:** design-token 파일은 `@equipment-management/schemas`를 직접 import할 수 있는 위치이므로,
`status === 'overdue'` 같은 raw 리터럴 비교는 SSOT 우회다. SSOT 경유 시 enum 값 변경이 설계 의도대로
자동 전파된다.

**올바른 패턴 (checkout.ts 기준):**
```typescript
// ✅ SSOT — CheckoutStatusValues 경유
import { CheckoutStatusValues } from '@equipment-management/schemas';

if (status === CheckoutStatusValues.OVERDUE) { ... }
if (status === CheckoutStatusValues.PENDING) { ... }

// ❌ 금지 — raw 리터럴 직접 비교
if (status === 'overdue') { ... }
if (status === 'pending') { ... }
```

**탐지:**
```bash
# design-token 헬퍼 함수 내 status raw 리터럴 비교 탐지 (일반적인 도메인 상태값)
grep -rn "=== 'overdue'\|=== 'pending'\|=== 'approved'\|=== 'rejected'\|=== 'returned'\|=== 'in_use'\|=== 'checked_out'\|=== 'canceled'" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts"
# → 0건 (*StatusValues 상수 경유)

# *StatusValues import 확인 (design-token 파일에 사용한 경우)
grep -rn "StatusValues" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts" | grep "from '@equipment-management/schemas'"
# → import 라인 존재 확인
```

**PASS:** design-token 헬퍼 내 도메인 status raw 리터럴 0건.
**FAIL:** `=== 'overdue'` 등 발견 → `CheckoutStatusValues.OVERDUE` 등 `*StatusValues` 상수 경유로 교체.

**예외:**
- CSS 클래스 문자열 내 `bg-brand-ok/10` 같은 Tailwind 클래스 값 — status 비교 아님
- 배지 맵(`CHECKOUT_STATUS_BADGE_TOKENS`) Record 키 선언 (`overdue: '...'`) — 키 선언은 비교가 아니므로 허용
- i18n 키 문자열 (`'checkouts.stepper.overdue'`) — 네임스페이스 경로 문자열이므로 허용

> **연계:** verify-design-tokens Step 18의 `*StatusValues satisfies` 검사와 상호 보완. design-token 파일에서 StatusValues가 올바르게 import·사용되는지를 이 Step이 담당.

---

## Step 27: UserSelectableCheckoutPurpose SSOT — CreateCheckoutDto.purpose

`checkout-api.ts`의 `CreateCheckoutDto.purpose`가 전체 `CheckoutPurpose` 대신
`UserSelectableCheckoutPurpose` (= `'calibration' | 'repair' | 'rental'`)를 사용하는지 확인.
`return_to_vendor`는 시스템 전용 목적이며 사용자가 신청 시 선택 불가능해야 한다.

**규칙 근거:** `CreateCheckoutDto.purpose: CheckoutPurpose`이면 프론트엔드에서 `return_to_vendor`를
전달해도 타입 오류가 없음. `UserSelectableCheckoutPurpose`로 좁혀야 tsc가 서브셋 위반을 컴파일 타임에 차단.

```bash
# CreateCheckoutDto.purpose가 string 또는 전체 CheckoutPurpose이면 SSOT 위반
grep -n "purpose.*: string\|purpose.*: CheckoutPurpose[^|]" \
  apps/frontend/lib/api/checkout-api.ts \
  | grep -v "UserSelectableCheckoutPurpose\|import\|//"
# 결과: 0건 (UserSelectableCheckoutPurpose 사용)

# UserSelectableCheckoutPurpose import 확인
grep -n "UserSelectableCheckoutPurpose" apps/frontend/lib/api/checkout-api.ts
# 결과: import 라인 + 사용 라인 2건 이상

# 사용자 입력 폼(create)에서도 UserSelectableCheckoutPurpose로 타입 선언했는지 확인
grep -n "UserSelectableCheckoutPurpose" \
  "apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx"
# 결과: import + useState<UserSelectableCheckoutPurpose> 2건 이상
```

**PASS:** `CreateCheckoutDto.purpose: UserSelectableCheckoutPurpose` + 폼 state도 동일 타입.
**FAIL:** `purpose: string` 또는 `purpose: CheckoutPurpose` 잔존 → `UserSelectableCheckoutPurpose`로 교체.

**예외:**
- `Checkout.purpose: CheckoutPurpose` — 서버 응답(조회)에는 전체 `CheckoutPurpose` 사용 (return_to_vendor 포함). 이 Step은 생성 DTO만 대상.
- `CheckoutQuery.purpose?: CheckoutPurpose` — 필터 파라미터는 return_to_vendor 포함 전체 목적으로 조회 가능.

---

## Step 45: LENDER_APPROVAL_PENDING_STATUSES SSOT 체인 — FSM 도출 승인 대기 상태 배열 인라인 재정의 금지

**규칙**: lender TM의 `approve:checkout` 권한이 필요한 출발 상태 목록은 반드시 `packages/schemas/src/fsm/checkout-fsm.ts`에서 FSM transitions를 자동 도출하여 export하는 `LENDER_APPROVAL_PENDING_STATUSES`를 사용한다. `['pending', 'borrower_approved']` 같은 인라인 배열 리터럴로 상태를 열거하면 rental 2-step 등 새 승인 단계 추가 시 자동 반영이 안 되어 카운트 누락이 발생한다.

**왜 FSM 도출이 필요한가**:
- checkout FSM에 새 전환 규칙이 추가될 때 status 배열을 수동으로 동기화해야 함 — 휴먼 에러 필연.
- `LENDER_APPROVAL_PENDING_STATUSES`는 `CHECKOUT_TRANSITIONS.filter(t => t.requires === 'approve:checkout').map(t => t.from)` 으로 자동 생성되므로 FSM이 유일한 진실의 소스가 됨.
- `borrower_approved` 상태는 rental 2-step 중간 상태 — `pending`만 필터링하면 lender 승인 대기 카운트가 누락됨 (2026-04-29 버그 사례).

**검증 명령**:
```bash
# 1) 단일 정의 확인 — schemas 외부 재정의 없어야 함
grep -rn "LENDER_APPROVAL_PENDING_STATUSES" \
  apps/backend apps/frontend packages \
  --include="*.ts" --include="*.tsx"
# 기대: 1 정의(checkout-fsm.ts) + 2+ 소비처(approvals.service.ts, approvals-api.ts)
# 외부 재정의 = FAIL

# 2) 인라인 status 배열 금지 — borrower_approved + pending 동시 나열
grep -rn "\[.*['\"]pending['\"].*['\"]borrower_approved['\"].*\]\|\[.*['\"]borrower_approved['\"].*['\"]pending['\"].*\]" \
  apps/backend apps/frontend \
  --include="*.ts" --include="*.tsx"
# 기대: 0건 (SSOT 상수 spread만 허용)

# 3) 소비처가 @equipment-management/schemas 경유 확인
grep -n "LENDER_APPROVAL_PENDING_STATUSES" \
  apps/backend/src/modules/approvals/approvals.service.ts \
  apps/frontend/lib/api/approvals-api.ts
# 기대: 각 파일에서 from '@equipment-management/schemas' import 라인과 같은 파일에 존재

# 4) getCheckoutCount / getCheckoutKpiQuery 시그니처 — scalar → 배열 회귀 방지
grep -n "getCheckoutCount\|getCheckoutKpiQuery" \
  apps/backend/src/modules/approvals/approvals.service.ts | head -10
# 기대: private 정의에 CheckoutStatus[] 배열 타입 사용
```

**PASS:**
- `LENDER_APPROVAL_PENDING_STATUSES` 정의: `packages/schemas/src/fsm/checkout-fsm.ts` 단 1곳
- 소비처 import: `@equipment-management/schemas` 경유
- 인라인 `['pending', 'borrower_approved']` 배열 리터럴 0건
- `getCheckoutCount` / `getCheckoutKpiQuery`: `CheckoutStatus[]` 시그니처 유지

**FAIL:**
- 로컬 파일에 `LENDER_APPROVAL_PENDING_STATUSES`를 재정의
- `['pending', 'borrower_approved']` 인라인 열거 (SSOT 우회)
- `getCheckoutCount`가 다시 scalar `CheckoutStatus` 단일 인수로 회귀

**예외:**
- `packages/schemas/src/fsm/checkout-fsm.ts` 자체 — 정의 파일
- 단위 테스트 파일 (`*.spec.ts`) — 목업 목적 명시적 배열 허용

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — SSOT 정의 (FSM 도출)
- `apps/backend/src/modules/approvals/approvals.service.ts` — 소비처 1
- `apps/frontend/lib/api/approvals-api.ts` — 소비처 2

**발생 이력 (2026-04-29 신설)**: rental 2-step `borrower_approved` 상태가 lender 승인 대기 카운트(`getCheckoutCount`)에서 누락되는 버그 발견. `pending`만 필터링하던 scalar 파라미터를 배열로 교체하고 FSM-derived `LENDER_APPROVAL_PENDING_STATUSES` SSOT를 신설.

---

## Step 47: `isPurposeCompatibleWithEquipment` SSOT — `USER_SELECTABLE_PURPOSES.includes()` 가드

**규칙**: 백엔드에서 목적별 팀 소유 검증을 수행할 때 `isPurposeCompatibleWithEquipment()` 헬퍼를 직접 호출하지 않는다. 반드시 `USER_SELECTABLE_PURPOSES.includes(purposeVal as UserSelectablePurpose)` 가드를 먼저 통과시킨 후 호출해야 한다.

**왜 가드가 필요한가**: `return_to_vendor` 같은 시스템 전용 purpose는 `UserSelectablePurpose` 타입에 포함되지 않는다. 이 값을 `isPurposeCompatibleWithEquipment()`에 그대로 전달하면 헬퍼 내부에서 `undefined?.enabled ?? false = false`를 반환하여 팀 소유 검증에 실패했다고 잘못 판단한다. 가드 없이 호출하면 시스템 전용 목적의 반출이 **잘못 차단**된다(fail-close가 아닌 **false positive block**).

**검증 명령**:
```bash
# 1) isPurposeCompatibleWithEquipment 호출 존재 확인 (shared-constants import)
grep -n "isPurposeCompatibleWithEquipment" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 1건 (shared-constants import + 1건 호출)

# 2) USER_SELECTABLE_PURPOSES.includes 가드가 호출보다 앞에 있는지 확인
grep -n "USER_SELECTABLE_PURPOSES\|isPurposeCompatibleWithEquipment" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: USER_SELECTABLE_PURPOSES.includes()가 isPurposeCompatibleWithEquipment() 직전 조건에 등장
```

**PASS 기준**:
- `USER_SELECTABLE_PURPOSES.includes(purposeVal as UserSelectablePurpose)` 가드가 `isPurposeCompatibleWithEquipment()` 호출을 감싸는 `&&` 조건으로 존재
- `isPurposeCompatibleWithEquipment`가 `@equipment-management/shared-constants`에서 import

**FAIL 기준**:
- `isPurposeCompatibleWithEquipment(purposeVal, ...)` 가드 없이 직접 호출 — 시스템 전용 purpose false-positive block 위험
- 인라인 `equip.teamId === userTeamId` 비교 재등장 — SSOT 헬퍼 우회

**예외**:
- 단위 테스트 파일 — mock 환경에서 직접 호출 허용

**관련 파일**:
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — 적용 지점
- `packages/shared-constants/src/checkout-selectability.ts` — `isPurposeCompatibleWithEquipment`, `USER_SELECTABLE_PURPOSES` SSOT

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0429 Phase A — `checkouts.service.ts`의 inline 팀 비교를 SSOT 헬퍼로 전환할 때, `return_to_vendor` 시스템 전용 purpose가 `USER_SELECTABLE_PURPOSES`에 포함되지 않아 가드 없이 호출 시 false-positive block 발생 가능성 발견.

---

## Step 51: `CheckoutDirectionValues` SSOT — `direction` 리터럴 문자열 인라인 금지

**규칙**: `checkoutApi.getCheckouts()` 등 checkout API 호출 시 `direction` 파라미터에 `'outbound'`/`'inbound'` 문자열 리터럴을 직접 사용하지 않는다. 반드시 `CheckoutDirectionValues.OUTBOUND` / `CheckoutDirectionValues.INBOUND` SSOT 상수를 경유한다.

**왜 SSOT가 필요한가**: `CheckoutDirection` 타입은 `packages/schemas/`에서 중앙 관리된다. 리터럴 인라인 시 타입이 변경되어도 컴파일 에러가 발생하지 않아 런타임 필터링 오작동이 조용히 발생한다. `satisfies Record<string, CheckoutDirection>` 제약을 가진 `CheckoutDirectionValues` 상수를 통하면 타입 변경 즉시 컴파일 에러로 탐지된다.

**검증 명령**:
```bash
# direction 파라미터에 리터럴 문자열 직접 사용 탐지
grep -rn "direction: 'outbound'\|direction: 'inbound'\|direction: \"outbound\"\|direction: \"inbound\"" \
  apps/frontend/lib/api/ \
  apps/frontend/app/ \
  apps/frontend/components/ \
  --include="*.ts" --include="*.tsx"
# 기대: 0건
```

**PASS**: 0건 (모든 direction 파라미터가 `CheckoutDirectionValues.*` 경유)
**FAIL**: 리터럴 발견 → `import { CheckoutDirectionValues } from '@equipment-management/schemas'` 후 교체

**올바른 패턴**:
```typescript
// ✅ CORRECT
import { CheckoutDirectionValues } from '@equipment-management/schemas';

await checkoutApi.getCheckouts({
  direction: CheckoutDirectionValues.OUTBOUND,
});

// ❌ WRONG
await checkoutApi.getCheckouts({
  direction: 'outbound', // 리터럴 인라인
});
```

**관련 파일**:
- `packages/schemas/src/enums/values.ts` — `CheckoutDirectionValues` 정의 (`as const satisfies Record<string, CheckoutDirection>`)
- `apps/frontend/lib/api/approvals/fetchers.ts` — `CheckoutDirectionValues.OUTBOUND` 사용처 (2026-04-30 SSOT 교체)

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430b fetchers-status-literal-ssot 작업 중 `direction: 'outbound'` 2건 발견. `CheckoutDirectionValues`가 schemas에 없어 신규 추가 후 교체. `satisfies` 제약으로 컴파일 타임 안전성 확보.

---

## Step 30: 상태 순서 매핑 객체 키 — enum Computed Property Name 경유 필수

상태값을 순서(숫자) 또는 우선순위에 매핑하는 객체(`STATUS_ORDER`, `PRIORITY_MAP` 등)의 키는
반드시 enum/Values 상수를 Computed Property Name으로 경유해야 한다.
문자열 리터럴 키를 사용하면 스키마 변경 시 컴파일 에러가 발생하지 않아 매핑이 조용히 깨진다.

```typescript
// ❌ 문자열 리터럴 — 스키마 변경 시 silent bug
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  pending_review: 1,
  rejected: -1,
};

// ✅ Computed Property Name + Partial<Record<EnumType>> — 스키마 변경 시 컴파일 에러
const STATUS_ORDER: Partial<Record<UnifiedApprovalStatus, number>> = {
  [UASVal.PENDING]: 0,
  [UASVal.PENDING_REVIEW]: 1,
  [UASVal.REJECTED]: -1,
};
```

**탐지 — 상태 매핑 객체 내 문자열 리터럴 키:**
```bash
# STATUS_ORDER / PRIORITY_MAP 등 상태→숫자 매핑에서 리터럴 키 탐지
grep -n "STATUS_ORDER\|PRIORITY_MAP\|statusOrder\|priorityMap" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null \
  | head -10

# 매핑 객체 내 문자열 리터럴 키 패턴 (enum 경유 아닌 것)
grep -A10 "STATUS_ORDER\s*[=:]\s*{" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null \
  | grep "^\s*[a-z_]*:\s*[0-9-]" | grep -v "\[.*Val\."
```

**PASS:** 상태 매핑 객체의 모든 키가 `[EnumVal.CONSTANT]` 패턴.
**FAIL:** 문자열 리터럴 키 → enum Computed Property Name으로 교체 + `Record<string, N>` → `Partial<Record<EnumType, N>>` 타입 강화.

**연관 패턴 — 단계 배열 key 필드:**
다단계 스텝 정의(`disposalSteps`, `planSteps`)의 `key` 필드도 동일하게 enum 경유 필수:
```typescript
// ❌ 리터럴
{ key: 'pending_review', ... }

// ✅ enum 경유
{ key: UASVal.PENDING_REVIEW, ... }
```

**근거:** `ApprovalStepIndicator.tsx` `STATUS_ORDER` + `disposalSteps/planSteps.key`에서 리터럴 → UASVal 교체 (2026-04-27, verify-ssot 지적).
