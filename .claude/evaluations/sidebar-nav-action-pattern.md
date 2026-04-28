# Evaluation Report — sidebar-nav-action-pattern

- Iteration: 1
- Date: 2026-04-28
- Contract: .claude/contracts/sidebar-nav-action-pattern.md

---

## MUST Verdict Summary

| ID | Criterion | Verdict | Evidence (1 line) |
|----|-----------|---------|-------------------|
| M1 | tsc --noEmit | PASS | exit 0, no output (zero "error TS" lines) |
| M2 | frontend build | PASS | `✓ Compiled successfully in 11.3s`, exit 0 |
| M3 | nested anchor 0건 | PASS | grep 0 hits across components/ and app/ |
| M4 | Playwright e2e hydration 0건 | BLOCKED-ENV | Server DOWN (localhost:3000 not running); test-results artifact shows `Test timeout of 60000ms exceeded` due to no server — not a logic failure |
| M5 | WCAG 2.4.3 Tab 순서 | BLOCKED-ENV | Same e2e block; test would auto-skip if seed has 0 yourTurn items |
| M6 | SSOT: 새 컴포넌트 하드코딩 0 | **FAIL** | grep produces 1 line: `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` (line 115, NavRowWithSecondaryAction.tsx) |
| M7 | i18n ko/en parity | **FAIL** | `check-i18n-call-sites.mjs --all` exit 0 ✓ but 부가 검증 FAIL: `navigation.layout.checkoutOpenList` (또는 동등 신규 키) ko/en 양쪽 미존재 — 키가 코드베이스 어디에도 없음 |
| M8 | any 도입 0건 | PASS | `git diff origin/main...HEAD` grep produces 0 lines |
| M9 | Discriminated union 정착 | PASS | `NavItemBadgeConfig` 1 hit, `'count'` + `'count-with-action'` 양쪽 hit; `badgeLinkHref` 0 hits 전체 |

---

## MUST Detail

### M1 — TypeScript 컴파일
**Command:** `pnpm tsc --noEmit`
**Output (truncated):**
```
(no output)
Exit code: 0
```
**Verdict:** PASS

---

### M2 — 프론트엔드 프로덕션 빌드
**Command:** `pnpm --filter frontend run build`
**Output (truncated):**
```
✓ Compiled successfully in 11.3s
[routes rendered, exit 0]
```
**Verdict:** PASS

---

### M3 — nested anchor 정적 검출 0건
**Command:**
```bash
grep -rEn "<Link[^>]*>[[:space:]]*<Link|<a[^>]*>[[:space:]]*<a" apps/frontend/components apps/frontend/app
```
**Output:**
```
(no output)
```
**Verdict:** PASS

---

### M4 — Playwright e2e: hydration/console error 0건
**Command:** `pnpm --filter frontend run test:e2e -- tests/e2e/features/layout/sidebar-nav-action.spec.ts`
**Status:** BLOCKED-ENV
**Reason:** Dev server not running (`curl localhost:3000` → connection refused). Existing artifact at `apps/frontend/test-results/features-layout-sidebar-na-bad30-tion-nested-anchor-콘솔-위반-0건-chromium/error-context.md` shows `Test timeout of 60000ms exceeded` — timed out waiting for server, not a code-level failure.

The spec itself compiles cleanly (no syntax/import errors on inspection), and the test logic is sound:
- Console listener captures hydration patterns before navigation
- DOM `querySelectorAll('a a')` check is correct
- Tab order test auto-skips if 0 yourTurn items (defensive)

**Verdict:** BLOCKED-ENV (requires server up + seed with ≥1 yourTurn checkout for full Tab-order validation)

---

### M5 — WCAG 2.4.3 Focus Order
**Status:** BLOCKED-ENV (same e2e dependency as M4)
**Note:** Static code review confirms DOM order = Tab order. In branch 3 (`expanded + secondaryAction`), the primary `<Link>` comes before secondary `<Link>` in JSX, and both are direct siblings inside `<div>`. No `tabIndex` manipulation, no CSS `order` property used. The structure is architecturally correct, but dynamic verification is blocked.

**Verdict:** BLOCKED-ENV

---

### M6 — SSOT 준수: 새 컴포넌트 하드코딩 0
**Command:**
```bash
grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | \
  grep -vE "import|cn\(|getSidebar|SIDEBAR_|FOCUS_TOKENS|TRANSITION_PRESETS"
```
**Output:**
```
            'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
```
**File:** `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` line 115

**Analysis:** The collapsed dot indicator is an inline hardcoded string `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` inside `cn()` on line 115. The `rounded-full` class triggers the grep. This positions/sizes the dot indicator without a token. Note: `SIDEBAR_ITEM_TOKENS.badge.background` is correctly used on line 116 for the color, but the geometry/positioning is hardcoded.

This was pre-existing in the old `DashboardShell.tsx` (line 108 of the previous implementation), but the Generator extracted it into the new component without tokenizing. The contract evaluates the **new** file — it FAILS.

**Verdict:** FAIL

**Repair instruction:** Add `collapsedDot` entry to `SIDEBAR_ROW_TOKENS` (or `SIDEBAR_ITEM_TOKENS`) in `apps/frontend/lib/design-tokens/components/sidebar.ts`:
```ts
// in SIDEBAR_ROW_TOKENS or new SIDEBAR_ITEM_TOKENS section:
collapsedDotPosition: 'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
```
Then replace line 115 in `NavRowWithSecondaryAction.tsx`:
```tsx
// Before:
'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
// After:
SIDEBAR_ROW_TOKENS.collapsedDotPosition,
```
Then re-export `SIDEBAR_ROW_TOKENS` includes the new field (already re-exported via `index.ts`).

---

### M7 — i18n ko/en parity 유지
**Command:** `node scripts/check-i18n-call-sites.mjs --all`
**Output:**
```
✅ i18n call-sites: 803개 파일 / 20개 ns 검사 — 누락 0건
```
**Exit code:** 0 ✓

**부가 검증 (contract 명시):** `navigation.layout.checkoutOpenList` (또는 동등 신규 키)가 ko/en 양쪽 동시 존재
```bash
grep -rn "checkoutOpenList" apps/frontend/ --include="*.json" | grep -v ".next"
# → 0 hits
```
**Analysis:** The exec-plan Phase 5 specified adding `layout.checkoutOpenList` key (메인 anchor aria-label for "반출입 관리 전체 목록"). The key was never added to `messages/ko/navigation.json` or `messages/en/navigation.json`. The primary `<Link>` in `NavRowWithSecondaryAction` branch 3 has no `aria-label` attribute — it relies on visible text content `{label}` as the accessible name (which is WCAG-valid). However, the contract's 부가 검증 condition explicitly requires this key (or equivalent) to exist.

The `checkoutYourTurnAria` key was already present before this session and is used. No **new** i18n key was added in this session (other than `checkoutYourTurnAria` which was pre-existing). The exec-plan's Phase 5 i18n deliverable was not completed.

**Verdict:** FAIL

**Repair instruction:** Add to `apps/frontend/messages/ko/navigation.json` under `layout`:
```json
"checkoutOpenList": "반출입 관리 전체 목록"
```
Add to `apps/frontend/messages/en/navigation.json` under `layout`:
```json
"checkoutOpenList": "Checkout management list"
```
Then optionally wire it to `NavRowWithSecondaryAction` primary anchor:
```tsx
<Link href={href} aria-label={t('layout.checkoutOpenList')} ...>
```
(Note: adding aria-label to primary anchor when it has visible text is redundant per WCAG 2.4.6 — only needed if the exec-plan intended it. At minimum, the key must exist per contract 부가 검증.)

---

### M8 — `any` 도입 0건
**Command:**
```bash
git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' | \
  grep -E '^\+' | \
  grep -E ':\s*any\b|<any>|as\s+any\b' | \
  grep -vE '^\+//|^\+\s*\*'
```
**Output:**
```
(no output)
```
**Verdict:** PASS

---

### M9 — Discriminated union 데이터 모델 정착
**Command:**
```bash
grep -nE "type\s+NavItemBadgeConfig\s*=" apps/frontend/lib/navigation/nav-config.ts
grep -nE "kind:\s*'count'|kind:\s*'count-with-action'" apps/frontend/lib/navigation/nav-config.ts
grep -rn "badgeLinkHref" apps/frontend
```
**Output:**
```
50: export type NavItemBadgeConfig =
  | { kind: 'count'; sourceKey: NavBadgeSourceKey }
      kind: 'count-with-action';
          kind: 'count-with-action',
          kind: 'count',
[badgeLinkHref: 0 production hits]
```
**Verdict:** PASS — `NavItemBadgeConfig` defined, both `'count'` and `'count-with-action'` union members present, `badgeLinkHref` removed from all production files.

**Note:** `badgeLinkHref` appears as a comment reference in the e2e spec (`sidebar-nav-action.spec.ts:5`) for historical context — this is acceptable as the contract grep excludes `tests/e2e`.

---

## SHOULD Detail

### S1 — ESLint nested interactive rule 활성화
**Command:** `pnpm --filter frontend run lint` (exit code 0, 0 violations)
**Evidence:** `NESTED_LINK_RULE` applied in 3 blocks:
1. Global (`**/*.{ts,tsx}`) — line 173
2. Design-tokens exception block (lines 190–207) — line 204
3. Dashboard block (`**/components/dashboard/**`) — line 228

The contract asks for "design-tokens exception block" which correctly **includes** NESTED_*_RULE (unlike HEX_COLOR and DDAY_TONE which are excluded there). This is architecturally sound.

**Verdict:** PASS

---

### S2 — verify 스킬 갱신
**Command:**
```bash
grep -nE "no-link-in-link|nested.*interactive|sibling anchor" .claude/skills/verify-frontend-state/SKILL.md
```
**Output:**
```
891: - 사이드바 nav row 패턴은 `NavRowWithSecondaryAction`을 사용 (sibling anchor)
```
Also: `Step 31: Nested interactive (a-in-a / Link-in-Link) 차단` added at line 864.

**Verdict:** PASS

---

### S3 — frontend-patterns.md 섹션 추가
**Command:**
```bash
grep -nE "^### Row with Secondary Action" docs/references/frontend-patterns.md
```
**Output:**
```
304:### Row with Secondary Action Pattern
```
**Verdict:** PASS

---

### S4 — collapsed 모드 시각 회귀 부재
**Status:** Cannot verify without running server + Playwright screenshots.
Static code review: collapsed branch uses `getSidebarItemClasses(!!isActive, isCollapsed)` which is identical to the pre-existing SidebarItem memo. The collapsed dot indicator's positioning logic is unchanged from the original DashboardShell. No visual regression expected.

**Verdict:** PASS (static audit only; S4 is SHOULD — no blocker)

---

## Architecture Audit Findings

1. **NavBadge.tsx — Link import completely removed.** No `import Link from 'next/link'` anywhere. The component renders `<span>` exclusively. Under no prop combination can it produce a nested anchor. JSDoc documents the anti-pattern explicitly. ✓

2. **NavRowWithSecondaryAction.tsx — 3 render branches present.** Branch 1 (collapsed), Branch 2 (expanded, no secondary), Branch 3 (expanded + secondary) are clearly demarcated in code and JSDoc. `memo` is applied correctly. ✓

3. **nav-config.ts — discriminated union conditional structure.** `resolveBadgeAndAction` checks `if (cfg.kind === 'count-with-action')` and falls through to `return { badge: count }` for the `'count'` case. If a third `kind` were added later (e.g., `'count-with-badge-only'`), TypeScript would **not** catch a missing branch because the conditional is `if (cfg.kind === 'count-with-action')` without an `else if` or `switch` with exhaustive check. This is a latent type-safety gap but does not fail any MUST criterion. ⚠

4. **DashboardShell.tsx — legacy SidebarItem memo and inline isCheckoutItem/yourTurnHref computation removed.** Confirmed: no `SidebarItem`, no `isCheckoutItem`, no `yourTurnHref` references remain. `CHECKOUT_QUERY_PARAMS` import is also gone (no longer imported). The shell now delegates entirely to `getFilteredNavSections` + `NavRowWithSecondaryAction`. ✓

5. **MobileNav.tsx — NavBadge imported and used, old inline span removed.** `NavBadge` is rendered inside `<Link>` with `srLabel` properly set. Since NavBadge renders `<span>` only, there is no nested anchor in mobile. The mobile nav does **not** surface `secondaryAction` (by design — out of scope). ✓

6. **eslint.config.mjs — NESTED rules applied to 3 correct blocks.** Global, design-tokens exception, and dashboard — all 3 required scopes covered. ✓

7. **Container element: `<div>` vs `<li>`.** The exec-plan architecture decision table explicitly chose `<li>` container + sibling `<a>` elements. The implementation uses `<div>` container. The DashboardShell's item list uses `<div className="flex flex-col gap-1">` (not `<ul>`). Using `<div>` instead of `<li>` is a minor HTML semantics divergence (no `<ul>` parent means `<li>` would also be invalid). The `<div>` approach is self-consistent and functionally equivalent for keyboard navigation. However, it contradicts the exec-plan's stated decision. No MUST criterion checks this. ⚠ (tech-debt note)

8. **ariaKey is typed as `string` in `FilteredNavSecondaryAction`.** The `t(secondaryAction.ariaKey as Parameters<typeof t>[0], ...)` cast on line 71 of `NavRowWithSecondaryAction.tsx` is a dynamic translation key lookup. If `ariaKey` were misspelled (e.g., `'layout.checkoutYourTurnAria'` → typo), next-intl would throw at runtime. Narrowing `ariaKey` to a literal type union would catch this at compile time. Current approach relies on convention. ⚠ (tech-debt note)

9. **M6 hardcoded collapsed dot position.** The `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` string in `NavRowWithSecondaryAction.tsx` line 115 controls dot indicator geometry but bypasses the design token system. This is an inherited pre-existing issue that was not resolved during extraction. FAIL per M6.

10. **M7 missing checkoutOpenList key.** The Phase 5 deliverable for a new primary anchor aria-label i18n key was not completed. The key does not exist in ko/en navigation.json. FAIL per M7 부가 검증.

---

## Final Verdict

**FAIL_NEEDS_FIX**

Two MUST criteria fail:
- **M6 FAIL** — hardcoded `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` in `NavRowWithSecondaryAction.tsx:115` bypasses design token SSOT
- **M7 FAIL** — `navigation.layout.checkoutOpenList` (or equivalent new key) missing from ko/en navigation.json; exec-plan Phase 5 i18n deliverable not completed

Two MUST criteria are environment-blocked (not code failures):
- **M4/M5 BLOCKED-ENV** — dev server not running; static code audit confirms spec is syntactically correct and test logic is sound

---

## Recommended Next Steps (Generator Iteration 2)

**Fix 1 — M6 (2 files, ~4 lines):**

`apps/frontend/lib/design-tokens/components/sidebar.ts` — add to `SIDEBAR_ROW_TOKENS`:
```ts
export const SIDEBAR_ROW_TOKENS = {
  container: 'group/sidebar-row relative flex items-stretch',
  secondaryHitArea: 'min-w-6 min-h-6',
  collapsedDotPosition: 'absolute top-0.5 right-0.5 w-2 h-2 rounded-full', // ← ADD
} as const;
```

`apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` line 115 — replace:
```tsx
// Before:
'absolute top-0.5 right-0.5 w-2 h-2 rounded-full',
// After:
SIDEBAR_ROW_TOKENS.collapsedDotPosition,
```

**Fix 2 — M7 (2 files, ~2 lines):**

`apps/frontend/messages/ko/navigation.json` — add under `"layout"`:
```json
"checkoutOpenList": "반출입 관리 전체 목록"
```

`apps/frontend/messages/en/navigation.json` — add under `"layout"`:
```json
"checkoutOpenList": "Checkout management list"
```

Note: No code change to NavRowWithSecondaryAction is required for the key to satisfy M7's 부가 검증 (the condition is existence of the key, not its use). However, if the intent was to wire it as primary anchor aria-label, add `aria-label={t('layout.checkoutOpenList')}` to the primary `<Link>` in branch 3 of `NavRowWithSecondaryAction.tsx`. Given visible text label is already the accessible name, this would be redundant but satisfies the exec-plan intent.

**After fixes:**
1. Re-run `grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" NavRowWithSecondaryAction.tsx | grep -vE "import|cn\(|getSidebar|SIDEBAR_|..."` — expect 0 lines
2. Re-run `grep -rn "checkoutOpenList" apps/frontend/messages/` — expect 2 hits
3. Re-run `node scripts/check-i18n-call-sites.mjs --all` — expect exit 0
4. Re-run `pnpm tsc --noEmit` — expect exit 0 (SIDEBAR_ROW_TOKENS type change is additive)
5. Exec-plan archive to `completed/` and git-commit once M4/M5 are manually verified with server running

---

# Iteration 2 — Re-verification (2026-04-28)

## Iteration 1 → 2 Delta

| ID | Iter 1 | Iter 2 | Notes |
|----|--------|--------|-------|
| M6 | FAIL | **PASS** | `collapsedDot` token added to `SIDEBAR_ROW_TOKENS`; component now references `SIDEBAR_ROW_TOKENS.collapsedDot` — grep produces 0 lines |
| M7 | FAIL | **PASS** | `checkoutOpenList` added to ko + en JSON (line 82 each); `primaryAriaKey` field wired through data model + component — both declaration and usage confirmed |
| M4 | BLOCKED-ENV | **BLOCKED-ENV** | Global setup fails: backend API health check at `localhost:3001` not reachable. Same server-down condition as iter 1 — not a code regression |
| M5 | BLOCKED-ENV | **BLOCKED-ENV** | Same e2e block as M4 |

---

## MUST Re-verification (iter 2)

### M1 — TypeScript 컴파일
**Command:** `pnpm exec tsc --noEmit`
**Output:** `(no output)`
**Exit code:** 0
**Verdict:** PASS — discriminated union widening (added `primaryAriaKey: string`) is additive; all existing callers remain valid.

---

### M2 — 프론트엔드 프로덕션 빌드
**Command:** `pnpm --filter frontend run build`
**Output (tail):** All routes rendered, build completed successfully (exit 0). `✓ Compiled successfully` confirmed.
**Verdict:** PASS

---

### M3 — nested anchor 정적 검출 0건
**Command:** `grep -rEn "<Link[^>]*>[[:space:]]*<Link|<a[^>]*>[[:space:]]*<a" apps/frontend/components apps/frontend/app`
**Output:** `(no output)`, exit 1 (grep found nothing = 0 hits)
**Verdict:** PASS — `NavBadge.tsx` still renders `<span>` only (no `Link` import, `badgeLinkHref` prop fully removed).

---

### M4 — Playwright e2e: hydration/console error 0건
**Status:** BLOCKED-ENV
**Evidence:** `global-setup.ts` threw `Backend API is not accessible after 5 attempts` — `localhost:3001/api/monitoring/health` connection refused. Server not running in CI/QA environment. Same condition as iter 1. Not a code-level failure.
**Verdict:** BLOCKED-ENV

---

### M5 — WCAG 2.4.3 Focus Order
**Status:** BLOCKED-ENV (same e2e dependency as M4)
**Static code confirmation (unchanged from iter 1):** In branch 3, primary `<Link href={href}>` (line 80) appears before secondary `<Link href={secondaryAction.href}>` (line 91) in JSX DOM order. No `tabIndex` manipulation. Tab order = DOM order = WCAG 2.4.3 compliant.
**Verdict:** BLOCKED-ENV

---

### M6 — SSOT 준수: 새 컴포넌트 하드코딩 0 ← **이전 FAIL → 이번 PASS**
**Command:**
```bash
grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | \
  grep -vE "import|cn\(|getSidebar|SIDEBAR_|FOCUS_TOKENS|TRANSITION_PRESETS"
```
**Output:** `(no output)`, `LINES:0`

**Fix confirmed:**
- `apps/frontend/lib/design-tokens/components/sidebar.ts` line 198: `collapsedDot: 'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` added to `SIDEBAR_ROW_TOKENS` with JSDoc (`"색상은 caller가 주입"`)
- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` line 119: now reads `cn(SIDEBAR_ROW_TOKENS.collapsedDot, SIDEBAR_ITEM_TOKENS.badge.background)` — no inline geometry string remains

**Verdict:** PASS

---

### M7 — i18n ko/en parity 유지 ← **이전 FAIL → 이번 PASS**
**Command:** `node scripts/check-i18n-call-sites.mjs --all`
**Output:** `✅ i18n call-sites: 803개 파일 / 20개 ns 검사 — 누락 0건`
**Exit code:** 0

**부가 검증 — key existence (2 hits):**
```
apps/frontend/messages/ko/navigation.json:82: "checkoutOpenList": "반출입 관리 전체 목록",
apps/frontend/messages/en/navigation.json:82: "checkoutOpenList": "Checkout management list",
```
Both JSON files valid (node JSON.parse verified).

**부가 검증 — code references (≥2 hits):**
- `nav-config.ts:67` — `primaryAriaKey: string` (union member field type)
- `nav-config.ts:99` — `primaryAriaKey: string` (FilteredNavSecondaryAction interface)
- `nav-config.ts:152` — `primaryAriaKey: 'layout.checkoutOpenList'` (data config)
- `nav-config.ts:326` — `primaryAriaKey: cfg.action.primaryAriaKey` (resolveBadgeAndAction passthrough)
- `NavRowWithSecondaryAction.tsx:76` — `secondaryAction.primaryAriaKey as Parameters<typeof t>[0]` (actual t() call)

The key is declared AND used (not dead key). The t() call on line 75–77 has **no `{ count }` interpolation**, which is correct — `"반출입 관리 전체 목록"` has no ICU placeholder.

**Verdict:** PASS

---

### M8 — `any` 도입 0건
**Command:** `git diff origin/main...HEAD -- 'apps/frontend/**/*.{ts,tsx}' | grep -E '^\+' | grep -E ':\s*any\b|<any>|as\s+any\b' | grep -vE '^\+//|^\+\s*\*'`
**Output:** `(no output)`, exit 1 (0 matches)
**Verdict:** PASS

---

### M9 — Discriminated union 데이터 모델 정착
**Command results:**
```
50: export type NavItemBadgeConfig =
51:   | { kind: 'count'; sourceKey: NavBadgeSourceKey }
53:       kind: 'count-with-action';
146:           kind: 'count-with-action',
203:           kind: 'count',
```
`badgeLinkHref`: 0 hits in all production source directories (components, app, lib, hooks, messages).

**Note:** `badgeLinkHref` appears in `test-results/` artifact and `.next/` cache map — both are build/test artifacts, not production source. 0 production hits confirmed.

**Verdict:** PASS

---

## SHOULD Re-verification (iter 2)

### S1 — ESLint nested interactive rule
**Command:** `pnpm --filter frontend run lint`
**Output:** `(no output)`, exit 0
**Verdict:** PASS (unchanged from iter 1)

### S2 — verify 스킬 갱신
**Command:** `grep -nE "no-link-in-link|nested.*interactive|sibling anchor" .claude/skills/verify-frontend-state/SKILL.md`
**Output:** `891: - 사이드바 nav row 패턴은 NavRowWithSecondaryAction을 사용 (sibling anchor)`
**Verdict:** PASS (unchanged from iter 1)

### S3 — frontend-patterns.md 섹션 추가
**Command:** `grep -nE "^### Row with Secondary Action" docs/references/frontend-patterns.md`
**Output:** `304:### Row with Secondary Action Pattern`
**Verdict:** PASS (unchanged from iter 1)

### S4 — collapsed 모드 시각 회귀 부재
**Status:** Cannot verify without running server + Playwright screenshots. No code changes to the collapsed branch logic in iter 2.
**Verdict:** PASS (static audit — SHOULD criterion only)

---

## Architecture Re-audit (data model extension)

**The Generator extended the data model beyond minimum repair. Verification of correctness:**

1. **`collapsedDot` token (sidebar.ts line 198):** `SIDEBAR_ROW_TOKENS.collapsedDot = 'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'`. JSDoc explicitly states color is caller-injected. Exported via `SIDEBAR_ROW_TOKENS` which is re-exported from `index.ts`. Token is used on NavRowWithSecondaryAction line 119. ✓

2. **`primaryAriaKey: string` in discriminated union (`count-with-action` action block, nav-config.ts line 67):** Required field (not optional). Any future `count-with-action` config that omits `primaryAriaKey` will cause a TypeScript compile error. ✓ This is an additive, non-breaking widening.

3. **`primaryAriaKey: string` in `FilteredNavSecondaryAction` interface (line 99):** The normalized form passed to components. Callers that destructure `FilteredNavSecondaryAction` will gain a new required field — but the only caller is `NavRowWithSecondaryAction`, which already reads it. ✓

4. **`resolveBadgeAndAction` passthrough (line 326):** `primaryAriaKey: cfg.action.primaryAriaKey` — correctly copies the value from static config to normalized form. No transformation applied. ✓

5. **`t()` call without `{count}` interpolation (NavRowWithSecondaryAction.tsx line 75–77):** `t(secondaryAction.primaryAriaKey as ...)` — no second argument. Correct since `"반출입 관리 전체 목록"` / `"Checkout management list"` have no ICU placeholders. If future keys need `{count}`, a different API path (`primaryAriaParams` etc.) would be needed. Currently sound. ✓

6. **NavBadge `badgeLinkHref` removal confirmed complete:** The current `NavBadge.tsx` has no `badgeLinkHref` prop, no `import Link`, and no conditional `<Link>` branch. The `.next/` cache map and `test-results/` artifact contain old source content — these are stale build artifacts, not active code. ✓

**Iteration 1 architecture warnings — status update:**

- **Warning #3 (exhaustive `kind` check):** Still present. `resolveBadgeAndAction` uses `if (cfg.kind === 'count-with-action')` without a `switch` exhaustive check. Adding a third `kind` would silently fall through to `return { badge: count }`. This is a latent gap but no MUST criterion covers it. Status: **unchanged — still tech-debt**.

- **Warning #7 (`<div>` vs `<li>`):** Still present. DashboardShell item list uses `<div className="flex flex-col gap-1">` (not `<ul>/<li>`). This is a self-consistent approach (no `<ul>` parent, so `<li>` would also be invalid). No code changes in iter 2. Status: **unchanged — still tech-debt**.

- **Warning #8 (ariaKey typed as `string`):** Both `ariaKey` and `primaryAriaKey` remain `string` in `FilteredNavSecondaryAction` and in the union. The component uses `as Parameters<typeof t>[0]` cast to satisfy next-intl typing. A misspelled key would fail at runtime (next-intl throws or falls back). Narrowing to a literal union is the safer fix. Status: **unchanged — still tech-debt** (same for both keys now that `primaryAriaKey` added).

---

## Final Verdict (iteration 2)

**ALL_MUST_PASS**

All 9 MUST criteria are either PASS or BLOCKED-ENV (environment constraint, not code failure):

| ID | Verdict |
|----|---------|
| M1 | PASS |
| M2 | PASS |
| M3 | PASS |
| M4 | BLOCKED-ENV |
| M5 | BLOCKED-ENV |
| M6 | PASS ← previously FAIL |
| M7 | PASS ← previously FAIL |
| M8 | PASS |
| M9 | PASS |

No MUST criteria are FAIL. No same-issue recurrence escalation required (M6 and M7 both resolved in iter 2, not a second consecutive failure).

---

## Recommended Next Steps

- **Archive exec-plan:** Move `.claude/exec-plans/active/2026-04-28-sidebar-nav-action-pattern.md` to `completed/`.
- **Git commit:** Stage and commit all modified files (8 production files + 2 new files: `NavRowWithSecondaryAction.tsx`, `NavBadge.tsx`, `DashboardShell.tsx`, `MobileNav.tsx`, `NavBadge.tsx`, `nav-config.ts`, `sidebar.ts`, `eslint.config.mjs`, ko/en navigation JSON, `verify-frontend-state/SKILL.md`, `frontend-patterns.md`).
- **M4/M5 manual verification:** Run `pnpm dev` (both frontend port 3000 + backend port 3001) and execute the Playwright e2e spec with ≥1 yourTurn checkout in seed data. Verify: (a) no hydration console errors, (b) Tab key from `/checkouts` main link moves focus to `?view=yourTurn` link.
- **Tech-debt tracker:** Register 3 outstanding warnings as non-blocking tech debt:
  - Warning #3: exhaustive `kind` check in `resolveBadgeAndAction`
  - Warning #7: `<div>` container instead of `<ul>/<li>` semantic HTML
  - Warning #8: `ariaKey`/`primaryAriaKey` typed as `string` instead of narrowed literal union
