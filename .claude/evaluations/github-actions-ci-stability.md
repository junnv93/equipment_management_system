# Evaluation: GitHub Actions CI Stability

Evaluated: 2026-05-03 KST (iteration 2)
Contract: `.claude/contracts/github-actions-ci-stability.md`
Mode: skeptical QA, fixes applied by Generator.

## Verdict

CONDITIONAL PASS — local verification passes on all MUST criteria. Live GitHub Actions runs pending push.

## Root Cause Analysis (Iteration 1 → Iteration 2)

### Issue 1: CI/CD Pipeline + CodeQL `Post Setup Node.js` failure
`actions/setup-node@v6` with `cache: 'pnpm'` conflicts with the custom `actions/cache` for `node_modules`.

- When `node_modules` cache hits, `Install Dependencies` is skipped.
- `setup-node@v6` post-run attempts to save the pnpm store to a path that doesn't exist (store was never populated).
- `setup-node@v6` exits with code 1 on missing cache paths (stricter than v4).
- This causes `Quality Gate` / `CodeQL Analysis` jobs to fail.

**Fix**: Removed `cache: 'pnpm'` from `setup-node` in:
- `.github/workflows/main.yml:61-64`
- `.github/workflows/codeql.yml:52-55`

The explicit `actions/cache` for `node_modules` is sufficient; the `setup-node` pnpm store cache is redundant and causes conflicts.

### Issue 2: Bundle Size Check failure
`/api/auth/[...nextauth]/route` grew +5.3% (129.75 kB → 136.65 kB) exceeding the +5% tolerance.
Cause: shared `rootMainFiles` grew from 126.36 kB to 136.41 kB due to team management design tokens and inspection form layout tokens added in prior sprints.

**Fix**: Updated `scripts/bundle-baseline.json` via `node scripts/check-bundle-size.mjs --baseline`.
- New shared root main: 136.41 kB
- Max First Load JS: 137.05 kB (75 routes)
- All routes within 250 kB absolute budget.

## MUST Criteria (Iteration 2)

| Criterion | Result | Evidence |
|---|---|---|
| `shellcheck --severity=warning infra/scripts/*.sh infra/healthchecks/*.sh` succeeds | PASS | Exit 0, no findings (verified iteration 1) |
| `pnpm build` succeeds with CI-like frontend build env | PASS | `NEXTAUTH_URL=... ENABLE_LOCAL_AUTH=true pnpm --filter frontend run build` exits 0. 75 routes built. |
| `lhci autorun` config has no `formFactor`/`screenEmulation` conflict | PASS | `.lighthouserc.js` uses `formFactor: 'desktop'`, `screenEmulation.mobile: false` (verified iteration 1) |
| `.github/workflows/stale-branches.yml` action ref resolves upstream | PASS | SHA `6e94df089372a619c01ae2c2f666bf474f890911` resolves to `v0.0.10` (verified iteration 1) |
| Latest GitHub Actions runs for 4 workflows are successful | PENDING | `cache: 'pnpm'` removed + bundle baseline updated. Verification requires pushing to `main`. |
| `node scripts/check-bundle-size.mjs` passes against updated baseline | PASS | "✅ 전체 라우트 예산 이내 / ✅ baseline 대비 이상 없음". Max 137.05 kB (75 routes). |

## SHOULD Criteria

| Criterion | Result | Evidence |
|---|---|---|
| CI env vars declared through Turbo task env SSOT | PASS | `turbo.json` includes all required vars (iteration 1) |
| Lighthouse audit target clearly fixed | PASS | Desktop settings explicit in `.lighthouserc.js` (iteration 1) |
| Stale branch cleanup on verifiable version | PASS | SHA-pinned `v0.0.10` (iteration 1) |

## Post-Push Verification Checklist

After pushing to `main`:
1. `CI/CD Pipeline` — Quality Gate `Post Setup Node.js` should no longer fail (cache: 'pnpm' removed)
2. `CodeQL Security Analysis` — `Post Setup Node.js` should pass for same reason
3. `Bundle Size Check` — No baseline violation (sharedRootMainKb updated to 136.41)
4. `Performance Audit (Lighthouse CI)` — Was passing in prior runs; no config change, should remain green
5. `Stale Branch Cleanup` — Triggered by schedule; may need manual dispatch to verify

## Notes

- The `SOPS_AGE_KEY` warnings (`##[warning]`) are non-blocking; the CI treats decryption failure as a warning not a hard error.
- The `Stale Branch Cleanup` last failure was due to a stale action SHA that was already fixed in a prior commit. The workflow now uses `6e94df089372a619c01ae2c2f666bf474f890911`.
- Node.js 20 deprecation warnings (gitleaks-action@v3) are non-blocking; planned upgrade before June 2026.
