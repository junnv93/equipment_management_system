# Contract: inspection-template-controller-integration-test

## Scope

Close tech-debt item `controller-integration-test` for inspection form template controllers.

## MUST

- Cover `EquipmentInspectionTemplateController` and `InspectionTemplatesGalleryController`.
- Verify controller permission metadata for latest/upsert/gallery endpoints.
- Verify invalid inspection type fails before service access.
- Verify upsert uses server-side actor metadata from the authenticated request.
- Verify Zod body/query pipes for upsert and gallery behavior.

## SHOULD

- Keep the test focused on controller seams and avoid DB/service duplication already covered by service specs.
