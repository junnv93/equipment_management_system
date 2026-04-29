# Contract — PR-18: UX Polish (ux-polish-pr18)

- **Date**: 2026-04-24
- **Branch**: ux-polish-pr18
- **PR**: 18
- **Scope**: Checkout UX 마감 — status badge tooltip · NextStep 온보딩 pulse · toast SSOT 통일 · 모바일 Bottom Sheet
- **Exec Plan**: `.claude/exec-plans/active/2026-04-24-ux-polish-pr18.md`

---

## 성공 기준 정의 (MUST / SHOULD)

완료 판정은 아래 MUST 항목이 **100%** 통과해야 한다.
SHOULD 항목은 머지 전 검토가 필요하지만, 실패 시 후속 PR로 분리 가능하다.

---

## MUST (블로킹)

### M1. TypeScript / Lint
```bash
pnpm --filter frontend exec tsc --noEmit
```
- 출력: **에러 0건**. 경고는 신규 발생분이 0건이어야 한다.
- 전제: `apps/frontend/components/ui/drawer.tsx` 가 존재하고 `vaul`가 `package.json` dependencies에 포함된 상태.

### M2. Design Token SSOT — CHECKOUT_TOAST_TOKENS export
```bash
grep -n "CHECKOUT_TOAST_TOKENS" apps/frontend/lib/design-tokens/index.ts
```
- 결과: 매치 1건 이상.
- 추가 확인: `apps/frontend/lib/design-tokens/components/checkout-toast.ts` 파일 존재, `duration: { success, warning, error }` 3키 모두 정의.

### M3. Toast 템플릿 유틸 — notifyCheckoutAction export
```bash
grep -n "export function notifyCheckoutAction" apps/frontend/lib/checkouts/toast-templates.ts
```
- 결과: 매치 1건.
- 시그니처: `(toastFn, action, ctx, t, severity?)` — `toastFn`은 외부 주입.
- 추가 확인: 파일 내에서 `CHECKOUT_TOAST_TOKENS` import 1건 이상.

### M4. 온보딩 pulse — NextStepPanel
```bash
grep -n "useOnboardingHint" apps/frontend/components/shared/NextStepPanel.tsx
grep -n "pulseHard" apps/frontend/components/shared/NextStepPanel.tsx
grep -n "REDUCED_MOTION" apps/frontend/components/shared/NextStepPanel.tsx
grep -n "markDone\(\)" apps/frontend/components/shared/NextStepPanel.tsx
```
- 위 4개 명령 모두 매치 1건 이상.
- CTA `onClick` 핸들러 안에서 `markDone()` → `onActionClick?.(descriptor.nextAction!)` 순서로 실행.

### M5. GroupCard mutation onSuccess 연결
```bash
grep -rn "notifyCheckoutAction" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
```
- 결과: 매치 1건 이상. (approveMutation onSuccess 위치)
- 기존 `toast({ title: t('toasts.approveSuccess') })` 호출은 `notifyCheckoutAction(toast, 'approve', { equipmentName }, t)` 로 치환되어야 한다.

### M6. E2E 파일 3개 생성
```bash
ls apps/frontend/tests/e2e/features/checkouts/suite-ux/s-onboarding.spec.ts
ls apps/frontend/tests/e2e/features/checkouts/suite-ux/s-toast.spec.ts
ls apps/frontend/tests/e2e/features/checkouts/suite-ux/s-mobile-bottom-sheet.spec.ts
```
- 3파일 모두 존재.
- 각 파일 내 최소 1개 `test(...)` 블록 존재.

### M7. sonner 라이브러리 금지
```bash
! grep -rn "from 'sonner'" apps/frontend/
! grep -n '"sonner"' apps/frontend/package.json
```
- 위 2개 명령 모두 **매치 0건**. (부정 grep 실패 = 매치 존재 = 실패)

### M8. CheckoutStatusBadge id prop + tooltip
```bash
grep -n "id?: string" apps/frontend/components/checkouts/CheckoutStatusBadge.tsx
grep -n "Tooltip" apps/frontend/components/checkouts/CheckoutStatusBadge.tsx
grep -n "help.status" apps/frontend/components/checkouts/CheckoutStatusBadge.tsx
```
- 3개 모두 매치 1건 이상.
- `aria-describedby` 또는 Tooltip `id` 연결 존재.

### M9. Mobile Bottom Sheet — CheckoutDetailClient
```bash
grep -n "Drawer" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "md:hidden" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "safe-area-inset-bottom" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "data-testid=\"checkout-mobile-peek\"" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "data-testid=\"checkout-mobile-drawer\"" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
```
- 5개 모두 매치 1건 이상.

### M10. i18n 키 — toast.{action}.success (ko/en)
```bash
grep -n "\"toast\":" apps/frontend/messages/ko/checkouts.json
grep -n "\"toast\":" apps/frontend/messages/en/checkouts.json
```
- 2개 모두 매치 1건 이상.
- 각 파일 내 `toast.approve.success`, `toast.reject.success`, `toast.start.success`, `toast.return.success`, `toast.approveReturn.success` 5개 키 모두 존재.
- ko 파일: `{equipmentName}` 인터폴레이션 포함 (approve).
- en 파일: 동일 구조.

---

## SHOULD (권고)

### S1. CheckoutDetailClient mutation 전부 치환
- approveMutation 외 reject/start/approveReturn/rejectReturn 모두 `notifyCheckoutAction` 경유.
- 본 PR에서 1건만 샘플로 치환 가능 — 나머지는 PR-19로 분리 허용.

### S2. useOptimisticMutation `successMessage` 회귀 방지
- `successMessage`를 제거한 mutation의 기존 E2E 테스트가 새 i18n 키로 assertion 업데이트되어 통과.
- 시뮬레이션: `pnpm --filter frontend run test:e2e -- --grep "suite-03-approval"` 통과.

### S3. Storybook — NextStepPanel stories
- `NextStepPanel.stories.tsx` 가 pulse 분기를 포함하는 variant story 1개 추가 (또는 기존 유지 시 타입 체크만 통과).
- 필수 아님 — stories 미수정도 허용.

### S4. 접근성
- axe-core 정적 스캔: Drawer 열림 시 focus trap 동작, `aria-modal="true"` 존재.
- Tooltip: 키보드 focus로도 노출.
- reduced-motion 시스템 설정: pulse 클래스 미적용.

### S5. Bundle size 회귀 방지
- `node scripts/bundle-gate.mjs` (존재 시) — gzip 기준 `/checkouts/[id]` 라우트 +10KB 이내.
- vaul 추가로 인한 증분은 허용 범위 내 (~8KB gzip 예상).

### S6. 디자인 토큰 일관성
- `CHECKOUT_TOAST_TOKENS.duration`만 추가. hex 색상 리터럴 신규 0건.
- checkout-toast.ts 파일 내 하드코딩 색상 0건.

---

## 검증 명령 (End-to-End)

```bash
# 1. Type check
pnpm --filter frontend exec tsc --noEmit

# 2. Lint
pnpm --filter frontend run lint

# 3. SSOT grep (MUST 묶음)
grep -n "CHECKOUT_TOAST_TOKENS" apps/frontend/lib/design-tokens/index.ts
grep -n "notifyCheckoutAction" apps/frontend/lib/checkouts/toast-templates.ts
grep -n "useOnboardingHint" apps/frontend/components/shared/NextStepPanel.tsx
grep -rn "notifyCheckoutAction" apps/frontend/components/checkouts/CheckoutGroupCard.tsx

# 4. E2E 파일 생성 확인
ls apps/frontend/tests/e2e/features/checkouts/suite-ux/

# 5. sonner 금지 (매치 0건 = 성공)
grep -rn "from 'sonner'" apps/frontend/ && echo "FAIL: sonner found" || echo "PASS"

# 6. E2E 실행 (선택)
pnpm --filter frontend run test:e2e -- --grep "suite-ux"
```

---

## 롤백 기준

- M1 (tsc) 실패: 즉시 중단. 최근 Phase의 변경만 revert.
- M7 (sonner) 위반: PR 차단. sonner 의존성 즉시 제거 후 재평가.
- M9 (Drawer) 실패 + 타 MUST 통과: Phase 4만 revert하여 Phase 0~3, 5~7 기준으로 머지 가능(contract 조정 필요 → 사용자 확인).

---

## Non-Goals (명시적 제외)

- Checkout 외 도메인 toast 통일 (→ PR-19+)
- useOptimisticMutation `successMessage` 메커니즘 제거 전면화 (→ PR-19+)
- Drawer snap-points / 고급 gesture (→ 별도 UX 튜닝 PR)
- RTL 레이아웃 대응 (→ i18n 전용 PR)
- Storybook 전면 리뉴얼 (→ 디자인 시스템 PR)

---

## 리스크 & 대응

| 리스크 | 대응 |
|---|---|
| vaul 설치 실패 (peer deps) | Phase 0에서 중단, 사용자 보고. 대안: `pnpm-lock.yaml` 수동 정리 후 재시도 |
| help.status.* i18n 키 누락 상태 존재 | Phase 3A에서 ko/en 양쪽에 최소 범위로 추가 (en은 ko와 동일 구조) |
| 기존 E2E (suite-03~07) toast assertion 깨짐 | Phase 6에서 새 키를 기존 `toasts.*`와 병존시켜 호환성 유지. assertion 업데이트는 SHOULD S2 |
| Drawer focus trap 회귀 | 기존 Radix Dialog와 vaul Drawer 중첩 시 focus 경합 → peek 버튼만 `< md`에서 조건부 렌더로 분리 |
| 온보딩 localStorage 충돌 | key prefix `onboarding-dismissed:checkout-next-step` 고유 — 기존 hint 인스턴스와 무충돌 |
| `useOptimisticMutation.successMessage` 제거 시 토스트 2중 표시 | Phase 5에서 치환 대상 mutation의 `successMessage`는 반드시 제거 + `onSuccessCallback`에서 단일 호출 |

---

## 완료 보고 체크리스트 (Generator → Evaluator)

Generator는 PR 제출 전 아래를 자체 검증한다.

- [ ] M1 tsc 0건
- [ ] M2 CHECKOUT_TOAST_TOKENS export
- [ ] M3 notifyCheckoutAction export
- [ ] M4 NextStepPanel 4건 grep 모두 통과
- [ ] M5 GroupCard notifyCheckoutAction 연결
- [ ] M6 E2E 3파일 존재
- [ ] M7 sonner 0건
- [ ] M8 StatusBadge tooltip 3건
- [ ] M9 CheckoutDetailClient Drawer 5건
- [ ] M10 ko/en toast 키 5개 × 2 = 10개 존재
- [ ] SHOULD S1~S6 상태 기록 (어떤 항목이 누락되었는지)
