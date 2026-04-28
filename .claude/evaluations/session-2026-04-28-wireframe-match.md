# Wireframe/REVIEW Match Report — Session 2026-04-28

검증 범위: Phase 4 (P1-1 KPI 1-hero + 3-mini) + 후속 fix 2건 (button.tsx / workflow-panel.ts)
비교 기준: `REVIEW_RESULT.md` + `01_list_recommended.html` KPI 영역 + `_shared.css` 토큰

---

## OVERALL Verdict

| 항목 | 판정 | 매칭률 |
|---|---|---|
| P1-1 (Phase 4) | **PARTIAL PASS** | ~72% |
| 후속 fix 2건 (button/panel) | **PASS** | 100% |

핵심 갭: hero 카드 BG 스타일(그라디언트 vs bg-card), kpi-meta 서브텍스트, sm 그리드 orphan card, "우선" 배지 누락. 구조/토큰/SSOT/a11y 핵심은 모두 충족.

---

## P1-1 KPI 1-hero + 3-mini 매트릭스 (18행)

| # | wireframe spec | 본 세션 구현 | Match |
|---|---|---|---|
| 1 | **그리드 구조**: `grid-template-columns: 1.4fr 1fr 1fr 1fr` (4-col) | `CHECKOUT_STATS_GRID_TOKENS.withHero = 'grid gap-3 grid-cols-4 sm:grid-cols-6 lg:grid-cols-6'` | Y (lg 기준) |
| 2 | **hero col-span**: 1.4fr ≈ 단일 widescreen 그리드에서 넓은 첫 열 | `hero.containerInGrid = 'col-span-2 sm:col-span-3 lg:col-span-2'` | Y (lg) |
| 3 | **sm 그리드 반응형**: 와이어프레임은 1440/1280/1024px 3단계만 제시, sm 분기 없음 | sm: hero=col-span-3/6칸, mini 4개 각 1칸 → 3+3=6(1행)+1칸(2행) → **mini 1개 orphan** | **N** |
| 4 | **hero 배경**: `linear-gradient(180deg, hsl(--brand-critical / 0.04), hsl(--brand-critical / 0.02))` | `surface: 'bg-card shadow-md ring-1 ring-border/10'` — 그라디언트 없음, bg-card | **N** |
| 5 | **hero border**: `border-color: hsl(--brand-critical / 0.20)` — 항상 적용 | `alertRing = 'ring-1 ring-brand-critical/20'` — `isAlert=true`(overdue>0)일 때만. overdue=0이면 ring 없음 | **PARTIAL** |
| 6 | **hero elevation**: `box-shadow: var(--shadow-raised)` | `ELEVATION_TOKENS.surface.floating = 'shadow-md ring-1 ring-border/10'` — shadow-md가 shadow-raised보다 강함 | Y (상위 레벨로 대응) |
| 7 | **hero 수치 크기**: `font-size: 40px` (`kpi-value`) | `hero.kpi = TYPOGRAPHY_TOKENS.kpi + ' text-5xl'` = `text-4xl + text-5xl` → `text-5xl` 승리 = 48px | Y (상위 크기, 의도적) |
| 8 | **hero label**: `font-size: 11px; font-weight: 700; text-transform: uppercase; color: brand-critical` | `hero.label = TYPOGRAPHY_TOKENS.kpiLabel = 'text-xs font-medium uppercase tracking-wider text-muted-foreground'` — color mismatch (muted-foreground vs brand-critical) | **N** |
| 9 | **hero label 우측 "우선" 배지**: `<span class="badge badge-danger">우선</span>` | HeroKPI 컴포넌트에 배지 prop/slot 없음 | **N** |
| 10 | **hero kpi-meta 서브텍스트**: `"평균 지연 2.3일 · 최장 D+8"` (동적 평균/최대 초과일 표시) | HeroKPI에 `meta` prop 없음. Phase 4 boundary 외 이연 명시됨(코드 주석) | N/A (Phase 4.6 이연) |
| 11 | **kpi-delta**: "전일 +2", "전일 ±0", "전일 +1" 등 전일 대비 변동 표시 | delta 값 없음 — SparklineMini는 슬롯만 존재 (values=[] → 빈 SVG) | N/A (Phase 4.6 이연) |
| 12 | **mini 카드 sub-text (동적)**: "내 차례: 3건" / "7일 내 반납: 1건" / "정상 반입 100%" | i18n static: "즉시 처리 필요" / "현재 외부 보유" / "이번 달 완료" — 동적 수치 없음 | N/A (Phase 4.6 이연) |
| 13 | **mini 카드 dot color SSOT**: card label 앞 작은 컬러 dot | `card.dotColor` 필드로 구현 (`bg-brand-warning` 등) — SSOT 적용 ✓ | Y |
| 14 | **dark mode 자동 전환**: CSS 변수 기반 — .dark에서 자동 | brand CSS 변수 + `ELEVATION_TOKENS.surface.floating`(`bg-card` 포함) → dark 자동 ✓ | Y |
| 15 | **클릭 필터 연동**: KPI 카드 클릭 → 해당 상태 필터 | `handleStatActivate` → `onStatCardClick`/`onResetFilters` 연동 ✓ | Y |
| 16 | **a11y — role/aria-pressed**: 버튼 시맨틱 | `role="button" tabIndex={0} aria-pressed={isActive}` 적용 ✓ | Y |
| 17 | **a11y — aria-current**: hero 카드 식별 | `aria-current={isHero ? 'true' : undefined}` 적용 — 단, `aria-current="true"`는 비표준. ARIA 1.2는 `aria-current`에 boolean `true` 허용하지 않고 string literal만. 기능은 작동하나 스펙 위반 | **PARTIAL** |
| 18 | **키보드 접근성 (Enter/Space)**: KPI 카드 키보드 활성화 | `onKeyDown`에서 Enter/Space 처리 ✓ | Y |

---

## 누락/타협 항목

### [GAP-1] hero BG 그라디언트 미적용 (MEDIUM)

- **wireframe spec**: `background: linear-gradient(180deg, hsl(--brand-critical / 0.04), hsl(--brand-critical / 0.02))`
- **구현**: `bg-card` (flat 단색)
- **미스 매치 사유**: ELEVATION_TOKENS.surface.floating이 bg-card를 고정. 그라디언트는 별도 토큰 없음.
- **권장 처리**: `hero.surface`에 `bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]` 추가 또는 CSS 변수 기반 gradient 토큰. **Phase 4.5 수정 권장.**

### [GAP-2] hero label 색상 — brand-critical 누락 (LOW)

- **wireframe spec**: `.kpi-hero .kpi-label { color: hsl(var(--brand-critical)); }`
- **구현**: `TYPOGRAPHY_TOKENS.kpiLabel = '... text-muted-foreground'` — label 색이 muted-foreground (회색)
- **미스 매치 사유**: TYPOGRAPHY_TOKENS.kpiLabel이 도메인 중립 토큰이므로 hero variant에서 오버라이드 필요.
- **권장 처리**: `hero.label`에 `text-brand-critical` 추가. **Phase 4.5 즉시 수정.**

### [GAP-3] hero "우선" 배지 누락 (LOW)

- **wireframe spec**: hero 카드 우측 상단 `<span class="badge badge-danger">우선</span>`
- **구현**: HeroKPI props에 `badge` slot 없음
- **미스 매치 사유**: HeroKPI가 단순 label+value+trend 구조로 설계됨. 배지는 설계에 포함 안 됨.
- **권장 처리**: HeroKPI에 `badge?: ReactNode` slot 추가 또는 hero wrapper에서 절대 위치 배치. **Phase 4.5 수정.**

### [GAP-4] sm 그리드 orphan card (MEDIUM)

- **wireframe spec**: 단일 4-col row에 hero + mini 3개 나란히 배치 (1.4fr + 1fr × 3)
- **구현**: `sm:grid-cols-6`에서 hero=col-span-3 + mini 4개 = 7칸 → 1행에 hero+mini3, 2행에 mini1 (orphan)
- **미스 매치 사유**: mini 카드가 5개(total/pending/checkedOut/overdue/returned)이고 hero=1개로 총 5+1=6인데, sm에서 hero=3칸 차지로 mini가 4개 × 1칸 = 4칸 → 3+4=7>6 → 2행으로 흘러넘침.
- **정확한 계산**: `grid-cols-6`에서 hero(3)+mini(4×1)=7 → 1행(hero+3개)+2행(1개). 1024px(sm) 환경에서 mini 1개만 단독 row 노출.
- **권장 처리**: sm에서 mini 카드에 `sm:col-span-auto` 또는 grid를 `sm:grid-cols-5`로 변경(hero=2, mini=3×1 → 5 ✓). **Phase 4.5 수정 필요.**

### [GAP-5] hero border — overdue=0 시 brand-critical 테두리 소실 (LOW)

- **wireframe spec**: hero 카드는 항상 `border-color: hsl(--brand-critical / 0.20)` 표시
- **구현**: `isAlert=true`(overdue>0)일 때만 `ring-1 ring-brand-critical/20` 적용. overdue=0이면 border 없음 (hero 카드 자체가 렌더링 안 되므로 사실상 미노출)
- **미스 매치 사유**: `heroVariantKey=null`이면 hero 카드 자체가 렌더링되지 않으므로 overdue=0에서는 hero 없음 → 실제 문제 없음. 다만 overdue>0인데 isAlert이 아닌 케이스가 논리적으로 불가능하므로 실용 무관. **N/A (실질 무관).**

### [GAP-6] kpi-meta / kpi-delta / mini 동적 sub-text — Phase 4.6 이연 (기록용)

- **wireframe spec**: hero "평균 지연 2.3일 · 최장 D+8", mini "내 차례: 3건" / "7일 내 반납: 1건" / "정상 반입 100%", delta "전일 +2"
- **구현**: 모두 static i18n 텍스트 또는 미구현. SparklineMini는 빈 슬롯.
- **Phase 4 boundary 내 이연**: 코드 주석에서 "Phase 4.6에서 연결" 명시. 와이어프레임과의 완전 일치는 **Phase 4.6**에서 달성 예정.

### [GAP-7] aria-current="true" 스펙 위반 (MINOR)

- **wireframe spec**: 특정 a11y 명세 없음 (wireframe은 HTML 구조만)
- **구현**: `aria-current="true"` — ARIA 명세에서 `aria-current`의 유효값은 `page|step|location|date|time|false`이며 `"true"`는 비표준. boolean `true`를 전달하면 React가 string "true"로 직렬화. 기능적으로는 AT가 읽지만 스펙 위반.
- **권장 처리**: `aria-current` 제거 후 `aria-label`에 "우선 기한 초과 카드" 등 SR 설명 추가. 또는 `aria-current="false"` → 제거 패턴. **다음 세션 간단 수정.**

---

## button/panel fix vs wireframe 정합성

### button.tsx focus indicator 변경

| 항목 | wireframe spec (`_shared.css`) | 구현 |
|---|---|---|
| focus indicator | `:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| 구현 방식 | outline 기반 | outline 기반 ✓ |
| 적용 대상 | 모든 포커스 가능 요소 | Button 컴포넌트에만 — 행/카드는 FOCUS_TOKENS.classes.default 별도 적용 |

**판정: PASS.** wireframe의 `:focus-visible { outline: ... }` 패턴과 정확히 일치. ring(box-shadow) → outline 전환으로 dashed/radius 조합 문제 해결.

### workflow-panel.ts compact variant shadow/padding

| 항목 | wireframe spec (zone-action 표현) | 구현 |
|---|---|---|
| 행 Zone 4 컨테이너 | `.zone-action { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }` — 별도 배경/shadow 없음 | `NEXT_STEP_PANEL_TOKENS.container.compact = 'inline-flex flex-col gap-0.5'` — shadow/padding 없음 ✓ |
| WORKFLOW_PANEL_TOKENS.variant.compact | — | `container: 'flex items-center gap-1.5 px-1.5 py-1 rounded'` — py-1/px-1.5 소량 패딩 존재 |
| 실제 compact 경로 | — | NextStepPanel.tsx L171: `NEXT_STEP_PANEL_TOKENS.container.compact` 사용 (패딩 없는 것 사용) ✓ |

**판정: PASS.** compact variant에서 NextStepPanel이 NEXT_STEP_PANEL_TOKENS(shadow/padding 없음)를 사용. WORKFLOW_PANEL_TOKENS.variant.compact(px-1.5 py-1 있음)는 실제 compact 경로에서 미사용.

---

## REVIEW_RESULT.md §4 토큰 회귀 검사

### §4.1 새 토큰 추가 (inline action surface)

```css
/* wireframe §4.1 */
--surface-inline-action-info-bg: hsl(var(--brand-info) / 0.10);
--surface-inline-action-info-border: hsl(var(--brand-info) / 0.22);
--surface-inline-action-info-fg: hsl(var(--brand-info));
```

- `styles/globals.css` L478~492: 4축(info/ok/warning/danger) 전체 정의 ✓
- `SURFACE_INLINE_ACTION_TOKENS.base`: `h-7 px-2.5` (28px, wireframe 28px 일치) ✓
- `SURFACE_INLINE_ACTION_TOKENS.variant.info/ok/warning/danger`: CSS 변수 경유 ✓
- **본 세션 회귀 없음** ✓

### §4.2 Stepper 컴포넌트 prop 정리

- `actor: string`, `timestamp: ISO`, `state: 'done'|'current'|'late'|'future'`, `isYourTurn: boolean`
- `CHECKOUT_STEPPER_TOKENS`에 `status.current.node`에 `FOCUS_TOKENS.ringCurrent` 포함 (isYourTurn ring 효과 구현) ✓
- **본 세션 회귀 없음** ✓

### §4.3 D-day pill 색상 4-tier

- `CHECKOUT_DDAY_THRESHOLDS`: D+N → danger, D-0~D-2 → warning, D-3~D-14 → ok, D-15+ → neutral ✓
- `shared-constants` 패키지 SSOT → frontend/backend 일관 ✓
- `DDAY_4TIER_CLASSES`: 4-tier 전체 매핑 ✓
- **본 세션 회귀 없음** ✓

### §4.4 label 잘림 정책 (label-ko/label-mono)

- REVIEW_RESULT.md: `:where(.label-ko) { word-break: keep-all; line-height: 1.45; }`
- CHECKOUT_ITEM_ROW_TOKENS에 별도 label-ko 클래스 적용 확인 안 됨 (이전 세션 Phase 범위)
- **본 세션 직접 변경 없음 → 회귀 없음** ✓

---

## 22-항목 매트릭스 상태 (Phase 4 이후 현황)

| # | 항목 | 본 세션 결과 |
|---|---|---|
| 4 | P1-1 KPI 1-hero + 3-mini | **PARTIAL PASS** — 구조/SSOT/a11y ✓, hero BG/label색/배지/sm orphan 미흡 |
| 그 외 21개 | 변경 없음 | 이전 세션 상태 유지 |

---

## 권장 조치

### 즉시 수정 (Phase 4.5 — 다음 세션 첫 번째 항목)

| 우선순위 | 대상 파일 | 변경 내용 |
|---|---|---|
| P0 | `checkout.ts` → `CHECKOUT_STATS_VARIANTS.hero.surface` | `bg-card` → `bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02] bg-card` (또는 gradient 전용 utility 토큰 분리) |
| P0 | `checkout.ts` → `CHECKOUT_STATS_VARIANTS.hero.label` | `TYPOGRAPHY_TOKENS.kpiLabel` → `TYPOGRAPHY_TOKENS.kpiLabel + ' text-brand-critical'` (wireframe §4.1 spec) |
| P0 | `OutboundCheckoutsTab.tsx` → hero grid | sm 그리드에서 mini orphan 해결: `sm:grid-cols-5` + hero `sm:col-span-2` 변경 검토 (또는 mini에 `sm:col-span-[calc]` 추가) |
| P1 | `HeroKPI.tsx` | `badge?: ReactNode` slot 추가 → OutboundCheckoutsTab에서 `<Badge variant="danger">우선</Badge>` 주입 |
| P2 | `OutboundCheckoutsTab.tsx` L293 | `aria-current="true"` → 제거 또는 aria-label로 SR 설명 대체 |

### 다음 세션 핸드오프 항목 (Phase 4.6)

- hero kpi-meta: "평균 지연 N일 · 최장 D+N" — 백엔드 `/checkouts/summary` 에 `avgOverdueDays`, `maxOverdueDays` 필드 추가 필요 (API 변경)
- mini kpi-delta: "전일 +N" — 시계열 데이터 endpoint 필요
- mini dynamic sub-text: "내 차례: N건" — myTurn count 필드 추가 필요
- SparklineMini 실제 데이터 연결

### 별도 PR 불필요 항목

- GAP-5 (overdue=0 시 hero 미렌더링 → border 소실): hero가 overdue>0에서만 나타나므로 실용 무관
- button.tsx / workflow-panel.ts 후속 fix: 이미 wireframe 정합 ✓

---

*생성: 2026-04-28 | 검증 범위: Phase 4 P1-1 + button/panel fix*
