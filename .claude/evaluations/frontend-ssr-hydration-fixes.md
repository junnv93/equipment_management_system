---
slug: frontend-ssr-hydration-fixes
iteration: 2
verdict: PASS
---

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|---------|
| M1 | tsc 0 errors | PASS | `pnpm tsc --noEmit --project apps/frontend/tsconfig.json` → 출력 없음 (0 errors) |
| M2 | button.tsx 첫 줄 `'use client'` 존재 | PASS | `button.tsx:1` = `'use client';` |
| M3 | api-config.ts에 `INTERNAL_BACKEND_URL` export 없음 | PASS | grep 결과 주석(comment)에만 등장, `export const INTERNAL_BACKEND_URL` 없음 |
| M4 | api-config.server.ts에 `INTERNAL_BACKEND_URL` export 존재 | PASS | `api-config.server.ts:43` = `export const INTERNAL_BACKEND_URL = resolveServerBaseUrl();` |
| M5 | lib/auth.ts, team-api-server.ts, health/route.ts 모두 api-config.server import | PASS | auth.ts:66, team-api-server.ts:10, health/route.ts:2 모두 `api-config.server` 경로 |
| M6 | connection-banner.tsx에 mounted state + early return null 패턴 | PASS | line 42: `useState(false)`, line 45: `setMounted(true)`, line 69: `if (!mounted \|\| !banner) return null` |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | api-config.server.ts에 JSDoc server-only 주석 | PASS | lines 1-9 server-only 경고 + ADR-0006 참조 포함 |
| S2 | api-config.ts에서 resolveServerBaseUrl 함수도 제거 | PASS | resolveServerBaseUrl은 api-config.ts에 없음. API_BASE_URL은 `resolveClientBaseUrl()` 직접 호출로 단순화 |
| S3 | ConnectionBanner mounted guard가 useEffect 기반 | PASS | `useEffect(() => { setMounted(true); }, [])` — ref hack 없음 |

## Issues Found

없음. 전 반복(iteration 1)의 IIFE 잔존 지적 → Fix Loop에서 `API_BASE_URL = resolveClientBaseUrl()` 단순화로 해소.
