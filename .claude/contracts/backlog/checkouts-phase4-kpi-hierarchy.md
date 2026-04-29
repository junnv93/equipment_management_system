# Contract — 반출입 Phase 4 (P1-1 KPI 1-hero + 3-mini)

> Harness handoff format
> Plan: `.claude/exec-plans/active/2026-04-28-checkouts-phase4-kpi-hierarchy.md`
> 작성: 2026-04-28

---

## MUST 기준 (loop 차단 — 충족 시까지 Generator 재호출)

### M-1. 컴파일/빌드 (절대 조건)
- `cd apps/frontend && pnpm exec tsc --noEmit` → **0 errors**
- `pnpm --filter frontend build` → **0 errors** (warnings 허용 — 단, 신규 발생 0)
- `pnpm --filter @equipment-management/shared-constants build` → **0 errors**

### M-2. 도메인 SSOT — Hero 선택 로직 단일 위치
- `apps/frontend/lib/utils/checkout-hero-selector.ts` 단일 파일에 `selectHeroVariant` 정의
- 호스트 또는 다른 어떤 파일에서도 `summary.overdue > 0 ?` / `summary.pending > THRESHOLD ?` 같은 inline hero 분기 **0건**
- 검증: `grep -rnE 'summary\.overdue\s*>\s*0\s*\?' apps/frontend/{app,components,lib}` → **only matches in `selectHeroVariant` definition file**

### M-3. 도메인 SSOT — Hero 선택 단위 테스트
- `apps/frontend/lib/utils/checkout-hero-selector.test.ts` 존재
- 6+ 케이스 PASS:
  1. `{overdue: 0, pending: 0}` → `{heroVariantKey: null, reason: null}`
  2. `{overdue: 0, pending: 15}` → `{heroVariantKey: null, reason: null}` (Phase 4 boundary)
  3. `{overdue: 1, pending: 0}` → `{heroVariantKey: 'overdue', reason: 'overdue'}`
  4. `{overdue: 10, pending: 0}` → `{heroVariantKey: 'overdue', reason: 'overdue'}`
  5. `{overdue: 1, pending: 15}` → `{heroVariantKey: 'overdue', reason: 'overdue'}` (overdue 우선)
  6. negative test: Phase 5 pending hero 승격 시 본 테스트가 fail해야 함을 명시 주석

### M-4. 도메인 토큰화 — `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 적용
- `OutboundCheckoutsTab.tsx` 또는 `HeroKPISkeleton.tsx`에서 raw `col-span-2` / `col-span-3` 등 magic 0건
- 모두 `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 경유
- 검증: `grep -nE '\bcol-span-\d' apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx apps/frontend/components/checkouts/HeroKPISkeleton.tsx` → **0 hits**

### M-5. 도메인 토큰화 — KPI grid className SSOT
- `CHECKOUT_STATS_GRID_TOKENS` (신규) + `getStatsGridClass(hasHero)` 단일 export
- 호스트와 skeleton 모두 동일 토큰 import
- 검증: `grep -nE 'grid-cols-\d' apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx apps/frontend/components/checkouts/HeroKPISkeleton.tsx` → **0 hits**

### M-6. 도메인 a11y — Hero 카드 강조 시맨틱
- Hero 분기 wrapper에 다음 속성 모두 존재:
  - `role="button"`
  - `tabIndex={0}`
  - `aria-label={t(card.labelKey)}`
  - `aria-pressed={isActive}` (필터 활성 여부)
  - `onKeyDown` Enter/Space 처리
- Hero 강조 신호: alertRing(시각) + label "기한 초과"(텍스트) + aria-pressed(SR 토글 상태)
  ※ `aria-current`는 ARIA 표준에서 navigation 위치 식별 속성. 토글 강조 카드에 부착하면 일부 SR(VoiceOver)에서 이중 발화 — 시각 강조는 alertRing이 충분하므로 미사용
- alertRing 클래스가 색상 외에 위계 신호(ring weight)도 포함 — 색상 단독 의존 회피

### M-7. 도메인 토큰화 — alertRing 토큰 적용 (checkouts 도메인 한정)
- checkouts 도메인 내 HeroKPI atom 외부에서 raw `ring-1 ring-brand-critical/20` 직접 사용 0건
- 모두 `CHECKOUT_STATS_VARIANTS.hero.alertRing` 토큰 경유
- 검증: `grep -rnE 'ring-\d.*ring-brand-critical' 'apps/frontend/app/(dashboard)/checkouts/' apps/frontend/components/checkouts/` → **only matches in token definition file**
- 다른 도메인(dashboard PendingApprovalCard 등)의 raw ring 사용은 Phase 4 boundary 외 — tech-debt-tracker.md `dashboard-pending-approval-card-alert-ring-token` 항목으로 별도 추적

### M-8. 도메인 성능 — Referential Stability
- `useStatCards(summary)` useMemo 적용
- `selectHeroVariant(summary)` 결과 useMemo 적용
- `handleStatActivate` useCallback 적용

### M-9. i18n parity
- 신규 i18n 키 도입 시 ko + en 동시 추가 (Phase 4는 신규 키 0건 — 기존 `outbound.overdue` 등 재사용)
- 검증: `diff <(jq 'keys[]' apps/frontend/messages/ko/checkouts.json | sort) <(jq 'keys[]' apps/frontend/messages/en/checkouts.json | sort)` → 0 차이

### M-10. verify skill 통과
- `verify-implementation` PASS
- `verify-ssot` PASS (Step 41 신규 포함)
- `verify-hardcoding` PASS (Step 31 신규 포함)
- `verify-design-tokens` PASS (Step 45 신규 포함)
- `verify-frontend-state` PASS (Phase 3 Step 25 회귀 0)

---

## SHOULD 기준 (tech-debt 분류)

### S-1. HeroKPI atom React.memo 적용
- 결정: Phase 4 boundary 외 (atom 변경은 별도 PR)

### S-2. role 변경 시 hero 재계산 트리거
- 향후 role-based threshold 도입 시 deps에 role 추가

### S-3. trend prop 동적 derive
- 결정: Phase 4.6 별도 PR

### S-4. CheckoutSummary 확장 (kpi-meta)
- 결정: Phase 4.5 별도 PR

---

## 자가 매트릭스 — Wireframe 100% 일치 검증표

Generator는 다음 14행 매트릭스를 **각 Phase commit description에 포함**, 모든 행 PASS:

| # | 행 (와이어프레임 spec) | Breakpoint | Light/Dark | 측정 항목 | PASS 조건 |
|---|---|---|---|---|---|
| 1 | KPI strip grid (overdue=0) | sm | both | grid-template-columns | `repeat(3, 1fr)` |
| 2 | KPI strip grid (overdue=0) | lg | both | grid-template-columns | `repeat(5, 1fr)` |
| 3 | KPI strip grid (overdue>0) | sm | both | grid-template-columns | `repeat(6, 1fr)` |
| 4 | KPI strip grid (overdue>0) | lg | both | grid-template-columns | `repeat(6, 1fr)` |
| 5 | Hero card (overdue>0) | lg | both | col-span | 2 (`containerInGrid` 결과) |
| 6 | Hero card alert ring | lg | both | ring | `ring-1 ring-brand-critical/20` |
| 7 | Hero card a11y | any | any | aria-current | `"true"` |
| 8 | Hero card a11y | any | any | aria-pressed | `false` 기본, 클릭 시 `true` |
| 9 | Hero card 키보드 | any | any | Enter/Space | onClick과 동일 핸들러 |
| 10 | HeroKPI atom 호출 | any | any | label / value / variant | `t('outbound.overdue')` / `summary.overdue` / `'critical'` |
| 11 | HeroKPISkeleton (hasHero=true) | sm | any | grid | host와 동일 토큰 |
| 12 | HeroKPISkeleton (hasHero=false) | lg | any | grid | 5-col flat skeleton |
| 13 | Dark mode 자동 전환 | any | dark | bg/text/ring | brand-* 변수만 (dark prefix 0건) |
| 14 | reduced-motion | any | any | animate-pulse | skeleton에 `motion-reduce:animate-none` 보존 |

---

## Out-of-scope (Generator는 다음을 변경하지 말 것)

1. **HeroKPI atom signature** — 추가/변경 0
2. **SparklineMini** — 변경 0
3. **InboundCheckoutsTab** — 변경 0
4. **CheckoutsContent.tsx KPI 영역 외** — Header / Tabs / FilterBar / AlertBanner 변경 0
5. **CheckoutSummary 백엔드 타입 확장** — Phase 4.5 별도 PR
6. **W-2 / W-3 / W-5** — 별도 PR
7. **7건 외부 디자인 리뷰 핸드오프 debt** — 별도 PR
8. **pending hero 승격** — Phase 5
9. **role-default redirect** 변경 — 본 plan 무관
10. **CheckoutAlertBanners** — Phase 5

---

## 위반 시 Generator 재호출 사유

| 시나리오 | 재호출 사유 |
|---|---|
| `summary.overdue > 0 ?` inline 분기 잔존 | M-2 SSOT 위반 |
| raw `col-span-2` / `grid-cols-N` 잔존 | M-4 / M-5 토큰화 위반 |
| HeroKPI atom signature 변경 | Out-of-scope #1 위반 |
| 신규 i18n 키 ko만 추가 | M-9 parity 위반 |
| `aria-current` 누락 | M-6 a11y 위반 |
| `useStatCards` useMemo 누락 | M-8 성능 위반 |
| verify-* skill 1개 이상 FAIL | M-10 검증 게이트 위반 |
| 자가 매트릭스 14행 중 1행이라도 측정 누락 | 매트릭스 미충족 |

---

## Loop 종료 조건 (Evaluator 통과)

- M-1 ~ M-10 전부 PASS
- 자가 매트릭스 14행 전부 PASS
- 4개 commit (Phase 4.A / 4.B / 4.C / 4.D) 모두 main에 push 완료
- review-architecture 결과 Critical 0 / Warning ≤ 2
- Phase 5 진입을 위한 핸드오프 문서 작성
