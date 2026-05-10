---
slug: checkouts-sprint4-ux-u02-u08
type: contract
date: 2026-05-10
sprint: 4
sprint_step: 4.5.T3
depends:
  - checkouts-v3-sprint45
  - checkout-query-keys-view-resource-refactor
---

# Contract — Checkouts Sprint 4 UX U-02/U-03/U-04/U-05/U-06/U-08

## Scope

Sprint 4.5 T3 — 잔여 6개 UX 항목의 frontend wiring + 2 frontend-only 신규 기능.

| Phase | ID   | 기능                              | Backend 상태 |
| ----- | ---- | --------------------------------- | ------------ |
| A     | U-06 | QR drawer                         | 변경 없음     |
| B     | U-02 | 전역 단축키 + `?` 치트시트         | 변경 없음     |
| C     | U-05 | Undo 5초 토스트 + revoke-approval | **이미 완성** |
| D     | U-04 | 인라인 반려 사유 + 프리셋 chips    | **이미 완성** |
| E     | U-08 | Destination combobox + recent      | **이미 완성** |
| F     | U-03 | Saved Views + sticky 헤더         | **신규 1개** (`saved-view-counts`) |

---

## MUST (loop-blocking)

### Cross-cutting (모든 Phase)

- [ ] **M1** `pnpm tsc --noEmit` PASS — 전 패키지
- [ ] **M2** `pnpm build` PASS — frontend + backend
- [ ] **M3** `pnpm --filter frontend run lint` + `pnpm --filter backend run lint` PASS
- [ ] **M4** SSOT 위반 0건
  ```bash
  # API URL 인라인 금지
  grep -rn "'/api/checkouts/revoke-approval\|'/api/checkouts/rejection-presets\|'/api/checkouts/destinations/recent\|'/api/checkouts/saved-view-counts" apps/frontend/
  # 기대: 0 hit (모두 API_ENDPOINTS.CHECKOUTS.* 경유)
  ```
- [ ] **M5** 하드코딩 0건 — magic number / raw API URL / hard-coded Korean string in JSX 0
- [ ] **M6** i18n parity ko/en 100%
  ```bash
  jq -r 'paths(scalars) | join(".")' apps/frontend/messages/ko/checkouts.json | sort > /tmp/ko-keys.txt
  jq -r 'paths(scalars) | join(".")' apps/frontend/messages/en/checkouts.json | sort > /tmp/en-keys.txt
  diff /tmp/ko-keys.txt /tmp/en-keys.txt
  # 기대: 0 diff
  ```
- [ ] **M7** setQueryData 추가 0건
  ```bash
  grep -c "setQueryData" apps/frontend/hooks/use-optimistic-mutation.tsx
  # 기대: 0
  grep -rn "setQueryData" apps/frontend/hooks/use-undo-toast.ts apps/frontend/lib/api/checkout-revoke-approval.ts 2>/dev/null
  # 기대: 0 hit
  ```
- [ ] **M8** any 사용 0 — 신규/수정 파일 `: any` 0건
- [ ] **M9** dark prefix 0 — design-token 파일 내 `dark:` 0
  ```bash
  grep -n "dark:" apps/frontend/lib/design-tokens/components/checkout-qr-drawer.ts 2>/dev/null
  # 기대: 0 hit
  ```
- [ ] **M10** WCAG color-only 0 — 모든 severity/status는 텍스트/아이콘 동반
- [ ] **M11** prefers-reduced-motion — drawer/dialog/toast 애니메이션 `motion-safe:` prefix 또는 Radix 기본
- [ ] **M12** 변경 파일 수 ≤ 49
  ```bash
  git diff --name-only HEAD~1 | grep -v '^\.claude/' | wc -l
  # 기대: <= 49
  ```
- [ ] **M13** pre-push hook 통과 (tsc + backend/frontend test PASS)

### Phase A — U-06 QR Drawer

- [ ] **A1** `CheckoutQrDrawerTrigger.tsx` 신규 생성 + named export
- [ ] **A2** QR 전용 새 backend API 0건 (memory `feedback_qr_is_path_not_workflow`)
  ```bash
  git diff --stat apps/backend/src/modules/checkouts/ | grep -v "saved-view"
  # 기대: Phase A는 backend 변경 0
  ```
- [ ] **A3** `EquipmentQRCode` 재사용 (중복 구현 0)
  ```bash
  grep -n "EquipmentQRCode" apps/frontend/components/checkouts/CheckoutQrDrawerTrigger.tsx
  # 기대: 1+ hit
  ```
- [ ] **A4** drawer `role="dialog"` + aria-label + Esc close
- [ ] **A5** SSR safe mobile/desktop 분기 (Tailwind responsive — `typeof window` 직접 분기 0)
  ```bash
  grep -n 'typeof window' apps/frontend/components/checkouts/CheckoutQrDrawerTrigger.tsx
  # 기대: 0 hit
  ```
- [ ] **A6** i18n `qrDrawer.*` 7+ 키 양 로케일
  ```bash
  grep -c "qrDrawer" apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json
  # 기대: 양쪽 7+
  ```

### Phase B — U-02 Keyboard Shortcuts

- [ ] **B1** 4개 신규 파일 생성: `use-keyboard-shortcuts.ts`, `use-keyboard-shortcuts-scope.ts`, `KeyboardShortcutsProvider.tsx`, `KeyboardShortcutsCheatsheet.tsx`
- [ ] **B2** IME 가드 — `e.nativeEvent.isComposing` (window-level compositionstart 금지)
  ```bash
  grep -n "nativeEvent.isComposing" apps/frontend/hooks/use-keyboard-shortcuts.ts
  # 기대: 1+ hit
  grep -n "compositionstart" apps/frontend/hooks/use-keyboard-shortcuts.ts
  # 기대: 0 hit
  ```
- [ ] **B3** `KEYBOARD_SHORTCUTS` satisfies Record 강제
  ```bash
  grep -n "satisfies Record<" apps/frontend/lib/constants/keyboard-shortcuts.ts
  # 기대: 1+ hit
  ```
- [ ] **B4** 입력 포커스 가드 (INPUT/TEXTAREA/SELECT/isContentEditable skip, Esc 예외)
- [ ] **B5** Provider root 1회 등록
  ```bash
  grep -rn "<KeyboardShortcutsProvider" apps/frontend/app/ | wc -l
  # 기대: 1
  ```
- [ ] **B6** 치트시트 Dialog axe 0 violation — `role="dialog"` + `aria-label`
- [ ] **B7** `Q` 단축키 Phase A drawer toggle에 연결 (detail scope)
- [ ] **B8** i18n 17+ 키 양 로케일
  ```bash
  grep -c '"shortcuts"' apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json
  # 기대: 양쪽 1+ (namespace 존재)
  ```

### Phase C — U-05 Undo Toast

- [ ] **C1** `undoWindowMs` 옵션 + AbortController 구현
  ```bash
  grep -n "undoWindowMs\|AbortController" apps/frontend/hooks/use-optimistic-mutation.tsx
  # 기대: 2+ hits
  ```
- [ ] **C2** **setQueryData 추가 0건** (절대 금지, M7과 중복 강조)
  ```bash
  grep -c "setQueryData" apps/frontend/hooks/use-optimistic-mutation.tsx
  # 기대: 0 (기존 0 유지)
  ```
- [ ] **C3** Undo 토스트 `role="status"` + `aria-live="polite"` + Esc dismiss
- [ ] **C4** revoke-approval SSOT wiring
  ```bash
  grep -rn "API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL" apps/frontend/
  # 기대: 1+ hit (lib/api 또는 hooks 내)
  grep -rn "'/checkouts/\|/api/checkouts/" apps/frontend/hooks/use-undo-toast.ts apps/frontend/lib/api/checkout-revoke-approval.ts 2>/dev/null
  # 기대: 0 hit (raw URL 0)
  ```
- [ ] **C5** cache rollback = `invalidateQueries`만 (abort 경로 또는 onUndo)
- [ ] **C6** approve 계열 mutation `undoWindowMs: 5000` 옵션 적용 확인
  ```bash
  grep -n "undoWindowMs: 5000" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
  # 기대: 3+ hits (approveMutation / borrowerApproveMutation / approveReturnMutation)
  ```
- [ ] **C7** i18n `undo.toast.*` 6+ 키 양 로케일

### Phase D — U-04 Inline Reject Presets

- [ ] **D1** `use-rejection-presets.ts` + `staleTime: CACHE_TIMES.DAY` + `queryKeys.checkouts.resource.rejectionPresets()`
  ```bash
  grep -n "queryKeys.checkouts.resource.rejectionPresets\|CACHE_TIMES.DAY" apps/frontend/hooks/use-rejection-presets.ts
  # 기대: 2+ hits
  ```
- [ ] **D2** `RejectReasonPresets.tsx` + `CheckoutRejectInline.tsx` 신규 생성
- [ ] **D3** preset 하드코딩 0 (backend 응답 기반)
  ```bash
  grep -rn "일정 부적합\|기기 점검 중\|서류 미비\|중복 신청" apps/frontend/components apps/frontend/hooks apps/frontend/lib
  # 기대: 0 hit
  ```
- [ ] **D4** preset chip 클릭 → textarea 주입 + 추가 편집 가능
- [ ] **D5** Esc 취소 + Ctrl+Enter 제출 구현
- [ ] **D6** `queryKeys.checkouts.resource.rejectionPresets` 신설
  ```bash
  grep -n "rejectionPresets" apps/frontend/lib/api/query-config.ts
  # 기대: 1+ hit
  ```
- [ ] **D7** expand 시 `aria-expanded` + `aria-controls` — axe
- [ ] **D8** REJECTION_PRESETS API_ENDPOINTS SSOT 사용
  ```bash
  grep -n "API_ENDPOINTS.CHECKOUTS.REJECTION_PRESETS" apps/frontend/hooks/use-rejection-presets.ts
  # 기대: 1 hit
  ```
- [ ] **D9** i18n `reject.inline.*` 8+ 키 양 로케일

### Phase E — U-08 Destination Combobox

- [ ] **E1** `CheckoutDestinationCombobox.tsx` 신규 생성
- [ ] **E2** `use-recent-destinations.ts` + `staleTime: CACHE_TIMES.DAY`
- [ ] **E3** DESTINATIONS_RECENT SSOT wiring
  ```bash
  grep -rn "API_ENDPOINTS.CHECKOUTS.DESTINATIONS_RECENT" apps/frontend/
  # 기대: 1+ hit
  grep -rn "destinations/recent" apps/frontend/lib apps/frontend/hooks
  # 기대: 0 hit (raw URL 0)
  ```
- [ ] **E4** shadcn `Command` combobox — 키보드 navigation (↑↓ Enter Esc)
- [ ] **E5** IME 가드 onKeyDown `e.nativeEvent.isComposing`
  ```bash
  grep -n "nativeEvent.isComposing" apps/frontend/components/checkouts/CheckoutDestinationCombobox.tsx
  # 기대: 1+ hit
  ```
- [ ] **E6** 빈 결과 시 "+ 새 목적지 추가" 옵션
- [ ] **E7** Fuzzy match — NFD normalization + lowercase (한글/영어 accent-insensitive)
- [ ] **E8** `queryKeys.checkouts.resource.destinationsRecent` 신설
  ```bash
  grep -n "destinationsRecent" apps/frontend/lib/api/query-config.ts
  # 기대: 1+ hit
  ```
- [ ] **E9** combobox `aria-expanded` + `aria-activedescendant` — axe
- [ ] **E10** i18n `destination.*` 7+ 키 양 로케일

### Phase F — U-03 Saved Views

- [ ] **F1** `saved-views.ts` SSOT + SSR safe
  ```bash
  grep -n "MAX_VIEWS\|QuotaExceededError\|typeof window === 'undefined'" apps/frontend/lib/checkouts/saved-views.ts
  # 기대: 3+ hits
  ```
- [ ] **F2** `FilterStickyBar.tsx` — `sticky top-[var(--sticky-header-height)]` 재사용 (하드코딩 px 0)
  ```bash
  grep -n "var(--sticky-header-height)" apps/frontend/components/checkouts/FilterStickyBar.tsx
  # 기대: 1+ hit
  grep -nE "top-\[[0-9]+px\]" apps/frontend/components/checkouts/FilterStickyBar.tsx
  # 기대: 0 hit
  ```
- [ ] **F3** 시스템 뷰 3종 카운트 = backend 응답 기반 (frontend 하드코딩 0)
- [ ] **F4** `queryKeys.checkouts.view.savedViewCounts` + CHECKOUT_SUMMARY preset
  ```bash
  grep -n "savedViewCounts" apps/frontend/lib/api/query-config.ts
  # 기대: 1+ hit
  ```
- [ ] **F5** 시스템 뷰 chip 클릭 → URL 쿼리 파라미터 변경 (localStorage write 0)
- [ ] **F6** 커스텀 뷰 max 5개 하드 제한 + 초과 시 toast
  ```bash
  grep -n "MAX_VIEWS" apps/frontend/lib/checkouts/saved-views.ts apps/frontend/hooks/use-saved-views.ts
  # 기대: 2+ hits
  ```
- [ ] **F7** `API_ENDPOINTS.CHECKOUTS.SAVED_VIEW_COUNTS` SSOT 등록
  ```bash
  grep -n "SAVED_VIEW_COUNTS" packages/shared-constants/src/api-endpoints.ts
  # 기대: 1+ hit
  ```
- [ ] **F8** backend `extractUserId(req)` + `@RequirePermissions(Permission.VIEW_CHECKOUTS)`
  ```bash
  grep -A5 "@Get('saved-view-counts')" apps/backend/src/modules/checkouts/checkouts.controller.ts
  # 기대: Permission.VIEW_CHECKOUTS + extractUserId(req) 포함
  ```
- [ ] **F9** `--sticky-header-height` 기존 CSS var 재사용 (신규 정의 0)
  ```bash
  grep -rn "^\s*--sticky-header-height:" apps/frontend/app/globals.css
  # 기대: 1 hit (기존), 추가 0
  ```
- [ ] **F10** drag reorder + 키보드(↑↓) 순서 변경 구현
- [ ] **F11** 저장 Dialog `role="dialog"` + focus trap — axe
- [ ] **F12** i18n `savedViews.*` 18+ 키 양 로케일

---

## SHOULD (record + follow-up)

- [ ] **S1** `/settings/shortcuts` 커스터마이즈 화면 → tech-debt `shortcuts-settings-page`
- [ ] **S2** revoke-approval 5분 보상 경로 UI → `revoke-window-extended-toast`
- [ ] **S3** bulk action에 undo → `bulk-undo-toast`
- [ ] **S4** reject preset Admin CRUD UI → `reject-preset-admin-ui`
- [ ] **S5** fuse.js vs 자체 fuzzy 번들 비교 → `fuzzy-search-lib-decision`
- [ ] **S6** destination inline 등록 폼 → `destination-inline-create`
- [ ] **S7** Saved Views 팀 공유 → `saved-views-team-share`
- [ ] **S8** QR drawer dynamic import → `qr-drawer-code-split`
- [ ] **S9** 드래그 정렬 Storybook entry → `saved-views-dnd-storybook`

---

## Non-Goals

- Phase F의 saved-view-counts 외 backend 변경 0
- bulk action에 undo 적용 (별도 sprint)
- `/settings/shortcuts` 커스터마이즈 페이지 (SHOULD만)
- Saved Views 팀 공유 / 서버 저장 (SHOULD만)
- Preset 텍스트 DB seed 확정 (사용자 원문 필요)
- equipment/calibration 등 타 도메인 단축키

---

## Iteration Tracking

| Iter | Date | Verdict | FAIL items | Notes |
|------|------|---------|------------|-------|
| 1 | (pending) | — | — | initial generator run |
