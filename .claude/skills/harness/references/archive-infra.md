# Harness 완료 프롬프트 아카이브 — E2E 인프라 / 테스트 / Legacy

> 완료 처리된 프롬프트 섹션들. 최신 차수부터 역순 정렬.
> 전체 인덱스: [archive-index.md](./archive-index.md)

---

## ~~37차 정리 (2026-04-09) — Dockerfile hardening 실빌드 검증~~ ✅ 완료 (2026-04-09)

`docker build --target production` 실측으로 36차/30차/29차에 등재됐던 **Docker 관련 4건 전부 stale 확인 → 아카이브**. 동시에 fresh 빌드에서만 드러나는 **실제 근본 버그 2건** 발견 + root-cause 수정:

1. `preinstall` 훅이 참조하는 `scripts/check-no-stale-lockfiles.mjs` 가 deps 레이어에 COPY 되지 않아 fresh 빌드가 `MODULE_NOT_FOUND` 로 실패 → 단일 파일 COPY 추가 (manifest 캐시 재사용률 유지).
2. `prod-deps` 스테이지의 `pnpm install --prod` 가 husky(devDep) `prepare` 훅에서 `sh: husky: not found` → `--ignore-scripts` 로 전환 (`--frozen-lockfile` 이 lockfile 무결성을 이미 보장해 preinstall 검증 중복 제거).

교훈: "정적 구조만 확인된 hardening 체크리스트" 는 실제 `docker build` 1회로 모두 검증되어야 한다. 이후 Dockerfile 변경은 CI 또는 로컬에서 fresh 빌드 실행을 필수 절차로 삼을 것.

---

## ~~71차 신규 — 백엔드 E2E 테스트 인프라 근본 재설계 (1건, 2026-04-16)~~ ✅ 완료 (2026-04-16, Mode 2 harness)

> **발견 배경 (2026-04-16)**: data-migration harness 중 `pnpm test:e2e` 전면 실패 확인. 근본 원인: (1) 14/20 파일이 Redis 6380 하드코딩 (Docker는 6379), (2) `admin@example.com` DB row 부재 → JWT sub 빈 문자열 → 500, (3) 기존 SSOT (`test-users.ts`, `seed-test-new.ts`)가 백엔드 E2E에서 미사용.
> 프론트엔드 E2E는 `global-setup.ts`에서 seed 실행으로 이미 해결 완료 — 동일 패턴을 백엔드에 적용.
> `equipment.e2e-spec.ts` 등 기존 spec 파일도 동일 이유로 전면 실패 확인 (본 이슈는 data-migration 전용이 아님).

### 🔴 CRITICAL — 백엔드 E2E 20개 suite 전면 실패: Redis 포트 불일치 + admin 시드 부재 + SSOT 미사용 (Mode 2)

```
근본 원인 3가지 (검증 완료):

1. Redis 포트 불일치
   - 14/20 파일: process.env.REDIS_URL = 'redis://localhost:6380' (하드코딩)
   - jest-setup.ts:12: REDIS_PORT = '6379' (올바르지만 개별 파일의 REDIS_URL이 우선)
   - docker compose: 6379만 노출 (infra/compose/dev.override.yml:24)
   - resolveRedisConfig() (create-redis-client.ts:34): REDIS_URL 우선 → REDIS_HOST+PORT 폴백
   검증: grep -rn "redis://localhost:6380" apps/backend/test/ → 14 hit

2. admin@example.com DB row 부재
   - auth.service.ts:194: findByEmail('admin@example.com') → null
   - auth.service.ts:204: 폴백 id: '' → JWT sub 빈 문자열
   - 보호 엔드포인트: users.findOne(id='') → 500 (invalid uuid)
   - 유일한 해결 사례: history-card-export.e2e-spec.ts:44-59 (인라인 upsert)
   검증: 모든 E2E 에러 로그 "params: ['', 1]" 확인

3. SSOT 미사용 (기존 자산이 있음에도)
   - packages/shared-constants/src/test-users.ts: 16명 × 3사이트 × 5역할 SSOT 정의
   - apps/backend/src/database/seed-test-new.ts: 300+ 레코드 전체 시드
   - test-auth.controller.ts:48-77: /auth/test-login?email= 엔드포인트 (DB 기반 JWT)
   - 프론트엔드 global-setup.ts:95: seed-test-new.ts 실행으로 해결 완료
   검증: grep -rn "DEFAULT_ROLE_EMAILS\|loginAsRole" apps/backend/test/ → 0 hit

아키텍처 해결 (3 레이어):

Layer 1 — 환경변수 중앙화 (setupFiles)
  - apps/backend/test/e2e-env.ts 신규: 모든 env 설정 (REDIS_HOST/PORT, JWT, Azure AD, DEV_*_PASSWORD)
  - 핵심: delete process.env.REDIS_URL → resolveRedisConfig()이 REDIS_HOST+PORT에서 해석
  - jest-e2e.json: "setupFiles": ["<rootDir>/e2e-env.ts"] 추가 (테스트 파일 로드 전 실행)
  - 20개 spec 파일에서 process.env 블록 전량 삭제

Layer 2 — 글로벌 시드 (globalSetup)
  - apps/backend/test/global-setup.ts 신규: seed-test-new.ts를 execFileSync로 1회 실행
  - jest-e2e.json: "globalSetup": "<rootDir>/global-setup.ts" 추가
  - 인라인 admin upsert 로직 삭제 (history-card-export.e2e-spec.ts:44-59 — 글로벌 시드가 대체)
  - ⚠️ 시나리오 전용 DB 셋업은 유지 (삭제 대상 아님):
    site-permissions.e2e-spec.ts:75-120 (크로스 사이트 장비 생성)
    equipment-approval.e2e-spec.ts:83-95 (승인 워크플로우 테스트 데이터)
    team-filter.e2e-spec.ts:43 (팀 필터 전용 데이터)
    → 이들은 admin upsert가 아닌 테스트 시나리오별 fixture이므로 반드시 보존

Layer 3 — 인증 헬퍼 SSOT화
  - apps/backend/test/helpers/test-auth.ts 신규:
    loginAsRole(app, role), loginAsEmail(app, email)
    getLabManagerToken(app), getSystemAdminToken(app), getTechManagerToken(app), getTestEngineerToken(app)
  - SSOT: DEFAULT_ROLE_EMAILS (shared-constants) → /auth/test-login 엔드포인트
  - jest-e2e.json moduleNameMapper에 @equipment-management/shared-constants 추가 (현재 누락)
  - 이메일 마이그레이션: admin@example.com → lab.manager@example.com, manager@ → tech.manager@, user@ → test.engineer@
  - 크로스 사이트: site-permissions/shared-equipment 등은 uiwang(user1@)/pyeongtaek(test.engineer.pyeongtaek@) 토큰 병행

추가 설정:
  - jest-e2e.json: "testTimeout": 60000 (Nest bootstrap + DB seed + 20개 suite 순차 실행 대응)
  - jest-e2e.json: "maxWorkers": 1 (MUST — 단일 DB 아키텍처에서 병렬 실행 시 시드 데이터 오염 방지)
  - jest-setup.ts: 환경변수 블록 삭제 (e2e-env.ts로 이관), 커스텀 matcher만 유지

⚠️ auth.e2e-spec.ts 특수 처리:
  - 이 파일은 /auth/login 엔드포인트 자체를 테스트 → 레거시 이메일(admin@example.com) + 비밀번호(admin123)가 테스트 subject로 필요
  - process.env 블록 삭제, 인증 헬퍼 전환은 동일 적용
  - 단, 로그인 테스트 케이스에서 사용하는 레거시 이메일/비밀번호는 테스트 입력값이므로 유지
  - 인증된 API 호출이 필요한 케이스만 SSOT 헬퍼(getLabManagerToken 등) 사용

수정 파일: 신규 3 + 수정 22 = 25 파일 (jest-e2e.json + jest-setup.ts + 20 spec + 3 신규)
미변경: docker-compose.yml(6379 유지), auth.service.ts(dev 편의용), test-users.ts/seed-test-new.ts(이미 SSOT)

검증 (MUST — 전부 통과해야 완료):
  - pnpm --filter backend exec tsc --noEmit 통과
  - grep -rn "redis://localhost:6380" apps/backend/test/ → 0 hit
  - grep -rn "process.env.REDIS_URL" apps/backend/test/*.e2e-spec.ts → 0 hit (e2e-env.ts 제외)
  - grep -rn "admin@example.com" apps/backend/test/*.e2e-spec.ts → 0 hit (auth.e2e-spec.ts의 테스트 입력값 제외)
  - jest-e2e.json에 "maxWorkers": 1 확인
  - pnpm --filter backend run test:e2e -- --listTests → 20개 파일 나열
  - pnpm --filter backend run test:e2e -- --testPathPattern=equipment.e2e-spec → PASS (스모크)
  - pnpm --filter backend run test:e2e → 전체 20 suite 통과
```

---

## ~~61차 신규 — 테스트 커버리지 + 의존성 감사 스캔 (4건, 2026-04-14)~~ ✅ 전부 완료 (2026-04-14, 63차)

> **발견 배경 (2026-04-14, 61차)**: 테스트 커버리지 + 의존성 감사 3-agent 병렬 스캔 + 2차 검증.
> FALSE POSITIVE: `zod workspace:*`(root pnpm.overrides `^4.3.5`로 오버라이드 정상), 컴포넌트 단위 테스트 전체 부재(E2E 의존 의도적 설계·227개 파일 일괄 작성 비실용), next-auth 5.0.0-beta(Next.js App Router 대응 의도적 선택), lodash 전체 패키지(`lodash/debounce` sub-path import → tree-shaking 정상).
> 검증 통과 4건 등재.

### ~~🟠 HIGH — cables/monitoring/software-validations/test-software/intermediate-inspections 5개 모듈 단위 테스트 완전 부재 (Mode 2)~~ ✅ 완료 (2026-04-14, harness 2 iterations PASS, 671/671)

```
테스트 커버리지 gap:
현재 24개 모듈 중 아래 5개 모듈에 *.spec.ts 파일이 전혀 없음
(find apps/backend/src/modules/{cables,monitoring,software-validations,test-software,intermediate-inspections} -name "*.spec.ts" → 0 hit):

1. cables/ — cables.service.ts + cables.controller.ts (케이블 교정 CRUD + 측정값 관리)
2. monitoring/ — monitoring.service.ts + monitoring.controller.ts (시스템 헬스·메트릭·DB진단)
3. software-validations/ — software-validations.service.ts (create/submit/review/approve/reject 등 승인 워크플로)
4. test-software/ — test-software.service.ts (소프트웨어 CRUD + toggleAvailability + 장비 연결)
5. intermediate-inspections/ — intermediate-inspections.service.ts (중간점검 create/submit/review/approve/reject/withdraw/resubmit)

작업:
각 모듈별 __tests__/<module>.service.spec.ts 생성 (기존 패턴:
  approvals/__tests__/approvals.service.spec.ts,
  non-conformances/__tests__/non-conformances.service.spec.ts 참조):

1. cables/__tests__/cables.service.spec.ts
   - create, findAll, findOne, update (CRUD 기본)
   - addMeasurement, findMeasurements (측정값)
   - onVersionConflict (CAS 409 처리)

2. monitoring/__tests__/monitoring.service.spec.ts
   - getHealth, getSystemMetrics, getDatabaseDiagnostics
   - recordHttpRequest, recordLogEntry, recordClientError

3. software-validations/__tests__/software-validations.service.spec.ts
   - submit, review, approve, reject (승인 워크플로 상태 전이)
   - findPending (미결 목록 조회)

4. test-software/__tests__/test-software.service.spec.ts
   - create, findAll, update
   - toggleAvailability, linkEquipment, unlinkEquipment

5. intermediate-inspections/__tests__/intermediate-inspections.service.spec.ts
   - createByEquipment, createByCalibration (출처별 생성)
   - submit → review → approve/reject 전이
   - withdraw, resubmit

공통 패턴:
- MockDatabaseService + MockCacheService 사용 (기존 spec 참조)
- 상태 전이 시 잘못된 상태에서 호출 시 예외 발생 테스트 포함
- @AuditLog 인터셉터는 mock 처리

검증:
- pnpm --filter backend run test -- --testPathPattern='cables|monitoring|software-validations|test-software|intermediate-inspections'
- 각 spec 파일 최소 5개 describe 블록 이상
- pnpm --filter backend run tsc --noEmit
```

### ~~🟡 MEDIUM — CI unit-test job에서 frontend jest 미실행 (Mode 0)~~ ✅ 완료 (2026-04-14, 63차)

```
CI 커버리지 gap:
- .github/workflows/main.yml:198-214

unit-test job (line 130-)에서 테스트 실행 step:
  현재: pnpm --filter backend run test:cov (line 199)
  → backend coverage artifact만 수집 (apps/backend/coverage/, line 213-214)
  → frontend jest 테스트는 CI에서 한 번도 실행되지 않음

frontend jest 현황:
  - apps/frontend/jest.config.js: coverageThreshold 80% 설정
  - 테스트 파일: lib/ 하위 4개 (equipment-filter-utils, reports-filter-utils,
    equipment-errors, visual-feedback)
  - testMatch: '**/__tests__/**/*.test.ts?(x)'

작업:
main.yml unit-test job의 "Run Unit Tests (with coverage)" step 이후에 추가:

      - name: Run Frontend Unit Tests
        run: pnpm --filter frontend run test -- --passWithNoTests
        env:
          NODE_ENV: test

주의:
- --passWithNoTests: 향후 테스트 추가 전까지 0건이어도 통과
- frontend coverage artifact 별도 업로드는 선택사항 (현재 4개 파일만 있으므로 생략 가능)
- frontend jest는 jest-environment-jsdom 사용 → CI에서 별도 패키지 불필요
  (next/jest가 jsdom 포함)

검증:
- .github/workflows/main.yml에서 frontend 테스트 step 존재 확인
- grep 'filter frontend run test' .github/workflows/main.yml → 1 hit
- CI 파이프라인 로컬 시뮬레이션: pnpm --filter frontend run test -- --passWithNoTests → exit 0
```

### ~~🟡 MEDIUM — backend jest collectCoverageFrom 너무 광범위 (Mode 0)~~ ✅ 완료 (2026-04-14, 63차)

```
Coverage 설정 이슈:
- apps/backend/package.json:159-164

현재 설정:
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ]

문제:
- 루트 기준 모든 .ts/.js 파일 포함 → node_modules/, dist/, test/ 디렉토리까지 포함
- 테스트 spec 파일 자체도 coverage 대상 (spec이 spec을 커버하는 이상 통계)
- dist/ 컴파일 결과물 포함 시 라인 수 중복 측정
- CI에서 coverage artifact 크기 불필요하게 증가

작업:
apps/backend/package.json의 collectCoverageFrom을 src/ 기준으로 좁힘:

  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.d.ts",
    "!src/main.ts",
    "!src/database/migrations/**"
  ]

주의:
- 현재 coverageThreshold: branches 20%, functions/lines/statements 25%
  → src/ 범위로 좁히면 실제 커버리지 비율이 낮아질 수 있음
  → 변경 후 pnpm --filter backend run test:cov 실행 후 실제 % 확인 필요
  → threshold를 낮추는 임시방편 금지 — 측정 정확도 개선이 목적

검증:
- pnpm --filter backend run test:cov → 정상 실행
- coverage/lcov-report/index.html 에서 coverage 출처 확인
  (src/ 파일만 집계되는지)
- grep '"collectCoverageFrom"' apps/backend/package.json → src/** 패턴 확인
```

### ~~🟡 MEDIUM — @typescript-eslint v6(backend) vs v8(frontend) major 버전 불일치 (Mode 0)~~ ✅ 완료 (2026-04-14, 63차)

```
의존성 불일치:
- apps/backend/package.json:93-94
- apps/frontend/package.json:77-78

현재:
  backend:  "@typescript-eslint/eslint-plugin": "^6.0.0"
            "@typescript-eslint/parser": "^6.0.0"
  frontend: "@typescript-eslint/eslint-plugin": "^8.53.1"
            "@typescript-eslint/parser": "^8.53.1"

문제:
- 2개 major 버전 차이 (v6 → v8)
- v7/v8에서 추가된 lint 규칙이 backend에만 미적용
  (예: @typescript-eslint/no-unsafe-* 강화, prefer-nullish-coalescing 변경)
- eslint 버전도 확인 필요 (v8 eslint-plugin은 eslint >=8 요구)
- 모노레포에서 같은 규칙셋 기대 시 다른 결과 발생

작업:
apps/backend/package.json devDependencies 버전 업:

  "@typescript-eslint/eslint-plugin": "^8.53.1",
  "@typescript-eslint/parser": "^8.53.1",

이후 lint 통과 확인:

주의:
- backend .eslintrc.js (또는 eslint.config.js) 에서 parserOptions.project 설정 확인
  v8에서 project 옵션 변경사항 있음
- 업그레이드 후 새로 발생하는 lint 에러는 auto-fix 우선,
  auto-fix 불가 시 suppress 금지 — 실제 수정 필요
- pnpm install 후 peerDependency 경고 없어야 함

검증:
- pnpm install → peer dependency 경고 없음
- pnpm --filter backend run lint → 0 error (warning은 허용)
- pnpm --filter backend run tsc --noEmit → exit 0
```

---

## ~~현재 미해결 프롬프트: 9건 (+ 사용자 결정 대기 1건)~~ ✅ 전부 완료/STALE

### ~~🟢 LOW — WF-25 spec D-day 배지 soft assertion~~ ✅ STALE (2026-04-09 38차 세션)

> 검증: `wf-25-alert-to-checkout.spec.ts:65-72` 에 `page.getByLabel(/^교정 상태:/)` soft assertion 이미 적용. 배지 부재 시(일반 상태) count=0 → 통과 (soft 성격 유지), 존재 시 visible 단언. aria-label SSOT 패턴(35차 롤아웃)으로 i18n 의존도 최소화. 프롬프트 작성 시점 이후 반영됨.

---

## ~~현재 미해결 프롬프트: 2건 (29차 이월 1건 + 30차 후속 1건)~~ ✅ 전부 완료/STALE

> **30차 처리 (2026-04-08)**: #6 self-inspections CAS 통일 ✅ PASS, #7 Docker Node 20 LTS ✅ 완료, #8 setQueryData → false positive
> **2026-04-09 harness 세션**: self-inspections CAS HIGH 항목 stale 재확인 (이미 완료 상태) → 비활성화. use-management-number-check.ts setQueryData MEDIUM 항목은 `fetchQuery`로 전환 완료 (commit 6de70a67).
> **30차 후속 등재**: review-architecture/verify-security에서 발견한 dormant code path + hardening gap 2건

### ~~🟡 MEDIUM — Dockerfile USER 미선언 (root 실행 hardening)~~ ✅ 아카이브 (37차, 2026-04-09)

> 실빌드 확인: backend/frontend production 스테이지 모두 `USER node` + `COPY --chown=node:node` + tini ENTRYPOINT 이미 적용. `docker run --entrypoint sh ems-*:verify -c 'id'` → `uid=1000(node) gid=1000(node)` 양쪽 확인. CIS Docker Benchmark 4.1 충족.

### ~~🟠 HIGH — UL-QP-19-01 exporters map 누락~~ ✅ STALE 아카이브 (2026-04-09 harness 세션)

> 검증 결과: form-catalog.ts 의 UL-QP-19-01 은 `dedicatedEndpoint: true` 로 마킹되어 있고, `form-template-export.service.ts:106-111` 의 `isFormDedicatedEndpoint()` 가드가 exporters 맵 lookup **이전에** `USE_DEDICATED_ENDPOINT` 를 throw 한다. 전용 exporter 는 `calibration-plans-export.service.ts` + `calibration-plans.controller.ts:364` (`GET /api/calibration-plans/export`) 로 실존하며 `FormTemplateService.getTemplateBuffer('UL-QP-19-01')` 로 실제 xlsx 를 생성한다. 프롬프트가 주장한 런타임 NotImplementedException 경로는 재현 불가. UL-QP-18-02 history-card 와 동일한 "전용 엔드포인트" 패턴 — SSOT/책임분리 모두 정상.

### ~~🟠 HIGH — self-inspections.service.ts CAS 중복 구현~~ ✅ STALE (2026-04-09 harness 세션 검증)

> 현 시점 확인: self-inspections.service.ts:25 이미 `extends VersionedBaseService`, update()/confirm() 모두 `updateWithVersion<EquipmentSelfInspection>` + `db.transaction()` 적용 완료. 30차 처리 기록과 일치. 활성 리스트에서 제거.

### ~~🟠 HIGH — Docker base image Node 18 → Node 20 LTS~~ ✅ 아카이브 (37차, 2026-04-09)

> 현재 상태: backend `FROM node:20-bullseye AS base` + `node:20-alpine AS prod-deps/production` / frontend `FROM node:20-alpine AS base`. Node 18 잔존 0건. 37차 실빌드 성공으로 런타임 호환성까지 확인.

### ~~🟡 MEDIUM — use-management-number-check.ts setQueryData 안티패턴~~ ✅ 완료 아카이브 (2026-04-09 38차 세션)

> 검증: commit `6de70a67` 에서 이미 `fetchQuery` 로 전환 완료. 현재 파일(L121-129)은 `queryClient.fetchQuery` 를 사용하며 `useQuery` 와 동일한 `queryKey` + `staleTime` + `gcTime` 을 공유해 SSOT 유지. `grep setQueryData use-management-number-check.ts` → 0 hit. 안티패턴 없음.

---

## ~~사용자 결정 대기 (0건)~~ ✅ 전부 해결 (2026-04-09)

### ~~❓ UL-QP-18-02 이력카드 form-catalog 플래그 vs endpoint 불일치~~ ✅ 해결 (2026-04-09 38차 세션)

> **결정**: UL-QP-19-01 연간교정계획서와 동일한 dedicated-endpoint 패턴으로 통일 (A안 + SSOT 정합화).
>
> **근본 원인**: `implemented` 플래그가 "통합 export 엔드포인트 구현 여부"와 "양식 export 기능 존재 여부" 두 의미로 혼동 사용됨. 두 dedicated 양식(UL-QP-18-02, UL-QP-19-01) 간 플래그 상태 불일치가 SSOT 거짓 정보의 원인.
>
> **변경 (form-catalog.ts)**:
> 1. `UL-QP-18-02.implemented: false → true` (전용 엔드포인트 `GET /api/equipment/:uuid/history-card` 실존 — `HistoryCardService` + `equipment-history.controller.ts:56`)
> 2. `FormCatalogEntry.implemented` / `.dedicatedEndpoint` JSDoc 에 불변식 명시
> 3. 모듈 로드 시 invariant 체크 추가: `dedicatedEndpoint: true && implemented !== true → throw` — 향후 새 dedicated 양식 추가 시 동일 실수 자동 차단
>
> **영향**:
> - 런타임 export 경로: 변화 없음 (`form-template-export.service.ts:106` `isFormDedicatedEndpoint` 가드가 `isFormImplemented` 체크보다 먼저 발동)
> - 목록 API (`GET /form-templates` → `FormTemplateListItem.implemented`): 이력카드가 정확히 "구현됨"으로 노출 (종전 거짓 정보 제거)
> - 백엔드/프론트엔드/shared-constants tsc `--noEmit` 통과
>
> **검증**: `pnpm --filter {backend,frontend,shared-constants} exec tsc --noEmit` 3건 PASS. invariant 위반 throw 없음 = 카탈로그 정합성 확인.

---

## False Positives (29차, 2026-04-08 스캔)

| 항목 | Agent | 검증 결과 |
|---|---|---|
| calibrations/non_conformances/equipment_imports/software_validations에 version 컬럼 없음 | C | **FALSE** — 4개 모두 `version: integer('version').notNull().default(1)` 존재 |
| disposal.controller.ts review/approve에 @AuditLog 없음 | A | **FALSE** — review:108, approve:147에 존재 |
| use-optimistic-mutation.ts:227 setQueryData 위반 | B | **FALSE** — onMutate 내부 optimistic update 컨텍스트(허용 패턴), 금지된 건 onSuccess만 |
| useState로 searchInput 관리(SSOT 위반) | B | **FALSE** (의심) — debounce input local state는 URL push와 별개의 일반 패턴, 필터 자체는 URL이 여전히 SSOT |

---

## ~~아카이브 — 완료된 프롬프트 (28차 세션, 2026-04-05)~~ ✅

### SHOULD
- E2E CSS 셀렉터 → getByRole/getByText 전환 — pending-checks + create-equipment (2026-04-03, 10차)
- ReportsContent date-fns format → useDateFormatter 전환 (2026-04-03, 10차)

### cables/intermediate-inspections 전용 Permission 분리 필요
> 사용자 판단: TE가 장비/교정/케이블 전부 조회·작성하는 게 기본 권한. 교정 권한 재사용 유지. FALSE POSITIVE (설계 의도).

### docker-compose.prod.yml postgres depends_on condition 누락
> 검증 결과: `condition: service_healthy` 명시 확인. FALSE POSITIVE.

### SELF_INSPECTIONS CREATE endpoint 누락
> BY_EQUIPMENT이 POST/GET 겸용 RESTful 패턴. FALSE POSITIVE.

### Cable enum / SelfInspection enum 미사용
> 프론트엔드 3파일 + 백엔드 DTO 2파일에서 사용 확인. FALSE POSITIVE.

### self-inspections delete() 캐시 무효화 누락
> 서비스에 캐시 인프라 자체가 없음. FALSE POSITIVE.

### SW-validations update/revise userId 미추출
> 이미 @Request() _req 있음. FALSE POSITIVE.

### Dockerfile COPY / history-card XML / console.log / 하드코딩 / FK 인덱스
> 모두 이전 세션에서 이미 수정 완료. FALSE POSITIVE (스캔 시점 차이).

### intermediate-checks API 미구현 (22차)
> calibration.controller.ts에 구현 확인. FALSE POSITIVE.

### software-validations update() 캐시 무효화 (22차)
> service에서 호출 확인. FALSE POSITIVE.

---
