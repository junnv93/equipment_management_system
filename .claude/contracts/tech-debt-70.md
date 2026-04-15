# Contract: tech-debt-70

**Slug**: tech-debt-70
**Mode**: 1 (Lightweight)
**Date**: 2026-04-15
**Issues**: M4 (form-template-export Promise.all) + M1 (equipment tabs QUERY_CONFIG) + M2 (FormTemplates REFETCH_STRATEGIES unification)

---

## Scope

### M4 — form-template-export.service.ts 순차 await → Promise.all
- `apps/backend/src/modules/reports/form-template-export.service.ts`
- intermediate export: inspector + approver + items + measureEquipment 4개 쿼리 병렬화
- checkout export: condChecks + requester + approver 3개 쿼리 병렬화

### M1 — 장비 상세 탭 useQuery QUERY_CONFIG spread
- `apps/frontend/lib/api/query-config.ts` — EQUIPMENT_DOCUMENTS, FORM_TEMPLATES 엔트리 추가
- `apps/frontend/components/equipment/AttachmentsTab.tsx` — staleTime → EQUIPMENT_DOCUMENTS
- `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` — staleTime 2건 → HISTORY + EQUIPMENT_DOCUMENTS
- `apps/frontend/components/equipment/CheckoutHistoryTab.tsx` — HISTORY 추가
- `apps/frontend/components/equipment/SoftwareTab.tsx` — staleTime 2건 → EQUIPMENT_DOCUMENTS + HISTORY
- `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx` — EQUIPMENT_DETAIL 추가

### M2 — FormTemplates QUERY_CONFIG.FORM_TEMPLATES
- `apps/frontend/components/form-templates/FormTemplatesContent.tsx` — REFETCH_STRATEGIES → QUERY_CONFIG
- `apps/frontend/components/form-templates/FormTemplatesArchivedTable.tsx` — 동일
- `apps/frontend/components/form-templates/FormTemplateHistoryDialog.tsx` — 동일 (2건)

---

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | frontend tsc | `pnpm --filter frontend run tsc --noEmit` → exit 0 |
| M2 | backend tsc | `pnpm --filter backend run tsc --noEmit` → exit 0 |
| M3 | Promise.all 적용 | `grep 'Promise.all' apps/backend/src/modules/reports/form-template-export.service.ts` → 2+ hit |
| M4 | EQUIPMENT_DOCUMENTS 정의 | `grep 'EQUIPMENT_DOCUMENTS' apps/frontend/lib/api/query-config.ts` → 1 hit (정의) |
| M5 | FORM_TEMPLATES 정의 | `grep 'FORM_TEMPLATES' apps/frontend/lib/api/query-config.ts` → 1 hit (정의) |
| M6 | CheckoutHistoryTab staleTime | `grep 'QUERY_CONFIG.HISTORY\|staleTime' apps/frontend/components/equipment/CheckoutHistoryTab.tsx` → 1 hit |
| M7 | REFETCH_STRATEGIES.STATIC 제거 | `grep 'REFETCH_STRATEGIES.STATIC' apps/frontend/components/form-templates/` → 0 hit |
| M8 | staleTime: CACHE_TIMES 직접 사용 제거 | `grep 'staleTime: CACHE_TIMES' apps/frontend/components/equipment/{AttachmentsTab,CalibrationHistoryTab,SoftwareTab}.tsx` → 0 hit |
| M9 | 기능 동작 유지 | staleTime 값 변경 없음 (LONG→EQUIPMENT_DOCUMENTS.staleTime=LONG, MEDIUM→HISTORY.staleTime=MEDIUM) |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | CACHE_TIMES import 제거 (사용처 없어지면) |
| S2 | Promise.all 주석으로 병렬화 의도 명시 |
| S3 | backend test 기존 통과 유지 |
