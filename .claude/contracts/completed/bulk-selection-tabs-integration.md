# Contract — bulk-selection-tabs-integration

**Slug**: `bulk-selection-tabs-integration`
**Mode**: 2
**Plan**: `.claude/exec-plans/active/2026-05-05-bulk-selection-tabs-integration.md`
**Created**: 2026-05-05

---

## MUST (필수 — 1건 FAIL = Generator iteration)

### M-1. Build/Typecheck

- `pnpm --filter frontend run tsc --noEmit` exit 0
- `pnpm --filter frontend run lint` exit 0
- `pnpm --filter frontend run build` exit 0

### M-2. SSOT 재사용 — 신규 중복 0건

- `useRowSelection` 재사용 (NOT 새 selection hook)
  - `grep -rn "useRowSelection" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx | wc -l` ≥ 1
- `BulkActionBar` (common) 재사용 — `CheckoutBulkActionBar.tsx`는 wrapper만
  - `grep -n "from '@/components/common/BulkActionBar'" apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx | wc -l` ≥ 1
- `useOptimisticMutation` 재사용 — bulk approve/reject 모두 적용
  - `grep -c "useOptimisticMutation" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` ≥ 2
- `CheckoutCacheInvalidation.APPROVAL_KEYS` 재사용
  - `grep -c "APPROVAL_KEYS" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` ≥ 1
- `checkoutApi.bulkApproveCheckouts` + `checkoutApi.bulkRejectCheckouts` 재사용
  - `grep -c "bulkApproveCheckouts\|bulkRejectCheckouts" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` ≥ 2

### M-3. Backend 신규 endpoint 0건

- `git diff apps/backend/src/modules/checkouts/checkouts.controller.ts` 변경 없음
- 신규 backend bulk 엔드포인트 0개

### M-4. SSOT 위반 0건

- 하드코딩 URL 0건 — `grep -rn "'/checkouts/bulk" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` = 0
- 하드코딩 query key 0건 — `queryKeys.checkouts.view.outbound` 경유
- 인라인 `code:` string literal 0건 (verify-zod Step 16)
- `setQueryData` 0건 (use-optimistic-mutation 위임) — `grep -c "setQueryData" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` = 0

### M-5. CheckoutBulkActionBar 신설

- 파일 존재: `apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx`
- generic `BulkActionBar` import 사용
- approve action AlertDialog 확인 다이얼로그 보유
- reject action `RejectModal mode='bulk'` 사용
- `data-testid="bulk-action-bar"` 보유

### M-6. CheckoutGroupCard row 체크박스

- `onToggleRow` prop 실제 emit (현재는 prop API surface만 존재)
- pending+canApprove 외 항목은 disabled
- `e.stopPropagation()` row click 충돌 방지
- IME 가드 `e.nativeEvent.isComposing`

### M-7. i18n parity

- `messages/ko/checkouts.json` `bulk.*` 신규 키 존재 (≥10키)
- `messages/en/checkouts.json` 동일 키 동일 구조
- `groupCard.selectRowAria`, `groupCard.selectRowDisabled` ko/en 양쪽
- ko-only 또는 en-only 키 0건

### M-8. Permissions 보안

- `Permission.APPROVE_CHECKOUT` 보호 — backend는 기존 가드. frontend는 BulkActionBar 가시성을 `can(Permission.APPROVE_CHECKOUT)`로 가드
  - `grep -c "Permission.APPROVE_CHECKOUT" apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` ≥ 1
- 클라이언트가 `approverId`를 body에 전달하지 않음 (Rule 2)

### M-9. Next.js 16 / React 19 옛날 API 0건

- `useFormState` 사용 0건 (deprecated → useActionState)
- `middleware.ts` 사용 0건 (proxy.ts)
- `params: { id: string }` direct access 패턴 0건 (Promise + await)
- 본 sprint 변경 파일에서:
  - `grep -c "useFormState" $(git diff --name-only | grep -E 'tsx?$')` = 0

### M-10. WCAG 4.1.2 / 1.3.1

- BulkActionBar `role="toolbar"` + `aria-label` (GenericBulkActionBar 상속)
- BulkActionBar 0건 시 `aria-hidden="true"` (DOM 유지 — SR 접근성)
- group/row checkbox `aria-label` 동적 (i18n 키)
- group checkbox indeterminate 시 `aria-checked="mixed"` (Radix 자동)

### M-11. Unit test 회귀 0건

- `pnpm --filter frontend run test -- components/checkouts` exit 0
- 신규 test 파일 권장 — `CheckoutBulkActionBar.test.tsx` (단위)

### M-12. E2E spec 신규 (최소 1건)

- 파일 존재: `apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts`
- bulk approve happy path 1건 (admin 토큰)
- `data-testid="bulk-action-bar"` 가시성 토글 검증

---

## SHOULD (권장 — FAIL 시 tech-debt 분리, loop 차단 안 함)

### S-1. Group toggle 헬퍼 추출

`lib/checkouts/group-selection.ts`에 `createGroupToggleHandler(selection, items)` 추가 권장 (인라인 핸들러 단순화). 본 sprint에서는 인라인 가능.

### S-2. Analytics SSOT 이벤트

`lib/analytics/track.ts`에 `checkout.bulk_approve`, `checkout.bulk_reject` 이벤트 등록 권장. PII deny-list 준수.

### S-3. Bundle baseline

본 sprint 변경으로 First Load JS gzip +5KB 미만 권장. 초과 시 baseline 갱신 + 사유 기록.

### S-4. Inbound 탭 통합

별도 sprint(`inbound-bulk-receive-integration`)로 분리. 본 sprint에서는 OutboundCheckoutsTab만.

### S-5. Bulk extended actions

bulk-cancel / bulk-return / bulk-borrower-approve backend endpoint + frontend wiring. 별도 sprint(`checkout-bulk-extended-actions`).

---

## 평가 절차 (Evaluator)

1. `cd /home/kmjkds/equipment_management_system`
2. M-1 build verification → tsc/lint/build
3. M-2~M-9 grep + 정적 분석
4. M-10 RTL test 확인
5. M-11 unit test 실행
6. M-12 e2e spec 존재 + dry-run (browser 가용 시)
7. verify-* skills 13개 순회
8. review-architecture (Mode 2)
9. **review-design (frontend changes)**
10. **playwright-e2e** browser runtime verification (가능 시)
11. evaluations/{slug}.md 작성

## 반복 한도

- 최대 3 iteration
- 동일 issue 2회 연속 FAIL = manual intervention 필요
