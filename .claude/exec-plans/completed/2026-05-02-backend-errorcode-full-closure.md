# Exec Plan: backend-errorcode-full-closure

**작성일**: 2026-05-02
**스코프**: backend 전체 inline `code: 'STRING_LITERAL'` → ErrorCode enum SSOT 완전 종결 + NC NotFound 불일치 버그 수정 + 7개 NotFound frontend 5-layer 완성
**현재 inline 잔존**: ~148건 (test 제외, 18 디렉토리 분포)
**목표**: ErrorCode enum SSOT 0 inline literal, frontend mapper 7개 NotFound 코드 완전 매핑

---

## 배경 분석

### 직전 sprint(`rejection-reason-notfound-systemic-closure`) 결과
- `versioned-base.service.ts` `notFoundCode: ErrorCode` 타입 강제 → CAS 진입 경로는 SSOT 닫힘
- 하지만 7개 NotFound enum(`CableNotFound`, `NonConformanceNotFound`, `SoftwareValidationNotFound`, `TestSoftwareNotFound`, `IntermediateInspectionNotFound`, `SelfInspectionNotFound`, `TestPlanNotFound`)이 **frontend mapper에 매핑 없음** → Phase 4 작업

### Critical bug
```typescript
// packages/schemas/src/errors.ts:385
NonConformanceNotFound = 'NC_NOT_FOUND'

// apps/backend/src/modules/non-conformances/non-conformances.service.ts:543
throw new NotFoundException({
  code: 'NON_CONFORMANCE_NOT_FOUND',   // ← enum 값 'NC_NOT_FOUND'와 불일치
  message: '부적합 기록을 찾을 수 없습니다.',
});
```
프론트는 backend 응답 `code='NON_CONFORMANCE_NOT_FOUND'`를 받지만 NC mapper는 `ErrorCode.NonConformanceNotFound`(`NC_NOT_FOUND`) 만 인식 → generic fallback. **Phase 1 최우선 수정**.

### Auth codes 정책 결정
17건 auth 코드(`AUTH_*`)는 **단일 ErrorCode enum에 통합**. 근거:
1. 기존 패턴(`InvalidCredentials`, `SessionExpired`, `Unauthorized`, `Forbidden`, `PermissionDenied`)이 이미 단일 enum 안에 존재
2. `errorCodeToStatusCode: Record<ErrorCode, number>` compile-time completeness 보장이 가장 큰 이점 — 별도 enum 분리 시 두 매핑을 union 해야 하므로 SSOT 약화
3. AppError 팩토리(`AppError.unauthorized()`)와 GlobalExceptionFilter가 단일 ErrorCode 가정으로 작성됨

### Frontend mapper 정책 결정
**user-facing 도메인만 mapper 신설**. Internal/admin-only는 ErrorCode SSOT만 강제하고 mapper 생략 가능.
- **신설 필요**: NC(부분존재→확장), checkouts, cables, notifications, teams, users, calibration(존재하지만 추가), inspection-form-templates
- **존재함, 보강만**: equipment(`mapBackendErrorCode` mapping table 확장 — 신규 NotFound 7개 추가), intermediate-inspection-errors.ts, self-inspection-errors.ts
- **mapper 불필요**: `common/scope` (GlobalExceptionFilter가 SCOPE_ACCESS_DENIED로 처리), `auth.guards/strategies` (NextAuth signOut 경로), `data-migration` (admin-only), `monitoring` (admin-only)

---

## Phase 구성 (총 7 Phase)

### Phase 1: Critical bug 수정 (NC NotFound mismatch) — 단일 커밋
**Files**:
- `apps/backend/src/modules/non-conformances/non-conformances.service.ts:543`

**MUST 달성**:
- Line 543 `code: 'NON_CONFORMANCE_NOT_FOUND'` → `code: ErrorCode.NonConformanceNotFound`
- ErrorCode import 확인 (이미 import되어 있어야 — 다른 곳에서 사용 중)
- backend test PASS

**검증**:
```bash
grep -c "'NON_CONFORMANCE_NOT_FOUND'" apps/backend/src/modules/non-conformances/non-conformances.service.ts  # → 0
pnpm --filter backend run test
```

---

### Phase 2: ErrorCode enum 확장 — auth 도메인 (17 코드)
**Files**:
- `packages/schemas/src/errors.ts` (enum + statusCode mapping)

**ErrorCode enum 추가**:
- `AuthSseTokenRequired = 'AUTH_SSE_TOKEN_REQUIRED'` (401)
- `AuthAccessTokenOnly = 'AUTH_ACCESS_TOKEN_ONLY'` (401)
- `AuthTokenBlacklisted = 'AUTH_TOKEN_BLACKLISTED'` (401)
- `AuthInvalidToken = 'AUTH_INVALID_TOKEN'` (401)
- `AuthUserIdMissing = 'AUTH_USER_ID_MISSING'` (401)
- `AuthInvalidSession = 'AUTH_INVALID_SESSION'` (401)
- `AuthProductionAzureOnly = 'AUTH_PRODUCTION_AZURE_ONLY'` (403)
- `AuthAccountLocked = 'AUTH_ACCOUNT_LOCKED'` (423 또는 401 — 정책 결정 필요)
- `AuthAzureAdFailed = 'AUTH_AZURE_AD_FAILED'` (401)
- `AuthUserNotFound = 'AUTH_USER_NOT_FOUND'` (401) ※ 기존 `UserNotFound`(404)와 의미 다름 — 인증 단계 사용자 미존재
- `AuthInvalidRefreshToken = 'AUTH_INVALID_REFRESH_TOKEN'` (401)
- `AuthSessionExpired = 'AUTH_SESSION_EXPIRED'` (401) ※ 기존 `SessionExpired`와 alias 또는 통합 검토
- `AuthRefreshNoUser = 'AUTH_REFRESH_NO_USER'` (401)
- `AuthRefreshExpired = 'AUTH_REFRESH_EXPIRED'` (401)
- `AuthPermissionsNotConfigured = 'AUTH_PERMISSIONS_NOT_CONFIGURED'` (500)
- `AuthRequired = 'AUTH_REQUIRED'` (401)
- `AuthInsufficientPermissions = 'AUTH_INSUFFICIENT_PERMISSIONS'` (403)
- `AuthUserInactive = 'AUTH_USER_INACTIVE'` (401)
- `AuthUserInfoMissing = 'AUTH_USER_INFO_MISSING'` (401)
- `AuthInvalidCredentials = 'AUTH_INVALID_CREDENTIALS'` (401) ※ 기존 `InvalidCredentials`와 통합 또는 alias

**기존 alias 결정**:
- `SessionExpired` ↔ `AuthSessionExpired`: 의미 동일 → **기존 SessionExpired 유지, 신규 미추가**. callers는 `ErrorCode.SessionExpired` 사용
- `InvalidCredentials` ↔ `AuthInvalidCredentials`: 동일 → **기존 InvalidCredentials 유지**
- `UserNotFound`(404) ↔ `AuthUserNotFound`(401): **다름** — auth 흐름은 401, lookup 흐름은 404. 둘 다 유지

**MUST 달성**:
- 19개 신규 enum (위 - 통합/alias 제외 = 17건)
- `errorCodeToStatusCode` Record completeness 보장 (`Record<ErrorCode, number>` 컴파일 강제)
- `pnpm --filter schemas run build` PASS

**스코프 외**: scope 코드(`SCOPE_DENIED`, `CROSS_TEAM_DENIED`, `CROSS_SITE_DENIED`)는 Phase 3에서 통합

---

### Phase 3: ErrorCode enum 확장 — 도메인별 신규 코드 (~70 코드)
**Files**:
- `packages/schemas/src/errors.ts`

**도메인별 추가** (입력 자료 기반 inline 카운트):

#### users (12 코드)
- `UserEmailAlreadyExists = 'USER_EMAIL_ALREADY_EXISTS'` (409) ※ 기존 EmailAlreadyExists alias 검토
- `UserRequesterNotFound = 'USER_REQUESTER_NOT_FOUND'` (404)
- `UserNoRoleChangePermission = 'USER_NO_ROLE_CHANGE_PERMISSION'` (403)
- `UserCannotChangeOwnRole = 'USER_CANNOT_CHANGE_OWN_ROLE'` (403)
- `UserTargetNotFound = 'USER_TARGET_NOT_FOUND'` (404)
- `UserCannotChangeSeniorRole = 'USER_CANNOT_CHANGE_SENIOR_ROLE'` (403)
- `UserTeamScopeOnly = 'USER_TEAM_SCOPE_ONLY'` (403)
- `UserSiteScopeOnly = 'USER_SITE_SCOPE_ONLY'` (403)
- `UserFileRequired = 'USER_FILE_REQUIRED'` (400)

#### teams (4 코드)
- `TeamNameAlreadyExists = 'TEAM_NAME_ALREADY_EXISTS'` (409)
- `TeamLeaderNotFound = 'TEAM_LEADER_NOT_FOUND'` (404)
- `TeamLeaderSiteMismatch = 'TEAM_LEADER_SITE_MISMATCH'` (400)
- `TeamResourceNotFound = 'TEAM_RESOURCE_NOT_FOUND'` (404)

#### checkouts (2 코드)
- `CheckoutNotFound = 'CHECKOUT_NOT_FOUND'` (404)
- `CheckoutMissingId = 'CHECKOUT_MISSING_ID'` (400)

#### documents (5 코드)
- `DocumentNotFound = 'DOCUMENT_NOT_FOUND'` (404)
- `DocumentNotImage = 'DOCUMENT_NOT_IMAGE'` (400)
- `DocumentFileRequired = 'DOCUMENT_FILE_REQUIRED'` (400)
- `DocumentTypeInvalid = 'DOCUMENT_TYPE_INVALID'` (400)
- `DocumentOwnerRequired = 'DOCUMENT_OWNER_REQUIRED'` (400)
- `DocumentOwnerMismatch = 'DOCUMENT_OWNER_MISMATCH'` (403)
- `DocumentTypeCountMismatch = 'DOCUMENT_TYPE_COUNT_MISMATCH'` (400)
- `DocumentValidationNotFound = 'DOCUMENT_VALIDATION_NOT_FOUND'` (404)
- `DocumentValidationNotDraft = 'DOCUMENT_VALIDATION_NOT_DRAFT'` (400)
- `NcAttachmentWrongEndpoint = 'NC_ATTACHMENT_WRONG_ENDPOINT'` (400)
- `InvalidUuid = 'INVALID_UUID'` (400) — 공통, 6+곳 사용

#### calibration (5 코드)
- `CalibrationFileRequired = 'CALIBRATION_FILE_REQUIRED'` (400)
- `CalibrationPayloadInvalid = 'CALIBRATION_PAYLOAD_INVALID'` (400)
- `CalibrationEndpointDeprecated = 'CALIBRATION_ENDPOINT_DEPRECATED'` (410)

#### inspection-form-templates (5 코드)
- `InspectionTemplateNotFound = 'INSPECTION_TEMPLATE_NOT_FOUND'` (404)
- `InspectionTemplateStaleBase = 'INSPECTION_TEMPLATE_STALE_BASE'` (409)
- `InspectionTemplateInvalidVersion = 'INSPECTION_TEMPLATE_INVALID_VERSION'` (400)
- `InspectionTemplateVersionConflict = 'INSPECTION_TEMPLATE_VERSION_CONFLICT'` (409)
- `InvalidInspectionType = 'INVALID_INSPECTION_TYPE'` (400)

#### intermediate-inspections + self-inspections (공통/추가 8 코드)
- `IntermediateInspectionNotRequired = 'INTERMEDIATE_INSPECTION_NOT_REQUIRED'` (400)
- `InspectionCannotDeleteApproved = 'INSPECTION_CANNOT_DELETE_APPROVED'` (400)
- `InspectionItemNotFound = 'INSPECTION_ITEM_NOT_FOUND'` (404)
- `ResultSectionNotFound = 'RESULT_SECTION_NOT_FOUND'` (404)
- `ResultSectionDuplicate = 'RESULT_SECTION_DUPLICATE'` (409)
- `ResultSectionMismatch = 'RESULT_SECTION_MISMATCH'` (400)
- `ResultSectionIncompleteOrder = 'RESULT_SECTION_INCOMPLETE_ORDER'` (400)
- `CsvTooFewRows = 'CSV_TOO_FEW_ROWS'` (400)
- `InspectionFileRequired = 'INSPECTION_FILE_REQUIRED'` (400)

#### non-conformances (4 코드)
- `NcTypeRequired = 'NC_TYPE_REQUIRED'` (400)
- `NcEquipmentAlreadyNonConforming = 'NC_EQUIPMENT_ALREADY_NON_CONFORMING'` (409)
- `NcRepairRecordRequired = 'NC_REPAIR_RECORD_REQUIRED'` (400)
- `NcRecalibrationRequired = 'NC_RECALIBRATION_REQUIRED'` (400)
- `NcRepairAlreadyLinked = 'NC_REPAIR_ALREADY_LINKED'` (409)

#### notifications (1 코드)
- `NotificationNotFound = 'NOTIFICATION_NOT_FOUND'` (404)

#### test-software (2 코드)
- `TestSoftwareEquipmentAlreadyLinked = 'TEST_SOFTWARE_EQUIPMENT_ALREADY_LINKED'` (409)
- `TestSoftwareEquipmentLinkNotFound = 'TEST_SOFTWARE_EQUIPMENT_LINK_NOT_FOUND'` (404)

#### cables (1 코드)
- `CableLossMeasurementNotFound = 'CABLE_LOSS_MEASUREMENT_NOT_FOUND'` (404)

#### scope (3 코드)
- `ScopeDenied = 'SCOPE_DENIED'` (403) ※ 기존 ScopeAccessDenied alias 또는 통합
- `ScopeCrossTeamDenied = 'SCOPE_CROSS_TEAM_DENIED'` (403)
- `ScopeCrossSiteDenied = 'SCOPE_CROSS_SITE_DENIED'` (403)
- `ScopeFilterUnavailable = 'SCOPE_FILTER_UNAVAILABLE'` (500)

#### file-upload + 공통 (4 코드)
- `FileNotFound = 'FILE_NOT_FOUND'` (404)
- `FileRequired = 'FILE_REQUIRED'` (400) ※ 기존 FileEmpty 별도 의미 — 신규 필요
- `FormTemplateRenderFailed = 'FORM_TEMPLATE_RENDER_FAILED'` (500)

#### reports/form-template-export (5 코드)
- `FormUseDedicatedEndpoint = 'FORM_USE_DEDICATED_ENDPOINT'` (400)
- `FormNotImplemented = 'FORM_NOT_IMPLEMENTED'` (501)
- `FormMissingInspectionId = 'FORM_MISSING_INSPECTION_ID'` (400)
- `FormMissingEquipmentId = 'FORM_MISSING_EQUIPMENT_ID'` (400)
- `FormInvalidFormNumber = 'FORM_INVALID_FORM_NUMBER'` (400)

#### equipment-imports / software-validations (3 코드)
- `EquipmentImportVersionRequired = 'EQUIPMENT_IMPORT_VERSION_REQUIRED'` (400)
- `EquipmentImportInvalidSourceType = 'EQUIPMENT_IMPORT_INVALID_SOURCE_TYPE'` (400)
- `SoftwareValidationNonExportableStatus = 'SOFTWARE_VALIDATION_NON_EXPORTABLE_STATUS'` (400)

**MUST 달성**:
- 모든 신규 코드 enum + statusCode 매핑 (compile completeness)
- `pnpm --filter schemas run build` PASS
- 인접 alias(EmailAlreadyExists, ScopeAccessDenied) 정합성 결정 후 doc comment 추가

---

### Phase 4: Backend caller migration — common/ + auth (29 inline)
**Files**:
- `common/docx/docx-xml-helpers.ts`
- `common/file-upload/document.service.ts`
- `common/file-upload/files.controller.ts`
- `common/guards/sse-jwt-auth.guard.ts`
- `common/scope/scope-enforcer.ts`
- `common/scope/scope-sql-builder.ts`
- `common/utils/extract-user.ts`
- `modules/auth/auth.service.ts`
- `modules/auth/guards/permissions.guard.ts`
- `modules/auth/strategies/jwt.strategy.ts`
- `modules/approvals/approvals.controller.ts`

**MUST 달성**:
- 모든 inline `code: '...'` → `code: ErrorCode.X`
- ErrorCode import 추가
- 0 inline literal verification:
  ```bash
  grep -rn "code: '" apps/backend/src/common apps/backend/src/modules/auth apps/backend/src/modules/approvals --include="*.ts" | grep -v "__tests__\|\.spec\."
  # → 0행
  ```
- backend test PASS
- backend tsc PASS

---

### Phase 5: Backend caller migration — domain modules part 1 (54 inline)
**Files**:
- `modules/users/users.controller.ts` + `users.service.ts` (24 inline)
- `modules/teams/teams.controller.ts` + `teams.service.ts` (6 inline)
- `modules/documents/documents.controller.ts` (12 inline)
- `modules/calibration/calibration.controller.ts` (12 inline)

**MUST 달성**:
- 0 inline literal in 4 modules:
  ```bash
  grep -rn "code: '" apps/backend/src/modules/users apps/backend/src/modules/teams apps/backend/src/modules/documents apps/backend/src/modules/calibration --include="*.ts" | grep -v "__tests__\|\.spec\."
  # → 0행
  ```
- backend test PASS

---

### Phase 6: Backend caller migration — domain modules part 2 (65 inline)
**Files**:
- `modules/non-conformances/non-conformances.controller.ts` + `non-conformances.service.ts` (11 inline)
- `modules/intermediate-inspections/intermediate-inspections.controller.ts` + `.service.ts` + `result-sections.service.ts` + `services/intermediate-inspection-export-data.service.ts` (11 inline)
- `modules/self-inspections/self-inspections.controller.ts` + `.service.ts` (3 inline)
- `modules/checkouts/services/checkout-form-export-data.service.ts` + `rental-import-checkout-form-export-data.service.ts` (7 inline)
- `modules/inspection-form-templates/inspection-form-templates.controller.ts` + `.service.ts` (6 inline)
- `modules/notifications/notifications.service.ts` (3 inline)
- `modules/reports/form-template-export.service.ts` (6 inline)
- `modules/equipment-imports/equipment-imports.service.ts` + `services/equipment-import-form-export-data.service.ts` (3 inline)
- `modules/software-validations/services/software-validation-export-data.service.ts` (3 inline)
- `modules/test-software/test-software.service.ts` (2 inline)
- `modules/cables/cables.service.ts` (1 inline)

**MUST 달성**:
- backend 전체 0 inline literal:
  ```bash
  grep -rn "code: '[A-Z_]\+'" apps/backend/src --include="*.ts" | grep -v "__tests__\|\.spec\.\|\.test\." 
  # → 0행
  ```
- backend test PASS
- backend tsc PASS
- backend e2e PASS (CAS/scope/auth invariants)

---

### Phase 7: Frontend mapper + i18n 5-layer 종결
**목표**: 7개 신규 NotFound + 도메인 mapper 누락분 보강

#### 7.1: equipment-errors.ts mapBackendErrorCode 확장 (mapping table)
**Files**:
- `apps/frontend/lib/errors/equipment-errors.ts`

**MUST 달성**:
- mappings Record에 7 NotFound 추가:
  - `CABLE_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `NC_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `SOFTWARE_VALIDATION_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `TEST_SOFTWARE_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `INTERMEDIATE_INSPECTION_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `SELF_INSPECTION_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `TEST_PLAN_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`
  - `ENTITY_NOT_FOUND` → `EquipmentErrorCode.NOT_FOUND`

#### 7.2: 도메인 mapper 신설 (5건)
**Files** (신설):
- `apps/frontend/lib/errors/checkout-errors.ts` — CheckoutErrorCode + mapper
- `apps/frontend/lib/errors/cable-errors.ts` — CableErrorCode + mapper
- `apps/frontend/lib/errors/notification-errors.ts` — NotificationErrorCode + mapper
- `apps/frontend/lib/errors/team-errors.ts` — TeamErrorCode + mapper
- `apps/frontend/lib/errors/user-errors.ts` — UserErrorCode + mapper

**패턴** (각 mapper):
- domain-specific `*ErrorCode` enum + `Record<*ErrorCode, ErrorInfo>` (compile completeness)
- `mapBackendErrorCode()` (1:1 routing)
- `mapXErrorToToast(error, t)` toast helper

#### 7.3: i18n 메시지 추가 (errors namespace)
**Files**:
- `apps/frontend/messages/ko/non-conformances.json` — errors namespace 확장 (NOT_FOUND, EQUIPMENT_ALREADY_NON_CONFORMING, REPAIR_ALREADY_LINKED 등 추가)
- `apps/frontend/messages/en/non-conformances.json` — 동일
- `apps/frontend/messages/ko/checkouts.json` — errors namespace 신설/확장
- `apps/frontend/messages/en/checkouts.json`
- `apps/frontend/messages/ko/cables.json`
- `apps/frontend/messages/en/cables.json`
- `apps/frontend/messages/ko/notifications.json`
- `apps/frontend/messages/en/notifications.json`
- `apps/frontend/messages/ko/teams.json`
- `apps/frontend/messages/en/teams.json`
- `apps/frontend/messages/ko/auth.json` — auth 17 코드 i18n (login 페이지 user-facing)
- `apps/frontend/messages/en/auth.json`

**MUST 달성**:
- ko/en parity (각 신규 키 양쪽 등록)
- 7 NotFound 도메인 사용자 메시지 노출 (관리자 사용자 친화)
- existing NC mapper 확장 (NotFound, EquipmentAlreadyNonConforming, RepairAlreadyLinked, RepairRecordRequired, RecalibrationRequired, OwnerMismatch, TypeRequired)

#### 7.4: 회귀 검증
```bash
pnpm --filter frontend tsc --noEmit
pnpm --filter frontend run test  # mapper unit test
```

---

## 의존성 순서

```
Phase 1 (NC bug, 1 line)
   ↓
Phase 2 (auth ErrorCode 추가)
   ↓
Phase 3 (도메인 ErrorCode 추가)
   ↓ ↓
Phase 4 (common/auth callers)   Phase 5 (users/teams/docs/calibration)   Phase 6 (나머지)
   ↓ ↓ ↓
Phase 7 (frontend 5-layer)
```

Phase 4-6은 enum 의존성이므로 **Phase 2-3 완료 후**에만 시작. Phase 4/5/6은 독립적이므로 병렬 가능 (다만 단일 세션은 순차 권장).

## 검증 명령 (각 Phase 종료시)

```bash
# 0 inline literal 보장 (Phase 6 종료 후 전체 0)
grep -rn "code: '[A-Z_]\+'" apps/backend/src --include="*.ts" | grep -v "__tests__\|\.spec\.\|\.test\." 

# schemas build (Phase 2-3 후)
pnpm --filter schemas run build

# backend 정합성 (Phase 4-6 각각)
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test

# frontend 정합성 (Phase 7)
pnpm --filter frontend tsc --noEmit
pnpm --filter frontend run test

# E2E 회귀 (Phase 6 후 전체)
pnpm --filter frontend run test:e2e -- --workers=4
```

## 스코프 외 (다음 sprint 후보)

- `revoke-approval.dto.ts` `.min(1)` — 철회 사유 정책 미정 (직전 sprint 보류분 그대로 보류)
- `monitoring`, `dashboard`, `data-migration` admin 페이지 mapper 신설 (사용자 노출 빈도 낮음)
- AppError 팩토리 확장 (`AppError.scopeDenied()`, `AppError.fileRequired()` 등) — 호출자 캡슐화 추가 작업
- E2E spec 추가 — Phase 7 mapper 동작 검증 toast text 단위 (verify-zod Step 16 자동 분석으로 충분 가정)
- 미사용 string literal 잔존(`'ENDPOINT_DEPRECATED'`, `'INVALID_DOCUMENT_TYPE'` 등 dual-naming) 통합

## 리스크

1. **Phase 2 alias 결정**: `SessionExpired` vs `AuthSessionExpired`, `InvalidCredentials` vs `AuthInvalidCredentials` 병용 시 frontend mapper에서 양쪽 routing 필요. 결정 시 doc comment SSOT.
2. **Auth 도메인 i18n**: NextAuth signIn 콜백에서 발생하는 401은 사용자에게 노출되는 케이스 — auth.json errors namespace 신설 필요 (Phase 7.3).
3. **Phase 6 거대한 변경량**: 65 inline 변경 → 단일 커밋 레이어가 너무 클 수 있음. 모듈 단위 sub-commit 권장 (NC / inspections / checkouts-export / 나머지 4 split).
4. **statusCode 변경**: 일부 inline 코드는 `BadRequestException`(400)으로 throw되었지만 enum status 매핑은 다를 수 있음 — `errorCodeToStatusCode` 정의 시 기존 throw class와 일치 검증 필요.
