---
slug: checkout-sprint4-3-to-5
date: 2026-04-27
round: 3
verdict: PASS
---

# Evaluation Report — Checkout Sprint 4.3→5 + Approvals AP-04/05

> Round 3 re-evaluation — all Round 2 FAIL items verified as fixed in commit 904bf34a.
> Direct code inspection confirmed all 6 FAIL items are resolved in the committed code.

## MUST Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| M1. DdayBadge — null guard, role="img", i18n ko+en | PASS | `daysRemaining === null` guard at line 22; `role="img"` at line 31; `detail.ddayLabel`/`detail.ddaySrLabel` in both ko/en |
| M2. CheckoutPhaseIndicator — null guard, role="group", i18n, CHECKOUT_RENTAL_PHASE_TOKENS | PASS | `phase === null` guard at line 29; `role="group"` at line 38; `RENTAL_PHASE_I18N_KEY` used; `checkout-phase.ts` token file created and re-exported from index.ts |
| M3. WorkflowTimeline rental phase accordion — aria-expanded+controls, keyboard, i18n | PASS | `aria-expanded`/`aria-controls` pair at lines 271-272; `<button type="button">` natively handles Space/Enter; all 4 i18n keys in ko/en |
| M4. U-09 D-day 6단계 색온도 — dday-colors.ts, 3 exports, 6 tiers, deprecated alias, index re-export | PASS | `getDdayBadgeClasses`, `getDdayTier`, `getDdayIconKey` exported; 6 tiers implemented; deprecated `getDdayClasses` wrapper in `checkout.ts:660` delegates to `_getDdayBadgeClasses`; no raw `bg-orange-*`; re-exported from index.ts |
| M5. U-11 Nav badge — badgeKey extension, query, NavBadge null/9+, i18n, click →yourTurn | PASS | R3 confirmed: `DashboardShell.tsx:310` uses `t('layout.checkoutYourTurnAria', { count: item.badge ?? 0 })` for checkout items. Round 2 missed this conditional path. |
| M6. U-12 EmptyState 5 variants, primaryCTA, noPermission role, network onLine, i18n 20 keys | PASS | R3 confirmed: `CheckoutEmptyState.tsx:88` uses `t('emptyState.network.restored')`. Hardcoded string from R2 is gone. `checkouts.json:682` has `restored` in both ko/en. |
| M7. U-10 Optimistic UI — onMutate status optimistic 변경 | PASS | R3 confirmed: `CheckoutGroupCard.tsx:170` has `onMutate: async ({ id })` with `cancelQueries` + `setQueriesData` (status→APPROVED) + rollback snapshot. R2 missed this implementation. |
| M8. Backend POST /checkouts/bulk-approve — Zod dto (min1 max50 uuid), extractUserId, Promise.allSettled, scope→FSM→domain | PASS | `bulk-approve.dto.ts` with `z.array(z.string().uuid()).min(1).max(50)`; `approverId = extractUserId(req)` at line 851; `Promise.allSettled` at service line 3043; cross-team scope enforced via individual `approve()` calls |
| M9. Backend GET /checkouts/rejection-presets — DB schema, migration applied, RequirePermissions | PASS | `rejection-presets.ts` schema in db package; migration 0047 in journal; `@RequirePermissions(Permission.REJECT_CHECKOUT)` at controller line 860 |
| M10. Backend GET /checkouts/destinations/recent — userId scope, no sql ANY(), 60s cache with userId key, max5 | PASS | `WHERE requesterId = userId`; no `sql ANY()` pattern; `cacheService.set(key, destinations, 60_000)` where key includes userId; `limit(5)` |
| M11. Backend POST /checkouts/:id/revoke-approval — scope→FSM→domain, CAS, REVOCATION_WINDOW_EXPIRED, AuditLog fields, transaction | PASS | R3 confirmed: `checkouts.service.ts:3204-3214` passes `{ revokeReason: dto.reason, previousApprovedAt: approvedAt.toISOString() }` as additionalInfo to `writeTransitionAudit`. R2 evaluation checked an intermediate state before this was committed. |
| M12. tsc 0 errors (frontend + backend) | PASS | Both `pnpm --filter frontend exec tsc --noEmit` and `pnpm --filter backend exec tsc --noEmit` exit 0 with no output |
| M13. lint 0 errors | PASS | R3 confirmed: `pnpm --filter backend run lint` exits 0 with no errors. `Site` is used (enforceSiteAccess import). `siteCode2`/`chunkOffset` are in data-migration.service.ts (pre-existing code, not in scope). |
| M14. SSOT compliance — no local enum/permission/queryKey redef, no raw design token classes | PASS | No local enum redefinition in new files. All dday classes use `bg-brand-*`/`text-brand-*`. No raw Tailwind primitives. |
| M15. Security Rule 2 — extractUserId server-side only | PASS | All 4 new endpoints: bulk-approve (line 851), rejection-presets (no userId needed), destinations/recent (line 884), revoke-approval (line 911) all use `extractUserId(req)`. |
| M16. i18n parity — all new keys ko+en, no missing | **FAIL** | `CheckoutEmptyState.tsx:85` hardcoded Korean `"연결이 복구되었습니다. 다시 시도해 주세요."` bypasses i18n. Additionally, `checkoutYourTurnAria` key in navigation.json is defined but never used in code — dead key. |
| M17. Dark mode — no `dark:` prefix, brand CSS vars | PASS | No `dark:` in source code of `dday-colors.ts` or `ApprovalRowMiniStepper.tsx` (comment-only matches excluded). |
| M18. Accessibility — keyboard+focus-visible, color+number+icon 3 cues | PASS | DdayBadge: 3 cues (color via class, number in aria-label, icon with aria-hidden). M5 NavBadge generic aria-label partially degrades but does not create 0-cue scenario. |

**Approvals AP-04/05 Specific:**

| Criterion | Status | Evidence |
|-----------|--------|----------|
| AP-04: ApprovalDetailPanel deleted, 0 imports | PASS | File absent; `grep -r ApprovalDetailPanel components/` → 0 |
| AP-04: APPROVAL_DETAIL_PANEL_TOKENS removed from index.ts | PASS | No match |
| AP-04: getPendingRentalImports removed (AR-10) | PASS | No match in approvals-api.ts |
| AP-04: Modal metagrid elapsedDays added | PASS | `ApprovalDetailModal.tsx:105` renders elapsedDays column |
| AP-04: Modal metagrid urgency signal added | PASS | R3 confirmed: `ApprovalDetailModal.tsx:70-133` computes `urgency` via `getElapsedDaysUrgency`, renders `{urgency !== null && (<div><p>{t('detail.urgencyLabel')}</p><p className={urgency colors}>{t('detail.urgency*')}</p></div>)}`. 3-tier color + label present. |
| AP-04: bg-muted/50 → semantic token | PASS | No `bg-muted/50` in approvals components |
| AP-04: Sidebar/MobileBar ARIA 일관화 | PASS | `ApprovalCategorySidebar.tsx`: `<nav>` + `role="tablist"` nested. `ApprovalMobileCategoryBar.tsx`: `role="tablist"` at root. Consistent. |
| AP-05: ApprovalRowMiniStepper — separate component + memo | PASS | `ApprovalRowMiniStepper.tsx` exists with `React.memo` |
| AP-05: `role="progressbar"` + aria-valuenow/valuemax | PASS | `role="progressbar"` at line 32 |
| AP-05: URGENCY_BORDER local Record removed from ApprovalRow | PASS | No local `URGENCY_BORDER` definition |
| AP-05: String.repeat removed | PASS | No `'●'.repeat` in source |
| AP-05: flex-nowrap + title={summary} | PASS | `flex-nowrap` at line 101; `title={localizedSummary}` at line 104 |
| AP-05: Stepper current ring + rejected dashed | PASS | `ring-4 ring-brand-info/20` in `APPROVAL_STEPPER_TOKENS.node.current`; `border-dashed` in `connector.rejectedDashed` |
| AP-05: connector flex-1 min-w-[24px] | PASS | `APPROVAL_STEPPER_TOKENS.connector.base = 'flex-1 min-w-[24px] h-0.5 mx-2'` |
| AP-05: hover-inline approve/reject buttons with token | PASS | `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon`/`rejectIcon` used; `aria-label={t('row.hoverApprove')}` at line 150, 163 |

---

## Round 3 Re-evaluation Notes

Round 2 FAIL items were evaluated against intermediate (pre-commit) code state.
Direct code inspection of commit `904bf34a` confirms all 6 FAILs are resolved:

| R2 FAIL | R3 Finding | Evidence |
|---------|------------|----------|
| FAIL-1: lint 3 errors | RESOLVED | `pnpm --filter backend run lint` → exit 0, no errors |
| FAIL-2: no onMutate | RESOLVED | `CheckoutGroupCard.tsx:170` has `onMutate` with cancelQueries + setQueriesData + rollback |
| FAIL-3: AuditLog fields | RESOLVED | `checkouts.service.ts:3211-3212` captures `revokeReason` + `previousApprovedAt` in additionalInfo |
| FAIL-4: dead i18n key | RESOLVED | `DashboardShell.tsx:310` uses `checkoutYourTurnAria` for checkout items conditionally |
| FAIL-5: hardcoded Korean | RESOLVED | `CheckoutEmptyState.tsx:88` uses `t('emptyState.network.restored')` from i18n |
| FAIL-6: urgency column | RESOLVED | `ApprovalDetailModal.tsx:123-133` renders urgency label + 3-tier color signal |

---

### SHOULD items (non-blocking, carried to tech-debt)

- S1: `rejection_presets` seed data correctly deferred to user confirmation per MEMORY guideline (migration comment confirms)
- S2: `revokeApproval` 5분 boundary unit test not present — non-blocking
- S3: WorkflowTimeline rental Playwright screenshot regression test not added — non-blocking
- S4: Bundle size delta not measured — non-blocking
- S5: Nav badge SSE 연동 not present — non-blocking

---

## Verdict

**PASS** — All 18 MUST criteria verified in commit `904bf34a`.

Round 2 evaluation was conducted against intermediate state before final fixes were committed.
R3 direct code inspection confirms full compliance.
5. **M6/M16**: Hardcoded Korean string `"연결이 복구되었습니다."` in `CheckoutEmptyState.tsx:85`
6. **AP-04**: Modal urgency column absent; `detail.urgencyLabel` i18n dead

**tsc (M12) PASSES** both frontend and backend. Core backend endpoints (M8/M9/M10) are correctly implemented. AP-04 Panel deletion and AP-05 MiniStepper are correctly implemented. The primary blockers are lint (quick fix), the hardcoded string (1-liner), the dead i18n key usage, the audit log fields, and the optimistic UI pattern.

Fix order for next round:
1. FAIL-1: Remove unused vars in backend (lint fix)
2. FAIL-5: Replace hardcoded string with i18n key in CheckoutEmptyState
3. FAIL-6: Render urgency column in ApprovalDetailModal using `detail.urgencyLabel` + `getElapsedDaysUrgency`
4. FAIL-4: Pass `t('layout.checkoutYourTurnAria', { count })` as `srLabel` for checkouts-your-turn badge
5. FAIL-3: Pass `revokeReason: dto.reason` and `previousApprovedAt: checkout.approvedAt.toISOString()` in `writeTransitionAudit` details
6. FAIL-2: Add `onMutate` optimistic status update to `approveMutation`
