# Contract: self-inspections.service.ts CAS 통일

**Slug**: `self-inspections-cas`
**Mode**: 1 (Lightweight)
**Scope**: `apps/backend/src/modules/self-inspections/self-inspections.service.ts` (단일 파일)

## Goal
SelfInspectionsService를 VersionedBaseService 상속으로 전환하여 12개 다른 서비스와 CAS 패턴을 통일한다. 수동 pre-check + 분리된 WHERE 절을 `updateWithVersion<T>()` atomic 호출로 교체. confirm()을 transaction으로 감싼다.

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | `SelfInspectionsService extends VersionedBaseService` | grep `extends VersionedBaseService` self-inspections.service.ts → 1 hit |
| M2 | update()가 `updateWithVersion<EquipmentSelfInspection>` 사용 | grep `updateWithVersion` → 2+ hits |
| M3 | confirm()이 `db.transaction()`으로 감싸짐 | Read 검증 |
| M4 | 수동 ConflictException throw 제거 (helper가 처리) | grep `new ConflictException` → 0 hit |
| M5 | CAS 의미 보존 — version 충돌 시 409, not-found 시 404 | helper가 보장 |
| M6 | `pnpm --filter backend exec tsc --noEmit` exit 0 | 실행 |
| M7 | `pnpm --filter backend run test` exit 0 (회귀 0) | 실행 |
| M8 | `protected readonly db` (private→protected, abstract override) + `super()` | Read 검증 |

## SHOULD
- 사용하지 않게 된 import 제거 (ConflictException, `and` if unused)
- 기존 에러 코드 유지 (`SELF_INSPECTION_NOT_FOUND`, `VERSION_CONFLICT`)

## Out of Scope
- DTO/Controller 변경
- 캐시 인프라 추가
- 다른 모듈 리팩토링
