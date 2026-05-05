# Evaluation — bulk-selection-tabs-integration

**Iteration**: 1
**Date**: 2026-05-05
**Verdict**: FAIL
**Evaluator model**: claude-sonnet-4-6

---

*(Iter 1 평가 원문은 아래에 보존됨)*

---

## MUST criteria

| # | criterion | result | evidence |
|---|-----------|--------|----------|
| M-1 | Build/Typecheck | PASS | `tsc --noEmit` exit 0; `eslint` sprint scope 파일 4개 exit 0; Generator PASS 보고 신뢰 |
| M-2 | SSOT 재사용 — 신규 중복 0건 | PASS | `useRowSelection` ≥1 ✓; `from '@/components/common/BulkActionBar'` ≥1 ✓; `useOptimisticMutation` 3회(import+2 mutation) ✓; `APPROVAL_KEYS` 2회 ✓; `bulkApproveCheckouts\|bulkRejectCheckouts` 2회 ✓ |
| M-3 | Backend 신규 endpoint 0건 | PASS | `git diff HEAD~1 -- apps/backend/src/modules/checkouts/checkouts.controller.ts` 변경 없음 |
| M-4 | SSOT 위반 0건 | PASS | 하드코딩 URL 0; `setQueryData` 0; 인라인 `code:` string literal 0; queryKeys SSOT 경유 |
| M-5 | CheckoutBulkActionBar 신설 | PASS | 파일 존재; `GenericBulkActionBar` import ✓; AlertDialog 확인 다이얼로그 ✓; `RejectModal mode="bulk"` ✓; `data-testid="bulk-action-bar"` ✓ |
| M-6 | CheckoutGroupCard row 체크박스 | PASS | `onToggleRow?.(row.checkoutId)` emit ✓; `disabled={!rowSelectable}` (pending+canApprove 조건) ✓; `onClick={(e) => e.stopPropagation()}` ✓; `e.nativeEvent.isComposing` IME 가드 ✓ |
| M-7 | i18n parity | **FAIL** | `bulk` 섹션 5키 (≥10키 미달). Plan Phase E는 `bulk.approveAll`, `bulk.rejectAll`, `bulk.approveResult` 등 11키를 bulk 섹션에 명시했으나, Generator가 6키를 `toasts.bulk*` 네임스페이스로 이동. 계약 "bulk.* 신규 키 ≥10키" 조건은 JSON 경로 기준으로 `bulk` 섹션 직접 자식만 해당 — 5키 충족 불가. ko/en parity(차집합 0) 및 `groupCard.selectRowAria/selectRowDisabled` ko/en 양쪽 존재 조건은 충족. |
| M-8 | Permissions 보안 | PASS | `Permission.APPROVE_CHECKOUT` 1회 ✓; `canApproveCheckout` conditional wrap ✓; body에 `approverId` 전달 0건 ✓ |
| M-9 | Next.js 16 / React 19 옛날 API 0건 | PASS | `useFormState` 0; `middleware.ts` 미존재; `params: { id: string }` 직접 접근 패턴 0 |
| M-10 | WCAG 4.1.2 / 1.3.1 | PASS | `GenericBulkActionBar`에 `role="toolbar"` + `aria-label` + `aria-live="polite"` ✓; wrapper div `aria-hidden={!isVisible}` ✓; `groupCard.selectRowAria` i18n 동적 aria-label ✓; Radix Checkbox `checked='indeterminate'` → 자동 `aria-checked="mixed"` ✓ |
| M-11 | Unit test 회귀 0건 | PASS | `pnpm test -- components/checkouts` exit 0, 11 PASS. 단 `CheckoutBulkActionBar.test.tsx` 신규 파일은 계약 원문에서 "권장"(SHOULD)으로 명시됨 → MUST 조건은 exit 0만 |
| M-12 | E2E spec 신규 (최소 1건) | **FAIL** | 계약 지정 경로 `apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts` 미존재. 실제 파일은 `apps/frontend/tests/e2e/workflows/wf-co02-outbound-bulk-action.spec.ts`에 위치. spec 내용 자체(happy path 4스텝, `data-testid="bulk-action-bar"` 가시성 토글, AlertDialog 확인)는 계약 요건 충족하나 계약이 명시한 경로와 불일치 |

**MUST FAIL 항목: M-7, M-12 (2건)**

---

## SHOULD criteria

| # | criterion | result | follow-up tech-debt |
|---|-----------|--------|---------------------|
| S-1 | Group toggle 헬퍼 추출 | deferred | `handleToggleGroup`이 `OutboundCheckoutsTab` 내 인라인 `useCallback`으로 구현됨. `lib/checkouts/group-selection.ts`의 `createGroupToggleHandler` 추출은 별도 sprint 권장 → `tech-debt-tracker.md` `group-toggle-helper-extraction` 항목 |
| S-2 | Analytics SSOT 이벤트 | deferred | `lib/analytics/track.ts` `checkout.bulk_approve`, `checkout.bulk_reject` 미등록 → `tech-debt-tracker.md` `bulk-action-analytics-events` 항목 |
| S-3 | Bundle baseline | not verified | 빌드 재실행 미수행(Generator PASS 신뢰). `CheckoutBulkActionBar.tsx` 156줄 신규 추가 — gzip 기준 +5KB 임계치 초과 여부 미측정 |
| S-4 | Inbound 탭 통합 | deferred | 계획대로 `inbound-bulk-receive-integration` 별도 sprint로 분리됨 |
| S-5 | Bulk extended actions | deferred | 계획대로 `checkout-bulk-extended-actions` 별도 sprint로 분리됨 |

---

## verify-* skills

| skill | result | notes |
|-------|--------|-------|
| verify-bulk-action-bar | PASS | Step 1 aria-live="polite" ✓; Step 2 role=toolbar + aria-label ✓; Step 4 aria-hidden={!isVisible} ✓; Step 5 indeterminate Radix ✓; Step 7 IME guard 3곳 ✓; Step 8 getGroupRowIds/deriveGroupSelectionState/toCheckboxCheckedProp SSOT 6곳 ✓ |
| verify-frontend-state | PASS | setQueryData 0건; useRowSelection 단일 선택 state (이중관리 없음); prop drilling 2단계(Tab→GroupCard) 이내 |
| verify-cache-events | PASS | `CheckoutCacheInvalidation.APPROVAL_KEYS` invalidateKeys 2 mutation 모두 적용 |
| verify-i18n | PARTIAL FAIL | ko/en parity 차집합 0 ✓; bulk 섹션 5키 (계약 ≥10 미달) — M-7 FAIL 연동 |
| verify-design-tokens | PASS | `APPROVAL_BULK_BAR_TOKENS.fixedBottom/visible/hidden/genericOverride` 재사용; `CHECKOUT_ITEM_ROW_TOKENS.gridWithCheckbox/zoneCheckbox` SSOT 신설 |
| verify-checkout-fsm | PASS | `isSelectable: (c) => c.status === CSVal.PENDING && canApprove` FSM 조건 정확; `CSVal.PENDING` SSOT 경유 |
| verify-ssot | PASS | role 리터럴 0건; eslint-disable 0건; @ts-ignore 0건; 하드코딩 URL 0건; queryKeys SSOT 경유 |
| verify-implementation | PASS | useOptimisticMutation 2개(approve/reject) 각각 정확한 mutationFn + queryKey + invalidateKeys + onSuccessCallback |

---

## review-architecture

### 1. 전체 구조 일관성

`CheckoutBulkActionBar.tsx`는 `approvals/BulkActionBar.tsx` 패턴을 충실히 차용하였으며, generic `BulkActionBar`를 wrapping하는 도메인 특화 wrapper 구조가 일관성 있다. `APPROVAL_BULK_BAR_TOKENS`를 checkout 도메인에서 재사용한 것은 토큰 의미("approval 액션 바 위치/전환")가 checkout 도메인과 동일하므로 타당하다.

### 2. useOptimisticMutation 인스턴스 격리 문제

`bulkApproveMutation`과 `bulkRejectMutation` 모두 동일한 `queryKey: queryKeys.checkouts.view.outbound({...apiParams, teamId})`를 사용한다. 이 queryKey는 컴포넌트 렌더링 시 `apiParams` 기반으로 파생되므로 필터 변경 시 키가 바뀌고 mutation 인스턴스가 orphan이 될 수 있다. 단, `useOptimisticMutation` 내부에서 queryKey를 onSettled에서 prefix-match invalidation하므로 실제 stale 데이터 위험은 낮다. 동일한 trade-off가 코드베이스 전체에 존재하므로 회귀는 아니다.

### 3. isProcessing vs isPending 이중 pending state

`CheckoutBulkActionBar`에는 `isPending` prop(부모가 내려주는 mutation pending)과 내부 `isProcessing` useState가 별도로 존재한다. `handleBulkApprove`는 `await onBulkApprove()`를 실행하는데, 부모의 `onBulkApprove`는 `bulkApproveMutation.mutate(...)` → **void 반환**이다. `await void`는 즉시 resolve되므로 `isProcessing`이 API 응답 전에 `false`로 전환되어 AlertDialog가 즉시 닫힌다. 이는 UX 버그 소지가 있으나 `isPending` prop이 버튼 disabled를 처리하므로 실제 사용자 조작은 막힌다. 근본 해결은 `onBulkApprove: () => Promise<void>`로 타입을 강화하고 부모에서 `mutateAsync`를 사용하는 것이다.

### 4. resetOn 필터 키 파생

`const filtersKey = JSON.stringify(filters)`를 `useRowSelection`의 `resetOn`에 사용한다. `filters` 객체가 안정된 참조를 보장받지 못할 경우 매 렌더마다 새 문자열이 생성되어 selection이 매 렌더마다 초기화될 위험이 있다. 실제로는 URL searchParams 기반이므로 탐색 없이 재렌더만 되는 경우 문제가 없지만, memoization 부재는 잠재적 회귀 지점이다.

### 5. CheckoutBulkActionBar DOM 조건부 렌더

`isVisible && <GenericBulkActionBar />` 패턴으로 wrapper div는 유지하지만 내부 `GenericBulkActionBar`(= `role="toolbar"` 포함)는 조건부 렌더다. 이는 계약 M-10의 "DOM 유지" 정신을 wrapper 레벨에서만 충족하고 toolbar 레벨에서는 마운트/언마운트가 발생한다. ApprovalsBulkActionBar 패턴과 비교 시 일관성 있음(동일 패턴).

---

## review-design

### 접근성 (WCAG 2.1 AA)

- **SC 4.1.2 Name/Role/Value**: `role="toolbar"` + `aria-label` 정확히 적용. `role="row"` + `aria-selected` row 영역 정확.
- **SC 1.3.1 Info/Relationships**: `role="grid"` > `role="row"` > `role="gridcell"` WAI-ARIA grid 패턴 유지. zone 0 체크박스 셀에 `role="gridcell"` 정확.
- **SC 3.3.4 Error Prevention**: AlertDialog 확인 다이얼로그로 bulk approve 전 의도 확인.
- **SC 2.4.7 Focus Visible**: Radix Checkbox 기본 focus-visible 상속.
- **잠재 이슈**: `aria-hidden={!isVisible}` 내부 `isVisible && <GenericBulkActionBar />`는 SR이 `aria-hidden="true"` wrapper 내부에 접근하지 않으므로 screen reader 혼란 없음.

### 디자인 토큰 일관성

- `APPROVAL_BULK_BAR_TOKENS` 재사용(checkout 도메인이 approval 도메인 토큰 차용)은 의미상 수용 가능하나, 장기적으로 `CHECKOUT_BULK_BAR_TOKENS`로 분리가 권장됨.
- `gridWithCheckbox` 토큰이 `CHECKOUT_ITEM_ROW_TOKENS`에 추가되어 SSOT 유지.

### 10 anti-pattern 체크

1. `transition: all` 사용 0건 ✓
2. `dark:` prefix 사용 0건 ✓
3. 하드코딩 색상값 0건 ✓
4. 동적 JIT 클래스(`text-brand-${key}`) 0건 ✓
5. `focus` > `focus-visible` 준수 ✓
6. `role="alert"` vs `role="status"` 혼용: `aria-live="polite"` 적절 ✓
7. setQueryData 0건 ✓
8. `eslint-disable` 0건 ✓
9. role 리터럴 0건 ✓
10. `useFormState` 0건 ✓

---

## playwright-e2e

개발 서버가 미기동 상태이므로 브라우저 런타임 실행 대신 spec 정합성 검증을 수행하였다.

**spec 파일**: `apps/frontend/tests/e2e/workflows/wf-co02-outbound-bulk-action.spec.ts` (181줄)

**정합성 검증 결과**:
- `auth.fixture`에서 `testOperatorPage`, `techManagerPage` fixture 참조 — verify-e2e Step 25 준수(워크플로 spec → `techManagerPage` 사용, scope 검증용 systemAdmin 미사용) ✓
- Step 2: `expect(bar).toHaveAttribute('aria-hidden', 'true')` — React는 `aria-*` 속성을 false여도 DOM에 유지하므로 Step 3의 `aria-hidden='false'` assertion 정상 ✓
- Step 4: `page.route('**/api/checkouts/bulk-approve', ...)` mock으로 backend 영향 분리 ✓
- Step 5: `aria-live="polite"` toolbar 속성 검증 — `GenericBulkActionBar`에 `aria-live="polite"` 실제 존재 ✓
- `test.describe.configure({ mode: 'serial' })` + beforeAll/afterAll fixture 격리 ✓

**M-12 경로 불일치**: 계약이 `tests/e2e/checkouts/outbound-bulk-action.spec.ts`를 요구하나 파일은 `tests/e2e/workflows/wf-co02-outbound-bulk-action.spec.ts`에 위치. spec 내용은 계약 요건(happy path, BulkActionBar 가시성 토글, AlertDialog) 충족. 경로만 불일치.

---

## Repair instructions (FAIL 항목별)

### M-7 수정 (bulk.* 키 ≥10키)

**원인**: Generator가 plan Phase E에서 `bulk` 섹션에 명시한 6키(`approveAll`, `approveResult`, `approveError`, `rejectAll`, `rejectResult`, `rejectError`)를 `toasts.bulk*` 네임스페이스로 이동하여 `bulk` 섹션이 5키에 그침.

**수정 방법 (두 가지 중 선택)**:

방법 A (권장 — plan 일치): `bulk` 섹션에 6키 추가이동.

```json
// messages/ko/checkouts.json 및 messages/en/checkouts.json 의 "bulk" 섹션
"bulk": {
  "approve": "선택 일괄 승인",
  "reject": "선택 일괄 반려",
  "confirmApproveTitle": "{count}건 일괄 승인",
  "confirmApproveDescription": "선택한 반출 {count}건을 모두 승인합니다. 부분 실패가 발생할 수 있습니다.",
  "approveAll": "{count}건 일괄 승인 완료",
  "approveResult": "성공 {success}건 / 실패 {failed}건",
  "approveError": "일괄 승인에 실패했습니다",
  "rejectAll": "{count}건 일괄 반려 완료",
  "rejectResult": "성공 {success}건 / 실패 {failed}건",
  "rejectError": "일괄 반려에 실패했습니다",
  "ariaLabel": "반출 일괄 액션 도구모음"
}
```

그 후 `OutboundCheckoutsTab.tsx`에서 `t('toasts.bulkApproveAll')` → `t('bulk.approveAll')` 등 6곳 키 경로 수정. `toasts.bulk*` 키는 삭제 또는 보존(parity 유지 필요).

방법 B: 계약 조건을 "bulk 섹션 + toasts.bulk* 합산 ≥10"으로 재해석 허용 시 현행 유지 가능(11키). 단, 이는 계약 문구 변경이 필요하며 Evaluator 단독 결정 불가.

### M-12 수정 (E2E spec 경로)

**원인**: spec 파일이 `tests/e2e/workflows/`에 생성됨. 계약은 `tests/e2e/checkouts/` 경로를 명시.

**수정 방법**:

```bash
# 파일을 계약 지정 경로로 이동
mv apps/frontend/tests/e2e/workflows/wf-co02-outbound-bulk-action.spec.ts \
   apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts
```

또는 심볼릭 링크 대신 파일 복사 후 원본 삭제. spec 파일 내 import 경로(`'../shared/fixtures/auth.fixture'`, `'./helpers/workflow-helpers'`)를 새 위치 기준으로 수정 필요.

- `'../shared/fixtures/auth.fixture'` → `'../shared/fixtures/auth.fixture'` (동일)
- `'./helpers/workflow-helpers'` → `'../workflows/helpers/workflow-helpers'`
- `'../shared/constants/shared-test-data'` → 동일
- `'../shared/helpers/toast-helpers'` → 동일

---

## Recommendations for follow-up

### tech-debt-tracker.md 등록 권장 항목

#### S-1. group-toggle-helper-extraction

```
- [ ] `lib/checkouts/group-selection.ts`에 `createGroupToggleHandler(selection, items)` 추출
  - 대상: `OutboundCheckoutsTab.tsx` handleToggleGroup 인라인 useCallback
  - 목적: 향후 InboundCheckoutsTab 통합 시 동일 패턴 재사용
  - 우선순위: LOW (기능 영향 없음)
```

#### S-2. bulk-action-analytics-events

```
- [ ] `lib/analytics/track.ts`에 `checkout.bulk_approve`, `checkout.bulk_reject` 이벤트 등록
  - PII deny-list 준수 (userId/email 제외)
  - 대상 파일: OutboundCheckoutsTab.tsx onSuccessCallback 내부
  - 우선순위: LOW (기능 영향 없음)
```

#### 아키텍처 보완 권장

1. **`onBulkApprove` 타입 강화**: `() => void | Promise<void>` → `() => Promise<void>`로 강화하고 부모에서 `mutateAsync` 사용. 현재 AlertDialog가 API 응답 전에 닫히는 UX 불일치 해소.
2. **`CheckoutBulkActionBar.test.tsx` 단위 테스트**: AlertDialog 열기/닫기, RejectModal mount, `isPending` → disabled 동작, 0건 시 aria-hidden=true 검증.
3. **`filtersKey` memoization**: `const filtersKey = useMemo(() => JSON.stringify(filters), [filters])` 추가하여 불필요한 selection 초기화 방어.

---

---

# Evaluation — bulk-selection-tabs-integration (Iteration 2)

**Date**: 2026-05-05
**Iteration**: 2
**Verdict**: PASS-with-deferred-SHOULD
**Evaluator model**: claude-sonnet-4-6

---

## Iter 1 → Iter 2 변화

| Iter 1 issue | Iter 2 status |
|---|---|
| M-7 FAIL — bulk.* keys 5건 (≥10 미달) | **RESOLVED** — `bulk` 섹션 11키 확인 (approve/reject/confirmApproveTitle/confirmApproveDescription/ariaLabel/approveAll/approveResult/approveError/rejectAll/rejectResult/rejectError). `toasts.bulk*` 키는 완전 제거. ko/en 동일 11키 |
| M-12 FAIL — spec 경로 `tests/e2e/workflows/wf-co02-*` | **RESOLVED** — `apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts` 계약 지정 경로에 존재. workflows 디렉토리에 잔존 없음. import 경로 `'../workflows/helpers/workflow-helpers'` 정확히 수정됨 |
| S-1 SHOULD — group toggle 헬퍼 추출 | **RESOLVED** — `lib/checkouts/group-selection.ts`에 `applyGroupToggle` 신설. `OutboundCheckoutsTab`에서 인라인 핸들러 → `applyGroupToggle()` 직접 호출. 15 tests PASS |
| S-2 SHOULD — analytics 등록 | **RESOLVED** — `track('checkout.bulk_approve', { count })` + `track('checkout.bulk_reject', { count })` 등록. PII deny-list 준수(count만 전달) |
| S-3 SHOULD — bundle baseline | **DEFERRED** — bundle-gate runner 본 환경 미복원. 신규 외부 dep 0건 + helper/wrapper 추가만이라 First Load JS 영향 미미. tech-debt 별도 관리 |
| UX 버그 — `await onBulkApprove()` void 반환 | **DEFERRED** — 코드베이스 전반 동일 패턴(ApprovalsClient 포함). 전 도메인 `mutateAsync` 통일 sprint 분리 유지 |

---

## MUST criteria (re-verified)

| # | criterion | result | evidence |
|---|-----------|--------|----------|
| M-1 | Build/Typecheck | PASS | Generator PASS 보고(tsc --noEmit exit 0 + ESLint 6 changed files exit 0 + build PASS) — iter 2 추가 변경 경량(주석 수정 + import 경로 수정)이므로 iter 1 검증 신뢰 |
| M-2 | SSOT 재사용 — 신규 중복 0건 | PASS | `useRowSelection` 2회 ✓; `from '@/components/common/BulkActionBar'` 1회 ✓; `useOptimisticMutation` 3회 ✓; `APPROVAL_KEYS` 2회 ✓; `bulkApproveCheckouts\|bulkRejectCheckouts` 2회 ✓ |
| M-3 | Backend 신규 endpoint 0건 | PASS | 최근 5커밋 중 checkouts.controller.ts 변경 없음. 신규 bulk backend 엔드포인트 0건 |
| M-4 | SSOT 위반 0건 | PASS | 하드코딩 URL 0건; `setQueryData` 0건(Tab+Bar 모두); 인라인 `code:` string 0건; queryKeys.checkouts.view.outbound SSOT 경유 3회 |
| M-5 | CheckoutBulkActionBar 신설 | PASS | 파일 존재(5095B); `GenericBulkActionBar` import ✓; AlertDialog 확인 다이얼로그 ✓; `RejectModal mode='bulk'` 1회 ✓; `data-testid="bulk-action-bar"` ✓ |
| M-6 | CheckoutGroupCard row 체크박스 | PASS | `onToggleRow?.(row.checkoutId)` emit ✓; `rowSelectable = showRowCheckbox && row.status === CSVal.PENDING && row.canApproveItem` 조건 ✓; `onClick={(e) => e.stopPropagation()}` ✓; `e.nativeEvent.isComposing` IME 가드 2곳 ✓ |
| M-7 | i18n parity | **PASS** | `bulk` 섹션 11키(≥10 ✓); ko/en 대칭 차집합 0건; `groupCard.selectRowAria` + `groupCard.selectRowDisabled` ko/en 양쪽 존재; `toasts.bulk*` 완전 제거; `OutboundCheckoutsTab` `t('bulk.approveAll')` 등 10회 호출로 이동 완료 |
| M-8 | Permissions 보안 | PASS | `Permission.APPROVE_CHECKOUT` 1회 ✓; body `approverId` 전달 0건 ✓ |
| M-9 | Next.js 16 / React 19 옛날 API 0건 | PASS | sprint scope 5개 파일 모두 `useFormState` 0건; `middleware.ts` 미존재; `params` 직접 접근 0건 |
| M-10 | WCAG 4.1.2 / 1.3.1 | PASS | `role="toolbar"` + `aria-label` GenericBulkActionBar ✓; wrapper `aria-hidden={!isVisible}` ✓; `groupCard.selectRowAria` 동적 aria-label ✓; Radix Checkbox indeterminate → `aria-checked="mixed"` 자동 ✓ |
| M-11 | Unit test 회귀 0건 | PASS | `components/checkouts` + `lib/checkouts` 26 tests PASS (CheckoutGroupCard 11 + group-selection 15 = 26). iter 1 대비 +5(applyGroupToggle suite) |
| M-12 | E2E spec 신규 (최소 1건) | **PASS** | `apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts` 계약 경로에 존재(6779B); import 경로 4개 모두 실재 확인(`../workflows/helpers/workflow-helpers` ✓ `../shared/fixtures/auth.fixture` ✓ `../shared/constants/shared-test-data` ✓ `../shared/helpers/toast-helpers` ✓); bulk approve happy path 1건(Step 4 `page.route` mock + AlertDialog 확인); `data-testid="bulk-action-bar"` 가시성 토글 4회 검증; `describe` + `step` 텍스트에 WF-CO02 prefix 제거 ✓; `techManagerPage` fixture(워크플로 actor, systemAdmin 미사용) ✓ — verify-e2e Step 25 준수 |

**MUST FAIL 항목: 0건 — 전항목 PASS**

---

## SHOULD criteria

| # | criterion | result | 비고 |
|---|-----------|--------|------|
| S-1 | Group toggle 헬퍼 추출 | **PASS** | `applyGroupToggle<T extends {id:string}>` 신설. `OutboundCheckoutsTab` 인라인 핸들러 → 헬퍼 1줄 호출. 15 unit tests(기존 10 + 신규 5) PASS |
| S-2 | Analytics SSOT 이벤트 | **PASS** | `track('checkout.bulk_approve', { count })` + `track('checkout.bulk_reject', { count })` 등록. PII deny-list 준수(userId/email 미전달, count만) |
| S-3 | Bundle baseline | deferred | bundle-gate runner 미복원으로 미측정. 신규 외부 dep 0건 — 임계치 초과 낮음. tech-debt 분리 |
| S-4 | Inbound 탭 통합 | deferred | `inbound-bulk-receive-integration` 별도 sprint 유지 |
| S-5 | Bulk extended actions | deferred | `checkout-bulk-extended-actions` 별도 sprint 유지 |

---

## verify-* skills (iter 2 경량 검증)

| skill | result | notes |
|-------|--------|-------|
| verify-bulk-action-bar | PASS | Step 7 IME guard 2곳(GroupCard group/row) ✓; Step 8 getGroupRowIds/deriveGroupSelectionState/toCheckboxCheckedProp SSOT 경유 ✓; applyGroupToggle 신규 헬퍼 SSOT 추출 ✓ |
| verify-frontend-state | PASS | `setQueryData` 0건 유지; `useRowSelection` 단일 state 관리; `applyGroupToggle` 순수함수 추출로 인라인 핸들러 복잡도 감소 |
| verify-cache-events | PASS | `CheckoutCacheInvalidation.APPROVAL_KEYS` invalidateKeys 2 mutation 모두 유지 |
| verify-i18n | PASS | ko/en 대칭 차집합 0건; bulk 섹션 11키(≥10 ✓); groupCard.selectRow* ko/en 양쪽; stale 주석(spec 143줄 `toasts.bulkApproveAll`) 기능 영향 없음 |
| verify-design-tokens | PASS | `APPROVAL_BULK_BAR_TOKENS` + `CHECKOUT_ITEM_ROW_TOKENS.gridWithCheckbox` SSOT 유지 |
| verify-checkout-fsm | PASS | `rowSelectable = ... CSVal.PENDING && canApproveItem` FSM 조건 정확; CSVal SSOT 경유 |
| verify-ssot | PASS | 하드코딩 URL 0; eslint-disable 0; @ts-ignore 0; role 리터럴 0; queryKeys SSOT |
| verify-implementation | PASS | applyGroupToggle 5 unit tests(allSelected=true 전체 deselect ✓; lookup miss 무시 ✓; 빈 rowIds 미호출 ✓; item 참조 snapshot ✓; partial toggle ✓) — 계약 일치 |
| verify-e2e (actor 정합) | PASS | 워크플로 spec → `techManagerPage`(=tech_manager 역할) 사용. systemAdmin 미사용 — verify-e2e Step 25 준수 |

---

## 발견된 부가 이슈 (MUST/SHOULD 무관, 회귀 아님)

1. **spec 143줄 stale 주석**: `// toast: "..." (checkouts.toasts.bulkApproveAll)` — 실제 키는 `bulk.approveAll`로 이동됐지만 주석이 구버전 경로를 참조. 런타임/테스트 영향 없음. 다음 spec 편집 시 수정 권장.
2. **iter 1에서 지적된 `isProcessing` + void 반환 UX 버그**: 미수정 유지(전 도메인 일관성 차원에서 별도 sprint 분리 결정). 재확인 결과 `isPending` prop이 버튼 disabled 처리하므로 실제 조작 방지는 동작함.
3. **`filtersKey` memoization 미적용**: iter 1 권장 사항. 필터 안정성 이슈 낮음(URL 기반)이나 잠재 회귀 지점으로 tech-debt 유지.

---

## Repair instructions

No FAIL items. 수정 지시사항 없음.

---

## tech-debt 분리 권장 항목

- **bundle-gate-runner-restoration** — `bundle-gate.mjs` runner 복원 후 sprint baseline 갱신 + First Load JS gzip 임계치 자동 검증 재활성화
- **mutateAsync-ux-consistency** — 전 도메인 `onBulkApprove`/`onBulkReject` 콜백을 `() => Promise<void>` 타입으로 강화 + 호출처 `mutateAsync` 전환 (AlertDialog가 API 응답 전 닫히는 UX 불일치 해소)
- **checkout-bulk-action-bar-unit-test** — `CheckoutBulkActionBar.test.tsx` 신규 작성: AlertDialog 열기/닫기, RejectModal mount, `isPending → disabled`, 0건 시 `aria-hidden="true"` 검증 (계약 M-11은 "권장"으로 명시됐으나 현재 미작성)
- **filters-key-memoization** — `OutboundCheckoutsTab`의 `filtersKey = JSON.stringify(filters)` → `useMemo(() => JSON.stringify(filters), [filters])` 전환 (불필요한 selection 초기화 방어)
- **inbound-bulk-receive-integration** — `InboundCheckoutsTab` bulk receive 통합 (S-4)
- **checkout-bulk-extended-actions** — bulk-cancel / bulk-return / bulk-borrower-approve backend endpoint + frontend wiring (S-5)
