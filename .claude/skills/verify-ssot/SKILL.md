---
name: verify-ssot
description: SSOT(Single Source of Truth) 임포트 패턴을 검증합니다. 타입/enum/상수 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 패키지명]'
---

# SSOT 임포트 패턴 검증

## Purpose

타입, enum, 상수가 올바른 패키지에서 임포트되는지 검증합니다:

1. **Enum/타입 임포트** — `UserRole`, `EquipmentStatus`, `CheckoutStatus` 등은 `@equipment-management/schemas`에서 임포트
2. **Permission 임포트** — `Permission` enum은 `@equipment-management/shared-constants`에서 임포트
3. **API 엔드포인트 임포트** — `API_ENDPOINTS`는 `@equipment-management/shared-constants`에서 임포트
4. **로컬 재정의 금지** — 패키지에 정의된 타입을 로컬에서 재정의하지 않음
5. **Query Keys 팩토리** — `queryKeys`는 `lib/api/query-config.ts`에서 임포트
6. **Icon Library 통합** — lucide-react 표준 준수, react-icons 등 deprecated library 제거

## When to Run

- 새로운 enum이나 타입을 추가한 후
- import 경로를 변경한 후
- 새로운 모듈/컴포넌트를 추가한 후
- 패키지 간 타입 의존성 변경 후

## Related Files

| File                                               | Purpose                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/schemas/src/enums.ts`                    | SSOT enum 정의 (EquipmentStatus, CheckoutStatus 등)                 |
| `packages/schemas/src/user.ts`                     | UserRole 타입 정의                                                  |
| `packages/schemas/src/settings.ts`                 | SSOT 설정 타입/기본값 (SystemSettings, DisplayPreferences)          |
| `packages/schemas/src/audit-log.ts`                | SSOT 감사 로그 타입 (AuditAction, AuditEntityType, AuditLogDetails) |
| `packages/schemas/src/field-labels.ts`             | SSOT 필드 라벨 (FIELD_LABELS, getFieldLabel)                        |
| `packages/schemas/src/index.ts`                    | schemas 패키지 내보내기                                             |
| `packages/shared-constants/src/permissions.ts`     | Permission enum 정의                                                |
| `packages/shared-constants/src/api-endpoints.ts`   | API_ENDPOINTS 상수                                                  |
| `packages/shared-constants/src/entity-routes.ts`   | SSOT 엔티티 라우팅 (ENTITY_ROUTES, getEntityRoute)                  |
| `packages/shared-constants/src/index.ts`           | shared-constants 패키지 내보내기                                    |
| `apps/frontend/lib/api/query-config.ts`            | queryKeys 팩토리                                                    |
| `apps/frontend/components/dashboard/StatsCard.tsx` | lucide-react 타입 참조 (LucideIcon)                                 |

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
# 로컬 AuditAction 재정의 탐지
grep -rn "type AuditAction\s*=\|enum AuditAction" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 AuditEntityType 재정의 탐지
grep -rn "type AuditEntityType\s*=\|enum AuditEntityType" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 FIELD_LABELS 재정의 탐지
grep -rn "FIELD_LABELS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 ENTITY_ROUTES 재정의 탐지
grep -rn "ENTITY_ROUTES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (모든 핵심 타입은 패키지에서 임포트).

**FAIL 기준:** 로컬 타입 정의가 발견되면 패키지 임포트로 변경 필요.

### Step 2: Permission 임포트 소스 확인

Permission이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# Permission import 중 shared-constants가 아닌 소스 탐지
grep -rn "import.*Permission" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** 로컬 Permission 정의나 다른 패키지에서의 임포트가 발견되면 위반.

### Step 3: API_ENDPOINTS 임포트 확인

API 엔드포인트 상수가 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# API_ENDPOINTS import 소스 확인
grep -rn "import.*API_ENDPOINTS" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules"
```

**PASS 기준:** 모든 API_ENDPOINTS 임포트가 `@equipment-management/shared-constants`에서.

### Step 3a: Audit Log 타입 임포트 확인

감사 로그 타입이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# AuditAction, AuditEntityType import 소스 확인 (schemas에서 import해야 함)
grep -rn "import.*\(AuditAction\|AuditEntityType\|AUDIT_ACTION_LABELS\|AUDIT_ENTITY_TYPE_LABELS\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** 모든 Audit 타입 임포트가 `@equipment-management/schemas`에서.

**FAIL 기준:** `@equipment-management/shared-constants`나 로컬에서 임포트 시 위반.

### Step 3b: Field Labels 임포트 확인

필드 라벨이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# FIELD_LABELS, getFieldLabel import 소스 확인 (schemas에서 import해야 함)
grep -rn "import.*\(FIELD_LABELS\|getFieldLabel\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** 모든 필드 라벨 임포트가 `@equipment-management/schemas`에서.

### Step 3c: Entity Routes 임포트 확인

엔티티 라우팅이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# ENTITY_ROUTES, getEntityRoute import 소스 확인 (shared-constants에서 import해야 함)
grep -rn "import.*\(ENTITY_ROUTES\|getEntityRoute\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 모든 엔티티 라우팅 임포트가 `@equipment-management/shared-constants`에서.

### Step 4: 하드코딩된 API 경로 탐지

API 경로가 상수 대신 문자열로 하드코딩되어 있는지 확인합니다.

```bash
# 하드코딩된 API 경로 탐지 (API 클라이언트 파일)
grep -rn "'/api/" apps/frontend/lib/api --include="*.ts" | grep -v "API_ENDPOINTS\|baseURL\|// \|test\|mock"
```

**PASS 기준:** API 클라이언트에서 하드코딩된 경로가 없어야 함 (API_ENDPOINTS 사용).

### Step 5: queryKeys 팩토리 사용 확인

쿼리 키가 팩토리에서 생성되는지 확인합니다.

```bash
# 하드코딩된 queryKey 탐지
grep -rn "queryKey:\s*\['" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|queryKeys\|// "
```

**PASS 기준:** 모든 queryKey가 `queryKeys` 팩토리를 통해 생성.

**FAIL 기준:** `queryKey: ['equipment', 'detail']` 같은 하드코딩 문자열 배열이 발견되면 위반.

### Step 6: Icon Library 통합 확인

프로젝트 표준 icon library(lucide-react) 준수 여부를 확인합니다.

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

**PASS 기준:**

- react-icons 사용 없음 (0개 결과)
- package.json에서 react-icons 의존성 제거
- 모든 icon은 lucide-react에서 임포트

**FAIL 기준:**

- react-icons import 발견 → lucide-react로 변경 필요
- package.json에 react-icons 의존성 존재 → 제거 필요
- 비표준 icon library 사용 → lucide-react로 통합 필요

**표준 패턴:**

```typescript
// ✅ CORRECT - lucide-react 사용
import { Package, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ❌ WRONG - react-icons 사용
import { FiBox, FiCheckCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';
```

## Output Format

```markdown
| #   | 검사                  | 상태      | 상세                                  |
| --- | --------------------- | --------- | ------------------------------------- |
| 1   | 로컬 타입 재정의      | PASS/FAIL | 재정의 위치 목록                      |
| 2   | Permission 임포트     | PASS/FAIL | 잘못된 임포트 위치                    |
| 3   | API_ENDPOINTS 임포트  | PASS/FAIL | 잘못된 임포트 위치                    |
| 3a  | Audit Log 타입 임포트 | PASS/FAIL | 잘못된 임포트 위치                    |
| 3b  | Field Labels 임포트   | PASS/FAIL | 잘못된 임포트 위치                    |
| 3c  | Entity Routes 임포트  | PASS/FAIL | 잘못된 임포트 위치                    |
| 4   | 하드코딩 API 경로     | PASS/FAIL | 하드코딩 위치 목록                    |
| 5   | queryKeys 팩토리      | PASS/FAIL | 하드코딩 queryKey 위치                |
| 6   | Icon Library 통합     | PASS/FAIL | react-icons 사용, 비표준 library 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 전용 상수** — `SITE_OPTIONS`, `CLASSIFICATION_OPTIONS` 등 UI 전용 옵션은 로컬 정의 허용
2. **packages/ 디렉토리 내 정의** — 패키지 자체에서의 타입 정의는 SSOT의 원본이므로 정상
3. **테스트 파일의 mock 타입** — 테스트에서 사용하는 mock 타입 정의는 허용
4. **re-export 파일** — `export type { UserRole } from '@equipment-management/schemas'` 같은 재내보내기는 위반 아님
5. **NestJS Swagger DTO** — 백엔드 응답 DTO에서 Swagger 문서화용 class 정의는 허용 (enum 재정의가 아닌 경우)
6. **백엔드 DTO의 re-export** — `export { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '@equipment-management/schemas'` 같은 re-export는 SSOT 소비자이므로 정상
7. **roles.enum.ts의 TypeScript enum** — 백엔드 호환성을 위한 로컬 enum (SSOT 주석 + re-export 동반 시 면제)
