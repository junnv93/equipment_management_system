---
slug: inspection-design-improvement
mode: 2
created: 2026-04-10
---

# Contract: inspection-design-improvement

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | tsc --noEmit PASS | `pnpm --filter frontend run tsc --noEmit` |
| M2 | Frontend build PASS | `pnpm --filter frontend run build` |
| M3 | Backend test PASS | `pnpm --filter backend run test` |
| M4 | CAS 409 handler: removeQueries + invalidateQueries + onOpenChange(false) | grep verification |
| M5 | No `any` types | grep `: any\b` |
| M6 | SSOT: design values from design-tokens, no new hardcoded Tailwind colors | grep brand colors in inspection files |
| M7 | No hardcoded spacing — rhythm from inspection tokens | code review |
| M8 | Motion from TRANSITION_PRESETS/ANIMATION_PRESETS only | grep verification |
| M9 | Query keys from queryKeys object (no regression) | code review |
| M10 | Enums from @equipment-management/schemas (no regression) | code review |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | Design review score 60+/100 |
| S2 | All icon-only buttons have aria-label |
| S3 | Empty states have icons + CTA |
| S4 | Judgment pass/fail/conditional color-coded from tokens |
| S5 | 3-level spacing hierarchy (section > group > field) |
| S6 | List items have entrance motion |
| S7 | i18n keys for all new text (no hardcoded Korean) |
| S8 | inspection.ts follows calibration.ts structure pattern |
