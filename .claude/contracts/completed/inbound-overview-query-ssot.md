# 스프린트 계약: Inbound Overview Query SSOT

## 생성 시점
2026-05-03T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `apps/frontend/lib/utils/checkout-filter-utils.ts`가 반입 overview API/queryKey에 사용할 쿼리 객체를 생성하는 SSOT 순수 함수를 제공한다.
- [ ] `InboundCheckoutsTab.tsx`는 `statusFilter`/`searchTerm`/`limitPerSection` 조립을 직접 반복하지 않고 SSOT 함수를 사용한다.
- [ ] 명시 status 필터는 subTab 기본 상태 그룹보다 우선한다.
- [ ] `status='all'`이면 기존처럼 `SUBTAB_STATUS_GROUPS[subTab].join(',')`이 API statusFilter로 전달된다.
- [ ] 빈 검색어는 API query에서 `undefined`로 정규화되지만 queryKey 객체는 같은 SSOT 결과를 사용한다.
- [ ] `limitPerSection`은 `DEFAULT_PAGE_SIZE` 기본값을 하드코딩하지 않고 shared constants 기반으로 유지한다.
- [ ] focused frontend Jest가 새 helper의 기본/subTab/status/search/limit 동작을 검증한다.
- [ ] `pnpm --filter frontend run type-check` 에러 0.
- [ ] `pnpm --filter frontend run lint` 에러 0.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 변경 범위는 checkout filter/query 조립에 한정하고 `apps/frontend/lib/errors/*` 계열은 수정하지 않는다.
- [ ] review-architecture Critical 이슈 0개.
- [ ] `/checkouts?view=inbound` 런타임 렌더링은 별도 E2E 의존성이 없으면 focused unit/type/lint로 대체 가능하다.

### 적용 verify 스킬
- frontend-state / implementation / hardcoding 범위의 경량 검증.

---

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
