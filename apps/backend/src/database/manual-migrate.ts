import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

// .env 파일 로드
dotenv.config();

/**
 * 수동 마이그레이션 실행 함수
 */
async function manualMigrate() {
  console.log('📊 수동 마이그레이션 실행 중...');

  // 데이터베이스 연결 정보
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/equipment_management';
  
  // 클라이언트 생성
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 파일 경로
    const sqlFilePath = path.join(process.cwd(), 'drizzle', 'manual', 'create_tables.sql');
    
    // SQL 파일 읽기
    const sqlQueries = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // SQL 쿼리 실행
    console.log('📄 SQL 쿼리 실행 중...');
    await client.query(sqlQueries);
    
    console.log('✅ 마이그레이션 완료');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 이 파일이 직접 실행된 경우에만 마이그레이션 실행
if (require.main === module) {
  manualMigrate()
    .then(() => {
      console.log('✅ 마이그레이션 프로세스 완료');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 마이그레이션 프로세스 실패:', err);
      process.exit(1);
    });
}

export { manualMigrate }; 