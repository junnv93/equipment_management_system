---
slug: frontend-ssr-hydration-fixes
type: contract
mode: 1
created: 2026-04-29
---

# Contract: Frontend SSR/Hydration 3-Fix

## Context

콘솔 로그에서 발견된 3가지 프론트엔드 런타임 이슈를 아키텍처 수준에서 해결.
- Issue 1: `button.tsx` `'use client'` 누락 → Server Component 컨텍스트에서 폭발
- Issue 2: `INTERNAL_BACKEND_URL` 클라이언트 번들 누출 → module IIFE가 클라이언트에서 실행
- Issue 3: `ConnectionBanner` Hydration mismatch → SSR null vs CSR div

## Deliverables

| # | File | Action |
|---|------|--------|
| 1 | `apps/frontend/components/ui/button.tsx` | `'use client'` 추가 |
| 2 | `apps/frontend/lib/config/api-config.server.ts` | 신규 생성 — `INTERNAL_BACKEND_URL`, `resolveServerBaseUrl` 분리 |
| 3 | `apps/frontend/lib/config/api-config.ts` | server-only IIFE 제거, client/shared 상수만 유지 |
| 4 | `apps/frontend/lib/auth.ts` | import 경로 → `api-config.server` |
| 5 | `apps/frontend/lib/api/server/team-api-server.ts` | import 경로 → `api-config.server` |
| 6 | `apps/frontend/app/api/health/route.ts` | import 경로 → `api-config.server` |
| 7 | `apps/frontend/components/layout/connection-banner.tsx` | mounted guard 패턴으로 hydration 일관성 확보 |

## MUST Criteria

- [ ] M1: `pnpm --filter frontend run tsc --noEmit` — 에러 0
- [ ] M2: `button.tsx` 첫 줄 `'use client'` 존재
- [ ] M3: `api-config.ts`에 `INTERNAL_BACKEND_URL` export 없음 (grep 확인)
- [ ] M4: `api-config.server.ts`에 `INTERNAL_BACKEND_URL` export 존재
- [ ] M5: `lib/auth.ts`, `lib/api/server/team-api-server.ts`, `app/api/health/route.ts` 모두 `api-config.server`에서 import
- [ ] M6: `connection-banner.tsx`에 `mounted` state + early return null 패턴 존재

## SHOULD Criteria

- [ ] S1: `api-config.server.ts`에 JSDoc 설명 주석 (server-only 이유)
- [ ] S2: `api-config.ts`에서 `resolveServerBaseUrl` 함수도 제거됨
- [ ] S3: `ConnectionBanner`의 mounted guard가 `useEffect` 기반으로 구현됨 (not hack)
