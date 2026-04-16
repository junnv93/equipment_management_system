/**
 * 데이터베이스 연결 테스트 스크립트
 */

import { Client } from 'pg';
import { loadMonorepoEnv } from '@equipment-management/db/load-env';

// 모노레포 .env cascade 로딩
loadMonorepoEnv();

async function testConnection() {
  // 여러 연결 문자열 시도
  const connectionStrings = [
    process.env.DATABASE_URL,
    `postgresql://${process.env.DB_USER ?? 'postgres'}:${process.env.DB_PASSWORD ?? 'postgres'}@localhost:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? 'equipment_management'}`,
    `postgresql://${process.env.DB_USER ?? 'postgres'}:${process.env.DB_PASSWORD ?? 'postgres'}@postgres:5432/${process.env.DB_NAME ?? 'equipment_management'}`, // Docker 내부
  ].filter(Boolean);

  console.log('🔍 데이터베이스 연결 테스트 시작...\n');

  for (const connectionString of connectionStrings) {
    if (!connectionString) continue;

    const client = new Client({ connectionString });

    try {
      console.log(`📡 연결 시도: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
      await client.connect();
      console.log('✅ 연결 성공!\n');

      // 간단한 쿼리 테스트
      const result = await client.query('SELECT version(), current_database(), current_user');
      console.log('📊 데이터베이스 정보:');
      console.log(`   버전: ${result.rows[0].version.split(',')[0]}`);
      console.log(`   데이터베이스: ${result.rows[0].current_database}`);
      console.log(`   사용자: ${result.rows[0].current_user}\n`);

      // 테이블 목록 확인
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log(`📋 테이블 목록 (${tablesResult.rows.length}개):`);
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');

      // 마이그레이션 상태 확인
      const migrationResult = await client.query(`
        SELECT hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log(`🔄 최근 마이그레이션 (최대 5개):`);
      if (migrationResult.rows.length === 0) {
        console.log('   마이그레이션 기록이 없습니다.');
      } else {
        migrationResult.rows.forEach((row) => {
          const date = row.created_at ? new Date(Number(row.created_at)).toISOString() : 'N/A';
          console.log(`   - ${row.hash} (${date})`);
        });
      }
      console.log('');

      await client.end();
      return connectionString; // 성공한 연결 문자열 반환
    } catch (error: any) {
      console.log(`❌ 연결 실패: ${error.message}\n`);
      try {
        await client.end();
      } catch {
        // 무시
      }
    }
  }

  throw new Error('모든 연결 시도가 실패했습니다.');
}

// 스크립트 실행
testConnection()
  .then((connectionString) => {
    console.log(`\n✅ 사용 가능한 연결 문자열: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n🚨 데이터베이스 연결 실패:', error.message);
    console.error('\n💡 해결 방법:');
    console.error('   1. PostgreSQL이 실행 중인지 확인');
    console.error('   2. Docker 컨테이너가 실행 중인지 확인: docker-compose up -d');
    console.error('   3. DATABASE_URL 환경 변수 설정');
    console.error('   4. .env 파일에 DATABASE_URL 추가');
    process.exit(1);
  });
