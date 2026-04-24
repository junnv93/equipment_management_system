---
slug: checkout-ux-u05-undo-toast
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-05
---

# Contract: Sprint 4.5 · U-05 — Undo 5초 토스트 + `useOptimisticMutation` `undoWindowMs` 옵션 + 보상 트랜잭션 `revoke-approval`

## Context

V2 §8 U-05: 실수 승인/반려 복구 경로. 승인 후 "실행 취소" 5초 창 제공.

- **5초 창**: 기존 `useOptimisticMutation`에 `undoWindowMs` 옵션 추가. optimistic UI 즉시 반영 + 5초 내 Undo 클릭 시 서버 호출 취소(AbortController) 또는 이미 커밋된 경우 보상 트랜잭션 호출.
- **보상 트랜잭션**: 서버에 `POST /checkouts/:id/revoke-approval` 신설. 제약: 승인자 == 자신, 승인 후 5분 이내, 상태가 아직 `APPROVED`(다음 단계로 넘어가지 않음).
- **a11y**: `role="status"` `aria-live="polite"`, Esc로 토스트 dismiss.
- MEMORY.md 피드백: `setQueryData` 금지, `useOptimisticMutation` onSuccess에서 setQueryData 쓰지 말 것.

---

## Scope

### 수정 대상
- **Frontend**
  - `apps/frontend/hooks/use-optimistic-mutation.ts` — `undoWindowMs?: number` 옵션 추가.
    - optimistic 반영 → undoWindowMs 후 실제 mutate 실행 (AbortController 취소 가능).
    - undo CTA 호출 시 AbortController abort + cache rollback.
    - 이미 서버에 보낸 경우 보상 트랜잭션 경로 호출.
  - `sonner` 토스트 + "실행 취소 (5s)" CTA. 카운트다운 visual indicator.
  - `CheckoutDetailClient.tsx` / `CheckoutGroupCard.tsx` — approve/reject 훅 호출 시 `undoWindowMs: 5000` 옵션 전달.
- **Backend**
  - `apps/backend/src/modules/checkouts/checkouts.controller.ts` — `POST /checkouts/:id/revoke-approval` 엔드포인트.
  - Service: `revokeApproval(id, userId)`.
    - **scope 검증**: userId == 승인자 본인.
    - **FSM 검증**: status === `APPROVED` (다음 단계로 넘어가면 revoke 불가).
    - **시간 검증**: `approvedAt` 5분 이내.
    - **CAS**: version 검증.
    - `auditLog` emit.
- **공용**
  - `packages/shared-constants/src/api-endpoints.ts` — `REVOKE_APPROVAL`.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.undo.toast.approveSucceeded` ("승인 완료")
    - `checkouts.undo.toast.undoCta` ("실행 취소 ({seconds}s)")
    - `checkouts.undo.toast.reverted` ("승인 취소됨")
    - `checkouts.undo.toast.revertFailed` ("취소 불가 · 이미 다음 단계로 진행됨")
    - `checkouts.undo.toast.dismiss`

### 수정 금지
- 기존 `useOptimisticMutation`의 TData/TCachedData 타입 구조 (MEMORY.md 주의).
- `setQueryData` 사용 금지 (MEMORY.md) — 본 contract는 cache rollback은 `invalidateQueries`로만.

### 신규 생성
- (없음 — 훅 확장)

---

## 참조 구현

```typescript
// apps/frontend/hooks/use-optimistic-mutation.ts (확장)
interface Options<TData, TVariables> {
  // ...
  undoWindowMs?: number;
  undoToastLabelKey?: string;
  onUndo?: () => Promise<void> | void;
  // NOTE: onSuccess에서 setQueryData 절대 금지 (MEMORY.md)
}

export function useOptimisticMutation<TData, TVariables>(opts: Options<TData, TVariables>) {
  // 기본 흐름:
  // 1. optimistic update: queryClient에 임시 변경 반영
  // 2. undoWindowMs 있을 시: toast + window 타이머. CTA 누르면 abort + rollback (invalidate) + onUndo
  // 3. window 경과 후 실제 mutate 실행
  // 4. mutate 성공/실패 시 cache invalidate
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `use-optimistic-mutation.ts`에 `undoWindowMs` 옵션 추가 + AbortController 기반 취소 | grep |
| M3 | **`setQueryData` 사용 0건** (MEMORY.md `feedback_pre_commit_self_audit` 7번 준수) | `grep -n "setQueryData" apps/frontend/hooks/use-optimistic-mutation.ts` = 0 hit |
| M4 | Undo 토스트: `role="status"` + `aria-live="polite"` | grep |
| M5 | 카운트다운 visual indicator (5→4→3→2→1초) | E2E |
| M6 | `Esc` 키로 토스트 dismiss | E2E |
| M7 | `POST /checkouts/:id/revoke-approval` 엔드포인트 존재 + PermissionsGuard | grep |
| M8 | `revokeApproval` 서비스: scope → FSM → 시간(5분) → CAS 순 검증 (MEMORY.md "보안 fail-close 순서") | 코드 + test |
| M9 | `approverId`는 서버 JWT에서 추출 (CLAUDE.md Rule 2) | grep |
| M10 | 시간 초과/상태 전환 발생 시 revoke 400/409 반환 + FE 토스트 "취소 불가" | E2E |
| M11 | `auditLog`: `CHECKOUT_APPROVAL_REVOKED` 이벤트 emit | grep |
| M12 | Optimistic cache rollback은 `invalidateQueries`만 사용 (setQueryData 금지) | grep |
| M13 | 5초 창 내 Undo 클릭 시 서버 호출 자체가 발생하지 않음 (AbortController 경로) | Network tab + E2E |
| M14 | i18n 5+ 키 양 로케일 | `jq` |
| M15 | E2E: 승인 → 3초 후 Undo 클릭 → 원복 / 승인 → 6초 대기 → Undo 시도 → "이미 진행됨" 토스트 / 승인 → 다음 단계 진행 후 Undo 시도 → revoke 실패 | Playwright 3 시나리오 |
| M16 | Bulk (U-01 연계)에서도 동일 `undoWindowMs` 적용 가능 (SHOULD로 분리 가능하나 MUST 권장) | 코드 |
| M17 | 변경 파일 수 ≤ **10** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | Undo window 글로벌 설정 (5초/10초 환경 변수) | `undo-window-config` |
| S2 | Undo 횟수 제한 (rate limit, 동일 user 1분 5회) | `undo-rate-limit` |
| S3 | Undo 토스트 stacking (여러 작업 후 여러 토스트) | `undo-toast-stack` |
| S4 | Undo가 작동하지 않는 명시적 조건 사전 알림 (승인 전 "이 액션은 되돌릴 수 없습니다") | `undo-preview-warn` |
| S5 | Browser close 시 pending mutate flush (sendBeacon) | `pending-mutate-flush` |
| S6 | Revoke-approval audit 이벤트가 알림(notifications)으로도 전파 | `revoke-notification` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter frontend exec eslint apps/frontend/hooks/use-optimistic-mutation.ts

grep -n "undoWindowMs\|AbortController" apps/frontend/hooks/use-optimistic-mutation.ts

grep -n "setQueryData" apps/frontend/hooks/use-optimistic-mutation.ts
# 기대: 0 hit

grep -rn "revoke-approval\|revokeApproval" apps/backend/src/modules/checkouts/

jq '.checkouts.undo.toast' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 10

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u05-undo
pnpm --filter backend run test:e2e -- checkouts/revoke-approval
```

---

## Acceptance

MUST 17개 PASS + 3가지 E2E 시나리오 통과 + `setQueryData` 0건 확인.
SHOULD 미달 항목 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-01 · Bulk — bulk approve 후에도 undo 가능해야 함.
- Sprint 4.5 U-10 · Optimistic UI — 본 contract는 U-10의 옵션 추가. 상호 합류.
- MEMORY.md `feedback_pre_commit_self_audit` 7번 — `setQueryData` 금지 준수.
- MEMORY.md "CAS 409 발생 시 backend detail 캐시 반드시 삭제" — revoke 실패 시 캐시 invalidation.
