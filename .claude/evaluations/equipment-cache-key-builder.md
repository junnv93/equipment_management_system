# 평가 보고서: equipment-cache-key-builder

**실행 일시**: 2026-04-12T09:45:00Z
**평가자**: Claude Haiku 4.5 (QA Step 5)
**모드**: 1 (경량 단일 도메인)
**계약**: `.claude/contracts/equipment-cache-key-builder.md`

---

## 필수 기준 (MUST1~MUST11) 평가 결과

| 기준 | 상태 | 근거 |
|------|------|------|
| **MUST1** | PASS | `pnpm --filter backend exec tsc --noEmit` 종료 코드 0. 타입 검사 성공. |
| **MUST2** | PASS | `pnpm --filter backend run test`: 565 tests passed, 0 failed. Equipment 스펙 12/12 통과. |
| **MUST3** | PASS | `pnpm --filter backend run build` 성공. `apps/backend/dist/main.js` 존재 확인. |
| **MUST4** | PASS | `equipment.service.ts` 내 `deleteByPattern` 호출 0건. grep 검증: 결과 = 0. |
| **MUST5** | PASS | `SCOPE_AWARE_SUFFIXES` = new Set(['list', 'count', 'statusCounts', 'team']) (L171). `buildCacheKey()` L194-202에서 scope suffix 감지 시 `:t:<id>:` 또는 `:g:` segment 삽입. |
| **MUST6** | PASS | `invalidateCache()` (L1398-1427) 내 `deleteByPrefix` 호출 8건: team 분기 4건(L1410-1413) + global 분기 3건(L1417-1419) + calibration 분기 1건(L1422). |
| **MUST7** | PASS | `onVersionConflict()` 훅 (L120-123) 불변: `buildCacheKey('detail', {uuid})` 및 `buildCacheKey('detail', {uuid, includeTeam: true})` 호출 유지. 또는 `detail` suffix는 SCOPE_AWARE_SUFFIXES에 미포함이므로 scope segment 미삽입 (불변식 보증). |
| **MUST8** | PASS | 정규식 negative lookahead `(?!` 검색: 결과 0건. JSON-infix 매칭 패턴 `".*"teamId":"` 검색: 결과 0건. |
| **MUST9** | PASS | `git status --porcelain` 결과: equipment 도메인만 수정 (spec.ts, equipment.service.ts) + 신규 계약(equipment-cache-key-builder.md). Session B/C 파일 변경 없음. |
| **MUST10** | PASS | `git diff apps/backend/src/common/cache/simple-cache.service.ts` 결과: 공 (변경 없음). SimpleCacheService 인프라 SSOT 유지. |
| **MUST11** | PASS | 3건의 `deleteByPattern` assertion (L143, 304, 335) → `deleteByPrefix` assertion으로 교체. 의미 동등: "invalidateCache() 호출 여부" 검증. Mock 스텁(L74) 유지. |

**전체 MUST 기준**: **11/11 PASS**

---

## 권장 기준 (SHOULD1~SHOULD4) 평가

| 기준 | 상태 | 근거 |
|------|------|------|
| **SHOULD1** | PASS | `normalizeCacheParams()` 호출 순서 불변 (L190). empty/null/빈 문자열 제거 정책 유지 (L148-159). |
| **SHOULD2** | PASS | equipment.service.ts 라인 수 증가: 리팩터 전후 비교 결과 ~20줄 증가 (SCOPE_AWARE_SUFFIXES 필드 + JSDoc 확장). 과잉 엔지니어링 없음. |
| **SHOULD3** | PASS | scope(out-of-scope). checkout/nc 등 다른 서비스 미수정 (의도대로). |
| **SHOULD4** | PASS | JSDoc (L161-170, L180-182, L390-393) "스코프는 구조적 suffix로 인코딩됨" 불변식 명시. |

**전체 SHOULD 기준**: **4/4 PASS**

---

## 교차-세션 관찰 (Cross-session Noise)

### 타입 체크 (tsc --noEmit)
**결론**: 장비 모듈 타입 오류 **없음**. 다른 세션(monitoring 모듈)의 스키마 변경(packages/schemas/src/monitoring.ts 신규 파일)은 equipment 모듈에 영향 없음.

### 테스트 실행 (pnpm test)
- **Equipment 스펙**: 12/12 PASS
- **전체 스위트**: 565/565 PASS, 0 FAIL
- **교차-세션 로그**: monitoring 모듈 일부 import 조정 중(별도 세션)이나, 이 평가 범위 밖. Test Suite 44개 모두 성공.

---

## 코드 품질 스냅샷

### 1. buildCacheKey 구현 (L183-217)
```
- normalizedParams = normalizeCacheParams(params)
- SCOPE_AWARE_SUFFIXES 점검
  - 포함 → scopeSegment = `:t:<teamId>:` 또는 `:g:`
  - 미포함 → scopeSegment = '' (detail/calibration/all-ids 불변)
- delete normalizedParams.teamId (정규화 후 복사본에서만)
- JSON 직렬화 + 결합 → 최종 키
```
**평가**: 정규화/구조적 segment 분리 **깔끔**. 호출자 계약 유지(params.teamId는 전달되지만 내부에서만 소비).

### 2. invalidateCache 구현 (L1398-1427)
```
- detail: buildCacheKey('detail', ...) 호출 (compound key 2개)
- if(teamId): 4x deleteByPrefix (team scope)
- always: 3x deleteByPrefix (global scope)
- always: 1x deleteByPrefix (calibration)
- always: 1x delete (all-ids 단일 키)
```
**평가**: regex 제거 → prefix 기반 O(keys) 스캔. **정확한 스코프 무효화**. false positive 제거 (JSON-infix 매칭 없음).

### 3. 테스트 assertion (spec.ts L143, 304, 335)
```
deleteByPattern ❌ → deleteByPrefix ✓
- L143 (create): deleteByPrefix 호출 검증
- L304 (update): deleteByPrefix 호출 검증
- L335 (remove): deleteByPrefix 호출 검증
```
**평가**: 의미 동등. SSOT 전환 반영됨.

---

## 불변식 검증

**설계 불변식**: "스코프(global vs team)는 캐시 키의 구조적 suffix(`:g:` / `:t:<id>:`)로 인코딩. JSON params는 스코프 차원(teamId) 미포함."

- ✓ L171: SCOPE_AWARE_SUFFIXES 필드 명시적 정의
- ✓ L161-170: JSDoc 불변식 선언
- ✓ L194-202: 런타임 강제 (suffix 감지 → teamId 추출 및 제거)
- ✓ L1398-1427: invalidateCache에서 prefix 기반 SSOT 사용
- ✓ 회귀: detail/calibration/all-ids suffix는 SCOPE_AWARE_SUFFIXES 미포함 (의도)

**결론**: **불변식 고착**. 향후 캐시 키 shape 변경 시 이 검증 포인트 명확.

---

## 최종 판정

**VERDICT: PASS ✓**

- **MUST 기준**: 11/11 (100%)
- **SHOULD 기준**: 4/4 (100%)
- **빌드**: tsc, nest build, dist/main.js ✓
- **테스트**: 565 passed ✓
- **블랙리스트 준수**: equipment 도메인만 수정 ✓

**권장사항**:
1. 배포 전 E2E 테스트 (캐시 스코프 시나리오): team-scoped list + global list 동시 쿼리 후 팀 업데이트 → 팀 스코프만 무효화 확인.
2. 모니터링: 교차-세션 noise(monitoring 모듈 스키마 신규) 이후 equipment 모듈 재통합 테스트 권고.

---

**평가자 서명**: Claude QA Step 5
**실행 완료**: 2026-04-12T09:45:30Z
