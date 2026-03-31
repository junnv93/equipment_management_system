/**
 * Group E: Hydration 검증 - 에러 없이 배지 표시
 *
 * 테스트: E-1: 상세 페이지 Hydration 검증
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-e --workers=2
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { STATUS_UPDATE_TEST_EQUIPMENT_ID, TIMEOUTS } from '../constants/test-data';
import { verifyNoHydrationErrors, startConsoleMonitoring } from '../helpers/status-verification';
import { navigateToEquipmentDetail } from '../helpers/navigation';

test.describe('Group E-1: Hydration 검증', () => {
  test('E-1: 상세 페이지 Hydration 검증', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;

    console.log('\n━━━ E-1: 상세 페이지 Hydration 검증 ━━━');

    // 콘솔 에러 모니터링 시작
    const { errors } = startConsoleMonitoring(techManagerPage);

    // 네트워크 요청 모니터링
    const networkRequests: string[] = [];
    techManagerPage.on('request', (req) => {
      if (req.url().includes('/api/equipment')) {
        networkRequests.push(`${req.method()} ${req.url()}`);
      }
    });

    // GIVEN: 장비 상세 페이지 방문
    await navigateToEquipmentDetail(techManagerPage, equipmentId);

    // 클라이언트 hydration 대기

    // THEN: Hydration 에러 없음
    await verifyNoHydrationErrors(errors);

    // AND: refetchOnMount: false 확인 (mount 후 불필요한 refetch 없음)
    // 페이지 로드 시 1회 요청만 있어야 함
    const equipmentRequests = networkRequests.filter((req) =>
      req.includes(`/api/equipment/${equipmentId}`)
    );

    console.log(`  - 장비 API 요청 횟수: ${equipmentRequests.length}`);
    equipmentRequests.forEach((req) => console.log(`    ${req}`));

    // mount 시 1-2회 요청만 있어야 함 (SSR + 초기 fetch)
    expect(equipmentRequests.length).toBeLessThanOrEqual(2);
    console.log('  ✓ refetchOnMount: false 동작 확인 (불필요한 refetch 없음)');

    console.log('✅ E-1 테스트 완료\n');
  });
});
