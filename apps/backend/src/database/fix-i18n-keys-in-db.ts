/**
 * DB에 저장된 i18n 키 문자열을 실제 한국어 번역으로 수정
 *
 * 원인: nest-cli.json에 assets 설정 누락 → i18n JSON 미로드 → 키 자체가 DB에 저장됨
 * 수정: nest-cli.json assets 추가 완료 → 이 스크립트로 기존 데이터 일회성 수정
 *
 * 실행: npx ts-node src/database/fix-i18n-keys-in-db.ts
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

loadMonorepoEnv();

const DATABASE_URL = resolveDatabaseUrl();

async function fixI18nKeys(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  console.log('=== i18n 키 → 한국어 번역 수정 시작 ===\n');

  // 1. non_conformances.cause — "system.calibrationOverdue.ncCause" 패턴
  const ncCauseResult = await db.execute(sql`
    UPDATE non_conformances
    SET cause = '교정 기한 초과 (다음 교정일: ' ||
      COALESCE(
        (SELECT to_char(e.next_calibration_date, 'YYYY-MM-DD')
         FROM equipment e WHERE e.id = non_conformances.equipment_id),
        '미정'
      ) || ')'
    WHERE cause LIKE '%system.calibrationOverdue.ncCause%'
    RETURNING id, cause
  `);
  console.log(`[non_conformances.cause] ${ncCauseResult.rowCount}건 수정`);

  // 2. non_conformances.action_plan — "system.calibrationOverdue.defaultActionPlan"
  const actionPlanResult = await db.execute(sql`
    UPDATE non_conformances
    SET action_plan = '교정 수행 필요'
    WHERE action_plan LIKE '%system.calibrationOverdue.defaultActionPlan%'
    RETURNING id
  `);
  console.log(`[non_conformances.action_plan] ${actionPlanResult.rowCount}건 수정`);

  // 3. non_conformances.correction_content — "system.calibrationOverdue.correctionContent"
  const correctionResult = await db.execute(sql`
    UPDATE non_conformances
    SET correction_content = '교정 완료로 인한 자동 조치 완료'
    WHERE correction_content LIKE '%system.calibrationOverdue.correctionContent%'
    RETURNING id
  `);
  console.log(`[non_conformances.correction_content] ${correctionResult.rowCount}건 수정`);

  // 4. incident_history.content — "system.calibrationOverdue.incidentContent"
  const incidentResult = await db.execute(sql`
    UPDATE incident_history
    SET content = '교정 기한 초과로 인한 자동 부적합 전환'
    WHERE content LIKE '%system.calibrationOverdue.incidentContent%'
    RETURNING id
  `);
  console.log(`[incident_history.content] ${incidentResult.rowCount}건 수정`);

  console.log('\n=== 수정 완료 ===');

  await pool.end();
}

fixI18nKeys().catch((err) => {
  console.error('수정 실패:', err);
  process.exit(1);
});
