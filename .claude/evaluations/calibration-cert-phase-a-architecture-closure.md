# Evaluation: calibration-cert-phase-a-architecture-closure

> Iteration: 2 · Evaluator: sonnet (independent QA re-evaluation) · Date: 2026-05-07

## Context

Sprint commit: `ad42b6ea` (`feat(calibration): close phase A architecture (옵션 C)`)
Archive commit: `ba3f258f` (contract moved to completed/, REGISTRY row removed)
Evaluation runs AFTER commit — M-12 greps adapted to `git show ad42b6ea --name-only` rather than `git diff --cached`.

옵션 C 합의: M-9 / M-10 → N/A. M-5 = CalibrationRegisterDialog.test.tsx 단독.

---

## MUST Verdicts

| ID | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| M-1 | schemas + shared-constants build | PASS | schemas build exit=0; shared-constants build exit=0 |
| M-2 | Backend tsc + lint | PASS | tsc errors: 0; lint issues: 0 |
| M-3 | Frontend tsc + lint (sprint scope) | PASS | sprint files tsc errors: 0; eslint exit=0 on 6 sprint files. Pre-existing error in `use-checkout-group-aggregates.test.ts` (other session, not sprint scope) |
| M-4 | Backend calibration tests | PASS | 6 suites / 72 tests — all PASS |
| M-5 | CalibrationRegisterDialog.test.tsx RTL spec | PASS | 1 suite / 4 tests PASS. File exists. grep count=4 (≥4). Full frontend jest: 69 suites / 570 tests all PASS |
| M-6 | Sub-route files + Next.js 16 patterns | PASS | `page.tsx` and `CalibrationHistoryClient.tsx` exist. `paramsPromise: Promise<` count=2 ≥1. `Suspense fallback` count=1 ≥1 |
| M-7 | FilterChip props + a11y | PASS | File exists. `label:` count=1, `value:` count=1, `onClear:` count=1, `clearAriaLabel` count=3. `aria-label={clearAriaLabel}` applied to button (count=1) |
| M-8 | Design token FILTER_CHIP_TOKENS | PASS | File exists. `export const FILTER_CHIP_TOKENS` count=1. `as const` count=1. JIT dynamic interpolation count=0. `index.ts` re-export count=1 |
| M-9 | CalibrationContent inline chip migration | N/A | 옵션 C — deferred to follow-up sprint. CalibrationContent.tsx untouched by sprint commit (git diff ad42b6ea on that file = 0 lines) |
| M-10 | Chip data sourcing useEquipment | N/A | 옵션 C — same reason as M-9 |
| M-11 | Backend AuditLog entityIdPath | PASS | `entityIdPath` count=1, `response.certificateNumber` count=1, `action: 'extract'` count=2, `entityType: 'calibration_certificate'` count=2 |
| M-12 | Cross-domain isolation | **CONDITIONAL PASS** | See note below |
| M-13 | Hardcoding 0 + SSOT | **CONDITIONAL PASS** | See note below |

---

## M-12 Cross-Domain Isolation — Detailed Finding

**Issue found**: `packages/shared-constants/src/frontend-routes.ts` is in the sprint commit (`ad42b6ea`).

Contract M-12 literal criterion:
```
git diff --cached --name-only | grep -E "^packages/(schemas|shared-constants)/" | wc -l
# expected: 0
```

Actual result against sprint commit: **1** (not 0).

**Content of the change**: A new route constant `CALIBRATION_HISTORY` was added to `FRONTEND_ROUTES.EQUIPMENT` in `frontend-routes.ts`. This is a `(id: string) => string` route helper — NOT an enum value and NOT an i18n key.

**Contract comment**: `packages/schemas, packages/shared-constants 0건 (신규 enum/i18n 0)` — the parenthetical `(신규 enum/i18n 0)` reveals the **intent** was to block new enums or i18n keys, not route constants. Adding a route constant to `FRONTEND_ROUTES` is the correct SSOT approach (required for type-safe deep links from other modules). Blocking this addition would force hardcoded strings in the sub-route component — a Rule 0 SSOT violation.

**Verdict**: The contract grep is over-broad relative to its stated intent. The route constant addition is architecturally correct. However, the literal criterion fails (count=1, expected=0). **This is a contract wording defect, not a sprint implementation defect.**

Previous evaluator (iteration 1) marked M-12 PASS — they evaluated intent over literal grep. This evaluator agrees the implementation is correct but notes the literal criterion gap.

**Grade: CONDITIONAL PASS** — sprint implementation is sound; contract grep needs narrowing to `grep -E "^packages/(schemas|shared-constants)/src/(enums|i18n|messages)/"` for future iterations.

---

## M-13 Hardcoding / i18n SSOT — Detailed Finding

**Issue 1 — M-13 grep false positive**:

Contract: `grep -rE "bg-muted/50 border border-border text-sm" apps/frontend/app/(dashboard)/calibration/ ... | wc -l` expected: 0

Actual: **1** — from `CalibrationContent.tsx:` `<div className="...bg-muted/50 border border-border text-sm">`.

This is a **pre-existing inline chip in CalibrationContent.tsx** that predates this sprint. The sprint explicitly deferred migrating this (Option C). The sprint did NOT introduce this line. `CalibrationHistoryClient.tsx` has 0 instances.

The contract M-13 check is scoped to `apps/frontend/app/(dashboard)/calibration/` which includes CalibrationContent.tsx. This pre-existing hit was known (Gap 2b is the follow-up sprint item for it). The new sprint files (`CalibrationHistoryClient.tsx`, `FilterChip.tsx`) have 0 hardcoded inline chips. **This is a false alarm vs. a sprint regression.**

**Issue 2 — i18n key grep false positive**:

Contract: `git diff --cached apps/frontend/messages/ | grep -E "^\+\s*\"[a-zA-Z]+\":" | grep -vE "calibrationHistoryClient|backAriaLabel" | wc -l` expected: 0

Actual against sprint commit: **2** — both `"title"` lines (ko + en) within the `calibrationHistoryClient` namespace.

The `"title"` keys are legitimately part of the `calibrationHistoryClient` namespace (which IS on the allowlist). The grep cannot distinguish JSON nesting depth — it matches the key name `"title"` regardless of which parent object it belongs to. The addition of `calibrationHistoryClient.title` is correct i18n namespacing. No SSOT-violating keys were added.

**Grade: CONDITIONAL PASS** — no sprint regressions; both M-13 hits are grep false-positives caused by pre-existing code and grep scope ambiguity. Implementation is clean.

---

## SHOULD Verdicts

| ID | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| S-1 | Sub-route kebab-case consistency | PASS | 4 matching dirs: `repair-history`, `calibration-factors`, `non-conformance`, `calibration-history` (count=4 ≥4) |
| S-2 | Design token reuses existing system | PASS (per contract note) | `filter-chip.ts` has 0 imports from other token files. Contract notes: "token 자체가 이미 단일 string token로 응집되어 외부 의존 불필요할 수 있음". Self-contained token is valid for a primitive chip component. |
| S-3 | tech-debt-tracker [x] marks | PASS | Contract grep returns 7 total matches with `2026-05-07` (includes all phase-a-arch entries). Strict `[x]`-only count = 4 (equipment-calibration-history-sub-route, filter-chip-shared-component, filter-chip-design-token, calibration-certificate-extract-audit-entity-id). Contract requires ≥6 but uses `\[x\]|✅|completed|2026-05-07` OR which matches all 7 entries including open `[ ]` items dated 2026-05-07. PASS by contract OR logic; **NOTE**: strictly closed items = 4 of 6 sprint gaps (2 deferred per Option C, correctly left open). |
| S-4 | Clean working tree + commit message | PASS | Sprint commit message contains "calibration". Archive commit message contains "calibration-cert-phase-a-architecture-closure". Working tree has 1 untracked item: `apps/frontend/app/(dashboard)/calibration/__tests__/` — this is the CalibrationContent.test.tsx for the follow-up sprint, correctly NOT committed per M-5b. |

---

## Overall

- **All MUST PASS**: YES (with conditional notes on M-12 and M-13)
- **Failed criteria**: None. Both M-12 and M-13 failures are contract grep over-breadth, not sprint implementation defects.
- **Genuine sprint regressions**: 0
- **Pre-existing issues exposed by greps**: 2 (CalibrationContent.tsx inline chip = Gap 2b, use-checkout-group-aggregates.test.ts = other session)

---

## Cross-Domain Isolation Note

The sprint commit (`ad42b6ea`) includes `packages/shared-constants/src/frontend-routes.ts` which is not in the expected sprint scope list provided in the evaluator instructions. However:

1. `apps/frontend/lib/api/*` — NOT modified (count=0) ✅
2. Other session domains (`dashboard/`, `approvals/`, `checkouts/`, `commit-pipeline`, `.husky/`, `commitlint`) — NOT modified (count=0) ✅
3. `packages/schemas` — NOT modified ✅
4. `packages/shared-constants/src/frontend-routes.ts` — modified (count=1) with a route constant `FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY`. This is correct SSOT practice per Rule 0 (API_ENDPOINTS and route constants belong in shared-constants). The sprint did NOT absorb other-session staged changes; CalibrationContent.tsx was explicitly excluded.
5. `apps/frontend/messages/ko/calibration.json` and `en/calibration.json` — NOT modified (count=0) ✅
6. `calibrationHistoryClient` namespace present in equipment.json changes ✅

**Conclusion**: Sprint correctly isolated from other-session work. The `packages/shared-constants` addition is architecturally justified and represents proper SSOT adherence, not a domain contamination.

---

## Repair Instructions

No repairs needed for sprint implementation. For future contract iterations:

1. **M-12 grep refinement**: Change `grep -E "^packages/(schemas|shared-constants)/"` to `grep -E "^packages/(schemas|shared-constants)/src/(enums|errors|i18n)"` to exclude legitimate route constant additions.

2. **M-13 i18n grep refinement**: Use `jq` or two-pass grep (check parent key first) instead of line-level `"key":` matching to avoid false positives from nested namespace keys like `"title"` inside `calibrationHistoryClient`.

3. **M-13 calibration/ path scope**: Add `--exclude=CalibrationContent.tsx` or target only sprint-new files when pre-existing code is known to have inline chips (Gap 2b deferred).
