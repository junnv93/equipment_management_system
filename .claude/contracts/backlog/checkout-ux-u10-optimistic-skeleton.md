---
slug: checkout-ux-u10-optimistic-skeleton
type: contract
date: 2026-04-24
depends: [checkout-ux-u05-undo-toast]
sprint: 4
sprint_step: 4.5.U-10
---

# Contract: Sprint 4.5 · U-10 — Optimistic UI + Skeleton ≠ Spinner 일관성

## Context

V2 §8 U-10: 승인/반려 클릭 시 네트워크 대기 UX가 현재 전역 spinner/페이지 블로킹. "즉시 반영 → 실패 시 rollback" 원칙으로 전환.

- 기존 `useOptimisticMutation` 확장 (U-05와 합류) — optimistic cache 반영 + AbortController 취소 + toast.
- 로딩은 skeleton만 — `CheckoutGroupCardSkeleton`, `CheckoutListSkeleton` 이미 존재. 전역 spinner 금지.
- CAS 409 발생 시: MEMORY.md "CAS 409 발생 시 backend detail 캐시 반드시 삭제" 준수, refetch + 재시도 안내 토스트.
- Sprint 3.5 stagger 상한 + `prefers-reduced-motion` 존중.
- **주의**: MEMORY.md `useOptimisticMutation onSuccess에서 setQueryData 금지` — TData/TCachedData 타입 불일치 75%.

---

## Scope

### 수정 대상
- `apps/frontend/hooks/use-optimistic-mutation.ts` (U-05와 합류)
  - optimistic update는 `queryClient.setQueryData`가 **아니라** `invalidateQueries`만 경유 **또는** `onMutate`에서 cache snapshot + rollback. 구현자 판단.
  - 실패 토스트: destructive variant + "다시 시도" CTA.
  - CAS 409 시: detail 캐시 삭제 (`queryClient.removeQueries({ queryKey: [...detail] })`) + refetch.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — approve/reject 훅 호출 시 optimistic 옵션 전달. 즉시 status 전환 (UI 레벨).
- `apps/frontend/components/checkouts/CheckoutDetailClient.tsx` — 상세도 동일.
- `apps/frontend/app/(dashboard)/checkouts/page.tsx` — Suspense fallback을 `<CheckoutListSkeleton>`으로 지정 (spinner 0).
- **전역 spinner 제거 감사**: `apps/frontend/components/checkouts/` 전체에서 `<Loader2>`/`<Spinner>` raw 사용 grep → skeleton으로 치환.

### 수정 금지
- Skeleton 컴포넌트 본체 (이미 존재).
- Sprint 3.5 stagger 상한 로직.
- Server side 로직.

### 신규 생성
- 없음.

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `useOptimisticMutation` 내부 `setQueryData` 호출 **0건** (MEMORY.md 금지) | `grep -n "setQueryData" apps/frontend/hooks/use-optimistic-mutation.ts apps/frontend/components/checkouts/` = 0 hit |
| M3 | Optimistic update는 `onMutate` snapshot + `onError` rollback **또는** `invalidateQueries`로만 반영 | 코드 |
| M4 | CAS 409 시 detail 캐시 완전 삭제(`removeQueries` 또는 동등) + refetch 트리거 (MEMORY.md 준수) | 코드 + E2E |
| M5 | 실패 토스트: destructive variant + "다시 시도" CTA + i18n | grep |
| M6 | `CheckoutGroupCard` / `CheckoutDetailClient`에서 approve 클릭 시 즉시 status 전환 UI, 서버 응답 대기 중 skeleton placeholder 없음 (optimistic) | E2E |
| M7 | Suspense fallback이 `<CheckoutListSkeleton>` 또는 `<CheckoutGroupCardSkeleton>` | grep |
| M8 | 전역 spinner (`<Loader2>` / `Spinner`) 사용 0건 (checkouts 디렉토리 기준) | `grep -rn "Loader2\|Spinner" apps/frontend/components/checkouts/ apps/frontend/app/(dashboard)/checkouts/` = 0 hit |
| M9 | Sprint 3.5 stagger + `prefers-reduced-motion` 존중 (animate-pulse도 `motion-safe:` prefix) | grep |
| M10 | E2E: optimistic 성공 (즉시 전환 → 서버 확정) / 실패 (rollback) / 409 (캐시 삭제 + refetch) 3 시나리오 통과 | Playwright |
| M11 | CAS 409 응답 body에 `code: 'VERSION_CONFLICT'` + 현재 server version 포함 (FE가 retry 가능) | backend check |
| M12 | `useOptimisticMutation` 반환 type은 `UseMutationResult<TData, Error, TVariables>` — TData/TCachedData 혼용 0 (MEMORY.md 75% 불일치 주의) | 타입 확인 |
| M13 | 성공 시 invalidateQueries scope는 SSOT queryKeys 경유 (Sprint 3.2 `checkouts.view.*` 패턴) | grep |
| M14 | Skeleton이 실제 row 높이와 동일 (layout shift 0) | visual manual |
| M15 | 변경 파일 수 ≤ **8** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 저사양 기기 감지 (`navigator.hardwareConcurrency < 4` 또는 `connection.effectiveType === '2g'`) 시 optimistic 대신 일반 로딩 | `optimistic-low-end-skip` |
| S2 | Optimistic 실패 시 rollback 과정 animation (fade-out + fade-in) | `optimistic-rollback-anim` |
| S3 | Retry 자동화: 네트워크 일시 실패 1회 자동 재시도 (exponential backoff) | `mutation-auto-retry` |
| S4 | Toast stacking (optimistic + undo + error 토스트 여러 개 쌓임) | `toast-stack-policy` |
| S5 | `CheckoutListSkeleton` + header/footer 레이아웃 일치 (row-by-row skeleton) | `list-skeleton-structural` |
| S6 | React Query `useMutation` → `useOptimistic` (React 19) 마이그레이션 검토 | `react-19-useoptimistic-migration` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/hooks/use-optimistic-mutation.ts

grep -rn "setQueryData" apps/frontend/hooks/use-optimistic-mutation.ts apps/frontend/components/checkouts/ apps/frontend/app/\(dashboard\)/checkouts/
# 기대: 0 hit

grep -rn "Loader2\|Spinner" apps/frontend/components/checkouts/ apps/frontend/app/\(dashboard\)/checkouts/
# 기대: 0 hit

grep -rn "CheckoutListSkeleton\|CheckoutGroupCardSkeleton" apps/frontend/app/\(dashboard\)/checkouts/
# 기대: Suspense fallback에서 사용

grep -n "removeQueries\|invalidateQueries" apps/frontend/hooks/use-optimistic-mutation.ts
# 기대: CAS 409 경로에 존재

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 8

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u10-optimistic
```

---

## Acceptance

MUST 15개 PASS + 3가지 E2E 시나리오 통과 + MEMORY.md 위반 0건 (setQueryData, Loader2).
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-05 · `checkout-ux-u05-undo-toast.md` — 동일 훅 공유. 합류 진행.
- Sprint 3.5 · stagger 상한 — optimistic 전환 시 stagger 방해 없음.
- Sprint 3.2 · `queryKeys.checkouts.view.*` — invalidation 스코프.
- MEMORY.md `feedback_pre_commit_self_audit` 7번 — setQueryData 금지.
- MEMORY.md "CAS 409 발생 시 backend detail 캐시 반드시 삭제" — M4 근거.
