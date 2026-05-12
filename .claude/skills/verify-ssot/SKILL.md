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

상세: [references/record-satisfies.md](references/record-satisfies.md#step-1-로컬-enum타입-재정의-탐지)

### Step 2: Permission 임포트 소스 확인

모든 Permission이 `@equipment-management/shared-constants`에서 import되는지 확인.
**PASS:** 모든 Permission이 shared-constants에서 import. **FAIL:** 다른 소스 사용.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-2-permission-임포트-소스-확인)

### Step 2a: Client-side `hasRole()` 금지

프론트엔드 컴포넌트/페이지에 `useAuth().hasRole` 또는 role 리터럴 배열 권한 게이트 사용 금지.
**PASS:** hasRole 사용 0건, role 리터럴 배열 권한 게이트 0건. **FAIL:** client code에서 hasRole 또는 `[URVal.XXX, ...]`로 권한 결정.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-2a-client-side-hasrole-금지-role-literal-기반-권한-게이트-탐지)

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

### Step 15: data-migration SSOT 검증

`MIGRATION_SESSION_STATUS` / `MigrationRowStatus` 등이 `packages/schemas/src/data-migration.ts` SSOT에서만 정의·소비되는지 확인.
**PASS:** 로컬 재정의 0건 + raw 리터럴 0건. **FAIL:** 로컬 재정의 또는 raw 리터럴 발견.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-15-data-migration-ssot-검증)

### Step 16: 도메인 유틸 상수 SSOT 검증

`isCheckoutExportable` / `NON_EXPORTABLE_CHECKOUT_STATUSES` 등이 로컬 재정의 없이 SSOT 헬퍼를 경유하는지 확인.
**PASS:** 로컬 재정의 0건. **FAIL:** 인라인 배열 또는 로컬 재정의 발견.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-16-도메인-유틸-상수-ssot-검증)

### Step 17: Content-Disposition 헤더 빌더 SSOT

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

### Step 18: E2E createTestApp globalPrefix SSOT 검증

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

### Step 19: 프론트엔드 도메인 Status/Type 리터럴 비교 SSOT

프론트엔드에서 `ValidationStatus`, `ValidationType` 등을 raw 문자열 리터럴로 직접 비교하는 패턴 탐지.
**PASS:** 세 탐지 명령어 모두 0건. **FAIL:** raw 리터럴 비교 또는 loose index signature 발견.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-19-프론트엔드-도메인-statustype-리터럴-비교-ssot)

### Step 20: Permission 라벨 렌더링 SSOT

`PERMISSION_LABELS_LOCALIZED`를 경유하지 않고 `t.raw('profile.permissions.labels')` 레거시 패턴 사용 탐지.
**PASS:** t.raw 레거시 0건, settings.json labels 섹션 0건, PERMISSION_LABELS_LOCALIZED 2건 이상. **FAIL:** 레거시 패턴 재도입.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-20-permission-라벨-렌더링-ssot)

### Step 21: ConditionCheckStepValues SSOT + ExportData Step 리터럴

`'lender_checkout'`/`'lender_return'` 문자열 리터럴 직접 비교 금지. `ConditionCheckStepValues.*` SSOT 경유 필수.
**PASS:** 리터럴 직접 사용 0건. **FAIL:** step 리터럴 직접 비교.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-21-conditioncheckstepvalues-ssot--exportdata-도메인-step-리터럴)

### Step 22: ESLint 3-layer domain status 리터럴 차단 검증

`apps/backend/.eslintrc.js`에 BinaryExpression / Property / CallExpression 3-layer selector 존재 확인 + ImportExpression dynamic import selector 검증.
**PASS:** 3-layer selector 모두 존재 + ImportExpression selector 검증 통과 + lint 에러 0건. **FAIL:** selector 누락 또는 lint 에러.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-22-eslint-3-layer-domain-status-리터럴-차단-검증)

### Step 24: UnifiedApprovalStatus (UASVal) SSOT — approvals mappers

approvals 매핑 함수에서 `UnifiedApprovalStatus` 값을 raw 문자열 리터럴로 할당하는 패턴 탐지.
**PASS:** raw 리터럴 0건 + mappers.ts에서 UASVal import 확인. **FAIL:** raw 리터럴 직접 할당.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-24-unifiedapprovalstatus-uasval-ssot--approvals-mappers)

### Step 25: design-token 헬퍼 내 status literal 직접 비교 금지

`apps/frontend/lib/design-tokens/components/*.ts` 내 헬퍼에서 도메인 상태값을 raw 문자열 리터럴로 직접 비교하는 패턴 탐지.
**PASS:** design-token 헬퍼 내 도메인 status raw 리터럴 0건. **FAIL:** `=== 'overdue'` 등 발견.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-25-design-token-헬퍼-함수-내-status-literal-직접-비교-금지)

### Step 26: notifyCheckoutAction SSOT 경유 검증

checkout 관련 토스트 알림은 반드시 `lib/checkouts/toast-templates.ts`의 `notifyCheckoutAction`을 경유해야 한다.
컴포넌트에서 직접 `toast({...})` 호출로 반출 액션 결과를 알리는 인라인 패턴은 SSOT 위반이다.

**탐지 — mutation onSuccess에서 직접 toast 호출:**
```bash
# approve/reject/start/return 액션 onSuccess에서 notifyCheckoutAction 미사용 탐지
grep -n "toast({" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  "apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx" 2>/dev/null \
  | grep -v "notifyCheckoutAction\|#"
```

**✅ 올바른 패턴:**
```typescript
onSuccess: (_data, variables) =>
  notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName ?? '' }, t),
```

**PASS:** 반출 액션 onSuccess에서 `notifyCheckoutAction` 경유 확인.
**FAIL:** `toast({ title: '...' })` 직접 호출 → `notifyCheckoutAction(toast, action, ctx, t)` 패턴으로 전환.

**예외:**
- 에러 핸들링 시 `toast({ variant: 'destructive', ... })` 직접 호출 — 에러 toast는 현재 SSOT 미포함
- 비-반출 도메인 컴포넌트에서 toast 직접 호출 — 이 Step은 checkouts 도메인만 대상

**관련 파일:**
- `apps/frontend/lib/checkouts/toast-templates.ts` — SSOT 함수

### Step 27: UserSelectableCheckoutPurpose SSOT — CreateCheckoutDto.purpose

`CreateCheckoutDto.purpose`가 전체 `CheckoutPurpose` 대신 `UserSelectableCheckoutPurpose`를 사용하는지 확인.
**PASS:** `CreateCheckoutDto.purpose: UserSelectableCheckoutPurpose` + 폼 state도 동일 타입. **FAIL:** `purpose: string` 또는 `purpose: CheckoutPurpose` 잔존.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-27-userselectablecheckoutpurpose-ssot--createcheckoutdtopurpose)

### Step 28: useDateFormatter SSOT — date-fns 직접 사용 금지

날짜/시각 포맷은 `@/hooks/use-date-formatter`의 `useDateFormatter()` 훅을 경유해야 한다.

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
```

**PASS:** `date-fns/locale` 직접 import 0건 + `format(*, { locale: })` 조합 0건.
**FAIL:** `import { ko } from 'date-fns/locale'` 또는 `format(new Date(...), '...', { locale: ko })` 신규 추가 → `useDateFormatter().fmtDate()` / `fmtDateTime()`으로 교체.

**예외 (PASS로 처리):**
- `apps/frontend/hooks/use-date-formatter.ts` 자체
- `differenceInDays`, `addDays`, `addMonths` 등 계산/변환 전용 함수 (locale 의존 없음)
- `components/ui/date-picker.tsx`, `components/ui/date-range-picker.tsx` — shadcn/ui Calendar 내부
- `components/calibration/CalibrationTimeline.tsx` — 기존 tech-debt LOW
- `components/equipment-imports/EquipmentImportDetail.tsx` — 기존 tech-debt LOW

### Step 29: prebuild guard 스크립트 존재 + package.json 연결

`check-role-config-sync.mjs`와 `check-css-vars.mjs`가 `package.json`의 `prebuild` 훅에 연결되어 있는지 확인.

```bash
# 빌드 가드 스크립트 파일 존재 확인
ls scripts/check-role-config-sync.mjs scripts/check-css-vars.mjs 2>/dev/null \
  && echo "EXISTS" || echo "MISSING"

# package.json prebuild에 두 스크립트 모두 연결되어 있는지 확인
grep '"prebuild"' package.json
# 결과: "prebuild": "node scripts/check-role-config-sync.mjs && node scripts/check-css-vars.mjs"

# 드라이런 — 두 스크립트 모두 exit 0 반환하는지 확인
node scripts/check-role-config-sync.mjs && node scripts/check-css-vars.mjs \
  && echo "PASS" || echo "FAIL"
```

**PASS:** 두 파일 존재 + `prebuild`에 연결 + 드라이런 exit 0.
**FAIL:** 스크립트 파일 없음 또는 `prebuild` 훅 미연결 또는 드라이런 exit 1.

### Step 30: 상태 순서 매핑 객체 키 — enum Computed Property Name 경유 필수

`STATUS_ORDER`, `PRIORITY_MAP` 등 상태→숫자 매핑 객체 키가 enum/Values 상수를 Computed Property Name으로 경유하는지 확인.
**PASS:** 모든 키가 `[EnumVal.CONSTANT]` 패턴. **FAIL:** 문자열 리터럴 키 발견.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-30-상태-순서-매핑-객체-키--enum-computed-property-name-경유-필수)

### Step 31: `computeUrgency` SSOT — 인라인 시간 계산 금지

`48 * 60 * 60 * 1000` 같은 인라인 시간 상수 + 직접 비교 탐지. `computeUrgency` SSOT 경유 필수.
**PASS:** 긴급도 계산 전부 `computeUrgency` 경유. **FAIL:** 인라인 시간 상수 발견.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-31-computeurgency-ssot--인라인-시간-계산-금지)

### Step 32: config 객체 파생 boolean 필드 → 수치 SSOT

`multiStep?: boolean` 같이 수치 필드에서 파생 가능한 boolean 필드 재도입 탐지.
**PASS:** `multiStep?: boolean` 선언 0건. **FAIL:** boolean 재도입 → 수치 비교 패턴으로 교체.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-32-config-객체-파생-boolean-필드--수치-ssot)

### Step 33: TAB_META capability guard 완전성

`canReject !== false` 경유 3건 이상 확인 (onReject×2 + onBulkReject).
**PASS:** 3건 이상. **FAIL:** 3건 미만.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-33-tab_meta-capability-guard-완전성--canreject--false-4-path-패턴)

### Step 34: 로컬 인터페이스명 packages 동명 타입 충돌 금지

`packages/schemas` export 타입과 서비스 로컬 interface 동명 충돌 탐지.
**PASS:** `comm -12` 결과 0줄. **FAIL:** 동명 충돌 발견 → 접미사 추가.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-34-로컬-인터페이스명-packages-동명-타입-충돌-금지)

### Step 35: 대시보드 임계값 SSOT — `dashboard-thresholds.ts` 우회 금지

대시보드 임계값이 `@equipment-management/shared-constants/dashboard-thresholds`에서 import되는지 확인.
**PASS:** 모든 grep 결과 0줄. **FAIL:** 매직 넘버 발견.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-35-대시보드-임계값-ssot--dashboard-thresholdsm-우회-금지)

### Step 36: 반출 도메인 D-day 임계값 SSOT — `checkout-thresholds.ts` 우회 금지

반출 D-day 4-tier 임계값이 `@equipment-management/shared-constants/checkout-thresholds`에서 import되는지 확인.
**PASS:** 5가지 조건 모두 충족. **FAIL:** 인라인 임계값 또는 대시보드 모듈 교차 사용.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-36-반출-도메인-d-day-임계값-ssot--checkout-thresholdsm-우회-금지)

### Step 37: `useEffectiveRole` SSOT — `session.user.role` 직접 참조 금지

클라이언트 컴포넌트/hook에서 `session.user.role` 직접 참조 탐지. `useEffectiveRole().effectiveRole` 경유 필수.
**PASS:** session.user.role 직접 참조 0건. **FAIL:** 컴포넌트에서 `useSession()`으로 role 추출 후 분기.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-37-useeffectiverole-ssot--클라이언트-컴포넌트의-sessionuserrole-직접-참조-금지)

### Step 38: BackendService ConfigService SSOT — `process.env` 직접 접근 금지

NestJS 서비스 클래스 내부에서 `process.env.*` 직접 접근 금지. `ConfigService` 주입 + `configService.get<T>('KEY')` 경유 필수.

```bash
# 서비스 파일에서 process.env 직접 접근 (configService 미경유)
grep -rn "process\.env\." \
  apps/backend/src/modules --include="*.service.ts" \
  | grep -v "//\|spec\.\|test\."
# 기대: 0건 (ConfigService 경유 또는 env.validation.ts Zod 보장)
```

**PASS:** 모든 서비스 파일에서 `process.env.*` 직접 접근 0건.
**FAIL:** `process.env.MY_VAR` 직접 사용 발견 → ConfigService 주입 + `env.validation.ts` Zod schema 추가.

**예외:**
- `apps/backend/src/config/env.validation.ts` 자체 — Zod schema 정의 파일
- `apps/backend/src/main.ts` / `app.module.ts` — 앱 부트스트랩
- E2E/spec 테스트 파일 — 환경변수 오버라이드
- `process.env.NODE_ENV` — NestJS 내부 표준 관례
- `monitoring.service.ts` / `auth.service.ts` — 기존 tech-debt LOW 등재

### Step 39: shared-constants const array → `z.enum()` SSOT 패턴

백엔드 Query DTO에서 `z.enum(['me','team','lab','all'])` 인라인 배열 정의 금지. `packages/shared-constants`에 `as const` 배열 정의 후 `z.enum(MY_CONST_ARRAY)` 참조 필수.
**PASS:** `z.enum([` 인라인 배열 0건. **FAIL:** 인라인 배열 발견 → shared-constants로 이관.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-39-shared-constants-const-array--zenum-ssot-패턴)

### Step 40: domain enum 분류 매핑은 `as const satisfies Record<EnumType, X>` 강제

domain enum을 키로 하는 분류 맵에서 `Set<EnumType>` 또는 `Record<string, X>` 약타입 사용 탐지.
**PASS:** `as const satisfies Record<EnumType, X>` 패턴 사용. **FAIL:** `ReadonlySet<EnumType>` 발견.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-40-domain-enum-분류-매핑은-as-const-satisfies-recordenumtype-x-강제--setenumtype-약타입-금지)

### Step 41: Hero KPI 선택 로직 SSOT — `selectHeroVariant` 우회 inline 분기 금지

반출 KPI hero 카드 선택은 `apps/frontend/lib/utils/checkout-hero-selector.ts`의 `selectHeroVariant` 단일 경로만 허용.

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
# 기대: 파일 존재 + 6+ 케이스
```

**PASS:** inline `summary.overdue > 0 ? ...` 패턴 0건 + `selectHeroVariant` 단일 SSOT 경로.
**FAIL:** inline 분기 잔존 → `selectHeroVariant` 경유로 교체.

**관련 파일:**
- `apps/frontend/lib/utils/checkout-hero-selector.ts` — `selectHeroVariant` SSOT

### Step 42: 테스트 파일 hardcoded threshold vs SSOT 토큰 import 강제

테스트 파일에서 boundary 케이스 검증 시 `toBe(70)` 같은 매직 넘버 hardcoding 금지. SSOT 토큰 import 후 동적 boundary 계산 필수.
**PASS:** 모든 boundary 테스트가 SSOT 토큰 import + 동적 파생 상수 사용. **FAIL:** 매직 넘버 발견.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-42-테스트-파일-hardcoded-threshold-vs-ssot-토큰-import-강제)

### Step 43: `@deprecated` export alias 외부 소비처 0건 정리

`@deprecated` 주석이 달린 export alias의 외부 소비처 grep 후 0건이면 즉시 제거.

```bash
# @deprecated + export 패턴 전수 grep
grep -rB1 -A2 '@deprecated' \
  apps/frontend/lib/api apps/backend/src/modules packages/ \
  --include="*.ts" --include="*.tsx" \
  | grep -E 'export (type|const|interface|class) [A-Z]'
```

**PASS:** 외부 소비처 grep ≥ 1 → 제거 보류. 외부 소비처 grep = 0 → 제거 완료.
**FAIL:** 외부 소비처 0건인데 잔존 → cleanup 권고.

**예외:** 명시적 grace period / 외부 패키지 호환성 / dist 빌드 산출물

### Step 44: Supply-Chain SSOT — raw uuid import 금지 + pnpm.overrides caret 잠금

도메인 ID 생성은 `IdentifierService` 단일 진입점 경유 필수. raw `uuid` 패키지 직접 import 금지. `pnpm.overrides`의 모든 entry는 `^x.y.z` (caret) 또는 정확한 버전 필수.

```bash
# 1) backend raw uuid import 0건 확인 (FAIL 패턴)
! grep -rn "from ['\"]uuid['\"]" apps/backend/src/ 2>/dev/null
! grep -rn "require('uuid')" apps/backend/src/ 2>/dev/null

# 2) IdentifierService 존재 + @Global 등록 확인
test -f apps/backend/src/common/identifiers/identifier.service.ts \
  && test -f apps/backend/src/common/identifiers/identifier.module.ts \
  && grep -q '@Global' apps/backend/src/common/identifiers/identifier.module.ts \
  && echo "OK identifier module"

# 3) pnpm.overrides caret 잠금 확인 (FAIL 패턴)
node -e '
const o = require("./package.json")?.pnpm?.overrides ?? {};
const bad = Object.entries(o).filter(
  ([_, v]) => typeof v !== "string" || /^(>=|>|~|\*|latest)/i.test(v),
);
if (bad.length) { console.error("FAIL:", bad); process.exit(1); }
console.log("PASS: overrides caret-locked");
'
```

**PASS:** raw uuid/randomUUID import 0건 + IdentifierModule @Global 등록 + pnpm.overrides caret 잠금 + preinstall guard 연결.
**FAIL:** raw uuid 직접 사용 또는 `>=` overrides 잔존.

**예외:**
- `identifier.service.ts` 자체 — SSOT 정의 파일
- `apps/frontend/proxy.ts` — Next.js Edge Runtime Web Crypto API (Node.js crypto 사용 불가)
- e2e spec 파일 — 테스트 데이터 유일성 목적

### Step 45: LENDER_APPROVAL_PENDING_STATUSES SSOT 체인

`['pending', 'borrower_approved']` 인라인 배열 리터럴로 상태 열거 금지. FSM 도출 `LENDER_APPROVAL_PENDING_STATUSES` SSOT 경유 필수.
**PASS:** 인라인 배열 0건 + schemas 단 1곳 정의. **FAIL:** 인라인 열거 또는 로컬 재정의.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-45-lender_approval_pending_statuses-ssot-체인--fsm-도출-승인-대기-상태-배열-인라인-재정의-금지)

### Step 46: 목적별 폼 설정 SSOT — `as const satisfies Record<CheckoutPurpose, ...>`

컴포넌트 내 `isCalibrationRequired = purpose === 'calibration'` 인라인 boolean 플래그 재정의 금지. `as const satisfies Record<CheckoutPurpose, ConfigInterface>` 설정 객체 중앙화 필수.
**PASS:** 인라인 boolean 0건 + satisfies Record 패턴 존재. **FAIL:** 인라인 재정의 발견.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-46-목적별-폼-설정-ssot--as-const-satisfies-recordcheckoutpurpose-패턴-인라인-목적-분기-boolean-재정의-금지)

### Step 47: `isPurposeCompatibleWithEquipment` SSOT — `USER_SELECTABLE_PURPOSES.includes()` 가드

`isPurposeCompatibleWithEquipment()` 호출 전 `USER_SELECTABLE_PURPOSES.includes()` 가드 선행 필수.
**PASS:** 가드가 `&&` 조건으로 호출 앞에 존재. **FAIL:** 가드 없이 직접 호출.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-47-ispurposecompatiblewithequipment-ssot--user_selectable_purposesincludes-가드)

### Step 48: `switch + assertNever` exhaustiveness — discriminated union 핸들러

discriminated union의 `kind` 필드를 분기하는 함수에 `if-else` 대신 `switch + assertNever(x: never): never` 패턴 사용 강제.
**PASS:** `switch (cfg.kind)` + `default: assertNever(cfg)` 존재 + `if (cfg.kind === ...)` 0건. **FAIL:** if-else 패턴 잔존.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-48-switch--assertnever-exhaustiveness--discriminated-union-핸들러)

### Step 49: UI 도메인 타입 파일 SSOT + 위임 re-export 패턴

여러 컴포넌트가 공유하는 UI 인터페이스(`OverflowAction` 등)는 `apps/frontend/lib/types/` 단일 정의 필수. 중간 컴포넌트는 위임 re-export만 허용.
**PASS:** lib/types/ 단 1곳 정의 + 컴포넌트 직접 정의 0건. **FAIL:** 컴포넌트 파일에서 `export interface` 직접 정의.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-49-ui-도메인-타입-파일-ssot--위임-re-export-패턴)

### Step 50: `components/shared/` eslint-disable에 `self-audit-exception` 마커 강제

`apps/frontend/components/shared/` 하위에서 `eslint-disable-next-line no-restricted-syntax` 사용 시 `-- self-audit-exception:` 마커 필수.

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

**관련 파일**:
- `scripts/self-audit.mjs` — `checkEslintDisable()`: `self-audit-exception` 패턴으로 승인 예외 처리

### Step 51: `CheckoutDirectionValues` SSOT — `direction` 리터럴 문자열 인라인 금지

`direction: 'outbound'`/`'inbound'` 리터럴 직접 사용 탐지. `CheckoutDirectionValues.OUTBOUND` / `.INBOUND` SSOT 경유 필수.
**PASS:** 0건. **FAIL:** 리터럴 발견.

상세: [references/domain-status-literals.md](references/domain-status-literals.md#step-51-checkoutdirectionvalues-ssot--direction-리터럴-문자열-인라인-금지)

### Step 52: Visual layer ↔ domain SSOT 의식적 분리 — frontend 시각 임계값 named constant

frontend 시각 임계값이 별도 named constant(`CHECKOUT_DDAY_VISUAL_THRESHOLDS` 등)로 분리되어 있는지 확인. domain SSOT를 시각 계산에 재사용하거나 인라인 magic number 사용 금지.
**PASS:** visual constant 정의 + magic number 0 + 4-tier 보존. **FAIL:** visual 헬퍼 내 인라인 임계값.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-52-visual-layer--domain-ssot-의식적-분리--frontend-시각-임계값-named-constant)

### Step 53: 백엔드-프론트 공유 API 응답 타입 → packages/schemas SSOT

백엔드·프론트 양측이 동시에 사용하는 응답 타입(`CheckoutSummary` 등)은 `packages/schemas`에 단일 정의 후 양측 import.
**PASS:** schemas 단일 정의 + 프론트 re-export만 + 백엔드 import 사용. **FAIL:** `apps/` 내 직접 정의.

상세: [references/record-satisfies.md](references/record-satisfies.md#step-53-백엔드-프론트-공유-api-응답-타입--packagesschemas-ssot)

### Step 54: Analytics SSOT — `lib/analytics/track.ts` 단일 진입점

analytics 이벤트 발행은 `apps/frontend/lib/analytics/track.ts`의 `track()` 함수 단일 진입점만 허용.

```bash
# window.dispatchEvent('app:analytics') 직접 호출 탐지
grep -rn "dispatchEvent.*app:analytics\|CustomEvent.*app:analytics" \
  apps/frontend/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|lib/analytics/track.ts"
# 기대: 0건 (track.ts 자체 구현만 허용)

# 외부 analytics SDK 직접 import 탐지 (GA, Amplitude, Firebase 등)
grep -rn "from 'firebase/analytics'\|from '@amplitude/analytics'\|from 'react-ga'" \
  apps/frontend/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules"
# 기대: 0건
```

**PASS**: `lib/analytics/track.ts` 외에 `app:analytics` CustomEvent 직접 발행 0건, 외부 analytics SDK 직접 import 0건
**FAIL**: 컴포넌트·훅 내 `window.dispatchEvent('app:analytics')` 직접 → `track()` 경유로 교체

**관련 파일**:
- `apps/frontend/lib/analytics/track.ts` — `track()` 단일 진입점, SSR-safe, PII deny-list

### Step 55: `useRowSelection` SSOT — BulkActionBar 사용 컴포넌트에서 `useState<string[]>` row selection 금지

`BulkActionBar`를 렌더링하는 컴포넌트는 반드시 `useRowSelection<T>` 사용. `useState<string[]>`로 row selection ID 수동 관리 금지.

```bash
# BulkActionBar 사용 컴포넌트가 useRowSelection을 import하는지 확인
grep -rn "BulkActionBar" apps/frontend/components --include="*.tsx" -l | \
  while read f; do
    if ! grep -qE "useRowSelection|useBulkSelection" "$f"; then
      echo "MISSING useRowSelection: $f"
    fi
  done
# 기대: 빈 출력 (BulkActionBar 사용 컴포넌트 모두 useRowSelection 경유)

# row selection용 useState<string[]> 잔존 탐지 (selectedItems 변수명 패턴)
grep -rn "useState<string\[\]>" apps/frontend/components --include="*.tsx" | \
  grep -iE "selected|checked|picked" | grep -v "node_modules"
# 기대: 0건
```

**PASS**: 모든 BulkActionBar 사용 컴포넌트가 `useRowSelection` import.
**FAIL**: `useState<string[]>` 수동 관리 → `useRowSelection` 마이그레이션 필요.

**관련 파일**:
- `apps/frontend/hooks/use-bulk-selection.ts` — `useRowSelection<T>` SSOT 구현

### Step 56: `calculateDaysRemaining` SSOT — 인라인 D-day 산술 금지

`setHours(0,0,0,0)` + `getTime() / 86400000` 조합의 인라인 D-day 산술을 `dday-utils.ts` 외부에서 직접 작성 금지.
**PASS:** 외부 `setHours(0,0,0,0)` 및 `/86400000` 패턴 0건. **FAIL:** 인라인 D-day 산술 발견.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-56-calculateDaysremaining-ssot--dday-utilsts-외부에서-인라인-날짜-d-day-산술-금지)

### Step 57: `RolePermissionMatrix` derived view 정책 — 직접 데이터 추가 금지

`ROLE_PERMISSION_MATRIX`는 `ROLE_PERMISSIONS`의 reverse-index view. matrix 파일에 직접 데이터 추가 금지.
**PASS:** matrix 파일에 Permission 직접 매핑 0건. **FAIL:** 손수 매핑 추가 발견.

상세: [references/permissions-roles.md](references/permissions-roles.md#step-57-rolepermissionmatrix-derived-view-정책--직접-데이터-추가-금지)

### Step 58: `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` SSOT — `.max(200)` 매직넘버 DTO 인라인 금지

DTO에서 `.max(200, ...)` 매직넘버 직접 사용 금지. `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` 경유 필수.
**PASS:** `.max(200,` 패턴 0건. **FAIL:** 1건 이상 → SSOT 상수 교체.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-58-validation_rulesextended_text_max_length-ssot--max200-매직넘버-dto-인라인-금지)

### Step 59: Backend pagination default/max SSOT — 서비스·컨트롤러 clamp 매직넘버 금지

backend controller/service에서 `Math.min(..., 100)` 또는 `pageSize = 20` 같은 pagination 매직넘버 직접 사용 금지. `DEFAULT_PAGE_SIZE` / `MAX_PAGE_SIZE` SSOT 경유 필수.
**PASS:** backend production controller/service에서 pagination 매직넘버 0건. **FAIL:** 1건 이상.

상세: [references/threshold-numbers.md](references/threshold-numbers.md#step-59-backend-pagination-defaultmax-ssot--서비스컨트롤러-clamp-매직넘버-금지)

---

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
| 19c | 도메인 폼 아이템 loose index  | PASS/FAIL | `[key: string]: string` 인터페이스 위치 |
| 20  | Permission 라벨 렌더링 SSOT   | PASS/FAIL | t.raw 레거시 패턴 또는 settings.json labels 섹션 재도입 위치 |
| 21  | ConditionCheckStep SSOT       | PASS/FAIL | 'lender_checkout'/'lender_return' 리터럴 직접 비교 위치 |
| 22  | ESLint 3-layer selector 완전성 | PASS/FAIL | BinaryExpression/Property/CallExpression selector 누락 또는 lint 에러 위치 |
| 24  | UASVal SSOT — approvals-api.ts | PASS/FAIL | UnifiedApprovalStatus raw 리터럴 직접 할당 위치 |
| 25  | design-token 헬퍼 내 status literal 직접 비교 금지 | PASS/FAIL | `=== 'overdue'` 등 raw 리터럴 비교 위치 |
| 26  | notifyCheckoutAction SSOT 경유 | PASS/FAIL | checkout 액션 onSuccess에서 `toast({...})` 직접 호출 위치 |
| 27  | UserSelectableCheckoutPurpose SSOT | PASS/FAIL | `purpose: string` 또는 `purpose: CheckoutPurpose` 잔존 위치 |
| 29  | prebuild guard 스크립트 존재 + package.json 연결 | PASS/FAIL | 스크립트 파일 누락 또는 prebuild 훅 미연결 |
| 30  | 상태 순서 매핑 키 enum Computed Property Name 경유 | PASS/FAIL | 문자열 리터럴 키 또는 `Record<string, N>` 타입 위치 |
| 33  | TAB_META capability guard 완전성 | PASS/FAIL | 미가드 onReject/onBulkReject 직접 전달 위치 |
| 34  | 로컬 인터페이스명 packages 동명 타입 충돌 금지 | PASS/FAIL | 동명 충돌 위치 |
| 49  | UI 도메인 타입 파일 SSOT + 위임 re-export 패턴 | PASS/FAIL | 컴포넌트 내 `export interface` 직접 정의 위치 |
| 50  | `components/shared/` eslint-disable `self-audit-exception` 마커 강제 | PASS/FAIL | 마커 없는 eslint-disable 위치 |
| 57  | RolePermissionMatrix derived view 정책 | PASS/FAIL | matrix 직접 데이터 추가 위치 |
| 58  | EXTENDED_TEXT_MAX_LENGTH SSOT | PASS/FAIL | `.max(200,` 매직넘버 위치 |
| 59  | pagination default/max SSOT   | PASS/FAIL | `Math.min(…100)` / `pageSize=20` 매직넘버 위치 |
| 60  | SystemHealthProvider 컨트랙트 우회 검출 (2026-05-06 system-health-data-source-ssot) | PASS/FAIL | `dashboard.service.getSystemHealth` 본체에 인라인 `pg_database_size`/`schema.auditLogs.action.*reject.*cancel` proxy/`queueSize = 0` literal 잔존 위치 |
```

### Step 60 — SystemHealthProvider 컨트랙트 우회 검출

**배경**: `getSystemHealth()` 가 6 메트릭을 self-compute 하던 패턴은 데이터 소스 SSOT 결손이 root cause.
`StorageHealthProvider` / `AsyncWorkBacklogProvider` / `SystemErrorEventProvider` 3 strategy 컨트랙트로
대체된 후, 미래 진입자가 모르고 인라인 쿼리를 추가하면 회귀.

**검증 명령** (메서드 본체로 scope — `getRecentActivities` 등 인접 메서드의 정당 audit 사용은 false-FAIL 회피):

```bash
# (1) queueSize = 0 stub 잔존 — 전체 파일 스캔 (정당 사용 없음)
grep -c "queueSize = 0" apps/backend/src/modules/dashboard/dashboard.service.ts
# 기대값: 0

# (2) getSystemHealth 본체에서 pg_database_size 직접 호출 (provider 우회)
awk '/async getSystemHealth/,/^  }$/' apps/backend/src/modules/dashboard/dashboard.service.ts | grep -c "pg_database_size"
# 기대값: 0  (`storage-health.provider.ts` 만 호출 가능)

# (3) getSystemHealth 본체에서 audit-rejection-proxy 부활
awk '/async getSystemHealth/,/^  }$/' apps/backend/src/modules/dashboard/dashboard.service.ts | grep -cE "schema\\.auditLogs\\.action|inArray.*'reject'.*'cancel'"
# 기대값: 0  (`system-error-event.provider.ts` audit-proxy fallback path 만 사용 가능)

# (4) backend identity 리터럴이 production runtime 에서 strategy/types/dashboard.service 외부 사용 0
grep -rln "'host-disk'\\|'configured-capacity'\\|'pg-database'\\|'pending-work-aggregate'\\|'system-error-events'\\|'audit-rejection-proxy'" apps/backend/src/ --include='*.ts' --exclude='*.spec.ts' --exclude='*.test.ts'
# 기대 결과: provider impl 3 파일 + types.ts 1 파일 (총 4 파일) — 그 외 production 파일 등장 0
```

**위반 시 수정 지시**: `SystemHealthProvider` 인터페이스 (`apps/backend/src/common/system-health/contract.ts`) 를 통한 strategy 호출로 전환.
Symbol DI 토큰 (`STORAGE_HEALTH_PROVIDER` 등) 으로 inject 받아 `await provider.read()` 사용.


### Step 61 — `EquipmentTabFooterLink` SSOT — 4 도메인 footer 인라인 className 회귀 차단

**배경** (2026-05-09 phase-c-followup-closure r3): 4 tab(`CalibrationHistoryTab` / `MaintenanceHistoryTab` / `CalibrationFactorsTab` /
`IncidentHistoryTab`) 의 footer "전체 보기" 링크는 동일 className + Link + ArrowRight 패턴 5회 출현 → `EquipmentTabFooterLink` 단일 컴포넌트로 결빙.
새 tab 추가 시 인라인 패턴 부활 회귀 차단 + 디자인 토큰/className 변경 시 단일 진입점 보장.

**검증 명령** (footer 인라인 className 0건 — 신규 정의 파일 자체는 제외):

```bash
# (1) equipment 도메인 tab 컴포넌트에서 footer 인라인 className 0건
#     EquipmentTabFooterLink.tsx 자체 정의는 제외 (--exclude)
grep -rn "flex justify-end pt-3 border-t mt-3" apps/frontend/components/equipment --include="*.tsx" --exclude="EquipmentTabFooterLink.tsx"
# 기대값: 0 (4 tab 모두 EquipmentTabFooterLink 컴포넌트 호출로 대체)

# (2) equipment 도메인 외부에서 동일 footer 패턴 사용 시 도메인 wrapper 신설 또는 generic 추출 권고 (탐지만, 자동 FAIL 아님)
grep -rn "flex justify-end pt-3 border-t mt-3" apps/frontend/components --include="*.tsx" | grep -v "components/equipment"
# 결과 ≥ 1 시: 도메인 wrapper(`<Domain>TabFooterLink`) 신설 vs generic 컴포넌트 추출 트레이드오프 검토
```

**위반 시 수정 지시**: 인라인 footer JSX → `<EquipmentTabFooterLink href={FRONTEND_ROUTES.EQUIPMENT.X(id)} label={t('...')} />` 컴포넌트 호출로 교체.
generic 컴포넌트 (다른 도메인) 추출은 4+ 도메인 출현 시 trigger.


### Step 62 — `EQUIPMENT_STATUS_TONE` exhaustive Record 회귀 차단 (2026-05-12 qr-visual-redesign TASK 2)

**배경**: `packages/shared-constants/src/equipment-status-tone.ts` 에 `EQUIPMENT_STATUS_TONE` 를 신설하고
`as const satisfies Record<EquipmentStatus, EquipmentStatusTone>` 컴파일타임 exhaustive 강제를 도입.
새 `EquipmentStatus` 값 추가 시 본 매핑 누락 → tsc 자동 차단.
회귀 위험: (1) 별도 인라인 tone 매핑 재정의, (2) `StatusBadge` 직접 분기 대체.

**검증 명령:**

```bash
# (1) EQUIPMENT_STATUS_TONE 정의는 shared-constants 단 1곳 (로컬 재정의 0)
grep -rn "EQUIPMENT_STATUS_TONE\s*=" \
  apps/ packages/ --include="*.ts" --include="*.tsx" \
  | grep -v node_modules | grep -v ".next" \
  | grep -v "equipment-status-tone.ts"
# 기대: 0건. 로컬 재정의 발견 시 → shared-constants SSOT import 로 교체.

# (2) satisfies Record<EquipmentStatus, EquipmentStatusTone> 컴파일타임 강제 존재
grep -c "satisfies Record<EquipmentStatus, EquipmentStatusTone>" \
  packages/shared-constants/src/equipment-status-tone.ts
# 기대: ≥ 1

# (3) StatusBadge 가 EQUIPMENT_STATUS_TONE + TONE_TO_SEMANTIC 경유 (직접 switch/if 분기 0)
grep -n "EQUIPMENT_STATUS_TONE\|TONE_TO_SEMANTIC" \
  apps/frontend/components/ui/StatusBadge.tsx
# 기대: 2건 이상 (import + 사용)

# (4) inline tone switch 회귀 탐지 — StatusBadge 내 직접 EquipmentStatus 리터럴 비교
awk '/function StatusBadge/,/^}$/' apps/frontend/components/ui/StatusBadge.tsx \
  | grep -E "'available'|'checked_out'|'non_conforming'|'spare'|'pending_disposal'|'disposed'|'temporary'|'inactive'"
# 기대: 0건
```

**PASS:** SSOT import 1건 + satisfies 강제 + StatusBadge TONE_TO_SEMANTIC 경유.
**FAIL:** 로컬 재정의 발견 또는 StatusBadge 내 inline 분기 발견.


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
