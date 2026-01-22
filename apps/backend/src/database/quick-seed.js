/**
 * 빠른 시드 스크립트 (JavaScript)
 * 사용법: DATABASE_URL="..." node src/database/quick-seed.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/equipment_management';

console.log('🌱 테스트 데이터 시드 시작...');
console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // 1. 기존 데이터 삭제
    console.log('🗑️  기존 데이터 삭제 중...');
    await pool.query('DELETE FROM equipment');
    await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
    await pool.query('DELETE FROM teams WHERE name IN (\'RF팀\', \'EMC팀\', \'SAR팀\')');

    // 2. 팀 생성
    console.log('👥 팀 생성 중...');
    const teamResult = await pool.query(`
      INSERT INTO teams (id, name, type, description, site, created_at, updated_at)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'RF팀', 'RF', 'RF 시험 팀', 'suwon', NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'EMC팀', 'EMC', 'EMC 시험 팀', 'suwon', NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'SAR팀', 'SAR', 'SAR 시험 팀', 'uiwang', NOW(), NOW())
      RETURNING id
    `);
    console.log(`  ✅ ${teamResult.rowCount}개 팀 생성됨`);

    // 3. 사용자 생성
    console.log('👤 사용자 생성 중...');
    const userResult = await pool.query(`
      INSERT INTO users (id, email, name, role, team_id, site, location, position, created_at, updated_at)
      VALUES
        ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin@example.com', '관리자', 'lab_manager', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩', '시험소장', NOW(), NOW()),
        ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'manager@example.com', '기술책임자', 'technical_manager', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩', '기술책임자', NOW(), NOW()),
        ('12345678-1234-4567-8901-234567890abc', 'user@example.com', '시험실무자', 'test_engineer', '22222222-2222-2222-2222-222222222222', 'suwon', '수원랩', '시험원', NOW(), NOW()),
        ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'user1@example.com', '시험실무자2', 'test_engineer', '33333333-3333-3333-3333-333333333333', 'uiwang', '의왕랩', '시험원', NOW(), NOW())
      RETURNING id
    `);
    console.log(`  ✅ ${userResult.rowCount}명 사용자 생성됨`);

    // 4. 장비 생성
    console.log('🔧 장비 생성 중...');
    const equipmentResult = await pool.query(`
      INSERT INTO equipment (
        uuid, name, management_number, site, status, model_name, manufacturer, serial_number,
        location, team_id, calibration_method, calibration_cycle,
        last_calibration_date, next_calibration_date, calibration_agency,
        is_shared, shared_source, created_at, updated_at, approval_status
      )
      VALUES
        (gen_random_uuid(), '스펙트럼 분석기', 'SUW-E0001', 'suwon', 'available', 'N9020A', 'Keysight', 'MY12345678', 'RF시험실 A동', '11111111-1111-1111-1111-111111111111', 'external_calibration', 12, '2024-01-15', '2025-01-15', 'HCT', false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), '신호 발생기', 'SUW-E0002', 'suwon', 'in_use', 'N5182B', 'Keysight', 'MY23456789', 'RF시험실 B동', '11111111-1111-1111-1111-111111111111', 'external_calibration', 12, '2024-03-20', '2025-03-20', 'HCT', false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), 'EMC 수신기', 'SUW-R0001', 'suwon', 'available', 'ESR26', 'R&S', 'RS34567890', 'EMC시험실', '22222222-2222-2222-2222-222222222222', 'external_calibration', 12, '2024-02-10', '2025-02-10', 'KTC', false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), 'SAR 시스템', 'UIW-S0001', 'uiwang', 'checked_out', 'DASY6', 'SPEAG', 'SP45678901', 'SAR시험실', '33333333-3333-3333-3333-333333333333', 'self_inspection', 6, '2024-04-01', '2024-10-01', null, false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), '공용 오실로스코프', 'SUW-E0003', 'suwon', 'available', 'DSOX4024A', 'Keysight', 'MY56789012', '공용장비실', '11111111-1111-1111-1111-111111111111', 'external_calibration', 12, '2024-05-15', '2025-05-15', 'HCT', true, 'safety_lab', NOW(), NOW(), 'approved'),
        (gen_random_uuid(), '안테나 측정 시스템', 'UIW-W0001', 'uiwang', 'calibration_scheduled', 'SA6400', 'ETS-Lindgren', 'ETS67890123', 'RF무반향실', '33333333-3333-3333-3333-333333333333', 'external_calibration', 12, '2024-01-01', '2025-01-01', 'HCT', false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), '네트워크 분석기', 'SUW-E0004', 'suwon', 'non_conforming', 'E5071C', 'Keysight', 'MY78901234', 'RF시험실 A동', '11111111-1111-1111-1111-111111111111', 'external_calibration', 12, '2023-12-01', '2024-12-01', 'HCT', false, null, NOW(), NOW(), 'approved'),
        (gen_random_uuid(), '파워미터', 'SUW-E0005', 'suwon', 'retired', 'U2001A', 'Keysight', 'MY89012345', '폐기장비실', '11111111-1111-1111-1111-111111111111', 'not_applicable', null, null, null, null, false, null, NOW(), NOW(), 'approved')
      RETURNING uuid
    `);
    console.log(`  ✅ ${equipmentResult.rowCount}개 장비 생성됨`);

    console.log('\n✨ 시드 완료!');
    console.log('\n📋 테스트 계정:');
    console.log('  - admin@example.com / admin123 (시험소 관리자)');
    console.log('  - manager@example.com / manager123 (기술책임자)');
    console.log('  - user@example.com / user123 (시험실무자)');
    console.log('\n📋 테스트 장비:');
    console.log('  - 수원: 6개');
    console.log('  - 의왕: 2개');

  } catch (error) {
    console.error('❌ 시드 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
