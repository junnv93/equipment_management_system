# 반출입 도메인 Phase 4 — P1-1 KPI 1-hero + 3-mini 위계 재구조화

> 작성: 2026-04-28
> 모드: Mode 2 Harness Planner (Constrain deliverables, not implementation)
> 선행: Phase 3 (P0-3 inline action soft-tint) 완료 — `cde5ffc3`
> 후속 후보: Phase 5 (P1-2 알림 단일 노출), Phase 6 (P1-3 필터 chip 분리)

---

## 0. 목표 + 배경

**P1-1 사양** (`REVIEW_RESULT.md` line 107-109 + `01_list_recommended.html` KPI 영역):
> 헤더 영역의 4-card 그리드(대기/반출 중/반입/기한초과)가 모두 같은 시각 무게. 이 도메인의 단일 가장 중요한 숫자는 "기한 초과" — 즉시 매출/감사 risk와 직결. **hero card 1 + mini card 3** 구조로 위계 부여.

**현재 시스템 상태** — 이미 부분 진행:
- HeroKPI atom 4종(`HeroKPI`, `HeroKPIError`, `HeroKPISkeleton`, `SparklineMini`) 존재
- `CHECKOUT_STATS_VARIANTS.hero` 토큰 (container/surface/kpi/label/alertRing 등) Phase 0 정의 완료
- OutboundCheckoutsTab line 226에 `heroVariantKey = summary.overdue > 0 ? 'overdue' : null` inline 분기 + HeroKPI 호출 (line 271)

**미해결 4-axis 정합성 갭**:
1. **SSOT** — `heroVariantKey` 분기가 컴포넌트 inline (재사용·테스트·확장 불가). Wireframe 명세 우선순위(overdue → pending alert → null)가 단일 소스에 없음.
2. **하드코딩 0** — grid `grid-cols-4 sm:grid-cols-6 lg:grid-cols-6` / `col-span-2` raw className. `CHECKOUT_STATS_VARIANTS.hero.container` 토큰은 정의되어 있으나 **미사용**.
3. **워크플로/성능** — `heroVariantKey` 매 렌더 새 변수 (referential stability 결여), `useStatCards()` useMemo 미적용.
4. **접근성** — hero 카드 alert ring (`CHECKOUT_STATS_VARIANTS.hero.alertRing = 'ring-1 ring-brand-critical/20'`) 미적용 → 색상 단독 의존. `aria-pressed` vs `aria-current` 시맨틱 모호.
5. **i18n parity** — wireframe hero 강조 메시지가 ko/en 모두 미존재이나, **데이터 미공급으로 Phase 4 boundary 외**. 기존 `outbound.overdue` 키로 충분.

---

## 1. 현재 상태 매핑 (1차 탐색 결과)

### 1.1 호스트 컴포넌트 (KPI 영역)

| 파일:line | 현재 책임 | 변경 필요 |
|---|---|---|
| `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx:560` | `<HeroKPIError onRetry={...} />` (summary 쿼리 에러 시) | 그대로 유지 |
| `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:67-114` | `useStatCards(summary)` 5-card 정의 | useMemo로 referential stability 부여 |
| `OutboundCheckoutsTab.tsx:226` | `heroVariantKey = summary.overdue > 0 ? 'overdue' : null` inline | SSOT 헬퍼로 분리 |
| `OutboundCheckoutsTab.tsx:236` | `grid gap-3 ${heroVariantKey ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}` raw className | 그리드 토큰화 |
| `OutboundCheckoutsTab.tsx:254-273` | hero 분기에서 `<div className="col-span-2" role="button" aria-pressed={isActive}>` + `<HeroKPI label value variant="critical" trend="up" />` | `CHECKOUT_STATS_VARIANTS.hero.container` 토큰 사용 + alertRing 적용 + `aria-current` 시맨틱 보강 + trend 정적값 제거 |
| `OutboundCheckoutsTab.tsx:241-245` | `isAlert` 계산 inline (overdue>0 OR pending>threshold) | 그대로 유지 |
| `OutboundCheckoutsTab.tsx:289-353` | non-hero secondary 카드 render (Card + CardHeader + CardContent + SparklineMini placeholder) | 그대로 유지 |

### 1.2 선재 atom (PR-7)

| 파일 | signature | Phase 4 변경 필요? |
|---|---|---|
| `HeroKPI.tsx` | `{label, value, trend?, variant?}` | **변경 없음** — alertRing은 host wrapper에 |
| `HeroKPIError.tsx` | `{onRetry?}` | 변경 없음 |
| `HeroKPISkeleton.tsx` | `{hasHero?: boolean}` | grid 토큰화 미러링 (host와 동일 토큰 import) |
| `SparklineMini.tsx` | `{values, trend?, variant, width?, height?}` | 변경 없음 (Phase 4 boundary 외) |

### 1.3 영향 범위 — 다른 페이지

- `getCheckoutStatsClasses` / `CHECKOUT_STATS_VARIANTS` import 처: **OutboundCheckoutsTab만** (다른 곳 영향 없음)
- InboundCheckoutsTab: KPI 카드 영역 없음 (3-section 구조만) → Phase 4 영향 없음
- Dashboard / role-default 페이지: **별도 토큰** (`DASHBOARD_STATS_VARIANTS`) 사용 → 영향 없음

→ Phase 4 변경의 **breaking surface는 OutboundCheckoutsTab + HeroKPISkeleton 2곳에 한정**.

### 1.4 백엔드 데이터 가용성

- `CheckoutSummary` 타입: `total / pending / approved / overdue / returnedToday` 5필드만
- Wireframe의 `"평균 지연 2.3일 · 최장 D+8"` 같은 sub-meta는 **현재 미제공** → Phase 4 boundary 외 (Phase 4.5 별도 backend PR)
- Wireframe의 `"전일 ±0"` 같은 trend delta는 **현재 미제공** → trend prop은 정적 'flat' 또는 undefined

---

## 2. 변경 범위 — Phase 4 boundary

### 2.A 포함 (Phase 4)

1. **hero 선택 SSOT 헬퍼** 신설 — overdue > 0 우선순위, 향후 pending alert 우선순위 확장 가능 구조
2. **그리드 토큰화** — hero on/off 두 모드 grid className을 `CHECKOUT_STATS_GRID_TOKENS`로 흡수
3. **HeroKPI atom 호출 정합화** — `col-span-2` raw → 토큰, alert ring 적용, `aria-current` 시맨틱 강화
4. **performance** — `useStatCards`/`heroVariantKey` useMemo + 부모 useCallback referential stability
5. **HeroKPISkeleton 토큰 미러링** — host와 동일한 grid 토큰 공유 (regression 방지)
6. **verify-design-tokens / verify-hardcoding / verify-ssot skill 신규 Step** — 회귀 차단 게이트
7. **자가 매트릭스** — wireframe 01 KPI 영역 100% 일치 매트릭스 (sm/md/lg/dark/alert ring/aria 14+ 행)

### 2.B 제외 (Phase 4 외 — 별도 PR)

| 항목 | 이유 | 권장 PR |
|---|---|---|
| Hero kpi-meta 텍스트 ("평균 지연 2.3일 · 최장 D+8") | backend `CheckoutSummary`에 없음, 신규 derive logic 필요 | Phase 4.5 (backend summary 확장 + UI 표시) |
| Sparkline 실제 데이터 연결 (현재 placeholder `[]`) | trend timeseries API 미존재 | Phase 4.6 (trend API + sparkline 연결) |
| W-2 / W-3 / W-5 (Phase 3 architectural debt) | 본 plan 무관 | 별도 PR |
| 7건 architectural debt (Layer 3 stepper 토큰 등) | 본 plan 무관 | 별도 PR |
| SparklineMini variant 변경 | Phase 4 atom signature 변경 없음 | Phase 4.6 후속 |
| Pending alert를 hero로 승격 (overdue == 0 && pending > threshold 시) | 와이어프레임은 overdue 단일 hero 명시 | Phase 5 (P1-2 알림 단일 노출)와 함께 결정 |

---

## 3. 별도 PR (Phase 4 외)

### 3.A Phase 3 review-architecture 잔여 (3건)
- W-2: NextStepPanel 자체 React.memo 미적용
- W-3: overflow DropdownMenu trigger aria-label "다음 단계" 오해 가능 → `checkouts.fsm.overflow.label` 신설
- W-5: `cn()` 미-twMerge → `tailwind-merge` 도입 또는 명시 문서화

### 3.B 외부 디자인 리뷰 핸드오프 잔여 (7건)
1. Layer 3 stepper 토큰 승격
2. `box-shadow 0.18 alpha` 매직넘버 토큰화
3. `max-w-[12ch]` arbitrary unit → `DIMENSION_TOKENS.stepLabelMaxCh`
4. connector 좌표 `right-[calc(-50%+18px)]` 음수값 회귀 검증
5. `useFormatter` preset 호이스팅
6. `deriveProgressStepState` 단위 테스트 12 케이스
7. deprecated 잔존 호출처 2건 마이그레이션

### 3.C Phase 4.5 / 4.6 (P1-1 후속)
- Phase 4.5: `CheckoutSummary` 백엔드 확장 (avgDelayDays, maxOverdueDays) + hero kpi-meta 표시
- Phase 4.6: Sparkline trend API + 실제 데이터 연결

---

## 4. Phase별 작업 단위 (예상 4 commit)

### Phase 4.A — Hero 선택 SSOT 헬퍼 + 그리드 토큰

**목표**: hero 분기 로직과 그리드 className을 모두 SSOT로 끌어내고, 호스트는 헬퍼만 호출.

**변경 파일** (4 files):

1. `apps/frontend/lib/utils/checkout-hero-selector.ts` (**신규**)
   - **책임**: `summary` → `{ heroVariantKey: CheckoutStatsVariant | null; reason: 'overdue' | null }` 결정
   - **제약**:
     - 입력 타입: `Pick<CheckoutSummary, 'overdue' | 'pending'>` 부분 타입 (확장 가능)
     - Phase 4: `overdue > 0 → 'overdue'`, else `null` (wireframe 명세 충실)
     - 향후 priority 확장 가능한 배열 구조
     - **순수 함수** (시간/랜덤/외부 의존 없음)

2. `apps/frontend/lib/utils/checkout-hero-selector.test.ts` (**신규**)
   - 6+ 케이스 (overdue 0/1/10 × pending 0/15 매트릭스)

3. `apps/frontend/lib/design-tokens/components/checkout.ts` (**수정**)
   - `CHECKOUT_STATS_GRID_TOKENS` const 신설:
     - `withHero`: `'grid gap-3 grid-cols-4 sm:grid-cols-6 lg:grid-cols-6'`
     - `flat`: `'grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'`
     - `getStatsGridClass(hasHero: boolean): string`
   - 신규 `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 추가: `'col-span-2 sm:col-span-3 lg:col-span-2'`

4. `apps/frontend/lib/design-tokens/index.ts` (**수정**)
   - 신규 토큰 re-export

**검증**:
- `pnpm exec tsc --noEmit` → 0 errors
- `pnpm test lib/utils/checkout-hero-selector.test.ts` → 6+ tests PASS

---

### Phase 4.B — OutboundCheckoutsTab 호스트 통합

**목표**: Phase 4.A 헬퍼/토큰을 호스트에서 사용. inline 분기 제거, raw className 0건.

**변경 파일** (1 file):

1. `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` (**수정**)
   - line 226 inline 분기 → `selectHeroVariant(summary)` 호출 + useMemo
   - `useStatCards(summary)` → useMemo
   - line 236 grid className → `getStatsGridClass(!!heroVariantKey)`
   - line 258 `col-span-2` → `CHECKOUT_STATS_VARIANTS.hero.containerInGrid`
   - `aria-current={isHero ? 'true' : undefined}` 추가
   - HeroKPI alertRing wrapper 적용 (atom signature 변경 없이)
   - `trend="up"` 하드코딩 → `trend={undefined}` (Phase 4.6 전까지)
   - `handleStatActivate` `useCallback` 적용

**제약**:
- raw className `col-span-N`, `grid-cols-N`, `ring-*` 모두 0건
- HeroKPI atom signature 변경 0건

**검증**:
- `pnpm exec tsc --noEmit` → 0 errors
- `grep -nE 'col-span-|grid-cols-|ring-1 ring-brand-critical' OutboundCheckoutsTab.tsx` → 0 hits

---

### Phase 4.C — HeroKPISkeleton 토큰 미러링

**목표**: Skeleton이 host와 동일 grid 토큰 공유 → host 변경 시 skeleton 자동 따라감.

**변경 파일** (1 file):

1. `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` (**수정**)
   - hasHero=true/false 두 분기 모두 `CHECKOUT_STATS_GRID_TOKENS` + `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 사용
   - raw `grid-cols-4 sm:grid-cols-6 lg:grid-cols-6` / `col-span-2` 0건

**검증**:
- `grep -nE 'col-span-|grid-cols-' HeroKPISkeleton.tsx` → 0 hits

---

### Phase 4.D — verify-* skill 보강 + 자가 매트릭스

**목표**: Phase 4 패턴 회귀 차단 검증 게이트 추가.

**변경 파일** (3 files):

1. `.claude/skills/verify-design-tokens/SKILL.md` (**Step 45 신규**)
   - KPI grid + hero container 토큰 적용 검증
   - `CHECKOUT_STATS_VARIANTS.hero.alertRing` 정의 후 미사용 (dead token) 차단

2. `.claude/skills/verify-hardcoding/SKILL.md` (**Step 31 신규**)
   - `apps/frontend/app/(dashboard)/checkouts/**` raw `grid-cols-N` / `col-span-N` 차단

3. `.claude/skills/verify-ssot/SKILL.md` (**Step 41 신규**)
   - `summary.overdue > 0 ?` 같은 inline hero 분기 패턴 차단 (allowlist: `selectHeroVariant` 정의 자체)

---

## 5. 변경 파일 종합 목록 (9 files)

| Phase | 파일 | Action |
|---|---|---|
| 4.A | `apps/frontend/lib/utils/checkout-hero-selector.ts` | 신규 |
| 4.A | `apps/frontend/lib/utils/checkout-hero-selector.test.ts` | 신규 |
| 4.A | `apps/frontend/lib/design-tokens/components/checkout.ts` | 수정 |
| 4.A | `apps/frontend/lib/design-tokens/index.ts` | 수정 |
| 4.B | `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` | 수정 |
| 4.C | `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` | 수정 |
| 4.D | `.claude/skills/verify-design-tokens/SKILL.md` | 수정 |
| 4.D | `.claude/skills/verify-hardcoding/SKILL.md` | 수정 |
| 4.D | `.claude/skills/verify-ssot/SKILL.md` | 수정 |

---

## 6. 데이터 플로우

```
CheckoutSummary (server)
  ↓
CheckoutsContent (live query)
  ↓
OutboundCheckoutsTab (props)
  ↓
useStatCards(summary) [memo'd]    ← 5-card data
  ↓
selectHeroVariant(summary) [SSOT, pure] ← { heroVariantKey, reason }
  ↓
getStatsGridClass(!!heroVariantKey) [token]
  ↓
renderStats() = grid + statCards.map(card => isHero ? <HeroKPI wrapper> : <Card>)
  ↓
HeroKPI atom (alertRing wrapper from CHECKOUT_STATS_VARIANTS.hero.alertRing)
```

---

## 7. 검증 명령 시퀀스

```bash
# Phase 4.A 완료 후
cd apps/frontend && pnpm exec tsc --noEmit; echo "EXIT: $?"
pnpm test lib/utils/checkout-hero-selector.test.ts

# Phase 4.B 완료 후
cd apps/frontend && pnpm exec tsc --noEmit
grep -nE 'col-span-|grid-cols-|ring-1 ring-brand-critical' \
  app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx
# 기대: 0 hits

# Phase 4.C 완료 후
grep -nE 'col-span-|grid-cols-' components/checkouts/HeroKPISkeleton.tsx
# 기대: 0 hits

# 최종
cd apps/frontend && pnpm exec tsc --noEmit
pnpm --filter @equipment-management/shared-constants build
pnpm --filter frontend build
```

---

## 8. 위험 요소 + 트레이드오프

### 8.1 HeroKPI atom signature 보존 vs prop 추가
**선택**: signature 변경 없이 host wrapper에 alertRing 적용.
**이유**: PR-7 atom 호출처가 향후 다른 페이지에서 재사용될 수 있음. alertRing은 host의 시각 강조 정책이므로 atom 외부에 두는 것이 SoC 측면 더 정합.

### 8.2 grid 토큰을 별도 const로 분리 vs hero variant에 흡수
**선택**: 별도 const `CHECKOUT_STATS_GRID_TOKENS` 신설.
**이유**: hero variant는 "카드 한 장"의 스타일. grid는 "카드 컨테이너 전체"의 레이아웃. 책임 분리.

### 8.3 hero 선택 우선순위 향후 변경 가능성
**현재**: overdue > 0 → 'overdue' / else null (wireframe 명세 충실)
**대응**: priority 배열 구조 사용 → 후속 확장 시 condition 추가만으로 회귀 0.

### 8.4 trend prop "up" → undefined 변경
**위험**: 현재 trend="up"으로 TrendingUp 아이콘 표시. undefined 시 trend block 미렌더 → 시각 변경.
**완화**: wireframe 01에서 TrendingUp 아이콘은 미사용 (kpi-delta는 별도 텍스트). 따라서 wireframe과 정합 회복 (현재 trend="up"이 부정확한 placeholder).

### 8.5 useMemo 의존성 누락 회귀
**완화**: deps `[summary]` 단순화. backend가 동일 값에도 새 객체 반환 시 매번 재계산되는 것은 비용 무시 가능 (5 필드 산술).

---

## 9. 시니어 원칙 자가 점검 (7-axis)

| 축 | Phase 4 적용 |
|---|---|
| **SSOT** | hero 선택 → `selectHeroVariant`, grid → `CHECKOUT_STATS_GRID_TOKENS`, hero col-span → `containerInGrid`, alertRing → variant config. 모두 단일 위치. |
| **하드코딩 0** | OutboundCheckoutsTab + HeroKPISkeleton 양쪽 raw `col-span-N` / `grid-cols-N` / `ring-*` 0건. verify-hardcoding Step 31로 회귀 차단. |
| **워크플로/성능** | `useStatCards` useMemo, `selectHeroVariant` 결과 useMemo, `handleStatActivate` useCallback. role 변경 시 summary identity 변화로 자동 재계산. |
| **접근성** | hero `aria-pressed={isActive}` + `aria-current={isHero ? 'true' : undefined}`. alertRing 색상 단독 의존 회피 (label "기한 초과" + 카드 위계 + ring 3중 신호). 키보드 접근성 보존. |
| **i18n parity** | 신규 키 0건 (기존 `outbound.overdue` 재사용). |
| **다크모드** | `bg-card` + `ELEVATION_TOKENS.surface.floating` + `text-brand-critical` + `ring-brand-critical/20` 모두 semantic — 자동 전환. dark prefix 0건. |
| **검증 게이트** | verify-design-tokens Step 45 + verify-hardcoding Step 31 + verify-ssot Step 41 — 자동 차단. |

---

## 10. Out-of-scope 명시 (재확인)

- HeroKPI atom 자체 prop 변경
- SparklineMini 데이터 연결
- Hero kpi-meta 텍스트 ("평균 지연 2.3일")
- backend `CheckoutSummary` 확장
- W-2 / W-3 / W-5
- 7건 외부 디자인 리뷰 debt
- pending hero 승격 (Phase 5)
