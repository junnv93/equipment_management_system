# Contract: 유효성확인 상세 뷰 + 반려 재제출

## Slug: validation-detail-revise
## Mode: 1
## Date: 2026-04-05

## MUST Criteria

| # | Criterion |
|---|-----------|
| M1 | `pnpm tsc --noEmit` error 0 |
| M2 | `pnpm --filter backend run build` 성공 |
| M3 | `pnpm --filter frontend run build` 성공 |
| M4 | `pnpm --filter backend run test` 전체 통과 |
| M5 | /software/[id]/validation/[validationId] 라우트 존재 + 렌더링 |
| M6 | 상세 페이지에 방법1/2 모든 필드 표시 (조건부) |
| M7 | 승인자/승인일시/반려사유 표시 |
| M8 | PATCH /software-validations/:uuid/revise — rejected→draft 전이 |
| M9 | 목록 테이블에서 행 클릭 → 상세 페이지 이동 |
| M10 | rejected 행에 "재수정" 버튼 → draft로 전환 |
| M11 | SSOT: API_ENDPOINTS, queryKeys, FRONTEND_ROUTES 하드코딩 없음 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | i18n en/ko 상세뷰 라벨 키 완전 |
| S2 | 상세 페이지에서 draft 상태 시 수정 버튼 |
| S3 | @AuditLog + @RequirePermissions on revise endpoint |
