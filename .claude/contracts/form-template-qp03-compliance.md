# Contract: form-template-qp03-compliance

**Date**: 2026-04-07
**참조**: UL-QP-03 §6.1·§7.5·§11
**Plan**: `.claude/exec-plans/active/2026-04-07-form-template-qp03-compliance.md`

## MUST

| # | 기준 | 검증 |
|---|---|---|
| M-1 | `pnpm --filter backend run tsc --noEmit` PASS | CLI |
| M-2 | `pnpm --filter frontend run tsc --noEmit` PASS | CLI |
| M-3 | `pnpm --filter backend run build` PASS | CLI |
| M-4 | `pnpm --filter frontend run build` PASS | CLI |
| M-5 | backend test 관련 스위트 PASS (해당 시) | CLI |
| M-6 | `formTemplateCreateBodySchema.changeSummary` z.string min(5) | 코드 |
| M-7 | 신규 엔드포인트 `GET /revisions`, `GET /archived` 모두 `@RequirePermissions(VIEW_FORM_TEMPLATES)` | 코드 |
| M-8 | API 경로 SSOT — `API_ENDPOINTS.FORM_TEMPLATES.REVISIONS_BY_NAME` 사용 | 코드 |
| M-9 | queryKeys SSOT — `queryKeys.formTemplates.revisionsByName` 사용 | 코드 |
| M-10 | ko/en form-templates.json 키 집합 일치 | verify-i18n |
| M-11 | `listAllCurrent()`, `findCurrentByName()`에 `archivedAt IS NULL` 필터 | 코드 |
| M-12 | `listHistoryByName()`은 archivedAt 필터 없음 | 코드 |
| M-13 | `createFormTemplateVersion()` 트랜잭션 내 revision INSERT | 코드 |
| M-14 | changeSummary는 ZodValidationPipe 경유 | 코드 |
| M-15 | `archiveExpiredForms()` retentionYears 0/음수/undefined 항목 스킵 | 코드 |
| M-16 | `form_template_revisions.version` CAS 필드 존재 | 스키마 |
| M-17 | `FormTemplateArchivalService` providers 등록 | 코드 |
| M-18 | `FormCatalogEntry.category` + 모든 항목 값 부여 | 코드 |
| M-19 | UploadDialog: 개정(currentFormNumber!=null) 모드일 때만 changeSummary 표시 | 코드 |
| M-20 | onSuccess setQueryData 사용 없음 | 코드 |

## SHOULD

- S-1 `GET /archived` 엔드포인트
- S-2 카테고리 Badge 표시
- S-3 이력 다이얼로그 changeSummary 컬럼
- S-4 권장 관리자 라벨 표시

## 합격 기준
MUST 20개 전부 PASS.
