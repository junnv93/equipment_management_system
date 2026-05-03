# Evaluation: GitHub Actions CI Stability

Evaluated: 2026-05-03 KST
Contract: `.claude/contracts/github-actions-ci-stability.md`
Mode: skeptical QA, no application/workflow code modified.

## Verdict

FAIL. Local CI-stability configuration checks mostly pass, but the contract requires the latest GitHub Actions executions for four workflows to be successful. The latest observed runs for `CI/CD Pipeline`, `Performance Audit (Lighthouse CI)`, `CodeQL Security Analysis`, and `Stale Branch Cleanup` are failures.

## Files Inspected

- `.github/workflows/stale-branches.yml`
- `.lighthouserc.js`
- `turbo.json`
- `infra/scripts/verify-compose-security.sh`
- `apps/frontend/app/layout.tsx`
- `apps/frontend/styles/globals.css`
- `apps/frontend/lib/design-tokens/brand.ts`
- `.claude/contracts/REGISTRY.md`

## MUST Criteria

| Criterion | Result | Evidence |
|---|---:|---|
| `shellcheck --severity=warning infra/scripts/*.sh infra/healthchecks/*.sh` succeeds | PASS | Command exited 0 with no findings. |
| `pnpm build` succeeds with CI-like frontend build env, or verifies frontend build env failure cannot recur | PASS | `INTERNAL_BACKEND_URL=http://localhost:3001 NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=ci-contract-secret DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder ENABLE_LOCAL_AUTH=true pnpm build` exited 0. Turbo built 5/5 packages successfully. |
| `lhci autorun` config has no Lighthouse `formFactor` / `screenEmulation` conflict | PASS | Node assertion confirmed `.lighthouserc.js` has `formFactor=desktop` and `screenEmulation.mobile=false`. |
| `.github/workflows/stale-branches.yml` action ref resolves upstream | PASS | `git ls-remote https://github.com/beatlabs/delete-old-branches-action.git 6e94df089372a619c01ae2c2f666bf474f890911 refs/tags/v0.0.10` returned `6e94df089372a619c01ae2c2f666bf474f890911 refs/tags/v0.0.10`. |
| Latest GitHub Actions runs for `CI/CD Pipeline`, `Performance Audit (Lighthouse CI)`, `CodeQL Security Analysis`, `Stale Branch Cleanup` are successful | FAIL | `gh run list --limit 20` showed latest completed runs failed: `CI/CD Pipeline` run `25267119086`, `CodeQL Security Analysis` run `25267119081`, `Performance Audit (Lighthouse CI)` run `25266849162`, `Stale Branch Cleanup` run `25265581895`. |

## SHOULD Criteria

| Criterion | Result | Evidence |
|---|---:|---|
| CI env vars are declared through Turbo task env SSOT, not workflow-only ad hoc bypass | PASS | `turbo.json` `tasks.build.env` includes `DATABASE_URL`, `ENABLE_LOCAL_AUTH`, `INTERNAL_BACKEND_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. |
| Lighthouse audit target is clearly fixed to desktop or mobile | PASS | `.lighthouserc.js` explicitly uses desktop settings: `formFactor: 'desktop'`, `screenEmulation.mobile: false`, `width: 1350`, `height: 940`. |
| Stale branch cleanup uses deletion-capable action pinned to verifiable version | PASS | `.github/workflows/stale-branches.yml` uses `contents: write`, `dry_run: false`, and pins `beatlabs/delete-old-branches-action` to SHA `6e94df089372a619c01ae2c2f666bf474f890911`, which resolves to tag `v0.0.10`. |

## Additional Requested Checks

| Command | Result | Notes |
|---|---:|---|
| `bash infra/scripts/verify-compose-security.sh` | PASS | x-security anchors synchronized; dev and base merged configs passed. |
| `pnpm --filter frontend run type-check` | PASS | Exited 0. |
| `pnpm --filter backend run type-check` | PASS | Exited 0 locally. |
| `pnpm --filter frontend run lint` | PASS | Exited 0. |
| `pnpm --filter backend run lint:ci` | PASS | Exited 0. |

## Live GitHub Actions Failures

| Workflow | Latest Run | Failure Detail | Repair Instruction |
|---|---:|---|---|
| `CI/CD Pipeline` | `25267119086` | Failed in `Quality Gate / TypeScript - Backend`: `src/modules/equipment-imports/equipment-imports.service.ts(108,37): error TS2339: Property 'dateRangeInvalid' does not exist on type ... VM.equipmentImport`. | Add the missing `dateRangeInvalid` validation message to the relevant validation-message SSOT, or change the service to reference an existing typed message key. Then rerun `pnpm --filter backend run type-check` and the CI workflow. |
| `CodeQL Security Analysis` | `25267119081` | Failed during `pnpm build` for the same backend TypeScript error at `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts:108`. | Same repair as CI/CD: restore the typed validation-message key or update the reference, then rerun CodeQL. |
| `Performance Audit (Lighthouse CI)` | `25266849162` | Latest run failed with `Screen emulation mobile setting (false) does not match formFactor setting (mobile)`. The checked local `.lighthouserc.js` now sets `desktop`, so the live failure appears to be from a pre-fix run. | Rerun `Performance Audit (Lighthouse CI)` on a commit containing the current `.lighthouserc.js`. If it still fails, verify no workflow-level LHCI config or CLI flag overrides `formFactor` back to `mobile`. |
| `Stale Branch Cleanup` | `25265581895` | Latest run failed resolving old action SHA `6e94df089e90d18f5b0cc4e27956e90b1b4bd8ae`. The checked workflow now uses resolvable SHA `6e94df089372a619c01ae2c2f666bf474f890911`. | Manually dispatch `Stale Branch Cleanup` on a commit containing the current workflow. If it still fails, confirm Actions is reading `.github/workflows/stale-branches.yml` from the expected branch and not a stale scheduled run definition. |

## Notes

- The local requested checks pass, including the full build with CI-like env.
- The contract's live Actions criterion is still a hard MUST. Until successful reruns are visible for all four required workflows, this evaluation remains FAIL.
