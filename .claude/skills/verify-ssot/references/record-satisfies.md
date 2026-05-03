# Record satisfies & Enum Exhaustiveness SSOT — verify-ssot references

> 2026-05-03 verify-ssot 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> 대상: `Record<EnumKey, ...> satisfies` 패턴, switch+assertNever, 로컬 enum/타입 재정의, data-migration SSOT, TAB_META guard, 로컬 인터페이스 충돌, shared-constants const array, UI 도메인 타입 SSOT, 백엔드-프론트 공유 API 응답 타입.

## Step 1: 로컬 enum/타입 재정의 탐지

패키지에 정의된 핵심 타입(UserRole, EquipmentStatus, SystemSettings 등)이 로컬에서 재정의되는지 확인.

```bash
# 핵심 enum/타입 로컬 재정의 탐지
grep -rn "type UserRole\s*=\|type EquipmentStatus\s*=\|type CheckoutStatus\s*=" \
  apps/backend/src/modules apps/frontend/components apps/frontend/lib \
  --include="*.ts" --include="*.tsx" \
  | grep -v "import\|from\|//\|node_modules\|\.d\.ts"
# 기대: 0건 (로컬 재정의 없음)

grep -rn "interface SystemSettings\s*{" \
  apps/backend/src/modules apps/frontend/components apps/frontend/lib \
  --include="*.ts" --include="*.tsx" \
  | grep -v "import\|from\|//\|node_modules\|packages/"
# 기대: 0건
```

**PASS:** 0개 결과.
**FAIL:** 로컬 타입 정의 발견 시 패키지 임포트로 변경.

---

## Step 15: data-migration SSOT 검증

`MIGRATION_SESSION_STATUS` / `MigrationRowStatus` / `MIGRATION_SHEET_TYPE` 등 마이그레이션 상수가
`packages/schemas/src/data-migration.ts` SSOT에서만 정의·소비되는지 확인.

**15a: MIGRATION_SESSION_STATUS 로컬 재정의 금지**
```bash
# data-migration.types.ts에서 로컬 union type 재정의 없어야 함
grep -rn "MigrationSessionStatus\s*=" \
  apps/backend/src/modules/data-migration/types/data-migration.types.ts
# 결과: 0건 (import/re-export 라인만 존재해야 함)
```

**15b: 서비스 레이어 raw 리터럴 금지**
```bash
# data-migration.service.ts에서 session status raw 리터럴 사용 없어야 함
grep -rn "'preview'\|'executing'\|'completed'\|'failed'" \
  apps/backend/src/modules/data-migration/services/data-migration.service.ts \
  | grep -v "import\|//\|test"
# 결과: 0건 (MIGRATION_SESSION_STATUS.PREVIEW 등 상수 경유)
```

**15c: SSOT 소스 확인**
```bash
# MIGRATION_SESSION_STATUS가 schemas에 존재해야 함
grep -n "MIGRATION_SESSION_STATUS" packages/schemas/src/data-migration.ts
# 결과: 1건+ (export const 정의)
```

**PASS:** 15a·15b 0건 + 15c 1건 이상.
**FAIL:** 로컬 재정의 또는 raw 리터럴 → schemas SSOT 상수 경유로 교체.

---

## Step 33: TAB_META capability guard 완전성 — canReject !== false 4-path 패턴

`TabMeta`에 `canX?: boolean` capability flag가 추가되면, **부모 컨테이너(ApprovalsClient)가 모든 하위 경로에 `undefined`를 전달**해야 한다. 하나의 경로라도 가드 누락 시 disabled 카테고리에서 액션 버튼이 노출된다.

**3단계 완전성 패턴 (AR-8에서 확립):**

```typescript
// ① 부모: TAB_META 단일 출처 → 모든 경로 동시 가드
onReject={TAB_META[activeTab].canReject !== false ? handler : undefined}
onBulkReject={TAB_META[activeTab].canReject !== false ? bulkHandler : undefined}

// ② 컴포넌트 prop: optional로 선언
onReject?: () => void;
onBulkReject?: () => void;

// ③ 렌더: optional 존재 여부로만 분기
{onReject && <Button onClick={onReject}>반려</Button>}
{onBulkReject && <Button onClick={onBulkReject}>일괄 반려</Button>}
```

**탐지 — ApprovalsClient canReject 4-path guard:**
```bash
# 양성 탐지(positive detection): canReject !== false 경유 건수 — 3건 미만이면 누락 경로 존재
GUARD_COUNT=$(grep -c "canReject !== false" apps/frontend/components/approvals/ApprovalsClient.tsx)
if [ "$GUARD_COUNT" -ge 3 ]; then
  echo "PASS: canReject !== false 가드 ${GUARD_COUNT}건 (onReject×2 + onBulkReject×1 이상)"
else
  echo "FAIL: canReject !== false 가드 ${GUARD_COUNT}건 — 3건 필요 (onReject×2 + onBulkReject)"
  grep -n "onReject=\|onBulkReject=" apps/frontend/components/approvals/ApprovalsClient.tsx
fi

# 보조 확인: onBulkReject 가드 존재 여부 (BulkActionBar 경로는 별도 세심히 확인)
grep -n "onBulkReject" apps/frontend/components/approvals/ApprovalsClient.tsx | grep "canReject"
```

> **탐지 전략**: 멀티라인 삼항(`onReject={\n  canReject !== false ? ...\n}`) 패턴에서 부재 탐지는 false positive 위험. PASS 기준을 `canReject !== false` 최소 3건 존재로 반전(positive detection) — 부재 경로는 건수 부족으로 자동 검출.
> **이유**: `onReject` 경로 2개 (ApprovalList + ApprovalDetailModal) + `onBulkReject` 경로 1개 = 최소 3건.

**PASS:** `canReject !== false` 경유 3건 이상.
**FAIL:** 3건 미만 → 누락 경로 수동 확인 후 `TAB_META[...].canReject !== false ? handler : undefined` 패턴 추가.

> **Step 32 vs Step 33 구분**: Step 32는 "수치에서 파생 가능한 boolean 필드 금지" (중복 표현 탐지). Step 33은 "독립 capability flag 사용 시 하위 경로 완전 가드 요구" (누락 경로 탐지). `canReject`는 어떤 수치에서도 파생 불가한 카테고리 도메인 결정이므로 Step 32 대상 아님.

**관련 파일:**
- `apps/frontend/lib/api/approvals-api.ts` — `TabMeta.canReject?: boolean` SSOT (2026-04-27)
- `apps/frontend/components/approvals/ApprovalsClient.tsx` — 4-path guard 구현체
- `apps/frontend/components/approvals/ApprovalRow.tsx` — `onReject?` optional prop
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx` — `onReject?` optional prop
- `apps/frontend/components/approvals/BulkActionBar.tsx` — `onBulkReject?` optional prop

---

## Step 34: 로컬 인터페이스명 packages 동명 타입 충돌 금지

`packages/schemas`에 이미 export된 타입과 **동일한 이름**으로 서비스 로컬 인터페이스를 선언하면,
미래에 패키지 타입을 import하는 코드와 혼동을 유발한다. 로컬 인터페이스는 목적을 명시하는 접미사로 구분해야 한다.

**규칙:** `interface Foo { ... }`가 로컬에 선언됐고 `packages/schemas`에 동명 `Foo` export가 존재하면 FAIL.
접미사 예시: `Summary`, `Row`, `Dto`, `Payload`, `Input`, `Output`.

**발생 이력 (2026-04-27):** `checkouts.service.ts`의 로컬 `interface CheckoutEquipment`가 `packages/schemas`의 `export type CheckoutEquipment`(행 타입)와 동명 충돌. → `CheckoutEquipmentSummary`로 이름 변경.

```bash
# packages/schemas export 타입 목록
grep -rn "^export\s\+\(interface\|type\|class\)" \
  packages/schemas/src/ --include="*.ts" \
  | grep -oP "(?<=(interface|type|class) )\w+" | sort -u > /tmp/schema_types.txt

# 백엔드 서비스 로컬 interface 목록
grep -rn "^interface\s\+\w\+\s*{" \
  apps/backend/src/modules/ --include="*.service.ts" \
  | grep -oP "(?<=interface )\w+" | sort -u > /tmp/local_interfaces.txt

# 충돌 탐지
comm -12 /tmp/schema_types.txt /tmp/local_interfaces.txt
# 기대: 출력 없음 (PASS) — 출력 있으면 FAIL
```

**PASS:** `comm -12` 결과 0줄 — 동명 충돌 없음.
**FAIL:** 동명 충돌 발견 → 로컬 인터페이스에 역할 명시 접미사 추가.

**예외:**
- 로컬 인터페이스가 동명 타입을 `extends`하는 경우 — 확장이지 재정의 아님
- `packages/schemas`에서 `import { Foo }` 후 재사용하는 경우 — 로컬 재정의 없음
- `private`/`non-export` 인터페이스도 동명이면 혼동 유발 → 예외 없음

**관련 파일:**
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `CheckoutEquipmentSummary` (이름 변경 이력)
- `packages/schemas/src/checkout.ts` — `CheckoutEquipment` 행 타입 SSOT, `CheckoutSummary` 공유 응답 타입 SSOT (Step 53)

---

## Step 39: shared-constants const array → `z.enum()` SSOT 패턴

**규칙**: 백엔드 Query DTO에서 enum 값을 Zod로 검증할 때, `z.enum(['me','team','lab','all'])` 인라인 배열 직접 정의 금지.
반드시 `packages/shared-constants`에 `as const` 배열을 정의하고 `z.enum(MY_CONST_ARRAY)`로 참조해야 한다.
프론트엔드는 해당 패키지에서 타입만 import (`type MyType = (typeof MY_CONST_ARRAY)[number]`).

**근거**: 인라인 enum 배열은 (1) FE/BE 드리프트 위험 (2) 허용 값 변경 시 두 곳 수정 필요 (3) TypeScript 타입과 Zod 검증이 별도 소스 의존.

**탐지 — z.enum 인라인 배열 직접 정의:**
```bash
# DTO 파일에서 z.enum에 인라인 배열 직접 전달 (shared-constants 미경유)
grep -rn "z\.enum(\['" \
  apps/backend/src/modules --include="*.dto.ts" \
  | grep -v "//\|spec\."
# 기대: 0건 (모두 z.enum(SSOT_CONST_ARRAY) 패턴)

# shared-constants에서 as const 배열 SSOT 정의 확인
grep -rn "as const$" \
  packages/shared-constants/src/ --include="*.ts" \
  | grep -v "//\|node_modules"
# 결과: DASHBOARD_SCOPES, CHECKOUT_TYPES 등 도메인 enum 배열 목록 확인
```

**올바른 패턴:**
```typescript
// ✅ shared-constants SSOT — packages/shared-constants/src/dashboard-scope.ts
export const DASHBOARD_SCOPES = ['me', 'team', 'lab', 'all'] as const;
export type DashboardScope = (typeof DASHBOARD_SCOPES)[number];

// ✅ 백엔드 DTO — z.enum에 SSOT 배열 직접 참조
import { DASHBOARD_SCOPES } from '@equipment-management/shared-constants';
const dashboardScopeSchema = z.object({ scope: z.enum(DASHBOARD_SCOPES) });

// ✅ 프론트엔드 — 타입만 import
import type { DashboardScope } from '@equipment-management/shared-constants';

// ❌ 인라인 배열 — 드리프트 위험
const schema = z.object({ scope: z.enum(['me', 'team', 'lab', 'all']) });
```

**PASS:** `z.enum([` 인라인 배열 0건. shared-constants SSOT 배열 경유 확인.
**FAIL:** 인라인 배열 발견 → shared-constants에 `as const` 배열 이관 + `z.enum(SSOT_ARRAY)` 교체.

**알려진 기존 tech-debt (2026-04-28 기준, 탐지 시 WARN 처리):**
- `pending-checks-query.dto.ts:8` `z.enum(['lender', 'borrower'])` — CheckoutRole을 shared-constants로 이관 대상
- `calibration-query.dto.ts:23` `CalibrationDueStatusEnum = z.enum(['overdue', 'upcoming', 'normal'])` — CalibrationDueStatus를 shared-constants로 이관 대상

**예외:**
- 단일 사용처 enum (`z.enum(['asc', 'desc'])` 정렬 방향) — 도메인 의미 없는 프레젠테이션 값은 로컬 허용
- `z.enum([z.literal(...)])` 패턴 — Zod union 내부 literal 선언이므로 별도 룰

**관련 파일:**
- `packages/shared-constants/src/dashboard-scope.ts` — SSOT 패턴 모범 사례 (2026-04-28)
- `apps/backend/src/modules/dashboard/dto/dashboard-scope.dto.ts` — 소비처 모범 사례

---

## Step 40: domain enum 분류 매핑은 `as const satisfies Record<EnumType, X>` 강제 — `Set<EnumType>` 약타입 금지

domain enum(예: `CheckoutAction`)을 키로 하는 분류 맵은 `as const satisfies Record<EnumType, X>` 패턴 사용 강제. `Set<EnumType>` 또는 `Record<string, X>` 같은 약타입 대체는 enum 확장 시 silent fail을 만든다.

**왜 Set보다 Record가 우월한가**:
- `Set<CheckoutAction>` 패턴: enum에 새 멤버 추가 → Set 갱신 누락이 컴파일러에 보이지 않음 → 런타임에 default fallback (silent fail).
- `Record<CheckoutAction, Class> + satisfies`: enum 확장 시 누락 키가 즉시 빌드 에러 — forward-coverage 보장.

```bash
# domain enum 분류에 ReadonlySet/Set 사용 탐지 (FAIL 패턴)
grep -rn "ReadonlySet<\(CheckoutAction\|EquipmentStatus\|CheckoutStatus\|UserRole\)>" packages/ apps/
# 기대: 0 hits (Record로 대체)

# satisfies Record 패턴 사용 확인
grep -rn "as const satisfies Record<" packages/shared-constants/src
# 기대: 분류 맵 ≥ 1건 (예: CHECKOUT_ACTION_INLINE_CLASS)
```

**PASS:**
- enum × 분류 매핑이 `as const satisfies Record<EnumType, X>` 패턴
- 새 enum 멤버 추가 시 누락 키가 빌드 에러로 즉시 노출

**FAIL:**
- `ReadonlySet<EnumType>` / plain `Set<EnumType>`로 분류 — silent fail
- `Record<string, X>` 약타입 — enum 변경 추적 불가

**예외:**
- 단순 *멤버십* 체크가 목적이고 분류 의미 없음 (예: "이 액션은 admin only?" boolean) → Set 허용

**한계:** TypeScript `satisfies Record<>`는 *추가* 누락은 잡지만 enum *제거* 시 dead key는 경고하지 않음. dead key 정리는 review-architecture에서 발견 시 별도 cleanup PR.

**관련 파일:**
- `packages/shared-constants/src/checkout-thresholds.ts` — `CHECKOUT_ACTION_INLINE_CLASS` 모범 사례

**발생 이력 (2026-04-28)**: Phase 3 P0-3에서 `OK_INLINE_ACTIONS`/`APPROVE_INLINE_ACTIONS` `ReadonlySet<CheckoutAction>` 패턴 → `CHECKOUT_ACTION_INLINE_CLASS as const satisfies Record<CheckoutAction, InlineActionClass>`로 전환. 14개 액션 분류 enum 확장 시 컴파일러가 강제.

---

## Step 46: 목적별 폼 설정 SSOT — `as const satisfies Record<CheckoutPurpose, ...>` 패턴, 인라인 목적 분기 boolean 재정의 금지

**규칙**: 반출 목적(`CheckoutPurpose`)에 따라 달라지는 폼 동작(필드 표시 여부, 필수 여부, 자동 도출 여부)은 반드시 `as const satisfies Record<CheckoutPurpose, ConfigInterface>` 설정 객체로 중앙화한다. 컴포넌트 내부에서 `const isCalibrationRequired = purpose === 'calibration'` 같은 인라인 boolean 플래그를 재정의하면 새 목적 추가 시 TypeScript exhaustiveness 검사가 작동하지 않아 누락 위험이 있다.

**왜 SSOT 설정 객체가 필요한가**:
- 인라인 `purpose === CPVal.CALIBRATION` 조건 분기는 TypeScript가 enum 완전성을 강제하지 않음 — 새 목적 추가 시 컴파일 에러 없이 조용히 누락.
- `as const satisfies Record<CheckoutPurpose, ...>` 패턴은 `CheckoutPurpose` 모든 값에 대한 설정을 컴파일 타임에 강제.
- 백엔드 validation과 프론트엔드 UX 조건이 분산되면 drift 발생 — 설정 객체가 의도를 문서화하는 SSOT 역할 수행.

**검증 명령**:
```bash
# 1) 인라인 목적 boolean 플래그 패턴 탐지
grep -rn "isCalibrationRequired\|isRepairRequired\|isRentalPurpose\b\|isRental\b" \
  apps/frontend/components/checkouts/ \
  --include="*.tsx" --include="*.ts"
# 기대: 0건 (설정 객체 config.calibrationRequired 패턴만 허용)

# 2) RETURN_INSPECTION_PURPOSE_CONFIG satisfies Record 유지 확인
grep -n "satisfies Record<CheckoutPurpose" \
  apps/frontend/components/checkouts/ReturnInspectionForm.tsx
# 기대: 1건 (as const satisfies Record<CheckoutPurpose, PurposeInspectionConfig>)

# 3) 새 목적 추가 시 exhausiveness — CheckoutPurpose 값 수
grep -n "CheckoutPurposeValues\|CPVal\." \
  packages/schemas/src/enums/checkout.ts 2>/dev/null || \
grep -n "CheckoutPurpose\b" packages/schemas/src/ -r | head -5
# 기대: RETURN_INSPECTION_PURPOSE_CONFIG 키 수 = CheckoutPurpose 값 수
```

**PASS:**
- `ReturnInspectionForm.tsx`에 `as const satisfies Record<CheckoutPurpose, PurposeInspectionConfig>` 존재
- 컴포넌트 내 `isCalibrationRequired` / `isRepairRequired` 인라인 boolean 0건
- config 객체 필드 참조(`config.calibrationRequired`)로 조건 분기

**FAIL:**
- `const isCalibrationRequired = purpose === 'calibration'` 같은 인라인 재정의 발견 — 설정 객체로 이관 필요
- `satisfies Record<CheckoutPurpose, ...>` 없는 단순 객체 리터럴 — 새 목적 누락 탐지 불가

**예외:**
- JSX 내 `{purpose === CPVal.RENTAL ? ... : ...}` 조건부 렌더링 — 단순 렌더 분기는 설정 객체 불필요 (설정에서 이미 결정된 값 사용)

**관련 파일:**
- `apps/frontend/components/checkouts/ReturnInspectionForm.tsx` — RETURN_INSPECTION_PURPOSE_CONFIG SSOT
- `packages/schemas/src/enums/checkout.ts` (또는 schemas) — CheckoutPurpose enum SSOT

**발생 이력 (2026-04-29 신설)**: rental 반입 처리 시 교정/수리 체크박스가 모든 목적에 표시되는 UX 중복 버그. 목적별 설정 SSOT 부재로 `isCalibrationRequired = purpose === 'calibration'` 인라인 플래그가 乱立 — `RETURN_INSPECTION_PURPOSE_CONFIG as const satisfies Record<CheckoutPurpose, ...>` 도입으로 exhaustiveness 강제.

---

## Step 48: `switch + assertNever` exhaustiveness — discriminated union 핸들러

**규칙**: discriminated union의 `kind` 필드(또는 동등한 태그 필드)를 분기하는 함수는 `if-else` 대신 `switch + assertNever(x: never): never` 패턴을 사용하여 컴파일 타임 exhaustiveness를 보장한다.

**왜 `switch + assertNever`가 필요한가**: `if (cfg.kind === 'a') ... else ...` 패턴은 TypeScript가 새 kind 추가 시 미처리 경로를 컴파일 에러로 잡지 못한다. `default: assertNever(cfg)` 패턴은 `cfg`의 타입이 `never`가 되어야 컴파일을 통과하므로, 새 `kind` 추가 시 즉시 컴파일 에러가 발생한다.

**현재 적용 지점**: `apps/frontend/lib/navigation/nav-config.ts` — `resolveBadgeAndAction()`

**검증 명령**:
```bash
# 1) nav-config.ts resolveBadgeAndAction에 assertNever 존재 확인
grep -n "assertNever\|switch.*cfg\.kind\|switch.*\.kind" \
  apps/frontend/lib/navigation/nav-config.ts
# 기대: assertNever 1건 + switch 1건

# 2) assertNever 함수 정의 존재 확인
grep -n "function assertNever.*never.*never\|assertNever(x: never): never" \
  apps/frontend/lib/navigation/nav-config.ts
# 기대: 1건 (function assertNever(x: never): never { throw ... })

# 3) cfg.kind를 if-else로 처리하는 패턴 탐지 (회귀 방지)
grep -n "if.*cfg\.kind\s*===\|if.*\.kind\s*===" \
  apps/frontend/lib/navigation/nav-config.ts
# 기대: 0건 (switch 패턴으로 교체됨)
```

**PASS 기준**:
- `switch (cfg.kind)` + `default: assertNever(cfg)` 패턴 존재
- `function assertNever(x: never): never` 정의 존재
- `if (cfg.kind === ...)` else 체인 0건

**FAIL 기준**:
- `if (cfg.kind === 'count-with-action') ... else ...` — switch+assertNever로 교체 필요
- `assertNever` 없는 switch `default:` — 런타임 에러만 가능, 컴파일 타임 체크 불가

**예외**:
- 단순 boolean guard (`if (cfg.enabled)`) — 유니언 분기 아니므로 해당 없음
- JSX 삼항 조건 (`{cfg.kind === 'a' ? <A /> : <B />}`) — 컴포넌트 렌더 분기는 2분기라면 허용

**관련 파일**:
- `apps/frontend/lib/navigation/nav-config.ts` — `resolveBadgeAndAction`, `assertNever` 정의

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0429 Phase E — `NavItemBadgeConfig.kind` 2종에 `if-else` 사용 중 3번째 kind 추가 시 TypeScript가 잡지 못하는 구조적 취약점 발견. `switch + assertNever` 패턴으로 교체하여 컴파일 타임 exhaustiveness 보장.

---

## Step 49: UI 도메인 타입 파일 SSOT + 위임 re-export 패턴

**규칙**: 여러 컴포넌트가 공유하는 UI 인터페이스(예: `OverflowAction`)는 `apps/frontend/lib/types/` 하위 도메인 타입 파일에 단일 정의해야 한다. 중간 컴포넌트(예: `NextStepPanel.tsx`)가 re-export하는 경우 `import type { X } from '@/lib/types/...'; export type { X }` 패턴만 허용. 중간 컴포넌트에서 새로운 인터페이스를 **정의**하면 SSOT 분산이 발생한다.

**패턴 구분**:
- ✅ `lib/types/checkout-ui.ts`에서 `export interface OverflowAction { ... }` → SSOT 정의
- ✅ `NextStepPanel.tsx`에서 `import type { OverflowAction } from '@/lib/types/checkout-ui'; export type { OverflowAction }` → 위임 re-export (backward-compat 허용)
- ❌ `NextStepPanel.tsx`에서 `export interface OverflowAction { ... }` → 컴포넌트 내 인터페이스 직접 정의 (SSOT 분산)

**왜 위임 re-export가 필요한가**: 기존 호출처가 `from '@/components/checkouts/NextStepPanel'`으로 import하는 경우 import 경로 수정 없이 SSOT로 이관 가능. 단, SSOT 파일에 주석(`// SSOT: OverflowAction은 lib/types/checkout-ui.ts에 정의. 신규 호출처는 그 파일을 직접 import.`)을 두어 신규 코드는 SSOT를 직접 import하도록 유도해야 한다.

**검증 명령**:
```bash
# 1) OverflowAction SSOT 정의 위치 확인
grep -rn "export interface OverflowAction\|export type OverflowAction" \
  apps/frontend \
  --include="*.ts" --include="*.tsx"
# 기대: 1건 (apps/frontend/lib/types/checkout-ui.ts) — 컴포넌트 파일에서의 정의 0건

# 2) lib/types/checkout-ui.ts 단일 SSOT 파일 존재 확인
ls apps/frontend/lib/types/checkout-ui.ts && echo "EXISTS" || echo "MISSING"

# 3) 위임 re-export 패턴 확인 (컴포넌트에서 re-export 시 정의가 아닌 re-export여야 함)
grep -rn "export.*OverflowAction" \
  apps/frontend/components \
  --include="*.tsx" --include="*.ts" \
  | grep -v "export type { OverflowAction }"
# 기대: 0건 (컴포넌트 내 export는 모두 `export type { X }` 위임 패턴)

# 4) 신규 호출처가 SSOT를 직접 import하는지 확인 (컴포넌트 경유 아닌 직접 경로)
grep -rn "from '@/lib/types/checkout-ui'" \
  apps/frontend \
  --include="*.ts" --include="*.tsx" \
  | grep -v "checkout-ui.ts"
# 기대: ≥ 1건 (직접 import 호출처 존재)
```

**PASS**:
- `OverflowAction`은 `apps/frontend/lib/types/checkout-ui.ts` 단 1곳에서 `export interface`로 정의
- 컴포넌트(`NextStepPanel.tsx` 등)의 re-export는 `export type { OverflowAction }` 위임 형태
- 신규 호출처(`CheckoutGroupCard.tsx` 등)는 `lib/types/checkout-ui` 직접 import

**FAIL**:
- 컴포넌트 파일에서 `export interface OverflowAction { ... }` 직접 정의 → `lib/types/checkout-ui.ts`로 이관
- `lib/types/checkout-ui.ts` 파일 없음 → 생성 필요
- 중간 컴포넌트가 정의+re-export 동시 수행 → 정의만 `lib/types/`로 이관하고 컴포넌트는 위임만 유지

**예외**:
- 단일 컴포넌트 전용 로컬 인터페이스 (외부 소비처 없는 `Props` 타입) — SSOT 이관 불필요
- `packages/schemas`에 이미 정의된 타입 — `lib/types/`가 아닌 패키지에서 직접 import

**관련 파일**:
- `apps/frontend/lib/types/checkout-ui.ts` — `OverflowAction` SSOT 정의 (2026-04-30)
- `apps/frontend/components/checkouts/NextStepPanel.tsx` — `import type + export type { OverflowAction }` 위임 re-export 모범 사례
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `lib/types/checkout-ui` 직접 import 호출처

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430 Phase D — `OverflowAction`이 `NextStepPanel.tsx`에 정의되어 있어 `CheckoutGroupCard.tsx`가 컴포넌트 파일을 import해야 했다. `apps/frontend/lib/types/checkout-ui.ts` SSOT 파일 신설 + NextStepPanel 위임 re-export 패턴 도입으로 타입 분산 해소.

---

## Step 53: 백엔드-프론트 공유 API 응답 타입 → packages/schemas SSOT

**규칙**: 백엔드 서비스와 프론트엔드 API 클라이언트가 동시에 사용하는 응답 타입(예: `CheckoutSummary`)은 `packages/schemas`에 단일 정의 후 양측이 import해야 한다. 프론트엔드 `*-api.ts`나 백엔드 서비스 인라인에 별도 정의하는 것은 drift 원천이다.

**왜 중요한가**: 응답 타입을 각자 정의하면 컴파일러가 drift를 잡지 못한다. 백엔드에서 필드명을 바꿔도 프론트가 자체 정의를 쓰면 빌드가 통과하고, 런타임에 `undefined`로 깨진다. `CheckoutSummary.approved`가 실제로 `inProgress`를 의미하는 동안 프론트 타입이 `approved`를 그대로 유지했던 것이 이 패턴의 실패 사례다.

**올바른 구조**:
```typescript
// ✅ packages/schemas/src/checkout.ts — 단일 정의
export interface CheckoutSummary {
  total: number;
  pending: number;
  inProgress: number;   // 필드명이 의미를 정확히 표현
  overdue: number;
  returnedToday: number;
}

// ✅ apps/backend — import 사용
import type { CheckoutSummary } from '@equipment-management/schemas';
async getSummary(): Promise<CheckoutSummary> { ... }

// ✅ apps/frontend/lib/api/*-api.ts — import 후 re-export만 허용
import type { CheckoutSummary } from '@equipment-management/schemas';
export type { CheckoutSummary };  // 위임 re-export

// ❌ WRONG — 프론트엔드 로컬 재정의
export interface CheckoutSummary {   // 별도 정의 금지
  approved: number;  // 필드명 drift 발생
}
```

**검증 명령어**:
```bash
# 1. CheckoutSummary 정의가 packages/schemas에만 존재
grep -rn "interface CheckoutSummary\|type CheckoutSummary" \
  apps/ packages/ \
  --include="*.ts" \
  | grep -v "node_modules\|\.d\.ts"
# 기대: 0건 (packages/schemas에는 존재, apps/ 내 재정의 0건)

# 2. packages/schemas에 CheckoutSummary export 존재
grep -n "export interface CheckoutSummary\|export type CheckoutSummary" \
  packages/schemas/src/checkout.ts
# 기대: 1건

# 3. 프론트엔드 API 파일이 re-export만 허용 (정의 아님)
grep -n "CheckoutSummary" apps/frontend/lib/api/checkout-api.ts
# 기대: import + export type 2건만 (interface/type 정의 0건)

# 4. 백엔드 service 반환 타입이 CheckoutSummary 참조
grep -n "Promise<CheckoutSummary>\|summary?: CheckoutSummary" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 2건 이상 (getSummary 반환 + CheckoutListResponse.summary)
```

**PASS**: packages/schemas 단일 정의 + 프론트 re-export만 + 백엔드 import 사용
**FAIL**: `apps/` 내 `interface CheckoutSummary` 직접 정의 → schemas로 이동 후 re-export 패턴 적용

**관련 파일**:
- `packages/schemas/src/checkout.ts` — `CheckoutSummary` SSOT 정의 (2026-04-30 이동)
- `apps/frontend/lib/api/checkout-api.ts` — re-export 위임 패턴
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `CheckoutListResponse.summary`, `getSummary()` 반환 타입

**발생 이력 (2026-04-30 신설)**: KPI 카드 버그 수정 과정에서 `CheckoutSummary.approved` 필드가 실제로 `in_progress` 전체를 의미하는데 프론트 로컬 정의 때문에 컴파일러가 drift를 잡지 못했음. 타입을 packages/schemas로 이동하고 필드명을 `inProgress`로 교정 후 빌드 실패로 모든 참조 즉시 탐지.
