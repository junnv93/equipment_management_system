# Phase 3 Architecture Review

**Date**: 2026-04-28  
**Reviewer**: Senior Architect Agent  
**Scope**: 9 files — Phase 3 inline action migration only  
**Methodology**: Read all 9 files, cross-referenced callsites, verified type contracts, checked dead code, traced referential stability chains

---

## Scope

| # | File | Nature |
|---|---|---|
| 1 | `packages/shared-constants/src/checkout-thresholds.ts` | Added `resolveInlineActionVariant` + `CHECKOUT_ACTION_INLINE_CLASS` |
| 2 | `packages/shared-constants/src/index.ts` | Barrel export hunk |
| 3 | `apps/frontend/components/ui/inline-action-button.tsx` | NEW atom |
| 4 | `apps/frontend/components/ui/__tests__/inline-action-button.test.tsx` | NEW tests |
| 5 | `apps/frontend/components/shared/NextStepPanel.tsx` | compact + hero migration + useCallback handlers |
| 6 | `apps/frontend/lib/design-tokens/components/workflow-panel.ts` | Token cut + satisfies type updated |
| 7 | `apps/frontend/lib/design-tokens/semantic.ts` | `SURFACE_INLINE_ACTION_TOKENS.iconSize` added |
| 8 | `.claude/skills/verify-design-tokens/SKILL.md` | Step 44 boundary |
| 9 | `.claude/skills/verify-checkout-fsm/SKILL.md` | Step 40 update |

Prior harness evaluation (Iteration 2) confirmed: tsc EXIT 0, 16 tests PASS, M11 (displayName) repaired.  
This review focuses on structural and architectural dimensions the harness did not cover.

---

## Findings by Severity

### Critical (immediate fix)

**C-1: WORKFLOW_PANEL_TOKENS.action.primary/blocked is dead code, not deleted**

`workflow-panel.ts` lines 44-57 define `WORKFLOW_PANEL_TOKENS.action.primary` and `.blocked` (solid primary button tokens). A grep across the entire frontend codebase returns **zero callsites** outside `workflow-panel.ts` itself. These tokens are not the same as `NEXT_STEP_PANEL_TOKENS.actionButton.*`; they are a distinct stale subtree.

The Phase 3 comment on line 66 reads: _"기존 `actionButton` 토큰(solid primary)은 와이어프레임 04 spec(soft-tint)과 충돌하여 삭제됨"_ — but this sentence only describes the deletion of `WORKFLOW_PANEL_TOKENS.variant.{compact,hero}.actionButton`. `WORKFLOW_PANEL_TOKENS.action` was never mentioned and remains as dead exported code. It will survive into Phase 4 and beyond unless explicitly removed, contributing to token system confusion for future maintainers.

**Fix**: Delete `WORKFLOW_PANEL_TOKENS.action` (primary + blocked + blockedReason). Verify 0 callsites (confirmed), then remove. No migration needed.

---

**C-2: floating/inline variant is a half-migration — two divergent action button patterns coexist in the same component**

`NextStepPanel.tsx` line 415 uses `NEXT_STEP_PANEL_TOKENS.actionButton.primary` (solid `bg-brand-info text-white`) for the `floating` and `inline` variants. The compact and hero variants now use `InlineActionButton` (soft-tint). This means:

- The same component renders semantically similar "next action" buttons with visually incompatible styling depending on variant.
- The soft-tint pattern (spec §4.1) vs solid primary pattern coexist in the same JSX file with no architectural explanation of why they differ.
- `NEXT_STEP_PANEL_TOKENS.actionButton.primary` is now the **only** remaining callsite of the old solid pattern within NextStepPanel — the token itself is not dead (unlike WORKFLOW_PANEL_TOKENS.action), but its usage is an architectural inconsistency.
- The floating/inline `onClick` at line 419 is an **inline arrow** (`onClick={() => { markDone(); onActionClick?.(descriptor.nextAction!); }}`), whereas compact and hero use `useCallback`-stabilized handlers. The inline arrow is irrelevant for the raw `<button>` since it is not wrapped in React.memo, but it creates a pattern inconsistency and a subtle maintenance trap: if floating/inline is later migrated to InlineActionButton, the inline arrow will silently break memo.

This is scoped as Critical because it is an **active design system incoherence**, not merely future tech-debt. Two variants of the same NextStepPanel render the same semantic action (the FSM next step button) with entirely different visual languages in production.

**Fix**: Migrate floating/inline to InlineActionButton in Phase 4 immediately, or add an explicit architectural comment explaining why the two patterns differ (e.g., floating is intentionally more prominent than compact/hero). Do not leave it undocumented.

---

### Warning (consider before next phase)

**W-1: InlineActionVariantKey and SurfaceInlineActionVariant are parallel type mirrors with no compile-time coupling**

`InlineActionVariantKey` (`'info' | 'ok' | 'warning' | 'danger'`) is defined in `packages/shared-constants/src/checkout-thresholds.ts` as a comment-documented mirror of `SurfaceInlineActionVariant`. They are structurally identical today, and TypeScript's structural typing means the call site `variant={resolveInlineActionVariant({...})}` (which assigns `InlineActionVariantKey` to `SurfaceInlineActionVariant`) will produce a compile error if they diverge — this is the safety net.

However, **the safety net fires at the call site, not at the definition site**. If `InlineActionVariantKey` gains `'extreme'` in shared-constants, the error surfaces in NextStepPanel.tsx (the consumer), not in checkout-thresholds.ts (the origin). The comment "변경 시 `apps/frontend/lib/design-tokens/semantic.ts`의 동일 enum과 동기 필수" is documentation-only. There is no `satisfies` or cross-package type assertion enforcing the constraint.

**Risk level**: Low today (4-member union is stable), medium if urgency enum ever expands. The `resolveInlineActionVariant` function's urgency parameter is also a local string literal (`'normal' | 'warning' | 'critical'`) with no import of the canonical `Urgency` type from schemas, meaning the same drift risk applies to urgency as well.

**Fix**: Add a type assertion in checkout-thresholds.ts or in the barrel export:
```typescript
// In checkout-thresholds.ts or a bridge file:
// This import would break the dependency direction, so instead document
// the constraint as a test: ensure resolveInlineActionVariant's return type
// is assignable to SurfaceInlineActionVariant via a type-only test file.
```
Alternatively, accept the structural safety net as sufficient and document it explicitly. The comment should say "TypeScript call-site assignability check is the enforcement mechanism" rather than "동기 필수" which implies manual effort.

---

**W-2: NextStepPanel is not itself memoized — InlineActionButton React.memo provides incomplete benefit**

`InlineActionButton` is wrapped in `React.memo`. `NextStepPanel` is a plain named function export with no `React.memo`. The memo chain is:

```
Parent → NextStepPanel (NOT memoized) → InlineActionButton (memoized)
```

`handleHeroClick` and `handleCompactClick` are `useCallback`-stabilized within NextStepPanel. When NextStepPanel re-renders (due to its non-memo status), new stable references for `handleHeroClick`/`handleCompactClick` are computed via useCallback, and InlineActionButton's memo check passes (same function reference). **This is correct behavior.**

However, the docstring in InlineActionButton reads: _"효과는 호출처의 prop stability에 의존"_ and _"호출처는 `onClick` 같은 함수 prop을 `useCallback`으로 안정화하거나 *부모 자체*가 memo여야 함"_. This is accurate but incomplete. What it does not say is: if the parent of NextStepPanel re-renders and passes a new `descriptor` object (a new object reference per render), NextStepPanel re-renders regardless, the useCallback-stabilized handlers invalidate (since `nextAction` and `onActionClick` are dependencies), and InlineActionButton re-renders. The memo only helps if the parent is stable — which brings the benefit back to the parent's memoization.

The practical verdict: **the current implementation is correct but the benefit of InlineActionButton's memo is almost entirely nullified unless the caller of NextStepPanel memoizes the descriptor and onActionClick props**. This should be documented at NextStepPanel's prop interface level.

---

**W-3: DropdownMenu overflow trigger aria-label is semantically wrong**

Line 356: `aria-label={t('panelTitle')}` where `t('panelTitle')` = `"다음 단계"` (ko) / `"Next Step"` (en). The trigger is a `MoreHorizontal` (⋯) button that opens a dropdown of overflow actions (reject, cancel, etc.). Its accessible name should describe its action ("추가 작업", "더 보기", "옵션 더 보기"), not the panel's title.

A screen reader user on the compact panel will hear: _"다음 단계, 버튼"_ when focusing the ⋯ button, which does not communicate that clicking opens additional options. WCAG 2.4.6 (Headings and Labels) and 2.4.9 (Link Purpose) apply.

This was not introduced by Phase 3 (it likely predates it), but Phase 3 modified the compact variant layout and did not correct this. The overflow trigger is now more prominent as a pattern since compact variant is the primary row-level variant.

**Fix**: Use a dedicated i18n key `t('overflow.trigger')` → `"추가 작업"` or reuse `notifications.moreActions`.

---

**W-4: CHECKOUT_ACTION_INLINE_CLASS is not exported — dead key detection gap**

The `satisfies Record<CheckoutAction, InlineActionClass>` constraint on `CHECKOUT_ACTION_INLINE_CLASS` ensures:
1. New `CheckoutAction` values cause a compile error (missing key) — catches enum extension. ✅
2. Removed `CheckoutAction` values produce a dead key — TypeScript's `satisfies` does **not** generate dead key warnings for string literal union types. Excess property checking via `satisfies` only applies to object literal types, not to string union keys where the union shrinks.

If `CheckoutAction` loses a member (e.g., `'borrower_reject'` is removed), the map entry `borrower_reject: 'negative'` silently remains as a dead key with no compile error. The docstring's claim _"CheckoutAction enum에서 멤버 제거 시 본 map의 dead key → eslint/tsc 경고"_ is **inaccurate**. TypeScript does not warn on this.

Additionally, `CHECKOUT_ACTION_INLINE_CLASS` is not exported from the package, meaning it cannot be tested in isolation or reused. The `satisfies` constraint is valuable, but the exhaustiveness guarantee is one-directional only (extension = catch, removal = silent).

**Fix**: Remove the inaccurate docstring claim about removal detection. Optionally export the constant and add a test that verifies its keys match `CheckoutAction` values from schemas. A proper exhaustive check for shrinking unions requires a `type CheckExhaustive = keyof typeof CHECKOUT_ACTION_INLINE_CLASS extends CheckoutAction ? true : false` assertion.

---

**W-5: className escape allows twMerge to override standard Tailwind base classes but NOT custom CSS variable classes**

`cn()` uses `twMerge`. The atom signature exposes `className` which is merged via `cn(base, variant, className)`. Two behaviors:

1. Standard Tailwind classes (e.g., `h-7`, `px-2.5`, `rounded-md`): `className` CAN override these via twMerge's conflict resolution. A caller passing `className="h-9"` would replace `h-7`.
2. Custom CSS variable classes (`bg-surface-inline-action-info-bg`, etc.): twMerge without custom config does not recognize these as conflicting. It concatenates them. A caller cannot cleanly override the variant color via className.

The effect is asymmetric: layout tokens (height, padding, radius) are **overrideable** via className, but semantic color tokens are **not cleanly overrideable**. The current sole caller (NextStepPanel) only passes `className={cn('mt-4', pulseClass)}` which adds margin and animation — both safe, non-conflicting additions. No color overrides occur today.

This is a Warning because the API surface permits unintended layout overrides. If Phase 4 adds callers that pass layout-adjusting classNames (e.g., `w-full` or `h-9`), the token system contract breaks silently. Standard shadcn atoms handle this by accepting `asChild` or by not exposing className for variant-critical properties.

**Fix**: Document the className escape contract explicitly in the prop JSDoc: "className은 레이아웃(mt-*, w-*, 등) 조정에 한정. 색상/변형 오버라이드는 variant prop 사용."

---

### Info (nice to have)

**I-1: Test co-location of atom tests and matrix tests is acceptable but creates conceptual coupling**

The test file contains two `describe` blocks: InlineActionButton (8+1 atom tests) and resolveInlineActionVariant (7 matrix tests). The atom is in `components/ui/`, the function is in `packages/shared-constants/`. Testing a shared-constants function from a frontend test file creates implicit cross-package test coupling — the test lives in the frontend but validates a package function.

The alternative (a dedicated test in `packages/shared-constants/src/__tests__/`) would be more architecturally correct. The current co-location is pragmatic (tests integrate the two together, validating that the function's output is usable by the atom) but obscures that `resolveInlineActionVariant` has no frontend-specific test coverage from within its own package.

**Verdict**: Acceptable for now. If shared-constants gains its own test infrastructure, the matrix tests should move there.

---

**I-2: loadingLabel = 'Loading…' English fallback in Korean-default app**

The default value is the Unicode ellipsis character (`…`), which is correct encoding. The English fallback is appropriate as a last-resort since: (a) it is sr-only, (b) all callers in NextStepPanel.tsx pass `tCommon('loading')` explicitly. No user will encounter the fallback in production. This is acceptable.

The JSDoc already says "한국어/다국어는 `t('common.loading')` 전달 권장" — this is sufficient.

---

**I-3: DropdownMenuItem key={idx} — stable enough for static overflowActions**

Line 363: `key={idx}`. `overflowActions` is passed as a static array from the parent (typically `[{ label: t(...), onClick: ... }]`). The array does not reorder at runtime; it changes identity when the parent re-renders with different actions. `key={idx}` is an anti-pattern for dynamic lists but acceptable here given the static nature. A stable key (action label or action type) would be more correct.

---

**I-4: hero canAct=false disabled InlineActionButton — confirmed fixed by harness**

The prior harness evaluation (Iteration 2) confirmed `aria-label={stepLabel}` is present on the disabled `InlineActionButton` in the `canAct=false` branch (line 401). This concern from Iteration 1 is resolved.

---

## Architectural Decisions Validation

| Decision | Verdict | Note |
|---|---|---|
| Atom layer boundary (ui/ imports no higher layer) | OK | `inline-action-button.tsx` imports only from `lucide-react`, `@/lib/utils`, `@/lib/design-tokens`. No `components/shared/` or domain imports. Clean. |
| Cross-package dependency direction (schemas → shared-constants → frontend) | OK | `checkout-thresholds.ts` imports `CheckoutAction` from `@equipment-management/schemas`. No reverse dependency. `InlineActionVariantKey` is a local mirror, not a re-import from frontend. |
| SSOT 3-axis (token vocabulary / mapping function / action classification) | OK | Token in `semantic.ts` (Layer 2), function in `shared-constants`, classification co-located with function. Correct layer assignment. Minor: classification not exported limits testability. |
| memo + useCallback chain | WARN | Chain is structurally correct (useCallback stabilizes handlers, memo checks props). But NextStepPanel is not memoized, so InlineActionButton's memo only helps when NextStepPanel's own props are stable. Benefit is contingent on caller discipline, not enforced. |
| Domain-neutral atom + caller i18n | OK | Atom has zero i18n dependencies. NextStepPanel injects `loadingLabel = tCommon('loading')`. Pattern consistent with shadcn convention. |
| Type-safe Record SSOT for action classification | WARN | `satisfies Record<CheckoutAction, InlineActionClass>` catches enum extension (new members). Does NOT catch enum shrinkage (removed members produce silent dead keys). Docstring claim about removal detection is inaccurate. |
| Two action button patterns in same component | RISK | floating/inline (solid primary via NEXT_STEP_PANEL_TOKENS.actionButton.primary) vs compact/hero (soft-tint via InlineActionButton). Design system incoherence that is active in production. |
| Dead token code (WORKFLOW_PANEL_TOKENS.action) | RISK | 0 callsites. Should be deleted. Creates confusion about which token to use for similar use cases. |

---

## Phase 4 Recommendations

**P1 (blocking): Migrate floating/inline variant to InlineActionButton atom**

`NextStepPanel` floating/inline branch (lines 383-434) must be migrated to `InlineActionButton` to eliminate the two-pattern incoherence. This also allows removing `NEXT_STEP_PANEL_TOKENS.actionButton.primary` from the token file. The inline arrow `onClick` at line 419 should be replaced with a `useCallback`-stabilized handler for consistency.

**P2 (blocking): Delete WORKFLOW_PANEL_TOKENS.action.primary/blocked**

Zero callsites confirmed. Delete lines 44-57 from `workflow-panel.ts`. Update the Phase 3 comment to accurately describe what was removed.

**P3 (before Phase 4 callers): Fix DropdownMenu overflow trigger aria-label**

Replace `aria-label={t('panelTitle')}` with a dedicated key `t('overflow.moreActions')` or reuse `notifications.moreActions`. Add to both ko and en message files.

**P4 (documentation): Correct the CHECKOUT_ACTION_INLINE_CLASS docstring**

Remove the claim about removal detection. Add a type-level assertion or test to validate exhaustiveness in both directions.

**P5 (future): CheckoutDetail hero migration**

Once floating/inline variant is migrated, CheckoutDetailClient.tsx (the primary caller of NextStepPanel in hero variant) should be validated for correct `descriptor` memoization to make InlineActionButton's React.memo effective.

**P6 (future): Storybook entry**

`InlineActionButton` with 4 variants × loading/disabled/leadingIcon states. Essential for design system documentation once Phase 4 callers expand.

**P7 (design system): Establish className escape contract**

Document that `className` on `InlineActionButton` is for layout adjustment only (margin, width) and that color/variant overrides require the `variant` prop. Consider adding a lint rule or a runtime dev warning.

---

## Final Architecture Verdict

**WARN**

The core architectural decisions are sound: atom layer boundary is clean, dependency direction is correct, the 3-axis SSOT (token/function/classification) is in the right layers, and the type-safe Record exhaustiveness check is well-designed (if slightly over-documented on its limitations). The prior harness caught and fixed the functional issues.

However, two structural problems prevent a PASS:

1. **Active design system incoherence**: Two incompatible action button visual patterns coexist in `NextStepPanel` after the migration. The Phase 3 scope exclusion of floating/inline is a reasonable engineering tradeoff, but it leaves the codebase in a visually inconsistent state that risks drift and copy-paste of the wrong pattern.

2. **Dead code not cleaned up**: `WORKFLOW_PANEL_TOKENS.action` (primary + blocked) has zero callsites and conflicts semantically with the new soft-tint system. It was not removed in Phase 3 and is not called out for Phase 4 deletion.

Neither finding is a correctness bug or a security issue. Both are architectural debt that will compound if Phase 4 adds more callers before these are resolved.
