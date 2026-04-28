# Verify-Implementation Report — Session Files (2026-04-28)

**검증 일시**: 2026-04-28  
**검증 대상 세션**: Phase 4 P1-1 KPI 위계 구현 + button.tsx focus-visible 전환 + NEXT_STEP_PANEL_TOKENS compact 변경

---

## Verdict

| 수준 | 건수 |
|------|------|
| CRITICAL FAIL | 0 |
| SHOULD (Warning) | 2 |
| PASS | 11 |
| N/A (범위 외) | 9 |

**전체 판정: PASS** — Critical 위반 없음. SHOULD 수준 2건은 접근성/성능 개선 권고 사항이며 기능 블로킹 없음.

---

## 대상 파일 목록 (8개)

| # | 파일 | 변경 유형 |
|---|------|-----------|
| 1 | `apps/frontend/lib/utils/checkout-hero-selector.ts` | 신규 |
| 2 | `apps/frontend/lib/utils/__tests__/checkout-hero-selector.test.ts` | 신규 |
| 3 | `apps/frontend/lib/design-tokens/components/checkout.ts` | 수정 (CHECKOUT_STATS_GRID_TOKENS 추가) |
| 4 | `apps/frontend/lib/design-tokens/index.ts` | 수정 (re-export 추가) |
| 5 | `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` | 수정 (hero 통합) |
| 6 | `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` | 수정 (토큰 미러링) |
| 7 | `apps/frontend/components/ui/button.tsx` | 수정 (focus-visible 전환) |
| 8 | `apps/frontend/lib/design-tokens/components/workflow-panel.ts` | 수정 (compact 변경) |

---

## Per-skill Results

| 스킬 | 판정 | 비고 |
|------|------|------|
| verify-ssot | PASS | CheckoutStatus·CheckoutPurpose → `@equipment-management/schemas`, Permission → `@equipment-management/shared-constants`. CheckoutStatsVariant는 UI 토큰 타입(로컬 정의 허용) |
| verify-hardcoding | PASS | 8개 파일 전체 `grid-cols-\d` / `col-span-\d` raw 사용 0건. CHECKOUT_STATS_GRID_TOKENS 토큰 경유 확인 |
| verify-design-tokens | PASS | `alertRing = 'ring-1 ring-brand-critical/20'` 적용됨. `transition: all` 0건. `dark:bg-brand-*` 0건. `getStatsGridClass()` 토큰 헬퍼 경유. `focus-visible:outline` 전환 완료 |
| verify-frontend-state | PASS (SHOULD×1) | `handleStatActivate`·`handleCheckoutClick` useCallback 적용. `heroVariantKey` useMemo 적용. `handlePageChange`·`handleSubTabChange` useCallback 미적용 — native button 전달이므로 Step 25 위반 아님, 성능 SHOULD |
| verify-i18n | PASS | aria-label에 `t(card.labelKey)` 사용. 하드코딩 한국어 문자열 0건 |
| verify-nextjs | PASS | 대상 파일 내 Next.js 16 Route Params 직접 접근 패턴 없음. `'use client'` 파일에서 서버 전용 API 사용 없음 |
| verify-security | PASS | 대상 파일은 순수 UI/토큰/유틸. userId body 신뢰 패턴 없음. 민감 정보 노출 없음 |
| verify-cas | N/A | 대상 파일 전부 프론트엔드 UI/토큰. CAS 로직 없음 |
| verify-auth | N/A | 대상 파일 내 인증/권한 Guard 없음. `Permission` enum import SSOT 준수 확인됨(SSOT 검증과 중복) |
| verify-zod | N/A | 대상 파일 내 Zod 스키마 정의 없음 |
| verify-sql-safety | N/A | 프론트엔드 전용 파일. DB 쿼리 없음 |
| verify-seed-integrity | N/A | 시드 데이터 없음 |
| verify-cache-events | N/A | 프론트엔드 UI 파일. EventEmitter2/캐시 무효화 패턴 없음 |
| verify-handover-security | N/A | 보안 핸드오버 패턴(scope → FSM → domain 순서) 해당 없음 |
| verify-qr-ssot | N/A | QR 관련 파일 없음 |
| verify-workflows | N/A | FSM 워크플로 서비스 없음 |
| verify-checkout-fsm | N/A | FSM transition/authority 로직 없음 |
| verify-e2e | N/A | E2E 테스트 파일 없음 (단위 테스트만 추가됨) |
| verify-implementation | PASS (SHOULD×1) | aria-current="true" on role="button" 토글 — 기술적 허용값이나 aria-pressed로 충분 (하단 상세) |

---

## Critical Findings (FAIL)

없음.

---

## Warnings / SHOULD-level

### SHOULD-1 · 접근성: `aria-current="true"` on role="button" KPI 토글 카드

**파일**: `OutboundCheckoutsTab.tsx:293`  
**코드**:
```tsx
aria-pressed={isActive}
aria-current={isHero ? 'true' : undefined}
```

**근거**:  
WAI-ARIA 1.2 spec에서 `aria-current` 허용값은 `page | step | location | date | time | true | false`. `true`는 기술적으로 유효하나 사용 맥락이 navigation 위치 식별에 특화된 속성이다. `role="button"` 토글에서 활성 상태는 `aria-pressed`로 충분히 표현된다. `aria-current="true"` 병용은 일부 스크린리더(VoiceOver)에서 "현재 항목"과 "눌림 상태"를 이중으로 읽어 혼란을 줄 수 있다.

**권고**:  
`aria-current={isHero ? 'true' : undefined}` 제거. `aria-pressed={isActive}`만으로 토글 상태 전달. hero 시각 강조는 토큰(`alertRing`)이 처리하므로 ARIA 속성 중복 불필요. 또는 hero KPI 전용 `aria-label`에 "(위험 항목)" 힌트 텍스트 추가로 대체.

**수준**: SHOULD (비기능 요구사항. WCAG 2.1 AA 위반 아님)

---

### SHOULD-2 · 성능: `handlePageChange` / `handleSubTabChange` useCallback 미적용

**파일**: `OutboundCheckoutsTab.tsx:154-170`  
**코드**:
```tsx
const handlePageChange = (newPage: number) => {
  // ...
};
const handleSubTabChange = (newSubTab: CheckoutSubTab) => {
  // ...
};
```

**근거**:  
`handlePageChange`는 페이지네이션 native button에 인라인 closure `() => handlePageChange(1)` 형태로 전달되고, `handleSubTabChange`는 `CheckoutSubTabBar` 컴포넌트에 props로 전달된다. `CheckoutSubTabBar`가 현재 `React.memo`로 감싸져 있지 않아 Step 25 MUST 위반은 아니나, 렌더링마다 새 함수 참조가 생성된다. 향후 `CheckoutSubTabBar`가 `React.memo`로 최적화될 경우 즉시 회귀 포인트가 됨.

**권고**:  
```tsx
const handlePageChange = useCallback((newPage: number) => { ... }, [router, searchParams]);
const handleSubTabChange = useCallback((newSubTab: CheckoutSubTab) => { ... }, [router, searchParams]);
```

**수준**: SHOULD (현재 성능 영향 미미. 방어적 적용 권고)

---

## 개별 파일 상세 결과

### 1. `checkout-hero-selector.ts`

| 항목 | 결과 |
|------|------|
| SSOT import | PASS — 외부 패키지 import 없음. UI 토큰 타입은 `@/lib/design-tokens` barrel 경유 |
| 순수 함수 | PASS — side effect 없음, `HeroSummaryInput` 인터페이스 제약 |
| 하드코딩 | PASS — `grid-cols-\d` / `col-span-\d` 0건 |
| `HERO_PRIORITY` 확장성 | PASS — Phase 5 추가 조건은 배열 항목 추가만으로 처리 가능 |

### 2. `checkout-hero-selector.test.ts`

| 항목 | 결과 |
|------|------|
| 단위 테스트 커버리지 | PASS — 6개 케이스 (all-zero, overdue-hero, hero=null 경계, Phase 4 boundary negative) |
| @ts-expect-error 네거티브 패턴 | PASS (Phase 5 예정 값 테스트에 활용) |

### 3. `design-tokens/components/checkout.ts`

| 항목 | 결과 |
|------|------|
| SSOT import | PASS — `CheckoutStatus`, `CheckoutPurpose` from `@equipment-management/schemas` |
| raw grid-cols 사용 | PASS — `CHECKOUT_STATS_GRID_TOKENS` 내 값은 토큰 정의부. 소비처는 토큰 경유 |
| `alertRing` 토큰 | PASS — `'ring-1 ring-brand-critical/20'` 적용 |
| `dark:bg-brand-*` | PASS — 0건 |
| `transition: all` | PASS — 0건 |
| Dead token 여부 | PASS — `CHECKOUT_STATS_GRID_TOKENS`는 `getStatsGridClass()` 내부에서 소비됨 |

### 4. `design-tokens/index.ts`

| 항목 | 결과 |
|------|------|
| Re-export SSOT | PASS — `CHECKOUT_STATS_GRID_TOKENS`, `getStatsGridClass`, `CheckoutStatsVariant` barrel 경유 |

### 5. `OutboundCheckoutsTab.tsx`

| 항목 | 결과 |
|------|------|
| selectHeroVariant SSOT | PASS — 인라인 분기 없음, `checkout-hero-selector.ts` 헬퍼 경유 |
| getStatsGridClass 토큰 | PASS — raw `grid-cols-\d` 0건 |
| heroTokens.containerInGrid | PASS — `col-span-2 sm:col-span-3 lg:col-span-2` 토큰 경유 |
| alertRing 적용 | PASS — `isAlert ? heroTokens.alertRing : ''` |
| handleStatActivate useCallback | PASS |
| handleCheckoutClick useCallback | PASS |
| heroVariantKey useMemo | PASS |
| aria-current="true" on button toggle | SHOULD (상세: SHOULD-1) |
| handlePageChange useCallback | SHOULD (상세: SHOULD-2) |
| handleSubTabChange useCallback | SHOULD (상세: SHOULD-2) |
| Permission SSOT | PASS — `@equipment-management/shared-constants` 경유 |
| CheckoutStatusValues SSOT | PASS — `@equipment-management/schemas` 경유 |
| isLoading / isError 구조분해 | PASS |

### 6. `HeroKPISkeleton.tsx`

| 항목 | 결과 |
|------|------|
| getStatsGridClass 사용 | PASS — raw `grid-cols-\d` 0건 |
| containerInGrid 토큰 | PASS — `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 경유 |
| aria-hidden | PASS — `aria-hidden="true"` 올바르게 적용 |
| CLS 방지 (host와 grid 토큰 동일) | PASS — `getStatsGridClass(true)` 동일 함수 사용으로 host와 동기화 |

### 7. `components/ui/button.tsx`

| 항목 | 결과 |
|------|------|
| focus-visible:ring → outline 전환 | PASS — `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` |
| transition: all | PASS — `motion-safe:transition-[background-color,border-color,color,transform]` (specific props) |
| motion-reduce 대응 | PASS — `motion-reduce:transition-none` |
| focus-visible:outline-ring CSS 변수 | PASS — `--color-ring` globals.css 정의됨 |

### 8. `workflow-panel.ts`

| 항목 | 결과 |
|------|------|
| compact 토큰 변경 | PASS — `'inline-flex flex-col gap-0.5'` (layout-only, shadow/padding/rounded 제거) |
| 변경 의도 문서화 | PASS — Phase 3 (P0-3, 2026-04-28) 주석 포함 |
| 소비처 일치 | PASS — `NextStepPanel.tsx` compact 분기에서 이 토큰 소비 확인 |

---

## Out-of-scope Files Touched

본 세션에서 직접 변경된 8개 파일 외 다른 파일은 수정되지 않았음. `HeroKPI.tsx`, `Card.tsx`, `NextStepPanel.tsx`는 소비처로서 읽기만 수행함.

---

## 검증 방법론

- `grep -nE` 명령으로 raw `col-span-\d` / `grid-cols-\d` 패턴 확인 (0건)
- `grep -n 'from.*schemas\|from.*shared-constants'` SSOT import 경로 검증
- `grep -n 'useCallback\|useMemo'` 적용 여부 확인
- `grep -n 'transition-all\|dark:bg-brand-\|dark:text-brand-\|dark:border-brand-'` 금지 패턴 확인
- 소비처 파일 직접 읽기로 React.memo 적용 여부 → Step 25 범위 판단
- WAI-ARIA 1.2 spec 기준 aria-current 허용값 분석

---

*생성: 2026-04-28 | 검증자: Claude Sonnet 4.6 | 세션: Phase 4 P1-1 KPI 위계*
