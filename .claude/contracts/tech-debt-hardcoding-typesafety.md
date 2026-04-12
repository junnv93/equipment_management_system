# Contract: tech-debt-hardcoding-typesafety

## Scope
P0~P2 기술 부채 해결 — 하드코딩 DB URL, @ts-ignore, Promise<unknown>, 매직 넘버

## MUST Criteria

1. **M1**: 하드코딩된 DB 연결 문자열 4개 파일 모두 `resolveDatabaseUrl()` 또는 환경변수 사용으로 교체
2. **M2**: `@ts-ignore` 2건 제거 — tsconfig paths에 `@equipment-management/shared-constants` 추가
3. **M3**: teams.controller.ts의 `Promise<unknown>` → 서비스 반환 타입과 일치하는 구체 타입으로 교체
4. **M4**: calibration-plans.controller.ts의 `Promise<unknown>` → 서비스 반환 타입과 일치하는 구체 타입으로 교체
5. **M5**: `pnpm tsc --noEmit` (backend + frontend) PASS
6. **M6**: `pnpm lint` PASS (기존 경고 제외, 새 에러 0)
7. **M7**: inspection/document 도메인 파일 수정 없음

## SHOULD Criteria

1. **S1**: main.ts의 `'10mb'` body limit → 환경변수 또는 명명된 상수로 추출
2. **S2**: monitoring.service.ts의 `updateInterval = 30000` → MONITORING_THRESHOLDS 또는 상수로 추출
3. **S3**: simple-cache.service.ts의 DEFAULT_MAX_SIZE, CLEANUP_INTERVAL_MS → 이미 파일 상단 상수로 추출되어 있으므로, 현재 수준 유지 확인
4. **S4**: redis create-redis-client.ts의 `Math.min(times * 100, 3000)` 매직 넘버 → 명명된 상수

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm lint
```
