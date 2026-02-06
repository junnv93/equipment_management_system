/**
 * Helper functions for non-conformance operations
 */

import { Page } from '@playwright/test';
import { FRONTEND_BASE_URL, TIMEOUTS } from '../constants/test-data';

/**
 * Get CSRF token from NextAuth
 *
 * @param page - Playwright Page
 * @returns CSRF token string
 */
export async function getCSRFToken(page: Page): Promise<string> {
  const response = await page.request.get(`${FRONTEND_BASE_URL}/api/auth/csrf`);
  const data = await response.json();
  return data.csrfToken;
}

/**
 * Close a non-conformance via API (for technical manager/lab manager)
 *
 * @param page - Playwright Page
 * @param ncId - Non-conformance ID to close
 * @param closedBy - User ID closing the NC
 * @returns API response JSON
 */
export async function closeNcViaApi(page: Page, ncId: string, closedBy: string): Promise<unknown> {
  const csrfToken = await getCSRFToken(page);

  const response = await page.request.patch(`/api/non-conformances/${ncId}/close`, {
    data: {
      closedBy,
      closureNotes: 'E2E 테스트 종료',
    },
    headers: {
      'X-CSRF-Token': csrfToken,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to close NC: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Create a non-conformance via API
 *
 * @param page - Playwright Page
 * @param data - NC creation data
 * @returns Created NC response
 */
export async function createNcViaApi(
  page: Page,
  data: {
    equipmentId: string;
    ncType: string;
    cause: string;
    discoveredBy: string;
  }
): Promise<unknown> {
  const csrfToken = await getCSRFToken(page);

  const response = await page.request.post('/api/non-conformances', {
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    data: {
      equipmentId: data.equipmentId,
      discoveryDate: new Date().toISOString().split('T')[0],
      discoveredBy: data.discoveredBy,
      cause: data.cause,
      ncType: data.ncType,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create NC: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Extract NC ID from URL or data attribute
 *
 * @param page - Playwright Page
 * @returns NC ID string or null
 */
export async function extractNcIdFromPage(page: Page): Promise<string | null> {
  // Try to get from URL first
  const url = page.url();
  const urlMatch = url.match(/non-conformance\/([a-f0-9-]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try to get from data attribute
  const ncCard = page.locator('[data-nc-id]').first();
  if (await ncCard.isVisible()) {
    return ncCard.getAttribute('data-nc-id');
  }

  return null;
}

/**
 * Wait for NC status change with polling
 *
 * @param page - Playwright Page
 * @param ncId - NC ID to monitor
 * @param expectedStatus - Expected status text (e.g., "조치 완료", "종료")
 * @param maxAttempts - Maximum polling attempts
 */
export async function waitForNcStatusChange(
  page: Page,
  ncId: string,
  expectedStatus: string,
  maxAttempts = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await page.reload();
    await page.waitForTimeout(TIMEOUTS.UI_UPDATE);

    const statusText = page.locator(`[data-nc-id="${ncId}"]`).or(page.locator('body'));
    if (await statusText.getByText(new RegExp(expectedStatus, 'i')).isVisible()) {
      return;
    }
  }

  throw new Error(`NC status did not change to "${expectedStatus}" after ${maxAttempts} attempts`);
}
