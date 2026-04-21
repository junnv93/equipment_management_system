# SSOT 검증 상세 체크리스트

## Step 1: 로컬 enum/타입 재정의 탐지

패키지에 정의된 핵심 타입이 로컬에서 재정의되는지 확인합니다.

```bash
# 로컬 UserRole 재정의 탐지
grep -rn "type UserRole\s*=\|enum UserRole\|interface UserRole" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 EquipmentStatus 재정의 탐지
grep -rn "type EquipmentStatus\s*=\|enum EquipmentStatus" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 CheckoutStatus 재정의 탐지
grep -rn "type CheckoutStatus\s*=\|enum CheckoutStatus" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 SystemSettings/DisplayPreferences 재정의 탐지
grep -rn "interface SystemSettings\b\|type SystemSettings\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 DEFAULT_SYSTEM_SETTINGS/DEFAULT_DISPLAY_PREFERENCES 재정의 탐지
grep -rn "DEFAULT_SYSTEM_SETTINGS\s*=\|DEFAULT_DISPLAY_PREFERENCES\s*=\|DEFAULT_CALIBRATION_ALERT_DAYS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 AuditLogFilter 재정의 탐지
grep -rn "interface AuditLogFilter\b\|type AuditLogFilter\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|export type {\|// "
```

```bash
# 로컬 AuditAction / AuditEntityType 재정의 탐지
grep -rn "type AuditAction\s*=\|enum AuditAction\|type AuditEntityType\s*=\|enum AuditEntityType" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 AuditLogUserRole 재정의 탐지 (packages/schemas/src/audit-log.ts 외 선언 금지)
grep -rn "type AuditLogUserRole\s*=" apps/backend/src apps/frontend packages/db --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 FIELD_LABELS / ENTITY_ROUTES 재정의 탐지
grep -rn "FIELD_LABELS\s*=\|ENTITY_ROUTES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# UL-QP-18 양식 라벨 SSOT 로컬 재정의 탐지 (QP18_*_LABELS / EQUIPMENT_AVAILABILITY_LABELS /
# INTERMEDIATE_CHECK_YESNO_LABELS / INSPECTION_JUDGMENT_LABELS / SELF_INSPECTION_RESULT_LABELS)
# 모두 packages/schemas/src/enums/labels.ts SSOT에서 import되어야 함.
# renderer 서비스 파일이 Record<..., '교정기기'|...> 형태로 재선언하면 drift 위험.
grep -rn "QP18_[A-Z_]*_LABELS\s*:\s*Record\|EQUIPMENT_AVAILABILITY_LABELS\s*:\s*Record\|INTERMEDIATE_CHECK_YESNO_LABELS\s*=\|INSPECTION_JUDGMENT_LABELS\s*:\s*Record\|SELF_INSPECTION_RESULT_LABELS\s*:\s*Record" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "packages/schemas\|@equipment-management/schemas\|node_modules\|import\|re-export\|// "
```

```bash
# 로컬 DataScopeType / resolveDataScope / PERMISSION_CATEGORIES 재정의 탐지
grep -rn "type DataScopeType\s*=\|AUDIT_LOG_SCOPE\s*=\|resolveDataScope\s*=\|PERMISSION_CATEGORIES\s*[=:]" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (모든 핵심 타입은 패키지에서 임포트).

**FAIL 기준:** 로컬 타입 정의가 발견되면 패키지 임포트로 변경 필요.

## Step 2: Permission 임포트 소스 확인

```bash
# Permission import 중 shared-constants가 아닌 소스 탐지
grep -rn "import.*Permission" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 0개 결과.

### Step 2a: Client-side `hasRole()` 사용 금지

프론트엔드 컴포넌트는 role 리터럴 기반 권한 체크(`hasRole([...])`) 대신 `can(Permission.X)`를 사용해야 한다. 백엔드 `@RequirePermissions(Permission.X)`와 단일 SSOT를 공유하기 위함이다. 2026-04-08 (커밋 49fb6d7e)에 `useAuth().hasRole`이 제거되었다.

```bash
# 1. useAuth에서 hasRole destructure 탐지 (use-auth.ts 자체 제외)
grep -rnE "useAuth\(\)[^;]*hasRole|\{[^}]*hasRole[^}]*\}\s*=\s*useAuth" \
  apps/frontend/app apps/frontend/components apps/frontend/hooks \
  --include="*.ts" --include="*.tsx" \
  | grep -v "use-auth.ts\|// "
```

```bash
# 2. role 리터럴 배열을 권한 게이트로 사용 탐지 (canCreate/canEdit/canDelete/canApprove 주변)
grep -rnE "(canCreate|canEdit|canDelete|canApprove|canUpdate)\s*=\s*hasRole" \
  apps/frontend/app apps/frontend/components \
  --include="*.ts" --include="*.tsx"
```

**PASS 기준:** 두 명령어 모두 0개 결과.

**예외:**
- `apps/frontend/lib/auth/server-session.ts`의 `hasRole()` — Promise 반환, Server Action 전용 (별도 함수)
- `apps/frontend/hooks/use-auth.ts`의 deprecation 주석
- 테스트 픽스처/스펙에서 role 배열 사용 (인증 컨텍스트 생성용)
- **정당한 role-기반 UI 로직**(role→아이콘/레이블/카테고리 매핑, `URVal`을 Record key로 사용)은 권한 게이트가 **아니므로 허용**. Check 1, 2만 권한 게이트의 실제 드리프트를 탐지한다. 권한을 *결정*하는 코드만 대상.

## Step 3: 패키지별 임포트 소스 확인

```bash
# API_ENDPOINTS import 소스 확인
grep -rn "import.*API_ENDPOINTS" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules"
```

### Step 3a: Audit Log 타입 임포트

```bash
grep -rn "import.*\(AuditAction\|AuditEntityType\|AUDIT_ACTION_LABELS\|AUDIT_ENTITY_TYPE_LABELS\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

### Step 3b: Field Labels 임포트

```bash
grep -rn "import.*\(FIELD_LABELS\|getFieldLabel\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

### Step 3c: Entity Routes 임포트

```bash
grep -rn "import.*\(ENTITY_ROUTES\|getEntityRoute\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

### Step 3d: Data Scope 임포트

```bash
grep -rn "import.*\(DataScopeType\|resolveDataScope\|AUDIT_LOG_SCOPE\|FeatureScopePolicy\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

### Step 3e: Audit Log SSOT 상수 임포트

```bash
grep -rn "import.*\(AUDIT_TO_ACTIVITY_TYPE\|RENTAL_ACTIVITY_TYPE_OVERRIDES\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** Steps 3-3e 모두 0개 결과.

## Step 4: Icon Library 통합 확인

```bash
# react-icons 사용 탐지 (deprecated)
grep -rn "from 'react-icons" apps/frontend --include="*.tsx" --include="*.ts"
```

```bash
# react-icons 의존성 확인
grep "react-icons" apps/frontend/package.json
```

```bash
# lucide-react가 아닌 icon library import 탐지
grep -rn "import.*Icon.*from" apps/frontend --include="*.tsx" --include="*.ts" | grep -v "lucide-react\|@radix-ui\|next/\|react\|// \|type\|node_modules"
```

**PASS 기준:** react-icons 0개 + 비표준 icon library 0개.

## Step 5: AppDatabase SSOT 타입 사용 확인

```bash
# NodePgDatabase 직접 import 탐지 (packages/db 제외)
grep -rn "import.*NodePgDatabase" apps/backend/src --include="*.ts" | grep -v "node_modules\|packages/db"
```

**PASS 기준:** 0개 결과 (모든 서비스가 `AppDatabase` from `@equipment-management/db` 사용).

## Step 6: ApiResponse 로컬 재정의 탐지

```bash
grep -rn "interface ApiResponse\b\|type ApiResponse\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (`ApiResponse`는 `@equipment-management/schemas`에서 import).

## Step 7: APPROVAL_KPI 임포트 소스 확인

```bash
grep -rn "APPROVAL_KPI" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management/shared-constants\|approval-kpi\.ts\|// "
```

**PASS 기준:** 모든 `APPROVAL_KPI` import가 `@equipment-management/shared-constants`에서.

## Step 8: 신규 shared-constants SSOT 임포트 확인

```bash
# APPROVAL_CATEGORIES 로컬 재정의 탐지
grep -rn "APPROVAL_CATEGORIES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|approval-categories\.ts\|@equipment-management\|import\|re-export\|// "
```

```bash
# BUSINESS_RULES 로컬 재정의 탐지
grep -rn "BUSINESS_RULES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|business-rules\.ts\|@equipment-management\|import\|re-export\|// "
```

```bash
# NOTIFICATION_CONFIG 로컬 재정의 탐지
grep -rn "NOTIFICATION_CONFIG\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|notification-config\.ts\|@equipment-management\|import\|re-export\|// "
```

```bash
# SECURITY 상수 로컬 재정의 탐지
grep -rn "MAX_LOGIN_ATTEMPTS\s*=\|LOCK_DURATION_MS\s*=\|ATTEMPT_WINDOW_MS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|security\.ts\|@equipment-management\|import\|re-export\|// "
```

```bash
# SECURITY import 소스 확인
grep -rn "import.*SECURITY\b" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 0개 결과.

## Step 9: DB Enum 배열 SSOT 참조 확인

`pgEnum`과 `varchar + $type<>()` 모두 enum 값 배열을 `@equipment-management/schemas`에서 import해야 합니다. DB 스키마에 하드코딩된 enum 배열이 있으면 SSOT 불일치가 발생합니다.

```bash
# DB 스키마에서 하드코딩된 enum 배열 탐지 (schemas import 없이 직접 선언)
grep -rn "pgEnum\|varchar.*\$type" packages/db/src/schema --include="*.ts" -B 2 | grep "const.*=\s*\[" | grep -v "@equipment-management/schemas\|import\|// "
```

```bash
# DB 스키마 파일에서 schemas 패키지 import 확인
grep -rn "from '@equipment-management/schemas'" packages/db/src/schema --include="*.ts"
```

**PASS 기준:** 모든 DB enum 배열이 `@equipment-management/schemas`의 enum 값 배열을 참조.

**FAIL 기준:** DB 스키마에 `['available', 'in_use', ...]` 같은 하드코딩 배열.

## Step 10: REJECTION_STAGE_VALUES SSOT 사용 확인

```bash
grep -rn "rejectionStage\s*=\s*\[" packages/db/src apps/backend/src --include="*.ts" | grep -v "node_modules\|// "
```

```bash
grep -rn "REJECTION_STAGE_VALUES" packages/db/src apps/backend/src --include="*.ts" | grep -v "node_modules\|// "
```

**PASS 기준:** `rejectionStage` 배열이 `REJECTION_STAGE_VALUES`를 참조 (직접 선언 없음).

## Step 11: VM (Validation Messages) 임포트 소스 확인

DTO 파일에서 `VM` 상수가 올바른 패키지에서 import 되는지 확인합니다.

```bash
# VM import 중 @equipment-management/schemas가 아닌 소스 탐지
grep -rn "import.*\bVM\b" apps/backend/src/modules --include="*.dto.ts" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

```bash
# VM 로컬 재정의 탐지
grep -rn "const VM\s*=\|export const VM\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|validation/messages\.ts\|// "
```

**PASS 기준:** 모든 `VM` import가 `@equipment-management/schemas`에서 유래. 로컬 재정의 0개.

## Step 12: Test User Constants SSOT 임포트 확인

```bash
# Test User 상수 로컬 재정의 탐지
grep -rn "TEST_USERS_BY_TEAM\s*=\|DEFAULT_ROLE_EMAILS\s*=\|ALL_TEST_EMAILS\s*=" apps/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|test-users\.ts\|import\|// "
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** `apps/` 디렉토리에서 로컬 재정의하면 위반. `test-users.ts` 자체와 import 구문은 예외.

## Step 13: DocumentTypeValues SSOT 임포트 확인

문서 타입 값을 문자열 하드코딩 대신 `DocumentTypeValues` 상수를 사용하는지 확인합니다.
SSOT: `packages/schemas/src/document.ts`의 `DocumentTypeValues` (12개 값).

```bash
# DocumentType 문자열 하드코딩 탐지 (DocumentTypeValues 미사용) — 12개 모든 값 커버
grep -rn "'calibration_certificate'\|'raw_data'\|'inspection_report'\|'history_card'\|'equipment_photo'\|'equipment_manual'\|'validation_vendor_attachment'\|'validation_test_data'\|'inspection_photo'\|'inspection_graph'\|'measurement_data'" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "DocumentTypeValues\|DOCUMENT_TYPE_VALUES\|document\.ts\|node_modules\|// \|test\|\.spec\.\|as const"
```

**PASS 기준:** 0개 결과 (모든 document type이 `DocumentTypeValues.*` 사용).

**FAIL 기준:** 문자열 리터럴로 document type 사용 시 교체 필요.

**주의:** `'other'`는 너무 일반적이어서 grep 오탐 위험 — 제외. 코드 리뷰에서 수동 확인.

## Step 23: DocxTemplate 레거시 barrel 경로 탐지 (2026-04-21 추가)

`apps/backend/src/common/docx/docx-template.util.ts`가 DocxTemplate canonical 경로.
`reports/docx-template.util` barrel 경유 import는 레거시 경로 — `common/docx/` 직접 import로 교체 필요.

```bash
# DocxTemplate 레거시 barrel 경로 사용 탐지
grep -rn "from '.*reports/docx-template.util'" apps/backend/src --include="*.ts" \
  | grep -v "reports/docx-template.util.ts"
# 결과: 0건 (canonical 경로 사용)
```

**PASS 기준:** 0건. `reports/` 모듈 자체의 re-export 파일(`reports/docx-template.util.ts`)은 예외.

**FAIL 기준:** inspection renderer 등 도메인 파일이 `../../reports/docx-template.util` 경로 사용 시
`../../../common/docx/docx-template.util`로 교체.

**현재 알려진 부채:** `self-inspection-renderer.service.ts`, `intermediate-inspection-renderer.service.ts`
— 트리거: inspection renderer 수정 시.
