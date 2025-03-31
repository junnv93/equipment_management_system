import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

export default {
  schema: './src/database/schema/*.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management',
  },
  // 기존 테이블에 새 인덱스 추가 시 필요한 설정
  verbose: true,
  strict: true,
} satisfies Config; 