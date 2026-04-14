---
slug: tech-debt-62-61-cleanup
date: 2026-04-14
mode: 1
scope: CI pipeline + DB schema + ESLint + package cleanup
domains: ci, packages/db, backend-config
active-plan-exclusion: cables/monitoring/software-validations/test-software/intermediate-inspections (unit-test-5modules 도메인 침범 금지)
---

# Contract: Tech Debt 62차/61차 Cleanup

## 변경 범위

### 이번 세션 직접 변경
1. `.github/workflows/main.yml` — build job에 turbo-cache step 추가 (quality-gate/unit-test와 동일 패턴)
2. `packages/db/src/schema/equipment.ts` — drizzle-zod dead import 제거 (createInsertSchema, createSelectSchema, z)
3. `apps/backend/src/modules/intermediate-inspections/__tests__/intermediate-inspections.service.spec.ts` — `_MOCK_INSPECTION_WITH_RELATIONS` (lint fix)

### 이전 세션 완료 (unstaged, 이번 커밋에 포함)
4. `apps/backend/package.json` — @typescript-eslint v6→v8 + collectCoverageFrom src/ 범위
5. `apps/backend/.eslintrc.js` — caughtErrorsIgnorePattern 추가 (v8 호환)
6. `apps/backend/src/common/i18n/i18n.service.ts` — `_error` (v8 lint fix)
7. `apps/backend/src/modules/data-migration/services/data-migration.service.ts` — 명시적 return type 추가 (v8 lint fix)
8. `apps/backend/src/modules/teams/teams.service.ts` — Promise.all 병렬화 (확인됨)
9. `packages/db/src/schema/teams.ts` — siteClassificationIdx 복합 인덱스 (classificationIdx 제거)
10. `apps/backend/drizzle/meta/_journal.json` — 마이그레이션 저널 업데이트

## MUST criteria

- [ ] **M1** `pnpm --filter backend run type-check` → exit 0
- [ ] **M2** `pnpm --filter backend run lint` → exit 0 (0 errors)
- [ ] **M3** `.github/workflows/main.yml` YAML 유효 (`python3 -c "import yaml; yaml.safe_load(open(...))"`)
- [ ] **M4** CI build job에 turbo-cache step 존재: `grep -n 'turbo-cache' .github/workflows/main.yml` → 3곳 (quality-gate:63, unit-test:170, build:~240)
- [ ] **M5** drizzle-zod import 제거: `grep 'drizzle-zod' packages/db/src/schema/equipment.ts` → 0 hit (주석 제외)
- [ ] **M6** drizzle-zod이 제거된 후 `z` import도 없어야 함: `grep "from 'zod'" packages/db/src/schema/equipment.ts` → 0 hit
- [ ] **M7** @typescript-eslint 버전 일치: `grep typescript-eslint apps/backend/package.json` → v8 (^8.x.x)
- [ ] **M8** collectCoverageFrom scope: `grep -A5 collectCoverageFrom apps/backend/package.json` → `src/**/*.ts` 패턴 (구: `**/*.(t|j)s`)
- [ ] **M9** 기존 테스트 (5모듈 제외) 모두 PASS: `pnpm --filter backend run test -- --testPathIgnorePatterns='cables|software-validations|test-software|intermediate-inspections'`
  - monitoring은 PASS 확인됨

## SHOULD criteria

- [ ] **S1** teams.service.ts findAll이 Promise.all 패턴 사용 확인 (grep)
- [ ] **S2** teams schema siteClassificationIdx 존재, classificationIdx 없음 (grep)

## 제외 항목 (다른 세션 도메인)

- cables/__tests__/, software-validations/__tests__/, test-software/__tests__/ 테스트 실패는 무시
- intermediate-inspections/__tests__/ 테스트 실패는 무시 (active plan)
- monitoring/__tests__/ PASS 확인만
