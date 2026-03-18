/**
 * E2E 테스트용 포괄적인 시드 스크립트 (JavaScript - Raw SQL 버전)
 *
 * 사용법:
 * 1. 테스트 DB 실행: docker-compose -f docker-compose.test.yml up -d postgres-test
 * 2. 시드 실행: DATABASE_URL=postgresql://postgres:postgres@localhost:5434/equipment_management_test node src/database/seed-test.js
 *
 * 데이터 커버리지:
 * - Teams: 4개 (RF팀, EMC팀, SAR팀, 환경시험팀)
 * - Users: 6명 (관리자 2명, 기술책임자 2명, 시험실무자 2명)
 * - Equipment: 16개 (다양한 상태, 사이트, 교정방법)
 * - Equipment History: 위치 변동 12건, 유지보수 10건, 사고 10건
 * - Calibrations: 10건 (다양한 승인 상태)
 * - Loans: 8건 (다양한 상태)
 * - Checkouts: 10건 + Items 12건
 * - Calibration Factors: 6건
 * - Non-Conformances: 5건
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../../../../.env.test' });

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5434/equipment_management_test';

console.log('🌱 E2E 테스트 데이터베이스 시드 시작...');
console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

// =============================================================================
// 고정 UUID 정의 (테스트 안정성을 위해)
// =============================================================================

// Teams UUID
const TEAM_RF_ID = '11111111-1111-1111-1111-111111111111';
const TEAM_EMC_ID = '22222222-2222-2222-2222-222222222222';
const TEAM_SAR_ID = '33333333-3333-3333-3333-333333333333';
const TEAM_ENV_ID = '44444444-4444-4444-4444-444444444444';

// Users UUID
const USER_ADMIN_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const USER_MANAGER_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
const USER_ENGINEER_ID = '12345678-1234-4567-8901-234567890abc';
const USER_ENGINEER2_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_MANAGER2_ID = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const USER_ADMIN2_ID = 'cccccccc-dddd-eeee-ffff-000000000000';

// Equipment UUID
const EQUIP_SPECTRUM_ANALYZER_ID = 'eeee1111-1111-1111-1111-111111111111';
const EQUIP_SIGNAL_GENERATOR_ID = 'eeee2222-2222-2222-2222-222222222222';
const EQUIP_EMC_RECEIVER_ID = 'eeee3333-3333-3333-3333-333333333333';
const EQUIP_SAR_SYSTEM_ID = 'eeee4444-4444-4444-4444-444444444444';
const EQUIP_OSCILLOSCOPE_SHARED_ID = 'eeee5555-5555-5555-5555-555555555555';
const EQUIP_ANTENNA_SYSTEM_ID = 'eeee6666-6666-6666-6666-666666666666';
const EQUIP_NETWORK_ANALYZER_ID = 'eeee7777-7777-7777-7777-777777777777';
const EQUIP_POWER_METER_RETIRED_ID = 'eeee8888-8888-8888-8888-888888888888';
const EQUIP_POWER_METER_NEW_ID = 'eeee9999-9999-9999-9999-999999999999';
const EQUIP_AMPLIFIER_ID = 'eeeeaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const EQUIP_ATTENUATOR_ID = 'eeeebbb0-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EQUIP_TEMP_CHAMBER_ID = 'eeeecccc-cccc-cccc-cccc-cccccccccccc';
const EQUIP_HUMIDITY_TESTER_ID = 'eeeedddd-dddd-dddd-dddd-dddddddddddd';
const EQUIP_CABLE_ANALYZER_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const EQUIP_SAR_PROBE_ID = 'eeeeffff-ffff-ffff-ffff-ffffffffffff';
const EQUIP_SPARE_OSCILLOSCOPE_ID = 'eeee0000-0000-0000-0000-000000000000';

// Calibration UUID (valid hex format - only 0-9 and a-f allowed)
const CALIB_001_ID = 'ca11b001-0001-0001-0001-000000000001';
const CALIB_002_ID = 'ca11b002-0002-0002-0002-000000000002';
const CALIB_003_ID = 'ca11b003-0003-0003-0003-000000000003';
const CALIB_004_ID = 'ca11b004-0004-0004-0004-000000000004';
const CALIB_005_ID = 'ca11b005-0005-0005-0005-000000000005';
const CALIB_006_ID = 'ca11b006-0006-0006-0006-000000000006';
const CALIB_007_ID = 'ca11b007-0007-0007-0007-000000000007';
const CALIB_008_ID = 'ca11b008-0008-0008-0008-000000000008';
const CALIB_009_ID = 'ca11b009-0009-0009-0009-000000000009';
const CALIB_010_ID = 'ca11b010-0010-0010-0010-000000000010';

// Loan UUID (valid hex format)
const LOAN_001_ID = '10a00001-0001-0001-0001-000000000001';
const LOAN_002_ID = '10a00002-0002-0002-0002-000000000002';
const LOAN_003_ID = '10a00003-0003-0003-0003-000000000003';
const LOAN_004_ID = '10a00004-0004-0004-0004-000000000004';
const LOAN_005_ID = '10a00005-0005-0005-0005-000000000005';
const LOAN_006_ID = '10a00006-0006-0006-0006-000000000006';
const LOAN_007_ID = '10a00007-0007-0007-0007-000000000007';
const LOAN_008_ID = '10a00008-0008-0008-0008-000000000008';

// Checkout UUID (valid hex format)
const CHECKOUT_001_ID = 'c0ec0001-0001-0001-0001-000000000001';
const CHECKOUT_002_ID = 'c0ec0002-0002-0002-0002-000000000002';
const CHECKOUT_003_ID = 'c0ec0003-0003-0003-0003-000000000003';
const CHECKOUT_004_ID = 'c0ec0004-0004-0004-0004-000000000004';
const CHECKOUT_005_ID = 'c0ec0005-0005-0005-0005-000000000005';
const CHECKOUT_006_ID = 'c0ec0006-0006-0006-0006-000000000006';
const CHECKOUT_007_ID = 'c0ec0007-0007-0007-0007-000000000007';
const CHECKOUT_008_ID = 'c0ec0008-0008-0008-0008-000000000008';
const CHECKOUT_009_ID = 'c0ec0009-0009-0009-0009-000000000009';
const CHECKOUT_010_ID = 'c0ec0010-0010-0010-0010-000000000010';

// Calibration Factor UUID (valid hex format)
const CF_001_ID = 'cfa00001-0001-0001-0001-000000000001';
const CF_002_ID = 'cfa00002-0002-0002-0002-000000000002';
const CF_003_ID = 'cfa00003-0003-0003-0003-000000000003';
const CF_004_ID = 'cfa00004-0004-0004-0004-000000000004';
const CF_005_ID = 'cfa00005-0005-0005-0005-000000000005';
const CF_006_ID = 'cfa00006-0006-0006-0006-000000000006';

// Non-Conformance UUID (valid hex format)
const NC_001_ID = '0cf00001-0001-0001-0001-000000000001';
const NC_002_ID = '0cf00002-0002-0002-0002-000000000002';
const NC_003_ID = '0cf00003-0003-0003-0003-000000000003';
const NC_004_ID = '0cf00004-0004-0004-0004-000000000004';
const NC_005_ID = '0cf00005-0005-0005-0005-000000000005';

// =============================================================================
// 날짜 헬퍼 함수
// =============================================================================

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysLater = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const monthsAgo = (months) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
};
const monthsLater = (months) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + months);
  return d;
};
const toDate = (d) => d.toISOString().split('T')[0];
const toTimestamp = (d) => d.toISOString();

// =============================================================================
// 시드 함수
// =============================================================================

async function seed() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    // =========================================================================
    // Phase 0: 기존 데이터 삭제 (외래키 의존성 역순)
    // =========================================================================
    console.log('\n🗑️  기존 테스트 데이터 삭제 중...');

    await client.query('DELETE FROM calibration_factors');
    await client.query('DELETE FROM non_conformances');
    await client.query('DELETE FROM checkout_items');
    await client.query('DELETE FROM checkouts');
    await client.query('DELETE FROM loans');
    await client.query('DELETE FROM calibrations');
    await client.query('DELETE FROM equipment_incident_history');
    await client.query('DELETE FROM equipment_maintenance_history');
    await client.query('DELETE FROM equipment_location_history');
    await client.query('DELETE FROM equipment');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM teams');

    console.log('  ✅ 기존 데이터 삭제 완료');

    // =========================================================================
    // Phase 1: Teams (4개)
    // =========================================================================
    console.log('\n👥 팀 생성 중...');
    await client.query(`
      INSERT INTO teams (id, name, type, description, site) VALUES
        ('${TEAM_RF_ID}', 'RF팀', 'RF', 'RF 시험 팀 - 무선 주파수 관련 시험', 'suwon'),
        ('${TEAM_EMC_ID}', 'EMC팀', 'EMC', 'EMC 시험 팀 - 전자기 호환성 시험', 'suwon'),
        ('${TEAM_SAR_ID}', 'SAR팀', 'SAR', 'SAR 시험 팀 - 전자파 흡수율 시험', 'uiwang'),
        ('${TEAM_ENV_ID}', '환경시험팀', 'ENVIRONMENTAL', '환경시험팀 - 온도/습도 환경 시험', 'uiwang')
    `);
    console.log('  ✅ 4개 팀 생성됨');

    // =========================================================================
    // Phase 2: Users (6명)
    // =========================================================================
    console.log('\n👤 테스트 사용자 생성 중...');
    await client.query(`
      INSERT INTO users (id, email, name, role, team_id, site, location, position) VALUES
        ('${USER_ADMIN_ID}', 'admin@example.com', '관리자', 'lab_manager', '${TEAM_RF_ID}', 'suwon', '수원랩 관리동', '시험소장'),
        ('${USER_MANAGER_ID}', 'manager@example.com', '기술책임자', 'technical_manager', '${TEAM_RF_ID}', 'suwon', '수원랩 RF동', '기술책임자'),
        ('${USER_ENGINEER_ID}', 'user@example.com', '시험실무자', 'test_engineer', '${TEAM_EMC_ID}', 'suwon', '수원랩 EMC동', '시험원'),
        ('${USER_ENGINEER2_ID}', 'user1@example.com', '시험실무자2', 'test_engineer', '${TEAM_SAR_ID}', 'uiwang', '의왕랩 SAR동', '시험원'),
        ('${USER_MANAGER2_ID}', 'manager2@example.com', '의왕기술책임자', 'technical_manager', '${TEAM_SAR_ID}', 'uiwang', '의왕랩 SAR동', '기술책임자'),
        ('${USER_ADMIN2_ID}', 'admin2@example.com', '의왕관리자', 'lab_manager', '${TEAM_ENV_ID}', 'uiwang', '의왕랩 관리동', '시험소장')
    `);
    console.log('  ✅ 6명 사용자 생성됨');

    // =========================================================================
    // Phase 3: Equipment (16개)
    // =========================================================================
    console.log('\n🔧 테스트 장비 생성 중...');
    await client.query(`
      INSERT INTO equipment (uuid, name, management_number, asset_number, site, status, model_name, manufacturer, manufacturer_contact, serial_number, location, initial_location, installation_date, team_id, technical_manager_id, calibration_method, calibration_cycle, last_calibration_date, next_calibration_date, calibration_agency, spec_match, calibration_required, intermediate_check_cycle, last_intermediate_check_date, next_intermediate_check_date, is_shared, shared_source, approval_status, requested_by) VALUES
        -- 수원 사이트 장비 (10개)
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '스펙트럼 분석기', 'SUW-E0001', 'AST-2023-001', 'suwon', 'available', 'N9020A', 'Keysight', '02-1234-5678', 'MY12345678', 'RF시험실 A동', 'RF시험실 A동', '${toTimestamp(monthsAgo(24))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(3))}', '${toDate(monthsLater(9))}', 'HCT', 'match', 'required', 6, '${toTimestamp(monthsAgo(1))}', '${toTimestamp(monthsLater(5))}', false, NULL, 'approved', NULL),
        ('${EQUIP_SIGNAL_GENERATOR_ID}', '신호 발생기', 'SUW-E0002', 'AST-2023-002', 'suwon', 'in_use', 'N5182B', 'Keysight', '02-1234-5678', 'MY23456789', 'RF시험실 B동', 'RF시험실 B동', '${toTimestamp(monthsAgo(18))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(2))}', '${toDate(monthsLater(10))}', 'HCT', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_EMC_RECEIVER_ID}', 'EMC 수신기', 'SUW-R0001', 'AST-2022-005', 'suwon', 'available', 'ESR26', 'R&S', '02-9876-5432', 'RS34567890', 'EMC시험실', 'EMC시험실', '${toTimestamp(monthsAgo(36))}', '${TEAM_EMC_ID}', '${USER_ENGINEER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(4))}', '${toDate(monthsLater(8))}', 'KTC', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_OSCILLOSCOPE_SHARED_ID}', '공용 오실로스코프', 'SUW-E0003', 'AST-2023-003', 'suwon', 'available', 'DSOX4024A', 'Keysight', NULL, 'MY56789012', '공용장비실', '공용장비실', '${toTimestamp(monthsAgo(12))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(6))}', '${toDate(monthsLater(6))}', 'HCT', 'match', 'required', NULL, NULL, NULL, true, 'safety_lab', 'approved', NULL),
        ('${EQUIP_NETWORK_ANALYZER_ID}', '네트워크 분석기', 'SUW-E0004', 'AST-2021-010', 'suwon', 'non_conforming', 'E5071C', 'Keysight', NULL, 'MY78901234', 'RF시험실 A동', 'RF시험실 A동', '${toTimestamp(monthsAgo(48))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(14))}', '${toDate(monthsAgo(2))}', 'HCT', 'mismatch', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_POWER_METER_RETIRED_ID}', '파워미터 (폐기)', 'SUW-E0005', 'AST-2018-015', 'suwon', 'retired', 'U2001A', 'Keysight', NULL, 'MY89012345', '폐기장비실', 'RF시험실 A동', '${toTimestamp(monthsAgo(72))}', '${TEAM_RF_ID}', NULL, 'not_applicable', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_POWER_METER_NEW_ID}', '파워미터 신규', 'SUW-E0006', 'AST-2025-001', 'suwon', 'available', 'U2002H', 'Keysight', NULL, 'MY90123456', 'RF시험실 A동', NULL, NULL, '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, NULL, NULL, NULL, 'match', 'required', NULL, NULL, NULL, false, NULL, 'pending_approval', '${USER_ENGINEER_ID}'),
        ('${EQUIP_AMPLIFIER_ID}', '증폭기', 'SUW-E0007', 'AST-2022-008', 'suwon', 'checked_out', 'ZHL-5W-1', 'Mini-Circuits', NULL, 'MC12345678', '외부 수리 중', 'RF시험실 B동', '${toTimestamp(monthsAgo(30))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'self_inspection', 6, '${toDate(monthsAgo(5))}', '${toDate(monthsLater(1))}', NULL, 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_ATTENUATOR_ID}', '가변감쇠기', 'SUW-E0008', 'AST-2021-012', 'suwon', 'calibration_scheduled', 'RCDAT-6000-90', 'Mini-Circuits', NULL, 'MC23456789', 'RF시험실 A동', 'RF시험실 A동', '${toTimestamp(monthsAgo(40))}', '${TEAM_RF_ID}', '${USER_MANAGER_ID}', 'external_calibration', 12, '${toDate(monthsAgo(11))}', '${toDate(daysLater(15))}', 'HCT', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_CABLE_ANALYZER_ID}', '케이블 분석기', 'SUW-E0009', 'AST-2022-020', 'suwon', 'available', 'N9912A', 'Keysight', NULL, 'MY01234567', 'EMC시험실', 'EMC시험실', '${toTimestamp(monthsAgo(20))}', '${TEAM_EMC_ID}', '${USER_ENGINEER_ID}', 'self_inspection', 6, '${toDate(monthsAgo(2))}', '${toDate(monthsLater(4))}', NULL, 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        -- 의왕 사이트 장비 (6개)
        ('${EQUIP_SAR_SYSTEM_ID}', 'SAR 시스템', 'UIW-S0001', 'AST-2020-030', 'uiwang', 'checked_out', 'DASY6', 'SPEAG', '+41-44-245-9700', 'SP45678901', '외부 교정 중', 'SAR시험실', '${toTimestamp(monthsAgo(60))}', '${TEAM_SAR_ID}', '${USER_MANAGER2_ID}', 'external_calibration', 12, '${toDate(monthsAgo(11))}', '${toDate(daysLater(30))}', 'SPEAG', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_ANTENNA_SYSTEM_ID}', '안테나 측정 시스템', 'UIW-W0001', 'AST-2019-025', 'uiwang', 'calibration_overdue', 'SA6400', 'ETS-Lindgren', NULL, 'ETS67890123', 'RF무반향실', 'RF무반향실', '${toTimestamp(monthsAgo(72))}', '${TEAM_SAR_ID}', '${USER_MANAGER2_ID}', 'external_calibration', 12, '${toDate(monthsAgo(14))}', '${toDate(monthsAgo(2))}', 'HCT', 'mismatch', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_SAR_PROBE_ID}', 'SAR 프로브', 'UIW-S0002', 'AST-2021-035', 'uiwang', 'in_use', 'EX3DV4', 'SPEAG', NULL, 'SP56789012', 'SAR시험실', 'SAR시험실', '${toTimestamp(monthsAgo(48))}', '${TEAM_SAR_ID}', '${USER_MANAGER2_ID}', 'external_calibration', 12, '${toDate(monthsAgo(6))}', '${toDate(monthsLater(6))}', 'SPEAG', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_TEMP_CHAMBER_ID}', '온도 챔버', 'UIW-C0001', 'AST-2018-040', 'uiwang', 'available', 'TH-G-180', 'ESPEC', NULL, 'ESP12345678', '환경시험실 A', '환경시험실 A', '${toTimestamp(monthsAgo(84))}', '${TEAM_ENV_ID}', '${USER_ADMIN2_ID}', 'not_applicable', NULL, NULL, NULL, NULL, 'match', 'not_required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_HUMIDITY_TESTER_ID}', '습도 시험기', 'UIW-C0002', 'AST-2019-045', 'uiwang', 'available', 'PR-4KPH', 'ESPEC', NULL, 'ESP23456789', '환경시험실 B', '환경시험실 B', '${toTimestamp(monthsAgo(60))}', '${TEAM_ENV_ID}', '${USER_ADMIN2_ID}', 'self_inspection', 6, '${toDate(monthsAgo(3))}', '${toDate(monthsLater(3))}', NULL, 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL),
        ('${EQUIP_SPARE_OSCILLOSCOPE_ID}', '여분 오실로스코프', 'UIW-E0001', 'AST-2020-050', 'uiwang', 'spare', 'DSOX3024T', 'Keysight', NULL, 'MY34567890', '예비장비 보관실', 'SAR시험실', '${toTimestamp(monthsAgo(48))}', '${TEAM_SAR_ID}', '${USER_MANAGER2_ID}', 'external_calibration', 12, '${toDate(monthsAgo(8))}', '${toDate(monthsLater(4))}', 'HCT', 'match', 'required', NULL, NULL, NULL, false, NULL, 'approved', NULL)
    `);
    console.log('  ✅ 16개 장비 생성됨');

    // =========================================================================
    // Phase 4: Equipment Location History (12건)
    // =========================================================================
    console.log('\n📍 장비 위치 변동 이력 생성 중...');
    await client.query(`
      INSERT INTO equipment_location_history (equipment_id, changed_at, new_location, notes, changed_by) VALUES
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(12))}', 'RF시험실 B동', '시험실 리모델링으로 인한 임시 이동', '${USER_MANAGER_ID}'),
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(6))}', 'RF시험실 A동', '원위치 복귀', '${USER_MANAGER_ID}'),
        ('${EQUIP_NETWORK_ANALYZER_ID}', '${toTimestamp(monthsAgo(24))}', 'EMC시험실', 'EMC팀 지원 목적 임시 이동', '${USER_ENGINEER_ID}'),
        ('${EQUIP_NETWORK_ANALYZER_ID}', '${toTimestamp(monthsAgo(18))}', 'RF시험실 A동', '원위치 복귀', '${USER_MANAGER_ID}'),
        ('${EQUIP_SAR_SYSTEM_ID}', '${toTimestamp(monthsAgo(36))}', '환경시험실', '온습도 특성 시험 지원', '${USER_MANAGER2_ID}'),
        ('${EQUIP_SAR_SYSTEM_ID}', '${toTimestamp(monthsAgo(30))}', 'SAR시험실', '원위치 복귀', '${USER_MANAGER2_ID}'),
        ('${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${toTimestamp(monthsAgo(10))}', 'RF시험실 A동', 'RF팀 시험 지원', '${USER_ENGINEER_ID}'),
        ('${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${toTimestamp(monthsAgo(8))}', 'EMC시험실', 'EMC팀 시험 지원', '${USER_ENGINEER_ID}'),
        ('${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${toTimestamp(monthsAgo(5))}', '공용장비실', '원위치 복귀', '${USER_MANAGER_ID}'),
        ('${EQUIP_SPARE_OSCILLOSCOPE_ID}', '${toTimestamp(monthsAgo(24))}', 'RF무반향실', '임시 사용', '${USER_ENGINEER2_ID}'),
        ('${EQUIP_SPARE_OSCILLOSCOPE_ID}', '${toTimestamp(monthsAgo(12))}', '예비장비 보관실', '여분 장비로 전환', '${USER_MANAGER2_ID}'),
        ('${EQUIP_POWER_METER_RETIRED_ID}', '${toTimestamp(monthsAgo(6))}', '폐기장비실', '폐기 처리를 위한 이동', '${USER_ADMIN_ID}')
    `);
    console.log('  ✅ 12건 위치 변동 이력 생성됨');

    // =========================================================================
    // Phase 5: Equipment Maintenance History (10건)
    // =========================================================================
    console.log('\n🔧 장비 유지보수 이력 생성 중...');
    await client.query(`
      INSERT INTO equipment_maintenance_history (equipment_id, performed_at, content, performed_by) VALUES
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(6))}', '연간 정기 점검: 필터 청소, 케이블 점검, 소프트웨어 업데이트', '${USER_MANAGER_ID}'),
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(1))}', '팬 소음 발생으로 팬 베어링 교체', '${USER_MANAGER_ID}'),
        ('${EQUIP_SIGNAL_GENERATOR_ID}', '${toTimestamp(monthsAgo(8))}', '출력 레벨 보정 및 내부 기준 신호 점검', '${USER_MANAGER_ID}'),
        ('${EQUIP_EMC_RECEIVER_ID}', '${toTimestamp(monthsAgo(4))}', '프리앰프 정기 점검 및 필터 교체', '${USER_ENGINEER_ID}'),
        ('${EQUIP_NETWORK_ANALYZER_ID}', '${toTimestamp(monthsAgo(10))}', '포트 커넥터 마모로 인한 교체 작업', '${USER_MANAGER_ID}'),
        ('${EQUIP_SAR_SYSTEM_ID}', '${toTimestamp(monthsAgo(6))}', '로봇 암 정밀도 점검 및 윤활유 교체', '${USER_MANAGER2_ID}'),
        ('${EQUIP_SAR_SYSTEM_ID}', '${toTimestamp(monthsAgo(2))}', '팬텀 용액 교체 및 센서 청소', '${USER_ENGINEER2_ID}'),
        ('${EQUIP_TEMP_CHAMBER_ID}', '${toTimestamp(monthsAgo(3))}', '냉매 보충 및 압축기 점검', '${USER_ADMIN2_ID}'),
        ('${EQUIP_ANTENNA_SYSTEM_ID}', '${toTimestamp(monthsAgo(8))}', '포지셔너 정렬 및 케이블 점검', '${USER_MANAGER2_ID}'),
        ('${EQUIP_AMPLIFIER_ID}', '${toTimestamp(monthsAgo(4))}', '출력 전력 저하로 인한 점검 (수리 필요 판정)', '${USER_MANAGER_ID}')
    `);
    console.log('  ✅ 10건 유지보수 이력 생성됨');

    // =========================================================================
    // Phase 6: Equipment Incident History (10건)
    // =========================================================================
    console.log('\n⚠️ 장비 사고/손상 이력 생성 중...');
    await client.query(`
      INSERT INTO equipment_incident_history (equipment_id, occurred_at, incident_type, content, reported_by) VALUES
        ('${EQUIP_NETWORK_ANALYZER_ID}', '${toTimestamp(monthsAgo(3))}', 'malfunction', '측정 결과 불안정: 교정 기한 초과로 인한 정확도 저하 발견', '${USER_ENGINEER_ID}'),
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(8))}', 'damage', '외부 케이스 경미한 손상 (운반 중 충격)', '${USER_ENGINEER_ID}'),
        ('${EQUIP_SPECTRUM_ANALYZER_ID}', '${toTimestamp(monthsAgo(7))}', 'repair', '외부 케이스 손상 수리 완료', '${USER_MANAGER_ID}'),
        ('${EQUIP_AMPLIFIER_ID}', '${toTimestamp(monthsAgo(2))}', 'malfunction', '출력 전력 정격 대비 30% 저하 발생', '${USER_MANAGER_ID}'),
        ('${EQUIP_SAR_SYSTEM_ID}', '${toTimestamp(monthsAgo(12))}', 'change', '제어 소프트웨어 버전 업그레이드 (v5.0 → v6.0)', '${USER_MANAGER2_ID}'),
        ('${EQUIP_ANTENNA_SYSTEM_ID}', '${toTimestamp(monthsAgo(4))}', 'malfunction', '포지셔너 구동 오류 발생 (모터 이상)', '${USER_ENGINEER2_ID}'),
        ('${EQUIP_ANTENNA_SYSTEM_ID}', '${toTimestamp(monthsAgo(3))}', 'repair', '포지셔너 모터 교체 완료', '${USER_MANAGER2_ID}'),
        ('${EQUIP_POWER_METER_RETIRED_ID}', '${toTimestamp(monthsAgo(8))}', 'malfunction', '센서 불량으로 측정 불가 (수리 불가능 판정)', '${USER_MANAGER_ID}'),
        ('${EQUIP_EMC_RECEIVER_ID}', '${toTimestamp(monthsAgo(10))}', 'damage', 'RF 입력 커넥터 핀 휨 발생', '${USER_ENGINEER_ID}'),
        ('${EQUIP_EMC_RECEIVER_ID}', '${toTimestamp(monthsAgo(9))}', 'repair', 'RF 입력 커넥터 교체 완료', '${USER_ENGINEER_ID}')
    `);
    console.log('  ✅ 10건 사고/손상 이력 생성됨');

    // =========================================================================
    // Phase 7: Calibrations (10건)
    // - 실제 스키마에 맞춰 필드 조정 (technician_id, status, completion_date, next_calibration_date, cost 등 제외)
    // =========================================================================
    console.log('\n📋 교정 기록 생성 중...');

    // 장비 ID 조회 (equipment.id가 UUID이므로 uuid로 조회 필요)
    const equipmentIds = await client.query(`
      SELECT id, uuid FROM equipment WHERE uuid IN (
        '${EQUIP_SPECTRUM_ANALYZER_ID}', '${EQUIP_SIGNAL_GENERATOR_ID}', '${EQUIP_EMC_RECEIVER_ID}',
        '${EQUIP_SAR_SYSTEM_ID}', '${EQUIP_SAR_PROBE_ID}', '${EQUIP_CABLE_ANALYZER_ID}',
        '${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${EQUIP_ATTENUATOR_ID}', '${EQUIP_HUMIDITY_TESTER_ID}',
        '${EQUIP_NETWORK_ANALYZER_ID}'
      )
    `);

    const equipIdMap = {};
    equipmentIds.rows.forEach((row) => {
      equipIdMap[row.uuid] = row.id;
    });

    await client.query(`
      INSERT INTO calibrations (id, equipment_id, calibration_date, calibration_agency, certificate_number, result, notes, approval_status, registered_by, approved_by, registered_by_role, registrar_comment, approver_comment, rejection_reason) VALUES
        ('${CALIB_001_ID}', '${equipIdMap[EQUIP_SPECTRUM_ANALYZER_ID]}', '${toDate(monthsAgo(3))}', 'HCT', 'HCT-2024-001234', 'PASS', '정상 교정 완료', 'approved', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'test_engineer', NULL, '교정 결과 적합 확인', NULL),
        ('${CALIB_002_ID}', '${equipIdMap[EQUIP_SIGNAL_GENERATOR_ID]}', '${toDate(monthsAgo(2))}', 'HCT', 'HCT-2024-001235', 'PASS', NULL, 'approved', '${USER_MANAGER_ID}', '${USER_MANAGER_ID}', 'technical_manager', '기술책임자 직접 등록', '자기 승인 (기술책임자 직접 등록)', NULL),
        ('${CALIB_003_ID}', '${equipIdMap[EQUIP_EMC_RECEIVER_ID]}', '${toDate(monthsAgo(4))}', 'KTC', 'KTC-2024-005678', 'PASS', NULL, 'approved', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'test_engineer', NULL, '교정 성적서 확인 완료', NULL),
        ('${CALIB_004_ID}', '${equipIdMap[EQUIP_SAR_SYSTEM_ID]}', '${toDate(monthsAgo(11))}', 'SPEAG', 'SPEAG-2024-0012', 'PASS', NULL, 'approved', '${USER_ENGINEER2_ID}', '${USER_MANAGER2_ID}', 'test_engineer', NULL, '본사 교정 결과 확인', NULL),
        ('${CALIB_005_ID}', '${equipIdMap[EQUIP_SAR_PROBE_ID]}', '${toDate(monthsAgo(6))}', 'SPEAG', 'SPEAG-2024-0034', 'PASS', NULL, 'approved', '${USER_MANAGER2_ID}', '${USER_MANAGER2_ID}', 'technical_manager', '프로브 교정 - 기술책임자 직접 등록', '교정 결과 양호', NULL),
        ('${CALIB_006_ID}', '${equipIdMap[EQUIP_CABLE_ANALYZER_ID]}', '${toDate(monthsAgo(2))}', NULL, NULL, 'PASS', '자체 점검 완료', 'approved', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'test_engineer', NULL, '자체 점검 기록 확인', NULL),
        ('${CALIB_007_ID}', '${equipIdMap[EQUIP_OSCILLOSCOPE_SHARED_ID]}', '${toDate(monthsAgo(1))}', 'HCT', 'HCT-2025-000100', 'PASS', NULL, 'pending_approval', '${USER_ENGINEER_ID}', NULL, 'test_engineer', NULL, NULL, NULL),
        ('${CALIB_008_ID}', '${equipIdMap[EQUIP_ATTENUATOR_ID]}', '${toDate(daysLater(15))}', 'HCT', NULL, NULL, '교정 예약 신청', 'pending_approval', '${USER_ENGINEER_ID}', NULL, 'test_engineer', NULL, NULL, NULL),
        ('${CALIB_009_ID}', '${equipIdMap[EQUIP_HUMIDITY_TESTER_ID]}', '${toDate(daysAgo(5))}', NULL, NULL, 'PASS', '자체 점검 완료 - 승인 대기', 'pending_approval', '${USER_ENGINEER2_ID}', NULL, 'test_engineer', NULL, NULL, NULL),
        ('${CALIB_010_ID}', '${equipIdMap[EQUIP_NETWORK_ANALYZER_ID]}', '${toDate(monthsAgo(2))}', 'HCT', NULL, 'FAIL', '측정 불확도 규격 초과', 'rejected', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'test_engineer', NULL, NULL, '교정 결과 부적합 - 장비 상태 비정상. 수리 후 재교정 필요.')
    `);
    console.log('  ✅ 10건 교정 기록 생성됨');

    // =========================================================================
    // Phase 8: Loans (8건)
    // =========================================================================
    console.log('\n📦 대여 기록 생성 중...');
    await client.query(`
      INSERT INTO loans (id, equipment_id, borrower_id, approver_id, status, loan_date, expected_return_date, actual_return_date, notes, rejection_reason, approver_comment, auto_approved) VALUES
        ('${LOAN_001_ID}', '${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${USER_ENGINEER2_ID}', NULL, 'pending', NULL, '${toTimestamp(daysLater(14))}', NULL, 'SAR 시험 지원 목적 대여 신청', NULL, NULL, false),
        ('${LOAN_002_ID}', '${EQUIP_CABLE_ANALYZER_ID}', '${USER_ENGINEER2_ID}', NULL, 'pending', NULL, '${toTimestamp(daysLater(7))}', NULL, '케이블 점검 목적 대여 신청', NULL, NULL, false),
        ('${LOAN_003_ID}', '${EQUIP_SPECTRUM_ANALYZER_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'approved', '${toTimestamp(daysLater(3))}', '${toTimestamp(daysLater(10))}', NULL, 'EMC 시험 지원', NULL, '승인 - 시험 일정 확인됨', false),
        ('${LOAN_004_ID}', '${EQUIP_SPARE_OSCILLOSCOPE_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER2_ID}', 'approved', '${toTimestamp(daysLater(5))}', '${toTimestamp(daysLater(12))}', NULL, '수원 RF팀 지원', NULL, '여분 장비 사용 승인', false),
        ('${LOAN_005_ID}', '${EQUIP_SIGNAL_GENERATOR_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'active', '${toTimestamp(daysAgo(3))}', '${toTimestamp(daysLater(4))}', NULL, 'EMC 시험용 신호 발생기 대여', NULL, '승인', true),
        ('${LOAN_006_ID}', '${EQUIP_SAR_PROBE_ID}', '${USER_ADMIN2_ID}', '${USER_MANAGER2_ID}', 'active', '${toTimestamp(daysAgo(5))}', '${toTimestamp(daysLater(2))}', NULL, '환경시험팀 특수 측정 지원', NULL, '타팀 지원 승인', false),
        ('${LOAN_007_ID}', '${EQUIP_EMC_RECEIVER_ID}', '${USER_ENGINEER2_ID}', '${USER_MANAGER_ID}', 'returned', '${toTimestamp(daysAgo(14))}', '${toTimestamp(daysAgo(7))}', '${toTimestamp(daysAgo(8))}', '의왕 SAR팀 EMC 측정 지원', NULL, '타사이트 지원 승인', false),
        ('${LOAN_008_ID}', '${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', 'returned', '${toTimestamp(daysAgo(21))}', '${toTimestamp(daysAgo(14))}', '${toTimestamp(daysAgo(15))}', '공용 오실로스코프 대여', NULL, '공용장비 대여 승인', true)
    `);
    console.log('  ✅ 8건 대여 기록 생성됨');

    // =========================================================================
    // Phase 9: Checkouts (10건)
    // =========================================================================
    console.log('\n🚚 반출 기록 생성 중...');
    await client.query(`
      INSERT INTO checkouts (id, requester_id, approver_id, returner_id, purpose, checkout_type, destination, lender_team_id, lender_site_id, phone_number, address, reason, checkout_date, expected_return_date, actual_return_date, status, approved_at, rejection_reason, calibration_checked, repair_checked, working_status_checked, inspection_notes, return_approved_by, return_approved_at) VALUES
        ('${CHECKOUT_001_ID}', '${USER_ENGINEER_ID}', NULL, NULL, 'calibration', 'calibration', 'HCT 교정센터', NULL, NULL, NULL, NULL, '연간 정기 교정', NULL, '${toTimestamp(daysLater(14))}', NULL, 'pending', NULL, NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_002_ID}', '${USER_ENGINEER2_ID}', NULL, NULL, 'repair', 'repair', 'SPEAG Korea', NULL, NULL, NULL, NULL, '센서 불량 수리', NULL, '${toTimestamp(daysLater(30))}', NULL, 'pending', NULL, NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_003_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', NULL, 'calibration', 'calibration', 'KTC 교정센터', NULL, NULL, NULL, NULL, '교정 예정', NULL, '${toTimestamp(daysLater(10))}', NULL, 'approved', '${toTimestamp(daysAgo(1))}', NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_004_ID}', '${USER_MANAGER2_ID}', '${USER_ADMIN2_ID}', NULL, 'rental', 'rental', '협력 시험소 A', NULL, 'uiwang', '031-1234-5678', '경기도 안양시 동안구', '시험 장비 대여 (외부)', NULL, '${toTimestamp(daysLater(21))}', NULL, 'approved', '${toTimestamp(daysAgo(2))}', NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_005_ID}', '${USER_MANAGER_ID}', '${USER_ADMIN_ID}', NULL, 'repair', 'repair', 'Mini-Circuits Korea', NULL, NULL, NULL, NULL, '출력 전력 저하 수리', '${toTimestamp(daysAgo(7))}', '${toTimestamp(daysLater(14))}', NULL, 'checked_out', '${toTimestamp(daysAgo(8))}', NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_006_ID}', '${USER_MANAGER2_ID}', '${USER_ADMIN2_ID}', NULL, 'calibration', 'calibration', 'SPEAG Switzerland (본사)', NULL, NULL, NULL, NULL, 'SAR 시스템 연간 교정', '${toTimestamp(daysAgo(14))}', '${toTimestamp(daysLater(45))}', NULL, 'checked_out', '${toTimestamp(daysAgo(15))}', NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_007_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', NULL, 'rental', 'rental', '협력 업체 B', '${TEAM_RF_ID}', NULL, '02-9876-5432', NULL, '신제품 시험 지원 (단기)', '${toTimestamp(daysAgo(3))}', '${toTimestamp(daysLater(7))}', NULL, 'checked_out', '${toTimestamp(daysAgo(4))}', NULL, false, false, false, NULL, NULL, NULL),
        ('${CHECKOUT_008_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', '${USER_ENGINEER_ID}', 'calibration', 'calibration', 'HCT 교정센터', NULL, NULL, NULL, NULL, '정기 교정', '${toTimestamp(daysAgo(21))}', '${toTimestamp(daysAgo(7))}', '${toTimestamp(daysAgo(8))}', 'returned', '${toTimestamp(daysAgo(22))}', NULL, true, false, true, '교정 성적서 수령 확인, 작동 상태 정상', NULL, NULL),
        ('${CHECKOUT_009_ID}', '${USER_ENGINEER2_ID}', '${USER_MANAGER2_ID}', '${USER_ENGINEER2_ID}', 'repair', 'repair', 'SPEAG Korea', NULL, NULL, NULL, NULL, '프로브 센서 수리', '${toTimestamp(daysAgo(17))}', '${toTimestamp(daysAgo(3))}', '${toTimestamp(daysAgo(5))}', 'returned', '${toTimestamp(daysAgo(18))}', NULL, false, true, true, '센서 교체 완료, 정상 작동 확인', NULL, NULL),
        ('${CHECKOUT_010_ID}', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', '${USER_ENGINEER_ID}', 'calibration', 'calibration', 'KTC 교정센터', NULL, NULL, NULL, NULL, 'EMC 수신기 정기 교정', '${toTimestamp(daysAgo(24))}', '${toTimestamp(daysAgo(10))}', '${toTimestamp(daysAgo(12))}', 'return_approved', '${toTimestamp(daysAgo(25))}', NULL, true, false, true, '교정 완료 확인, 성적서 등록 완료', '${USER_MANAGER_ID}', '${toTimestamp(daysAgo(11))}')
    `);
    console.log('  ✅ 10건 반출 기록 생성됨');

    // =========================================================================
    // Phase 10: Checkout Items (12건)
    // =========================================================================
    console.log('\n📦 반출 항목 생성 중...');
    await client.query(`
      INSERT INTO checkout_items (checkout_id, equipment_id, condition_before, condition_after, inspection_notes) VALUES
        ('${CHECKOUT_001_ID}', '${EQUIP_ATTENUATOR_ID}', NULL, NULL, NULL),
        ('${CHECKOUT_002_ID}', '${EQUIP_ANTENNA_SYSTEM_ID}', NULL, NULL, NULL),
        ('${CHECKOUT_003_ID}', '${EQUIP_EMC_RECEIVER_ID}', NULL, NULL, NULL),
        ('${CHECKOUT_004_ID}', '${EQUIP_HUMIDITY_TESTER_ID}', NULL, NULL, NULL),
        ('${CHECKOUT_005_ID}', '${EQUIP_AMPLIFIER_ID}', '출력 전력 정격 대비 30% 저하', NULL, NULL),
        ('${CHECKOUT_006_ID}', '${EQUIP_SAR_SYSTEM_ID}', '정상 상태, 연간 정기 교정', NULL, NULL),
        ('${CHECKOUT_007_ID}', '${EQUIP_SPECTRUM_ANALYZER_ID}', '정상 작동', NULL, NULL),
        ('${CHECKOUT_007_ID}', '${EQUIP_SIGNAL_GENERATOR_ID}', '정상 작동', NULL, NULL),
        ('${CHECKOUT_008_ID}', '${EQUIP_OSCILLOSCOPE_SHARED_ID}', '정상', '교정 완료, 정상', '교정 성적서 HCT-2025-000100'),
        ('${CHECKOUT_009_ID}', '${EQUIP_SAR_PROBE_ID}', '센서 응답 불안정', '센서 교체 후 정상', '수리 보고서 첨부됨'),
        ('${CHECKOUT_010_ID}', '${EQUIP_CABLE_ANALYZER_ID}', '정상', '교정 완료, 정상', '자체 점검 완료 확인'),
        ('${CHECKOUT_010_ID}', '${EQUIP_EMC_RECEIVER_ID}', '정상', '교정 완료, 정상', 'KTC 교정 성적서 등록됨')
    `);
    console.log('  ✅ 12건 반출 항목 생성됨');

    // =========================================================================
    // Phase 11: Calibration Factors (6건)
    // =========================================================================
    console.log('\n📊 보정계수 기록 생성 중...');
    await client.query(`
      INSERT INTO calibration_factors (id, equipment_id, calibration_id, factor_type, factor_name, factor_value, unit, effective_date, expiry_date, approval_status, requested_by, approved_by, requested_at, approved_at, approver_comment) VALUES
        ('${CF_001_ID}', '${EQUIP_SPECTRUM_ANALYZER_ID}', '${CALIB_001_ID}', 'cable_loss', '3GHz 케이블 손실', 2.35, 'dB', '${toDate(monthsAgo(3))}', '${toDate(monthsLater(9))}', 'approved', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', '${toTimestamp(monthsAgo(3))}', '${toTimestamp(monthsAgo(3))}', '케이블 손실 보정계수 확인 승인'),
        ('${CF_002_ID}', '${EQUIP_EMC_RECEIVER_ID}', '${CALIB_003_ID}', 'path_loss', '30MHz-1GHz 경로 손실', 1.82, 'dB', '${toDate(monthsAgo(4))}', '${toDate(monthsLater(8))}', 'approved', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', '${toTimestamp(monthsAgo(4))}', '${toTimestamp(monthsAgo(4))}', '경로 손실 측정 결과 적합'),
        ('${CF_003_ID}', '${EQUIP_SAR_PROBE_ID}', '${CALIB_005_ID}', 'antenna_gain', '프로브 민감도 보정', 0.98, 'factor', '${toDate(monthsAgo(6))}', '${toDate(monthsLater(6))}', 'approved', '${USER_ENGINEER2_ID}', '${USER_MANAGER2_ID}', '${toTimestamp(monthsAgo(6))}', '${toTimestamp(monthsAgo(6))}', 'SPEAG 교정 결과 반영'),
        ('${CF_004_ID}', '${EQUIP_OSCILLOSCOPE_SHARED_ID}', '${CALIB_007_ID}', 'other', '프로브 보정계수 (10X)', 10.02, 'factor', '${toDate(monthsAgo(1))}', '${toDate(monthsLater(11))}', 'pending', '${USER_ENGINEER_ID}', NULL, '${toTimestamp(monthsAgo(1))}', NULL, NULL),
        ('${CF_005_ID}', '${EQUIP_SIGNAL_GENERATOR_ID}', '${CALIB_002_ID}', 'amplifier_gain', '출력 레벨 보정 (1GHz)', -0.15, 'dB', '${toDate(daysAgo(10))}', NULL, 'pending', '${USER_ENGINEER_ID}', NULL, '${toTimestamp(daysAgo(10))}', NULL, NULL),
        ('${CF_006_ID}', '${EQUIP_NETWORK_ANALYZER_ID}', NULL, 'cable_loss', '포트 케이블 손실 (6GHz)', 5.20, 'dB', '${toDate(monthsAgo(2))}', NULL, 'rejected', '${USER_ENGINEER_ID}', '${USER_MANAGER_ID}', '${toTimestamp(monthsAgo(2))}', '${toTimestamp(monthsAgo(2))}', '장비 부적합 상태로 인해 보정계수 등록 불가. 장비 수리 후 재신청 요망.')
    `);
    console.log('  ✅ 6건 보정계수 기록 생성됨');

    // =========================================================================
    // Phase 12: Non-Conformances (5건)
    // =========================================================================
    console.log('\n⛔ 부적합 기록 생성 중...');
    await client.query(`
      INSERT INTO non_conformances (id, equipment_id, discovery_date, discovered_by, cause, action_plan, correction_content, correction_date, corrected_by, status, closed_by, closed_at, closure_notes) VALUES
        ('${NC_001_ID}', '${EQUIP_NETWORK_ANALYZER_ID}', '${toDate(daysAgo(10))}', '${USER_ENGINEER_ID}', '교정 기한 초과 및 측정 불확도 규격 초과로 인한 부적합', '외부 교정 및 필요시 수리 진행 예정', NULL, NULL, NULL, 'open', NULL, NULL, NULL),
        ('${NC_002_ID}', '${EQUIP_ANTENNA_SYSTEM_ID}', '${toDate(daysAgo(7))}', '${USER_ENGINEER2_ID}', '포지셔너 정밀도 저하로 인한 측정 재현성 문제', '포지셔너 정렬 및 구동부 점검', NULL, NULL, NULL, 'open', NULL, NULL, NULL),
        ('${NC_003_ID}', '${EQUIP_AMPLIFIER_ID}', '${toDate(daysAgo(20))}', '${USER_MANAGER_ID}', '출력 전력 정격 대비 30% 저하', '내부 증폭 소자 교체 필요', '제조사 수리 의뢰 완료 (반출 상태)', '${toDate(daysAgo(7))}', '${USER_MANAGER_ID}', 'corrected', NULL, NULL, NULL),
        ('${NC_004_ID}', '${EQUIP_EMC_RECEIVER_ID}', '${toDate(daysAgo(60))}', '${USER_ENGINEER_ID}', 'RF 입력 커넥터 핀 휨으로 인한 접촉 불량', '커넥터 교체', '커넥터 어셈블리 교체 완료', '${toDate(daysAgo(55))}', '${USER_ENGINEER_ID}', 'closed', '${USER_MANAGER_ID}', '${toTimestamp(daysAgo(54))}', '교체 후 측정 정상 동작 확인'),
        ('${NC_005_ID}', '${EQUIP_POWER_METER_RETIRED_ID}', '${toDate(daysAgo(90))}', '${USER_MANAGER_ID}', '센서 소자 불량으로 측정 불가', '수리 가능 여부 검토', '폐기 처리', '${toDate(daysAgo(85))}', '${USER_ADMIN_ID}', 'closed', '${USER_ADMIN_ID}', '${toTimestamp(daysAgo(84))}', '수리 불가 판정으로 폐기 처리 완료')
    `);
    console.log('  ✅ 5건 부적합 기록 생성됨');

    // =========================================================================
    // 완료 메시지
    // =========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('✨ E2E 테스트 시드 완료!');
    console.log('='.repeat(60));

    console.log('\n📋 시드 데이터 요약:');
    console.log('  ├─ 팀: 4개 (수원 2, 의왕 2)');
    console.log('  ├─ 사용자: 6명 (관리자 2, 기술책임자 2, 실무자 2)');
    console.log('  ├─ 장비: 16개 (수원 10, 의왕 6)');
    console.log('  ├─ 위치 변동 이력: 12건');
    console.log('  ├─ 유지보수 이력: 10건');
    console.log('  ├─ 사고/손상 이력: 10건');
    console.log('  ├─ 교정 기록: 10건');
    console.log('  ├─ 대여 기록: 8건');
    console.log('  ├─ 반출 기록: 10건');
    console.log('  ├─ 반출 항목: 12건');
    console.log('  ├─ 보정계수: 6건');
    console.log('  └─ 부적합 기록: 5건');

    console.log('\n📋 테스트 계정:');
    console.log('  - admin@example.com / admin123 (시험소 관리자, 수원)');
    console.log('  - manager@example.com / manager123 (기술책임자, 수원)');
    console.log('  - user@example.com / user123 (시험실무자, 수원)');
    console.log('  - user1@example.com / user1123 (시험실무자, 의왕)');
    console.log('  - manager2@example.com / manager123 (기술책임자, 의왕)');
    console.log('  - admin2@example.com / admin123 (시험소 관리자, 의왕)');

    console.log('\n📊 장비 상태 분포:');
    console.log('  - available: 6개');
    console.log('  - in_use: 2개');
    console.log('  - checked_out: 2개');
    console.log('  - calibration_scheduled: 1개');
    console.log('  - calibration_overdue: 1개');
    console.log('  - non_conforming: 1개');
    console.log('  - spare: 1개');
    console.log('  - retired: 1개');
    console.log('  - pending_approval: 1개');
  } catch (error) {
    console.error('❌ 시드 실패:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
