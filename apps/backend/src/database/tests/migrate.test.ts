import * as path from 'path';
import { Client } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { loadMonorepoEnv } from '@equipment-management/db/load-env';

loadMonorepoEnv();

/**
 * 테스트 환경을 위한 마이그레이션 실행 스크립트
 * 테스트 데이터베이스를 초기화하고 마이그레이션을 적용합니다.
 */
async function runTestMigration(): Promise<void> {
  console.log('📊 테스트 데이터베이스 마이그레이션 시작...');

  // 테스트 데이터베이스 연결 정보
  const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/equipment_management_test';

  // 기본 클라이언트 (테스트 DB 생성/삭제 등을 위한 용도)
  const baseClient = new Client({
    connectionString: testDatabaseUrl.replace('equipment_management_test', 'postgres'),
  });

  try {
    await baseClient.connect();

    // 테스트 데이터베이스 확인/생성
    try {
      await baseClient.query(`
        SELECT 'CREATE DATABASE equipment_management_test'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'equipment_management_test');
      `);
      console.log('✅ 테스트 데이터베이스 확인/생성 완료');
    } catch (error) {
      console.error('테스트 데이터베이스 생성 중 오류:', error);
    }

    // 테스트 데이터베이스에 연결
    const testClient = new Client({ connectionString: testDatabaseUrl });
    await testClient.connect();

    // 테스트 데이터베이스 초기화 (기존 테이블 삭제)
    try {
      await testClient.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);
      console.log('✅ 테스트 데이터베이스 초기화 완료');
    } catch (error) {
      console.error('테스트 데이터베이스 초기화 중 오류:', error);
    }

    // 마이그레이션 적용
    const db = drizzle(testClient);
    try {
      // 마이그레이션 경로
      const migrationsFolder = path.join(process.cwd(), 'drizzle');

      // 마이그레이션 실행
      await migrate(db, { migrationsFolder });
      console.log('✅ 테스트 데이터베이스 마이그레이션 완료');
    } catch (error) {
      console.error('테스트 마이그레이션 적용 중 오류:', error);
      throw error;
    } finally {
      await testClient.end();
    }
  } catch (error) {
    console.error('테스트 마이그레이션 프로세스 중 오류:', error);
    process.exit(1);
  } finally {
    await baseClient.end();
  }
}

// 이 파일이 직접 실행된 경우에만 마이그레이션 실행
if (require.main === module) {
  runTestMigration()
    .then(() => {
      console.log('✅ 테스트 마이그레이션 프로세스 완료');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 테스트 마이그레이션 프로세스 실패:', err);
      process.exit(1);
    });
}

export { runTestMigration };
