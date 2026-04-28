# Evaluation — Phase 4 P1-1 KPI 1-hero + 3-mini

> Iteration: 1
> Evaluator: sonnet (skeptical QA)
> Date: 2026-04-28

---

## Verdict

OVERALL: **PASS** (M-1 ~ M-10 전부 통과) — 단, SHOULD 수준 결함 2건 + 루프 종료 조건 미충족 1건 존재

---

## MUST 기준

| ID | Criterion | Evidence | Verdict |
|---|---|---|---|
| M-1 | tsc 0 errors | `pnpm exec tsc --noEmit` → EXIT 0 | **PASS** |
| M-1 | frontend build 0 errors | `pnpm --filter frontend build` → BUILD_EXIT 0, 신규 warning 없음 | **PASS** |
| M-1 | shared-constants build | EXIT 0 (`rimraf dist && tsc -p tsconfig.json --skipLibCheck`) | **PASS** |
| M-2 | hero selector SSOT | `grep -rnE 'summary\.overdue\s*>\s*0\s*\?' app/ components/ lib/` → EXIT_CODE 1 (0 hits). `isAlert` 계산의 `summary.overdue > 0` (line 267)은 3항 연산자 없음 — 컨트랙트 grep 패턴 기준 적법 | **PASS** |
| M-3 | unit test 6+ PASS | Jest: 6/6 PASS in 0.638s (overdue=0/1/10 × pending=0/15 매트릭스 + 순수함수 테스트) | **PASS** |
| M-4 | containerInGrid token | `grep -nE '\bcol-span-[0-9]' OutboundCheckoutsTab.tsx HeroKPISkeleton.tsx` → M4_EXIT 1 (0 hits) | **PASS** |
| M-5 | grid SSOT | `grep -nE 'grid-cols-[0-9]' OutboundCheckoutsTab.tsx HeroKPISkeleton.tsx` → M5_EXIT 1 (0 hits) | **PASS** |
| M-6 | a11y semantics | hero wrapper에 `role="button"` (line 290) + `tabIndex={0}` (line 291) + `aria-label={t(card.labelKey)}` (line 294) + `aria-pressed={isActive}` (line 292) + `aria-current={isHero ? 'true' : undefined}` (line 293) + `onKeyDown` Enter/Space+preventDefault (lines 296-300). `hero.alertRing='ring-1 ring-brand-critical/20'` — ring-1이 ring weight 포함하여 색상 단독 의존 회피 | **PASS** |
| M-7 | alertRing token (checkouts) | `grep -rn 'ring-1 ring-brand-critical\|ring-2 ring-brand-critical' app/(dashboard)/checkouts/ components/checkouts/` → M7_BROAD_EXIT 1 (0 hits). OutboundCheckoutsTab에서 `heroTokens.alertRing` 토큰 경유(line 282) | **PASS** |
| M-8 | referential stability | `useStatCards(summary)` — 함수 내부 `return useMemo(...)` (lines 69-118, deps=[summary.total, summary.pending, summary.approved, summary.overdue, summary.returnedToday]). `selectHeroVariant` 결과 `useMemo` (lines 237-240, deps=[summary.overdue, summary.pending]). `handleStatActivate` `useCallback` (lines 246-255, deps=[onResetFilters, onStatCardClick]) | **PASS** |
| M-9 | i18n parity | `diff <(jq keys[] ko/checkouts.json) <(jq keys[] en/checkouts.json)` → DIFF_EXIT 0 (신규 키 0건) | **PASS** |
| M-10 | verify skill steps added | verify-design-tokens Step 45 (line 1761) + verify-hardcoding Step 31 (line 732) + verify-ssot Step 41 (line 1159) 모두 추가됨. Step 내용과 grep 패턴 정확성 검증 완료 | **PASS** |

---

## Self-matrix Spot-check

Generator가 14행 모두 PASS라 주장. 5행 독립 검증:

| 행 | 검증 항목 | 실측 | Generator 주장 일치 |
|---|---|---|---|
| 5 | Hero card col-span (containerInGrid 결과) | `CHECKOUT_STATS_VARIANTS.hero.containerInGrid = 'col-span-2 sm:col-span-3 lg:col-span-2'` — HeroKPISkeleton line 30, OutboundCheckoutsTab line 280에서 `heroTokens.containerInGrid` 사용 | **일치** |
| 6 | Hero card alert ring | `CHECKOUT_STATS_VARIANTS.hero.alertRing = 'ring-1 ring-brand-critical/20'` (checkout.ts line 466). 주의: `CHECKOUT_STATS_VARIANTS.overdue.alertRing = 'ring-2 ring-brand-critical/30 ...'`(line 420)는 별개 — host는 `heroTokens.alertRing` 사용 | **일치** |
| 7 | aria-current="true" | `aria-current={isHero ? 'true' : undefined}` (OutboundCheckoutsTab line 293) | **일치** |
| 13 | Dark mode 자동 전환 (dark: prefix 0건) | `grep -n 'dark:bg-brand\|dark:text-brand\|dark:ring-brand' OutboundCheckoutsTab.tsx HeroKPISkeleton.tsx` → 0 hits | **일치** |
| 14 | reduced-motion | `CHECKOUT_LOADING_SKELETON_TOKENS.base = 'animate-pulse rounded-md bg-muted motion-reduce:animate-none'` — HeroKPISkeleton에서 기존 토큰 그대로 보존 | **일치** |

---

## Out-of-scope 검증

| 항목 | 검증 방법 | 결과 |
|---|---|---|
| HeroKPI atom signature | 직접 파일 검사: `{label: string, value: number, trend?: ..., variant?: SemanticColorKey}` — 변경 없음 | **미변경 확인** |
| SparklineMini | `git diff HEAD -- SparklineMini.tsx` → 0 변경 | **미변경 확인** |
| InboundCheckoutsTab | `git diff HEAD -- InboundCheckoutsTab.tsx` → 0 변경 | **미변경 확인** |
| CheckoutSummary 백엔드 타입 확장 | Phase 4 변경 파일 목록에 없음 | **미변경 확인** |

---

## SHOULD Findings (tech-debt 후보)

### S-SHOULD-1: verify-hardcoding SKILL.md의 Step 30 중복 정의

**파일**: `.claude/skills/verify-hardcoding/SKILL.md`
**위치**: line 570 + line 702 각각 `### Step 30:` 헤더

- line 570 `### Step 30`: "외부 브랜드 자산 `lib/brand-assets/` 모듈 분리 강제 (2026-04-28 추가)"
- line 702 `### Step 30`: "Atom 내부 사이즈 클래스 토큰 경유 — `h-3 w-3` 등 raw Tailwind 사이즈 직접 사용 금지 (2026-04-28 추가)"

두 Step이 같은 번호를 사용 → `/verify-hardcoding` 실행 시 Step 30 기준이 어느 것인지 모호. Phase 4가 추가한 Step 31은 실제로 세 번째 "Step 30+" 등록이 됨.

**처리 권고**: 뒤쪽 Step 30 (line 702)을 Step 30-b 또는 Step 32로 renumber. M-10 MUST 기준(Step 31 존재 여부)은 영향받지 않으므로 loop 차단 불필요 — tech-debt-tracker 등록 후 별도 PR.

---

### S-SHOULD-2: trend="flat" 하드코딩 (SparklineMini 플레이스홀더)

**파일**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:380`
**코드**: `<SparklineMini values={sparklineValues} trend="flat" variant="info" />`

플랜(8.4절)에서 "trend prop 'up' → undefined 변경" 트레이드오프를 결정하고 `HeroKPI` 호출에는 `trend` 미전달(정상). 그러나 동일 파일 SparklineMini 플레이스홀더에는 `trend="flat"` 하드코딩이 남아 있음. Phase 4 boundary 내 SparklineMini 관련 변경은 out-of-scope로 명시되어 있으므로 M-10 대상 아님. S-3 (trend prop 동적 derive) tech-debt로 이미 분류 완료.

---

## Issues Discovered (FAIL items)

**MUST 기준 FAIL 없음.**

---

## 루프 종료 조건 상태

Contract §"Loop 종료 조건" 기준 평가:

| 조건 | 상태 |
|---|---|
| M-1 ~ M-10 전부 PASS | **PASS** |
| 자가 매트릭스 14행 전부 PASS | **PASS** (5행 독립 검증, 나머지 코드 검사로 간접 확인) |
| 4개 commit (4.A/4.B/4.C/4.D) main에 push 완료 | **미충족** — 파일들이 untracked/unstaged 상태 (`git status` 확인). `checkout-hero-selector.ts`, `checkout-hero-selector.test.ts`는 untracked, 나머지 9개 수정 파일은 unstaged |
| review-architecture Critical 0 / Warning ≤ 2 | **미실행** — Evaluator 스코프 외 |
| Phase 5 핸드오프 문서 | **미작성** — Evaluator 스코프 외 |

---

## Next Action

M-1 ~ M-10 **전부 PASS** — Generator 재호출 불필요.

단, **루프 종료 조건 충족을 위해 다음 작업 필요**:

1. **커밋 미완료**: Phase 4.A/4.B/4.C/4.D 파일이 unstaged/untracked 상태. Generator(또는 사용자)가 `git add` + `git commit` 4회(또는 통합 1회) 실행 후 `git push` 필요.
2. **review-architecture 실행**: `/review-architecture` 스킬 실행 → Critical 0, Warning ≤ 2 확인.
3. **Phase 5 핸드오프 문서 작성**: 다음 세션 진입점 문서 신규.
4. **SHOULD-1 정리 (선택)**: verify-hardcoding Step 30 중복 → renumber (별도 commit).

**추천 순서**: Step 7 (commit → push → review-architecture) → PASS 확인 시 Phase 5 진입.
