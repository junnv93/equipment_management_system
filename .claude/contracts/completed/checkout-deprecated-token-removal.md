---
slug: checkout-deprecated-token-removal
type: contract
date: 2026-04-24
depends: [legacy-actions-block-removal]
sprint: 2
sprint_step: 2.8
---

# Contract: Sprint 2.8 — `@deprecated` 토큰 실제 제거 + `eslint-plugin-deprecation` 활성

## Context

V2 리뷰 L-8 실측: `apps/frontend/lib/design-tokens/components/checkout.ts`에 `@deprecated` 주석이 달린 export가 **여전히 살아있고** 호출처도 잔존 — "제거 시점 약속 없음 + IDE 자동완성 위험".

| 심볼 | 위치 | 호출처 |
|---|---|---|
| `RENTAL_FLOW_INLINE_TOKENS` | L301 | `CheckoutGroupCard.tsx` L50·L77 (RentalFlowInline 함수 내부) — **F-4 dead branch** (Sprint 1.4 flag default ON 이후 도달 불가) |
| `MINI_PROGRESS_STEPS` | L328 | 호출처 없음 (index export만) |
| `CHECKOUT_MINI_PROGRESS.inProgress` (내부 키) | L464-465 | 확인 필요 — `CHECKOUT_MINI_PROGRESS` 자체는 active, 이 키만 alias |
| `CHECKOUT_STATS_CHECKED_OUT` alias | L689 | 호출처 조사 필요 |
| `CHECKOUT_STATS_RETURNED` alias | L694 | 호출처 조사 필요 |
| `CHECKOUT_PURPOSE_STYLES` (@deprecated 언급 L119) | 별도 위치 | 확인 필요 |

**추가 발견**: `apps/frontend/lib/design-tokens/index.ts` L439·L444·L445·L463에서 네 개 모두 re-export 중 → 전수 제거 필요.

사용자 결정(2026-04-24) 연계: "타협 없음, 누락 없음". eslint-plugin-deprecation 활성으로 **향후 `@deprecated` 신규 추가 시 즉시 빨간줄** → drift 방지.

**전제**: Sprint 1.4 (`legacy-actions-block-removal.md`) 완료 → `CheckoutGroupCard.tsx`의 `RentalFlowInline` 렌더 경로가 dead branch. 본 contract에서 `RentalFlowInline` 함수 자체도 삭제.

---

## Scope

### 수정 대상
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - L301-322 `RENTAL_FLOW_INLINE_TOKENS` **export 삭제**
  - L328-332 `MINI_PROGRESS_STEPS` export 삭제
  - L464-465 `CHECKOUT_MINI_PROGRESS.inProgress` 키 삭제 (다른 키로 alias된 경우 호출처 조사 후 `checkedOut` 또는 적절한 키로 마이그레이션)
  - L687-694 `CHECKOUT_STATS_CHECKED_OUT` / `CHECKOUT_STATS_RETURNED` alias **export 삭제** (호출처는 `CHECKOUT_STATS_VARIANTS.checkedOut` / `.returned` 직접 사용으로 치환)
  - L119 `CHECKOUT_PURPOSE_STYLES` 관련 @deprecated 주석 정리 (이미 제거되었으면 주석만 삭제, 아직 export 중이면 제거)
- `apps/frontend/lib/design-tokens/index.ts`
  - L439·L444·L445·L463 re-export 삭제
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - L50 `RENTAL_FLOW_INLINE_TOKENS` import 삭제
  - L71-134 `RentalFlowInline` 함수 **전체 삭제** (Sprint 1.4 이후 dead branch)
  - L388-392 fallback 렌더 분기(flag off용) 삭제 — NextStepPanel 단일 렌더만 유지
- `apps/frontend/package.json`
  - `devDependencies`에 `eslint-plugin-deprecation: ^2.0.0` 추가 (MEMORY.md `feedback_pnpm_overrides_caret` 준수)
- `apps/frontend/.eslintrc.cjs` (또는 `.eslintrc.json`)
  - `plugins: [..., 'deprecation']` 추가
  - `rules: { 'deprecation/deprecation': 'error' }` 추가
- `apps/frontend/lib/design-tokens/__tests__/` (있다면)
  - 제거된 심볼 참조 테스트 삭제

### 조사 필요 (수정 전 grep 필수)
- `CHECKOUT_MINI_PROGRESS.inProgress` 호출처 → 대체 키 결정
- `CHECKOUT_STATS_CHECKED_OUT` / `CHECKOUT_STATS_RETURNED` 호출처 → `CHECKOUT_STATS_VARIANTS.checkedOut` 등으로 치환

### 수정 금지
- `CHECKOUT_STATS_VARIANTS` 본체 (단지 alias만 삭제).
- `CHECKOUT_MINI_PROGRESS.statusToStepIndex` / `stepCount` (Sprint 1.5·2.1에서 다룸).
- backend `@deprecated` 제거 — 본 contract는 frontend 한정.

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` error 0 (deprecation 룰 활성 상태에서) | lint |
| M3 | `checkout.ts`에서 `export const RENTAL_FLOW_INLINE_TOKENS` 0건 | `grep -c "export const RENTAL_FLOW_INLINE_TOKENS" apps/frontend/lib/design-tokens/components/checkout.ts` = 0 |
| M4 | `checkout.ts`에서 `export const MINI_PROGRESS_STEPS` 0건 | `grep -c "export const MINI_PROGRESS_STEPS" apps/frontend/lib/design-tokens/components/checkout.ts` = 0 |
| M5 | `checkout.ts`에서 `CHECKOUT_STATS_CHECKED_OUT` 및 `CHECKOUT_STATS_RETURNED` alias export 0건 | `grep -cE "export const CHECKOUT_STATS_(CHECKED_OUT\|RETURNED)" apps/frontend/lib/design-tokens/components/checkout.ts` = 0 |
| M6 | `index.ts`에서 네 개 심볼 re-export 0건 | `grep -cE "RENTAL_FLOW_INLINE_TOKENS\|MINI_PROGRESS_STEPS\|CHECKOUT_STATS_CHECKED_OUT\|CHECKOUT_STATS_RETURNED" apps/frontend/lib/design-tokens/index.ts` = 0 |
| M7 | `CheckoutGroupCard.tsx`에서 `RentalFlowInline` 함수 0건 | `grep -c "function RentalFlowInline\|const RentalFlowInline" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 |
| M8 | `CheckoutGroupCard.tsx`에서 `RENTAL_FLOW_INLINE_TOKENS` import 0건 | `grep -c "RENTAL_FLOW_INLINE_TOKENS" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 |
| M9 | 프로젝트 전체에서 `RENTAL_FLOW_INLINE_TOKENS` 참조 0건 | `grep -rn "RENTAL_FLOW_INLINE_TOKENS" apps/ packages/ --include="*.ts" --include="*.tsx" \| grep -v ".next"` = 0 hit |
| M10 | 프로젝트 전체에서 `MINI_PROGRESS_STEPS` 참조 0건 | 동일 grep |
| M11 | 프로젝트 전체에서 `CHECKOUT_STATS_CHECKED_OUT` / `_RETURNED` alias 참조 0건 — 호출처는 `CHECKOUT_STATS_VARIANTS.checkedOut` 등으로 치환 완료 | grep |
| M12 | `package.json`에 `eslint-plugin-deprecation: ^2.0.0` (또는 최신 major caret) 추가 | grep 확인 |
| M13 | `.eslintrc.*`에 `'deprecation/deprecation': 'error'` 룰 활성 | grep 확인 |
| M14 | deprecation 룰 작동 증명: 임시로 `/** @deprecated */ export const TEST_DEPRECATED = ...` + 호출 1곳을 추가한 뒤 eslint 실행 시 error 발생 확인(스모크만, 커밋은 원복) | 수동 QA |
| M15 | 본 contract 커밋 diff에 `@deprecated` 주석 남아있지 않음 (체크아웃 도메인) | `grep -n "@deprecated" apps/frontend/lib/design-tokens/components/checkout.ts` — 결과가 있어도 신규 추가 금지, 기존 삭제 대상만 제거 |
| M16 | 변경 파일 = checkout.ts + index.ts + CheckoutGroupCard.tsx + package.json + .eslintrc + (pnpm-lock.yaml) = **최대 6개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 6 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | i18n 키 `checkouts.rentalFlow.*` 고아화 확인 — RentalFlowInline 삭제 시 사용 안 되면 정리 | `checkout-rental-flow-i18n-orphan-cleanup` |
| S2 | backend의 `@deprecated` 심볼 전수 스캔 및 제거 티켓 | `backend-deprecated-audit` |
| S3 | `eslint-plugin-deprecation`에 추가로 `@typescript-eslint/no-deprecated` 조합 여부 검토 (중복 룰이지만 coverage 차이) | `deprecated-rule-combination-study` |
| S4 | 삭제된 심볼에 대한 migration guide 주석/문서 (내부 팀 onboarding용) | `deprecated-migration-guide-doc` |

---

## Verification Commands

```bash
# 0. 사전 조사 — inProgress / CHECKOUT_STATS alias 호출처
grep -rn "CHECKOUT_MINI_PROGRESS.inProgress" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v ".next"
grep -rn "CHECKOUT_STATS_CHECKED_OUT\|CHECKOUT_STATS_RETURNED" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v ".next"
# 결과 분석 후 치환 계획 작성

# 1. 타입 + lint (deprecation 룰 활성 상태)
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint .

# 2. MUST grep (제거 검증)
grep -rn "RENTAL_FLOW_INLINE_TOKENS\|MINI_PROGRESS_STEPS\|CHECKOUT_STATS_CHECKED_OUT\|CHECKOUT_STATS_RETURNED" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v ".next"
# 기대: 0 hit

grep -c "function RentalFlowInline\|const RentalFlowInline" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0

grep -n "eslint-plugin-deprecation" apps/frontend/package.json
# 기대: 1 hit

grep -n "'deprecation/deprecation'" apps/frontend/.eslintrc.cjs apps/frontend/.eslintrc.json 2>/dev/null
# 기대: 1+ hit (파일 형식에 따라)

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 6
```

---

## Acceptance

루프 완료 조건 = MUST 16개 모두 PASS + deprecation 룰 작동 스모크 QA 성공.
향후 `@deprecated` 주석 추가 시 eslint error로 drift 차단.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.4 · `legacy-actions-block-removal.md` — **선행 필수**. `RentalFlowInline` dead branch 상태 보장.
- Sprint 2.1~2.7 — 본 contract 직후 실행 권장 (토큰 layer 정리 마무리 단계).
- Sprint 4.4 · `rental-phase-ui.md` — `CheckoutPhaseIndicator` 신규 구현과 병행. 단 본 contract는 `RentalFlowInline` 삭제만, Phase UI 교체는 별도.
