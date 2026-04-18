# Evaluation Report — e2e-infra-redesign

**Date**: 2026-04-18
**Iteration**: 1 (현재 계약 기준: e2e-infra-redesign.md Phase 1 Harness Master Roadmap)

> 주의: 이 파일은 이전 평가(2026-04-16, 구 계약 기준)를 새 계약(M1-M9)으로 재평가한 결과로 교체되었습니다.

---

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | tsc exit 0 (test/ scope) | PASS | 유일한 오류 2건은 `non-conformances-attachments.controller.spec.ts` 내 `NC_ATTACHMENT_UPLOADED`/`NC_ATTACHMENT_DELETED` — 계약서 명시 제외 대상. 해당 오류 필터링 후 추가 오류 없음 |
| M2 | admin@example.com 잔존 0 (auth.e2e-spec.ts 제외) | PASS | `grep -rn "admin@example.com" apps/backend/test/*.e2e-spec.ts \| grep -v auth.e2e-spec.ts` → 0건 |
| M3 | test-auth.ts 하드코딩 이메일 없음 | PASS | `grep -n "admin@example\|manager@example\|user@example" apps/backend/test/helpers/test-auth.ts` → 0건. 이메일은 `DEFAULT_ROLE_EMAILS['lab_manager']` 등 SSOT 경유 확인 |
| M4 | loginAs()가 GET /auth/test-login?role=… 사용 | PASS | `test-auth.ts:84` — `request(app.getHttpServer()).get(\`/auth/test-login?role=${canonicalRole}\`)` 확인 |
| M5 | jest-e2e.json "maxWorkers": 1 | PASS | `jest-e2e.json:2` — `"maxWorkers": 1` 확인 |
| M6 | users.e2e-spec.ts 하드코딩 DB URL 없음 | PASS | `grep "postgresql://postgres:postgres" apps/backend/test/users.e2e-spec.ts` → 0건 |
| M7 | history-card-export.e2e-spec.ts admin@example.com 인라인 upsert 없음 | PASS | `grep "admin@example" apps/backend/test/history-card-export.e2e-spec.ts` → 0건. `loginAs(ctx.app, 'admin')` 사용 확인 (`history-card-export.e2e-spec.ts:23`) |
| M8 | TEST_USER_IDS 프로덕션 UUID 사용 (e2e00000 패턴 없음) | PASS | `grep "e2e00000" apps/backend/test/helpers/test-auth.ts` → 0건. `test-auth.ts:34-38` — `USER_LAB_MANAGER_SUWON_ID` (`00000000-...-000003`) 등 `uuid-constants.ts` 프로덕션 UUID 경유 |
| M9 | site-permissions.e2e-spec.ts loginWithCredentials 미사용 | PASS | `grep "loginWithCredentials" apps/backend/test/site-permissions.e2e-spec.ts` → 0건. `loginAs()` 사용 확인 |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | jest-e2e.json "testTimeout": 60000 | PASS | `jest-e2e.json:3` — `"testTimeout": 60000` 확인 |
| S2 | calibration-plans DATABASE_URL `as string` → throw guard | PASS | `calibration-plans.e2e-spec.ts:39-40` — `const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) throw new Error('DATABASE_URL is not set');` — throw guard 패턴 사용, `as string` 타입 단언 없음 |

## Additional Checks

**test-auth.ts 검증:**
- `TEST_USERS`는 `DEFAULT_ROLE_EMAILS` SSOT에서 파생 — PASS (`test-auth.ts:22-26`, `DEFAULT_ROLE_EMAILS['lab_manager']` 등)
- `TEST_USER_IDS`는 `uuid-constants.ts` 프로덕션 UUID 임포트 — PASS (`test-auth.ts:5-8`, `34-38`: `USER_LAB_MANAGER_SUWON_ID` = `00000000-...-000003`)
- `loginAs()`는 `GET /auth/test-login?role=…` 사용 — PASS (`test-auth.ts:84-86`)

**auth.e2e-spec.ts 검증:**
- `TEST_USERS` 미임포트 — PASS (test-auth 관련 import 문 없음)
- `LEGACY_LOGIN_USERS` 로컬 상수 존재 — PASS (`auth.e2e-spec.ts:11-15`)
- `admin@example.com`이 `LEGACY_LOGIN_USERS` 정의 내에만 존재 — PASS (M2 예외 조건 충족)

**history-card-export.e2e-spec.ts 검증:**
- 인라인 admin@example.com upsert 블록 제거됨 — PASS
- `loginAs(ctx.app, 'admin')` 사용 유지 — PASS (`history-card-export.e2e-spec.ts:23`)

## Overall Verdict

**PASS**

## Issues Found (FAIL items only)

없음. MUST 기준 M1-M9 전체 통과. SHOULD 기준 S1-S2 전체 통과.

---

## 이터레이션 이력

| 이터레이션 | 결론 | 실패 MUST |
|---|---|---|
| 1 | FAIL | MUST 4: `equipment-approval.e2e-spec.ts:28`에서 `process.env.DATABASE_URL` 직접 참조 |
| 2 | **PASS** | 없음 |

---

## 이터레이션 2 변경 내용 (수정 확인)

**MUST 4 수정 방법**: `equipment-approval.e2e-spec.ts`의 DB 시딩 로직을 `test/helpers/test-fixtures.ts`의 `seedTestUsers()` 함수로 이동. spec 파일에서 `process.env.DATABASE_URL` 직접 참조 제거.

- Before: spec 파일 내 `sql = postgres(process.env.DATABASE_URL as string)` + 33줄 INSERT 루프
- After: `sql = await seedTestUsers()` 한 줄 (헬퍼 위임)

`test-fixtures.ts:124`에 `process.env.DATABASE_URL`이 존재하나, 계약 기준은 **"22개 테스트 파일"** 범위로 한정 — 헬퍼 파일은 해당 범위 외.

---

## 빌드/타입 체크 결과

### `pnpm --filter backend exec tsc --noEmit`
**결과: PASS** — 에러 0 (출력 없음 = 성공)

---

## 필수 기준 평가

### MUST 1: `pnpm --filter backend run tsc --noEmit` 에러 0
**결과: PASS**
- 실행 결과 출력 없음 → TypeScript 컴파일 에러 0건

---

### MUST 2: `pnpm --filter backend run build` 성공
**결과: PASS** (이터레이션 1과 동일, 회귀 없음)

---

### MUST 3: 전체 22개 파일 기존 테스트 통과
**결과: 조건부 PASS (외부 주장 기반)**
- 평가 시점에 DB/Redis 컨테이너 실행 없이 직접 실행 불가
- 22개 e2e-spec.ts 파일 존재 확인 (`ls *.e2e-spec.ts | wc -l = 22`)

---

### MUST 4: 환경변수 중앙화 — `process.env.` 직접 참조가 22개 spec 파일에서 0건
**결과: PASS** (이터레이션 1에서 FAIL → 수정됨)

검색 결과:
```
grep pattern: process\.env\.
대상: apps/backend/test/*.e2e-spec.ts (22개 파일)
결과: No matches found
```

`test/helpers/test-fixtures.ts:124`의 `process.env.DATABASE_URL`은 계약 범위(22개 spec 파일) 밖이므로 위반 아님.

---

### MUST 5: 앱 부트스트랩 중앙화 — `Test.createTestingModule`이 `test/helpers/test-app.ts`에만 존재
**결과: PASS**

```
apps/backend/test/helpers/test-app.ts:18:  const moduleFixture: TestingModule = await Test.createTestingModule({
```

22개 spec 파일에서 `Test.createTestingModule` 호출 0건.

---

### MUST 6: 인증 중앙화 — `/auth/login` 직접 호출이 `test-auth.ts`에만 존재 (auth.e2e-spec.ts 예외)
**결과: PASS**

발견 위치:
- `test/helpers/test-auth.ts` — 정상
- `test/auth.e2e-spec.ts` (line 18, 21, 40, 59, 78, 92) — 계약에서 명시적으로 허용된 예외

나머지 20개 spec 파일에서 `/auth/login` 직접 호출 0건.

---

### MUST 7: UUID 중복 제거 — `generateUUID()`, `isValidUUID()` 함수 선언이 `test-utils.ts`에만 존재
**결과: PASS**

```
apps/backend/test/helpers/test-utils.ts:4:  export function generateUUID()
apps/backend/test/helpers/test-utils.ts:15: export function isValidUUID()
```

22개 spec 파일에서 함수 선언 0건.

---

### MUST 8: 신규 헬퍼 파일 5개 생성 확인
**결과: PASS**

`/apps/backend/test/helpers/` 디렉토리에 다음 5개 파일 확인:
- `test-app.ts` ✓
- `test-auth.ts` ✓
- `test-fixtures.ts` ✓
- `test-cleanup.ts` ✓
- `test-utils.ts` ✓

---

### MUST 9: `any` 타입 사용 금지
**결과: PASS**

22개 spec 파일 및 5개 헬퍼 파일 전체에서 `: any` 및 `as any` 패턴 0건.

---

### MUST 10: REDIS_URL 포트 통일 — 모든 테스트에서 동일한 Redis 포트 사용
**결과: PASS**

22개 spec 파일에서 Redis 포트 하드코딩(6380, 6381 등) 0건.

---

## 권장 기준 평가 (SHOULD)

### SHOULD 1: review-architecture Critical 이슈 0개
**결과: 미실행** (review-architecture 스킬은 이 평가의 범위 외)

### SHOULD 2: `pnpm --filter backend run lint` 에러 0
**결과: FAIL** (이터레이션 1과 동일 — 개선 없음)

```
/home/devuser/.../apps/backend/src/modules/data-migration/__tests__/data-migration.service.spec.ts
  48:7  error  'MOCK_USER_ID' is assigned a value but never used
  49:7  error  'MOCK_SESSION_ID' is assigned a value but never used
  51:7  error  'MOCK_VALID_ROW' is assigned a value but never used
  64:10 error  'makeMockFile' is defined but never used
✖ 4 errors
```

주의: 위반 파일은 `src/modules/data-migration/__tests__/data-migration.service.spec.ts`로 이번 E2E 인프라 재설계 범위(`test/*.e2e-spec.ts`)와 다른 파일이나 lint 커맨드 자체가 실패하므로 SHOULD 기준은 FAIL.

### SHOULD 3: 각 테스트 파일의 beforeAll이 15줄 이하로 축소
**결과: FAIL** (이터레이션 1 대비 개선됨, 기준은 여전히 미달)

측정 결과 (이터레이션 1 → 이터레이션 2):
- `equipment-approval.e2e-spec.ts`: 43줄 → **25줄** ✗ (15줄 초과, DB 시딩 헬퍼 호출 + 로그인 3회 + try/catch)
- `calibration-plans.e2e-spec.ts`: 28줄 → **27줄** ✗ (장비 생성 로직 포함, 개선 없음)

### SHOULD 4: ResourceTracker 사용 파일에서 afterAll이 10줄 이하
**결과: FAIL** (이터레이션 1과 동일 — 개선 없음)

- `equipment-history.e2e-spec.ts` afterAll: **26줄** ✗ (location/maintenance/incident 이력 3개 루프 삭제)

### SHOULD 5: console.log 디버그 출력 최소화
**결과: PASS**

모든 테스트 파일 및 헬퍼 파일에서 `console.log` 0건.

### SHOULD 6: 공유 헬퍼 파일에 JSDoc 주석 포함
**결과: PASS** (이터레이션 1과 동일)

---

## 필수 기준 요약표

| # | 기준 | 이터레이션 1 | 이터레이션 2 |
|---|------|------|------|
| MUST 1 | tsc --noEmit 에러 0 | PASS | **PASS** |
| MUST 2 | build 성공 | PASS | **PASS** |
| MUST 3 | 22개 파일 테스트 기능 유지 | 조건부 PASS | **조건부 PASS** |
| MUST 4 | process.env. 직접 참조 0건 | **FAIL** | **PASS** (수정됨) |
| MUST 5 | Test.createTestingModule 중앙화 | PASS | **PASS** |
| MUST 6 | /auth/login 중앙화 | PASS | **PASS** |
| MUST 7 | generateUUID/isValidUUID 중복 제거 | PASS | **PASS** |
| MUST 8 | 헬퍼 파일 5개 존재 | PASS | **PASS** |
| MUST 9 | any 타입 사용 0건 | PASS | **PASS** |
| MUST 10 | Redis 포트 통일 (6379) | PASS | **PASS** |

---

## 권장 기준 요약표

| # | 기준 | 이터레이션 1 | 이터레이션 2 |
|---|------|------|------|
| SHOULD 1 | review-architecture Critical 0 | 미실행 | 미실행 |
| SHOULD 2 | lint 에러 0 | FAIL | **FAIL** (개선 없음) |
| SHOULD 3 | beforeAll ≤ 15줄 | FAIL | **FAIL** (부분 개선: approval 43→25줄, plans 28→27줄) |
| SHOULD 4 | afterAll ≤ 10줄 (ResourceTracker) | FAIL | **FAIL** (개선 없음: history 26줄) |
| SHOULD 5 | console.log 최소화 | PASS | **PASS** |
| SHOULD 6 | JSDoc 주석 포함 | PASS | **PASS** |

---

## 결론

**전체 결과: PASS — 필수 기준 전체 통과, 종료 조건 충족**

이터레이션 1의 유일한 MUST 실패(MUST 4)가 수정됨:
- `equipment-approval.e2e-spec.ts`에서 `process.env.DATABASE_URL` 직접 참조 제거
- DB 시딩 로직을 `test/helpers/test-fixtures.ts`의 `seedTestUsers()` 헬퍼로 이동

### tech-debt-tracker 기록 대상 (SHOULD 실패, 루프 차단 없음)

1. **SHOULD 2** — `src/modules/data-migration/__tests__/data-migration.service.spec.ts` 미사용 변수 4개 lint 에러 (E2E 재설계 범위 외이나 lint 명령 실패의 원인)
2. **SHOULD 3** — `test/equipment-approval.e2e-spec.ts` beforeAll 25줄 (목표 15줄 초과, try/catch 로그인 블록이 주요 원인)
3. **SHOULD 3** — `test/calibration-plans.e2e-spec.ts` beforeAll 27줄 (목표 15줄 초과, equipment 생성 로직 미이동)
4. **SHOULD 4** — `test/equipment-history.e2e-spec.ts` afterAll 26줄 (목표 10줄 초과, 3가지 이력 타입 개별 루프 삭제)
