# Equipment Management System — Architecture Diagrams

**For:** Cyber Architecture Review (CAR)
**Date:** 2026-04-02

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│               UL Solutions Corporate Intranet (No Internet)         │
│                                                                     │
│  ┌────────────┐         ┌──────────────────────────────────────┐   │
│  │  Browser   │  HTTPS  │  Desktop PC (Docker Host)             │   │
│  │ (Suwon/    │◄───────►│  Windows + BitLocker + WSL2 Ubuntu   │   │
│  │  Uiwang/   │  :443   │  LAN only, No Wi-Fi, No Internet     │   │
│  │  Pyeongtaek│         │                                      │   │
│  │  Employee) │         │  ┌────────────────────────────────┐  │   │
│  │            │         │  │         Nginx (Reverse Proxy)   │  │   │
│  └────────────┘         │  │  TLS 1.2/1.3 Termination       │  │   │
│                         │  │  Rate Limiting / Security Hdrs  │  │   │
│                         │  └──────┬──────────────┬───────────┘  │   │
│                         │         │              │              │   │
│                         │    ┌────▼────┐    ┌────▼────┐        │   │
│                         │    │Frontend │    │Backend  │        │   │
│                         │    │Next.js  │    │NestJS   │        │   │
│                         │    │  :3000  │    │  :3001  │        │   │
│                         │    └────┬────┘    └────┬────┘        │   │
│                         │         │              │              │   │
│                         │         │    ┌─────────┼──────┐      │   │
│                         │         │    │         │      │      │   │
│                         │    ┌────▼────▼┐  ┌────▼──┐ ┌─▼────┐ │   │
│                         │    │PostgreSQL│  │ Redis │ │RustFS│ │   │
│                         │    │   :5432  │  │ :6379 │ │:9000 │ │   │
│                         │    └──────────┘  └───────┘ └──────┘ │   │
│                         │                                      │   │
│                         │  ┌────────────────────────────────┐  │   │
│                         │  │      Monitoring Stack          │  │   │
│                         │  │  Prometheus │ Grafana │ Loki   │  │   │
│                         │  │  AlertMgr  │ Promtail│ cAdvis │  │   │
│                         │  └────────────────────────────────┘  │   │
│                         └──────────────────────────────────────┘   │
│                                          │                         │
└──────────────────────────────────────────┼─────────────────────────┘
                                           │
                              ┌────────────▼─────────────┐
                              │    Azure AD (Entra ID)    │
                              │  UL Solutions Tenant      │
                              │  SSO Authentication       │
                              │  Group → Team Mapping     │
                              │  Role → Permission Map    │
                              └──────────────────────────┘
```

---

## 2. Network Topology

```
┌─────────────────────────────────────────────────┐
│              Docker Host (Desktop PC)            │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │           web-public network              │   │
│  │  ┌─────────────────────────────────┐      │   │
│  │  │           Nginx                 │      │   │
│  │  │  Port 80 (→301 to 443)         │      │   │
│  │  │  Port 443 (HTTPS)              │      │   │
│  │  └─────────┬───────────────────────┘      │   │
│  └────────────┼──────────────────────────────┘   │
│               │                                  │
│  ┌────────────┼──────────────────────────────┐   │
│  │    app-network (internal: true)           │   │
│  │            │                              │   │
│  │  ┌────────▼────────┐  ┌───────────────┐  │   │
│  │  │    Frontend     │  │    Backend    │  │   │
│  │  │    :3000        │  │    :3001      │  │   │
│  │  └─────────────────┘  └───┬───┬───┬───┘  │   │
│  │                           │   │   │      │   │
│  │  ┌────────────────────────▼┐ ┌▼┐ ┌▼────┐ │   │
│  │  │   PostgreSQL :5432     │ │R│ │Rust │ │   │
│  │  │   (No external port)   │ │e│ │FS   │ │   │
│  │  └────────────────────────┘ │d│ │:9000│ │   │
│  │                             │i│ └─────┘ │   │
│  │                             │s│         │   │
│  │                             │ │         │   │
│  │                             └─┘         │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │        monitoring-network                 │   │
│  │  Prometheus │ Grafana │ Loki │ AlertMgr   │   │
│  │  NodeExporter │ cAdvisor │ Promtail       │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘

Key:
  ■ web-public   — Only Nginx exposed to office network
  ■ app-network  — Internal only, no external access
  ■ monitoring   — Internal only, accessed via Nginx proxy
```

**Security notes:**

- `app-network` is marked `internal: true` — no direct external access
- PostgreSQL, Redis, RustFS have **no published ports** — accessible only within Docker network
- Only Nginx ports (80, 443) are exposed to the office network
- Monitoring dashboards accessible via Nginx reverse proxy with authentication

---

## 3. Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Browser  │    │  Nginx   │    │ Next.js  │    │ NestJS   │    │ Azure AD │
│          │    │ (TLS)    │    │ Frontend │    │ Backend  │    │ (Entra)  │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │              │              │              │
     │  1. GET /login│              │              │              │
     ├──────────────►├─────────────►│              │              │
     │               │              │              │              │
     │  2. Redirect to Azure AD     │              │              │
     │◄─────────────────────────────┤              │              │
     │                              │              │              │
     │  3. Azure AD Login (MFA)     │              │              │
     ├─────────────────────────────────────────────────────────►│
     │                              │              │              │
     │  4. OAuth callback + tokens  │              │              │
     │◄─────────────────────────────────────────────────────────┤
     │                              │              │              │
     │  5. POST /api/auth/callback/azure-ad        │              │
     ├──────────────►├─────────────►│              │              │
     │               │              │              │              │
     │               │  6. POST /api/users/sync    │              │
     │               │              ├─────────────►│              │
     │               │              │  (X-Internal-Api-Key)       │
     │               │              │              │              │
     │               │              │  7. Upsert user, map roles  │
     │               │              │◄─────────────┤              │
     │               │              │              │              │
     │               │  8. Generate JWT (access + refresh)        │
     │               │              ├─────────────►│              │
     │               │              │◄─────────────┤              │
     │               │              │              │              │
     │  9. Set session cookie       │              │              │
     │◄─────────────────────────────┤              │              │
     │                              │              │              │
     │  10. API requests with Bearer token         │              │
     ├──────────────►├─────────────────────────────►              │
     │               │              │  JWT validation             │
     │               │              │  + Blacklist check          │
     │               │              │  + Permission guard         │
     │  11. Response │              │              │              │
     │◄──────────────┤◄─────────────────────────────              │
     │               │              │              │              │

Token Lifecycle:
  Access Token:  15 minutes (auto-refresh 60s before expiry)
  Refresh Token: 7 days (rotation on each refresh)
  Session Max:   30 days (absolute — forces re-login)
  Idle Timeout:  30 minutes (client-side)
```

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                                                             │
│  ┌───────────┐    ┌───────────────────┐    ┌────────────┐  │
│  │  Browser   │    │   Next.js (SSR)   │    │  NestJS    │  │
│  │           │    │                   │    │  API       │  │
│  │ React 19  │◄──►│ Server Components │◄──►│            │  │
│  │ TanStack  │    │ NextAuth Session  │    │ 18 Modules │  │
│  │ Query     │    │ API Routes        │    │            │  │
│  └───────────┘    └───────────────────┘    └─────┬──────┘  │
│                                                  │         │
│  Security Layers:                                │         │
│  ├─ JwtAuthGuard (global)                        │         │
│  ├─ PermissionsGuard (default-deny)              │         │
│  ├─ ZodValidationPipe (input validation)         │         │
│  ├─ AuditLog interceptor                         │         │
│  ├─ ResponseTransform interceptor                │         │
│  └─ GlobalExceptionFilter                        │         │
│                                                  │         │
└──────────────────────────────────────────────────┼─────────┘
                                                   │
┌──────────────────────────────────────────────────┼─────────┐
│                    Data Layer                     │         │
│                                                  │         │
│  ┌──────────────────┐  ┌────────┐  ┌──────────┐ │         │
│  │   PostgreSQL 15   │  │ Redis  │  │  RustFS  │ │         │
│  │                  │  │        │  │ (S3)     │ │         │
│  │ Users            │  │ Cache  │  │          │ │         │
│  │ Equipment        │  │ Token  │  │ Docs     │ │         │
│  │ Calibrations     │  │ Black- │  │ Certs    │ │         │
│  │ Checkouts        │  │ list   │  │ Photos   │ │         │
│  │ Approvals        │  │        │  │          │ │         │
│  │ Audit Logs       │  │        │  │          │ │         │
│  │ Non-conformances │  │        │  │          │ │         │
│  └──────────────────┘  └────────┘  └──────────┘ │         │
│                                                  │         │
│  Data Protection:                                │         │
│  ├─ CAS (optimistic locking) on all mutations    │         │
│  ├─ Drizzle ORM (parameterized queries)          │         │
│  ├─ Transaction isolation for multi-table ops    │         │
│  ├─ File magic byte validation on upload         │         │
│  ├─ Presigned URLs for secure file access (1hr)  │         │
│  └─ Path traversal prevention in storage layer   │         │
│                                                  │         │
└──────────────────────────────────────────────────┘         │
                                                              │
                    ┌─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                 Monitoring & Observability                    │
│                                                             │
│  Prometheus ──► Grafana (Dashboards)                        │
│  Loki ────────► Grafana (Log Explorer)                      │
│  AlertManager ► Slack (Critical/Warning channels)           │
│  Node Exporter  (Host CPU/Memory/Disk)                      │
│  cAdvisor       (Container resource usage)                  │
│  Promtail       (Docker log aggregation)                    │
│  Winston        (Application structured logging)            │
│                                                             │
│  Retention: Metrics 15 days, Logs 14 days                   │
│  Scrape interval: 15 seconds                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. RBAC Permission Model

```
                    ┌──────────────────┐
                    │   Azure AD SSO   │
                    │   (Entra ID)     │
                    └────────┬─────────┘
                             │
                    Azure AD Roles → App Roles Mapping
                             │
                ┌────────────▼────────────┐
                │    Role Assignment      │
                │                         │
                │   mapAzureGroupsToTeamAndLocation)
                │  Azure AD group membership →
                │   team/site auto-assignment
                │  Azure AD roles → app roles
                └────────────┬────────────┘
                             │
    ┌────────────────────────▼────────────────────────┐
    │              Permission Guard                    │
    │          (Default-Deny Mode)                     │
    │                                                  │
    │  @Public()           → Skip all guards           │
    │  @SkipPermissions()  → Auth required, no RBAC    │
    │  @RequirePermissions → Auth + specific perms     │
    │  @InternalServiceOnly → API key only             │
    └──────────────────────────────────────────────────┘

Role → Permission Matrix (simplified):

                        test_    technical_ quality_ lab_
Permission              engineer manager    manager  manager
─────────────────────── ──────── ────────── ──────── ───────
VIEW_EQUIPMENT            ✓         ✓          ✓       ✓
CREATE_EQUIPMENT          ✓         ✓          ✗       ✓
APPROVE_CHECKOUT          ✗         ✓          ✗       ✓
CREATE_CALIBRATION        ✓         ✗          ✗       ✗ *
APPROVE_CALIBRATION       ✗         ✓          ✗       ✓
APPROVE_DISPOSAL_STEP1    ✗         ✓          ✗       ✓
APPROVE_DISPOSAL_STEP2    ✗         ✗          ✗       ✓
SUBMIT_CALIBRATION_PLAN   ✗         ✓          ✗       ✗
REVIEW_CALIBRATION_PLAN   ✗         ✗          ✓       ✗
APPROVE_CALIBRATION_PLAN  ✗         ✗          ✗       ✓
MANAGE_USERS              ✗         ✗          ✗       ✓

* Lab Manager cannot create calibrations — UL-QP-18 duty separation
```
