# Contract: srp-decomposition-final

**Date**: 2026-05-09  
**Mode**: Mode 1 (Lightweight)  
**Slug**: srp-decomposition-final  
**Domains**: checkouts + approvals (frontend SRP 분해)

## Scope

### Phase C.1: CheckoutEquipmentRow 추출
- `apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx` — 신설
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — row map() JSX 제거 → 신규 컴포넌트 사용
- `apps/frontend/components/checkouts/__tests__/CheckoutEquipmentRow.spec.tsx` — 신규 spec

### Phase B: ApprovalsClient 분해
- `apps/frontend/hooks/use-approval-row-transitions.ts` — processingIds/exitingIds 상태 머신
- `apps/frontend/hooks/use-approvals-item-mutations.ts` — approve + reject useOptimisticMutation
- `apps/frontend/hooks/use-approvals-bulk-mutations.ts` — bulkApprove + bulkReject + comment 상태
- `apps/frontend/components/approvals/ApprovalCommentDialog.tsx` — single/bulk 통합 다이얼로그
- `apps/frontend/components/approvals/ApprovalsClient.tsx` — 4 mutation 인라인 제거 + 2 Dialog JSX 제거

### Phase axe (LOW — Storybook 미설치이므로 axe-core 단독):
- CheckoutEquipmentRow.spec.tsx에 axe-core 접근성 assertion 포함

---

## MUST Criteria

### M-1: 빌드 통과
```bash
pnpm --filter frontend run tsc --noEmit
```
0 에러

### M-2: 단위 테스트 통과
```bash
pnpm --filter frontend run test -- --testPathPattern="CheckoutEquipmentRow|use-approvals"
```
0 실패

### M-3: CheckoutGroupCard 라인 수 감소
```bash
wc -l apps/frontend/components/checkouts/CheckoutGroupCard.tsx
```
≤ 430 라인

### M-4: ApprovalsClient 라인 수 감소
```bash
wc -l apps/frontend/components/approvals/ApprovalsClient.tsx
```
≤ 330 라인

### M-5: ApprovalsClient에 인라인 mutation 없음
```bash
grep -c "useOptimisticMutation" apps/frontend/components/approvals/ApprovalsClient.tsx
```
0

### M-6: ApprovalsClient에 Dialog JSX 없음 (comment dialog)
```bash
grep -c "approve-comment\|bulk-approve-comment" apps/frontend/components/approvals/ApprovalsClient.tsx
```
0

### M-7: `any` 타입 없음 (신규 파일)
```bash
grep -rn ": any" apps/frontend/hooks/use-approvals-item-mutations.ts apps/frontend/hooks/use-approvals-bulk-mutations.ts apps/frontend/hooks/use-approval-row-transitions.ts apps/frontend/components/approvals/ApprovalCommentDialog.tsx apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx
```
0 결과

### M-8: SSOT 임포트 (schemas/shared-constants/queryKeys)
```bash
grep -rn "UserRole\|ApprovalCategory" apps/frontend/hooks/use-approvals-item-mutations.ts apps/frontend/hooks/use-approvals-bulk-mutations.ts
```
모두 `@equipment-management/schemas` 또는 `@/lib/api/approvals-api` 임포트여야 함 (로컬 재정의 없음)

### M-9: React.memo 적용 (CheckoutEquipmentRow)
```bash
grep -n "memo\|React.memo" apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx
```
1건 이상

### M-10: IME 가드 보존 (CheckoutEquipmentRow checkbox)
```bash
grep -n "isComposing" apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx
```
1건 이상

### M-11: ApprovalCommentDialog mode 차별화
```bash
grep -n "mode.*single\|mode.*bulk\|'single'\|'bulk'" apps/frontend/components/approvals/ApprovalCommentDialog.tsx
```
1건 이상

### M-12: CheckoutEquipmentRow axe-core 검증
```bash
grep -n "axe\|toHaveNoViolations" apps/frontend/components/checkouts/__tests__/CheckoutEquipmentRow.test.tsx
```
1건 이상

---

## SHOULD Criteria

### S-1: use-approval-row-transitions spec 작성
별도 스펙 파일 또는 통합 스펙에서 timeout clear 검증

### S-2: getInvalidationKeys SSOT — 각 훅 내부에서 동일 패턴으로 구성 (코드 중복 최소화)

### S-3: e2e 회귀 없음 (브라우저 미기동 시 skip)

---

## Exclusions

- Storybook story — 미설치로 제외
- e2e 브라우저 테스트 — 별도 sprint (playwright-e2e 스킬)
- ApprovalsClient 이외 컴포넌트 변경 금지
