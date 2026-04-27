# Evaluation Report: checkout-sprint4-3-to-5
Date: 2026-04-27
Iteration: 1

## Build Verification
- frontend tsc: FAIL (2 errors in ApprovalsClient.tsx + RejectModal.tsx)
- backend tsc: PASS (0 errors)
- backend tests: PASS (947/947)

### Frontend tsc Errors (exact output)
```
components/approvals/ApprovalsClient.tsx(517,12): error TS2322:
  Property 'mode' is missing in type '{ item: ApprovalItem; isOpen: true; onClose: ...; onConfirm: ...; }'
  but required in type '{ mode: "single"; ... }'.
components/approvals/RejectModal.tsx(106,29): error TS2339:
  Property 'errors' does not exist on type 'ZodError<string>'.
```

### Lint Errors
- frontend lint: PASS
- backend lint: FAIL
  - `checkouts.controller.ts` line 306: Missing return type on `getInboundOverview` (new endpoint added this sprint)
  - `data-migration/services/*.ts`: 3 unused vars (pre-existing, but fail counts against M13)

---

## Contract Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| M1a | `dday-utils.ts` exports `calculateDaysRemaining` | PASS | File exists at `apps/frontend/lib/utils/dday-utils.ts`; exports `calculateDaysRemaining(expectedReturnDate: string): number` |
| M1b | `DdayBadge.tsx` exists; null render when `daysRemaining === null` | PASS | `apps/frontend/components/checkouts/DdayBadge.tsx` line 22: `if (daysRemaining === null) return null;` |
| M1c | `CheckoutDetailClient.tsx` header has `<DdayBadge variant="hero" />` with terminal state guard | PASS | Lines 483–492: guards on `REJECTED`, `CANCELED`, `RETURN_APPROVED` before rendering `<DdayBadge variant="hero" />` |
| M1d | i18n ko+en: `checkouts.detail.ddayLabel`, `checkouts.detail.ddaySrLabel` | PASS | Both found in ko and en `checkouts.json` |
| M1e | `role="img"` + `aria-label` on DdayBadge | PASS | `DdayBadge.tsx` line 31: `role="img"`, line 32: `aria-label={t('ddaySrLabel', ...)}` |
| M2a | `checkout-phase.ts` exports `CHECKOUT_RENTAL_PHASE_TOKENS` | PASS | File exists; exports `CHECKOUT_RENTAL_PHASE_TOKENS` and `getPhaseCardState` |
| M2b | `lib/design-tokens/index.ts` re-exports checkout-phase | PASS | Lines 500–502 re-export `CHECKOUT_RENTAL_PHASE_TOKENS`, `getPhaseCardState` |
| M2c | `CheckoutPhaseIndicator.tsx` exists; null render when `phase === null`; phaseIndex dot state; RENTAL_PHASE_I18N_KEY; `role="group"` + `aria-label` | PASS | File exists; line 29 null guard; lines 52–64 phaseIndex comparison; line 34 RENTAL_PHASE_I18N_KEY; line 37 `role="group"` |
| M2d | `CheckoutGroupCard.tsx` has `<CheckoutPhaseIndicator>` inside rental condition | PASS | Line 295: `{isRentalGroup && rentalStatus && rentalDescriptor && (<CheckoutPhaseIndicator ...>)}` |
| M2e | non-rental changes = 0 | PASS | CheckoutPhaseIndicator only rendered inside `isRentalGroup && rentalStatus && rentalDescriptor` guard |
| M2f | i18n ko+en: `rentalPhase.xOfY`, `rentalPhase.ariaLabel`, `rentalPhase.{approve,handover,return}.label` | PASS | All keys verified in both ko and en `checkouts.json` |
| M3a | WorkflowTimeline rental: 3 phase cards with collapse/expand | PASS | `RentalPhaseTimeline` component in `WorkflowTimeline.tsx`; `expandedPhases` state; phase cards with toggle |
| M3b | non-rental rendering unchanged | PASS | `WorkflowTimeline` function dispatches to `WorkflowTimelineInner` for non-rental; `RentalPhaseTimeline` only for `CPVal.RENTAL` |
| M3c | `aria-expanded` + `aria-controls` pairing; Space/Enter keyboard | PASS | Lines 271–272: `aria-expanded={isExpanded}`, `aria-controls={contentId}`; `<button>` elements handle Space/Enter natively |
| M3d | i18n ko+en: `rentalPhase.expandAll`, `rentalPhase.collapseAll`, `rentalPhase.viewSteps`, `rentalPhase.waiting` | PASS | All 4 keys found in both ko and en messages |
| M4a | `dday-colors.ts` exists | PASS | `apps/frontend/lib/design-tokens/components/dday-colors.ts` exists |
| M4b | 3 SSOT exports: `getDdayBadgeClasses`, `getDdayTier`, `getDdayIconKey` | PASS | All 3 exported from dday-colors.ts |
| M4c | 6 tiers: farFuture/upcoming/soon/dueToday/overdueShort/overdueLong | PASS | `DDAY_TIERS` array and `DDAY_TIER_CLASSES` all 6 tiers defined |
| M4d | brand CSS variables; raw `bg-orange-500` = 0 | PASS | All classes use `bg-brand-*` / `text-brand-*`; no raw color values found |
| M4e | D+4+ tier only uses `motion-safe:animate-pulse` | PASS | Only `overdueLong` (≥ D+4) has `motion-safe:animate-pulse` |
| M4f | `getDdayClasses` → deprecated alias delegating to `getDdayBadgeClasses` | **FAIL** | `getDdayClasses` in `checkout.ts` line 658 is marked `@deprecated` but still has its own 3-tier implementation (`<0` → danger, `<=3` → warn, else ok); it does NOT delegate to `getDdayBadgeClasses`. Contract requires delegation. |
| M4g | `lib/design-tokens/index.ts` re-exports dday-colors | PASS | Lines 489–496 re-export `DDAY_TIERS`, `getDdayTier`, `getDdayBadgeClasses`, `getDdayIconKey` |
| M5a | `nav-config.ts` `badgeKey?: 'approvals' | 'checkouts-your-turn'` | PASS | Line 41 in nav-config.ts |
| M5b | checkouts item has `badgeKey: 'checkouts-your-turn'` | PASS | Line 92 in nav-config.ts |
| M5c | `getFilteredNavSections` 3rd param `checkoutYourTurnCount?: number` | PASS | Line 193 in nav-config.ts |
| M5d | `DashboardShell.tsx` queries `queryKeys.checkouts.resource.pendingCount()` + passes to nav | PASS | Lines 145–161; query fetched and passed to `getFilteredNavSections` as 4th arg |
| M5e | `NavBadge.tsx` 신설 — 0이면 null, 10+ "9+", `aria-label` | **FAIL** | No `NavBadge.tsx` file exists anywhere in `components/layout/`. Badge is inlined in `DashboardShell.tsx` `SidebarItem` and renders raw `{badge}` — no "9+" truncation for count ≥ 10. Criterion explicitly requires the file and the overflow behavior. |
| M5f | i18n ko+en: `navigation.checkouts.yourTurnAria` | PASS | Both `ko/navigation.json` and `en/navigation.json` line 81 have `checkoutYourTurnAria` |
| M5g | 클릭 → `/checkouts?view=yourTurn` | **FAIL** | Nav item `href` is `FRONTEND_ROUTES.CHECKOUTS.LIST` (plain `/checkouts`), not `/checkouts?view=yourTurn`. No `?view=yourTurn` link found in nav-config.ts. |
| M6a | 5 new variants: `noneYet | noPermission | noFilterResult | error | network` | PASS | All 5 in `CheckoutEmptyStateVariant` type; icons mapped in `CHECKOUT_ICON_MAP.emptyState`; colors in `CHECKOUT_EMPTY_STATE_TOKENS` |
| M6b | Each variant has primary CTA (min 1) | PASS | `CheckoutEmptyState.tsx` accepts `primaryAction`; all 5 new variant i18n keys have `primaryCta` |
| M6c | `noPermission`: current role inline display | PASS | Line 68–72 in `CheckoutEmptyState.tsx`: `{variant === 'noPermission' && roleLabel && <p>...{roleLabel}</p>}` |
| M6d | `noFilterResult`: "필터 초기화" CTA | PASS | i18n has `primaryCta` for `noFilterResult`; component accepts `primaryAction.onClick` |
| M6e | `network`: `navigator.onLine` detection | **FAIL** | `CheckoutEmptyState.tsx` has no `navigator.onLine` check. No reference to `navigator.onLine` anywhere in checkout components. Criterion explicitly requires network detection. |
| M6f | i18n 20 keys ko+en (5 × {title,description,primaryCta,secondaryCta}) | PASS | All 5 variants × 4 keys confirmed in both ko and en messages |
| M7a | `approveMutation` optimistic update (status optimistic change) | **FAIL** | `CheckoutGroupCard.tsx` `approveMutation` (lines 164–188) has NO `onMutate` hook. Uses fetch-then-approve pattern — no optimistic status change is applied. `onSuccess` only shows toast; `onSettled` invalidates cache. |
| M7b | `CheckoutCacheInvalidation.invalidateAfterApproval` includes detail cache | PASS | `APPROVAL_KEYS` includes `queryKeys.checkouts.all` (parent key), which covers `resource.detail(id)`. Additionally, CAS 409 `onError` explicitly calls `queryClient.removeQueries({ queryKey: queryKeys.checkouts.resource.detail(variables.id) })` |
| M8 | `POST /checkouts/bulk-approve` endpoint | **FAIL** | No `bulk-approve` endpoint found in `checkouts.controller.ts`. No `bulk-approve.dto.ts`. No `Promise.allSettled` implementation. Entirely unimplemented. |
| M9 | `GET /checkouts/rejection-presets` + `rejection_presets` Drizzle schema | **FAIL** | No `rejection-presets.ts` in DB schema directory. No migration. No controller endpoint. No `@RequirePermissions(Permission.REJECT_CHECKOUT)`. Entirely unimplemented. |
| M10 | `GET /checkouts/destinations/recent` (userId scope, ≤5, 60s cache, no `ANY($arr)`) | **FAIL** | Only `GET /checkouts/destinations` (all distinct destinations, no userId scope, no recency, no max-5) exists. No `/recent` sub-path. Entirely unimplemented. |
| M11 | `POST /checkouts/:id/revoke-approval` (scope→FSM→domain, CAS, REVOCATION_WINDOW_EXPIRED, AuditLog, transaction) | **FAIL** | No `revoke-approval` endpoint found. `REVOCATION_WINDOW_EXPIRED` error code absent from `packages/shared-constants/src/error-codes.ts`. Entirely unimplemented. |
| M12 | tsc 0 errors (frontend + backend) | **FAIL** | Frontend tsc: 2 errors. `ApprovalsClient.tsx:517` missing `mode` prop on `RejectModal`. `RejectModal.tsx:106` `Property 'errors' does not exist on type 'ZodError<string>'`. Backend tsc: PASS. |
| M13 | lint 0 errors | **FAIL** | Backend lint: 5 errors. `checkouts.controller.ts:306` missing return type on `getInboundOverview` (new endpoint). 3 more errors in `data-migration` module (unused vars). Frontend lint: PASS. |
| M14 | SSOT compliance: no local enum/permission/queryKey redefinition; no raw design token class | PASS | `PENDING_COUNT` used from `API_ENDPOINTS.CHECKOUTS.PENDING_COUNT` (shared-constants). No raw color classes (`bg-orange-500` etc.) in dday-colors.ts. |
| M15 | All backend userId/approverId via `extractUserId(req)` | PASS | `GET /checkouts/pending-count` handler (line 264): `const userId = extractUserId(req)`. No body-derived userId found. |
| M16 | All new i18n keys in ko + en simultaneously | PASS | ddayLabel/ddaySrLabel, rentalPhase.* (6+3 keys), emptyState 5 variants × 4, navigation.checkoutYourTurnAria — all verified in both locales |
| M17 | No `dark:` prefix in new design token files; brand CSS variables only | PASS | `dday-colors.ts`: no `dark:` prefix. `checkout-phase.ts`: no `dark:` prefix. Brand variable pattern (`bg-brand-*`, `text-brand-*`) throughout. |
| M18a | New interactive elements: keyboard + `focus-visible` | PASS | Phase card buttons use `<button>` (native keyboard). `expandAllBtn` token includes `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. |
| M18b | Color-only information = 0 (DdayBadge: color + number + icon) | PASS | DdayBadge renders: color (badge class), number (aria-hidden label text), icon (AlertTriangle/Clock with aria-hidden) — 3 redundant cues. |
| M18c | axe-core 0 violations | NOT VERIFIED | No automated axe-core run performed. Cannot attest. |

---

## SHOULD Criteria

- S1: `rejection_presets` 시드 — N/A (M9 자체 미구현)
- S2: `revokeApproval` 5분 경계 unit test — N/A (M11 자체 미구현)
- S3: WorkflowTimeline rental phase Playwright screenshot 회귀 — NOT PRESENT (no new playwright tests found for this)
- S4: bundle-size gate ±3KB — NOT VERIFIED (no bundle measurement run)
- S5: U-11 nav badge SSE 연동 — NOT PRESENT
- S6: `OverflowAction` type export from DashboardShell — NOT DONE (type used but not exported from DashboardShell)

---

## MUST NOT Violations

- `rental-phase.ts` / `checkout-fsm.ts` modifications: CLEAN (no modifications found)
- `setQueryData` usage: CLEAN (not found in new code)
- `eslint-disable` additions: CLEAN
- body userId/approverId trust: CLEAN (extractUserId used throughout)
- U-02/U-03/U-06/U-07 implementation: CLEAN

---

## Summary of FAIL Criteria

| Criterion | Summary |
|---|---|
| M4f | `getDdayClasses` is marked `@deprecated` but NOT delegated to `getDdayBadgeClasses` — independent 3-tier logic persists |
| M5e | `NavBadge.tsx` does not exist. Inline badge renders raw number with no "9+" cap. |
| M5g | Nav item href is `/checkouts` not `/checkouts?view=yourTurn` |
| M6e | `navigator.onLine` detection missing from `network` variant |
| M7a | `approveMutation` has no `onMutate` optimistic status update |
| M8 | `POST /checkouts/bulk-approve` entirely unimplemented |
| M9 | `GET /checkouts/rejection-presets` + DB schema entirely unimplemented |
| M10 | `GET /checkouts/destinations/recent` unimplemented; existing endpoint has no userId scope or recency |
| M11 | `POST /checkouts/:id/revoke-approval` entirely unimplemented; `REVOCATION_WINDOW_EXPIRED` error code missing |
| M12 | Frontend tsc: 2 errors (ApprovalsClient.tsx + RejectModal.tsx) |
| M13 | Backend lint: 5 errors (checkouts.controller.ts return type + data-migration unused vars) |

---

## Final Verdict

**FAIL**

11 of 18 MUST criteria fail. Critical backend endpoints (M8/M9/M10/M11 — 4 new API routes) are entirely absent. Frontend tsc is broken (M12). Lint fails (M13). Minor but contract-required implementation details missing in M4f, M5e, M5g, M6e, M7a.
