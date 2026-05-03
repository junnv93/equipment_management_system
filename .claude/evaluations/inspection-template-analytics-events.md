# Evaluation: inspection-template-analytics-events

## Verdict

PASS — all MUST criteria satisfied.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Register `inspection_template_created` | PASS | `ANALYTICS_EVENTS.INSPECTION_TEMPLATE_CREATED` maps to `inspection_template_created`; unit test asserts exact value. |
| Register `inspection_template_versioned` | PASS | `ANALYTICS_EVENTS.INSPECTION_TEMPLATE_VERSIONED` maps to `inspection_template_versioned`; unit test asserts exact value. |
| Register `soft_fork_decided` | PASS | `ANALYTICS_EVENTS.SOFT_FORK_DECIDED` maps to `soft_fork_decided`; unit test asserts exact value. |
| Register `gallery_used` | PASS | `ANALYTICS_EVENTS.GALLERY_USED` maps to `gallery_used`; unit test asserts exact value. |
| SoftForkDialog active caller updated | PASS | Soft fork submit/cancel paths call `track(ANALYTICS_EVENTS.SOFT_FORK_DECIDED, ...)`. |
| TemplateGallery active caller updated | PASS | Gallery selection calls `track(ANALYTICS_EVENTS.GALLERY_USED, ...)`. |
| Focused frontend tests pass | PASS | `pnpm --filter frontend test -- events.test.ts SoftForkDialog.test.tsx TemplateGallery.test.tsx` -> 3 suites / 10 tests PASS. |
| Frontend type-check passes | PASS | `pnpm --filter frontend run type-check` -> PASS. |

## Notes

Legacy `inspection.soft_fork` and `inspection.gallery.selected` event constants remain registered but marked deprecated for compatibility. No PII-bearing props were added.
