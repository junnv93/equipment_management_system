# Auth Tests

## Overview

Tests for authentication flows, role-based permissions, and team-based access constraints.

## Test Files

| File                          | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `auth.spec.ts`                | Core authentication flows (login, session, redirect) |
| `f1-team-constraints.spec.ts` | Team-based access constraints                        |
| `f2-role-permissions.spec.ts` | Role-based permission checks                         |

## Roles Tested

| Role                | Korean     | Key Permissions                      |
| ------------------- | ---------- | ------------------------------------ |
| `test_engineer`     | 시험실무자 | Basic ops, request approvals         |
| `technical_manager` | 기술책임자 | Approve requests, manage calibration |
| `lab_manager`       | 시험소장   | Full access, self-approval           |

## Running

```bash
pnpm --filter frontend exec npx playwright test features/auth
```
