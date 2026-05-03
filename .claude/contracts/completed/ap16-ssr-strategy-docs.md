# Contract: ap16-ssr-strategy-docs

> **Slug**: `ap16-ssr-strategy-docs`
> **Created**: 2026-05-03
> **Mode**: stale tech-debt closure harness

## Context

`tech-debt-tracker.md` had an Open item stating DashboardRow3/4 still used `next/dynamic(..., { ssr: true })` and that the AP-16 "First Load JS -15~30KB" comment was overstated. Current source already moved DashboardRow3/4 widget imports to client-only dynamic imports with card-specific skeleton fallbacks.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | `DashboardRow3.tsx` dynamic widget imports use `ssr: false`. | `rg -n "ssr: true" apps/frontend/components/dashboard/layout/DashboardRow3.tsx` returns 0. |
| M2 | `DashboardRow4.tsx` dynamic widget imports use `ssr: false`. | `rg -n "ssr: true" apps/frontend/components/dashboard/layout/DashboardRow4.tsx` returns 0. |
| M3 | Current dashboard layout source does not contain the overstated literal `First Load JS -15`. | `rg -n "First Load JS -15" apps/frontend/components/dashboard` returns 0. |
| M4 | Skeleton fallbacks remain attached to DashboardRow3/4 dynamic imports to keep the client-only transition layout-stable. | `DashboardRow3.tsx` and `DashboardRow4.tsx` dynamic options include component-specific `loading` fallbacks. |
| M5 | The tech-debt tracker item is closed with evidence, not silently deleted. | `phase2`-style `[x]` tracker evidence line for `ap16-ssr-strategy-docs`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Historical completed evaluations/contracts remain unchanged as audit records even if they mention the old finding. | Only tracker/registry/current closure artifacts are updated. |
| S2 | No runtime code changes are required for this closure. | Closure is based on current source state. |

## Verification Commands

```bash
rg -n "ssr: true" apps/frontend/components/dashboard/layout/DashboardRow3.tsx apps/frontend/components/dashboard/layout/DashboardRow4.tsx
rg -n "First Load JS -15" apps/frontend/components/dashboard
rg -n "loading: \\(\\) => <.*Skeleton" apps/frontend/components/dashboard/layout/DashboardRow3.tsx apps/frontend/components/dashboard/layout/DashboardRow4.tsx
```
