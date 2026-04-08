/**
 * Playwright 글로벌 설정
 *
 * 테스트 실행 전 수행되는 설정:
 * 1. .auth/ 디렉토리 생성 보장
 * 2. Frontend / Backend health check (재시도 포함)
 * 3. 테스트 시드 데이터 로딩
 * 4. 교정 기한 초과 장비 부적합 자동 전환 트리거
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from './shared/constants/shared-test-data';
import { fetchBackendToken } from './shared/helpers/api-helpers';

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
    } catch {
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
  const apiURL = BASE_URLS.BACKEND;
  console.log(`  📍 Frontend: ${baseURL}`);
  console.log(`  📍 Backend: ${apiURL}`);
  console.log(`  🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  // 3. Health checks (Backend 5회, Frontend 10회 — dev mode 첫 컴파일 고려)
  await checkHealth(`${apiURL}${API_ENDPOINTS.MONITORING.HEALTH}`, 'Backend API', 5, 3000, true);
  await checkHealth(`${baseURL}/login`, 'Frontend', 10, 3000, true);

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

    // 5. 교정 기한 초과 장비 자동 부적합 전환
    //    시드 데이터에 상대 날짜(daysAgo)로 교정일이 설정되어 있어,
    //    시드 적용 후 스케줄러를 수동 트리거해야 정합성 보장
    console.log('  🔄 교정 기한 초과 장비 점검 트리거...');
    const token = await fetchBackendToken('lab_manager');
    const overdueRes = await fetch(
      `${apiURL}${API_ENDPOINTS.NOTIFICATIONS.TRIGGER_OVERDUE_CHECK}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        // fresh seed 직후 scheduler가 N+1 쿼리를 돌려 기존 10s 로는 부족했음
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!overdueRes.ok) {
      const body = await overdueRes.text().catch(() => '<body read failed>');
      throw new Error(
        `교정 기한 초과 점검 트리거 실패: HTTP ${overdueRes.status} — ${body.slice(0, 500)}`
      );
    }
    // 응답은 flat ({"processed":N,...}) — ResponseTransformInterceptor 미적용 엔드포인트
    const result = (await overdueRes.json()) as { processed?: number; created?: number };
    console.log(
      `  ✅ 교정 기한 초과 점검 완료 (처리: ${result.processed ?? 0}건, 부적합 생성: ${result.created ?? 0}건)`
    );
  } catch (err) {
    // Fail-fast: 시드 실패는 false negative 의 주된 원인이었으므로, 경고가 아닌
    // 명시적 실패로 처리한다. 검증 실패(seed-test-new.ts exit 1)도 여기로 떨어진다.
    console.error('  ❌ 시드 데이터 로딩/검증 실패 — 글로벌 설정 중단');
    console.error(
      '     수동 실행: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts'
    );
    throw err instanceof Error ? err : new Error(`Seed loading failed: ${String(err)}`);
  }

  console.log('🔧 글로벌 설정 완료\n');
}

export default globalSetup;
