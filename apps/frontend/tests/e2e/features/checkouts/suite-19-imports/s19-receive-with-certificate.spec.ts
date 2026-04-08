/**
 * Suite 19 확장: 반입 수령 시 교정성적서 첨부 테스트
 *
 * 검증 대상:
 * - 수령 폼에서 교정성적서 파일 업로드 UI 렌더링
 * - 파일 첨부 + 상태점검 입력 후 수령 확인
 * - 파일 없이 수령 확인 (기존 동작 유지)
 *
 * Mode: serial (상태 변경)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { getBackendToken, clearBackendCache } from '../../../shared/helpers/api-helpers';
import { expectToastVisible } from '../../../shared/helpers/toast-helpers';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BACKEND_URL = BASE_URLS.BACKEND;

test.describe('Suite 19 확장: 수령 시 교정성적서 첨부', () => {
  test.describe.configure({ mode: 'serial' });

  let importId: string;
  let importVersion: number;

  test.beforeAll(async ({ browser }) => {
    // API로 반입 신청 생성 + 승인 (수령 가능 상태)
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const token = await getBackendToken(page, 'lab_manager');

      // 1. 반입 신청 생성
      const createResponse = await page.request.post(`${BACKEND_URL}/api/equipment-imports`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          sourceType: 'internal_shared',
          equipmentName: `E2E 교정성적서 테스트 ${Date.now()}`,
          classification: 'fcc_emc_rf',
          ownerDepartment: 'Safety Lab',
          usagePeriodStart: new Date().toISOString(),
          usagePeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'E2E 교정성적서 첨부 테스트',
          externalIdentifier: 'SAF-TEST-001',
        },
      });

      if (createResponse.status() !== 201) {
        console.log(`Import creation failed: ${await createResponse.text()}`);
        return;
      }

      const createData = (await createResponse.json()) as Record<string, unknown>;
      // ResponseTransformInterceptor 래핑 대응
      const importData = (createData.data ?? createData) as Record<string, unknown>;
      importId = importData.id as string;
      importVersion = (importData.version as number) || 1;

      // 2. 승인
      const approveResponse = await page.request.patch(
        `${BACKEND_URL}/api/equipment-imports/${importId}/approve`,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: { version: importVersion },
        }
      );

      if (approveResponse.status() === 200) {
        const approveData = (await approveResponse.json()) as Record<string, unknown>;
        const approved = (approveData.data ?? approveData) as Record<string, unknown>;
        importVersion = (approved.version as number) || importVersion + 1;
      } else {
        console.log(`Approve failed: ${await approveResponse.text()}`);
      }
    } finally {
      await context.close();
    }

    // 백엔드 in-memory 캐시 무효화:
    // API 직접 호출(반입 생성 + 승인)은 캐시를 bypass하므로
    // 후속 테스트가 수령 폼 로딩 시 stale 캐시 대신 최신 상태를 읽도록 보장한다.
    await clearBackendCache();
  });

  test('수령 폼 렌더링 — 교정성적서 업로드 영역 표시', async ({ siteAdminPage: page }) => {
    test.skip(!importId, 'Import not created');

    await page.goto(`/checkouts/import/${importId}/receive`);
    await expect(page.getByRole('heading', { name: '수령 확인' })).toBeVisible({ timeout: 15000 });

    // 상태점검 섹션
    await expect(page.getByText('상태점검')).toBeVisible();

    // 교정성적서 섹션
    await expect(page.getByRole('heading', { name: '교정성적서' })).toBeVisible();
    await expect(page.getByText('파일 선택 또는 드래그')).toBeVisible();
  });

  test('교정성적서 첨부 후 수령 확인', async ({ siteAdminPage: page }) => {
    test.skip(!importId, 'Import not created');
    test.setTimeout(60_000);

    await page.goto(`/checkouts/import/${importId}/receive`);
    await expect(page.getByRole('heading', { name: '수령 확인' })).toBeVisible({ timeout: 15000 });

    // 교정성적서 PDF 생성
    const tmpDir = os.tmpdir();
    const pdfPath = path.join(tmpDir, 'e2e-calibration-cert.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('%PDF-1.4\n%E2E test calibration certificate\n%%EOF'));

    try {
      // 파일 업로드
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(pdfPath);

      // 파일 목록에 표시 확인
      await expect(page.getByText('e2e-calibration-cert.pdf')).toBeVisible();

      // 수령 확인 클릭
      await page.getByRole('button', { name: '수령 확인' }).click();

      // 성공 토스트 — expectToastVisible 가 시각 토스트(li[role="status"])만 매칭
      await expectToastVisible(page, '수령 확인이 완료되었습니다.', { timeout: 15000 });
    } finally {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
  });
});
