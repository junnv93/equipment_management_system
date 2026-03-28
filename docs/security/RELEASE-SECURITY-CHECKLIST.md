# Release Security Checklist

**Process:** Before each production release, complete this checklist to ensure threat modeling and remediation are performed.

## Pre-Release Threat Review

### 1. Change Scope Assessment

- [ ] List all new modules/features in this release
- [ ] Identify changes to authentication or authorization logic
- [ ] Identify new external integrations or API endpoints
- [ ] Identify changes to data models or sensitive data handling

### 2. STRIDE Threat Assessment

For each significant change, evaluate:

| Threat                     | Question                                                  | Status             |
| -------------------------- | --------------------------------------------------------- | ------------------ |
| **Spoofing**               | Can users impersonate others through this change?         | OK / Action needed |
| **Tampering**              | Can input data be manipulated to bypass validation?       | OK / Action needed |
| **Repudiation**            | Are all state changes audit-logged?                       | OK / Action needed |
| **Information Disclosure** | Does this expose sensitive data in logs/responses/errors? | OK / Action needed |
| **Denial of Service**      | Are queries bounded? Rate limiting applied?               | OK / Action needed |
| **Elevation of Privilege** | Are permissions correctly enforced with server-side auth? | OK / Action needed |

### 3. Automated Security Verification

- [ ] CI pipeline passed (all 5 gates: secret scan, quality, tests, build, audit)
- [ ] CodeQL analysis passed (no new high/critical findings)
- [ ] `pnpm audit --prod --audit-level=high` — 0 critical, 0 unmitigated high
- [ ] Security decorator check passed (`pnpm security:check`)

### 4. OWASP Top 10 Verification

- [ ] A01: No new `@Public()` on mutation endpoints
- [ ] A03: No raw SQL with user input, Zod validation on all new endpoints
- [ ] A05: Helmet CSP / CORS unchanged or reviewed
- [ ] A07: No hardcoded credentials, token lifetimes unchanged
- [ ] A09: All new mutation endpoints have `@AuditLog()`

### 5. Remediation

- [ ] All identified threats have been mitigated or accepted with documented justification
- [ ] Threat model document (`THREAT-MODEL.md`) updated if new threats identified
- [ ] Accepted risks documented with severity and rationale

## Sign-off

| Role                     | Name | Date | Signature |
| ------------------------ | ---- | ---- | --------- |
| Developer                |      |      |           |
| Reviewer (if applicable) |      |      |           |

## Release History

| Version | Date | Reviewer | Threats Found | Remediated |
| ------- | ---- | -------- | ------------- | ---------- |
|         |      |          |               |            |
