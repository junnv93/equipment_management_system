# Exec Plan — Approvals UI Overhaul R2 (2026-04-27)

> **Status:** READY FOR GENERATOR
> **Contract:** `.claude/contracts/approvals-ui-r2.md` (APPROVED)
> **Mode:** harness Mode 2 (Planner → Generator → Evaluator)
> **PR Plan:** AP-01 → AP-02 → AP-03 → AP-04 → AP-05 (5 sequential PRs)
> **Architectural Reinforcement:** AR-1 ~ AR-15 (15 debts cleared inline)
> **Bundle Budget:** ≤ +8KB gzip total (per-PR delta tracked)

---

## 0. 실측 기반 현황 요약 (Evidence)

### 0.1 검증된 코드 위치

| 항목 | 파일:라인 | 현황 |
|---|---|---|
| URL tab Zod 검증 부재 | `ApprovalsClient.tsx:69-73` | `availableTabs.includes()` 단순 체크, fallback 토스트 없음 |
| invalidation 4× 중복 | `ApprovalsClient.tsx:148-155, 219-225, 270-277, 367-373` | 동일 invalidateKeys 배열 4번 반복 |
| queryKey 인라인 + userTeamId | `ApprovalsClient.tsx:108, 146, 217, 268, 365` | `queryKeys.approvals.list(activeTab, userTeamId)` — 두 번째 인자 제거 대상 |
| URGENCY_BORDER local | `ApprovalRow.tsx:33-46` | 두 개의 로컬 Record(`URGENCY_BORDER`, `URGENCY_BG`)가 design-token `APPROVAL_ROW_TOKENS`와 중복 |
| mini-stepper 하드코딩 | `ApprovalRow.tsx:116-122` | `'●'.repeat(history.length)` + `'○'.repeat(...)` + 매직넘버 |
| flex-wrap + truncate 충돌 | `ApprovalRow.tsx:109` | `flex items-center gap-2 flex-wrap` + `<span ... truncate>` |
| ApprovalDetailPanel dead code | `ApprovalDetailPanel.tsx` (215줄) | `ApprovalsClient.tsx`에서 import 0건 |
| useState + useActionState 이중 | `RejectModal.tsx:58-67, 70-94` | `reasonValue`/`validationError` local + useActionState 우회 패턴 |
| URVal.TEST_ENGINEER 직접 비교 | `approvals-api.ts:1060` | role helper 없이 직접 문자열 비교 |
| catch swallow 17건 | `approvals-api.ts:466~658` | 모두 `catch { return [] }` — 에러 마스킹 |
| inspection reject hard-throw | `approvals-api.ts:880` | `throw new Error('Inspection items cannot be rejected.')` — UI 버튼 항상 표시 |
| BulkActionBar non-sticky | `BulkActionBar.tsx:78-80` | `flex items-center justify-between py-3 px-4 rounded-lg` — fixed/sticky 없음 |
| BulkActionBar 0건 시 disabled 버튼 노출 | `BulkActionBar.tsx:74-76` | premise 위반 |
| KPI 4카드 hardcoded | `ApprovalKpiStrip.tsx:91-123` | `lg:grid-cols-4` + 4 KpiCard |
| KPI valueEmpty 단일처리 | `ApprovalKpiStrip.tsx:60-62` | 0건과 null 구분 불가 |
| `bg-muted/50 rounded-lg` 하드코딩 | `ApprovalDetailModal.tsx:115, 130` | token 미경유 |
| Modal isMultiStep 인라인 분기 | `ApprovalDetailModal.tsx:47-51, 99-103` | TAB_META.multiStep과 중복 |
| Stepper connector w-8 | `approval.ts:102` | `w-8 h-0.5 mx-2` — 고정폭 |
| Stepper current ring 부재 | `approval.ts:84` | completed와 색상 차이만, ring/halo 없음 |
| Sidebar `<nav>` vs Mobile `<div role="tablist">` | `ApprovalCategorySidebar.tsx:55`, `ApprovalMobileCategoryBar.tsx:54-58` | ARIA 패턴 분기 |
| HistoryCard connector 머리 미렌더 | `ApprovalHistoryCard.tsx:53` | `before:` pseudo 없음 |
| metadata.title 한국어 하드코딩 | `app/(dashboard)/admin/approvals/page.tsx:20` | i18n 미경유 |

### 0.2 i18n 키 실측 — 신규 추가 필요 (ko/en 양쪽 누락)

| Phase | 키 |
|---|---|
| AP-01 | `kpi.urgent`, `kpi.noUrgent`, `kpi.pendingCount`, `kpi.empty.zero`, `kpi.empty.notReady`, `tabFallback.invalidTab`, `metadata.title`, `metadata.description`, `sidebar.completedHint` |
| AP-02 | `bulkBar.stickyHint`, `bulkBar.selectionAnnouncement`, `bulkBar.allSelected`, `bulkBar.dismiss` |
| AP-03 | `rejectModal.single.description`, `rejectModal.bulk.description`, `rejectModal.charCounter` |
| AP-04 | `detail.elapsedDays`, `detail.urgencyLabel` |
| AP-05 | `miniStepper.aria.label`, `miniStepper.aria.currentStep`, `miniStepper.aria.completedStep`, `row.hoverApprove`, `row.hoverReject` |

### 0.3 Feature Flag / Bundle Baseline 인프라 부재

- `apps/frontend/lib/feature-flags.ts` — **미존재** → Phase 0에서 신규 생성
- `scripts/bundle-size-baseline.json` — **미존재** → Phase 0에서 신규 생성

---

## 1. AR ↔ Phase 배정 매트릭스

| AR | 이슈 | 파일:라인 | 처리 Phase |
|---|---|---|---|
| AR-1 | URGENCY_BORDER local Record | `ApprovalRow.tsx:33-46` | **AP-05** |
| AR-2 | approval.ts ↔ approval-constants.ts vocabulary divergence | `approvals-api.ts`, `approval-constants.ts` | **AP-04** |
| AR-3 | ApprovalDetailModal multi-step inline branching | `ApprovalDetailModal.tsx:47-51, 99-103` | **AP-04** |
| AR-4 | invalidation 4× 중복 | `ApprovalsClient.tsx:148, 219, 270, 367` | **AP-03** (helper 도입) |
| AR-5 | URL tab Zod 검증 부재 | `ApprovalsClient.tsx:69-73`, `page.tsx` | **AP-01** |
| AR-6 | URVal.TEST_ENGINEER 직접 비교 | `approvals-api.ts:1060` | **AP-03** |
| AR-7 | 17 catch swallow | `approvals-api.ts:466-658` | **AP-03** |
| AR-8 | inspection reject hard-throw vs UI button | `approvals-api.ts:880` | **AP-03** |
| AR-9 | ApprovalDetailPanel dead code | `ApprovalDetailPanel.tsx` (215줄) | **AP-04** |
| AR-10 | getPendingRentalImports deprecated | `approvals-api.ts:648` | **AP-04** |
| AR-11 | submitCalibrationPlan deprecated | `approvals-api.ts` | **AP-04** |
| AR-12 | userId: _userId unused | `ApprovalsClient.tsx:53` | **AP-04** |
| AR-13 | self_inspection ApprovalCategory 누락 | `approval-categories.ts` | **AP-01** |
| AR-14 | software_validation commentRequired:false vs label '검토완료' | `approval-constants.ts` | **AP-03** |
| AR-15 | queryKey userTeamId 중복 | `ApprovalsClient.tsx:108` | **AP-01** |

---

## 2. Phase 0 — Cross-cutting Infrastructure (AP-01 시작 전)

### 2.1 신규 생성 파일

| 파일 | 액션 | 핵심 내용 |
|---|---|---|
| `apps/frontend/lib/feature-flags.ts` | NEW | `getFeatureFlag('APPROVAL_UI_R2'): boolean`, 환경변수 기반, default false |
| `scripts/bundle-size-baseline.json` | NEW | `/admin/approvals` baseline gzip 값 + Phase별 delta 한도 |

### 2.2 Feature Flag 달성 상태

- `FeatureFlagName` discriminated union 타입
- `getFeatureFlag(name: FeatureFlagName): boolean` export
- `NEXT_PUBLIC_FEATURE_APPROVAL_UI_R2` 환경변수 파싱
- 단위 테스트 가능한 순수 함수 (import 없이 env만 의존)

---

## 3. Phase 1 — AP-01: KPI Strip + 배지 제거 + Tab Polish

**AR 청산:** AR-5, AR-13, AR-15

### 3.1 수정/생성 파일

| 파일 | 액션 | 핵심 변경 |
|---|---|---|
| `apps/frontend/components/approvals/ApprovalKpiStrip.tsx` | REWRITE | 4 → 3 카드, hierarchy tier, 0 vs null 분기 |
| `apps/frontend/components/approvals/ApprovalsClient.tsx` | EDIT | KPI 4→3 props, queryKey userTeamId 제거 (AR-15) |
| `apps/frontend/lib/api/query-config.ts` | EDIT | `queryKeys.approvals.list(category)` — teamId 인자 제거 |
| `apps/frontend/lib/design-tokens/components/approval.ts` | EDIT | `APPROVAL_KPI_STRIP_TOKENS`: `lg:grid-cols-3`, tier1/2/3, valueZero/valueNotReady 분리 |
| `apps/frontend/components/approvals/ApprovalRow.tsx` | EDIT | 배지 컬럼(`<Badge>` line 110-112) 제거 |
| `apps/frontend/components/approvals/ApprovalCategorySidebar.tsx` | EDIT | 0 카운트 active 시 "완료" 미니 라벨 |
| `apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx` | EDIT | `getCountBasedUrgency` 적용 (SHOULD) |
| `apps/frontend/app/(dashboard)/admin/approvals/page.tsx` | EDIT | `generateMetadata` async (i18n), searchParams.tab Zod parse + fallback redirect |
| `apps/frontend/messages/ko/approvals.json` | EDIT | AP-01 키 9개 추가 |
| `apps/frontend/messages/en/approvals.json` | EDIT | parity |
| `apps/frontend/tests/e2e/features/approvals/approvals-list-kpi.spec.ts` | NEW | KPI 3-tier, urgent aria-live |
| `apps/frontend/tests/e2e/features/approvals/approvals-empty-state.spec.ts` | NEW | "처리 완료" 메시지 premise |
| `apps/frontend/tests/e2e/features/approvals/approvals-tab-zod-fallback.spec.ts` | NEW | 잘못된 tab → fallback redirect |

### 3.2 구현 지침 (WHAT)

**ApprovalKpiStrip.tsx REWRITE 후 상태:**
- `lg:grid-cols-3` (4 → 3)
- 3 카드: `urgent` (Tier 1, 가장 큰 시각 비중), `pendingCount` (Tier 2), `avgWaitDays` (Tier 3)
- `todayProcessed` props/카드 완전 제거
- 0 vs null 분기:
  - `urgentCount === 0` → "0" (회색 muted) + sub `t('kpi.noUrgent')`
  - `urgentCount === null` → "–" + sub `t('kpi.empty.notReady')`
- `aria-live="polite"` on urgent count value
- 카드 클릭 → `router.push('?filter=urgent')` (SHOULD)

**page.tsx EDIT:**
- `generateMetadata` async function (i18n `getTranslations`)
- `searchParams.tab` Zod parse (`z.enum([...availableTabs])`), 실패 시 default tab `redirect()`

**query-config.ts:**
- `queryKeys.approvals.list(category?: string)` — teamId 인자 제거 (AR-15)
- 모든 호출 측 업데이트

### 3.3 검증

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
grep -r "ApprovalBadge\|StatusBadge" apps/frontend/components/approvals/  # 0
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/ApprovalKpiStrip.tsx
node scripts/verify-i18n.mjs --domain approvals
pnpm --filter frontend exec playwright test approvals-list-kpi.spec.ts approvals-empty-state.spec.ts approvals-tab-zod-fallback.spec.ts
```

### 3.4 Bundle Delta 목표

`+2KB gzip` 이내

---

## 4. Phase 2 — AP-02: BulkActionBar Floating Sticky

**AR 청산:** 없음

### 4.1 수정/생성 파일

| 파일 | 액션 | 핵심 변경 |
|---|---|---|
| `apps/frontend/components/approvals/BulkActionBar.tsx` | REWRITE | sticky bottom, 0건 hide, count chip, sr-only |
| `apps/frontend/lib/design-tokens/components/approval.ts` | EDIT | `APPROVAL_BULK_BAR_TOKENS`: stickyBottom, visibleHeight, fadeOut, countChip, dismissButton |
| `apps/frontend/components/approvals/ApprovalsClient.tsx` | EDIT | Esc 키 핸들러 + BulkActionBar 위치 조정 |
| `apps/frontend/messages/ko/approvals.json` | EDIT | AP-02 키 4개 추가 |
| `apps/frontend/messages/en/approvals.json` | EDIT | parity |
| `apps/frontend/tests/e2e/features/approvals/approvals-bulk-reject.spec.ts` | NEW | sticky fade, count chip, sr-only 공지 |

### 4.2 구현 지침 (WHAT)

**BulkActionBar.tsx REWRITE 후 상태:**
- `position: fixed; bottom: var(--bulk-bar-offset, 16px)` — token 기반
- 0건 → `opacity-0 pointer-events-none` (200ms fade-out)
- ≥1건 → `opacity-100` + count chip
- `× 선택 해제` 텍스트 버튼 (selectedCount > 0일 때만)
- 라벨 변형: 1~N개: "{count}개 선택됨 ×" / 전체: "전체 선택됨 ({count}/{total}) ×"
- `role="status" aria-live="polite"` on count chip
- sr-only div: selection 변동 카운트 공지
- Esc 키 → 전체 선택 해제
- `transition-opacity duration-200` (`transition: all` 금지)

**APPROVAL_BULK_BAR_TOKENS 신규 추가:**
- `stickyBottom`, `visibleHeight`, `fadeOut`, `fadeIn`, `countChip`, `dismissButton`

### 4.3 검증

```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/BulkActionBar.tsx
pnpm --filter frontend exec playwright test approvals-bulk-reject.spec.ts
```

### 4.4 Bundle Delta 목표

`+1KB gzip` 이내

---

## 5. Phase 3 — AP-03: RejectModal Unified

**AR 청산:** AR-4, AR-6, AR-7, AR-8, AR-14

### 5.1 수정/생성 파일

| 파일 | 액션 | 핵심 변경 |
|---|---|---|
| `apps/frontend/components/approvals/RejectModal.tsx` | REWRITE | discriminated union props, local state 단일화 |
| `apps/frontend/components/approvals/ApprovalsClient.tsx` | EDIT | `invalidateAfterApprovalAction` helper 도입, bulk reject → RejectModal 위임 |
| `apps/frontend/components/approvals/BulkActionBar.tsx` | EDIT | bulk reject AlertDialog 제거 → onBulkReject 콜백만 |
| `apps/frontend/lib/api/hooks/use-approvals-api.ts` | EDIT | `invalidateAfterApprovalAction(queryClient, category)` helper export |
| `apps/frontend/lib/api/approvals-api.ts` | EDIT | AR-6/7/8/14 처리 |
| `packages/schemas/src/approval.ts` | EDIT | `RejectReasonSchema = z.string().min(1).max(500)` export |
| `apps/frontend/messages/ko/approvals.json` | EDIT | AP-03 키 추가 |
| `apps/frontend/messages/en/approvals.json` | EDIT | parity |
| `apps/frontend/tests/e2e/features/approvals/approvals-bulk-reject.spec.ts` | UPDATE | RejectModal mode='bulk' 셀렉터 검증 |

### 5.2 구현 지침 (WHAT)

**RejectModal.tsx discriminated union:**
```typescript
type RejectModalProps =
  | { mode: 'single'; item: ApprovalItem; isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void> }
  | { mode: 'bulk'; items: ApprovalItem[]; categoryKey: ApprovalCategory; isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<{ success: string[]; failed: string[] }> };
```
- Single: description = `t('rejectModal.single.description', { summary })`
- Bulk: description = `t('rejectModal.bulk.description', { count: items.length })`
- local state 단일화: `useActionState` + Zod `RejectReasonSchema.safeParse()` 동기 검증
- 외부 `setValidationError` 우회 패턴 완전 제거
- 템플릿 선택: 빈 상태에서만 자동 입력
- Bulk API: `Promise.allSettled` + 부분 실패 toast 차등
- `useOptimisticMutation` + `invalidateAfterApprovalAction(category)` 호출
- char counter SHOULD: `{currentLength}/500`

**invalidateAfterApprovalAction helper:**
- `queryKeys.approvals.list(category)`, counts, kpi, calibration, checkout, equipment, nonConformances 모두 invalidate
- `Promise.all` 병렬 실행

**approvals-api.ts 수정:**
- AR-6 (line 1060): `URVal.TEST_ENGINEER` 직접 비교 → role-based i18n key 매핑 헬퍼
- AR-7: 17 catch swallow → `console.error` + `ApprovalApiError` throw (또는 Sentry breadcrumb)
- AR-8 (line 880): inspection reject guard 추가
- AR-14: `software_validation` commentRequired 정합성 확인

**packages/schemas/src/approval.ts:**
- `export const RejectReasonSchema = z.string().min(1, 'Required').max(500, 'Too long')`

### 5.3 검증

```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-frontend-state.mjs apps/frontend/components/approvals/RejectModal.tsx
node scripts/verify-i18n.mjs --domain approvals
node scripts/verify-hardcoding.mjs apps/frontend/lib/api/approvals-api.ts
pnpm --filter frontend exec playwright test approvals-bulk-reject.spec.ts
```

### 5.4 Bundle Delta 목표

`+2KB gzip` 이내

---

## 6. Phase 4 — AP-04: ApprovalDetailPanel 삭제 + Modal 보강

**AR 청산:** AR-2, AR-3, AR-9, AR-10, AR-11, AR-12

### 6.1 수정/생성 파일

| 파일 | 액션 | 핵심 변경 |
|---|---|---|
| `apps/frontend/components/approvals/ApprovalDetailPanel.tsx` | **DELETE** | 215줄 dead code (AR-9) |
| `apps/frontend/components/approvals/ApprovalDetailModal.tsx` | EDIT | elapsedDays/urgency 추가, bg-muted/50 → token, isMultiStep → TAB_META (AR-3) |
| `apps/frontend/components/approvals/DetailSection.tsx` | NEW | `<DetailSection title>` 공유 wrapper |
| `apps/frontend/components/approvals/ApprovalsClient.tsx` | EDIT | userId rename (AR-12), useApprovalKeyboard 통합 (SHOULD) |
| `apps/frontend/hooks/use-approval-keyboard.ts` | NEW (SHOULD) | A/R 키 단축키 훅 |
| `apps/frontend/components/approvals/ApprovalCategorySidebar.tsx` | EDIT | ARIA aria-label 통일 |
| `apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx` | EDIT | keyboard handling 통일 |
| `apps/frontend/components/approvals/ApprovalHistoryCard.tsx` | EDIT | connector 머리 `before:` pseudo (SHOULD), bg-muted → token |
| `apps/frontend/lib/api/approvals-api.ts` | EDIT | AR-10/11 deprecated 제거, AR-2 vocabulary 통합 |
| `apps/frontend/lib/design-tokens/components/approval.ts` | EDIT | `APPROVAL_DETAIL_PANEL_TOKENS` 제거, `APPROVAL_DETAIL_MODAL_TOKENS` 신설 |
| `apps/frontend/messages/ko/approvals.json` | EDIT | AP-04 키 추가 |
| `apps/frontend/messages/en/approvals.json` | EDIT | parity |
| 기존 12 e2e specs | UPDATE | Panel → Modal 셀렉터 교체 |

### 6.2 구현 지침 (WHAT)

**ApprovalDetailPanel.tsx DELETE:**
- 파일 삭제 후 `grep -r "ApprovalDetailPanel" apps/frontend` → 0건 보장
- `APPROVAL_DETAIL_PANEL_TOKENS` (approval.ts:506-570)도 함께 제거

**ApprovalDetailModal.tsx EDIT:**
- 메타 그리드: `elapsedDays` + urgency 컬럼 추가
- `bg-muted/50 rounded-lg p-4` (line 115) → `APPROVAL_DETAIL_MODAL_TOKENS.detailContainer`
- `flex items-center justify-between p-3 bg-muted/50 rounded-lg` (line 130) → `APPROVAL_DETAIL_MODAL_TOKENS.attachmentRow`
- `isMultiStep` 인라인 분기 → `TAB_META[item.category].multiStep ?? false`
- 섹션들 `<DetailSection title>` wrapper로 일관화

**DetailSection.tsx NEW:**
- props: `{ title: string; children: ReactNode; separator?: boolean }`
- 토큰 경유 스타일

### 6.3 검증

```bash
grep -r "ApprovalDetailPanel" apps/frontend  # 0
grep -r "APPROVAL_DETAIL_PANEL_TOKENS" apps/frontend  # 0
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/ApprovalDetailModal.tsx
pnpm --filter frontend exec playwright test approvals/
```

### 6.4 Bundle Delta 목표

`-3KB gzip` (Panel 215줄 + token 65줄 삭제)

---

## 7. Phase 5 — AP-05: MiniStepper + Row 구조 + Stepper 개선

**AR 청산:** AR-1

### 7.1 수정/생성 파일

| 파일 | 액션 | 핵심 변경 |
|---|---|---|
| `apps/frontend/components/approvals/ApprovalRowMiniStepper.tsx` | NEW | memo, role 분기, ARIA progressbar |
| `apps/frontend/components/approvals/ApprovalRow.tsx` | EDIT | URGENCY_BORDER 제거(AR-1), MiniStepper 통합, flex-nowrap+title, hover-inline ✓✗, muted/70 |
| `apps/frontend/components/approvals/ApprovalStepIndicator.tsx` | EDIT | current ring/halo, rejected dashed, disposalSteps 시작 차등, connector flex-1 |
| `apps/frontend/lib/design-tokens/components/approval.ts` | EDIT | STEPPER_TOKENS 확장, ROW_TOKENS.miniStepper, CARD_BORDER_TOKENS 정리 |
| `apps/frontend/messages/ko/approvals.json` | EDIT | AP-05 키 5개 추가 |
| `apps/frontend/messages/en/approvals.json` | EDIT | parity |
| `apps/frontend/tests/e2e/features/approvals/approvals-mini-stepper.spec.ts` | NEW | progressbar ARIA, role 분기, hover-inline |

### 7.2 구현 지침 (WHAT)

**ApprovalRowMiniStepper.tsx NEW:**
- `React.memo` 강제
- `Array.from({ length: totalSteps }, (_, i) => <Dot active={i < currentStep} />)` — String.repeat 제거
- ARIA: `role="progressbar" aria-valuenow={currentStep} aria-valuemax={totalSteps} aria-label={t('miniStepper.aria.label', { current, total })}`
- role props → 각 step description i18n
- prefers-reduced-motion 시 pulse-dot 비활성
- 모든 행 균일 (단일 단계 = Dot 1개)

**ApprovalRow.tsx EDIT:**
- URGENCY_BORDER/URGENCY_BG local Record (line 33-46) 완전 제거
- mini-stepper 코드 (line 116-122) → `<ApprovalRowMiniStepper>` 컴포넌트
- `flex-wrap` → `flex-nowrap` + `title={summary}`
- hover-inline ✓✗ 버튼: `group-hover:opacity-100` pattern
- 보조 텍스트: `text-muted-foreground` → `text-muted-foreground/70`

**ApprovalStepIndicator.tsx EDIT:**
- current 노드: `ring-4 ring-brand-info/20` 추가
- rejected 이후 connector: dashed variant + `opacity-40`
- disposalSteps 시작: `▸` 마이크로 라벨 차등화 (SHOULD)
- connector: `w-8 h-0.5 mx-2` → `flex-1 min-w-[24px] h-0.5 mx-2`

**approval.ts EDIT:**
- `APPROVAL_STEPPER_TOKENS.connector.base`: flex-1 min-w 적용
- `APPROVAL_STEPPER_TOKENS.status.current`: ring-4 ring-brand-info/20 추가
- 신규: `APPROVAL_STEPPER_TOKENS.status.rejectedDashed`
- `APPROVAL_CARD_BORDER_TOKENS`: grep 후 미사용이면 제거

### 7.3 검증

```bash
pnpm --filter frontend run tsc --noEmit
node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/
grep -r "URGENCY_BORDER\|URGENCY_BG" apps/frontend/components/approvals/  # 0
pnpm --filter frontend exec playwright test approvals-mini-stepper.spec.ts
```

### 7.4 Bundle Delta 목표

`+2KB gzip` 이내

---

## 8. Cross-cutting Verification (5 PR 머지 후)

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
pnpm --filter frontend run analyze

node scripts/verify-design-tokens.mjs apps/frontend/components/approvals/
node scripts/verify-i18n.mjs --domain approvals
node scripts/verify-frontend-state.mjs apps/frontend/components/approvals/
node scripts/verify-hardcoding.mjs apps/frontend/lib/api/approvals-api.ts

pnpm --filter frontend exec playwright test approvals/
```

---

## 9. Build Sequence 체크리스트

### Phase 0
- [ ] `apps/frontend/lib/feature-flags.ts` NEW
- [ ] `scripts/bundle-size-baseline.json` NEW
- [ ] Baseline 측정

### AP-01
- [ ] ApprovalKpiStrip REWRITE (3 카드, 0/null 분기)
- [ ] ApprovalRow 배지 컬럼 제거
- [ ] ApprovalsClient KPI props 변경
- [ ] query-config teamId 제거
- [ ] approval.ts APPROVAL_KPI_STRIP_TOKENS 확장
- [ ] page.tsx Zod parse + metadata i18n
- [ ] ApprovalCategorySidebar 0 카운트 라벨
- [ ] i18n ko/en 9개 키
- [ ] E2E spec NEW × 3
- [ ] Verify PASS, Bundle ≤ +2KB

### AP-02
- [ ] BulkActionBar REWRITE
- [ ] approval.ts BULK_BAR_TOKENS 확장
- [ ] ApprovalsClient Esc handler
- [ ] i18n ko/en 4개 키
- [ ] E2E spec NEW
- [ ] Verify PASS, Bundle ≤ +1KB

### AP-03
- [ ] RejectModal REWRITE (discriminated union)
- [ ] use-approvals-api.ts invalidateAfterApprovalAction
- [ ] ApprovalsClient 4× invalidation → helper
- [ ] BulkActionBar AlertDialog 제거
- [ ] approvals-api.ts AR-6/7/8/14
- [ ] packages/schemas RejectReasonSchema
- [ ] i18n ko/en 추가
- [ ] E2E spec UPDATE
- [ ] Verify PASS, Bundle ≤ +2KB

### AP-04
- [ ] ApprovalDetailPanel DELETE
- [ ] APPROVAL_DETAIL_PANEL_TOKENS 제거
- [ ] ApprovalDetailModal EDIT
- [ ] DetailSection NEW
- [ ] ApprovalsClient userId rename
- [ ] use-approval-keyboard NEW (SHOULD)
- [ ] ApprovalHistoryCard EDIT
- [ ] approvals-api.ts AR-10/11/2
- [ ] approval.ts DETAIL_MODAL_TOKENS 신설
- [ ] 기존 12 spec 셀렉터 업데이트
- [ ] Verify: grep Panel → 0, tsc PASS, Bundle ≤ -3KB

### AP-05
- [ ] ApprovalRowMiniStepper NEW
- [ ] ApprovalRow URGENCY 제거 + MiniStepper + flex-nowrap + hover-inline
- [ ] ApprovalStepIndicator ring/dashed/connector
- [ ] approval.ts STEPPER/ROW tokens
- [ ] i18n ko/en 5개 키
- [ ] E2E spec NEW
- [ ] Verify PASS, Bundle ≤ +2KB

### Final
- [ ] `/verify-implementation` PASS
- [ ] `/review-architecture` PASS
- [ ] Feature flag 카나리 1주 후 제거
- [ ] tech-debt-tracker 15건 등록

---

## 10. Critical Details

### 10.1 Error Handling
- RejectModal bulk: `Promise.allSettled` → success/failed 차등 toast
- approvals-api.ts 17 catch → `ApprovalApiError` + Sentry breadcrumb
- 409 시 `invalidateAfterApprovalAction` 자동 호출 (CAS)

### 10.2 State Management
- `useOptimisticMutation` 강제 (`setQueryData` 금지)
- RejectModal useState + useActionState 이중 → 단일화
- URL `searchParams.tab` SSOT (sync state 추가 금지)

### 10.3 Performance
- `ApprovalRowMiniStepper` React.memo 강제
- BulkActionBar sr-only debounce 200ms 권장
- AP-04 Panel 삭제 → -3KB로 5 PR 합산 ≈ +4KB 예상

### 10.4 Security
- Reject reason: Zod client 검증 + backend RejectReasonSchema (defense in depth)
- KPI aria-live="polite" (assertive 금지)
- 키보드 핸들러: input/textarea focus 시 비활성

---

## 11. Tech Debt Tracker (이연 15건)

exec-plan 완료 시 `.claude/exec-plans/tech-debt-tracker.md`에 등록:

**Contract Section 11 (11건):**
1. ApprovalCategory에 `self_inspection` 추가 (AR-13 후속)
2. notification_preferences FK 정책 결정
3. approvals-api.ts 1401줄 → 카테고리별 sub-module 분리
4. ROLE_APPROVAL_CATEGORIES → DB-backed
5. approval-constants.ts ↔ approval.ts vocabulary 통합
6. Approval audit timeline UI
7. Bulk approve mutation rate-limit
8. Mobile detail modal full-screen 모드
9. Reject reason template (quick-select)
10. Approval delegation
11. Approval analytics dashboard

**Plan-time 추가 (4건):**
12. `[2026-04-27 ap-r2] 🟡 MEDIUM` bundle-baseline-ci-gate — CI 자동 측정+한도 검증
13. `[2026-04-27 ap-r2] 🟡 MEDIUM` feature-flag-telemetry — 카나리 1주 후 사용량 데이터
14. `[2026-04-27 ap-r2] 🟢 LOW` approvals-api-error-class — equipment-errors.ts SSOT 통합
15. `[2026-04-27 ap-r2] 🟢 LOW` useApprovalKeyboard-generalization — 두 번째 사용처 등장 시

---

**END OF EXEC PLAN**
