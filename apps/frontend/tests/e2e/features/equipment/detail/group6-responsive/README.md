# Group 6: Responsive Design Tests

## Overview

This test group verifies that the equipment detail page renders correctly and functions properly across different viewport sizes and input methods. All tests use the same equipment (EQP-010) and are **parallelizable** since they only read data without modifying state.

## Test Files

### 1. `responsive-mobile.spec.ts` - Mobile View (< 768px)

**Viewport:** iPhone SE (375x667)

**Verifications:**

- Single-column layout
- Equipment header stacks vertically
- Management number and details wrap appropriately
- Status badges visible and readable
- Tab navigation accessible (horizontal scroll if needed)
- Action buttons touch-friendly sized (minimum 36px height)
- All content sections accessible via scrolling
- No horizontal scrolling required for text content
- Footer and navigation remain functional

**Key Assertions:**

- Page width matches viewport (no overflow)
- Button height >= 36px (touch-friendly)
- Scroll width <= client width (no horizontal scroll)

---

### 2. `responsive-tablet.spec.ts` - Tablet View (768-1024px)

**Viewports:**

- iPad Portrait (768x1024)
- iPad Landscape (1024x768)

**Verifications:**

- Tablet-optimized spacing and padding
- Header information in two columns
- Tabs display horizontally without scrolling
- Action buttons appropriately spaced (not full-width)
- Layout adjusts for orientation changes
- All interactive elements accessible in both orientations

**Key Assertions:**

- First and last tabs both visible
- Button width < 90% of viewport
- Tabs aligned horizontally (y-coordinate difference < 100px)
- No content overflow in landscape mode

---

### 3. `responsive-desktop.spec.ts` - Desktop View (> 1024px)

**Viewports:**

- Full HD (1920x1080)
- Ultra-wide (2560x1440)

**Verifications:**

- Content centered with max-width constraint (max-w-7xl ≈ 1280px)
- Horizontal padding applied (px-4 sm:px-6 lg:px-8)
- Information sections in grid layout
- Tabs display horizontally with full labels
- Action buttons right-aligned in header
- Content remains readable on ultra-wide displays
- Content stays centered with large margins

**Key Assertions:**

- Container width <= 1400px (max-width applied)
- Left and right margins roughly equal (centered)
- Container has minimum 20px padding from edges
- Ultra-wide maintains same max-width
- Paragraph width < 1200px (readable line length)

---

### 4. `touch-mouse-interactions.spec.ts` - Input Method Testing

**Scenarios:**

- Touch interactions on mobile (375x667)
- Mouse interactions on desktop (1920x1080)
- Keyboard navigation

**Touch Interaction Verifications:**

- Action buttons respond to tap
- No persistent hover states after tap
- Tabs activate instantly without hover delay
- Touch response time < 500ms

**Mouse Interaction Verifications:**

- Buttons show hover effects
- Tooltips appear on hover (if implemented)
- Hover doesn't cause layout shifts or errors

**Keyboard Navigation Verifications:**

- Tab key moves focus through interactive elements
- Focus indicators visible (outline or box-shadow)
- Enter key activates focused buttons/tabs
- Shift+Tab navigates backward
- Escape key closes dialogs

---

## Execution

### Individual Test Execution

```bash
# Run single test
npx playwright test apps/frontend/tests/e2e/equipment-detail/group6-responsive/responsive-mobile.spec.ts

# Run with UI mode
npx playwright test apps/frontend/tests/e2e/equipment-detail/group6-responsive/responsive-mobile.spec.ts --ui

# Run with specific viewport
npx playwright test apps/frontend/tests/e2e/equipment-detail/group6-responsive/responsive-tablet.spec.ts --project=chromium
```

### Group Execution

```bash
# Run all responsive tests in parallel
npx playwright test apps/frontend/tests/e2e/equipment-detail/group6-responsive/ --workers=4

# Run on Chromium only (recommended for consistency)
npx playwright test apps/frontend/tests/e2e/equipment-detail/group6-responsive/ --project=chromium
```

### Full Equipment Detail Test Suite

```bash
# Run all equipment detail tests (including Group 6)
npx playwright test apps/frontend/tests/e2e/equipment-detail/
```

---

## Test Data Requirements

### Equipment: EQP-010

**Status:** Any valid status (available, in_use, etc.)

**Required Fields:**

- Equipment name
- Model name
- Management number (format: XXX-XYYYY)
- Serial number
- Status
- At least 2 tabs worth of content
- Action buttons (depends on user role)

### User Role

All tests use **Lab Manager** (`siteAdminPage`) for maximum visibility of UI elements and action buttons.

### Browser

Tests are configured to run only on **Chromium** for consistency across viewport tests.

---

## Expected Execution Time

| Test                     | Estimated Time  |
| ------------------------ | --------------- |
| Mobile View              | 15-20 seconds   |
| Tablet View              | 20-25 seconds   |
| Desktop View             | 25-30 seconds   |
| Touch/Mouse Interactions | 30-40 seconds   |
| **Total (Parallel)**     | **~40 seconds** |

---

## Success Criteria

All tests should:

1. **Pass** on Chromium browser
2. **Not produce** horizontal scrolling (except intentional tab overflow)
3. **Maintain** readable text sizes across all viewports
4. **Ensure** touch targets are at least 36x36px on mobile
5. **Center** content with max-width constraints on desktop
6. **Support** keyboard navigation throughout
7. **Handle** orientation changes gracefully
8. **Complete** without console errors

---

## Troubleshooting

### Test Failures

**Issue:** "Timeout waiting for element"

- **Cause:** Equipment EQP-010 may not exist or page load is slow
- **Solution:** Verify equipment exists in database, check application is running

**Issue:** "Button height less than expected"

- **Cause:** CSS styles not applied or custom button implementation
- **Solution:** Review button component styles, adjust assertion threshold if needed

**Issue:** "Content overflow detected"

- **Cause:** Fixed-width elements or missing responsive styles
- **Solution:** Check for fixed widths in CSS, ensure all containers use responsive units

**Issue:** "Tabs not horizontal"

- **Cause:** Flex wrap enabled or viewport too narrow
- **Solution:** Verify tab container uses `flex-nowrap` or horizontal scroll

### Known Limitations

1. **Touch emulation** in Playwright doesn't perfectly replicate native touch behavior
2. **Hover state detection** is limited to computed styles (may not catch all hover effects)
3. **Viewport sizes** are approximations of real devices
4. **Font sizes** may vary slightly based on OS/browser settings

---

## Integration with Test Execution Groups

According to `/home/kmjkds/equipment_management_system/specs/test-execution-groups.md`:

- **Group 6** is marked as **parallelizable** (✅)
- All tests read-only, no state modifications
- Can run concurrently with other groups (1-3, 5, 7)
- Uses shared equipment data (EQP-010)

### Recommended Execution

```bash
# Parallel execution with other read-only groups
npx playwright test tests/equipment-detail/group6-responsive/ \
                     tests/equipment-detail/basic-*.spec.ts \
                     tests/equipment-detail/permissions-*.spec.ts \
                     --workers=8
```

---

## References

- **Test Plan:** `/home/kmjkds/equipment_management_system/equipment-detail.plan.md` (Section 5)
- **Execution Strategy:** `/home/kmjkds/equipment_management_system/specs/test-execution-groups.md` (Group 6)
- **CLAUDE.md:** Responsive design best practices
- **Playwright Config:** `/home/kmjkds/equipment_management_system/apps/frontend/playwright.config.ts`

---

## Maintenance Notes

### When to Update These Tests

1. **Layout changes** to equipment detail page structure
2. **Responsive breakpoint changes** (768px, 1024px thresholds)
3. **New action buttons** added to header
4. **Tab structure changes** (new tabs, different navigation)
5. **Touch/keyboard interaction changes**

### Best Practices

- Keep viewport sizes aligned with Tailwind CSS breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Test actual target devices when possible (not just emulation)
- Verify accessibility alongside responsiveness
- Update assertions if design requirements change (e.g., touch target sizes)

---

**Generated:** 2026-01-30  
**Test Generator:** Claude Code (Playwright Test Generator)  
**Total Tests:** 4  
**Execution Mode:** Parallel ✅
