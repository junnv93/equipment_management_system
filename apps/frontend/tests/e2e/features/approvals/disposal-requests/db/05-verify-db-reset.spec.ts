/**
 * Verify database reset is working
 */

import { test } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_WORKFLOW } from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToAvailable } from '../helpers/db-cleanup';
import { Pool } from 'pg';

test.describe('Verify DB Reset', () => {
  const equipmentId = EQUIP_DISPOSAL_WORKFLOW;

  test('Check database state after reset', async () => {
    // Reset equipment
    await resetEquipmentToAvailable(equipmentId);

    // Query database directly
    const pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/equipment_management',
    });

    const result = await pool.query('SELECT id, status, is_shared FROM equipment WHERE id = $1', [
      equipmentId,
    ]);

    console.log('Equipment from DB:', result.rows[0]);

    const disposalResult = await pool.query(
      'SELECT id FROM disposal_requests WHERE equipment_id = $1',
      [equipmentId]
    );

    console.log('Disposal requests:', disposalResult.rows);

    await pool.end();
  });
});
