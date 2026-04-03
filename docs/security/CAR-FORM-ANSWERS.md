# CAR Form Answers (255-character limit per field)

> **용도:** 웹 폼 제출용 축약본. 상세 내용은 첨부된 CAR-RESPONSE.pdf 참조.
> 각 답변 뒤의 `[XXX chars]`는 글자수. 255 이하여야 함.

---

## Q1. What is the project/application name?

```
Equipment Management System — Internal lab equipment management app (UL-QP-18) for UL Korea test labs (Suwon, Uiwang, Pyeongtaek). Manages equipment lifecycle, calibration, checkout/return, and approval workflows.
```

[212 chars]

---

## Q2. Is this a third party solution?

```
No. Internally developed by UL Korea lab engineering. Stack: Next.js 16 + NestJS 10 (TypeScript), PostgreSQL 15, Redis, RustFS (S3-compatible), all containerized via Docker Compose. No third-party SaaS used.
```

[208 chars]

---

## Q3. Is any associated technology hosted in a UL Solutions cloud environment?

```
Yes — Azure AD (SSO only). Tenant: UL Solutions (ul.onmicrosoft.com), Entra ID P2. App registration: "Equipment Management System". All other infra is on-premises (Suwon office, LAN only, no internet). See attached PDF.
```

[222 chars]

---

## Q4. Does this project involve a UL Solutions-developed application?

```
Yes. Internally developed by UL Korea lab engineering team. Integrates with UL Solutions Azure AD tenant for SSO authentication. Uses Azure AD group membership for automatic team/site assignment.
```

[194 chars]

---

## Q5. Is the application used in a UL Solutions Lab?

```
Yes. Used in UL Korea test labs: Suwon (FCC EMC/RF, General EMC, SAR, Automotive EMC), Uiwang (General RF), Pyeongtaek (Automotive EMC). Manages lab equipment lifecycle per UL-QP-18 procedure.
```

[192 chars]

---

## Q6. Is the application available to the public?

```
No. Internal intranet only — no internet exposure. Access requires: (1) UL corporate intranet LAN, (2) Azure AD SSO, (3) RBAC with 5 roles / 72 permissions, Default-Deny guard. Server has no Wi-Fi, no internet.
```

[212 chars]

---

## Q7. The in-scope application is entered into the Application Portfolio and ServiceNow CMDB.

```
No — registration pending. Will submit CMDB request: on-premises (Suwon), owner: Myeongjun Kwon, team: UL Korea Lab Engineering, criticality: internal operational tool.
```

[168 chars]

---

## Q8. The in-scope application has the latest supported software?

```
Yes. Node.js 20 LTS, Next.js 16, NestJS 10, React 19, PostgreSQL 15, Redis 7, TypeScript 5.1+. Dependabot weekly scans, pnpm audit in CI (critical gate), 11 pnpm overrides for known vulns. See attached PDF.
```

[208 chars]

---

## Q9. The in-scope application has recurring security testing?

```
Yes. CI/CD: gitleaks (secrets), security:check (auth decorators), pnpm audit (critical), Jest (25 auth tests) on every push/PR. CodeQL SAST (manual dispatch, GHAS pending). Husky pre-commit hooks. See PDF.
```

[206 chars]

---

## Q10. WAF and/or load balancer in front of the application?

```
N/A — not externally facing (intranet only). Nginx reverse proxy provides: rate limiting (100/60/10 req/min), TLS 1.2/1.3 termination, security headers (HSTS, X-Frame-Options, CSP). See attached PDF.
```

[199 chars]

---

## Q11. The in-scope application meets identity and access management requirements.

```
Yes. Azure AD SSO (production only), MFA via Conditional Access, JWT tokens (15min/7day/30day max), idle timeout 30min, token blacklist (Redis), 5 roles/72 perms Default-Deny, brute-force lockout. See PDF.
```

[205 chars]

---

## Q12. Production data is not available in any environment outside of production.

```
Yes. Dev uses seed data (test fixtures), not production data. Test uses separate UUID-based fixtures. DB credentials differ per environment — production rejects default password.
```

[177 chars]

---

## Q13. Developers are trained in secure coding techniques?

```
Other — no formal training completed. OWASP Top 10 mitigations are integrated into the architecture (RBAC, parameterized queries, CSP, audit logging, etc.). Seeking UL internal OWASP training program. See PDF.
```

[210 chars]

---

## Q14. Separation of duties and environments are in place.

```
Yes. 3 environments (dev/test/prod) with separate auth modes. UL-QP-18 duty separation: 5 roles — Test Engineer, Technical Manager, Quality Manager, Lab Manager, System Admin. See attached PDF.
```

[194 chars]

---

## Q15. Access to source code is restricted with least privilege and MFA.

```
Yes. GitHub private repo, access restricted to sole developer (Myeongjun Kwon), MFA enabled, branch protection on main (CI checks required before merge).
```

[154 chars]

---

## Q16. Software is developed based on secure coding guidelines and OWASP Top 10.

```
Yes. ESLint strict (no-explicit-any: error), Zod validation on all endpoints, no-restricted-imports for SSOT, CI security decorator enforcement, path traversal prevention. See Q13 and attached PDF.
```

[197 chars]

---

## Q17. Source code is reviewed by appropriate personnel.

```
Yes. PR-based code review workflow, GitHub branch protection requires review before merge, automated 5-gate CI pipeline must pass before merge.
```

[142 chars]

---

## Q18. Internally developed code is stored in approved repositories with security functionalities.

```
Yes. GitHub with: gitleaks (secret scan), CodeQL SAST (security-extended), pnpm audit + Dependabot (dependency checks), ESLint + security decorator checker, Husky pre-commit hooks, pnpm integrity. See PDF.
```

[206 chars]

---

## Q19. Threat modeling and remediation upon each new release.

```
Yes. STRIDE threat model (36 threats, 35 mitigated, 1 accepted). PR template includes mandatory STRIDE checklist. Release security checklist documented. CodeQL SAST on every push/PR. See attached PDF.
```

[200 chars]

---

## Q20. Externally available APIs require proper authentication and authorization.

```
Yes (APIs are internal-only but fully secured). Global JWT guard, @RequirePermissions on all mutations, X-Internal-Api-Key for service-to-service (timing-safe), tiered rate limiting (100/60/10 req/min).
```

[201 chars]

---

## Q21. API communications are encrypted and only available to trusted, authorized users.

```
Yes. TLS 1.2/1.3 via Nginx (NIST ciphers: AES-256-GCM, CHACHA20-POLY1305), HSTS enforced, OCSP stapling, forward secrecy. JWT Bearer auth (HMAC-SHA256) required. Azure AD SSO + RBAC.
```

[185 chars]

---

## Q22. Does this project involve a UL Solutions-managed server?

```
Yes. Desktop PC in Suwon secured test lab. Windows + BitLocker (AES-256) + WSL2 + Docker Engine. LAN only, no Wi-Fi, no internet. Port assigned by Global Cybersecurity Compliance.
```

[179 chars]

---

## Q23. In-scope servers have the latest supported software?

```
Yes. Node.js 20 Alpine, PostgreSQL 15, Redis 7 Alpine, Nginx Alpine, Loki/Promtail 2.9.4. Dependabot weekly, pnpm audit every CI build, CodeQL SAST, Alpine minimal images. See attached PDF.
```

[190 chars]

---

## Q24. Recurring vulnerability scans and a monthly patching cadence.

```
Yes. Monthly patching: 1st Monday 18:00-20:00 KST. SLAs: Critical 72h, High 2wk, Medium next window. CI: pnpm audit + CodeQL + Dependabot + gitleaks recurring. See PATCHING-SCHEDULE.pdf.
```

[188 chars]

---

## Q25. Approved access control mechanism and least privilege.

```
Yes. Containers run as non-root (USER nestjs/nextjs), Docker resource limits enforced. PostgreSQL/Redis on internal network only (no published ports), password-protected, production rejects defaults.
```

[198 chars]

---

## Q26. Servers are not directly exposed to the Internet.

```
Yes. No internet access (company policy), no Wi-Fi. Docker networks marked internal:true. Only Nginx ports 80/443 exposed to corporate intranet. DB/Redis/RustFS have no published ports.
```

[185 chars]

---

## Q27. Servers are hardened.

```
Yes. Only ports 80/443 exposed. Alpine images (minimal), Nginx server_tokens off, non-root containers. Redis/PostgreSQL password-protected, production rejects defaults. Security headers enforced. See PDF.
```

[204 chars]

---

## Q28. Does this project involve a UL Solutions-managed database?

```
Yes. PostgreSQL 15 running as Docker container on the same on-premises server (Windows + WSL2, BitLocker full-disk encryption).
```

[126 chars]

---

## Q29. Databases are placed behind a firewall?

```
Yes. PostgreSQL on Docker internal network (internal:true), no published ports. Only the NestJS backend container can access it. Server has no internet. Direct external DB access is not allowed.
```

[193 chars]

---

## Q30. All tables containing sensitive data are encrypted.

```
Yes. BitLocker full-disk encryption (AES-256, NIST approved) on Windows host — all Docker volumes encrypted at rest. DB_SSL=true supported. Data: equipment records, calibration, employee names/emails.
```

[199 chars]

---

## Q31. Databases are supported by the vendor, patched and backed up regularly.

```
Yes. PostgreSQL 15 (vendor-supported). Docker image updates during monthly patching window (docker compose pull). Backup via pg_dump (scheduled, Docker named volume postgres_data).
```

[179 chars]

---

## Q32. Privileged access to databases is tightly controlled.

```
Yes. DB password generated with openssl rand (192-bit entropy), env-injected. Production rejects default 'postgres'. Only backend container accesses DB. Admin access by sole developer via server terminal.
```

[203 chars]

---

## Q33. Role/permission assignments follow least privilege.

```
Yes. App-level RBAC: 5 roles, 72 granular permissions, Default-Deny guard. DB-level: single app user (no superuser). Server access: sole developer/admin only.
```

[159 chars]

---

## Q34. Direct database access only uses user-specific accounts.

```
Yes. Dedicated application account (DB_USER env var). No shared DB accounts — each environment uses distinct credentials. postgres superuser for initial setup only; app uses designated user.
```

[189 chars]

---

## Q35. SA accounts are renamed and disabled where possible.

```
Other — PostgreSQL (not SQL Server). The postgres superuser is password-protected (openssl rand, 192-bit), production rejects default password. Used for setup/migrations only; app uses separate account.
```

[201 chars]

---

## Q36. Windows Authentication mode is used on SQL servers where possible.

```
Other — N/A. This project uses PostgreSQL (not SQL Server), running in Docker on WSL2. PostgreSQL uses password auth via env vars and optionally SSL client certificates (DB_SSL=true).
```

[183 chars]

---

## Q37. Vulnerability findings are remediated according to SLAs.

```
Yes. Critical blocked at CI (pnpm audit --audit-level=critical). 11 pnpm.overrides for known vulns. CodeQL SAST (manual dispatch, GHAS pending). Dependabot weekly automated PRs. See attached PDF.
```

[196 chars]

---

## Q38. Changes to databases are audited and logged.

```
Yes. Schema changes tracked via Drizzle ORM migrations in Git. All mutations logged via @AuditLog() decorator (user ID from JWT, action, entity, timestamp). POST/PATCH/DELETE auto-logged by interceptor.
```

[202 chars]

---

## Q39. Non-standard ports are used.

```
Yes. PostgreSQL 5432 and Redis 6379 are default but NOT exposed outside Docker internal network. Only Nginx 80/443 exposed to intranet. Nginx port on corporate network assigned by Global Cybersecurity.
```

[200 chars]

---

## Q40. Sensitive data encrypted in use and at rest using NIST-approved algorithms.

```
Yes. Transit: TLS 1.2/1.3 (AES-256-GCM, CHACHA20-POLY1305), JWT HMAC-SHA256, ECDHE key exchange. Rest: BitLocker AES-256 on all Docker volumes. Secrets: openssl rand (192-384 bit). See attached PDF.
```

[199 chars]

---

## Q41. Sensitive data stored securely with access controls and least privilege.

```
Yes. RBAC (5 roles, 72 perms, Default-Deny), server-side JWT user extraction, @AuditLog on all mutations, CAS optimistic locking, tokens (15min/7day/30day), presigned URLs (1hr expiry). See PDF.
```

[195 chars]

---

## Q42. Certificates are approved by Global Cybersecurity.

```
No — pending. Internal network deployment, will coordinate with Global Cybersecurity for certificate approval. Nginx pre-configured for TLS termination. Remediation: will submit certificate request.
```

[198 chars]

---

## Q43. Wildcard certificates are not used in production.

```
Yes. No wildcard certificates used or planned. Single domain-specific certificate.
```

[82 chars]

---

## Q44. Does this project involve introducing new networking devices?

```
No. Runs on existing desktop PC, existing corporate intranet via LAN cable. No new firewalls, switches, routers, or APs. Server PC has no Wi-Fi module and no internet access.
```

[174 chars]

---

## Q45. Architecture diagram upload.

```
See attached ARCHITECTURE-DIAGRAM.pdf: system overview, network topology, auth flow (Azure AD SSO → NextAuth → NestJS JWT), data flow, RBAC model (5 roles, 72 permissions, Default-Deny guard).
```

[193 chars]
