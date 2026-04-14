---
slug: teams-parallel-query
date: 2026-04-14
task: teams.service.ts findAll 직렬 DB 쿼리 → Promise.all 병렬화
mode: 1
---

# Contract: teams-parallel-query

## MUST Criteria (루프 차단)

- [ ] `pnpm --filter backend run tsc --noEmit` → exit 0
- [ ] `pnpm --filter backend run test -- --testPathPattern='teams'` → 기존 테스트 전부 통과
- [ ] `findAll()` 내 count 쿼리와 data 쿼리가 `Promise.all`로 묶여 병렬 실행
- [ ] 반환 타입 `PaginatedResponseType<Team>` 구조 유지 (items, total, page, pageSize, totalPages)
- [ ] `whereClause`가 count 쿼리와 data 쿼리 양쪽에 동일하게 적용됨

## SHOULD Criteria (루프 비차단, tech-debt 기록)

- [ ] 기존 주석/코드 스타일 유지 (DashboardService Promise.allSettled 패턴과 일관성)
- [ ] 변경 범위가 `findAll()` 메서드 내부로 한정 (다른 메서드 미수정)
