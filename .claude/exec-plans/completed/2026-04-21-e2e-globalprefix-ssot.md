---
slug: e2e-globalprefix-ssot
date: 2026-04-21
mode: 2
status: active
---

# Exec Plan: e2e-globalprefix-ssot

## Background

`main.ts:112`에 `app.setGlobalPrefix('api')` 가 있지만 `createTestApp`에는 빠져 있다.
그 결과 모든 E2E 스펙이 `/api` 를 제거하는 `toTestPath()` 래퍼를 호출해야 한다.
`API_ENDPOINTS`를 그대로 쓸 수 없어 SSOT가 무너진다.

**정답**: `createTestApp`에 동일한 globalPrefix 추가 → `toTestPath` 래퍼 전면 제거 → `test-paths.ts` 삭제.

## Phase 1: createTestApp 수정

**파일**: `apps/backend/test/helpers/test-app.ts`

`app.init()` 호출 전에 `app.setGlobalPrefix('api')` 한 줄 추가.

```ts
const app = moduleFixture.createNestApplication();
app.setGlobalPrefix('api');   // ← 추가
await app.init();
```

## Phase 2: toTestPath 제거 — helper 파일 (4개)

**`apps/backend/test/helpers/test-auth.ts`**
- `import { toTestPath } from './test-paths'` 줄 제거
- `toTestPath(API_ENDPOINTS.xxx)` → `API_ENDPOINTS.xxx` 로 교체 (2곳)

**`apps/backend/test/helpers/test-cleanup.ts`**
- `import { toTestPath } from './test-paths'` 줄 제거
- `toTestPath(API_ENDPOINTS.xxx)` → `API_ENDPOINTS.xxx` 로 교체 (12곳)

**`apps/backend/test/helpers/test-fixtures.ts`**
- `import { toTestPath } from './test-paths'` 줄 제거
- `toTestPath(API_ENDPOINTS.xxx)` → `API_ENDPOINTS.xxx` 로 교체 (3곳)

## Phase 3: toTestPath 제거 — E2E spec 파일 (22개)

각 파일에서:
1. `import { toTestPath } from './helpers/test-paths'` 제거
2. `toTestPath(API_ENDPOINTS.xxx)` → `API_ENDPOINTS.xxx` 전체 교체

파일 목록 (총 22개):
1. audit-logs.e2e-spec.ts
2. auth.e2e-spec.ts
3. cables.e2e-spec.ts
4. calibration-factors.e2e-spec.ts
5. calibration-filter.e2e-spec.ts
6. calibration-plans.e2e-spec.ts
7. checkouts.e2e-spec.ts
8. data-migration.e2e-spec.ts
9. equipment-approval.e2e-spec.ts
10. equipment-filters.e2e-spec.ts
11. equipment-history.e2e-spec.ts
12. equipment.e2e-spec.ts
13. history-card-export.e2e-spec.ts
14. incident-non-conformance-integration.e2e-spec.ts
15. intermediate-check.e2e-spec.ts
16. manager-role-constraint.e2e-spec.ts
17. non-conformances.e2e-spec.ts
18. repair-history.e2e-spec.ts
19. shared-equipment.e2e-spec.ts
20. site-permissions.e2e-spec.ts
21. team-filter.e2e-spec.ts
22. users.e2e-spec.ts

## Phase 4: test-paths.ts 삭제

`apps/backend/test/helpers/test-paths.ts` 삭제.
이 파일을 import하는 곳이 0이 된 후 제거.

## Verification

```bash
# 1. toTestPath 잔존 확인 (0건이어야 함)
grep -rn "toTestPath" apps/backend/test/ 2>/dev/null

# 2. TypeScript 검증
pnpm --filter backend run tsc --noEmit

# 3. E2E 테스트 실행
pnpm --filter backend run test:e2e
```
