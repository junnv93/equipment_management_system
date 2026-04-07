---
slug: ulqp18-compliance-gaps
evaluated: 2026-04-05
iteration: 1
---

# Evaluation: UL-QP-18 절차서 준수 갭 해소

## Build Verification
- tsc: PASS (0 errors across all packages)
- tests: SKIPPED (not run as part of this evaluation)

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | `pnpm tsc --noEmit` passes with 0 errors | PASS | Ran successfully with no output (0 errors) |
| M2 | GET /api/equipment/:uuid/history-card returns valid docx binary | PASS | `equipment-history.controller.ts` line 56: `@Get(':uuid/history-card')` with Content-Type `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| M3 | docx history card aggregates 5 tables | PASS | `history-card.service.ts` imports and queries: equipment, calibrations, checkouts+checkoutItems, repairHistory, nonConformances |
| M4 | documents table has retentionPeriod + retentionExpiresAt | PASS | `packages/db/src/schema/documents.ts` lines 71-72: `retentionPeriod: varchar('retention_period')`, `retentionExpiresAt: timestamp('retention_expires_at')` |
| M5 | equipment_self_inspections table exists with correct schema | PASS | `packages/db/src/schema/equipment-self-inspections.ts`: UUID PK, equipmentId FK, version CAS (integer default 1), inspection items (appearance/functionality/safety/calibrationStatus), confirmation fields (confirmedBy, confirmedAt, status) |
| M6 | Self-inspection CRUD endpoints (6 endpoints) | PASS | `self-inspections.controller.ts`: POST `:uuid/self-inspections`, GET `:uuid/self-inspections`, GET `:uuid` (detail), PATCH `:uuid` (update), PATCH `:uuid/confirm`, DELETE `:uuid` -- all 6 present |
| M7 | @RequirePermissions on ALL new endpoints | PASS | history-card: `Permission.VIEW_EQUIPMENT`; self-inspections: `VIEW_SELF_INSPECTIONS`, `CREATE_SELF_INSPECTION`, `CONFIRM_SELF_INSPECTION`; form export: `Permission.EXPORT_REPORTS` |
| M8 | Server-side userId extraction on all mutation endpoints | PASS | All mutations use `extractUserId(req)` or `req.user.userId` -- create (line 52), update (line 99), confirm (line 113). No userId in body DTOs. |
| M9 | CAS (version field) on update and confirm | PASS | `self-inspections.service.ts`: update checks `existing.version !== dto.version` (line 142) + WHERE clause with version (line 179); confirm checks version (line 215) + WHERE clause (line 234). Double-check pattern (read-then-CAS-write). |
| M10 | SelfInspectionResult + SelfInspectionItemJudgment in schemas package | PASS | `packages/schemas/src/enums/self-inspection.ts` exports both types and their Zod enums |
| M11 | Permissions in shared-constants | PASS | `packages/shared-constants/src/permissions.ts` lines 157-159: `VIEW_SELF_INSPECTIONS`, `CREATE_SELF_INSPECTION`, `CONFIRM_SELF_INSPECTION` |
| M12 | Frontend self-inspection tab in EquipmentTabs | PASS | `EquipmentTabs.tsx` line 88-91: dynamic import of SelfInspectionTab; line 169-173: tab config with value `'self-inspection'` |
| M13 | Frontend "이력카드 내보내기" button triggers docx download | PASS | `EquipmentStickyHeader.tsx` lines 226-235: Download button calling `downloadHistoryCard(equipmentId)` via dynamic import |
| M14 | Form template export endpoint (at least 1 form) returns valid binary | PASS | `reports.controller.ts` line 381: `@Get('export/form/:formNumber')` with binary response. `FormTemplateExportService` handles UL-QP-18-01 through 11 with xlsx binary output. |
| M15 | Retention expiry scheduler exists and queries documents.retentionExpiresAt | PASS | `retention-expiry-scheduler.ts`: `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` queries `documents.retentionExpiresAt` with 30-day lookahead window |

## SHOULD Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| S1 | @AuditLog on all mutation endpoints | PASS | Self-inspections controller: @AuditLog on create, update, confirm, delete. History-card: @AuditLog on export. Form template: @AuditLog on export. |
| S2 | Cache invalidation on self-inspection mutations | FAIL | No cache invalidation found in self-inspections service or controller. No CacheInvalidationHelper usage. |
| S3 | i18n keys in both en/ko for all new UI strings | PASS | Both `messages/en/equipment.json` and `messages/ko/equipment.json` contain `selfInspection` keys (title, empty, date, appearance, functionality, safety, calibrationStatus, overallResult, status). Also `tabs.selfInspection` and `header.exportHistoryCard` present in both. |
| S4 | Zod validation via ZodValidationPipe on all new DTOs | PASS | `create-self-inspection.dto.ts` uses `ZodValidationPipe` with Zod schema importing SSOT enums. `update-self-inspection.dto.ts` likewise. Controller uses `@UsePipes(CreateSelfInspectionPipe)` and `@UsePipes(UpdateSelfInspectionPipe)`. |
| S5 | Frontend uses TanStack Query for self-inspection data | PASS | `SelfInspectionTab.tsx` uses `useQuery` with `queryKeys.equipment.selfInspections(equipmentId)`. No useState for server state. |
| S6 | All 11 form templates have export endpoints | PASS | `FormTemplateExportService` maps UL-QP-18-01 through UL-QP-18-11 (all 11). Most return placeholder xlsx; 01 and 05 have real data. |
| S7 | Retention period default mapping covers all 11 form numbers | PASS | `retention.service.ts` FORM_RETENTION_PERIODS has entries for UL-QP-18-01 through UL-QP-18-11 (all 11). |
| S8 | nextInspectionDate auto-calculated from inspectionCycle | PASS | `self-inspections.service.ts` create (lines 53-55) and update (lines 163-170) both auto-calculate nextInspectionDate from inspectionCycle. |
| S9 | API_ENDPOINTS constants added for all new endpoints | PASS | `api-endpoints.ts` has HISTORY_CARD, FORM_TEMPLATE, and SELF_INSPECTIONS (BY_EQUIPMENT, GET, UPDATE, CONFIRM, DELETE). |
| S10 | Unit tests for history-card, self-inspections, retention, form-template-export | FAIL | No `.spec.ts` files found in `modules/self-inspections/` or `modules/equipment/services/`. No unit tests for any of the new services. |

## Summary
- MUST: 15/15 PASS
- SHOULD: 8/10 PASS (S2 cache invalidation, S10 unit tests FAIL)
- Overall: **PASS** (all MUST criteria met; 2 SHOULD criteria recorded as tech-debt)

### Tech-Debt Notes
1. **S2 (Cache invalidation)**: Self-inspection mutations (create/update/confirm/delete) do not invalidate any cache. If caching is added later for equipment detail or self-inspection lists, stale data will be served until TTL expires.
2. **S10 (Unit tests)**: Zero unit tests for the 4 new services (HistoryCardService, SelfInspectionsService, RetentionService, FormTemplateExportService). This is a significant gap for production readiness.
