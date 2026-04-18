/**
 * Comprehensive E2E Test Seed Data - Phase 1~4 (COMPLETE)
 * ======================================================
 *
 * Usage:
 *   pnpm --filter backend run db:seed
 *
 * Phase 1: Teams (7), Users (16), Equipment (36), Calibrations (18), NC (10)
 * Phase 2: Repair History (8), Calibration Factors (12), Checkouts (68), Cal Plans (6+12)
 * Phase 3: Disposal Equipment (21), Disposal Requests (15)
 * Phase 4: Software History (8), Location History (10), Maintenance History (10),
 *          Incident History (10), Equipment Requests (6), Attachments (6), Audit Logs (20)
 *
 * Total Records: ~300+
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Database schema
import * as schema from '@equipment-management/db/schema';

// Phase 1 seed data modules (IMPLEMENTED)
import { TEAMS_SEED_DATA } from './seed-data/core/teams.seed';
import { USERS_SEED_DATA } from './seed-data/core/users.seed';
import { EQUIPMENT_SEED_DATA } from './seed-data/core/equipment.seed';
import { CALIBRATIONS_SEED_DATA } from './seed-data/calibration/calibrations.seed';
import { NON_CONFORMANCES_SEED_DATA } from './seed-data/operations/non-conformances.seed';
// form_templates는 main.ts의 seedFromFilesystem이 docs/procedure/template/의 실제 파일로 시드함.
// placeholder seed는 다운로드 시 ENOENT를 일으키므로 제거됨.

// Phase 2 seed data modules (IMPLEMENTED)
import { REPAIR_HISTORY_SEED_DATA } from './seed-data/operations/repair-history.seed';
import {
  SELF_INSPECTIONS_SEED_DATA,
  SELF_INSPECTION_ITEMS_SEED_DATA,
} from './seed-data/operations/self-inspections.seed';
import {
  INTERMEDIATE_INSPECTIONS_SEED_DATA,
  INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA,
  INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA,
  INSPECTION_RESULT_SECTIONS_SEED_DATA,
} from './seed-data/operations/intermediate-inspections.seed';
import { CALIBRATION_FACTORS_SEED_DATA } from './seed-data/calibration/calibration-factors.seed';
import {
  CHECKOUTS_SEED_DATA,
  CHECKOUT_ITEMS_SEED_DATA,
} from './seed-data/operations/checkouts.seed';
import { EQUIPMENT_IMPORTS_SEED_DATA } from './seed-data/operations/equipment-imports.seed';

// Phase 2 seed data modules
import {
  CALIBRATION_PLANS_SEED_DATA,
  CALIBRATION_PLAN_ITEMS_SEED_DATA,
} from './seed-data/calibration/calibration-plans.seed';

// Phase 3 seed data modules (Disposal E2E tests)
import { DISPOSAL_EQUIPMENT_SEED_DATA } from './seed-data/disposal/disposal-equipment.seed';
import { DISPOSAL_REQUESTS_SEED_DATA } from './seed-data/disposal/disposal-requests.seed';

// Phase 4 seed data modules (History & Admin)
import { LOCATION_HISTORY_SEED_DATA } from './seed-data/history/location-history.seed';
import { MAINTENANCE_HISTORY_SEED_DATA } from './seed-data/history/maintenance-history.seed';
import { INCIDENT_HISTORY_SEED_DATA } from './seed-data/history/incident-history.seed';
// Test Software (UL-QP-18-07 관리대장) seed data
import { TEST_SOFTWARE_SEED_DATA } from './seed-data/software/test-software.seed';
// Software Validations (UL-QP-18-09) seed data
import { SOFTWARE_VALIDATIONS_SEED_DATA } from './seed-data/software/software-validations.seed';
// Equipment ↔ Test Software M:N links
import { EQUIPMENT_TEST_SOFTWARE_SEED_DATA } from './seed-data/software/equipment-test-software.seed';
import { EQUIPMENT_REQUESTS_SEED_DATA } from './seed-data/admin/equipment-requests.seed';
import { EQUIPMENT_ATTACHMENTS_SEED_DATA } from './seed-data/admin/equipment-attachments.seed';
import {
  EQUIPMENT_DOCUMENTS_SEED_DATA,
  SEED_PLACEHOLDER_PHOTO_PATH,
} from './seed-data/history/equipment-documents.seed';
import { AUDIT_LOGS_SEED_DATA } from './seed-data/admin/audit-logs.seed';
import { NOTIFICATIONS_SEED_DATA } from './seed-data/admin/notifications.seed';

// Signature PNG generation
import { generateSignatureImages } from './seed-data/core/generate-signatures';

// Utilities
import { verifySeed, printVerificationResults } from './utils/verification';

// Load environment — seed는 tsconfig exclude이므로 loadMonorepoEnv 미사용, 직접 cascade
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// DATABASE_URL이 없으면 DB_* 개별 변수로 조합 (resolveDatabaseUrl과 동일 로직)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'equipment_management'}`;

console.log('\n🌱 E2E TEST SEED DATA GENERATION');
console.log('='.repeat(80));
console.log(`📍 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

// =============================================================================
// MAIN SEED EXECUTION
// =============================================================================

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(pool, { schema });

  try {
    // =========================================================================
    // PHASE 0: CLEANUP (Delete in reverse dependency order)
    // =========================================================================
    console.log('\n🧹 Phase 0: Cleaning up existing data...');

    const tables = [
      'audit_logs',
      'notifications',
      'equipment_attachments',
      'equipment_requests',
      'disposal_requests',
      'equipment_incident_history',
      'equipment_maintenance_history',
      'equipment_location_history',
      'equipment_test_software',
      'software_validations',
      'test_software',
      'calibration_factors',
      'repair_history',
      'non_conformances',
      'intermediate_inspection_equipment',
      'inspection_result_sections',
      // form_templates 는 truncate 하지 않는다.
      // main.ts:158 seedFromFilesystem 이 백엔드 부팅 시 docs/procedure/template/ 의 실제 파일로
      // 시드하며, 이후에는 업로드/관리 API 를 통해서만 갱신된다. seed-test-new 는 백엔드 부팅
      // '이후' 에 실행되므로 여기서 truncate 하면 재삽입 경로가 없어 export 테스트가 일괄 실패한다
      // (FORM_TEMPLATE_NOT_FOUND). 템플릿은 테스트 상태가 아닌 시스템 자원이므로 보존한다.
      'equipment_imports',
      'checkout_items',
      'checkouts',
      'calibration_plan_items',
      'calibration_plans',
      'calibrations',
      'equipment',
      'users',
      'teams',
    ];

    // form_templates 보존:
    // FK `uploaded_by` 는 `ON DELETE SET NULL` 이지만 (migration 0008), PostgreSQL 의
    // `TRUNCATE ... CASCADE` 는 FK **action 과 무관하게** 참조 테이블 전체를 전파 truncate 한다
    // (docs: "Automatically truncate all tables that have foreign-key references"). 따라서
    // `TRUNCATE users CASCADE` 는 여전히 form_templates 를 비운다.
    // FK 변경은 런타임 DELETE 경로(관리자 사용자 삭제 → 템플릿 보존) 에 대한 올바른 semantics
    // 이지만, seed TRUNCATE 경로는 별도로 방어해야 하므로 메모리 스냅샷 후 복구한다.
    // main.ts:158 seedFromFilesystem 은 부팅 시에만 실행되므로 재시드 경로가 없다.
    let formTemplatesSnapshot: (typeof schema.formTemplates.$inferSelect)[] = [];
    try {
      formTemplatesSnapshot = await db.select().from(schema.formTemplates);
    } catch {
      // form_templates 테이블이 아직 없으면 (최초 부팅 전) skip
    }

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        console.log(`✓ ${table}`);
      } catch (err: unknown) {
        // Check for PostgreSQL error code 42P01 (relation does not exist)
        // Error can be in err.code or err.cause.code (Drizzle wraps errors)
        const e = err as Record<string, unknown>;
        const cause = e.cause as Record<string, unknown> | undefined;
        const errorCode = e.code || cause?.code;
        const errorMsg =
          (e.message as string | undefined) || (cause?.message as string | undefined) || '';
        if (errorCode === '42P01' || errorMsg.includes('does not exist')) {
          console.log(`⊗ ${table} (not yet created)`);
        } else {
          throw err;
        }
      }
    }

    // form_templates 복구 — FK 는 ON DELETE SET NULL 이므로 복원 시 uploadedBy 도 그대로
    // 유지 가능하지만, 복원된 users 세트가 달라졌을 수 있어 안전하게 NULL 로 재설정한다.
    if (formTemplatesSnapshot.length > 0) {
      await db
        .insert(schema.formTemplates)
        .values(formTemplatesSnapshot.map((row) => ({ ...row, uploadedBy: null })));
      console.log(`  ✓ form_templates 복구 (${formTemplatesSnapshot.length}건, uploaded_by=NULL)`);
    }

    // =========================================================================
    // PHASE 1: CORE ENTITIES (No dependencies)
    // =========================================================================
    console.log('\n📋 Phase 1: Inserting core entities...');

    // Teams
    console.log(`  → Teams (${TEAMS_SEED_DATA.length})`);
    await db.insert(schema.teams).values(TEAMS_SEED_DATA);

    // Users
    console.log(`  → Users (${USERS_SEED_DATA.length})`);
    await db.insert(schema.users).values(USERS_SEED_DATA);

    // Signature PNGs — 물리 파일 생성 후 users.signature_image_path UPDATE
    console.log(`  → Generating signature PNGs (${USERS_SEED_DATA.length})`);
    try {
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const sigUsers = USERS_SEED_DATA.map((u) => ({ id: u.id!, name: u.name }));
      const pathMap = await generateSignatureImages(sigUsers, uploadsDir);
      for (const [userId, sigPath] of pathMap) {
        await db
          .update(schema.users)
          .set({ signatureImagePath: sigPath, updatedAt: new Date() })
          .where(sql`id = ${userId}`);
      }
      console.log(`    ✅ ${pathMap.size}명 서명 이미지 생성 + DB 경로 저장 완료`);
    } catch (err) {
      console.warn(
        `    ⚠️ Signature generation skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // Equipment (32 records)
    console.log('  → Equipment (36)');
    await db.insert(schema.equipment).values(EQUIPMENT_SEED_DATA);

    // =========================================================================
    // PHASE 1B: CALIBRATIONS & PLANS
    // =========================================================================
    console.log('\n📋 Phase 1B: Inserting calibrations & plans...');

    // Calibrations (18 records)
    console.log('  → Calibrations (18)');
    await db.insert(schema.calibrations).values(CALIBRATIONS_SEED_DATA);

    // =========================================================================
    // PHASE 1B: OPERATIONS
    // =========================================================================
    console.log('\n📋 Phase 1B: Inserting operations...');

    // Repair History (8) — non_conformances가 repair_history_id FK를 참조하므로 먼저 삽입
    console.log('  → Repair History (8)');
    await db.insert(schema.repairHistory).values(REPAIR_HISTORY_SEED_DATA);

    // Non-Conformances (10)
    console.log('  → Non-Conformances (10)');
    await db.insert(schema.nonConformances).values(NON_CONFORMANCES_SEED_DATA);

    // Intermediate Inspections (UL-QP-18-03) — calibration FK 필요하므로 calibrations 이후
    console.log(`  → Intermediate Inspections (${INTERMEDIATE_INSPECTIONS_SEED_DATA.length})`);
    await db.insert(schema.intermediateInspections).values(INTERMEDIATE_INSPECTIONS_SEED_DATA);
    await db
      .insert(schema.intermediateInspectionItems)
      .values(INTERMEDIATE_INSPECTION_ITEMS_SEED_DATA);
    await db
      .insert(schema.intermediateInspectionEquipment)
      .values(INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA);
    await db.insert(schema.inspectionResultSections).values(INSPECTION_RESULT_SECTIONS_SEED_DATA);

    // Self Inspections (UL-QP-18-05) — equipment FK만 필요
    console.log('  → Self Inspections (1)');
    await db.insert(schema.equipmentSelfInspections).values(SELF_INSPECTIONS_SEED_DATA);
    await db.insert(schema.selfInspectionItems).values(SELF_INSPECTION_ITEMS_SEED_DATA);

    // Form Templates: main.ts:158 seedFromFilesystem이 백엔드 부팅 시 docs/procedure/template/의
    // 실제 파일로 시드함. placeholder seed는 다운로드 시 ENOENT를 일으켜 제거됨.

    // Calibration Plans & Items (6 plans + 12 items)
    console.log('  → Calibration Plans (6)');
    await db.insert(schema.calibrationPlans).values(CALIBRATION_PLANS_SEED_DATA);
    console.log('  → Calibration Plan Items (12)');
    await db.insert(schema.calibrationPlanItems).values(CALIBRATION_PLAN_ITEMS_SEED_DATA);

    // Checkouts & Items (68 checkouts + items)
    console.log('  → Checkouts (68)');
    await db.insert(schema.checkouts).values(CHECKOUTS_SEED_DATA);
    console.log('  → Checkout Items (equipment associations)');
    await db.insert(schema.checkoutItems).values(CHECKOUT_ITEMS_SEED_DATA);

    // Equipment Imports (10)
    console.log(`  → Equipment Imports (${EQUIPMENT_IMPORTS_SEED_DATA.length})`);
    await db.insert(schema.equipmentImports).values(EQUIPMENT_IMPORTS_SEED_DATA);

    // ✅ equipment.status 동기화 — checkout.status='checked_out'인 장비의 equipment.status도 'checked_out'으로 설정
    // 런타임에는 CheckoutsService.startCheckout()이 이 동기화를 수행하지만, 시드 데이터는 직접 INSERT하므로 별도 동기화 필요
    console.log('  → Equipment status sync (checkout → equipment)');
    const syncResult = await pool.query(`
      UPDATE equipment
      SET status = 'checked_out', updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT ci.equipment_id
        FROM checkout_items ci
        JOIN checkouts c ON ci.checkout_id = c.id
        WHERE c.status = 'checked_out'
      )
      AND status != 'checked_out'
    `);
    console.log(`    ✅ ${syncResult.rowCount}건 장비 상태 동기화됨`);

    // =========================================================================
    // PHASE 2: EXTENDED ENTITIES (Partially Implemented)
    // =========================================================================
    console.log('\n📋 Phase 2: Inserting extended entities...');

    // Calibration Factors (12)
    console.log('  → Calibration Factors (12)');
    await db.insert(schema.calibrationFactors).values(CALIBRATION_FACTORS_SEED_DATA);

    // Test Software — UL-QP-18-07 관리대장
    console.log(`  → Test Software (${TEST_SOFTWARE_SEED_DATA.length})`);
    await db.insert(schema.testSoftware).values(TEST_SOFTWARE_SEED_DATA);

    // Software Validations — UL-QP-18-09 유효성 확인
    console.log(`  → Software Validations (${SOFTWARE_VALIDATIONS_SEED_DATA.length})`);
    await db.insert(schema.softwareValidations).values(SOFTWARE_VALIDATIONS_SEED_DATA);

    // Equipment ↔ Test Software M:N links
    console.log(
      `  → Equipment ↔ Test Software Links (${EQUIPMENT_TEST_SOFTWARE_SEED_DATA.length})`
    );
    await db.insert(schema.equipmentTestSoftware).values(EQUIPMENT_TEST_SOFTWARE_SEED_DATA);

    // =========================================================================
    // PHASE 3: DISPOSAL WORKFLOW E2E TEST DATA
    // =========================================================================
    console.log('\n📋 Phase 3: Inserting disposal workflow E2E test data...');

    // Disposal Equipment (21)
    console.log('  → Disposal Equipment (21)');
    await db.insert(schema.equipment).values(DISPOSAL_EQUIPMENT_SEED_DATA);

    // Disposal Requests (15)
    console.log('  → Disposal Requests (15)');
    await db.insert(schema.disposalRequests).values(DISPOSAL_REQUESTS_SEED_DATA);

    // =========================================================================
    // PHASE 4: HISTORY & ADMIN
    // =========================================================================
    console.log('\n📋 Phase 4: Inserting history & administrative data...');

    // Phase 4 각 항목은 스키마 미동기화 시에도 나머지가 실행되도록 try-catch
    const phase4Items: Array<{ label: string; fn: () => Promise<void> }> = [
      {
        label: `Equipment Location History (${LOCATION_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentLocationHistory)
            .values(LOCATION_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Maintenance History (${MAINTENANCE_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentMaintenanceHistory)
            .values(MAINTENANCE_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Incident History (${INCIDENT_HISTORY_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentIncidentHistory)
            .values(INCIDENT_HISTORY_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Requests (${EQUIPMENT_REQUESTS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentRequests)
            .values(EQUIPMENT_REQUESTS_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Equipment Attachments (${EQUIPMENT_ATTACHMENTS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.equipmentAttachments)
            .values(EQUIPMENT_ATTACHMENTS_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Audit Logs (${AUDIT_LOGS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.auditLogs)
            .values(AUDIT_LOGS_SEED_DATA)
            .then(() => {}),
      },
      {
        label: `Notifications (${NOTIFICATIONS_SEED_DATA.length})`,
        fn: () =>
          db
            .insert(schema.notifications)
            .values(NOTIFICATIONS_SEED_DATA)
            .then(() => {}),
      },
    ];

    for (const item of phase4Items) {
      try {
        console.log(`  → ${item.label}`);
        await item.fn();
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        const cause = e.cause as Record<string, unknown> | undefined;
        const errorCode = e.code || cause?.code;
        const errorMsg =
          (e.message as string | undefined) || (cause?.message as string | undefined) || '';
        if (errorCode === '42P01' || errorCode === '42703' || errorMsg.includes('does not exist')) {
          console.warn(
            `  ⚠️ ${item.label} skipped (schema drift) — run "pnpm --filter backend run db:migrate"`
          );
        } else {
          console.error(`  ❌ ${item.label} FAILED: ${errorMsg.slice(0, 200)}`);
        }
      }
    }

    // =========================================================================
    // POST PHASE 4: SSOT — equipment.location ← latest location history
    // =========================================================================
    console.log('\n🔄 Post Phase 4: Syncing equipment.location from location history (SSOT)...');
    try {
      const locationSyncResult = await db.execute(sql`
        UPDATE equipment e
        SET location = sub.new_location,
            updated_at = NOW()
        FROM (
          SELECT DISTINCT ON (equipment_id)
            equipment_id,
            new_location
          FROM equipment_location_history
          ORDER BY equipment_id, changed_at DESC, created_at DESC
        ) sub
        WHERE e.id = sub.equipment_id
          AND (e.location IS DISTINCT FROM sub.new_location)
      `);
      const syncCount = (locationSyncResult as { rowCount?: number }).rowCount ?? 0;
      console.log(`  ✅ ${syncCount}건 장비 위치 동기화됨 (location history → equipment.location)`);
    } catch (err) {
      console.warn(
        `  ⚠️ Location SSOT sync skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // POST PHASE 4: i18n 키 미번역 데이터 수정
    // =========================================================================
    // 스케줄러(onModuleInit)가 i18n 로딩 전에 실행되어 키 원문이 DB에 저장된 경우 수정
    console.log('\n🌐 Post Phase 4: Fixing i18n raw keys in DB...');
    try {
      // equipment_incident_history.content
      const incidentFix = await db.execute(sql`
        UPDATE equipment_incident_history
        SET content = '교정 기한 초과로 인한 자동 부적합 전환'
        WHERE content LIKE '%system.calibrationOverdue.incidentContent%'
      `);
      // non_conformances.cause
      const causeFix = await db.execute(sql`
        UPDATE non_conformances
        SET cause = '교정 기한 초과 (다음 교정일: ' ||
          COALESCE(
            (SELECT to_char(e.next_calibration_date, 'YYYY-MM-DD')
             FROM equipment e WHERE e.id = non_conformances.equipment_id),
            '미정'
          ) || ')'
        WHERE cause LIKE '%system.calibrationOverdue.ncCause%'
      `);
      // non_conformances.action_plan
      const planFix = await db.execute(sql`
        UPDATE non_conformances
        SET action_plan = '교정 수행 필요'
        WHERE action_plan LIKE '%system.calibrationOverdue.defaultActionPlan%'
      `);
      const totalFixed =
        ((incidentFix as { rowCount?: number }).rowCount ?? 0) +
        ((causeFix as { rowCount?: number }).rowCount ?? 0) +
        ((planFix as { rowCount?: number }).rowCount ?? 0);
      if (totalFixed > 0) {
        console.log(`  ✅ ${totalFixed}건 i18n 키 → 한국어 번역 수정됨`);
      } else {
        console.log('  ✅ i18n 미번역 데이터 없음');
      }
    } catch (err) {
      console.warn(
        `  ⚠️ i18n fix skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // POST PHASE 4: equipment_attachments → documents 테이블 동기화
    // =========================================================================
    // 프론트엔드 AttachmentsTab은 documents 테이블을 쿼리함 (equipment_attachments는 deprecated)
    console.log('\n📄 Post Phase 4: Syncing equipment_attachments → documents table...');
    try {
      const docSyncResult = await db.execute(sql`
        INSERT INTO documents (
          equipment_id, request_id, document_type, status,
          file_name, original_file_name, file_path, file_size, mime_type,
          description, revision_number, is_latest, uploaded_at, created_at, updated_at
        )
        SELECT
          ea.equipment_id, ea.request_id,
          ea.attachment_type::text,
          'active',
          ea.file_name, ea.original_file_name, ea.file_path, ea.file_size, ea.mime_type,
          ea.description, 1, true, ea.uploaded_at,
          COALESCE(ea.created_at, NOW()), COALESCE(ea.updated_at, NOW())
        FROM equipment_attachments ea
        WHERE NOT EXISTS (
          SELECT 1 FROM documents d
          WHERE d.file_path = ea.file_path
            AND d.original_file_name = ea.original_file_name
        )
          AND (ea.equipment_id IS NULL OR ea.equipment_id IN (SELECT id FROM equipment))
          AND (ea.request_id IS NULL OR ea.request_id IN (SELECT id FROM equipment_requests))
      `);
      const docSyncCount = (docSyncResult as { rowCount?: number }).rowCount ?? 0;
      console.log(`  ✅ ${docSyncCount}건 문서 동기화됨 (equipment_attachments → documents)`);
    } catch (err) {
      console.warn(
        `  ⚠️ Document sync skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // equipment_attachments.attachment_type에 없는 타입(equipment_photo 등)은 별도 seed
    // UL-QP-18-02 이력카드 "장비 사진" 셀 검증용
    try {
      await db.insert(schema.documents).values(EQUIPMENT_DOCUMENTS_SEED_DATA);
      console.log(
        `  ✅ ${EQUIPMENT_DOCUMENTS_SEED_DATA.length}건 추가 문서 시드 (equipment_photo 등 특수 타입)`
      );
    } catch (err) {
      console.warn(
        `  ⚠️ Additional documents seed skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // seed 문서가 참조하는 파일이 없으면 개발용 placeholder 이미지 생성.
    // uploadDir = UPLOAD_DIR 환경변수 (기본: ./uploads) — LocalStorageProvider와 동일 경로 규칙.
    // 이력카드 렌더러가 이 이미지를 실제로 읽어 DOCX에 삽입하고, 프론트 다운로드 버튼도 작동하도록.
    try {
      const { default: sharp } = await import('sharp');
      const { promises: fs } = await import('fs');
      const path = await import('path');

      const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
      const placeholderAbsPath = path.join(uploadDir, SEED_PLACEHOLDER_PHOTO_PATH);

      // 이미 존재하면 skip — 로컬 수정사항 보존
      let alreadyExists = false;
      try {
        await fs.access(placeholderAbsPath);
        alreadyExists = true;
      } catch {
        /* not exist → 생성 */
      }

      if (!alreadyExists) {
        await fs.mkdir(path.dirname(placeholderAbsPath), { recursive: true });
        // 800×600 연회색 JPEG — 4:3 비율 (이력카드 사진 영역 12.75×9.56cm와 자연스럽게 매칭)
        await sharp({
          create: {
            width: 800,
            height: 600,
            channels: 3,
            background: { r: 220, g: 220, b: 220 },
          },
        })
          .jpeg({ quality: 75 })
          .toFile(placeholderAbsPath);
        console.log(`  ✅ placeholder 이미지 생성: ${SEED_PLACEHOLDER_PHOTO_PATH}`);
      } else {
        console.log(`  ↺  placeholder 이미지 존재 (재생성 skip): ${SEED_PLACEHOLDER_PHOTO_PATH}`);
      }
    } catch (err) {
      console.warn(
        `  ⚠️ Placeholder image generation skipped: ${err instanceof Error ? err.message.slice(0, 200) : 'unknown error'}`
      );
    }

    // =========================================================================
    // VERIFICATION
    // =========================================================================
    console.log('\n🔍 Verifying seed data...');
    const result = await verifySeed(pool);
    printVerificationResults(result);

    if (result.passed) {
      console.log('✅ SEED DATA GENERATION COMPLETE!\n');
      await pool.end();
      process.exit(0);
    } else {
      console.log('❌ SEED DATA VERIFICATION FAILED\n');
      await pool.end();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR DURING SEEDING:');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// Run main
main();
