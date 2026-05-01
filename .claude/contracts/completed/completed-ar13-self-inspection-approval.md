# Contract: ar13-self-inspection-approval

**Slug**: ar13-self-inspection-approval
**Mode**: 1 (Lightweight)
**Date**: 2026-04-27
**Source**: tech-debt-tracker.md → MEDIUM ar-13-self-inspection-category

## Background

`self_inspections` 모듈에 approve/reject 엔드포인트가 존재하지만,
통합 승인 시스템(`ApprovalCategory`)에 `self_inspection` 카테고리가 누락되어 있다.
결과: 기술책임자의 자체점검 승인 업무가 통합 승인 뷰에 노출되지 않음.

승인 권한 보유 역할:
- `technical_manager`: APPROVE_SELF_INSPECTION (UL-QP-18-05)
- `lab_manager`: APPROVE_SELF_INSPECTION (전체 권한)

## Deliverables

### Packages

| File | Change |
|------|--------|
| `packages/schemas/src/enums/approval.ts` | `APPROVAL_CATEGORY_VALUES`에 `'self_inspection'` 추가, `ApprovalCategoryValues.SELF_INSPECTION = 'self_inspection'` 추가 |
| `packages/shared-constants/src/data-scope.ts` | `SELF_INSPECTION_DATA_SCOPE: FeatureScopePolicy` 추가 (INTERMEDIATE_CHECK_DATA_SCOPE 패턴 동일) |
| `packages/shared-constants/src/index.ts` | `SELF_INSPECTION_DATA_SCOPE` export 추가 |
| `packages/shared-constants/src/approval-categories.ts` | `technical_manager`에 `AC.SELF_INSPECTION` 추가 |
| `packages/shared-constants/src/api-endpoints.ts` | `SELF_INSPECTIONS.PENDING_APPROVAL` endpoint 추가 |

### Backend

| File | Change |
|------|--------|
| `apps/backend/src/modules/self-inspections/self-inspections.service.ts` | `findPendingApproval(userCtx: UserScopeContext)` 추가 — equipment JOIN, site/team 스코프 적용, status='submitted' 필터 |
| `apps/backend/src/modules/self-inspections/self-inspections.controller.ts` | `SelfInspectionsController`에 `GET /self-inspections/pending-approval` 추가 — `:uuid` 라우트 앞에 선언 |
| `apps/backend/src/modules/approvals/approvals.service.ts` | `PendingCountsByCategory`에 `self_inspection: number` 추가, `getSelfInspectionCount()` + `getSelfInspectionKpi()` 추가, `getApprovalCountsByScope` 통합, `getKpiByCategory` switch 추가 |

### Frontend

| File | Change |
|------|--------|
| `apps/frontend/lib/api/approvals-api.ts` | `TAB_META.self_inspection` 추가, `SelfInspectionApprovalRow` 인터페이스 추가, type union 확장, getPendingSelfInspections() 추가, approve/reject switch case 추가, mapSelfInspectionToApprovalItem() 추가 |
| `apps/frontend/messages/ko/approvals.json` | `tabMeta.self_inspection.*` i18n 키 추가 |
| `apps/frontend/messages/en/approvals.json` | `tabMeta.self_inspection.*` i18n 키 추가 |

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `APPROVAL_CATEGORY_VALUES` includes `'self_inspection'` | `grep -n "self_inspection" packages/schemas/src/enums/approval.ts` |
| M2 | `ApprovalCategoryValues.SELF_INSPECTION` = `'self_inspection'` | same file |
| M3 | `SELF_INSPECTION_DATA_SCOPE` exported from shared-constants | `grep -n "SELF_INSPECTION_DATA_SCOPE" packages/shared-constants/src/index.ts` |
| M4 | `ROLE_APPROVAL_CATEGORIES.technical_manager` includes `'self_inspection'` | `grep -A10 "technical_manager" packages/shared-constants/src/approval-categories.ts` |
| M5 | `PendingCountsByCategory.self_inspection: number` in backend | `grep -n "self_inspection" apps/backend/src/modules/approvals/approvals.service.ts` |
| M6 | `getSelfInspectionCount()` exists and uses `SELF_INSPECTION_DATA_SCOPE` | same file |
| M7 | `getSelfInspectionKpi()` exists | same file |
| M8 | `getApprovalCountsByScope` integrates `AC.SELF_INSPECTION` branch | same file |
| M9 | `getKpiByCategory` switch has `case AC.SELF_INSPECTION` | same file |
| M10 | `GET /api/self-inspections/pending-approval` endpoint exists | `grep -n "pending-approval" apps/backend/src/modules/self-inspections/self-inspections.controller.ts` |
| M11 | Route ordering: pending-approval declared before `:uuid` | line number check |
| M12 | `TAB_META.self_inspection` defined with section='equipment', canReject=true | `grep -n "self_inspection" apps/frontend/lib/api/approvals-api.ts` |
| M13 | Frontend approve case for `'self_inspection'` calls correct endpoint | same file |
| M14 | Frontend reject case for `'self_inspection'` calls correct endpoint | same file |
| M15 | ko/en approvals.json에 `tabMeta.self_inspection.*` 키 존재 | grep |
| M16 | `pnpm --filter backend tsc --noEmit` passes | build verification |
| M17 | `pnpm --filter frontend tsc --noEmit` passes | build verification |
| M18 | `pnpm --filter backend run test` passes | unit tests |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `lab_manager`도 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 포함 |
| S2 | E2E test for self-inspection approval flow |
| S3 | KPI todayProcessed includes `self_inspection` actions from audit_logs |

## Security Checklist

- [ ] Route에 `@RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)` 적용
- [ ] `findPendingApproval`에 site/team scope 적용 (SELF_INSPECTION_DATA_SCOPE)
- [ ] userId는 JWT에서 추출 (body 신뢰 금지)

## SSOT Checklist

- [ ] `self_inspection` 문자열 로컬 재정의 없음 — `ApprovalCategoryValues.SELF_INSPECTION` 경유
- [ ] `ROLE_APPROVAL_CATEGORIES` SSOT: shared-constants만 수정, 로컬 재정의 금지
- [ ] API endpoint 상수는 `API_ENDPOINTS.SELF_INSPECTIONS.PENDING_APPROVAL` 경유
