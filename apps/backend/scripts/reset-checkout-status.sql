-- Reset specific checkouts to 'pending' status for E2E tests
-- Run this with: psql -U postgres -d postgres_equipment -f reset-checkout-status.sql

UPDATE checkouts
SET status = 'pending',
    "approvedAt" = NULL,
    "approvedBy" = NULL,
    "rejectedAt" = NULL,
    "rejectionReason" = NULL,
    "checkedOutAt" = NULL,
    "returnedAt" = NULL,
    "returnApprovedAt" = NULL,
    "returnApprovedBy" = NULL,
    "updatedAt" = NOW()
WHERE id IN (
    '10000000-0000-0000-0000-000000000001',  -- CHECKOUT_001_ID
    '10000000-0000-0000-0000-000000000002',  -- CHECKOUT_002_ID
    '10000000-0000-0000-0000-000000000003',  -- CHECKOUT_003_ID
    '10000000-0000-0000-0000-000000000004'   -- CHECKOUT_004_ID
);

SELECT id, status, purpose, destination
FROM checkouts
WHERE id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004'
);
