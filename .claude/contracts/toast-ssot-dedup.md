# Contract: toast-ssot-dedup

**Slug**: `toast-ssot-dedup`
**Mode**: 1 (Lightweight, downgraded from 2 after Planner findings)
**Date**: 2026-04-08
**Branch**: main (user explicit)

## Problem (corrected from original prompt)

Original 34차 prompt framed this as "useToast가 같은 메시지를 시각 div + aria-live status 두 곳에 동시 발화 (SSOT 위반)". Investigation revealed:

1. **시각 div + aria-live status 이중 노출은 Radix Toast의 의도된 a11y 동작** — 제거 대상 아님 (toast-helpers.ts:7에 이미 문서화). 시각 토스트는 `aria-hidden`, hidden span만 announce → 스크린리더는 한 번만 발화.

2. **진짜 버그는 분리된 상태 머신 두 개**:
   - `apps/frontend/components/ui/use-toast.ts` (TOAST_REMOVE_DELAY=1000ms, Toaster 구독 ✅)
   - `apps/frontend/hooks/use-toast.ts` (TOAST_REMOVE_DELAY=1000000ms, Toaster 구독 ❌)
   - 두 파일은 각자의 private `memoryState` + `listeners` 보유. `<Toaster />`는 `components/ui/use-toast`만 구독.
   - **결과**: `hooks/use-toast`를 import하는 6개 컴포넌트의 toast() 호출은 화면에 렌더되지 않음 (silent failure).
   - 영향 컴포넌트: DisposalCancelDialog, DisposalReviewDialog, DisposalApprovalDialog, DisposalRequestDialog, MaintenanceHistorySection, AuditLogsContent.

3. **부수 위반**: 일부 e2e spec이 `expectToastVisible` helper 우회하고 직접 `getByText().first()` 사용 → helper 의도(시각 토스트만 매칭)가 코드에 드러나지 않음.

## Scope

### Phase 1 — Production bug fix (silent toast)
- Canonical: `apps/frontend/components/ui/use-toast.ts` (이미 Toaster가 구독, 더 많은 컴포넌트가 사용)
- 6개 import path 마이그레이션: `@/hooks/use-toast` → `@/components/ui/use-toast`
- `apps/frontend/hooks/use-toast.ts` 삭제

### Phase 2 — E2E helper consolidation
- 토스트 텍스트 `.first()` 우회 spec을 `expectToastVisible` helper로 교체:
  - `s19-receive-with-certificate.spec.ts:126`
  - `s20-cache-invalidation.spec.ts:126,170`
  - `incident-history-ui.spec.ts:257`
  - `intermediate-check.spec.ts:106`
  - `permission-error.spec.ts:126` (errorToast)
  - `10-cas-version-conflict.spec.ts:72,73,116`

### Phase 3 — Verify rule
- `.claude/skills/verify-frontend-state/SKILL.md`에 "토스트 다중 매칭 가드" 룰 추가:
  - `useToast` import는 `@/components/ui/use-toast` 1곳에서만 가능
  - e2e spec에서 토스트 텍스트 직접 `.first()` 금지, `expectToastVisible` 사용

## MUST Criteria

- [ ] `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] `pnpm --filter frontend run build` exit 0
- [ ] `pnpm --filter frontend run test` exit 0
- [ ] `grep -rn "@/hooks/use-toast" apps/frontend` → 0 hit
- [ ] `apps/frontend/hooks/use-toast.ts` 파일 미존재
- [ ] `<Toaster />`가 layout.tsx에 1개만 마운트 유지
- [ ] Phase 2 대상 spec 6건 모두 `expectToastVisible` 사용으로 교체됨
- [ ] verify-frontend-state SKILL.md에 토스트 SSOT 룰 섹션 추가됨

## SHOULD Criteria

- [ ] 마이그레이션 대상 6개 컴포넌트의 토스트 동작 수동 또는 e2e 확인 (disposal/audit/maintenance flow)
- [ ] /verify-frontend-state PASS
- [ ] /verify-ssot PASS

## Out of Scope

- Toaster 컴포넌트 구조 변경 (Radix 표준 동작이며 a11y 회귀 위험)
- "Notification " visually-hidden 접두사 제거 (Radix 의도)
- 비-토스트 `.first()` 사용처 (badge/status/dropdown 등) — 별개 이슈
