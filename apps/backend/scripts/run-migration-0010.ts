/**
 * 마이그레이션 0010 실행 스크립트
 * 장비 승인 시스템 추가 마이그레이션
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

// 모노레포 .env cascade 로딩
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
      "SELECT hash FROM __drizzle_migrations WHERE hash = '0010_add_equipment_approval_system'"
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  마이그레이션 0010은 이미 적용되었습니다.');
      return;
    }

    // 마이그레이션 파일 읽기
    const migrationPath = path.join(
      __dirname,
      '../drizzle/0010_add_equipment_approval_system.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 트랜잭션 시작
    await client.query('BEGIN');

    try {
      // 마이그레이션 실행
      await client.query(sql);

      // 마이그레이션 기록
      await client.query(
        `INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        ['0010_add_equipment_approval_system', Date.now()]
      );

      // 커밋
      await client.query('COMMIT');
      console.log('✅ 마이그레이션 0010이 성공적으로 적용되었습니다.');
    } catch (error) {
      // 롤백
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('🚨 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결을 종료했습니다.');
  }
}

// 스크립트 실행
runMigration().catch((err) => {
  console.error('마이그레이션 실행 실패:', err);
  process.exit(1);
});
