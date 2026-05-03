# Contract: bundle-baseline-refresh-20260503

> **Slug**: `bundle-baseline-refresh-20260503`
> **Created**: 2026-05-03
> **Mode**: bundle baseline refresh harness

## Scope

Close the Open bundle baseline tracker items by producing current bundle measurements from a successful production build. The refresh also fixes build-blocking issues that prevented the measurement path from running under Next.js 16 webpack analyzer mode.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | `pnpm measure:bundle` must generate `.next/analyze/client.json` and refresh `scripts/bundle-baseline-checkouts.json`. | `generatedAt: "2026-05-03"`, checkouts gzip total 66.30 kB. |
| M2 | `scripts/check-bundle-size.mjs --baseline` must refresh `scripts/bundle-baseline.json` from current build artifacts. | `generatedAt: "2026-05-03"`, source `build-artifacts`, 74 routes, max 154.63 kB. |
| M3 | `measure-bundle.mjs` must use a Next build mode compatible with webpack-bundle-analyzer JSON output. | Build command uses `pnpm --filter frontend exec next build --webpack`. |
| M4 | Route `page.tsx` files must not export reusable skeleton components as invalid Next Page named exports. | `rg -n "^export (function\|const\|class\|async function)" apps/frontend/app -g page.tsx` shows only allowed `metadata`/`generateMetadata` exports. |
| M5 | Tracker items for checkouts/deps, axios baseURL, and dashboard baseline refresh are closed with the shared measurement evidence. | `tech-debt-tracker.md` marks all three bundle baseline items `[x]`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Preserve loading skeleton reuse by moving skeletons to colocated component files instead of duplicating markup in `loading.tsx`. | `CreateEquipmentFormSkeleton.tsx`, `CreateTeamPageSkeleton.tsx`, `CalibrationFactorsLoadingSkeleton.tsx`. |
| S2 | Keep regular app build script unchanged; only the analyzer-specific measurement script needs webpack mode. | `apps/frontend/package.json` is not modified for this fix. |

## Verification Commands

```bash
pnpm measure:bundle
node scripts/check-bundle-size.mjs --baseline
rg -n "^export (function|const|class|async function)" apps/frontend/app -g page.tsx
```
