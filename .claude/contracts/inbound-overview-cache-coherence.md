# Contract: inbound-overview-cache-coherence

**Sprint**: review-architecture §3.3 closure (BFF 30s stale 해소)
**Date**: 2026-05-13
**Mode**: 1
**Parent review**: `/home/kmjkds/.claude/plans/modular-percolating-hippo.md` §3.3

---

## Background

`apps/backend/src/modules/checkouts/checkouts.service.ts:462` `invalidateCache(teamIds, checkoutId)` 가 `CHECKOUTS:` + `APPROVALS:counts:` prefix만 무효화. `CACHE_KEY_PREFIXES.INBOUND_OVERVIEW` (30s TTL BFF 집계 캐시) 가 cover 안 됨.

영향 시나리오:
1. 사용자 borrower_receive submit → `submitConditionCheck` 호출
2. `invalidateCache(teamIds, checkoutId)` 실행 — `CHECKOUTS:` 무효화 ✓
3. BFF `inbound-overview` 캐시 (`inbound-overview:t:<teamId>:s::q::l:50`) 는 30s TTL 동안 stale 상태 유지
4. FE 가 `invalidateQueries(checkouts.all)` 실행 — 클라이언트 캐시만 비움
5. 다음 BFF 호출 → stale 응답 (LENDER_CHECKED → IN_USE 전이 미반영, 30s)

`bulkReceive` 는 `submitConditionCheck` 를 N번 호출 — 동일 결함 N배 노출.

cache key 구조 (`apps/backend/src/modules/inbound-overview/inbound-overview.service.ts:55`):
```
${INBOUND_OVERVIEW}t:<teamId|'all'>:s:<statusFilter>:q:<search>:l:<limit>
```
단일 sub-prefix `t:` 사용 — `${INBOUND_OVERVIEW}t:` broad prefix 로 전체 cover 가능.

---

## MUST Criteria

### M-1: invalidateCache 에 INBOUND_OVERVIEW prefix 추가
- `apps/backend/src/modules/checkouts/checkouts.service.ts` `invalidateCache()` 의 모든 return 경로가 `${CACHE_KEY_PREFIXES.INBOUND_OVERVIEW}t:` sub-prefix 무효화 호출
- early return path (`teamIds.length === 0`) 도 cover
- 검증:
  ```bash
  grep -n "INBOUND_OVERVIEW" apps/backend/src/modules/checkouts/checkouts.service.ts
  # → invalidateCache 내부 1건 이상
  ```

### M-2: cross-domain wholesale 회귀 없음
- `${CACHE_KEY_PREFIXES.INBOUND_OVERVIEW}t:` 는 specific sub-prefix (audit script wholesale 검사 통과)
- 검증:
  ```bash
  node scripts/audit-cache-event-channels.mjs
  # → VIOLATIONS: 0
  ```

### M-3: tsc / test 정합
- `pnpm --filter backend exec tsc --noEmit` EXIT=0
- `pnpm --filter backend exec jest --testPathPattern="checkouts"` 신규 regression 0

---

## SHOULD Criteria

### S-1: 정합성 spec
- 별도 신규 spec 미생성 — `checkouts.service.spec.ts` 가 이미 `invalidateCache` 호출 mock 검증
- BFF stale 방지는 통합 검증 (E2E 또는 manual) — production 모니터링 검증

### S-2: 다른 BFF 모듈 정합 권고
- `cache-invalidation.helper.ts:286-293` `invalidateEquipmentImportsWithEquipment()` 가 inbound-overview 무효화 패턴 정합 — equipment-imports 경유 시 이미 cover
- 표준 checkout flow (`submitConditionCheck`) 는 helper 미경유 → 본 sprint 가 해소

---

## WON'T-DO

| 항목 | 사유 |
|------|------|
| W-1: 30s TTL 단축 | TTL 단축은 cache hit rate 저하. 무효화 정합이 정답 |
| W-2: cache event 채널로 위임 | 단일 prefix 무효화 1줄로 충분 — overcomplicated |

---

## Verification Commands

```bash
grep -n "INBOUND_OVERVIEW" apps/backend/src/modules/checkouts/checkouts.service.ts
node scripts/audit-cache-event-channels.mjs
pnpm --filter backend exec tsc --noEmit; echo "EXIT=$?"
pnpm --filter backend exec jest --testPathPattern="checkouts.service" 2>&1 | tail -5
```
