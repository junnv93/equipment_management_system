# Contract: form-template-ui

**Date**: 2026-04-06

## MUST Criteria

| # | Criterion | Verification |
|---|---|---|
| M-1 | GET /api/form-templates → 200 + 양식 목록 반환 | curl |
| M-2 | GET /api/form-templates/:formNumber/download → 200 + 바이너리 파일 | curl |
| M-3 | POST /api/form-templates/:formNumber/upload → 201 + 새 버전 생성 | curl |
| M-4 | GET /api/form-templates/:formNumber/history → 200 + 버전 이력 | curl |
| M-5 | VIEW_FORM_TEMPLATES 권한이 전 역할에 부여됨 | 코드 확인 |
| M-6 | MANAGE_FORM_TEMPLATES 권한이 TM/QM/LM/Admin에만 부여됨 | 코드 확인 |
| M-7 | TE가 upload 시 403 반환 | curl |
| M-8 | /form-templates 페이지가 렌더링됨 | 브라우저/E2E |
| M-9 | 사이드바에 양식 관리 메뉴 표시 | 브라우저/E2E |
| M-10 | tsc --noEmit 통과 (backend + frontend) | CLI |
| M-11 | pnpm --filter backend run build 통과 | CLI |
| M-12 | pnpm --filter backend run test 통과 | CLI |

## SHOULD Criteria

| # | Criterion |
|---|---|
| S-1 | E2E: 양식 목록 조회 테스트 통과 |
| S-2 | E2E: 다운로드 테스트 통과 |
| S-3 | E2E: 업로드 + 버전 증가 테스트 통과 |
| S-4 | E2E: TE 업로드 권한 차단 테스트 통과 |
| S-5 | i18n: ko/en 키 일치 |
