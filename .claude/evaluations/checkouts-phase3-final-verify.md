# Phase 3 Final Verify-Implementation Report

## Scope
9 files (this session only — Phase 3 inline action migration)

1. `packages/shared-constants/src/checkout-thresholds.ts`
2. `packages/shared-constants/src/index.ts`
3. `apps/frontend/components/ui/inline-action-button.tsx`
4. `apps/frontend/components/ui/__tests__/inline-action-button.test.tsx`
5. `apps/frontend/components/shared/NextStepPanel.tsx`
6. `apps/frontend/lib/design-tokens/components/workflow-panel.ts`
7. `apps/frontend/lib/design-tokens/semantic.ts`
8. `.claude/skills/verify-design-tokens/SKILL.md`
9. `.claude/skills/verify-checkout-fsm/SKILL.md`

## Skill-by-Skill Results

| Skill | Verdict | Evidence |
|---|---|---|
| verify-ssot | WARN | `InlineActionVariantKey` string literal mirror with `SurfaceInlineActionVariant` (intentional per scope note, but undocumented sync guard) |
| verify-hardcoding | FAIL | `NEXT_STEP_PANEL_TOKENS.actionButton.primary` still used in floating/inline variant (line 415); `Loader2 className="h-3.5 w-3.5"` raw class at line 425 |
| verify-design-tokens (Step 44) | PASS | Zero direct `bg/text/border-surface-inline-action-*` hits outside atom and test files |
| verify-checkout-fsm (Step 40) | FAIL | Floating/inline variants use raw `<button>` + old token (not InlineActionButton). Inline arrow `onClick={() => { markDone(); ... }}` at line 419 (not stabilized via useCallback) |
| verify-i18n | PASS | Atom has no `useTranslations`; `loadingLabel` sourced via `tCommon('loading')`; `common.loading` key confirmed in both ko/en |
| verify-frontend-state | FAIL | `onClick` at line 419 (floating/inline variants) is an unstabilized inline arrow — not wrapped in `useCallback`. The comment at line 143 documents the rule but the floating/inline path was not migrated |
| verify-auth | PASS | `roleToActorVariant` imported from `@equipment-management/schemas`; `UserRoleValues.SYSTEM_ADMIN` used (no string literals) |

---

## Findings

### FAIL-1 (verify-hardcoding + verify-checkout-fsm Step 40): floating/inline variants not migrated to InlineActionButton
**File:** `apps/frontend/components/shared/NextStepPanel.tsx` lines 412–427

The `floating` and `inline` variants still use a raw `<button>` with `NEXT_STEP_PANEL_TOKENS.actionButton.primary` — a solid `bg-brand-info text-white` class that conflicts with the wire-04 soft-tint spec. Phase 3 migration was scoped as "compact + hero" but the token comment in `workflow-panel.ts` (line 66) explicitly declares:

> 기존 `actionButton` 토큰(solid primary)은 와이어프레임 04 spec(soft-tint)과 충돌하여 삭제됨.

The token was **not deleted** — it remains at `NEXT_STEP_PANEL_TOKENS.actionButton` (lines 161–176 in `workflow-panel.ts`) and is **actively consumed** at NextStepPanel.tsx line 415. This is a contradiction between the Phase 3 comment and the actual code state.

**Remediation:** Either (a) migrate floating/inline action button to `<InlineActionButton>` and delete `NEXT_STEP_PANEL_TOKENS.actionButton`, or (b) retract the "삭제됨" comment and document the deliberate two-button-style divergence.

---

### FAIL-2 (verify-frontend-state): Unstabilized inline arrow in floating/inline path
**File:** `apps/frontend/components/shared/NextStepPanel.tsx` line 419

```tsx
onClick={() => {
  markDone();
  onActionClick?.(descriptor.nextAction!);
}}
```

`handleHeroClick` and `handleCompactClick` are correctly stabilized via `useCallback` (lines 145–156) for the compact and hero paths. However the floating/inline `<button>` at line 419 uses an inline arrow — if any parent renders NextStepPanel inside a `React.memo` boundary or a list, this creates a new function reference every render. The atom's memo guarantee (documented in inline-action-button.tsx JSDoc) is irrelevant here because `InlineActionButton` is not used for this path, but the raw `<button>` is still passed an unstable `onClick`. Not a critical memo-break (raw button is not memoized), but it is inconsistent with the explicit rule established at line 143 ("inline arrow … memo 무력화").

**Remediation:** Add `handleFloatingInlineClick = useCallback(...)` alongside the existing two handlers, and wire it to the floating/inline path button.

---

### FAIL-3 (verify-hardcoding): Raw `h-3.5 w-3.5` Loader2 class in floating/inline path
**File:** `apps/frontend/components/shared/NextStepPanel.tsx` line 425

```tsx
{isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
```

`SURFACE_INLINE_ACTION_TOKENS.iconSize` is defined as `'h-3 w-3'` with explicit documentation "호출처에서 raw `h-3 w-3` 하드코딩 금지". The floating/inline path uses `h-3.5 w-3.5` (not even matching the token value) directly without token intermediary.

Note: `MoreHorizontal className="h-3.5 w-3.5"` at line 359 and `w-2 h-2` / `w-1.5 h-1.5` dots at lines 228 and 322 are layout/indicator classes (not the action-button icon path) — these are out of the InlineActionButton atom contract scope.

**Remediation:** If floating/inline buttons migrate to `InlineActionButton`, the Loader2 at line 425 disappears automatically. If kept as raw `<button>`, use `SURFACE_INLINE_ACTION_TOKENS.iconSize` or a dedicated `WORKFLOW_PANEL_TOKENS.overflow.iconSize` token.

---

## Notable Observations (suggestion-level only)

- **`InlineActionVariantKey` vs `SurfaceInlineActionVariant` mirror**: `InlineActionVariantKey` in `shared-constants` (`'info' | 'ok' | 'warning' | 'danger'`) and `SurfaceInlineActionVariant = keyof typeof SURFACE_INLINE_ACTION_TOKENS.variant` in `semantic.ts` are structurally identical. The scope note marks this as intentional (single-direction: schemas → shared-constants). However, there is no compile-time enforcement that the two stay in sync — if a new variant is added to `SURFACE_INLINE_ACTION_TOKENS.variant`, `InlineActionVariantKey` will silently drift. Consider a `satisfies` assertion or a branded type re-export to enforce sync.

- **`NEXT_STEP_PANEL_TOKENS.actionButton` ghost token**: The token exists and is used but Phase 3's own comment declares it deleted. This is likely a documentation-ahead-of-implementation issue. The dead-code risk is low (it is consumed), but the misleading comment could cause future sessions to incorrectly skip migration work.

- **Test coverage gap**: `inline-action-button.test.tsx` tests the atom directly (16 passing). There are no tests for the NextStepPanel floating/inline path's non-migrated button behavior — the test gap mirrors the migration gap.

---

## Final Verdict

**FAIL — 3 confirmed violations**

| # | Severity | File | Line | Rule |
|---|---|---|---|---|
| 1 | High | NextStepPanel.tsx | 412–427 | verify-hardcoding / verify-checkout-fsm Step 40: floating/inline not migrated to InlineActionButton; NEXT_STEP_PANEL_TOKENS.actionButton used despite being declared deleted |
| 2 | Medium | NextStepPanel.tsx | 419 | verify-frontend-state: inline arrow onClick not stabilized via useCallback in floating/inline path |
| 3 | Low | NextStepPanel.tsx | 425 | verify-hardcoding: raw `h-3.5 w-3.5` class on Loader2, not via SURFACE_INLINE_ACTION_TOKENS.iconSize |
