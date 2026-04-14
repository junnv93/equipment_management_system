# Execution Plan: 5 Module Unit Tests

**Date**: 2026-04-14
**Contract**: `.claude/contracts/unit-test-5modules.md`
**Scope**: cables, monitoring, software-validations, test-software, intermediate-inspections

---

## Phase 0: Common Mock Patterns (All Specs Share)

### MockDatabaseService (Drizzle chain mock)

기존 non-conformances.service.spec.ts 패턴을 재사용:

- **chain 객체**: `select`, `from`, `where`, `limit`, `offset`, `orderBy`, `insert`, `update`, `delete`, `values`, `set`, `returning`, `leftJoin`, `innerJoin` 메서드가 자기 자신을 반환
- **thenable chain**: `chain.then` 을 mock하여 `await chain` 시 빈 배열 반환
- **mockDb**: `select`, `insert`, `update`, `delete`, `transaction`, `query` 프로퍼티 제공
- **transaction mock**: `mockDb.transaction.mockImplementation(async (cb) => cb(txMock))` 패턴

### MockCacheService (SimpleCacheService)

```
getOrSet: jest.fn((key, factory) => factory())  // 캐시 바이패스
get: jest.fn(() => undefined)
set: jest.fn()
delete: jest.fn()
deleteByPrefix: jest.fn()
getCacheStats: jest.fn(() => ({ hitRate: 0, ... }))
```

### MockEventEmitter (EventEmitter2)

```
emit: jest.fn()
emitAsync: jest.fn().mockResolvedValue([])
```

### NestJS Testing Module

`Test.createTestingModule({ providers: [...] }).compile()` 패턴 사용.
`'DRIZZLE_INSTANCE'` token으로 mockDb 주입.

---

## Phase 1: cables.service.spec.ts

**File**: `apps/backend/src/modules/cables/__tests__/cables.service.spec.ts`
**Dependencies**: VersionedBaseService (extends), SimpleCacheService
**DI tokens**: `DRIZZLE_INSTANCE`, `SimpleCacheService`

### describe blocks:

#### 1. `describe('create')`
- 케이블 생성 성공 시 Cable 객체 반환
- 생성 후 캐시 무효화 호출 확인 (deleteByPrefix)

#### 2. `describe('findAll')`
- 기본 페이지네이션 응답 구조 (items + meta) 확인
- search 파라미터 적용 시 where 조건 포함 확인
- 빈 결과 시 meta.totalItems = 0, items = []

#### 3. `describe('findOne')`
- 존재하는 케이블 조회 시 latestDataPoints 포함 반환
- 존재하지 않는 UUID 조회 시 NotFoundException (code: CABLE_NOT_FOUND)
- 최신 측정이 없을 때 latestDataPoints = []

#### 4. `describe('update')`
- CAS 성공 시 업데이트된 Cable 반환 + 캐시 무효화
- version mismatch 시 ConflictException
- 존재하지 않는 케이블 업데이트 시 NotFoundException

#### 5. `describe('addMeasurement')`
- 트랜잭션 내에서 measurement + dataPoints + cable.lastMeasurementDate 갱신
- 존재하지 않는 cableId 시 NotFoundException
- 성공 후 캐시 무효화 확인

#### 6. `describe('findMeasurements')`
- 케이블의 측정 목록 반환
- 캐시 getOrSet 호출 확인

#### 7. `describe('findMeasurementDetail')`
- 존재하는 측정 상세 + dataPoints 반환
- 존재하지 않는 measurementId 시 NotFoundException

---

## Phase 2: monitoring.service.spec.ts

**File**: `apps/backend/src/modules/monitoring/__tests__/monitoring.service.spec.ts`
**Dependencies**: LoggerService, MetricsService, SimpleCacheService, DrizzleService
**특이사항**: constructor에서 비동기 초기화 (fetchDbVersion, setInterval). setInterval은 `.unref()` 호출. 테스트에서 타이머를 `jest.useFakeTimers()`로 제어하거나 `onModuleDestroy` 정리 필요.

### describe blocks:

#### 1. `describe('getSystemMetrics')`
- SystemMetrics 타입의 객체 반환 (cpu, memory, uptime, network, storage, hostname 등)
- os 모듈 기반 값이 포함되는지 확인

#### 2. `describe('getHealthStatus')`
- 기본 상태에서 status = 'healthy' 반환
- CPU/메모리 임계치 초과 시 status = 'degraded' (내부 metrics를 조작하여 테스트)
- 반환 구조: services.database, services.system, services.api, services.logging, services.cache

#### 3. `describe('recordHttpRequest')`
- 성공 요청 (2xx) 기록 시 successRequests 증가
- 에러 요청 (4xx/5xx) 기록 시 errorRequests 증가
- UUID가 포함된 경로가 :id로 정규화되는지 확인
- Map 크기 제한 (MAX_TRACKED_ENDPOINTS) 초과 시 가장 적은 엔트리 제거

#### 4. `describe('getHttpStats')`
- topEndpoints가 요청 수 기준 상위 5개로 정렬
- 요청이 없을 때 errorRate = 0

#### 5. `describe('getCacheStats')`
- SimpleCacheService.getCacheStats() 위임 확인

#### 6. `describe('getDatabaseDiagnostics')`
- DrizzleService.getMetrics() 기반 connections 정보 반환
- 미측정 필드 (avgQueryTime, slowQueries, queryCacheHitRate 등)가 null

#### 7. `describe('logClientError')`
- ClientErrorDto 전달 시 logger.error 호출 확인

#### 8. `describe('onModuleDestroy')`
- clearInterval 호출 확인 (메모리 누수 방지)

---

## Phase 3: software-validations.service.spec.ts

**File**: `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`
**Dependencies**: VersionedBaseService, SimpleCacheService, EventEmitter2
**상태 전이**: draft -> submitted -> approved -> quality_approved, submitted/approved -> rejected, rejected -> draft

### describe blocks:

#### 1. `describe('create')`
- testSoftwareId 존재 시 draft 상태로 생성
- testSoftwareId 미존재 시 NotFoundException (TEST_SOFTWARE_NOT_FOUND)
- 생성 후 캐시 무효화 확인

#### 2. `describe('findOne')`
- 존재하는 validation 반환
- 미존재 시 NotFoundException (SOFTWARE_VALIDATION_NOT_FOUND)

#### 3. `describe('update')`
- draft 상태에서만 수정 가능
- draft가 아닌 상태 (submitted, approved, rejected 등)에서 수정 시 BadRequestException (INVALID_STATUS_TRANSITION)
- CAS version mismatch 시 ConflictException

#### 4. `describe('submit')`
- draft -> submitted 전이 성공
- submitted 후 이벤트 emit 확인 (SOFTWARE_VALIDATION_SUBMITTED)
- draft가 아닌 상태에서 submit 시 BadRequestException

#### 5. `describe('approve')`
- submitted -> approved 전이 성공
- 이벤트 emit 확인 (SOFTWARE_VALIDATION_APPROVED)
- submitted가 아닌 상태 (draft, rejected 등)에서 approve 시 BadRequestException

#### 6. `describe('qualityApprove')`
- approved -> quality_approved 전이 성공
- 이벤트 emit 확인 (SOFTWARE_VALIDATION_QUALITY_APPROVED)
- approved가 아닌 상태에서 호출 시 BadRequestException

#### 7. `describe('reject')`
- submitted -> rejected 전이 성공
- approved -> rejected 전이 성공
- draft/quality_approved/rejected 상태에서 호출 시 BadRequestException
- 이벤트 emit 확인 (SOFTWARE_VALIDATION_REJECTED) + reason 포함

#### 8. `describe('revise')`
- rejected -> draft 전이 성공
- rejected가 아닌 상태에서 호출 시 BadRequestException

#### 9. `describe('findPending')`
- submitted 또는 approved 상태의 validation 목록 반환

---

## Phase 4: test-software.service.spec.ts

**File**: `apps/backend/src/modules/test-software/__tests__/test-software.service.spec.ts`
**Dependencies**: VersionedBaseService, SimpleCacheService, EventEmitter2
**특이사항**: advisory lock 기반 관리번호 생성 (PNNNN), M:N 장비 링크

### describe blocks:

#### 1. `describe('create')`
- 트랜잭션 내에서 관리번호 자동 생성 (P0001부터)
- 기존 최대 번호가 P0005이면 P0006 생성
- 성공 후 캐시 무효화

#### 2. `describe('findAll')`
- 페이지네이션 + 검색 응답 구조 확인
- testField, availability, search 필터 적용
- LEFT JOIN으로 primaryManagerName, secondaryManagerName 포함

#### 3. `describe('findOne')`
- 존재하는 소프트웨어 반환 (매니저 이름 포함)
- 미존재 시 NotFoundException (TEST_SOFTWARE_NOT_FOUND)

#### 4. `describe('update')`
- CAS 성공 시 업데이트된 TestSoftware 반환
- version mismatch 시 ConflictException
- 캐시 무효화 확인

#### 5. `describe('toggleAvailability')`
- available -> unavailable 토글
- unavailable -> available 토글
- CAS version mismatch 시 ConflictException

#### 6. `describe('linkEquipment')`
- 장비 연결 성공 시 link 객체 반환
- 소프트웨어 미존재 시 NotFoundException
- 중복 연결 시 ConflictException (EQUIPMENT_ALREADY_LINKED, PostgreSQL 23505)
- 양방향 캐시 무효화 확인
- 이벤트 emit 확인

#### 7. `describe('unlinkEquipment')`
- 연결 해제 성공
- 미존재 링크 해제 시 NotFoundException (EQUIPMENT_LINK_NOT_FOUND)
- 양방향 캐시 무효화 + 이벤트 emit 확인

#### 8. `describe('findByEquipmentId')`
- 장비에 연결된 소프트웨어 목록 반환

#### 9. `describe('findLinkedEquipment')`
- 소프트웨어에 연결된 장비 목록 반환

---

## Phase 5: intermediate-inspections.service.spec.ts

**File**: `apps/backend/src/modules/intermediate-inspections/__tests__/intermediate-inspections.service.spec.ts`
**Dependencies**: VersionedBaseService, SimpleCacheService
**상태 전이**: draft -> submitted -> reviewed -> approved, submitted/reviewed -> rejected, submitted -> draft (withdraw), rejected -> draft (resubmit)
**특이사항**: 3테이블 트랜잭션 생성, 하위 테이블 cascade 삭제, 역할 기반 삭제 권한, submitter-only withdraw

### describe blocks:

#### 1. `describe('create')`
- calibrationId 존재 시 draft 상태로 생성 (트랜잭션: inspection + items + equipment)
- calibrationId 미존재 시 NotFoundException (CALIBRATION_NOT_FOUND)
- items/measurementEquipment가 비어있어도 생성 성공

#### 2. `describe('createByEquipment')`
- 승인된 교정이 있을 때 해당 calibrationId로 생성
- 승인된 교정이 없으면 최신 교정으로 fallback
- 교정 기록이 전혀 없으면 NotFoundException (NO_ACTIVE_CALIBRATION)

#### 3. `describe('createByCalibration')`
- calibrationId에서 equipmentId를 역추적하여 생성
- calibrationId 미존재 시 NotFoundException

#### 4. `describe('findOne')`
- 존재하는 점검 상세 반환 (items + inspectionEquipment 포함)
- 미존재 시 NotFoundException (INTERMEDIATE_INSPECTION_NOT_FOUND)

#### 5. `describe('update')`
- draft 상태에서만 수정 가능
- draft가 아닌 상태에서 수정 시 BadRequestException
- items/measurementEquipment 교체 (전체 삭제 후 재삽입)
- CAS version mismatch 시 ConflictException

#### 6. `describe('submit')`
- draft -> submitted 전이 성공
- draft가 아닌 상태에서 BadRequestException

#### 7. `describe('review')`
- submitted -> reviewed 전이 성공
- submitted가 아닌 상태에서 BadRequestException

#### 8. `describe('approve')`
- reviewed -> approved 전이 성공
- reviewed가 아닌 상태에서 BadRequestException

#### 9. `describe('reject')`
- submitted -> rejected 전이 성공
- reviewed -> rejected 전이 성공
- draft/approved 상태에서 BadRequestException

#### 10. `describe('withdraw')`
- submitted -> draft 전이 성공 (submitter만 가능)
- 다른 사용자가 호출 시 BadRequestException (NOT_SUBMITTER)
- submitted가 아닌 상태에서 BadRequestException

#### 11. `describe('resubmit')`
- rejected -> draft 전이 성공
- rejected가 아닌 상태에서 BadRequestException

#### 12. `describe('remove')`
- allowApproved=false: draft/submitted/rejected 상태에서 삭제 성공
- allowApproved=false: approved/reviewed 상태에서 BadRequestException (CANNOT_DELETE_APPROVED)
- allowApproved=true: approved 상태에서도 삭제 성공
- 트랜잭션 내 하위 테이블 cascade 삭제 확인

---

## Phase 6: Verification

```bash
# 1. TypeScript 컴파일 검증
pnpm --filter backend run tsc --noEmit

# 2. 개별 spec 실행
pnpm --filter backend run test -- --testPathPattern="cables/__tests__/cables.service.spec"
pnpm --filter backend run test -- --testPathPattern="monitoring/__tests__/monitoring.service.spec"
pnpm --filter backend run test -- --testPathPattern="software-validations/__tests__/software-validations.service.spec"
pnpm --filter backend run test -- --testPathPattern="test-software/__tests__/test-software.service.spec"
pnpm --filter backend run test -- --testPathPattern="intermediate-inspections/__tests__/intermediate-inspections.service.spec"

# 3. 전체 백엔드 테스트 (기존 테스트 깨지지 않는지)
pnpm --filter backend run test
```

---

## Execution Order (권장)

1. **cables** (Phase 1) — 가장 단순한 CRUD + 측정 추가. mock 패턴 확립.
2. **monitoring** (Phase 2) — Mock 패턴이 다름 (OS/메트릭 기반, VersionedBaseService 미사용). 독립적.
3. **test-software** (Phase 4) — CRUD + toggleAvailability + M:N 링크. 중간 복잡도.
4. **software-validations** (Phase 3) — 승인 워크플로 (3단계 + reject/revise). 이벤트 emit 패턴.
5. **intermediate-inspections** (Phase 5) — 가장 복잡 (3테이블 트랜잭션, 7단계 상태 전이, 역할 기반 삭제, submitter-only withdraw).
