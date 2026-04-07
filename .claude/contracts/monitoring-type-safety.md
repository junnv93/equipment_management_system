---
slug: monitoring-type-safety
created: 2026-04-02
mode: 1
---

# 스프린트 계약: 모니터링 타입 안전성 + DB 실제 메트릭

## 필수 (MUST)

- [ ] `pnpm tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `ConnectionPoolMetrics` 인터페이스가 `packages/db` 또는 `drizzle.module.ts`에 정의 (SSOT)
- [ ] `getConnectionMetrics()` 반환 타입이 `ConnectionPoolMetrics` (unknown 아님)
- [ ] `DrizzleService.getMetrics()` 반환 타입이 `ConnectionPoolMetrics` (unknown 아님)
- [ ] `monitoring.service.ts`에서 `as ConnectionPoolMetrics` 캐스팅 0건
- [ ] `queriesExecuted`에 `connectionsAcquired` 매핑하지 않음 — 의미적으로 정확한 값 사용
- [ ] `avgQueryTime: 0` 하드코딩 제거 또는 미구현 표시

## 권장 (SHOULD)

- [ ] 미구현 DB 메트릭 필드에 `null` 반환하여 프론트엔드에서 구분 표시
