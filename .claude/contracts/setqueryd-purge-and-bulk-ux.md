# 스프린트 계약: setQueryData Purge + Bulk UX Improvements

## 생성 시점
2026-04-30T18:50:00Z

## 슬러그
`setqueryd-purge-and-bulk-ux`

## 관련 문서
- exec-plan: `.claude/exec-plans/active/2026-04-30-setqueryd-purge-and-bulk-ux.md`
- skills: `verify-frontend-state` (Step 35), `verify-ssot`, `verify-hardcoding`, `verify-i18n`, `verify-design-tokens`

## 사전 조건 (Pre-flight)

- [ ] `git status` — `apps/frontend/next-env.d.ts` 외 다른 디렉토리 더티 파일은 **이 워크스트림에 stage 금지**
- [ ] baseline `pnpm tsc --noEmit` — 시작 시점 0 에러
- [ ] baseline `pnpm --filter frontend run test -- use-optimistic-mutation` — 시작 시점 그린

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 빌드/타입

- [ ] **M1**: `pnpm tsc --noEmit` 전체 워크스페이스 에러 0
  ```bash
  pnpm tsc --noEmit
  ```
- [ ] **M2**: `pnpm --filter frontend run tsc --noEmit` 에러 0
  ```bash
  pnpm --filter frontend run tsc --noEmit
  ```
- [ ] **M3**: `pnpm --filter frontend run build` 성공 (exit 0)
  ```bash
  pnpm --filter frontend run build
  ```
- [ ] **M4**: `pnpm --filter frontend run lint` 에러 0
  ```bash
  pnpm --filter frontend run lint
  ```

#### setQueryData purge (핵심)

- [ ] **M5**: `CheckoutGroupCard.tsx`에 `queryClient.setQueryData` 0건
  ```bash
  test "$(grep -c 'queryClient\.setQueryData' apps/frontend/components/checkouts/CheckoutGroupCard.tsx)" -eq 0
  ```
- [ ] **M6**: 신규 파일 `apps/frontend/hooks/use-checkout-card-mutations.ts` 존재 + `useOptimisticMutation` import
  ```bash
  test -f apps/frontend/hooks/use-checkout-card-mutations.ts && \
    grep -q "useOptimisticMutation" apps/frontend/hooks/use-checkout-card-mutations.ts
  ```
- [ ] **M7**: CheckoutGroupCard에서 신규 훅 사용
  ```bash
  grep -q "useApproveCheckoutMutation\|useBorrowerApproveCheckoutMutation" \
    apps/frontend/components/checkouts/CheckoutGroupCard.tsx
  ```
- [ ] **M8**: CheckoutGroupCard에서 `useMutation` 직접 import 0건 (인라인 mutation 제거 확인)
  ```bash
  test "$(grep -c '\buseMutation\b' apps/frontend/components/checkouts/CheckoutGroupCard.tsx)" -eq 0
  ```

#### CAS 보존 (회귀 방지)

- [ ] **M9**: 신규 훅에서 CAS 409 시 `removeQueries({ queryKey: queryKeys.checkouts.resource.detail(...) })` 호출 보존
  ```bash
  grep -A 5 "isConflictError" apps/frontend/hooks/use-checkout-card-mutations.ts | grep -q "removeQueries"
  ```
- [ ] **M10**: `CheckoutCacheInvalidation.invalidateAfterApproval` 또는 `APPROVAL_KEYS` 무효화 보존 (onSettled 경로)
  ```bash
  grep -q "APPROVAL_KEYS\|invalidateAfterApproval" apps/frontend/hooks/use-checkout-card-mutations.ts
  ```

#### 테스트

- [ ] **M11**: 신규 단위 테스트 파일 존재 + 4개 이상 케이스
  ```bash
  test -f apps/frontend/hooks/__tests__/use-checkout-card-mutations.test.ts && \
  test "$(grep -c '^\s*it(' apps/frontend/hooks/__tests__/use-checkout-card-mutations.test.ts)" -ge 3
  ```
- [ ] **M12**: 신규 단위 테스트 PASS
  ```bash
  pnpm --filter frontend run test -- use-checkout-card-mutations
  ```
- [ ] **M13**: 기존 `use-optimistic-mutation` 테스트 회귀 없음
  ```bash
  pnpm --filter frontend run test -- use-optimistic-mutation
  ```
- [ ] **M14**: 기존 `use-bulk-selection` 테스트 회귀 없음 (S2 후)
  ```bash
  pnpm --filter frontend run test -- use-bulk-selection
  ```

#### verify-* 스킬

- [ ] **M15**: verify-frontend-state Step 35 — `apps/frontend/components` + `apps/frontend/app` + `apps/frontend/hooks` 전체에서 production 코드의 `queryClient.setQueryData` 호출 0건 (use-optimistic-mutation 내부 onMutate 1건은 SSOT 정의이므로 제외)
  ```bash
  HITS=$(grep -rn "queryClient\.setQueryData" \
    apps/frontend/components apps/frontend/app apps/frontend/hooks \
    --include="*.tsx" --include="*.ts" \
    | grep -v "__tests__\|\.test\.\|\.spec\.\|use-optimistic-mutation" \
    | wc -l)
  test "$HITS" -eq 0
  ```
- [ ] **M16**: verify-ssot — 신규 파일이 `@equipment-management/schemas` + `@equipment-management/shared-constants` + `@/lib/api/query-config` 경유 (로컬 enum/route 재정의 0)
  ```bash
  # 신규 hook 파일은 schemas + queryKeys import 필수
  grep -q "@equipment-management/schemas" apps/frontend/hooks/use-checkout-card-mutations.ts && \
  grep -q "queryKeys" apps/frontend/hooks/use-checkout-card-mutations.ts
  ```
- [ ] **M17**: verify-hardcoding — 신규 파일 + 변경 파일에서 하드코딩 라우트/API 경로/색상/role 리터럴 0건
  ```bash
  # API 경로는 checkoutApi 메서드 경유 — 직접 fetch URL 0건
  ! grep -E "fetch\(['\"]\/api\/" apps/frontend/hooks/use-checkout-card-mutations.ts
  # role 리터럴 0건
  ! grep -E "['\"]admin['\"]\|['\"]ADMIN['\"]\|'TEST_ENGINEER'" \
    apps/frontend/hooks/use-checkout-card-mutations.ts \
    apps/frontend/lib/analytics/track.ts 2>/dev/null
  ```

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

#### S1 — BulkActionBar SKILL doc

- [ ] **S1**: `.claude/skills/verify-bulk-action-bar/SKILL.md` 존재 + Step 6개 이상
  ```bash
  test -f .claude/skills/verify-bulk-action-bar/SKILL.md && \
  test "$(grep -c '^### Step' .claude/skills/verify-bulk-action-bar/SKILL.md)" -ge 6
  ```
- [ ] **S1b**: SKILL doc frontmatter에 `disable-model-invocation: true`
  ```bash
  head -5 .claude/skills/verify-bulk-action-bar/SKILL.md | grep -q "disable-model-invocation: true"
  ```
- [ ] **S1c**: canonical 결정 명시 — common/BulkActionBar 우선
  ```bash
  grep -q "canonical\|common/BulkActionBar" .claude/skills/verify-bulk-action-bar/SKILL.md
  ```

#### S2 — IME guard (α — 호출자 onKeyDown)

- [ ] **S2**: 호출자(BulkActionBar 등)에 `e.nativeEvent.isComposing` 가드 추가
  ```bash
  grep -rn "isComposing" apps/frontend/components apps/frontend/hooks 2>/dev/null | grep -v "__tests__\|node_modules" | head -5
  # 기대: ≥1 hit
  ```
- [ ] **S2b**: hook (use-bulk-selection.ts) 시그니처 변경 없음 — 회귀 없음 (M14와 동일)

#### S3 — Indeterminate 검증

- [ ] **S3**: `BulkActionBar(common)` indeterminate 동작 보존 (이미 구현됨, 회귀 0)
  ```bash
  grep -q "isIndeterminate" apps/frontend/components/common/BulkActionBar.tsx && \
  grep -q "checkedState.*indeterminate" apps/frontend/components/common/BulkActionBar.tsx
  ```

#### S7 — Sidebar Analytics

- [ ] **S7**: `apps/frontend/lib/analytics/track.ts` 존재 + SSR-safe + PII deny
  ```bash
  test -f apps/frontend/lib/analytics/track.ts && \
  grep -q "typeof window" apps/frontend/lib/analytics/track.ts
  ```
- [ ] **S7b**: `useSidebarState`에서 `track('sidebar.toggle'...)` 호출
  ```bash
  grep -q "track\(['\"]sidebar" apps/frontend/hooks/use-sidebar-state.ts
  ```
- [ ] **S7c**: 200ms debounce — `setTimeout` + `clearTimeout` 패턴 (verify-frontend-state Step 13)
  ```bash
  grep -q "setTimeout\|debounce" apps/frontend/hooks/use-sidebar-state.ts
  ```
- [ ] **S7d**: PII 미수집 — userId/email/role 키 deny-list 또는 호출부 미사용
  ```bash
  ! grep -E "userId|email|role" apps/frontend/lib/analytics/track.ts | grep -v "deny\|reject\|comment\|//"
  ```

#### S8 — Bulk-reject E2E 보강

- [ ] **S8**: `wf-ap02-approvals-bulk-reject.spec.ts` test 케이스 7개 이상 (기존 6 + 보강)
  ```bash
  test "$(grep -c '^  test(' apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts)" -ge 7
  ```
- [ ] **S8b**: a11y assertion 추가 — `expectToastVisible` 또는 `role="alert"` 매칭
  ```bash
  grep -q "expectToastVisible\|role=\"alert\"\|aria-live" \
    apps/frontend/tests/e2e/workflows/wf-ap02-approvals-bulk-reject.spec.ts
  ```

#### S9 — RejectModal charsRemaining (α — 기존 SSOT 재사용)

- [ ] **S9**: `aria-live="polite"` + 글자 수 라이브 카운터
  ```bash
  grep -A 2 "aria-live=\"polite\"" apps/frontend/components/approvals/RejectModal.tsx | \
    grep -E "\\{[a-zA-Z]+\\.length\\}|count|chars"
  ```
- [ ] **S9b**: REQUIRED_FIELD_TOKENS.charCount 재사용 (신규 SSOT 미생성)
  ```bash
  grep -q "REQUIRED_FIELD_TOKENS\|REQUIRED_FIELD_TOKENS\\.charCount" \
    apps/frontend/components/approvals/RejectModal.tsx
  ```
- [ ] **S9c**: max 값이 RejectReasonSchema에서 SSOT import (재정의 금지)
  ```bash
  grep -q "REJECTION_M\|RejectReasonSchema\|MAX_LEN" apps/frontend/components/approvals/RejectModal.tsx
  ```
- [ ] **S9d**: 80%/100% 임계값 색상 — semantic token 사용 (text-warning / text-destructive)
  ```bash
  grep -q "text-warning\|text-destructive" \
    apps/frontend/components/approvals/RejectModal.tsx
  ```

---

### 적용 verify 스킬

| 영역 | 스킬 | 확인 방식 |
|------|------|-----------|
| MUST 핵심 | verify-frontend-state Step 35 | M15 |
| MUST 핵심 | verify-ssot | M16 |
| MUST 핵심 | verify-hardcoding | M17 |
| SHOULD S2/S3 | verify-bulk-action-bar (신규) | S1 자체가 산출물 |
| SHOULD S9 | verify-i18n | S9b |
| SHOULD S9 | verify-design-tokens | S9d |
| SHOULD S7 | verify-hardcoding (PII) | S7d |
| SHOULD S8 | verify-e2e | S8 + S8b |

---

## 종료 조건

- **PASS**: 모든 MUST 기준(M1~M17) 통과 → 성공. SHOULD 미달 항목은 tech-debt-tracker.md 기록 후 종료.
- **REINJECT (재진입)**: MUST 1개 이상 FAIL → Generator 재실행. 동일 이슈 2회 연속 FAIL 시 수동 개입 요청.
- **HALT (수동 개입)**: 3회 반복 초과, 또는 R1 (CAS 409 회귀) 단위 테스트 실패 시 즉시.
- SHOULD 실패는 종료 조건에 영향 없음 — `.claude/exec-plans/tech-debt-tracker.md`에 항목 추가 후 PASS.

---

## 의존성

- **다른 contract**: 없음 (독립 워크스트림)
- **선행 skill**: `verify-frontend-state` (Step 35 정의), `useOptimisticMutation` (SSOT 훅), `CheckoutCacheInvalidation` (APPROVAL_KEYS SSOT)
- **후속 작업 (out-of-scope)**:
  - BulkActionBar 두 파일 dedup (별도 세션)
  - T3 Bulk UI 6항목 (다음 sprint)
  - dirty 3 파일 (`apps/backend/src/modules/checkouts/checkouts.service.ts`, `apps/frontend/next-env.d.ts`, `packages/schemas/src/enums/labels.ts`) — **다른 세션 작업, 절대 stage 하지 않음**

---

## Out of Scope

- ❌ Sprint 4.5 SHOULD 중 S4, S5, S6 (다음 세션)
- ❌ T3 Bulk UI 6항목
- ❌ git status에 표시된 dirty 3 파일 (다른 세션 작업)
- ❌ BulkActionBar 두 파일의 실제 dedup (S1은 SKILL doc만, 코드 변경은 후속)
- ❌ analytics SSOT 외부 telemetry 통합 (no-op + dispatchEvent만)
- ❌ CheckoutGroupCard 그룹 마스터 체크박스 신규 추가 (S3 재정의로 회피)
- ❌ RejectReasonSchema의 max 상수 자체 변경 (SSOT 보존)

---

## 결과 보고 형식 (Evaluator)

```markdown
# Evaluation Report: setqueryd-purge-and-bulk-ux

## 반복 #{N} ({timestamp})

## MUST 기준 대조
| 기준 | 판정 | 상세 |
|------|------|------|
| M1 tsc 전체 | PASS/FAIL | {에러 수} |
| M5 setQueryData purge | PASS/FAIL | {라인} |
| M9 CAS 409 보존 | PASS/FAIL | {grep 결과} |
| ... | ... | ... |

## SHOULD 기준 대조 (루프 차단 없음)
| 기준 | 판정 | tech-debt 등록 |
|------|------|---------------|
| S1 SKILL doc | PASS/INFO | - |
| S7 analytics SSOT | PASS/INFO | - |
| ... | ... | ... |

## 전체 판정: PASS / FAIL ({MUST 미달 N개})

## 수정 지시 (FAIL 시)
{contract 기준별 정확한 수정 위치 + 명령}
```
