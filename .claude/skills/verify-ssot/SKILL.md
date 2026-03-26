---
name: verify-ssot
description: SSOT(Single Source of Truth) 임포트 소스를 검증합니다. 타입/enum/상수가 올바른 패키지에서 임포트되는지 확인. 타입/enum 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 패키지명]'
---

# SSOT 임포트 소스 검증

## Purpose

타입, enum, 상수가 올바른 패키지에서 임포트되는지 검증합니다:

1. **Enum/타입 임포트** — `UserRole`, `EquipmentStatus`, `CheckoutStatus` 등은 `@equipment-management/schemas`에서 임포트
2. **Permission 임포트** — `Permission` enum은 `@equipment-management/shared-constants`에서 임포트
3. **API 엔드포인트 임포트** — `API_ENDPOINTS`는 `@equipment-management/shared-constants`에서 임포트
4. **로컬 재정의 금지** — 패키지에 정의된 타입을 로컬에서 재정의하지 않음
5. **Icon Library 통합** — lucide-react 표준 준수, react-icons 등 deprecated library 제거

> **하드코딩 값 탐지(queryKeys, API 경로, 환경변수, 캐시 키 등)는 `/verify-hardcoding`에서 수행합니다.**

## When to Run

- 새로운 enum이나 타입을 추가한 후
- import 경로를 변경한 후
- 새로운 모듈/컴포넌트를 추가한 후
- 패키지 간 타입 의존성 변경 후

## Related Files

핵심 SSOT 패키지 요약 (전체 파일 목록: [references/ssot-file-map.md](references/ssot-file-map.md)):

| Package / Layer | Key Files | SSOT 항목 |
|---|---|---|
| `packages/schemas/` | `enums.ts`, `user.ts`, `errors.ts`, `settings.ts`, `audit-log.ts`, `field-labels.ts`, `validation/messages.ts`, `document.ts` | Enum, 타입, ErrorCode, 설정 기본값, VM 검증 메시지, DocumentType/DocumentJson |
| `packages/shared-constants/` | `permissions.ts`, `api-endpoints.ts`, `data-scope.ts`, `auth-token.ts`, `approval-categories.ts`, `business-rules.ts`, `security.ts`, `entity-routes.ts` | Permission, API 경로, 스코프 정책, 비즈니스 규칙, 엔티티 라우트 |
| `packages/db/` | `schema/audit-logs.ts`, `index.ts` | DB enum 배열, AppDatabase 타입 |
| `packages/shared-constants/` | `test-users.ts` | Test User Constants SSOT (TEST_USERS_BY_TEAM, DEFAULT_ROLE_EMAILS, ALL_TEST_EMAILS) |

## Workflow

### Step 1: 로컬 enum/타입 재정의 탐지

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
# 로컬 FIELD_LABELS / ENTITY_ROUTES 재정의 탐지
grep -rn "FIELD_LABELS\s*=\|ENTITY_ROUTES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 DataScopeType / resolveDataScope / PERMISSION_CATEGORIES 재정의 탐지
grep -rn "type DataScopeType\s*=\|AUDIT_LOG_SCOPE\s*=\|resolveDataScope\s*=\|PERMISSION_CATEGORIES\s*[=:]" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (모든 핵심 타입은 패키지에서 임포트).

**FAIL 기준:** 로컬 타입 정의가 발견되면 패키지 임포트로 변경 필요.

### Step 2: Permission 임포트 소스 확인

```bash
# Permission import 중 shared-constants가 아닌 소스 탐지
grep -rn "import.*Permission" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 0개 결과.

### Step 3: 패키지별 임포트 소스 확인

```bash
# API_ENDPOINTS import 소스 확인
grep -rn "import.*API_ENDPOINTS" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules"
```

#### Step 3a: Audit Log 타입 임포트

```bash
grep -rn "import.*\(AuditAction\|AuditEntityType\|AUDIT_ACTION_LABELS\|AUDIT_ENTITY_TYPE_LABELS\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

#### Step 3b: Field Labels 임포트

```bash
grep -rn "import.*\(FIELD_LABELS\|getFieldLabel\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

#### Step 3c: Entity Routes 임포트

```bash
grep -rn "import.*\(ENTITY_ROUTES\|getEntityRoute\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

#### Step 3d: Data Scope 임포트

```bash
grep -rn "import.*\(DataScopeType\|resolveDataScope\|AUDIT_LOG_SCOPE\|FeatureScopePolicy\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

#### Step 3e: Audit Log SSOT 상수 임포트

```bash
grep -rn "import.*\(AUDIT_TO_ACTIVITY_TYPE\|RENTAL_ACTIVITY_TYPE_OVERRIDES\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** Steps 3-3e 모두 0개 결과.

### Step 4: Icon Library 통합 확인

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

### Step 5: AppDatabase SSOT 타입 사용 확인

```bash
# NodePgDatabase 직접 import 탐지 (packages/db 제외)
grep -rn "import.*NodePgDatabase" apps/backend/src --include="*.ts" | grep -v "node_modules\|packages/db"
```

**PASS 기준:** 0개 결과 (모든 서비스가 `AppDatabase` from `@equipment-management/db` 사용).

### Step 6: ApiResponse 로컬 재정의 탐지

```bash
grep -rn "interface ApiResponse\b\|type ApiResponse\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (`ApiResponse`는 `@equipment-management/schemas`에서 import).

### Step 7: APPROVAL_KPI 임포트 소스 확인

```bash
grep -rn "APPROVAL_KPI" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management/shared-constants\|approval-kpi\.ts\|// "
```

**PASS 기준:** 모든 `APPROVAL_KPI` import가 `@equipment-management/shared-constants`에서.

### Step 8: 신규 shared-constants SSOT 임포트 확인

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

### Step 9: DB Enum 배열 SSOT 참조 확인

`pgEnum`과 `varchar + $type<>()` 모두 enum 값 배열을 `@equipment-management/schemas`에서 import해야 합니다. DB 스키마에 하드코딩된 enum 배열이 있으면 SSOT 불일치가 발생합니다.

```bash
# DB 스키마에서 하드코딩된 enum 배열 탐지 (schemas import 없이 직접 선언)
grep -rn "pgEnum\|varchar.*\$type" packages/db/src/schema --include="*.ts" -B 2 | grep "const.*=\s*\[" | grep -v "@equipment-management/schemas\|import\|// "
```

```bash
# DB 스키마 파일에서 schemas 패키지 import 확인
grep -rn "from '@equipment-management/schemas'" packages/db/src/schema --include="*.ts"
```

**PASS 기준:** 모든 DB enum 배열(`pgEnum` 인자, `$type<>()` 체크 값)이 `@equipment-management/schemas`의 enum 값 배열을 참조.

**FAIL 기준:** DB 스키마에 `['available', 'in_use', ...]` 같은 하드코딩 배열 → schemas enum 값 변경 시 DB와 불일치.

### Step 10: REJECTION_STAGE_VALUES SSOT 사용 확인

```bash
grep -rn "rejectionStage\s*=\s*\[" packages/db/src apps/backend/src --include="*.ts" | grep -v "node_modules\|// "
```

```bash
grep -rn "REJECTION_STAGE_VALUES" packages/db/src apps/backend/src --include="*.ts" | grep -v "node_modules\|// "
```

**PASS 기준:** `rejectionStage` 배열이 `REJECTION_STAGE_VALUES`를 참조 (직접 `['review', 'approval']` 선언 없음).

### Step 11: VM (Validation Messages) 임포트 소스 확인

DTO 파일에서 `VM` 상수가 올바른 패키지(`@equipment-management/schemas`)에서 import 되는지 확인합니다.

```bash
# VM import 중 @equipment-management/schemas가 아닌 소스 탐지
grep -rn "import.*\bVM\b" apps/backend/src/modules --include="*.dto.ts" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

```bash
# VM 로컬 재정의 탐지
grep -rn "const VM\s*=\|export const VM\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|validation/messages\.ts\|// "
```

**PASS 기준:** 모든 `VM` import가 `@equipment-management/schemas`에서 유래. 로컬 재정의 0개.

**FAIL 기준:** VM을 로컬에서 재정의하거나 잘못된 패키지에서 import → SSOT 불일치.

### Step 12: Test User Constants SSOT 임포트 확인

`TEST_USERS_BY_TEAM`, `DEFAULT_ROLE_EMAILS`, `ALL_TEST_EMAILS`를 로컬에서 재정의하는지 탐지합니다.

```bash
# Test User 상수 로컬 재정의 탐지
grep -rn "TEST_USERS_BY_TEAM\s*=\|DEFAULT_ROLE_EMAILS\s*=\|ALL_TEST_EMAILS\s*=" apps/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|test-users\.ts\|import\|// "
```

**PASS 기준:** 0개 결과 (모든 Test User 상수가 `@equipment-management/shared-constants`에서 import).

**FAIL 기준:** `apps/` 디렉토리에서 `TEST_USERS_BY_TEAM`, `DEFAULT_ROLE_EMAILS`, `ALL_TEST_EMAILS`를 로컬 재정의하면 위반. `test-users.ts` 자체와 import 구문은 예외.

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
| 4   | Icon Library 통합             | PASS/FAIL | react-icons 사용, 비표준 library 위치  |
| 5   | AppDatabase SSOT 타입         | PASS/FAIL | NodePgDatabase 직접 import 위치        |
| 6   | ApiResponse 로컬 재정의       | PASS/FAIL | packages/ 외 ApiResponse 정의 위치     |
| 7   | APPROVAL_KPI 임계값           | PASS/FAIL | 하드코딩 임계값/잘못된 import 위치     |
| 8   | 신규 shared-constants SSOT    | PASS/FAIL | APPROVAL_CATEGORIES/BUSINESS_RULES 등  |
| 9   | DB Enum 배열 SSOT 참조        | PASS/FAIL | 하드코딩 enum 배열 위치                |
| 10  | REJECTION_STAGE_VALUES SSOT   | PASS/FAIL | rejectionStage 로컬 선언 위치          |
| 11  | VM 임포트 소스                | PASS/FAIL | 잘못된 VM import 위치                  |
| 12  | Test User Constants SSOT      | PASS/FAIL | 로컬 재정의 위치                       |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS: { value: Site, label: string }[]`, `CLASSIFICATION_OPTIONS` 등 레이블+값 쌍의 UI 표시용 객체 배열은 로컬 정의 허용. 단, 순수 값 배열(`SITE_VALUES: Site[]`)은 `@equipment-management/schemas`에서 import 필수.
2. **packages/ 디렉토리 내 정의** — 패키지 자체에서의 타입 정의는 SSOT의 원본이므로 정상
3. **테스트 파일의 mock 타입** — 테스트에서 사용하는 mock 타입 정의는 허용
4. **re-export 파일** — `export type { UserRole } from '@equipment-management/schemas'` 같은 재내보내기는 위반 아님
5. **NestJS Swagger DTO** — 백엔드 응답 DTO에서 Swagger 문서화용 class 정의는 허용 (enum 재정의가 아닌 경우)
6. **백엔드 DTO의 re-export** — `export { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '@equipment-management/schemas'` 같은 re-export는 SSOT 소비자이므로 정상
7. **roles.enum.ts의 TypeScript enum** — 백엔드 호환성을 위한 로컬 enum (SSOT 주석 + re-export 동반 시 면제)
8. **`Promise<unknown>` 허용 케이스** — `private` 헬퍼 메서드(클래스 내부 전용)나 단순 delete/count 반환은 면제. `Promise<unknown>`은 `/verify-hardcoding` Step 3에서 검증
