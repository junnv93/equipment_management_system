# Evaluation: cache-key-builder-ssot
## Date: 2026-04-12
## Iteration: 1

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| MUST-1 | `pnpm --filter backend run tsc --noEmit` 에러 0 | **PASS** | 사용자 제공 결과: tsc clean (0 errors). |
| MUST-2 | `pnpm --filter backend run build` 성공 | **PASS** | 사용자 제공 결과: backend build success. |
| MUST-3 | `pnpm --filter backend run test` 기존 테스트 통과 | **PASS** | 사용자 제공 결과: 44 suites / 565 tests PASS. |
| MUST-4 | buildCacheKey + normalizeCacheParams 로직이 단일 공통 유틸에만 존재 (3개 서비스에서 복제 제거) | **PASS** | `normalizeCacheParams` 함수 정의는 `common/cache/scope-aware-cache-key.ts` (line 18-30)에만 존재. `createScopeAwareCacheKeyBuilder` 팩토리가 내부적으로 `normalizeCacheParams`를 호출. 3개 서비스(checkouts, non-conformances, calibration-factors) 모두 로컬 `buildCacheKey` 함수/`normalizeCacheParams` 함수 정의 없음 (grep 확인). |
| MUST-5 | 3개 서비스(checkouts, non-conformances, calibration-factors)가 공통 유틸을 import하여 사용 | **PASS** | checkouts.service.ts:44 `import { createScopeAwareCacheKeyBuilder }`, line 215 `private readonly buildCacheKey = createScopeAwareCacheKeyBuilder(...)`. non-conformances.service.ts:22 import, line 59 사용. calibration-factors.service.ts:18 import, line 52 사용. |
| MUST-6 | SCOPE_AWARE_SUFFIXES는 서비스별로 설정 가능 (공통 유틸에 파라미터로 전달) | **PASS** | `createScopeAwareCacheKeyBuilder` 두 번째 인자가 `ReadonlySet<string>`. checkouts: `new Set(['list', 'summary'])`, NC: `new Set(['list'])`, CF: `new Set(['list', 'registry'])`. 서비스마다 다른 suffix 집합 전달. |
| MUST-7 | onVersionConflict async 처리: CF의 누락된 await 추가 (NC와 동일하게) | **PASS** | calibration-factors.service.ts:87 `protected async onVersionConflict(id: string): Promise<void> { await this.cacheService.delete(...) }`. NC도 동일 패턴 (line 88-90). 둘 다 `async` + `await` 사용. |
| MUST-8 | NC 이중 캐시 무효화 경로를 단일 경로로 통일 | **PASS** | `markCorrected` (line 930-970)에 `cacheInvalidationHelper.invalidateAfterNonConformanceStatusChange` 호출이 추가됨 (line 966-970). 이 패턴은 다른 mutation 경로(close line 667, remove line 865, linkRepair line 916)와 일치. |
| MUST-9 | 기존 캐시 키 형식(`:t:<teamId>:` / `:g:`)이 변경 전과 동일 | **PASS** | `scope-aware-cache-key.ts` line 62: `:t:${teamIdValue}`, line 65: `:g`. 키 형식 불변식 유지. |

## SHOULD Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| SHOULD-1 | review-architecture Critical 이슈 0개 | **SKIP** | review-architecture 실행되지 않음 (evaluator 스코프 외). |
| SHOULD-2 | 공통 유틸의 단위 테스트 추가 | **FAIL** | `scope-aware-cache-key.ts`에 대한 전용 단위 테스트 파일 미확인. 기존 서비스 테스트(565개)가 간접적으로 커버하나, 공통 유틸 자체의 직접 테스트는 없음. |

## Issues Found

### SHOULD-2: 공통 유틸 단위 테스트 부재 (non-blocking)
- **File**: `apps/backend/src/common/cache/scope-aware-cache-key.ts`
- **Problem**: `normalizeCacheParams`와 `createScopeAwareCacheKeyBuilder`에 대한 직접 단위 테스트가 없음. 경계 조건(빈 params, teamId 빈 문자열, scope-aware가 아닌 suffix 등)이 서비스 통합 테스트에서만 간접 검증됨.
- **Impact**: 향후 리팩토링 시 regression 위험. tech-debt-tracker에 기록 권장.

### Observation: 4개 추가 서비스에 로컬 buildCacheKey 잔존
- `intermediate-inspections.service.ts`, `cables.service.ts`, `test-software.service.ts`, `software-validations.service.ts`에 로컬 `buildCacheKey` 메서드가 여전히 존재.
- 이들은 scope-aware 키가 필요 없는 단순 `prefix:type:id` 패턴이므로 이번 계약 범위(3개 서비스) 밖. 향후 통일 대상.

## Overall Verdict: PASS

MUST 9/9 통과. SHOULD 1/2 통과 (단위 테스트 미추가). 3개 서비스의 buildCacheKey/normalizeCacheParams 중복이 `scope-aware-cache-key.ts` SSOT로 정상 추출되었고, NC markCorrected의 누락된 cacheInvalidationHelper 호출 및 CF의 onVersionConflict await 누락이 모두 수정됨.
