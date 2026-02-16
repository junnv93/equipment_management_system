/**
 * E2E 테스트용 포괄적인 시드 스크립트
 *
 * 사용법:
 * 1. 테스트 DB 실행: docker-compose -f docker-compose.test.yml up -d postgres-test
 * 2. 마이그레이션 실행: DATABASE_URL=postgresql://postgres:postgres@localhost:5434/equipment_management_test npx drizzle-kit push
 * 3. 시드 실행: npx ts-node src/database/seed-test.ts
 *
 * 데이터 커버리지:
 * - Teams: 6개 (수원 4개: FCC EMC/RF, General EMC, SAR, Automotive EMC / 의왕 1개: General RF / 평택 1개: Automotive EMC)
 * - Users: 6명 (관리자 2명, 기술책임자 2명, 시험실무자 2명)
 * - Equipment: 16개 (다양한 상태, 사이트, 교정방법)
 * - Equipment History: 위치 변동 12건, 유지보수 10건, 사고 10건
 * - Calibrations: 10건 (다양한 승인 상태)
 * - Loans: 8건 (다양한 상태)
 * - Checkouts: 10건 + Items 12건
 * - Calibration Factors: 6건
 * - Non-Conformances: 5건
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// SSOT: packages/db에서 스키마 import
import {
  teams,
  users,
  equipment,
  equipmentLocationHistory,
  equipmentMaintenanceHistory,
  equipmentIncidentHistory,
  calibrations,
  checkouts,
  checkoutItems,
  calibrationPlans,
  calibrationPlanItems,
} from '@equipment-management/db/schema';

// .env.test 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.test') });

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5434/equipment_management_test';

console.log('🌱 E2E 테스트 데이터베이스 시드 시작...');
console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

// =============================================================================
// 고정 UUID 정의 (테스트 안정성을 위해)
// =============================================================================

// Teams UUID (사이트별 팀 구성)
// ✅ Best Practice: 팀 이름 = 분류 이름 (통일)
// ✅ Azure AD 그룹 Object ID 기반 UUID
// ✅ 분류코드: E(FCC EMC/RF), R(General EMC), W(General RF), S(SAR), A(Automotive EMC), P(Software)

// === 수원 사이트 (SUW) - 4개 팀 ===
const TEAM_FCC_EMC_RF_SUWON_ID = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'; // FCC EMC/RF (E)
const TEAM_GENERAL_EMC_SUWON_ID = 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289'; // General EMC (R)
const TEAM_SAR_SUWON_ID = '7fd28076-fd5e-4d36-b051-bbf8a97b82db'; // SAR (S)
const TEAM_AUTOMOTIVE_EMC_SUWON_ID = 'f0a32655-00f9-4ecd-b43c-af4faed499b6'; // Automotive EMC (A)

// === 의왕 사이트 (UIW) - 1개 팀 ===
const TEAM_GENERAL_RF_UIWANG_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'; // General RF (W) - 의왕 전용

// === 평택 사이트 (PYT) - 1개 팀 ===
const TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID = 'b2c3d4e5-f6a7-4890-bcde-f01234567890'; // Automotive EMC (A)

// Legacy aliases (기존 변수명 호환)
const TEAM_RF_SUWON_ID = TEAM_FCC_EMC_RF_SUWON_ID;
const TEAM_EMC_SUWON_ID = TEAM_GENERAL_EMC_SUWON_ID;
const TEAM_AUTO_SUWON_ID = TEAM_AUTOMOTIVE_EMC_SUWON_ID;
const TEAM_RF_UIWANG_ID = TEAM_GENERAL_RF_UIWANG_ID; // 의왕은 General RF만
const TEAM_SAR_UIWANG_ID = TEAM_GENERAL_RF_UIWANG_ID; // fallback to General RF
const TEAM_EMC_UIWANG_ID = TEAM_GENERAL_RF_UIWANG_ID; // fallback to General RF
const TEAM_ENV_UIWANG_ID = TEAM_GENERAL_RF_UIWANG_ID; // fallback to General RF
const TEAM_AUTO_PYEONGTAEK_ID = TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID;
const TEAM_RF_PYEONGTAEK_ID = TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID; // 평택은 Automotive만

// Users UUID
const USER_ADMIN_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const USER_MANAGER_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
const USER_ENGINEER_ID = '12345678-1234-4567-8901-234567890abc';
const USER_ENGINEER2_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_MANAGER2_ID = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const USER_ADMIN2_ID = 'cccccccc-dddd-eeee-ffff-000000000000';

// Equipment UUID (eeeeXXXX 패턴)
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
const EQUIP_ATTENUATOR_ID = 'eeeebbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EQUIP_TEMP_CHAMBER_ID = 'eeeecccc-cccc-cccc-cccc-cccccccccccc';
const EQUIP_HUMIDITY_TESTER_ID = 'eeeedddd-dddd-dddd-dddd-dddddddddddd';
const EQUIP_CABLE_ANALYZER_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const EQUIP_SAR_PROBE_ID = 'eeeeffff-ffff-ffff-ffff-ffffffffffff';
const EQUIP_SPARE_OSCILLOSCOPE_ID = 'eeee0000-0000-0000-0000-000000000000';
// 추가 장비 (누락된 분류코드 커버: W-General RF, A-Automotive, P-Software)
const EQUIP_RF_ANTENNA_METER_ID = 'eeee1234-1234-1234-1234-123412341234'; // SUW-W0001 General RF
const EQUIP_AUTO_EMC_TESTER_ID = 'eeee5678-5678-5678-5678-567856785678'; // PYT-A0001 Automotive EMC
const EQUIP_EMC_SOFTWARE_ID = 'eeee9012-9012-9012-9012-901290129012'; // SUW-P0001 Software
// 평택 사이트 장비 (신규)
const EQUIP_PYT_FCC_ANALYZER_ID = 'eeeefcc1-fcc1-fcc1-fcc1-fcc1fcc1fcc1'; // PYT-E0001 FCC EMC/RF
const EQUIP_PYT_EMC_RECEIVER_ID = 'eeeefcc2-fcc2-fcc2-fcc2-fcc2fcc2fcc2'; // PYT-R0001 General EMC

// Calibration UUID
const CALIB_001_ID = 'dddd0001-0001-0001-0001-000000000001';
const CALIB_002_ID = 'dddd0002-0002-0002-0002-000000000002';
const CALIB_003_ID = 'dddd0003-0003-0003-0003-000000000003';
const CALIB_004_ID = 'dddd0004-0004-0004-0004-000000000004';
const CALIB_005_ID = 'dddd0005-0005-0005-0005-000000000005';
const CALIB_006_ID = 'dddd0006-0006-0006-0006-000000000006';
const CALIB_007_ID = 'dddd0007-0007-0007-0007-000000000007';
const CALIB_008_ID = 'dddd0008-0008-0008-0008-000000000008';
const CALIB_009_ID = 'dddd0009-0009-0009-0009-000000000009';
const CALIB_010_ID = 'dddd0010-0010-0010-0010-000000000010';

// Checkout UUID
const CHECKOUT_001_ID = 'ffff0001-0001-0001-0001-000000000001';
const CHECKOUT_002_ID = 'ffff0002-0002-0002-0002-000000000002';
const CHECKOUT_003_ID = 'ffff0003-0003-0003-0003-000000000003';
const CHECKOUT_004_ID = 'ffff0004-0004-0004-0004-000000000004';
const CHECKOUT_005_ID = 'ffff0005-0005-0005-0005-000000000005';
const CHECKOUT_006_ID = 'ffff0006-0006-0006-0006-000000000006';
const CHECKOUT_007_ID = 'ffff0007-0007-0007-0007-000000000007';
const CHECKOUT_008_ID = 'ffff0008-0008-0008-0008-000000000008';
const CHECKOUT_009_ID = 'ffff0009-0009-0009-0009-000000000009';
const CHECKOUT_010_ID = 'ffff0010-0010-0010-0010-000000000010';

// Calibration Factor UUID
const CF_001_ID = 'cafe0001-0001-0001-0001-000000000001';
const CF_002_ID = 'cafe0002-0002-0002-0002-000000000002';
const CF_003_ID = 'cafe0003-0003-0003-0003-000000000003';
const CF_004_ID = 'cafe0004-0004-0004-0004-000000000004';
const CF_005_ID = 'cafe0005-0005-0005-0005-000000000005';
const CF_006_ID = 'cafe0006-0006-0006-0006-000000000006';

// Non-Conformance UUID
const NC_001_ID = 'beef0001-0001-0001-0001-000000000001';
const NC_002_ID = 'beef0002-0002-0002-0002-000000000002';
const NC_003_ID = 'beef0003-0003-0003-0003-000000000003';
const NC_004_ID = 'beef0004-0004-0004-0004-000000000004';
const NC_005_ID = 'beef0005-0005-0005-0005-000000000005';

// Calibration Plan UUID (E2E 테스트용 - ca1b 패턴, 16진수만 허용)
const CPLAN_001_ID = 'ca1b0001-0001-0001-0001-000000000001'; // draft
const CPLAN_002_ID = 'ca1b0002-0002-0002-0002-000000000002'; // pending_review
const CPLAN_003_ID = 'ca1b0003-0003-0003-0003-000000000003'; // pending_approval
const CPLAN_004_ID = 'ca1b0004-0004-0004-0004-000000000004'; // approved
const CPLAN_005_ID = 'ca1b0005-0005-0005-0005-000000000005'; // rejected

// Calibration Plan Item UUID (ca1b + item 패턴)
const CPLAN_ITEM_001_ID = 'ca1b1001-0001-0001-0001-000000000001';
const CPLAN_ITEM_002_ID = 'ca1b1002-0002-0002-0002-000000000002';
const CPLAN_ITEM_003_ID = 'ca1b1003-0003-0003-0003-000000000003';
const CPLAN_ITEM_004_ID = 'ca1b1004-0004-0004-0004-000000000004';
const CPLAN_ITEM_005_ID = 'ca1b1005-0005-0005-0005-000000000005';
const CPLAN_ITEM_006_ID = 'ca1b1006-0006-0006-0006-000000000006';
const CPLAN_ITEM_007_ID = 'ca1b1007-0007-0007-0007-000000000007';
const CPLAN_ITEM_008_ID = 'ca1b1008-0008-0008-0008-000000000008';
const CPLAN_ITEM_009_ID = 'ca1b1009-0009-0009-0009-000000000009';
const CPLAN_ITEM_010_ID = 'ca1b1010-0010-0010-0010-000000000010';

// 품질책임자 UUID (auth.controller.ts와 동일)
const QUALITY_MANAGER_ID = '00000000-0000-0000-0000-000000000005';

// =============================================================================
// 날짜 헬퍼 함수
// =============================================================================

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysLater = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const monthsAgo = (months: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
};
const monthsLater = (months: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + months);
  return d;
};

// =============================================================================
// 시드 함수
// =============================================================================

async function seed() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // =========================================================================
    // Phase 0: 기존 데이터 삭제 (외래키 의존성 역순)
    // =========================================================================
    console.log('\n🗑️  기존 테스트 데이터 삭제 중...');

    // Raw SQL로 삭제 (스키마에 없는 테이블 포함)
    await db.execute(sql`DELETE FROM calibration_factors`);
    await db.execute(sql`DELETE FROM non_conformances`);
    await db.execute(sql`DELETE FROM equipment_requests`);
    await db.delete(calibrationPlanItems);
    await db.delete(calibrationPlans);
    await db.delete(checkoutItems);
    await db.delete(checkouts);
    await db.delete(calibrations);
    await db.delete(equipmentIncidentHistory);
    await db.delete(equipmentMaintenanceHistory);
    await db.delete(equipmentLocationHistory);
    await db.delete(equipment);
    await db.delete(users);
    await db.delete(teams);

    console.log('  ✅ 기존 데이터 삭제 완료');

    // =========================================================================
    // Phase 1: Teams (6개)
    // =========================================================================
    console.log('\n👥 팀 생성 중...');
    // ✅ Best Practice: 팀 이름 = 분류 이름 (통일)
    // ✅ 분류코드: E(FCC EMC/RF), R(General EMC), W(General RF), S(SAR), A(Automotive EMC)
    const testTeams = await db
      .insert(teams)
      .values([
        // === 수원 사이트 팀 (4개) - Azure AD 그룹 Object ID 기반 ===
        {
          id: TEAM_FCC_EMC_RF_SUWON_ID,
          name: 'FCC EMC/RF', // ✅ 팀 이름 = 분류 이름
          classification: 'fcc_emc_rf',
          site: 'suwon',
          classificationCode: 'E',
          description: 'FCC EMC/RF 시험 장비 관리',
        },
        {
          id: TEAM_GENERAL_EMC_SUWON_ID,
          name: 'General EMC', // ✅ 팀 이름 = 분류 이름
          classification: 'general_emc',
          site: 'suwon',
          classificationCode: 'R',
          description: 'General EMC 시험 장비 관리',
        },
        {
          id: TEAM_SAR_SUWON_ID,
          name: 'SAR', // ✅ 팀 이름 = 분류 이름
          classification: 'sar',
          site: 'suwon',
          classificationCode: 'S',
          description: 'SAR(전자파 흡수율) 시험 장비 관리',
        },
        {
          id: TEAM_AUTOMOTIVE_EMC_SUWON_ID,
          name: 'Automotive EMC', // ✅ 팀 이름 = 분류 이름
          classification: 'automotive_emc',
          site: 'suwon',
          classificationCode: 'A',
          description: 'Automotive EMC 시험 장비 관리',
        },
        // === 의왕 사이트 팀 (1개) - General RF 전용 ===
        {
          id: TEAM_GENERAL_RF_UIWANG_ID,
          name: 'General RF', // ✅ 팀 이름 = 분류 이름
          classification: 'general_rf',
          site: 'uiwang',
          classificationCode: 'W',
          description: 'General RF 시험 장비 관리 (의왕)',
        },
        // === 평택 사이트 팀 (1개) - Automotive EMC 전용 ===
        {
          id: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
          name: 'Automotive EMC', // ✅ 팀 이름 = 분류 이름
          classification: 'automotive_emc',
          site: 'pyeongtaek',
          classificationCode: 'A',
          description: 'Automotive EMC 시험 장비 관리 (평택)',
        },
      ])
      .returning();
    console.log(`  ✅ ${testTeams.length}개 팀 생성됨 (수원: 4개, 의왕: 1개, 평택: 1개)`);

    // =========================================================================
    // Phase 2: Users (6명)
    // =========================================================================
    console.log('\n👤 테스트 사용자 생성 중...');
    const testUsers = await db
      .insert(users)
      .values([
        // 수원 사이트 사용자
        // === 수원 사이트 사용자 (3명) ===
        {
          id: USER_ADMIN_ID,
          email: 'admin@example.com',
          name: '수원관리자',
          role: 'lab_manager',
          teamId: TEAM_RF_SUWON_ID, // ✅ 수원 RF팀
          site: 'suwon',
          location: '수원랩 관리동',
          position: '시험소장',
        },
        {
          id: USER_MANAGER_ID,
          email: 'manager@example.com',
          name: '수원기술책임자',
          role: 'technical_manager',
          teamId: TEAM_RF_SUWON_ID, // ✅ 수원 RF팀
          site: 'suwon',
          location: '수원랩 RF동',
          position: '기술책임자',
        },
        {
          id: USER_ENGINEER_ID,
          email: 'user@example.com',
          name: '수원시험실무자',
          role: 'test_engineer',
          teamId: TEAM_EMC_SUWON_ID, // ✅ 수원 EMC팀
          site: 'suwon',
          location: '수원랩 EMC동',
          position: '시험원',
        },
        // === 의왕 사이트 사용자 (3명) - 모두 General RF 팀 소속 ===
        {
          id: USER_ENGINEER2_ID,
          email: 'user1@example.com',
          name: '의왕시험실무자',
          role: 'test_engineer',
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ 의왕 General RF팀
          site: 'uiwang',
          location: '의왕랩 RF동',
          position: '시험원',
        },
        {
          id: USER_MANAGER2_ID,
          email: 'manager2@example.com',
          name: '의왕기술책임자',
          role: 'technical_manager',
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ 의왕 General RF팀
          site: 'uiwang',
          location: '의왕랩 RF동',
          position: '기술책임자',
        },
        {
          id: USER_ADMIN2_ID,
          email: 'admin2@example.com',
          name: '의왕관리자',
          role: 'lab_manager',
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ 의왕 General RF팀
          site: 'uiwang',
          location: '의왕랩 관리동',
          position: '시험소장',
        },
      ])
      .returning();
    console.log(`  ✅ ${testUsers.length}명 사용자 생성됨`);

    // =========================================================================
    // Phase 3: Equipment (16개)
    // =========================================================================
    console.log('\n🔧 테스트 장비 생성 중...');
    const testEquipments = await db
      .insert(equipment)
      .values([
        // === 수원 사이트 장비 (10개) ===

        // 1. 스펙트럼 분석기 (available, external_calibration)
        {
          id: EQUIP_SPECTRUM_ANALYZER_ID,
          name: '스펙트럼 분석기',
          managementNumber: 'SUW-E0001',
          assetNumber: 'AST-2023-001',
          site: 'suwon',
          status: 'available',
          modelName: 'N9020A',
          manufacturer: 'Keysight',
          manufacturerContact: '02-1234-5678',
          serialNumber: 'MY12345678',
          location: 'RF시험실 A동',
          initialLocation: 'RF시험실 A동',
          installationDate: monthsAgo(24),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(3),
          nextCalibrationDate: monthsLater(9),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          intermediateCheckCycle: 6,
          lastIntermediateCheckDate: monthsAgo(1),
          nextIntermediateCheckDate: monthsLater(5),
          isShared: false,
          approvalStatus: 'approved',
        },

        // 2. 신호 발생기 (in_use, external_calibration)
        {
          id: EQUIP_SIGNAL_GENERATOR_ID,
          name: '신호 발생기',
          managementNumber: 'SUW-E0002',
          assetNumber: 'AST-2023-002',
          site: 'suwon',
          status: 'in_use',
          modelName: 'N5182B',
          manufacturer: 'Keysight',
          manufacturerContact: '02-1234-5678',
          serialNumber: 'MY23456789',
          location: 'RF시험실 B동',
          initialLocation: 'RF시험실 B동',
          installationDate: monthsAgo(18),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(10),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 3. EMC 수신기 (available, external_calibration)
        {
          id: EQUIP_EMC_RECEIVER_ID,
          name: 'EMC 수신기',
          managementNumber: 'SUW-R0001',
          assetNumber: 'AST-2022-005',
          site: 'suwon',
          status: 'available',
          modelName: 'ESR26',
          manufacturer: 'R&S',
          manufacturerContact: '02-9876-5432',
          serialNumber: 'RS34567890',
          location: 'EMC시험실',
          initialLocation: 'EMC시험실',
          installationDate: monthsAgo(36),
          teamId: TEAM_EMC_SUWON_ID,
          managerId: USER_ENGINEER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(4),
          nextCalibrationDate: monthsLater(8),
          calibrationAgency: 'KTC',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 4. 공용 오실로스코프 (available, shared)
        {
          id: EQUIP_OSCILLOSCOPE_SHARED_ID,
          name: '공용 오실로스코프',
          managementNumber: 'SUW-E0003',
          assetNumber: 'AST-2023-003',
          site: 'suwon',
          status: 'available',
          modelName: 'DSOX4024A',
          manufacturer: 'Keysight',
          serialNumber: 'MY56789012',
          location: '공용장비실',
          initialLocation: '공용장비실',
          installationDate: monthsAgo(12),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(6),
          nextCalibrationDate: monthsLater(6),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: true,
          sharedSource: 'safety_lab',
          approvalStatus: 'approved',
        },

        // 5. 네트워크 분석기 (non_conforming)
        {
          id: EQUIP_NETWORK_ANALYZER_ID,
          name: '네트워크 분석기',
          managementNumber: 'SUW-E0004',
          assetNumber: 'AST-2021-010',
          site: 'suwon',
          status: 'non_conforming',
          modelName: 'E5071C',
          manufacturer: 'Keysight',
          serialNumber: 'MY78901234',
          location: 'RF시험실 A동',
          initialLocation: 'RF시험실 A동',
          installationDate: monthsAgo(48),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(14),
          nextCalibrationDate: monthsAgo(2), // 교정 기한 초과
          calibrationAgency: 'HCT',
          specMatch: 'mismatch',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 6. 파워미터 (retired)
        {
          id: EQUIP_POWER_METER_RETIRED_ID,
          name: '파워미터 (폐기)',
          managementNumber: 'SUW-E0005',
          assetNumber: 'AST-2018-015',
          site: 'suwon',
          status: 'retired',
          modelName: 'U2001A',
          manufacturer: 'Keysight',
          serialNumber: 'MY89012345',
          location: '폐기장비실',
          initialLocation: 'RF시험실 A동',
          installationDate: monthsAgo(72),
          teamId: TEAM_RF_SUWON_ID,
          calibrationMethod: 'not_applicable',
          isShared: false,
          isActive: false,
          approvalStatus: 'approved',
        },

        // 7. 파워미터 신규 (pending_approval)
        {
          id: EQUIP_POWER_METER_NEW_ID,
          name: '파워미터 신규',
          managementNumber: 'SUW-E0006',
          assetNumber: 'AST-2025-001',
          site: 'suwon',
          status: 'available',
          modelName: 'U2002H',
          manufacturer: 'Keysight',
          serialNumber: 'MY90123456',
          location: 'RF시험실 A동',
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'pending_approval',
          requestedBy: USER_ENGINEER_ID,
        },

        // 8. 증폭기 (checked_out for repair)
        {
          id: EQUIP_AMPLIFIER_ID,
          name: '증폭기',
          managementNumber: 'SUW-E0007',
          assetNumber: 'AST-2022-008',
          site: 'suwon',
          status: 'checked_out',
          modelName: 'ZHL-5W-1',
          manufacturer: 'Mini-Circuits',
          serialNumber: 'MC12345678',
          location: '외부 수리 중',
          initialLocation: 'RF시험실 B동',
          installationDate: monthsAgo(30),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'self_inspection',
          calibrationCycle: 6,
          lastCalibrationDate: monthsAgo(5),
          nextCalibrationDate: monthsLater(1),
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 9. 감쇠기 (calibration_scheduled)
        {
          id: EQUIP_ATTENUATOR_ID,
          name: '가변감쇠기',
          managementNumber: 'SUW-E0008',
          assetNumber: 'AST-2021-012',
          site: 'suwon',
          status: 'calibration_scheduled',
          modelName: 'RCDAT-6000-90',
          manufacturer: 'Mini-Circuits',
          serialNumber: 'MC23456789',
          location: 'RF시험실 A동',
          initialLocation: 'RF시험실 A동',
          installationDate: monthsAgo(40),
          teamId: TEAM_RF_SUWON_ID,
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(11),
          nextCalibrationDate: daysLater(15), // 곧 교정 예정
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 10. 케이블 분석기 (self_inspection, available)
        {
          id: EQUIP_CABLE_ANALYZER_ID,
          name: '케이블 분석기',
          managementNumber: 'SUW-E0009',
          assetNumber: 'AST-2022-020',
          site: 'suwon',
          status: 'available',
          modelName: 'N9912A',
          manufacturer: 'Keysight',
          serialNumber: 'MY01234567',
          location: 'EMC시험실',
          initialLocation: 'EMC시험실',
          installationDate: monthsAgo(20),
          teamId: TEAM_EMC_SUWON_ID,
          managerId: USER_ENGINEER_ID,
          calibrationMethod: 'self_inspection',
          calibrationCycle: 6,
          lastCalibrationDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(4),
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // === 의왕 사이트 장비 (6개) - 모두 General RF(W) 팀 소속 ===

        // 11. RF 시스템 (checked_out for calibration)
        {
          id: EQUIP_SAR_SYSTEM_ID,
          name: 'RF 측정 시스템',
          managementNumber: 'UIW-W0001', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2020-030',
          site: 'uiwang',
          status: 'checked_out',
          modelName: 'DASY6',
          manufacturer: 'SPEAG',
          manufacturerContact: '+41-44-245-9700',
          serialNumber: 'SP45678901',
          location: '외부 교정 중',
          initialLocation: 'RF시험실',
          installationDate: monthsAgo(60),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_MANAGER2_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(11),
          nextCalibrationDate: daysLater(30),
          calibrationAgency: 'SPEAG',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 12. 안테나 측정 시스템 (calibration_overdue)
        {
          id: EQUIP_ANTENNA_SYSTEM_ID,
          name: '안테나 측정 시스템',
          managementNumber: 'UIW-W0002', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2019-025',
          site: 'uiwang',
          status: 'calibration_overdue',
          modelName: 'SA6400',
          manufacturer: 'ETS-Lindgren',
          serialNumber: 'ETS67890123',
          location: 'RF무반향실',
          initialLocation: 'RF무반향실',
          installationDate: monthsAgo(72),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_MANAGER2_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(14),
          nextCalibrationDate: monthsAgo(2), // 교정 초과
          calibrationAgency: 'HCT',
          specMatch: 'mismatch',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 13. RF Probe (in_use)
        {
          id: EQUIP_SAR_PROBE_ID,
          name: 'RF 프로브',
          managementNumber: 'UIW-W0003', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2021-035',
          site: 'uiwang',
          status: 'in_use',
          modelName: 'EX3DV4',
          manufacturer: 'SPEAG',
          serialNumber: 'SP56789012',
          location: 'RF시험실',
          initialLocation: 'RF시험실',
          installationDate: monthsAgo(48),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_MANAGER2_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(6),
          nextCalibrationDate: monthsLater(6),
          calibrationAgency: 'SPEAG',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 14. RF 챔버 (available, not_applicable)
        {
          id: EQUIP_TEMP_CHAMBER_ID,
          name: 'RF 챔버',
          managementNumber: 'UIW-W0004', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2018-040',
          site: 'uiwang',
          status: 'available',
          modelName: 'TH-G-180',
          manufacturer: 'ESPEC',
          serialNumber: 'ESP12345678',
          location: 'RF시험실 A',
          initialLocation: 'RF시험실 A',
          installationDate: monthsAgo(84),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_ADMIN2_ID,
          calibrationMethod: 'not_applicable',
          specMatch: 'match',
          calibrationRequired: 'not_required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 15. RF 테스터 (available)
        {
          id: EQUIP_HUMIDITY_TESTER_ID,
          name: 'RF 테스터',
          managementNumber: 'UIW-W0005', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2019-045',
          site: 'uiwang',
          status: 'available',
          modelName: 'PR-4KPH',
          manufacturer: 'ESPEC',
          serialNumber: 'ESP23456789',
          location: 'RF시험실 B',
          initialLocation: 'RF시험실 B',
          installationDate: monthsAgo(60),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_ADMIN2_ID,
          calibrationMethod: 'self_inspection',
          calibrationCycle: 6,
          lastCalibrationDate: monthsAgo(3),
          nextCalibrationDate: monthsLater(3),
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
        },

        // 16. 여분 오실로스코프 (spare)
        {
          id: EQUIP_SPARE_OSCILLOSCOPE_ID,
          name: '여분 오실로스코프',
          managementNumber: 'UIW-W0006', // ✅ 의왕은 General RF(W)만
          assetNumber: 'AST-2020-050',
          site: 'uiwang',
          status: 'spare',
          modelName: 'DSOX3024T',
          manufacturer: 'Keysight',
          serialNumber: 'MY34567890',
          location: '예비장비 보관실',
          initialLocation: 'RF시험실',
          installationDate: monthsAgo(48),
          teamId: TEAM_GENERAL_RF_UIWANG_ID, // ✅ General RF 팀
          managerId: USER_MANAGER2_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(8),
          nextCalibrationDate: monthsLater(4),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
          // 관리번호 컴포넌트
          siteCode: 'UIW',
          classificationCode: 'W', // ✅ General RF
          managementSerialNumber: 6,
        },

        // === 추가 장비 ===

        // 17. RF 안테나 측정기 (SUW-E0010: FCC EMC/RF)
        {
          id: EQUIP_RF_ANTENNA_METER_ID,
          name: 'RF 안테나 측정기',
          managementNumber: 'SUW-E0010', // ✅ 수원은 E, R, S, A만 (W 없음)
          assetNumber: 'AST-2024-001',
          site: 'suwon',
          status: 'available',
          modelName: 'MS2024B',
          manufacturer: 'Anritsu',
          serialNumber: 'AN12345678',
          location: 'RF시험실 A동',
          initialLocation: 'RF시험실 A동',
          installationDate: monthsAgo(6),
          teamId: TEAM_FCC_EMC_RF_SUWON_ID, // ✅ FCC EMC/RF 팀
          managerId: USER_MANAGER_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(10),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
          // 관리번호 컴포넌트
          siteCode: 'SUW',
          classificationCode: 'E', // ✅ FCC EMC/RF
          managementSerialNumber: 10,
        },

        // 18. Automotive EMC 테스터 (PYT-A0001: Automotive EMC)
        {
          id: EQUIP_AUTO_EMC_TESTER_ID,
          name: '차량용 EMC 시험기',
          managementNumber: 'PYT-A0001',
          assetNumber: 'AST-2024-002',
          site: 'pyeongtaek',
          status: 'available',
          modelName: 'CISPR25-100',
          manufacturer: 'ETS-Lindgren',
          serialNumber: 'ETS98765432',
          location: '차량 EMC 시험실',
          initialLocation: '차량 EMC 시험실',
          installationDate: monthsAgo(3),
          teamId: TEAM_AUTO_PYEONGTAEK_ID,
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(1),
          nextCalibrationDate: monthsLater(11),
          calibrationAgency: 'KATRI',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
          // 관리번호 컴포넌트
          siteCode: 'PYT',
          classificationCode: 'A',
          managementSerialNumber: 1,
        },

        // 19. EMC 분석 소프트웨어 (SUW-P0001: Software Program)
        {
          id: EQUIP_EMC_SOFTWARE_ID,
          name: 'EMC 분석 소프트웨어',
          managementNumber: 'SUW-P0001',
          assetNumber: 'AST-2024-003',
          site: 'suwon',
          status: 'available',
          modelName: 'EMC32',
          manufacturer: 'R&S',
          location: 'EMC시험실 서버',
          teamId: TEAM_EMC_SUWON_ID,
          managerId: USER_ENGINEER_ID,
          calibrationMethod: 'not_applicable',
          specMatch: 'match',
          calibrationRequired: 'not_required',
          isShared: false,
          approvalStatus: 'approved',
          softwareName: 'EMC32',
          softwareType: 'measurement',
          softwareVersion: 'v10.50',
          // 관리번호 컴포넌트
          siteCode: 'SUW',
          classificationCode: 'P',
          managementSerialNumber: 1,
        },

        // === 평택 사이트 장비 (모두 Automotive EMC) ===

        // 20. 차량용 RF 분석기 (PYT-A0002: Automotive EMC)
        {
          id: EQUIP_PYT_FCC_ANALYZER_ID,
          name: '차량용 RF 분석기',
          managementNumber: 'PYT-A0002', // ✅ 평택은 Automotive EMC(A)만
          assetNumber: 'AST-2024-004',
          site: 'pyeongtaek',
          status: 'available',
          modelName: 'FSVA3030',
          manufacturer: 'R&S',
          serialNumber: 'RS12309876',
          location: '차량 EMC 시험실',
          initialLocation: '차량 EMC 시험실',
          installationDate: monthsAgo(2),
          teamId: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID, // ✅ Automotive EMC 팀
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(1),
          nextCalibrationDate: monthsLater(11),
          calibrationAgency: 'HCT',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
          // 관리번호 컴포넌트
          siteCode: 'PYT',
          classificationCode: 'A', // ✅ Automotive EMC
          managementSerialNumber: 2,
        },

        // 21. 차량용 EMC 수신기 (PYT-A0003: Automotive EMC)
        {
          id: EQUIP_PYT_EMC_RECEIVER_ID,
          name: '차량용 EMC 수신기',
          managementNumber: 'PYT-A0003', // ✅ 평택은 Automotive EMC(A)만
          assetNumber: 'AST-2024-005',
          site: 'pyeongtaek',
          status: 'in_use',
          modelName: 'ESRP3',
          manufacturer: 'R&S',
          serialNumber: 'RS45678901',
          location: '차량 EMC 시험실',
          initialLocation: '차량 EMC 시험실',
          installationDate: monthsAgo(4),
          teamId: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID, // ✅ Automotive EMC 팀
          calibrationMethod: 'external_calibration',
          calibrationCycle: 12,
          lastCalibrationDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(10),
          calibrationAgency: 'KATRI',
          specMatch: 'match',
          calibrationRequired: 'required',
          isShared: false,
          approvalStatus: 'approved',
          // 관리번호 컴포넌트
          siteCode: 'PYT',
          classificationCode: 'A', // ✅ Automotive EMC
          managementSerialNumber: 3,
        },
      ])
      .returning();
    console.log(`  ✅ ${testEquipments.length}개 장비 생성됨`);

    // =========================================================================
    // Phase 4: Equipment Location History (12건)
    // =========================================================================
    console.log('\n📍 장비 위치 변동 이력 생성 중...');
    const locationHistoryData = await db
      .insert(equipmentLocationHistory)
      .values([
        // 스펙트럼 분석기 위치 변동
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          changedAt: monthsAgo(12),
          newLocation: 'RF시험실 B동',
          notes: '시험실 리모델링으로 인한 임시 이동',
          changedBy: USER_MANAGER_ID,
        },
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          changedAt: monthsAgo(6),
          newLocation: 'RF시험실 A동',
          notes: '원위치 복귀',
          changedBy: USER_MANAGER_ID,
        },
        // 네트워크 분석기 위치 변동
        {
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          changedAt: monthsAgo(24),
          newLocation: 'EMC시험실',
          notes: 'EMC팀 지원 목적 임시 이동',
          changedBy: USER_ENGINEER_ID,
        },
        {
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          changedAt: monthsAgo(18),
          newLocation: 'RF시험실 A동',
          notes: '원위치 복귀',
          changedBy: USER_MANAGER_ID,
        },
        // SAR 시스템 위치 변동
        {
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          changedAt: monthsAgo(36),
          newLocation: '환경시험실',
          notes: '온습도 특성 시험 지원',
          changedBy: USER_MANAGER2_ID,
        },
        {
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          changedAt: monthsAgo(30),
          newLocation: 'SAR시험실',
          notes: '원위치 복귀',
          changedBy: USER_MANAGER2_ID,
        },
        // 공용 오실로스코프 위치 변동 (많은 이동)
        {
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          changedAt: monthsAgo(10),
          newLocation: 'RF시험실 A동',
          notes: 'RF팀 시험 지원',
          changedBy: USER_ENGINEER_ID,
        },
        {
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          changedAt: monthsAgo(8),
          newLocation: 'EMC시험실',
          notes: 'EMC팀 시험 지원',
          changedBy: USER_ENGINEER_ID,
        },
        {
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          changedAt: monthsAgo(5),
          newLocation: '공용장비실',
          notes: '원위치 복귀',
          changedBy: USER_MANAGER_ID,
        },
        // 여분 오실로스코프
        {
          equipmentId: EQUIP_SPARE_OSCILLOSCOPE_ID,
          changedAt: monthsAgo(24),
          newLocation: 'RF무반향실',
          notes: '임시 사용',
          changedBy: USER_ENGINEER2_ID,
        },
        {
          equipmentId: EQUIP_SPARE_OSCILLOSCOPE_ID,
          changedAt: monthsAgo(12),
          newLocation: '예비장비 보관실',
          notes: '여분 장비로 전환',
          changedBy: USER_MANAGER2_ID,
        },
        // 파워미터 폐기 전 이동
        {
          equipmentId: EQUIP_POWER_METER_RETIRED_ID,
          changedAt: monthsAgo(6),
          newLocation: '폐기장비실',
          notes: '폐기 처리를 위한 이동',
          changedBy: USER_ADMIN_ID,
        },
      ])
      .returning();
    console.log(`  ✅ ${locationHistoryData.length}건 위치 변동 이력 생성됨`);

    // =========================================================================
    // Phase 5: Equipment Maintenance History (10건)
    // =========================================================================
    console.log('\n🔧 장비 유지보수 이력 생성 중...');
    const maintenanceHistoryData = await db
      .insert(equipmentMaintenanceHistory)
      .values([
        // 스펙트럼 분석기
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          performedAt: monthsAgo(6),
          content: '연간 정기 점검: 필터 청소, 케이블 점검, 소프트웨어 업데이트',
          performedBy: USER_MANAGER_ID,
        },
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          performedAt: monthsAgo(1),
          content: '팬 소음 발생으로 팬 베어링 교체',
          performedBy: USER_MANAGER_ID,
        },
        // 신호 발생기
        {
          equipmentId: EQUIP_SIGNAL_GENERATOR_ID,
          performedAt: monthsAgo(8),
          content: '출력 레벨 보정 및 내부 기준 신호 점검',
          performedBy: USER_MANAGER_ID,
        },
        // EMC 수신기
        {
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          performedAt: monthsAgo(4),
          content: '프리앰프 정기 점검 및 필터 교체',
          performedBy: USER_ENGINEER_ID,
        },
        // 네트워크 분석기
        {
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          performedAt: monthsAgo(10),
          content: '포트 커넥터 마모로 인한 교체 작업',
          performedBy: USER_MANAGER_ID,
        },
        // SAR 시스템
        {
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          performedAt: monthsAgo(6),
          content: '로봇 암 정밀도 점검 및 윤활유 교체',
          performedBy: USER_MANAGER2_ID,
        },
        {
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          performedAt: monthsAgo(2),
          content: '팬텀 용액 교체 및 센서 청소',
          performedBy: USER_ENGINEER2_ID,
        },
        // 온도 챔버
        {
          equipmentId: EQUIP_TEMP_CHAMBER_ID,
          performedAt: monthsAgo(3),
          content: '냉매 보충 및 압축기 점검',
          performedBy: USER_ADMIN2_ID,
        },
        // 안테나 측정 시스템
        {
          equipmentId: EQUIP_ANTENNA_SYSTEM_ID,
          performedAt: monthsAgo(8),
          content: '포지셔너 정렬 및 케이블 점검',
          performedBy: USER_MANAGER2_ID,
        },
        // 증폭기
        {
          equipmentId: EQUIP_AMPLIFIER_ID,
          performedAt: monthsAgo(4),
          content: '출력 전력 저하로 인한 점검 (수리 필요 판정)',
          performedBy: USER_MANAGER_ID,
        },
      ])
      .returning();
    console.log(`  ✅ ${maintenanceHistoryData.length}건 유지보수 이력 생성됨`);

    // =========================================================================
    // Phase 6: Equipment Incident History (10건)
    // =========================================================================
    console.log('\n⚠️ 장비 사고/손상 이력 생성 중...');
    const incidentHistoryData = await db
      .insert(equipmentIncidentHistory)
      .values([
        // 네트워크 분석기 - 부적합 원인
        {
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          occurredAt: monthsAgo(3),
          incidentType: 'malfunction',
          content: '측정 결과 불안정: 교정 기한 초과로 인한 정확도 저하 발견',
          reportedBy: USER_ENGINEER_ID,
        },
        // 스펙트럼 분석기
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          occurredAt: monthsAgo(8),
          incidentType: 'damage',
          content: '외부 케이스 경미한 손상 (운반 중 충격)',
          reportedBy: USER_ENGINEER_ID,
        },
        {
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          occurredAt: monthsAgo(7),
          incidentType: 'repair',
          content: '외부 케이스 손상 수리 완료',
          reportedBy: USER_MANAGER_ID,
        },
        // 증폭기
        {
          equipmentId: EQUIP_AMPLIFIER_ID,
          occurredAt: monthsAgo(2),
          incidentType: 'malfunction',
          content: '출력 전력 정격 대비 30% 저하 발생',
          reportedBy: USER_MANAGER_ID,
        },
        // SAR 시스템
        {
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          occurredAt: monthsAgo(12),
          incidentType: 'change',
          content: '제어 소프트웨어 버전 업그레이드 (v5.0 → v6.0)',
          reportedBy: USER_MANAGER2_ID,
        },
        // 안테나 측정 시스템
        {
          equipmentId: EQUIP_ANTENNA_SYSTEM_ID,
          occurredAt: monthsAgo(4),
          incidentType: 'malfunction',
          content: '포지셔너 구동 오류 발생 (모터 이상)',
          reportedBy: USER_ENGINEER2_ID,
        },
        {
          equipmentId: EQUIP_ANTENNA_SYSTEM_ID,
          occurredAt: monthsAgo(3),
          incidentType: 'repair',
          content: '포지셔너 모터 교체 완료',
          reportedBy: USER_MANAGER2_ID,
        },
        // 파워미터 (폐기 전)
        {
          equipmentId: EQUIP_POWER_METER_RETIRED_ID,
          occurredAt: monthsAgo(8),
          incidentType: 'malfunction',
          content: '센서 불량으로 측정 불가 (수리 불가능 판정)',
          reportedBy: USER_MANAGER_ID,
        },
        // EMC 수신기
        {
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          occurredAt: monthsAgo(10),
          incidentType: 'damage',
          content: 'RF 입력 커넥터 핀 휨 발생',
          reportedBy: USER_ENGINEER_ID,
        },
        {
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          occurredAt: monthsAgo(9),
          incidentType: 'repair',
          content: 'RF 입력 커넥터 교체 완료',
          reportedBy: USER_ENGINEER_ID,
        },
      ])
      .returning();
    console.log(`  ✅ ${incidentHistoryData.length}건 사고/손상 이력 생성됨`);

    // =========================================================================
    // Phase 7: Calibrations (10건)
    // =========================================================================
    console.log('\n📋 교정 기록 생성 중...');
    const calibrationsData = await db
      .insert(calibrations)
      .values([
        // 승인됨 (approved) - 6건
        {
          id: CALIB_001_ID,
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          technicianId: USER_MANAGER_ID,
          status: 'completed',
          calibrationDate: monthsAgo(3),
          completionDate: monthsAgo(3),
          nextCalibrationDate: monthsLater(9),
          agencyName: 'HCT',
          certificateNumber: 'HCT-2024-001234',
          result: 'PASS',
          cost: '350000',
          notes: '정상 교정 완료',
          approvalStatus: 'approved',
          registeredBy: USER_ENGINEER_ID,
          approvedBy: USER_MANAGER_ID,
          registeredByRole: 'test_engineer',
          approverComment: '교정 결과 적합 확인',
        },
        {
          id: CALIB_002_ID,
          equipmentId: EQUIP_SIGNAL_GENERATOR_ID,
          technicianId: USER_MANAGER_ID,
          status: 'completed',
          calibrationDate: monthsAgo(2),
          completionDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(10),
          agencyName: 'HCT',
          certificateNumber: 'HCT-2024-001235',
          result: 'PASS',
          cost: '280000',
          approvalStatus: 'approved',
          registeredBy: USER_MANAGER_ID,
          approvedBy: USER_MANAGER_ID,
          registeredByRole: 'technical_manager',
          registrarComment: '기술책임자 직접 등록',
          approverComment: '자기 승인 (기술책임자 직접 등록)',
        },
        {
          id: CALIB_003_ID,
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          technicianId: USER_ENGINEER_ID,
          status: 'completed',
          calibrationDate: monthsAgo(4),
          completionDate: monthsAgo(4),
          nextCalibrationDate: monthsLater(8),
          agencyName: 'KTC',
          certificateNumber: 'KTC-2024-005678',
          result: 'PASS',
          cost: '420000',
          approvalStatus: 'approved',
          registeredBy: USER_ENGINEER_ID,
          approvedBy: USER_MANAGER_ID,
          registeredByRole: 'test_engineer',
          approverComment: '교정 성적서 확인 완료',
        },
        {
          id: CALIB_004_ID,
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          technicianId: USER_MANAGER2_ID,
          status: 'completed',
          calibrationDate: monthsAgo(11),
          completionDate: monthsAgo(11),
          nextCalibrationDate: daysLater(30),
          agencyName: 'SPEAG',
          certificateNumber: 'SPEAG-2024-0012',
          result: 'PASS',
          cost: '1500000',
          approvalStatus: 'approved',
          registeredBy: USER_ENGINEER2_ID,
          approvedBy: USER_MANAGER2_ID,
          registeredByRole: 'test_engineer',
          approverComment: '본사 교정 결과 확인',
        },
        {
          id: CALIB_005_ID,
          equipmentId: EQUIP_SAR_PROBE_ID,
          technicianId: USER_MANAGER2_ID,
          status: 'completed',
          calibrationDate: monthsAgo(6),
          completionDate: monthsAgo(6),
          nextCalibrationDate: monthsLater(6),
          agencyName: 'SPEAG',
          certificateNumber: 'SPEAG-2024-0034',
          result: 'PASS',
          cost: '800000',
          approvalStatus: 'approved',
          registeredBy: USER_MANAGER2_ID,
          approvedBy: USER_MANAGER2_ID,
          registeredByRole: 'technical_manager',
          registrarComment: '프로브 교정 - 기술책임자 직접 등록',
          approverComment: '교정 결과 양호',
        },
        {
          id: CALIB_006_ID,
          equipmentId: EQUIP_CABLE_ANALYZER_ID,
          technicianId: USER_ENGINEER_ID,
          status: 'completed',
          calibrationDate: monthsAgo(2),
          completionDate: monthsAgo(2),
          nextCalibrationDate: monthsLater(4),
          result: 'PASS',
          notes: '자체 점검 완료',
          approvalStatus: 'approved',
          registeredBy: USER_ENGINEER_ID,
          approvedBy: USER_MANAGER_ID,
          registeredByRole: 'test_engineer',
          approverComment: '자체 점검 기록 확인',
        },
        // 승인 대기 (pending_approval) - 3건
        {
          id: CALIB_007_ID,
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          technicianId: USER_MANAGER_ID,
          status: 'completed',
          calibrationDate: monthsAgo(1),
          completionDate: monthsAgo(1),
          nextCalibrationDate: monthsLater(11),
          agencyName: 'HCT',
          certificateNumber: 'HCT-2025-000100',
          result: 'PASS',
          cost: '250000',
          approvalStatus: 'pending_approval',
          registeredBy: USER_ENGINEER_ID,
          registeredByRole: 'test_engineer',
        },
        {
          id: CALIB_008_ID,
          equipmentId: EQUIP_ATTENUATOR_ID,
          status: 'scheduled',
          calibrationDate: daysLater(15),
          agencyName: 'HCT',
          approvalStatus: 'pending_approval',
          registeredBy: USER_ENGINEER_ID,
          registeredByRole: 'test_engineer',
          notes: '교정 예약 신청',
        },
        {
          id: CALIB_009_ID,
          equipmentId: EQUIP_HUMIDITY_TESTER_ID,
          technicianId: USER_ADMIN2_ID,
          status: 'completed',
          calibrationDate: daysAgo(5),
          completionDate: daysAgo(5),
          nextCalibrationDate: monthsLater(6),
          result: 'PASS',
          notes: '자체 점검 완료 - 승인 대기',
          approvalStatus: 'pending_approval',
          registeredBy: USER_ENGINEER2_ID,
          registeredByRole: 'test_engineer',
        },
        // 반려됨 (rejected) - 1건
        {
          id: CALIB_010_ID,
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          status: 'failed',
          calibrationDate: monthsAgo(2),
          agencyName: 'HCT',
          result: 'FAIL',
          notes: '측정 불확도 규격 초과',
          approvalStatus: 'rejected',
          registeredBy: USER_ENGINEER_ID,
          approvedBy: USER_MANAGER_ID,
          registeredByRole: 'test_engineer',
          rejectionReason: '교정 결과 부적합 - 장비 상태 비정상. 수리 후 재교정 필요.',
        },
      ])
      .returning();
    console.log(`  ✅ ${calibrationsData.length}건 교정 기록 생성됨`);

    // =========================================================================
    // Phase 8: Checkouts (10건)
    // =========================================================================
    console.log('\n🚚 반출 기록 생성 중...');
    const checkoutsData = await db
      .insert(checkouts)
      .values([
        // pending (반출 신청) - 2건
        {
          id: CHECKOUT_001_ID,
          requesterId: USER_ENGINEER_ID,
          purpose: 'calibration',
          checkoutType: 'calibration',
          destination: 'HCT 교정센터',
          reason: '연간 정기 교정',
          expectedReturnDate: daysLater(14),
          status: 'pending',
        },
        {
          id: CHECKOUT_002_ID,
          requesterId: USER_ENGINEER2_ID,
          purpose: 'repair',
          checkoutType: 'repair',
          destination: 'SPEAG Korea',
          reason: '센서 불량 수리',
          expectedReturnDate: daysLater(30),
          status: 'pending',
        },
        // approved (승인됨) - 2건
        {
          id: CHECKOUT_003_ID,
          requesterId: USER_ENGINEER_ID,
          approverId: USER_MANAGER_ID,
          purpose: 'calibration',
          checkoutType: 'calibration',
          destination: 'KTC 교정센터',
          reason: '교정 예정',
          expectedReturnDate: daysLater(10),
          status: 'approved',
          approvedAt: daysAgo(1),
        },
        {
          id: CHECKOUT_004_ID,
          requesterId: USER_MANAGER2_ID,
          approverId: USER_ADMIN2_ID,
          purpose: 'rental',
          checkoutType: 'rental',
          destination: '협력 시험소 A',
          lenderSiteId: 'uiwang',
          phoneNumber: '031-1234-5678',
          address: '경기도 안양시 동안구',
          reason: '시험 장비 대여 (외부)',
          expectedReturnDate: daysLater(21),
          status: 'approved',
          approvedAt: daysAgo(2),
        },
        // checked_out (반출 중) - 3건
        {
          id: CHECKOUT_005_ID,
          requesterId: USER_MANAGER_ID,
          approverId: USER_ADMIN_ID,
          purpose: 'repair',
          checkoutType: 'repair',
          destination: 'Mini-Circuits Korea',
          reason: '출력 전력 저하 수리',
          expectedReturnDate: daysLater(14),
          checkoutDate: daysAgo(7),
          status: 'checked_out',
          approvedAt: daysAgo(8),
        },
        {
          id: CHECKOUT_006_ID,
          requesterId: USER_MANAGER2_ID,
          approverId: USER_ADMIN2_ID,
          purpose: 'calibration',
          checkoutType: 'calibration',
          destination: 'SPEAG Switzerland (본사)',
          reason: 'SAR 시스템 연간 교정',
          expectedReturnDate: daysLater(45),
          checkoutDate: daysAgo(14),
          status: 'checked_out',
          approvedAt: daysAgo(15),
        },
        {
          id: CHECKOUT_007_ID,
          requesterId: USER_ENGINEER_ID,
          approverId: USER_MANAGER_ID,
          purpose: 'rental',
          checkoutType: 'rental',
          destination: '협력 업체 B',
          lenderTeamId: TEAM_RF_SUWON_ID,
          phoneNumber: '02-9876-5432',
          reason: '신제품 시험 지원 (단기)',
          expectedReturnDate: daysLater(7),
          checkoutDate: daysAgo(3),
          status: 'checked_out',
          approvedAt: daysAgo(4),
        },
        // returned (반입 완료) - 2건
        {
          id: CHECKOUT_008_ID,
          requesterId: USER_ENGINEER_ID,
          approverId: USER_MANAGER_ID,
          returnerId: USER_ENGINEER_ID,
          purpose: 'calibration',
          checkoutType: 'calibration',
          destination: 'HCT 교정센터',
          reason: '정기 교정',
          expectedReturnDate: daysAgo(7),
          checkoutDate: daysAgo(21),
          actualReturnDate: daysAgo(8),
          status: 'returned',
          approvedAt: daysAgo(22),
          calibrationChecked: true,
          workingStatusChecked: true,
          inspectionNotes: '교정 성적서 수령 확인, 작동 상태 정상',
        },
        {
          id: CHECKOUT_009_ID,
          requesterId: USER_ENGINEER2_ID,
          approverId: USER_MANAGER2_ID,
          returnerId: USER_ENGINEER2_ID,
          purpose: 'repair',
          checkoutType: 'repair',
          destination: 'SPEAG Korea',
          reason: '프로브 센서 수리',
          expectedReturnDate: daysAgo(3),
          checkoutDate: daysAgo(17),
          actualReturnDate: daysAgo(5),
          status: 'returned',
          approvedAt: daysAgo(18),
          repairChecked: true,
          workingStatusChecked: true,
          inspectionNotes: '센서 교체 완료, 정상 작동 확인',
        },
        // return_approved (반입 최종 승인) - 1건
        {
          id: CHECKOUT_010_ID,
          requesterId: USER_ENGINEER_ID,
          approverId: USER_MANAGER_ID,
          returnerId: USER_ENGINEER_ID,
          returnApprovedBy: USER_MANAGER_ID,
          purpose: 'calibration',
          checkoutType: 'calibration',
          destination: 'KTC 교정센터',
          reason: 'EMC 수신기 정기 교정',
          expectedReturnDate: daysAgo(10),
          checkoutDate: daysAgo(24),
          actualReturnDate: daysAgo(12),
          returnApprovedAt: daysAgo(11),
          status: 'return_approved',
          approvedAt: daysAgo(25),
          calibrationChecked: true,
          workingStatusChecked: true,
          inspectionNotes: '교정 완료 확인, 성적서 등록 완료',
        },
      ])
      .returning();
    console.log(`  ✅ ${checkoutsData.length}건 반출 기록 생성됨`);

    // =========================================================================
    // Phase 10: Checkout Items (12건)
    // =========================================================================
    console.log('\n📦 반출 항목 생성 중...');
    const checkoutItemsData = await db
      .insert(checkoutItems)
      .values([
        // CHECKOUT_001 (pending calibration)
        { checkoutId: CHECKOUT_001_ID, equipmentId: EQUIP_ATTENUATOR_ID },
        // CHECKOUT_002 (pending repair)
        { checkoutId: CHECKOUT_002_ID, equipmentId: EQUIP_ANTENNA_SYSTEM_ID },
        // CHECKOUT_003 (approved calibration)
        { checkoutId: CHECKOUT_003_ID, equipmentId: EQUIP_EMC_RECEIVER_ID },
        // CHECKOUT_004 (approved rental)
        { checkoutId: CHECKOUT_004_ID, equipmentId: EQUIP_HUMIDITY_TESTER_ID },
        // CHECKOUT_005 (checked_out repair) - 증폭기
        {
          checkoutId: CHECKOUT_005_ID,
          equipmentId: EQUIP_AMPLIFIER_ID,
          conditionBefore: '출력 전력 정격 대비 30% 저하',
        },
        // CHECKOUT_006 (checked_out calibration) - SAR 시스템
        {
          checkoutId: CHECKOUT_006_ID,
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          conditionBefore: '정상 상태, 연간 정기 교정',
        },
        // CHECKOUT_007 (checked_out rental)
        {
          checkoutId: CHECKOUT_007_ID,
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          conditionBefore: '정상 작동',
        },
        {
          checkoutId: CHECKOUT_007_ID,
          equipmentId: EQUIP_SIGNAL_GENERATOR_ID,
          conditionBefore: '정상 작동',
        },
        // CHECKOUT_008 (returned calibration)
        {
          checkoutId: CHECKOUT_008_ID,
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          conditionBefore: '정상',
          conditionAfter: '교정 완료, 정상',
          inspectionNotes: '교정 성적서 HCT-2025-000100',
        },
        // CHECKOUT_009 (returned repair)
        {
          checkoutId: CHECKOUT_009_ID,
          equipmentId: EQUIP_SAR_PROBE_ID,
          conditionBefore: '센서 응답 불안정',
          conditionAfter: '센서 교체 후 정상',
          inspectionNotes: '수리 보고서 첨부됨',
        },
        // CHECKOUT_010 (return_approved)
        {
          checkoutId: CHECKOUT_010_ID,
          equipmentId: EQUIP_CABLE_ANALYZER_ID,
          conditionBefore: '정상',
          conditionAfter: '교정 완료, 정상',
          inspectionNotes: '자체 점검 완료 확인',
        },
        {
          checkoutId: CHECKOUT_010_ID,
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          conditionBefore: '정상',
          conditionAfter: '교정 완료, 정상',
          inspectionNotes: 'KTC 교정 성적서 등록됨',
        },
      ])
      .returning();
    console.log(`  ✅ ${checkoutItemsData.length}건 반출 항목 생성됨`);

    // =========================================================================
    // Phase 11: Calibration Factors (6건) - Raw SQL 사용
    // =========================================================================
    console.log('\n📊 보정계수 기록 생성 중...');

    // Raw SQL로 보정계수 삽입
    await db.execute(sql`
      INSERT INTO calibration_factors (id, equipment_id, calibration_id, factor_type, factor_name, factor_value, unit, effective_date, expiry_date, approval_status, requested_by, approved_by, requested_at, approved_at, approver_comment)
      VALUES
        (${CF_001_ID}::uuid, ${EQUIP_SPECTRUM_ANALYZER_ID}::uuid, ${CALIB_001_ID}::uuid, 'cable_loss', '3GHz 케이블 손실', 2.35, 'dB', ${monthsAgo(3).toISOString().split('T')[0]}, ${monthsLater(9).toISOString().split('T')[0]}, 'approved', ${USER_ENGINEER_ID}::uuid, ${USER_MANAGER_ID}::uuid, ${monthsAgo(3).toISOString()}, ${monthsAgo(3).toISOString()}, '케이블 손실 보정계수 확인 승인'),
        (${CF_002_ID}::uuid, ${EQUIP_EMC_RECEIVER_ID}::uuid, ${CALIB_003_ID}::uuid, 'path_loss', '30MHz-1GHz 경로 손실', 1.82, 'dB', ${monthsAgo(4).toISOString().split('T')[0]}, ${monthsLater(8).toISOString().split('T')[0]}, 'approved', ${USER_ENGINEER_ID}::uuid, ${USER_MANAGER_ID}::uuid, ${monthsAgo(4).toISOString()}, ${monthsAgo(4).toISOString()}, '경로 손실 측정 결과 적합'),
        (${CF_003_ID}::uuid, ${EQUIP_SAR_PROBE_ID}::uuid, ${CALIB_005_ID}::uuid, 'antenna_gain', '프로브 민감도 보정', 0.98, 'factor', ${monthsAgo(6).toISOString().split('T')[0]}, ${monthsLater(6).toISOString().split('T')[0]}, 'approved', ${USER_ENGINEER2_ID}::uuid, ${USER_MANAGER2_ID}::uuid, ${monthsAgo(6).toISOString()}, ${monthsAgo(6).toISOString()}, 'SPEAG 교정 결과 반영'),
        (${CF_004_ID}::uuid, ${EQUIP_OSCILLOSCOPE_SHARED_ID}::uuid, ${CALIB_007_ID}::uuid, 'other', '프로브 보정계수 (10X)', 10.02, 'factor', ${monthsAgo(1).toISOString().split('T')[0]}, ${monthsLater(11).toISOString().split('T')[0]}, 'pending', ${USER_ENGINEER_ID}::uuid, NULL, ${monthsAgo(1).toISOString()}, NULL, NULL),
        (${CF_005_ID}::uuid, ${EQUIP_SIGNAL_GENERATOR_ID}::uuid, ${CALIB_002_ID}::uuid, 'amplifier_gain', '출력 레벨 보정 (1GHz)', -0.15, 'dB', ${daysAgo(10).toISOString().split('T')[0]}, NULL, 'pending', ${USER_ENGINEER_ID}::uuid, NULL, ${daysAgo(10).toISOString()}, NULL, NULL),
        (${CF_006_ID}::uuid, ${EQUIP_NETWORK_ANALYZER_ID}::uuid, NULL, 'cable_loss', '포트 케이블 손실 (6GHz)', 5.20, 'dB', ${monthsAgo(2).toISOString().split('T')[0]}, NULL, 'rejected', ${USER_ENGINEER_ID}::uuid, ${USER_MANAGER_ID}::uuid, ${monthsAgo(2).toISOString()}, ${monthsAgo(2).toISOString()}, '장비 부적합 상태로 인해 보정계수 등록 불가. 장비 수리 후 재신청 요망.')
    `);
    const calibrationFactorsCount = 6;
    console.log(`  ✅ ${calibrationFactorsCount}건 보정계수 기록 생성됨`);

    // =========================================================================
    // Phase 12: Non-Conformances (5건) - Raw SQL 사용
    // =========================================================================
    console.log('\n⛔ 부적합 기록 생성 중...');

    // Raw SQL로 부적합 기록 삽입 (nc_type 필수)
    await db.execute(sql`
      INSERT INTO non_conformances (id, equipment_id, nc_type, discovery_date, discovered_by, cause, action_plan, analysis_content, correction_content, correction_date, corrected_by, status, closed_by, closed_at, closure_notes)
      VALUES
        (${NC_001_ID}::uuid, ${EQUIP_NETWORK_ANALYZER_ID}::uuid, 'calibration_failure', ${daysAgo(10).toISOString().split('T')[0]}, ${USER_ENGINEER_ID}::uuid, '교정 기한 초과 및 측정 불확도 규격 초과로 인한 부적합', '외부 교정 및 필요시 수리 진행 예정', NULL, NULL, NULL, NULL, 'open', NULL, NULL, NULL),
        (${NC_002_ID}::uuid, ${EQUIP_ANTENNA_SYSTEM_ID}::uuid, 'malfunction', ${daysAgo(7).toISOString().split('T')[0]}, ${USER_ENGINEER2_ID}::uuid, '포지셔너 정밀도 저하로 인한 측정 재현성 문제', '포지셔너 정렬 및 구동부 점검', '모터 백래시 증가로 인한 위치 정밀도 저하 확인', NULL, NULL, NULL, 'analyzing', NULL, NULL, NULL),
        (${NC_003_ID}::uuid, ${EQUIP_AMPLIFIER_ID}::uuid, 'malfunction', ${daysAgo(20).toISOString().split('T')[0]}, ${USER_MANAGER_ID}::uuid, '출력 전력 정격 대비 30% 저하', '내부 증폭 소자 교체 필요', '내부 FET 소자 열화로 판단', '제조사 수리 의뢰 완료 (반출 상태)', ${daysAgo(7).toISOString().split('T')[0]}, ${USER_MANAGER_ID}::uuid, 'corrected', NULL, NULL, NULL),
        (${NC_004_ID}::uuid, ${EQUIP_EMC_RECEIVER_ID}::uuid, 'damage', ${daysAgo(60).toISOString().split('T')[0]}, ${USER_ENGINEER_ID}::uuid, 'RF 입력 커넥터 핀 휨으로 인한 접촉 불량', '커넥터 교체', '잦은 케이블 연결/분리로 인한 핀 마모', '커넥터 어셈블리 교체 완료', ${daysAgo(55).toISOString().split('T')[0]}, ${USER_ENGINEER_ID}::uuid, 'closed', ${USER_MANAGER_ID}::uuid, ${daysAgo(54).toISOString()}, '교체 후 측정 정상 동작 확인'),
        (${NC_005_ID}::uuid, ${EQUIP_POWER_METER_RETIRED_ID}::uuid, 'malfunction', ${daysAgo(90).toISOString().split('T')[0]}, ${USER_MANAGER_ID}::uuid, '센서 소자 불량으로 측정 불가', '수리 가능 여부 검토', '센서 모듈 내부 회로 손상, 부품 단종으로 수리 불가', '폐기 처리', ${daysAgo(85).toISOString().split('T')[0]}, ${USER_ADMIN_ID}::uuid, 'closed', ${USER_ADMIN_ID}::uuid, ${daysAgo(84).toISOString()}, '수리 불가 판정으로 폐기 처리 완료')
    `);
    const nonConformancesCount = 5;
    console.log(`  ✅ ${nonConformancesCount}건 부적합 기록 생성됨`);

    // =========================================================================
    // Phase 13: Calibration Plans (5건) - E2E 테스트용
    // =========================================================================
    console.log('\n📋 교정계획서 생성 중...');

    const calibrationPlansData = await db
      .insert(calibrationPlans)
      .values([
        // 1. draft - 작성 중 (2026년, 수원)
        {
          id: CPLAN_001_ID,
          year: 2026,
          siteId: 'suwon',
          status: 'draft',
          createdBy: USER_MANAGER_ID, // 기술책임자
          createdAt: daysAgo(5),
          updatedAt: daysAgo(5),
        },
        // 2. pending_review - 검토 대기 (2026년, 수원)
        {
          id: CPLAN_002_ID,
          year: 2026,
          siteId: 'uiwang', // 의왕으로 변경 (수원 2026년 중복 방지)
          status: 'pending_review',
          createdBy: USER_MANAGER2_ID, // 의왕 기술책임자
          submittedAt: new Date('2026-01-20'),
          createdAt: daysAgo(10),
          updatedAt: daysAgo(9),
        },
        // 3. pending_approval - 승인 대기 (2026년, 평택)
        {
          id: CPLAN_003_ID,
          year: 2026,
          siteId: 'pyeongtaek',
          status: 'pending_approval',
          createdBy: USER_MANAGER_ID, // 작성자
          submittedAt: new Date('2026-01-15'),
          reviewedBy: QUALITY_MANAGER_ID, // 품질책임자
          reviewedAt: new Date('2026-01-18'),
          reviewComment: '검토 완료, 승인 요청합니다.',
          createdAt: daysAgo(15),
          updatedAt: daysAgo(11),
        },
        // 4. approved - 승인됨 (2025년, 수원)
        {
          id: CPLAN_004_ID,
          year: 2025,
          siteId: 'suwon',
          status: 'approved',
          createdBy: USER_MANAGER_ID, // 기술책임자
          submittedAt: new Date('2025-01-10'),
          reviewedBy: QUALITY_MANAGER_ID, // 품질책임자
          reviewedAt: new Date('2025-01-12'),
          reviewComment: '적합',
          approvedBy: USER_ADMIN_ID, // 시험소장
          approvedAt: new Date('2025-01-15'),
          createdAt: new Date('2025-01-05'),
          updatedAt: new Date('2025-01-15'),
        },
        // 5. rejected - 반려됨 (2024년, 수원 - 검토 단계에서 반려)
        {
          id: CPLAN_005_ID,
          year: 2024,
          siteId: 'suwon',
          status: 'rejected',
          createdBy: USER_MANAGER_ID, // 기술책임자
          submittedAt: new Date('2024-01-05'),
          rejectedBy: QUALITY_MANAGER_ID, // 품질책임자가 반려
          rejectedAt: new Date('2024-01-08'),
          rejectionReason: '교정 일자 재검토 필요. 3월 예정 장비가 2월로 잘못 입력되었습니다.',
          rejectionStage: 'review',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-08'),
        },
      ])
      .returning();
    console.log(`  ✅ ${calibrationPlansData.length}건 교정계획서 생성됨`);

    // =========================================================================
    // Phase 14: Calibration Plan Items (10건)
    // =========================================================================
    console.log('\n📦 교정계획서 항목 생성 중...');

    const calibrationPlanItemsData = await db
      .insert(calibrationPlanItems)
      .values([
        // CPLAN_001 (draft) - 2개 항목
        {
          id: CPLAN_ITEM_001_ID,
          planId: CPLAN_001_ID,
          equipmentId: EQUIP_SPECTRUM_ANALYZER_ID,
          sequenceNumber: 1,
          snapshotValidityDate: monthsAgo(3),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'HCT',
          plannedCalibrationDate: monthsLater(9),
          plannedCalibrationAgency: 'HCT',
        },
        {
          id: CPLAN_ITEM_002_ID,
          planId: CPLAN_001_ID,
          equipmentId: EQUIP_SIGNAL_GENERATOR_ID,
          sequenceNumber: 2,
          snapshotValidityDate: monthsAgo(2),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'HCT',
          plannedCalibrationDate: monthsLater(10),
          plannedCalibrationAgency: 'HCT',
        },
        // CPLAN_002 (pending_review) - 2개 항목
        {
          id: CPLAN_ITEM_003_ID,
          planId: CPLAN_002_ID,
          equipmentId: EQUIP_SAR_SYSTEM_ID,
          sequenceNumber: 1,
          snapshotValidityDate: monthsAgo(11),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'SPEAG',
          plannedCalibrationDate: monthsLater(1),
          plannedCalibrationAgency: 'SPEAG',
        },
        {
          id: CPLAN_ITEM_004_ID,
          planId: CPLAN_002_ID,
          equipmentId: EQUIP_SAR_PROBE_ID,
          sequenceNumber: 2,
          snapshotValidityDate: monthsAgo(6),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'SPEAG',
          plannedCalibrationDate: monthsLater(6),
          plannedCalibrationAgency: 'SPEAG',
        },
        // CPLAN_003 (pending_approval) - 2개 항목
        {
          id: CPLAN_ITEM_005_ID,
          planId: CPLAN_003_ID,
          equipmentId: EQUIP_AUTO_EMC_TESTER_ID,
          sequenceNumber: 1,
          snapshotValidityDate: monthsAgo(1),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'KATRI',
          plannedCalibrationDate: monthsLater(11),
          plannedCalibrationAgency: 'KATRI',
        },
        {
          id: CPLAN_ITEM_006_ID,
          planId: CPLAN_003_ID,
          equipmentId: EQUIP_PYT_FCC_ANALYZER_ID,
          sequenceNumber: 2,
          snapshotValidityDate: monthsAgo(1),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'HCT',
          plannedCalibrationDate: monthsLater(11),
          plannedCalibrationAgency: 'HCT',
        },
        // CPLAN_004 (approved) - 2개 항목 (교정 완료 기록 포함)
        {
          id: CPLAN_ITEM_007_ID,
          planId: CPLAN_004_ID,
          equipmentId: EQUIP_EMC_RECEIVER_ID,
          sequenceNumber: 1,
          snapshotValidityDate: new Date('2024-09-01'),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'KTC',
          plannedCalibrationDate: new Date('2025-09-01'),
          plannedCalibrationAgency: 'KTC',
          actualCalibrationDate: new Date('2025-08-28'), // 실제 교정 완료
          confirmedBy: USER_MANAGER_ID,
          confirmedAt: new Date('2025-01-12'),
        },
        {
          id: CPLAN_ITEM_008_ID,
          planId: CPLAN_004_ID,
          equipmentId: EQUIP_OSCILLOSCOPE_SHARED_ID,
          sequenceNumber: 2,
          snapshotValidityDate: new Date('2024-07-01'),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'HCT',
          plannedCalibrationDate: new Date('2025-07-01'),
          plannedCalibrationAgency: 'HCT',
          actualCalibrationDate: new Date('2025-06-25'), // 실제 교정 완료
          confirmedBy: USER_MANAGER_ID,
          confirmedAt: new Date('2025-01-12'),
        },
        // CPLAN_005 (rejected) - 2개 항목
        {
          id: CPLAN_ITEM_009_ID,
          planId: CPLAN_005_ID,
          equipmentId: EQUIP_NETWORK_ANALYZER_ID,
          sequenceNumber: 1,
          snapshotValidityDate: new Date('2023-12-01'),
          snapshotCalibrationCycle: 12,
          snapshotCalibrationAgency: 'HCT',
          plannedCalibrationDate: new Date('2024-02-01'), // 잘못된 날짜 (반려 사유)
          plannedCalibrationAgency: 'HCT',
          notes: '교정일 재검토 필요 (3월 예정)',
        },
        {
          id: CPLAN_ITEM_010_ID,
          planId: CPLAN_005_ID,
          equipmentId: EQUIP_CABLE_ANALYZER_ID,
          sequenceNumber: 2,
          snapshotValidityDate: new Date('2023-10-01'),
          snapshotCalibrationCycle: 6,
          plannedCalibrationDate: new Date('2024-04-01'),
        },
      ])
      .returning();
    console.log(`  ✅ ${calibrationPlanItemsData.length}건 교정계획서 항목 생성됨`);

    // =========================================================================
    // 완료 메시지
    // =========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('✨ E2E 테스트 시드 완료!');
    console.log('='.repeat(60));

    console.log('\n📋 시드 데이터 요약:');
    console.log(`  ├─ 팀: ${testTeams.length}개 (수원 3, 의왕 4, 평택 2)`);
    console.log(`  ├─ 사용자: ${testUsers.length}명 (관리자 2, 기술책임자 2, 실무자 2)`);
    console.log(`  ├─ 장비: ${testEquipments.length}개 (수원 11, 의왕 6, 평택 4)`);
    console.log(`  ├─ 위치 변동 이력: ${locationHistoryData.length}건`);
    console.log(`  ├─ 유지보수 이력: ${maintenanceHistoryData.length}건`);
    console.log(`  ├─ 사고/손상 이력: ${incidentHistoryData.length}건`);
    console.log(`  ├─ 교정 기록: ${calibrationsData.length}건`);
    console.log(`  ├─ 반출 기록: ${checkoutsData.length}건`);
    console.log(`  ├─ 반출 항목: ${checkoutItemsData.length}건`);
    console.log(`  ├─ 보정계수: ${calibrationFactorsCount}건`);
    console.log(`  ├─ 부적합 기록: ${nonConformancesCount}건`);
    console.log(`  ├─ 교정계획서: ${calibrationPlansData.length}건`);
    console.log(`  └─ 교정계획서 항목: ${calibrationPlanItemsData.length}건`);

    console.log('\n📊 교정계획서 상태별 분포:');
    console.log('  - draft (작성 중): 1건 - 2026년 수원');
    console.log('  - pending_review (검토 대기): 1건 - 2026년 의왕');
    console.log('  - pending_approval (승인 대기): 1건 - 2026년 평택');
    console.log('  - approved (승인됨): 1건 - 2025년 수원');
    console.log('  - rejected (반려됨): 1건 - 2024년 수원');

    console.log('\n📊 분류코드별 장비 분포:');
    console.log('  - E (FCC EMC/RF): SUW-E0001~E0009, PYT-E0001');
    console.log('  - R (General EMC): SUW-R0001, PYT-R0001');
    console.log('  - W (General RF): SUW-W0001');
    console.log('  - S (SAR): UIW-S0001~S0002');
    console.log('  - A (Automotive EMC): PYT-A0001');
    console.log('  - P (Software): SUW-P0001');

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
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
