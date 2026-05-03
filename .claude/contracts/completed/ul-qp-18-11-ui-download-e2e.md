# ul-qp-18-11-ui-download-e2e

## Status

Completed on 2026-05-03.

## Scope

- Implement the missing backend exporter for `UL-QP-18-11` 보정인자 및 파라미터 관리대장.
- Expose a UI download action from the calibration factors registry page.
- Add the workflow E2E download case to `wf-export-ui-download.spec.ts`.
- Update form catalog and export mapping docs so `UL-QP-18-11` is no longer documented as unimplemented.

## Acceptance Criteria

- `FORM_CATALOG['UL-QP-18-11'].implemented` is `true`.
- `GET /api/reports/export/form/UL-QP-18-11` has a registered exporter.
- The exporter renders the official DOCX template with calibration factor register rows.
- `/reports/calibration-factors` has a user-visible "양식 내보내기" action.
- `wf-export-ui-download.spec.ts` lists the `UL-QP-18-11` user-click download scenario.
- Backend/frontend type-check and targeted lint pass.

## Implementation Notes

- Added `CalibrationFactorRegisterDataService` and `CalibrationFactorRegisterRendererService`.
- The data service uses approved, non-deleted, currently effective `calibration_factors` joined to `equipment` and approver `users`.
- The renderer injects rows into the existing `UL-QP-18-11(00) 보정인자 및 파라미터 관리대장.docx` template.
