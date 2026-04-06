# Exec Plan: 양식 관리 페이지 (Form Template UI)

**Slug**: `form-template-ui`
**Date**: 2026-04-06
**Mode**: 2 (Full)

## Phase 1: Shared Constants
- `permissions.ts`: VIEW_FORM_TEMPLATES, MANAGE_FORM_TEMPLATES
- `role-permissions.ts`: VIEW → 전 역할, MANAGE → TM/QM/LM/Admin
- `api-endpoints.ts`: FORM_TEMPLATES 섹션
- `frontend-routes.ts`: /form-templates

## Phase 2: Backend Controller
- `form-template.controller.ts` (신규): GET list, GET download, POST upload, GET history
- `reports.module.ts`: 컨트롤러 등록

## Phase 3: Frontend API + Query Config
- `form-templates-api.ts` (신규): list, download, upload, history
- `query-config.ts`: queryKeys.formTemplates

## Phase 4: Frontend Page + Components
- `form-templates/page.tsx`, `loading.tsx`, `error.tsx`
- `FormTemplatesContent.tsx`, `FormTemplatesTable.tsx`
- `FormTemplateUploadDialog.tsx`, `FormTemplateHistoryDialog.tsx`

## Phase 5: Sidebar + i18n
- `nav-config.ts`: 양식 관리 메뉴
- `ko/en navigation.json`, `ko/en form-templates.json`

## Phase 6: E2E Tests
- `form-templates.spec.ts`: 목록/다운로드/업로드/권한/이력
