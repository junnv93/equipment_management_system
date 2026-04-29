---
slug: checkout-ux-u07-context-restore
type: contract
date: 2026-04-24
depends: []
sprint: 4
sprint_step: 4.5.U-07
---

# Contract: Sprint 4.5 · U-07 — 돌아가기 컨텍스트 보존 (스크롤/필터/페이지/앵커)

## Context

V2 §8 U-07: 상세 → 목록 복귀 시 필터/페이지/스크롤 위치 소실 → 작업 흐름 단절.

- **필터/페이지**: URL 쿼리 파라미터에 이미 저장 (MEMORY.md "URL 파라미터가 유일한 진실의 소스").
- **스크롤**: Next.js App Router 기본은 scroll-top. `scroll={false}` + history.state에 scrollTop 저장 → 복귀 시 `window.scrollTo()`.
- **앵커**: 진입한 row에 `data-checkout-id` + URL hash fragment `#row-{id}` → highlight + scrollIntoView.
- **Next.js 16 proxy 규약** (CLAUDE.md Rule 4) 하에서 검증.

---

## Scope

### 신규 생성
- `apps/frontend/hooks/use-scroll-restore.ts` — history.state 기반 scroll 저장/복원.
  - Props: `{ key: string; enabled?: boolean }`
  - `useLayoutEffect`로 mount 시 restore.
  - popstate / pushstate 시 현재 scrollTop 저장.
- `apps/frontend/lib/utils/checkout-anchor.ts` — `#row-{id}` hash 생성/파싱 유틸.

### 수정 대상
- **Frontend**
  - `apps/frontend/app/(dashboard)/checkouts/page.tsx` (list) — `useScrollRestore` + row `data-checkout-id` 부여 + hash 기반 highlight.
  - `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `<Link scroll={false}>` + row `data-checkout-id` attribute.
  - `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — "목록으로" 버튼: 기존 URL + hash(`#row-{id}`)로 복귀.
  - 이 부분은 이미 `router.back()`을 쓰고 있다면 browser history가 처리하므로 추가 로직 최소.
- **CSS**
  - `apps/frontend/app/globals.css` — `.checkout-row-highlight { animation: row-flash 1.2s ease-out; }` + `@keyframes row-flash` (motion-reduce 시 no-op).

### 수정 금지
- Next.js 16 `proxy.ts`/`proxy` 함수명 규약 (CLAUDE.md Rule 4).
- 서버 로직.

---

## 참조 구현

```typescript
// apps/frontend/hooks/use-scroll-restore.ts
'use client';

import { useEffect, useLayoutEffect } from 'react';

export function useScrollRestore(key: string, enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const stored = window.history.state?.__scrollY__?.[key];
    if (typeof stored === 'number') {
      window.scrollTo({ top: stored, behavior: 'instant' as ScrollBehavior });
    }
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) return;
    function save() {
      const current = window.history.state ?? {};
      window.history.replaceState(
        { ...current, __scrollY__: { ...(current.__scrollY__ ?? {}), [key]: window.scrollY } },
        '',
      );
    }
    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    // 상세 진입 전 저장: Link onClick 또는 router.push 직전
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
      window.removeEventListener('pagehide', save);
    };
  }, [key, enabled]);
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `use-scroll-restore.ts` 신규 파일 존재 + `useLayoutEffect` 기반 | grep |
| M3 | List 페이지에서 `useScrollRestore('checkouts-list')` 사용 | grep |
| M4 | Row `<Link>`에 `scroll={false}` 적용 (Next.js 스크롤 top 방지) | grep |
| M5 | Row DOM에 `data-checkout-id` attribute 부여 | grep |
| M6 | 상세 → 목록 복귀 시 URL에 hash `#row-{id}` 자동 추가 (또는 저장된 prev URL 복원) | E2E |
| M7 | 복귀 후 `#row-{id}` row가 highlight 애니메이션 발동 (1.2s ease-out) | E2E |
| M8 | `prefers-reduced-motion: reduce`에서 highlight 애니메이션 no-op | CSS manual |
| M9 | 필터 + 페이지 상태는 URL 쿼리 그대로 보존 (기존 SSOT) | E2E |
| M10 | Next.js 16 proxy 규약 충돌 없음 (`middleware` 함수명 금지, `proxy` 사용) | grep proxy file |
| M11 | E2E: 3페이지 필터 적용 → 15번째 row 클릭 → 상세 진입 → 뒤로 → 원래 스크롤 위치 + row highlight + 필터 유지 | Playwright |
| M12 | localStorage/sessionStorage 남용 0 — history.state만 사용 (SSOT) | grep |
| M13 | SSR safe (typeof window 체크) | grep |
| M14 | `useScrollRestore` cleanup 확실 (메모리 누수 없음) | 코드 |
| M15 | 변경 파일 수 ≤ **8** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 다른 페이지(equipment list, calibration list)에도 scroll-restore 적용 (범용 패턴) | `scroll-restore-global` |
| S2 | hash가 이미 있는 URL에 진입 시 자동 scrollIntoView + focus row | `anchor-auto-focus` |
| S3 | Safari `pageshow` event 대응 (bfcache) | `bfcache-safari` |
| S4 | highlight 색 design token화 (Sprint 2 tokens 연계) | `row-highlight-token` |
| S5 | 무한 스크롤/가상 스크롤 호환 검증 | `scroll-restore-virtual-list` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint apps/frontend/hooks/use-scroll-restore.ts

grep -n "useScrollRestore" apps/frontend/app/\(dashboard\)/checkouts/

grep -n 'scroll={false}' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1+ hit

grep -n "data-checkout-id" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1+ hit

grep -rn "middleware" apps/frontend/proxy.ts 2>/dev/null
# 기대: 0 hit (Next.js 16 proxy 규약)

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 8

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u07-context
```

---

## Acceptance

MUST 15개 PASS + context restore 전 흐름 E2E 통과 + motion-reduce 수동 검증.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-03 · Saved Views — 필터 상태 복원은 URL 기반이므로 자동 정합.
- Sprint 4.5 U-09 · D-day 색온도 — highlight 색과 dday 색 충돌 방지 검증.
- MEMORY.md "URL 파라미터가 유일한 진실의 소스" — 원칙 준수.
- CLAUDE.md Rule 4 — Next.js 16 proxy 규약.
