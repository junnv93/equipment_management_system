# Inspection Templates Developer Guide

## Scope

Inspection templates support the build-once workflow for:

- UL-QP-18-03 intermediate inspections
- UL-QP-18-05 self-inspections

The system stores a value-stripped snapshot of an approved inspection form in
`inspection_form_templates`. Later inspections can prefill from that snapshot,
and structural changes can be applied forward as a new template version.

## Core Model

Template rows are equipment-scoped and type-scoped:

- `equipmentId`
- `inspectionType`: `intermediate` or `self`
- `version`
- `structure`: `ExtractedInspectionStructure`
- `sourceInspectionId`
- `supersededBy`
- `createdBy`

Only rows with `supersededBy IS NULL` and `deletedAt IS NULL` are current.

The structure SSOT is in `@equipment-management/schemas`:

- `ExtractedInspectionStructureSchema`
- `CreateInspectionResultSectionShape`
- `InspectionResultSectionShape`
- `extractStructureFromInspection()`

Do not redefine result-section table/cell shapes in frontend or backend code.

## Workflow

1. A user creates an intermediate or self-inspection.
2. The approval service extracts the form structure with `extractStructureFromInspection()`.
3. `InspectionFormTemplatesService.autoCreateIfAbsent()` creates version 1 if no current template exists.
4. Future inspection forms call the latest-template endpoint and prefill items/result sections.
5. If the user changes form structure, the frontend presents the soft-fork choice.
6. `this_only` submits only the current inspection shape.
7. `apply_forward` calls the template upsert endpoint, creating version `current.version + 1`.
8. The previous template row is linked with `supersededBy = newTemplate.id`.

## API

`GET /api/equipment/:uuid/inspection-template/latest?type=intermediate|self`

- Permission: `VIEW_EQUIPMENT`
- Returns the current template plus creator display metadata.
- Throws `InspectionTemplateNotFound` when no current template exists.
- Validates `type` with `InspectionTypeEnum`.

`POST /api/equipment/:uuid/inspection-template`

- Permission: `MANAGE_INSPECTION_TEMPLATE`
- Used by soft-fork `apply_forward` or future admin template editing.
- Requires the client to send the new expected version.
- Checks stale base with `supersededBy`.

`GET /api/inspection-templates/gallery`

- Permission: `VIEW_EQUIPMENT`
- Returns current templates for similar equipment.
- Current matching is application-side:
  - exact `modelName`
  - then `classificationCode`

## CAS And Versioning

Template upsert is optimistic:

- If a current template exists, `supersededBy` must reference that current template id.
- The submitted version must equal `current.version + 1`.
- Unique constraint conflicts are returned as `InspectionTemplateVersionConflict`.

Frontend conflict handling should invalidate the template query and ask the user
to refresh/retry rather than silently overwriting the newer template.

## Cache And Audit

Template changes emit cache events from `CACHE_EVENTS`:

- `INSPECTION_TEMPLATE_CREATED`
- `INSPECTION_TEMPLATE_VERSION_UP`

Audit rows use:

- `entityType = inspection_form_template`
- `action = create` for version 1
- `action = update` for version-up

System auto-create uses `createdBy = null` and records the triggering actor in
audit details when available.

## Backfill

Production data that predates the build-once workflow needs one historical
backfill run:

```bash
pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts --dry-run --verbose
pnpm --filter backend exec ts-node scripts/backfill-inspection-templates.ts --verbose
```

Backfill behavior:

- latest approved inspection per equipment/type is used
- existing current template rows are skipped
- dry-run writes nothing
- each insert is transaction-wrapped

Operational details are in `docs/operations/inspection-template-backfill.md`.

## Frontend Integration

Primary frontend modules:

- `apps/frontend/lib/inspection/template-source.ts`
- `apps/frontend/lib/inspection/structure-diff.ts`
- `apps/frontend/components/inspections/TemplateGallery.tsx`
- `apps/frontend/components/inspections/SoftForkDialog.tsx`
- `apps/frontend/components/inspections/InspectionFormDialog.tsx`

Type imports for result-section structures should come from
`@equipment-management/schemas` directly or through existing schema-sourced
aliases exported by `apps/frontend/lib/api/calibration-api.ts`.

## Test Coverage

Current coverage:

- backend service unit tests for create/version/CAS/gallery behavior
- script unit tests for backfill option parsing, dry-run, skip, and transaction failure
- frontend unit tests for template source, structure diff, gallery skip, gallery dialog, and soft-fork dialog
- WF-19/WF-20 E2E coverage for API/gallery and selected UI paths

Manual accessibility checks are documented in
`docs/development/inspection-a11y-manual-checklist.md`.
