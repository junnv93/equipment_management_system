---
slug: checkout-ux-u06-qr-drawer
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-06
---

# Contract: Sprint 4.5 · U-06 — QR 한 번에 꺼내기 drawer (페이지 전환 없음)

## Context

V2 §8 U-06: QR 발급을 위해 별도 페이지 전환 강제되고 있음. 상세 내 drawer로 통합.

- **기존 자산**: `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` 재활용. QR 생성 로직 변경 없음.
- **단축키**: `Q` (또는 `Alt+Q`) — U-02 keyboard shortcuts provider 경유.
- **모바일**: bottom-sheet (shadcn `Sheet` `side="bottom"`).
- **제약** (MEMORY.md `feedback_qr_is_path_not_workflow`): **QR 전용 새 워크플로우·API·폼 금지**. 기존 handover 서비스로만 연결.

---

## Scope

### 신규 생성
- `apps/frontend/components/checkouts/QrDrawerTrigger.tsx` — 상세 페이지 우상단 고정 트리거 버튼.
- `apps/frontend/components/checkouts/QrDrawer.tsx` — 오른쪽 side drawer (모바일은 bottom-sheet). 내부에 `<HandoverQRDisplay />` 재렌더.

### 수정 대상
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — `<QrDrawerTrigger>` 배치 + drawer state 관리. 기존 QR 페이지 navigation 제거.
- `apps/frontend/app/(dashboard)/checkouts/[id]/qr/page.tsx` (있다면) — **유지** (URL 접근은 지속 허용), 단 drawer가 primary path.
- `apps/frontend/hooks/use-keyboard-shortcuts.ts` (U-02) — `Q` 핸들러 등록.
- `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` — **수정 최소**. `variant` prop이 있으면 inline vs drawer.
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `QR_DRAWER_TOKENS`(trigger, drawer container, closeBtn) 추가.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.qrDrawer.trigger` ("QR 발급")
    - `checkouts.qrDrawer.title`
    - `checkouts.qrDrawer.close`
    - `checkouts.qrDrawer.aria.open` / `close`

### 수정 금지
- QR 생성 백엔드 로직 (기존 handover 서비스).
- QR 데이터 포맷.
- 새로운 handover API 엔드포인트 추가 금지.

---

## 참조 구현

```tsx
// QrDrawerTrigger.tsx
'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HandoverQRDisplay } from '@/components/checkouts/HandoverQRDisplay';
import { useKeyboardShortcutsScope } from '@/hooks/use-keyboard-shortcuts';
import { useTranslations } from 'next-intl';

export function QrDrawerTrigger({ checkoutId }: { checkoutId: string }) {
  const t = useTranslations('checkouts.qrDrawer');
  const [open, setOpen] = useState(false);

  useKeyboardShortcutsScope('detail', {
    q: () => setOpen(prev => !prev),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label={t('aria.open')} className={QR_DRAWER_TOKENS.trigger}>
          <QrCode className="h-4 w-4" aria-hidden="true" />
          {t('trigger')}
        </button>
      </SheetTrigger>
      <SheetContent
        side={typeof window !== 'undefined' && window.innerWidth < 640 ? 'bottom' : 'right'}
        className={QR_DRAWER_TOKENS.drawer}
      >
        <HandoverQRDisplay checkoutId={checkoutId} variant="drawer" />
      </SheetContent>
    </Sheet>
  );
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `QrDrawerTrigger.tsx` + `QrDrawer.tsx` 신규 파일 존재 (또는 통합 1 파일) | grep |
| M3 | **QR 전용 새 API 엔드포인트 추가 0건** (MEMORY.md `feedback_qr_is_path_not_workflow` 준수) | `git diff --stat apps/backend/src/modules/checkouts/ \| grep -i qr` = 0 변경 |
| M4 | `HandoverQRDisplay` 재활용 (중복 구현 0) | grep |
| M5 | 상세 페이지 진입 시 QR 버튼 렌더 | E2E |
| M6 | `Q` 단축키로 drawer 토글 (U-02 scope 활용) | keyboard E2E |
| M7 | 모바일 (<640px) 감지 시 bottom-sheet, 데스크톱은 right-side | responsive E2E |
| M8 | drawer `role="dialog"` + `aria-label` + focus trap + Esc close | axe |
| M9 | drawer 닫기 후 원래 focus로 복귀 (`aria-controls` 대응) | keyboard E2E |
| M10 | i18n 5+ 키 양 로케일 | `jq` |
| M11 | drawer open/close 애니메이션 220ms (Sprint 5.5 motion 예산 준수) + `prefers-reduced-motion` 무시 | CSS |
| M12 | 기존 QR 페이지 URL (`/checkouts/:id/qr`) **유지** (라우팅 제거 금지, drawer는 보조) | grep route file |
| M13 | drawer 내부에서 QR 새로고침/재발급 가능 (기존 로직 재활용) | E2E |
| M14 | 변경 파일 수 ≤ **7** | `git diff --name-only` |
| M15 | QR drawer 열린 상태에서 다른 단축키 (`Y`/`N`) 비활성 (drawer 우선 scope) | E2E |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | drawer에서 다운로드(PNG) 버튼 + 인쇄 단축키(`Ctrl+P`) | `qr-drawer-download-print` |
| S2 | `Alt+Q` alternative 단축키 (일부 키보드 레이아웃 호환) | `qr-alt-shortcut` |
| S3 | 목록에서도 overflow menu로 QR drawer 호출 가능 (Sprint 4.1 연계) | `qr-drawer-list-access` |
| S4 | QR 미리보기 zoom (screen 큰 viewing) | `qr-zoom-preview` |
| S5 | Drawer state URL hash (`#qr`) — 공유 가능 | `qr-drawer-hash-state` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/components/checkouts/QrDrawerTrigger.tsx

test -f apps/frontend/components/checkouts/QrDrawerTrigger.tsx && echo "trigger OK"

git diff --stat apps/backend/src/modules/checkouts/ | grep -i qr
# 기대: 0 변경

grep -rn "<HandoverQRDisplay" apps/frontend/
# 기대: drawer 내부 + 기존 페이지 유지

jq '.checkouts.qrDrawer' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 7

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u06-qr-drawer
```

---

## Acceptance

MUST 15개 PASS + mobile/desktop 반응형 E2E + axe 0 violation + 새 API 0개 확인.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-02 · `checkout-ux-u02-keyboard-shortcuts.md` — `Q` 단축키 등록.
- Sprint 4.1 · `checkout-next-step-panel-unified.md` — compact variant overflow menu에 QR 항목 추가(SHOULD).
- MEMORY.md `feedback_qr_is_path_not_workflow` — 전용 워크플로/API 금지.
- Sprint 5.5 motion 예산 — drawer 220ms + `prefers-reduced-motion`.
