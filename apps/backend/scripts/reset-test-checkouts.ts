/**
 * Reset test checkouts to 'pending' status for E2E tests
 *
 * Usage:
 *   pnpm --filter backend exec npx ts-node scripts/reset-test-checkouts.ts
 *
 * This script resets the following checkouts to 'pending' status:
 * - CHECKOUT_001_ID (C-14: notification test)
 * - CHECKOUT_002_ID (C-9: calibration rejection)
 * - CHECKOUT_003_ID (C-13: validation test)
 * - CHECKOUT_004_ID (C-10: repair rejection)
 * - CHECKOUT_005_ID (C-9 additional: rental rejection)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { checkouts } from '@equipment-management/db/schema';
import { eq, inArray } from 'drizzle-orm';

const CHECKOUT_001_ID = '10000000-0000-0000-0000-000000000001';
const CHECKOUT_002_ID = '10000000-0000-0000-0000-000000000002';
const CHECKOUT_003_ID = '10000000-0000-0000-0000-000000000003';
const CHECKOUT_004_ID = '10000000-0000-0000-0000-000000000004';
const CHECKOUT_005_ID = '10000000-0000-0000-0000-000000000005';

async function resetCheckouts() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';

  console.log('Connecting to database...');
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient);

  const checkoutIds = [
    CHECKOUT_001_ID,
    CHECKOUT_002_ID,
    CHECKOUT_003_ID,
    CHECKOUT_004_ID,
    CHECKOUT_005_ID,
  ];

  try {
    console.log('Resetting checkouts to pending status...\n');

    // Update checkouts to pending status
    await db
      .update(checkouts)
      .set({
        status: 'pending',
        approvedAt: null,
        approverId: null,
        rejectionReason: null,
        checkoutDate: null,
        actualReturnDate: null,
        returnApprovedAt: null,
        returnerId: null,
        updatedAt: new Date(),
      })
      .where(inArray(checkouts.id, checkoutIds));

    console.log('✓ Updated checkouts to pending status\n');

    // Verify the updates
    const updated = await db
      .select({
        id: checkouts.id,
        status: checkouts.status,
        purpose: checkouts.purpose,
        destination: checkouts.destination,
      })
      .from(checkouts)
      .where(inArray(checkouts.id, checkoutIds));

    console.log('Updated checkouts:');
    updated.forEach(checkout => {
      console.log(`  - ${checkout.id}: ${checkout.status} (${checkout.purpose} → ${checkout.destination})`);
    });

    console.log('\n✅ Checkout reset complete!');
  } catch (error) {
    console.error('❌ Error resetting checkouts:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

resetCheckouts().catch(console.error);
