# Contract — Checkouts Phase 4.5 (Wireframe GAP 보정 + verify Step 46/47)

> **Mode**: 1 (Lightweight)
> **Slug**: `checkouts-phase4-5-wireframe-gaps`
> **Generated**: 2026-04-28 (Sprint 22-항목 매트릭스 #4 wireframe 100% 정합 보강)

## 작업 목표

Phase 4 P1-1(KPI 1-hero + 3-mini)의 wireframe 매칭률 ~72%를 100%로 끌어올림. wireframe-match.md
GAP-1/GAP-2/GAP-3/GAP-4를 SSOT 토큰 기반으로 보정하고, 본 세션에서 도입한 button outline focus +
NextStepPanel compact elevation-0 정책을 verify-design-tokens Step 46/47로 회귀 차단.

## 변경 파일 (5개)

| # | 파일 | 변경 요약 |
|---|------|-----------|
| 1 | `apps/frontend/lib/design-tokens/components/checkout.ts` | hero 토큰 분리: `surface`/`surfaceVariant`/`elevation` + `label`/`labelVariant` + `priorityBadge` 추가, `containerInGrid` sm:col-span-3→col-span-2 |
| 2 | `apps/frontend/components/checkouts/HeroKPI.tsx` | atom: `badge?: ReactNode` slot 추가, variant 기반 surface/label color 합성 (atom 내부) |
| 3 | `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` | HeroKPI에 priority badge 주입 + handlePageChange/handleSubTabChange useCallback |
| 4 | `apps/frontend/messages/{ko,en}/checkouts.json` | `outbound.priorityBadge` 신규 키 (ko/en parity) |
| 5 | `.claude/skills/verify-design-tokens/SKILL.md` | Step 46(button base cva ring 회귀) + Step 47(container.compact elevation-0) 추가 |

> 추가 영향: `HeroKPISkeleton.tsx`는 `containerInGrid` 토큰 참조만 — 자동 미러링되므로 코드 수정 불필요.

---

## MUST 기준 (FAIL 시 루프 차단)

### MUST-1: Build / TypeCheck PASS

```bash
cd apps/frontend && pnpm exec tsc --noEmit
# expected: exit 0
pnpm --filter @equipment-management/shared-constants build
# expected: exit 0
```

### MUST-2: 단위 테스트 PASS

```bash
cd apps/frontend && pnpm jest checkout-hero-selector.test
# expected: 6/6 PASS (회귀 0)
```

### MUST-3: GAP-1 (hero surface gradient) 적용

`CHECKOUT_STATS_VARIANTS.hero.surfaceVariant.critical`에 wireframe 그라디언트가 정확히 매핑.

```bash
grep -n "surfaceVariant" apps/frontend/lib/design-tokens/components/checkout.ts
# expected: ≥ 1 hit, value contains 'bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]'

# atom이 surfaceVariant 분기로 합성 — variant=critical일 때 그라디언트 적용
grep -n "surfaceVariant" apps/frontend/components/checkouts/HeroKPI.tsx
# expected: ≥ 1 hit
```

### MUST-4: GAP-2 (hero label color) 적용

`CHECKOUT_STATS_VARIANTS.hero.labelVariant.critical`에 `text-brand-critical` 토큰 추가, atom이 합성.

```bash
grep -n "labelVariant" apps/frontend/lib/design-tokens/components/checkout.ts
# expected: ≥ 1 hit, value contains 'text-brand-critical'

grep -n "labelVariant" apps/frontend/components/checkouts/HeroKPI.tsx
# expected: ≥ 1 hit
```

### MUST-5: GAP-3 (HeroKPI badge slot) 적용

HeroKPI atom signature에 `badge?: ReactNode` optional prop이 추가되고, OutboundCheckoutsTab이 i18n 키
`outbound.priorityBadge`로 주입. atom 외부 wrapper 합성이 아닌 atom 내부 slot 패턴.

```bash
grep -nE "badge\?:\s*ReactNode|badge\?:\s*React\.ReactNode" apps/frontend/components/checkouts/HeroKPI.tsx
# expected: ≥ 1 hit (props interface)

grep -n "outbound.priorityBadge\|priorityBadge" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# expected: ≥ 1 hit (i18n 키 사용)

grep -n "\"priorityBadge\"" apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json
# expected: 양쪽 1 hit (parity 보장)
```

### MUST-6: GAP-4 (sm grid orphan 제거) — hero col-span-2 통일

`containerInGrid`가 `col-span-2` 단일(또는 명시적 sm:col-span-2)로 변경되어 sm에서도 hero(2)+mini(4×1)=6칸으로 정확 정렬.

```bash
grep -n "containerInGrid" apps/frontend/lib/design-tokens/components/checkout.ts
# expected: containerInGrid 값에 'sm:col-span-3' 0건 (수정 후)

# host wrapper에서 raw col-span 미사용 (Step 45 회귀 방지)
grep -nE '\b(col-span|grid-cols)-\d' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/components/checkouts/HeroKPISkeleton.tsx
# expected: 0 hits
```

### MUST-7: SHOULD-2 (useCallback 방어적 적용) 처리

`handlePageChange` + `handleSubTabChange` 양쪽 useCallback 적용. deps 배열에 `filters`, `router` 정확 포함.

```bash
grep -nB1 -A1 "handlePageChange = useCallback\|handleSubTabChange = useCallback" \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# expected: 양쪽 hit
```

### MUST-8: verify-design-tokens Step 46/47 추가

SKILL.md에 두 Step이 추가되고, 각 Step의 탐지 명령어가 현재 코드베이스에서 PASS 결과 산출.

```bash
# Step 46/47 마커 존재
grep -nE "^### Step 46|^### Step 47" .claude/skills/verify-design-tokens/SKILL.md
# expected: 2 hits

# Step 46 자체 검증 — button base cva에 ring-2 / ring-offset-2 패턴 0건 (현재 outline 패턴)
grep -n "focus-visible:ring-2\|ring-offset-2\|focus-visible:ring-offset" \
  apps/frontend/components/ui/button.tsx
# expected: 0 hits

# Step 47 자체 검증 — container.compact에 elevation/shadow/rounded/padding 0건
grep -n "compact:" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  | head -20
# expected: container.compact 라인 검색 시 'inline-flex flex-col gap-0.5' 단일 (ELEVATION/shadow/rounded/p-N 0건)
```

### MUST-9: 토큰 dead-token 0건

추가된 `surfaceVariant.critical` / `labelVariant.critical` / `priorityBadge` 모두 atom 또는 host에서 호출.

```bash
# 신규 토큰 호출처 존재
grep -rn "surfaceVariant\|labelVariant\|hero\.priorityBadge\|hero.priorityBadge" \
  apps/frontend/components apps/frontend/app
# expected: 각 ≥ 1 hit
```

### MUST-10: ko/en i18n parity

`outbound.priorityBadge` 키가 ko/en 양쪽에 정의되고 빈 문자열 아님.

```bash
grep -A0 "\"priorityBadge\"" apps/frontend/messages/ko/checkouts.json
# expected: "priorityBadge": "우선" 또는 유사 (빈 문자열 아님)

grep -A0 "\"priorityBadge\"" apps/frontend/messages/en/checkouts.json
# expected: "priorityBadge": "Priority" 또는 유사 (빈 문자열 아님)
```

---

## SHOULD 기준 (실패 시 tech-debt-tracker 등록 후 진행)

### SHOULD-1: badge 토큰 SSOT — host hardcoding 0

`outbound.priorityBadge` 시각 스타일은 `CHECKOUT_STATS_VARIANTS.hero.priorityBadge` 토큰 경유.
host(OutboundCheckoutsTab)에 raw `bg-brand-critical/15` 등 직접 클래스 없음.

```bash
grep -n "bg-brand-critical/15" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# expected: 0 hits (토큰 경유)
```

### SHOULD-2: badge ARIA 의미 부여

배지가 단순 시각 강조라면 `aria-hidden="true"`로 SR 중복 회피, 또는 aria-label에 "우선 항목" 명시.
hero 카드 wrapper의 `aria-label={t(card.labelKey)}`이 이미 "기한 초과"를 SR에 전달하므로
"우선" 배지는 `aria-hidden="true"`가 적절 (이중 안내 방지).

### SHOULD-3: handlePageChange / handleSubTabChange deps 정확성

useCallback deps에 `filters`, `router` 모두 포함. ESLint react-hooks/exhaustive-deps 경고 0.

```bash
cd apps/frontend && pnpm exec eslint 'app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' --quiet
# expected: 0 errors / 0 warnings
```

---

## Out-of-scope (이번 contract 미포함)

- **GAP-5 (overdue=0 시 hero border 소실)**: heroVariantKey=null이면 hero 미렌더링 → 실용 무관
- **GAP-6 (kpi-meta / kpi-delta / dynamic sub-text)**: Phase 4.6 — 백엔드 API 변경 동반
- **SparklineMini 실데이터**: Phase 4.6 분리
- **dashboard PendingApprovalCard alertRing 토큰화**: 별도 PR (tech-debt-tracker)
- **HeroKPI atom React.memo**: 별도 PR (tech-debt-tracker)
- **Proposal A (review-design "host wrapper 정책 합성, atom prop 불변" 원칙 추가)**: 우선순위 낮음

---

## 시니어 원칙 4-축 자가 점검

| 축 | 처리 방식 |
|---|---|
| **SSOT** | hero 모든 시각 정책(`surface/surfaceVariant/elevation/label/labelVariant/priorityBadge`)이 단일 토큰 객체에 집중. atom은 토큰 참조만 |
| **하드코딩 0** | gradient/배지 색상/grid 모두 토큰화. raw `grid-cols`/`bg-gradient`/`bg-brand-critical/15` 호출처 0건 |
| **워크플로/성능** | atom signature는 optional prop 추가만 → backwards compatible. handlePageChange/handleSubTabChange useCallback로 future memo 회귀 차단 |
| **접근성** | priority badge `aria-hidden="true"` (hero label에 이미 "기한 초과" SR 전달). useCallback 적용으로 ARIA prop referential stability 유지 |
| **i18n** | `outbound.priorityBadge` ko/en parity, MUST-10에서 자동 검증 |
| **다크모드** | brand-critical CSS 변수 자동 전환. `bg-gradient` arbitrary opacity는 brand var 기반이라 dark에서도 정합 |
| **검증 게이트** | Step 46(button) + Step 47(compact) 추가로 본 세션 도입 정책 회귀 자동 차단 |

---

## 정합성 매트릭스 (Wireframe 100% 매칭 검증)

| GAP | wireframe 사양 | Phase 4.5 처리 후 | 매칭 |
|---|---|---|---|
| GAP-1 | `linear-gradient(180deg, hsl(--brand-critical / 0.04), hsl(--brand-critical / 0.02))` | `bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]` (token: `surfaceVariant.critical`) | 100% |
| GAP-2 | `kpi-label { color: brand-critical }` | atom이 variant=critical일 때 `labelVariant.critical = 'text-brand-critical'` 합성 | 100% |
| GAP-3 | hero 우상단 `<span class="badge badge-danger">우선</span>` | atom `badge?: ReactNode` slot, host i18n 주입, `priorityBadge` 토큰 스타일 | 100% |
| GAP-4 | hero + mini 한 줄 정렬 (orphan 0) | sm/lg 모두 hero=2칸, mini=1칸×4 → 6칸 정확 | 100% |
| GAP-5 | (실용 무관) | hero 미렌더링 시 border 무관 | N/A |
| GAP-6 | (Phase 4.6) | API 변경 필요 — out-of-scope | N/A |
| GAP-7 | (이미 처리됨) | aria-current 비표준 제거 완료 (Phase 4 후속) | 100% |
