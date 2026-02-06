/**
 * Playwright 글로벌 설정
 *
 * 테스트 실행 전 수행되는 설정:
 * 1. 테스트 환경 변수 확인
 * 2. 테스트 DB 연결 확인 (선택적)
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Playwright 글로벌 설정 시작...');

  // 테스트 환경 정보 출력
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

  // 테스트 서버 상태 확인
  try {
    const response = await fetch(`${baseURL}/login`, { method: 'HEAD' });
    console.log(`✅ Frontend 서버 응답: ${response.status}`);
  } catch (error) {
    console.warn('⚠️  Frontend 서버에 연결할 수 없습니다. webServer가 시작될 때까지 대기합니다.');
  }

  // 백엔드 API 상태 확인
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    // 백엔드 health endpoint는 /api/monitoring/health
    const response = await fetch(`${apiURL}/api/monitoring/health`, { method: 'GET' });
    if (response.ok) {
      console.log(`✅ Backend API 응답: ${response.status}`);
    } else {
      console.warn(`⚠️  Backend API 응답: ${response.status}`);
    }
  } catch (error) {
    console.warn('⚠️  Backend API에 연결할 수 없습니다.');
    console.warn(`   URL: ${apiURL}/api/monitoring/health`);
    console.warn('   로그인 테스트가 실패할 수 있습니다.');
    console.warn('   백엔드를 시작하려면: pnpm --filter backend run dev');
  }

  // ✅ 근본적 해결책: 테스트 시드 데이터 자동 로드
  // E2E 테스트 실행 전 반드시 test users가 DB에 존재해야 함
  // Foreign key 제약 (equipmentRequests.requestedBy) 때문에 필수
  console.log('🌱 테스트 시드 데이터 로딩 시작...');
  try {
    const { execSync } = await import('child_process');
    const seedScript = '../backend/src/database/seed-test-new.ts';

    // Run seed script (uses development database connection from .env)
    execSync(`cd ../backend && npx ts-node ${seedScript}`, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    console.log('✅ 테스트 시드 데이터 로딩 완료\n');
  } catch (error) {
    console.warn('⚠️  테스트 시드 데이터 로딩 실패');
    console.warn(
      '   수동으로 실행하세요: pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts'
    );
    console.warn('   테스트가 foreign key 오류로 실패할 수 있습니다.');
  }

  console.log('🔧 글로벌 설정 완료\n');
}

export default globalSetup;
