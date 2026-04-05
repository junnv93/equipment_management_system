---
slug: ulqp18-compliance-gaps
created: 2026-04-05
status: active
mode: 2
description: UL-QP-18 절차서 준수 갭 해소 — 이력카드/보존연한/자체점검표/양식 내보내기
---

# UL-QP-18 절차서 준수 갭 해소

## Phase 1: Dependencies + DB Schema Changes

### 1A. Install docxtemplater dependency
- Add `docxtemplater`, `pizzip` to `apps/backend/package.json`
- exceljs already installed

### 1B. Documents table: retention columns (갭 2)
- `packages/db/src/schema/documents.ts` — add `retentionPeriod` (varchar 20) and `retentionExpiresAt` (timestamp, nullable)
- Index on `retentionExpiresAt`

### 1C. Self-inspection table (갭 3)
- `packages/db/src/schema/equipment-self-inspections.ts` (NEW) — `equipment_self_inspections` table
  - id (uuid PK), equipmentId (FK), inspectionDate (timestamp)
  - appearance, functionality, safety, calibrationStatus — each varchar (pass/fail/na)
  - overallResult (varchar: pass/fail), remarks (text)
  - inspectorId (FK → users), confirmedBy (FK → users, nullable), confirmedAt (timestamp, nullable)
  - inspectionCycle (integer, months), nextInspectionDate (timestamp)
  - version (integer, CAS), createdAt, updatedAt
  - Indexes: equipmentId, inspectionDate, nextInspectionDate

### 1D. Enums + Zod schemas
- `packages/schemas/src/enums/self-inspection.ts` (NEW) — SelfInspectionResult, SelfInspectionItemJudgment
- `packages/schemas/src/index.ts` — export

### 1E. Permissions + API Endpoints
- `packages/shared-constants/src/permissions.ts` — VIEW_SELF_INSPECTIONS, CREATE_SELF_INSPECTION, CONFIRM_SELF_INSPECTION
- `packages/shared-constants/src/role-permissions.ts` — role assignments
- `packages/shared-constants/src/api-endpoints.ts` — EQUIPMENT.SELF_INSPECTIONS, EQUIPMENT.HISTORY_CARD, REPORTS.EXPORT.FORM_TEMPLATE
- `packages/shared-constants/src/permission-categories.ts` — self-inspection category

### Files
- `apps/backend/package.json`
- `packages/db/src/schema/documents.ts`
- `packages/db/src/schema/equipment-self-inspections.ts` (NEW)
- `packages/db/src/schema/index.ts`
- `packages/schemas/src/enums/self-inspection.ts` (NEW)
- `packages/schemas/src/index.ts`
- `packages/shared-constants/src/permissions.ts`
- `packages/shared-constants/src/role-permissions.ts`
- `packages/shared-constants/src/api-endpoints.ts`
- `packages/shared-constants/src/permission-categories.ts`

### Verification
- `pnpm tsc --noEmit`
- `pnpm --filter backend run db:generate`
- `pnpm --filter backend run db:migrate`


## Phase 2: Backend — 이력카드 + 보존연한 (갭 1 + 갭 2)

### 2A. 이력카드 docx 내보내기 (갭 1)
- `apps/backend/templates/UL-QP-18-02-history-card.docx` (NEW) — docx template with placeholder tags
- `apps/backend/src/modules/equipment/services/history-card.service.ts` (NEW) — aggregate 5 tables, render docx, return Buffer
- `apps/backend/src/modules/equipment/equipment-history.controller.ts` — GET /:uuid/history-card
- `apps/backend/src/modules/equipment/equipment.module.ts` — register

### 2B. 보존연한 (갭 2)
- `apps/backend/src/modules/reports/retention.service.ts` (NEW) — form number → retention period mapping, auto-set retentionExpiresAt
- `apps/backend/src/modules/notifications/schedulers/retention-expiry-scheduler.ts` (NEW) — daily cron, 30-day warning
- Register in respective modules

### Verification
- `pnpm tsc --noEmit`
- `pnpm --filter backend run test`


## Phase 3: Backend — 자체점검표 CRUD (갭 3)

### Files
- `apps/backend/src/modules/self-inspections/self-inspections.module.ts` (NEW)
- `apps/backend/src/modules/self-inspections/self-inspections.controller.ts` (NEW)
- `apps/backend/src/modules/self-inspections/self-inspections.service.ts` (NEW)
- `apps/backend/src/modules/self-inspections/dto/create-self-inspection.dto.ts` (NEW)
- `apps/backend/src/modules/self-inspections/dto/update-self-inspection.dto.ts` (NEW)
- `apps/backend/src/app.module.ts` — register module

### Endpoints
- POST /api/equipment/:uuid/self-inspections
- GET /api/equipment/:uuid/self-inspections
- GET /api/self-inspections/:uuid
- PATCH /api/self-inspections/:uuid
- PATCH /api/self-inspections/:uuid/confirm
- DELETE /api/self-inspections/:uuid

### Requirements
- CAS on update/confirm
- @RequirePermissions, @AuditLog, ZodValidationPipe
- Server-side userId extraction

### Verification
- `pnpm tsc --noEmit`
- `pnpm --filter backend run test`


## Phase 4: Backend — 양식 템플릿 내보내기 (갭 4)

### Files
- `apps/backend/templates/` — 11 docx templates (UL-QP-18-01 ~ UL-QP-18-11)
- `apps/backend/src/modules/reports/form-template-export.service.ts` (NEW)
- `apps/backend/src/modules/reports/reports.controller.ts` — add export endpoints
- `apps/backend/src/modules/reports/reports.module.ts` — register

### Endpoints
- GET /api/reports/export/form/:formNumber (UL-QP-18-01 ~ UL-QP-18-11)

### Verification
- `pnpm tsc --noEmit`
- `pnpm --filter backend run test`


## Phase 5: Frontend — 이력카드 버튼 + 자체점검 탭 + 내보내기

### 5A. 이력카드 버튼
- `apps/frontend/components/equipment/EquipmentStickyHeader.tsx` — "이력카드 내보내기" button
- `apps/frontend/lib/api/equipment-api.ts` — downloadHistoryCard()

### 5B. 자체점검 탭
- `apps/frontend/components/equipment/SelfInspectionTab.tsx` (NEW)
- `apps/frontend/components/equipment/SelfInspectionForm.tsx` (NEW)
- `apps/frontend/components/equipment/EquipmentTabs.tsx` — add tab
- `apps/frontend/lib/api/self-inspection-api.ts` (NEW)
- `apps/frontend/lib/api/query-config.ts` — queryKeys

### 5C. 양식 내보내기 버튼
- `apps/frontend/lib/api/reports-api.ts` — exportFormTemplate()
- 관련 페이지에 내보내기 버튼 추가

### 5D. i18n
- `apps/frontend/messages/ko.json`
- `apps/frontend/messages/en.json`

### Verification
- `pnpm --filter frontend run tsc --noEmit`
- `pnpm --filter frontend run build`


## Phase 6: Tests

### Files
- `apps/backend/src/modules/equipment/services/__tests__/history-card.service.spec.ts`
- `apps/backend/src/modules/self-inspections/__tests__/self-inspections.service.spec.ts`
- `apps/backend/src/modules/reports/__tests__/form-template-export.service.spec.ts`
- `apps/backend/src/modules/reports/__tests__/retention.service.spec.ts`

### Verification
- `pnpm --filter backend run test`
- `pnpm tsc --noEmit`
