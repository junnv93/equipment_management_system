---
slug: checkout-78-round2
title: 78차 반출입관리 2라운드 — a11y + dead code + SSOT 잔재
type: contract
created: 2026-04-21
---

# Contract: checkout-78-round2

## Scope

- Phase 1: CheckoutGroupCard 행 button 시맨틱 + Outbound stat Card 키보드 접근성
- Phase 2: InboundCheckoutsTab 전역 isLoading 가드 제거 + EmptyState useAuth 분리 + step-dot 토큰 @theme 등록
- Phase 3(선택): text-[10px] 토큰화 + overdue 앵커 포커스/i18n + CheckoutListSkeleton DRY

## Files

### Phase 1
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`

### Phase 2
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
- `apps/frontend/components/shared/EmptyState.tsx`
- `apps/frontend/styles/globals.css`
- `apps/frontend/lib/design-tokens/primitives.ts`
- `apps/frontend/lib/design-tokens/semantic.ts`
- `apps/frontend/lib/design-tokens/components/checkout.ts`

### Phase 3 (선택)
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
- `apps/frontend/components/checkouts/CheckoutAlertBanners.tsx`
- `apps/frontend/messages/ko/checkouts.json`
- `apps/frontend/messages/en/checkouts.json`

---

## MUST (실패 시 루프 재진입)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | tsc green | `pnpm --filter frontend exec tsc --noEmit` 0 error |
| M2 | lint green | `pnpm --filter frontend run lint` 0 error |
| M3 | CheckoutGroupCard `role="button"` 제거 | `grep 'role="button"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx` → 0 hit |
| M4 | CheckoutGroupCard 행 button 시맨틱 도입 | `<button type="button">` 래퍼 존재 + 내부 `e.stopPropagation` 유지 |
| M5 | Outbound stat Card aria-pressed | `grep 'aria-pressed' OutboundCheckoutsTab.tsx` → 1+ hit |
| M6 | Outbound stat Card 키보드 핸들러 | `grep 'onKeyDown' OutboundCheckoutsTab.tsx` → 1+ hit |
| M7 | InboundCheckoutsTab 전역 isLoading 제거 | `grep 'if (isLoading) return' InboundCheckoutsTab.tsx` → 0 hit |
| M8 | EmptyState useAuth 제거 | `grep 'useAuth' apps/frontend/components/shared/EmptyState.tsx` → 0 hit |
| M9 | EmptyState canAct prop 추가 | `grep 'canAct' EmptyState.tsx` → 1+ hit (타입+사용) |
| M10 | w-[18px] arbitrary 제거 | `grep 'w-\[18px\]\|h-\[18px\]' apps/frontend/lib/design-tokens/components/checkout.ts` → 0 hit |
| M11 | --spacing-step-dot @theme 등록 | `grep '\-\-spacing-step-dot' apps/frontend/styles/globals.css` → 1 hit |
| M12 | 하드코딩 URL/role 리터럴 도입 없음 | 신규 UserRole 리터럴/fetch http:// 0건 |
| M13 | SSOT 준수 | 신규 `any` / `setQueryData` / 로컬 enum 재정의 0건 |
| M14 | 기능 회귀 없음 | 반출 목록/반입 탭 로딩 → 필터 → stat Card 클릭 → 상세 이동 동선 정상 |

## SHOULD (실패 시 tech-debt 등록)

| # | Criterion | Notes |
|---|-----------|-------|
| S1 | Phase 3-1 text-[10px] → MICRO_TYPO 교체 | `grep 'text-\[10px\]' CheckoutsContent.tsx` → 0 hit |
| S2 | Phase 3-2 overdue 앵커 `tabIndex={-1}` + focus() | `grep 'tabIndex={-1}' OutboundCheckoutsTab.tsx` → 1 hit |
| S3 | Phase 3-2 배너 aria-label i18n | `grep '기한 초과 항목으로 이동' CheckoutAlertBanners.tsx` → 0 hit |
| S4 | Phase 3-3 CheckoutListSkeleton 공유 | 탭 파일 내 `w-\[100px\]\|w-\[120px\]\|w-\[60px\]\|w-\[50px\]` 0 hit |
| S5 | EmptyState permission prop deprecate 주석 | JSDoc `@deprecated` 표기 |
| S6 | 키보드 Tab → Enter stat filter 수동 검증 | 브라우저에서 확인 |

## OUT OF SCOPE

- backend DTO class→Zod 마이그레이션 (`class-validator` 0건, 이미 완료)
- CheckoutDetailClient arbitrary values (상세 페이지, 별도 세션)
- CreateCheckoutContent arbitrary values (생성 폼, 별도 세션)
- 전체 design-tokens `text-[Npx]` 90건 (78-1 tech-debt 등록 완료)
- `destination || location` 타입 이중 필드 (backend DTO 변경 필요)
- EmptyState `permission` prop 완전 제거 (후방호환 유지)
