---
slug: inspection-form-1step
evaluator: agent
iteration: 1
date: 2026-04-10
verdict: PASS
---

# Evaluation: inspection-form-1step

## Build Verification
| Check | Result | Details |
|-------|--------|---------|
| `tsc --noEmit` | PASS | No type errors |
| `frontend build` | PASS | Build completes successfully |
| `backend test` | PASS | 44 suites, 559 tests passed |

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | `tsc --noEmit` PASS | PASS | Zero errors |
| M2 | Frontend build PASS | PASS | Build output shows all routes rendered |
| M3 | Backend test PASS | PASS | 559/559 tests pass |
| M4 | verify-implementation PASS | PASS | Manual verification performed (see details below) |
| M5 | SSOT compliance | PASS | All enums/types from `@equipment-management/schemas` (`InspectionJudgment`, `InspectionResult`, `INSPECTION_RESULT_SECTION_TYPE_VALUES`, `DEFAULT_SELF_INSPECTION_ITEMS`); constants from `@equipment-management/shared-constants` (`FORM_CATALOG`, `INSPECTION_CHECK_ITEM_PRESETS`). No local redefinitions found. |
| M6 | No `any` types | PASS | grep for `: any` and `as any` returns zero matches across all 7 files |
| M7 | No client-side userId | PASS | grep for `userId` returns zero matches; no user ID sent in request body |

### M4 Detail: verify-implementation sub-checks
- **Hardcoded strings**: No hardcoded API paths; all use `calibrationApi`/`equipmentApi` wrappers. Query keys via `queryKeys.*`. Error codes via `EquipmentErrorCode.*`.
- **CAS patterns**: `InspectionFormDialog` handles 409 conflict via `isConflictError()` + localized error info. `SelfInspectionFormDialog` additionally removes stale query cache on 409.
- **Zod validation**: Section types use `INSPECTION_RESULT_SECTION_TYPE_VALUES` from schemas package. Form validation is handled at submit time with guard clauses.
- **Security**: No userId in client body. API calls go through authenticated API client.
- **i18n**: All user-facing strings use `useTranslations()` with proper namespaces.

## SHOULD Criteria
| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | Design token usage | FAIL | Zero files in `components/inspections/` import from `lib/design-tokens`. 228 other frontend files use design tokens. The inspections components use raw Tailwind classes only. |
| S2 | Empty state with icon/CTA | FAIL | All 3 empty states (`InspectionFormDialog` items, `InlineResultSectionsEditor`, `ResultSectionsPanel`) show only plain text (`text-sm text-muted-foreground`). No icons, no illustrative empty state, no prominent CTA button. Compare with `EquipmentEmptyState` which uses design tokens. |
| S3 | Judgment visual feedback | FAIL | pass/fail/conditional select options are plain text labels with no color coding or badge styling. No visual distinction between pass (green) and fail (red) states in the form or preview. |
| S4 | Spacing rhythm | PARTIAL | Uses consistent `space-y-*` classes but no hierarchical layering (e.g., sections use `space-y-4` and sub-sections `space-y-3`/`space-y-2` which is reasonable). |
| S5 | Accessibility | PARTIAL | `aria-label` present on 6 interactive elements (add/remove item buttons, preset select, rich_table cell type toggles, delete row). Missing: sr-only labels for move up/down buttons in `InlineResultSectionsEditor` and `ResultSectionsPanel`; no `focus-visible` ring customization. |

## Issues Found

### Critical (blocks PASS)
None. All MUST criteria pass.

### Non-Critical (tech debt)

1. **S1 — No design-tokens**: The inspections directory is the only major feature area not using `lib/design-tokens`. This creates visual inconsistency with the rest of the app and makes future theme changes harder.

2. **S2 — Bare empty states**: Empty states across all 3 components lack icons or illustrations. The project has `EquipmentEmptyState` as a reference pattern but inspections components don't follow it.

3. **S3 — No judgment color coding**: Pass/fail/conditional results have no visual differentiation. In a lab inspection context, this is a significant UX gap — users cannot quickly scan for failures.

4. **S5 — Missing sr-only on move buttons**: ChevronUp/ChevronDown buttons in `InlineResultSectionsEditor` (lines 98-117) and `ResultSectionsPanel` (lines 159-176) have no `aria-label` attribute, making them inaccessible to screen readers.

5. **InspectionFormDialog CAS gap**: Unlike `SelfInspectionFormDialog` which calls `removeQueries` on 409 to force refetch, `InspectionFormDialog` only shows a toast on conflict without clearing stale cache. This could leave the UI showing outdated data after a version conflict.

## Verdict

**PASS** — All 7 MUST criteria are satisfied. The build compiles, tests pass, SSOT is respected, no `any` types exist, and no client-side userId is sent. SHOULD criteria failures (design tokens, empty states, judgment feedback, accessibility gaps) represent UX polish debt but do not block the contract.
