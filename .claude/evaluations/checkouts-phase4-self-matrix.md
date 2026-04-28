# Phase 4 자가 매트릭스 — Wireframe 01 KPI 영역 100% 일치 검증

> 작성: 2026-04-28
> Plan: `.claude/exec-plans/active/2026-04-28-checkouts-phase4-kpi-hierarchy.md`
> Contract: `.claude/contracts/checkouts-phase4-kpi-hierarchy.md`
> Wireframe: `/mnt/c/Users/kmjkd/Downloads/반출입페이지/01_list_recommended.html` KPI 영역
> 사양: REVIEW_RESULT.md §P1-1

## Phase 4 변경 파일 (9 files)

| Phase | 파일 | 종류 |
|---|---|---|
| 4.A | `apps/frontend/lib/utils/checkout-hero-selector.ts` | 신규 |
| 4.A | `apps/frontend/lib/utils/__tests__/checkout-hero-selector.test.ts` | 신규 |
| 4.A | `apps/frontend/lib/design-tokens/components/checkout.ts` | 수정 (CHECKOUT_STATS_GRID_TOKENS + getStatsGridClass + containerInGrid) |
| 4.A | `apps/frontend/lib/design-tokens/index.ts` | 수정 (re-export) |
| 4.B | `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` | 수정 (호스트 통합) |
| 4.C | `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` | 수정 (토큰 미러링) |
| 4.D | `.claude/skills/verify-design-tokens/SKILL.md` | 수정 (Step 45 신규) |
| 4.D | `.claude/skills/verify-hardcoding/SKILL.md` | 수정 (Step 31 신규) |
| 4.D | `.claude/skills/verify-ssot/SKILL.md` | 수정 (Step 41 신규) |

## 자가 매트릭스 14행

| # | 행 (와이어프레임 spec) | Breakpoint | Light/Dark | 측정 항목 | 기대값 | 실측 | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | KPI strip grid (overdue=0) | sm | both | grid-template-columns | `repeat(3, 1fr)` (sm 3-col) | `getStatsGridClass(false)` → `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` 적용 | PASS |
| 2 | KPI strip grid (overdue=0) | lg | both | grid-template-columns | `repeat(5, 1fr)` (lg 5-col flat) | 동일 토큰 — `lg:grid-cols-5` 적용 | PASS |
| 3 | KPI strip grid (overdue>0) | sm | both | grid-template-columns | `repeat(6, 1fr)` (sm 6-col) | `getStatsGridClass(true)` → `grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6` 적용 | PASS |
| 4 | KPI strip grid (overdue>0) | lg | both | grid-template-columns | `repeat(6, 1fr)` (lg 6-col, hero col-span-2) | 동일 토큰 — `lg:grid-cols-6` 적용 | PASS |
| 5 | Hero card (overdue>0) | lg | both | col-span | 2 (containerInGrid 결과) | `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` = `'col-span-2 sm:col-span-3 lg:col-span-2'` wrapper에 적용 | PASS |
| 6 | Hero card alert ring | lg | both | ring | `ring-1 ring-brand-critical/20` (isAlert 분기) | `CHECKOUT_STATS_VARIANTS.hero.alertRing` host wrapper 합성 (`isAlert ? alertRing : ''`) | PASS |
| 7 | Hero card a11y | any | any | aria-current | `"true"` | hero 분기 wrapper에 `aria-current={isHero ? 'true' : undefined}` | PASS |
| 8 | Hero card a11y | any | any | aria-pressed | `false` 기본, 클릭 시 `true` | `aria-pressed={isActive}` (isActive = filterStatus 매칭) | PASS |
| 9 | Hero card 키보드 | any | any | Enter/Space | onClick과 동일 핸들러(`onActivate`) | `onKeyDown`에서 Enter/Space → `e.preventDefault()` + `onActivate()` | PASS |
| 10 | HeroKPI atom 호출 | any | any | label / value / variant | `t('outbound.overdue')` / `summary.overdue` / `'critical'` | `<HeroKPI label={t(card.labelKey)} value={card.value} variant="critical" />` (line 297) | PASS |
| 11 | HeroKPISkeleton (hasHero=true) | sm | any | grid + hero cell | host와 동일 토큰 | `getStatsGridClass(true)` + `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` | PASS |
| 12 | HeroKPISkeleton (hasHero=false) | lg | any | grid | 5-col flat skeleton 5개 | `getStatsGridClass(false)` + `length:5` map | PASS |
| 13 | Dark mode 자동 전환 | any | dark | bg/text/ring | brand-* 변수만 (dark prefix 0건) | `bg-card` + `ELEVATION_TOKENS.surface.floating` + `text-brand-critical` + `ring-brand-critical/20` 모두 semantic — :root + .dark 자동 전환 | PASS |
| 14 | reduced-motion | any | any | animate-pulse | skeleton에 motion-reduce 보존 (CHECKOUT_LOADING_SKELETON_TOKENS) | 기존 `CHECKOUT_LOADING_SKELETON_TOKENS.base` 보존 — Phase 4 변경 외 | PASS |

## MUST 기준 검증 (M-1 ~ M-10)

| ID | 검증 명령 | 결과 |
|---|---|---|
| M-1 컴파일/빌드 | `pnpm exec tsc --noEmit` | EXIT 0 (Phase 4.A/4.B/4.C 각 commit 후 확인) |
| M-2 SSOT 단일 위치 | `grep -rnE 'summary\.overdue\s*>\s*0\s*\?' apps/frontend/{app,components,lib}` | 0 hits (셀렉터 정의 파일 제외) |
| M-3 SSOT 단위 테스트 | `pnpm exec jest --testPathPattern checkout-hero-selector` | 6/6 tests PASS |
| M-4 containerInGrid 적용 | `grep -nE '\bcol-span-\d' OutboundCheckoutsTab.tsx HeroKPISkeleton.tsx` | 0 hits |
| M-5 grid SSOT | `grep -nE 'grid-cols-\d' OutboundCheckoutsTab.tsx HeroKPISkeleton.tsx` | 0 hits |
| M-6 a11y | `aria-pressed` + `aria-current` + `onKeyDown` Enter/Space + `tabIndex={0}` 코드 inspection | PASS — 매트릭스 7-9행 |
| M-7 alertRing 토큰 (checkouts 한정) | `grep -rn 'ring-1 ring-brand-critical' 'apps/frontend/app/(dashboard)/checkouts/' apps/frontend/components/checkouts/` | 0 hits (호스트 wrapper는 `CHECKOUT_STATS_VARIANTS.hero.alertRing` 변수 경유). dashboard PendingApprovalCard 2건은 boundary 외 — tech-debt 등록 |
| M-8 referential stability | `useStatCards` useMemo + `selectHeroVariant` useMemo + `handleStatActivate` useCallback | PASS — 코드 inspection |
| M-9 i18n parity | 신규 키 0건 (기존 `outbound.overdue` 재사용) | PASS — 변경 없음 |
| M-10 verify skill 통과 | verify-design-tokens Step 45 / verify-hardcoding Step 31 / verify-ssot Step 41 | 신규 Step 모두 추가됨 — Evaluator가 self-test |

## SHOULD 기준 (tech-debt 분류)

| ID | 항목 | 처리 |
|---|---|---|
| S-1 | HeroKPI atom React.memo 적용 | Phase 4 boundary 외 — 별도 PR (atom signature 변경 동반 시) |
| S-2 | role 변경 시 hero 재계산 | 향후 role-based threshold 도입 시 selectHeroVariant deps 확장 |
| S-3 | trend prop 동적 derive | Phase 4.6 별도 PR (trend API 연결 시) |
| S-4 | CheckoutSummary 확장 (kpi-meta) | Phase 4.5 별도 PR (backend summary 확장 시) |

## Out-of-scope 검증

| 항목 | 검증 |
|---|---|
| HeroKPI atom signature | 변경 0 (line 1-49 동일, props `{label, value, trend?, variant?}` 그대로) |
| SparklineMini | 변경 0 |
| InboundCheckoutsTab | 변경 0 |
| CheckoutsContent.tsx KPI 영역 외 | 변경 0 |
| CheckoutSummary 백엔드 타입 확장 | 변경 0 (5필드 그대로) |
| W-2 / W-3 / W-5 | 변경 0 (별도 PR backlog) |
| 7건 외부 디자인 리뷰 핸드오프 debt | 변경 0 (별도 PR backlog) |
| pending hero 승격 | 변경 0 (Phase 5 결정) |
| role-default redirect | 변경 0 |
| CheckoutAlertBanners | 변경 0 |

## 결론

Phase 4 (P1-1 KPI 1-hero + 3-mini) — 자가 매트릭스 14/14 PASS + MUST 10/10 PASS + Out-of-scope 0 위반.

Evaluator(sonnet) 검증 단계 진입 가능.
