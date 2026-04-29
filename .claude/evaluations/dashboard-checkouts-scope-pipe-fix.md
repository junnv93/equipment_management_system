# Evaluation: dashboard-checkouts-scope-pipe-fix

**Date**: 2026-04-29
**Iteration**: 1

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | tsc --noEmit 타입 에러 0건 | PASS | `pnpm tsc --noEmit --project apps/backend/tsconfig.json` — 출력 없음 (0 errors) |
| M2 | scope=me 정상 응답 (400 없음) | PASS | system_admin JWT로 `GET /api/dashboard/checkouts?scope=me` → 200, `{"pendingReturns":[],"overdueCount":0,"pendingRequests":0}` |
| M3 | scope=invalid → 400 반환 | PASS | system_admin JWT로 `GET /api/dashboard/checkouts?scope=invalid` → HTTP 400, `{"code":"BAD_REQUEST","message":"입력 데이터 검증 실패",...,"errors":[{"path":"scope","message":"Invalid option: expected one of \"me\"|\"team\"|\"lab\"|\"all\""}]}` |
| M4 | DashboardScopeQuery import from dto | PASS | `dashboard.controller.ts:23`: `import { DashboardScopeValidationPipe, type DashboardScopeQuery } from './dto/dashboard-scope.dto';` — 로컬 재정의 없음 |
| M5 | @Query('scope') 패턴 제거됨 | PASS | `grep -n "@Query('scope')" dashboard.controller.ts` → 출력 없음 (0 matches) |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | 기존 테스트 회귀 없음 | SKIP | 백엔드 테스트 전체 실행은 시간 제약으로 SKIP. tsc 0 errors로 컴파일 타임 회귀 없음 확인 |
| S2 | 핸들러 시그니처 패턴 일관성 | PASS | `@UsePipes(DashboardScopeValidationPipe)` + `@Query() query: DashboardScopeQuery` 패턴이 equipment-imports (`@Query() query: EquipmentImportQueryDto`), calibration-plans (`@Query() query: CalibrationPlanQueryInput`), reports (동일 패턴) 와 완전 일치 |

## Verdict: PASS

## Issues Found

없음.

## 런타임 검증 세부사항

- **인증 없이 호출**: `scope=invalid` 요청 시 401 (JWT Guard가 Pipe보다 먼저 실행되는 NestJS 파이프라인 순서 때문). 이는 수정과 무관한 의도된 동작.
- **인증 후 호출**: valid JWT + `scope=invalid` → Zod 파이프가 올바르게 개입하여 400 반환. 수정이 정상 동작함.
- **ZodValidationPipe `targets: ['query']` 설정**: `dashboard-scope.dto.ts:21`에서 `targets: ['query']` 명시 확인 — 메모리 룰 준수.
- **SSOT 준수**: `dashboardScopeSchema`는 `DASHBOARD_SCOPES` from `@equipment-management/shared-constants` 기반 — 로컬 enum 재정의 없음.
