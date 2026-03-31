/**
 * Group D: 목록 페이지 동기화 - 상세 페이지 변경 반영
 *
 * 테스트: D-1: 목록-상세 페이지 동기화
 *
 * 실행: pnpm test:e2e tests/e2e/status-badge-update/group-d --workers=3
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
import { detectEquipmentStatus } from '../helpers/status-detection';
import { createIncidentWithNC } from '../helpers/nc-workflow';
import { navigateToEquipmentList } from '../helpers/navigation';

test.describe('Group D-1: 목록-상세 페이지 동기화', () => {
  test('D-1: 목록 페이지 배지 동기화', async ({ techManagerPage }) => {
    const equipmentId = STATUS_UPDATE_TEST_EQUIPMENT_ID;
    const managementNumber = EQUIPMENT_MANAGEMENT_NUMBERS.STATUS_UPDATE;

    console.log('\n━━━ D-1: 목록 페이지 배지 동기화 ━━━');

    // GIVEN: 상세 페이지에서 현재 상태 확인
    console.log('  STEP 1: 상세 페이지에서 현재 상태 감지');
    await techManagerPage.goto(`/equipment/${equipmentId}`);

    // 현재 장비 상태 자동 감지
    const currentStatus = await detectEquipmentStatus(techManagerPage);
    console.log(`  확인된 상태: ${currentStatus}`);

    // WHEN: 목록 페이지 열기
    console.log('  STEP 2: 목록 페이지 열기');
    const listPage = await techManagerPage.context().newPage();
    await navigateToEquipmentList(listPage);

    // 초기 로드 대기 (새 페이지는 SSR 데이터 없이 시작)

    // THEN: 목록 페이지에서 동일한 상태 배지 확인
    console.log(`  STEP 3: 목록 페이지 배지 검증 (예상: ${currentStatus})`);
    await verifyListPageStatusBadge(listPage, managementNumber, currentStatus);

    await listPage.close();

    console.log('✅ D-1 테스트 완료: 상세-목록 페이지 상태 동기화 확인\n');
  });
});
