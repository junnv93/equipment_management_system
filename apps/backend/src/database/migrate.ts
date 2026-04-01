import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import * as path from 'path';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

// 모노레포 .env cascade 로딩
loadMonorepoEnv();

async function main(): Promise<void> {
  console.log('🔄 마이그레이션 시작...');

  // 데이터베이스 연결 문자열 (DATABASE_URL → DB_* 폴백)
  const connectionString = resolveDatabaseUrl();

  // PostgreSQL 클라이언트 생성
  const client = new Client({
    connectionString,
  });

  // 연결
  try {
    await client.connect();
    console.log('✅ 데이터베이스에 연결되었습니다.');

    // Drizzle 인스턴스 생성
    const db = drizzle(client);

    // 마이그레이션 디렉토리 경로
    const migrationsFolder = path.join(__dirname, '../../drizzle');

    // 마이그레이션 실행
    await migrate(db, { migrationsFolder });

    console.log('✅ 마이그레이션이 성공적으로 적용되었습니다.');
  } catch (error) {
    console.error('🚨 마이그레이션 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // 연결 종료
    await client.end();
    console.log('🔌 데이터베이스 연결을 종료했습니다.');
  }
}

// 스크립트 실행
main();
