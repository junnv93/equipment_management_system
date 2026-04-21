---
slug: nc-p4-guidance
created: 2026-04-22
mode: 1
---

# Contract: NC-P4 GuidanceCallout + NCDetailClient 리팩토링

## Scope

- NEW: `apps/frontend/lib/non-conformances/guidance.ts`
- NEW: `apps/frontend/components/non-conformances/GuidanceCallout.tsx`
- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
- MOD: `apps/frontend/tests/e2e/features/non-conformances/comprehensive/s36-nc-edit-repair-modals.spec.ts`
- NEW: `apps/frontend/tests/e2e/features/non-conformances/nc-guidance.spec.ts`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `tsc --noEmit --skipLibCheck` → 0 errors | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/"` |
| M2 | eslint → 0 errors/warnings | `pnpm --filter frontend lint` |
| M3 | `guidance.ts` exports `deriveGuidance` pure function | `grep "export function deriveGuidance" apps/frontend/lib/non-conformances/guidance.ts` |
| M4 | GuidanceCallout has `role="status" aria-live="polite"` | `grep -n 'aria-live="polite"' apps/frontend/components/non-conformances/GuidanceCallout.tsx` |
| M5 | GuidanceCallout has `data-testid="nc-guidance-callout" data-guidance-key` | `grep -n 'data-testid="nc-guidance-callout"' apps/frontend/components/non-conformances/GuidanceCallout.tsx` |
| M6 | GuidanceCallout `h2` has `tabIndex={-1}` for focus restoration | `grep -n 'tabIndex={-1}' apps/frontend/components/non-conformances/GuidanceCallout.tsx` |
| M7 | NCDetailClient raw `space-y-5` wrapper removed | `grep -c '"space-y-5"' apps/frontend/components/non-conformances/NCDetailClient.tsx` → 0 |
| M8 | NC_INFO_NOTICE_TOKENS prerequisite block removed | `grep -c 'NC_INFO_NOTICE_TOKENS' apps/frontend/components/non-conformances/NCDetailClient.tsx` → 0 |
| M9 | NC_URGENT_BADGE_TOKENS.badge replaced with URGENT_BADGE_TOKENS.solid | `grep -c 'NC_URGENT_BADGE_TOKENS' apps/frontend/components/non-conformances/NCDetailClient.tsx` → 0 |
| M10 | ActionBar roleHint/waitingGuidance removed | `grep -c 'waitingGuidance\|roleHint' apps/frontend/components/non-conformances/NCDetailClient.tsx` → 0 |
| M11 | markCorrected button disables when correctionContent empty | grep '!nc.correctionContent?.trim()' NCDetailClient.tsx → hit |
| M12 | EmptyState used for correction empty state | `grep -c 'EmptyState' apps/frontend/components/non-conformances/NCDetailClient.tsx` ≥ 1 |
| M13 | GuidanceCallout inserted in JSX (GuidanceCallout tag present) | `grep -c 'GuidanceCallout' apps/frontend/components/non-conformances/NCDetailClient.tsx` ≥ 1 |
| M14 | `deriveGuidance` used with useMemo in NCDetailClient | `grep -c 'deriveGuidance' apps/frontend/components/non-conformances/NCDetailClient.tsx` ≥ 1 |
| M15 | No hardcoded Korean text in NCDetailClient (excluding comments) | `grep -nE "[가-힣]" apps/frontend/components/non-conformances/NCDetailClient.tsx` → comment lines only |
| M16 | No `any` type in new/modified files | `grep -n ": any\b" apps/frontend/components/non-conformances/NCDetailClient.tsx apps/frontend/components/non-conformances/GuidanceCallout.tsx apps/frontend/lib/non-conformances/guidance.ts` → 0 |
| M17 | No `dark:` prefix in NC components | `grep -rn "dark:" apps/frontend/components/non-conformances/GuidanceCallout.tsx` → 0 |
| M18 | s36 test updated (no longer uses removed prerequisite text) | grep confirms s36 test doesn't use 'NC_INFO_NOTICE\|prerequisite.*→' |
| M19 | NC_SPACING_TOKENS.detail used in NCDetailClient | `grep -c 'NC_SPACING_TOKENS.detail' apps/frontend/components/non-conformances/NCDetailClient.tsx` ≥ 3 |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | E2E test file created with 5 scenarios |
| S2 | staggerFadeInItem applied to context group elements |
| S3 | scrollToActionBar smooth scroll + focus implemented |
| S4 | Focus restoration useEffect for nc.status changes |

## Domain Rules

- SSOT: `deriveGuidance` delegates to `resolveNCGuidanceKey` from design-tokens — no local re-implementation
- `NonConformanceStatusValues` from `@equipment-management/schemas` (no string literals)
- GuidanceCallout is `React.memo` — prevents re-render on parent state changes
- ActionBar: roleHint/waitingGuidance text removed; buttons + title tooltips retained
- EmptyState: correction uses `canAct={canEditNC}`, closure uses `canAct={false}`
- NCRepairDialog still conditionally rendered based on `needsRepair` from deriveGuidance
