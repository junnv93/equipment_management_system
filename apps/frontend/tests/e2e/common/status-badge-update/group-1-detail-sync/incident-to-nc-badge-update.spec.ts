/**
 * Group A: 사고→NC 워크플로우 - 배지 즉시 업데이트 검증
 *
 * 테스트 범위:
 * - A-1: 사고→NC 등록 시 배지 즉시 변경
 * - A-2: 페이지 새로고침 후 상태 지속
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-a --workers=1
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { STATUS_UPDATE_TEST_EQUIPMENT_ID, TIMEOUTS } from '../constants/test-data';
import {
  verifyDetailPageStatusBadge,
  verifyNoHydrationErrors,
  startConsoleMonitoring,
} from '../helpers/status-verification';
import { createIncidentWithNC, verifyNCCreated } from '../helpers/nc-workflow';
import { navigateToEquipmentDetail, reloadPage } from '../helpers/navigation';

test.describe('Group A: 사고→NC 워크플로우', () => {
  test.describe.configure({ mode: 'serial' }); // 순차 실행

  test('A-1: 사고→NC 등록 시 배지 즉시 변경', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;

    console.log('\n━━━ A-1: 사고→NC 등록 시 배지 즉시 변경 ━━━');

    // GIVEN: 장비 상태 "사용 가능"
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'available');

    // WHEN: 사고 이력에서 NC 생성
    const incidentContent = `E2E Test - A-1 - ${Date.now()}`;
    await createIncidentWithNC(techManagerPage, equipmentId, incidentContent);

    // THEN: 배지 즉시 "부적합"으로 변경 (페이지 새로고침 없음)
    await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');

    // AND: NC 탭에서 생성된 NC 확인
    await verifyNCCreated(techManagerPage);

    console.log('✅ A-1 테스트 완료\n');
  });

  test('A-2: 페이지 reload 후 상태 유지', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;

    console.log('\n━━━ A-2: 페이지 reload 후 상태 유지 ━━━');

    // 콘솔 에러 모니터링 시작
    const { errors } = startConsoleMonitoring(techManagerPage);

    // GIVEN: 장비가 non_conforming 상태 (A-1 이후)
    await navigateToEquipmentDetail(techManagerPage, equipmentId);
    await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');

    // WHEN: 페이지 새로고침
    await reloadPage(techManagerPage);

    // THEN: 여전히 "부적합" 표시
    await verifyDetailPageStatusBadge(techManagerPage, 'non_conforming');

    // AND: Hydration 에러 없음
    await verifyNoHydrationErrors(errors);

    console.log('✅ A-2 테스트 완료\n');
  });
});
