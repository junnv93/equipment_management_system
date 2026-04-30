# setQueryData Purge + Bulk UX Improvements 구현 계획

## 메타

- 슬러그: `setqueryd-purge-and-bulk-ux`
- 생성: 2026-04-30
- 모드: Mode 2 (harness Planner→Generator→Evaluator)
- 관련 contract: `.claude/contracts/setqueryd-purge-and-bulk-ux.md`
- 관련 스킬: `verify-frontend-state` (Step 35), `verify-ssot`, `verify-hardcoding`, `verify-i18n`, `verify-design-tokens`
- 예상 변경: 7~9 파일 수정 + 2~3 파일 신규
- 예상 라인: 약 200~280 lines (코드) + 130 lines (SKILL doc)

## 설계 철학

`useOptimisticMutation` SSOT 훅이 onMutate snapshot + onError invalidate 패턴을 이미 캡슐화하고 있는데도, `CheckoutGroupCard.tsx`만 수동으로 `setQueryData(key, snapshot)` 롤백을 구현하고 있다. 이는 verify-frontend-state Step 35(setQueryData 금지) 위반인 동시에, 미래에 `useOptimisticMutation`의 onError 시맨틱이 진화할 때 이 컴포넌트만 갈라지는 SSOT drift 위험을 만든다. **MUST 작업의 본질은 코드 라인 수가 아니라 SSOT 일관성 회복이다.** SHOULD 작업은 그 흐름에서 인접한 Bulk UX 표면 — 동일 영역에서 일하는 동안 일괄 처리 + 사용자 피드백 품질을 함께 끌어올린다.

## Plan 수정 (2026-04-30 사용자 승인)

**방안 M 채택** — Phase 0 사전 검사에서 발견된 사항 반영:

1. **MUST**: 방안 **C+** (useOptimisticMutation 추출 + 단일 view queryKey + invalidateKeys로 멀티 view 후속 동기화)
   - 트레이드오프: optimistic UI가 단일 view에만 즉시 반영, 다른 view는 100~300ms 후 invalidate refetch. 사용자 동의됨.
   - useOptimisticMutation의 자동 CAS 409 처리 활용 + onErrorCallback에 `removeQueries(detail)` 추가
2. **S9 (charsRemaining)**: 방안 **α** — `REQUIRED_FIELD_TOKENS.charCount` design token 재사용 + 인라인 `{count} / {max}` (NCEditDialog 패턴) + aria-live 추가. 신규 i18n 키 0건. 5곳 통합은 tech-debt-tracker로 후속.
3. **S2 (IME guard)**: 방안 **α** — hook 변경 없음. 호출자 onKeyDown에 `e.nativeEvent.isComposing` 가드. SKILL doc(S1) Step 7로 패턴 명시.
4. **신규 발견**: NCEditDialog 인라인 `{cause.length} / 500` 하드코딩, Disposal 3개 `t('common.charCount')`이지만 키는 `disposal.json`에만 존재 — i18n missing 가능성. 둘 다 본 세션 범위 외, tech-debt-tracker 등록.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 승인 mutation 위치 | **인라인 → `hooks/use-checkout-card-mutations.ts` 신규 추출** | use-equipment.ts 패턴 일관성, 단위 테스트 가능성, 다른 컴포넌트(BulkApproveButton 등)에서 재사용 가능, CheckoutGroupCard 가독성 회복(165 lines → 95 lines 추정) |
| Optimistic 시맨틱 | view 축 전체(`queryKeys.checkouts.view.all()`)에 `setQueriesData` map 적용 | 기존 동작 보존 — 한 mutation이 여러 view(outbound/inbound) 캐시를 동시 갱신해야 함. `useOptimisticMutation`은 **단일 queryKey**를 받으므로 `view.all()` prefix를 queryKey로 넘기면 TanStack Query가 prefix-match로 모든 하위 view 쿼리에 optimisticUpdate 적용 |
| TCachedData 타입 | `PaginatedResponse<Checkout, CheckoutSummary>` | 기존과 동일 (line 184). optimisticUpdate 함수가 `data.map(...)`로 status 전이만 수행 |
| onError 처리 | `useOptimisticMutation`의 onSettled invalidate에 위임. **단, CAS 409 시 `removeQueries(detail)`는 별도 보존** — `onErrorCallback`에 isConflictError 분기 + removeQueries 호출 | `useOptimisticMutation`의 기본 onError는 invalidate를 onSettled에서 처리하지만, **detail 캐시 제거**는 옵션이 아님(기존 동작). MEMORY *"CAS 409 발생 시 backend detail 캐시 반드시 삭제"* 보존 |
| onSettled 통합 | `invalidateKeys`에 `CheckoutCacheInvalidation.APPROVAL_KEYS` 전체 spread | 기존 `invalidateAfterApproval`이 호출하는 `invalidateByKeys`와 동등. 훅 외부 invalidateQueries 호출 0개 — verify-frontend-state Step 4 PASS |
| BulkActionBar canonical | **`components/common/BulkActionBar.tsx` 우선** + `approvals/BulkActionBar.tsx`는 wrapper로 유지 (approvals 도메인 SSOT) | common이 `actions` slot 패턴(도메인 무관)이라 더 generic. 단, **MUST 워크스트림에서는 컴포넌트 코드 변경 금지** — S1 SKILL doc만 작성하여 패턴 명시. 실제 dedup은 별도 세션 |
| S2 IME guard | `useRowSelection` 내부에서 별도 hook 추가하지 않고, `selectAllOnPage`/`toggle` 같은 외부 트리거에 IME 체크 가드 추가 — `isComposingRef` ref + composition event listener (window 단위) | 기존 hook 시그니처를 깨지 않음. resetOn deps 변경 effect와 충돌 없음 |
| S3 indeterminate | CheckoutGroupCard에 그룹 마스터 체크박스를 **신규 추가하지 않음** — 현재 그룹 헤더는 collapse trigger만 있음. **이 항목은 "현재 코드가 indeterminate를 지원하지 않으면 In-Scope에서 NEEDS_DESIGN으로 강등"** | 사용자 요구는 "있으면 mixed"인데 현재 그룹 마스터 체크박스 자체가 없다 (line 326~447 그룹 헤더 분석). 도메인이 그룹 단위 선택을 지원하지 않으므로 **이 항목은 BulkActionBar(common.tsx)의 indeterminate(`checkedState='indeterminate'`)** 검증으로 좁힌다 — 이미 line 61~63에서 구현되어 있음. **PASS 기준을 "checkedState='indeterminate' + Radix가 aria-checked='mixed' 자동 부여" grep으로 변경** |
| S7 analytics SSOT | **현재 SSOT 없음** — 코드베이스 grep 결과 `lib/analytics/`, `track(`, telemetry 등 0건. **최소 SSOT 신규 생성**: `apps/frontend/lib/analytics/track.ts` (단일 함수 `track(event: string, props?: Record<string, unknown>)`) | 사용자 요구: "find or document gap and propose minimal one". 신규 SSOT는 **no-op 기본 구현 + window.dispatchEvent('app:analytics', detail) hook**. 200ms debounce는 useSidebarState toggle wrapper에서 처리. PII 금지(role/userId 미포함) |
| S8 e2e | **이미 존재** (`tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts`, 182 lines, 6 steps). 재작성 금지 — **gap만 보강**: a11y assertion(`[role="alert"]` 토스트 노출, `aria-live` 텍스트 매칭) 1~2 step 추가 | 사용자 요구는 "Add a Playwright e2e spec"이지만 실제 코드에 이미 있음. **수술적 변경 원칙** — 신규 spec 생성 금지, 기존 spec 보강 |
| S9 charsRemaining | RejectModal 텍스트영역 아래 `<p aria-live="polite">{count} / {max}자</p>` 신규. 80%/100% 임계값은 design-token semantic color | i18n: ko/en 신규 키 `rejectModal.charsCount` (`{current} / {max}자`), `rejectModal.charsWarning` (`경고: {remaining}자 남음`). RejectReasonSchema에서 max 값 import (SSOT) |

## Phase 0 — Pre-flight (Generator 시작 시점 점검)

**목표:** 작업 환경 안전 확보 + 가정 검증.

**액션:**
1. CLAUDE.md 읽기 (Rule 0~4 재확인)
2. `git status` — 더티 파일 확인. 사전 조건: `apps/frontend/next-env.d.ts` 외 다른 디렉토리 더티 파일 없음. 다른 세션 파일(예: `apps/backend/src/modules/checkouts/checkouts.service.ts`, `packages/schemas/src/enums/labels.ts`)이 있으면 **이 작업 범위와 격리** — 절대 stage 하지 않음. MEMORY *"lint-staged 다른 세션 파일 revert 금지"*
3. `grep -n "queryClient.setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 정확히 line 206, 263 두 곳 존재 확인
4. `grep -rn "RejectReasonSchema\|REJECTION" apps/frontend/lib/api/approvals-api.ts | head` — REJECTION_MIN_LENGTH/MAX 상수 SSOT 확인 (charsRemaining max 값 출처)
5. `pnpm tsc --noEmit` baseline — 시작 시점 에러 0 확인 (있으면 Generator 시작 거부, 다른 세션 작업 의심)
6. `pnpm --filter frontend run test --listTests use-optimistic-mutation` — 시작 시점 그린 확인

**검증:** dirty 파일이 워크스트림과 무관하고 baseline tsc PASS.

---

## Phase 1 — MUST: setQueryData purge

**목표:** `CheckoutGroupCard.tsx`에서 `queryClient.setQueryData` 호출 0건. SSOT mutation 훅으로 인라인 mutation 추출.

### 1.1 Mutation 훅 신규 추출

**변경 파일 (신규):**
1. `apps/frontend/hooks/use-checkout-card-mutations.ts` — 신규
   - 의도: `useApproveCheckoutMutation()`, `useBorrowerApproveCheckoutMutation()` 두 훅 export
   - 패턴 모델: `apps/frontend/hooks/use-equipment.ts` (useUpdateEquipmentStatus와 동형)
   - 시그니처:
     ```typescript
     // 형식만 — 구현은 Generator
     useApproveCheckoutMutation(): UseMutationResult<Checkout, Error, { id: string; equipmentName?: string }>
     ```
   - 내부 핵심 요구사항:
     - `useOptimisticMutation` 사용 (제네릭 3개 인자 명시: `<Checkout, Vars, PaginatedResponse<...>>`)
     - `mutationFn`: 기존과 동일 — `await checkoutApi.getCheckout(id)` → fresh version → `approveCheckout(id, version)`
     - `queryKey`: `queryKeys.checkouts.view.all()` (prefix-match로 모든 view 캐시 갱신)
     - `optimisticUpdate(old, { id })`: `data.map((co) => co.id === id ? { ...co, status: CSVal.APPROVED } : co)`
     - `invalidateKeys`: `[...CheckoutCacheInvalidation.APPROVAL_KEYS]` (이미 `view.all()`이 queryKey로 들어가 있어 중복이지만, **APPROVAL_KEYS는 equipment/dashboard/approvals 5축**이므로 spread 그대로)
     - `successMessage`: `notifyCheckoutAction(toast, 'approve', ..., t)` 패턴 보존을 위해 successMessage 대신 `onSuccessCallback` 사용 (toast template 호출 형식이 useOptimisticMutation의 단순 string 토스트와 다름)
     - `onErrorCallback`: **CAS 409 분기 보존**:
       ```
       if (isConflictError(error)) {
         queryClient.removeQueries({ queryKey: queryKeys.checkouts.resource.detail(variables.id) });
       }
       ```
       단, **error toast는 useOptimisticMutation 내부 onError가 이미 처리** — 여기서는 detail 캐시 제거만.
2. `apps/frontend/hooks/__tests__/use-checkout-card-mutations.test.ts` — 신규
   - 의도: optimistic update map 함수 단위 테스트 (status 전이) + CAS 409 시 removeQueries 호출 spy + 일반 에러 시 toast 호출 spy
   - 모델: `__tests__/use-optimistic-mutation.test.ts` 4 cases 패턴
   - 최소 4 테스트:
     1. approve 성공 시 optimisticUpdate가 `co.status === CSVal.PENDING → APPROVED` 전이
     2. borrowerApprove 성공 시 optimisticUpdate가 `co.status === CSVal.PENDING → BORROWER_APPROVED` 전이
     3. 409 에러 시 `queryClient.removeQueries({ queryKey: detail(id) })` 호출됨
     4. 일반 에러 시 invalidateAfterApproval 키 무효화 (onSettled 경로) — 단, 이 케이스는 onSettled 자동이라 mock 어려움. **선택**: 이 케이스는 SHOULD로 강등 가능

### 1.2 CheckoutGroupCard 통합

**변경 파일 (수정):**
3. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — 수정
   - 의도: 인라인 `useMutation` 두 블록(line 173~223, 226~279) 제거하고 신규 훅 호출로 교체
   - 변경 후:
     - `import { useApproveCheckoutMutation, useBorrowerApproveCheckoutMutation } from '@/hooks/use-checkout-card-mutations';`
     - 컴포넌트 본문에서: `const approveMutation = useApproveCheckoutMutation(); const borrowerApproveMutation = useBorrowerApproveCheckoutMutation();`
     - `useQueryClient` import 제거 (더 이상 직접 호출 안 함)
     - `setQueryData` 0건
     - `removeQueries` 0건 (훅 내부로 이동)
     - `cancelQueries`/`getQueriesData`/`setQueriesData` 0건 (훅 내부로 이동)
     - `useMutation` import 제거 (인라인 mutation 0개)
   - 보존 요구사항:
     - `handleRowAction` callback 시그니처 동일
     - `approveMutation.isPending` 사용처(line 421, 422, 557) 동일
     - 그룹 헤더 일괄 승인 버튼 onClick 로직 동일 (line 416~420 forEach mutate)
     - `notifyCheckoutAction` toast 표현 동일 (`onSuccessCallback`으로 이동)

**검증:**
```bash
# 1. setQueryData 0건
grep -n "queryClient.setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0 hits

# 2. useOptimisticMutation 신규 훅에서 사용됨
grep -n "useOptimisticMutation" apps/frontend/hooks/use-checkout-card-mutations.ts
# 기대: ≥1 hit

# 3. removeQueries는 훅 내부로 이동
grep -n "removeQueries" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0 hits
grep -n "removeQueries" apps/frontend/hooks/use-checkout-card-mutations.ts
# 기대: ≥1 hit (CAS 409 분기)

# 4. tsc + 테스트
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- use-checkout-card-mutations
pnpm --filter frontend run test -- use-optimistic-mutation  # 회귀 검증
```

---

## Phase 2 — SHOULD: Bulk UX 6개 항목

> 각 항목은 MUST와 독립적으로 머지 가능. 차단 기준 아님.

### S1 — BulkActionBar SKILL doc

**파일 (신규):** `apps/frontend/.claude/skills/verify-bulk-action-bar/SKILL.md` ← **수정**: `.claude/skills/verify-bulk-action-bar/SKILL.md` (repo 루트 기준)

**의도:** Bulk action bar 패턴 SSOT 문서화. 신규 verify 스킬로 등록.

**내용 요구사항:**
- Frontmatter: name, description, disable-model-invocation: true (verify 스킬 컨벤션)
- 섹션: Purpose / When to Run / Related Files (두 BulkActionBar 비교 표) / Workflow 6 steps:
  1. Step 1 — count chip은 `aria-live="polite"` (sr-only mirror 또는 toolbar 내부)
  2. Step 2 — `role="toolbar"` + `aria-label` 필수
  3. Step 3 — Esc 키 → onClearSelection (단, dialog open 시 dialog가 우선 처리)
  4. Step 4 — 0건 시 `aria-hidden="true"` + `pointer-events-none` (DOM 유지로 SR 접근 보존)
  5. Step 5 — indeterminate 상태는 Radix Checkbox `checked='indeterminate'` 사용 (자동 `aria-checked="mixed"`)
  6. Step 6 — focus management: tab 진입 첫 포커스는 dismiss 또는 primary action (관습)
- canonical 결정: `components/common/BulkActionBar.tsx` (도메인 무관 generic) — `approvals/BulkActionBar.tsx`는 approvals 특화 wrapper로 유지. 후속 dedup 작업은 SKILL doc의 "Future Work" 섹션에 INFO로만 기록.

**검증:**
```bash
test -f .claude/skills/verify-bulk-action-bar/SKILL.md && echo "EXISTS"
grep -c "^### Step" .claude/skills/verify-bulk-action-bar/SKILL.md  # 기대: ≥6
```

### S2 — IME guard (방안 α — 호출자 onKeyDown 가드)

**파일 (수정):** keyboard shortcut 호출자 (BulkActionBar 등 onKeyDown 핸들러를 가진 곳)

**의도:** Korean IME composition 활성 시 단축키(Ctrl+A, Shift+Click 등) misfire 방지. **hook 변경 없음** — 호출자가 React 19 합성 이벤트 `e.nativeEvent.isComposing`로 즉시 가드.

**변경 요구사항:**
- onKeyDown 핸들러 첫 줄에 `if (e.nativeEvent.isComposing) return;` 추가
- 영향받는 keyboard handler 위치 식별:
  - `apps/frontend/components/common/BulkActionBar.tsx` (Esc 핸들러)
  - 다른 단축키 핸들러 (Ctrl+A, Shift+Click 등 — Generator가 grep으로 식별)
- hook (use-bulk-selection.ts) 코드 변경 없음 — 시그니처 보존
- SKILL doc(S1) Step 7에 패턴 명시 (필수 keyboard handler 가드 절차)

**검증:**
```bash
grep -rn "isComposing\|nativeEvent.isComposing" apps/frontend/components apps/frontend/hooks 2>/dev/null | grep -v "__tests__\|node_modules"
# 기대: ≥1 hit (BulkActionBar 등)
```

### S3 — Group header indeterminate (재정의됨)

**근거:** CheckoutGroupCard는 그룹 마스터 체크박스 자체가 없음 (현재는 collapse chevron만). 그룹 단위 row 선택 도메인 부재. 따라서 사용자 요구의 정확한 구현은 **불가능** — **In-Scope를 BulkActionBar(common) indeterminate 검증으로 좁힌다**.

**파일 (수정 또는 검증만):** `apps/frontend/components/common/BulkActionBar.tsx` (line 61~63 이미 구현)

**의도:** 기존 `checkedState: boolean | 'indeterminate'` 처리 + Radix가 자동 부여하는 `aria-checked="mixed"` 동작을 검증 표면으로 노출.

**액션:**
- 코드 변경 0건 또는 최소 (data-testid 추가만 옵션)
- S1 SKILL doc Step 5에 명시
- Generator는 `aria-checked="mixed"` 발현을 직접 grep할 수 없으므로(Radix 런타임 attribute), **단위 테스트 또는 e2e**로 검증 — RejectModal/BulkActionBar 단위 테스트가 없으면 S1 SKILL doc Step 5의 INFO로 강등

**검증:**
```bash
grep -n "isIndeterminate" apps/frontend/components/common/BulkActionBar.tsx
# 기대: ≥1 hit (이미 존재)
grep -n "checkedState\|indeterminate" apps/frontend/components/common/BulkActionBar.tsx
# 기대: ≥2 hits
```

### S7 — Sidebar analytics

**파일 (신규):** `apps/frontend/lib/analytics/track.ts`

**파일 (수정):**
- `apps/frontend/hooks/use-sidebar-state.ts` — `toggle`/`expand`/`collapse`에서 `track()` 호출 추가
- (검증용) `apps/frontend/lib/analytics/__tests__/track.test.ts` — 신규

**의도:** sidebar 토글 이벤트를 Analytics SSOT로 발행. 미래에 외부 telemetry 연결 가능한 단일 진입점 확보.

**SSOT 시그니처 (Generator 결정):**
```typescript
// lib/analytics/track.ts
export function track(event: string, props?: Record<string, string | number | boolean>): void;
// 기본 구현: window.dispatchEvent(new CustomEvent('app:analytics', { detail: { event, props } }))
// SSR-safe: typeof window === 'undefined' 가드
// PII 금지: props 검증 (userId/email/role는 거부 — 키 deny-list)
```

**use-sidebar-state.ts 수정:**
- `toggle()` 내부에 `track('sidebar.toggle', { state: next ? 'collapsed' : 'expanded' })` 호출
- 200ms debounce — 빠른 연타 방지. `useRef<number | null>` + `setTimeout` 패턴 (verify-frontend-state Step 13 cleanup)
- expand/collapse도 동일 처리 (단, expand/collapse는 idempotent하므로 debounce 공유)

**검증:**
```bash
test -f apps/frontend/lib/analytics/track.ts && echo "EXISTS"
grep -n "track('sidebar" apps/frontend/hooks/use-sidebar-state.ts
# 기대: ≥1 hit
grep -n "userId\|role\|email" apps/frontend/lib/analytics/track.ts
# 기대: deny-list로만 등장 (값 read 0건)
pnpm --filter frontend run test -- analytics
```

### S8 — Bulk-reject E2E test (이미 존재 — gap 보강)

**파일 (수정):** `apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts`

**의도:** 기존 6 steps + a11y assertion 1~2 step 추가.

**추가 step 요구사항:**
- Step 7 (신규): "성공 토스트가 `[role="alert"]`/`[role="status"]`로 노출되고 텍스트가 `expectToastVisible(page, ...)` helper로 매칭됨"
- Step 8 (신규, 옵션): "감사 로그 API 호출 발생 — `/api/audit-logs?action=bulk_reject` 1+ hit" — 단, audit-log fixture가 e2e에 노출되어 있는지 사전 확인 필요. 미노출 시 SHOULD에서 INFO로 강등.

**검증:**
```bash
wc -l apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts
# 기대: 200+ lines (현재 182 + 보강 20~40)
grep -c "^  test(" apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts
# 기대: ≥7
```

### S9 — RejectModal charsRemaining (방안 α — 기존 SSOT 재사용)

**파일 (수정):**
- `apps/frontend/components/approvals/RejectModal.tsx` — REQUIRED_FIELD_TOKENS.charCount 재사용

**의도:** Textarea 아래 라이브 글자 수 카운터 + 80%/100% 임계값 색상. **신규 i18n 키 0건** — NCEditDialog 패턴(`{count} / {max}` 인라인) 따름. 5곳 통합은 후속 세션.

**구현 요구사항:**
- 신규 element: `<p aria-live="polite" className={REQUIRED_FIELD_TOKENS.charCount + ' ' + thresholdClass}>{count} / {max}</p>`
- max 값: `RejectReasonSchema`에서 export된 max 상수 import (SSOT — 새 상수 정의 금지) — 위치 확인 필요
- 임계값 (semantic token):
  - `current / max < 0.8`: 기본 (`REQUIRED_FIELD_TOKENS.charCount` color = `text-muted-foreground`)
  - `0.8 ≤ current / max < 1.0`: `text-warning` (design-token semantic) 추가
  - `current / max ≥ 1.0`: `text-destructive` + submit disabled
- `useMemo`로 ratio 계산 — render count 증가 0
- **i18n 신규 키 0건** — 인라인 `{count} / {max}` 형식으로 표시 (NCEditDialog 패턴)
- 100% 도달 시 submit 버튼 disabled (사용자 피드백 즉시성)

**검증:**
```bash
grep -n "aria-live=\"polite\"" apps/frontend/components/approvals/RejectModal.tsx | grep -i "char\|count"
# 기대: ≥1 hit
grep "charsCount" apps/frontend/messages/ko/approvals.json
grep "charsCount" apps/frontend/messages/en/approvals.json
# 기대: 양쪽 1 hit (parity)
diff <(grep -o '"[^"]*Count[^"]*"' apps/frontend/messages/ko/approvals.json | sort -u) \
     <(grep -o '"[^"]*Count[^"]*"' apps/frontend/messages/en/approvals.json | sort -u)
# 기대: diff 없음 (key parity)
```

---

## Phase 3 — Verification

**전체 검증 명령 시퀀스 (Evaluator 실행):**

```bash
# 1. tsc — 모든 워크스페이스 클린
pnpm tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run tsc --noEmit  # 영향 없음 예상이지만 회귀 방지

# 2. Build
pnpm --filter frontend run build

# 3. Lint
pnpm --filter frontend run lint

# 4. Unit tests (변경 영역)
pnpm --filter frontend run test -- use-checkout-card-mutations
pnpm --filter frontend run test -- use-optimistic-mutation  # 회귀
pnpm --filter frontend run test -- use-bulk-selection       # 회귀
pnpm --filter frontend run test -- analytics                 # 신규

# 5. verify-* 스킬 (변경 영역 자동 선택)
# verify-frontend-state Step 35 (setQueryData 금지)
grep -rn "queryClient.setQueryData\|setQueryData" apps/frontend/components apps/frontend/hooks --include="*.tsx" --include="*.ts" | grep -v "__tests__\|test\|spec\|use-optimistic-mutation\|onMutate"
# 기대: 0 hits (use-optimistic-mutation 내부 onMutate는 정상)

# verify-ssot — 신규 파일이 packages 경유 import
# verify-hardcoding — 새 i18n 키, route, 색상 토큰 미하드코딩
# verify-i18n — en/ko parity
# verify-design-tokens — text-warning/text-destructive 사용

# 6. e2e (영향 라우트만)
pnpm --filter frontend run test:e2e -- wf-ap02
pnpm --filter frontend run test:e2e -- features/approvals/approvals-bulk-bar  # 회귀

# 7. a11y 수동 점검 (Evaluator 보고)
# - BulkActionBar checkedState='indeterminate' → DOM에서 aria-checked="mixed"
# - charsRemaining → aria-live="polite"
# - Sidebar toggle → keyboard nav 보존
```

---

## Phase 4 — Documentation

**완료 시 업데이트할 파일:**

1. **MEMORY** (`/home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md`):
   - "프로젝트 이력" 섹션에 `[2026-04-30 setQueryData purge + Bulk UX](./project_setqueryd_purge_bulk_ux_20260430.md)` 추가
   - 별도 detail 파일에 핵심 결정 기록 (use-checkout-card-mutations 추출, analytics SSOT 신설)
2. **exec-plan**: 이 파일을 `active/` → `completed/`로 이동
3. **contract**: `.claude/contracts/setqueryd-purge-and-bulk-ux.md` 그대로 유지 (Evaluator가 참조 후 보존)
4. **`.claude/skills/verify-frontend-state/SKILL.md`**:
   - Step 35 (setQueryData 금지)에 "CheckoutGroupCard 수정 사례 (2026-04-30) — useOptimisticMutation 추출 패턴" 추가
5. **`.claude/skills/verify-bulk-action-bar/SKILL.md`**: 신규 (S1 산출물)
6. **`docs/references/skills-index.md`**: verify-bulk-action-bar 한줄 요약 등록
7. **`CLAUDE.md`**: 변경 없음 (Useful Skills 섹션 카운트만 +1 — 단, MEMORY 항목 *"수술적 변경"* 적용해 카운트 업데이트는 skip 가능)

**커밋 메시지 (Generator):**
```
refactor(checkouts): CheckoutGroupCard setQueryData purge + Bulk UX 6항목

- MUST: useApproveCheckoutMutation/useBorrowerApproveCheckoutMutation 추출
  - useOptimisticMutation SSOT 사용 (verify-frontend-state Step 35 PASS)
  - CAS 409 시 detail 캐시 제거 보존
  - setQueryData 0건
- SHOULD S1: verify-bulk-action-bar SKILL doc 신규
- SHOULD S2: useRowSelection IME composition guard
- SHOULD S3: BulkActionBar indeterminate 검증 (코드 변경 없음 — 기존 동작 유지)
- SHOULD S7: lib/analytics/track.ts SSOT + sidebar 토글 이벤트
- SHOULD S8: wf-ap02 e2e a11y assertion 보강
- SHOULD S9: RejectModal charsRemaining + i18n parity
```

---

## Risks & Mitigations

| # | 위험 | 가능성 | 영향 | Mitigation |
|---|------|--------|------|------------|
| R1 | **CAS 409 detail 캐시 제거 누락** — useOptimisticMutation으로 옮기는 과정에서 onErrorCallback에 isConflictError 분기를 빼먹으면 stale cache → 재시도 계속 409 | 中 | 큰 (production 회귀) | contract MUST 기준에 `grep removeQueries` 명시 + 단위 테스트 case 3 (409 → removeQueries spy) |
| R2 | **IME guard false-trigger** — compositionstart 후 compositionend 누락 시(브라우저 버그) selectAllOnPage 영구 차단 | 低 | 中 | Generator: `compositionend` listener에서 `setTimeout(() => isComposingRef.current = false, 0)` 또는 keypress fallback. 단위 테스트에서 composition cycle 검증 |
| R3 | **BulkActionBar duplication 보존** — S1에서 dedup하지 않고 SKILL doc만 작성 → 미래에 두 파일이 또 갈라질 위험 | 中 | 中 | SKILL doc Step 1에 "canonical = common, approvals/BulkActionBar는 wrapper" 명시. 추후 별도 세션에서 dedup. tech-debt-tracker.md에 항목 추가 |
| R4 | **e2e flakiness** — wf-ap02가 testOperatorPage + techManagerPage 두 fixture 사용. timing 의존성 (clearBackendCache 후 즉시 list refetch) | 中 | 中 | 신규 step에서 `await page.waitForResponse('**/api/checkouts/**')` 명시적 대기. retry 1회 허용 (playwright config 기본값) |
| R5 | **i18n drift** — charsCount 키가 ko에만 추가되거나, 변수 placeholder 차이 (`{current}` vs `{count}`) | 中 | 中 | contract에 `diff` 명령으로 키 parity 검증. verify-i18n 스킬 PASS 강제 |
| R6 | **SSOT 위반 — analytics SSOT 신설이 과잉** — 기존 SSOT 없는 게 합리적이었을 수도 | 低 | 低 | track.ts는 no-op + dispatchEvent만 — 의존성 0. 외부 telemetry 미통합 상태에서도 안전. PII deny-list로 보안 가드 |
| R7 | **invalidateKeys 중복 무효화** — useOptimisticMutation의 queryKey(view.all())와 invalidateKeys(APPROVAL_KEYS includes checkouts.all) 중복 → 두 번 invalidate | 中 | 低 | TanStack Query는 동일 invalidation 큐에서 dedup 처리. 성능 이슈 없음. 단, render count 증가 의심 시 React DevTools profiler로 측정 |
| R8 | **Render count 증가** — 신규 mutation 훅이 useOptimisticMutation 내부에서 useTranslations + useToast 호출 → 부모 CheckoutGroupCard 외부 hooks 추가 | 中 | 低 | useOptimisticMutation은 이미 use-equipment에서 4번 사용 중 — 검증된 비용. CheckoutGroupCard.tsx는 default export memo (line 581) — props 동일 시 리렌더 안 함 |
| R9 | **다른 세션 더티 파일 충돌** — `apps/backend/src/modules/checkouts/checkouts.service.ts`가 git status에 있음. backend 변경 없는 워크스트림이지만 lint-staged가 다른 파일도 stage 가능 | 低 | 中 | Phase 0에서 `git status` 강제 점검. Generator가 수정 전 staged 파일 확인. MEMORY *"lint-staged 다른 세션 파일 revert 금지"* 적용 |
| R10 | **Phase 1.2의 useQueryClient 제거가 다른 inline 호출 깨뜨림** — CheckoutGroupCard에 다른 queryClient 사용처가 있는지 확인 필요 | 低 | 中 | Phase 0에서 `grep -n "queryClient" apps/frontend/components/checkouts/CheckoutGroupCard.tsx`로 사용처 전수 파악. 현재 line 105, 180, 188, 206, 210, 232, 239, 263, 266 (mutation 내부만) — 모두 mutation 추출 시 같이 이동 |

---

## Dependency Graph

```
Phase 0 (Pre-flight)
   │
   ├──► Phase 1 MUST (직렬 — 단일 컴포넌트 + 신규 훅)
   │      1.1 신규 hook 파일 (use-checkout-card-mutations.ts) + 단위 테스트
   │           ↓ 의존
   │      1.2 CheckoutGroupCard 통합
   │
   ├──► Phase 2 SHOULD (병렬 가능 — 6개 항목 독립)
   │      ├── S1 BulkActionBar SKILL doc (독립)
   │      ├── S2 useRowSelection IME (독립 — 단, S1 Step 5/7과 cross-link)
   │      ├── S3 indeterminate 검증 (S1 Step 5에 의존 — 같이 처리)
   │      ├── S7 analytics SSOT (독립)
   │      ├── S8 e2e 보강 (독립 — Phase 1 변경 후 회귀 검증으로도 활용)
   │      └── S9 charsRemaining + i18n (독립)
   │
   └──► Phase 3 Verification (Phase 1 + Phase 2 모두 완료 후)
          ↓
        Phase 4 Documentation
```

**병렬화 권장 순서 (Generator):**
1. Phase 0 → 1.1 → 1.2 (직렬, MUST 먼저)
2. Phase 2 항목들은 (S1 + S3 묶음), S2, S7, S8, S9 순서로 처리 — 각 독립 커밋 가능
3. Phase 3은 순차 (tsc → build → lint → tests → verify-* → e2e)

---

## Verification Commands (Evaluator 실행)

```bash
# === MUST ===
cd /home/kmjkds/equipment_management_system

# M1: setQueryData purge
test "$(grep -c 'queryClient.setQueryData' apps/frontend/components/checkouts/CheckoutGroupCard.tsx)" -eq 0 && echo "M1 PASS" || echo "M1 FAIL"

# M2: useOptimisticMutation 사용
grep -q "useOptimisticMutation" apps/frontend/hooks/use-checkout-card-mutations.ts && echo "M2 PASS" || echo "M2 FAIL"

# M3: removeQueries CAS 409 보존
grep -q "removeQueries" apps/frontend/hooks/use-checkout-card-mutations.ts && echo "M3 PASS" || echo "M3 FAIL"

# M4: tsc clean
pnpm tsc --noEmit && echo "M4 PASS" || echo "M4 FAIL"

# M5: build
pnpm --filter frontend run build && echo "M5 PASS" || echo "M5 FAIL"

# M6: 신규 + 회귀 단위 테스트
pnpm --filter frontend run test -- use-checkout-card-mutations use-optimistic-mutation use-bulk-selection && echo "M6 PASS" || echo "M6 FAIL"

# M7: verify-frontend-state Step 35
# (수동 또는 grep 기반)
test "$(grep -rn 'queryClient.setQueryData' apps/frontend/components apps/frontend/app --include='*.tsx' --include='*.ts' | grep -v __tests__ | wc -l)" -eq 0 && echo "M7 PASS" || echo "M7 FAIL"

# M8: i18n parity (charsCount 신규 키)
diff <(grep -o '"chars[A-Z][a-zA-Z]*"' apps/frontend/messages/ko/approvals.json | sort -u) \
     <(grep -o '"chars[A-Z][a-zA-Z]*"' apps/frontend/messages/en/approvals.json | sort -u) \
  && echo "M8 PASS" || echo "M8 FAIL"

# === SHOULD ===

# S1
test -f .claude/skills/verify-bulk-action-bar/SKILL.md && echo "S1 PASS" || echo "S1 INFO"

# S2
grep -q "compositionstart\|isComposing" apps/frontend/hooks/use-bulk-selection.ts && echo "S2 PASS" || echo "S2 INFO"

# S3
grep -q "isIndeterminate\|checkedState" apps/frontend/components/common/BulkActionBar.tsx && echo "S3 PASS" || echo "S3 INFO"

# S7
test -f apps/frontend/lib/analytics/track.ts && grep -q "track('sidebar" apps/frontend/hooks/use-sidebar-state.ts && echo "S7 PASS" || echo "S7 INFO"

# S8
test "$(grep -c '^  test(' apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts)" -ge 7 && echo "S8 PASS" || echo "S8 INFO"

# S9
grep -q "charsCount\|aria-live=\"polite\".*char" apps/frontend/components/approvals/RejectModal.tsx && echo "S9 PASS" || echo "S9 INFO"
```

---

## 의사결정 로그

- **2026-04-30 18:30** — 초기 계획. MUST = setQueryData 2건 제거. SHOULD = 6항목 (S1, S2, S3, S7, S8, S9).
- **2026-04-30 18:35** — 코드베이스 조사 결과:
  - **S3 재정의**: CheckoutGroupCard에 그룹 마스터 체크박스 없음 → BulkActionBar(common) indeterminate 검증으로 좁힘.
  - **S7 SSOT 부재 확인**: `lib/analytics/`, `track(` 0건 → 최소 SSOT 신설.
  - **S8 이미 존재**: `wf-ap02-approvals-bulk-reject.spec.ts` 182 lines 6 steps → gap 보강만.
  - **canonical BulkActionBar**: `common/BulkActionBar.tsx` (도메인 무관) 우선. `approvals/`는 wrapper.
- **2026-04-30 18:40** — 아키텍처 결정: **인라인 switch 아닌 hook 추출** 선택. 근거: use-equipment.ts 패턴 일관성 + 단위 테스트 가능성 + CheckoutGroupCard 가독성. 비용: 신규 파일 +1.
- **2026-04-30 18:42** — `useOptimisticMutation`이 단일 queryKey만 받는 한계 → `view.all()` prefix를 queryKey로 넘겨 prefix-match 활용. invalidateKeys는 APPROVAL_KEYS spread.
- **2026-04-30 18:43** — CAS 409 detail 캐시 제거는 **반드시 보존** (기존 동작). `onErrorCallback`에 isConflictError 분기 + removeQueries 호출. error toast는 useOptimisticMutation 내부 로직 사용 (커스텀 메시지 보존을 위해 errorMessage 옵션 활용).
- **2026-04-30 18:45** — Phase 1 분리: 1.1(hook + test), 1.2(CheckoutGroupCard 통합). 직렬 의존.
- **2026-04-30 18:50** — R1~R10 위험 분석 완료. 가장 큰 R1(CAS 409 회귀)은 단위 테스트 case 3로 차단.
