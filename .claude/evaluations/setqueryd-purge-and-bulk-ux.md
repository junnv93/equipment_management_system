# Evaluation Report: setqueryd-purge-and-bulk-ux

## 반복 #1 (2026-04-30)

---

## MUST 기준 대조

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| **M1** `pnpm tsc --noEmit` 전체 | **PASS** | 출력 없음 (exit 0) |
| **M2** `pnpm --filter frontend` tsc | **PASS** | `pnpm --filter frontend exec tsc --noEmit` exit 0 (주의: `tsc` script 없음 → `exec` 경유 실행) |
| **M3** frontend build 성공 | **PASS** | `✓ Compiled successfully in 14.0s`, exit 0 |
| **M4** frontend lint 에러 0 | **PASS** | `eslint .` 경고/에러 없음, exit 0 |
| **M5** CheckoutGroupCard에 setQueryData 0건 | **PASS** | `grep -c 'queryClient\.setQueryData' CheckoutGroupCard.tsx` → `0` |
| **M6** 신규 훅 파일 존재 + useOptimisticMutation import | **PASS** | `use-checkout-card-mutations.ts` 존재, line 6: `import { useOptimisticMutation }` |
| **M7** CheckoutGroupCard에서 신규 훅 사용 | **PASS** | `useApproveCheckoutMutation`, `useBorrowerApproveCheckoutMutation` 각 1건 |
| **M8** CheckoutGroupCard에서 useMutation 직접 import 0건 | **PASS** | `grep -c '\buseMutation\b' CheckoutGroupCard.tsx` → `0` |
| **M9** CAS 409 시 removeQueries 보존 | **PASS** | line 64-65, 106-107: `if (isConflictError(error)) { queryClient.removeQueries({...}) }` — **두 mutation 모두** 적용됨. 계약 grep 명령은 import 라인이 첫 매치이나, `grep -A5` 전체 출력에 `removeQueries`가 포함되어 pipe 출력 exit 0 확인 |
| **M10** APPROVAL_KEYS 무효화 보존 | **PASS** | line 69: `invalidateKeys: [...CheckoutCacheInvalidation.APPROVAL_KEYS]` |
| **M11** 신규 단위 테스트 파일 존재 + 3개 이상 케이스 | **PASS** | `use-checkout-card-mutations.test.ts` 존재, `it()` 4개 (≥3 기준 충족) |
| **M12** 신규 단위 테스트 PASS | **PASS** | `jest -- use-checkout-card-mutations` → `4 passed, 4 total` |
| **M13** use-optimistic-mutation 회귀 없음 | **PASS** | `4 passed, 4 total` |
| **M14** use-bulk-selection 회귀 없음 | **PASS** | `13 passed, 13 total` |
| **M15** verify-frontend-state Step 35 — setQueryData 전체 0건 | **PASS** | `HITS=0` (components/app/hooks, __tests__/use-optimistic-mutation 제외) |
| **M16** verify-ssot — schemas + queryKeys import | **PASS** | line 20: `@equipment-management/schemas`, line 21: `@/lib/api/query-config` |
| **M17** verify-hardcoding — 하드코딩 fetch URL/role 리터럴 0건 | **PASS** | 신규 훅 + track.ts 모두 하드코딩 없음 |

**MUST 전체: 17/17 PASS**

---

## SHOULD 기준 대조 (루프 차단 없음)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| **S1** SKILL doc 존재 + Step 6개 이상 | **PASS** | `.claude/skills/verify-bulk-action-bar/SKILL.md` 존재, `grep -c '^### Step'` → `7` |
| **S1b** frontmatter `disable-model-invocation: true` | **PASS** | line 3에 명시 |
| **S1c** canonical 결정 명시 | **PASS** | `canonical = components/common/BulkActionBar.tsx` 명시 |
| **S2** 호출자 onKeyDown에 isComposing 가드 | **INFO** | `RowSelectCell.tsx:44`, `ApprovalKpiStrip.tsx:63`, `use-approval-keyboard.ts:44` — 3건 추가됨. **단, `common/BulkActionBar.tsx`에는 keyboard 핸들러가 없어 해당 파일의 Esc guard는 미적용** (이미 구조적으로 Esc 핸들러 없음). 계약 grep 기준(`≥1 hit`) 은 충족 |
| **S2b** use-bulk-selection hook 시그니처 변경 없음 | **PASS** | M14 테스트 13/13 PASS |
| **S3** BulkActionBar indeterminate 동작 보존 | **PASS** | `isIndeterminate` + `checkedState.*indeterminate` 각 1건 이상 존재 |
| **S7** track.ts 존재 + SSR-safe | **PASS** | `typeof window === 'undefined'` 가드 존재 |
| **S7b** useSidebarState에서 `track('sidebar...')` 호출 | **PASS** | line 32: `track('sidebar.toggle', { state: ... })` |
| **S7c** 200ms debounce — setTimeout + clearTimeout | **PASS** | `analyticsTimerRef.current = setTimeout(...)` 패턴 존재 |
| **S7d** PII deny-list (userId/email/role) | **INFO** | **`role` 키가 deny-list에 누락됨** — exec-plan 명시 "userId/email/role는 거부" 대비 `role` 미포함. 계약 grep command 자체도 의도와 달리 deny-list 배열 내 `userId`, `email` 문자열을 비comment로 캐치하여 명령 출력 비어있지 않음. 하지만 기능 구현상 userId/email은 거부됨 — role만 누락 |
| **S8** E2E 테스트 케이스 7개 이상 | **PASS** | `grep -c '^  test('` → `7` |
| **S8b** a11y assertion 추가 | **PASS** | `expectToastVisible` 또는 `aria-live` 매칭 확인 |
| **S9** aria-live="polite" + 글자 수 라이브 카운터 | **PASS** | line 190: `aria-live="polite"`, line 191: `role="status"`, `{t('rejectModal.charsRemaining', { remaining: ... })}` |
| **S9b** REQUIRED_FIELD_TOKENS.charCount 재사용 | **PASS** | line 183-188에서 `REQUIRED_FIELD_TOKENS.charCount` 사용 |
| **S9c** max 값이 SSOT import | **PASS** | `REJECTION_MAX_LENGTH` ← `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` (`@equipment-management/shared-constants`) |
| **S9d** text-warning / text-destructive semantic token | **PASS** | line 185: `text-destructive`, line 187: `text-warning` |

---

## Senior-Level Additional Checks

| Check | Verdict | Evidence |
|-------|---------|----------|
| **Tailwind text-warning 토큰 유효성** | **PASS** | `globals.css:118 --color-warning: hsl(var(--warning))` — Tailwind v4에서 `--color-warning` CSS 변수가 `:root`와 `.dark` 양쪽 정의됨 (line 437, 536). `text-warning` 유틸리티 클래스 유효 |
| **Test isolation (mock 완전성)** | **PASS** | `jest.mock` 7개: `next-intl`, `use-toast`, `@/lib/api/error`, `@/lib/errors/equipment-errors`, `@/lib/checkouts/toast-templates`, `@/lib/api/checkout-api`, `@/lib/api/cache-invalidation`. 실제 네트워크 호출 0건. `QueryClient`는 테스트용 인스턴스 생성 |
| **CAS removeQueries — 양쪽 mutation 모두** | **PASS** | line 64-65 (`useApproveCheckoutMutation`) + line 106-107 (`useBorrowerApproveCheckoutMutation`) — 각각 독립적으로 `isConflictError` → `removeQueries` 호출. `grep -c 'removeQueries'` → `2` |
| **i18n charsRemaining 키 (ko + en)** | **PASS — 단, 신규 키 추가됨** | `messages/ko/approvals.json:203` + `messages/en/approvals.json:203` 양쪽에 `charsRemaining` 키 존재. **단, exec-plan "i18n 신규 키 0건" 방침 위반** — git diff 확인 결과 이번 PR에서 새로 추가된 키임. SHOULD 항목이므로 루프 차단 아님 |
| **Sidebar debounce 타이머 cleanup on unmount** | **PASS** | `use-sidebar-state.ts:38-41`: `useEffect(() => { return () => { if (analyticsTimerRef.current) clearTimeout(analyticsTimerRef.current); }; }, [])` — 메모리 누수 없음 |
| **S9 submit disabled at max (exec-plan 요구사항)** | **INFO** | exec-plan: "100% 도달 시 submit 버튼 disabled". 실제 구현: `disabled={isPending}` 만 있고 `reason.length >= REJECTION_MAX_LENGTH` 조건에서 submit disabled 없음. HTML `maxLength` attribute가 입력 자체를 막으므로 기능적 치명성 낮음 — SHOULD 범위 |
| **S7d role PII deny-list 누락** | **INFO** | exec-plan: "userId/email/role는 거부" 명시. 구현: `PII_DENY_KEYS`에 `role` 미포함 (JSDoc 주석에만 등장). `track()` 호출 시 `role` 키 전달 가능 |

---

## 전체 판정

**OVERALL: PASS**

- **MUST 미달: 0개** — M1~M17 전부 PASS
- **SHOULD INFO 항목: 4개**
  - S2: common/BulkActionBar.tsx 자체에 keyboard 핸들러 없어 해당 파일 Esc guard 미적용 (구조적 이유, 기능 영향 없음)
  - S7d: `role` 키가 PII deny-list 누락
  - i18n 신규 키: exec-plan "신규 키 0건" 방침 대비 `charsRemaining` 신규 추가 (ko/en parity는 정상)
  - S9 submit disabled at max: `maxLength` HTML attribute로 입력 차단되나 button disabled 미적용
- **Senior 체크 FAIL: 0개** (모두 INFO 등급)

---

## Repair Instructions (FAIL 없음 — 해당 없음)

MUST 기준 모두 통과로 수정 불필요.

---

## 권장 후속 작업 (tech-debt-tracker 등록 권장)

다음 항목을 `.claude/exec-plans/tech-debt-tracker.md`에 등록 권장:

1. **[PII-001] analytics track.ts `role` 키 deny-list 추가**
   - 파일: `apps/frontend/lib/analytics/track.ts`
   - 수정: `PII_DENY_KEYS` 배열에 `'role'` 추가
   - 근거: exec-plan "userId/email/role는 거부" 명시, 현재 role 키로 track() 호출 가능

2. **[UX-001] RejectModal submit 버튼 — 최대 글자 수 도달 시 disabled 추가**
   - 파일: `apps/frontend/components/approvals/RejectModal.tsx`
   - 수정: submit button `disabled={isPending || reason.length >= REJECTION_MAX_LENGTH}`
   - 근거: exec-plan "100% 도달 시 submit 버튼 disabled" 요구사항 미이행. `maxLength` HTML attribute로 입력은 막히나 button 상태 피드백 없음

3. **[I18N-001] exec-plan "i18n 신규 키 0건" 방침 vs 실제 추가 키 불일치 기록**
   - `rejectModal.charsRemaining` 키 신규 추가 (ko + en parity OK)
   - 향후 i18n 계약 작성 시 "신규 키 0건" 또는 "신규 키 허용 (목록)" 명확히 구분

4. **[A11Y-001] BulkActionBar.tsx Esc keyboard 핸들러 부재**
   - S1 SKILL doc Step 3에 "Esc → onClearSelection" 명시되어 있으나 common/BulkActionBar.tsx에 Esc handler 없음
   - BulkActionBar dedup 세션 시 use-approval-keyboard.ts Esc 로직과 통합 검토

5. **[TECH-001] BulkActionBar 두 파일 실제 dedup (S1 SKILL doc에만 정의됨)**
   - `components/common/BulkActionBar.tsx` (canonical) + `components/approvals/BulkActionBar.tsx` (wrapper)
   - 별도 세션 수행 예정 (현 sprint out-of-scope)
