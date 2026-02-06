/**
 * Checkout Test Assertion Helpers
 *
 * Custom assertion utilities using SSOT labels for better test readability
 */

import { Page, expect } from '@playwright/test';
import {
  CHECKOUT_STATUS_LABELS,
  CHECKOUT_PURPOSE_LABELS,
  CheckoutStatus,
  CheckoutPurpose,
} from '@equipment-management/schemas';

// ============================================================================
// Status Badge Assertions
// ============================================================================

/**
 * Assert checkout status badge using SSOT labels
 *
 * @example
 * await expectStatusBadge(page, 'approved');
 */
export async function expectStatusBadge(page: Page, status: CheckoutStatus): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status];
  await expect(page.getByRole('status', { name: label })).toBeVisible();
}

/**
 * Assert checkout status badge is not visible
 *
 * @example
 * await expectStatusBadgeHidden(page, 'pending');
 */
export async function expectStatusBadgeHidden(page: Page, status: CheckoutStatus): Promise<void> {
  const label = CHECKOUT_STATUS_LABELS[status];
  await expect(page.getByRole('status', { name: label })).not.toBeVisible();
}

/**
 * Assert purpose badge using SSOT labels
 *
 * @example
 * await expectPurposeBadge(page, 'calibration');
 */
export async function expectPurposeBadge(page: Page, purpose: CheckoutPurpose): Promise<void> {
  const label = CHECKOUT_PURPOSE_LABELS[purpose];
  await expect(page.getByText(label)).toBeVisible();
}

// ============================================================================
// Message Assertions
// ============================================================================

/**
 * Assert error message is displayed
 *
 * @example
 * await expectErrorMessage(page, '권한이 없습니다');
 */
export async function expectErrorMessage(page: Page, message: string): Promise<void> {
  await expect(page.getByRole('alert').getByText(message)).toBeVisible();
}

/**
 * Assert success message is displayed
 *
 * @example
 * await expectSuccessMessage(page, '반출이 승인되었습니다');
 */
export async function expectSuccessMessage(page: Page, message: string): Promise<void> {
  await expect(page.getByRole('status').getByText(message)).toBeVisible();
}

/**
 * Assert warning message is displayed
 *
 * @example
 * await expectWarningMessage(page, '반입 기한이 초과되었습니다');
 */
export async function expectWarningMessage(page: Page, message: string): Promise<void> {
  await expect(page.getByRole('alert', { name: /warning/i }).getByText(message)).toBeVisible();
}

/**
 * Assert info message is displayed
 *
 * @example
 * await expectInfoMessage(page, '검사 항목을 확인해주세요');
 */
export async function expectInfoMessage(page: Page, message: string): Promise<void> {
  await expect(page.getByRole('alert', { name: /info/i }).getByText(message)).toBeVisible();
}

// ============================================================================
// Button/Action Assertions
// ============================================================================

/**
 * Assert button is enabled
 *
 * @example
 * await expectButtonEnabled(page, '승인');
 */
export async function expectButtonEnabled(page: Page, buttonName: string): Promise<void> {
  await expect(page.getByRole('button', { name: buttonName })).toBeEnabled();
}

/**
 * Assert button is disabled
 *
 * @example
 * await expectButtonDisabled(page, '승인');
 */
export async function expectButtonDisabled(page: Page, buttonName: string): Promise<void> {
  await expect(page.getByRole('button', { name: buttonName })).toBeDisabled();
}

/**
 * Assert button is visible
 *
 * @example
 * await expectButtonVisible(page, '반출 시작');
 */
export async function expectButtonVisible(page: Page, buttonName: string): Promise<void> {
  await expect(page.getByRole('button', { name: buttonName })).toBeVisible();
}

/**
 * Assert button is hidden
 *
 * @example
 * await expectButtonHidden(page, '반출 시작');
 */
export async function expectButtonHidden(page: Page, buttonName: string): Promise<void> {
  await expect(page.getByRole('button', { name: buttonName })).not.toBeVisible();
}

// ============================================================================
// Form Field Assertions
// ============================================================================

/**
 * Assert form field has value
 *
 * @example
 * await expectFieldValue(page, '반출 장소', '한국교정시험연구원');
 */
export async function expectFieldValue(
  page: Page,
  fieldLabel: string,
  expectedValue: string
): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toHaveValue(expectedValue);
}

/**
 * Assert form field is required
 *
 * @example
 * await expectFieldRequired(page, '반출 사유');
 */
export async function expectFieldRequired(page: Page, fieldLabel: string): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toHaveAttribute('required', '');
}

/**
 * Assert form field has error
 *
 * @example
 * await expectFieldError(page, '반출 장소', '필수 입력 항목입니다');
 */
export async function expectFieldError(
  page: Page,
  fieldLabel: string,
  errorMessage: string
): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  const errorElement = field.locator('..').getByText(errorMessage);
  await expect(errorElement).toBeVisible();
}

// ============================================================================
// List/Table Assertions
// ============================================================================

/**
 * Assert checkout exists in list
 *
 * @example
 * await expectCheckoutInList(page, CHECKOUT_001_ID);
 */
export async function expectCheckoutInList(page: Page, checkoutId: string): Promise<void> {
  const row = page.getByTestId(`checkout-row-${checkoutId}`);
  await expect(row).toBeVisible();
}

/**
 * Assert checkout not in list
 *
 * @example
 * await expectCheckoutNotInList(page, CHECKOUT_001_ID);
 */
export async function expectCheckoutNotInList(page: Page, checkoutId: string): Promise<void> {
  const row = page.getByTestId(`checkout-row-${checkoutId}`);
  await expect(row).not.toBeVisible();
}

/**
 * Assert list has item count
 *
 * @example
 * await expectListItemCount(page, 10);
 */
export async function expectListItemCount(page: Page, expectedCount: number): Promise<void> {
  const rows = page.getByRole('row');
  const actualCount = await rows.count();
  expect(actualCount - 1).toBe(expectedCount); // Subtract header row
}

/**
 * Assert list is empty
 *
 * @example
 * await expectEmptyList(page);
 */
export async function expectEmptyList(page: Page): Promise<void> {
  await expect(page.getByText('반출 내역이 없습니다')).toBeVisible();
}

// ============================================================================
// Detail Page Assertions
// ============================================================================

/**
 * Assert checkout detail field value
 *
 * @example
 * await expectDetailFieldValue(page, '반출 목적', '교정');
 */
export async function expectDetailFieldValue(
  page: Page,
  fieldLabel: string,
  expectedValue: string
): Promise<void> {
  const field = page.getByTestId(`detail-${fieldLabel}`);
  await expect(field).toHaveText(expectedValue);
}

/**
 * Assert checkout has equipment
 *
 * @example
 * await expectCheckoutHasEquipment(page, 'Spectrum Analyzer');
 */
export async function expectCheckoutHasEquipment(page: Page, equipmentName: string): Promise<void> {
  await expect(page.getByText(equipmentName)).toBeVisible();
}

/**
 * Assert equipment status on detail page
 *
 * @example
 * await expectEquipmentStatusOnDetail(page, 'checked_out');
 */
export async function expectEquipmentStatusOnDetail(
  page: Page,
  expectedStatus: string
): Promise<void> {
  const statusBadge = page.getByTestId('equipment-status-badge');
  await expect(statusBadge).toContainText(expectedStatus);
}

// ============================================================================
// Inspection Assertions
// ============================================================================

/**
 * Assert inspection checkbox is checked
 *
 * @example
 * await expectInspectionChecked(page, '교정 상태 확인');
 */
export async function expectInspectionChecked(page: Page, inspectionLabel: string): Promise<void> {
  const checkbox = page.getByLabel(inspectionLabel);
  await expect(checkbox).toBeChecked();
}

/**
 * Assert inspection checkbox is unchecked
 *
 * @example
 * await expectInspectionUnchecked(page, '교정 상태 확인');
 */
export async function expectInspectionUnchecked(
  page: Page,
  inspectionLabel: string
): Promise<void> {
  const checkbox = page.getByLabel(inspectionLabel);
  await expect(checkbox).not.toBeChecked();
}

/**
 * Assert inspection is required
 *
 * @example
 * await expectInspectionRequired(page, '작동 상태 확인');
 */
export async function expectInspectionRequired(page: Page, inspectionLabel: string): Promise<void> {
  const checkbox = page.getByLabel(inspectionLabel);
  await expect(checkbox).toHaveAttribute('required', '');
}

// ============================================================================
// Rental 4-Step Assertions
// ============================================================================

/**
 * Assert rental step is active
 *
 * @example
 * await expectRentalStepActive(page, 1); // Step ① active
 */
export async function expectRentalStepActive(page: Page, stepNumber: number): Promise<void> {
  const step = page.getByTestId(`rental-step-${stepNumber}`);
  await expect(step).toHaveClass(/active/);
}

/**
 * Assert rental step is completed
 *
 * @example
 * await expectRentalStepCompleted(page, 1); // Step ① completed
 */
export async function expectRentalStepCompleted(page: Page, stepNumber: number): Promise<void> {
  const step = page.getByTestId(`rental-step-${stepNumber}`);
  await expect(step).toHaveClass(/completed/);
}

/**
 * Assert rental lender info is visible
 *
 * @example
 * await expectRentalLenderInfo(page, 'FCC EMC/RF', '수원');
 */
export async function expectRentalLenderInfo(
  page: Page,
  teamName: string,
  siteName: string
): Promise<void> {
  await expect(page.getByText(teamName)).toBeVisible();
  await expect(page.getByText(siteName)).toBeVisible();
}

// ============================================================================
// Permission Assertions
// ============================================================================

/**
 * Assert access denied message
 *
 * @example
 * await expectAccessDenied(page);
 */
export async function expectAccessDenied(page: Page): Promise<void> {
  await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();
}

/**
 * Assert action not allowed message
 *
 * @example
 * await expectActionNotAllowed(page, '승인');
 */
export async function expectActionNotAllowed(page: Page, actionName: string): Promise<void> {
  await expect(page.getByText(`${actionName} 권한이 없습니다`)).toBeVisible();
}

// ============================================================================
// Pagination Assertions
// ============================================================================

/**
 * Assert current page number
 *
 * @example
 * await expectCurrentPage(page, 2);
 */
export async function expectCurrentPage(page: Page, pageNumber: number): Promise<void> {
  const currentPageButton = page.getByRole('button', {
    name: pageNumber.toString(),
    pressed: true,
  });
  await expect(currentPageButton).toBeVisible();
}

/**
 * Assert total pages
 *
 * @example
 * await expectTotalPages(page, 5);
 */
export async function expectTotalPages(page: Page, expectedPages: number): Promise<void> {
  const paginationInfo = page.getByTestId('pagination-info');
  await expect(paginationInfo).toContainText(`총 ${expectedPages} 페이지`);
}

// ============================================================================
// Overdue Assertions
// ============================================================================

/**
 * Assert overdue warning is visible
 *
 * @example
 * await expectOverdueWarning(page);
 */
export async function expectOverdueWarning(page: Page): Promise<void> {
  await expect(page.getByTestId('overdue-warning')).toBeVisible();
}

/**
 * Assert overdue badge is visible
 *
 * @example
 * await expectOverdueBadge(page);
 */
export async function expectOverdueBadge(page: Page): Promise<void> {
  const overdueLabel = CHECKOUT_STATUS_LABELS.overdue;
  await expect(page.getByRole('status', { name: overdueLabel })).toBeVisible();
}

// ============================================================================
// Date/Time Assertions
// ============================================================================

/**
 * Assert date field has value
 *
 * @example
 * await expectDateValue(page, '예상 반입 일시', '2026-03-01');
 */
export async function expectDateValue(
  page: Page,
  fieldLabel: string,
  expectedDate: string
): Promise<void> {
  const field = page.getByLabel(fieldLabel);
  await expect(field).toHaveValue(expectedDate);
}

/**
 * Assert date is in the past
 *
 * @example
 * await expectDateInPast(page, 'expectedReturnDate');
 */
export async function expectDateInPast(page: Page, fieldTestId: string): Promise<void> {
  const dateText = await page.getByTestId(fieldTestId).textContent();
  const date = new Date(dateText || '');
  const now = new Date();
  expect(date < now).toBeTruthy();
}

/**
 * Assert date is in the future
 *
 * @example
 * await expectDateInFuture(page, 'expectedReturnDate');
 */
export async function expectDateInFuture(page: Page, fieldTestId: string): Promise<void> {
  const dateText = await page.getByTestId(fieldTestId).textContent();
  const date = new Date(dateText || '');
  const now = new Date();
  expect(date > now).toBeTruthy();
}
