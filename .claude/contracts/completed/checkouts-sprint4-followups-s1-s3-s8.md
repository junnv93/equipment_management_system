# Contract — Checkouts Sprint 4 Follow-ups (S-1 / S-3 / S-8)

> Slug: `checkouts-sprint4-followups-s1-s3-s8` · Mode: 1
> 2026-05-10 sprint `checkouts-sprint4-ux-u02-u08` 직접 후속 SHOULD 3건 통합.
> 인프라 재사용 (`useUndoToast` / `KEYBOARD_SHORTCUTS` SSOT / `next/dynamic`) — 새 모듈/DB 변경 0.

---

## Goal

Sprint 4 UX 6건 (commit `c01452f3`) 종결 시 분리된 SHOULD 9건 중 자연스럽게 묶이는 3건을 단일 sprint로 closure:

| Phase | ID | 기능 | 대상 |
|---|---|---|---|
| A | S-3 | bulk-undo-toast | `useCheckoutBulkMutations` + `useApprovalsBulkMutations` `undoWindowMs: 5000` + 후속 toast |
| B | S-1 | shortcuts-settings-page | `/settings/shortcuts` 라우트 + localStorage override SSOT + `useKeyboardShortcuts` `overrides` 옵션 |
| C | S-8 | qr-drawer-code-split | `CheckoutQrDrawerTrigger` `next/dynamic` 분리 (FCP 개선) |

### 핵심 원칙
- **SSOT 준수**: `KEYBOARD_SHORTCUTS` 단축키 정의 SSOT 유지, override는 사용자별 layer 추가만
- **하드코딩 0**: i18n 키 / 라우트 / API 엔드포인트 / 상수 모두 SSOT 경유
- **워크플로 보존**: 5초 지연은 abort 가능, 5초 초과 후엔 일반 mutate 흐름 (revoke 보상 경로 단건 한정)
- **Surgical**: 기존 `useUndoToast` 확장 (별도 hook 신설 X), 기존 `useKeyboardShortcuts` 시그니처에 옵셔널 추가

---

## File Budget (총 ≤ 19)

### S-3 (5 files)
- (수정) `apps/frontend/hooks/use-undo-toast.tsx` — UNDO_TOAST_DURATION_MS 를 `lib/checkouts/undo-constants` 로 이동·재export.
- (신규) `apps/frontend/hooks/use-bulk-undo-toast.tsx` — **architectural deviation from initial plan**: jest 환경에서 `use-undo-toast.tsx` 가 `revokeApproval → api-client → axios (ESM)` 체인을 트리거해 SyntaxError 발생. bulk hook 은 revokeApproval 미호출이므로 axios chain 진입할 이유 없음 → 별도 파일로 분리해 import chain 격리. revokeFn 미호출, abortUndo 만 호출.
- (신규) `apps/frontend/lib/checkouts/undo-constants.ts` — 양쪽 hook 이 공유하는 `UNDO_TOAST_DURATION_MS` SSOT. axios 무의존 lib.
- (수정) `apps/frontend/hooks/use-checkout-bulk-mutations.ts` — `bulkApproveMutation` + `bulkRejectMutation` `undoWindowMs: 5000` + onSuccess 분기에서 fully success일 때만 undo toast (부분 실패 시 destructive toast 우선)
- (수정) `apps/frontend/hooks/use-approvals-bulk-mutations.ts` — 동일 패턴
- (수정) `apps/frontend/messages/ko/checkouts.json` — `undo.toast.bulkApproved/bulkRejected/bulkUndo/bulkUndoSuccess` 추가
- (수정) `apps/frontend/messages/en/checkouts.json` — 동일

### S-1 (10 files)
- (수정) `packages/shared-constants/src/frontend-routes.ts` — `SETTINGS.SHORTCUTS: '/settings/shortcuts'` 추가
- (신규) `apps/frontend/lib/shortcuts/overrides.ts` — localStorage SSOT (`SHORTCUT_OVERRIDES_STORAGE_KEY`, `MAX_OVERRIDE_KEYS`, `loadShortcutOverrides()`, `saveShortcutOverrides()`, `resetShortcutOverrides()`, SSR-safe)
- (신규) `apps/frontend/lib/shortcuts/__tests__/overrides.test.ts` — load/save/reset/clamp/SSR-safe 4+ unit tests
- (수정) `apps/frontend/hooks/use-keyboard-shortcuts.ts` — `overrides?: Partial<Record<ShortcutId, string>>` 옵션 추가, `matchesShortcut(e, id, overrides)` 적용
- (수정) `apps/frontend/components/checkouts/KeyboardShortcutsProvider.tsx` — overrides load (mount 후) + Context로 전달, `useKeyboardShortcuts({...}, 'global', true, overrides)` 적용
- (수정) `apps/frontend/contexts/KeyboardShortcutsContext.tsx` — `overrides`/`setOverride`/`resetOverrides` Context value 확장
- (수정) `apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx` — `KeyBadge`가 override key 우선 표시
- (신규) `apps/frontend/app/(dashboard)/settings/shortcuts/page.tsx` — Server Component wrapper
- (신규) `apps/frontend/app/(dashboard)/settings/shortcuts/ShortcutsSettingsContent.tsx` — Client Component, KEYBOARD_SHORTCUTS 표시 + 변경 input + reset 버튼
- (수정) `apps/frontend/app/(dashboard)/settings/SettingsNavigationClient.tsx` — `nav.shortcuts` 항목 추가 (Keyboard 아이콘)
- (수정) `apps/frontend/messages/ko/settings.json` — `nav.shortcuts` + `shortcuts.{title,description,sectionTitle.list/detail/global,actions.{change,reset,save,cancel,resetAll},help.{ariaCapture,duplicate,empty,allowedKeysHint},aria.*}` namespace 추가
- (수정) `apps/frontend/messages/en/settings.json` — 동일

### S-8 (1 file)
- (수정) `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — `CheckoutQrDrawerTrigger` `next/dynamic` 변환 (`{ ssr: false, loading: () => null }`)

### Tests
- (신규) `apps/frontend/lib/shortcuts/__tests__/overrides.test.ts` (S-1, 위 포함)

> **수정 금지**: backend 코드, drizzle schema, `EquipmentQRCode.tsx`, `useOptimisticMutation` 본체, 다른 도메인 페이지

---

## MUST Criteria (모두 PASS 필수)

### M-1: Build & Type
- `pnpm tsc --noEmit` EXIT 0
- `pnpm --filter frontend run build` EXIT 0 (또는 `next build` smoke)
- `pnpm lint` 변경 파일 0 warning

### M-2: SSOT 준수
- `grep -rn "/settings/shortcuts" apps/frontend/{app,components,hooks,lib} | grep -v "FRONTEND_ROUTES.SETTINGS.SHORTCUTS"` 결과 0건 (라우트 하드코딩 차단)
- `grep -rn "shortcut_overrides_v1\|shortcuts-overrides" apps/frontend | grep -v "lib/shortcuts/overrides"` 결과 0건 (storage key 하드코딩 차단)
- `grep -rn "useUndoToast\|useBulkUndoToast" apps/frontend/{hooks,components,app} --include="*.ts" --include="*.tsx" -l` 결과 ≥ 3 (CheckoutDetailClient + useCheckoutBulkMutations + useApprovalsBulkMutations)

### M-3: undoWindowMs 적용 검증
- `grep -n "undoWindowMs" apps/frontend/hooks/use-checkout-bulk-mutations.ts` ≥ 2 (approve + reject)
- `grep -n "undoWindowMs" apps/frontend/hooks/use-approvals-bulk-mutations.ts` ≥ 2
- 값은 `5000` 또는 SSOT 상수 (`UNDO_TOAST_DURATION_MS`) 참조

### M-4: i18n parity
- `apps/frontend/messages/ko/checkouts.json` 의 `undo.toast.*` 키와 `apps/frontend/messages/en/checkouts.json` 동기. 신규 키 ≥ 4건 (`bulkApproved`, `bulkRejected`, `bulkUndo`, `bulkUndoSuccess`)
- `apps/frontend/messages/ko/settings.json` 의 `shortcuts.*` 키와 `en/settings.json` 동기. 신규 키 ≥ 8건 (`title`, `description`, `actions.change`, `actions.reset`, `actions.save`, `actions.cancel`, `help.empty`, `help.allowedKeysHint`)
- `nav.shortcuts` ko/en 둘 다 존재

### M-5: Code-split 검증
- `grep -n "import.*CheckoutQrDrawerTrigger" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx` 결과는 정적 import 없음 (또는 `next/dynamic` 호출)
- `grep -n "next/dynamic" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx` 결과 ≥ 1
- `dynamic(() => import('@/components/checkouts/CheckoutQrDrawerTrigger')` 패턴 일치
- `ssr: false` 또는 명시적 client-only 표기 (Sheet는 client only)

### M-6: 접근성
- ShortcutsSettingsContent의 변경 input은 `<label htmlFor>` 또는 `aria-label` 보유
- KeyBadge override 표시 시 `aria-label` 변경된 키 반영
- bulk undo toast `<ToastAction>` `altText` (스크린리더용) 보유
- Settings 페이지 sr-only live region (변경 성공 시) 보유 — `aria-live="polite"`

### M-7: SSR Safe
- `loadShortcutOverrides()` typeof window 가드 — SSR에서 호출 시 `{}` 반환
- 페이지 hydration mismatch 0 (override는 mount 후 적용)

### M-8: Test
- `pnpm --filter frontend exec jest lib/shortcuts/__tests__/overrides` EXIT 0 (4+ tests PASS)

---

## SHOULD Criteria (실패 시 tech-debt-tracker 등록)

### S-A: 기존 단위 테스트 회귀 0
- `pnpm --filter frontend exec jest hooks/__tests__/use-optimistic-mutation` EXIT 0 (영향 시)
- `pnpm --filter frontend exec jest components/checkouts/__tests__/CheckoutBulkActionBar` EXIT 0

### S-B: bundle 측정
- `CheckoutDetailClient` 진입 페이지 First Load JS가 dynamic split 적용 후 감소 (또는 동일 — qr lib 의존이 detail에서 제거되어야 함)
- `pnpm --filter frontend run build` 출력에서 `/checkouts/[id]` route size 비교 (정량 측정 권장, MUST 아님)

### S-C: e2e regression smoke
- bulk approve undo 시나리오 spec 또는 수동 검증 노트 추가 (별도 sprint 분리 OK)

### S-D: KeyboardShortcutsCheatsheet override 시각 표시
- override 적용된 단축키는 cheatsheet에 visual marker (예: dot/asterisk) 표시 — 미구현 시 SHOULD-fail

### S-E: 단축키 충돌 검증
- ShortcutsSettingsContent 저장 시 다른 단축키와 동일 키 입력 차단 (UI level validation) + i18n 안내

---

## Verify Commands

```bash
# Build & type
pnpm tsc --noEmit 2>&1 | tail -20
pnpm --filter frontend run build 2>&1 | tail -40

# SSOT
grep -rn "/settings/shortcuts" apps/frontend/{app,components,hooks,lib} 2>/dev/null | grep -v "FRONTEND_ROUTES.SETTINGS.SHORTCUTS"
grep -rn "shortcut_overrides_v1\|shortcuts-overrides" apps/frontend 2>/dev/null | grep -v "lib/shortcuts/overrides"

# undoWindowMs 적용
grep -c "undoWindowMs" apps/frontend/hooks/use-checkout-bulk-mutations.ts
grep -c "undoWindowMs" apps/frontend/hooks/use-approvals-bulk-mutations.ts

# i18n parity
node -e "const ko = require('./apps/frontend/messages/ko/settings.json'); const en = require('./apps/frontend/messages/en/settings.json'); const koKeys = Object.keys(ko.shortcuts || {}); const enKeys = Object.keys(en.shortcuts || {}); console.log('ko shortcuts keys:', koKeys.length, 'en shortcuts keys:', enKeys.length); if (JSON.stringify(koKeys.sort()) !== JSON.stringify(enKeys.sort())) { console.error('MISMATCH'); process.exit(1); }"

# Code-split
grep -n "next/dynamic\|CheckoutQrDrawerTrigger" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'

# Test
pnpm --filter frontend exec jest lib/shortcuts/__tests__/overrides 2>&1 | tail -10
```

---

## Out of Scope (별도 sprint)

- backend bulk-revoke API 신설 (5초 초과 후 보상 경로 — Sprint scope 외)
- 단축키 import/export (json upload) — S-1 admin 후속
- KeyboardShortcutsProvider 의 위치 변경 (현재 `/checkouts` 전용 → 전역 layout 승격) — 별도 architecture 결정 필요
- BulkActionBar 자체 시각 변경
- Approvals 도메인 revokeApproval API 신설
