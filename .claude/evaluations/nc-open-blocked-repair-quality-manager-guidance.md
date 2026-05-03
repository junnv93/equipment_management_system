# Evaluation: nc-open-blocked-repair-quality-manager-guidance

## Verdict

PASS — quality manager now receives role-aware blocked-repair guidance instead of the operator guidance.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Reachable quality-manager key | PASS | `NCGuidanceKeyReachable` includes `openBlockedRepair_quality_manager`, and `resolveNCGuidanceKey` returns it for blocked repair with `canCloseNC=false` and `canCreateCalibration=false`. |
| No operator CTA for quality manager | PASS | `NC_WORKFLOW_GUIDANCE_TOKENS.openBlockedRepair_quality_manager.ctaKind` is `none`. |
| ko/en messages exist | PASS | `messages/ko/non-conformances.json` and `messages/en/non-conformances.json` include `detail.guidance.openBlockedRepair_quality_manager`. |
| Regression coverage | PASS | `pnpm --filter frontend test -- nc-guidance.test.ts` passed. |

## Verification

- `pnpm --filter frontend test -- nc-guidance.test.ts`
- `pnpm --filter frontend run type-check`
