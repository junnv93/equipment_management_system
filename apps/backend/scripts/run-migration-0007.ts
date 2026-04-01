import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

// 모노레포 .env cascade 로딩
loadMonorepoEnv();

/**
 * 0007 마이그레이션 실행 및 검증
 */
async function runMigration0007() {
  console.log('🔄 0007_convert_equipment_team_id_to_uuid 마이그레이션 실행 중...');

  // 데이터베이스 연결 정보 (DATABASE_URL → DB_* 폴백)
  const connectionString = resolveDatabaseUrl();

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. 현재 상태 확인
    console.log('\n📊 현재 데이터베이스 상태 확인...');
    const currentTypeResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' AND column_name = 'team_id';
    `);

    if (currentTypeResult.rows.length > 0) {
      const currentType = currentTypeResult.rows[0].data_type;
      console.log(`현재 team_id 타입: ${currentType}`);

      if (currentType === 'uuid') {
        console.log('✅ team_id가 이미 uuid 타입입니다. 마이그레이션이 필요하지 않습니다.');
        return;
      }
    } else {
      console.log('⚠️ equipment 테이블의 team_id 컬럼을 찾을 수 없습니다.');
    }

    // 2. equipment 테이블의 현재 데이터 확인
    const equipmentCount = await client.query('SELECT COUNT(*) as count FROM equipment');
    const equipmentWithTeam = await client.query(
      'SELECT COUNT(*) as count FROM equipment WHERE team_id IS NOT NULL'
    );
    console.log(`총 장비 수: ${equipmentCount.rows[0].count}`);
    console.log(`팀이 할당된 장비 수: ${equipmentWithTeam.rows[0].count}`);

    // 3. teams 테이블 확인
    const teamsCount = await client.query('SELECT COUNT(*) as count FROM teams');
    console.log(`총 팀 수: ${teamsCount.rows[0].count}`);

    // 4. 마이그레이션 SQL 파일 읽기
    const sqlFilePath = path.join(
      __dirname,
      '../../drizzle/0007_convert_equipment_team_id_to_uuid.sql'
    );

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`마이그레이션 파일을 찾을 수 없습니다: ${sqlFilePath}`);
    }

    const sqlQueries = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('\n📄 마이그레이션 SQL 실행 중...');

    // 5. 마이그레이션 실행
    await client.query(sqlQueries);

    console.log('✅ 마이그레이션 SQL 실행 완료');

    // 6. 마이그레이션 후 검증
    console.log('\n🔍 마이그레이션 검증 중...');

    // team_id 타입 확인
    const newTypeResult = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' AND column_name = 'team_id';
    `);

    if (newTypeResult.rows.length > 0) {
      const newType = newTypeResult.rows[0].data_type;
      console.log(`변경된 team_id 타입: ${newType}`);

      if (newType !== 'uuid') {
        throw new Error(`❌ team_id 타입이 uuid로 변경되지 않았습니다. 현재 타입: ${newType}`);
      }
    }

    // 외래 키 제약 조건 확인
    const fkResult = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'equipment'
        AND kcu.column_name = 'team_id';
    `);

    if (fkResult.rows.length > 0) {
      console.log('✅ 외래 키 제약 조건 확인됨:');
      fkResult.rows.forEach((row) => {
        console.log(
          `  - ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
        );
      });
    } else {
      console.log('⚠️ 외래 키 제약 조건을 찾을 수 없습니다.');
    }

    // 인덱스 확인
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'equipment' AND indexname LIKE '%team_id%';
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ 인덱스 확인됨:');
      indexResult.rows.forEach((row) => {
        console.log(`  - ${row.indexname}`);
      });
    }

    // 데이터 무결성 확인
    const invalidRefs = await client.query(`
      SELECT COUNT(*) as count
      FROM equipment e
      WHERE e.team_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM teams t WHERE t.id = e.team_id
        );
    `);

    const invalidCount = parseInt(invalidRefs.rows[0].count);
    if (invalidCount > 0) {
      console.log(`⚠️ 무효한 team_id 참조가 ${invalidCount}개 발견되었습니다.`);
    } else {
      console.log('✅ 모든 team_id 참조가 유효합니다.');
    }

    // 최종 통계
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_equipment,
        COUNT(team_id) as equipment_with_team,
        COUNT(*) - COUNT(team_id) as equipment_without_team
      FROM equipment;
    `);

    console.log('\n📊 최종 통계:');
    console.log(`  - 총 장비 수: ${finalStats.rows[0].total_equipment}`);
    console.log(`  - 팀이 할당된 장비: ${finalStats.rows[0].equipment_with_team}`);
    console.log(`  - 팀이 없는 장비: ${finalStats.rows[0].equipment_without_team}`);

    console.log('\n✅ 마이그레이션 및 검증 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  runMigration0007()
    .then(() => {
      console.log('\n✅ 모든 작업 완료');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ 작업 실패:', err);
      process.exit(1);
    });
}

export { runMigration0007 };
