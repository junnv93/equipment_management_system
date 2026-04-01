import type { Config } from 'drizzle-kit';
import { loadMonorepoEnv, resolveDatabaseUrl } from '@equipment-management/db/load-env';

// 모노레포 .env cascade 로딩 (CWD/.env.local → CWD/.env → 루트/.env)
loadMonorepoEnv();

export default {
  schema: '../../packages/db/src/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
  // 기존 테이블에 새 인덱스 추가 시 필요한 설정
  verbose: true,
  strict: true,
} satisfies Config;
