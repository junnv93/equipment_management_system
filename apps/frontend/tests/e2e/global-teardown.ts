/**
 * Global teardown - Cleanup database connection pool
 *
 * This runs once after all tests complete to properly close the shared pool.
 * Individual test files should NOT call cleanupPool() in afterAll to avoid
 * race conditions where the pool gets closed while other tests are still running.
 */

import { cleanupPool } from './shared/helpers/db-cleanup';

async function globalTeardown() {
  console.log('🧹 Global teardown: Cleaning up database connection pool...');
  await cleanupPool();
  console.log('✅ Pool cleanup complete');
}

export default globalTeardown;
