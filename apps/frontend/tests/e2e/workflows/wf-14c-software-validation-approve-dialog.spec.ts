/**
 * WF-14c: 소프트웨어 유효성 확인 승인 다이얼로그 브라우저 검증
 *
 * API 워크플로우(WF-14b)가 상태 전이를 커버하고, 본 spec은 실제 UI에서
 * approveDialog / qualityApproveDialog 렌더링, 코멘트 입력, 제출 버튼 흐름을 검증한다.
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  apiGet,
  approveSoftwareValidation,
  createSoftwareValidation,
  createTestSoftware,
  extractId,
  submitSoftwareValidation,
  cleanupSharedPool,
} from './helpers/workflow-helpers';

test.describe('WF-14c: 소프트웨어 유효성 확인 승인 다이얼로그 UI', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('technical_manager: approveDialog 렌더링 + 코멘트 입력 → 기술 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const softwareId = await createSubmittedValidation(tePage, 'WF-14c 기술승인 UI');
    const validationId = await createSubmittedValidationRecord(tePage, softwareId, 'vendor');
    const approvalComment = 'WF-14c UI 기술 승인 코멘트';

    await tmPage.goto(FRONTEND_ROUTES.SOFTWARE.VALIDATION(softwareId));
    await tmPage.waitForLoadState('domcontentloaded');

    await tmPage.getByRole('button', { name: '승인 (기술)' }).first().click();

    const dialog = tmPage.getByRole('dialog', { name: '기술책임자 승인' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('검토 의견').fill(approvalComment);
    await dialog.getByRole('button', { name: /^승인$/ }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });

    const detail = await apiGet(
      tmPage,
      `/api/software-validations/${validationId}`,
      'technical_manager'
    );
    const body = await detail.json();
    const data = body.data ?? body;
    expect(data.status).toBe('approved');
    expect(data.approvalComment).toBe(approvalComment);
  });

  test('quality_manager: qualityApproveDialog 렌더링 + 코멘트 입력 → 품질 승인', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
    qualityManagerPage: qmPage,
  }) => {
    const softwareId = await createSubmittedValidation(tePage, 'WF-14c 품질승인 UI');
    const validationId = await createSubmittedValidationRecord(tePage, softwareId, 'self');
    await approveSoftwareValidation(tmPage, validationId);

    const qualityComment = 'WF-14c UI 품질 승인 코멘트';

    await qmPage.goto(FRONTEND_ROUTES.SOFTWARE.VALIDATION(softwareId));
    await qmPage.waitForLoadState('domcontentloaded');

    await qmPage.getByRole('button', { name: '승인 (품질)' }).first().click();

    const dialog = qmPage.getByRole('dialog', { name: '품질책임자 승인' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('검토 의견').fill(qualityComment);
    await dialog.getByRole('button', { name: /^승인$/ }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });

    const detail = await apiGet(
      qmPage,
      `/api/software-validations/${validationId}`,
      'quality_manager'
    );
    const body = await detail.json();
    const data = body.data ?? body;
    expect(data.status).toBe('quality_approved');
    expect(data.qualityApprovalComment).toBe(qualityComment);
  });
});

async function createSubmittedValidation(
  page: Parameters<typeof createTestSoftware>[0],
  name: string
) {
  const software = await createTestSoftware(page, {
    name,
    softwareVersion: '14c.1.0',
    testField: 'EMC',
    manufacturer: 'WF-14c Vendor',
    requiresValidation: true,
  });
  return extractId(software);
}

async function createSubmittedValidationRecord(
  page: Parameters<typeof createSoftwareValidation>[0],
  softwareId: string,
  validationType: 'vendor' | 'self'
) {
  const validation = await createSoftwareValidation(page, softwareId, validationType, {
    softwareVersion: '14c.1.0',
  });
  const validationId = extractId(validation);
  await submitSoftwareValidation(page, validationId);
  return validationId;
}
