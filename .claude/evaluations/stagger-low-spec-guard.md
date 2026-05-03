# Evaluation: stagger-low-spec-guard

## Result

Pass.

## Evidence

- Added `LOW_HARDWARE_CONCURRENCY_THRESHOLD = 4`.
- Added `shouldUseStaggerFadeIn(index)` to combine row limit, reduced-motion, and hardware-concurrency checks.
- `getStaggerFadeInStyle()` now returns `undefined` when the shared guard disables stagger.
- `CheckoutGroupCard` now applies `ANIMATION_PRESETS.staggerFadeInItem` only when `shouldUseStaggerFadeIn(rowIndex)` is true.
- Added `motion.test.ts` coverage for capable hardware, row limit, reduced-motion, and low hardware concurrency.
- Focused ESLint passed.
- Focused Jest passed: 2 suites, 13 tests.

## Notes

- The threshold is intentionally conservative and only affects stagger decoration, not layout or row interaction.
