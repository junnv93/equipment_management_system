---
slug: ulqp18-compliance-gaps
created: 2026-04-05
type: contract
---

# Contract: UL-QP-18 절차서 준수 갭 해소

## MUST Criteria (FAIL blocks merge)
- [ ] M1: `pnpm tsc --noEmit` passes with 0 errors across all packages
- [ ] M2: GET /api/equipment/:uuid/history-card returns valid docx binary (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document)
- [ ] M3: docx history card aggregates data from all 5 tables (equipment, calibrations, checkouts, repair_history, non_conformances)
- [ ] M4: documents table has retentionPeriod (varchar) and retentionExpiresAt (timestamp) columns
- [ ] M5: equipment_self_inspections table exists with correct schema (UUID PK, equipmentId FK, version CAS, inspection items, confirmation fields)
- [ ] M6: Self-inspection CRUD endpoints compile and respond (POST, GET list, GET detail, PATCH, PATCH confirm, DELETE)
- [ ] M7: @RequirePermissions on ALL new endpoints (history-card, self-inspections, form exports)
- [ ] M8: Server-side userId extraction on all mutation endpoints (req.user.userId, not body)
- [ ] M9: CAS (version field) on equipment_self_inspections update and confirm operations
- [ ] M10: New enums (SelfInspectionResult, SelfInspectionItemJudgment) exported from @equipment-management/schemas
- [ ] M11: New permissions (VIEW_SELF_INSPECTIONS, CREATE_SELF_INSPECTION, CONFIRM_SELF_INSPECTION) defined in shared-constants
- [ ] M12: Frontend self-inspection tab renders in EquipmentTabs without runtime errors
- [ ] M13: Frontend "이력카드 내보내기" button triggers docx download
- [ ] M14: Form template export endpoint (at least 1 form) returns valid docx/xlsx binary
- [ ] M15: Retention expiry scheduler exists and queries documents.retentionExpiresAt

## SHOULD Criteria (recorded as tech-debt if failed)
- [ ] S1: @AuditLog on all mutation endpoints
- [ ] S2: Cache invalidation on self-inspection mutations
- [ ] S3: i18n keys in both en/ko for all new UI strings
- [ ] S4: Zod validation via ZodValidationPipe on all new DTOs
- [ ] S5: Frontend uses TanStack Query for self-inspection data (no useState for server state)
- [ ] S6: All 11 form templates (UL-QP-18-01 ~ UL-QP-18-11) have export endpoints
- [ ] S7: Retention period default mapping covers all 11 form numbers
- [ ] S8: Self-inspection nextInspectionDate auto-calculated from inspectionCycle
- [ ] S9: API_ENDPOINTS constants added for all new endpoints
- [ ] S10: Unit tests for history-card, self-inspections, retention, form-template-export services
