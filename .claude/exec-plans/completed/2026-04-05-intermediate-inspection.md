# Exec Plan: UL-QP-18-03 중간점검표 구조화

**Slug**: intermediate-inspection
**Date**: 2026-04-05
**Mode**: 2 (Full Harness)

## Phase 1: DB Schema (3 tables)

### Files to create/modify:
- `packages/db/src/schema/intermediate-inspections.ts` (NEW)
- `packages/db/src/schema/index.ts` (MODIFY - add exports)
- `packages/schemas/src/enums/intermediate-inspection.ts` (NEW)
- `packages/schemas/src/index.ts` (MODIFY - add exports)

### Tables:
1. **intermediate_inspections** — 점검 기록 헤더
   - id, calibrationId(FK), equipmentId(FK), inspectionDate, inspectorId(FK→users)
   - classification, inspectionCycle, calibrationValidityPeriod
   - overallResult(pass/fail), remarks
   - approvalStatus(draft/submitted/reviewed/approved/rejected)
   - submittedBy, reviewedBy, reviewedAt, approvedBy, approvedAt
   - rejectedBy, rejectedAt, rejectionReason
   - version(CAS), createdAt, updatedAt

2. **intermediate_inspection_items** — 점검 항목
   - id, inspectionId(FK), itemNumber, checkItem, checkCriteria, checkResult, judgment(pass/fail)

3. **intermediate_inspection_equipment** — 측정 장비
   - id, inspectionId(FK), equipmentId(FK→equipment), calibrationDate

### Verification: `pnpm tsc --noEmit`

## Phase 2: Backend Module

### Files to create:
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.module.ts`
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.controller.ts`
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts`
- `apps/backend/src/modules/intermediate-inspections/dto/create-inspection.dto.ts`
- `apps/backend/src/modules/intermediate-inspections/dto/update-inspection.dto.ts`

### Files to modify:
- `apps/backend/src/app.module.ts` (register module)

### Endpoints:
- POST /calibration/:uuid/intermediate-inspections — create
- GET /calibration/:uuid/intermediate-inspections — list by calibration
- GET /intermediate-inspections/:uuid — detail
- PATCH /intermediate-inspections/:uuid — update (draft only)
- PATCH /intermediate-inspections/:uuid/submit — submit for review
- PATCH /intermediate-inspections/:uuid/review — reviewer approval
- PATCH /intermediate-inspections/:uuid/approve — final approval
- PATCH /intermediate-inspections/:uuid/reject — reject

### Verification: `pnpm tsc --noEmit` + `pnpm --filter backend run test`

## Phase 3: Frontend

### Files to modify:
- `apps/frontend/components/calibration/IntermediateChecksTab.tsx` — add "점검 기록 작성" button
- `apps/frontend/lib/api/calibration-api.ts` — add inspection API methods
- `apps/frontend/lib/api/query-config.ts` — add query keys

### Files to create:
- `apps/frontend/components/calibration/InspectionFormDialog.tsx` — create/edit form
- `apps/frontend/components/calibration/InspectionDetailDialog.tsx` — detail view

### i18n:
- `apps/frontend/messages/en/calibration.json`
- `apps/frontend/messages/ko/calibration.json`

### Verification: `pnpm tsc --noEmit`
