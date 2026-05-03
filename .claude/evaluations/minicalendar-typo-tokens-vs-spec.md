# Evaluation: minicalendar-typo-tokens-vs-spec

> **Date**: 2026-05-03
> **Result**: PASS with unrelated type-check blocker noted

## Results

| ID | Result | Evidence |
|----|--------|----------|
| M1 | PASS | `DASHBOARD_CALENDAR_TOKENS.legendText` now uses `text-xs text-muted-foreground`, matching the 12px legend recommendation. |
| M2 | PASS | `dayLabel` and `popupTitle` still use `MICRO_TYPO.badge`, so dense calendar internals keep their existing scale. |
| M3 | PASS | `legendDot` remains `w-2 h-2 rounded-full flex-shrink-0`. |
| M4 | PASS | `MiniCalendar.tsx` legend labels still render through `T.legendText`. |
| S1 | PASS | The token includes a short spec §A.3.1 comment explaining the legend-specific exception. |
| S2 | PASS | The tech-debt tracker item is closed with this contract/eval evidence. |

## Commands

```bash
pnpm --filter frontend exec eslint lib/design-tokens/components/dashboard.ts components/dashboard/MiniCalendar.tsx
# PASS
```

```bash
rg -n "legendText|MICRO_TYPO\.badge|Spec §A\.3\.1" apps/frontend/lib/design-tokens/components/dashboard.ts apps/frontend/components/dashboard/MiniCalendar.tsx
# PASS — legendText is text-xs; MiniCalendar consumes T.legendText; non-legend badge usages remain scoped.
```

```bash
pnpm --filter frontend run type-check
# BLOCKED by unrelated current errors:
# components/inspections/__tests__/InspectionFormDialog.gallery.test.tsx:120 TS2352
# components/inspections/__tests__/InspectionFormDialog.gallery.test.tsx:130 TS2352
```
