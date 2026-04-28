# Next Session Handoff — sidebar-nav-action-pattern 후속

> **이전 세션 (2026-04-28)**: Mode 2 harness로 사이드바 nested-anchor hydration error 해결.
> Commit `7fe8b0d1` (16 files, +1461/-138). All MUST PASS, M4/M5 BLOCKED-ENV.

---

## 즉시 트리거 (commit 가능 시점)

### T1. e2e 수동 검증 — BLOCKED-ENV M4/M5 해소 🟡 MEDIUM

**왜 필요**: 정적 검증(tsc/lint/grep)은 통과했지만 React 19 hydration 단계의 실제 콘솔 거동은 브라우저에서만 확인 가능. 해당 spec은 회귀 차단의 마지막 동적 게이트.

**전제 조건**:
1. PostgreSQL + Redis 컨테이너 기동: `docker compose up -d`
2. dev 서버 기동: `pnpm dev`
3. site_admin storageState 존재 확인: `apps/frontend/tests/e2e/.auth/site-admin.json`
4. 시드에 yourTurn ≥1 케이스 보장 (없으면 `Tab 순서` 테스트는 자동 skip — 첫 두 테스트만 검증)

**실행**:
```bash
pnpm --filter frontend exec playwright test sidebar-nav-action --project=chromium --workers=1 --reporter=line
```

**기대 결과**: 3 PASS (또는 2 PASS + 1 SKIPPED if no yourTurn seed).

**검증 항목**:
1. 콘솔에 `<a> cannot be a descendant of <a>` / `Hydration failed` 패턴 0건
2. DOM `aside#desktop-sidebar` 내부 `a > a` 0건
3. (yourTurn ≥1 시) Tab 순서: 메인 anchor `/checkouts` → 보조 anchor `?view=yourTurn`

**완료 시 처리**: tech-debt-tracker.md의 `sidebar-nav-action-e2e-manual-verify` 항목 ✅ 처리. evaluations 파일에 "iter 2 + manual e2e PASS" 추가 또는 별도 commit.

---

## SHOULD 후속 (트리거 시점에 처리)

### T2. resolveBadgeAndAction exhaustive kind check 🟢 LOW

**파일**: `apps/frontend/lib/navigation/nav-config.ts:298-318` (정확한 라인은 변경 가능)

**현재 코드 (요지)**:
```ts
if (cfg.kind === 'count-with-action') {
  return { badge: count, secondaryAction: { ... } };
}
return { badge: count }; // 'count' 케이스 implicit fall-through
```

**문제**: 미래에 `NavItemBadgeConfig` union에 세 번째 `kind` (예: `'count-with-action-and-modal'`)를 추가하면 TypeScript가 누락 분기를 잡지 못함. 현재 if-else 구조는 fall-through라 컴파일 PASS.

**수정 패턴**:
```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled kind: ${JSON.stringify(x)}`);
}
switch (cfg.kind) {
  case 'count': return { badge: count };
  case 'count-with-action':
    return { badge: count, secondaryAction: { ... } };
  default: return assertNever(cfg);
}
```

**트리거**: 세 번째 `kind` 추가 시점, 또는 다음 nav 도메인 확장 작업.

---

### T3. ariaKey 리터럴 유니언 좁히기 🟢 LOW

**파일**: `apps/frontend/lib/navigation/nav-config.ts:94-101`

**현재**: `FilteredNavSecondaryAction.{ariaKey, primaryAriaKey}: string` — 오타 시 next-intl 런타임 throw.

**수정**: i18n 키를 SSOT 리터럴 유니언으로 좁힘:
```ts
type NavSecondaryAriaKey = 'layout.checkoutYourTurnAria';  // ICU {count}
type NavPrimaryAriaKey = 'layout.checkoutOpenList';
export interface FilteredNavSecondaryAction {
  href: string;
  ariaKey: NavSecondaryAriaKey;
  primaryAriaKey: NavPrimaryAriaKey;
}
```

**트레이드오프**: 키 추가 시 타입도 갱신 필요 — i18n 키 폭주 시 부담. SSOT sprint와 묶어 처리 권장.

**트리거**: i18n 키 도메인 SSOT sprint 또는 nav 도메인 키 폭주 시.

---

### T4. `<li>` 시맨틱 재구성 🟢 LOW

**파일**: `apps/frontend/components/layout/{NavRowWithSecondaryAction.tsx, DashboardShell.tsx, MobileNav.tsx}`

**현재**: 행 컨테이너가 `<div>`. 부모도 `<ul>`이 아닌 `<div className="flex flex-col gap-1">`.

**제안**: 모든 nav item 묶음을 `<ul role="list">`로 변경하고 각 item을 `<li>`로 감쌈. SR이 "list with N items"를 추가 안내. Tailwind reset(`list-none`) 필요.

**스코프**: 사이드바 + MobileNav 전체. 약 30분 작업.

**트리거**: 사이드바 nav 시맨틱 강화 sprint 또는 a11y 회귀 발견 시.

---

## 컨텍스트 메모

- **본 세션 commit**: `7fe8b0d1` (16 files / +1461 / -138)
- **이전 commit**: `9e2ec057` (i18n parity hardening — frontend-patterns.md "Row with Secondary Action Pattern" 섹션이 본 세션 작업물이지만 i18n commit과 함께 들어갔음. 메모리 교훈 "병렬 세션 브랜치 드리프트")
- **다음 commit**: `d08846dc` (다른 세션 — checkouts cross-team rental auto-fill, 본 작업과 무관)
- **현재 ahead**: origin/main 대비 3 commits. push는 사용자 트리거 (메모리 "세션 정리 시 자동 커밋(push 별도)")

## 검증 게이트 통과 현황

| Gate | 상태 |
|---|---|
| tsc --noEmit | PASS (M1) |
| frontend production build | PASS (M2) |
| nested anchor 정적 검출 | 0 hits (M3) |
| Playwright e2e (사이드바) | **BLOCKED-ENV** — T1로 해소 |
| WCAG 2.4.3 Tab 순서 | **BLOCKED-ENV** — T1으로 해소 |
| design token SSOT | PASS (M6) |
| i18n ko/en parity | PASS (M7) |
| any 도입 | 0 (M8) |
| discriminated union 정착 | PASS (M9) |
| ESLint NESTED_LINK_RULE | PASS (S1) |
| verify-frontend-state Step 31 | PASS (S2) |
| frontend-patterns.md "Row with Secondary Action" | PASS (S3) |

## Skill / 도구 갱신

- `verify-frontend-state` Step 31 추가 (nested interactive 차단)
- `manage-skills` 분석 결과: 추가 스킬 갱신 불필요 (변경 패턴이 기존 verify-* 커버리지 안에 들어옴)

## 권장 시작 순서

1. **T1 e2e 수동 검증** (서버 기동 후 5분 — 가장 빠른 closure)
2. T2~T4는 별 sprint 트리거 시 처리 (즉시 필요 없음)

## 산출물 경로 (참조용)

- exec-plan (완료): `.claude/exec-plans/completed/2026-04-28-sidebar-nav-action-pattern.md`
- contract: `.claude/contracts/sidebar-nav-action-pattern.md`
- evaluation (iter 1 + iter 2): `.claude/evaluations/sidebar-nav-action-pattern.md`
- 핵심 컴포넌트: `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx`
- 회귀 spec: `apps/frontend/tests/e2e/features/layout/sidebar-nav-action.spec.ts`
- 디자인 토큰: `apps/frontend/lib/design-tokens/components/sidebar.ts` (`SIDEBAR_ROW_TOKENS`, `getSidebarRowPrimaryClasses/SecondaryClasses`)
- 데이터 모델: `apps/frontend/lib/navigation/nav-config.ts` (`NavItemBadgeConfig`, `FilteredNavSecondaryAction`, `resolveBadgeAndAction`)
- ESLint 룰: `apps/frontend/eslint.config.mjs` (`NESTED_LINK_RULE`, `NESTED_ANCHOR_RULE`)
