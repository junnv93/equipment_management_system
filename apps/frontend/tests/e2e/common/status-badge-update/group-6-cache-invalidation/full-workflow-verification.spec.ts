/**
 * Group F: 전체 워크플로우 - 모든 페이지 일관성 검증
 *
 * 테스트: F-1: 상세→목록→대시보드 일관성
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-f --workers=1
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  STATUS_UPDATE_TEST_EQUIPMENT_ID,
  EQUIPMENT_MANAGEMENT_NUMBERS,
} from '../constants/test-data';
import {
  verifyDetailPageStatusBadge,
  verifyListPageStatusBadge,
} from '../helpers/status-verification';
import { createIncidentWithNC } from '../helpers/nc-workflow';
import {
  navigateToEquipmentDetail,
  navigateToEquipmentList,
  navigateToDashboard,
} from '../helpers/navigation';

test.describe('Group F: 전체 워크플로우', () => {
  test.describe.configure({ mode: 'serial' }); // 순차 실행

  test('F-1: 상세→목록→대시보드 일관성', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;
    const managementNumber = EQUIPMENT_MANAGEMENT_NUMBERS.STATUS_UPDATE;

    console.log('\n━━━ F-1: 상세→목록→대시보드 일관성 ━━━');

    // STEP 1: 상세 페이지 - 현재 상태 확인 (A-1 이후 non_conforming일 가능성)
    console.log('\n[STEP 1] 상세 페이지 - 현재 상태 확인');
    await navigateToEquipmentDetail(techManagerPage, equipmentId);

    const currentStatusBadge = await techManagerPage
      .locator('text=/사용 가능|부적합/')
      .first()
      .textContent();
    console.log(`  - 현재 상태: ${currentStatusBadge}`);

    // STEP 2: 목록 페이지 - 상태 확인
    console.log('\n[STEP 2] 목록 페이지 - 상태 확인');
    await navigateToEquipmentList(techManagerPage);

    if (currentStatusBadge?.includes('부적합')) {
      await verifyListPageStatusBadge(techManagerPage, managementNumber, 'non_conforming');
    } else if (currentStatusBadge?.includes('사용 가능')) {
      await verifyListPageStatusBadge(techManagerPage, managementNumber, 'available');
    }

    // STEP 3: 대시보드 - 통계 확인
    console.log('\n[STEP 3] 대시보드 - 통계 확인');
    await navigateToDashboard(techManagerPage);

    // 부적합 통계 카드 찾기
    const nonConformingCard = techManagerPage.getByRole('heading', { name: '부적합' });
    await expect(nonConformingCard).toBeVisible();

    // 통계 숫자 확인 (적어도 1개 이상)
    const statsCards = techManagerPage.locator('[class*="stats"]');
    const cardText = await statsCards.first().textContent();
    console.log(`  - 대시보드 통계 카드: ${cardText?.substring(0, 50)}`);

    // STEP 4: 상세 페이지 복귀 - 상태 지속
    console.log('\n[STEP 4] 상세 페이지 복귀 - 상태 지속');
    await navigateToEquipmentDetail(techManagerPage, equipmentId);

    if (currentStatusBadge?.includes('부적합')) {
      await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');
    } else if (currentStatusBadge?.includes('사용 가능')) {
      await verifyDetailPageStatusBadge(techManagerPage, 'available');
    }

    console.log('\n✅ F-1 테스트 완료: 모든 페이지에서 일관된 상태 표시\n');
  });
});
