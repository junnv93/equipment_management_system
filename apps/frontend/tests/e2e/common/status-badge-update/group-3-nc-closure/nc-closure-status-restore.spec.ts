/**
 * Group C: NC 종료 - 상태 복원 검증
 *
 * 테스트 범위:
 * - C-1: NC 종료 시 "사용 가능" 복원
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-c --workers=1
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { NC_CLOSURE_TEST_EQUIPMENT_ID } from '../constants/test-data';
import { verifyDetailPageStatusBadge } from '../helpers/status-verification';
import { closeNC } from '../helpers/nc-workflow';
import { navigateToEquipmentDetail } from '../helpers/navigation';

test.describe('Group C: NC 종료', () => {
  test.describe.configure({ mode: 'serial' }); // 순차 실행

  test('C-1: NC 종료 시 "사용 가능" 복원', async ({ techManagerPage }) => {
    const equipmentId = NC_CLOSURE_TEST_EQUIPMENT_ID;

    console.log('\n━━━ C-1: NC 종료 시 "사용 가능" 복원 ━━━');

    // GIVEN: 장비가 부적합 상태 (기존 NC 존재)
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');

    // WHEN: NC 종료
    await closeNC(techManagerPage, equipmentId);

    // THEN: 상세 페이지로 돌아가서 배지 확인
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'available');

    console.log('✅ C-1 테스트 완료\n');
  });
});
