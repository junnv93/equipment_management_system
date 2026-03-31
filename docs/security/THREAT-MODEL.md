# Equipment Management System — Threat Model (STRIDE)

**For:** Cyber Architecture Review (CAR)
**Date:** 2026-03-28
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## System Context

- **Deployment:** On-premises desktop PC, UL Solutions Suwon office internal network
- **Users:** ~20-50 laboratory staff across 3 sites (Suwon, Uiwang, Pyeongtaek)
- **Data sensitivity:** Laboratory equipment records, calibration certificates, operational procedures (internal use only, no PII beyond employee names/emails)
- **External dependencies:** Azure AD (authentication only)

---

## Trust Boundaries

```
┌─ Trust Boundary 1: Office Network ──────────────────────────┐
│                                                              │
│  ┌─ Trust Boundary 2: Docker Host ────────────────────────┐ │
│  │                                                        │ │
│  │  ┌─ Trust Boundary 3: app-network (internal) ───────┐ │ │
│  │  │                                                   │ │ │
│  │  │  Frontend ◄──► Backend ◄──► PostgreSQL            │ │ │
│  │  │                   ▲         Redis                  │ │ │
│  │  │                   │         RustFS                 │ │ │
│  │  └───────────────────┼───────────────────────────────┘ │ │
│  │                      │                                  │ │
│  │  Nginx (TLS) ────────┘                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Browser (Employee) ─────► Nginx (:443)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Azure AD (Cloud)   │  ◄─ Trust Boundary 4
                    └────────────────────┘
```

---

## STRIDE Analysis

### S — Spoofing (Identity)

| Threat                           | Risk   | Mitigation                                                                 | Status    |
| -------------------------------- | ------ | -------------------------------------------------------------------------- | --------- |
| Attacker impersonates a user     | Medium | Azure AD SSO with MFA                                                      | Mitigated |
| Stolen JWT token reuse           | Medium | 15-min token expiry, blacklist on logout, absolute session max 30 days     | Mitigated |
| Forged JWT token                 | Low    | HMAC-SHA256 signing with 384-bit secret                                    | Mitigated |
| Service-to-service impersonation | Low    | X-Internal-Api-Key with timing-safe comparison, dual key rotation          | Mitigated |
| Local login in production        | Low    | `AUTH_PRODUCTION_AZURE_ONLY` blocks local auth in production               | Mitigated |
| Credential stuffing              | Low    | 5-attempt lockout, 10 req/min rate limit on auth endpoints                 | Mitigated |
| Session fixation                 | Low    | JWT-based sessions (no server-side session IDs), token rotation on refresh | Mitigated |

**Residual risk:** If Azure AD account is compromised (beyond our control), attacker gains access until session expires or admin deactivates the user.

### T — Tampering (Data Integrity)

| Threat                             | Risk   | Mitigation                                                                     | Status    |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------ | --------- |
| Data modification via API          | Medium | JWT auth + RBAC permission guard on all endpoints                              | Mitigated |
| Concurrent modification conflict   | Medium | CAS (optimistic locking) with version field on all state-changing entities     | Mitigated |
| SQL injection                      | Low    | Drizzle ORM (parameterized queries), Zod input validation                      | Mitigated |
| File upload with malicious content | Medium | Magic byte validation, allowed file types whitelist, path traversal prevention | Mitigated |
| Request body tampering (userId)    | Medium | Server-side user extraction from JWT, never from client body                   | Mitigated |
| Package supply chain attack        | Low    | pnpm verify-store-integrity, Dependabot, npm audit in CI                       | Mitigated |
| Source code tampering              | Low    | GitHub branch protection, PR review, MFA                                       | Mitigated |

**Residual risk:** Docker host OS-level tampering if attacker gains physical access to the desktop PC.

### R — Repudiation (Non-repudiation)

| Threat                           | Risk   | Mitigation                                                                         | Status    |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------- | --------- |
| User denies performing an action | Medium | @AuditLog decorator on all state-changing endpoints, event-based audit trail       | Mitigated |
| Auth event denial                | Low    | audit.auth.success / audit.auth.failed events logged with email, method, timestamp | Mitigated |
| Approval action denial           | Low    | Approval records include approver ID (server-extracted), timestamp, version        | Mitigated |

**Residual risk:** Audit logs stored in application database on the same host — no off-host log forwarding (Loki stores within Docker volumes).

### I — Information Disclosure

| Threat                              | Risk   | Mitigation                                                                                                                                                  | Status    |
| ----------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Data in transit interception        | Low    | TLS 1.2/1.3 with NIST-approved ciphers, HSTS preload                                                                                                        | Mitigated |
| Error message information leak      | Low    | GlobalExceptionFilter sanitizes error responses, no stack traces in production                                                                              | Mitigated |
| API response over-exposure          | Low    | ResponseTransformInterceptor wraps all responses in standard format                                                                                         | Mitigated |
| Secrets in source code              | Low    | gitleaks CI scanning, .gitignore for .env files                                                                                                             | Mitigated |
| Azure AD PII in logs                | Low    | `loggingNoPII: true` in Azure AD strategy                                                                                                                   | Mitigated |
| Database data at rest               | Medium | **BitLocker full-disk encryption (AES-256)** on Windows host — all Docker volumes encrypted at rest                                                         | Mitigated |
| Redis blacklist fail-open on outage | Low    | Intentional availability-over-security tradeoff. Access token TTL is 15 minutes (maximum exposure). Redis failure logged. See `redis-blacklist.provider.ts` | Accepted  |

**Database at rest mitigation:** All data containers (PostgreSQL, Redis, RustFS) run on Docker's internal network (`internal: true`) with no published ports. Only Nginx is accessible from the office network. The Docker host uses **Windows BitLocker full-disk encryption (AES-256, NIST approved)**, ensuring all Docker volumes (WSL2 VHD) are encrypted at rest.

**Redis blacklist fail-open rationale:** When Redis is unreachable, `isBlacklisted()` returns `false` (token treated as valid). This is an intentional tradeoff: for an internal lab equipment management system, service availability outweighs the limited security risk. The maximum exposure window is 15 minutes (access token TTL). All other authentication and authorization checks (JWT signature, permissions guard, session expiry) remain enforced regardless of Redis status.

**Residual risk:** Physical access to the Docker host — mitigated by BitLocker full-disk encryption (requires authentication on boot). Server located in secured test lab with restricted physical access.

### D — Denial of Service

| Threat                        | Risk   | Mitigation                                                                  | Status    |
| ----------------------------- | ------ | --------------------------------------------------------------------------- | --------- |
| HTTP flood                    | Medium | Nginx rate limiting (100 req/min global, 10 req/min auth), NestJS throttler | Mitigated |
| Large request body            | Low    | Nginx: 100MB max body, NestJS: 10MB JSON parser limit                       | Mitigated |
| Connection pool exhaustion    | Low    | PostgreSQL max 50 connections, idle timeout 60s, connection timeout 5s      | Mitigated |
| Redis memory exhaustion       | Low    | Redis maxmemory 256MB with allkeys-lru eviction                             | Mitigated |
| Slow query attack             | Low    | Statement timeout 30s, query timeout 30s                                    | Mitigated |
| Container resource exhaustion | Low    | Docker deploy resource limits (CPU + memory caps per container)             | Mitigated |

**Residual risk:** Single-host deployment — hardware failure takes down the entire system. Acceptable for internal laboratory tool with ~20-50 users.

### E — Elevation of Privilege

| Threat                             | Risk   | Mitigation                                                                       | Status    |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------- | --------- |
| Horizontal privilege escalation    | Medium | Server-side user ID extraction, no client-supplied userId in requests            | Mitigated |
| Vertical privilege escalation      | Medium | Default-Deny PermissionsGuard, CI security decorator validation                  | Mitigated |
| Missing auth on new endpoints      | Medium | `check-security-decorators.ts` CI script fails if endpoints lack auth decorators | Mitigated |
| JWT claim manipulation             | Low    | HS256 signature verification, token type claim prevents confusion attacks        | Mitigated |
| Azure AD role escalation           | Low    | Roles managed in Azure AD by IT admins, app-side role mapping is read-only       | Mitigated |
| Debug/test endpoints in production | Low    | TestAuthController excluded from production builds (`NODE_ENV !== 'production'`) | Mitigated |

**Residual risk:** If Azure AD group assignments are misconfigured, users may receive incorrect roles. Recommendation: Regular Azure AD group membership audits.

---

## Risk Summary

| Category               | Total Threats | Mitigated | Partially | Accepted | Open  |
| ---------------------- | ------------- | --------- | --------- | -------- | ----- |
| Spoofing               | 7             | 7         | 0         | 0        | 0     |
| Tampering              | 7             | 7         | 0         | 0        | 0     |
| Repudiation            | 3             | 3         | 0         | 0        | 0     |
| Information Disclosure | 7             | 6         | 0         | 1        | 0     |
| Denial of Service      | 6             | 6         | 0         | 0        | 0     |
| Elevation of Privilege | 6             | 6         | 0         | 0        | 0     |
| **Total**              | **36**        | **35**    | **0**     | **1**    | **0** |

---

## Recommendations (Priority Order)

1. **Enable full-disk encryption** on Docker host (BitLocker or LUKS) — addresses the one partially mitigated threat
2. **Configure off-host log forwarding** — send audit logs to a separate system for tamper-resistance
3. **Establish regular Azure AD group audit** — verify role assignments quarterly
4. **Schedule formal penetration testing** — coordinate with Global Cybersecurity team
5. **Register application in ServiceNow CMDB** — required per Q7
6. **Obtain approved TLS certificate** — coordinate with Global Cybersecurity per Q26
