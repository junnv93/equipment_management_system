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

**PASS:** 3-layer selector 모두 존재 + ImportExpression selector 검증 통과 + lint 에러 0건. **FAIL:** selector 누락 또는 lint 에러 발생.

> **연계:** verify-hardcoding Step 23(export allowlist 상태 리터럴)과 상호 보완 — ESLint가 BinaryExpression/Property/CallExpression을 정적으로 차단하고, Step 23은 배열 요소로 사용된 리터럴을 grep으로 탐지.

### Step 24: UnifiedApprovalStatus (UASVal) SSOT — approvals mappers (2026-04-22 추가, 2026-04-30 파일 경로 업데이트)

`mapCheckoutToApprovalItem` / `mapNonConformanceToApprovalItem` /
`mapInspectionToApprovalItem` 등 매핑 함수에서 `UnifiedApprovalStatus` 값을 raw 문자열 리터럴로
할당하는 패턴 탐지. `UnifiedApprovalStatusValues` (= `UASVal`)에서 상수를 경유해야 함.

> **2026-04-30 파일 구조 변경:** `approvals-api.ts`가 barrel로 전환되고 매핑 함수는 `approvals/mappers.ts`로 이동. 검증 대상 파일 경로가 변경됨.

**24a: approvals 매핑 파일 내 UnifiedApprovalStatus raw 리터럴 탐지**
```bash
# barrel + 실제 구현 파일 양쪽 검사 (2026-04-30 분할 이후)
grep -rn "status: 'pending'\|status: 'pending_review'\|status: 'approved'\|status: 'rejected'\|status: 'in_progress'" \
  apps/frontend/lib/api/approvals/ \
  apps/frontend/lib/api/approvals-api.ts \
  | grep -v "//\|import\|type\|interface"
# 결과: 0건 (UASVal.PENDING 등 SSOT 상수 경유)
```

**24b: UASVal import 확인 — mappers.ts**
```bash
grep -n "UnifiedApprovalStatusValues\|UASVal" apps/frontend/lib/api/approvals/mappers.ts | head -5
# 결과: import 라인 + 사용 라인 2건 이상 (mappers.ts가 실제 UASVal 소비처)
```

**PASS:** 24a 0건 + 24b mappers.ts에서 UASVal import 확인. **FAIL:** raw 리터럴 직접 할당 발견 시 `UASVal.PENDING_REVIEW` 등 상수로 교체.

> **배경:** 2026-04-22 verify-implementation에서 `status: 'pending_review'`(L1142), `status: 'pending'`(L1165, L1192) 3건 발견. 현재 값이 SSOT 값과 우연히 일치하여 런타임 버그는 없으나, 향후 SSOT 값 변경 시 무결성 보장 불가. 2026-04-30에 `approvals/mappers.ts`로 이관 후 UASVal 경유 패턴 확립.

**관련 파일:**
- `apps/frontend/lib/api/approvals/mappers.ts` — 매핑 함수 SSOT (2026-04-30 이후)
- `apps/frontend/lib/api/approvals-api.ts` — barrel re-export (2026-04-30 이후)

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

**탐지 — approvals-api.ts TabMeta (barrel + 실제 구현 파일 양쪽 검사):**
```bash
# multiStep boolean 재도입 탐지 — barrel + 구현 파일(approvals/types.ts) 양쪽
# (2026-04-30: approvals-api.ts가 barrel로 전환됨. 실제 정의는 approvals/types.ts)
grep -rn "multiStep\s*[?:]\s*boolean" apps/frontend/lib/api/ --include="*.ts"

# totalApprovalSteps가 있는데 별도 boolean 필드로 중복 파생하는 패턴
grep -rn "totalSteps\s*[?:]\s*boolean\|stepCount\s*[?:]\s*boolean\|hasMultipleSteps\s*[?:]\s*boolean" \
  apps/frontend/lib/api/ --include="*.ts"
```

**PASS:** `multiStep?: boolean` 선언 0건 (approvals-api.ts + approvals/types.ts 포함 전 approve 카테고리 파일). **FAIL:** boolean 재도입 → 제거 후 수치 비교 패턴으로 교체.

**관련 파일:**
- `apps/frontend/lib/api/approvals-api.ts` — barrel re-export (2026-04-30 분할 이후)
- `apps/frontend/lib/api/approvals/types.ts` — `TabMeta.totalApprovalSteps` SSOT 실제 정의 (2026-04-30)
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
| 49  | UI 도메인 타입 파일 SSOT + 위임 re-export 패턴 (2026-04-30) | PASS/FAIL | 컴포넌트 내 `export interface` 직접 정의 위치 또는 `lib/types/` SSOT 파일 누락 |
| 50  | `components/shared/` eslint-disable `self-audit-exception` 마커 강제 (2026-04-30) | PASS/FAIL | 마커 없는 `eslint-disable-next-line no-restricted-syntax` 위치 |
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

### Step 38: BackendService ConfigService SSOT — `process.env` 직접 접근 금지 (2026-04-28 추가)

**규칙**: NestJS 서비스 클래스 내부에서 환경변수를 읽을 때 `process.env.*` 직접 접근 금지.
반드시 `ConfigService`를 생성자 주입 + `configService.get<T>('KEY')` 경유.
이를 통해 (1) `apps/backend/src/config/env.validation.ts`의 Zod schema 타입 보장 (2) 단위 테스트 시 ConfigService mock 주입 가능 (3) 런타임 undefined 발생 전 Zod 유효성 검증.

**탐지 — 서비스 클래스 내 process.env 직접 접근:**
```bash
# 서비스 파일에서 process.env 직접 접근 (configService 미경유)
grep -rn "process\.env\." \
  apps/backend/src/modules --include="*.service.ts" \
  | grep -v "//\|spec\.\|test\."
# 기대: 0건 (ConfigService 경유 또는 env.validation.ts Zod 보장)
```

**PASS:** 모든 서비스 파일에서 `process.env.*` 직접 접근 0건.
**FAIL:** `process.env.MY_VAR` 직접 사용 발견 → ConfigService 주입 + `env.validation.ts` Zod schema 추가 후 `configService.get<T>('MY_VAR')` 전환.

**올바른 패턴:**
```typescript
// ✅ ConfigService 주입 + env.validation.ts Zod schema 등록
// apps/backend/src/config/env.validation.ts
const envSchema = z.object({
  DASHBOARD_STORAGE_CAPACITY_BYTES: z.coerce.number().positive().optional()
    .default(100 * 1024 * 1024 * 1024),
});

// service.ts
constructor(
  private readonly db: AppDatabase,
  private readonly configService: ConfigService,
) {}

const capacityBytes =
  this.configService.get<number>('DASHBOARD_STORAGE_CAPACITY_BYTES') ??
  100 * 1024 * 1024 * 1024;

// ❌ 직접 접근 — Zod 우회 + 테스트 불가
const capacityBytes = Number(process.env.DASHBOARD_STORAGE_CAPACITY_BYTES) || 100 * 1024 * 1024 * 1024;
```

**예외:**
- `apps/backend/src/config/env.validation.ts` 자체 — Zod schema 정의 파일
- `apps/backend/src/main.ts` / `app.module.ts` — 앱 부트스트랩, ConfigModule 설정 전
- E2E/spec 테스트 파일 — 환경변수 오버라이드가 테스트 목적
- `process.env.NODE_ENV` — NestJS 내부 표준 관례 (`'test'`/`'production'` 분기); env.validation.ts 등록 불필요
- `monitoring.service.ts` 내 `process.env.NODE_ENV` — 시스템 모니터링 정보 수집용, ConfigModule 이전 시점 가능
- `auth.service.ts` 내 `process.env.DEV_*_PASSWORD` — 개발/테스트 전용 패스워드 환경변수; 기존 tech-debt LOW 등재

**관련 파일:**
- `apps/backend/src/config/env.validation.ts` — Zod 환경변수 schema SSOT
- `apps/backend/src/modules/dashboard/dashboard.service.ts` — ConfigService 도입 모범 사례 (2026-04-28)

**발생 이력 (2026-04-28)**: `dashboard.service.ts:getSystemHealth()`에서 `Number(process.env.DASHBOARD_STORAGE_CAPACITY_BYTES)` 직접 접근 → ConfigService 주입 + `env.validation.ts` Zod schema(`z.coerce.number().positive().optional().default(100GiB)`) 등록으로 교체.

---

### Step 39: shared-constants const array → `z.enum()` SSOT 패턴 (2026-04-28 추가)

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

**발생 이력 (2026-04-28)**: `dashboard.controller.ts`의 `getCheckoutsByScope`가 `scope: z.enum(['me','team','lab','all'])` 인라인 정의 → `DASHBOARD_SCOPES as const` 배열을 shared-constants로 이관 + FE `DashboardScope` 타입도 동일 패키지에서 import로 전환. BE+FE 인라인 union 0건 확인.

---

### Step 40: domain enum 분류 매핑은 `as const satisfies Record<EnumType, X>` 강제 — `Set<EnumType>` 약타입 금지 (2026-04-28 추가, REVIEW_RESULT.md §4.1 후속)

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

### Step 41: Hero KPI 선택 로직 SSOT — `selectHeroVariant` 우회 inline 분기 금지 (2026-04-28 추가, REVIEW_RESULT.md §P1-1)

반출 KPI hero 카드 선택은 `apps/frontend/lib/utils/checkout-hero-selector.ts`의 `selectHeroVariant` 헬퍼 단일 경로만 허용. 호스트(`OutboundCheckoutsTab` 등)에서 `summary.overdue > 0 ? 'overdue' : null` 같은 inline 분기 패턴은 SSOT 우회로 금지.

**왜 inline 분기가 위험한가**:
- hero 우선순위 정책(P1-1: overdue 단일 → Phase 5: pending 추가 가능 → 향후: role-based)이 호출처마다 흩어지면, 정책 변경 시 모든 호출처를 추적·수정해야 한다 — 누락 시 페이지마다 다른 hero 동작.
- 단위 테스트가 inline 분기에 직접 닿을 수 없어 회귀 차단 가드 부재 (호스트 컴포넌트 통째 렌더 테스트는 비싸고 느림).
- `selectHeroVariant`는 `HERO_PRIORITY` 배열 priority 모델로 향후 확장(pending hero 승격, role-based threshold 등)을 분리된 데이터로 표현하여 컴파일러가 우선순위 변경 영향을 즉시 검출.

```bash
# inline hero 분기 패턴 탐지 (FAIL 패턴)
grep -rnE 'summary\.(overdue|pending)\s*>\s*\d+\s*\?\s*[\x27"]?(overdue|pending)' \
  apps/frontend/app apps/frontend/components apps/frontend/hooks \
  | grep -v 'lib/utils/checkout-hero-selector'
# 기대: 0 hits (호출처는 모두 selectHeroVariant 경유)

# selectHeroVariant 호출처 확인
grep -rn "selectHeroVariant" apps/frontend/app apps/frontend/components
# 기대: ≥ 1 hit (host에서 useMemo 감싸 호출)

# 테스트 커버리지 확인
ls apps/frontend/lib/utils/__tests__/checkout-hero-selector.test.ts
# 기대: 파일 존재 + 6+ 케이스 (overdue × pending 매트릭스 + Phase 5 negative test 포함)
```

**PASS:**
- 호스트 inline `summary.overdue > 0 ? ...` 패턴 0건
- `selectHeroVariant({ overdue, pending })` 호출이 단일 SSOT 경로
- 단위 테스트가 우선순위 정책의 회귀 가드로 작동 (Phase 4 boundary: pending hero 미승격 — Phase 5 정책 변경 시 negative test가 fail)

**FAIL:**
- `summary.overdue > 0 ? 'overdue' : null` 또는 `summary.pending > THRESHOLD ? 'pending' : ...` inline 분기 잔존 → 정책 변경 시 모든 호출처 추적 필요, 단위 테스트 부재

**예외:**
- `selectHeroVariant` 정의 파일(`apps/frontend/lib/utils/checkout-hero-selector.ts`) 자체는 grep 매치 허용 — `HERO_PRIORITY` 배열의 condition 함수가 본 패턴.
- 단위 테스트 파일(`__tests__/checkout-hero-selector.test.ts`)도 매치 허용 (assertion).

**관련 파일:**
- `apps/frontend/lib/utils/checkout-hero-selector.ts` — `selectHeroVariant` SSOT
- `apps/frontend/lib/utils/__tests__/checkout-hero-selector.test.ts` — 6+ 케이스 회귀 가드
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — host (useMemo + selectHeroVariant)

**발생 이력 (2026-04-28)**: Phase 4 P1-1 진입 시 OutboundCheckoutsTab line 226에 `heroVariantKey = summary.overdue > 0 ? 'overdue' : null` inline 분기 — Phase 4.A/4.B SSOT 헬퍼 분리로 해소. Phase 5 (P1-2 알림 단일 노출)에서 pending hero 승격 도입 시 `HERO_PRIORITY` 배열에 rule 추가 + negative test 5번 갱신.

---

### Step 42: 테스트 파일 hardcoded threshold vs SSOT 토큰 import 강제 (2026-04-30 추가, utilization-state drift 실측)

**규칙**: 테스트 파일이 SSOT 토큰(`packages/shared-constants/*` 또는 `apps/{frontend,backend}/lib/config/*`)으로 정의된 임계값/경계의 boundary 케이스를 검증할 때, **반드시 SSOT 토큰을 import**해서 동적 boundary를 계산해야 한다. `toBe(70)` / `toEqual(40)` 같은 매직 넘버 hardcoding 금지.

**왜 hardcoded threshold가 위험한가**:
- SSOT 변경 시 코드는 즉시 추종하지만 테스트는 매직 넘버에 묶여 있어 boundary case가 fail — SSOT 변경의 자동 추종이 끊긴다.
- 회귀 자동 차단의 신호가 *변경 의도된 SSOT drift*에서 발생하므로 false positive 노이즈 → 진짜 회귀 신호가 묻힘.
- 같은 boundary 의미가 SSOT(코드)·hardcoded 매직넘버(테스트)·describe 라벨 등 3곳에 중복 → SSOT 분산.

**검증 명령**:
```bash
# 1. SSOT 도메인의 임계값을 hardcoded로 사용하는 테스트 (FAIL 패턴)
#    - 대시보드 임계값(40, 50, 60, 65, 80, 90, 100, 300, 500)
#    - 반출 D-day 임계값(0, 2, 14)
#    - 가동률 hysteresis(2)
grep -rnE 'toBe\((40|50|60|65|80|90|100|300|500|1500)\)|toEqual\((40|50|60|65|80|90|100|300|500|1500)\)' \
  apps/frontend/**/__tests__ apps/backend/**/__tests__ 2>/dev/null \
  | grep -v 'shared-constants\|UTILIZATION_THRESHOLDS\|DDAY_THRESHOLDS\|DASHBOARD_TIME_WINDOWS'

# 2. 같은 테스트 파일이 SSOT 모듈을 import하는지 cross-check
#    매직 넘버를 사용하면서 SSOT 모듈을 import 안 하는 파일 = FAIL
grep -rL 'shared-constants\|@/lib/config/dashboard-config\|@/lib/config/checkout-thresholds' \
  $(grep -rlE 'toBe\((40|50|60|65|70|80|90|100)\)' \
    apps/frontend/**/__tests__ apps/backend/**/__tests__ 2>/dev/null)
# 기대: 0 hits (모든 테스트가 SSOT 토큰 import)

# 3. 모범 사례 패턴 — describe 라벨도 동적 보간
grep -rnE 'describe\(`.*\$\{(HIGH|MEDIUM|LOW|HIGH_EXIT|MEDIUM_EXIT|HIGH_ENTRY)' \
  apps/frontend/**/__tests__/utilization-state.test.ts apps/frontend/**/__tests__/dday-tone.test.ts
# 기대: ≥ 1 hit (라벨도 SSOT 추종)
```

**PASS:**
- 모든 boundary 테스트가 SSOT 토큰 import 후 `HIGH`, `MEDIUM`, `HIGH_EXIT = HIGH - HYSTERESIS` 같은 파생 상수로 boundary 계산
- SSOT 변경 시 테스트 코드 수정 없이 자동 추종 — boundary case가 *변경된 임계값*으로 다시 계산됨
- describe/it 라벨도 매직 넘버 대신 동적 보간 (예: `` `HIGH_ENTRY(${HIGH_ENTRY}) 이상 → good` ``)

**FAIL:**
- `expect(state).toBe('warning')` 다음 줄에 `expect(computeUtilizationState(70)).toBe(...)` 패턴 — 70은 매직 넘버
- 테스트 파일이 SSOT 모듈을 import하지 않음

**예외:**
- enum 멤버 수 검증 (`expect(Object.keys(EquipmentStatus).length).toBe(8)`) — 임계값이 아니라 *enum 정의 자체* 검증
- fixture 데이터 길이 (`expect(equipments).toHaveLength(3)`) — 임계값과 무관한 setup data
- HTTP status code (200/400/403/404/409) — 표준 코드, SSOT 의미 없음
- 0/1 같은 trivial 경계값 (toBeGreaterThan(0), toHaveLength(1)) — 의미적 임계값 아님
- 시간 단위 변환 (`60 * 1000` for ms) — 도메인 임계값이 아닌 단위 환산

**관련 파일 (모범 사례):**
- `apps/frontend/lib/utils/__tests__/utilization-state.test.ts` — `UTILIZATION_THRESHOLDS` import + `HIGH/MEDIUM/HYSTERESIS` 구조분해 + `HIGH_EXIT = HIGH - HYSTERESIS` 파생 + describe 라벨 동적 보간
- `apps/frontend/lib/design-tokens/components/__tests__/dday-tone.test.ts` — `DDAY_THRESHOLDS` import 후 `urgent`, `soon` 동적 boundary

**발생 이력 (2026-04-28 → 2026-04-30 신설)**: 2026-04-28 dashboard-redesign 세션에서 `UTILIZATION_THRESHOLDS.HIGH`를 70→60으로 변경(`6ddff791b`). 코드 사용처는 즉시 추종됐으나 `utilization-state.test.ts`는 hardcoded `expect(...).toBe('good')` 70 boundary 유지 → 1차 push 시 frontend test 6 fail. fix 패턴(이후 모범 사례): SSOT 토큰 import + 구조분해 + 파생 상수 + describe 라벨 보간.

---

### Step 43: `@deprecated` export alias 외부 소비처 0건 정리 (2026-04-30 추가, DashboardCheckoutScope 사례)

**규칙**: `@deprecated` 주석이 달린 `export type` / `export const` alias는 **외부 소비처 grep 0건이면 즉시 제거**. 누적된 deprecated alias는 SSOT 분산 + import 혼동을 유발하므로 정기 cleanup이 필요. 검증은 정적 grep만으로 부족 — barrel `index.ts` re-export 체인 + dynamic import 패턴까지 포함해서 추적해야 한다.

**왜 deprecated alias 누적이 위험한가**:
- 한 도메인 타입에 정식 SSOT(`OverdueCheckoutDto`)와 deprecated alias(`OldOverdueCheckoutDto`)가 공존하면, 새 코드가 alias를 import해도 컴파일러는 경고만 남기고 통과 → SSOT 분산.
- `@deprecated` 주석은 *권고*일 뿐 강제력 없음 → 점진적으로 alias가 늘어나 어떤 게 정식인지 신규 작업자가 식별하기 어려워짐.
- alias가 정의된 모듈은 SSOT를 re-export 형태로 묶고 있어 tree-shaking 무효화 가능성.

**검증 명령**:
```bash
# 1. @deprecated + export 패턴 전수 grep
grep -rB1 -A2 '@deprecated' \
  apps/frontend/lib/api apps/backend/src/modules packages/ \
  --include="*.ts" --include="*.tsx" \
  | grep -E 'export (type|const|interface|class) [A-Z]'

# 2. 각 alias 이름으로 외부 소비처 grep (barrel re-export 포함)
ALIAS_NAME="DashboardCheckoutScope"  # 후보 alias
grep -rn "${ALIAS_NAME}" apps/ packages/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "$(grep -rl "@deprecated.*\n.*${ALIAS_NAME}" apps/ packages/)"
# 기대: 0 hits → 제거 권고

# 3. barrel index.ts 경유 re-export 확인 (놓치기 쉬운 패턴)
grep -rn "export.*${ALIAS_NAME}\|export \*.*from" \
  apps/frontend/lib/api apps/backend/src/modules packages/*/src \
  --include="index.ts" --include="*.ts"
```

**PASS:**
- `@deprecated` alias 외부 소비처 grep ≥ 1 → 제거 보류 (마이그레이션 grace period 명시)
- 외부 소비처 grep = 0 → 제거 완료, 정식 SSOT만 export
- 제거 시 git commit message에 alias 이름 + 외부 소비처 0건 grep 결과 포함

**FAIL:**
- `@deprecated` alias 외부 소비처 grep = 0인데 잔존 → cleanup 권고
- alias 정의 파일이 정식 SSOT까지 re-export하는데 정식 SSOT만 사용하면 정리 가능

**예외:**
- **명시적 grace period**: 외부 사용처 0건이라도 CHANGELOG / `.claude/exec-plans/` 문서에 "v0.X까지 alias 유지" 명시된 경우 → 그 시점까지 보류
- **외부 패키지 호환성**: alias가 lib package(예: `packages/db`, `packages/schemas`)에서 export되고 외부 consumer가 있을 가능성 → 메이저 버전 bump 시점에 제거
- **dist 빌드 산출물**: `packages/*/dist/**` 의 `@deprecated`는 source가 아니므로 source 변경 후 재빌드로 자동 정리 — grep skip

**관련 파일 (제거 모범 사례):**
- `apps/frontend/lib/api/dashboard-api.ts` — `DashboardCheckoutScope` deprecated alias (2026-04-28 제거). 외부 소비처 0건 grep 후 즉시 정리. 정식 `DashboardScope` (shared-constants)만 사용.

**관련 파일 (정리 후보 — 본 Step 신설 시점 잔존):**
- `apps/frontend/lib/api/dashboard-api.ts:91` — `OverdueCheckoutDto` alias
- `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts:130` — `OverdueCheckoutDto` alias
- `apps/backend/src/modules/equipment-imports/dto/*.ts` — `EquipmentImport*` alias 다수 (`reject-`, `create-`, `approve-`, `receive-`, `equipment-import-query-`)
- `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts:71,150` — `submitForReviewSchema` / `SubmitForReviewDto` alias
- `apps/frontend/lib/api/teams-api.ts:108` — `CLASSIFICATION_CONFIG` legacy 호환
- `apps/frontend/lib/api/server-api-client.ts:166,173` — `getServerAuthHeaders` / `getServerAuthSession` alias
- `apps/backend/src/modules/auth/rbac/{roles,permissions}.enum.ts` — packages re-export alias

**발생 이력 (2026-04-28 → 2026-04-30 신설)**: dashboard-low-residual 세션에서 `DashboardCheckoutScope` alias가 외부 소비처 0건임을 grep으로 검증한 후 즉시 제거. 그 결과 `DashboardScope` (shared-constants) 정식 SSOT만 남게 되어 import 경로 단일화. 본 Step은 다른 deprecated alias도 같은 절차(외부 grep → 0건 확인 → 제거)로 정리하도록 권고하기 위해 신설.

---

### Step 44: Supply-Chain SSOT — raw uuid import 금지 + pnpm.overrides caret 잠금 (2026-04-30 추가, deps-supply-chain-hardening)

**규칙**: 도메인 ID 생성은 반드시 `IdentifierService` (`apps/backend/src/common/identifiers/identifier.service.ts`) 단일 진입점을 경유한다. raw `uuid` 패키지 직접 import / `randomUUID` 직접 import는 금지. 동시에 root `package.json` 의 `pnpm.overrides` 모든 entry는 `^x.y.z` (caret) 또는 정확한 `x.y.z` 버전이어야 하며, `>=` / `>` / `~` / `*` / `latest` 같은 unbounded 범위는 금지.

**왜 raw uuid import가 위험한가**:
- vendor 패키지 직접 의존이 호출처에 흩어지면 알고리즘 전환(ulid/nanoid/`crypto.randomUUID()`) 시 모든 호출처를 추적·수정해야 함 — vendor lock-in 누수.
- ID 형식 패턴(prefix, 길이)이 호출처마다 산재되어 SSOT 분산.
- 보안/성능 정책 변경(CSPRNG 알고리즘, hot path inline) 시 단일 헬퍼만 수정하면 안 되는 상태로 부패.

**왜 unbounded overrides (`>=`)가 위험한가**:
- pnpm overrides의 `>=`는 *모든* transitive dependency를 그 버전 이상으로 hoist. 예: `tar: '>=7.5.7'`인데 다른 패키지가 `tar@8.0.0`을 요구하면 메이저 8.x로 통합되어 우리 코드 무관한데도 lockfile에서 메이저 점프가 silent하게 발생 (실측 사례: `jws: '>=3.2.3'` → 4.0.1 hoist, `tar-fs: '>=2.1.4'` → 3.1.2 hoist).
- caret(`^x.y.z`)은 SemVer minor/patch만 허용하므로 메이저 통합을 차단하면서 보안 패치는 흡수.

**검증 명령**:
```bash
# 1) backend raw uuid import 0건 확인 (FAIL 패턴)
! grep -rn "from ['\"]uuid['\"]" apps/backend/src/ 2>/dev/null
! grep -rn "require('uuid')" apps/backend/src/ 2>/dev/null
! grep -rn "import .* from 'node:crypto'.*randomUUID\|import .* from 'crypto'.*randomUUID" apps/backend/src/ 2>/dev/null \
  | grep -v 'common/identifiers/identifier\.service\.ts\|\.spec\.ts'
# 기대: 모두 exit 0 (매치 0건)

# 1b) frontend randomUUID 직접 사용 — proxy.ts(CSP nonce)와 e2e spec 제외 후 0건
grep -rn "randomUUID" apps/frontend --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "spec\|test\|proxy\.ts\|node_modules\|\.next\|coverage"
# 기대: 0건 (proxy.ts는 Edge Runtime Web Crypto 예외, spec은 테스트 데이터 예외)

# 2) IdentifierService 존재 + @Global 등록 확인
test -f apps/backend/src/common/identifiers/identifier.service.ts \
  && test -f apps/backend/src/common/identifiers/identifier.module.ts \
  && grep -q '@Global' apps/backend/src/common/identifiers/identifier.module.ts \
  && echo "OK identifier module"
# 기대: "OK identifier module"

# 2b) preinstall 훅에 drift guard 연결 확인
grep '"preinstall"' package.json | grep -q "check-dependabot-drift.mjs" && echo "OK preinstall hook"
# 기대: "OK preinstall hook"

# 3) pnpm.overrides caret 잠금 확인 (FAIL 패턴)
#    engines 필드의 ">=20.18.0" 같은 런타임 최소 버전은 정당하므로,
#    overrides 블록 내부만 검사한다.
node -e '
const o = require("./package.json")?.pnpm?.overrides ?? {};
const bad = Object.entries(o).filter(
  ([_, v]) => typeof v !== "string" || /^(>=|>|~|\*|latest)/i.test(v),
);
if (bad.length) {
  console.error("FAIL:", bad);
  process.exit(1);
}
console.log("PASS: overrides caret-locked");
'
# 기대: exit 0 + "PASS" (매치 0건). 매치 발견 시 caret 또는 정확한 버전으로 변경 권고.

# 4) preinstall guard 작동 확인 (회귀 시뮬레이션)
# 일시적으로 ">=1.0.0" 추가 후 drift guard exit 1 기대, 원복.

# 5) IdentifierService 실 사용처 확인 (구조적 검증)
grep -rn 'identifiers\.\(generateAttachmentId\|generateMigrationBatchId\|generateOpaqueId\)' \
  apps/backend/src/ 2>/dev/null
# 기대: ≥ 1 hit (file-upload.service, data-migration.service)

# 6) Spec 파일이 IdentifierService를 의존하면 mock 등록 강제
#    @Global() 모듈은 Test.createTestingModule에서 자동 import되지 않으므로
#    spec에서 IdentifierService를 inject하면 반드시 createMockIdentifierService()로
#    provide해야 한다. 누락 시 NestJS DI 런타임 에러.
spec_files=$(grep -rln "IdentifierService" apps/backend/src --include="*.spec.ts" 2>/dev/null)
if [ -n "$spec_files" ]; then
  for f in $spec_files; do
    if grep -q "IdentifierService" "$f" && \
       ! grep -q "createMockIdentifierService\|provide:\s*IdentifierService" "$f"; then
      echo "FAIL: $f references IdentifierService but does not register mock provider"
      exit 1
    fi
  done
fi
# 기대: 모든 spec이 createMockIdentifierService 사용 또는 provide: IdentifierService 명시
# 헬퍼 파일 위치: apps/backend/src/common/testing/mock-providers.ts
```

**PASS:**
- raw uuid / raw randomUUID import 0건 (IdentifierService 정의 파일 자체 제외)
- IdentifierModule이 `@Global()`로 등록되어 모든 feature module이 별도 imports 없이 주입 가능
- pnpm.overrides 모든 entry가 caret(`^`) 또는 정확한 버전
- preinstall guard `scripts/check-dependabot-drift.mjs`가 `preinstall` 훅에 연결됨
- spec 파일이 IdentifierService를 의존할 경우 `createMockIdentifierService()` 헬퍼로 mock provider 등록
- ESLint `no-restricted-imports`(node:crypto/crypto) + `no-restricted-syntax`(crypto.randomUUID member call) 이중 가드 작동 (정적 grep 우회 차단)
- CI workflow `.github/workflows/supply-chain-gate.yml` 가 PR 게이트로 drift guard + audit:dependabot 강제 (preinstall `--ignore-scripts` 우회 방어)

**FAIL:**
- `import { v4 } from 'uuid'` 또는 `const { randomUUID } = require('node:crypto')` 직접 사용 (헬퍼 외부)
- `>=` / `>` / `~` / `*` / `latest` overrides 잔존
- IdentifierService가 NestJS DI에서 resolve 안 됨 (모듈 등록 누락)
- preinstall 훅에서 `check-dependabot-drift.mjs` 연결 누락
- spec이 IdentifierService 의존하면서 mock provider 등록 누락 (런타임 NestJS DI 에러 위험)

**예외:**
- `apps/backend/src/common/identifiers/identifier.service.ts` 자체 — `randomUUID`를 `node:crypto`에서 직접 import (SSOT 정의 파일)
- `apps/backend/src/common/one-time-token/one-time-token.service.ts` — DI 생성자 없는 plain class에서 `generateJti()` 모듈 함수 직접 import. SSOT 정의 파일 내 함수 소비이므로 허용 (raw uuid 패키지 import 아님)
- 단위 테스트 파일 (`*.spec.ts`) — IdentifierService mock 객체 직접 사용 가능
- e2e spec 파일 (`apps/frontend/tests/e2e/**/*.spec.ts`) — 테스트 데이터 유일성 목적의 `crypto.randomUUID()` 직접 사용 허용 (도메인 ID 생성 아님)
- `apps/frontend/proxy.ts` — Next.js Edge Runtime에서 `globalThis.crypto.randomUUID()` (Web Crypto API)로 CSP nonce 생성. Node.js `node:crypto` import 불가 환경이므로 backend IdentifierService와 별개 도메인으로 허용. frontend ID 헬퍼 신설 시 재검토.

**관련 파일:**
- `apps/backend/src/common/identifiers/identifier.service.ts` — SSOT 정의
- `apps/backend/src/common/identifiers/identifier.module.ts` — `@Global()` 모듈
- `apps/backend/src/common/identifiers/identifier.service.spec.ts` — 6 케이스 회귀 가드
- `apps/backend/src/common/file-upload/file-upload.service.ts` — 첫 번째 호출처
- `apps/backend/src/modules/data-migration/services/data-migration.service.ts` — 두 번째 호출처
- `scripts/check-dependabot-drift.mjs` — preinstall guard
- `package.json` (root) — `pnpm.overrides` SSOT

**발생 이력 (2026-04-30 신설)**: deps-supply-chain-hardening Mode 2 작업. 출처:
- Dependabot 4 alerts (postcss<8.5.10, fast-xml-parser<5.7.0, uuid<14, uuid<14 dup) 처리 과정에서 발견.
- uuid v9→v14 메이저 5단계 bump 회피를 위해 `crypto.randomUUID()` 빌트인으로 전환 — vendor 캡슐화 SSOT로 격상.
- `>=` overrides 9건 caret 통일 시 `jws: '>=3.2.3'` → 4.0.1 / `tar-fs: '>=2.1.4'` → 3.1.2 hoist 사례 실측 발견. 향후 차단을 위해 preinstall guard + 본 Step 신설.

### Step 45: LENDER_APPROVAL_PENDING_STATUSES SSOT 체인 — FSM 도출 승인 대기 상태 배열 인라인 재정의 금지 (2026-04-29 추가)

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

### Step 46: 목적별 폼 설정 SSOT — `as const satisfies Record<CheckoutPurpose, ...>` 패턴, 인라인 목적 분기 boolean 재정의 금지 (2026-04-29 추가)

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

### Step 47: `isPurposeCompatibleWithEquipment` SSOT — `USER_SELECTABLE_PURPOSES.includes()` 가드 (2026-04-30 추가)

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

### Step 48: `switch + assertNever` exhaustiveness — discriminated union 핸들러 (2026-04-30 추가)

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

### Step 49: UI 도메인 타입 파일 SSOT + 위임 re-export 패턴 (2026-04-30 추가, tech-debt-batch-0430 Phase D)

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

### Step 50: `components/shared/` eslint-disable에 `self-audit-exception` 마커 강제 (2026-04-30 추가, tech-debt-batch-0430b)

**규칙**: `apps/frontend/components/shared/` 하위 파일에서 `eslint-disable-next-line no-restricted-syntax` 주석을 사용하는 경우, 반드시 `-- self-audit-exception:` 마커와 사유를 포함해야 한다. 마커 없는 disable 주석은 `scripts/self-audit.mjs`의 `checkEslintDisable()` 함수에서 pre-commit 차단 대상이 된다.

**왜 이 마커가 필요한가**: `components/shared/`의 컴포넌트는 도메인 NS 결합이 금지되어 있으나, i18n 키 이전 전 임시 허용이 필요한 경우가 있다. 이 경우 `self-audit-exception` 마커로 "의도된 예외임을 명시" + "이전 완료 시 제거 대상 추적"의 두 목적을 달성한다. 마커 없이 disable만 있으면 레거시 우회인지 의도된 임시 예외인지 구분이 불가하다.

**검증 명령**:
```bash
# components/shared/ 내 마커 없는 no-restricted-syntax disable 탐지
grep -rn "eslint-disable.*no-restricted-syntax" \
  apps/frontend/components/shared/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "self-audit-exception"
# 기대: 0건 — 마커 없는 disable 0건
```

**PASS**: 0건 (모든 disable에 `-- self-audit-exception: <사유>` 포함)
**FAIL**: 마커 없는 disable 발견 → `-- self-audit-exception: <사유>` 추가 또는 disable 제거

**현재 허용된 예외 목록** (2026-04-30 기준):
- `DocumentPreviewDialog.tsx:28` — `equipment.attachmentsTab` i18n 키 이전 전 임시 허용
- `EquipmentSelector.tsx:51` — `equipment.selector` i18n 키 이전 전 임시 허용

**관련 파일**:
- `scripts/self-audit.mjs` — `checkEslintDisable()`: `self-audit-exception` 패턴으로 승인 예외 처리
- `apps/frontend/eslint.config.mjs` — `SHARED_COMPONENT_DOMAIN_NS_RULE`: NS 결합 금지 ESLint 게이트 (Step 50은 해당 게이트의 예외 처리 완전성을 검증)

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430b — `DocumentPreviewDialog.tsx`, `EquipmentSelector.tsx`의 기존 eslint-disable 주석이 `self-audit-exception` 마커 없이 pre-commit에서 false positive로 차단되는 버그 발견. 마커 도입 + `self-audit.mjs` 예외 인식 로직 추가로 해소. 향후 `components/shared/` 신규 eslint-disable 추가 시 마커 필수.

### Step 51: `CheckoutDirectionValues` SSOT — `direction` 리터럴 문자열 인라인 금지 (2026-04-30 추가, tech-debt-batch-0430b)

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
