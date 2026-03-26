/**
 * E2E 테스트: 교정기한 초과 시 부적합 상태 자동 전환
 *
 * 테스트 시나리오:
 * 1. 교정기한이 지난 장비 생성
 * 2. 수동 트리거 API 호출하여 스케줄러 실행
 * 3. 장비 상태가 non_conforming으로 변경되었는지 확인
 * 4. 프론트엔드에서 "부적합" 배지 표시 확인
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

import {
  EquipmentStatusValues as ESVal,
  NonConformanceStatusValues as NCSVal,
  NonConformanceTypeValues as NCTVal,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
// Backend API base URL (direct access, bypassing Next.js rewrites)
// Backend uses app.setGlobalPrefix('api'), so all routes are /api/*
const BACKEND_URL = BASE_URLS.BACKEND + '/api';

test.describe('교정기한 초과 자동 부적합 전환', () => {
  test('교정기한 초과 장비가 자동으로 부적합 상태로 전환되어야 함', async ({
    siteAdminPage: page,
  }) => {
    // 1. 교정기한이 지난 장비 생성
    await page.goto('/equipment/create-shared', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('장비명')).toBeVisible({ timeout: 30000 });

    console.log('✅ 페이지 로드 완료');

    // 기본 정보 입력
    await page.getByLabel('장비명').fill('교정기한초과테스트장비');

    // 제조사 필드는 정확히 "제조사"라는 텍스트만 매칭
    await page.getByRole('textbox', { name: /^제조사\s*\*?$/ }).fill('TestManufacturer');

    await page.getByLabel('모델명').fill('TestModel');

    // 시험소 및 팀 선택
    await page.getByLabel('시험소').click();
    await page.getByRole('option', { name: '수원랩' }).click();

    await page.getByLabel('소속 팀').click();
    await page.getByRole('option', { name: /FCC EMC\/RF/ }).click();

    // 교정 정보 입력
    await page.getByLabel('교정 대상 여부').click();
    await page.getByRole('option', { name: '대상' }).click();

    // 교정 기한을 과거 날짜로 설정 (3일 전)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const overdueDate = threeDaysAgo.toISOString().split('T')[0];

    await page.getByLabel('다음 교정일').fill(overdueDate);

    // 장비 등록
    await page.getByRole('button', { name: /등록|저장/ }).click();
    await page.waitForURL(/\/equipment\/[a-f0-9-]+/);

    // 등록된 장비 ID 추출
    const equipmentUrl = page.url();
    const equipmentId = equipmentUrl.split('/').pop();

    console.log(`✅ 교정기한 초과 장비 생성: ID=${equipmentId}, 교정일=${overdueDate}`);

    // 2. 교정기한 초과 스케줄러 수동 트리거 (API 호출)
    const triggerResponse = await page.request.post(
      `${BASE_URLS.BACKEND}${API_ENDPOINTS.NOTIFICATIONS.TRIGGER_OVERDUE_CHECK}`
    );
    expect(triggerResponse.ok()).toBeTruthy();

    const triggerResult = await triggerResponse.json();
    console.log('📋 스케줄러 실행 결과:', triggerResult);

    expect(triggerResult.processed).toBeGreaterThanOrEqual(1);
    expect(triggerResult.created).toBeGreaterThanOrEqual(1);

    // 3. 장비 상태가 non_conforming으로 변경되었는지 확인 (API)
    const equipmentResponse = await page.request.get(`${BACKEND_URL}/equipment/${equipmentId}`);
    expect(equipmentResponse.ok()).toBeTruthy();

    const equipment = await equipmentResponse.json();
    console.log(`🔍 장비 상태: ${equipment.status}`);

    expect(equipment.status).toBe(ESVal.NON_CONFORMING);

    // 4. 프론트엔드에서 "부적합" 배지 표시 확인
    await page.goto(`/equipment/${equipmentId}`);

    // 상태 배지가 "부적합"으로 표시되는지 확인
    const statusBadge = page.locator('text=부적합').first();
    await expect(statusBadge).toBeVisible();

    // 빨간색 배지 스타일 확인
    const badgeElement = page.locator('[class*="bg-red"]').filter({ hasText: '부적합' });
    await expect(badgeElement).toBeVisible();

    console.log('✅ 프론트엔드에서 "부적합" 배지 정상 표시');

    // 5. 부적합 기록이 자동 생성되었는지 확인
    const ncResponse = await page.request.get(
      `${BACKEND_URL}/non-conformances?equipmentId=${equipmentId}`
    );
    expect(ncResponse.ok()).toBeTruthy();

    const ncResult = await ncResponse.json();
    expect(ncResult.items.length).toBeGreaterThanOrEqual(1);

    const calibrationOverdueNc = ncResult.items.find(
      (nc: { ncType: string }) => nc.ncType === NCTVal.CALIBRATION_OVERDUE
    );
    expect(calibrationOverdueNc).toBeDefined();
    expect(calibrationOverdueNc.status).toBe(NCSVal.OPEN);

    console.log('✅ 교정기한 초과 부적합 기록 자동 생성 확인');
  });

  test('calibration_overdue 상태가 프론트엔드에서 "부적합"으로 표시되어야 함', async ({
    siteAdminPage: page,
  }) => {
    // DB에 calibration_overdue 상태 장비가 있을 경우를 대비한 테스트
    // (스케줄러가 아직 실행되지 않은 경우)

    // 1. 교정기한 초과 장비 조회
    const listResponse = await page.request.get(
      `${BACKEND_URL}/equipment?page=1&pageSize=100&status=calibration_overdue`
    );

    if (listResponse.ok()) {
      const result = await listResponse.json();

      if (result.items && result.items.length > 0) {
        const overdueEquipment = result.items[0];
        console.log(`🔍 calibration_overdue 상태 장비 발견: ${overdueEquipment.managementNumber}`);

        // 2. 장비 상세 페이지 방문
        await page.goto(`/equipment/${overdueEquipment.id}`);

        // 3. "부적합" 배지 확인
        const statusBadge = page.locator('text=부적합').first();
        await expect(statusBadge).toBeVisible();

        console.log('✅ calibration_overdue 상태가 "부적합"으로 표시됨');
      } else {
        console.log('ℹ️  calibration_overdue 상태 장비가 없음 (스케줄러가 이미 처리함)');
      }
    }
  });

  test('스케줄러가 이미 처리된 장비는 건너뛰어야 함', async ({ siteAdminPage: page }) => {
    // 1. 이미 non_conforming 상태인 장비 조회
    const url = `${BACKEND_URL}/equipment?page=1&pageSize=10&status=non_conforming`;
    console.log(`📡 Making API request to: ${url}`);

    const listResponse = await page.request.get(url);

    if (!listResponse.ok()) {
      const errorText = await listResponse.text();
      console.log(`❌ API Error: ${listResponse.status()} - ${errorText}`);
    }

    expect(listResponse.ok()).toBeTruthy();
    const result = await listResponse.json();

    if (result.items && result.items.length > 0) {
      const ncEquipment = result.items[0];
      const initialUpdatedAt = ncEquipment.updatedAt;

      console.log(`🔍 기존 부적합 장비: ${ncEquipment.managementNumber}`);

      // 2. 스케줄러 재실행
      const triggerResponse = await page.request.post(
        `${BASE_URLS.BACKEND}${API_ENDPOINTS.NOTIFICATIONS.TRIGGER_OVERDUE_CHECK}`
      );
      expect(triggerResponse.ok()).toBeTruthy();

      const triggerResult = await triggerResponse.json();
      console.log('📋 스케줄러 재실행 결과:', triggerResult);

      // 3. 기존 부적합 장비는 건너뛰어야 함
      const skippedEquipment = triggerResult.details.find(
        (detail: { equipmentId: string }) => detail.equipmentId === ncEquipment.id
      );

      if (skippedEquipment) {
        expect(skippedEquipment.action).toBe('skipped');
        console.log('✅ 기존 부적합 장비는 건너뜀');
      } else {
        console.log('ℹ️  해당 장비는 제외 조건에 해당하여 조회되지 않음');
      }
    } else {
      console.log('ℹ️  부적합 장비가 없음 - 테스트 건너뜀');
    }
  });
});
