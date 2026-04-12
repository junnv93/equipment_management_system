# Exec Plan: onDelete 안전 가드 + calibration 캐시 scope-aware

- **Date**: 2026-04-12
- **Slug**: ondelete-cache-scope
- **Mode**: 2 (Full)
- **Scope**: users, calibration (monitoring/inspection/result-sections 회피)

## Background

### Finding 1: onDelete 정책은 이미 통일됨
non-conformances.discoveredBy, calibration-factors.calibrationId 모두 `restrict`로 이미 수정.
그러나 `users.service.remove()`가 hard delete를 수행하면서 restrict FK를 전혀 검사하지 않음.
→ DB-level FK violation이 unhandled 500 에러로 노출되는 아키텍처 결함.

### Finding 2: calibration-factors는 이미 scope-aware 적용 완료
SCOPE_AWARE_SUFFIXES, buildCacheKey, normalizeCacheParams 모두 checkouts 패턴과 동일하게 구현됨.

### Finding 3: calibration.service.ts는 old pattern
- `buildCacheKey(type, id?)` — 단순 문자열 결합, scope 미지원
- `buildStableCacheKey` 호출하지만 teamId가 JSON params 내부에 매몰
- `invalidateCalibrationCache`에 dead prefix (`pending:`, `intermediate-checks:`) 존재
- 광범위 prefix 삭제로 불필요한 캐시 미스 발생

## Phase 1: users.service.remove() FK 안전 가드

**파일**: `apps/backend/src/modules/users/users.service.ts`

**목표**: hard delete 전에 restrict FK 참조 테이블을 쿼리하여, 참조가 존재하면 
`BadRequestException`을 throw. DB-level FK violation을 application-level 검증으로 선제 차단.

**검사 대상 테이블** (users.id를 restrict FK로 참조하는 핵심 테이블):
- non_conformances (discoveredBy, correctedBy, closedBy, rejectedBy)
- calibration_factors (requestedBy, approvedBy)
- checkouts (requesterId, approverId, returnerId)
- calibrations (technicianId, registeredBy, approvedBy, rejectedBy)
- calibration_plans (createdBy, reviewedBy, approvedBy, rejectedBy)
- intermediate_inspections (inspectorId, submittedBy, reviewedBy, approvedBy, rejectedBy, createdBy)
- equipment_self_inspections (inspectorId, confirmedBy)
- software_validations (multiple user FKs)
- disposal_requests (requestedBy, reviewedBy, approvedBy, rejectedBy)
- equipment_imports (requesterId, approverId, receivedBy)
- equipment_requests (requestedBy)
- repair_history (repairedBy)
- cables (measuredBy, createdBy)
- documents (no user FK with restrict — skip)
- equipment_location_history (changedBy)
- equipment_incident_history (reportedBy)
- equipment_maintenance_history (performedBy)
- condition_checks (checkedBy)
- form_template_revisions (revisedBy)
- system_settings (updatedBy)
- test_software (createdBy)

**구현 방향**: 모든 테이블을 개별 쿼리하지 않고, 가장 빈번한 핵심 테이블 몇 개만 
application-level 검사 후, try-catch로 DB FK violation을 잡아 descriptive error 변환.
이렇게 하면 새 FK가 추가되어도 안전.

## Phase 2: calibration.service.ts 캐시 scope-aware

**파일**: `apps/backend/src/modules/calibration/calibration.service.ts`

**목표**:
1. `buildCacheKey`를 scope-aware 패턴으로 교체 (checkouts/calibration-factors 참조)
2. `buildStableCacheKey` import 제거, 내부 scope-aware `buildCacheKey` 사용
3. `invalidateCalibrationCache`에서 dead prefix 제거 + scope-aware 정밀 무효화
4. `normalizeCacheParams` 헬퍼 추가

## Phase 3: Verification

- `pnpm --filter backend run tsc --noEmit`
- `pnpm --filter backend run build`
- `pnpm --filter backend run test`
