/**
 * 페이지 네비게이션 헬퍼
 *
 * 호출측에서 페이지 콘텐츠 요소의 visibility를 직접 assert해야 합니다.
 */

import { type Page } from '@playwright/test';

/**
 * 장비 상세 페이지로 이동
 */
export async function navigateToEquipmentDetail(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}`);
}

/**
 * 장비 목록 페이지로 이동
 */
export async function navigateToEquipmentList(page: Page): Promise<void> {
  await page.goto('/equipment');
}

/**
 * 대시보드로 이동
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/');
}

/**
 * 부적합 관리 페이지로 이동
 */
export async function navigateToNCManagement(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/non-conformance`);
}

/**
 * 페이지 새로고침
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
}
