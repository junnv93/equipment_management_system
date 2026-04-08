---
slug: approvals-cross-site-scope
mode: 1
title: /admin/approvals cross-site pending 노출 (list/action site-scope 비대칭) 수정
created: 2026-04-08
---

## Problem

`GET /api/checkouts?statuses=pending` 의 site/teamId 필터는 **requester(users)** 기준으로 스코프를 적용하지만, approval action(`approve`, `rejectReturn`)은 **equipment** 기준(`enforceScopeFromData`)으로 거부한다. 결과: TM(suwon)이 Uiwang 장비 checkout을 목록에서 보고 → "승인" 클릭 → 403.

WF-33 spec은 이를 회피하기 위해 "최대 8건 순회" 루프로 우회 중.

## SSOT Decision

비rental checkout의 소속(site/team)은 **equipment.site/teamId**가 SSOT.
Rental checkout은 lender(`lenderSiteId`/`lenderTeamId`)가 SSOT.
`enforceScopeFromData` (checkouts.service.ts:967-979)가 이미 이 정의를 사용 — list query가 동일 정의를 따라야 함.

## Files (expected)

### MUST modify
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `buildQueryConditions` site/teamId 필터를 equipment-scoped로 교체 (line 338-461)
- `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts` — site/team filter regression test 추가 (없으면 신설)
- `apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts` — "최대 8건 순회" 루프 → 첫 항목 직접 클릭으로 단순화
- `apps/frontend/tests/e2e/features/approvals/comprehensive/01-access-control.spec.ts` — cross-site checkout 미노출 회귀 케이스 추가

### MUST NOT modify
- `enforceScopeFromData` / `enforceSiteAccess` — 이미 SSOT
- `CHECKOUT_DATA_SCOPE` policy — 변경 없음
- `data-scope.ts` — 변경 없음

## MUST Criteria

1. **Build**: `pnpm --filter backend exec tsc --noEmit` exit 0
2. **Build**: `pnpm --filter frontend exec tsc --noEmit` exit 0
3. **Backend test**: `pnpm --filter backend run test -- checkouts` 통과
4. **Architectural symmetry**: list 쿼리의 site/teamId 필터가 `checkoutItems → equipment` join 또는 EXISTS subquery로 equipment.site/teamId 기준 + rental purpose는 lender 폴백
5. **No N+1**: 단일 쿼리(EXISTS subquery 또는 IN subquery 형태) — per-row 추가 쿼리 금지
6. **SSOT**: 새 매직 컬럼/하드코딩된 값 도입 금지. CHECKOUT_DATA_SCOPE 그대로 사용

## SHOULD Criteria

1. WF-33 spec의 8건 순회 루프 제거 — 첫 outgoing 항목 직접 클릭
2. 01-access-control.spec.ts에 "TM(suwon team) does NOT see Uiwang-equipment checkout in /admin/approvals?tab=outgoing" 케이스
3. getCheckoutCount(approvals.service.ts:924) 도 동일 패턴으로 정합 — KPI 카운트와 list count 불일치 방지

## Out of Scope

- frontend approvals-api.ts 변경 (백엔드만 고치면 자연 해소)
- 프론트의 상상 disabled 렌더 (의도적으로 보여주는 정책으로 가지 않음)
- 다른 도메인(equipment-imports, calibration) — 다른 SCOPE 정책이고 별도 PR에서 다룸
