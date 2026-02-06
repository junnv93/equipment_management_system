/**
 * 페이지 네비게이션 헬퍼
 */

import { type Page } from '@playwright/test';
import { TIMEOUTS } from '../constants/test-data';

/**
 * 장비 상세 페이지로 이동
 */
export async function navigateToEquipmentDetail(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}`, {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  console.log(`✓ 장비 상세 페이지 이동: ${equipmentId}`);
}

/**
 * 장비 목록 페이지로 이동
 */
export async function navigateToEquipmentList(page: Page): Promise<void> {
  await page.goto('/equipment', {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  console.log('✓ 장비 목록 페이지 이동');
}

/**
 * 대시보드로 이동
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto('/', {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  console.log('✓ 대시보드 이동');
}

/**
 * 부적합 관리 페이지로 이동
 */
export async function navigateToNCManagement(page: Page, equipmentId: string): Promise<void> {
  await page.goto(`/equipment/${equipmentId}/non-conformance`, {
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  console.log(`✓ 부적합 관리 페이지 이동: ${equipmentId}`);
}

/**
 * 페이지 새로고침
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload({
    waitUntil: 'networkidle',
    timeout: TIMEOUTS.PAGE_LOAD,
  });
  console.log('✓ 페이지 새로고침');
}
