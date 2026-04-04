---
slug: software-domain-redesign
created: 2026-04-03
status: active
mode: 2
---

# Exec Plan: 소프트웨어 도메인 재설계 — UL-QP-18-07 + UL-QP-18-09

## Context

현재 software 모듈은 "장비에 종속된 소프트웨어 버전 변경 이력" 구조 (software_history 테이블, equipmentId FK).
UL-QP-18-07/09가 요구하는 것은 "독립적인 시험용 소프트웨어 레지스트리 + 유효성 확인 워크플로우".
도메인 모델 자체가 다르므로, 기존 모듈을 완전 교체한다.

## Phase 1: DB Schema & Enums

### 1.1 Enums rewrite: `packages/schemas/src/enums/software.ts`
- Remove: SoftwareTypeEnum, SoftwareApprovalStatusEnum
- Add: TestFieldEnum (RF/SAR/EMC/RED/HAC), SoftwareAvailabilityEnum, ValidationTypeEnum (vendor/self), ValidationStatusEnum (draft/submitted/approved/rejected)

### 1.2 Values update: `packages/schemas/src/enums/values.ts`
- Remove SoftwareApprovalStatusValues
- Add ValidationStatusValues, SoftwareAvailabilityValues

### 1.3 New: `packages/db/src/schema/test-software.ts`
- test_software table: id, managementNumber(PNNNN unique), name, softwareVersion, testField, primaryManagerId/secondaryManagerId(FK users), installedAt, manufacturer, location, availability, requiresValidation, site, version(CAS), timestamps

### 1.4 New: `packages/db/src/schema/software-validations.ts`
- software_validations table: id, testSoftwareId(FK), validationType, status
- Vendor fields: vendorName, vendorSummary, receivedBy, receivedDate, attachmentNote
- Self fields: referenceDocuments, operatingUnitDescription, softwareComponents, hardwareComponents, acquisitionFunctions(jsonb), processingFunctions(jsonb), controlFunctions(jsonb), performedBy
- Approval fields: submittedAt/By, technicalApproverId/At, qualityApproverId/At, rejectedBy/At, rejectionReason
- version(CAS), timestamps

### 1.5 Delete: `packages/db/src/schema/software-history.ts`

### 1.6 Update: `packages/db/src/schema/index.ts`
- Remove software-history export, add test-software + software-validations exports

### Verification
```bash
pnpm --filter backend run db:generate
```

## Phase 2: Backend

### 2.1 Delete: `apps/backend/src/modules/software/` (entire directory)

### 2.2 New: `apps/backend/src/modules/test-software/`
- module, controller, service, DTOs (create/update/query)
- CRUD + management number auto-generation (PNNNN)
- CAS via VersionedBaseService

### 2.3 New: `apps/backend/src/modules/software-validations/`
- module, controller, service, DTOs
- Workflow: create(draft) → submit → approve/reject → quality-approve
- Status transition enforcement

### 2.4 Update: `apps/backend/src/app.module.ts`
- Swap SoftwareModule → TestSoftwareModule + SoftwareValidationsModule

### 2.5 Update shared-constants
- permissions.ts: new permissions
- role-permissions.ts: role mappings
- api-endpoints.ts: new endpoints
- approval-categories.ts: SOFTWARE_VALIDATION
- cache-key-prefixes.ts: new prefixes

### 2.6 Update notification events

### 2.7 Update seed data

### Verification
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
```

## Phase 3: Frontend

### 3.1 Rewrite: `apps/frontend/lib/api/software-api.ts`
- TestSoftware + SoftwareValidation interfaces and API methods

### 3.2 Update: `apps/frontend/lib/api/query-config.ts`
- testSoftware and softwareValidations query keys

### 3.3 Delete: `apps/frontend/app/(dashboard)/equipment/[id]/software/`

### 3.4 Rewrite /software pages
- /software/page.tsx + TestSoftwareListContent (관리대장)
- /software/[id]/page.tsx + TestSoftwareDetailContent
- /software/[id]/validation/page.tsx + SoftwareValidationContent

### 3.5 Update navigation, i18n, design tokens

### Verification
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
```

## Phase 4: Cleanup
- Grep zero-hit verification for removed artifacts
- Full build + test suite

## Phase 5: Workflow Docs
- WF-14 → WF-14a (등록) + WF-14b (유효성 확인)

## Dependency: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
