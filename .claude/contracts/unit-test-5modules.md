# Contract: Unit Tests for 5 Backend Modules

**Exec Plan**: `.claude/exec-plans/active/2026-04-14-unit-test-5modules.md`
**Date**: 2026-04-14

---

## Scope

| # | Module | Spec File Path | Service |
|---|--------|---------------|---------|
| 1 | cables | `apps/backend/src/modules/cables/__tests__/cables.service.spec.ts` | CablesService |
| 2 | monitoring | `apps/backend/src/modules/monitoring/__tests__/monitoring.service.spec.ts` | MonitoringService |
| 3 | software-validations | `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` | SoftwareValidationsService |
| 4 | test-software | `apps/backend/src/modules/test-software/__tests__/test-software.service.spec.ts` | TestSoftwareService |
| 5 | intermediate-inspections | `apps/backend/src/modules/intermediate-inspections/__tests__/intermediate-inspections.service.spec.ts` | IntermediateInspectionsService |

---

## MUST (Pass/Fail)

### M1. TypeScript 컴파일 통과
```bash
pnpm --filter backend run tsc --noEmit
```
모든 spec 파일이 타입 에러 없이 컴파일되어야 한다.

### M2. 전체 백엔드 테스트 통과
```bash
pnpm --filter backend run test
```
새로 추가된 5개 spec을 포함하여 기존 테스트가 모두 통과해야 한다.

### M3. 최소 describe 블록 수

| Spec | 최소 describe 수 | 근거 |
|------|-----------------|------|
| cables.service.spec.ts | 7 | create, findAll, findOne, update, addMeasurement, findMeasurements, findMeasurementDetail |
| monitoring.service.spec.ts | 8 | getSystemMetrics, getHealthStatus, recordHttpRequest, getHttpStats, getCacheStats, getDatabaseDiagnostics, logClientError, onModuleDestroy |
| software-validations.service.spec.ts | 9 | create, findOne, update, submit, approve, qualityApprove, reject, revise, findPending |
| test-software.service.spec.ts | 9 | create, findAll, findOne, update, toggleAvailability, linkEquipment, unlinkEquipment, findByEquipmentId, findLinkedEquipment |
| intermediate-inspections.service.spec.ts | 12 | create, createByEquipment, createByCalibration, findOne, update, submit, review, approve, reject, withdraw, resubmit, remove |

### M4. 각 describe 블록에 최소 1개 이상의 it 케이스

빈 describe 블록 금지. 모든 describe에 실제 테스트가 포함되어야 한다.

### M5. 상태 전이 예외 테스트 포함

워크플로 서비스 (software-validations, intermediate-inspections)에서:
- 잘못된 상태에서 전이 시도 시 `BadRequestException` 발생 테스트가 반드시 포함되어야 한다
- 최소 3개 이상의 잘못된 상태 전이 테스트 per spec

### M6. CAS (Conflict) 테스트 포함

VersionedBaseService를 사용하는 4개 서비스 (cables, software-validations, test-software, intermediate-inspections)에서:
- version mismatch 시 `ConflictException` 발생 테스트가 최소 1개 포함

### M7. NotFoundException 테스트 포함

엔티티 조회 로직을 가진 4개 서비스 (cables, software-validations, test-software, intermediate-inspections)에서:
- 존재하지 않는 엔티티 접근 시 `NotFoundException` 발생 테스트가 최소 1개 포함
- monitoring은 엔티티 조회 로직이 없는 메트릭 집계 서비스이므로 제외

### M8. Mock 패턴 일관성

- `'DRIZZLE_INSTANCE'` token으로 mockDb 주입 (기존 패턴과 동일)
- `SimpleCacheService`는 mock 객체로 주입
- `EventEmitter2` 사용 서비스는 mock emit 확인

### M9. SSOT 준수

- 상태값은 `@equipment-management/schemas`에서 import (예: `ValidationStatusValues`)
- 하드코딩된 상태 문자열 최소화

---

## SHOULD (Best Effort)

### S1. 캐시 무효화 검증
각 mutation 메서드 (create, update, delete, 상태 전이)에서 적절한 캐시 무효화 호출 확인.

### S2. 이벤트 emit 검증
EventEmitter를 사용하는 서비스에서 올바른 이벤트명과 페이로드 검증.

### S3. 트랜잭션 내부 동작 검증
트랜잭션을 사용하는 메서드 (cables.addMeasurement, intermediate-inspections.create, test-software.create)에서 트랜잭션 콜백이 올바르게 실행되는지 확인.

### S4. 경계값 테스트
- monitoring: Map 크기 제한 도달 시 엔트리 제거
- test-software: 관리번호 P9999 다음 P10000 생성

### S5. 정리 (cleanup)
- monitoring: `onModuleDestroy` 호출 시 타이머 정리 확인
- 각 spec의 `afterEach`/`afterAll`에서 필요한 정리 수행

---

## Verification Commands

```bash
# Phase별 개별 실행
pnpm --filter backend run test -- --testPathPattern="cables/__tests__/cables.service.spec"
pnpm --filter backend run test -- --testPathPattern="monitoring/__tests__/monitoring.service.spec"
pnpm --filter backend run test -- --testPathPattern="software-validations/__tests__/software-validations.service.spec"
pnpm --filter backend run test -- --testPathPattern="test-software/__tests__/test-software.service.spec"
pnpm --filter backend run test -- --testPathPattern="intermediate-inspections/__tests__/intermediate-inspections.service.spec"

# 전체 검증
pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test
```
