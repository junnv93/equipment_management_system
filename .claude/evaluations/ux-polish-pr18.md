# Evaluation Report — ux-polish-pr18

- **Date**: 2026-04-24
- **Iteration**: 1
- **Evaluator**: Evaluator Agent (sonnet)

## MUST Criteria Results

| ID | Criterion | Verdict | Detail |
|----|-----------|---------|--------|
| M1 | tsc 0건 | PASS | `pnpm --filter frontend exec tsc --noEmit` 출력 없음 — 에러 0건 확인 |
| M2 | CHECKOUT_TOAST_TOKENS export | PASS | `lib/design-tokens/index.ts:764` 에 export 존재. `checkout-toast.ts` 파일 존재, `duration.success/warning/error` 3키 모두 정의 |
| M3 | notifyCheckoutAction export | PASS | `toast-templates.ts:32` export 존재. 시그니처 `(toastFn, action, ctx, t, severity?)` 일치. `CHECKOUT_TOAST_TOKENS` import 존재 (line 2) |
| M4 | NextStepPanel 온보딩 pulse | PASS | `useOnboardingHint`(line 9), `pulseHard`(line 49), `REDUCED_MOTION`(line 8·49), `markDone`(line 48·115) 모두 1건 이상 확인. `markDone()` → `onActionClick?.(...)` 순서 정확 (line 115→116) |
| M5 | GroupCard notifyCheckoutAction 연결 | PASS | `CheckoutGroupCard.tsx:268` — `approveMutation.onSuccess`에서 `notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName ?? '' }, t)` 호출 확인. 기존 `toast({ title: t('toasts.approveSuccess') })` 패턴은 제거됨 |
| M6 | E2E 파일 3개 생성 | PASS | `suite-ux/` 디렉토리에 3파일 존재. `s-onboarding.spec.ts` 3건, `s-toast.spec.ts` 1건, `s-mobile-bottom-sheet.spec.ts` 3건 — 모두 1건 이상 |
| M7 | sonner 라이브러리 금지 | PASS | `from 'sonner'` 매치 0건, `package.json`에 sonner 항목 0건 |
| M8 | CheckoutStatusBadge id prop + tooltip | PASS | `id?: string` prop(line 26) 존재. `Tooltip/TooltipContent/TooltipProvider/TooltipTrigger` 컴포넌트 사용(line 6·69~84). `help.status.${status}.description` i18n 키 사용(line 81). `aria-describedby` 연결 존재(line 55) |
| M9 | Mobile Bottom Sheet — CheckoutDetailClient | PASS | `Drawer` 14건, `md:hidden`(line 1335), `safe-area-inset-bottom`(line 1336), `data-testid="checkout-mobile-peek"`(line 1343), `data-testid="checkout-mobile-drawer"`(line 1348) 모두 확인 |
| M10 | i18n 키 ko/en 5개 × 2 | PASS | ko·en 양쪽 `"toast":` 존재. `approve/reject/start/return/approveReturn`.success 5키 모두 존재. ko `approve.success = '{equipmentName} 승인 완료'` — `{equipmentName}` 인터폴레이션 포함 |

## SHOULD Criteria Notes

| ID | Criterion | Status | Note |
|----|-----------|--------|------|
| S1 | CheckoutDetailClient mutation 전부 치환 | 부분 완료 | `approveMutation.onSuccess`는 `notifyCheckoutAction` 경유 확인. `onError`는 기존 `t('toasts.approveError')` 유지 — contract 허용 범위 (PR-19 분리 허용) |
| S2 | useOptimisticMutation successMessage 회귀 방지 | 미확인 | E2E `suite-03-approval` 실행 미시도. assertion 업데이트 여부 불명 |
| S3 | Storybook NextStepPanel stories | 미확인 | stories 파일 확인 미시도 |
| S4 | 접근성 | 부분 확인 | `Drawer`에 `aria-modal` 적용 여부 미확인 (E2E spec에서 `aria-modal` 체크 테스트 존재는 확인). Tooltip 키보드 focus 노출 여부 미확인 |
| S5 | Bundle size 회귀 방지 | 미확인 | `bundle-gate.mjs` 실행 미시도 |
| S6 | 디자인 토큰 일관성 | PASS | `checkout-toast.ts` 및 `toast-templates.ts` 내 hex 리터럴 0건 확인 |

## Issues Found

**블로킹 이슈 없음.** 모든 MUST 항목 통과.

### 비블로킹 관찰 사항 (SHOULD 범위)

1. **ACTION_KEY_MAP 불완전 매핑**: `CheckoutAction` 타입에는 `cancel`, `lender_check`, `borrower_receive`, `mark_in_use`, `lender_receive`, `reject_return`, `borrower_approve`, `borrower_reject` 등이 존재하나 `ACTION_KEY_MAP`에 매핑되지 않음. `Partial<Record<...>>` + `if (!actionKey) return` 패턴으로 무음 처리됨 — 의도적 설계로 보이나, `reject_return` 같은 사용자 대면 액션이 toast 없이 무시될 수 있음. 현재 contract 범위 외이나 PR-19에서 검토 권고.

2. **CheckoutGroupCard onError 토스트 미치환**: `toasts.approveError` 키는 여전히 기존 방식으로 호출됨 (line 278). S1 기준 해당 — contract 허용 범위 (PR-19 분리 가능).

## Overall Verdict

**PASS**

MUST 기준 M1~M10 전항목 통과. 블로킹 이슈 없음.
