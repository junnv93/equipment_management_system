# Evaluation: loading-skeleton-pr19
Date: 2026-04-24
Iteration: 1 → updated in Iteration 2

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | tsc --noEmit 0 error | PASS | `pnpm --filter frontend exec tsc --noEmit` → 0 출력 (오류 없음) |
| M2 | CHECKOUT_LOADING_SKELETON_TOKENS re-export | PASS | `apps/frontend/lib/design-tokens/index.ts:480: export { CHECKOUT_LOADING_SKELETON_TOKENS } from './components/checkout-loading-skeleton';` |
| M3 | 3 skeleton files exist | PASS | HeroKPISkeleton.tsx, NextStepPanelSkeleton.tsx, CheckoutGroupCardSkeleton.tsx 모두 존재 |
| M4 | 3 error files exist | PASS | HeroKPIError.tsx, NextStepPanelError.tsx, WorkflowTimelineError.tsx 모두 존재 |
| M5 | Spinner 사용 없음 | PASS | checkouts/ 디렉토리 전체 grep → 0 hit (StatusBadge 제외 후) |
| M6 | hex 하드코딩 없음 | PASS | 6개 신규 파일 전체 grep → 0 hit |
| M7 | ko + en i18n 4키 | PASS | ko/en 양쪽 `checkouts.error.heroKpi`, `.nextStepPanel`, `.workflowTimeline`, `.retry` 확인 (ko: 511~514행, en: 511~514행) |
| M8 | WorkflowTimelineSkeleton 재구현 없음 | PASS | 3개 skeleton 파일에서 `WorkflowTimelineSkeleton` grep → 0 hit |
| M9 | role="alert" + aria-live | PASS | 3개 Error 파일 전체에 `role="alert"` + `aria-live="assertive"` 확인 (각 19행) |
| M10 | motion-reduce:animate-none 존재 | **PASS** (Iter 2) | 토큰 파일 `checkout-loading-skeleton.ts:10` → `base: 'animate-pulse rounded-md bg-muted motion-reduce:animate-none'` 확인. 3개 skeleton `.tsx` 파일 전부 `CHECKOUT_LOADING_SKELETON_TOKENS.base` import·사용 확인. Tailwind v4는 `.ts` 파일 포함 전체 비-gitignored 파일 자동 스캔하므로 토큰 파일의 리터럴이 purge 없이 포함됨. PASS 조건 2가지 모두 충족. |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | CheckoutListSkeleton HeroKPISkeleton 추가 | PASS | `CheckoutListSkeleton.tsx:6` import 확인, 25행에서 `<HeroKPISkeleton />` 사용 |
| S2 | CheckoutDetailClient NextStepPanel Suspense | **FAIL** | `CheckoutDetailClient.tsx` 703~710행: `<NextStepPanel>` 은 Suspense 없이 직접 렌더. Suspense는 739~750행 WorkflowTimeline 전용임. NextStepPanel 영역에 Suspense 경계 없음 |
| S3 | Error 컴포넌트 useTranslations i18n | PASS | 3개 Error 파일 모두 `useTranslations('checkouts.error')` 사용하여 `t('heroKpi')`, `t('nextStepPanel')`, `t('workflowTimeline')`, `t('retry')` 호출 |

## Issues Found (FAIL items only)

### M10 — Iteration 2에서 PASS로 번복

**Iteration 1 판정 근거 재검토:**
- Iter 1에서 계약 명령 `grep -l "motion-reduce:animate-none" <skeleton .tsx files>` → 0 hit를 근거로 FAIL 처리.
- 그러나 계약의 PASS 조건은 "리터럴이 토큰 `.ts` 파일에 존재 AND 3개 skeleton `.tsx` 파일이 `CHECKOUT_LOADING_SKELETON_TOKENS.base`를 import/사용"이다.

**Iteration 2 실측:**
- `checkout-loading-skeleton.ts` line 10: `base: 'animate-pulse rounded-md bg-muted motion-reduce:animate-none'` — 리터럴 존재 확인.
- 3개 `.tsx` 파일 전부 `CHECKOUT_LOADING_SKELETON_TOKENS.base` 사용 확인.
- Tailwind v4는 `tailwind.config.ts`의 `content` 배열 없이 모든 비-gitignored 파일(`.ts` 포함)을 자동 스캔. 토큰 `.ts` 파일의 리터럴이 직접 scanned되므로 purge 위험 없음.
- **PASS 조건 2가지 모두 충족 → M10 PASS**.

### S2 — NextStepPanel Suspense 경계 없음 (SHOULD FAIL)

`CheckoutDetailClient.tsx` 703~710행:
```tsx
{isNextStepPanelEnabled() && (
  <NextStepPanel
    variant="floating"
    descriptor={nextStepDescriptor}
    onActionClick={handleNextStepAction}
    isPending={isAnyNextStepMutationPending}
  />
)}
```
Suspense fallback 없이 직접 렌더된다. Suspense는 739행의 WorkflowTimeline 전용이며 NextStepPanel을 감싸지 않는다. S 기준이므로 루프 차단은 없지만 tech-debt 기록 대상.

## Overall Verdict

**PASS** (Iteration 2 업데이트)

모든 MUST criterion (M1~M10) 통과.

SHOULD 미통과:
- S2: NextStepPanel Suspense 경계 없음 (tech-debt 기록 대상, 루프 차단 없음)

---

### Iteration 2 변경 요약
- M10: FAIL → PASS
  - 근거: 토큰 `.ts` 파일에 `motion-reduce:animate-none` 리터럴 존재 확인, 3개 skeleton `.tsx` 파일 전부 `CHECKOUT_LOADING_SKELETON_TOKENS.base` 사용 확인, Tailwind v4 자동 `.ts` 스캔으로 purge 위험 없음.
- Overall: FAIL → PASS
