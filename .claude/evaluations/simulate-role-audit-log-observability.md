# Evaluation: simulate-role-audit-log-observability

> **Date**: 2026-05-03
> **Result**: PASS

## Results

| ID | Result | Evidence |
|----|--------|----------|
| M1 | PASS | `POST /audit-logs/simulate-role` is implemented on `AuditController`. |
| M2 | PASS | Focused test verifies non-`system_admin` requests throw `ForbiddenException`; endpoint also requires `VIEW_SYSTEM_SETTINGS`. |
| M3 | PASS | Focused test verifies `AuditService.create()` payload includes actor, `action: 'read'`, `entityType: 'user'`, `actualRole`, `simulatedRole`, and `path`. |
| M4 | PASS | `useEffectiveRole()` posts to the audit endpoint when `simulating` is true. |
| M5 | PASS | The hook deduplicates audit writes per active actual/simulated role pair and clears the key on explicit exit. |
| S1 | PASS | `audit.controller.spec.ts` passed: 2 tests. |
| S2 | PASS | The tech-debt tracker item is closed with this contract/eval evidence. |

## Commands

```bash
pnpm --filter backend test -- audit.controller.spec.ts --runInBand
# PASS — 1 suite, 2 tests
```

```bash
pnpm --filter backend run type-check
# PASS
```

```bash
pnpm --filter frontend exec eslint hooks/use-effective-role.ts
# PASS
```
