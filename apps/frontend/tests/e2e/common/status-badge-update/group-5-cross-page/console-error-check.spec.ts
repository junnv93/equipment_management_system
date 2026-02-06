/**
 * Group E: Hydration 검증 - 워크플로우 중 콘솔 에러 없음
 *
 * 테스트: E-2: NC 워크플로우 중 콘솔 에러 없음
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-e --workers=2
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { STATUS_UPDATE_TEST_EQUIPMENT_ID, TIMEOUTS } from '../constants/test-data';
import { startConsoleMonitoring } from '../helpers/status-verification';
import { createIncidentWithNC } from '../helpers/nc-workflow';
import { navigateToEquipmentDetail } from '../helpers/navigation';

test.describe('Group E-2: 워크플로우 콘솔 에러 검증', () => {
  test('E-2: NC 워크플로우 중 콘솔 에러 없음', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;

    console.log('\n━━━ E-2: NC 워크플로우 중 콘솔 에러 없음 ━━━');

    // 콘솔 에러/경고 모니터링 시작
    const { errors, warnings } = startConsoleMonitoring(techManagerPage);

    // 전체 워크플로우 실행
    await navigateToEquipmentDetail(techManagerPage, equipmentId);

    const incidentContent = `Console check - E-2 - ${Date.now()}`;
    await createIncidentWithNC(techManagerPage, equipmentId, incidentContent);

    await techManagerPage.waitForTimeout(TIMEOUTS.HYDRATION_CHECK);

    // React 에러 없음 확인
    const reactErrors = errors.filter(
      (e) =>
        e.includes('React') ||
        e.includes('Uncaught') ||
        e.includes('Warning:') ||
        e.toLowerCase().includes('error')
    );

    console.log(`  - 총 콘솔 에러: ${errors.length}`);
    console.log(`  - 총 콘솔 경고: ${warnings.length}`);
    console.log(`  - React 관련 에러: ${reactErrors.length}`);

    if (errors.length > 0) {
      console.log('\n  발견된 콘솔 에러:');
      errors.forEach((e) => console.log(`    - ${e.substring(0, 100)}`));
    }

    if (warnings.length > 0) {
      console.log('\n  발견된 콘솔 경고:');
      warnings.forEach((w) => console.log(`    - ${w.substring(0, 100)}`));
    }

    expect(reactErrors).toHaveLength(0);
    console.log('  ✓ React 에러 없음 확인');

    console.log('✅ E-2 테스트 완료\n');
  });
});
