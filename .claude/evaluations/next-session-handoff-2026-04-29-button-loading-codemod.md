# 다음 세션 핸드오프 — 2026-04-29 Button L2 Click-Feedback + FSM SSOT 완성

## 세션 요약

**작업 범위**: Harness Mode 2 — Button L2 Click-Feedback 완성 + LENDER_APPROVAL_PENDING_STATUSES FSM SSOT

**상태**: ✅ 전체 완료 + push 완료

---

## 이번 세션에서 완료한 작업

### Phase 0: LENDER_APPROVAL_PENDING_STATUSES FSM SSOT

**문제**: `approvals.service.ts`가 lender 승인 대기 상태를 `'pending'`만 필터링 → rental 2-step의 `borrower_approved` 누락 → lender TM의 승인 대기 카운트 틀림

**해결**:
- `packages/schemas/src/fsm/checkout-fsm.ts`: `LENDER_APPROVAL_PENDING_STATUSES` FSM 도출 상수 추가
  ```typescript
  export const LENDER_APPROVAL_PENDING_STATUSES = Object.freeze(
    [...new Set(CHECKOUT_TRANSITIONS.filter(t => t.requires === 'approve:checkout').map(t => t.from))]
  ) as readonly CheckoutStatus[];
  ```
- `approvals.service.ts`: `getCheckoutCount(statuses: CheckoutStatus[], ...)` 배열 파라미터로 교체
- `approvals-api.ts`: `LENDER_APPROVAL_PENDING_STATUSES.join(',')` 다중 상태 쿼리

### Phase 1: Button L2 Click-Feedback — ts-morph 코드모드

**문제**: 59개 파일에서 `disabled={X.isPending}` Button에 `loading` prop 미전달 → spinner/aria-busy 미작동

**해결**: `scripts/codemods/button-loading.ts` ts-morph AST 코드모드 작성 후 실행
- 112개 `loading={...isPending}` 속성 추가 (59개 파일)
- `AlertDialogCancel`, `AlertDialogAction`, `asChild` 건너뜀

### Phase 2: 이중 스피너 수동 수정

**문제**: Disposal 4개 다이얼로그 + Team/Calibration 컴포넌트에서 `loading={isPending}` 추가 후 기존 `{isPending && <Loader2>}` 잔류 → 시각/SR 이중 announce

**수정 파일**:
- `DisposalApprovalDialog.tsx`, `DisposalCancelDialog.tsx`, `DisposalRequestDialog.tsx`, `DisposalReviewDialog.tsx`
- 4개 파일 Loader2 제거 + unused import 정리

### Phase 3: CHECKOUT_DETAIL refetchOnMount + meta.nextStep 배선

- `query-config.ts`: `CHECKOUT_DETAIL.refetchOnMount: true` (was `false`)
- `CheckoutDetailClient.tsx`:
  - `useCheckoutNextStep` → `nextStep: checkout.meta?.nextStep` prop 전달
  - `handleNextStepAction`: `availableToCurrentUser` early-return guard
  - cancel 버튼: `checkout.meta?.availableActions.canCancel` 독립 렌더
  - 모바일 바텀시트: `availableToCurrentUser` gate

### 스킬 업데이트

| 스킬 | 추가 내용 |
|------|-----------|
| `verify-ssot` | Step 45: LENDER_APPROVAL_PENDING_STATUSES SSOT 체인 |
| `verify-click-feedback` | Step 14: Button loading + Loader2 이중 스피너 탐지, MUST 범위 → 1-4,7,10-14 |
| `manage-skills` | verify-ssot/verify-click-feedback 테이블 동기화 |

---

## 커밋 이력 (이번 세션)

```
1ab8f7e6  chore(skills): verify-ssot Step 45 + verify-click-feedback Step 14
0a005d12  test(fsm): rental totalSteps 8→7, in_use reachedStepIndex 6→5
1ab5aa5b  refactor(fsm): rental 8단계 → 7단계 (borrower_received 상태 제거)
cdd19d9a  chore(skills): verify-checkout-fsm Step 46-48 + i18n 드리프트 제거
4d3232ce  fix(ui): remove duplicate Loader2 spinners in team/calibration components
0f8f682d  chore(harness): move button-loading-codemod exec-plan to completed
f8ed9f67  fix(ui): remove duplicate Loader2 spinners in disposal dialogs
98186920  chore(approvals): stale case 4 주석 제거 (checkout-scope.util SSOT 동기화)
b938a371  fix(checkouts): rental borrower는 항상 inbound 탭으로만 분류
ccde0f74  feat(ui): forward mutation.isPending to Button loading prop (L2 click-feedback)
f661c2d0  refactor(fsm): derive lender approval pending statuses from FSM
```

---

## 주의: dirty 파일 (미커밋, 다음 세션 범위 아님)

```
M  apps/frontend/components/ui/__tests__/inline-action-button.test.tsx  (1줄 삭제, 무해)
M  apps/frontend/next-env.d.ts  (Next.js 자동생성, 무해)
M  .claude/settings.local.json  (로컬 세팅)
```

→ 다음 세션에서 건드리면 인덱스에 포함될 수 있으니 커밋 전 `git diff --stat` 확인 필수

---

## 다음 세션 권장 작업

### 🔴 CRITICAL

없음 — 이번 세션에서 모두 해결

### 🟠 HIGH

1. **UltraReview Go 판정 실행** — pre-push advisor가 Go 판정 (AUTH_PERMISSION, CAS, EVENT_CACHE 등)
   ```bash
   node scripts/ultrareview-preflight.mjs
   # PR 번호 확인 후: /ultrareview <PR번호>
   ```

2. **`button-loading.ts` 코드모드 CI 게이트 등록**
   - `--check` 모드를 pre-push hook에 추가해 regression 방지
   - 경로: `scripts/codemods/button-loading.ts --check`

### 🟡 MEDIUM

3. **rental 8단계 → 7단계 후속 검증** (이번 세션에서 `borrower_received` 상태 제거)
   - E2E 워크플로우 테스트 실행으로 회귀 없는지 확인
   - `pnpm --filter frontend run test:e2e -- --grep "rental"`

4. **example-prompts.md 백로그 확인** (`/harness-docs 이번 세션 프롬프트`)

---

## 아키텍처 메모

- `LENDER_APPROVAL_PENDING_STATUSES`는 FSM이 유일한 진실의 소스 — 새 승인 단계 추가 시 자동 반영
- Button `loading` prop은 이제 200ms flicker guard + aria-busy + click-swallow 3중 작동
- `ESCAPE_ACTIONS` = `{cancel, reject, reject_return, borrower_reject}` — 4단계 우선순위에서 항상 fallback
- `availableToCurrentUser` = 서버 computed gate — 클라이언트 역할 추론 없이 서버 판단을 그대로 사용
