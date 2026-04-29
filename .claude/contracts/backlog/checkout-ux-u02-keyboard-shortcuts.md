---
slug: checkout-ux-u02-keyboard-shortcuts
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-02
---

# Contract: Sprint 4.5 · U-02 — 전역 단축키 + `?` 치트시트 모달

## Context

V2 §8 U-02: 파워유저(승인자/관리자)의 키보드 조작 속도 향상. 단축키 system을 **앱 전역**으로 도입.

- **목록**: `J`/`K` 행 상/하, `Enter` 상세 진입, `/` 검색 포커스, `F` 필터 sidebar 토글, `G G` 맨 위, `G E` 끝.
- **상세**: `Y` 승인, `N` 반려, `Q` QR drawer, `Esc` 뒤로.
- **전역**: `?` 치트시트 모달 (shadcn `Dialog`).
- **주의**: IME(한국어 입력)/입력 포커스(input, textarea, contenteditable) 내에서는 단축키 **비활성**. `prefers-reduced-motion` 환경에서도 동작.
- **커스터마이즈**: 설정 화면 `/settings/shortcuts` (후속 백로그).

---

## Scope

### 신규 생성
- `apps/frontend/hooks/use-keyboard-shortcuts.ts` — 전역 + scope 기반 단축키 훅.
  - Props: `{ scope: 'list' | 'detail' | 'global'; handlers: Record<string, (e: KeyboardEvent) => void> }`
  - 내부: `document.addEventListener('keydown', ...)` + cleanup.
  - IME 가드: `e.isComposing === true` skip.
  - 입력 포커스 가드: `document.activeElement.tagName in ['INPUT', 'TEXTAREA', 'SELECT'] || .isContentEditable` skip (단, `/` 검색 포커스 명령은 예외).
  - 조합키: `G G`, `G E` 처리 — 200ms timeout 내 두 번째 키 수신.
  - `prefers-reduced-motion` 영향 없음 (motion 무관).
- `apps/frontend/components/shared/KeyboardShortcutsProvider.tsx` — Context + scope 스택 관리.
  - 현재 활성 scope를 Provider로 주입, 하위 컴포넌트는 `useKeyboardShortcutsScope('detail')`로 scope 등록.
- `apps/frontend/components/shared/KeyboardShortcutsCheatsheet.tsx` — 치트시트 모달.
  - shadcn `Dialog` + role별 grouping (requester / approver / admin).
  - `?` 키로 토글. 모달 내부에서 다시 `?` 또는 `Esc`로 닫기.
  - 키 바인딩은 `KEYBOARD_SHORTCUTS` 상수에서 렌더 (SSOT).
- `apps/frontend/lib/constants/keyboard-shortcuts.ts` — SSOT 단축키 정의.
  - `KEYBOARD_SHORTCUTS: Record<Scope, Array<{ key: string; labelKey: string; actionKey: string }>>`
  - `satisfies Record<'list'|'detail'|'global', Shortcut[]>` 강제.

### 수정 대상
- `apps/frontend/app/layout.tsx` (또는 root provider 등록 지점) — `<KeyboardShortcutsProvider>` 최상위 래핑.
- `apps/frontend/app/(dashboard)/checkouts/page.tsx` (list scope) — `useKeyboardShortcutsScope('list')` 등록.
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — `useKeyboardShortcutsScope('detail')` + `Y`/`N`/`Q`/`Esc` 핸들러.
- i18n `ko.json`/`en.json` — 치트시트 항목 라벨 (`shortcuts.list.j` = "다음 행 / Next row" 등), 치트시트 모달 타이틀.

### 수정 금지
- 다른 페이지(equipment/calibration 등) 단축키 — 본 contract는 checkouts scope만. 전역 `?` 치트시트는 범용.
- 기본 브라우저 단축키 (`Ctrl+F` 등) — override 금지.

---

## 참조 구현

```typescript
// apps/frontend/hooks/use-keyboard-shortcuts.ts
'use client';

import { useEffect, useRef } from 'react';

interface Options {
  scope: 'list' | 'detail' | 'global';
  handlers: Record<string, (e: KeyboardEvent) => void>;
  enabled?: boolean;
}

export function useKeyboardShortcuts({ scope, handlers, enabled = true }: Options) {
  const comboRef = useRef<string | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // IME 가드
      if (e.isComposing) return;
      // 입력 포커스 가드 (단, '/' 검색 포커스는 예외)
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable);
      if (isEditable && e.key !== 'Escape') return;

      // 조합키 (G → G, G → E) 처리
      if (comboRef.current === 'g') {
        const comboKey = `g${e.key.toLowerCase()}`;
        if (handlers[comboKey]) {
          e.preventDefault();
          handlers[comboKey](e);
        }
        comboRef.current = null;
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        return;
      }
      if (e.key.toLowerCase() === 'g' && handlers['gg']) {
        comboRef.current = 'g';
        comboTimeoutRef.current = window.setTimeout(() => { comboRef.current = null; }, 200);
        return;
      }

      // 단일 키
      const key = e.shiftKey ? `shift+${e.key.toLowerCase()}` : e.key.toLowerCase();
      if (handlers[key]) {
        e.preventDefault();
        handlers[key](e);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
```

```typescript
// apps/frontend/lib/constants/keyboard-shortcuts.ts
export const KEYBOARD_SHORTCUTS = {
  list: [
    { key: 'j', labelKey: 'shortcuts.list.j', actionKey: 'next-row' },
    { key: 'k', labelKey: 'shortcuts.list.k', actionKey: 'prev-row' },
    { key: 'enter', labelKey: 'shortcuts.list.enter', actionKey: 'open-detail' },
    { key: '/', labelKey: 'shortcuts.list.slash', actionKey: 'focus-search' },
    { key: 'f', labelKey: 'shortcuts.list.f', actionKey: 'toggle-filter' },
    { key: 'gg', labelKey: 'shortcuts.list.gg', actionKey: 'go-top' },
    { key: 'ge', labelKey: 'shortcuts.list.ge', actionKey: 'go-end' },
    { key: 'a', labelKey: 'shortcuts.list.a', actionKey: 'select-all-group' },
    { key: 'shift+a', labelKey: 'shortcuts.list.shift-a', actionKey: 'deselect-all' },
  ],
  detail: [
    { key: 'y', labelKey: 'shortcuts.detail.y', actionKey: 'approve' },
    { key: 'n', labelKey: 'shortcuts.detail.n', actionKey: 'reject' },
    { key: 'q', labelKey: 'shortcuts.detail.q', actionKey: 'qr-drawer' },
    { key: 'escape', labelKey: 'shortcuts.detail.esc', actionKey: 'back-to-list' },
  ],
  global: [
    { key: '?', labelKey: 'shortcuts.global.question', actionKey: 'open-cheatsheet' },
  ],
} as const satisfies Record<'list' | 'detail' | 'global', readonly Shortcut[]>;
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `use-keyboard-shortcuts.ts` 훅이 `scope`/`handlers` 인터페이스 제공 + IME 가드(`e.isComposing`) 포함 | grep |
| M3 | 입력 포커스 상태에서 단축키 무시 — 테스트: `<input>` 포커스 후 `J` → 아무 일도 일어나지 않음 | Playwright |
| M4 | `G G`/`G E` 조합키 200ms timeout 내 완성되어야 함 | Playwright + mock timer |
| M5 | `?` 키로 치트시트 Dialog 오픈 + 동일 키 또는 `Esc`로 닫힘 | E2E |
| M6 | 치트시트 Dialog의 role="dialog" + aria-label + Focus trap | axe |
| M7 | `KEYBOARD_SHORTCUTS` 상수가 `satisfies Record<Scope, ...>` 강제 | grep |
| M8 | 단축키 라벨은 i18n 경유 (하드코딩 0) | grep |
| M9 | Scope 기반 동작: list scope 활성 상태에서 `Y`/`N`(detail 전용)은 동작 안 함 | E2E |
| M10 | `prefers-reduced-motion` 환경: 모달 열림 애니메이션 생략, 핵심 동작은 정상 | manual |
| M11 | E2E: list scope 단축키 9종 + detail scope 단축키 4종 + global `?` 1종 모두 동작 | Playwright matrix |
| M12 | 단축키 우선순위: `Escape`는 모달/drawer 우선 처리 (open된 레이어부터 닫음) | E2E |
| M13 | `KeyboardShortcutsProvider`가 root layout에 1회만 등록 (중복 provider 0) | grep |
| M14 | i18n 14+ 키 (9 list + 4 detail + 1 global + cheatsheet 타이틀/description) 양 로케일 | `jq` |
| M15 | a11y: `tabindex`/`aria-*` 위반 0 (axe-core) | axe |
| M16 | 변경 파일 수 ≤ **8** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `/settings/shortcuts` 커스터마이즈 화면 (후속) | `shortcuts-settings-page` |
| S2 | 단축키 충돌 감지 (동일 키 여러 scope 등록 시 dev warn) | `shortcut-conflict-detector` |
| S3 | 모바일(터치 전용 디바이스)에서는 단축키 UI 자동 숨김 + 치트시트 버튼도 숨김 | `shortcut-mobile-suppress` |
| S4 | Platform별 키(Mac `Cmd` vs Windows `Ctrl`) 자동 매핑 | `shortcut-platform-mod-key` |
| S5 | 치트시트 role별 필터 (admin만 보이는 단축키 등) | `cheatsheet-role-filter` |
| S6 | 단축키 사용 분석 (어떤 키가 자주 쓰이는지) — FE analytics | `shortcut-usage-analytics` |

---

## Verification Commands

```bash
# 1. 빌드
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/hooks/use-keyboard-shortcuts.ts \
  apps/frontend/components/shared/KeyboardShortcutsProvider.tsx \
  apps/frontend/components/shared/KeyboardShortcutsCheatsheet.tsx

# 2. 신규 파일
test -f apps/frontend/hooks/use-keyboard-shortcuts.ts && echo "hook OK"
test -f apps/frontend/lib/constants/keyboard-shortcuts.ts && echo "constants OK"

# 3. IME 가드
grep -n "isComposing" apps/frontend/hooks/use-keyboard-shortcuts.ts
# 기대: 1+ hit

# 4. i18n
jq '.shortcuts' apps/frontend/messages/ko.json apps/frontend/messages/en.json
# 기대: 14+ 키

# 5. satisfies 강제
grep -n "satisfies Record<'list' | 'detail' | 'global'" apps/frontend/lib/constants/keyboard-shortcuts.ts
# 기대: 1 hit

# 6. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 8

# 7. E2E
pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u02-keyboard
```

---

## Acceptance

루프 완료 조건 = MUST 16개 모두 PASS + 단축키 matrix E2E 통과 + axe 0 violation.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록.

---

## 연계 contracts

- Sprint 4.5 U-01 · `checkout-ux-u01-bulk-approval.md` — `A`/`Shift+A` 핸들러 제공.
- Sprint 4.5 U-06 · `checkout-ux-u06-qr-drawer.md` — `Q` 단축키로 QR drawer 토글.
- Sprint 4.5 U-03 · `checkout-ux-u03-filter-sticky-saved-views.md` — `F` 단축키로 필터 sidebar 토글.
- MEMORY.md `feedback_senior_architectural_planning` — 보안/a11y를 후속 고려 금지 → 본 contract에서 IME·role·focus 모두 Phase별로 명시.
