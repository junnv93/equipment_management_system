/**
 * Shared dialog helpers for E2E tests
 *
 * Helper functions for interacting with shadcn/ui dialog and select components.
 */

import { Page, expect } from '@playwright/test';

/**
 * Select an option from a shadcn/ui Select component (combobox pattern)
 *
 * @param page - Playwright Page
 * @param labelPattern - Label text pattern to find the select
 * @param optionText - Exact text of the option to select
 *
 * @example
 * await selectShadcnOption(page, /사고 유형/i, '손상');
 */
export async function selectShadcnOption(
  page: Page,
  labelPattern: string | RegExp,
  optionText: string
): Promise<void> {
  const label = page.getByText(labelPattern).first();
  await expect(label).toBeVisible({ timeout: 5000 });

  const formItem = label.locator('..');
  const selectTrigger = formItem.getByRole('combobox').first();

  await selectTrigger.click();
  const option = page.getByRole('option', { name: optionText, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
}

/**
 * Wait for and click a confirmation dialog button
 *
 * @param page - Playwright Page
 * @param buttonName - Button text to click (e.g. '확인', '취소')
 */
export async function confirmDialog(page: Page, buttonName: string = '확인'): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog.getByRole('button', { name: buttonName }).click();
}
