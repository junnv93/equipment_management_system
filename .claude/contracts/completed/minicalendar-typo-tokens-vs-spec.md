# Contract: minicalendar-typo-tokens-vs-spec

> **Slug**: `minicalendar-typo-tokens-vs-spec`
> **Created**: 2026-05-03
> **Mode**: tech-debt closure harness

## Scope

Close the Open tracker item for the MiniCalendar legend typography mismatch. The spec recommends 12px legend labels, while the current MiniCalendar legend used the global 10px micro badge token.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | MiniCalendar legend text uses a 12px typography token/class. | `DASHBOARD_CALENDAR_TOKENS.legendText` is `text-xs text-muted-foreground`. |
| M2 | Dense MiniCalendar internals that were not part of the legend mismatch remain unchanged. | `dayLabel` and `popupTitle` still use `MICRO_TYPO.badge`. |
| M3 | The 8px legend dot sizing remains unchanged because it already matched the spec. | `DASHBOARD_CALENDAR_TOKENS.legendDot` remains `w-2 h-2 rounded-full flex-shrink-0`. |
| M4 | The MiniCalendar component still consumes the token SSOT instead of inline typography. | `MiniCalendar.tsx` renders all legend labels with `T.legendText`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | The token file documents why legend labels intentionally differ from dense badge scale. | Inline comment references spec §A.3.1. |
| S2 | Tracker closes the Open item with verification evidence. | `tech-debt-tracker.md` marks `minicalendar-typo-tokens-vs-spec` `[x]`. |

## Verification Commands

```bash
pnpm --filter frontend exec eslint lib/design-tokens/components/dashboard.ts components/dashboard/MiniCalendar.tsx
rg -n "legendText|MICRO_TYPO\.badge|Spec §A\.3\.1" apps/frontend/lib/design-tokens/components/dashboard.ts apps/frontend/components/dashboard/MiniCalendar.tsx
pnpm --filter frontend run type-check
```

`type-check` is currently blocked by unrelated `InspectionFormDialog.gallery.test.tsx` fixture cast errors; see evaluation.
