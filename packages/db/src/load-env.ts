import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * 모노레포 .env SSOT 로딩
 *
 * dotenv는 이미 설정된 변수를 덮어쓰지 않으므로 (override: false 기본),
 * 우선순위가 높은 파일부터 로드하면 자연스럽게 cascade됩니다.
 *
 * 로드 순서 (우선순위 높은 순):
 *   1. CWD/.env.local  — 로컬 오버라이드 (gitignored)
 *   2. CWD/.env         — 앱별 기본
 *   3. 모노레포 루트/.env — 공유 인프라 변수 (SSOT)
 *
 * 모노레포 루트는 pnpm-workspace.yaml 파일이 있는 디렉토리로 판별합니다.
 */
export function loadMonorepoEnv(): void {
  const cwd = process.cwd();

  // 1. 로컬 오버라이드 (최우선)
  config({ path: resolve(cwd, '.env.local') });

  // 2. 앱별 기본
  config({ path: resolve(cwd, '.env') });

  // 3. 모노레포 루트 탐색 (상위 디렉토리 순회, 최대 5단계)
  //    pnpm-workspace.yaml이 없는 환경(CI 등)에서 의도하지 않은
  //    상위 디렉토리 .env 로드를 방지하기 위해 깊이를 제한합니다.
  const MAX_DEPTH = 5;
  let dir = cwd;
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const parent = resolve(dir, '..');
    if (parent === dir) break; // filesystem root 도달
    dir = parent;

    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      config({ path: resolve(dir, '.env') });
      break;
    }
  }
}

/**
 * DB_* 개별 변수로부터 DATABASE_URL을 조합합니다.
 * DATABASE_URL이 이미 설정되어 있으면 그대로 반환합니다.
 *
 * drizzle-kit, 마이그레이션 스크립트 등 DATABASE_URL이 필수인 도구에서 사용.
 */
export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'equipment_management';

  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
}
