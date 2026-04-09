# Contract — calibration-plans CAS SSOT 통합

## 목표
`CalibrationPlansService.updatePlanWithCAS` private helper 제거 → `VersionedBaseService.updateWithVersion` 단일 SSOT 로 흡수. `casVersion` 컬럼 기반 CAS 도메인도 베이스 클래스에서 지원.

## 배경
- `calibration_plans` 테이블은 `version`(계획서 개정 번호, 별도 의미) + `casVersion`(CAS 잠금) 2-컬럼 설계
- 베이스 클래스 `updateWithVersion` 이 `table.version` 을 하드코딩 → 호출 불가 → 중복 구현 발생
- 결과: CAS 로직 2곳 drift 위험, `onVersionConflict` 훅 우회 (inline cache delete)

## API 설계
`VersionedBaseService.updateWithVersion` 에 마지막 optional 파라미터 추가:

```ts
casColumnKey?: string  // default: 'version'
```

내부 동작:
- `const col = (table as any)[casColumnKey ?? 'version'] as AnyPgColumn`
- WHERE 절: `eq(col, expectedVersion)`
- SET 절: `{ [casColumnKey ?? 'version']: sql`${col} + 1`, ... }`
- conflict 시 SELECT: `{ id: table.id, version: col }`

13개 기존 서브클래스는 파라미터 미전달 → 동작 100% 동일 (backward compatible).

## MUST 기준
- [ ] `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] `pnpm --filter backend run test` — 전체 PASS (regression 0)
- [ ] `updatePlanWithCAS` private helper 완전 제거 (`grep updatePlanWithCAS calibration-plans.service.ts` → 0 hit)
- [ ] 5개 호출처(update/submitForReview/review/approve/reject) 모두 `this.updateWithVersion(..., 'casVersion')` 사용
- [ ] `CalibrationPlansService` 에 `onVersionConflict(id)` override 추가 — detail 캐시 삭제 정책 훅 이관
- [ ] `versioned-base.service.spec.ts` 에 casColumnKey 파라미터 케이스 1건 이상 추가 (성공 + conflict)
- [ ] calibration-plans unit test 기존 CAS 경로 회귀 0

## SHOULD 기준
- `L933 version + 1` (revision 생성 flow) 무수정 — 수술적 경계 유지
- `confirmPlanItem` 의 inline CAS 체크(L714-718) 는 단일 동작이므로 무수정 — 과잉 리팩토링 회피
- `ConflictException` import 가 `updatePlanWithCAS` 제거 후 미사용이면 정리

## 범위 밖
- disposal 모듈 (다중 테이블 트랜잭션 제약, 별건 PR 후보)
- calibration-plans 의 `version` 개정 flow (별도 insert 경로)
- `confirmPlanItem` 의 optional CAS 경로

## 검증 명령
```
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run test -- --testPathPattern="(versioned-base|calibration-plans)"
pnpm --filter backend run test
```
