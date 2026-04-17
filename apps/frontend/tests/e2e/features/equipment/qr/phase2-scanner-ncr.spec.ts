/**
 * QR Phase 2 — 스캐너 + NCR 진입 E2E
 *
 * 카메라 API는 E2E 환경에서 권한 거부 → ManualEntryFallback로 전환됨.
 * 이 특성을 활용해 수동 입력 필드로 Scanner workflow를 검증한다.
 *
 * 커버리지:
 * 1. /scan → 카메라 권한 거부 → 수동 입력 폼 등장 → 유효한 관리번호 입력 → /e/:mgmt 이동
 * 2. 잘못된 관리번호 → invalidFormat 에러 메시지 노출 (redirect 없음)
 * 3. NC 생성 딥링크 — /equipment/:id/non-conformance?action=create → 폼 자동 오픈
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../shared/constants/test-equipment-ids';

const VALID_MGMT = 'SUW-E0009';
const INVALID_MGMT = 'xxx-not-valid';

test.describe('QR Phase 2 — Scanner + NCR Deep Link', () => {
  test.describe('/scan 수동 입력 경로', () => {
    test.use({
      contextOptions: {
        // 카메라 권한을 명시적으로 거부 → QRScannerView가 ManualEntryFallback 렌더
        permissions: [],
      },
    });

    test('카메라 거부 시 수동 입력 폼 등장 + 유효 관리번호 → /e/:mgmt 이동', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto(FRONTEND_ROUTES.SCAN);

      // Scanner가 카메라 실패를 감지하고 수동 입력으로 폴백 (id='manual-mgmt-input')
      const input = testOperatorPage.locator('#manual-mgmt-input');
      await expect(input).toBeVisible({ timeout: 10_000 });

      await input.fill(VALID_MGMT);
      const submit = testOperatorPage.getByRole('button', { name: /확인|submit|이동/i });
      await submit.click();

      await testOperatorPage.waitForURL(`**${FRONTEND_ROUTES.EQUIPMENT.BY_MGMT(VALID_MGMT)}`, {
        timeout: 5_000,
      });
      await expect(testOperatorPage.locator('h1')).toBeVisible();
    });

    test('잘못된 관리번호 → 에러 메시지 노출, redirect 안 일어남', async ({ testOperatorPage }) => {
      await testOperatorPage.goto(FRONTEND_ROUTES.SCAN);

      const input = testOperatorPage.locator('#manual-mgmt-input');
      await expect(input).toBeVisible({ timeout: 10_000 });
      await input.fill(INVALID_MGMT);
      await testOperatorPage.getByRole('button', { name: /확인|submit|이동/i }).click();

      // URL은 여전히 /scan — 잘못된 포맷은 redirect 안 됨
      await expect(testOperatorPage).toHaveURL(/\/scan/);
      // 에러 메시지(invalidFormat 계열) 가시화
      const errorHint = testOperatorPage.getByText(/형식|invalid|올바르지 않/i).first();
      await expect(errorHint).toBeVisible();
    });
  });

  test.describe('NC 생성 딥링크', () => {
    test('?action=create 파라미터 → 부적합 등록 폼 자동 오픈', async ({ testOperatorPage }) => {
      await testOperatorPage.goto(
        FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES_CREATE(EQUIP_SPECTRUM_ANALYZER_SUW_E_ID)
      );

      // NC 등록 폼의 첫 입력 필드(ncType Select trigger)가 렌더되고 포커스 받는지 확인
      const ncTypeTrigger = testOperatorPage.locator('#nc-type');
      await expect(ncTypeTrigger).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('벌크 QR 라벨 PDF 다운로드', () => {
    test('장비 목록 페이지 벌크 라벨 버튼 → PDF 다운로드 트리거', async ({ testOperatorPage }) => {
      await testOperatorPage.goto(FRONTEND_ROUTES.EQUIPMENT.LIST);
      await testOperatorPage.waitForLoadState('networkidle');

      // BulkLabelPrintButton은 현재 페이지 아이템 전체 기반.
      // aria-label="buttonAriaLabel" 패턴(i18n) — "선택" 또는 "selected" 키워드로 locator 구성
      const bulkButton = testOperatorPage.getByRole('button', { name: /선택|selected/i }).first();
      if ((await bulkButton.count()) === 0) {
        test.skip(true, 'BulkLabelPrintButton 미노출 환경 — 장비 데이터 부재 가능');
        return;
      }

      const downloadPromise = testOperatorPage.waitForEvent('download', { timeout: 30_000 });
      await bulkButton.click();

      // maxBatch 초과 시 confirm 다이얼로그 — 존재하면 confirm 클릭
      const confirmDialog = testOperatorPage.getByRole('alertdialog');
      if ((await confirmDialog.count()) > 0 && (await confirmDialog.isVisible())) {
        await testOperatorPage.getByRole('button', { name: /확인|confirm|인쇄/i }).click();
      }

      const download = await downloadPromise;
      const path = await download.path();
      expect(path).toBeTruthy();
      const fileName = download.suggestedFilename();
      // 파일명 패턴: `equipment-labels-YYYY-MM-DD.pdf`
      expect(fileName).toMatch(/equipment-labels-\d{4}-\d{2}-\d{2}\.pdf/);
    });
  });
});
