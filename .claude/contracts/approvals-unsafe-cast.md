# Contract: approvals-api.ts unsafe cast 제거

- **Slug**: approvals-unsafe-cast
- **Mode**: 1 (Lightweight)
- **Date**: 2026-04-12

## Scope

approvals-api.ts + NotificationsContent.tsx의 `as unknown as Record<string, unknown>` unsafe cast를 타입 안전한 접근으로 교체.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 (frontend) | CLI |
| M2 | `pnpm --filter frontend run build` exit 0 | CLI |
| M3 | `grep 'as unknown as Record' approvals-api.ts` → 0 hit | Grep |
| M4 | `grep 'as unknown as' NotificationsContent.tsx` → 0 hit | Grep |
| M5 | 기존 기능 회귀 없음 — caller site 타입 에러 없음 | tsc |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | relation 타입이 SSOT (한 곳에서 정의, 재사용) |
