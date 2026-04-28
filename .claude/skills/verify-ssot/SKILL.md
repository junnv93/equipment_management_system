---
name: verify-ssot
description: SSOT(Single Source of Truth) 임포트 소스를 검증합니다. 타입/enum/상수가 올바른 패키지에서 임포트되는지 확인. 타입/enum 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 패키지명]'
---

# SSOT 임포트 소스 검증

## Purpose

타입, enum, 상수가 올바른 패키지에서 임포트되는지 검증합니다:

1. **Enum/타입 임포트** — `UserRole`, `EquipmentStatus` 등은 `@equipment-management/schemas`에서 임포트
2. **Permission 임포트** — `@equipment-management/shared-constants`에서 임포트
3. **API 엔드포인트 임포트** — `@equipment-management/shared-constants`에서 임포트
4. **로컬 재정의 금지** — 패키지에 정의된 타입을 로컬에서 재정의하지 않음
5. **Icon Library 통합** — lucide-react 표준 준수

> **하드코딩 값 탐지는 `/verify-hardcoding`에서 수행합니다.**

## When to Run

- 새로운 enum이나 타입을 추가한 후
- import 경로를 변경한 후
- 새로운 모듈/컴포넌트를 추가한 후

## Related Files

핵심 SSOT 패키지 요약 (전체 파일 목록: [references/ssot-file-map.md](references/ssot-file-map.md)):

| Package / Layer | SSOT 항목 |
|---|---|
| `packages/schemas/` | Enum, 타입, ErrorCode, 설정 기본값, VM 검증 메시지, DocumentType, **AuditLogUserRole** |
| `packages/shared-constants/` | Permission, API 경로, 스코프 정책, 비즈니스 규칙, 엔티티 라우트, Test Users |
| `packages/db/` | DB enum 배열, AppDatabase 타입, **varchar 컬럼 `.$type<T>()` 타입 좁힘** |
| `apps/backend/src/common/scope/scope-enforcer.ts` | `enforceScope()` 정책 함수 + `EnforcedScope` 타입 (요청 경계 — cross-site/cross-team 차단 SSOT) |
| `apps/backend/src/common/scope/scope-sql-builder.ts` | `buildScopePredicate` / `dispatchScopePredicate` (쿼리 계층 — 정책 상태기계 SSOT, 2026-04-08~) |
| `apps/backend/src/common/decorators/site-scoped.decorator.ts` | `@SiteScoped` 데코레이터 + `SiteScopedOptions` (failLoud 옵션 포함) |
| `apps/backend/src/common/decorators/current-scope.decorator.ts` | `@CurrentScope()` / `@CurrentEnforcedScope()` parameter decorator |
| `apps/backend/.eslintrc.js` | ESLint `no-restricted-syntax` — domain status 리터럴 3-layer 차단 (BinaryExpression / Property / CallExpression selector) |

## Workflow

### Step 1: 로컬 enum/타입 재정의 탐지

패키지에 정의된 핵심 타입(UserRole, EquipmentStatus, SystemSettings 등)이 로컬에서 재정의되는지 확인.
**PASS:** 0개 결과. **FAIL:** 로컬 타입 정의 발견 시 패키지 임포트로 변경.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 1

### Step 2: Permission 임포트 소스 확인

**PASS:** 모든 Permission이 `@equipment-management/shared-constants`에서 import. **FAIL:** 다른 소스 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 2

### Step 2a: Client-side `hasRole()` 금지 (role literal 기반 권한 게이트 탐지)

**PASS:** 프론트엔드 컴포넌트/페이지에 `useAuth().hasRole` 사용 0건. role 리터럴 배열을 권한 게이트로 쓰는 패턴 0건. **FAIL:** client code에서 hasRole 또는 `[URVal.XXX, ...]`로 권한 결정.

규칙 근거: 2026-04-08 (49fb6d7e)에 role-based client gating이 전면 `can(Permission.X)`로 마이그레이션되어 백엔드 `@RequirePermissions`와 단일 SSOT를 공유.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 2a

### Step 3: 패키지별 임포트 소스 확인 (3a~3e 포함)

API_ENDPOINTS, Audit Log 타입, Field Labels, Entity Routes, Data Scope, SSOT 상수의 import 소스 확인.
**PASS:** 모두 올바른 패키지에서 import. **FAIL:** 잘못된 소스 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 3

### Step 4: Icon Library 통합 확인

react-icons(deprecated) 사용 및 비표준 icon library 탐지.
**PASS:** lucide-react만 사용. **FAIL:** react-icons 또는 비표준 라이브러리 사용.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 4

### Step 5~14: 추가 SSOT 검증

| Step | 검증 대상 |
|---|---|
| 5 | AppDatabase SSOT 타입 (NodePgDatabase 직접 import 금지) |
| 6 | ApiResponse 로컬 재정의 |
| 7 | APPROVAL_KPI 임포트 소스 |
| 8 | 신규 shared-constants SSOT (APPROVAL_CATEGORIES, BUSINESS_RULES 등) |
| 9 | DB Enum 배열 SSOT 참조 |
| 10 | REJECTION_STAGE_VALUES SSOT |
| 11 | VM (Validation Messages) 임포트 소스 |
| 12 | Test User Constants SSOT |
| 13 | DocumentTypeValues SSOT |
| 14 | Scope enforcement + query-layer SSOT — `EnforcedScope` / `enforceScope` 로컬 재정의 금지, controller helper로 `_resolveXxxScope` 사본 정의 금지, **service 계층의 `switch (scope.type)` 정책 상태기계 사본 정의 금지** (2026-04-08 추가) |

**Step 14 탐지 명령어:**
```bash
# (a) EnforcedScope/enforceScope 로컬 재정의 (scope-enforcer.ts 외)
grep -rn "interface EnforcedScope\|export function enforceScope" apps/backend/src/ \
  | grep -v "common/scope/scope-enforcer.ts"

# (b) controller 가 _resolveXxxScope 같은 inline scope helper 를 정의 (도메인 특수 예외 외)
grep -rn "private _resolve.*Scope\|private resolveDataScope" apps/backend/src/modules/ \
  | grep -v "audit-logs"  # AUDIT_LOG_SCOPE 인라인은 의도적 예외

# (c) query-layer 정책 상태기계 사본 — service 가 buildScopePredicate/dispatchScopePredicate 우회하고
#     scope.type 4-case switch 를 인라인 구현. 0건이 PASS.
grep -rn "switch.*scope\.type\|scope\.type === 'team'\|scope\.type === 'site'" apps/backend/src/modules/ \
  --include="*.ts" \
  | grep -v "checkout-scope.util.ts"  # 도메인 특수 3-case OR builder, dispatch 위에 얹힘
# common/scope/ 외에서 hit 가 있으면 buildScopePredicate / dispatchScopePredicate 로 마이그레이션 권장.
```

규칙 근거:
- 2026-04-08 (8c4806fd) Phase 1+2 통합으로 scope enforcement 가 단일 정책 함수 + 단일 진입점(@SiteScoped)으로 수렴
- 2026-04-08 (8d7c8971 / b0804812) `buildScopePredicate` + `dispatchScopePredicate` 가 query 계층 정책 상태기계 SSOT 로 승격. approvals.service 18 callsite 마이그레이션 + checkout-scope.util.ts 통합으로 drift 차단.

상세: [references/ssot-checks.md](references/ssot-checks.md) Step 5~13

### Step 15: data-migration SSOT 검증 (2026-04-18 추가)

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

### Step 17: Content-Disposition 헤더 빌더 SSOT (2026-04-20 추가)

`apps/backend/src/common/http/content-disposition.util.ts`의 `buildContentDisposition(filename, disposition?)` 가
RFC 5987 Content-Disposition 헤더 조립 SSOT. 컨트롤러에서 직접 `res.setHeader('Content-Disposition', ...)` 로
문자열을 조립하거나 `encodeURIComponent`로 자체 조립하는 것은 SSOT 위반.

**17a: buildContentDisposition 미경유 직접 헤더 조립 탐지**
```bash
# 컨트롤러에서 Content-Disposition 헤더를 직접 조립하는 패턴 탐지
grep -rn "Content-Disposition\|setHeader.*disposition" \
  apps/backend/src/modules --include="*.controller.ts" \
  | grep -v "buildContentDisposition\|import\|//\|@ApiHeader"
# 결과: 0건 (buildContentDisposition 경유)
```

**17b: SSOT 소스 확인**
```bash
# 헬퍼가 SSOT 위치에 존재하는지 확인
grep -n "export function buildContentDisposition" \
  apps/backend/src/common/http/content-disposition.util.ts
# 결과: 1건 (export function 정의)
```

**PASS:** 컨트롤러에서 Content-Disposition 직접 조립 0건. **FAIL:** `setHeader('Content-Disposition', \`attachment; filename*=...\`)` 직접 사용 발견 시 `buildContentDisposition` 로 교체.

**예외:** S3 SDK의 `ResponseContentDisposition` 파라미터 (`s3-storage.provider.ts`) — SDK API가 문자열을 직접 요구하므로 허용. 단, 동일 RFC 5987 형식 준수 확인.

### Step 16: 도메인 유틸 상수 SSOT 검증 (2026-04-19 추가)

`isCheckoutExportable` / `NON_EXPORTABLE_CHECKOUT_STATUSES` 등 도메인 유틸 파일에서 추출된 상수가
다른 파일에서 로컬 재정의 없이 SSOT 헬퍼를 경유하는지 확인.

**16a: NON_EXPORTABLE_CHECKOUT_STATUSES 로컬 재정의 금지**
```bash
# checkout-exportability.ts 외 파일에서 NON_EXPORTABLE 상수를 로컬 정의하면 SSOT 위반
grep -rn "NON_EXPORTABLE_CHECKOUT_STATUSES\s*=" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "checkout-exportability.ts"
# 결과: 0건
```

**16b: nonExportableStatuses 인라인 배열 금지 (이전 인라인 규칙 잔재 탐지)**
```bash
# CheckoutDetailClient 등에서 [CSVal.PENDING, CSVal.REJECTED] 인라인 배열로 판단하는 패턴 잔재 없어야 함
grep -rn "nonExportableStatuses\s*=" \
  apps/frontend --include="*.ts" --include="*.tsx"
# 결과: 0건 (isCheckoutExportable() SSOT 경유)
```

**16c: SSOT 소비 확인**
```bash
# isCheckoutExportable이 사용되는 모든 파일이 checkout-exportability.ts에서 import하는지 확인
grep -rn "isCheckoutExportable" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "checkout-exportability"
# 결과: import 라인만 존재 (정의 라인 없어야 함)
```

### Step 18: E2E createTestApp globalPrefix SSOT 검증 (2026-04-21 업데이트)

`apps/backend/test/helpers/test-app.ts`의 `createTestApp()`에 `app.setGlobalPrefix('api')` 설정.
모든 E2E spec은 `API_ENDPOINTS.*` SSOT를 직접 사용. `toTestPath()` 래퍼는 2026-04-21 삭제됨.

**18a: toTestPath anti-pattern 재도입 탐지**
```bash
grep -rn "toTestPath\|test-paths" apps/backend/test
# 결과: 0건 (삭제된 래퍼 재도입 금지)
```

**18b: spec 파일 내 /api/ 제거 경로 하드코딩 금지**
```bash
grep -rn "\.\(get\|post\|patch\|delete\|put\)(['\`][^/]" \
  apps/backend/test --include="*.e2e-spec.ts" \
  | grep -v "API_ENDPOINTS"
# 결과: 0건 (모두 API_ENDPOINTS.* 경유)
```

**PASS:** toTestPath 0건 + 직접 경로 0건. **FAIL:** `toTestPath` 재정의 또는 `/api/` 없는 bare 경로 직접 사용.

> verify-e2e Step 15d와 연계: E2E 패턴 전반은 verify-e2e가 담당.

### Step 19: 프론트엔드 도메인 Status/Type 리터럴 비교 SSOT (2026-04-21 추가)

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

**PASS:** 세 탐지 명령어 모두 0건. **FAIL:** raw 리터럴 비교 또는 loose index signature 발견 시 SSOT 타입으로 교체.

### Step 20: Permission 라벨 렌더링 SSOT (2026-04-21 추가)

프론트엔드에서 권한 표시명을 i18n JSON이 아닌 TypeScript 상수(`PERMISSION_LABELS_LOCALIZED`)에서
직접 읽어야 함. `t.raw('profile.permissions.labels')` 패턴은 레거시이며 타입 안전성이 없음.

**배경:** `PERMISSION_LABELS_LOCALIZED: Record<string, Record<Permission, string>>`이
`@equipment-management/shared-constants`에서 export됨. `Record<Permission, string>` 타입이
컴파일 타임에 완전성을 강제 — 새 Permission 추가 시 `PERMISSION_LABELS_EN`에 누락이면 tsc 에러.

**20a: t.raw permission labels 레거시 패턴 탐지**
```bash
grep -rn "t\.raw.*profile\.permissions\.labels\|t\.raw.*permissions\.labels" \
  apps/frontend --include="*.tsx" --include="*.ts"
# 결과: 0건 (PERMISSION_LABELS_LOCALIZED[locale] 패턴으로 대체됨)
```

**20b: PERMISSION_LABELS_LOCALIZED SSOT 경유 확인**
```bash
grep -n "PERMISSION_LABELS_LOCALIZED" \
  apps/frontend/app/\(dashboard\)/settings/profile/ProfileContent.tsx
# 결과: import + 사용 2건 이상
```

**20c: settings.json labels 섹션 부재 확인 (TypeScript로 이관됨)**
```bash
grep -n '"labels"' apps/frontend/messages/ko/settings.json apps/frontend/messages/en/settings.json
# 결과: 0건 (labels 섹션은 TypeScript SSOT로 이관되어 JSON에 없어야 함)
```

**PASS:** 20a·20c 0건, 20b 2건 이상. **FAIL:** t.raw 레거시 패턴 재도입 또는 settings.json에 labels 섹션 복원.

### Step 21: ConditionCheckStepValues SSOT + ExportData 도메인 Step 리터럴 (2026-04-21 추가)

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

**PASS:** 21a 0건. **FAIL:** step 리터럴 직접 비교.

### Step 22: ESLint 3-layer domain status 리터럴 차단 검증 (2026-04-21 추가)

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

**PASS:** 3-layer selector 모두 존재 + lint 에러 0건. **FAIL:** selector 누락 또는 lint 에러 발생.

> **연계:** verify-hardcoding Step 23(export allowlist 상태 리터럴)과 상호 보완 — ESLint가 BinaryExpression/Property/CallExpression을 정적으로 차단하고, Step 23은 배열 요소로 사용된 리터럴을 grep으로 탐지.

### Step 24: UnifiedApprovalStatus (UASVal) SSOT — approvals-api.ts (2026-04-22 추가)

`apps/frontend/lib/api/approvals-api.ts`의 `mapCheckoutToApprovalItem` / `mapNonConformanceToApprovalItem` /
`mapInspectionToApprovalItem` 등 매핑 함수에서 `UnifiedApprovalStatus` 값을 raw 문자열 리터럴로
할당하는 패턴 탐지. `UnifiedApprovalStatusValues` (= `UASVal`)에서 상수를 경유해야 함.

**24a: approvals-api.ts 내 UnifiedApprovalStatus raw 리터럴 탐지**
```bash
grep -n "status: 'pending'\|status: 'pending_review'\|status: 'approved'\|status: 'rejected'\|status: 'in_progress'" \
  apps/frontend/lib/api/approvals-api.ts \
  | grep -v "//\|import\|type\|interface"
# 결과: 0건 (UASVal.PENDING 등 SSOT 상수 경유)
```

**24b: UASVal import 확인**
```bash
grep -n "UnifiedApprovalStatusValues\|UASVal" apps/frontend/lib/api/approvals-api.ts | head -5
# 결과: import 라인 존재해야 함
```

**PASS:** 24a 0건 + 24b import 확인. **FAIL:** raw 리터럴 직접 할당 발견 시 `UASVal.PENDING_REVIEW` 등 상수로 교체.

> **배경:** 2026-04-22 verify-implementation에서 `status: 'pending_review'`(L1142), `status: 'pending'`(L1165, L1192) 3건 발견. 현재 값이 SSOT 값과 우연히 일치하여 런타임 버그는 없으나, 향후 SSOT 값 변경 시 approvals-api.ts가 무결성 보장을 받지 못함.

### Step 25: design-token 헬퍼 함수 내 status literal 직접 비교 금지 (2026-04-24 추가)

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

**PASS:** design-token 헬퍼 내 도메인 status raw 리터럴 0건. **FAIL:** `=== 'overdue'` 등 발견 →
`CheckoutStatusValues.OVERDUE` 등 `*StatusValues` 상수 경유로 교체.

**예외:**
- CSS 클래스 문자열 내 `bg-brand-ok/10` 같은 Tailwind 클래스 값 — status 비교 아님
- 배지 맵(`CHECKOUT_STATUS_BADGE_TOKENS`) Record 키 선언 (`overdue: '...'`) — 키 선언은 비교가 아니므로 허용
- i18n 키 문자열 (`'checkouts.stepper.overdue'`) — 네임스페이스 경로 문자열이므로 허용

> **연계:** verify-design-tokens Step 18의 `*StatusValues satisfies` 검사와 상호 보완. design-token 파일에서 StatusValues가 올바르게 import·사용되는지를 이 Step이 담당.

### Step 26: notifyCheckoutAction SSOT 경유 검증 (2026-04-24 추가)

checkout 관련 토스트 알림은 반드시 `lib/checkouts/toast-templates.ts`의 `notifyCheckoutAction`을 경유해야 한다.
컴포넌트에서 직접 `toast({...})` 호출로 반출 액션 결과를 알리는 인라인 패턴은 SSOT 위반이다.

**탐지 — mutation onSuccess에서 직접 toast 호출:**
```bash
# CheckoutGroupCard, CheckoutDetailClient 등에서 approval/반출 onSuccess 직접 toast 호출 탐지
grep -n "onSuccess.*toast\|toast.*onSuccess" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  "apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx" 2>/dev/null

# approve/reject/start/return 액션 onSuccess에서 notifyCheckoutAction 미사용 탐지
grep -n "toast({" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  "apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx" 2>/dev/null \
  | grep -v "notifyCheckoutAction\|#"
```

**✅ 올바른 패턴:**
```typescript
// CheckoutGroupCard.tsx
onSuccess: (_data, variables) =>
  notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName ?? '' }, t),
```

**❌ 금지 — 인라인 토스트 직접 호출:**
```typescript
onSuccess: () => toast({ title: '승인 완료' }), // SSOT 우회
```

**PASS:** 반출 액션 onSuccess에서 `notifyCheckoutAction` 경유 확인.
**FAIL:** `toast({ title: '...' })` 직접 호출 → `notifyCheckoutAction(toast, action, ctx, t)` 패턴으로 전환.

**예외:**
- 에러 핸들링 시 `toast({ variant: 'destructive', ... })` 직접 호출 — 에러 toast는 현재 SSOT 미포함
- 비-반출 도메인 컴포넌트에서 toast 직접 호출 — 이 Step은 checkouts 도메인만 대상

**관련 파일:**
- `apps/frontend/lib/checkouts/toast-templates.ts` — SSOT 함수
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — approve onSuccess 소비처
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — detail 액션 소비처

### Step 27: UserSelectableCheckoutPurpose SSOT — CreateCheckoutDto.purpose (2026-04-26 추가)

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

### Step 28: useDateFormatter SSOT — date-fns 직접 사용 금지 (2026-04-27 추가)

날짜/시각 포맷은 `@/hooks/use-date-formatter`의 `useDateFormatter()` 훅을 경유해야 한다.
이 훅은 사용자 dateFormat 설정과 `date-fns` locale을 내부에서 처리하는 SSOT이다.

**규칙 근거:** 컴포넌트에서 `import { format } from 'date-fns'` + `import { ko } from 'date-fns/locale'`를
직접 사용하면 locale이 하드코딩되어 다국어 설정 변경 시 일관성이 깨진다.

```bash
# locale 직접 import 탐지 — 핵심 위반 (컴포넌트에서 date-fns locale 직접 사용)
grep -rn "from 'date-fns/locale'" \
  apps/frontend/app/ apps/frontend/components/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-date-formatter\|node_modules"
# 결과: 0건 → PASS  (신규 locale 직접 import 금지)

# format + { locale: ... } 조합 탐지 (locale 없는 format은 허용)
grep -rn "format(.*{.*locale:" \
  apps/frontend/app/ apps/frontend/components/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-date-formatter\|node_modules"
# 결과: 0건 → PASS  (locale 결합 format 신규 사용 금지)

# useDateFormatter 훅 자체 파일 존재 확인
ls apps/frontend/hooks/use-date-formatter.ts 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**PASS:** `date-fns/locale` 직접 import 0건 + `format(*, { locale: })` 조합 0건.
**FAIL:** `import { ko } from 'date-fns/locale'` 또는 `format(new Date(...), '...', { locale: ko })` 신규 추가
→ `useDateFormatter().fmtDate()` / `fmtDateTime()`으로 교체.

**예외 (PASS로 처리):**
- `apps/frontend/hooks/use-date-formatter.ts` 자체 — SSOT 구현 파일이므로 date-fns + locale 직접 import 허용.
- `differenceInDays`, `addDays`, `addMonths`, `isBefore`, `isAfter`, `startOfMonth`, `parseISO`, `formatISO`, `getYear`, `getMonth` 등 계산/변환 전용 함수 — locale 의존 없으므로 직접 import 허용.
- `components/ui/date-picker.tsx`, `components/ui/date-range-picker.tsx` — shadcn/ui Calendar 컴포넌트 내부 locale 요구사항. UI 라이브러리 래퍼로 예외.
- `components/calibration/CalibrationTimeline.tsx` — 기존 tech-debt LOW (2026-04-27 기준, 교체 대상이나 긴급 아님).
- `components/equipment-imports/EquipmentImportDetail.tsx` — 기존 tech-debt LOW (동일).
- `date-fns` 타입 전용 import — 런타임 locale 없는 타입 import는 허용.

### Step 29: prebuild guard 스크립트 존재 + package.json 연결 (2026-04-27 추가)

DASHBOARD_ROLE_CONFIG ↔ UserRoleValues 동기화(`check-role-config-sync.mjs`)와
`:root ↔ .dark` brand CSS 변수 대칭(`check-css-vars.mjs`)은 빌드 타임에 강제되어야 한다.
두 스크립트가 `package.json`의 `prebuild` 훅에 연결되지 않으면 새 role/색상 추가 시 드리프트가 무음 통과한다.

```bash
# 빌드 가드 스크립트 파일 존재 확인
ls scripts/check-role-config-sync.mjs scripts/check-css-vars.mjs 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# package.json prebuild에 두 스크립트 모두 연결되어 있는지 확인
grep '"prebuild"' package.json
# 결과: "prebuild": "node scripts/check-role-config-sync.mjs && node scripts/check-css-vars.mjs"

# 드라이런 — 두 스크립트 모두 exit 0 반환하는지 확인
node scripts/check-role-config-sync.mjs && node scripts/check-css-vars.mjs \
  && echo "✅ PASS" || echo "❌ FAIL"
```

**PASS:** 두 파일 존재 + `prebuild`에 연결 + 드라이런 exit 0.
**FAIL:** 스크립트 파일 없음 또는 `prebuild` 훅 미연결 또는 드라이런 exit 1(동기화 불일치 감지).

**근거:** DASHBOARD_ROLE_CONFIG는 `lib/config/dashboard-config.ts`에 정의되고, UserRoleValues는 `packages/schemas`에 정의된다. 두 파일은 다른 도메인에 위치하므로 자동 타입 체크만으로는 불일치 탐지 불가. 빌드 타임 가드가 유일한 확실한 방어선.

---

### Step 30: 상태 순서 매핑 객체 키 — enum Computed Property Name 경유 필수 (2026-04-27 추가)

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

**PASS:** 상태 매핑 객체의 모든 키가 `[EnumVal.CONSTANT]` 패턴. **FAIL:** 문자열 리터럴 키 → enum Computed Property Name으로 교체 + `Record<string, N>` → `Partial<Record<EnumType, N>>` 타입 강화.

**연관 패턴 — 단계 배열 key 필드:**
다단계 스텝 정의(`disposalSteps`, `planSteps`)의 `key` 필드도 동일하게 enum 경유 필수:
```typescript
// ❌ 리터럴
{ key: 'pending_review', ... }

// ✅ enum 경유
{ key: UASVal.PENDING_REVIEW, ... }
```

**근거:** `ApprovalStepIndicator.tsx` `STATUS_ORDER` + `disposalSteps/planSteps.key`에서 리터럴 → UASVal 교체 (2026-04-27, verify-ssot 지적).

### Step 31: `computeUrgency` SSOT — 인라인 시간 계산 금지 (2026-04-27 추가)

긴급도(urgency) 계산은 `@equipment-management/schemas`의 `computeUrgency` SSOT 함수를 경유해야 한다.
`48 * 60 * 60 * 1000` 같은 인라인 시간 상수 + 직접 비교는 임계값 변경 시 SSOT와 분리된다.

```typescript
// ❌ 인라인 계산 — SSOT 분리
const msUntilDue = new Date(dueAt).getTime() - Date.now();
const urgency = msUntilDue < 0 ? 'critical' : msUntilDue < 48 * 60 * 60 * 1000 ? 'warning' : 'normal';

// ✅ SSOT 경유
import { computeUrgency } from '@equipment-management/schemas';
import type { CheckoutStatus } from '@equipment-management/schemas';

// 승인 컨텍스트: status='pending'으로 고정 — UnifiedApprovalStatus에 'overdue' 없으므로
// overdue→critical 단락 비활성화 후 날짜 기반 로직만 사용
const urgency = computeUrgency({ status: 'pending' as CheckoutStatus, dueAt });
```

**탐지 — `computeUrgency` 미경유 인라인 긴급도 계산:**
```bash
# 48 * 60 * 60 * 1000 또는 86400000 (1일) 시간 상수 탐지
grep -n "48 \* 60\|86_400_000\|86400000" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null

# msUntilDue 등 인라인 긴급도 변수명 탐지
grep -n "msUntilDue\|msUntil\|urgencyMs" \
  apps/frontend/components/**/*.tsx apps/frontend/lib/**/*.ts 2>/dev/null

# computeUrgency를 경유하지 않고 urgency를 직접 계산하는 패턴
grep -n "urgency.*critical\|urgency.*warning\|urgency.*normal" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "computeUrgency\|t(\|className\|tokens\|design"
```

**PASS:** 긴급도 계산 전부 `computeUrgency` 경유. **FAIL:** 인라인 시간 상수 → `computeUrgency` 교체.

**Note — 승인 컨텍스트 `status: 'pending' as CheckoutStatus`:**
`UnifiedApprovalStatus`에는 `'overdue'` 값이 없어 `item.status as CheckoutStatus`는 타입 거짓말.
`computeUrgency` 내부의 `overdue→critical` 단락을 우회하고 날짜 기반 로직만 실행하기 위해
`'pending' as CheckoutStatus`로 고정하는 것이 의도적 패턴.

**관련 파일:**
- `packages/schemas/src/fsm/checkout-fsm.ts` — `computeUrgency` 정의
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx` — 도입 컴포넌트 (2026-04-27)

### Step 32: config 객체 파생 boolean 필드 → 수치 SSOT (2026-04-27 추가)

설정 객체(TabMeta 등)에서 `boolean` 필드가 다른 수치 필드에서 **파생 가능**하면, boolean을 제거하고 수치 필드를 SSOT로 유지해야 한다. boolean은 수치의 중복 표현이므로 값이 어긋날 위험이 있다.

**패턴:** `multiStep?: boolean` 같은 필드가 `totalApprovalSteps: number`에서 `> 1`로 도출 가능하면 → boolean 제거.

```typescript
// ❌ boolean + 수치 중복 — drift 위험
interface TabMeta {
  multiStep?: boolean;        // totalApprovalSteps > 1과 중복
  totalApprovalSteps: number;
}

// ✅ 수치 SSOT 단일화
interface TabMeta {
  totalApprovalSteps: number; // 1=단일, 2=disposal, 3=calibration_plan
}
// 소비처: const isMultiStep = meta.totalApprovalSteps > 1;
```

**탐지 — approvals-api.ts TabMeta:**
```bash
# multiStep boolean 재도입 탐지
grep -n "multiStep\s*[?:]\s*boolean" apps/frontend/lib/api/approvals-api.ts

# totalApprovalSteps가 있는데 별도 boolean 필드로 중복 파생하는 패턴
grep -n "totalSteps\s*[?:]\s*boolean\|stepCount\s*[?:]\s*boolean\|hasMultipleSteps\s*[?:]\s*boolean" \
  apps/frontend/lib/api/ --include="*.ts"
```

**PASS:** `multiStep?: boolean` 선언 0건 (전 approve 카테고리 파일). **FAIL:** boolean 재도입 → 제거 후 수치 비교 패턴으로 교체.

**관련 파일:**
- `apps/frontend/lib/api/approvals-api.ts` — `TabMeta.totalApprovalSteps` SSOT (2026-04-27)
- `apps/frontend/components/approvals/ApprovalRow.tsx` — `meta.totalApprovalSteps` 소비
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx` — `meta.totalApprovalSteps > 1`

### Step 33: TAB_META capability guard 완전성 — canReject !== false 4-path 패턴 (2026-04-27 추가)

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

## Output Format

```markdown
| #   | 검사                          | 상태      | 상세                                   |
| --- | ----------------------------- | --------- | -------------------------------------- |
| 1   | 로컬 타입 재정의              | PASS/FAIL | 재정의 위치 목록                       |
| 2   | Permission 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3   | API_ENDPOINTS 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3a  | Audit Log 타입 임포트         | PASS/FAIL | 잘못된 임포트 위치                     |
| 3b  | Field Labels 임포트           | PASS/FAIL | 잘못된 임포트 위치                     |
| 3c  | Entity Routes 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3d  | Data Scope 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3e  | Audit Log SSOT 상수           | PASS/FAIL | 잘못된 임포트 위치                     |
| 4   | Icon Library 통합             | PASS/FAIL | 비표준 library 위치                    |
| 5   | AppDatabase SSOT 타입         | PASS/FAIL | NodePgDatabase 직접 import 위치        |
| 6   | ApiResponse 로컬 재정의       | PASS/FAIL | 재정의 위치                            |
| 7   | APPROVAL_KPI 임계값           | PASS/FAIL | 잘못된 import 위치                     |
| 8   | 신규 shared-constants SSOT    | PASS/FAIL | 로컬 재정의 위치                       |
| 9   | DB Enum 배열 SSOT 참조        | PASS/FAIL | 하드코딩 enum 배열 위치                |
| 10  | REJECTION_STAGE_VALUES SSOT   | PASS/FAIL | 로컬 선언 위치                         |
| 11  | VM 임포트 소스                | PASS/FAIL | 잘못된 VM import 위치                  |
| 12  | Test User Constants SSOT      | PASS/FAIL | 로컬 재정의 위치                       |
| 13  | DocumentTypeValues SSOT       | PASS/FAIL | 문자열 하드코딩 위치                   |
| 14  | Scope enforcement SSOT        | PASS/FAIL | 로컬 enforceScope/EnforcedScope 재정의 또는 controller inline scope helper |
| 15  | data-migration SSOT           | PASS/FAIL | MigrationSessionStatus 로컬 재정의 또는 raw 리터럴 사용 위치 |
| 16  | 도메인 유틸 상수 SSOT         | PASS/FAIL | NON_EXPORTABLE_CHECKOUT_STATUSES 등 로컬 재정의 위치 |
| 17  | Content-Disposition 빌더 SSOT | PASS/FAIL | 컨트롤러 직접 헤더 조립 위치 |
| 19  | 프론트엔드 Status/Type 리터럴 | PASS/FAIL | ValidationStatus/ValidationType raw 리터럴 비교 위치 |
| 19c | 도메인 폼 아이템 loose index  | PASS/FAIL | `[key: string]: string` 인터페이스 위치 (AcquisitionOrProcessingItem/ControlItem 대체) |
| 20  | Permission 라벨 렌더링 SSOT   | PASS/FAIL | t.raw 레거시 패턴 또는 settings.json labels 섹션 재도입 위치 |
| 21  | ConditionCheckStep SSOT       | PASS/FAIL | 'lender_checkout'/'lender_return' 리터럴 직접 비교 위치 |
| 22  | ESLint 3-layer selector 완전성 | PASS/FAIL | BinaryExpression/Property/CallExpression selector 누락 또는 lint 에러 위치 |
| 23  | DocxTemplate 레거시 barrel 경로 | PASS/FAIL | `reports/docx-template.util` 경유 import 위치 (canonical: `common/docx/`) |
| 24  | UASVal SSOT — approvals-api.ts | PASS/FAIL | UnifiedApprovalStatus raw 리터럴 직접 할당 위치 |
| 25  | design-token 헬퍼 내 status literal 직접 비교 금지 | PASS/FAIL | `=== 'overdue'` 등 raw 리터럴 비교 위치 (`*StatusValues` 경유 필요) |
| 26  | notifyCheckoutAction SSOT 경유 — 반출 onSuccess 직접 toast 금지 | PASS/FAIL | checkout 액션 onSuccess에서 `toast({...})` 직접 호출 위치 |
| 27  | UserSelectableCheckoutPurpose SSOT — CreateCheckoutDto.purpose | PASS/FAIL | `purpose: string` 또는 `purpose: CheckoutPurpose` 잔존 위치 |
| 29  | prebuild guard 스크립트 존재 + package.json 연결 | PASS/FAIL | check-role-config-sync.mjs·check-css-vars.mjs 파일 누락 또는 prebuild 훅 미연결 |
| 30  | 상태 순서 매핑 키 enum Computed Property Name 경유 | PASS/FAIL | `STATUS_ORDER`/`PRIORITY_MAP` 등에서 문자열 리터럴 키 또는 `Record<string, N>` 타입 위치 |
| 33  | TAB_META capability guard 완전성 — canReject 4-path | PASS/FAIL | 미가드 onReject/onBulkReject 직접 전달 위치 |
| 34  | 로컬 인터페이스명 packages 동명 타입 충돌 금지 (2026-04-27) | PASS/FAIL | `packages/schemas` export 타입과 서비스 로컬 interface 동명 충돌 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS`, `CLASSIFICATION_OPTIONS` 등 레이블+값 쌍 UI 표시용 객체는 로컬 정의 허용
2. **packages/ 디렉토리 내 정의** — 패키지 자체에서의 타입 정의는 SSOT 원본
3. **테스트 파일의 mock 타입** — 테스트에서 사용하는 mock 타입 정의는 허용
4. **re-export 파일** — `export type { UserRole } from '@equipment-management/schemas'` 같은 재내보내기는 정상
5. **NestJS Swagger DTO** — 백엔드 응답 DTO에서 Swagger 문서화용 class 정의는 허용
6. **백엔드 DTO의 re-export** — SSOT 소비자이므로 정상
7. **roles.enum.ts의 TypeScript enum** — 백엔드 호환성을 위한 로컬 enum (SSOT 주석 + re-export 동반 시 면제)
8. **`Promise<unknown>` 허용 케이스** — `private` 헬퍼 메서드나 단순 delete/count 반환은 면제
9. **audit-logs route 의 인라인 `resolveDataScope` 호출** — `AUDIT_LOG_SCOPE` + 'none → 빈 보고서' fallback 정책으로 인터셉터 통합 불가, 의도적 예외 (`reports.controller.exportAuditLogs`)
10. **`CheckoutPermissionKey` 로컬 string union** — `packages/schemas/src/fsm/checkout-fsm.ts`의 `CheckoutPermissionKey` 타입은 `Permission` enum을 직접 import하면 순환 의존성(`schemas ← shared-constants ← schemas`)이 발생하므로, Permission 값을 로컬에서 string union으로 미러링하는 것이 설계 의도. `/verify-checkout-fsm`의 Step 4에서 `shared-constants`와의 동기화 여부를 별도 검증함.

### Step 34: 로컬 인터페이스명 packages 동명 타입 충돌 금지 (2026-04-27 추가)

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
- `packages/schemas/src/checkout.ts` — `CheckoutEquipment` 행 타입 SSOT

### Step 35: 대시보드 임계값 SSOT — `dashboard-thresholds.ts` 우회 금지 (2026-04-28 추가)

**규칙**: 대시보드 임계값(D-day 단계, 가동률, 분포 막대, 시스템 상태, 처리율, 시간 윈도우, 카드 표시 행수)은 반드시 `@equipment-management/shared-constants/dashboard-thresholds`에서 import. 컴포넌트/서비스에 인라인 매직 넘버 금지.

**커버리지 (9개 SSOT 상수)**:
- `DDAY_THRESHOLDS` (urgent=7, soon=30)
- `UTILIZATION_GAUGE_THRESHOLDS` (ok=60, warn=40)
- `DISTRIBUTION_BAR_THRESHOLDS` (danger=50, warn=60)
- `SYSTEM_HEALTH_THRESHOLDS` (DB ms / storage / queue 임계값)
- `SYSTEM_HEALTH_GAUGE_CAPS` (게이지 정규화 capacity)
- `SYSTEM_HEALTH_OVERALL_THRESHOLDS` (overallStatus 판정)
- `REVIEW_PROCESSING_RATE_THRESHOLDS` (green=90, amber=60)
- `DASHBOARD_TIME_WINDOWS` (recentActivityDays=7, upcomingCalibrationDays=30)
- `DASHBOARD_CARD_DISPLAY_LIMITS` (calibrationDday=8, approvalHeavyMinCount=5)
- `TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS` (=6)

**검증 명령**:
```bash
# 1. 대시보드 영역에서 임계값 매직 넘버 직접 사용
grep -rn '\b(60|40|50|65|80|90|100|300|500|1500)\b' \
  apps/frontend/components/dashboard/ \
  apps/frontend/lib/design-tokens/components/dday-tone.ts \
  apps/backend/src/modules/dashboard/dashboard.service.ts 2>/dev/null \
  | grep -v '//\|shared-constants\|UTILIZATION_THRESHOLDS\|DASHBOARD_TIME_WINDOWS'

# 2. setDate 인라인 day window
grep -n 'setDate.*[+-] *\(7\|30\)\b' apps/backend/src/modules/dashboard/dashboard.service.ts \
  | grep -v 'DASHBOARD_TIME_WINDOWS\|CALIBRATION_THRESHOLDS'

# 3. 표시 행수 매직 넘버
grep -rn '\(length\|count\) *[<>]=\?\s*\(5\|6\|8\)\b' \
  apps/frontend/components/dashboard/ \
  | grep -v 'DISPLAY_LIMITS\|DASHBOARD_CARD_DISPLAY_LIMITS\|TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS'
```

**PASS:** 모든 grep 결과 0줄 (주석/SSOT import 제외).
**FAIL:** 매직 넘버 발견 → SSOT 상수 import로 교체.

**예외**:
- `dashboard-thresholds.ts` 내부 임계값 정의 (SSOT 자체)
- `dday-tone.ts` 내부 헬퍼 (SSOT import 후 비교)
- `business-rules.ts`의 `CALIBRATION_THRESHOLDS.WARNING_DAYS` (별도 SSOT)
- 페이지네이션 limit (`DASHBOARD_ITEM_LIMIT`은 별도 SSOT)

**발생 이력 (2026-04-28)**: 대시보드 영역에 50/60/65/80/90/100/300/500/1500 등 임계값이 frontend dday-tone + backend dashboard.service 2곳에 중복 인라인. `getMyQuickSummary` 30 day window + `getRecentActivities` 7 day window도 매직 넘버. SSOT 모듈 신설 + 일괄 교체.

### Step 36: 반출 도메인 D-day 임계값 SSOT — `checkout-thresholds.ts` 우회 금지 (2026-04-28 추가, REVIEW_RESULT.md §4.3)

**규칙**: 반출 도메인의 D-day 4-tier 임계값(overdue/warning/ok/neutral)은 반드시 `@equipment-management/shared-constants/checkout-thresholds`에서 import. 대시보드 임계값(`dashboard-thresholds.ts`)과 의도적으로 분리되어 있으므로 **두 도메인 임계값을 교차 사용 금지**.

**도메인 분리 근거 (검증 시 참고)**:
| 도메인 | 모듈 | 의미 | 부호 규약 |
|---|---|---|---|
| 대시보드 | `dashboard-thresholds.ts` | 30일 horizon 가동률/배치 모니터링 | `days` 양수=초과, 음수=남음 |
| 반출 | `checkout-thresholds.ts` | 단기 워크플로 SLA — 즉시 조치 | `daysRemaining` 양수=미래, 음수=overdue |

**커버리지 (3개 SSOT export)**:
- `CHECKOUT_DDAY_THRESHOLDS` (overdue=0, warning=2, ok=14)
- `getCheckoutDdayTier(daysRemaining): CheckoutDdayTier` — `'danger' | 'warning' | 'ok' | 'neutral'`
- `CheckoutDdayTier` 타입

**검증 명령**:
```bash
# 1. 반출 컴포넌트/hook이 임계값 매직 넘버 직접 사용
grep -rn '\b\(daysRemaining\|days\)\s*[<>]=\?\s*\(0\|2\|14\)\b' \
  apps/frontend/components/checkouts/ \
  apps/frontend/hooks/use-checkout-*.ts \
  apps/frontend/lib/design-tokens/components/dday-colors.ts 2>/dev/null \
  | grep -v 'CHECKOUT_DDAY_THRESHOLDS\|getCheckoutDdayTier\|//'

# 2. dday-colors.ts 신규 4-tier 함수가 shared-constants 위임 패턴
grep -n "getCheckoutDdayTier\|CHECKOUT_DDAY_THRESHOLDS" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: import + getCheckoutDday4Tier 내부 위임

# 3. 반출 컴포넌트가 대시보드 임계값(DDAY_THRESHOLDS) 잘못 사용 검출
grep -rn "DDAY_THRESHOLDS\b" apps/frontend/components/checkouts/ apps/frontend/hooks/use-checkout-*.ts
# 기대: 0건 (반출 도메인은 CHECKOUT_DDAY_THRESHOLDS 사용 — 대시보드 모듈 우회 금지)

# 4. 백엔드 checkouts.service.ts 가 반출 임계값 사용 시 SSOT 경유
grep -n "CHECKOUT_DDAY_THRESHOLDS\|getCheckoutDdayTier" \
  apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 향후 priority 정렬/overdue 필터 인입 시 1건 이상 (현재는 frontend-only OK)

# 5. 6-tier legacy 회귀 방지 (dday-colors.ts에서 제거됨)
grep -n "DDAY_TIERS\b\|DDAY_TIER_CLASSES\b\|farFuture\|upcoming\|overdueShort\|overdueLong" \
  apps/frontend/lib/design-tokens/components/dday-colors.ts
# 기대: 0건 (정리 완료, 회귀 시 FAIL)
```

**PASS:**
1. 반출 컴포넌트/hook의 D-day 비교는 모두 `getCheckoutDdayTier()` 또는 그 결과(`tier === 'danger'`)로 평가
2. `dday-colors.ts`의 4-tier 함수는 shared-constants `getCheckoutDdayTier` 위임
3. 반출 컴포넌트가 대시보드 `DDAY_THRESHOLDS.urgent/soon` 사용하지 않음 (의미 다른 도메인)
4. 백엔드 인입 시 frontend와 동일 모듈 import (frontend/backend 일관성)
5. 6-tier legacy 임계값(7/4/1/0/-3) 잔존 0건

**FAIL:**
- 반출 컴포넌트/hook에 `daysRemaining < 0`, `daysRemaining <= 2`, `daysRemaining <= 14` 인라인
- 반출 컴포넌트가 `DDAY_THRESHOLDS` (대시보드 모듈) import — 도메인 의미 충돌
- 6-tier legacy 함수/상수 회귀 (DDAY_TIERS, DDAY_TIER_CLASSES, farFuture/upcoming/overdueShort/overdueLong)

**예외**:
- `checkout-thresholds.ts` 내부 임계값 정의 (SSOT 자체)
- `dday-colors.ts`의 `getCheckoutDday4Tier` (shared-constants 위임)
- `DdayBadge.tsx` 내부의 tier 비교(`tier === 'danger'` 등) — tier가 SSOT 결과이므로 OK

**관련 파일**:
- `packages/shared-constants/src/checkout-thresholds.ts` — SSOT 정의
- `packages/shared-constants/src/index.ts` — re-export
- `apps/frontend/lib/design-tokens/components/dday-colors.ts` — 4-tier 위임 (6-tier 정리됨)
- `apps/frontend/components/checkouts/DdayBadge.tsx` — 호출처
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 호출처

**발생 이력 (2026-04-28)**: REVIEW_RESULT.md §4.3 명세에 따라 반출 도메인 D-day pill 색상(`dday-ok / dday-warn / dday-danger`)을 4-tier로 표준화. 기존 6-tier는 의미 단계가 너무 많아 와이어프레임 시각 어휘와 불일치 → 4-tier 단일화 + 대시보드와 분리된 도메인 임계값 SSOT 신설. frontend/backend 양쪽 동일 모듈 사용으로 시각·로직 일관성 보장.

---

### Step 37: `useEffectiveRole` SSOT — 클라이언트 컴포넌트의 `session.user.role` 직접 참조 금지 (2026-04-28 추가)

**규칙**: 대시보드 + 모든 클라이언트 컴포넌트/hook에서 역할 기반 UI 분기 시 반드시 `useEffectiveRole().effectiveRole`을 경유. `useSession().data.user.role` 또는 `session.user.role` 직접 참조는 시뮬레이션 모드(`?simulateRole=`)를 우회하여 SYSTEM_ADMIN의 역할 미리보기 기능을 무력화시킨다.

**근거**: `useEffectiveRole`은 SYSTEM_ADMIN이 `?simulateRole=...` 쿼리 파라미터로 다른 역할 UI를 미리볼 수 있게 한다. 백엔드 권한은 항상 JWT의 `actualRole` 기준이지만 UI는 `effectiveRole`로 분기. 컴포넌트가 raw `session.user.role`을 읽으면 시뮬 의도가 깨진다.

**검증 명령**:
```bash
# 클라이언트 컴포넌트/hook에서 session.user.role 직접 참조 탐지 (Server Component는 예외)
grep -rEn "session\??\.user\??\.role" \
  apps/frontend/components apps/frontend/hooks \
  --include='*.ts' --include='*.tsx' \
  | grep -v "use-effective-role" \
  | grep -v "// allow:" \
  | grep -v "node_modules"
# 기대: 0건 (모든 사용처는 useEffectiveRole 경유 또는 명시적 // allow: 주석)
```

**PASS**:
1. `useEffectiveRole` 외 컴포넌트/hook이 `session.user.role`을 읽지 않음
2. SYSTEM_ADMIN의 `?simulateRole=test_engineer` 쿼리가 dashboard layout/cards 모두에 일관 적용됨
3. 백엔드 API 호출은 항상 JWT actualRole 기준 (RoleGate JSDoc 명시)

**FAIL**:
- 컴포넌트에서 `useSession()`으로 `session.user.role` 추출 후 분기 — 시뮬 우회
- 새 hook이 raw role을 받아 분기하면서 useEffectiveRole 호출 누락

**예외**:
- `apps/frontend/app/**/page.tsx` (Server Component) — NextAuth session 사용, 시뮬 미적용 의도
- `hooks/use-effective-role.ts` 자체 — SSOT 정의

**관련 파일**:
- `apps/frontend/hooks/use-effective-role.ts` — SSOT
- `apps/frontend/components/auth/RoleGate.tsx` — UI 게이트 (UI-only 명시)
- `apps/frontend/components/dashboard/DashboardClient.tsx` — 다중 useQuery enabled 분기

**발생 이력 (2026-04-28)**: dashboard redesign에서 SYSTEM_ADMIN simulateRole 기능 도입. 컴포넌트가 raw role 사용 시 시뮬 깨짐 → SSOT 경유 강제 룰 추가.
