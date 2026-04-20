# E2E API_ENDPOINTS 마이그레이션 실행 계획

## 배경

`apps/backend/test/` 의 23개 `.e2e-spec.ts` 파일과 2개 헬퍼(`test-fixtures.ts`, `test-auth.ts`)가
supertest 호출에서 API 경로를 하드코딩하고 있다.
`packages/shared-constants/src/api-endpoints.ts` SSOT를 경유하지 않아
백엔드 라우트 변경 시 컴파일 에러로 포착되지 않는다.

이미 `apps/backend/test/helpers/test-cleanup.ts`가 `API_ENDPOINTS` + `toTestPath` 패턴의 참고 모델로 구현되어 있다.

## 전략 결정: Option A

각 spec 파일에서 `API_ENDPOINTS` + `toTestPath` 직접 사용.
`toTestPath` 는 신규 `helpers/test-paths.ts` 로 이관 (test-cleanup.ts 에서 분리).

## Phase 0: 커버리지 갭 보완

파일: `packages/shared-constants/src/api-endpoints.ts`

### 0-1. EQUIPMENT.CREATE_SHARED 추가
- 추가 경로: `POST /api/equipment/shared`
- 위치: EQUIPMENT 블록 내 REQUESTS 블록 다음
- 값: `'/api/equipment/shared'`

### 0-2. EQUIPMENT.REPAIR_HISTORY.SUMMARY 추가
- 추가 경로: `GET /api/equipment/:id/repair-history/summary`
- 위치: EQUIPMENT.REPAIR_HISTORY 블록 내 RECENT 다음
- 값: `(equipmentId: string) => \`/api/equipment/${equipmentId}/repair-history/summary\``

### 0-3. AUTH 블록 확장 (백엔드 직접 호출 + E2E 전용)
기존 `AUTH.LOGIN` (NextAuth callback) 은 유지. 추가:
- `BACKEND_LOGIN: '/api/auth/login'`  — 백엔드 직접 로그인 (E2E/내부 전용)
- `PROFILE: '/api/auth/profile'`      — 프로필 조회
- `TEST: '/api/auth/test'`            — 테스트 환경 헬스
- `TEST_LOGIN: (role: string) => \`/api/auth/test-login?role=${role}\`` — E2E 전용

## Phase 1: test-paths.ts 신설 + test-cleanup.ts 수정

### 1-1. 신규: `apps/backend/test/helpers/test-paths.ts`
- `toTestPath` 함수만 export
- JSDoc: globalPrefix 미설정 차이 설명

### 1-2. 수정: `apps/backend/test/helpers/test-cleanup.ts`
- 로컬 `export const toTestPath` 제거
- `import { toTestPath } from './test-paths'` 추가

## Phase 2: spec 파일 마이그레이션 (23개 + 2 헬퍼)

공통 작업 패턴:
1. `import { API_ENDPOINTS } from '@equipment-management/shared-constants'` 추가
2. `import { toTestPath } from './helpers/test-paths'` 추가
3. 하드코딩 경로 → `toTestPath(API_ENDPOINTS.XXX.YYY(...))` 치환
4. 쿼리스트링: `` `${toTestPath(API_ENDPOINTS.XXX.LIST)}?key=value` ``
5. CAS DELETE: `` `${toTestPath(API_ENDPOINTS.XXX.DELETE(id))}?version=${v}` ``

### 마이그레이션 대상 파일 (25개)
1.  `calibration-factors.e2e-spec.ts`
2.  `site-permissions.e2e-spec.ts`
3.  `history-card-export.e2e-spec.ts`
4.  `equipment-approval.e2e-spec.ts`
5.  `calibration-plans.e2e-spec.ts`
6.  `audit-logs.e2e-spec.ts`
7.  `calibration-filter.e2e-spec.ts`
8.  `data-migration.e2e-spec.ts`
9.  `equipment-filters.e2e-spec.ts`
10. `equipment.e2e-spec.ts`
11. `shared-equipment.e2e-spec.ts`
12. `cables.e2e-spec.ts`
13. `intermediate-check.e2e-spec.ts`
14. `manager-role-constraint.e2e-spec.ts`
15. `checkouts.e2e-spec.ts`
16. `team-filter.e2e-spec.ts`
17. `helpers/test-fixtures.ts`
18. `auth.e2e-spec.ts`
19. `equipment-history.e2e-spec.ts`
20. `users.e2e-spec.ts`
21. `repair-history.e2e-spec.ts`
22. `helpers/test-auth.ts`
23. `incident-non-conformance-integration.e2e-spec.ts`
24. `non-conformances.e2e-spec.ts`
25. `helpers/__tests__/test-isolation.e2e-spec.ts` — 하드코딩 경로 없음, 건드리지 않음

### 특수 케이스
- `POST /checkouts/:id/return` — spec 은 POST, SSOT는 RETURN(id) 경로만 (PATCH). 경로는 SSOT 경유하되 HTTP 메서드 불일치는 tech-debt 분리.
- `cables.e2e-spec.ts` fake UUID `00000000-...` — `CABLES.GET('00000000-...')` 으로 경로만 SSOT 경유, 리터럴 UUID 유지.
- `intermediate-check.e2e-spec.ts` `'some-uuid'` — `INTERMEDIATE_CHECKS.COMPLETE('some-uuid')` 로 경로 SSOT 경유.

## 검증 명령 (순서대로)

```bash
pnpm --filter shared-constants run tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit  # AUTH 확장 회귀 없음 확인
pnpm --filter backend run lint
pnpm --filter backend run test:e2e
```

하드코딩 잔존 확인 (0 hits 기대):
```bash
grep -rn "\.\(get\|post\|patch\|put\|delete\)(['\`]/\(equipment\|checkouts\|calibration\|calibration-factors\|calibration-plans\|non-conformances\|cables\|users\|teams\|audit-logs\|auth\|data-migration\|repair-history\|reports\)" apps/backend/test
```

## 성공 기준
- tsc 에러 0 (shared-constants, backend, frontend)
- E2E 테스트 통과
- 하드코딩 API 경로 잔존 0건
- toTestPath 정의는 helpers/test-paths.ts 한 곳
