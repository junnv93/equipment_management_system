/**
 * Playwright 글로벌 설정
 *
 * 테스트 실행 전 수행되는 설정:
 * 1. .auth/ 디렉토리 생성 보장
 * 2. Frontend / Backend health check (재시도 포함)
 * 3. 테스트 시드 데이터 로딩
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');

/**
 * 서비스 health check (재시도 포함)
 *
 * @param url - Health check URL
 * @param name - 서비스 이름 (로그용)
 * @param maxRetries - 최대 재시도 횟수
 * @param retryDelay - 재시도 간 대기 시간(ms)
 * @param required - true면 실패 시 throw, false면 경고만
 */
async function checkHealth(
  url: string,
  name: string,
  maxRetries: number,
  retryDelay: number,
  required: boolean
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        console.log(`  ✅ ${name} 응답: ${response.status}`);
        return true;
      }
      throw new Error(`Status: ${response.status}`);
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(
          `  ⏳ ${name} 연결 실패 (${attempt}/${maxRetries}), ${retryDelay}ms 후 재시도...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else if (required) {
        console.error(`  ❌ ${name} 연결 불가 (${maxRetries}회 시도 실패)`);
        console.error(`     URL: ${url}`);
        throw new Error(
          `${name} is not accessible after ${maxRetries} attempts. ` +
            `Please start the service before running E2E tests.`
        );
      } else {
        console.warn(`  ⚠️  ${name} 연결 불가 — 일부 테스트가 실패할 수 있습니다.`);
        return false;
      }
    }
  }
  return false;
}

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Playwright 글로벌 설정 시작...');

  // 1. .auth 디렉토리 보장
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log('  📁 .auth/ 디렉토리 생성됨');
  }

  // 2. 테스트 환경 정보
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  console.log(`  📍 Frontend: ${baseURL}`);
  console.log(`  📍 Backend: ${apiURL}`);
  console.log(`  🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  // 3. Health checks (Backend 5회 재시도 — 필수, Frontend 3회 — 필수)
  await checkHealth(`${apiURL}/api/monitoring/health`, 'Backend API', 5, 3000, true);
  await checkHealth(`${baseURL}/login`, 'Frontend', 3, 2000, true);

  // 4. 테스트 시드 데이터 로딩
  console.log('  🌱 테스트 시드 데이터 로딩...');
  try {
    const { execSync } = await import('child_process');
    const seedScript = '../backend/src/database/seed-test-new.ts';

    execSync(`cd ../backend && npx ts-node ${seedScript}`, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    console.log('  ✅ 시드 데이터 로딩 완료');
  } catch (error) {
    console.warn('  ⚠️  시드 데이터 로딩 실패');
    console.warn(
      '     수동 실행: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts'
    );
    console.warn('     테스트가 foreign key 오류로 실패할 수 있습니다.');
  }

  console.log('🔧 글로벌 설정 완료\n');
}

export default globalSetup;
