---
slug: equipment-cache-key-builder
mode: 1
scope: apps/backend/src/modules/equipment/equipment.service.ts (cache 키 shape + invalidation)
created: 2026-04-12
---

# 스프린트 계약: equipment.service 캐시 키 구조 기반 무효화 SSOT

## 생성 시점
2026-04-12T00:00:00+09:00

## 배경

`equipment.service.ts` 의 `invalidateCache()` (L1366-1391) 가 정규식 기반 `deleteByPattern` 3곳을 호출:

1. **L1377** — `deleteByPattern('equipment:.*"teamId":"<teamId>".*')`: JSON-직렬화된 params 의 infix 매칭. `buildCacheKey` 가 params 를 JSON.stringify 하는 shape 에 암묵 커플링.
2. **L1383** — `deleteByPattern('equipment:(calibration|all-ids)')`: alternation-based prefix 매칭. 앵커 없음.
3. **L1385-86** — `deleteByPattern('equipment:(list|count|statusCounts):(?!.*teamId)')`: 부정 lookahead 로 "teamId 가 없는" global 캐시 선별 — 복잡도 ↑, 엔진별 해석 가능성.

**아키텍처 smell**: 스코프(global vs team) 정보가 **JSON 직렬화 infix** 로만 존재 → 키 shape 변경 시 silent miss. `SimpleCacheService.deleteByPrefix()` SSOT 가 존재하지만 (정규식 메타 이스케이프 + `^` 앵커) equipment.service 는 legacy `deleteByPattern` 사용.

**불변식 도입**: **스코프(`global`/`team:<id>`)를 캐시 키의 구조적 suffix 로 인코딩한다. JSON params 에는 스코프 차원(`teamId`) 을 포함하지 않는다.**

## 변경 전략

### buildCacheKey 리팩터 (equipment.service.ts:168)
스코프 인식 suffix (`list`, `count`, `statusCounts`, `team`) 에 한해:
- `params.teamId` 를 **정규화 후** 추출
- 유효하면 `:t:<teamId>:` 구조적 segment 삽입, 아니면 `:g:` (global)
- 남은 params 만 `JSON.stringify` 로 직렬화

다른 suffix (`detail`, `calibration`, `all-ids`) — 불변.

**호출자 무수정**: `buildCacheKey('list', { page, teamId, ... })` 형태 그대로. 변환은 헬퍼 내부.

### invalidateCache 리팩터 (equipment.service.ts:1366)
regex 3건 → `deleteByPrefix` 호출로 치환:
- **team-scope 분기** (`teamId` 존재 시):
  - `deleteByPrefix('equipment:list:t:<teamId>:')`
  - `deleteByPrefix('equipment:count:t:<teamId>:')`
  - `deleteByPrefix('equipment:statusCounts:t:<teamId>:')`
  - `deleteByPrefix('equipment:team:t:<teamId>:')` (기존 L1379 + 파라미터화 team 캐시 흡수)
- **global 분기** (항상):
  - `deleteByPrefix('equipment:list:g:')`
  - `deleteByPrefix('equipment:count:g:')`
  - `deleteByPrefix('equipment:statusCounts:g:')`
- **dashboard-level aggregates**:
  - `deleteByPrefix('equipment:calibration:')`
  - `delete('equipment:all-ids')` (단일 키)
- 기존 detail delete (L1369-71) — 불변

### 테스트 assertion 조정 (equipment.service.spec.ts:143, 304, 335)
`expect(mockCacheService.deleteByPattern).toHaveBeenCalled()` 3건을 `expect(mockCacheService.deleteByPrefix).toHaveBeenCalled()` 로 교체. 의미: "invalidateCache() 가 호출됨" 프록시는 유지, 새 SSOT 에 정렬.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter backend run test` exit 0 (기존 테스트 + 수정된 assertion 모두 PASS — 559 tests)
- [ ] **MUST3**: `pnpm --filter backend run build` exit 0
- [ ] **MUST4**: `equipment.service.ts:invalidateCache()` 본문에 `deleteByPattern` 호출 **0회** (grep 검증)
- [ ] **MUST5**: `equipment.service.ts:buildCacheKey()` 가 `list`/`count`/`statusCounts`/`team` suffix 시 `:g:` 또는 `:t:<id>:` 구조적 segment 를 포함 (JSDoc + 코드 확인)
- [ ] **MUST6**: `equipment.service.ts:invalidateCache()` 가 `deleteByPrefix` 호출 **≥ 7회** (team/global list/count/statusCounts + team + calibration)
- [ ] **MUST7**: 기존 `onVersionConflict` 훅 (L120) 의 `detail` 캐시 삭제 동작 불변 (`buildCacheKey('detail', ...)` 셰이프 유지)
- [ ] **MUST8**: 정규식 negative lookahead `(?!` 및 JSON-infix 매칭 패턴 `".*"teamId":"` 이 equipment.service.ts 에서 완전히 제거
- [ ] **MUST9**: 블랙리스트 파일 변경 없음 (다른 세션 작업 영역)
- [ ] **MUST10**: `SimpleCacheService` 인프라(simple-cache.service.ts) 변경 **없음** — 기존 `deleteByPrefix` SSOT 를 소비만.
- [ ] **MUST11**: `equipment.service.spec.ts` 의 `deleteByPattern` 단순 호출 검증 3건이 `deleteByPrefix` 검증으로 교체 (의미 동등)

### 권장 (SHOULD) — tech-debt-tracker 등재, 루프 차단 없음

- [ ] **SHOULD1**: `normalizeCacheParams` 호출 위치/순서 불변 (empty string/null 제거 정책 유지)
- [ ] **SHOULD2**: 리팩터 후 `equipment.service.ts` 라인 수 증가 < 30 (과잉 엔지니어링 방지)
- [ ] **SHOULD3**: 다른 서비스(checkouts/nc 등)로의 소급 적용은 **out-of-scope** — 별도 세션. 이 PR 은 equipment 단일 도메인.
- [ ] **SHOULD4**: JSDoc 에 "스코프는 구조적 suffix 로 인코딩됨" 불변식 명시

### 적용 verify 스킬
- `verify-implementation` (자동 라우팅)
- `verify-ssot` (캐시 SSOT 일관성)

## 종료 조건
- 필수 기준 전체 PASS → 성공 → /git-commit + main 직접 push
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입

## 비고
- **Mode 1**: 단일 도메인 (equipment 캐시), 2-3 파일
- **수정 방식**: main 직접 작업
- **성능 영향**: regex scan 제거 → prefix 기반 O(keys) 삭제로 단순화. 정확한 스코프 무효화 (false positive 제거).
- **캐시 shape 마이그레이션**: 런타임 시작 시 캐시 비어있음 (in-memory LRU) → 자동 전환, 운영 영향 없음.
