/**
 * Checkout Test Helper Functions
 *
 * Reusable utilities for E2E checkout tests following SSOT principles
 */

import { Page, expect } from '@playwright/test';
import {
  CHECKOUT_STATUS_VALUES,
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_PURPOSE_VALUES,
  CHECKOUT_PURPOSE_LABELS,
} from '@equipment-management/schemas';

// ============================================================================
// Types
// ============================================================================

export interface CreateCheckoutOptions {
  equipmentIds: string[];
  purpose: 'calibration' | 'repair' | 'rental';
  destination: string;
  reason: string;
  expectedReturnDate: string;
  lenderTeamId?: string; // For rental only
  lenderSiteId?: string; // For rental only
}

export interface ReturnCheckoutInspections {
  calibrationChecked?: boolean;
  repairChecked?: boolean;
  workingStatusChecked: boolean;
}

// ============================================================================
// Checkout Request Helpers
// ============================================================================

/**
 * Create a checkout request via UI
 *
 * @example
 * await createCheckoutRequest(page, {
 *   equipmentIds: [EQUIP_SPECTRUM_ANALYZER_SUW_E_ID],
 *   purpose: 'calibration',
 *   destination: '한국교정시험연구원',
 *   reason: '정기 교정',
 *   expectedReturnDate: '2026-03-01'
 * });
 */
export async function createCheckoutRequest(
  page: Page,
  options: CreateCheckoutOptions
): Promise<void> {
  // Navigate to create page
  await page.goto('/checkouts/create');

  // Wait for form to load
  await page.waitForLoadState('networkidle');

  // Select equipment
  for (const equipmentId of options.equipmentIds) {
    await page.getByTestId(`equipment-${equipmentId}`).click();
  }

  // Fill form using SSOT labels
  const purposeLabel = CHECKOUT_PURPOSE_LABELS[options.purpose];
  await page.getByLabel('반출 목적').selectOption(purposeLabel);
  await page.getByLabel('반출 장소').fill(options.destination);
  await page.getByLabel('반출 사유').fill(options.reason);
  await page.getByLabel('예상 반입 일시').fill(options.expectedReturnDate);

  if (options.purpose === 'rental') {
    // Rental-specific fields
    if (!options.lenderTeamId || !options.lenderSiteId) {
      throw new Error('lenderTeamId and lenderSiteId are required for rental checkouts');
    }
    await page.getByLabel('대여 제공 팀').selectOption(options.lenderTeamId);
    await page.getByLabel('대여 제공 사이트').selectOption(options.lenderSiteId);
  }

  // Submit
  await page.getByRole('button', { name: '신청하기' }).click();
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Approval/Rejection Helpers
// ============================================================================

/**
 * Approve a checkout via UI
 *
 * @example
 * await approveCheckout(page, CHECKOUT_001_ID);
 */
export async function approveCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '승인' }).click();
  await page.getByRole('button', { name: '확인' }).click(); // Confirmation dialog

  await page.waitForLoadState('networkidle');
}

/**
 * Reject a checkout via UI
 *
 * @example
 * await rejectCheckout(page, CHECKOUT_001_ID, '인증되지 않은 교정기관입니다.');
 */
export async function rejectCheckout(
  page: Page,
  checkoutId: string,
  reason?: string
): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '거절' }).click();

  if (reason) {
    await page.getByLabel('거절 사유').fill(reason);
  }

  await page.getByRole('button', { name: '확인' }).click();
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Checkout/Return Processing Helpers
// ============================================================================

/**
 * Start checkout (change equipment status to checked_out)
 *
 * @example
 * await startCheckout(page, CHECKOUT_009_ID);
 */
export async function startCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반출 시작' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

/**
 * Return checkout with inspections
 *
 * @example
 * await returnCheckout(page, CHECKOUT_019_ID, {
 *   calibrationChecked: true,
 *   workingStatusChecked: true
 * }, '교정 완료, 정상 작동 확인');
 */
export async function returnCheckout(
  page: Page,
  checkoutId: string,
  inspections: ReturnCheckoutInspections,
  notes?: string
): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반입 신청' }).click();

  // Check mandatory inspections
  if (inspections.calibrationChecked) {
    await page.getByLabel('교정 상태 확인').check();
  }
  if (inspections.repairChecked) {
    await page.getByLabel('수리 상태 확인').check();
  }
  if (inspections.workingStatusChecked) {
    await page.getByLabel('작동 상태 확인').check();
  }

  if (notes) {
    await page.getByLabel('반입 비고').fill(notes);
  }

  await page.getByRole('button', { name: '반입 신청' }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Approve return (restore equipment to available)
 *
 * @example
 * await approveReturn(page, CHECKOUT_042_ID);
 */
export async function approveReturn(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반입 승인' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Rental 4-Step Verification Helpers
// ============================================================================

/**
 * Lender pre-checkout check (Step ①)
 *
 * @example
 * await lenderPreCheckout(page, CHECKOUT_027_ID);
 */
export async function lenderPreCheckout(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반출 전 확인 (대여자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

/**
 * Borrower receipt check (Step ②)
 *
 * @example
 * await borrowerReceiptCheck(page, CHECKOUT_027_ID);
 */
export async function borrowerReceiptCheck(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '수령 확인 (차용자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

/**
 * Borrower pre-return check (Step ③)
 *
 * @example
 * await borrowerPreReturn(page, CHECKOUT_030_ID);
 */
export async function borrowerPreReturn(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반입 전 확인 (차용자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

/**
 * Lender final return check (Step ④)
 *
 * @example
 * await lenderFinalCheck(page, CHECKOUT_036_ID);
 */
export async function lenderFinalCheck(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '반입 최종 확인 (대여자)' }).click();
  await page.getByRole('button', { name: '확인' }).click();

  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Verification Helpers (API-based)
// ============================================================================

/**
 * Verify equipment status via API
 *
 * @example
 * await verifyEquipmentStatus(page, EQUIP_SPECTRUM_ANALYZER_SUW_E_ID, 'checked_out');
 */
export async function verifyEquipmentStatus(
  page: Page,
  equipmentId: string,
  expectedStatus: string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await page.request.get(`${backendUrl}/api/equipment/${equipmentId}`);
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.status).toBe(expectedStatus);
}

/**
 * Verify checkout status via API
 *
 * @example
 * await verifyCheckoutStatus(page, CHECKOUT_001_ID, 'approved');
 */
export async function verifyCheckoutStatus(
  page: Page,
  checkoutId: string,
  expectedStatus: string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await page.request.get(`${backendUrl}/api/checkouts/${checkoutId}`);
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.status).toBe(expectedStatus);
}

/**
 * Verify checkout exists in list via API
 *
 * @example
 * await verifyCheckoutInList(page, CHECKOUT_001_ID);
 */
export async function verifyCheckoutInList(page: Page, checkoutId: string): Promise<boolean> {
  const response = await page.request.get('/api/checkouts');
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  const checkouts = data.data || data;

  return checkouts.some((checkout: { id: string }) => checkout.id === checkoutId);
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Navigate to checkout list page
 *
 * @example
 * await navigateToCheckoutList(page);
 */
export async function navigateToCheckoutList(page: Page): Promise<void> {
  await page.goto('/checkouts');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to checkout detail page
 *
 * @example
 * await navigateToCheckoutDetail(page, CHECKOUT_001_ID);
 */
export async function navigateToCheckoutDetail(page: Page, checkoutId: string): Promise<void> {
  await page.goto(`/checkouts/${checkoutId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to checkout create page
 *
 * @example
 * await navigateToCheckoutCreate(page);
 */
export async function navigateToCheckoutCreate(page: Page): Promise<void> {
  await page.goto('/checkouts/create');
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Search and Filter Helpers
// ============================================================================

/**
 * Search checkouts by equipment name
 *
 * @example
 * await searchCheckoutsByEquipment(page, 'Spectrum Analyzer');
 */
export async function searchCheckoutsByEquipment(page: Page, equipmentName: string): Promise<void> {
  await page.getByPlaceholder('장비명으로 검색').fill(equipmentName);
  await page.waitForLoadState('networkidle');
}

/**
 * Search checkouts by requester name
 *
 * @example
 * await searchCheckoutsByRequester(page, '김철수');
 */
export async function searchCheckoutsByRequester(page: Page, requesterName: string): Promise<void> {
  await page.getByPlaceholder('신청자명으로 검색').fill(requesterName);
  await page.waitForLoadState('networkidle');
}

/**
 * Filter checkouts by purpose
 *
 * @example
 * await filterCheckoutsByPurpose(page, 'calibration');
 */
export async function filterCheckoutsByPurpose(
  page: Page,
  purpose: 'calibration' | 'repair' | 'rental'
): Promise<void> {
  const label = CHECKOUT_PURPOSE_LABELS[purpose];
  await page.getByLabel('목적 필터').selectOption(label);
  await page.waitForLoadState('networkidle');
}

/**
 * Filter checkouts by status
 *
 * @example
 * await filterCheckoutsByStatus(page, 'pending');
 */
export async function filterCheckoutsByStatus(
  page: Page,
  status: (typeof CHECKOUT_STATUS_VALUES)[number]
): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status as keyof typeof CHECKOUT_STATUS_LABELS];
  await page.getByLabel('상태 필터').selectOption(label);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Navigate to next page of checkouts
 *
 * @example
 * await goToNextPage(page);
 */
export async function goToNextPage(page: Page): Promise<void> {
  await page.getByRole('button', { name: '다음' }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to previous page of checkouts
 *
 * @example
 * await goToPreviousPage(page);
 */
export async function goToPreviousPage(page: Page): Promise<void> {
  await page.getByRole('button', { name: '이전' }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to specific page of checkouts
 *
 * @example
 * await goToPage(page, 3);
 */
export async function goToPage(page: Page, pageNumber: number): Promise<void> {
  await page.getByRole('button', { name: pageNumber.toString() }).click();
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for checkout status badge to appear
 *
 * @example
 * await waitForStatusBadge(page, 'approved');
 */
export async function waitForStatusBadge(
  page: Page,
  status: (typeof CHECKOUT_STATUS_VALUES)[number]
): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status as keyof typeof CHECKOUT_STATUS_LABELS];
  await page.getByRole('status', { name: label }).waitFor({ state: 'visible' });
}

/**
 * Wait for success message
 *
 * @example
 * await waitForSuccessMessage(page, '반출 승인되었습니다');
 */
export async function waitForSuccessMessage(page: Page, message: string): Promise<void> {
  await page.getByRole('status').getByText(message).waitFor({ state: 'visible' });
}

/**
 * Wait for error message
 *
 * @example
 * await waitForErrorMessage(page, '권한이 없습니다');
 */
export async function waitForErrorMessage(page: Page, message: string): Promise<void> {
  await page.getByRole('alert').getByText(message).waitFor({ state: 'visible' });
}

// ============================================================================
// Data Extraction Helpers
// ============================================================================

/**
 * Get checkout count from list
 *
 * @example
 * const count = await getCheckoutCount(page);
 */
export async function getCheckoutCount(page: Page): Promise<number> {
  const rows = await page.getByRole('row').count();
  return rows - 1; // Subtract header row
}

/**
 * Get equipment status from detail page
 *
 * @example
 * const status = await getEquipmentStatusFromDetailPage(page);
 */
export async function getEquipmentStatusFromDetailPage(page: Page): Promise<string> {
  const statusBadge = await page.getByTestId('equipment-status-badge').textContent();
  return statusBadge?.trim() || '';
}

/**
 * Get checkout status from detail page
 *
 * @example
 * const status = await getCheckoutStatusFromDetailPage(page);
 */
export async function getCheckoutStatusFromDetailPage(page: Page): Promise<string> {
  const statusBadge = await page.getByTestId('checkout-status-badge').textContent();
  return statusBadge?.trim() || '';
}
