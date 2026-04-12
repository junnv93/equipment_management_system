# Evaluation: cache-key-test-await
## Date: 2026-04-12
## Contract: `.claude/contracts/cache-key-test-await.md`
## Iteration: 1

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| MUST-1 | `pnpm exec tsc --noEmit --project apps/backend/tsconfig.json` 에러 0 | **PASS** | 직접 실행 확인 — 출력 없음 (에러 0). |
| MUST-2 | `pnpm --filter backend run build` 성공 | **PASS** | 직접 실행 확인 — `nest build` 정상 완료. |
| MUST-3 | `pnpm --filter backend run test` 기존 + 신규 테스트 전체 통과 | **PASS** | 직접 실행 확인 — 45 suites, 578 tests PASS (기존 565 + 신규 13). |
| MUST-4 | scope-aware-cache-key.spec.ts 존재 + 7개 이상 테스트 케이스 | **PASS** | 파일 존재 확인. `normalizeCacheParams` 3개 + `createScopeAwareCacheKeyBuilder` 10개 = 총 13개 테스트. |
| MUST-5 | equipment-imports.service.ts onVersionConflict에 await 추가 | **PASS** | line 80-81: `protected async onVersionConflict(_id: string): Promise<void> { await this.cacheInvalidationHelper.invalidateAllEquipmentImports(); }` |
| MUST-6 | disposal.service.ts onVersionConflict에 await 추가 | **PASS** | line 64-65: `protected async onVersionConflict(_id: string): Promise<void> { await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*'); }` |
| MUST-7 | calibration.service.ts invalidateCalibrationCache 정밀 scope 무효화 (`:t:<teamId>:` 단위) | **PASS** | `invalidateCalibrationCache` (line 144-163)가 `equipmentId` 제공 시 `resolveEquipmentTeamId(equipmentId)` (line 165-172)로 teamId 조회 후 `deleteByPrefix(\`${CACHE_PREFIX}list:t:${teamId}:\`)` 수행. 전체 6개 호출부 중 5개가 `equipmentId` 전달, 1개(delete)는 `calibration.equipmentId` 전달. |

## SHOULD Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| SHOULD-1 | 테스트가 edge case 포함 (빈 params, 특수문자 suffix 등) | **PASS** | 빈 params object (line 99-102), 빈 string teamId (line 62-65), undefined/null/empty 필터링 (line 79-82), all-empty params (line 20-23) 포함. 특수문자 suffix 테스트는 없으나 빈 params/빈 teamId 커버로 edge case 요건 충족. |

## Issues Found

### Observation: 일부 cacheService 호출에 await 누락 (non-blocking)
- **File**: `apps/backend/src/modules/calibration/calibration.service.ts:149, 155, 157, 159, 162`
- **Detail**: `invalidateCalibrationCache` 내부에서 `this.cacheService.delete(...)` 및 `this.cacheService.deleteByPrefix(...)` 호출이 `await` 없이 fire-and-forget으로 실행됨. `cacheService` 메서드가 동기적(Map 기반 SimpleCacheService)이면 문제 없으나, 향후 Redis 전환 시 비동기가 되면 잠재 이슈.
- **Impact**: 현재 SimpleCacheService는 동기 구현이므로 기능 영향 없음. 계약 범위 밖.

### Test Quality Assessment
- 13개 테스트가 `normalizeCacheParams`와 `createScopeAwareCacheKeyBuilder` 양쪽을 커버.
- scope-aware suffix (`:t:`, `:g:`) 분기, 다른 builder 인스턴스 간 독립성, 키 정렬 안정성, 파라미터 정규화 등 핵심 로직 경로를 빠짐없이 검증.
- 하드코딩된 expected value가 실제 구현 로직과 일치하는지 수동 확인 완료.

## Overall Verdict: **PASS**

MUST 7/7 통과, SHOULD 1/1 통과. scope-aware-cache-key 단위 테스트 13개 추가, equipment-imports/disposal onVersionConflict await 통일, calibration.service.ts 정밀 scope 무효화 구현 모두 계약 요건 충족.
