# Production Checklist

## Backend Endpoint 추가 시

- [ ] CAS 필요 여부 확인 (상태 변경 → `version` 필드 + `VersionedBaseService`)
- [ ] Zod schema + `versionedSchema` + `ZodValidationPipe`
- [ ] `@RequirePermissions(Permission.XXX)` 데코레이터
- [ ] `req.user.userId` 서버 사이드 추출 (body에서 userId 받지 않기)
- [ ] `@AuditLog()` 데코레이터
- [ ] 캐시 무효화 전략 (`CacheInvalidationHelper`)
- [ ] 에러 응답에 `code` 필드 정의 (VERSION_CONFLICT 등)
- [ ] 다중 테이블 업데이트 → `db.transaction()`
- [ ] **검증:** `pnpm --filter backend run tsc --noEmit` 통과
- [ ] **검증:** 관련 유닛 테스트 통과 (`pnpm --filter backend run test -- --grep "모듈명"`)

## Frontend 기능 추가 시

- [ ] 서버 상태 → TanStack Query (useState 금지)
- [ ] 상태 변경 → `useOptimisticMutation`
- [ ] `queryKeys` 팩토리 등록 (`lib/api/query-config.ts`)
- [ ] VERSION_CONFLICT 에러 특별 처리
- [ ] Loading / Error / Empty state
- [ ] 캐시 무효화 (`EquipmentCacheInvalidation` or `invalidateQueries`)
- [ ] **검증:** `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] **검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되는지 diff 재확인
