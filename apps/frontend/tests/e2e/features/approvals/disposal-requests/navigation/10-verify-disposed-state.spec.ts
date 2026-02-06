import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToDisposed, cleanupPool } from '../helpers/db-cleanup';
import { Pool } from 'pg';

test.afterAll(async () => {
  await cleanupPool();
});

test('verify disposed state in DB', async ({ testOperatorPage }) => {
  const equipmentId = 'dddd0403-0403-4403-8403-000000000403';
  const disposalRequestId = 'dddd1403-0403-4403-8403-000000000403';
  const requesterId = '00000000-0000-0000-0000-000000000002';
  const reviewerId = '00000000-0000-0000-0000-000000000002';
  const approverId = '00000000-0000-0000-0000-000000000003';

  // Reset equipment
  await resetEquipmentToDisposed(
    equipmentId,
    disposalRequestId,
    requesterId,
    reviewerId,
    approverId
  );

  // Verify in DB directly
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/equipment_management',
  });

  const equipResult = await pool.query('SELECT id, name, status FROM equipment WHERE id = $1', [
    equipmentId,
  ]);
  console.log('Equipment in DB:', equipResult.rows[0]);

  const disposalResult = await pool.query(
    'SELECT id, equipment_id, review_status, approved_by, approved_at FROM disposal_requests WHERE id = $1',
    [disposalRequestId]
  );
  console.log('Disposal request in DB:', disposalResult.rows[0]);

  await pool.end();

  // Now check the page
  await testOperatorPage.goto(`/equipment/${equipmentId}?_t=${Date.now()}`);
  await testOperatorPage.waitForLoadState('networkidle');

  // Get page title to confirm it loaded
  const title = await testOperatorPage.title();
  console.log('Page title:', title);

  // Get body text
  const bodyText = await testOperatorPage.locator('body').textContent();
  console.log('Page contains "폐기":', bodyText?.includes('폐기'));
  console.log('Page contains "disposed":', bodyText?.includes('disposed'));
  console.log('Page contains "장비 폐기 완료":', bodyText?.includes('장비 폐기 완료'));
});
