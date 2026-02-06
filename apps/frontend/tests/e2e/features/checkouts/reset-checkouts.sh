#!/bin/bash

# Reset test checkouts to 'pending' status for E2E tests
# This script should be run before executing the rejection flow tests

echo "🔄 Resetting test checkouts to pending status..."
echo ""

cd "$(dirname "$0")/../../../.." || exit 1

pnpm --filter backend exec npx ts-node scripts/reset-test-checkouts.ts

echo ""
echo "✅ Checkout reset complete!"
echo "You can now run the rejection flow tests:"
echo "  pnpm --filter frontend exec playwright test tests/e2e/checkouts/group-c/c3-rejection-flow.spec.ts"
