/**
 * Helper functions for repair history operations
 */

import { Page } from '@playwright/test';
import { getCSRFToken } from './nc-helper';

/**
 * Create repair history via API
 *
 * @param page - Playwright Page
 * @param data - Repair history data
 * @returns Created repair history response
 */
export async function createRepairViaApi(
  page: Page,
  data: {
    equipmentId: string;
    repairDate: string;
    repairDescription: string;
    repairedBy?: string;
    cost?: number;
    repairResult: string;
    nonConformanceId?: string;
  }
): Promise<unknown> {
  const csrfToken = await getCSRFToken(page);

  const response = await page.request.post('/api/repair-history', {
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    data: {
      equipmentId: data.equipmentId,
      repairDate: data.repairDate,
      repairDescription: data.repairDescription,
      repairedBy: data.repairedBy || 'E2E 테스터',
      cost: data.cost || 0,
      repairResult: data.repairResult,
      nonConformanceId: data.nonConformanceId,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create repair: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Fill repair history form in dialog
 *
 * @param page - Playwright Page
 * @param data - Repair form data
 */
export async function fillRepairForm(
  page: Page,
  data: {
    repairDate: string;
    repairDescription: string;
    repairedBy: string;
    cost: string;
    repairResult: string;
    nonConformanceId?: string;
  }
): Promise<void> {
  // Fill basic fields
  await page.fill('[id="repairDate"]', data.repairDate);
  await page.fill('[id="repairDescription"]', data.repairDescription);
  await page.fill('[id="repairedBy"]', data.repairedBy);
  await page.fill('[id="cost"]', data.cost);

  // Select repair result
  await page.selectOption('[id="repairResult"]', data.repairResult);

  // Select non-conformance if provided
  if (data.nonConformanceId) {
    await page.click('[id="nonConformanceId"]');

    // Find NC option by text (contains NC cause/type)
    const ncOption = page.getByRole('option').first();
    await ncOption.click();
  }
}

/**
 * Extract repair history ID from page
 *
 * @param page - Playwright Page
 * @returns Repair ID or null
 */
export async function extractRepairIdFromPage(page: Page): Promise<string | null> {
  // Try URL pattern
  const url = page.url();
  const urlMatch = url.match(/repair-history\/([a-f0-9-]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try data attribute
  const repairCard = page.locator('[data-repair-id]').first();
  if (await repairCard.isVisible()) {
    return repairCard.getAttribute('data-repair-id');
  }

  return null;
}
