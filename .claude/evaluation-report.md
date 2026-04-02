# Evaluation Report: 모니터링 캐시 통계 엔드포인트

## 반복 #1 (2026-04-02)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter backend run tsc --noEmit` 에러 0 | **PASS** | 빌드 결과 확인 완료 (0 errors) |
| `pnpm --filter backend run build` 성공 | **PASS** | 빌드 결과 확인 완료 |
| verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택) | **NOT VERIFIED** | verify-implementation 실행 결과 미제공. 평가자가 수동으로 개별 항목 검증 수행 (아래 상세) |
| `pnpm --filter backend run test` 기존 테스트 통과 | **PASS** | 37 suites, 450 tests 통과 확인 |
| API_ENDPOINTS.MONITORING.CACHE_STATS 경로 등록 (SSOT) | **PASS** | `packages/shared-constants/src/api-endpoints.ts` line 298: `CACHE_STATS: '/api/monitoring/cache-stats'` 등록 확인 |
| MonitoringService에 SimpleCacheService 주입, getCacheStats() 위임 | **PASS** | `monitoring.service.ts` line 77: constructor에 `private readonly cacheService: SimpleCacheService` 주입. line 286-294: `getCacheStats()` 메서드가 `this.cacheService.getCacheStats()` 위임 확인 |
| MonitoringController에 GET cache-stats 엔드포인트 + @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS) | **PASS** | `monitoring.controller.ts` line 186-196: `@RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)` + `@Get('cache-stats')` + `getCacheStats()` 메서드 확인. Permission enum은 `@equipment-management/shared-constants`에서 import (SSOT 준수) |
| diagnostics 응답에 cache 필드 포함 (하위 호환 -- 기존 필드 변경 없음) | **FAIL** | cache 필드 추가는 정상. 그러나 **하위 호환 위반 발견**: controller `getDiagnostics()` return type (line 90-123)에서 기존 `database` 필드의 `isSimulated` 속성이 누락되고, `performance` 필드의 `isSimulated` 속성도 누락됨. 서비스는 여전히 `isSimulated: true`를 반환하므로 런타임에는 포함되지만, controller 선언 타입에서 제거된 것은 API 스펙 변경에 해당. 기존 소비자가 `diagnostics.database.isSimulated` 또는 `diagnostics.performance.isSimulated`를 참조하면 타입 레벨에서 깨짐. |
| getHealthStatus()의 cache.hitRate가 실제 SimpleCacheService 통계 반영 (isSimulated: false) | **PASS** | `monitoring.service.ts` line 446-448: `cache: { status: 'operational', hitRate: this.cacheService.getCacheStats().hitRate }`. 실제 SimpleCacheService 통계 사용 확인. `isSimulated` 필드는 cache 섹션에서 완전 제거됨 (더 이상 시뮬레이션 아니므로 적절) |

## SHOULD 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| review-architecture Critical 이슈 0개 | **NOT VERIFIED** | review-architecture 미실행 |
| 하드코딩 없음 (verify-hardcoding PASS) | **PASS** | 수동 검증: controller에서 `'cache-stats'` 경로는 NestJS 라우팅 데코레이터로 사용되며, `API_ENDPOINTS`는 클라이언트 소비용 SSOT. controller 데코레이터의 경로 문자열은 NestJS 패턴상 정상 (다른 엔드포인트도 동일 방식). Permission은 SSOT enum 사용. 하드코딩 이슈 없음 |

## 발견 사항 상세

### FAIL-1: Controller diagnostics 반환 타입에서 isSimulated 필드 누락 (하위 호환 위반)

**위치**: `apps/backend/src/modules/monitoring/monitoring.controller.ts` line 90-123

**문제**: Controller `getDiagnostics()` 메서드의 선언된 반환 타입에서 두 개 필드의 `isSimulated` 속성이 누락됨:

1. `database` 객체: service는 `isSimulated: boolean`을 반환 (line 300, 323)하나 controller 타입에 없음 (line 90)
2. `performance` 객체: service는 `isSimulated: boolean`을 반환 (line 505, 530)하나 controller 타입에 없음 (line 122)

**영향**: 
- TypeScript 컴파일은 통과 (구조적 타입 시스템에서 초과 속성은 허용)
- 런타임 JSON 응답에는 `isSimulated` 포함됨
- 그러나 OpenAPI/Swagger 생성 시 `isSimulated`가 스펙에서 누락
- 프론트엔드에서 이 필드를 타입으로 참조하면 TypeScript 에러 발생 가능

**동일 문제 in getStatus()**: Controller `getStatus()` 반환 타입 (line 138)에서도 `database.isSimulated`가 누락됨. Service `getHealthStatus()` (line 361, 415)는 `isSimulated: true`를 반환.

**계약 기준 적용**: "기존 필드 변경 없음" 요건 위반. `database.isSimulated`와 `performance.isSimulated`는 기존에 존재하던 필드인데, controller 타입 선언에서 삭제됨.

### 참고: MonitoringModule import 변경 불필요

`CacheModule`은 `@Global()` 데코레이터 적용 (확인: `apps/backend/src/common/cache/cache.module.ts` line 22). MonitoringModule에 별도 import 없이 `SimpleCacheService` 주입 가능. 현재 구현이 정확함.

### 참고: 보안 검증

- `@RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)` 적용으로 인증+권한 확인 통과
- 사용자 입력 데이터 신뢰 이슈 없음 (GET 엔드포인트, 파라미터 없음)
- `@Public()` 미적용 -- 인증 필수

## 전체 판정: FAIL

MUST 기준 중 "diagnostics 응답에 cache 필드 포함 (하위 호환 -- 기존 필드 변경 없음)"이 FAIL. Controller의 `getDiagnostics()`와 `getStatus()` 반환 타입 선언에서 기존 `isSimulated` 필드가 누락되어 하위 호환성이 깨짐.

## 수정 지시

1. **Controller `getDiagnostics()` 반환 타입 수정** (`monitoring.controller.ts` line 90-123):
   - `database` 객체에 `isSimulated: boolean` 추가 (line 90 부근)
   - `performance` 객체에 `isSimulated: boolean` 추가 (line 122 부근)

2. **Controller `getStatus()` 반환 타입 수정** (`monitoring.controller.ts` line 138-142):
   - `database` 객체에 `isSimulated: boolean` 추가

3. 수정 후 `pnpm --filter backend run tsc --noEmit` 재확인
