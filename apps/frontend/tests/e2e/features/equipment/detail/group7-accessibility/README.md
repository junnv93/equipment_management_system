# Group 7: Accessibility Tests - Equipment Detail Page

This directory contains accessibility tests for the equipment detail page (`/equipment/[id]`), ensuring WCAG 2.1 Level AA compliance.

## Test Overview

| Test File                             | Test ID | Description           | Key Verifications                              |
| ------------------------------------- | ------- | --------------------- | ---------------------------------------------- |
| `accessibility-keyboard.spec.ts`      | 6.1     | Keyboard navigation   | Tab order, focus indicators, Enter/Escape keys |
| `accessibility-screen-reader.spec.ts` | 6.2     | Screen reader support | Semantic markup, headings, ARIA attributes     |
| `accessibility-aria.spec.ts`          | 6.3     | ARIA labels and roles | role="tab", aria-selected, aria-describedby    |
| `accessibility-contrast.spec.ts`      | 6.4     | Color contrast        | 4.5:1 ratio, focus visibility, axe-core scan   |
| `accessibility-forms.spec.ts`         | 6.5     | Form accessibility    | Labels, error messages, aria-required          |

## Test Execution

### Run all accessibility tests

```bash
npx playwright test apps/frontend/tests/e2e/equipment-detail/group7-accessibility/ --workers=5
```

### Run individual tests

```bash
# Keyboard navigation
npx playwright test accessibility-keyboard.spec.ts

# Screen reader support
npx playwright test accessibility-screen-reader.spec.ts

# ARIA labels and roles
npx playwright test accessibility-aria.spec.ts

# Color contrast (with axe-core)
npx playwright test accessibility-contrast.spec.ts

# Form accessibility
npx playwright test accessibility-forms.spec.ts
```

## Test Data Requirements

All tests use **EQP-010** (existing equipment in seed data).

- Equipment must be in "available" status for form accessibility tests
- Lab manager role (`siteAdminPage` fixture) is used for full access
- No database mutations (read-only tests)

## WCAG 2.1 AA Compliance Checklist

### ✅ Keyboard Navigation

- [ ] All interactive elements accessible via Tab
- [ ] Logical focus order
- [ ] Visible focus indicators (outline or ring)
- [ ] Enter activates buttons/tabs
- [ ] Escape closes dialogs
- [ ] Shift+Tab for backward navigation

### ✅ Screen Reader Support

- [ ] Descriptive page title
- [ ] Proper heading hierarchy (H1, H2, H3)
- [ ] Status badges have accessible labels
- [ ] Tabs have role="tab" and aria-selected
- [ ] Form inputs have associated labels
- [ ] Error messages announced (aria-live)
- [ ] Landmark roles (main, navigation, banner)

### ✅ ARIA Attributes

- [ ] role="tablist" for tab navigation
- [ ] role="tab" for each tab
- [ ] role="tabpanel" for tab content
- [ ] aria-selected reflects active tab
- [ ] Icon-only buttons have aria-label
- [ ] Form hints use aria-describedby
- [ ] aria-hidden only on decorative elements
- [ ] aria-live regions for notifications

### ✅ Color Contrast

- [ ] Body text: 4.5:1 minimum (WCAG AA)
- [ ] Large text (18pt+): 3:1 minimum
- [ ] Status badges: sufficient contrast
- [ ] Links distinguishable from body text
- [ ] Focus indicators: 3:1 contrast
- [ ] Dark mode (if implemented): maintains ratios
- [ ] No information by color alone

### ✅ Form Accessibility

- [ ] All fields have labels (for/id association)
- [ ] Required fields marked (aria-required)
- [ ] Error messages associated (aria-describedby)
- [ ] Validation errors announced
- [ ] Logical tab order through form
- [ ] Success messages announced (aria-live="polite")
- [ ] Character count hints visible and announced

## Tools Used

### @axe-core/playwright

- Automated accessibility testing
- WCAG 2.1 AA rule validation
- Color contrast verification
- Best practices enforcement

### Playwright Testing Library

- Keyboard simulation (Tab, Enter, Escape, Shift+Tab)
- Focus management verification
- ARIA attribute inspection
- Screen reader compatibility checks

## Common Issues and Solutions

### Issue: Focus indicators not visible

**Solution**: Ensure Tailwind's `focus-visible:ring-2` classes are applied.

### Issue: Tab order is illogical

**Solution**: Check HTML structure follows visual layout. Avoid `tabindex > 0`.

### Issue: ARIA overuse

**Solution**: Use native HTML semantics first (e.g., `<button>` instead of `<div role="button">`).

### Issue: Color contrast failures

**Solution**: Use Tailwind's accessible color combinations (e.g., `text-gray-900` on `bg-white`).

### Issue: Unlabeled form inputs

**Solution**: Always associate `<label>` with `<input>` via matching `for`/`id` attributes.

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

## Test Plan Reference

Detailed test specifications: `/home/kmjkds/equipment_management_system/equipment-detail.plan.md` (Section 6)

## Execution Group

**Group 7: Accessibility (Parallel Execution)**

- Independent read-only tests
- No database mutations
- Safe to run in parallel with other groups
- Expected runtime: 1-2 minutes

See `/home/kmjkds/equipment_management_system/specs/test-execution-groups.md` for full execution strategy.
