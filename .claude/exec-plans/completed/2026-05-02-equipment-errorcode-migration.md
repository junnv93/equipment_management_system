# Exec Plan: Equipment ErrorCode SSOT Migration + E2E Integration Spec

Date: 2026-05-02
Slug: equipment-errorcode-migration
Contract: .claude/contracts/equipment-errorcode-migration.md

---

## 현황 요약

- **인라인 에러 코드**: 51건 실제 (주석 제외)
- **대상 파일**: 5개 서비스 파일 (disposal.service.ts는 이미 격상 완료)
- **신규 ErrorCode enum 멤버**: 28개

---

## Phase 1: ErrorCode enum 확장

**Target file:** `packages/schemas/src/errors.ts`

기존 `// 장비 관련 에러` 섹션 하단에 신규 멤버 추가:

### 장비 서비스 신규 코드 (equipment.service.ts)
- `EquipmentInvalidCalibrationDue = 'EQUIPMENT_INVALID_CALIBRATION_DUE'` → 400
- `EquipmentInvalidCalibrationDueAfter = 'EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER'` → 400
- `EquipmentManagerNotFound = 'EQUIPMENT_MANAGER_NOT_FOUND'` → 400
- `EquipmentManagerRoleInsufficient = 'EQUIPMENT_MANAGER_ROLE_INSUFFICIENT'` → 400
- `EquipmentManagerSiteMismatch = 'EQUIPMENT_MANAGER_SITE_MISMATCH'` → 400
- `EquipmentManagementNumberDuplicate = 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE'` → 409
- `EquipmentSiteRequired = 'EQUIPMENT_SITE_REQUIRED'` → 400
- `EquipmentCalibrationOverdueStatusBlock = 'EQUIPMENT_CALIBRATION_OVERDUE_STATUS_BLOCK'` → 400

### 승인 서비스 신규 코드 (equipment-approval.service.ts)
- `EquipmentRequestCreateFailed = 'EQUIPMENT_REQUEST_CREATE_FAILED'` → 500
- `EquipmentRequestUpdateFailed = 'EQUIPMENT_REQUEST_UPDATE_FAILED'` → 500
- `EquipmentRequestDeleteFailed = 'EQUIPMENT_REQUEST_DELETE_FAILED'` → 500
- `EquipmentRequestNoViewPermission = 'EQUIPMENT_REQUEST_NO_VIEW_PERMISSION'` → 403
- `EquipmentRequestListFailed = 'EQUIPMENT_REQUEST_LIST_FAILED'` → 500
- `EquipmentRequestNoEquipmentId = 'EQUIPMENT_REQUEST_NO_EQUIPMENT_ID'` → 400
- `EquipmentRequestNotFound = 'EQUIPMENT_REQUEST_NOT_FOUND'` → 404
- `EquipmentRequestFetchFailed = 'EQUIPMENT_REQUEST_FETCH_FAILED'` → 500
- `EquipmentRequestNoApprovePermission = 'EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION'` → 403
- `EquipmentRequestAlreadyProcessed = 'EQUIPMENT_REQUEST_ALREADY_PROCESSED'` → 409
- `EquipmentRequestSelfApprovalForbidden = 'EQUIPMENT_REQUEST_SELF_APPROVAL_FORBIDDEN'` → 403
- `EquipmentRequestTeamScopeViolation = 'EQUIPMENT_REQUEST_TEAM_SCOPE_VIOLATION'` → 403
- `EquipmentRequestApproveFailed = 'EQUIPMENT_REQUEST_APPROVE_FAILED'` → 500
- `EquipmentRequestNoRejectPermission = 'EQUIPMENT_REQUEST_NO_REJECT_PERMISSION'` → 403
- `EquipmentRequestRejectionReasonRequired = 'EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED'` → 400
- `EquipmentRequestSelfRejectionForbidden = 'EQUIPMENT_REQUEST_SELF_REJECTION_FORBIDDEN'` → 403
- `EquipmentRequestRejectFailed = 'EQUIPMENT_REQUEST_REJECT_FAILED'` → 500

### 이력/첨부 신규 코드
- `HistoryNotFound = 'HISTORY_NOT_FOUND'` → 404
- `NcInvalidIncidentType = 'NC_INVALID_INCIDENT_TYPE'` → 400
- `RepairHistoryNotFound = 'REPAIR_HISTORY_NOT_FOUND'` → 404
- `AttachmentNotFound = 'ATTACHMENT_NOT_FOUND'` → 404

### 재사용 (신규 추가 불필요)
- `'EQUIPMENT_NOT_FOUND'` → `ErrorCode.EquipmentNotFound` (이미 존재)
- `'USER_NOT_FOUND'` → `ErrorCode.UserNotFound` (이미 존재)
- `'DUPLICATE_MANAGEMENT_NUMBER'` ≠ `'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE'` (값 다름, 별도 추가 필요)

**Phase 1 검증:**
```bash
pnpm --filter backend run tsc --noEmit
# errorCodeToStatusCode Record가 모든 enum 멤버를 커버하는지 자동 검증
```

---

## Phase 2: Backend 서비스 5개 파일 마이그레이션

**패턴 규칙** (disposal.service.ts 참조):
1. `from '@equipment-management/schemas'` import에 `ErrorCode` 추가
2. `code: 'INLINE_STRING'` → `code: ErrorCode.PascalCase` 치환
3. NestJS 예외 클래스(NotFoundException 등) 변경 없음

### 2-A: equipment.service.ts (12건)
**File:** `apps/backend/src/modules/equipment/equipment.service.ts`

| 인라인 코드 | ErrorCode 멤버 |
|---|---|
| `'EQUIPMENT_INVALID_CALIBRATION_DUE'` | `ErrorCode.EquipmentInvalidCalibrationDue` |
| `'EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER'` | `ErrorCode.EquipmentInvalidCalibrationDueAfter` |
| `'EQUIPMENT_MANAGER_NOT_FOUND'` | `ErrorCode.EquipmentManagerNotFound` |
| `'EQUIPMENT_MANAGER_ROLE_INSUFFICIENT'` | `ErrorCode.EquipmentManagerRoleInsufficient` |
| `'EQUIPMENT_MANAGER_SITE_MISMATCH'` | `ErrorCode.EquipmentManagerSiteMismatch` |
| `'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE'` (2건) | `ErrorCode.EquipmentManagementNumberDuplicate` |
| `'EQUIPMENT_SITE_REQUIRED'` | `ErrorCode.EquipmentSiteRequired` |
| `'EQUIPMENT_NOT_FOUND'` (3건) | `ErrorCode.EquipmentNotFound` |
| `'EQUIPMENT_CALIBRATION_OVERDUE_STATUS_BLOCK'` | `ErrorCode.EquipmentCalibrationOverdueStatusBlock` |

### 2-B: equipment-approval.service.ts (28건)
**File:** `apps/backend/src/modules/equipment/services/equipment-approval.service.ts`

| 인라인 코드 | ErrorCode 멤버 |
|---|---|
| `'USER_NOT_FOUND'` (3건) | `ErrorCode.UserNotFound` |
| `'EQUIPMENT_NOT_FOUND'` (3건) | `ErrorCode.EquipmentNotFound` |
| `'EQUIPMENT_REQUEST_CREATE_FAILED'` | `ErrorCode.EquipmentRequestCreateFailed` |
| `'EQUIPMENT_REQUEST_UPDATE_FAILED'` | `ErrorCode.EquipmentRequestUpdateFailed` |
| `'EQUIPMENT_REQUEST_DELETE_FAILED'` | `ErrorCode.EquipmentRequestDeleteFailed` |
| `'EQUIPMENT_REQUEST_NO_VIEW_PERMISSION'` | `ErrorCode.EquipmentRequestNoViewPermission` |
| `'EQUIPMENT_REQUEST_LIST_FAILED'` | `ErrorCode.EquipmentRequestListFailed` |
| `'EQUIPMENT_REQUEST_NO_EQUIPMENT_ID'` | `ErrorCode.EquipmentRequestNoEquipmentId` |
| `'EQUIPMENT_REQUEST_NOT_FOUND'` | `ErrorCode.EquipmentRequestNotFound` |
| `'EQUIPMENT_REQUEST_FETCH_FAILED'` | `ErrorCode.EquipmentRequestFetchFailed` |
| `'EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION'` | `ErrorCode.EquipmentRequestNoApprovePermission` |
| `'EQUIPMENT_REQUEST_ALREADY_PROCESSED'` (2건) | `ErrorCode.EquipmentRequestAlreadyProcessed` |
| `'EQUIPMENT_REQUEST_SELF_APPROVAL_FORBIDDEN'` | `ErrorCode.EquipmentRequestSelfApprovalForbidden` |
| `'EQUIPMENT_REQUEST_TEAM_SCOPE_VIOLATION'` (2건) | `ErrorCode.EquipmentRequestTeamScopeViolation` |
| `'EQUIPMENT_REQUEST_APPROVE_FAILED'` | `ErrorCode.EquipmentRequestApproveFailed` |
| `'EQUIPMENT_REQUEST_NO_REJECT_PERMISSION'` | `ErrorCode.EquipmentRequestNoRejectPermission` |
| `'EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED'` | `ErrorCode.EquipmentRequestRejectionReasonRequired` |
| `'EQUIPMENT_REQUEST_SELF_REJECTION_FORBIDDEN'` | `ErrorCode.EquipmentRequestSelfRejectionForbidden` |
| `'EQUIPMENT_REQUEST_REJECT_FAILED'` | `ErrorCode.EquipmentRequestRejectFailed` |

### 2-C: equipment-history.service.ts (5건 inline, 2건 주석 — 주석은 변경 없음)
**File:** `apps/backend/src/modules/equipment/services/equipment-history.service.ts`

| 인라인 코드 | ErrorCode 멤버 |
|---|---|
| `'EQUIPMENT_NOT_FOUND'` (2건) | `ErrorCode.EquipmentNotFound` |
| `'HISTORY_NOT_FOUND'` (3건) | `ErrorCode.HistoryNotFound` |
| `'NC_INVALID_INCIDENT_TYPE'` | `ErrorCode.NcInvalidIncidentType` |

주의: 줄 189의 `// (code: 'VERSION_CONFLICT')` 주석은 변경 불필요

### 2-D: repair-history.service.ts (3건)
**File:** `apps/backend/src/modules/equipment/services/repair-history.service.ts`

| 인라인 코드 | ErrorCode 멤버 |
|---|---|
| `'EQUIPMENT_NOT_FOUND'` | `ErrorCode.EquipmentNotFound` |
| `'REPAIR_HISTORY_NOT_FOUND'` (2건) | `ErrorCode.RepairHistoryNotFound` |

### 2-E: equipment-attachment.service.ts (1건)
**File:** `apps/backend/src/modules/equipment/services/equipment-attachment.service.ts`

| 인라인 코드 | ErrorCode 멤버 |
|---|---|
| `'ATTACHMENT_NOT_FOUND'` | `ErrorCode.AttachmentNotFound` |

**Phase 2 검증:**
```bash
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/equipment/equipment.service.ts \
  apps/backend/src/modules/equipment/services/equipment-approval.service.ts \
  apps/backend/src/modules/equipment/services/equipment-history.service.ts \
  apps/backend/src/modules/equipment/services/repair-history.service.ts \
  apps/backend/src/modules/equipment/services/equipment-attachment.service.ts
# 목표: 0 hits

pnpm --filter backend run tsc --noEmit
```

---

## Phase 3: Frontend mapper 업데이트

**Target file:** `apps/frontend/lib/errors/equipment-errors.ts`
**Function:** `mapBackendErrorCode` 내 `mappings` 객체

신규 항목 추가 (도메인 그룹별 정렬 유지):

**장비 서비스 그룹:**
```
EQUIPMENT_INVALID_CALIBRATION_DUE → EquipmentErrorCode.VALIDATION_ERROR
EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER → EquipmentErrorCode.VALIDATION_ERROR
EQUIPMENT_MANAGER_NOT_FOUND → EquipmentErrorCode.NOT_FOUND
EQUIPMENT_MANAGER_ROLE_INSUFFICIENT → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_MANAGER_SITE_MISMATCH → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE → EquipmentErrorCode.DUPLICATE_MANAGEMENT_NUMBER
EQUIPMENT_SITE_REQUIRED → EquipmentErrorCode.VALIDATION_ERROR
EQUIPMENT_CALIBRATION_OVERDUE_STATUS_BLOCK → EquipmentErrorCode.VALIDATION_ERROR
```

**승인 서비스 그룹:**
```
EQUIPMENT_REQUEST_CREATE_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_UPDATE_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_DELETE_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_NO_VIEW_PERMISSION → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_REQUEST_LIST_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_NO_EQUIPMENT_ID → EquipmentErrorCode.VALIDATION_ERROR
EQUIPMENT_REQUEST_NOT_FOUND → EquipmentErrorCode.NOT_FOUND
EQUIPMENT_REQUEST_FETCH_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_REQUEST_ALREADY_PROCESSED → EquipmentErrorCode.DUPLICATE_ERROR
EQUIPMENT_REQUEST_SELF_APPROVAL_FORBIDDEN → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_REQUEST_TEAM_SCOPE_VIOLATION → EquipmentErrorCode.SCOPE_ACCESS_DENIED
EQUIPMENT_REQUEST_APPROVE_FAILED → EquipmentErrorCode.SERVER_ERROR
EQUIPMENT_REQUEST_NO_REJECT_PERMISSION → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED → EquipmentErrorCode.VALIDATION_ERROR
EQUIPMENT_REQUEST_SELF_REJECTION_FORBIDDEN → EquipmentErrorCode.PERMISSION_DENIED
EQUIPMENT_REQUEST_REJECT_FAILED → EquipmentErrorCode.SERVER_ERROR
```

**이력/첨부 그룹:**
```
HISTORY_NOT_FOUND → EquipmentErrorCode.NOT_FOUND
NC_INVALID_INCIDENT_TYPE → EquipmentErrorCode.VALIDATION_ERROR
REPAIR_HISTORY_NOT_FOUND → EquipmentErrorCode.NOT_FOUND
ATTACHMENT_NOT_FOUND → EquipmentErrorCode.NOT_FOUND
```

**Phase 3 검증:**
```bash
pnpm --filter frontend run tsc --noEmit
```

---

## Phase 4: E2E Integration Spec 신설 (OPTION C)

**New file:** `apps/backend/test/equipment-errorcode-integration.e2e-spec.ts`

참조 패턴: `manager-role-constraint.e2e-spec.ts` (구조), `equipment.e2e-spec.ts` (beforeAll 패턴)

**테스트 구조:**

```
describe('Equipment Domain ErrorCode Integration (e2e)')
  beforeAll: createTestApp() + 필요한 role별 token
  afterAll: cleanupAll + closeTestApp

  describe('장비 생성 유효성 에러')
    it: 잘못된 calibrationDue 형식 → 400 + body.code === 'EQUIPMENT_INVALID_CALIBRATION_DUE'
    it: calibrationDueAfter < calibrationDue → 400 + body.code === 'EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER'
    it: manager가 engineer 역할 → 400 + body.code === 'EQUIPMENT_MANAGER_ROLE_INSUFFICIENT'
    it: manager가 다른 site → 400 + body.code === 'EQUIPMENT_MANAGER_SITE_MISMATCH'
    it: 존재하지 않는 managerId → 400 + body.code === 'EQUIPMENT_MANAGER_NOT_FOUND'
    it: 중복 관리번호 → 400 + body.code === 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE'

  describe('장비 승인 요청 에러')
    it: 권한 없는 역할의 승인 → 403 + body.code === 'EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION'
    it: 이미 처리된 요청 재승인 → 409 + body.code === 'EQUIPMENT_REQUEST_ALREADY_PROCESSED'
    it: 본인 요청 셀프 승인 → 403 + body.code === 'EQUIPMENT_REQUEST_SELF_APPROVAL_FORBIDDEN'
    it: 거부 사유 없는 반려 → 400 + body.code === 'EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED'
    it: 본인 요청 셀프 반려 → 403 + body.code === 'EQUIPMENT_REQUEST_SELF_REJECTION_FORBIDDEN'
    it: 존재하지 않는 request 조회 → 404 + body.code === 'EQUIPMENT_REQUEST_NOT_FOUND'

  describe('이력/첨부 조회 에러')
    it: 존재하지 않는 장비 이력 조회 → 404 + body.code === 'EQUIPMENT_NOT_FOUND'
    it: 존재하지 않는 history UUID → 404 + body.code === 'HISTORY_NOT_FOUND'
    it: 존재하지 않는 repair history UUID → 404 + body.code === 'REPAIR_HISTORY_NOT_FOUND'
    it: 존재하지 않는 attachment UUID → 404 + body.code === 'ATTACHMENT_NOT_FOUND'
```

**Phase 4 검증:**
```bash
pnpm --filter backend run test:e2e -- \
  --testPathPattern="equipment-errorcode-integration" --runInBand
# 목표: 모든 테스트 PASS
```

---

## Phase 5: 최종 검증 + 커밋

**검증 순서:**

```bash
# 1. inline 0건 확인 (verify-zod Step 16 명령 4)
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/equipment/equipment.service.ts \
  apps/backend/src/modules/equipment/services/equipment-approval.service.ts \
  apps/backend/src/modules/equipment/services/equipment-history.service.ts \
  apps/backend/src/modules/equipment/services/repair-history.service.ts \
  apps/backend/src/modules/equipment/services/equipment-attachment.service.ts
# 목표: 0 hits

# 2. TypeScript 전체
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 3. Backend 단위 + E2E
pnpm --filter backend run test
pnpm --filter backend run test:e2e -- --runInBand

# 4. 기존 관련 spec 그린 확인
pnpm --filter backend run test:e2e -- \
  --testPathPattern="manager-role-constraint|equipment-approval" --runInBand
```

**커밋 대상 파일 (8개):**
1. `packages/schemas/src/errors.ts`
2. `apps/backend/src/modules/equipment/equipment.service.ts`
3. `apps/backend/src/modules/equipment/services/equipment-approval.service.ts`
4. `apps/backend/src/modules/equipment/services/equipment-history.service.ts`
5. `apps/backend/src/modules/equipment/services/repair-history.service.ts`
6. `apps/backend/src/modules/equipment/services/equipment-attachment.service.ts`
7. `apps/frontend/lib/errors/equipment-errors.ts`
8. `apps/backend/test/equipment-errorcode-integration.e2e-spec.ts`

---

## 주의사항

1. **manager-role-constraint.e2e-spec.ts 호환성**: 이 spec이 `body.code === 'EQUIPMENT_MANAGER_ROLE_INSUFFICIENT'` 등 리터럴로 검증 중. Phase 1 enum 값이 동일 문자열이므로 런타임 동작 불변 → 기존 테스트 변경 불필요.

2. **EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE vs DUPLICATE_MANAGEMENT_NUMBER**: 값이 다른 별개 코드. 둘 다 frontend mapper에서 `DUPLICATE_MANAGEMENT_NUMBER` EquipmentErrorCode로 수렴.

3. **`*_FAILED` catch-all 에러**: E2E 강제 유발 불가하므로 E2E spec 커버 제외. enum + mapper 추가만 수행.

4. **금지 파일**: `apps/frontend/messages/{ko,en}/equipment.json` 절대 미수정.
