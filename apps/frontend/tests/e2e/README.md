# E2E Test Suite

## Directory Structure

```
tests/e2e/
├── shared/                    # Shared utilities
│   ├── fixtures/              # Auth fixtures (role-based page contexts)
│   ├── constants/             # Test IDs, timeouts, URLs (SSOT)
│   └── helpers/               # Navigation, dialog, DB cleanup helpers
│
├── features/                  # Feature-specific tests
│   ├── equipment/             # Equipment CRUD (list, create, detail)
│   ├── checkouts/             # Checkout workflow (groups 1-6)
│   ├── approvals/             # Approval workflows (disposal, calibration plans)
│   ├── non-conformances/      # NC management (incident, repair workflows)
│   ├── calibration/           # Calibration management, filters, registration
│   ├── dashboard/             # Dashboard functionality
│   ├── auth/                  # Authentication and permissions
│   └── teams/                 # Team management and filtering
│
├── integration/               # Cross-domain integration tests
│   ├── auth-token-sync        # NextAuth token synchronization
│   └── history-registration   # Equipment history registration
│
├── common/                    # Cross-cutting concerns
│   ├── status-badge-update/   # Status badge sync across pages
│   ├── navigation/            # Breadcrumb, current state navigation
│   └── accessibility/         # WCAG compliance tests
│
├── global-setup.ts            # Test environment setup
└── global-teardown.ts         # Database pool cleanup
```

## Quick Start

```bash
# Run all tests
pnpm --filter frontend run test:e2e

# Run specific feature tests
pnpm --filter frontend exec npx playwright test features/equipment
pnpm --filter frontend exec npx playwright test features/checkouts

# Run specific test file
pnpm --filter frontend exec npx playwright test features/equipment/list/equipment-list.spec.ts
```

## Auth Fixture Usage

```typescript
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test('test with test operator role', async ({ testOperatorPage }) => {
  await testOperatorPage.goto('/equipment');
  // testOperatorPage is pre-authenticated as test_engineer
});

test('test with tech manager role', async ({ techManagerPage }) => {
  await techManagerPage.goto('/equipment');
  // techManagerPage is pre-authenticated as technical_manager
});
```

Available fixtures: `testOperatorPage`, `techManagerPage`, `qualityManagerPage`, `siteAdminPage`, `systemAdminPage`

## SSOT Rules

1. **Equipment/User/NC IDs**: Import from `shared/constants/shared-test-data.ts`
2. **Checkout IDs**: Import from `shared/constants/test-checkout-ids.ts`
3. **Timeouts**: Use `TEST_TIMEOUTS` from `shared/constants/shared-test-data.ts`
4. **Navigation**: Use helpers from `shared/helpers/navigation.ts`
5. **Dialog interactions**: Use helpers from `shared/helpers/dialog.ts`

## Writing New Tests

1. Place tests in the appropriate `features/` subdirectory
2. Import auth fixture from `shared/fixtures/auth.fixture`
3. Use shared constants instead of hardcoding UUIDs
4. Feature-specific helpers stay in the feature directory
5. Common helpers go in `shared/helpers/`
