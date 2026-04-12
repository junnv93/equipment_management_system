# Contract: ondelete-cache-scope

## MUST Criteria

- [ ] MUST-1: `users.service.remove()`는 hard delete 전에 restrict FK 참조 존재 여부를 검사하고, 참조가 있으면 `BadRequestException`을 throw해야 한다
- [ ] MUST-2: FK violation이 application-level 검사를 우회하더라도 DB-level 에러를 catch하여 descriptive error로 변환해야 한다 (500 에러 방지)
- [ ] MUST-3: `calibration.service.ts`의 `buildCacheKey`가 `list` suffix에 대해 teamId를 구조적 segment(`:t:<teamId>:` | `:g:`)로 인코딩해야 한다
- [ ] MUST-4: `calibration.service.ts`의 `invalidateCalibrationCache`가 scope-aware prefix 삭제를 수행해야 한다
- [ ] MUST-5: `calibration.service.ts`에서 dead prefix (`pending:`, `intermediate-checks:`) 무효화를 제거해야 한다
- [ ] MUST-6: `buildStableCacheKey` import가 calibration.service.ts에서 제거되어야 한다 (내부 scope-aware buildCacheKey 사용)
- [ ] MUST-7: `pnpm --filter backend run tsc --noEmit` 통과
- [ ] MUST-8: `pnpm --filter backend run build` 통과
- [ ] MUST-9: `pnpm --filter backend run test` 통과 (기존 테스트 회귀 없음)

## SHOULD Criteria

- [ ] SHOULD-1: user delete guard의 에러 응답에 참조 테이블명을 포함하여 프론트엔드에서 의미있는 메시지 표시 가능
- [ ] SHOULD-2: `calibration.service.ts`에 `normalizeCacheParams` 헬퍼가 checkouts/calibration-factors와 동일한 패턴으로 존재
- [ ] SHOULD-3: `calibration.service.ts`의 `findAll` 캐시 키가 teamId/site를 params 객체 대신 구조적 segment로 분리
- [ ] SHOULD-4: invalidateCalibrationCache가 equipmentId로부터 teamId를 해석하여 정밀 scope 무효화 수행 (broad prefix fallback 허용)
