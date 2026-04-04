/**
 * WF-14a: 시험용 소프트웨어 등록 (UL-QP-18-07 관리대장) ★P3
 *
 * 시험용 소프트웨어 등록 → 관리번호 자동 채번 → 관리대장 확인
 *
 * @see docs/workflows/critical-workflows.md WF-14a
 * @see docs/procedure/시험용소프트웨어관리대장.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createTestSoftware,
  getTestSoftware,
  extractId,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';

test.describe('WF-14a: 시험용 소프트웨어 등록', () => {
  test.describe.configure({ mode: 'serial' });

  let softwareId: string;
  let managementNumber: string;

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('Step 1: TE가 시험용 소프트웨어 등록', async ({ testOperatorPage: page }) => {
    const body = await createTestSoftware(page, {
      name: 'WF-14a 테스트 소프트웨어',
      softwareVersion: '3.0.0',
      testField: 'RED',
      manufacturer: 'WF Test Corp',
      location: 'EMC',
      availability: 'available',
      requiresValidation: true,
    });
    const data = (body.data ?? body) as Record<string, unknown>;
    softwareId = extractId(body);
    managementNumber = data.managementNumber as string;
    expect(softwareId).toBeTruthy();
    expect(managementNumber).toMatch(/^P\d{4}/);
  });

  test('Step 2: TM이 관리대장에서 등록 확인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await getTestSoftware(page, softwareId, 'technical_manager');
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.name).toBe('WF-14a 테스트 소프트웨어');
    expect(data.testField).toBe('RED');
    expect(data.manufacturer).toBe('WF Test Corp');
    expect(data.availability).toBe('available');
    expect(data.managementNumber).toBe(managementNumber);
  });
});
