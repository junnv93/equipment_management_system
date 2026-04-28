# Evaluation — checkouts-phase4-5-wireframe-gaps

**평가일**: 2026-04-28  
**평가자**: QA Agent (skeptical, read-only)  
**대상**: Phase 4.5 (Wireframe GAP 보정 + verify-design-tokens Step 46/47)

---

## Verdict

**ALL MUST PASS**

10개 MUST 기준 전체 PASS. 3개 SHOULD 기준 전체 PASS. 이슈 없음.

---

## MUST results

| # | Criterion | Command | Expected | Actual | Verdict |
|---|-----------|---------|----------|--------|---------|
| MUST-1 | TypeScript PASS | `pnpm --filter frontend exec tsc --noEmit` | exit 0 | exit 0, no output | **PASS** |
| MUST-1b | shared-constants build | `pnpm --filter @equipment-management/shared-constants build` | exit 0 | exit 0 | **PASS** |
| MUST-2 | 단위 테스트 6/6 | `pnpm jest checkout-hero-selector.test` | 6/6 PASS | 6/6 PASS, exit 0 | **PASS** |
| MUST-3 | GAP-1 surfaceVariant token | `grep -n "surfaceVariant" checkout.ts` | ≥1 hit, gradient 포함 | L467-468: `critical: 'bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]'` | **PASS** |
| MUST-3b | GAP-1 surfaceVariant in HeroKPI | `grep -n "surfaceVariant" HeroKPI.tsx` | ≥1 hit | L27: `const surfaceClass = (variant && tokens.surfaceVariant[variant]) \|\| tokens.surface;` | **PASS** |
| MUST-4 | GAP-2 labelVariant token | `grep -n "labelVariant" checkout.ts` | ≥1 hit, text-brand-critical 포함 | L473-474: `critical: 'text-brand-critical'` | **PASS** |
| MUST-4b | GAP-2 labelVariant in HeroKPI | `grep -n "labelVariant" HeroKPI.tsx` | ≥1 hit | L28: `const labelColorClass = (variant && tokens.labelVariant[variant]) \|\| '';` | **PASS** |
| MUST-5 | GAP-3 badge prop signature | `grep -nE "badge\?:.*ReactNode" HeroKPI.tsx` | ≥1 hit | L21: `badge?: ReactNode;` | **PASS** |
| MUST-5b | GAP-3 priorityBadge i18n 주입 | `grep -n "priorityBadge" OutboundCheckoutsTab.tsx` | ≥1 hit | L299-301, L324: heroTokens.priorityBadge + t('outbound.priorityBadge') + badge={priorityBadgeNode} | **PASS** |
| MUST-5c | GAP-3 ko/en parity | `grep -n '"priorityBadge"' ko/checkouts.json en/checkouts.json` | 양쪽 1 hit | ko L496: `"우선"`, en L496: `"Priority"` | **PASS** |
| MUST-6 | GAP-4 sm:col-span-3 제거 | `grep -n "containerInGrid" checkout.ts` | sm:col-span-3 0건 | L465: `containerInGrid: 'col-span-2'` — sm:col-span-3 없음 | **PASS** |
| MUST-6b | GAP-4 host raw col-span 0건 | grep on OutboundCheckoutsTab.tsx + HeroKPISkeleton.tsx | 0 hits | 0 hits | **PASS** |
| MUST-7 | handlePageChange useCallback | grep 양쪽 useCallback | 양쪽 hit | L155: handlePageChange = useCallback([filters, router]), L168: handleSubTabChange = useCallback([filters, router]) | **PASS** |
| MUST-8 | Step 46/47 마커 | `grep -nE "^### Step 46\|^### Step 47" SKILL.md` | 2 hits | L1816: Step 46, L1858: Step 47 | **PASS** |
| MUST-8b | Step 46 ring-2 0건 | `grep -n "focus-visible:ring-2\|ring-offset-2\|focus-visible:ring-offset" button.tsx` | 0 hits | 0 hits | **PASS** |
| MUST-8c | Step 46 outline 패턴 존재 | `grep -n "focus-visible:outline-2.*outline-offset-2.*outline-ring" button.tsx` | 1 hit | L7: outline pattern confirmed | **PASS** |
| MUST-8d | Step 47 compact 금지 클래스 0건 | grep `compact:` for rounded/shadow/p-N/ELEVATION | 0 hits | 0 hits | **PASS** |
| MUST-8e | Step 47 compact layout-only | `grep -nE "compact:.*inline-flex\|compact:.*flex-col" workflow-panel.ts` | 1 hit | L131: `'inline-flex flex-col gap-0.5'` | **PASS** |
| MUST-9 | 신규 토큰 dead-token 0건 | grep callsites for surfaceVariant/labelVariant/hero.priorityBadge | 각 ≥1 hit | surfaceVariant: HeroKPI.tsx L27, labelVariant: HeroKPI.tsx L28, priorityBadge: OutboundCheckoutsTab.tsx L300 | **PASS** |
| MUST-10 | ko/en i18n parity 비빈 문자열 | grep ko/en priorityBadge value | 빈 문자열 아님 | ko: `"우선"`, en: `"Priority"` (모두 비빈 문자열) | **PASS** |

---

## SHOULD results

| # | Criterion | Actual | Verdict |
|---|-----------|--------|---------|
| SHOULD-1 | badge 토큰 SSOT — host hardcoding 0 | `bg-brand-critical/15` 직접 사용 없음. OutboundCheckoutsTab L300: `className={heroTokens.priorityBadge}` 토큰 경유 | **PASS** |
| SHOULD-2 | badge ARIA 의미 부여 | OutboundCheckoutsTab L300: `<span ... aria-hidden="true">` — hero label에 이미 SR 전달, 배지 중복 회피 | **PASS** |
| SHOULD-3 | useCallback deps 정확성 + ESLint 0경고 | `pnpm exec eslint OutboundCheckoutsTab.tsx --quiet` → exit 0 / 0 errors / 0 warnings. deps: [filters, router] 양쪽 | **PASS** |

---

## Wireframe matching matrix (GAP-1/2/3/4)

| GAP | wireframe 사양 | Phase 4.5 구현 | 매칭 | 판정 |
|-----|---------------|---------------|------|------|
| GAP-1 | `linear-gradient(180deg, hsl(--brand-critical / 0.04), hsl(--brand-critical / 0.02))` | `surfaceVariant.critical = 'bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]'` | 100% | **PASS** |
| GAP-2 | `.kpi-hero .kpi-label { color: hsl(var(--brand-critical)) }` | `labelVariant.critical = 'text-brand-critical'`, HeroKPI atom이 variant=critical 시 합성 | 100% | **PASS** |
| GAP-3 | hero 우상단 `<span class="badge badge-danger">우선</span>` | HeroKPI에 `badge?: ReactNode` slot, atom 내부 L34 `{badge}` 렌더, host i18n 주입 (`t('outbound.priorityBadge')`), `aria-hidden="true"` 적용 | 100% | **PASS** |
| GAP-4 | hero+mini 한 줄 정렬 (orphan 0) | `containerInGrid: 'col-span-2'` (sm:col-span-3 제거), sm:grid-cols-6에서 hero(2)+mini(4×1)=6칸 정확 정렬 | 100% | **PASS** |

**sm 그리드 수학 검증:**
- `CHECKOUT_STATS_GRID_TOKENS.withHero = 'grid gap-3 grid-cols-4 sm:grid-cols-6 lg:grid-cols-6'`
- hero: `col-span-2` (변경 후), mini 4개: 각 `col-span-1` (기본)
- sm=6칸: 2 + (4×1) = 6 → 정확히 한 행, orphan 없음 ✓

---

## SSOT / dead-token / hardcoding audit

### SSOT 준수

| 항목 | 위반 여부 | 근거 |
|------|----------|------|
| HeroKPI가 grid/surface/label 토큰 로컬 재정의 | 없음 | `tokens = CHECKOUT_STATS_VARIANTS.hero` 단일 참조. `bg-card`, `col-span`, `bg-gradient`, `text-brand-critical` 등 하드코딩 0건 |
| HeroKPI의 valueColorClass | SSOT 경유 | `getSemanticContainerTextClasses(variant)` — brand helper 경유, 로컬 재정의 없음 |
| OutboundCheckoutsTab badge 스타일 | SSOT 경유 | `heroTokens.priorityBadge` — checkout.ts 토큰 경유. `bg-brand-critical/15` 직접 없음 |
| HeroKPISkeleton containerInGrid | SSOT 경유 | `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 참조, raw `col-span-2` 없음 |

### Dead token 검사 (신규 토큰 3종)

| 토큰 | 정의 위치 | 사용처 | Dead 여부 |
|------|----------|--------|----------|
| `surfaceVariant.critical` | checkout.ts L467-469 | HeroKPI.tsx L27 | **LIVE** |
| `labelVariant.critical` | checkout.ts L473-474 | HeroKPI.tsx L28 | **LIVE** |
| `priorityBadge` | checkout.ts L476 | OutboundCheckoutsTab.tsx L300 | **LIVE** |

### Hardcoding 검사

- `OutboundCheckoutsTab.tsx` 내 raw `bg-brand-critical/15`: **0건** ✓
- `HeroKPI.tsx` 내 raw CSS color/gradient: **0건** ✓
- `HeroKPISkeleton.tsx` 내 raw `col-span`: **0건** ✓

---

## Step 46/47 self-execution validation

### Step 46: Button base cva ring-offset 회귀 방지

```bash
grep -n "focus-visible:ring-2|ring-offset-2|focus-visible:ring-offset" button.tsx
# 결과: 0 hits → PASS (ring 패턴 없음)

grep -n "focus-visible:outline-2.*outline-offset-2.*outline-ring" button.tsx
# 결과: 1 hit (L7) → PASS (outline 패턴 존재)
```

**판정: PASS** — Step 46의 탐지 명령어가 현재 코드베이스에서 올바른 PASS 상태를 산출함.

### Step 47: compact 컨테이너 토큰 elevation/shadow/rounded/padding 0 원칙

```bash
grep -nE "compact:\s*['\"\`]" workflow-panel.ts | grep -E "\brounded-[a-z]|\bshadow-[a-z]|\bp-[0-9]|ELEVATION_TOKENS"
# 결과: 0 hits → PASS (금지 클래스 없음)

grep -rnE "compact:.*ELEVATION_TOKENS|compact:.*\brounded-[a-z]|..." components/
# 결과: 0 hits → PASS

grep -nE "compact:\s*['\"\`].*inline-flex|compact:\s*['\"\`].*flex-col" workflow-panel.ts
# 결과: L131 hit → PASS (layout-only 값 확인)
```

**판정: PASS** — Step 47의 탐지 명령어가 현재 코드베이스에서 올바른 PASS 상태를 산출함. false positive 없음.

---

## Issues found

**없음.**

모든 MUST/SHOULD 기준이 충족되었으며, SSOT 위반, dead token, 하드코딩, 타입 오류, 린트 경고를 포함한 어떤 문제도 발견되지 않음.

---

## Iteration tracking

이전 반복 대비 변화: **first iteration** (본 contract에 대한 첫 번째 평가)

---

## 추가 관찰사항 (이슈 아님 — 정보 목적)

1. **HeroKPI의 `getSemanticContainerTextClasses` 사용**: `valueColorClass`(숫자 색상)에만 사용되며 surface/label에는 사용되지 않음. SSOT 준수 방식이 일관됨.

2. **sm grid math**: 이전 Phase에서 GAP-4로 지적된 sm:col-span-3(hero 3칸 + mini 4칸 = 7칸 > 6칸 = orphan 발생)가 col-span-2로 수정되어 6칸 정합이 달성됨. 수학적으로 정확히 검증됨.

3. **badge 위치**: badge 슬롯이 atom 내부의 `flex items-start justify-between` 행에서 label 우측에 배치됨 — wireframe의 "hero 우상단 배지" 구조와 일치.

4. **Step 46/47 탐지 명령어 정확도**: 두 Step의 grep 명령어가 false positive 없이 정확한 PASS 신호를 생성함. 회귀 차단 게이트로 정상 작동 가능.
