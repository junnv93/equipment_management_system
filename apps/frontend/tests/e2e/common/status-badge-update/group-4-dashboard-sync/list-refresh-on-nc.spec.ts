/**
 * Group D: 목록 페이지 동기화 - staleTime: 0 자동 갱신
 *
 * 테스트: D-2: staleTime: 0 자동 갱신
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-d --workers=3
 */

import { test } from '../../../shared/fixtures/auth.fixture';
import { LIST_SYNC_TEST_EQUIPMENT_ID, EQUIPMENT_MANAGEMENT_NUMBERS } from '../constants/test-data';
import { verifyListPageStatusBadge } from '../helpers/status-verification';
import { createDirectNC } from '../helpers/nc-workflow';
import { navigateToEquipmentList } from '../helpers/navigation';

test.describe('Group D-2: staleTime: 0 자동 갱신', () => {
  test('D-2: 목록 페이지 자동 갱신 (staleTime: 0)', async ({ techManagerPage }) => {
    const equipmentId = LIST_SYNC_TEST_EQUIPMENT_ID;
    const managementNumber = EQUIPMENT_MANAGEMENT_NUMBERS.LIST_SYNC;

    console.log('\n━━━ D-2: 목록 페이지 자동 갱신 (staleTime: 0) ━━━');

    // GIVEN: 목록 페이지에서 시작
    await navigateToEquipmentList(techManagerPage);

    // WHEN: 상세 → NC 생성 → 목록 복귀
    const cause = `Auto refresh - D-2 - ${Date.now()}`;
    await createDirectNC(techManagerPage, equipmentId, cause);
    await navigateToEquipmentList(techManagerPage);

    // THEN: staleTime: 0이므로 자동 refetch → 업데이트된 배지 표시
    await verifyListPageStatusBadge(techManagerPage, managementNumber, 'non_conforming');

    console.log('  ✓ staleTime: 0 설정으로 인한 자동 갱신 확인');
    console.log('✅ D-2 테스트 완료\n');
  });
});
