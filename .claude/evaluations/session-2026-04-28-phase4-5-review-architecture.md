# Review-Architecture — Phase 4.5

> 리뷰 일자: 2026-04-28 | 검증자: Claude Sonnet 4.6 (background agent — Write 권한 부족으로 메인 컨텍스트가 보관)
> 범위: 6개 파일 (checkout.ts / HeroKPI.tsx / OutboundCheckoutsTab.tsx / ko+en checkouts.json / verify-design-tokens SKILL.md)

---

## Verdict: **PASS** (LOW-severity 관찰 3건)

기능 회귀 위험 없음. 레이어 경계 준수. SSOT 정합. 하위 호환성 유지. Phase 5 확장 경로 명확.
아래 3개 관찰은 선택적 개선이며 블로커 아님 — 단 Issue #1은 Phase 5 착수 전 수정 필요.

---

## Layer boundary analysis

| Concern | Finding | Severity |
|---|---|---|
| Layer 3 → Layer 2 흐름 | `checkout.ts`가 `getSemanticContainerTextClasses()` (Layer 2 helper)를 토큰 정의 시점에 직접 호출 — Layer 3이 Layer 2 헬퍼를 소비하는 정상 방향 | PASS |
| HeroKPI atom 도메인 지식 누출 | `HeroKPI`는 `variant?: SemanticColorKey`만 받아 토큰 조회 — "critical"이 무엇을 의미하는지 모름. 도메인 결정(overdue=critical)은 OutboundCheckoutsTab host가 `variant="critical"` 하드코딩으로 수행 | 관찰 #1 (LOW) |
| 토큰 → atom → host 레이어 체인 | `checkout.ts`(토큰 정의) → `HeroKPI.tsx`(토큰 소비, 렌더) → `OutboundCheckoutsTab`(도메인 결정 + 주입) — 레이어 스킵 없음 | PASS |
| badge 슬롯 | `badge?: ReactNode`를 host에서 생성해 atom에 주입 — atom은 badge가 무엇인지 모름. 표현 관심사 분리 정상 | PASS |
| HeroKPISkeleton | `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 토큰 경유, raw `col-span-2` 사용 없음 | PASS |

---

## Cross-module consistency

| Pattern | Other domains | Consistent? |
|---|---|---|
| `Partial<Record<SemanticColorKey, string>>`로 variant override | calibration.ts, non-conformance.ts, disposal.ts 등은 helper 결과를 flat string으로 합성. `Partial<Record<...>>` 맵 패턴은 checkout.ts에만 존재 | 단일 선례 — 관찰 #2 |
| 헬퍼 정의 시점 호출 | calibration, disposal, non-conformance, reports도 `getSemanticContainerTextClasses`를 모듈 최상위 정의 시점에 호출 — 일관됨 | PASS |
| Phase 5 'pending' hero 확장성 | `HERO_PRIORITY` 배열, `surfaceVariant/labelVariant` Partial Record 모두 'warning' 키 추가만으로 확장 가능 | PASS |

---

## SSOT coherence audit

**3개 수정 지점 결합도**: `checkout.ts`(토큰) → `HeroKPI`(소비) → `OutboundCheckoutsTab`(도메인 결정)의 단방향 흐름.
토큰 삭제 시 atom에서 `|| tokens.surface` fallback이 있어 런타임 오류 없음. 결합도 허용 수준.

**SSOT 가장 취약 지점**: `OutboundCheckoutsTab.tsx:327` `variant="critical"` 하드코딩.
`selectHeroVariant`가 heroVariantKey를 결정하는 SSOT임에도 host가 두 번째 결정을 내리는 구조 — 관찰 #1 상세 참조.

**i18n 키 명명 규칙**: `priorityHeroAriaLabel`은 기존 `overdueScrollAriaLabel` 패턴과 일치.
`priorityBadge`는 도메인 관련 명명으로 일관성 있음. ko/en 양쪽 모두 line 496-497에 동일 추가됨 — 패리티 이상 없음.

**Step 45 대칭성**: SKILL.md Step 45가 세 신규 토큰(`surfaceVariant`, `labelVariant`, `priorityBadge`) 각각의
dead-token 검사를 루프로 검증 — 3개 토큰 모두 동등하게 커버됨.

---

## Backwards compatibility

**HeroKPI 호출처: 1개 발견 (`OutboundCheckoutsTab.tsx:324`), 파손 0건 (예상 충족)**

- `HeroKPIError.tsx`, `HeroKPISkeleton.tsx` — HeroKPI 컴포넌트를 직접 렌더하지 않음
- `CheckoutsContent.tsx` — HeroKPIError만 사용

`badge?: ReactNode` optional prop 추가이므로 기존 호출처(badge 없음)는 그대로 작동.

**hero 토큰 shape 변경(surface split) 영향**:

| Consumer | 접근 토큰 | 영향 |
|---|---|---|
| HeroKPI.tsx | `tokens.surface`, `tokens.surfaceVariant`, `tokens.elevation`, `tokens.label`, `tokens.labelVariant` | 신규 필드 참조 — 정상 |
| HeroKPISkeleton.tsx | `tokens.containerInGrid`만 접근 | surface/surfaceVariant 미참조 — 영향 없음 |
| OutboundCheckoutsTab.tsx | `heroTokens.containerInGrid`, `alertRing`, `priorityBadge` | surface/surfaceVariant 미참조 — 영향 없음 |

`hero.container` (legacy alias = `'col-span-2 row-span-1'`)는 정의 유지되나 소비자 0건. 삭제 위험 없음.

---

## Performance / re-render risk

**handlePageChange / handleSubTabChange useCallback deps = `[filters, router]`**

`filters` 객체는 `CheckoutsContent`에서 `parseCheckoutFiltersFromSearchParams(searchParams)`로 매 렌더마다 새 객체 생성.
`useCallback([filters, router])`의 filters는 따라서 렌더마다 새 참조 → callback도 매 렌더마다 재생성됨.

**현재 성능 위험: 없음** — `OutboundCheckoutsTab`이 `React.memo`로 감싸지지 않았고, callback을 props로 받는
자식 컴포넌트들도 memo 래핑 없으므로 callback 재생성이 불필요 re-render를 유발할 조건이 없음.
코드 주석에 "SHOULD-2 방어적 적용"으로 명시된 의도와 일치.

단, Phase 5에서 `CheckoutListTabs`나 `CheckoutGroupCard`에 `React.memo`를 추가할 경우 deps 세분화
(`filters.page`, `filters.subTab` 등 primitive 분해)로 전환 필요.

**heroAriaLabel 인라인 계산**: `statCards.map()` 루프 내 hero 카드 1개 분기에서 `t()` 호출 2회.
비용 경미하고 hero 카드 최대 1개 — useMemo 미적용이 적절함.

---

## Phase 5 extensibility check

**'pending' hero 추가를 위한 선결조건 (순서 중요)**:

1. `selectHeroVariant`의 `HERO_PRIORITY` 배열에 pending rule 추가 — 무회귀
2. `checkout.ts`의 `surfaceVariant`/`labelVariant` Partial Record에 `'warning'` 키 추가 — 무회귀
3. `OutboundCheckoutsTab.tsx:327`의 `variant="critical"` 하드코딩을 heroVariantKey 기반 동적 파생으로 교체 — **Phase 5 착수 전 수정 필요 (관찰 #1이 블로커로 전환)**
4. `CHECKOUT_STATS_VARIANTS.pending`에 hero-tier 토큰 추가 여부 결정 필요
5. i18n `priorityBadge`/`priorityHeroAriaLabel`은 generic — 재사용 가능

조건 1, 2, 5는 기존 구조로 무회귀 확장. **조건 3이 유일한 사전 수정 지점.**

---

## Issues found

### Issue #1: `variant="critical"` 하드코딩 — heroVariantKey와 디커플링

- **파일:줄**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:327`
- **Severity**: LOW (현재 버그 아님, **Phase 5 착수 전 블로커로 전환**)
- **현재**: `<HeroKPI ... variant="critical" />` — hero 변형과 무관하게 항상 critical 색상 주입
- **문제**: `selectHeroVariant`가 heroVariantKey('overdue'|'pending'|null)를 결정하는 SSOT인데, host가 `SemanticColorKey('critical')` 매핑을 독립적으로 가짐. Phase 5에서 heroVariantKey='pending'(warning 색상)으로 전환 시 이 라인이 자동으로 바뀌지 않아 overdue 색상이 pending hero에 잘못 적용됨.
- **권장**: `HERO_VARIANT_TO_SEMANTIC: Record<CheckoutStatsVariant, SemanticColorKey>` 맵을 `checkout-hero-selector.ts` 또는 `checkout.ts`에 추가하여 `variant={HERO_VARIANT_TO_SEMANTIC[heroVariantKey]}` 패턴으로 전환. **Phase 5 착수 전 수정 필요**.

### Issue #2: `as Partial<Record<SemanticColorKey, string>>` 캐스트 — 타입 안전성 저하

- **파일:줄**: `apps/frontend/lib/design-tokens/components/checkout.ts:469,475`
- **Severity**: LOW
- `as Partial<Record<SemanticColorKey, string>>` 캐스트는 `satisfies` 패턴을 사용하지 않아 잘못된 SemanticColorKey 오타를 컴파일 시점에 잡지 못함. 다른 도메인 토큰(calibration, disposal)에서 사용하지 않는 패턴으로 단일 선례.
- **권장**: 변경 불필요(현재 크기 작음). Phase 5에서 'warning' 등 키 추가 시 `satisfies` 패턴으로 강화 고려. `{ critical: '...' } satisfies Partial<Record<SemanticColorKey, string>>`.

### Issue #3: Step 45 SKILL.md dead-token 검사 패턴의 변수명 의존성

- **파일:줄**: `.claude/skills/verify-design-tokens/SKILL.md` (Step 45 extension)
- **Severity**: LOW
- 검사 grep이 `tokens\.${token}|hero\.${token}|heroTokens\.${token}` 패턴 — HeroKPI atom에서 `tokens` 변수명을 사용하므로 현재는 hit됨. 단, 변수명 리팩토링 시 miss 가능. verify-* 스킬의 실용적 한계 범위 내.
- **권장**: 추가 조치 불필요.

---

## verify-* skills가 잡을 수 없는 사항 (아키텍처 판단 필요)

1. **variant 하드코딩 vs heroVariantKey SSOT 이탈 (Issue #1)**: grep 기반 스킬은 `"critical"` 문자열이 합당한 다른 용도(badge 스타일 등)와 구분 불가. `selectHeroVariant` → `OutboundCheckoutsTab` 의도 연결까지 추적해야 발견 가능.
2. **Partial<Record> as-cast 타입 안전성 저하 (Issue #2)**: verify-ssot는 import 경로를 검사하며 타입 강도를 평가하지 않음.
3. **useCallback deps filters object identity 문제**: filters가 매 렌더 새 참조임은 상위 컴포넌트 CheckoutsContent의 parseCheckoutFiltersFromSearchParams 추적까지 필요. 단일 파일 분석으로는 판단 불가.
4. **Phase 5 착수 전 변경 필요 조건 (Issue #1)**: 현재는 버그 없음이지만 Phase 5 PR 시 블로커로 전환되는 시차 위험. 설계 연속성 검토에서만 식별 가능.
