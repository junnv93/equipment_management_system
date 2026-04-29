---
slug: checkout-i18n-tab-badge-tokens
type: contract
date: 2026-04-24
depends: []
sprint: 2
sprint_step: 2.3, 2.4
---

# Contract: Sprint 2.3·2.4 — 하드코딩 한글 i18n 키 등록 + tab badge alert variant 신설

## Context

V2 리뷰 L-3(P1) + L-4(P1) 실측:

1. **L-3**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` L356-370
   ```tsx
   const renderEmptyState = () => {
     // overdue 필터 + summary.overdue === 0 → celebration variant (기한 초과 없음 축하)
     if (statusFilter === CSVal.OVERDUE && (summary?.overdue ?? 0) === 0) {
       return (
         <EmptyState
           variant="celebration"
           icon={...}
           title="기한 초과 없음"           // ← 하드코딩 한글
           description="현재 기한이 초과된 반출 건이 없습니다."  // ← 하드코딩
         />
       );
     }
     ...
   };
   ```
   다른 empty variant는 모두 `t('emptyState.*.title')` 경유인데 celebration만 예외. MEMORY.md `feedback_no_fabricate_domain_data` 위반 + i18n 일관성 위반.

2. **L-4**: `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx` L283
   ```tsx
   <span
     className={`ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 ${MICRO_TYPO.badge} font-medium text-destructive-foreground`}
   >
     {pendingChecksCount}
   </span>
   ```
   `CHECKOUT_TAB_BADGE_TOKENS`(`checkout.ts` L983-987)에 `active`/`inactive` variant만 있고 `alert` variant 결측 → 원-오프 raw class로 직접 작성. pending 건수 알림용 "red 계열 alert" 스타일이 토큰에 없음.

---

## Scope

### 수정 대상
- `apps/frontend/messages/ko/checkouts.json`
  - `emptyState` 섹션(L636 시작)에 `overdueClear` 키 추가:
    ```json
    "overdueClear": {
      "title": "기한 초과 없음",
      "description": "현재 기한이 초과된 반출 건이 없습니다."
    }
    ```
- `apps/frontend/messages/en/checkouts.json`
  - 동일 위치에 영문 번역 추가:
    ```json
    "overdueClear": {
      "title": "No overdue items",
      "description": "There are no checkouts past their due date."
    }
    ```
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - L364·L365 raw 한글 제거 → `t('emptyState.overdueClear.title')` / `t('emptyState.overdueClear.description')`
  - 이미 존재하는 `t()` namespace prefix 따름 (다른 EmptyState 호출부와 동일 패턴)
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - L983-987 `CHECKOUT_TAB_BADGE_TOKENS`에 `alert` variant 추가:
    ```typescript
    export const CHECKOUT_TAB_BADGE_TOKENS = {
      base: `ml-1 px-1.5 py-0.5 rounded-full ${MICRO_TYPO.badge} font-semibold leading-none tabular-nums`,
      active: 'bg-primary/15 text-primary',
      inactive: 'bg-muted text-muted-foreground',
      alert: 'bg-destructive text-destructive-foreground',  // NEW — pending count 등 긴급 알림
    } as const;
    ```
    단, `base`가 `ml-1`이고 L283은 `ml-1.5` → `alert` variant가 `ml-1.5` override를 별도 문자열로 처리하거나, L283 쪽에서 `cn(CHECKOUT_TAB_BADGE_TOKENS.base, CHECKOUT_TAB_BADGE_TOKENS.alert, 'ml-1.5')` 같이 병합. 후자 권장(토큰은 공통 값만).
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
  - L283 raw className → `cn(CHECKOUT_TAB_BADGE_TOKENS.base, CHECKOUT_TAB_BADGE_TOKENS.alert, 'ml-1.5 inline-flex items-center justify-center rounded-full')` 조합. 단 rounded/inline-flex/items-center도 `base`에 포함시키는 게 더 깔끔 → 리팩토링 시 `base`에 흡수 권장.

### 수정 금지
- 다른 `EmptyState` 호출부 (이미 t() 경유). 다른 empty variant key.
- `CHECKOUT_TAB_BADGE_TOKENS.active`/`inactive` 기존 값.
- 다른 tab의 배지 로직.

### 신규 생성
- (없음 — 기존 토큰/i18n 확장만)

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint <수정 파일들>` error 0 | lint |
| M3 | `apps/frontend/messages/ko/checkouts.json`에 `emptyState.overdueClear.title` + `.description` 존재 | `node -e "const j = require('./apps/frontend/messages/ko/checkouts.json'); console.log(j.emptyState.overdueClear)"` 유효한 객체 반환 |
| M4 | `apps/frontend/messages/en/checkouts.json`에 동일 키 존재 | `node -e` 검증 |
| M5 | `OutboundCheckoutsTab.tsx`에서 한글 리터럴 `"기한 초과 없음"` + `"현재 기한이 초과된 반출 건이 없습니다."` 0건 | `grep -c "기한 초과 없음" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'` = 0 |
| M6 | `OutboundCheckoutsTab.tsx`에서 `t('emptyState.overdueClear.title')` + `t('emptyState.overdueClear.description')` 호출 존재 | `grep -c "emptyState.overdueClear" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'` >= 2 |
| M7 | `checkout.ts` `CHECKOUT_TAB_BADGE_TOKENS`에 `alert` 필드 추가 | `grep -n "alert:" apps/frontend/lib/design-tokens/components/checkout.ts` 내 `CHECKOUT_TAB_BADGE_TOKENS` 블록 |
| M8 | `CHECKOUT_TAB_BADGE_TOKENS`에 `satisfies` 제약 (현재 `as const`만 — 본 contract에서 강화 여부 선택적) | 선택적 추가 (SHOULD) |
| M9 | `CheckoutsContent.tsx` L283 부근 raw `bg-destructive px-1.5 py-0.5` 제거 | `grep -c "bg-destructive px-1.5 py-0.5" 'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx'` = 0 |
| M10 | `CheckoutsContent.tsx`가 `CHECKOUT_TAB_BADGE_TOKENS.alert` (또는 `.base` 조합) 참조 | `grep -c "CHECKOUT_TAB_BADGE_TOKENS" 'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx'` >= 1 |
| M11 | `pendingChecksCount` 숫자 표시는 유지 — 시각 회귀 방지 (색상만 토큰 경유, 숫자 렌더 변경 금지) | 수동 review: `{pendingChecksCount}` 여전히 렌더 |
| M12 | 변경 파일 = ko.json + en.json + OutboundCheckoutsTab.tsx + checkout.ts + CheckoutsContent.tsx = **5개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` = 5 |
| M13 | 기존 i18n keyset 회귀 없음 — 모든 기존 키 유지 | `node -e "require('./apps/frontend/messages/ko/checkouts.json')"` 성공 + 신규 키만 추가 (diff 검토) |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `CHECKOUT_TAB_BADGE_TOKENS`에 `satisfies Record<'base' \| 'active' \| 'inactive' \| 'alert', string>` 또는 interface 제약 | `tab-badge-tokens-satisfies` |
| S2 | `base`에 `ml-1.5`·`inline-flex`·`rounded-full`까지 흡수 — `CheckoutsContent` 호출부가 `base + alert`만으로 렌더 가능하도록 정리 | `tab-badge-base-absorb-layout` |
| S3 | 다른 탭(승인 대기 등)에서 raw badge class 사용 잔존 여부 전수 스캔 | `tab-badge-raw-class-audit` |
| S4 | `overdueClear` 외 다른 celebration variant 후보 발굴 — "기한 초과 건 없음" 이외 상황 (예: "내 차례 전건 완료") 확장 가능성 | `celebration-variant-expansion` |
| S5 | i18n 파일 CI gate에 ko↔en 키 parity 체크 스크립트 (현재 없으면 S로 등록) | `i18n-key-parity-gate` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/lib/design-tokens/components/checkout.ts

# 2. i18n 키 존재 검증
node -e "const ko = require('./apps/frontend/messages/ko/checkouts.json'); console.log(ko.emptyState.overdueClear.title, '|', ko.emptyState.overdueClear.description)"
# 기대: "기한 초과 없음" | "현재 기한이 초과된 반출 건이 없습니다."

node -e "const en = require('./apps/frontend/messages/en/checkouts.json'); console.log(en.emptyState.overdueClear.title, '|', en.emptyState.overdueClear.description)"
# 기대: "No overdue items" | "There are no checkouts past their due date."

# 3. MUST grep
grep -c "기한 초과 없음" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 0

grep -c "emptyState.overdueClear" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 2

grep -c "bg-destructive px-1.5 py-0.5" 'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx'
# 기대: 0

grep -c "CHECKOUT_TAB_BADGE_TOKENS" 'apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx'
# 기대: 1+

grep -n "alert:" apps/frontend/lib/design-tokens/components/checkout.ts | grep -v "//"
# 기대: CHECKOUT_TAB_BADGE_TOKENS 블록 내 1개

# 4. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 5
```

---

## Acceptance

루프 완료 조건 = MUST 13개 모두 PASS. 하드코딩 한글 0건 + tab badge alert 토큰 SSOT 경유.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 2.1·2.2 · `checkout-row-token-consolidation.md` — row 토큰.
- Sprint 2.5·2.6·2.7 · `checkout-rhythm-focus-inbound-tokens.md` — rhythm/focus/inbound.
- Sprint 5.1 · `checkout-empty-state-variant-tones.md` (Sprint 5 contract, 추후 작성) — Empty state variant 3색 분리. 본 contract의 `overdueClear`는 V1 S4의 `celebration` variant와 동일 변수, 5.1에서 iconBg 톤 변경.
