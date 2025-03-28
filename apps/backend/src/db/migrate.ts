import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

const logger = new Logger('Migration');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL 환경 변수가 정의되지 않았습니다.');
}

const performMigration = async () => {
  logger.log('데이터베이스 마이그레이션 시작...');

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    logger.log('마이그레이션 완료!');
  } catch (error) {
    logger.error('마이그레이션 오류:', error);
  } finally {
    await migrationClient.end();
  }
};

performMigration().catch((err) => {
  logger.error('마이그레이션 실패:', err);
  process.exit(1);
});
