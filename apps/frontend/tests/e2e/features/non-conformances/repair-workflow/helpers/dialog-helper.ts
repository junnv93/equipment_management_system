/**
 * Helper functions for opening dialogs in NC-Repair workflow tests
 */

import type { Page } from '@playwright/test';
import { TIMEOUTS } from '../constants/test-data';

/**
 * Select an option from a shadcn/ui Select component (combobox pattern)
 *
 * This helper works with the shadcn/ui Select component used throughout the app.
 * Unlike native <select> elements, shadcn Select uses a combobox pattern with
 * a button trigger and a popover with options.
 *
 * @param page - Playwright Page
 * @param labelPattern - Label text pattern to find the select (e.g. /사고 유형/i)
 * @param optionText - Exact text of the option to select (e.g. "손상")
 *
 * @example
 * await selectShadcnOption(page, /사고 유형/i, '손상');
 */
export async function selectShadcnOption(
  page: Page,
  labelPattern: string | RegExp,
  optionText: string
): Promise<void> {
  // Find the label
  const label = page.getByText(labelPattern).first();
  await label.waitFor({ state: 'visible', timeout: 5000 });

  // Find the combobox trigger button (it's usually a sibling or child of the label's parent container)
  // The SelectTrigger has role="combobox"
  const formItem = label.locator('..');
  const selectTrigger = formItem.getByRole('combobox').first();

  // Click to open the dropdown
  await selectTrigger.click();

  // Wait for options list to appear

  // Click the desired option
  await page.getByRole('option', { name: optionText, exact: true }).click();

  // Wait for selection to complete and dropdown to close
}

/**
 * Open repair history creation dialog
 *
 * @param page - Playwright Page
 * @param equipmentId - Equipment ID to navigate to
 */
export async function openRepairDialog(page: Page, equipmentId: string): Promise<void> {
  // Navigate directly to repair history page (not a tab, but a separate page)
  await page.goto(`/equipment/${equipmentId}/repair-history`);

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');

  // Click add repair history button (use .first() as there may be multiple buttons)
  await page
    .getByRole('button', { name: /수리 이력 추가/i })
    .first()
    .click();

  // Wait for dialog to appear by checking for the dialog title
  await page
    .getByRole('heading', { name: '수리 이력 등록' })
    .waitFor({ state: 'visible', timeout: 5000 });

  // Wait for dialog animation to complete
}

/**
 * Open incident registration dialog
 *
 * @param page - Playwright Page
 * @param equipmentId - Equipment ID to navigate to
 */
export async function openIncidentDialog(page: Page, equipmentId: string): Promise<void> {
  // Navigate to equipment detail page
  await page.goto(`/equipment/${equipmentId}`);

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');

  // Click incident history tab and wait for it to be selected
  const incidentTab = page.getByRole('tab', { name: /사고 이력/i });
  await incidentTab.click();

  // Wait for tab to be selected (aria-selected="true")
  await incidentTab.waitFor({ state: 'attached' });

  // Wait for tab content to load (tabs use dynamic import with loading skeleton)
  // Wait until the loading skeleton is gone and actual content is visible
  // First wait for button to exist (might be in loading state)
  const registerButton = page.getByRole('button', { name: /사고 등록/i }).first();
  await registerButton.waitFor({ state: 'attached', timeout: 15000 });

  // Then wait additional time for animations and ensure button is fully interactive
  await registerButton.waitFor({ state: 'visible', timeout: 5000 });
  await registerButton.click();

  // Wait for dialog to appear by checking for the dialog title
  await page
    .getByRole('heading', { name: '사고 이력 등록' })
    .waitFor({ state: 'visible', timeout: 5000 });

  // Wait for dialog animation to complete and form to be ready

  // Verify the form label exists inside the dialog (use .first() — both the label and the
  // helper description text match /사고 유형/i; the label is always the first occurrence)
  await page
    .getByRole('dialog')
    .getByText(/사고 유형/i)
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Open non-conformance edit dialog
 *
 * @param page - Playwright Page
 * @param equipmentId - Equipment ID to navigate to
 */
export async function openNonConformanceEditDialog(page: Page, equipmentId: string): Promise<void> {
  // Navigate to non-conformance management page
  await page.goto(`/equipment/${equipmentId}/non-conformance`);

  // Click edit button (for technical manager)
  await page
    .getByRole('button', { name: /기록 수정/i })
    .first()
    .click();

  // Wait for dialog animation
}
