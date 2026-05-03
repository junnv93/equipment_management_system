# Contract: inspection-template-analytics-events

## Scope

Close tech-debt item `analytics-ssot-events`.

## MUST

- Register `inspection_template_created` in the analytics event SSOT.
- Register `inspection_template_versioned` in the analytics event SSOT.
- Register `soft_fork_decided` in the analytics event SSOT.
- Register `gallery_used` in the analytics event SSOT.
- SoftForkDialog must use the new `soft_fork_decided` event for active decisions.
- TemplateGallery must use the new `gallery_used` event for active selections.
- Focused frontend tests pass.
- Frontend type-check passes.

## SHOULD

- Preserve existing legacy event names for compatibility.
- Keep analytics props PII-free.
