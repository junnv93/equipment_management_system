# 2026-05-10 Checkouts Sprint 4 UX — U-02/U-03/U-04/U-05/U-06/U-08 Frontend Wiring (Mode 2)

> Slug: `checkouts-sprint4-ux-u02-u08` · Mode: 2
> Sprint 4.5 T3 — 6 잔여 UX 항목의 frontend wiring + 2 frontend-only 신규 기능.
> "누락 없이 타협 없이 시스템 전반" — Phase별 시니어 자기검토 라운드 #1/#2 적용.

---

## Goal

Sprint 4.5 T1+T2 (`checkouts-v3-sprint45`, 2026-04-30 종결)에서 흡수된 U-01/U-07/U-09/U-10/U-11/U-12 외,
잔여 6건을 단일 sprint로 종결한다.

| Phase | ID   | 기능                              | Backend 상태               |
| ----- | ---- | --------------------------------- | -------------------------- |
| A     | U-06 | QR drawer (페이지 전환 없음)       | 변경 없음                   |
| B     | U-02 | 전역 단축키 + `?` 치트시트         | 변경 없음                   |
| C     | U-05 | Undo 5초 토스트 + revoke-approval | **이미 완성** (controller L798, 5단계 fail-close, CAS, AuditLog) |
| D     | U-04 | 인라인 반려 사유 + 프리셋 chips    | **이미 완성** (controller L202, `getRejectionPresets`) |
| E     | U-08 | Destination combobox + recent      | **이미 완성** (controller L782, `getRecentDestinations`) |
| F     | U-03 | Saved Views + sticky 헤더         | **신규 1개** (`GET /checkouts/saved-view-counts`) |

### 핵심 발견 사항 (Planner Discovery)

1. **U-04/U-05/U-08 backend 인프라 이미 완성** — controller/service/DTO 전부 구현됨.
   - `REJECTION_PRESETS`, `DESTINATIONS_RECENT`, `REVOKE_APPROVAL` api-endpoints SSOT L147-151에 등록됨.
   - Sprint 4 backend 변경은 Phase F `saved-view-counts` 1개뿐.
2. **U-06 premise 변경** — `HandoverQRDisplay.tsx` 미존재.
   QR Phase 3 handover-token은 2026-05-09에 `verify-handover-qr`에서 직접 스캔 방식으로 대체.
   U-06 drawer는 `apps/frontend/components/equipment/EquipmentQRCode.tsx` 재활용.

---

## Phase Strategy (의존성 순서)

```
Phase A — U-06 QR Drawer (가장 단순, backend 0, EquipmentQRCode 재활용)
   ↓
Phase B — U-02 Keyboard Shortcuts Provider (전역 hook + SSOT 상수, backend 0)
   ↓ (Q 단축키는 Phase A drawer trigger에 등록)
Phase C — U-05 Undo Toast (use-optimistic-mutation 확장 + revoke-approval wiring)
   ↓
Phase D — U-04 Inline Reject Presets (rejection-presets API wiring + inline panel)
   ↓
Phase E — U-08 Destination Combobox (destinations-recent API wiring + Command UI)
   ↓
Phase F — U-03 Saved Views (localStorage SSOT + URL sync + count API 신설 1개)
```

---

## Phase A — U-06 QR Drawer

### 신규 생성 (2 files)
- `apps/frontend/components/checkouts/CheckoutQrDrawerTrigger.tsx`
  - 내부 `<Sheet>` 상태 캡슐화. props: `{ checkoutId: string; equipment: { managementNumber: string; name: string }[] }`
  - 데스크톱: `side="right"`, 모바일(<640px): `side="bottom"` — Tailwind `md:` responsive 분기 (SSR safe)
  - drawer body: equipment 배열 순회 → `<EquipmentQRCode managementNumber={...} />` 렌더
  - `Q` 단축키 handler prop 수용 (Phase B scope 등록 후 연결, 없으면 버튼만 동작)
- `apps/frontend/lib/design-tokens/components/checkout-qr-drawer.ts`
  - `CHECKOUT_QR_DRAWER_TOKENS` (trigger / drawerContainer / closeBtn). dark prefix 금지.

### 수정 대상 (2 files)
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - 헤더 우측 `<CheckoutQrDrawerTrigger checkoutId={...} equipment={checkout.equipment} />` 배치
- i18n: `apps/frontend/messages/ko/checkouts.json` + `apps/frontend/messages/en/checkouts.json`
  - `qrDrawer.{trigger,title,description,close,empty}` + `qrDrawer.aria.{open,close}` — 7+ 키 양 로케일

### 수정 금지
- backend QR/handover 코드 (변경 0)
- `EquipmentQRCode.tsx` 시그니처 변경 0 (재사용만)
- `/checkouts/[id]/qr` 라우트 유지

**파일 예산: ≤ 5**

---

## Phase B — U-02 Keyboard Shortcuts

### 신규 생성 (5 files)
- `apps/frontend/lib/constants/keyboard-shortcuts.ts`
  - `KEYBOARD_SHORTCUTS: as const satisfies Record<'list' | 'detail' | 'global', readonly Shortcut[]>`
  - list: J/K/Enter/슬래시/F/GG/GE/A/Shift+A
  - detail: Y/N/Q/Esc
  - global: ?
- `apps/frontend/hooks/use-keyboard-shortcuts.ts`
  - document keydown listener + IME 가드 (`e.nativeEvent.isComposing` 한 줄 — window-level listener 추가 금지)
  - 입력 포커스 가드: INPUT|TEXTAREA|SELECT|isContentEditable skip (Esc 예외)
  - G+G/G+E 200ms combo timeout
- `apps/frontend/hooks/use-keyboard-shortcuts-scope.ts`
  - Context 기반 scope 등록 hook. 마운트 시 push, unmount 시 pop
- `apps/frontend/components/shared/KeyboardShortcutsProvider.tsx`
  - Context + scope 스택 + `?` 치트시트 모달 state
- `apps/frontend/components/shared/KeyboardShortcutsCheatsheet.tsx`
  - shadcn `Dialog` + role별 grouping + `KEYBOARD_SHORTCUTS` 순회 렌더

### 수정 대상 (4 files)
- `apps/frontend/app/layout.tsx` (또는 root Providers 합성 지점)
  - `<KeyboardShortcutsProvider>` 1회 등록
- `apps/frontend/app/(dashboard)/checkouts/page.tsx`
  - `useKeyboardShortcutsScope('list', handlers)` 등록
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - `useKeyboardShortcutsScope('detail', { q: drawer toggle, y: handleApprove, n: handleReject, escape: back })` 등록
- i18n: ko + en
  - `shortcuts.{list,detail,global}.*` (14키) + `shortcuts.cheatsheet.{title,description,closeAriaLabel}` (3키) = 17+ 키

### 수정 금지
- 다른 도메인 페이지 단축키 등록
- 브라우저 기본 단축키 override

**파일 예산: ≤ 9**

---

## Phase C — U-05 Undo Toast

### 신규 생성 (2 files)
- `apps/frontend/hooks/use-undo-toast.ts`
  - sonner 토스트 + 카운트다운 + Esc dismiss
  - `role="status"` / `aria-live="polite"`
  - props: `{ onUndo: () => void; durationMs: number; labelKey: string }`
- `apps/frontend/lib/api/checkout-revoke-approval.ts`
  - `revokeApproval(uuid, { version })` — `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL(uuid)` SSOT 사용

### 수정 대상 (3 files)
- `apps/frontend/hooks/use-optimistic-mutation.tsx` (.tsx 확장자 주의)
  - 옵션 추가: `undoWindowMs?: number`, `onUndo?: (variables) => Promise<void>`
  - optimistic 즉시 적용 → setTimeout(undoWindowMs) 동안 toat 표시 + mutationFn 보류 (AbortController)
  - undo 클릭 시: abort + `invalidateQueries`(setQueryData 금지)
  - 윈도우 경과 시: mutationFn 실행
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - approve 계열 mutation (approveMutation, borrowerApproveMutation, approveReturnMutation) 에 `undoWindowMs: 5000` + `onUndo: revokeApproval` 옵션
  - reject 계열은 5초 abort만 (보상 트랜잭션 N/A)
- `apps/frontend/hooks/use-checkout-card-mutations.ts` (또는 동등 hook)
  - `useApproveCheckoutMutation`, `useBorrowerApproveCheckoutMutation` — 동일 옵션 전달

### i18n (1 file pair)
- `undo.toast.{approveSucceeded,undoCta,reverted,revertFailed,dismiss,countdownSrLabel}` — 6+ 키 양 로케일

### 수정 금지
- backend revoke-approval (이미 완성)
- `setQueryData` 추가 0건 (MUST C2)
- mutation TData/TCachedData 타입 구조 변경

**파일 예산: ≤ 7**

---

## Phase D — U-04 Inline Reject Presets

### 신규 생성 (3 files)
- `apps/frontend/hooks/use-rejection-presets.ts`
  - `useQuery({ queryKey: queryKeys.checkouts.resource.rejectionPresets(), staleTime: CACHE_TIMES.DAY })`
  - `API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS` SSOT
- `apps/frontend/components/checkouts/RejectReasonPresets.tsx`
  - chip group + textarea 합성. preset 클릭 시 textarea 주입(덮어쓰기) + 추가 편집 가능
  - `Esc` 취소, `Ctrl+Enter` 제출. props: `{ value, onChange, onSubmit, onCancel, isPending }`
- `apps/frontend/components/checkouts/CheckoutRejectInline.tsx`
  - CheckoutGroupCard 행 아래 expand 래퍼. 모바일(<640px) `Sheet` fallback

### 수정 대상 (3 files)
- `apps/frontend/lib/api/query-config.ts`
  - `queryKeys.checkouts.resource.rejectionPresets: () => [...resource.all(), 'rejection-presets'] as const`
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - 행 reject 액션 트리거 → `<CheckoutRejectInline>` expand 토글
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - 기존 reject Dialog textarea 위에 `<RejectReasonPresets>` chip 영역 삽입

### i18n
- `reject.inline.{placeholder,submit,cancel,presetLabel,minLength,empty}` + `reject.inline.aria.{expanded,collapsed}` — 8+ 키

### 수정 금지
- backend getRejectionPresets, DB seed (이미 완성 — 사용자 원문 확인 별도)
- 기존 `POST /checkouts/:id/reject` 본체

**파일 예산: ≤ 8**

---

## Phase E — U-08 Destination Combobox

### 신규 생성 (4 files)
- `apps/frontend/lib/api/checkout-destinations-recent.ts`
  - `getRecentDestinations()` wrapper — `API_ENDPOINTS.CHECKOUTS.DESTINATIONS_RECENT` SSOT
- `apps/frontend/hooks/use-recent-destinations.ts`
  - `useQuery({ queryKey: queryKeys.checkouts.resource.destinationsRecent({ userId }), staleTime: CACHE_TIMES.DAY })`
- `apps/frontend/lib/utils/fuzzy-search.ts`
  - `fuzzyMatch(items: string[], query: string): string[]` — NFD normalization + lowercase + substring
- `apps/frontend/components/checkouts/CheckoutDestinationCombobox.tsx`
  - shadcn `Command + CommandInput + CommandGroup + CommandItem`
  - IME 가드: onKeyDown `e.nativeEvent.isComposing` skip
  - 빈 결과 시 "+ 새 목적지 추가" → `onChange({ kind: 'new', label: query })`

### 수정 대상 (2 files)
- `apps/frontend/lib/api/query-config.ts`
  - `queryKeys.checkouts.resource.destinationsRecent: ({ userId }) => [...resource.all(), 'destinations-recent', userId] as const`
- 반출 신청 폼 컴포넌트 (실제 경로 Glob으로 확인 후 surgical edit)
  - destination 필드 → `<CheckoutDestinationCombobox>` 교체

### i18n
- `destination.{placeholder,groupRecent,groupTeam,groupExternal,addNew,noResults}` + `destination.aria.{listbox}` — 7+ 키

### 수정 금지
- backend getRecentDestinations (이미 완성)
- destination 모델/스키마

**파일 예산: ≤ 8**

---

## Phase F — U-03 Saved Views (가장 복잡)

### Backend 신설 (1개 — 본 sprint 유일한 backend 변경)
- `apps/backend/src/modules/checkouts/checkouts.controller.ts`
  - `@Get('saved-view-counts') @RequirePermissions(Permission.VIEW_CHECKOUTS)` 추가
  - `extractUserId(req)` + scope 적용 + `Promise<{ yourTurn, overdue, dueThisWeek }>`
- `apps/backend/src/modules/checkouts/checkouts.service.ts`
  - `getSavedViewCounts(userId)` — 3카운트 병렬 count query, `CACHE_TTL.SHORT` 30s
- `packages/shared-constants/src/api-endpoints.ts`
  - `SAVED_VIEW_COUNTS: '/api/checkouts/saved-view-counts'`

### 신규 생성 — Frontend (6 files)
- `apps/frontend/lib/checkouts/saved-views.ts`
  - `SavedView` 타입 + `MAX_VIEWS = 5` + localStorage factory
  - `typeof window === 'undefined'` SSR safe + `QuotaExceededError` try/catch
- `apps/frontend/hooks/use-saved-views.ts`
  - localStorage store + URL query sync. 클릭 시 URL 변경만(localStorage write 0)
- `apps/frontend/hooks/use-saved-view-counts.ts`
  - `useQuery({ queryKey: queryKeys.checkouts.view.savedViewCounts(), ...CHECKOUT_SUMMARY_PRESET })`
- `apps/frontend/components/checkouts/FilterStickyBar.tsx`
  - `sticky top-[var(--sticky-header-height)]` 래퍼 (기존 CSS var 재사용, 신규 정의 0)
- `apps/frontend/components/checkouts/SavedViewsToolbar.tsx`
  - chip toolbar (시스템 3 + 커스텀 N)
- `apps/frontend/components/checkouts/SaveViewDialog.tsx`
  - shadcn Dialog + 이름 입력 + 저장/덮어쓰기/삭제

### 수정 대상 — Frontend (3 files)
- `apps/frontend/lib/api/query-config.ts`
  - `queryKeys.checkouts.view.savedViewCounts: () => [...view.all(), 'saved-view-counts'] as const`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - 필터 영역 `<FilterStickyBar>` 래핑
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - 필터 영역 `<FilterStickyBar>` 래핑

### i18n
- `savedViews.system.{yourTurn,overdue,dueThisWeek}` + `savedViews.{save,delete,rename,overwrite,cancel,limitReached,empty}` + `savedViews.dialog.{title,description,namePlaceholder}` + `savedViews.aria.{toolbar,reorder}` — 18+ 키

**파일 예산: ≤ 12**

---

## Cross-Cutting Concerns

### i18n parity (ko/en 100%)
| Phase | 신규 키 수 (양 로케일) |
| ----- | -------------------- |
| A (U-06)  | 7+ (qrDrawer.*) |
| B (U-02)  | 17+ (shortcuts.*) |
| C (U-05)  | 6+ (undo.toast.*) |
| D (U-04)  | 8+ (reject.inline.*) |
| E (U-08)  | 7+ (destination.*) |
| F (U-03)  | 18+ (savedViews.*) |
| **합계**  | **63+ 키 × 2 로케일** |

검증: `jq -r 'paths(scalars) | join(".")' messages/ko/checkouts.json | sort > /tmp/ko && jq -r 'paths(scalars) | join(".")' messages/en/checkouts.json | sort > /tmp/en && diff /tmp/ko /tmp/en`

### SSOT 위반 0건
- API URL: `API_ENDPOINTS.CHECKOUTS.*` 사용만 (인라인 raw URL 0)
- queryKey: `queryKeys.checkouts.resource.*` / `queryKeys.checkouts.view.*` 구조 준수
- 단축키 정의: `KEYBOARD_SHORTCUTS` 상수 SSOT

### 보안 (CLAUDE.md Rule 2)
- Phase F backend `extractUserId(req)` 서버 추출. body/query userId 신뢰 0

### a11y
- drawer/dialog: `role="dialog"` + aria-label + focus trap (shadcn 기본)
- undo 토스트: `role="status"` + `aria-live="polite"` + Esc dismiss
- chip group expand: `aria-expanded` + `aria-controls`
- combobox: `role="combobox"` + `aria-expanded` + `aria-activedescendant`
- 치트시트: role별 grouping `<section role="group" aria-labelledby>`

### 성능
- rejection-presets / destinations-recent: `staleTime: CACHE_TIMES.DAY`
- saved-view-counts: CHECKOUT_SUMMARY preset (SHORT + refetchOnWindowFocus)
- combobox fuzzy: `useMemo` 캐싱

---

## Build Sequence

```
Step 1.  Phase A (CheckoutQrDrawerTrigger + i18n) → tsc + lint
Step 2.  Phase B (Provider + hook + cheatsheet + SSOT 상수) → tsc + lint
Step 3.  Phase B 후속 — checkouts page list/detail scope 등록
Step 4.  Phase C (use-optimistic-mutation 확장 + use-undo-toast hook)
Step 5.  Phase C 후속 — CheckoutDetailClient mutation 옵션 + use-checkout-card-mutations
Step 6.  Phase D (use-rejection-presets + RejectReasonPresets + CheckoutRejectInline)
Step 7.  Phase D 후속 — query-config rejectionPresets key + GroupCard wiring + DetailClient dialog
Step 8.  Phase E (fuzzy-search + CheckoutDestinationCombobox + hooks)
Step 9.  Phase E 후속 — query-config destinationsRecent key + 반출 신청 폼 wiring
Step 10. Phase F-1 (saved-views.ts + use-saved-views + use-saved-view-counts + backend endpoint)
Step 11. Phase F-2 (FilterStickyBar + SavedViewsToolbar + SaveViewDialog)
Step 12. Phase F-3 — OutboundCheckoutsTab/InboundCheckoutsTab 래핑
Step 13. e2e 통합 확인
Step 14. Verify-* 회귀 (verify-ssot, verify-i18n, verify-frontend-state, verify-handover-qr)
Step 15. 시니어 자기검토 라운드 #1 (표면: contract grep 정확도, 누락 영역)
Step 16. 시니어 자기검토 라운드 #2 (시스템적: JIT unsafe / role 리터럴 / dark prefix / scope 전체 grep)
Step 17. commit + push
```

---

## Non-Goals (out of scope)

- Phase F의 saved-view-counts 외 추가 backend 변경 0
- bulk action에 undo 적용 (별도 sprint `bulk-undo-toast`)
- revoke-approval 5분 보상 경로 UI (SHOULD `revoke-window-extended-toast`)
- `/settings/shortcuts` 커스터마이즈 페이지 (SHOULD `shortcuts-settings-page`)
- Saved Views 팀 공유 / 서버 저장 (SHOULD `saved-views-team-share`)
- Destination inline 등록 폼 (SHOULD `destination-inline-create`)
- Preset 텍스트 DB seed 확정 (사용자 원문 필요 — memory `feedback_no_fabricate_domain_data`)
- equipment/calibration 등 타 도메인 단축키

---

## 시니어 자기검토 라운드 패턴

- **라운드 #1 표면**: contract grep 정확도, 단편 임시방편 0, MUST 빠진 항목 0
- **라운드 #2 시스템적**: scope 도메인 전체 재귀 grep, JIT unsafe 동적 보간 0, role 리터럴 0, dark prefix 0
- **라운드 #3 운영**: 409 CAS cache invalidate 경로, undo abort 시 cache rollback, multi-session stash drift 대비

각 라운드 즉시 수정 vs tech-debt 분리 결정.
