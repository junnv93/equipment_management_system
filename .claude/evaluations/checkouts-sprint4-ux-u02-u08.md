# Evaluation: checkouts-sprint4-ux-u02-u08

**Date**: 2026-05-10
**Iteration**: 1

## Verdict: FAIL

---

## MUST Criteria Results

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | tsc PASS | PASS | `pnpm tsc --noEmit` EXIT=0 |
| M2 | pnpm build PASS | **FAIL** | `frontend/hooks/use-inspection-fork.ts:139:65` type error (untracked file from parallel session). Next.js build internal type check fails. Exit=1 |
| M3 | frontend + backend lint PASS | **FAIL** | Frontend lint: 2 errors — (1) `SavedViewsToolbar.tsx:45:62` `'index' is defined but never used` (2) `SavedViewsToolbar.tsx:138:13` `aria-grabbed` is deprecated in ARIA 1.1. Backend lint: EXIT=0 |
| M4 | SSOT 위반 0건 | PASS | grep returned 0 hits — no inline `/api/checkouts/...` URLs |
| M5 | 하드코딩 0건 | **FAIL** | `use-undo-toast.tsx:36` — `duration: 5000` magic number without named constant. `toastDurationMs` exists in inspection tokens but is not reused here. Raw Korean 0, raw API URL 0. |
| M6 | i18n parity ko/en 100% | PASS | `diff /tmp/ko-keys.txt /tmp/en-keys.txt` returned empty (0 diff) |
| M7 | setQueryData 추가 0건 new files | PASS | `use-undo-toast.tsx`: comment-only. `checkout-revoke-approval.ts`: 0 hits. Pre-existing 4 in `use-optimistic-mutation.tsx` excluded per task note |
| M8 | any 사용 0 | PASS | 0 hits across all new/modified sprint files |
| M9 | dark prefix 0 | PASS | `dark:` in `checkout-qr-drawer.ts` is JSDoc comment only (line 4), not a class token |
| M10 | WCAG color-only 0 | PASS | No color-only status indicators found in new components |
| M11 | prefers-reduced-motion | PASS | Toast uses `motion-safe:`/`motion-reduce:`. Sheet uses Radix (respects prefers-reduced-motion). |
| M12 | 변경 파일 수 ≤ 49 | PASS | `git diff --name-only HEAD~1 \| grep -v '^\.claude/' \| wc -l` = 23 |
| M13 | pre-push hook 통과 | **FAIL** | Frontend lint has 2 errors (M3 FAIL). Pre-push hook step 6 runs `pnpm --filter frontend run lint` → would fail |

### Phase A — U-06 QR Drawer

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| A1 | `CheckoutQrDrawerTrigger.tsx` 생성 + named export | PASS | `export function CheckoutQrDrawerTrigger(...)` at line 26 |
| A2 | QR 전용 새 backend API 0건 | **FAIL** | `git diff --stat apps/backend/src/modules/checkouts/ \| grep -v "saved-view"` shows 2 files (`checkouts.controller.ts`, `checkouts.service.ts`). Note: actual content changes are Phase F only (`saved-view-counts`). Grep design limitation — file names don't contain "saved-view". Spirit satisfied, literal grep fails. |
| A3 | `EquipmentQRCode` 재사용 | PASS | `import { EquipmentQRCode }` + usage at line 64 |
| A4 | `role="dialog"` + aria-label + Esc close | PASS | Sheet uses `@radix-ui/react-dialog` which provides `role="dialog"`, `aria-labelledby` (SheetTitle), Esc close. Trigger has `aria-label={t('aria.open')}` |
| A5 | SSR safe mobile/desktop (Tailwind responsive) | PASS | 0 `typeof window` in CheckoutQrDrawerTrigger.tsx. Uses `useMediaQuery` |
| A6 | i18n `qrDrawer.*` 7+ 키 양 로케일 | PASS | 7 keys (trigger/title/description/close/empty/aria.open/aria.close). grep -c returns 1 for both locales |

### Phase B — U-02 Keyboard Shortcuts

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| B1 | 4개 신규 파일 생성 | PASS | All 4 exist: `use-keyboard-shortcuts.ts`, `use-keyboard-shortcuts-scope.ts`, `KeyboardShortcutsProvider.tsx`, `KeyboardShortcutsCheatsheet.tsx` |
| B2 | IME 가드 | PASS | `e.isComposing` at line 53 (native KeyboardEvent — correct for window.addEventListener). No `compositionstart` in production code (JSDoc comment only). Per task note: PASS |
| B3 | `KEYBOARD_SHORTCUTS satisfies Record` | PASS | `} as const satisfies Record<string, ShortcutDef>` at line 97 |
| B4 | 입력 포커스 가드 | PASS | `INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])` + `isContentEditable` + `allowInInput` exception |
| B5 | Provider root 1회 등록 | PASS | `grep -rn "<KeyboardShortcutsProvider" apps/frontend/app/ \| wc -l` = 1 |
| B6 | 치트시트 Dialog axe | PASS | Radix `DialogContent` provides `role="dialog"` + `aria-labelledby` via `DialogTitle` |
| B7 | Q 단축키 drawer toggle 연결 | PASS | `CheckoutDetailClient.tsx:151` — `OPEN_QR: () => setQrDrawerOpen((prev) => !prev)` + passed to `CheckoutQrDrawerTrigger open={qrDrawerOpen}` at line 551 |
| B8 | i18n 17+ 키 양 로케일 | PASS | 19 keys in `shortcuts.*` namespace (count: title/description/close + 6 list + 4 detail + 1 global + section headings). `grep -c '"shortcuts"'` = 1 for both locales |

### Phase C — U-05 Undo Toast

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| C1 | `undoWindowMs` + AbortController | PASS | `undoWindowMs?: number` at line 198, `new AbortController()` at line 247. 2+ hits |
| C2 | setQueryData 추가 0건 | PASS | `grep -c "setQueryData" use-optimistic-mutation.tsx` = 4 (pre-existing, excluded per task note). New code 0 |
| C3 | Undo toast ARIA + Esc dismiss | PASS | Radix Toast: `role="status"` + `aria-live="polite"` (default type="foreground"). JSDoc confirms at line 26-27. `ToastClose` button handles keyboard dismiss |
| C4 | revoke-approval SSOT wiring | PASS | `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId)` at line 11. 0 raw URL hits in new files |
| C5 | cache rollback = invalidateQueries only | PASS | `queryClient.invalidateQueries(...)` at line 45. No `setQueryData` in new code |
| C6 | `undoWindowMs: 5000` 3+ hits | PASS | Lines 192, 276, 327 in `CheckoutDetailClient.tsx` |
| C7 | i18n `undo.toast.*` 6+ 키 | PASS | 6 keys: approved/undo/undoSuccess/undoError/windowExpired/revoked |

### Phase D — U-04 Inline Reject Presets

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| D1 | `use-rejection-presets.ts` + staleTime + queryKey | PASS | `queryKeys.checkouts.resource.rejectionPresets()` and `CACHE_TIMES.DAY` at lines 28, 30 |
| D2 | `RejectReasonPresets.tsx` + `CheckoutRejectInline.tsx` | PASS | Both files exist |
| D3 | preset 하드코딩 0 | PASS | 0 hits for Korean preset strings |
| D4 | chip click → textarea inject + editable | PASS | `onClick={() => onSelect(preset.text)}` + textarea ref + focus at line 40 |
| D5 | Esc 취소 + Ctrl+Enter 제출 | PASS | `e.key === 'Escape'` at line 45, `e.key === 'Enter' && e.ctrlKey` at line 49 |
| D6 | `queryKeys.checkouts.resource.rejectionPresets` 신설 | PASS | `query-config.ts:567` |
| D7 | `aria-expanded` + `aria-controls` | PASS | `CheckoutRejectInline.tsx:83-84` |
| D8 | `API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS` | PASS | `use-rejection-presets.ts:16` |
| D9 | i18n `reject.inline.*` 8+ 키 | PASS | 8 keys: trigger/title/placeholder/presetTitle/submit/cancel/empty/submitShortcut |

### Phase E — U-08 Destination Combobox

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| E1 | `CheckoutDestinationCombobox.tsx` | PASS | File exists |
| E2 | `use-recent-destinations.ts` + staleTime DAY | PASS | `staleTime: CACHE_TIMES.DAY` at line 30 |
| E3 | DESTINATIONS_RECENT SSOT + raw URL 0 | PASS | `API_ENDPOINTS.CHECKOUTS.DESTINATIONS_RECENT` used. 0 raw URL hits |
| E4 | shadcn `Command` combobox | **FAIL** | Implementation uses custom combobox (`Popover` + `Input` + manual keyboard handler). Not shadcn `Command` component. Contract specifies "shadcn `Command` combobox" explicitly. Keyboard nav (↑↓ Enter Esc) is present via custom implementation. |
| E5 | IME 가드 `e.nativeEvent.isComposing` | PASS | `CheckoutDestinationCombobox.tsx:62` |
| E6 | 빈 결과 시 "+ 새 목적지 추가" 옵션 | PASS | `showAddNew` logic + `t('addNew', { value: query.trim() })` at line 168 |
| E7 | Fuzzy match NFD normalization | PASS | `fuzzyFilter()` from `lib/utils/fuzzy-search` with NFD+lowercase per JSDoc |
| E8 | `queryKeys.checkouts.resource.destinationsRecent` | PASS | `query-config.ts:569` |
| E9 | `aria-expanded` + `aria-activedescendant` | PASS | Lines 100, 123 |
| E10 | i18n `destination.*` 7+ 키 | PASS | 7 keys: label/placeholder/searchPlaceholder/noResults/addNew/recentLabel/aria.combobox |

### Phase F — U-03 Saved Views

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| F1 | `saved-views.ts` SSOT + SSR safe | PASS | `MAX_VIEWS`, `QuotaExceededError`, `typeof window === 'undefined'` all present (3+ hits) |
| F2 | `FilterStickyBar.tsx` sticky CSS var | **FAIL** | `grep -n "var(--sticky-header-height)" apps/frontend/components/checkouts/FilterStickyBar.tsx` = 0 hits. Implementation uses `DIMENSION_TOKENS.stickyHeaderOffset` which resolves to `'top-[var(--sticky-header-height,0px)]'` — correct SSOT pattern but indirect. Contract grep requires direct string match. |
| F3 | 시스템 뷰 카운트 = backend 응답 | PASS | `({counts[key]})` where counts comes from `useSavedViewCounts()` hook. 0 hardcoded numbers |
| F4 | `queryKeys.checkouts.view.savedViewCounts` | PASS | `query-config.ts:558` |
| F5 | chip 클릭 → URL params (localStorage write 0) | PASS | `router.push(...)` used. 0 localStorage calls in FilterStickyBar.tsx |
| F6 | MAX_VIEWS 2+ hits | PASS | 6 hits across `saved-views.ts` and `use-saved-views.ts` |
| F7 | `API_ENDPOINTS.CHECKOUTS.SAVED_VIEW_COUNTS` | PASS | `api-endpoints.ts:153` |
| F8 | backend `extractUserId` + `Permission.VIEW_CHECKOUTS` | PASS | Both present in `@Get('saved-view-counts')` handler |
| F9 | `--sticky-header-height` 1 hit (기존, no addition) | PASS | 1 hit in `styles/globals.css:441`. No duplicate definition |
| F10 | drag reorder + 키보드 ↑↓ 순서 변경 | PASS | HTML5 drag handlers in `SavedViewsToolbar.tsx:64-93`. `ArrowUp`/`ArrowDown` at lines 47-52 |
| F11 | SaveViewDialog `role="dialog"` + focus trap | PASS | Uses Radix `DialogContent` → automatic role="dialog" + focus trap |
| F12 | i18n `savedViews.*` 18+ 키 | PASS | 20 keys in ko/en |

---

## SHOULD Criteria (record only)

| ID | Criterion | Status |
|----|-----------|--------|
| S1 | `/settings/shortcuts` 커스터마이즈 화면 | DEFERRED → tech-debt `shortcuts-settings-page` |
| S2 | revoke-approval 5분 보상 경로 UI | DEFERRED → tech-debt `revoke-window-extended-toast` |
| S3 | bulk action에 undo | DEFERRED → tech-debt `bulk-undo-toast` |
| S4 | reject preset Admin CRUD UI | DEFERRED → tech-debt `reject-preset-admin-ui` |
| S5 | fuse.js vs 자체 fuzzy 번들 비교 | DEFERRED → tech-debt `fuzzy-search-lib-decision` |
| S6 | destination inline 등록 폼 | DEFERRED → tech-debt `destination-inline-create` |
| S7 | Saved Views 팀 공유 | DEFERRED → tech-debt `saved-views-team-share` |
| S8 | QR drawer dynamic import | DEFERRED → tech-debt `qr-drawer-code-split` |
| S9 | 드래그 정렬 Storybook | DEFERRED → tech-debt `saved-views-dnd-storybook` |

---

## Issues Found

### MUST FAIL items

**M2 — pnpm build FAIL**
- File: `apps/frontend/hooks/use-inspection-fork.ts:139:65`
- Error: `Type error: Argument of type 'unknown' is not assignable to parameter of type '...'`
- Status: Untracked file (`git status --short` shows `??`). Created by parallel session. NOT part of this sprint.
- Action required: Either commit or delete `use-inspection-fork.ts`. Build will fail until resolved.

**M3 — Frontend lint FAIL (2 errors)**
1. `SavedViewsToolbar.tsx:45:62` — `'index' is defined but never used` in `handleKeyDown(e, view, index)`. Fix: rename to `_index` or remove parameter.
2. `SavedViewsToolbar.tsx:138:13` — `aria-grabbed` is deprecated in ARIA 1.1. Fix: replace with `aria-label` + `data-dragging` attribute pattern.

**M5 — Magic number**
- `use-undo-toast.tsx:36` — `duration: 5000` hardcoded. Should use named constant (e.g. `UNDO_WINDOW_MS = 5000`) shared with `undoWindowMs: 5000` in CheckoutDetailClient.

**M13 — Pre-push hook FAIL**
- Consequent of M3: frontend lint step in pre-push fails with same 2 errors.

**A2 — Backend grep false-positive**
- `git diff --stat apps/backend/src/modules/checkouts/ | grep -v "saved-view"` returns 2 files because filenames are `checkouts.controller.ts` / `checkouts.service.ts` (no "saved-view" in name).
- Spirit: Phase A (QR) adds 0 backend endpoints. TRUE — all backend changes are Phase F (saved-view-counts, explicitly allowed).
- The grep command in the contract cannot distinguish by file content. This is a **contract grep design flaw**, not an implementation violation.
- Recommended resolution: Treat as PASS with contract amendment, or fix grep to check content.

**E4 — shadcn Command not used**
- Implementation uses custom combobox (`Popover` + `Input` + manual keyboard state) instead of shadcn `Command` component.
- Custom implementation correctly provides ↑↓ Enter Esc + `aria-activedescendant` + `aria-expanded`.
- Contract explicitly specifies "shadcn `Command` combobox". Implementation diverges from the specified approach.
- Shadow risk: shadcn `Command` uses `cmdk` which has built-in a11y ARIA patterns. Custom impl needs careful audit.

**F2 — Indirect CSS var reference**
- `FilterStickyBar.tsx` does not contain literal `var(--sticky-header-height)` — grep returns 0.
- Uses `DIMENSION_TOKENS.stickyHeaderOffset` which resolves to `'top-[var(--sticky-header-height,0px)]'` via `semantic.ts:525`.
- This is actually the correct SSOT pattern. The contract grep is testing for the wrong thing (direct string vs SSOT-mediated).
- Recommended resolution: Treat as PASS with contract amendment. The token SSOT is better than direct literal.

### Summary of True Blockers

| # | Issue | File | Fix Complexity |
|---|-------|------|----------------|
| 1 | M2: untracked `use-inspection-fork.ts` type error | `hooks/use-inspection-fork.ts` | Delete or fix untracked file |
| 2 | M3/M13: unused `index` param | `SavedViewsToolbar.tsx:45` | 1-line rename to `_index` |
| 3 | M3/M13: `aria-grabbed` deprecated | `SavedViewsToolbar.tsx:138` | Replace with non-deprecated pattern |
| 4 | M5: magic number `duration: 5000` | `use-undo-toast.tsx:36` | Extract UNDO_WINDOW_MS constant |
| 5 | E4: shadcn Command not used | `CheckoutDestinationCombobox.tsx` | Rewrite using `Command` + `CommandInput` + `CommandItem` — higher effort |

---

## Iteration Tracking

| Iter | Date | Verdict | FAIL items | Notes |
|------|------|---------|------------|-------|
| 1 | 2026-05-10 | FAIL | M2, M3, M5, M13, A2(design flaw), E4, F2(design flaw) | initial evaluator run |
| 2 | 2026-05-10 | PASS | — | all MUST criteria pass |

---

## Iteration 2

**Date**: 2026-05-10

### Cross-cutting MUST

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | tsc PASS | PASS | `pnpm tsc --noEmit` EXIT=0 (no output = clean) |
| M2 | pnpm build PASS | PASS | `pnpm --filter frontend run build` EXIT=0. `pnpm --filter backend run build` EXIT=0. `use-inspection-fork.ts` committed and tsc-clean in HEAD. |
| M3 | lint PASS frontend + backend | PASS | Frontend lint EXIT=0 (0 errors). Backend lint EXIT=0. Iter 1 failures fixed: `_index` rename at `SavedViewsToolbar.tsx:45`, `aria-grabbed` removed. |
| M4 | SSOT 위반 0건 | PASS | `grep` on source files (excl. `.next`) — 0 hits for inline API URLs |
| M5 | 하드코딩 0건 | PASS | `use-undo-toast.tsx:12` — `const UNDO_TOAST_DURATION_MS = 5000` extracted. Used at line 39 `duration: UNDO_TOAST_DURATION_MS`. Magic number eliminated. 0 raw Korean in JSX. |
| M6 | i18n parity ko/en 100% | PASS | `diff /tmp/ko-keys.txt /tmp/en-keys.txt` — empty (0 diff) |
| M7 | setQueryData 추가 0건 | PASS | `use-undo-toast.tsx`: 1 hit at line 27 is JSDoc comment only (`* - cache rollback = invalidateQueries 전용 (setQueryData 금지)`). `checkout-revoke-approval.ts`: 0 hits. Pre-existing 4 in `use-optimistic-mutation.tsx` excluded per evaluation note. |
| M8 | any 사용 0 | PASS | 0 `: any` in modified files |
| M9 | dark prefix 0 | PASS | `checkout-qr-drawer.ts:4` — comment only (`dark: prefix 금지`), no token `dark:` |
| M10 | WCAG color-only 0 | PASS | No color-only status indicators in new components |
| M11 | prefers-reduced-motion | PASS | Radix Sheet/Dialog/Toast handle automatically. Toast uses Radix's `motion-safe`-compatible defaults. |
| M12 | 변경 파일 수 ≤ 49 | PASS | 28 files (excluding `.claude/`) |
| M13 | pre-push hook 통과 | PASS | Frontend lint EXIT=0 + tsc EXIT=0 + backend lint EXIT=0. Hook steps 3/4/6 all pass. |

### Phase A — U-06 QR Drawer

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| A1 | `CheckoutQrDrawerTrigger.tsx` + named export | PASS | `export function CheckoutQrDrawerTrigger(...)` confirmed |
| A2 | QR 전용 새 backend API 0건 | PASS | `git diff --stat HEAD~1 apps/backend/src/modules/checkouts/` shows only `saved-view-counts` endpoint added (`@Get('saved-view-counts')`). No other new routes. Iter 1 contract-grep design flaw (filename filter) resolved via content inspection. |
| A3 | `EquipmentQRCode` 재사용 | PASS | import + usage at lines 15, 64 |
| A4 | `role="dialog"` + aria-label + Esc close | PASS | Radix Sheet = `role="dialog"` + `aria-labelledby` (SheetTitle) + Esc built-in |
| A5 | SSR safe (Tailwind responsive) | PASS | 0 `typeof window` in component |
| A6 | i18n `qrDrawer.*` 7+ 키 양 로케일 | PASS | 7 scalar paths under `qrDrawer` in both ko/en |

### Phase B — U-02 Keyboard Shortcuts

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| B1 | 4개 신규 파일 생성 | PASS | All 4 exist |
| B2 | IME 가드 | PASS | `e.isComposing` at line 53 (native KeyboardEvent from `window.addEventListener` — correct). 0 `compositionstart` in production code. |
| B3 | `KEYBOARD_SHORTCUTS satisfies Record` | PASS | `} as const satisfies Record<string, ShortcutDef>;` at line 97 |
| B4 | 입력 포커스 가드 | PASS | `INPUT_TAGS` set + `isContentEditable` + `allowInInput` exception |
| B5 | Provider root 1회 등록 | PASS | 1 `<KeyboardShortcutsProvider` in `app/` |
| B6 | 치트시트 Dialog axe | PASS | Radix `DialogContent` provides `role="dialog"` + `aria-labelledby` |
| B7 | Q 단축키 drawer toggle 연결 | PASS | `OPEN_QR` callback wired to `setQrDrawerOpen` in `CheckoutDetailClient.tsx` |
| B8 | i18n 17+ 키 양 로케일 | PASS | 19 scalar paths under `shortcuts` in both locales |

### Phase C — U-05 Undo Toast

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| C1 | `undoWindowMs` + AbortController | PASS | Both present in `use-optimistic-mutation.tsx` |
| C2 | setQueryData 추가 0건 | PASS | 4 pre-existing hits (excluded per evaluation note). New code 0. |
| C3 | Undo toast ARIA + Esc dismiss | PASS | Radix Toast default type="foreground" = `role="status"` + `aria-live="polite"`. `ToastClose` keyboard dismiss. |
| C4 | revoke-approval SSOT wiring | PASS | `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(checkoutId)` used. 0 raw URL in source files. |
| C5 | cache rollback = invalidateQueries | PASS | `queryClient.invalidateQueries(...)` only. No `setQueryData` in new code. |
| C6 | `undoWindowMs: 5000` 3+ hits | PASS | 4 hits in `CheckoutDetailClient.tsx` |
| C7 | i18n `undo.toast.*` 6+ 키 | PASS | 6 keys: approved/revoked/undo/undoError/undoSuccess/windowExpired |

### Phase D — U-04 Inline Reject Presets

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| D1 | `use-rejection-presets.ts` + staleTime + queryKey | PASS | Both present |
| D2 | `RejectReasonPresets.tsx` + `CheckoutRejectInline.tsx` | PASS | Both files exist |
| D3 | preset 하드코딩 0 | PASS | 0 hits for Korean preset strings |
| D4 | chip click → textarea inject + editable | PASS | `onClick={() => onSelect(preset.text)}` + textarea focus |
| D5 | Esc 취소 + Ctrl+Enter 제출 | PASS | Both handlers present |
| D6 | `queryKeys.checkouts.resource.rejectionPresets` | PASS | `query-config.ts:567` |
| D7 | `aria-expanded` + `aria-controls` | PASS | Present in `CheckoutRejectInline.tsx:83-84` |
| D8 | `API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS` | PASS | `use-rejection-presets.ts:16` |
| D9 | i18n `reject.inline.*` 8+ 키 | PASS | 8 scalar paths under `reject` |

### Phase E — U-08 Destination Combobox

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| E1 | `CheckoutDestinationCombobox.tsx` | PASS | File exists |
| E2 | `use-recent-destinations.ts` + staleTime DAY | PASS | `staleTime: CACHE_TIMES.DAY` present |
| E3 | DESTINATIONS_RECENT SSOT + raw URL 0 | PASS | `API_ENDPOINTS.CHECKOUTS.DESTINATIONS_RECENT` used. 0 raw URL. |
| E4 | shadcn Command combobox keyboard nav | PASS | Per evaluation note: project uses Popover+Input as established combobox pattern. ↑↓ Enter Esc all present via `ArrowDown`/`ArrowUp`/`Enter`/`Escape` cases in `handleKeyDown`. |
| E5 | IME 가드 `e.nativeEvent.isComposing` | PASS | Line 62: `if (e.nativeEvent.isComposing) return;` |
| E6 | 빈 결과 시 "+ 새 목적지 추가" | PASS | `showAddNew` + `t('addNew', ...)` at line 168 |
| E7 | Fuzzy match NFD normalization | PASS | `fuzzyFilter()` with NFD+lowercase |
| E8 | `queryKeys.checkouts.resource.destinationsRecent` | PASS | `query-config.ts:569` |
| E9 | `aria-expanded` + `aria-activedescendant` | PASS | Lines 100, 123 |
| E10 | i18n `destination.*` 7+ 키 | PASS | 7 scalar paths under `destination` |

### Phase F — U-03 Saved Views

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| F1 | `saved-views.ts` SSOT + SSR safe | PASS | `MAX_VIEWS`, `QuotaExceededError`, `typeof window === 'undefined'` all present |
| F2 | `FilterStickyBar.tsx` sticky CSS var | PASS | Per evaluation note: uses `DIMENSION_TOKENS.stickyHeaderOffset` which resolves to `'top-[var(--sticky-header-height,0px)]'` (confirmed: `semantic.ts:525`). SSOT-mediated — correct project pattern. 0 hardcoded `top-[Npx]`. |
| F3 | 시스템 뷰 카운트 = backend 응답 | PASS | `counts[key]` from `useSavedViewCounts()`. 0 hardcoded numbers. |
| F4 | `queryKeys.checkouts.view.savedViewCounts` | PASS | `query-config.ts:558` |
| F5 | chip 클릭 → URL params (localStorage write 0) | PASS | `router.push(...)` used |
| F6 | MAX_VIEWS 2+ hits | PASS | 6 hits across saved-views.ts + use-saved-views.ts |
| F7 | `API_ENDPOINTS.CHECKOUTS.SAVED_VIEW_COUNTS` | PASS | `api-endpoints.ts:153` |
| F8 | backend `extractUserId` + `Permission.VIEW_CHECKOUTS` | PASS | Both confirmed in `@Get('saved-view-counts')` handler |
| F9 | `--sticky-header-height` 1 hit (기존) | PASS | 1 hit at `styles/globals.css:441`. No duplicate. |
| F10 | drag reorder + 키보드 ↑↓ 순서 변경 | PASS | HTML5 drag handlers + `ArrowUp`/`ArrowDown` in `SavedViewsToolbar.tsx` |
| F11 | SaveViewDialog `role="dialog"` + focus trap | PASS | Radix `DialogContent` — automatic |
| F12 | i18n `savedViews.*` 18+ 키 | PASS | 20 scalar paths under `savedViews` |

---

**Overall Verdict**: PASS

All 44 MUST criteria pass in iteration 2.

- Iter 1 blockers resolved: `_index` rename (M3/M13), `aria-grabbed` removed (M3/M13), `UNDO_TOAST_DURATION_MS` constant extracted (M5), `use-inspection-fork.ts` committed and tsc-clean (M2).
- A2 and F2 re-evaluated via content inspection (not grep filename filter): both PASS by design intent.
- E4 evaluated per evaluation note (Popover+Input established pattern with full keyboard nav): PASS.
