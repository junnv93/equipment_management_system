# Execution Plan: UL-QP-18-07/09 Software Domain Export

**Slug**: `software-export`
**Date**: 2026-04-06
**Mode**: 2 (Full)

---

## Gap Analysis Summary

| Form | Schema Coverage | Seed Coverage | Export Status |
|------|----------------|---------------|---------------|
| UL-QP-18-07 (관리대장) | 11/11 fields | 75 records (P0001~P0073) | Not Implemented |
| UL-QP-18-09 (유효성확인) | 34/34 fields | 10 records (all states) | Not Implemented |

**Schema gaps: None.** All procedure form fields are covered by existing DB schema.

---

## Phase 1: QP-18-07 XLSX Exporter

### File 1: `apps/backend/src/modules/reports/form-template-export.service.ts`
- Register `'UL-QP-18-07'` in exporters map
- Add `exportSoftwareRegistry(params, scope)` method:
  - Query: `testSoftware` LEFT JOIN `users` (x2: primary/secondary manager)
  - Filters: site (from scope), testField, availability (from params)
  - 11 columns matching procedure: 관리번호, SW명, 버전, 시험분야, 담당자(정), 담당자(부), 설치일자, 제작사, 위치, 가용여부, 유효성확인대상
  - Label mappings: `availability` → `SOFTWARE_AVAILABILITY_LABELS`, `requiresValidation` → X/O
  - Template: load via `getTemplateBuffer('UL-QP-18-07')`

### File 2: `packages/shared-constants/src/form-catalog.ts`
- Set `UL-QP-18-07` → `implemented: true`

### Verification
- `tsc --noEmit` 0 errors

---

## Phase 2: QP-18-09 DOCX Exporter

### File 1: `apps/backend/src/modules/reports/form-template-export.service.ts`
- Register `'UL-QP-18-09'` in exporters map
- Add `exportSoftwareValidation(params, scope)` method:
  - Required param: `validationId`
  - Query: `softwareValidations` INNER JOIN `testSoftware`, resolve user names for all FK fields
  - Branch on `validationType`:
    - **vendor**: Fill header (vendorName, SW name+version, infoDate) + body (summary, receivedBy, receivedDate, attachmentNote)
    - **self**: Fill header (name, author, version, references) + body (operatingUnit, swComponents, hwComponents) + 3 function tables (JSONB → setDataRows)
  - Approval: testDate, performedBy + signature images (technicalApprover, qualityApprover)
  - Defensive JSONB parsing with `Array.isArray()` guard
  - Template: load via `getTemplateBuffer('UL-QP-18-09')`

### File 2: `packages/shared-constants/src/form-catalog.ts`
- Set `UL-QP-18-09` → `implemented: true`

### Verification
- `tsc --noEmit` 0 errors

---

## Phase 3: Verification & Cleanup

- Run type check
- Verify form-catalog.ts SSOT consistency
- No seed data changes needed (already complete)
