# Evaluation: ESLint v9.39 Migration

**Date**: 2026-04-07
**Iteration**: 1
**Verdict**: FAIL

## MUST Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| T1 | `pnpm install` peer warnings (eslint/ts-eslint) = 0 | PASS | install output had no peer warnings for eslint or @typescript-eslint/* |
| T2 | `pnpm exec eslint --version` = 9.39.x | PASS | `v9.39.4` |
| T3 | backend eslint version 9.39.x | PASS | `v9.39.4` |
| T4 | frontend eslint version 9.39.x | PASS | `v9.39.4` |
| T5 | backend `@typescript-eslint/{parser,eslint-plugin}` ^8.x | PASS | both `^8.58.0` |
| C1 | root `.eslintrc.js` deleted | PASS | `test ! -f` true |
| C2 | `apps/backend/.eslintrc.js` deleted | PASS | `test ! -f` true |
| C3 | root `eslint.config.mjs` exists + covers packages/**/*.ts | PASS | file present, `files: ['packages/**/*.ts']` block exists |
| C4 | `apps/backend/eslint.config.mjs` exists | PASS | present |
| C5 | `apps/frontend/eslint.config.mjs` exists | PASS | present, updated |
| C6 | No FlatCompat / `@eslint/eslintrc` in source | PASS | grep returns only pnpm-lock.yaml + exec-plan doc |
| R1 | backend print-config severities (no-explicit-any/explicit-function-return-type/explicit-module-boundary-types/no-unused-vars=error, ban-ts-comment=warn, no-restricted-imports=error w/ both patterns) | PASS | all severities verified via JSON parse of `--print-config` |
| R2 | frontend print-config severities | PASS | all 6 rules verified at correct severities |
| R3 | packages print-config `no-explicit-any` active | PASS | severity = `warn` (parity with legacy root) |
| R4 | SSOT `no-restricted-imports` lives in exactly 1 source file | PASS | only `eslint.shared.mjs` defines the patterns; all 3 configs import from it |
| B1 | `pnpm tsc --noEmit` exit 0 | PASS | exit 0 |
| B2 | backend build exit 0 | PASS | nest build clean |
| B3 | frontend build exit 0 | PASS | next build clean |
| L1 | `pnpm --filter backend run lint:ci` exit 0 | PASS | exit 0, no errors/warnings |
| L2 | `pnpm --filter frontend run lint` exit 0 | PASS | exit 0 (1 pre-existing warning, no `Cannot read config`/`ESLINT_USE_FLAT_CONFIG` strings) |
| I1 | `.lintstagedrc.json` `--config` flag count = 0 | PASS | grep -c = 0 |
| I2 | `.husky/pre-commit` unchanged | PASS | git diff main empty |
| I3 | `.github/workflows/main.yml` lint commands unchanged | PASS | git diff main empty |
| A1 | No `'error'`→`'warn'` downgrades vs legacy | PASS | severity diff inspection: all legacy `error` rules remain `error`; legacy `warn` rules remain `warn` |
| A2 | No `--max-warnings N>0` introduced | PASS | not present in any new config |
| A3 | No new `eslint-disable` without `-- <reason>` | PASS | `git diff main...HEAD \| grep '^+.*eslint-disable' \| grep -v ' -- ' \| wc -l` = 0 |
| **A4** | **No `ignores` entries excluding real source dirs** | **FAIL** | **see Issue #1 below** |
| S1 | SSOT spot-check: forbidden import triggers error under new config | PASS | scratch file produced `no-restricted-imports` error |
| Sf1 | No `--no-verify` on branch commits | PASS | `git log main..HEAD` grep empty |
| Sf2 | All changed files within file-change matrix | PASS (with note) | source fixes traceable to v8 `caughtErrors` default change + removed obsolete eslint-disable |

## SHOULD Notes

- `tseslint.config()` meta package used in all 3 configs — OK.
- `parserOptions.projectService: true` enabled in backend + frontend — OK.
- Shared fragment (`eslint.shared.mjs`) imported by all 3 configs — OK, no duplication.
- `globals` package used in backend — OK.
- `caughtErrorsIgnorePattern: '^_'` added to backend `no-unused-vars`. Legacy backend config did NOT define this option, so under v6 default (`caughtErrors: 'none'`) caught errors were never flagged. v8 default is `'all'`, so the new option restores partial parity (errors prefixed `_` ignored). This is parity restoration, not strictness regression — recorded as a SHOULD note. The associated source fixes (`catch (error)` → `catch (_error)`) in `i18n.service.ts` and `form-data-parser.interceptor.ts` map cleanly to the v6→v8 default change.

## Issues Found

### FAIL #1: Backend flat config `ignores` excludes real source files that legacy config linted

- **File**: `apps/backend/eslint.config.mjs` lines 23–34
- **Excluded paths newly added vs legacy `ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'test/**/*']`**:
  - `src/database/seed-test-new.ts`
  - `src/database/migrate.ts`
  - `src/database/push-schema.ts`
  - `src/database/manual-migrate.ts`
  - `src/database/migrate-user-roles.ts`
  - `scripts/**` (acceptable — outside legacy `{src,apps,libs,test}` lint glob)
  - `test-uploads/**` (acceptable — no `.ts` source)
- **Evidence**:
  ```
  $ pnpm exec eslint --no-ignore src/database/migrate.ts src/database/push-schema.ts \
      src/database/manual-migrate.ts src/database/migrate-user-roles.ts
  (no output — all 4 files lint clean)

  $ pnpm exec eslint --no-ignore src/database/seed-test-new.ts
  Parsing error: ... was not found by the project service.
  ```
  4 of the 5 `src/database/*.ts` files are real source, were in the legacy lint scope (`{src,apps,libs,test}/**/*.ts` glob with `ignorePatterns: ['dist/**','test/**']`), and lint **completely clean** under the new config. They have been silently dropped from coverage with no justification.
- **Contract clauses violated**:
  - Anti-regression MUST: *"No entries added to `ignores` that exclude real source directories (only generated output like `dist/`, `.next/`, `build/`, existing `test/**` parity)."*
  - Phase 4 forbidden: *"Adding files to `ignores` to dodge violations."*
- **Repair instruction**: Remove `'src/database/seed-test-new.ts'`, `'src/database/migrate.ts'`, `'src/database/push-schema.ts'`, `'src/database/manual-migrate.ts'`, `'src/database/migrate-user-roles.ts'` from the backend `ignores` array. For `seed-test-new.ts` (the only one with a `projectService` parse error), the correct fix is one of:
  1. Add the file to `apps/backend/tsconfig.json` `include` (preferred — it is real backend code), OR
  2. Add it to `parserOptions.projectService.allowDefaultProject: ['src/database/seed-test-new.ts']` with a comment explaining why it lives outside the TS project.
  Do NOT keep the wholesale `ignores` exclusion. Re-run `pnpm --filter backend run lint:ci` and confirm exit 0.

## Final Verdict

**FAIL** — 1 MUST violation (Anti-regression A4). Backend flat config silently removes 5 real source files from lint coverage that the legacy config covered. 4 of the 5 are clean and have no justification at all; the 5th has a `projectService` parse issue that must be fixed at the tsconfig/allowDefaultProject layer, not by ignoring the file. Every other MUST item passes; toolchain, config shape, rule parity, builds, lint, invocation paths, SSOT enforcement, and safety checks are all green.

---

## Iteration 2 (2026-04-07)

**Fix applied**: Removed 5 src/database file paths from backend `ignores`; added `parserOptions.projectService.allowDefaultProject: ['src/database/seed-test-new.ts']` to handle tsconfig-excluded standalone seed script.

| Check | Result | Evidence |
|---|---|---|
| ignores 5개 path 제거 | PASS | `apps/backend/eslint.config.mjs` ignores now only `dist/**`, `test/**`, `scripts/**`, `test-uploads/**`, `eslint.config.mjs` |
| allowDefaultProject 추가 | PASS | lines 40–44: `projectService: { allowDefaultProject: ['src/database/seed-test-new.ts'] }` with comment |
| 5개 파일 lint clean | PASS | `eslint src/database/{migrate,push-schema,manual-migrate,migrate-user-roles,seed-test-new}.ts` → EXIT=0, no "ignored" warning |
| print-config seed-test-new.ts | PASS | EXIT=0 |
| backend lint:ci | PASS | EXIT=0, clean |
| frontend lint | PASS | EXIT=0 (1 pre-existing `no-img-element` warning unchanged) |
| tsc | PASS | EXIT=0 |
| backend build | PASS | nest build EXIT=0 |
| frontend build | PASS | next build EXIT=0 |
| 회귀 없음 | PASS | `eslint.shared.mjs` mtime unchanged from iteration 1 (21:06, vs backend config 21:18); git status shows no unexpected new files |

**Final Verdict (Iteration 2)**: PASS — A4 violation fully repaired, all 5 previously-ignored source files now linted clean, no regressions across lint/tsc/build matrix.
