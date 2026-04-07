# Contract: ESLint v8.57 → v9.39 Monorepo Upgrade

**Pivoted from v10.2 → v9.39 on 2026-04-07** (see exec-plan rationale): React/Next plugin ecosystem peer-deps cap at `^9`. v10 requires whitelisting peer warnings, which violates the no-band-aid rule. v9.39 is the highest cleanly compatible line.

**Exec plan**: `.claude/exec-plans/active/2026-04-07-eslint-v10.md`
**Branch**: `chore/eslint-v10`
**Harness Mode**: 2
**Evaluator infra**: `verify-ssot`, `verify-hardcoding`, manual command execution

---

## Goal

Upgrade ESLint from v8.57 to v10.2 across the monorepo, migrate root + backend from legacy `.eslintrc.js` to Flat Config (frontend already Flat Config), align `@typescript-eslint/*` to v8.x, preserve all existing rule strictness and SSOT guards, keep CI Lint jobs green.

---

## MUST (blocking — any failure halts the loop)

### Toolchain
- [ ] `pnpm install` completes with zero peer-dependency warnings for `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.
- [ ] `pnpm exec eslint --version` prints a version matching `^9\.39\.`.
- [ ] `pnpm --filter backend exec eslint --version` prints a version matching `^9\.39\.`.
- [ ] `pnpm --filter frontend exec eslint --version` prints a version matching `^9\.39\.`.
- [ ] `apps/backend/package.json` has `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` at `^8.x` (NOT `^6.x`).

### Config shape
- [ ] `./.eslintrc.js` does NOT exist (`test ! -f .eslintrc.js`).
- [ ] `apps/backend/.eslintrc.js` does NOT exist (`test ! -f apps/backend/.eslintrc.js`).
- [ ] `eslint.config.mjs` exists at repo root AND covers `packages/**/*.ts`.
- [ ] `apps/backend/eslint.config.mjs` exists.
- [ ] `apps/frontend/eslint.config.mjs` exists (pre-existing, updated).
- [ ] No file in the repo contains `require('@eslint/eslintrc')` or `FlatCompat` (clean flat config, no shim).

### Rule parity (no regression in strictness)
- [ ] `pnpm exec eslint --print-config apps/backend/src/main.ts` shows ALL of the following at the specified severity:
  - `@typescript-eslint/no-explicit-any`: `error`
  - `@typescript-eslint/explicit-function-return-type`: `error`
  - `@typescript-eslint/explicit-module-boundary-types`: `error`
  - `@typescript-eslint/no-unused-vars`: `error`
  - `@typescript-eslint/ban-ts-comment`: `warn`
  - `no-restricted-imports`: `error` with patterns covering `**/auth/rbac/roles.enum` AND `**/auth/rbac/permissions.enum`
- [ ] `pnpm exec eslint --print-config apps/frontend/app/page.tsx` shows ALL of:
  - `@typescript-eslint/no-explicit-any`: `error`
  - `@typescript-eslint/no-unused-vars`: `error`
  - `react-hooks/rules-of-hooks`: `error`
  - `react-hooks/exhaustive-deps`: `error`
  - `@next/next/no-html-link-for-pages`: `error`
  - `no-restricted-imports`: `error` with both SSOT patterns
- [ ] `pnpm exec eslint --print-config packages/schemas/src/index.ts` shows `@typescript-eslint/no-explicit-any` active (warn-level parity with pre-migration root config).
- [ ] SSOT `no-restricted-imports` rule fragment lives in EXACTLY ONE source file (e.g. `eslint.shared.mjs`); searching the repo for the exact pattern string returns a single definition imported by all three configs.

### Build & type
- [ ] `pnpm tsc --noEmit` at repo root exits 0.
- [ ] `pnpm --filter backend run build` exits 0.
- [ ] `pnpm --filter frontend run build` exits 0.

### Lint (CI posture)
- [ ] `pnpm --filter backend run lint:ci` exits 0 (CI mode, no auto-fix — same command as `.github/workflows/main.yml` line 85).
- [ ] `pnpm --filter frontend run lint` exits 0 (same as `.github/workflows/main.yml` line 88).
- [ ] Neither command prints `Cannot read config file` / `ESLINT_USE_FLAT_CONFIG` deprecation warnings / `Flag ... unrecognized` errors.

### Invocation paths
- [ ] `.lintstagedrc.json` contains ZERO `--config` flags pointing at any eslint config file (`grep -c '\-\-config' .lintstagedrc.json` → 0).
- [ ] `pnpm lint-staged` on a trial staged backend `.ts` file runs without "config not found" errors.
- [ ] `.husky/pre-commit` is unchanged (still `pnpm lint-staged`).
- [ ] `.github/workflows/main.yml` Lint job commands at lines 85 and 88 are unchanged (`pnpm --filter backend run lint:ci` and `pnpm --filter frontend run lint`).

### Anti-regression (strictness preservation)
- [ ] `git diff main...HEAD -- '**/eslint*' '*.eslintrc*'` contains zero instances of `'error'` → `'warn'` downgrades.
- [ ] No rule is removed from the rule set vs the pre-migration config unless its v8 replacement is added.
- [ ] No `--max-warnings N` where `N > 0` is introduced.
- [ ] No file-level `/* eslint-disable */` added in this PR.
- [ ] Every `eslint-disable-next-line` / `eslint-disable-line` added in this PR has a trailing `-- <reason>` comment. Verify:
  ```bash
  git diff main...HEAD | grep '^+.*eslint-disable' | grep -v ' -- ' | wc -l   # must be 0
  ```
- [ ] No entries added to `ignores` that exclude real source directories (only generated output like `dist/`, `.next/`, `build/`, existing `test/**` parity).

### SSOT preservation
- [ ] `verify-ssot` skill reports 0 violations after migration.
- [ ] Attempting `import from '**/auth/rbac/roles.enum'` in a test fixture still triggers the `no-restricted-imports` error under the new config (spot-check via `pnpm exec eslint` on a scratch file).

### Safety
- [ ] No `--no-verify` used in any commit on this branch.
- [ ] No changes touching files outside the file-change matrix in the exec plan, except for legitimate violation fixes surfaced by the new toolchain (each such fix must be traceable to a rule report in Phase 4).

---

## SHOULD (record but do not block)

- [ ] `@typescript-eslint` meta package (`typescript-eslint`) used for `tseslint.config()` composition rather than manual `plugins` + `extends` wiring, in both backend and frontend configs.
- [ ] `parserOptions.projectService: true` enabled in both backend and frontend flat configs (replaces deprecated `project: 'tsconfig.json'` path-based resolution).
- [ ] Shared rule fragment (`eslint.shared.mjs`) used by all three configs; no duplicated `no-restricted-imports` pattern objects.
- [ ] Frontend config spreads the same `no-restricted-imports` fragment (pre-migration frontend had its own copy — consolidate to DRY).
- [ ] New typescript-eslint v8 rules that are `recommended` and non-breaking are enabled by virtue of extending `tseslint.configs.recommended`; if any such rule produces mass violations, it MAY be scoped-down with justification in PR description (SHOULD, not MUST).
- [ ] `globals` package used for `node` / `jest` globals in backend flat config instead of hand-maintained globals object.
- [ ] PR description documents a before/after `eslint --print-config` diff summary for one representative file per workspace.

---

## Out of Scope (explicitly forbidden in this PR)

- Checkouts sequence/quantity schema work (separate branch).
- Tailwind v4 upgrade (#153).
- `minor-and-patch` dependency group bump (#176).
- Any rule strengthening beyond the pre-migration set (other than rules that ride in automatically via `tseslint.configs.recommended` at the same or lower severity).
- Refactoring source files beyond the minimum needed to resolve violations introduced by the toolchain upgrade.
- Adding `lint` scripts to `packages/db`, `packages/schemas`, `packages/shared-constants` (they intentionally have none today).
- Introducing `@eslint/eslintrc` / `FlatCompat` shim — migration must be clean.
- Changing `.github/workflows/main.yml` job names or shell commands.
- Touching `scripts/check-security-decorators.ts` or `scripts/check-endpoint-annotations.ts` (ts-morph scripts, not eslint).

---

## Evaluator Run Order

1. Toolchain assertions (version, peer deps).
2. Config shape assertions (file existence / non-existence, no shim).
3. Rule parity via `eslint --print-config` grep on three representative files.
4. Build + typecheck.
5. Lint (backend CI, frontend).
6. Invocation path assertions (lint-staged, workflow unchanged).
7. Anti-regression grep (severity downgrades, new disables without reason, new ignores).
8. `verify-ssot`.
9. Safety checks (no `--no-verify`, scope drift).

A single MUST failure → Generator loop retry (max 3). SHOULD failures → log only. Out-of-scope violations → hard fail (scope drift).
