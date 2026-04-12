# Contract: cache-debt-sweep

## MUST Criteria

- [ ] MUST-1: `calibration.service.ts`의 `invalidateCalibrationCache`가 calibration record의 equipmentId로부터 teamId를 해석하여 team-scoped prefix 삭제를 수행해야 한다. broad fallback도 유지.
- [ ] MUST-2: `scope-aware-cache-key.ts`에 대한 단위 테스트가 존재하고 PASS해야 한다
- [ ] MUST-3: `equipment-imports.service.ts`의 `onVersionConflict`에 await가 있어야 한다
- [ ] MUST-4: `disposal.service.ts`의 `onVersionConflict`에 await가 있어야 한다
- [ ] MUST-5: `pnpm tsc --noEmit` 통과
- [ ] MUST-6: `pnpm --filter backend run test` 통과 (기존 테스트 회귀 없음)

## SHOULD Criteria

- [ ] SHOULD-1: scope-aware-cache-key 테스트가 edge cases를 커버 (empty params, undefined teamId, special characters)
- [ ] SHOULD-2: calibration invalidateCalibrationCache가 checkouts의 invalidateCache 패턴과 구조적으로 일관
