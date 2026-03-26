/**
 * Shared navigation helpers for E2E tests
 *
 * Centralized page navigation functions to avoid duplication
 * across feature test directories.
 *
 * 호출측에서 페이지 콘텐츠 요소(heading, table 등)의 visibility를
 * 직접 assert해야 합니다. networkidle은 SSE/폴링 페이지에서 resolve되지 않으며
 * 불필요한 대기 시간을 발생시킵니다.
 */

import { type Page } from '@playwright/test';

export async function navigateToEquipmentDetail(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}`);
}

export async function navigateToEquipmentList(page: Page): Promise<void> {
  await page.goto('/equipment');
}

export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/');
}

export async function navigateToCheckoutList(page: Page): Promise<void> {
  await page.goto('/checkouts');
}

export async function navigateToCheckoutDetail(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
}

export async function navigateToCheckoutCreate(page: Page): Promise<void> {
  await page.goto('/checkouts/create');
}

export async function navigateToNCManagement(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/non-conformance`);
}

export async function navigateToRepairHistory(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/repair-history`);
}

export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
}
