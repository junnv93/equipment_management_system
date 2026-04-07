---
slug: team-filtering-e2e
created: 2026-04-05
mode: 1
---

# Contract: team-filtering E2E 재작성 + testIgnore 패턴 정리

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` 통과 | tsc 실행 |
| M2 | 새 `team-filtering.spec.ts`가 Playwright test list에 포함 | `npx playwright test --list` |
| M3 | 기존 4개 skip 파일 삭제됨 | 파일 존재 확인 |
| M4 | `playwright.config.ts` testIgnore 패턴이 `**/overdue-auto-nc/**`로 변경됨 | 파일 읽기 |
| M5 | auth fixture import 패턴 준수 (`../../shared/fixtures/auth.fixture`) | 파일 읽기 |
| M6 | 하드코딩된 API 경로 없음 (URL 문자열은 상대경로 `/api/...` 허용) | grep 확인 |
| M7 | `any` 타입 사용 없음 | grep 확인 |

## SHOULD Criteria

| # | Criterion | Notes |
|---|-----------|-------|
| S1 | 테스트가 실제 브라우저에서 실행 가능 | 서버 미실행 시 SKIP 허용 |
| S2 | 역할별 스코프 검증 포함 (test_engineer vs lab_manager) | 최소 2개 역할 |
| S3 | KPI 링크 teamId 포함 여부 검증 | buildScopedUrl 패턴 |
