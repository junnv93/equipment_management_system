# Contract: tech-debt-0427-batch

**Slug**: tech-debt-0427-batch
**Mode**: 2 (Full)
**Date**: 2026-04-27
**Source**: tech-debt-tracker.md 오픈 항목 3건 + ar13-self-inspection-approval 완성

## Scope

이번 harness에서 처리한 항목:

1. **i18n-qr-micro-size** — `qrDisplay.sampler.header.micro` + `qrDisplay.size.micro` 키 추가 (ko/en)
2. **ar13-self-inspection-approval** — packages + backend + frontend 전체 완성 (이전 세션 미완성 작업 인계)
3. **revoke-approval-workflow-e2e** — `docs/workflows/critical-workflows.md` WF-AP-03 등록 + E2E 스펙 작성

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | ko/qr.json: `qrDisplay.sampler.header.micro` = "초소형 ({widthMm} × {heightMm} mm)" | `grep -n "micro" apps/frontend/messages/ko/qr.json` |
| M2 | en/qr.json: `qrDisplay.sampler.header.micro` = "Micro ({widthMm} × {heightMm} mm)" | `grep -n "micro" apps/frontend/messages/en/qr.json` |
| M3 | ko/qr.json: `qrDisplay.size.micro` 존재 | same file |
| M4 | en/qr.json: `qrDisplay.size.micro` 존재 | same file |
| M5 | `APPROVAL_CATEGORY_VALUES` includes `'self_inspection'` | `grep "self_inspection" packages/schemas/src/enums/approval.ts` |
| M6 | `SELF_INSPECTION_DATA_SCOPE` exported from shared-constants | `grep "SELF_INSPECTION_DATA_SCOPE" packages/shared-constants/src/index.ts` |
| M7 | `ROLE_APPROVAL_CATEGORIES.technical_manager` includes `AC.SELF_INSPECTION` | `grep "SELF_INSPECTION" packages/shared-constants/src/approval-categories.ts` |
| M8 | backend `GET /api/self-inspections/pending-approval` 라우트 존재 | `grep -n "pending-approval" apps/backend/src/modules/self-inspections/self-inspections.controller.ts` |
| M9 | backend `PendingCountsByCategory.self_inspection: number` | `grep -n "self_inspection" apps/backend/src/modules/approvals/approvals.service.ts` |
| M10 | frontend `TAB_META.self_inspection` 정의 | `grep -n "self_inspection" apps/frontend/lib/api/approvals-api.ts` |
| M11 | ko/en `approvals.json`에 `tabMeta.self_inspection` 키 존재 | `grep -n "self_inspection" apps/frontend/messages/ko/approvals.json` |
| M12 | `docs/workflows/critical-workflows.md`에 WF-AP-03 섹션 등록 | `grep -n "WF-AP-03\|WF-AP03" docs/workflows/critical-workflows.md` |
| M13 | `wf-ap03-revoke-approval.spec.ts` 파일 존재 | `ls apps/frontend/tests/e2e/workflows/wf-ap03-revoke-approval.spec.ts` |
| M14 | spec: Step 1 createCheckout → Step 2 INVALID_TRANSITION → Step 3 approve → Step 4 revoke success → Step 6 FORBIDDEN | 파일 내용 확인 |
| M15 | `pnpm tsc --noEmit` 0 errors | build verification |
| M16 | `pnpm --filter backend run test` passes | unit tests |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `lab_manager`도 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 포함 |
| S2 | wf-ap03 spec: `REVOCATION_WINDOW_EXPIRED` 명시적 E2E 검증 (5분 대기 없이 mock 또는 skip-mark) |
| S3 | KPI todayProcessed includes `self_inspection` actions from audit_logs |

## Security Checklist

- [x] `GET /self-inspections/pending-approval`에 `@RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)` 적용
- [x] `findPendingApproval`에 SELF_INSPECTION_DATA_SCOPE scope 적용
- [x] revokeApproval: scope → FSM → domain 순서 보안 fail-close 원칙
