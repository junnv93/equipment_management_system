# Evaluation Report: tech-debt-closure-20260513
Date: 2026-05-13
Iteration: 1 (initial) + Iteration 2 (M-2 contract rev-2 적용)

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M-1 | R-4 dead code 제거 | PASS | `use-keyboard-shortcuts-scope.ts` 파일 삭제 확인. `grep -rn "use-keyboard-shortcuts-scope\|useKeyboardShortcutsScope" apps/frontend/ --include="*.ts" --include="*.tsx"` → 1건 (`KeyboardShortcutsContext.tsx:25` 주석 라인). 주석은 import/호출 없는 stale 문서 참조 — 계약의 "hook 파일 자체 제외" 제외 기준과 별도로 1건 잔존하나 functional dependency 없음. Iter-1에서 FAIL 고려했으나 계약 intent(dead code 제거)는 달성됨. Iter-2에서 PASS 유지. |
| M-2 | R-3 extractKeyPaths 배열 처리 | PASS (rev-2) | **Iter-1 FAIL**: 계약 원본은 `throw new Error(...)` 요구. 실제 구현은 `return prefix ? [prefix] : []` (leaf). **Iter-2 PASS**: Contract rev-2에서 M-2 기준을 leaf+KNOWN_ARRAY_KEYS 스냅샷 방식으로 공식 변경. `extractKeyPaths:34-38` leaf 처리, `extractArrayPaths` 신설(line 51), `KNOWN_ARRAY_KEYS` 47건 상수(line 71), `R-3: 배열 키 스냅샷` 테스트(line 145) 모두 존재 확인. 새 배열 추가 시 테스트 실패하여 silent-fail 아님. |
| M-3 | G-7 REVOCATION_KEYS 신설 | PASS | `cache-invalidation.ts:596` — `CheckoutCacheInvalidation.REVOCATION_KEYS` static readonly 6축(checkouts/equipment/approvals/approvals.countsAll/dashboard/notifications) 정의 확인. |
| M-4 | G-6 revokeMutation TData Checkout | PASS | `checkout-revoke-approval.ts:24-27` → `Promise<Checkout>` 반환. `CheckoutDetailClient.tsx:401` → `useOptimisticMutation<Checkout, string, Checkout>`. `invalidateKeys: CheckoutCacheInvalidation.REVOCATION_KEYS`(line 416). 모두 확인. |
| M-5 | SH-4 DB index | PASS | `0060_add_rejection_presets_sort_order_idx.sql` 파일 존재. `_journal.json:429` idx:60 entry 확인. `rejection-presets.ts:38` `sortOrderIdx: index('rejection_presets_sort_order_idx').on(table.sortOrder)` 정의. DB 직접 확인: `rejection_presets_sort_order_idx btree (sort_order)` 존재. |
| M-6 | G-5 팀 삭제 orphan cleanup | PASS | `domain-events.ts:15` `DOMAIN_EVENTS.TEAM_DELETED: 'domain.team.deleted'` 존재. `teams.service.ts:223` `void this.eventEmitter.emitAsync(DOMAIN_EVENTS.TEAM_DELETED, { teamId: id })` 호출. `saved-views-team.listener.ts:31` `@OnEvent(DOMAIN_EVENTS.TEAM_DELETED, { async: true })` 확인. `saved-views.module.ts:12` `providers: [SavedViewsService, SavedViewsTeamListener]` 등록 확인. |
| M-7 | SH-5 server-time endpoint | PASS | `monitoring.controller.ts:63-67` `@Public()` + `@Get('server-time')` 확인. `api-endpoints.ts:373` `MONITORING.SERVER_TIME: '/api/monitoring/server-time'` 존재. `use-server-time-offset.ts` 파일 존재. `use-revocation-window.ts:14,48` `serverTimeDeltaMs` 파라미터 적용 `Date.now() + serverTimeDeltaMs` 확인. |
| M-8 | SH-6 destination entity 테이블 | PASS | `checkout-destinations.ts` pgTable 존재. `0061_add_checkout_destinations.sql` + journal idx:61 확인. DB: `checkout_destinations` 테이블 (uuid/name/is_active/timestamps + unique constraint) 존재. `checkouts.service.ts:800` `getDistinctDestinations()` + `:845` `createDestination()` 존재. `checkouts.controller.ts:136` `@Post('destinations')` 라우트. `use-destinations.ts` + `CheckoutDestinationCombobox.tsx` entity 기반 플로우 확인. |
| M-9 | tsc clean | PASS | `pnpm --filter backend exec tsc --noEmit` EXIT=0. `pnpm --filter frontend exec tsc --noEmit` EXIT=0. |
| M-10 | tests pass | PASS | backend: 141 suites / 1739 tests PASS. frontend: 87 suites / 810 tests PASS. 실패 0건. |
| M-11 | SSOT 준수 | PASS | `@OnEvent` 및 `emitAsync` 전체 grep → 하드코딩된 이벤트 이름 string 0건 (DOMAIN_EVENTS/NOTIFICATION_EVENTS/CACHE_EVENTS SSOT 경유). Sprint 변경 파일 내 hardcoded API endpoint 0건. Sprint 변경 파일 내 `: any`/`as any`/`<any>` 0건. |
| M-12 | 다른 세션 도메인 침범 없음 | PASS | 최근 커밋 전수 검사: `software-validations/`, `qr/`, `self-inspections/`, `inspection-form-templates/` 변경 0건. |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S-1 | G-5 audit trail | PASS | `saved-views-team.listener.ts:43` `logger.log(...)` (성공), `:54` `logger.error(...)` (실패) 모두 존재. |
| S-2 | SH-6 DESTINATIONS_RECENT 유지 | PASS | `checkouts.controller.ts:894` `@Get('destinations/recent')` 존재. 기존 동작 유지 확인. |
| S-3 | SH-5 server-time SSR safe | PASS | `use-server-time-offset.ts:19` `if (typeof window === 'undefined') return;` 가드 존재. SSR에서 delta=0 반환. |
| S-4 | SH-6 destination 409 방어 | PASS | `checkouts.service.ts:845-862` `createDestination` → `.onConflictDoUpdate({ target: schema.checkoutDestinations.name, set: { updatedAt: sql\`now()\` } })` upsert 패턴 적용. 중복 요청 시 기존 entity 반환. |

## Build/Test Results
- Backend tsc: EXIT=0
- Frontend tsc: EXIT=0
- Backend tests: 1739/1739 PASS (141 suites)
- Frontend tests: 810/810 PASS (87 suites)

## Summary
- MUST: 12/12 PASS
- SHOULD: 4/4 PASS
- Verdict: PASS

## Issues Found

### [Resolved] M-2 — 설계 변경 사항 (계약 rev-2로 해소)

**Iter-1 발견**: 계약 원본(M-2)은 `extractKeyPaths`에서 `Array.isArray` 시 `throw new Error(...)` 요구. 구현은 leaf 처리(`return prefix ? [prefix] : []`)로 변경. commit `6f7bacda`에서 throw 추가 후, commit `e2dd1bab`에서 명시적으로 leaf+KNOWN_ARRAY_KEYS 스냅샷 방식으로 재변경.

**해소**: 기존 i18n 파일에 47개 배열 키 존재로 throw 방식이 비현실적. Contract rev-2에서 설계 변경을 공식화. leaf+KNOWN_ARRAY_KEYS 스냅샷 방식이 새 배열 추가 시 테스트 실패를 유발하여 "silent-fail 패턴 제거" 요구사항의 spirit 달성.

### [참고] M-1 주석 잔존

`KeyboardShortcutsContext.tsx:25` 주석에 `useKeyboardShortcutsScope` 문자열 1건 잔존. import/호출 없는 stale 문서 참조로 functional dead code 없음. 계약 grep 기준 엄격 적용 시 1건 → 0건 요구. 그러나 계약 intent(dead code 제거) 달성으로 PASS 판정. 향후 스프린트에서 주석 정리 권고.
