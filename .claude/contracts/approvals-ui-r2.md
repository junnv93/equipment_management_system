# 승인 도메인 프론트엔드 UI 개발 Contract (Approval Review v2 기반)

> **Status:** APPROVED — ready for `/harness mode2 approvals-ui-r2` execution
> **Scope:** Frontend UI overhaul of `/admin/approvals` per Approval Review v2 (17 priorities + 5 release-blockers)
> **Mode:** harness Mode 2 (Planner → Generator → Evaluator) — actual code in next session
> **Source review:** `C:\Users\kmjkd\Downloads\Approval Review.md` (297 lines, v2)

---

## 0. Context

### 0.1 Problem

`/admin/approvals` 페이지는 다음 5가지 release-blocking 이슈를 포함하고 있음 (Review v2):

1. **KPI 시각 밀도 부족** — 4 cards 중 2개가 "0건" 빈 상태로 노출, hierarchy 부재
2. **BulkActionBar UX** — sticky 부재 + 체크 0건 상태에서 항상 노출되는 disabled 버튼
3. **RejectModal 단건/일괄 중복 구현** — `single-mode`와 `bulk-mode`가 별개 모달, 사유 검증/UX divergence
4. **ApprovalDetailPanel dead code** — 240+ 줄이 어떤 라우팅에서도 진입되지 않음 (Modal 단일 경로)
5. **ApprovalRow mini-stepper 하드코딩** — `String('●').repeat(N)` 매직 + role 분기 없음, 토큰화 누락

### 0.2 Premise (Review v2)

> **"승인관리 페이지에 들어온 항목 = 전부 사용자의 액션 대상"**
>
> Empty/disabled state로 "권한 없음"을 표현할 필요 없음 — 데이터 자체가 권한 필터링됨.
> 따라서 `canShowPrimaryAction` 같은 권한 게이트는 **항상 true**로 간주 (dead branch 제거 가능).

### 0.3 Intended Outcome

- KPI: 정보 hierarchy 회복 (긴급 알람을 1차 시야로)
- BulkActionBar: sticky bottom Floating Action Bar, 0건 시 fade-out
- RejectModal: 단일 컴포넌트 `mode='single'|'bulk'` props로 통일
- DetailPanel: 완전 삭제 (Modal 단일 경로)
- MiniStepper: 별도 컴포넌트 + `APPROVAL_ROW_TOKENS` SSOT
- 부수적으로 AR-1~15 아키텍처 부채 동시 청산

---

## 1. Decisions Recorded (사용자 합의)

| # | Decision | Rationale |
|---|---|---|
| 1 | ApprovalDetailPanel **DELETE** (240줄 dead code) | Modal 단일 경로 — Panel은 어떤 라우팅에서도 진입되지 않음 |
| 2 | **Phase별 5 PR** (AP-01 KPI / AP-02 BulkActionBar / AP-03 RejectModal / AP-04 Panel removal / AP-05 MiniStepper) | 각 PR이 독립 verifiable + revertable, harness loop 단축 |
| 3 | RejectModal: bulk + 단일 comment 유지 (description 보강) | 일괄 사유는 "공통 사유" 명시, 단일은 항목별 사유 — 사용자 의도 차이 보존 |
| 4 | Cross-cutting MUST 4영역 모두 적용: i18n+a11y / Design Token 3-Layer / TanStack/CAS/URL SSOT / Bundle+E2E+FSM | 시니어 아키텍처 수준 — 모든 영역에 명시적 기준 |

---

## 2. Critical Files

### 2.1 Frontend Components (수정/삭제 대상)

| File | Action | Notes |
|---|---|---|
| `apps/frontend/components/approvals/ApprovalsClient.tsx` (681 lines) | EDIT | invalidation 4× → `invalidateAfterApprovalAction()` helper, URL tab Zod parse, queryKey 정리 |
| `apps/frontend/components/approvals/ApprovalKpiStrip.tsx` (125 lines) | REWRITE | hierarchy 도입, 긴급 카운트 1차, 빈 카드 collapse |
| `apps/frontend/components/approvals/ApprovalRow.tsx` (179 lines) | EDIT | URGENCY_BORDER local override 제거, MiniStepper 컴포넌트 import |
| `apps/frontend/components/approvals/ApprovalRowMiniStepper.tsx` | **NEW** | `APPROVAL_ROW_TOKENS` 토큰 사용, `currentStep`/`totalSteps`/`role` props |
| `apps/frontend/components/approvals/BulkActionBar.tsx` (180 lines) | REWRITE | sticky bottom, 0건 시 fade-out, count chip, focus trap |
| `apps/frontend/components/approvals/RejectModal.tsx` (190 lines) | REWRITE | `mode: 'single' \| 'bulk'` discriminated union props |
| `apps/frontend/components/approvals/ApprovalDetailModal.tsx` (195 lines) | EDIT | step indicator 분기 → `TAB_META` SSOT |
| `apps/frontend/components/approvals/ApprovalDetailPanel.tsx` (~250 lines) | **DELETE** | dead code (Decision #1) |
| `apps/frontend/components/approvals/ApprovalCategorySidebar.tsx` (106 lines) | EDIT | ARIA 일관화 (`<nav>` → AP-04), 0 카운트 시각 처리 (AP-01) |
| `apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx` (90 lines) | EDIT | ARIA 일관화 (`role="tablist"` → AP-04), getCountBasedUrgency 적용 (AP-01 SHOULD) |
| `apps/frontend/components/approvals/ApprovalList.tsx` (116 lines) | EDIT | 빈 상태 메시지 i18n + premise 반영 ("처리 완료" 톤) |
| `apps/frontend/components/approvals/ApprovalStepIndicator.tsx` (141 lines) | EDIT | `TAB_META` SSOT 도입, role 매핑 |
| `apps/frontend/components/approvals/ApprovalHistoryCard.tsx` (88 lines) | EDIT | connector 머리 `before:` pseudo-element (AP-04) |
| `apps/frontend/components/approvals/detail-renderers.tsx` (366 lines) | EDIT | URVal.TEST_ENGINEER 직접 비교 → role helper 경유 (AR-6) |
| `apps/frontend/components/approvals/approval-icons.ts` (35 lines) | KEEP | |

### 2.2 Design Tokens

| File | Action |
|---|---|
| `apps/frontend/lib/design-tokens/components/approval.ts` (645 lines) | EDIT — `APPROVAL_ROW_TOKENS`(urgencyBg/Border/PulseDot), `APPROVAL_KPI_TOKENS`(hierarchyTier1~3), `BULK_ACTION_BAR_TOKENS`(stickyBottom/fadeOut/visibleHeight) 추가 |
| `apps/frontend/lib/design-tokens/components/approval-row.ts` | **NEW** | URGENCY_BORDER local 제거 → semantic 승격 |

### 2.3 i18n

| File | Action |
|---|---|
| `apps/frontend/messages/ko/approvals.json` (479 lines) | EDIT — `kpi.urgent`, `kpi.totalPending`, `bulkBar.stickyHint`, `rejectModal.bulkDescription`, `miniStepper.aria.*` 추가 |
| `apps/frontend/messages/en/approvals.json` (479 lines) | EDIT — ko parity 보장 (verify-i18n PASS) |

### 2.4 API/Hooks/Schemas (변경 최소화)

| File | Action |
|---|---|
| `apps/frontend/lib/api/approvals-api.ts` (1401 lines) | EDIT — AR-6 (URVal.TEST_ENGINEER 직접 비교 제거), AR-7 (catch swallow → 명시적 ApprovalApiError) |
| `apps/frontend/lib/api/hooks/use-approvals-api.ts` (139 lines) | EDIT — `invalidateAfterApprovalAction(category)` helper export |
| `apps/frontend/lib/api/query-config.ts` | EDIT — `queryKeys.approvals.list(category)` 표준화, userTeamId 제거 (AR-15) |
| `packages/schemas/src/approval.ts` | KEEP | 변경 없음 |
| `packages/shared-constants/src/permissions.ts` (22 keys) | KEEP | 변경 없음 |
| `packages/shared-constants/src/roles.ts:111-116` (APPROVAL_ROLES) | KEEP | 변경 없음 |

### 2.5 Routes

| File | Action |
|---|---|
| `apps/frontend/app/(dashboard)/admin/approvals/page.tsx` | EDIT — Zod parse for `searchParams.tab`, fallback redirect, `metadata.title` i18n |

### 2.6 Tests

| File | Action |
|---|---|
| `tests/e2e/approvals/approvals-list-kpi.spec.ts` | **NEW** | KPI hierarchy + sticky BulkActionBar |
| `tests/e2e/approvals/approvals-bulk-reject.spec.ts` | **NEW** | RejectModal `mode='bulk'` + 일괄 사유 단일 입력 |
| `tests/e2e/approvals/approvals-mini-stepper.spec.ts` | **NEW** | step ARIA + role 분기 |
| `tests/e2e/approvals/approvals-empty-state.spec.ts` | **NEW** | premise — empty list shows "처리 완료" 메시지 |
| `tests/e2e/approvals/approvals-tab-zod-fallback.spec.ts` | **NEW** | 잘못된 tab 파라미터 → fallback redirect |
| Existing 12 specs in `tests/e2e/approvals/` | UPDATE | Modal 단일 경로 + sticky BulkActionBar 셀렉터 변경 반영 |

---

## 3. PR Plan (5 Phases)

### AP-01 KPI Strip + Row Badge + Tab Polish

**Scope:**
- Rewrite `ApprovalKpiStrip.tsx`: 4 카드 → 3 카드 (`todayProcessed` comingSoon 제거, `lg:grid-cols-3`)
- 0건 vs null 시각 분기: `urgentCount: 0` → `"0"` (회색) + sub `"긴급 없음"` / `null` → `"–"` + sub `"준비 중"`
- 상태 배지 컬럼 삭제 (`ApprovalRow.tsx`에서 배지 컬럼 제거 — mini stepper + urgency bar로 흡수)
- URL `tab` searchParams Zod parse + fallback redirect (`page.tsx`, AR-5)
- `metadata.title` i18n 추가 (`approvals_page.tsx:23`)
- 사이드바 active + 0 카운트 시각 처리: `"완료"` 미니 텍스트 표시 (AR-5 연계)
- Add `APPROVAL_KPI_TOKENS` to `approval.ts`

**MUST:**
- 4 카드 → 3 카드 (`urgentCount`, `pendingCount`, `avgDays` — `todayProcessed` 제거)
- 0건 vs null 시각 분기 (`valueEmpty` 단일처리 폐기)
- 배지 컬럼 삭제 → `ApprovalRow`에서 `<Badge>` wrapper 제거 (grep `ApprovalBadge\|StatusBadge` → 0건)
- `verify-design-tokens` PASS (no inline `bg-red-500`, semantic 토큰만)
- `verify-i18n` PASS (`kpi.urgent`, `kpi.pendingCount`, `kpi.avgDays`, `kpi.noUrgent`, `kpi.comingSoon` ko/en parity)
- a11y: `role="region"` + `aria-label` per card, urgent 카운트 `aria-live="polite"`
- `metadata.title` i18n (`approvals_page.tsx`)
- Bundle size delta ≤ +2KB (gzip)

**SHOULD:**
- 긴급 카운트 > 0 시 subtle pulse animation (prefers-reduced-motion 존중)
- KPI 카드 클릭 → URL `?filter=urgent` 푸시 (`<button role="button">`)
- 사이드바 active + 0 카운트: `"완료"` 미니 라벨 or `"0"` 표시
- `getCountBasedUrgency` 모바일 pill에도 적용 (`ApprovalMobileCategoryBar.tsx`)

**Verification:**
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build  # baseline 비교
grep -r "ApprovalBadge\|StatusBadge" apps/frontend/components/approvals/  # expect: 0 (배지 제거 확인)
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/ApprovalKpiStrip.tsx
node scripts/verify-i18n.mjs --domain approvals
pnpm --filter frontend exec playwright test approvals-list-kpi.spec.ts
pnpm --filter frontend exec playwright test approvals-empty-state.spec.ts
```

---

### AP-02 BulkActionBar Floating Sticky

**Scope:**
- Rewrite `BulkActionBar.tsx` as sticky-bottom floating action bar
- 0건 → opacity 0 + pointer-events none (fade-out 200ms)
- ≥1건 → opacity 1, count chip 표시
- Add `BULK_ACTION_BAR_TOKENS` (stickyBottom/visibleHeight/fadeOut)

**MUST:**
- `position: fixed; bottom: var(--bulk-bar-offset)` (token 기반)
- 0건 시 disabled 버튼 노출 금지 (premise: 액션 대상만 → 0건이면 bar 자체 숨김)
- `× 선택 해제` 텍스트 버튼 (selectedCount > 0일 때만) — 5개 선택 후 전체 해제 위한 UX
- 라벨 상태별 변형:
  - 0개: (bar 숨김)
  - 1~N개: `"N개 선택됨 ×"`
  - 전체 선택: `"전체 선택됨 (N/N) ×"`
- Focus trap on count chip (`role="status" aria-live="polite"`)
- selection 변동 시 `sr-only aria-live="polite"` 카운트 공지 (스크린리더 인지)
- Keyboard: Esc → 선택 해제 + bar 사라짐
- `verify-design-tokens` PASS
- E2E: 5 → 3 → 0 선택 변화 시 시각 + DOM + SR 공지 검증

**SHOULD:**
- Bottom offset tablet/mobile 분기 (sidebar collapsed 고려)
- count chip subtle scale 애니메이션 (prefers-reduced-motion 존중)

**Verification:**
```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/BulkActionBar.tsx
pnpm --filter frontend exec playwright test approvals-bulk-reject.spec.ts
```

---

### AP-03 RejectModal Unified

**Scope:**
- Rewrite `RejectModal.tsx` with discriminated union props:
  ```typescript
  type RejectModalProps =
    | { mode: 'single'; targetId: string; categoryKey: ApprovalCategory; onClose: () => void }
    | { mode: 'bulk'; targetIds: string[]; categoryKey: ApprovalCategory; onClose: () => void };
  ```
- Bulk 모드: comment textarea 단일 (description: "선택한 N건에 동일한 사유로 적용됩니다")
- Single 모드: comment textarea 단일 (기존 유지)
- 사유 검증 SSOT: Zod schema `RejectReasonSchema` (min 1, max 500)
- 사유 미입력 시 disabled CTA + ARIA 에러 메시지

**MUST:**
- `mode` discriminated union → 컴파일 타임 props 검증 (verify-frontend-state)
- Reject 사유 Zod schema SSOT (`RejectReasonSchema` min 1 max 500)
- useActionState + 외부 useState 분리 제거 → **local state 단일화** (현재 외부 setValidationError 우회 패턴 폐기)
- 템플릿 선택 → textarea 자동 입력: **비어있을 때만** 자동 입력, 입력 중이면 append 또는 confirm
- API 호출: bulk → `Promise.allSettled` + 부분 실패 toast 차등 표시
- `useOptimisticMutation` + `invalidateAfterApprovalAction` (AR-4)
- `verify-i18n` PASS (`rejectModal.single.description`, `rejectModal.bulk.description` ko/en)
- a11y: `aria-describedby` for description, error 메시지 `role="alert"`
- `REJECTION_MIN_LENGTH` 서버 측 검증 존재 여부 확인 + 주석 명시 (defense in depth)

**SHOULD:**
- Bulk 부분 실패 시 실패 항목 list로 modal 안에 표시 + 재시도 버튼
- comment max 500자 char counter

**Verification:**
```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-frontend-state.mjs apps/frontend/components/approvals/RejectModal.tsx
node scripts/verify-i18n.mjs --domain approvals
pnpm --filter frontend exec playwright test approvals-bulk-reject.spec.ts
```

---

### AP-04 ApprovalDetailPanel Removal + Modal 보강

**Scope:**
- DELETE `apps/frontend/components/approvals/ApprovalDetailPanel.tsx` (240 lines)
- Remove all imports of `ApprovalDetailPanel` (grep 0건 보장)
- Update `ApprovalsClient.tsx`: Panel toggle state 제거, `<kbd>A</kbd>/<kbd>R</kbd>` 약속 제거 또는 Modal에 키보드 핸들러 구현
- `ApprovalDetailModal.tsx`: 메타 그리드에 **경과일(elapsedDays) + urgency** 컬럼 추가 (현재 요청자/부서/요청일만 — Triage 핵심 신호 누락)
- `ApprovalDetailModal.tsx`: `bg-muted/50 rounded-lg` 하드코딩 → 토큰 경유 (AR-3 연계)
- `ApprovalDetailModal.tsx`: `<DetailSection title>` 공유 컴포넌트 추출 (Modal/Panel section wrapper 불일치 해소)
- `ApprovalHistoryCard.tsx`: 첫 항목 connector 머리 (`before:` pseudo-element 짧은 connector)
- `ApprovalCategorySidebar.tsx` vs `ApprovalMobileCategoryBar.tsx`: `<nav>` vs `<div role="tablist">` ARIA 일관화
- Update relevant tests (Modal 단일 경로 셀렉터)

**MUST:**
- File deletion + 0 imports remaining (`grep -r "ApprovalDetailPanel" apps/frontend` → 0건)
- Modal 메타 그리드에 `elapsedDays` + urgency 신호 추가 (`verify-design-tokens` PASS — token 경유)
- `bg-muted/50` → semantic token 교체 (`verify-design-tokens` PASS)
- 사이드바/모바일바 ARIA 일관화 (`<nav>` + `role="tablist"` 충돌 해소)
- `pnpm tsc --noEmit` PASS
- 기존 12 spec 중 Panel 셀렉터 사용 spec → Modal 셀렉터로 교체
- `verify-implementation` PASS
- E2E: 기존 detail 흐름 spec 100% 통과

**SHOULD:**
- Modal에 `useApprovalKeyboard` 훅 (A키 승인 / R키 반려) — Panel이 약속한 키보드 단축키를 Modal에 실제 구현
- 삭제 commit 메시지에 "removed dead code, never reached via routing" 명시

**Verification:**
```bash
grep -r "ApprovalDetailPanel" apps/frontend  # expect: 0
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
pnpm --filter frontend exec playwright test approvals/
```

---

### AP-05 ApprovalRow MiniStepper + Row 구조 + Stepper 개선

**Scope:**
- Extract `ApprovalRowMiniStepper` 새 컴포넌트
- `String('●').repeat(N)` 하드코딩 → `Array.from({length: total}, (_, i) => <Dot active={i < currentStep} />)` + role 분기
- 단일 단계 항목도 `●` 1개로 표시 (현재 `meta.multiStep` 분기로 stepper 없음 → 모든 행 균일 mini stepper)
- `APPROVAL_ROW_TOKENS.urgencyBg/Border/PulseDot` 토큰화
- `ApprovalRow.tsx` URGENCY_BORDER local 제거 (AR-1)
- `ApprovalRow.tsx`: `flex-wrap` → `flex-nowrap` + `title={summary}` (flex-wrap + truncate 충돌 해소)
- `ApprovalRow.tsx`: 작업 컬럼 hover-inline `✓ ✗` 버튼 추가 (`approveIcon`/`rejectIcon` 토큰 활용)
- `ApprovalRow.tsx`: 보조 텍스트 `text-muted-foreground` → `/70` (한 단계 더 muted)
- `ApprovalStepIndicator.tsx`: current 노드 `ring-4 ring-brand-info/20` 추가 (completed와 구분)
- `ApprovalStepIndicator.tsx`: rejected 이후 connector `dashed + opacity-40`, 노드 `opacity-30`
- `ApprovalStepIndicator.tsx`: disposalSteps 시작 노드 차등화 (빈 `▸` 또는 `Start` 마이크로 라벨)
- `ApprovalStepIndicator.tsx`: connector `w-8` → `flex-1 min-w-[24px]`
- `approval.ts`: `APPROVAL_CARD_BORDER_TOKENS` 미사용 여부 grep 후 제거 또는 SSOT 통합

**MUST:**
- `ApprovalRowMiniStepper` 별도 컴포넌트 + memo
- 모든 행 mini stepper 슬롯 균일 (단일 단계 = `●` 한 개)
- ARIA: `role="progressbar" aria-valuenow={currentStep} aria-valuemax={total} aria-label="승인 단계 N/M"`
- prefers-reduced-motion에서 pulse-dot 비활성
- `verify-design-tokens` PASS (URGENCY_BORDER local 제거, `APPROVAL_CARD_BORDER_TOKENS` 정리)
- role 분기: technical_manager/quality_manager/lab_manager/system_admin → 각 step description i18n
- hover-inline 승인/반려 버튼: `approveIcon`/`rejectIcon` 토큰 경유 (`verify-design-tokens` PASS)
- `flex-nowrap` + `title={summary}` 적용 (행 높이 균일)
- Stepper: current ring/halo 추가 / rejected 이후 dashed
- E2E: ARIA snapshot + hover-inline 버튼 클릭 → 승인 flow

**SHOULD:**
- step transition 200ms ease (현재 단계 fade-in)
- 작업 컬럼 hover-inline 접근성: `aria-label="승인"`, `aria-label="반려"` on icon buttons

**Verification:**
```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/
pnpm --filter frontend exec playwright test approvals-mini-stepper.spec.ts
```

---

## 4. Cross-cutting MUST (전 PR 적용)

### 4.1 i18n + a11y

- 모든 신규 텍스트 ko/en parity (`verify-i18n` PASS)
- 모든 interactive element `aria-label`/`aria-describedby`
- KPI urgent count `aria-live="polite"`
- BulkActionBar count chip `role="status"`
- RejectModal error `role="alert"`
- MiniStepper `role="progressbar"` + valuenow/valuemax
- 키보드: Tab/Shift+Tab/Esc 동작 명시

### 4.2 Design Token 3-Layer

- Primitives → Semantic → Components 위반 0
- `verify-design-tokens` PASS for all 5 PR
- `bg-red-*`, `text-blue-*` 같은 Tailwind primitive 직접 사용 금지
- `dark:` prefix 추가 금지 (CSS 변수 자동 전환)
- `transition: all` 금지
- `focus-visible` only (focus 단독 금지)

### 4.3 TanStack Query / CAS / URL SSOT

- `setQueryData` 사용 금지 (`useOptimisticMutation` 경유)
- 모든 invalidation → `invalidateAfterApprovalAction(category)` helper (AR-4)
- queryKeys SSOT (`queryKeys.approvals.list(category)`) — 인라인 배열 금지 (AR-15)
- URL `tab` 파라미터 Zod parse + fallback redirect (AR-5)
- CAS: 승인/반려 mutation은 `version` 필드 전송, 409 응답 시 detail cache invalidate

### 4.4 Bundle + E2E + FSM

- 5 PR 누적 bundle size delta ≤ +8KB gzip (AP-01 +2KB / AP-02 +1KB / AP-03 +2KB / AP-04 -3KB / AP-05 +2KB)
- E2E: 신규 5 spec + 기존 12 spec 100% 통과
- FSM: 승인/반려 액션은 `assertFsmAction` 경유 (verify-checkout-fsm 준수)
- `verify-implementation` PASS (5 PR 머지 후)

---

## 5. Architectural Reinforcement (AR-1 ~ AR-15)

리뷰가 지적하지 않았으나 코드베이스 감사로 발견된 부채. PR 수반 작업으로 동시 청산.

| ID | Issue | File:Line | PR |
|---|---|---|---|
| AR-1 | URGENCY_BORDER local override (pulse-dot 누락) | ApprovalRow.tsx:33-46 | AP-05 |
| AR-2 | approval.ts ↔ approval-constants.ts vocabulary divergence (pending_approval vs pending/pending_review) | approval.ts, approval-constants.ts | AP-04 |
| AR-3 | ApprovalDetailModal multi-step inline branching | ApprovalDetailModal.tsx:47-51, 99-103 | AP-04 |
| AR-4 | invalidation key duplicated 4× | ApprovalsClient.tsx:153, 222, 274, 372 | AP-03 (helper 도입) |
| AR-5 | URL tab 파라미터 Zod 검증 부재 | ApprovalsClient.tsx:71-73, page.tsx | AP-01 |
| AR-6 | URVal.TEST_ENGINEER 직접 비교 | approvals-api.ts:1060 | AP-03 |
| AR-7 | 17 catch { return [] } error swallows | approvals-api.ts:466-659 | AP-03 |
| AR-8 | inspection reject hard-throw vs UI button visible | approvals-api.ts:880 | AP-03 |
| AR-9 | ApprovalDetailPanel 240줄 dead code | ApprovalDetailPanel.tsx | AP-04 |
| AR-10 | getPendingRentalImports deprecated | approvals-api.ts | AP-04 |
| AR-11 | submitCalibrationPlan deprecated | approvals-api.ts | AP-04 |
| AR-12 | userId: _userId unused | ApprovalsClient.tsx:53 | AP-04 |
| AR-13 | self-inspection API 존재하나 'self_inspection' ApprovalCategory 누락 | approval-categories.ts | AP-01 (tab Zod parse 시 카테고리 추가) |
| AR-14 | software_validation commentRequired:false vs action label '검토완료' divergence | approval-constants.ts | AP-03 |
| AR-15 | queryKey userTeamId 중복 | ApprovalsClient.tsx:108 | AP-01 |

각 PR description에 처리한 AR-N 명시.

---

## 6. Observability / Feature Flags / Rollback

### 6.1 Feature Flag

- `NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2=true` (default false)
- 5 PR 모두 머지 후 1주 카나리 → flag 제거
- `lib/feature-flags.ts`에 등록 (단일 SSOT)

### 6.2 Observability

- KPI urgent count 변화 시 `console.info` 대신 (TBD: telemetry hook) — 현재는 PR-out
- Reject mutation 실패 시 toast + Sentry breadcrumb (`scope: 'approvals.reject'`)
- BulkActionBar 0→1 전환 시 selection state 진입 마킹

### 6.3 Rollback Plan

- 각 PR 단일 revert 가능 (head commit revert + flag false)
- AP-04 (Panel 삭제)는 git revert로 복원 — 의존 코드 없으므로 안전
- AP-03 (RejectModal 통합) revert 시 단건/일괄 분리 모달 복귀 — 24시간 내 결정

---

## 7. Bundle Size Guard

`scripts/bundle-size-baseline.json`에 다음 추가:

```json
{
  "/admin/approvals": {
    "current": "<measure-after-AP-01>",
    "ceiling": "+8KB gzip from baseline",
    "phases": {
      "AP-01": "+2KB",
      "AP-02": "+1KB",
      "AP-03": "+2KB",
      "AP-04": "-3KB",
      "AP-05": "+2KB"
    }
  }
}
```

각 PR CI에서 `pnpm --filter frontend run analyze` 실행 → JSON 파싱 → 한계 초과 시 fail.

---

## 8. Test Coverage Plan

### 8.1 신규 E2E (5 spec)

| Spec | PR | 검증 |
|---|---|---|
| `approvals-list-kpi.spec.ts` | AP-01 | KPI 3-tier rendering + urgent aria-live |
| `approvals-bulk-reject.spec.ts` | AP-02, AP-03 | sticky bar fade + bulk reject 부분 실패 |
| `approvals-mini-stepper.spec.ts` | AP-05 | progressbar ARIA + role 분기 |
| `approvals-empty-state.spec.ts` | AP-01 | premise — "처리 완료" 메시지 |
| `approvals-tab-zod-fallback.spec.ts` | AP-01 | 잘못된 tab → fallback |

### 8.2 Unit Tests

- `RejectModal.test.tsx`: discriminated union props 컴파일 검증, Zod schema 통과/실패
- `ApprovalRowMiniStepper.test.tsx`: role props × step props 매트릭스
- `invalidateAfterApprovalAction.test.ts`: helper 호출 시 4 queryKey 모두 무효화 확인

### 8.3 Regression

- 기존 12 spec 중 셀렉터 변경 영향 spec 식별 + 업데이트 (Modal 단일 경로)

---

## 9. Verification Commands (단일 명령어 묶음)

각 PR에서 실행:

```bash
# Type
pnpm --filter frontend run tsc --noEmit

# Build + bundle
pnpm --filter frontend run build
pnpm --filter frontend run analyze  # bundle-size-baseline 비교

# Verify skills
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/
node scripts/verify-i18n.mjs --domain approvals
node scripts/verify-frontend-state.mjs apps/frontend/components/approvals/
node scripts/verify-hardcoding.mjs apps/frontend/lib/api/approvals-api.ts

# Tests
pnpm --filter frontend exec playwright test approvals/
pnpm --filter frontend run test -- approvals
```

5 PR 모두 머지 후 통합:
```bash
/verify-implementation
/review-architecture
```

---

## 10. Migration Plan

1. **Feature flag false** 상태로 5 PR 순차 머지 (AP-01 → AP-02 → AP-03 → AP-04 → AP-05)
2. 각 PR 머지 후 dev/staging에서 flag true로 검증
3. AP-05 머지 후 1주 카나리 (10% → 50% → 100%)
4. 100% 도달 후 flag 제거 PR

---

## 11. tech-debt-tracker (deferred items)

다음은 본 contract 범위 밖이지만 관련 도메인에서 발견된 부채 — `.claude/exec-plans/tech-debt-tracker.md`에 등록:

1. ApprovalCategory에 'self_inspection' 추가 (AR-13 후속)
2. notification_preferences FK 정책 결정
3. approvals-api.ts 1401줄 → 카테고리별 sub-module 분리 (예: `approvals-equipment-api.ts`, `approvals-calibration-api.ts`)
4. ROLE_APPROVAL_CATEGORIES → DB-backed (현재 코드 상수)
5. `approval-constants.ts` ↔ `approval.ts` vocabulary 통합 (AR-2 잔여)
6. Approval audit timeline UI (현재 backend만)
7. Bulk approve mutation rate-limit (현재 N개 동시 호출)
8. Mobile detail modal full-screen 모드
9. Reject reason template (자주 쓰는 사유 quick-select)
10. Approval delegation (위임 워크플로우)
11. Approval analytics dashboard (월별 처리량, 평균 처리 시간)

---

## 12. Definition of Done

- [ ] 5 PR 모두 머지 (AP-01 ~ AP-05)
- [ ] AR-1 ~ AR-15 모두 처리 (각 PR description에 처리한 AR-N 명시)
- [ ] Review 전체 항목 Appendix A 34건 처리 완료 (MUST 30건 / SHOULD 4건 / tech-debt 4건)
- [ ] 상태 배지 컬럼 삭제 확인: `grep -r "ApprovalBadge\|StatusBadge" apps/frontend/components/approvals/` → 0건
- [ ] KPI 4카드 → 3카드: `todayProcessed` 제거 확인
- [ ] KPI 0건 vs null 시각 분기 확인 (E2E: `urgentCount=0` → "0 긴급 없음" / `null` → "– 준비 중")
- [ ] `pnpm tsc --noEmit` PASS
- [ ] `pnpm build` PASS + bundle size delta ≤ +8KB gzip
- [ ] `/verify-implementation` PASS
- [ ] 신규 5 spec + 기존 12 spec 100% 통과
- [ ] verify-i18n / verify-design-tokens / verify-frontend-state / verify-hardcoding PASS
- [ ] `/review-architecture` PASS
- [ ] Feature flag 1주 카나리 후 제거
- [ ] tech-debt-tracker deferred items 등록 (11 + 4 = 15건)

---

## 13. Out of Scope

- Backend 변경 (approvals.controller.ts, approvals.service.ts) — 본 contract는 frontend-only
- Approval 도메인 신규 카테고리 (예: software_validation 추가) — 별도 PR
- Approval analytics dashboard
- Mobile-first redesign (현재 desktop-first 유지)

---

## 14. Next Steps

1. 사용자 승인 (ExitPlanMode)
2. 다음 세션에서:
   - 본 contract를 `.claude/contracts/approvals-ui-r2.md`로 복사
   - `/harness mode2 approvals-ui-r2` 실행
   - Planner agent → exec-plan 작성
   - Generator → AP-01 구현
   - Evaluator → contract 기준 검증
   - 5 PR 순차 진행

---

## Appendix A: Review v2 전체 항목 매핑 (17 priorities + sub-items)

### 🔴 릴리스 전

| # | Review 항목 | PR | 처리 |
|---|---|---|---|
| 1 | KPI 시각 밀도 — 4카드 → 3카드 (`todayProcessed` 제거) | AP-01 | MUST |
| 2 | KPI 0건 vs null 시각 분기 | AP-01 | MUST |
| 3 | BulkActionBar sticky bottom | AP-02 | MUST |
| 4 | BulkActionBar 0선택 시 버튼 숨김 | AP-02 | MUST |
| 5 | RejectModal 단건/일괄 통합 (mode prop) | AP-03 | MUST |
| 6 | ApprovalDetailPanel 삭제 (dead code) | AP-04 | MUST |
| 7 | ApprovalRow mini-stepper 컴포넌트화 | AP-05 | MUST |
| 8 | 상태 배지 컬럼 삭제 (urgency bar + mini stepper로 흡수) | AP-01 | MUST |

### 🟡 다음 스프린트

| # | Review 항목 | PR | 처리 |
|---|---|---|---|
| 9 | 작업 컬럼 hover-inline ✓ ✗ 버튼 (approveIcon/rejectIcon 토큰 활용) | AP-05 | MUST |
| 10 | Stepper current 노드 ring/halo 강화 | AP-05 | MUST |
| 11 | Stepper rejected 이후 dashed connector + 노드 opacity-30 | AP-05 | MUST |
| 12 | Stepper disposalSteps 시작 노드 차등화 (`▸` 마이크로 라벨) | AP-05 | SHOULD |
| 13 | Stepper connector `w-8` → `flex-1 min-w-[24px]` | AP-05 | MUST |
| 14 | Modal 메타 그리드 경과일/urgency 추가 | AP-04 | MUST |
| 15 | BulkActionBar `× 선택 해제` 단축 액션 | AP-02 | MUST |
| 16 | BulkActionBar 라벨 상태별 변형 (0개/N개/전체) | AP-02 | MUST |
| 17 | BulkActionBar selection 변동 sr-only aria-live | AP-02 | MUST |
| 18 | RejectModal useActionState 단일화 (외부 setState 우회 제거) | AP-03 | MUST |
| 19 | RejectModal 템플릿 선택 → 비어있을 때만 자동 입력 | AP-03 | MUST |
| 20 | 사이드바 active + 0 카운트 시각 처리 | AP-01 | SHOULD |
| 21 | `<nav>` vs `<div role="tablist">` ARIA 일관화 | AP-04 | MUST |
| 22 | KPI 카드 클릭 → URL `?filter=urgent` 푸시 | AP-01 | SHOULD |
| 23 | `getCountBasedUrgency` 모바일 pill 적용 | AP-01 | SHOULD |
| 24 | ApprovalRow flex-wrap → flex-nowrap + title tooltip | AP-05 | MUST |
| 25 | 보조 텍스트 muted-foreground → `/70` | AP-05 | SHOULD |
| 26 | APPROVAL_CARD_BORDER_TOKENS 미사용 grep → 정리 | AP-05 | MUST |
| 27 | ApprovalHistoryCard connector 머리 before: pseudo | AP-04 | SHOULD |
| 28 | `bg-muted/50 rounded-lg` 하드코딩 → token 교체 | AP-04 | MUST |
| 29 | `<DetailSection title>` 공유 컴포넌트 추출 | AP-04 | SHOULD |
| 30 | metadata.title i18n (`approvals_page.tsx:23`) | AP-01 | MUST |

### 🟢 백로그

| # | Review 항목 | 처리 |
|---|---|---|
| 31 | REJECTION_MIN_LENGTH 서버 측 검증 확인 + 주석 | AP-03 MUST (확인만) |
| 32 | `useApprovalKeyboard` 훅 (A/R 키보드 단축키) — Panel 약속 Modal에 이식 | AP-04 SHOULD |
| 33 | KPI 카드 shadow 제거 (border만으로 평평하게) | tech-debt |
| 34 | 역할별 내 차례 건수 KPI vs 사이드바 카운트 일치 검증 | tech-debt |

---

## Appendix B: Decision Rationale Trace

### 왜 5 PR로 분할하는가?

- 단일 거대 PR → revert/diagnose 어려움, harness loop 1회 ≥ 3 iteration 예상 → 비용 폭증
- 5 PR 각각 ≤ 200 LOC → harness loop 1~2 iteration 예상
- 각 PR 독립 verifiable (E2E spec 분리)

### 왜 RejectModal bulk + 단일 모두 comment 단일?

- "선택한 N건에 동일한 사유" 가 사용자 의도와 일치 (대량 반려 시 사유 매번 다르게 입력하는 부담)
- 일괄 처리는 본질적으로 "동일한 결정" — 사유도 동일이 자연스러움
- 항목별 사유가 필요하면 단일 모드로 1건씩 처리 (premise: 액션 대상 명확)

### 왜 ApprovalDetailPanel을 삭제하는가?

- 240줄 dead code — 어떤 라우팅에서도 진입되지 않음 확인됨 (Modal 단일 경로)
- 유지 비용 > 보존 가치 (revert 가능하므로 위험 낮음)

### 왜 AR-1~15를 PR에 끼워 넣는가?

- Single-purpose PR 원칙 위반 우려 있으나, 동일 파일 영역 수정 시 별도 PR로 분리하면 conflict 비용 ↑
- AR-N은 PR description에 명시 → 추적 가능
- harness Evaluator가 AR-N 별도 검증 (tech-debt-tracker 변화 측정)

---

**END OF CONTRACT DRAFT**

Approved 후 `.claude/contracts/approvals-ui-r2.md`로 복사 → `/harness mode2 approvals-ui-r2` 실행.
