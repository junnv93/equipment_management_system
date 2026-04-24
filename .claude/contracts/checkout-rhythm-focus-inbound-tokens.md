---
slug: checkout-rhythm-focus-inbound-tokens
type: contract
date: 2026-04-24
depends: []
sprint: 2
sprint_step: 2.5, 2.6, 2.7
---

# Contract: Sprint 2.5·2.6·2.7 — 섹션 리듬 단일화 + FOCUS_TOKENS.ringCurrent 신설 + Inbound container `pl-4` 흡수

## Context

V2 리뷰 L-5·L-6·L-7 실측:

1. **L-5 (P2)**: `CheckoutsContent.tsx` L345·L384, `OutboundCheckoutsTab.tsx` L268 등에서 `mb-3`/`mb-4`/`mb-5` 혼용. `SECTION_RHYTHM_TOKENS`(`semantic.ts` L274)는 이미 존재(`tight`, `comfortable`, `spacious`, `dramatic`)하지만 **소비 지점이 raw class 찍음**. 동일한 "섹션 사이 간격"이 선언부마다 다름.

2. **L-6 (P2)**: `checkout.ts` L364
   ```typescript
   current: {
     node: 'bg-brand-info/15 ring-2 ring-brand-info ring-offset-2',  // ← magic
     ...
   }
   ```
   `FOCUS_TOKENS`(`semantic.ts` L320)는 이미 존재하지만 "현재 진행 중 step highlight용 ring" variant가 없음. Stepper current 노드와 HeroKPI active, Stats card active가 각각 다른 raw ring class 사용 → 일관성 없음. 신규 variant `ringCurrent`가 공용 소스여야 함.

3. **L-7 (P2)**: `InboundCheckoutsTab.tsx` L246·L300·L418에서 `'pl-4'`를 `CHECKOUT_INBOUND_SECTION_TOKENS.container` 옆에 수동으로 붙임 — 3번 반복. `border-l-4`와 `pl-4`는 항상 동반되어야 하는 쌍(border width 4px만큼 padding 필요)인데 분리 선언.

본 contract는 세 건을 한 묶음으로 처리 — 모두 "토큰 존재 but 소비 지점 누수"의 기계적 치환 + 1건 신규 variant(FOCUS_TOKENS.ringCurrent).

---

## Scope

### 수정 대상
- `apps/frontend/lib/design-tokens/semantic.ts`
  - `FOCUS_TOKENS.classes`에 `ringCurrent` variant 신설:
    ```typescript
    classes: {
      default: '...',
      brand: '...',
      onDark: '...',
      /** "현재 진행 중" 상태 표시용 ring — Stepper current node, HeroKPI active, Stats active */
      ringCurrent: 'ring-2 ring-brand-info ring-offset-2',
    }
    ```
    (focus-visible prefix 없음 — 현재 상태 표시는 상시 ring이지 focus 상태 아님)
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - L364 `current.node`의 raw `ring-2 ring-brand-info ring-offset-2` → `FOCUS_TOKENS.classes.ringCurrent` 참조:
    ```typescript
    current: {
      node: `bg-brand-info/15 ${FOCUS_TOKENS.classes.ringCurrent}`,
      ...
    }
    ```
  - L779 `CHECKOUT_INBOUND_SECTION_TOKENS.container`에 `pl-4` 흡수:
    ```typescript
    container: 'space-y-3 pl-4',  // border-l-4와 동반 padding 포함
    ```
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - L246·L300·L418 각 3개 array에서 `'pl-4'` 요소 제거 (container에 흡수됨)
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
  - 섹션 간 간격 `mb-3`/`mb-4`/`mb-5` 사용처 전수 스캔 후 적절 variant로 교체. 기본 방침:
    - "동일 섹션 내부 헤더+서브타이틀 간격" → `SECTION_RHYTHM_TOKENS.tight` (space-y-3)
    - "섹션과 콘텐츠 사이" → `SECTION_RHYTHM_TOKENS.comfortable` (space-y-5)
    - "그룹 경계" → `SECTION_RHYTHM_TOKENS.spacious`
    - 컨테이너에 `space-y-*` 적용이 자연스러운 곳은 `mb-*` 대신 상위 컨테이너에 `space-y-*` 부여. `mb-*`를 억지로 토큰화하지 말고 **구조 자체를 `space-y-*` 기반으로 전환** 권장.
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — 동일 원칙.

### 수정 금지
- `FOCUS_TOKENS.classes.default`/`brand`/`onDark` 기존 값. `ring.width`/`ring.offset` 수치 상수.
- `SECTION_RHYTHM_TOKENS` 기존 `tight`/`comfortable`/`spacious`/`dramatic` 값.
- `CHECKOUT_INBOUND_SECTION_TOKENS`의 `borderAccent`·`header`·`iconContainer` 구조.
- 다른 ring-offset-* 사용처 (`header.ts`, `software.ts`, `team.ts` 등) — 본 contract는 checkout 도메인 한정.

### 신규 생성
- (없음)

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint <수정 파일들>` error 0 | lint |
| M3 | `FOCUS_TOKENS.classes`에 `ringCurrent` key 존재 | `grep -n "ringCurrent:" apps/frontend/lib/design-tokens/semantic.ts` = 1 hit |
| M4 | `FOCUS_TOKENS.classes.ringCurrent` 값에 `ring-2 ring-brand-info ring-offset-2` 포함 | grep 확인 |
| M5 | `checkout.ts` L364 부근 raw `ring-2 ring-brand-info ring-offset-2` 패턴 0건 | `grep -c "ring-2 ring-brand-info ring-offset-2" apps/frontend/lib/design-tokens/components/checkout.ts` = 0 |
| M6 | `checkout.ts`의 stepper `current.node`가 `FOCUS_TOKENS.classes.ringCurrent` 참조 | grep 확인 |
| M7 | `CHECKOUT_INBOUND_SECTION_TOKENS.container`에 `pl-4` 포함 | `grep -n "container: 'space-y-3 pl-4'" apps/frontend/lib/design-tokens/components/checkout.ts` = 1 hit (또는 동등 표현) |
| M8 | `InboundCheckoutsTab.tsx`에서 `'pl-4'` 리터럴 0건 | `grep -c "'pl-4'" 'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx'` = 0 |
| M9 | `CheckoutsContent.tsx`·`OutboundCheckoutsTab.tsx`에서 섹션 간격용 raw `mb-3`/`mb-4`/`mb-5` 잔존 0건 (card 내부 UI 예외는 주석으로 구분) | `grep -cE " mb-(3\|4\|5)[ \"']" <2 파일>` = 0 (또는 허용 케이스 SHOULD에 명시) |
| M10 | `CheckoutsContent.tsx`·`OutboundCheckoutsTab.tsx`에서 `SECTION_RHYTHM_TOKENS` 또는 `getSectionRhythm(...)` 호출 1회 이상 | `grep -c "SECTION_RHYTHM_TOKENS\|getSectionRhythm" <2 파일>` >= 2 |
| M11 | 시각 회귀 없음 — Playwright screenshot 비교(CheckoutsContent 메인, Outbound 목록, Inbound 3-section) 차이 ≤ 1% | `pnpm --filter frontend run test:e2e -- --reporter=html <screenshot 시나리오>` |
| M12 | Stepper current 노드의 실제 렌더 시 ring 시각 유지 — E2E에서 current-node 요소에 `ring-2` 클래스 적용 확인 | `expect(page.locator('[data-step-status="current"]')).toHaveClass(/ring-2/)` |
| M13 | 변경 파일 = semantic.ts + checkout.ts + InboundCheckoutsTab.tsx + CheckoutsContent.tsx + OutboundCheckoutsTab.tsx = **5개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` = 5 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | HeroKPI active + Stats card active도 `FOCUS_TOKENS.classes.ringCurrent` 경유하도록 전수 전환 | `hero-stats-ring-current-adoption` |
| S2 | `ring-offset-*` 잔존 위치(header.ts·software.ts·team.ts) 전수 스캔 후 공용 토큰 마이그레이션 계획 수립 | `ring-offset-global-audit` |
| S3 | `CHECKOUT_INBOUND_SECTION_TOKENS.container`가 `pl-4`+`border-l-4`+`space-y-3`을 **원자 단위**로 제공 → variant 호출부가 border/padding 분리 선언 불필요 | `inbound-section-atomic-token` |
| S4 | `mb-*` 하드코딩 잔존 여부 린트 룰 추가 (.eslintrc에 custom rule 또는 verify-design-tokens skill 확장) | `mb-hardcoding-lint-rule` |
| S5 | Stepper current의 ring 색이 "진행 중"(info) 고정인데 "경고 진행 중"·"critical 진행 중" variant 필요성 논의 — 현재 overdue는 background tint만 다름 | `stepper-current-variant-by-urgency` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/lib/design-tokens/semantic.ts \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'

# 2. MUST grep
grep -c "ringCurrent" apps/frontend/lib/design-tokens/semantic.ts
# 기대: 1+

grep -c "ring-2 ring-brand-info ring-offset-2" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 0

grep -c "FOCUS_TOKENS.classes.ringCurrent" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1+

grep -n "container: 'space-y-3 pl-4'" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1 hit

grep -c "'pl-4'" 'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx'
# 기대: 0

grep -cE ' mb-(3|4|5)[ "'\'']' \
  'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 0 (또는 허용 예외 문서화)

grep -c "SECTION_RHYTHM_TOKENS\|getSectionRhythm" \
  'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 2+

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 5
```

---

## Acceptance

루프 완료 조건 = MUST 13개 모두 PASS + Playwright screenshot 회귀 ≤ 1%.
SECTION_RHYTHM/FOCUS_TOKENS/INBOUND_SECTION 3개 토큰이 소비 지점에서 SSOT로 수렴.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 2.1·2.2 · `checkout-row-token-consolidation.md`
- Sprint 2.3·2.4 · `checkout-i18n-tab-badge-tokens.md`
- Sprint 2.8 · `checkout-deprecated-token-removal.md` — 본 contract의 `CHECKOUT_INBOUND_SECTION_TOKENS` 정리와 유사 맥락.
- Sprint 5.4 · `checkout-density-rhythm.md` (Sprint 5 contract, 추후 작성) — 행 64px cozy 기본화. 본 contract의 섹션 간격 토큰이 선행 기반.
