---
slug: inspection-form-redesign
created: 2026-04-10
---

# Contract: Inspection Form Redesign

## MUST Criteria (loop-blocking)
- [ ] `pnpm --filter backend run tsc --noEmit` passes with zero errors
- [ ] `pnpm --filter frontend run tsc --noEmit` passes with zero errors
- [ ] `pnpm build` succeeds for both backend and frontend
- [ ] `pnpm --filter backend run test` passes all existing tests
- [ ] 1-step form: single form submission creates inspection record AND result sections in one API call
- [ ] Backend create endpoint accepts optional `resultSections` array and inserts all data in a single database transaction
- [ ] Equipment master data prefills inspection fields (classification, inspectionCycle, calibrationValidityPeriod) — values editable by user
- [ ] Result sections panel renders inline within the inspection creation form
- [ ] Check item presets: user can select from predefined items via Select dropdown, with custom option for manual entry
- [ ] SSOT compliance: presets in `packages/shared-constants/`, enums from `@equipment-management/schemas`, endpoints from `@equipment-management/shared-constants`
- [ ] No `any` types introduced in new or modified code
- [ ] Existing 2-step flow still works: result sections can still be added/edited/deleted individually on existing inspections

## SHOULD Criteria (non-blocking, tech-debt if failed)
- [ ] i18n coverage: all new UI strings in both `ko/calibration.json` and `en/calibration.json`
- [ ] Accessibility: keyboard navigation, appropriate aria-labels
- [ ] Loading/error states: prefill loading skeleton; graceful fallback for missing calibration data
- [ ] Form validation: client-side validation matches backend Zod schema
- [ ] Prefill indicator: visual cue showing which fields were auto-filled
