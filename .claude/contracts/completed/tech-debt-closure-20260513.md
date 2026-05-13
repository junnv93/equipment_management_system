# Contract: tech-debt-closure-20260513

**Sprint**: tech-debt 8건 closure  
**Date**: 2026-05-13  
**Mode**: 2

---

## MUST Criteria

### M-1: R-4 — dead code 제거
- `apps/frontend/hooks/use-keyboard-shortcuts-scope.ts` 파일 삭제
- `grep -rn "use-keyboard-shortcuts-scope\|useKeyboardShortcutsScope" apps/frontend/ --include="*.ts" --include="*.tsx"` → 0건 (hook 파일 자체 제외)

### M-2: R-3 — extractKeyPaths 배열 명시적 처리
**설계 변경 (rev-2)**: 기존 i18n 파일에 47개 배열 존재 확인 → throw 대신 KNOWN_ARRAY_KEYS 스냅샷 방식으로 변경.
- `apps/frontend/lib/__tests__/i18n-parity.test.ts`의 `extractKeyPaths`: 배열을 leaf로 처리 (silent-pass 아님 — 키는 결과에 포함)
- `extractArrayPaths` 함수 신설 — 배열 경로 수집
- `KNOWN_ARRAY_KEYS` 상수 + 스냅샷 테스트 존재 — 새 배열 추가 시 테스트 실패 (명시적 갱신 강제)
- 기존 silent-fail 패턴 제거 확인: `grep -n "KNOWN_ARRAY_KEYS\|extractArrayPaths" apps/frontend/lib/__tests__/i18n-parity.test.ts` → 각 1건 이상

### M-3: G-7 — REVOCATION_KEYS 신설
- `apps/frontend/lib/api/cache-invalidation.ts` → `CheckoutCacheInvalidation.REVOCATION_KEYS` static readonly 존재
- `grep -n "REVOCATION_KEYS" apps/frontend/lib/api/cache-invalidation.ts` → 1건 이상

### M-4: G-6 — revokeMutation TData Checkout
- `apps/frontend/lib/api/checkout-revoke-approval.ts`: `revokeApproval` 반환 타입 `Promise<Checkout>`
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`: `revokeMutation` 타입 `useOptimisticMutation<Checkout, ...>` (void 아님)
- invalidateKeys에 REVOCATION_KEYS 사용 (APPROVAL_KEYS 대체)

### M-5: SH-4 — DB index
- `apps/backend/drizzle/0060_add_rejection_presets_sort_order_idx.sql` 존재
- `apps/backend/drizzle/meta/_journal.json`에 idx:60 entry 존재
- `packages/db/src/schema/rejection-presets.ts`에 sortOrder index 정의
- SQL 직접 apply 완료 (DB에 index 존재)

### M-6: G-5 — 팀 삭제 orphan cleanup
- `apps/backend/src/common/events/domain-events.ts` 존재 + `DOMAIN_EVENTS.TEAM_DELETED` export
- `apps/backend/src/modules/teams/teams.service.ts`: delete 후 `eventEmitter.emitAsync(DOMAIN_EVENTS.TEAM_DELETED, ...)` 호출
- `apps/backend/src/modules/saved-views/listeners/saved-views-team.listener.ts`: `@OnEvent(DOMAIN_EVENTS.TEAM_DELETED)` 리스너 존재
- `apps/backend/src/modules/saved-views/saved-views.module.ts`: 리스너 provider 등록

### M-7: SH-5 — server-time endpoint
- `apps/backend/src/modules/monitoring/monitoring.controller.ts`: `@Get('server-time')` + `@Public()` 존재
- `packages/shared-constants/src/api-endpoints.ts`: `MONITORING.SERVER_TIME` 존재
- `apps/frontend/hooks/use-server-time-offset.ts` 존재
- `apps/frontend/hooks/use-revocation-window.ts`: server time delta 적용

### M-8: SH-6 — destination entity 테이블
- `packages/db/src/schema/checkout-destinations.ts` 존재 (`checkoutDestinations` pgTable)
- `apps/backend/drizzle/0061_add_checkout_destinations.sql` 존재 (CREATE TABLE + backfill INSERT)
- `apps/backend/drizzle/meta/_journal.json`에 idx:61 entry 존재
- `apps/backend/src/modules/checkouts/checkouts.service.ts`: `getDistinctDestinations()` → entity table 기반 + `createDestination()` 메서드
- `apps/backend/src/modules/checkouts/checkouts.controller.ts`: `POST /destinations` 라우트
- `apps/frontend/hooks/use-destinations.ts` 존재 (entity 기반)
- `apps/frontend/components/checkouts/CheckoutDestinationCombobox.tsx`: entity 기반 create 플로우

### M-9: tsc clean
- `pnpm --filter backend run tsc --noEmit` EXIT=0
- `pnpm --filter frontend run tsc --noEmit` EXIT=0

### M-10: tests pass
- `pnpm --filter backend run test` → 모든 jest PASS (regression 0)
- `pnpm --filter frontend run test` → 모든 jest PASS (regression 0)

### M-11: SSOT 준수
- 하드코딩된 이벤트 이름 string 0건 (DOMAIN_EVENTS SSOT 경유)
- 하드코딩된 API endpoint 0건 (API_ENDPOINTS SSOT 경유)
- inline `any` type 0건

### M-12: 다른 세션 도메인 침범 없음
- `software-validations/`, `qr/`, `self-inspections/`, `inspection-form-templates/` 변경 0건

---

## SHOULD Criteria

### S-1: G-5 - audit trail
- 팀 삭제 시 orphan cleanup audit 로그 또는 경고 로그 존재

### S-2: SH-6 - DESTINATIONS_RECENT 유지
- `GET /checkouts/destinations/recent` 기존 동작 유지 (regression 없음)

### S-3: SH-5 - server-time SSR safe
- `useServerTimeOffset` hook이 SSR 환경에서 안전 (typeof window 가드 또는 Suspense)

### S-4: SH-6 - destination 존재 시 409 방어
- `POST /checkouts/destinations` 중복 요청 시 적절한 에러 (upsert 또는 409)
