# Contract: CAS Hook 완성 + scopeToEquipmentConditions SSOT 정리

연결 exec-plan: `.claude/exec-plans/active/2026-04-08-cas-hook-completion-and-scope-predicate.md`

---

## MUST (loop-blocking)

### M1: TypeScript 컴파일 에러 0
`pnpm --filter backend run tsc --noEmit` 통과.

### M2: 백엔드 전체 테스트 PASS
`pnpm --filter backend run test` 전체 suite PASS, 회귀 0.

### M3: verify-cas PASS (equipment + checkouts)
- `equipment.service.ts`: `onVersionConflict` override 존재, `buildCacheKey('detail', { uuid: id })` + `buildCacheKey('detail', { uuid: id, includeTeam: true })` 두 키 삭제
- `checkouts.service.ts`: `onVersionConflict` override 존재, `buildCacheKey('detail', { uuid: id })` 단일 키 삭제
- 두 파일 모두 기존 try/catch ConflictException delete 브랜치 제거 완료

### M4: override 라인 예산 준수
- equipment onVersionConflict body: 정확히 2줄 (delete × 2)
- checkouts onVersionConflict body: 정확히 1줄 (delete × 1)
- Phase 1 buildCacheKey 승격: 각 파일 1행만 변경

### M5: verify-ssot PASS
- 로컬 재정의 없음
- `reports.service.ts`의 `scopeToEquipmentConditions`가 `dispatchScopePredicate` 위임 유지
- 캐시 키 문자열이 `buildCacheKey()` 경유 (인라인 하드코딩 금지)

### M6: verify-sql-safety PASS (reports.service.ts)
- RBAC INNER JOIN 유지, N+1 없음, LIKE escape regression 없음 (변경 없음)

### M7: verify-hardcoding PASS
- onVersionConflict override 내 캐시 키가 `buildCacheKey()` 경유

### M8: 범위 외 파일 무수정
- `apps/backend/src/common/base/versioned-base.service.ts`
- `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
- `apps/backend/src/modules/equipment/services/disposal.service.ts`
- `apps/backend/src/modules/self-inspections/self-inspections.service.ts`
- `apps/frontend/next-env.d.ts`
- `apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts`
- `tsconfig.tsbuildinfo`

### M9: 기존 catch 로직 무훼손
ConflictException delete 브랜치 외 로직(NotFoundException/BadRequestException 처리, logger.error, rethrow) 그대로 유지. ConflictException 자체는 여전히 throw됨.

---

## SHOULD (기록만, 루프 차단 아님)

### S1: review-architecture 캐시 일관성
onVersionConflict 호출 시점 + hook 실패 외곽 보호 검토.

### S2: tech-debt-tracker.md Item 3 결정 반영
- self-inspections NOT-APPLICABLE / calibration-plans DEFER / disposal DEFER / equipment+checkouts [x]

### S3: ConflictException import 정리
checkouts.service.ts에서 더 이상 불필요 시 제거.

---

## Out of Scope (포함 시 FAIL)

- versioned-base.service.ts hook 시그니처 변경
- calibration-plans / disposal / self-inspections 코드 변경
- reports.service.ts call site 10개 리팩토링
- 프론트엔드 파일 변경
- git status dirty 3개 파일
- 새 테스트 파일 추가
- 기존 캐시 정책 변경
