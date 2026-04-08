# CAS Hook 완성 + scopeToEquipmentConditions SSOT 정리 — 2026-04-08

## 상태
ACTIVE — Generator 실행 대기 중

## 관련 커밋
- f8ad419b: onVersionConflict hook 도입 + 6개 서비스 채택 (cables/test-software/calibration-factors/calibration/intermediate-inspections/software-validations)
- 8d7c8971 + b0804812: dispatchScopePredicate SSOT 승격

---

## Decisions

### [전제 수정] Item 1: buildCacheKey private→protected 승격 필요

분석 결과, `equipment.service.ts:151`과 `checkouts.service.ts:217`에서 `buildCacheKey`가 `private`으로 선언되어 있다. `onVersionConflict(id: string)` 훅은 엔티티 UUID만 받으므로, override 내부에서 `this.buildCacheKey('detail', { uuid: id })`를 호출하려면 이 메서드가 `protected`여야 한다.

결정: Phase 1에서 두 서비스 각각 `buildCacheKey` 1줄을 `private → protected`로 변경한다. `normalizeCacheParams`는 `buildCacheKey` 내부에서만 참조되므로 `private` 유지.

2-line override 예산 검증:
- equipment: `{ uuid: id }` + `{ uuid: id, includeTeam: true }` — 정확히 2줄
- checkouts: `{ uuid: id }` 1줄 — 예산 내

Phase 1은 Phase 2의 전제조건이므로 먼저 실행 후 tsc 통과 확인 필수.

---

### [결정] Item 2: scopeToEquipmentConditions는 이미 SSOT 준수 — 기능 변경 불필요

tech-debt-tracker에서 `[x]` 완료 마킹됨 (2026-04-08). 코드 확인 결과:
- `reports.service.ts:113` 함수가 내부에서 `dispatchScopePredicate` 위임 호출 중 (SSOT 정렬 완료)
- 함수가 파일 내부에서만 사용됨 (10개 call site, 전부 reports.service.ts)
- 다른 파일에서 import 없음 (grep 확인)

잔여 debt: 함수 이름 `scopeToEquipmentConditions`가 legacy 이름으로 남아 있으나 기능은 SSOT 준수. Phase 4에서 JSDoc만 갱신하고 함수/call site는 무수정 (최소 코드 원칙 — 10개 call site 대규모 리팩토링 불필요).

---

### [결정] Item 3: self-inspections — NOT-APPLICABLE

`SelfInspectionsService`는 `VersionedBaseService` 상속 + `updateWithVersion()` 사용 중이나, constructor에 `SimpleCacheService`가 주입되어 있지 않다 (캐시 없는 도메인). `onVersionConflict` default no-op이 이미 올바른 동작이므로 override 불필요.

hook 채택 시 무효화할 캐시 키가 없어 작업 비용 대비 효익 0. Phase 3에서 tracker만 업데이트.

### [결정] Item 3: calibration-plans — DEFER

`CalibrationPlansService`는 `VersionedBaseService`를 상속하나 `updateWithVersion()`을 호출하지 않음. 주석(service.ts:74-77)에 명시된 이유: `calibration_plans` 테이블이 `version`(개정 번호)과 `casVersion`(CAS 잠금)을 분리해 사용하므로 베이스 클래스 CAS 로직 적용 불가. `updateWithVersion()` 미호출 → hook 트리거 불가.

defer 이유: raw tx.update → updateWithVersion 이전은 테이블 스키마 인식 변경 동반. 현재 캐시 무효화는 ConflictException throw 직전 `delete(detail:uuid)` 인라인으로 처리 중 (충분함).

### [결정] Item 3: disposal — DEFER

`DisposalService`는 `VersionedBaseService`를 상속하나 `updateWithVersion()`을 호출하지 않음. 5개 CAS 경로 모두 raw `tx.update()` 직접 구현. hook 트리거 불가.

defer 이유: 5개 raw CAS 경로를 `updateWithVersion()`으로 이전하려면 트랜잭션 구조 변경 필요. 현재 `deleteByPattern(CACHE_PREFIX + '*')` 광범위 무효화로 stale cache 문제가 실질적으로 없음.

---

## Phase 0: Pre-flight (확인만, 수정 없음)

목적: 코드 상태가 이 exec-plan 전제와 일치하는지 확인.

확인 항목:
1. `apps/backend/src/common/base/versioned-base.service.ts` — `onVersionConflict(id: string)` 시그니처 존재
2. `apps/backend/src/modules/equipment/equipment.service.ts:151` — `buildCacheKey`가 `private` 상태
3. `apps/backend/src/modules/checkouts/checkouts.service.ts:217` — `buildCacheKey`가 `private` 상태
4. equipment.service.ts — ConflictException catch 블록에서 2-line delete 패턴이 3곳 존재
5. checkouts.service.ts — ConflictException catch 블록에서 1-line delete 패턴이 5곳 존재
6. `reports.service.ts:113` — `scopeToEquipmentConditions`가 `dispatchScopePredicate` 위임 호출 확인
7. `grep -r 'scopeToEquipmentConditions' apps/backend/` — reports.service.ts 단일 파일만 히트

성공 기준: 전제 일치 시 Phase 1 진행. 불일치 항목 발견 시 사용자에게 보고 후 계획 조정.

---

## Phase 1: buildCacheKey private→protected 승격

수정 파일:
1. `apps/backend/src/modules/equipment/equipment.service.ts` — `private buildCacheKey` → `protected buildCacheKey` (1행)
2. `apps/backend/src/modules/checkouts/checkouts.service.ts` — 동일 (1행)

성공 기준: `pnpm --filter backend run tsc --noEmit` 통과

---

## Phase 2: equipment + checkouts onVersionConflict override + boilerplate 제거

### `apps/backend/src/modules/equipment/equipment.service.ts`

추가:
- `protected async onVersionConflict(id: string): Promise<void>` override
- body: `buildCacheKey('detail', { uuid: id })` + `buildCacheKey('detail', { uuid: id, includeTeam: true })` 두 키 delete (정확히 2줄)

제거 (catch 블록 3곳, 각 2줄):
- `update()`, `deactivate()`, `updateStatus()`의 ConflictException delete 브랜치
- 각 catch 블록에서 ConflictException delete 라인만 제거, throw/rethrow 로직 유지

### `apps/backend/src/modules/checkouts/checkouts.service.ts`

추가:
- `protected async onVersionConflict(id: string): Promise<void>` override
- body: `buildCacheKey('detail', { uuid: id })` 단일 delete (1줄)

제거 (catch 블록 5곳, 각 1줄):
- `transitionStatus()`, `processReturn()`, `approveReturn()`, `extendCheckout()`, `updateCheckout()`의 ConflictException delete 브랜치

성공 기준:
- tsc 통과
- `pnpm --filter backend run test -- --testPathPattern="equipment|checkout|versioned-base"` PASS
- 409 발생 시 detail 캐시 삭제 동작이 기존 catch 블록과 동치

리스크: MEDIUM — `transitionStatus()` 내부 catch 분기 주의

---

## Phase 3: tech-debt-tracker.md Item 3 결정 사항 기록

수정 파일: `.claude/exec-plans/tech-debt-tracker.md`

- self-inspections: NOT-APPLICABLE 이유 명시
- calibration-plans: DEFER + casVersion 분리 구조 이유
- disposal: DEFER + raw tx.update 구조 이유
- equipment + checkouts: Phase 2 완료 시 `[x]` 마킹

---

## Phase 4: reports.service.ts JSDoc 갱신

수정 파일: `apps/backend/src/modules/reports/reports.service.ts`

`scopeToEquipmentConditions` 함수 JSDoc에 SSOT 정렬 완료 사실 명시 (3-4줄). 함수 시그니처/로직/call site 무수정.

---

## Phase 5: 검증

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --testPathPattern="equipment|checkout|versioned-base"
pnpm --filter backend run test
```

skill 검증: verify-cas, verify-ssot, verify-sql-safety, verify-hardcoding

---

## 파일 목록 요약

| Phase | 파일 | 변경 유형 |
|---|---|---|
| 1 | equipment.service.ts | visibility 1행 |
| 1 | checkouts.service.ts | visibility 1행 |
| 2 | equipment.service.ts | +6 / -6줄 |
| 2 | checkouts.service.ts | +4 / -5줄 |
| 3 | tech-debt-tracker.md | 상태 업데이트 |
| 4 | reports.service.ts | JSDoc 3-4줄 |

**범위 외 파일 (수정 금지):**
- `apps/backend/src/common/base/versioned-base.service.ts`
- `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
- `apps/backend/src/modules/equipment/services/disposal.service.ts`
- `apps/backend/src/modules/self-inspections/self-inspections.service.ts`
- git status dirty 파일 3개 (calibration-overdue-scheduler.ts, next-env.d.ts, tsbuildinfo)
