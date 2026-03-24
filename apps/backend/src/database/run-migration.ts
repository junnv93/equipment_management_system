/**
 * 프로덕션 DB 마이그레이션 진입점
 *
 * 사용법 (docker-compose migration one-shot 컨테이너에서):
 *   node apps/backend/dist/database/run-migration.js
 *
 * 역할:
 * - 배포 파이프라인에서 서비스 재시작 전에 먼저 실행
 * - 성공: exit(0) → 다음 배포 단계 진행
 * - 실패: exit(1) → 배포 중단 (서비스는 기존 버전 유지)
 *
 * 설계:
 * - drizzle migrate() 사용 (drizzle-kit push가 아님)
 * - push: 스키마 직접 반영 (개발용)
 * - migrate: 마이그레이션 파일 기반 순차 적용 (프로덕션용)
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import * as path from 'path';

async function runMigration(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[Migration] DATABASE_URL 환경변수가 설정되지 않았습니다');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('[Migration] DB 연결 성공');

    const db = drizzle(client);

    // 마이그레이션 파일 위치: 빌드 산출물 기준
    // dist/database/run-migration.js → ../../drizzle
    const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');

    console.log(`[Migration] 마이그레이션 폴더: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });

    console.log('[Migration] 마이그레이션 성공적으로 완료');
  } catch (error) {
    console.error('[Migration] 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('[Migration] DB 연결 종료');
  }
}

// 직접 실행 시 (one-shot 컨테이너)
runMigration().then(() => process.exit(0));
