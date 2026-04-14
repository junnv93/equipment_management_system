---
slug: inspection-design-improvement
mode: 2
created: 2026-04-10
status: active
---

# Exec Plan: Inspection Design Improvement

## Phase 1: Foundation — inspection.ts 디자인 토큰 생성
- CREATE `lib/design-tokens/components/inspection.ts`
- UPDATE `lib/design-tokens/index.ts` — re-export

## Phase 2: CAS Bug Fix
- UPDATE `components/inspections/InspectionFormDialog.tsx` — 409 handler parity

## Phase 3: Design Token Integration + UX Improvements (merged)
- UPDATE `components/inspections/InspectionFormDialog.tsx`
- UPDATE `components/inspections/InlineResultSectionsEditor.tsx`
- UPDATE `components/inspections/result-sections/ResultSectionsPanel.tsx`
- UPDATE `components/inspections/result-sections/ResultSectionPreview.tsx`
- UPDATE `components/inspections/result-sections/ResultSectionFormDialog.tsx`
- UPDATE `components/inspections/CheckItemPresetSelect.tsx`

## Phase 4: i18n
- UPDATE `messages/ko/calibration.json`
- UPDATE `messages/en/calibration.json`

## Verification
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
pnpm --filter backend run test
```
