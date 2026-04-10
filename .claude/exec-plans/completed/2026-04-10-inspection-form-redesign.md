---
slug: inspection-form-redesign
created: 2026-04-10
status: active
---

# Exec Plan: Intermediate Inspection Form Redesign (1-Step UX)

## Goal
Transform the intermediate inspection creation from a 2-step flow (create inspection, then add result sections separately) into a 1-step flow where inspection + result sections are created together in a single form submission.

## Phase 1: Backend — Unified Create Endpoint

### Objective
Extend the create inspection DTO and service to accept result sections in the same request, inserting all data in a single transaction.

### Files to modify
- `apps/backend/src/modules/intermediate-inspections/dto/create-inspection.dto.ts` — Add optional `resultSections` array field
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` — Extend `create()` to insert result sections within the same transaction
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.controller.ts` — Pass result sections from DTO through to service

### Verification
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
```

## Phase 2: Shared Package — Check Item Presets SSOT

### Objective
Define the 10 inspection check item presets as shared constants so both backend validation and frontend UI reference the same source.

### Files to add
- `packages/shared-constants/src/inspection-check-item-presets.ts` — Export `INSPECTION_CHECK_ITEM_PRESETS` array

### Files to modify
- `packages/shared-constants/src/index.ts` — Export the new presets module

### Verification
```bash
pnpm --filter @equipment-management/shared-constants run tsc --noEmit
```

## Phase 3: Frontend API Layer

### Objective
Update the frontend API types to support the new unified DTO with result sections.

### Files to modify
- `apps/frontend/lib/api/calibration-api.ts` — Extend `CreateInspectionDto` to include optional `resultSections`

### Verification
```bash
pnpm --filter frontend run tsc --noEmit
```

## Phase 4: Frontend Form Redesign

### Objective
Redesign `InspectionFormDialog` to:
1. Prefill classification, inspectionCycle, calibrationValidityPeriod from equipment master data
2. Add check item preset selector
3. Embed inline result sections creation panel at form bottom
4. Submit everything in a single API call

### Files to modify
- `apps/frontend/components/inspections/InspectionFormDialog.tsx` — Major redesign with prefill, presets, inline result sections

### Files to add
- `apps/frontend/components/inspections/InlineResultSectionsEditor.tsx` — Inline editor for result sections within creation form
- `apps/frontend/components/inspections/CheckItemPresetSelect.tsx` — Preset selector component

### Verification
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
```

## Phase 5: i18n and Integration

### Objective
Add translation strings for new UI elements and verify full integration.

### Files to modify
- `apps/frontend/messages/ko/calibration.json` — Add keys for presets, prefill, inline result sections
- `apps/frontend/messages/en/calibration.json` — Same keys in English

### Verification
```bash
pnpm tsc --noEmit
pnpm build
pnpm --filter backend run test
```

## Dependencies & Sequencing
- Phase 1 and Phase 2: parallel
- Phase 3: depends on Phase 1 (DTO shape)
- Phase 4: depends on Phase 2 + Phase 3
- Phase 5: depends on Phase 4

## Risks
- `ResultSectionsPanel` requires `inspectionId`. Inline editor must accumulate sections locally and submit with form.
- Equipment master data may not have all prefill fields. Form must handle missing data gracefully.
- Classification mapping: inspection's `EquipmentClassification` (calibrated/non_calibrated) vs equipment's `classificationCode`. Need proper derivation.
