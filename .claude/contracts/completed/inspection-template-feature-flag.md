# Contract: inspection-template-feature-flag

**Mode**: 1 (Lightweight)
**Domain**: frontend inspection template rollout controls
**Date**: 2026-05-03

## Purpose

Close the tech-debt tracker item:

`[2026-05-01 inspection-template] MEDIUM feature-flag-gradual-rollout`

Inspection template workflow must have a fail-safe frontend feature flag so production can disable template prefill, gallery, soft-fork, and version badge behavior without reverting code.

## Files in Scope

| Kind | Path |
|---|---|
| Modify | `apps/frontend/lib/feature-flags.ts` |
| Add | `apps/frontend/lib/__tests__/feature-flags.test.ts` |
| Modify | `apps/frontend/components/inspections/InspectionFormDialog.tsx` |
| Modify | `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` |
| Modify | `.claude/exec-plans/tech-debt-tracker.md` |
| Modify | `.claude/contracts/REGISTRY.md` |

## MUST Criteria

### M1. Feature flag SSOT exists
- `getFeatureFlag('INSPECTION_TEMPLATE')` is supported.
- Environment variable is `NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED`.
- Existing `APPROVAL_UI_R2` semantics are unchanged.

### M2. Default behavior is backward compatible
- Inspection template workflow remains enabled unless `NEXT_PUBLIC_INSPECTION_TEMPLATE_ENABLED === 'false'`.

### M3. Intermediate inspection template paths are gated
- When flag is disabled, `useLatestTemplate` query is disabled.
- Template gallery query is disabled.
- Template prefill returns `null`.
- Submit path bypasses soft-fork diff and directly creates inspection.
- Template version/missing badge, `SoftForkDialog`, and `TemplateGallery` do not render.

### M4. Self inspection template paths are gated
- When flag is disabled, `useLatestTemplate` query is disabled.
- Version badge analytics effect is skipped.
- Template version/missing badge does not render.

### M5. Tests cover flag semantics
- Focused Jest test covers default enabled, explicit false disabled, and existing approval flag behavior.

### M6. Verification passes
- Focused frontend Jest passes for `feature-flags.test.ts`.
- Frontend type-check passes.

## SHOULD Criteria

### S1. Surgical scope
- No verify skill files are modified by this issue. Pre-existing concurrent verify-skill changes in the dirty worktree are out of scope.

### S2. Tracker lifecycle
- The completed tracker item is removed from Open items and recorded in the batch history.
