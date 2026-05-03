# Contract: simulate-role-audit-log-observability

> **Slug**: `simulate-role-audit-log-observability`
> **Created**: 2026-05-03
> **Mode**: tech-debt closure harness

## Scope

Close the Open tracker item for SYSTEM_ADMIN role simulation observability. When `?simulateRole=` activates UI role simulation, the frontend now emits a low-frequency audit request and the backend records who simulated which role in `audit_logs`.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | Backend exposes an authenticated endpoint for role simulation audit writes. | `AuditController.recordRoleSimulation()` handles `POST /audit-logs/simulate-role`. |
| M2 | Only SYSTEM_ADMIN can record role simulation events. | Controller requires `VIEW_SYSTEM_SETTINGS` and rejects non-`system_admin` roles with `ForbiddenException`. |
| M3 | Audit entry identifies the actor and simulated role. | `AuditService.create()` receives `userId`, `userName`, `userRole`, `entityType: 'user'`, and details including `actualRole`, `simulatedRole`, and `path`. |
| M4 | Frontend emits the audit request when simulation is active. | `useEffectiveRole()` posts to `/api/audit-logs/simulate-role` when `simulating` becomes true. |
| M5 | Frontend avoids repeated audit writes during the same active simulation. | `useEffectiveRole()` keeps an in-hook audit key set and clears it on explicit exit. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Focused tests cover successful SYSTEM_ADMIN recording and non-admin rejection. | `audit.controller.spec.ts`. |
| S2 | Tracker closes the Open item with verification evidence. | `tech-debt-tracker.md` marks `simulate-role-audit-log-observability` `[x]`. |

## Verification Commands

```bash
pnpm --filter backend test -- audit.controller.spec.ts --runInBand
pnpm --filter backend run type-check
pnpm --filter frontend exec eslint hooks/use-effective-role.ts
```
