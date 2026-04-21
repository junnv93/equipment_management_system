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
