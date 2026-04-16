# 평가 리포트: data-migration-arch-fixes

## 메타데이터
- 평가일: 2026-04-16
- 평가자: QA Agent (skeptical)
- 대상 계약: `.claude/contracts/data-migration-arch-fixes.md`
- 이터레이션: 2
- 결론: **PASS** — 필수 기준 전체 통과

---

## 빌드/타입 체크 결과

### `pnpm --filter backend run type-check` (tsc --noEmit)
**결과: PASS** — 에러 0

### `pnpm --filter frontend run type-check` (tsc --noEmit)
**결과: PASS** — 에러 0

### `pnpm --filter backend run test`
**결과: PASS** — 677 tests passed, 50 test suites, 0 failures

---

## 필수 기준 평가

### W1: MIGRATION_SITE_ACCESS_DENIED → mapBackendErrorCode 매핑 존재 + SSOT 정의

**결과: PASS** (이터레이션 1과 동일, 변경 없음)

- `packages/shared-constants/src/error-codes.ts`에 `MigrationErrorCode.SITE_ACCESS_DENIED = 'MIGRATION_SITE_ACCESS_DENIED'` 정의 확인.
- `apps/frontend/lib/errors/equipment-errors.ts` line 551: `MIGRATION_SITE_ACCESS_DENIED: EquipmentErrorCode.PERMISSION_DENIED` 매핑 존재.
- SSOT → 백엔드 throw → 프론트엔드 매핑 체인 완전함.

---

### W2: MIGRATION_NO_VALID_SHEETS — dead mapping 제거

**결과: PASS** (이터레이션 1과 동일, 변경 없음)

- `equipment-errors.ts` 내 `MIGRATION_NO_VALID_SHEETS` 문자열 없음.
- Dead mapping 완전 제거됨.

---

### W3: getErrorReport 세션 소유권 검증 — executeMultiSheet과 동일 패턴

**결과: PASS** (이터레이션 1에서 FAIL → 수정됨)

**이터레이션 1의 결함이 완전히 수정되었음을 확인.**

**서비스** (`data-migration.service.ts` line 514):
```typescript
async getErrorReport(sessionId: string, userId: string): Promise<Buffer> {
```
- `userId` 파라미터 타입이 `string?` (optional) → `string` (required)로 변경됨.

**소유권 검증** (line 526):
```typescript
if (session.userId !== userId) {
  throw new ForbiddenException(...)
}
```
- `userId &&` 가드 제거됨. `userId`가 항상 `string`이므로 조건 없이 무조건 검증.

**컨트롤러** (`data-migration.controller.ts` line 159):
```typescript
const buffer = await this.dataMigrationService.getErrorReport(sessionId, req.user.userId);
```
- Optional chaining (`req.user?.userId`) 없음. `req.user.userId` 직접 접근 — `executeMultiSheet`과 동일 패턴.

**executeMultiSheet 패턴 비교**:
- `executeMultiSheet`: `userId: string` (required) + 컨트롤러 `req.user.userId` ✅
- `getErrorReport`: `userId: string` (required) + 컨트롤러 `req.user.userId` ✅
- 패턴 완전히 일치함.

**테스트 커버리지** (`data-migration.service.spec.ts`):
- `세션이 없으면 NotFoundException을 던진다` ✅
- `세션 소유자가 아니면 ForbiddenException을 던진다` ✅ — 소유권 검증이 실제로 호출됨을 명시적으로 검증.

---

### W4: validateAndGetUser tx 컨텍스트 존중

**결과: PASS** (이터레이션 1과 동일, 변경 없음)

- `equipment-history.service.ts` line 141–143: `validateAndGetUser(userId?: string, queryRunner?: AppDatabase)` — optional tx 파라미터 존재.
- line 149: `const executor = queryRunner ?? this.db` — 외부 커넥션 미사용.
- `createLocationHistoryBatch`에서 `validateAndGetUser(userId, tx)`로 tx 전달 확인.

---

### W5: EquipmentCacheInvalidation 헬퍼 사용 + 이력 시트 캐시 포함

**결과: PASS** (이터레이션 1과 동일, 변경 없음)

`use-data-migration.ts` line 80–85:
```typescript
await Promise.all([
  EquipmentCacheInvalidation.invalidateAll(queryClient),
  DashboardCacheInvalidation.invalidateAll(queryClient),
  queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.all }),
  queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.all }),
]);
```
- `EquipmentCacheInvalidation` 헬퍼 사용 확인.
- calibration / non-conformance / repair (equipment 하위) 이력 캐시 모두 포함.

---

### W6: use-data-migration.ts 모든 toast 문자열 — i18n t() 함수 사용

**결과: PASS** (이터레이션 1과 동일, 변경 없음)

4개 훅 모두 `useTranslations('data-migration')` 사용:
- `usePreviewMigration` (line 46)
- `useExecuteMigration` (line 69)
- `useDownloadErrorReport` (line 102)
- `useDownloadMigrationTemplate` (line 121)

모든 toast 제목/설명이 `t('toast.xxx')` 또는 `t('errors.xxx')` 패턴 사용. 하드코딩 문자열 없음.

ko/en JSON 대칭 확인: `toast` 섹션 10개 키, `errors.sessionExpired` 양쪽 존재.

---

## 아키텍처 교차 검증

### a) SSOT 체인
이터레이션 1과 동일 — `IN_FILE_DUPLICATE`, `DB_DUPLICATE`, `HISTORY_DB_DUPLICATE` 3개 코드는 row-level validation에만 사용되며 HTTP 에러로 throw되지 않음. SHOULD 레벨 tech-debt (루프 차단 없음).

### b) 패턴 일관성
- `getErrorReport` vs `executeMultiSheet`: 이제 완전히 동일 패턴 ✅
- `tx ?? this.db` 패턴: codebase 표준과 일치 ✅

---

## 요약

| 기준 | 이터레이션 1 | 이터레이션 2 |
|------|-------------|-------------|
| tsc backend | PASS | **PASS** |
| tsc frontend | PASS | **PASS** |
| backend test | PASS | **PASS** |
| W1: MIGRATION_SITE_ACCESS_DENIED 매핑 | PASS | **PASS** |
| W2: MIGRATION_NO_VALID_SHEETS 제거 | PASS | **PASS** |
| W3: getErrorReport 소유권 검증 | **FAIL** | **PASS** |
| W4: validateAndGetUser tx 컨텍스트 | PASS | **PASS** |
| W5: EquipmentCacheInvalidation 헬퍼 | PASS | **PASS** |
| W6: i18n hardcoding 제거 | PASS | **PASS** |

**전체 판정: PASS** — 필수 기준 전체 통과. 루프 종료 조건 충족.
