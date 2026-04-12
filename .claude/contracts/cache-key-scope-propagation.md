# Contract: cache-key-scope-propagation

## Context

equipment/checkouts 서비스는 scope-aware 캐시 키(`:t:<teamId>:` / `:g:`) + deleteByPrefix를 사용하나,
non-conformances/calibration-factors는 구버전(manual concat + flat key). equipment-approval은 deleteByPattern 사용.

## MUST

- [ ] equipment-approval.service.ts: `deleteByPattern()` → `deleteByPrefix()` 전환 (4곳)
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm --filter backend run test` exit 0 (565+)

## SHOULD

- [ ] non-conformances.service.ts: scope-aware buildCacheKey + SCOPE_AWARE_SUFFIXES 도입
- [ ] calibration-factors.service.ts: 동일 패턴 적용
- [ ] list 캐시 키에 buildStableCacheKey 또는 JSON params 사용 (manual concat 제거)

## Scope

- `apps/backend/src/modules/equipment/services/equipment-approval.service.ts`
- `apps/backend/src/modules/non-conformances/non-conformances.service.ts`
- `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts`

## MUST NOT

- No frontend changes
- No changes to equipment.service.ts or checkouts.service.ts (already done)
- No changes to SimpleCacheService interface
