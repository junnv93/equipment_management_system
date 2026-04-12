# Evaluation: ondelete-cache-scope
## Date: 2026-04-12
## Iteration: 2

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| MUST-1 | `users.service.remove()`는 hard delete 전에 restrict FK 참조 존재 여부를 검사하고, 참조가 있으면 `BadRequestException`을 throw해야 한다 | **PASS** | `remove()` (line 394-411)가 delete 전에 `checkUserReferences(id)` (line 396)를 호출. `checkUserReferences` (line 419-440)가 단일 SQL에서 EXISTS 서브쿼리 4개(calibrations, checkouts, non_conformances, calibration_factors)를 실행하고, 참조 발견 시 `BadRequestException`을 throw. |
| MUST-2 | FK violation이 application-level 검사를 우회하더라도 DB-level 에러를 catch하여 descriptive error로 변환해야 한다 | **PASS** | `isForeignKeyViolation()` (line 442-448)이 PostgreSQL error code `23503`을 검사하고, `BadRequestException`으로 변환. race condition 방어 역할 정상 수행. |
| MUST-3 | `calibration.service.ts`의 `buildCacheKey`가 `list` suffix에 대해 teamId를 구조적 segment로 인코딩해야 한다 | **PASS** | `buildCacheKey` (line 130-160)에서 `SCOPE_AWARE_SUFFIXES.has(suffix)` 체크 후 teamId를 `:t:<teamId>` 또는 `:g` segment로 인코딩. |
| MUST-4 | `calibration.service.ts`의 `invalidateCalibrationCache`가 scope-aware prefix 삭제를 수행해야 한다 | **PASS** | `invalidateCalibrationCache` (line 182-188)에서 `deleteByPrefix(\`${this.CACHE_PREFIX}list:\`)` 호출. `list:` prefix 하위의 모든 scope 키가 삭제됨. |
| MUST-5 | `calibration.service.ts`에서 dead prefix (`pending:`, `intermediate-checks:`) 무효화를 제거해야 한다 | **PASS** | grep 확인 — `pending:` 및 `intermediate-checks:` 문자열이 calibration.service.ts에 존재하지 않음. |
| MUST-6 | `buildStableCacheKey` import가 calibration.service.ts에서 제거되어야 한다 | **PASS** | grep 확인 — `buildStableCacheKey` 문자열이 calibration.service.ts에 존재하지 않음. |
| MUST-7 | `pnpm --filter backend run tsc --noEmit` 통과 | **PASS** | 사용자 제공 결과: tsc 통과 확인. |
| MUST-8 | `pnpm --filter backend run build` 통과 | **PASS** | 사용자 제공 결과: build 통과 확인. |
| MUST-9 | `pnpm --filter backend run test` 통과 (기존 테스트 회귀 없음) | **PASS** | 사용자 제공 결과: 565/565 테스트 통과. |

## SHOULD Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| SHOULD-1 | user delete guard의 에러 응답에 참조 테이블명을 포함 | **PASS** | `checkUserReferences` (line 429-437)가 참조된 테이블명 배열을 수집하여 에러 메시지에 `(calibrations, checkouts)` 형태로 포함. DB-level fallback도 `extractReferencingTable()` (line 451-463)로 테이블명 추출. |
| SHOULD-2 | `calibration.service.ts`에 `normalizeCacheParams` 헬퍼가 checkouts/calibration-factors와 동일한 패턴으로 존재 | **PASS** | `normalizeCacheParams` (line 162-172)가 undefined/null/empty-string 필터링 수행. |
| SHOULD-3 | `findAll` 캐시 키가 teamId를 구조적 segment로 분리 | **PASS** | `findAll` (line 720)에서 `buildCacheKey('list', {...})` 호출. `list`가 scope-aware suffix이므로 teamId가 자동으로 `:t:<id>` segment로 분리. |
| SHOULD-4 | invalidateCalibrationCache가 equipmentId로부터 teamId를 해석하여 정밀 scope 무효화 수행 | **FAIL** | `invalidateCalibrationCache` (line 182-188)는 broad prefix (`list:`) 삭제만 수행. 계약상 "broad prefix fallback 허용"이므로 blocking 아님. |

## Issues Found

### Observation: SHOULD-4 — 정밀 scope 무효화 미구현 (non-blocking)
- **File**: `apps/backend/src/modules/calibration/calibration.service.ts:182-188`
- **Problem**: broad prefix 삭제만 수행. teamId별 정밀 무효화(`:t:<teamId>:` 단위)를 하지 않음.
- **Impact**: 캐시 무효화 범위가 필요 이상으로 넓지만, 기능적 정합성에 문제 없음. 성능 최적화 기회.

### Note: checkUserReferences의 검사 범위
- `checkUserReferences`는 4개 핵심 테이블만 사전 검사하고, 나머지 테이블(audit_logs 등)은 DB-level FK catch에 위임. 주석(line 416-418)에 이 설계 결정이 명시되어 있으며, MUST-2의 DB-level catch가 나머지를 커버하므로 합리적 구현.

## Iteration 1 Fix Verification
| Issue | Status | Detail |
|-------|--------|--------|
| MUST-1 FAIL: application-level pre-check 누락 | **RESOLVED** | `checkUserReferences()` 메서드 추가 (line 419-440). `remove()` 진입 시 delete 전에 호출 (line 396). EXISTS 서브쿼리 4개로 단일 SQL 실행, 참조 발견 시 즉시 BadRequestException throw. |

## Overall Verdict: PASS

MUST 9/9 통과, SHOULD 3/4 통과. Iteration 1의 유일한 실패 항목(MUST-1)이 application-level pre-check 추가로 해결됨. 캐시 scope-aware 리팩토링(MUST-3~6) 유지 확인 완료.
