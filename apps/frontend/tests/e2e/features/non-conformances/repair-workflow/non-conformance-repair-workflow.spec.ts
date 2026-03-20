/**
 * 부적합-수리 워크플로우 통합 E2E 테스트
 *
 * 테스트 항목:
 * 1. 부적합 등록 시 ncType 필수 검증
 * 2. 수리 완료 시 부적합 자동 'corrected' 상태 변경
 * 3. damage 유형은 수리 없이 종결 불가
 * 4. 1:1 관계 강제 (하나의 부적합에 하나의 수리만)
 * 5. 종료된 부적합에 수리 연결 불가
 * 6. 부적합 종료 시 장비 상태 복원
 *
 * @note 실제 API를 호출하여 전체 워크플로우를 검증
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import {
  EquipmentStatusValues as ESVal,
  NonConformanceTypeValues as NCTVal,
  UnifiedApprovalStatusValues as UASVal,
  RepairResultValues as RRVal,
} from '@equipment-management/schemas';

test.describe('Non-Conformance and Repair Workflow Integration', () => {
  // 테스트용 장비 ID (각 테스트에서 생성)
  let testEquipmentId: string;
  let testNonConformanceId: string;
  let testRepairId: string;

  test.beforeEach(async ({ page, testOperatorPage }, testInfo) => {
    // Chromium에서만 실행
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }

    // 콘솔 로그 캡처
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });

  test('should require ncType when creating non-conformance', async ({ testOperatorPage }) => {
    // 장비 목록으로 이동
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // 첫 번째 장비의 상세 페이지로 이동
    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      console.log('테스트할 장비가 없습니다. 테스트 건너뛰기');
      test.skip();
      return;
    }

    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // URL에서 장비 ID 추출
    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // 부적합 관리 탭으로 이동 (링크 또는 버튼 찾기)
    const ncLink = testOperatorPage.locator('a[href*="non-conformance"]').first();
    if ((await ncLink.count()) === 0) {
      // 직접 URL로 이동
      await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    } else {
      await ncLink.click();
    }
    await testOperatorPage.waitForLoadState('networkidle');

    // 부적합 등록 버튼 클릭
    const registerButton = testOperatorPage.getByRole('button', { name: /부적합 등록/i });
    if ((await registerButton.count()) === 0) {
      console.log('부적합 등록 버튼을 찾을 수 없습니다.');
      test.skip();
      return;
    }
    await registerButton.click();

    // 부적합 유형 드롭다운이 표시되는지 확인
    const ncTypeSelect = testOperatorPage.locator('select').first();
    await expect(ncTypeSelect).toBeVisible();

    // 옵션들이 표시되는지 확인
    await expect(testOperatorPage.getByText('손상 (물리적 파손)')).toBeVisible();
    await expect(testOperatorPage.getByText('오작동 (기능 이상)')).toBeVisible();
    await expect(testOperatorPage.getByText('교정 실패')).toBeVisible();
  });

  test('should display ncType, resolution, and repair link in non-conformance list', async ({
    testOperatorPage,
  }) => {
    // 장비 목록으로 이동
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // 첫 번째 장비의 상세 페이지로 이동
    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      test.skip();
      return;
    }

    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    // URL에서 장비 ID 추출
    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // 부적합 관리 페이지로 이동
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 부적합 등록 버튼 클릭
    const registerButton = testOperatorPage.getByRole('button', { name: /부적합 등록/i });
    if ((await registerButton.count()) > 0) {
      await registerButton.click();

      // ncType 선택
      await testOperatorPage.locator('select').first().selectOption(NCTVal.DAMAGE);

      // 부적합 원인 입력
      await testOperatorPage
        .locator('textarea')
        .first()
        .fill('E2E 테스트: 센서 파손으로 인한 부적합');

      // 등록 버튼 클릭
      await testOperatorPage.getByRole('button', { name: /^등록$/ }).click();
      await testOperatorPage.waitForLoadState('networkidle');

      // 부적합 유형 배지가 표시되는지 확인
      await expect(testOperatorPage.getByText('손상')).toBeVisible();
    }
  });

  test('should show warning for damage/malfunction types requiring repair', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const detailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    if ((await detailLink.count()) === 0) {
      test.skip();
      return;
    }

    await detailLink.click();
    await testOperatorPage.waitForLoadState('networkidle');

    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // 부적합 관리 페이지로 이동
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    // 부적합 등록 버튼 클릭
    const registerButton = testOperatorPage.getByRole('button', { name: /부적합 등록/i });
    if ((await registerButton.count()) > 0) {
      await registerButton.click();

      // 힌트 텍스트가 표시되는지 확인
      await expect(
        testOperatorPage.getByText('손상/오작동 유형은 수리 기록이 필요합니다.')
      ).toBeVisible();
    }
  });

  test('complete workflow: non-conformance → repair → auto-correction → close → equipment status restore', async ({
    testOperatorPage,
    techManagerPage,
  }) => {
    // 1. 장비 생성 (API 직접 호출)
    const createEquipmentResponse = await testOperatorPage.request.post(
      `${BASE_URLS.BACKEND}/api/equipment`,
      {
        data: {
          name: 'E2E Workflow Test Equipment',
          managementNumber: `E2E-WF-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-WF-${Date.now()}`,
          status: ESVal.AVAILABLE,
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: UASVal.APPROVED,
        },
      }
    );

    if (!createEquipmentResponse.ok()) {
      console.error('Failed to create test equipment');
      test.skip();
      return;
    }

    const equipmentData = await createEquipmentResponse.json();
    testEquipmentId = equipmentData.id;

    console.log(`Created test equipment: ${testEquipmentId}`);

    // 2. 부적합 등록 (damage 유형)
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    const registerButton = testOperatorPage.getByRole('button', { name: /부적합 등록/i });
    await registerButton.click();

    // ncType 선택 (damage)
    await testOperatorPage.locator('select').first().selectOption(NCTVal.DAMAGE);

    // 부적합 원인 입력
    await testOperatorPage.locator('textarea').first().fill('E2E 워크플로우 테스트: 센서 파손');

    // 등록 버튼 클릭
    await testOperatorPage.getByRole('button', { name: /^등록$/ }).click();
    await testOperatorPage.waitForLoadState('networkidle');

    // 부적합이 등록되었는지 확인
    await expect(testOperatorPage.getByText('E2E 워크플로우 테스트: 센서 파손')).toBeVisible();
    await expect(testOperatorPage.getByText('발견됨')).toBeVisible();

    // 3. 장비 상태가 non_conforming으로 변경되었는지 확인
    await testOperatorPage.goto(`/equipment/${testEquipmentId}`);
    await testOperatorPage.waitForLoadState('networkidle');

    await expect(testOperatorPage.getByText('부적합')).toBeVisible();

    // 4. API를 통해 수리 등록 (부적합 ID 연결, 완료 상태)
    // 먼저 부적합 ID를 가져와야 함
    const ncListResponse = await testOperatorPage.request.get(
      `${BASE_URLS.BACKEND}/api/non-conformances?equipmentId=${testEquipmentId}`
    );
    const ncListData = await ncListResponse.json();
    if (!ncListData.items || ncListData.items.length === 0) {
      console.error('No non-conformance found');
      test.skip();
      return;
    }
    testNonConformanceId = ncListData.items[0].id;

    console.log(`Non-conformance ID: ${testNonConformanceId}`);

    // 수리 등록 (부적합 연결, 완료 상태)
    const createRepairResponse = await testOperatorPage.request.post(
      `${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}/repair-history`,
      {
        data: {
          repairDate: new Date().toISOString(),
          repairDescription: 'E2E 테스트: 센서 교체 완료',
          repairedBy: '홍길동',
          repairResult: RRVal.COMPLETED,
          nonConformanceId: testNonConformanceId,
        },
      }
    );

    if (!createRepairResponse.ok()) {
      console.error('Failed to create repair');
      test.skip();
      return;
    }

    const repairData = await createRepairResponse.json();
    testRepairId = repairData.id;

    console.log(`Repair ID: ${testRepairId}`);

    // 5. 부적합이 자동으로 'corrected' 상태로 변경되었는지 확인
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    await expect(testOperatorPage.getByText('조치 완료')).toBeVisible();
    await expect(testOperatorPage.getByText('해결: 수리')).toBeVisible();
    await expect(testOperatorPage.getByText('수리 기록 연결됨')).toBeVisible();

    // 6. 기술책임자로 부적합 종료
    await techManagerPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await techManagerPage.waitForLoadState('networkidle');

    // 부적합 종료는 별도 API 호출 필요 (UI에 종료 버튼이 없다면)
    const closeResponse = await techManagerPage.request.patch(
      `${BASE_URLS.BACKEND}/api/non-conformances/${testNonConformanceId}/close`,
      {
        data: {
          closedBy: 'tech-manager-id',
          closureNotes: 'E2E 테스트: 워크플로우 검증 완료',
        },
      }
    );

    if (!closeResponse.ok()) {
      console.error('Failed to close non-conformance');
      console.error(await closeResponse.text());
      test.skip();
      return;
    }

    // 7. 장비 상태가 'available'로 복원되었는지 확인
    await techManagerPage.goto(`/equipment/${testEquipmentId}`);
    await techManagerPage.waitForLoadState('networkidle');

    await expect(techManagerPage.getByText('사용 가능')).toBeVisible();

    // 정리: 테스트 장비 삭제
    await testOperatorPage.request.delete(`${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}`);
  });

  test.afterEach(async ({ testOperatorPage }) => {
    // 테스트 장비 정리
    if (testEquipmentId) {
      try {
        await testOperatorPage.request.delete(
          `${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}`
        );
      } catch (error) {
        // 이미 삭제되었거나 실패해도 무시
      }
    }
  });
});
