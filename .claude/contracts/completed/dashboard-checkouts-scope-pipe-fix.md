# Contract: dashboard-checkouts-scope-pipe-fix

**Slug**: dashboard-checkouts-scope-pipe-fix  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-29  
**Scope**: Backend — dashboard.controller.ts 단일 파일 수정

## Problem Statement

`GET /api/dashboard/checkouts?scope=me` 호출 시 ZodValidationPipe가 400을 반환.

- **원인**: `@Query('scope')` 데코레이터는 string `"me"`를 추출하는데,
  `DashboardScopeValidationPipe` 스키마 `z.object({ scope: ... })`는 객체를 기대함.
- **올바른 패턴**: 프로젝트 전체 표준은 `@UsePipes(Pipe)` + `@Query()` (풀 객체) 조합.
  equipment-imports, calibration-plans, reports 모두 동일 패턴 사용.

## Fix Target

**File**: `apps/backend/src/modules/dashboard/dashboard.controller.ts`

- `@Query('scope') scope: DashboardScope` → `@Query() query: DashboardScopeQuery`
- 핸들러 내부 `scope` → `query.scope` 참조 업데이트
- `DashboardScopeQuery` 타입 import 추가

## MUST Criteria (PASS/FAIL)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter backend run tsc --noEmit` — 타입 에러 0건 | CLI 실행 |
| M2 | `GET /api/dashboard/checkouts?scope=me` — 400 없이 정상 응답 | 런타임 확인 (dev 서버) |
| M3 | `GET /api/dashboard/checkouts?scope=invalid` — 400 반환 (Zod 검증 동작) | 런타임 확인 |
| M4 | `DashboardScopeQuery` 타입이 dto 파일에서 import됨 (로컬 재정의 없음) | grep 확인 |
| M5 | `@Query('scope')` 패턴이 dashboard.controller.ts에서 제거됨 | grep 확인 |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `pnpm --filter backend run test` — 기존 테스트 회귀 없음 |
| S2 | 수정된 핸들러 시그니처가 다른 컨트롤러 패턴과 일관됨 |
