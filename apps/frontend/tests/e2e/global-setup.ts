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
  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const response = await fetch(`${apiURL}/health`, { method: 'GET' });
    if (response.ok) {
      console.log(`✅ Backend API 응답: ${response.status}`);
    } else {
      console.warn(`⚠️  Backend API 응답: ${response.status}`);
    }
  } catch (error) {
    console.warn('⚠️  Backend API에 연결할 수 없습니다.');
    console.warn('   로그인 테스트가 실패할 수 있습니다.');
    console.warn('   백엔드를 시작하려면: docker-compose up -d backend');
  }

  console.log('🔧 글로벌 설정 완료\n');
}

export default globalSetup;
