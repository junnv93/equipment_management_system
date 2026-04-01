import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

loadMonorepoEnv();

async function runMigration() {
  const connectionString = resolveDatabaseUrl();

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 마이그레이션 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    // 이미 적용된 마이그레이션 확인
    const existing = await client.query(
      "SELECT hash FROM __drizzle_migrations WHERE hash = '0005_update_user_roles_and_add_site_location'"
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  마이그레이션 0005는 이미 적용되었습니다.');
      return;
    }

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(
      __dirname,
      '../drizzle/0005_update_user_roles_and_add_site_location.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 트랜잭션 시작
    await client.query('BEGIN');

    try {
      // 마이그레이션 실행
      await client.query(sql);

      // 마이그레이션 기록
      await client.query(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0005_update_user_roles_and_add_site_location', $1)",
        [Date.now()]
      );

      await client.query('COMMIT');
      console.log('✅ 마이그레이션 0005 적용 완료');
    } catch (error: any) {
      await client.query('ROLLBACK');
      
      // 컬럼이 이미 존재하는 경우는 무시
      if (error.code === '42710' || error.message?.includes('already exists')) {
        console.log('⚠️  일부 컬럼이 이미 존재합니다. 마이그레이션 기록만 추가합니다.');
        await client.query('BEGIN');
        await client.query(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0005_update_user_roles_and_add_site_location', $1) ON CONFLICT DO NOTHING",
          [Date.now()]
        );
        await client.query('COMMIT');
        console.log('✅ 마이그레이션 기록 추가 완료');
      } else {
        throw error;
      }
    }

    // 결과 확인
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('site', 'location', 'position', 'role')
      ORDER BY column_name
    `);
    
    console.log('\n📊 users 테이블 컬럼 확인:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 역할별 사용자 수 확인
    const roleStats = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);
    
    console.log('\n📊 역할별 사용자 수:');
    roleStats.rows.forEach((row) => {
      console.log(`  - ${row.role}: ${row.count}명`);
    });

  } catch (error: any) {
    console.error('❌ 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});
