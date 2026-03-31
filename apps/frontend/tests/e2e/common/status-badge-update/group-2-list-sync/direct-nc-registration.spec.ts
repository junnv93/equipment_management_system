/**
 * Group B: 직접 NC 등록 - 배지 업데이트 검증
 *
 * 테스트 범위:
 * - B-1: 직접 NC 등록 시 배지 업데이트
 * - B-2: 모든 탭에서 배지 일관성
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-b --workers=1
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { LIST_SYNC_TEST_EQUIPMENT_ID, TIMEOUTS } from '../constants/test-data';
import { verifyDetailPageStatusBadge } from '../helpers/status-verification';
import { createDirectNC } from '../helpers/nc-workflow';
import { navigateToEquipmentDetail } from '../helpers/navigation';

test.describe('Group B: 직접 NC 등록', () => {
  test.describe.configure({ mode: 'serial' }); // 순차 실행

  test('B-1: 직접 NC 등록 시 배지 업데이트', async ({ techManagerPage }) => {
    const equipmentId = LIST_SYNC_TEST_EQUIPMENT_ID;

    console.log('\n━━━ B-1: 직접 NC 등록 시 배지 업데이트 ━━━');

    // GIVEN: 장비 상태 "사용 가능"
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'available');

    // WHEN: NC 직접 등록
    const cause = `Direct NC - B-1 - ${Date.now()}`;
    await createDirectNC(techManagerPage, equipmentId, cause);

    // THEN: 상세 페이지로 돌아가서 배지 확인
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');

    console.log('✅ B-1 테스트 완료\n');
  });

  test('B-2: 모든 탭에서 배지 일관성', async ({ techManagerPage }) => {
    const equipmentId = LIST_SYNC_TEST_EQUIPMENT_ID;

    console.log('\n━━━ B-2: 모든 탭에서 배지 일관성 ━━━');

    await navigateToEquipmentDetail(techManagerPage, equipmentId);

    // 각 탭에서 배지 확인
    const tabs = [
      { name: /기본 정보/i, description: '기본 정보 탭' },
      { name: /부적합 관리/i, description: '부적합 관리 탭' },
      { name: /사고 이력/i, description: '사고 이력 탭' },
    ];

    for (const tab of tabs) {
      console.log(`  - ${tab.description} 확인 중...`);
      await techManagerPage.getByRole('tab', { name: tab.name }).click();
      await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');
    }

    console.log('✅ B-2 테스트 완료\n');
  });
});
