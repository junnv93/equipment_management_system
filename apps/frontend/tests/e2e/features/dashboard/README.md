# Dashboard Tests

## Overview

Tests for the main dashboard page, including statistics, charts, team filtering, tabs, and role-based access.

## Test Files

| File                                 | Description                               |
| ------------------------------------ | ----------------------------------------- |
| `dashboard.spec.ts`                  | Core dashboard rendering and layout       |
| `statistics.spec.ts`                 | Stats cards and numeric displays          |
| `equipment-chart.spec.ts`            | Equipment status distribution chart       |
| `calibration-lists.spec.ts`          | Upcoming/overdue calibration lists        |
| `pending-approvals.spec.ts`          | Pending approval summaries                |
| `recent-activities.spec.ts`          | Recent activity feed                      |
| `quick-actions.spec.ts`              | Quick action buttons                      |
| `tab-navigation.spec.ts`             | Dashboard tab switching                   |
| `team-filtering-basic-flow.spec.ts`  | Basic team filter flow                    |
| `team-filtering-api-chain.spec.ts`   | Team filter API chain validation          |
| `team-filtering-independent.spec.ts` | Independent team filter tests             |
| `team-filtering-persistence.spec.ts` | Team filter state persistence             |
| `realtime-updates.spec.ts`           | Real-time data refresh                    |
| `responsive.spec.ts`                 | Responsive layout (desktop/tablet/mobile) |
| `auth-role-access.spec.ts`           | Role-based dashboard access               |
| `seed-parallel-group-1.spec.ts`      | Parallel seed data setup                  |

## Running

```bash
pnpm --filter frontend exec npx playwright test features/dashboard
```
