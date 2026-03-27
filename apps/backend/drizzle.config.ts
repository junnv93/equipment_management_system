import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export default {
  schema: '../../packages/db/src/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // 기존 테이블에 새 인덱스 추가 시 필요한 설정
  verbose: true,
  strict: true,
} satisfies Config;
