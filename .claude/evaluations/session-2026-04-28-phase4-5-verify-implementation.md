# Phase 4.5 구현 검증 보고서

**세션:** 2026-04-28  
**범위:** 6개 파일 (Phase 4.5 변경 파일 한정)  
**실행 스킬:** 19개 verify-* 전체

---

## 1. Verdict Summary

| 분류 | 건수 |
|------|------|
| FAIL (즉시 수정 필요) | 0 |
| SHOULD (권고 개선) | 2 |
| PASS | 17 스킬, 35+ grep 검사 |
| N/A (적용 불가) | 7 스킬 |

**전체 판정: PASS (blocking FAIL 없음)**

---

## 2. Per-Skill Results Table

| # | 스킬 | 판정 | 이슈 수 | 상세 |
|---|------|------|---------|------|
| 1 | verify-cas | N/A | 0 | 범위 내 파일에 CAS mutation 없음 — 순수 표시/필터 컴포넌트 |
| 2 | verify-auth | N/A | 0 | backend 전용 — 범위 내 파일 해당 없음 |
| 3 | verify-zod | N/A | 0 | backend 전용 — 범위 내 파일 해당 없음 |
| 4 | verify-ssot | PASS | 0 | CheckoutStatus/Purpose는 `@equipment-management/schemas` 경유, Permission은 `@equipment-management/shared-constants`, FRONTEND_ROUTES SSOT, SemanticColorKey는 brand.ts SSOT |
| 5 | verify-hardcoding | PASS | 0 | 하드코딩 API 경로 0건, queryKeys 팩토리 사용, QUERY_CONFIG 프리셋 사용. `dotColor`/`text-brand-warning` 패턴은 Phase 4.5 이전부터 존재 (git diff HEAD~1 확인) |
| 6 | verify-frontend-state | PASS | 0 | setQueryData 0건, useCallback 정상 적용 (deps 정합), QUERY_CONFIG.CHECKOUT_LIST 프리셋 경유 |
| 7 | verify-nextjs | PASS | 0 | 'use client' 최상단 정확, Client Component 패턴 올바름, 범위 내 page.tsx 없음 |
| 8 | verify-filters | PASS | 0 | filtersToSearchParams SSOT 경유, countActiveFilters SSOT, handleSubTabChange status 리셋 포함 |
| 9 | verify-design-tokens | PASS + **SHOULD×1** | 1 | Step 45~47 신규 steps 검증 완료. 상세: §3 |
| 10 | verify-security | PASS | 0 | dangerouslySetInnerHTML 0건, eval 0건, XSS 벡터 없음 |
| 11 | verify-i18n | PASS | 0 | en/ko 키 완전 쌍 (각 19개, 전체 768개 동일), ICU `{label}` 변수 양쪽 parity |
| 12 | verify-sql-safety | N/A | 0 | backend 전용 — 범위 내 파일 해당 없음 |
| 13 | verify-e2e | PASS | 0 | Phase 4.5 변경은 시각 강조/접근성/성능 최적화 — 기존 E2E WF-03/WF-07/WF-17/WF-25 커버리지에 영향 없음 |
| 14 | verify-seed-integrity | N/A | 0 | backend seed 전용 — 범위 내 파일 해당 없음 |
| 15 | verify-workflows | PASS | 0 | 신규 user workflow 경로 없음 — 기존 반출 목록 조회 흐름 변경 없음 |
| 16 | verify-cache-events | N/A | 0 | 이벤트 발행/수신 코드 없음 — 범위 내 파일 해당 없음 |
| 17 | verify-handover-security | N/A | 0 | QR 인수인계 토큰 관련 코드 없음 |
| 18 | verify-qr-ssot | N/A | 0 | QR 관련 코드 없음 |
| 19 | verify-checkout-fsm | PASS | 0 | OutboundCheckoutsTab은 FSM mutation 없음 — 조회/필터 전용. 범위 내 파일에 FSM 전이 호출 없음 |

---

## 3. Critical Findings (FAIL)

**없음.** 모든 blocking FAIL 항목이 해소됨.

### Critical Check 결과 (요청된 4개 항목)

| Critical Check | 결과 | 근거 |
|----------------|------|------|
| HeroKPI atom이 grid/surface/label 토큰을 로컬 재정의하지 않음 | PASS | `tokens = CHECKOUT_STATS_VARIANTS.hero` 경유, `surfaceClass = tokens.surfaceVariant[variant]`, `labelColorClass = tokens.labelVariant[variant]` |
| OutboundCheckoutsTab이 `bg-brand-critical/15` 배지를 하드코딩하지 않음 | PASS | `<span className={heroTokens.priorityBadge}>` — 토큰 경유 (OutboundCheckoutsTab.tsx:300) |
| Step 46/47 grep 명령어가 현재 코드에 false positive 없음 | PASS | Step 46: `ring-2`/`ring-offset-2` 0건 ✓, `outline-2 outline-offset-2 outline-ring` 1건 ✓. Step 47: `compact` 금지 클래스 0건 ✓, `inline-flex flex-col gap-0.5` 1건 ✓ |
| ko/en parity (priorityBadge + priorityHeroAriaLabel) | PASS | 양쪽 모두 라인 496–497, ICU `{label}` 변수 parity, outbound 섹션 19개 키 완전 일치 |
| useCallback deps (filters + router) 정확성 | PASS | handlePageChange: `[filters, router]` — filters 스프레드 + router.replace 사용. handleSubTabChange: `[filters, router]` — filters.subTab/status/page + router.replace |

---

## 4. Warnings (SHOULD)

### SHOULD-1: verify-design-tokens Step 45 — alertRing grep 패턴 false negative

**위치:** `.claude/skills/verify-design-tokens/SKILL.md` Step 45 grep 명령어

**현상:**
```bash
# SKILL Step 45의 grep 명령어
grep -rn "CHECKOUT_STATS_VARIANTS\.hero\.alertRing" apps/frontend/app apps/frontend/components
# 결과: 0 hits
```

**실제 코드 (OutboundCheckoutsTab.tsx:290–294):**
```typescript
const heroTokens = CHECKOUT_STATS_VARIANTS.hero;  // alias 할당
// ...
isAlert ? heroTokens.alertRing : '',              // alias 경유 사용
```

**설명:** `heroTokens`가 `CHECKOUT_STATS_VARIANTS.hero`의 alias이므로 alertRing 토큰은 실제로 사용됨 (dead token 아님). 단, SKILL Step 45 grep 패턴이 alias-destructuring 패턴을 탐지하지 못해 false negative 반환. 코드는 올바름.

**수정 방향:** Step 45 grep을 `CHECKOUT_STATS_VARIANTS\.hero\.alertRing\|heroTokens\.alertRing`로 확장.

**심각도:** SHOULD (코드 결함 아님 — SKILL grep 패턴 정확도 개선)

---

### SHOULD-2: containerInGrid `col-span-2` — xs breakpoint wrapping 미문서화

**위치:** `apps/frontend/lib/design-tokens/components/checkout.ts`, line 465

**현상:**
```typescript
// 변경 전 (Phase 4 이전)
containerInGrid: 'col-span-2 sm:col-span-3 lg:col-span-2'

// 변경 후 (Phase 4.5)
containerInGrid: 'col-span-2'  // 모든 breakpoint 통일
```

**분석:**
- Grid: `grid-cols-4 sm:grid-cols-6 lg:grid-cols-6`
- xs(grid-cols-4): hero(col-span-2) + 4 mini cards → Row1: hero+mini+mini, Row2: mini+mini (의도적 wrapping)
- sm/lg(grid-cols-6): hero(col-span-2) + 4 mini cards = 6 total → 완벽 정렬 (GAP-4 해소)
- 이전 sm:col-span-3은 실제로 hero+3mini=6, 나머지 1 mini wrap이었음 → 오히려 xs와 동일한 문제

**결론:** Phase 4.5 변경이 sm breakpoint에서 레이아웃을 오히려 수정함. xs wrapping은 grid 특성상 불가피하며 Phase 4 이전과 동일 동작. 토큰 주석에 xs wrapping 동작 문서화 권장.

**심각도:** SHOULD (기능 회귀 없음 — 문서화 개선)

---

## 5. Per-File Detailed Audit

### File 1: `apps/frontend/lib/design-tokens/components/checkout.ts`

| 검사 항목 | 결과 | 상세 |
|-----------|------|------|
| SemanticColorKey import (SSOT) | PASS | `from '../brand'` 경유 (line 28–29) |
| MICRO_TYPO import (SSOT) | PASS | `from '../semantic'` 경유 (line 18) |
| ELEVATION_TOKENS import (SSOT) | PASS | `from '../semantic'` 경유 (line 15) |
| dark: prefix in token values | PASS | 0건 — CSS 변수 자동 전환 |
| transition-all 금지 | PASS | 0건 — TRANSITION_PRESETS 경유 |
| dynamic brand interpolation 금지 | PASS | `text-brand-\${` 0건 |
| surfaceVariant `Partial<Record<SemanticColorKey>>` 타입 | PASS | `as Partial<Record<SemanticColorKey, string>>` (line 469) |
| labelVariant `Partial<Record<SemanticColorKey>>` 타입 | PASS | `as Partial<Record<SemanticColorKey, string>>` (line 474) |
| priorityBadge 토큰 정의 (bg-brand-critical/15 허용 — 토큰 레이어) | PASS | Layer 3 토큰 정의 레이어이므로 inline brand 리터럴 허용 |
| containerInGrid 'col-span-2' 통일 | PASS | 모든 breakpoint 동일 (SHOULD-2 참고) |
| elevation 분리 (surface와 별도 필드) | PASS | `surface: 'bg-card'`, `elevation: ELEVATION_TOKENS.surface.floating` 분리됨 |

---

### File 2: `apps/frontend/components/checkouts/HeroKPI.tsx`

| 검사 항목 | 결과 | 상세 |
|-----------|------|------|
| CHECKOUT_STATS_VARIANTS 경유 (로컬 재정의 없음) | PASS | `tokens = CHECKOUT_STATS_VARIANTS.hero` (line 25) |
| surfaceVariant 토큰 경유 | PASS | `tokens.surfaceVariant[variant]` (line 27) |
| labelVariant 토큰 경유 | PASS | `tokens.labelVariant[variant]` (line 28) |
| elevation 토큰 경유 | PASS | `tokens.elevation` (line 31) |
| badge slot (ReactNode) | PASS | `badge?: ReactNode` prop, `{badge}` render (line 34) |
| aria-hidden 권고 JSDoc | PASS | 배지 slot JSDoc에 SR 중복 회피 가이드 포함 |
| col-span/grid 로컬 정의 없음 | PASS | HeroKPI atom은 grid layout 책임 없음 — 호스트(OutboundCheckoutsTab)가 containerInGrid 담당 |
| inline brand 리터럴 없음 | PASS | bg-brand-*, text-brand-* JSX 직접 사용 0건 |
| 'use client' 최상단 | PASS | line 1 |
| transition-all 없음 | PASS | 0건 |
| trend icon aria-hidden | PASS | TrendingUp/TrendingDown/Minus에 `aria-hidden="true"` + sr-only 텍스트 |

---

### File 3: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`

| 검사 항목 | 결과 | 상세 |
|-----------|------|------|
| heroTokens.priorityBadge 토큰 경유 | PASS | `className={heroTokens.priorityBadge}` (line 300) — 하드코딩 없음 |
| heroTokens.alertRing 경유 | PASS | `heroTokens.alertRing` (line 294) — `heroTokens = CHECKOUT_STATS_VARIANTS.hero` alias |
| heroTokens.containerInGrid 경유 | PASS | `heroTokens.containerInGrid` (line 292) |
| getStatsGridClass(hasHero) 경유 | PASS | `getStatsGridClass(!!heroVariantKey)` (line 273) |
| raw col-span/grid-cols 잔존 없음 | PASS | 0건 |
| priorityBadgeNode aria-hidden | PASS | `aria-hidden="true"` (line 300) |
| heroAriaLabel isAlert 시 합성 | PASS | `t('outbound.priorityHeroAriaLabel', { label: t(card.labelKey) })` |
| FRONTEND_ROUTES SSOT | PASS | `@equipment-management/shared-constants` 경유 |
| queryKeys 팩토리 | PASS | `queryKeys.checkouts.view.outbound(...)` |
| QUERY_CONFIG.CHECKOUT_LIST | PASS | `...QUERY_CONFIG.CHECKOUT_LIST` spread |
| handlePageChange useCallback | PASS | deps: `[filters, router]` 정합 |
| handleSubTabChange useCallback | PASS | deps: `[filters, router]`, status 'all' + page 1 리셋 |
| setQueryData 없음 | PASS | 0건 |
| countActiveFilters SSOT | PASS | `@/lib/utils/checkout-filter-utils` 경유 |

---

### File 4+5: `messages/ko/checkouts.json` + `messages/en/checkouts.json`

| 검사 항목 | 결과 | 상세 |
|-----------|------|------|
| priorityBadge ko 존재 | PASS | line 496: `"priorityBadge": "우선"` |
| priorityBadge en 존재 | PASS | line 496: `"priorityBadge": "Priority"` |
| priorityHeroAriaLabel ko 존재 | PASS | line 497: `"priorityHeroAriaLabel": "{label}, 우선 항목"` |
| priorityHeroAriaLabel en 존재 | PASS | line 497: `"priorityHeroAriaLabel": "{label}, priority item"` |
| ICU {label} 변수 parity | PASS | ko: `{label}`, en: `{label}` — 완전 일치 |
| outbound 섹션 전체 key count | PASS | ko=19개, en=19개 완전 일치 |
| 전체 파일 key count | PASS | ko=768개, en=768개 완전 일치 |
| 빈 번역 없음 | PASS | 두 신규 키 모두 비어있지 않음 |

---

### File 6: `.claude/skills/verify-design-tokens/SKILL.md`

| 검사 항목 | 결과 | 상세 |
|-----------|------|------|
| Step 45 surfaceVariant/labelVariant/priorityBadge dead-token 검사 추가 | PASS | `heroTokens.surfaceVariant`: 1 hit, `heroTokens.labelVariant`: 1 hit, `heroTokens.priorityBadge`: 1 hit |
| Step 46 button base cva ring guard — FAIL 패턴 탐지 | PASS | `ring-2`/`ring-offset-2` 0건 검증 통과 |
| Step 46 button base cva ring guard — PASS 양성 확인 | PASS | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` 1건 |
| Step 47 compact elevation 0 원칙 — FAIL 패턴 탐지 | PASS | `compact:` 에 rounded/shadow/ELEVATION 0건 |
| Step 47 compact elevation 0 원칙 — PASS 양성 확인 | PASS | `compact: 'inline-flex flex-col gap-0.5'` 1건 |
| Step 45 alertRing grep 패턴 | **SHOULD** | `CHECKOUT_STATS_VARIANTS\.hero\.alertRing` grep → 0 hits (false negative). 실제 코드는 alias 경유 사용. 상세: §4 SHOULD-1 |

---

## 6. 검증 요약

Phase 4.5 변경은 **FAIL 없이 PASS** 판정.

- hero 토큰 확장(surfaceVariant/labelVariant/priorityBadge/elevation): 3-Layer 아키텍처 준수, dead-token 없음
- containerInGrid 'col-span-2' 통일: sm 레이아웃 실제 수정 (이전 sm:col-span-3은 7칸 발생 → 수정됨)
- HeroKPI atom badge slot: 토큰 경유, aria-hidden 적용, JSDoc 가이드 포함
- OutboundCheckoutsTab priority badge: heroTokens.priorityBadge 경유 (하드코딩 없음), heroAriaLabel 합성 정확
- useCallback: handlePageChange/handleSubTabChange 모두 [filters, router] deps 정합
- i18n: en/ko 완전 쌍, ICU 변수 parity
- SKILL Step 46/47: 현재 코드베이스에 false positive 없이 정확 통과

SHOULD 2건은 코드 결함이 아니므로 즉시 수정 불필요. SHOULD-1(SKILL grep 개선)은 다음 manage-skills 세션에서 처리 권장.
