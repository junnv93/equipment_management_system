## Summary

<!-- Brief description of what this PR does -->

## Changes

-

## Security Checklist

- [ ] No hardcoded credentials or secrets
- [ ] All new endpoints have `@RequirePermissions()` or `@SkipPermissions()` or `@Public()` decorator
- [ ] Server-side user extraction (no userId from client body)
- [ ] Zod validation on all mutation endpoints
- [ ] CAS version field included for state-changing operations (if applicable)

## Threat Assessment (STRIDE)

<!-- For significant changes (new modules, auth changes, external integrations), complete this section. For minor fixes, write "N/A - minor change" -->

- [ ] **Spoofing**: Can this change be exploited to impersonate a user or service?
- [ ] **Tampering**: Can input data be manipulated to cause unintended behavior?
- [ ] **Repudiation**: Are all state-changing actions audit-logged (`@AuditLog`)?
- [ ] **Information Disclosure**: Does this change expose sensitive data in logs, responses, or errors?
- [ ] **Denial of Service**: Is rate limiting applied? Are queries bounded (pagination, timeouts)?
- [ ] **Elevation of Privilege**: Are permissions correctly enforced? Is server-side auth used?

## Testing

- [ ] `pnpm --filter backend run tsc --noEmit` passes
- [ ] Related unit tests pass
- [ ] Manual testing completed (if UI changes)
