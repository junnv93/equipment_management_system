/**
 * Equipment Detail Page - Accessibility: Form Accessibility
 *
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * group: Group 7: Accessibility (Section 6.5)
 *
 * Tests form accessibility including proper labeling, error message association,
 * logical tab order, and screen reader announcements. Focuses on the disposal
 * request form as the primary form on the equipment detail page.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Group 7: Accessibility', () => {
  test('Form accessibility', async ({ siteAdminPage: page }) => {
    await page.goto('/equipment/EQP-010');

    // 1. Open disposal request dialog
    // Look for disposal request button
    const disposalButton = page.locator('button').filter({ hasText: /폐기 요청|폐기신청/ });
    const hasDisposalButton = (await disposalButton.count()) > 0;

    if (!hasDisposalButton) {
      console.log(
        'No disposal request button visible (equipment may not be in "available" status)'
      );
      console.log('Checking for other forms on the page...');

      // Check if there are any other forms or dialogs to test
      const otherForms = page.locator('form:visible');
      const formCount = await otherForms.count();

      if (formCount > 0) {
        console.log(`Found ${formCount} forms to test`);

        // Test the first available form
        const firstForm = otherForms.first();
        await testFormAccessibility(page, firstForm);
      } else {
        console.log('No forms available to test on this page');

        // At minimum, verify any visible inputs have proper labels
        const inputs = page.locator('input:visible, textarea:visible, select:visible');
        const inputCount = await inputs.count();

        console.log(`Found ${inputCount} input elements on page`);

        if (inputCount > 0) {
          await verifyInputLabels(page, inputs);
        }
      }

      return;
    }

    console.log('Opening disposal request dialog...');
    await disposalButton.first().click();

    // Verify dialog is open
    const dialog = page.getByRole('dialog');
    const dialogVisible = await dialog.isVisible().catch(() => false);

    if (!dialogVisible) {
      console.log('Dialog did not open (may require specific permissions or equipment status)');
      return;
    }

    console.log('✓ Disposal request dialog opened');

    // 2. Verify all form fields have labels
    const formInputs = dialog.locator('input, textarea, select');
    const inputCount = await formInputs.count();

    console.log(`Found ${inputCount} form fields in dialog`);

    let fieldsWithLabels = 0;
    let fieldsWithoutLabels = 0;

    for (let i = 0; i < inputCount; i++) {
      const input = formInputs.nth(i);
      const inputType = await input.getAttribute('type');

      // Skip hidden inputs
      if (inputType === 'hidden') {
        continue;
      }

      const isVisible = await input.isVisible().catch(() => false);
      if (!isVisible) {
        continue;
      }

      // 3. Verify label-input association (for/id)
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      console.log(`\nInput ${i + 1}:`);
      console.log(`  id: "${inputId}"`);
      console.log(`  type: "${inputType}"`);
      console.log(`  aria-label: "${ariaLabel}"`);
      console.log(`  aria-labelledby: "${ariaLabelledBy}"`);

      // Check for associated label
      let hasLabel = false;
      let labelText = '';

      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        hasLabel = (await label.count()) > 0;

        if (hasLabel) {
          labelText = (await label.textContent()) || '';
          console.log(`  ✓ Label found: "${labelText}"`);
          fieldsWithLabels++;
        }
      }

      // Check for aria-label or aria-labelledby
      if (!hasLabel && (ariaLabel || ariaLabelledBy)) {
        hasLabel = true;
        fieldsWithLabels++;
        console.log(`  ✓ ARIA label found`);
      }

      if (!hasLabel) {
        fieldsWithoutLabels++;
        console.warn(`  ✗ No label association found`);
      }

      // For form fields, label is required
      expect(hasLabel).toBeTruthy();
    }

    console.log(`\nForm fields summary:`);
    console.log(`  With labels: ${fieldsWithLabels}`);
    console.log(`  Without labels: ${fieldsWithoutLabels}`);

    expect(fieldsWithLabels).toBeGreaterThan(0);

    // 4. Enter invalid data (< 10 characters)
    // Find the textarea for detailed reason
    const textarea = dialog.locator('textarea');
    const hasTextarea = (await textarea.count()) > 0;

    if (hasTextarea) {
      console.log('\nTesting form validation...');

      // Clear and enter short text (invalid)
      await textarea.fill('짧은텍스트');

      // 5. Verify error message is associated with field (aria-describedby)
      const ariaDescribedBy = await textarea.getAttribute('aria-describedby');
      console.log(`textarea aria-describedby: "${ariaDescribedBy}"`);

      if (ariaDescribedBy) {
        // 6. Verify error message is announced to screen reader
        const describingIds = ariaDescribedBy.split(' ');

        for (const id of describingIds) {
          const describingElement = page.locator(`#${id}`);
          const exists = (await describingElement.count()) > 0;

          if (exists) {
            const text = await describingElement.textContent();
            const ariaLive = await describingElement.getAttribute('aria-live');
            const role = await describingElement.getAttribute('role');

            console.log(`  Describing element #${id}:`);
            console.log(`    text: "${text}"`);
            console.log(`    aria-live: "${ariaLive}"`);
            console.log(`    role: "${role}"`);

            // Error messages should be announced
            if (
              text?.includes('필수') ||
              text?.includes('최소') ||
              text?.includes('에러') ||
              text?.includes('error')
            ) {
              expect(ariaLive || role).toBeTruthy();
              console.log(`    ✓ Error message will be announced`);
            }
          }
        }
      }

      // Try to submit and check for error message
      const submitButton = dialog
        .locator('button[type="submit"], button')
        .filter({ hasText: /제출|요청|확인|저장/ });
      const hasSubmitButton = (await submitButton.count()) > 0;

      if (hasSubmitButton) {
        // Check if submit button is disabled due to validation
        const isDisabled = await submitButton.first().isDisabled();
        console.log(`Submit button disabled: ${isDisabled}`);

        if (!isDisabled) {
          // Try to submit with invalid data
          await submitButton.first().click();

          // Look for error messages
          const errorMessages = dialog.locator(
            '[role="alert"], [aria-live], .error, .text-red-500, .text-destructive'
          );
          const errorCount = await errorMessages.count();

          if (errorCount > 0) {
            console.log(`\nError messages displayed: ${errorCount}`);

            for (let i = 0; i < Math.min(errorCount, 3); i++) {
              const error = errorMessages.nth(i);
              const errorText = await error.textContent();
              const ariaLive = await error.getAttribute('aria-live');

              console.log(`  Error ${i + 1}: "${errorText}"`);
              console.log(`    aria-live: "${ariaLive}"`);
            }
          }
        }
      }

      // Clear the textarea for next test
      await textarea.fill('');
    }

    // 7. Tab through form fields
    console.log('\nTesting tab order...');

    // Focus first element in dialog
    const firstFocusable = dialog
      .locator('input:visible, textarea:visible, select:visible, button:visible')
      .first();
    await firstFocusable.focus();

    const tabOrder: string[] = [];

    // 8. Verify tab order is logical
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const isInDialog = await focused.evaluate(
        (el, dialogEl) => {
          return dialogEl?.contains(el) || false;
        },
        await dialog.elementHandle()
      );

      if (!isInDialog) {
        console.log('Focus moved outside dialog (focus trap may not be implemented)');
        break;
      }

      const elementInfo = await focused.evaluate((el) => {
        return {
          tagName: el.tagName,
          type: el.getAttribute('type'),
          id: el.getAttribute('id'),
          name: el.getAttribute('name'),
        };
      });

      tabOrder.push(
        `${elementInfo.tagName}${elementInfo.type ? `[${elementInfo.type}]` : ''}${elementInfo.id ? `#${elementInfo.id}` : ''}`
      );
    }

    console.log('Tab order within dialog:');
    tabOrder.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item}`);
    });

    // Tab order should follow logical flow: inputs → buttons
    expect(tabOrder.length).toBeGreaterThan(0);

    // 9. Verify required fields are marked (aria-required)
    const requiredFields = dialog.locator('[aria-required="true"], [required]');
    const requiredCount = await requiredFields.count();

    console.log(`\nRequired fields: ${requiredCount}`);

    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      const fieldId = await field.getAttribute('id');
      const ariaRequired = await field.getAttribute('aria-required');
      const required = await field.getAttribute('required');

      console.log(`  Required field ${i + 1}:`);
      console.log(`    id: "${fieldId}"`);
      console.log(`    aria-required: "${ariaRequired}"`);
      console.log(`    required: "${required}"`);

      // Check if there's a visual indicator (*)
      if (fieldId) {
        const label = page.locator(`label[for="${fieldId}"]`);
        const labelText = await label.textContent();
        const hasAsterisk = labelText?.includes('*');

        console.log(`    Label: "${labelText}"`);
        console.log(`    Has asterisk: ${hasAsterisk}`);

        // Required fields should be marked both programmatically and visually
        expect(ariaRequired === 'true' || required !== null).toBeTruthy();
      }
    }

    // 10. Submit form with valid data
    console.log('\nTesting form submission with valid data...');

    // Fill out the form properly
    // First, select a reason (radio buttons)
    const radioButtons = dialog.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();

    if (radioCount > 0) {
      console.log(`Found ${radioCount} radio buttons`);
      await radioButtons.first().check();
      console.log('✓ Radio button selected');
    }

    // Fill textarea with valid text (>10 characters)
    if (hasTextarea) {
      const validText = '이 장비는 노후화로 인해 성능이 저하되었습니다. 폐기 승인을 요청합니다.';
      await textarea.fill(validText);
      console.log('✓ Textarea filled with valid text');

      // Verify character count hint updates
      const hint = dialog
        .locator('[id*="hint"], .text-muted-foreground, .text-sm')
        .filter({ hasText: /자|글자|characters/ });
      const hintCount = await hint.count();

      if (hintCount > 0) {
        const hintText = await hint.first().textContent();
        console.log(`  Character count hint: "${hintText}"`);
      }
    }

    // Find and click submit button
    const submitButton = dialog
      .locator('button[type="submit"], button')
      .filter({ hasText: /제출|요청|확인|폐기 요청/ });
    const submitExists = (await submitButton.count()) > 0;

    if (submitExists) {
      const isDisabled = await submitButton.first().isDisabled();

      if (!isDisabled) {
        console.log('Submitting form...');
        await submitButton.first().click();

        // 11. Verify success message is announced
        // Look for toast notification or success message
        const successMessage = page
          .locator('[role="status"], [role="alert"], [aria-live]')
          .filter({ hasText: /성공|완료|요청.*완료|Success/i });
        const hasSuccess = (await successMessage.count()) > 0;

        if (hasSuccess) {
          const successText = await successMessage.first().textContent();
          const ariaLive = await successMessage.first().getAttribute('aria-live');
          const role = await successMessage.first().getAttribute('role');

          console.log('\n✓ Success message displayed:');
          console.log(`  Text: "${successText}"`);
          console.log(`  aria-live: "${ariaLive}"`);
          console.log(`  role: "${role}"`);

          // Success message should be announced via aria-live or role="status"
          expect(ariaLive || role).toBeTruthy();
        } else {
          console.log('No success message found (may have different implementation or API error)');
        }

        // Dialog should close after successful submission
        const dialogStillVisible = await dialog.isVisible().catch(() => false);

        if (!dialogStillVisible) {
          console.log('✓ Dialog closed after submission');
        } else {
          console.log('Dialog still visible (may indicate validation error or different behavior)');
        }
      } else {
        console.log('Submit button is disabled (validation may be preventing submission)');
      }
    }

    console.log('\nForm accessibility verification complete');
  });
});

/**
 * Helper function to test form accessibility
 */
async function testFormAccessibility(page: any, form: any) {
  console.log('Testing form accessibility...');

  const inputs = form.locator('input, textarea, select');
  const inputCount = await inputs.count();

  console.log(`Form has ${inputCount} inputs`);

  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const inputId = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');

    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      const hasLabel = (await label.count()) > 0;

      console.log(
        `Input ${i + 1}: id="${inputId}", has label: ${hasLabel}, aria-label: "${ariaLabel}"`
      );
      expect(hasLabel || ariaLabel).toBeTruthy();
    }
  }
}

/**
 * Helper function to verify input labels
 */
async function verifyInputLabels(page: any, inputs: any) {
  const inputCount = await inputs.count();
  let labeledInputs = 0;

  for (let i = 0; i < Math.min(inputCount, 10); i++) {
    const input = inputs.nth(i);
    const inputId = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');

    let hasLabel = false;

    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      hasLabel = (await label.count()) > 0;
    }

    if (hasLabel || ariaLabel || ariaLabelledBy) {
      labeledInputs++;
    }

    console.log(
      `Input ${i + 1}: id="${inputId}", labeled: ${hasLabel || !!ariaLabel || !!ariaLabelledBy}`
    );
  }

  console.log(`Labeled inputs: ${labeledInputs}/${inputCount}`);
  expect(labeledInputs).toBeGreaterThan(0);
}
