# Sidebar Nav Action Pattern — Nested Anchor 제거 + 패턴 SSOT

## 메타

- 생성: 2026-04-28
- 모드: Mode 2 (Harness)
- 슬러그: `sidebar-nav-action-pattern`
- 예상 변경: 8~11개 파일 (디자인 토큰 1, nav-config 1, NavBadge 1, 신규 컴포넌트 1, DashboardShell 1, MobileNav 1, i18n ko/en 2, frontend-patterns 1, ESLint config 1, 스킬 1, e2e 1)

## 설계 철학

표면 버그(`<a>` 안 `<a>` hydration error)는 한 곳이지만 근본은 두 가지 시스템 결함이다.

1. **데이터 모델 모호성**: `nav-config.NavItemConfig`의 `badgeKey` 가 단일 string union이고, `badgeLinkHref`가 호출지(DashboardShell)에서 inline 계산되어 SidebarItem까지 흘러간다. optional prop의 존재 분기로 NavBadge가 `<Link>` 또는 `<span>`을 렌더 → silent break 패턴 (메모리 교훈: GuidanceCallout ctaKind 이중 분기). discriminated union으로 명시화 필요.
2. **컴포넌트 추상화 누락**: "행 링크 + 보조 액션" 패턴 SSOT 없음. SidebarItem이 직접 Link를 감싼다. 새 항목에 보조 액션을 추가할 때마다 같은 nested anchor 위반 재발 위험.

본 작업은 (a) 표면 수정, (b) 데이터 모델 강화, (c) 재사용 가능한 행 패턴 컴포넌트 추출, (d) ESLint+e2e로 회귀 차단을 한 사이클에 묶는다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 해결 패턴 | **형제 링크 + li 컨테이너** (Option 1) | yourTurn 필터 동선 보존 + 업계 표준(GitHub/Stripe/Linear) + 우클릭 새 탭 + SR 명료성 |
| 데이터 모델 | discriminated union (`badge: undefined \| { kind: 'count' } \| { kind: 'count-with-action'; actionHrefBuilder: (item) => string; actionLabelKey: string }`) | optional prop 분기 silent break 방지. 액션 hrefBuilder를 nav-config에 두어 SSOT |
| 시각 분리 | `<li>` 컨테이너 + 두 형제 `<a>` (CSS 오버레이 미사용) | hover 영역이 작은 사이드바에서 ::after 오버레이는 과한 복잡도. sibling 그대로 충분 |
| 새 컴포넌트 위치 | `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` | 사이드바 + 모바일 모두 재사용 가능, layout 도메인 |
| NavBadge 책임 축소 | 배지는 시각/srLabel만. linkHref prop 제거 | 단일 책임. caller가 link 의미 부여 |
| Tab 순서 | `<li>` 안에서 메인 anchor → 보조 anchor (DOM 순서 = Tab 순서) | WCAG 2.4.3 Focus Order 자연 |
| 디자인 토큰 | `SIDEBAR_ROW_TOKENS = { container, primary, secondary, hoverGroup }` 추가 | hover 시 두 링크가 같은 행임을 시각적으로 묶기. `group/group-hover` Tailwind 패턴 |
| i18n 키 분리 | `navigation.layout.checkoutOpenList` (메인 aria-label) + `navigation.layout.checkoutYourTurnAria` (보조 link aria-label) — 기존 `notificationCount`는 일반 배지용으로 유지 | 두 링크가 다른 의미를 가지므로 SR 안내 키 분리 |

## Phase 0 — 정찰 결과 요약

### 표면 버그
- **위치:** `apps/frontend/components/layout/NavBadge.tsx` 라인 40-50, `DashboardShell.tsx`의 SidebarItem (Link 안 NavBadge가 Link)
- **트리거:** `nav-config.ts`에서 `badgeKey: 'checkouts-your-turn'` + `checkoutYourTurnCount > 0` → DashboardShell이 `yourTurnHref` 계산 → SidebarItem → NavBadge가 `<Link>` 분기
- **에러:** `In HTML, <a> cannot be a descendant of <a>` (React 19 hydration mismatch console error, 운영 환경 sentry 노이즈)

### 동일 패턴 grep 결과
- `Link.*Link`/`<a.*<a` 정적 검색: 사이드바 1건만 검출 (다른 곳은 미발견)
- 다만 향후 같은 패턴 재발 위험 큼 (특히 형식 list/table row에 보조 액션을 빨리 끼워넣을 때)

### 모바일 정합성
- `MobileNav.NavLink`는 NavBadge를 사용하지 않고 자체 `<span>` 배지만 렌더 → **모바일은 위반 없음**. 단, 데이터 모델이 변경되면 NavLink도 정합화 필요 (현재는 단순 count 표시이므로 해당 액션 동선 자체가 모바일에는 미제공 — UX 결정 사항으로 기록).

### 디자인 토큰 갭
- `SIDEBAR_ITEM_TOKENS`은 단일 행 가정. 보조 영역 토큰 부재. 보조 anchor의 hit-target 크기/포커스 링/hover 색상 모두 inline 정의되어 있음(NavBadge.tsx).

---

## Phase 1 — 디자인 토큰 + 데이터 모델 SSOT 정립

**목표:** 행 패턴의 시각/구조 SSOT를 디자인 토큰에 정착시키고, nav-config 데이터 모델을 discriminated union으로 강화한다.

**변경 파일:**
1. `apps/frontend/lib/design-tokens/components/sidebar.ts` — **수정**
   - `SIDEBAR_ROW_TOKENS` 신규: `{ container, primary, secondary, hoverGroup, secondaryHitArea }`
   - `getSidebarItemClasses`는 유지하되 신규 `getSidebarRowPrimaryClasses(isActive, isCollapsed)`/`getSidebarRowSecondaryClasses()` 분리
   - secondary anchor의 hit area는 최소 24×24(데스크톱 콤팩트) ~ 36×36(모바일에서는 NavRow 미적용 — 모바일 가드 필수)
2. `apps/frontend/lib/navigation/nav-config.ts` — **수정**
   - `NavItemConfig.badgeKey` 제거 → `badge?: NavItemBadgeConfig` (discriminated union)
   - `NavItemBadgeConfig` 신규 타입:
     ```ts
     | { kind: 'count'; sourceKey: 'approvals' | 'checkouts-your-turn' }
     | { kind: 'count-with-action'; sourceKey: 'checkouts-your-turn'; actionHrefBuilder: (baseHref: string) => string; actionAriaKey: 'layout.checkoutYourTurnAria' }
     ```
   - `getFilteredNavSections`가 union을 그대로 down-pass → FilteredNavItem에 `secondaryAction?: { href: string; ariaKey: string }` 정규화 필드 추가
   - SSOT 의도: `actionHrefBuilder`는 `${base}?${VIEW}=${YOUR_TURN}` 으로 구성하되 `CHECKOUT_QUERY_PARAMS`(이미 SSOT)에서 가져온다

**검증:**
```bash
pnpm tsc --noEmit
grep -rn "badgeLinkHref\|isCheckoutItem" apps/frontend/components/layout/
# → DashboardShell.tsx의 inline 계산 코드(라인 304-311)가 사라졌는지
```

---

## Phase 2 — NavRowWithSecondaryAction 컴포넌트 신설 + SidebarItem 재구성

**목표:** "행 링크 + 보조 액션" 패턴을 단일 컴포넌트로 추상화한다.

**변경 파일:**
1. `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` — **신규**
   - 시그니처:
     ```ts
     interface Props {
       icon: LucideIcon;
       href: string;        // primary
       label: string;
       isActive?: boolean;
       isCollapsed?: boolean;
       primaryAriaLabel?: string;
       badge?: { count: number; srLabel: string };
       secondaryAction?: { href: string; ariaLabel: string }; // 있으면 sibling anchor 렌더
     }
     ```
   - 구조: collapsed 시 단일 anchor (보조 액션 미렌더 — 시각 공간 부족 + 모바일과 같은 가드). expanded + secondaryAction 있을 때만 li 컨테이너 + 형제 anchor 2개. expanded + secondaryAction 없을 때는 단일 anchor + span 배지.
   - memo 래핑 (현재 SidebarItem과 동일 성능 보장)
2. `apps/frontend/components/layout/DashboardShell.tsx` — **수정**
   - SidebarItem memo 컴포넌트 제거 → 신규 NavRowWithSecondaryAction 사용
   - 기존 inline `isCheckoutItem`/`yourTurnHref` 계산 코드(라인 304-311) 제거 — nav-config에서 이미 정규화됨
   - section.items.map 안에서 `secondaryAction={item.secondaryAction}` 그대로 전달

**검증:**
```bash
pnpm tsc --noEmit
pnpm --filter frontend run build
# 사이드바 nested anchor 0건 grep
grep -rn "<Link" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | head
```

---

## Phase 3 — NavBadge 책임 축소 + MobileNav 정합

**목표:** NavBadge는 배지 시각/SR 라벨만 담당하도록 단일 책임화. 링크 의미는 caller에 위임.

**변경 파일:**
1. `apps/frontend/components/layout/NavBadge.tsx` — **수정**
   - `badgeLinkHref` prop **삭제**
   - 항상 `<span>` 렌더 (시각 + aria-label만)
   - JSDoc: "링크가 필요하면 caller가 sibling anchor를 직접 배치하라" 명시
2. `apps/frontend/components/layout/MobileNav.tsx` — **수정**
   - 기존 inline span 배지 → NavBadge로 교체 (재사용 SSOT 강화). secondaryAction은 모바일에서는 미적용 (UX 결정).
   - 단, 향후 모바일에서 yourTurn 진입을 원하면 별도 long-press 메뉴 또는 별 라우트로 처리 (본 작업 out-of-scope)

**검증:**
```bash
grep -n "badgeLinkHref\|onClick.*stopPropagation" apps/frontend/components/layout/
# → 0 hit (분기/이벤트 흡수 코드 모두 제거)
```

---

## Phase 4 — 회귀 방지 (ESLint + e2e)

**목표:** 같은 위반이 코드베이스에 다시 들어오지 못하게 정적/동적 양쪽에서 차단한다.

**변경 파일:**
1. `apps/frontend/eslint.config.mjs` (또는 `.eslintrc`) — **수정**
   - `eslint-plugin-jsx-a11y` 의 `no-nested-interactive` (또는 동등 custom rule) 활성화. `next/link`의 Link 컴포넌트도 anchor로 인식되도록 polymorphic component config 추가.
   - 만약 jsx-a11y가 next/link Link를 인식하지 못하면, custom AST rule (`scripts/eslint-rules/no-link-in-link.cjs`) 작성하여 `JSXElement[name=Link] JSXElement[name=Link]` 패턴 검출.
2. `apps/frontend/tests/e2e/features/layout/sidebar-nav-action.spec.ts` — **신규**
   - `/checkouts` 진입 → 사이드바 hover/focus → `page.evaluate(() => [...document.querySelectorAll('a a')].length)` === 0
   - 콘솔 메시지 listener 등록 → hydration error 0건 검증
   - keyboard Tab 순서 검증: 메인 anchor → 보조 anchor 순서로 focus 이동 (axe-core 또는 직접 `document.activeElement` 비교)
3. `.husky/pre-push` — **수정 (선택, S2 후속)**
   - `pnpm --filter frontend run lint` 가 이미 실행되면 자동 커버 (별도 명령 불필요)

**검증:**
```bash
pnpm --filter frontend run lint
pnpm --filter frontend run test:e2e -- tests/e2e/features/layout/sidebar-nav-action.spec.ts
```

---

## Phase 5 — i18n 키 분리 + 패턴 문서화 + 스킬 갱신

**목표:** SR 라벨 SSOT 분리 + 향후 같은 패턴 작업 시 참조할 문서/스킬 정비.

**변경 파일:**
1. `apps/frontend/messages/ko/navigation.json` — **수정**
   - `layout.checkoutOpenList`: "반출입 관리 전체 목록" 추가 (메인 anchor aria)
   - `layout.checkoutYourTurnAria`: 기존 키 유지 (보조 anchor aria — ICU `{count}건`)
2. `apps/frontend/messages/en/navigation.json` — **수정 (parity)**
3. `docs/references/frontend-patterns.md` — **수정**
   - 신규 섹션: "### Row with Secondary Action Pattern"
     - sibling anchor in li 패턴 설명
     - `<a>` in `<a>` 안티패턴 명시
     - NavRowWithSecondaryAction 사용법
     - WCAG 2.4.3/4.1.2 인용
4. `.claude/skills/verify-frontend-state/SKILL.md` 또는 신규 `verify-nav-patterns/SKILL.md` — **수정 또는 신규**
   - Step 추가: "interactive nesting 검사 — `<Link>` 안 `<Link>`/`<button>` 0 hit"
   - grep 명령 + 예외 정책 명시

**검증:**
```bash
node scripts/check-i18n-call-sites.mjs --all  # i18n parity hardening 동시 통과
grep -nE "^### Row with Secondary Action" docs/references/frontend-patterns.md
```

---

## 출구 조건

- contract MUST 전체 PASS (M1~M9)
- 동일 MUST 2회 연속 FAIL → 수동 개입 요청
- SHOULD 실패는 차단 없음, tech-debt-tracker 등록

## 위험 / 차단 요인

- **Polymorphic Link 인식**: jsx-a11y가 next/link `Link`를 anchor로 자동 인식하지 못할 수 있음 → custom AST rule fallback 필요. Phase 4에서 실측 후 결정.
- **모바일 동선 대칭 손실**: 모바일에서는 yourTurn 보조 동선 미제공이 결정사항. UX 팀 합의 또는 후속 PR로 long-press 메뉴 검토.
- **Hover 영역 협조**: sibling anchor가 보조 영역 hover 시 메인 행 전체 hover 효과는 group/group-hover로 처리 — Tailwind JIT가 named group 분리 잘 처리하나 prefers-reduced-motion 지원 점검 필요.

## 변경 대상 외 (out of scope)

- 데스크톱 collapsed 모드의 보조 동선 (시각 공간 부족 — 단일 anchor만)
- 모바일 보조 동선 (별 PR)
- NavBadge의 critical variant 재설계 (현재 사용처 없음)
- jsx-a11y 외 rule 도입 (eslint-plugin-react-hooks 등은 별도 작업)
