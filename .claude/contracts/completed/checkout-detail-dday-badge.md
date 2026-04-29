---
slug: checkout-detail-dday-badge
type: contract
date: 2026-04-24
depends: [checkout-row-3zone-grid]
sprint: 4
sprint_step: 4.3
---

# Contract: Sprint 4.3 — 상세 페이지 D-day 배지 + 기한 초과 배너 (C-3 해소)

## Context

V2 §7 / C-3 지적:

1. **목록과 상세 불일치**: 목록 행은 `getDdayClasses` + `formatDday` (예: "D-3", "D+2 기한초과")로 D-day 배지를 보여주는데, **상세 페이지 헤더는 raw expectedReturnDate만 표시** — 사용자가 목록에서 "D+2"를 보고 상세에 들어가면 같은 긴박함 신호가 없음.
2. **기한 초과 강조 부재**: 목록 행은 `bg-brand-critical/5`로 배경 틴트 (V1 S1)하지만 상세는 평범한 카드.
3. **공유 유틸 존재**: `lib/utils/dday.ts` (또는 동등한 경로)에 `getDdayClasses`, `formatDday` 이미 있음 — `CheckoutGroupCard.tsx`가 L495-497에서 사용.

→ 상세 헤더에 `<DdayBadge>` 컴포넌트화 + 상세 컨테이너 상단에 overdue 배너(조건부).

---

## Scope

### 수정 대상
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - 헤더 영역(L851 근처 raw date 렌더 추정)에 `<DdayBadge daysRemaining={calc} />` 추가.
  - `daysRemaining` 계산: `checkout.expectedReturnDate`가 있고 status가 terminal 아닐 때만.
  - overdue 배너: status가 `overdue` 이거나 `daysRemaining < 0`일 때 페이지 상단(Hero 바로 위)에 `<OverdueBanner daysOverdue={Math.abs(daysRemaining)} />` 렌더. 배경 `bg-brand-critical/5` + `border-l-4 border-brand-critical`.
- `apps/frontend/components/checkouts/DdayBadge.tsx` (신규)
  - Props: `{ daysRemaining: number | null; variant?: 'inline' | 'hero' }`
  - 내부: `formatDday(daysRemaining)` + `getDdayClasses(daysRemaining)` 사용 (재활용, 중복 금지).
  - `aria-label`: 수치를 자연어로 ("3일 남음" / "2일 초과").
  - `data-dday-bucket`: 색온도 구간(-7~+∞ 6단계) — Sprint 4.5 U-09 연계.
- `apps/frontend/components/checkouts/OverdueBanner.tsx` (신규)
  - Props: `{ daysOverdue: number; onActionClick?: () => void }`
  - 내부: i18n `overdueBanner.title`/`.description`/`.cta` 텍스트 + "반납 알림 보내기" 또는 "반출 연장 요청" CTA (역할별 분기).
  - `role="alert"` + `aria-live="assertive"` (진입 즉시 스크린리더 안내).
- `apps/frontend/messages/ko.json` + `en.json`
  - `checkouts.detail.dday.aria` (파라미터: days)
  - `checkouts.detail.overdueBanner.title/description/cta`
- `apps/frontend/lib/utils/dday.ts` (또는 실제 경로)
  - 필요 시 `getDdayBucket(daysRemaining): 'safe' | 'info' | 'warn' | 'today' | 'overdue' | 'longOverdue'` export. Sprint 4.5 U-09에서 본격 확장하지만 본 contract에서 interface만.

### 수정 금지
- `getDdayClasses`, `formatDday` 내부 구현 — 재사용만 (Sprint 4.5 U-09에서 6단계 확장).
- `CheckoutGroupCard.tsx` row 구조 — Sprint 4.2 contract 소관.
- 서버 `overdue` 상태 판정 로직 — schema/service.

### 신규 생성
- `apps/frontend/components/checkouts/DdayBadge.tsx`
- `apps/frontend/components/checkouts/OverdueBanner.tsx`

---

## 참조 구현

```tsx
// apps/frontend/components/checkouts/DdayBadge.tsx
'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CHECKOUT_ITEM_ROW_TOKENS } from '@/lib/design-tokens';
import { formatDday, getDdayClasses, getDdayBucket } from '@/lib/utils/dday';

interface DdayBadgeProps {
  daysRemaining: number | null;
  variant?: 'inline' | 'hero';
  className?: string;
}

export function DdayBadge({ daysRemaining, variant = 'inline', className }: DdayBadgeProps) {
  const t = useTranslations('checkouts.detail.dday');
  if (daysRemaining === null) return null;
  const bucket = getDdayBucket(daysRemaining);
  return (
    <span
      aria-label={t('aria', { days: Math.abs(daysRemaining) })}
      data-dday-bucket={bucket}
      className={cn(
        variant === 'hero' ? CHECKOUT_ITEM_ROW_TOKENS.ddayHero : CHECKOUT_ITEM_ROW_TOKENS.dday,
        getDdayClasses(daysRemaining),
        className,
      )}
    >
      {formatDday(daysRemaining)}
    </span>
  );
}
```

```tsx
// apps/frontend/components/checkouts/OverdueBanner.tsx
export function OverdueBanner({ daysOverdue, onActionClick }: OverdueBannerProps) {
  const t = useTranslations('checkouts.detail.overdueBanner');
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(CHECKOUT_OVERDUE_BANNER_TOKENS.container)}
    >
      <div className={CHECKOUT_OVERDUE_BANNER_TOKENS.icon}>
        <AlertTriangle aria-hidden="true" className="h-5 w-5" />
      </div>
      <div>
        <h3 className={CHECKOUT_OVERDUE_BANNER_TOKENS.title}>{t('title', { days: daysOverdue })}</h3>
        <p className={CHECKOUT_OVERDUE_BANNER_TOKENS.description}>{t('description')}</p>
      </div>
      {onActionClick && (
        <button
          type="button"
          className={CHECKOUT_OVERDUE_BANNER_TOKENS.cta}
          onClick={onActionClick}
        >
          {t('cta')}
        </button>
      )}
    </div>
  );
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` 경고 0 (해당 파일 한정) | lint |
| M3 | `DdayBadge.tsx` 신규 파일 존재 + named export `DdayBadge` | grep |
| M4 | `OverdueBanner.tsx` 신규 파일 존재 + named export `OverdueBanner` | grep |
| M5 | `CheckoutDetailClient.tsx`에서 `<DdayBadge ... />` 사용 | `grep -n "<DdayBadge" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'` = 1+ hit |
| M6 | overdue 조건부 렌더: status가 `overdue` 이거나 `daysRemaining < 0`일 때만 `<OverdueBanner />` | 코드 확인 + E2E |
| M7 | `DdayBadge`가 `formatDday` + `getDdayClasses` 재사용 (중복 구현 0) | grep |
| M8 | `DdayBadge.aria-label`이 i18n `checkouts.detail.dday.aria` 경유 (하드코딩 0) | grep |
| M9 | i18n `ko.json`/`en.json` 양쪽에 `checkouts.detail.dday.aria` + `checkouts.detail.overdueBanner.*` 동시 추가 | grep + `jq` |
| M10 | `OverdueBanner`에 `role="alert"` + `aria-live="assertive"` | grep |
| M11 | overdue 배너의 CTA는 역할 기반: requester → "반출 연장 요청", approver/admin → "반납 알림 보내기" (i18n 2 variant) | E2E or 코드 |
| M12 | `daysRemaining === null` 시 `<DdayBadge>`는 null 반환 (렌더 없음) | 코드 + E2E |
| M13 | E2E: overdue 상태 checkout 상세 진입 시 배너가 보이고, 정상 상태는 배너 없음 | Playwright |
| M14 | axe-core: 새 Banner/Badge 구조에서 violation 0 | axe |
| M15 | `CHECKOUT_OVERDUE_BANNER_TOKENS` 토큰 정의 — raw Tailwind class 하드코딩 0 | grep `bg-brand-critical/5\|border-brand-critical` 호출부에서 금지 |
| M16 | Sprint 4.2 Row Zone 2의 Dday 표기와 **동일 컴포넌트** 사용 가능(재활용) — 본 contract 완료 후 `CheckoutGroupCard` row에서도 `<DdayBadge />` 치환 고려 (SHOULD) | grep |
| M17 | 변경 파일 = `DdayBadge.tsx`(신규) + `OverdueBanner.tsx`(신규) + `CheckoutDetailClient.tsx` + `checkout.ts`(토큰) + `dday.ts`(옵션 util) + `ko.json` + `en.json` = **최대 7** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 7 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `CheckoutGroupCard.tsx` Zone 2의 기존 inline D-day span을 `<DdayBadge />`로 치환 — DRY | `row-dday-component-reuse` |
| S2 | `getDdayBucket` 함수를 Sprint 4.5 U-09의 6단계 색온도 gradient 기준과 통합 | `dday-bucket-u09-align` |
| S3 | OverdueBanner CTA 실제 동작(알림 API / 연장 요청 워크플로)은 Sprint 4.5 U-12 / U-05 연계 — 본 contract에서는 onClick 콜백 slot만 | `overdue-banner-cta-wire` |
| S4 | `DdayBadge` Storybook stories 5종 (D-7, D-3, D-0, D+1, D+7) | `dday-badge-storybook` |
| S5 | `aria-label`을 screen reader 검증 (NVDA/VoiceOver) 녹음/텍스트 문서화 | `dday-a11y-manual-audit` |
| S6 | Dark mode 검증 — `bg-brand-critical/5`이 `.dark` 변형에서도 충분한 대비 | `dday-dark-mode-contrast` |

---

## Verification Commands

```bash
# 1. 빌드 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/DdayBadge.tsx \
  apps/frontend/components/checkouts/OverdueBanner.tsx \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'

# 2. 신규 파일
test -f apps/frontend/components/checkouts/DdayBadge.tsx && echo "DdayBadge OK"
test -f apps/frontend/components/checkouts/OverdueBanner.tsx && echo "OverdueBanner OK"

# 3. 사용처
grep -n "<DdayBadge\|<OverdueBanner" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
# 기대: 2+ hit

# 4. a11y 필수 속성
grep -n 'role="alert"\|aria-live="assertive"' apps/frontend/components/checkouts/OverdueBanner.tsx
# 기대: 2 hit

# 5. i18n
jq '.checkouts.detail.dday.aria' apps/frontend/messages/ko.json apps/frontend/messages/en.json
jq '.checkouts.detail.overdueBanner' apps/frontend/messages/ko.json apps/frontend/messages/en.json
# 기대: 양 locale 모두 non-null

# 6. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 7

# 7. E2E + axe
pnpm --filter frontend run test:e2e -- checkouts/suite-ux
```

---

## 위험 / 롤백

- **위험**: `role="alert"` + `aria-live="assertive"`는 스크린리더 즉시 announce — overdue 많은 유저(admin inbox)에서 스팸 우려. M13 E2E에서 "한 페이지 내 alert 1개" 검증.
- **위험**: `bg-brand-critical/5` 틴트가 dark mode에서 contrast 4.5:1 미달 가능성 — S6에서 후속 검증.
- **롤백**: 신규 컴포넌트 2개 + 호출부 1 파일 revert로 완전 복원.

---

## Acceptance

루프 완료 조건 = MUST 17개 모두 PASS + axe violation 0 + E2E overdue 시나리오 통과.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록.

---

## 연계 contracts

- Sprint 4.2 · `checkout-row-3zone-grid.md` — Zone 2 D-day와 컴포넌트 공유. 선행/병행.
- Sprint 4.4 · `checkout-rental-phase-ui.md` — Hero variant NextStepPanel 내부에 `<DdayBadge variant="hero">`가 함께 배치될 수 있음.
- Sprint 4.5 U-09 · `checkout-ux-dday-color-temperature.md` — 본 contract에서 interface만 잡고 6단계 gradient 상세는 U-09.
- Sprint 4.5 U-12 · `checkout-ux-empty-error-recovery.md` — OverdueBanner CTA가 알림/연장 워크플로 연결.
- MEMORY.md `feedback_no_fabricate_domain_data` — i18n 텍스트 작성 시 사용자 원문 확인 필요 (추정 금지).
