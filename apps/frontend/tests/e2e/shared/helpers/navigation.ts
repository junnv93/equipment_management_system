/**
 * Shared navigation helpers for E2E tests
 *
 * Centralized page navigation functions to avoid duplication
 * across feature test directories.
 */

import { type Page } from '@playwright/test';
import { TEST_TIMEOUTS } from '../constants/shared-test-data';

export async function navigateToEquipmentDetail(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}`, {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToEquipmentList(page: Page): Promise<void> {
  await page.goto('/equipment', {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/', {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToCheckoutList(page: Page): Promise<void> {
  await page.goto('/checkouts', {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToCheckoutDetail(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`, {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToCheckoutCreate(page: Page): Promise<void> {
  await page.goto('/checkouts/create', {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToNCManagement(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/non-conformance`, {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function navigateToRepairHistory(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/repair-history`, {
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}

export async function reloadPage(page: Page): Promise<void> {
  await page.reload({
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD,
  });
}
