---
slug: checkout-ux-u12-empty-error-recovery
type: contract
date: 2026-04-24
depends: [checkout-ux-u03-filter-sticky-saved-views]
sprint: 4
sprint_step: 4.5.U-12
---

# Contract: Sprint 4.5 · U-12 — Empty / Error의 인간적인 복구 경로

## Context

V2 §8 U-12: "결과 없음" / "오류" 화면이 막다른 골목. 모든 empty state에 최소 1개 행동 제안.

- Sprint 5.1 empty-state variantIconBg 3색 분리와 통합. 본 contract는 **CTA 주입** 중심.
- variant 5종:
  - `noneYet`: 아직 생성된 checkout 없음 → "반출 요청" CTA + "가이드 보기" 링크
  - `noPermission`: 권한 없음 → "관리자에게 요청" CTA + 현재 역할 표시
  - `noFilterResult`: 필터 결과 0건 → active filter chip + "필터 초기화" + "신청하기" dual CTA
  - `error`: 예외 → "다시 시도" + "에러 신고" (Sentry 통합)
  - `network`: 오프라인 → 오프라인 상태 감지 + "재연결 시 자동 복구"
- Focus trap 없이 Esc/Tab 자연 이동.
- i18n 전체 키 ko/en.

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/CheckoutEmptyState.tsx` — variant 5종 확장.
  - Props: `{ variant: 'noneYet' | 'noPermission' | 'noFilterResult' | 'error' | 'network'; currentFilters?: FilterChip[]; onClearFilters?: () => void; onRetry?: () => void; onReport?: (err: Error) => void; currentRole?: UserRole }`
  - variant별 다른 icon + CTA 조합.
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` — network offline 감지(`navigator.onLine` + `online`/`offline` event) 후 variant 선택.
- `apps/frontend/app/(dashboard)/checkouts/error.tsx` (Next.js 16 error boundary) — `<CheckoutEmptyState variant="error" onRetry={reset} onReport={...} />` 렌더.
- `apps/frontend/hooks/use-online-status.ts` (신규) — `navigator.onLine` + event listener.
- **i18n**
  - `ko.json`/`en.json`:
    - `checkouts.empty.noneYet.title` / `description` / `ctaCreate` / `ctaGuide`
    - `checkouts.empty.noPermission.title` / `description` / `ctaContactAdmin` / `currentRoleLabel`
    - `checkouts.empty.noFilterResult.title` / `description` / `ctaClearFilters` / `ctaCreate`
    - `checkouts.empty.error.title` / `description` / `ctaRetry` / `ctaReport`
    - `checkouts.empty.network.title` / `description` / `reconnectedToast`

### 수정 금지
- Empty state 디자인 토큰(`CHECKOUT_EMPTY_STATE_TOKENS`) — Sprint 5.1 소관.
- Sentry 클라이언트 초기화.

### 신규 생성
- `use-online-status.ts`
- (옵션) `ErrorReportDialog.tsx` — "에러 신고" 클릭 시 description 입력 + 자동 stack trace 첨부.

---

## 참조 구현

```tsx
// CheckoutEmptyState.tsx (variant 확장 핵심)
interface CheckoutEmptyStateProps {
  variant: 'noneYet' | 'noPermission' | 'noFilterResult' | 'error' | 'network';
  currentFilters?: FilterChip[];
  onClearFilters?: () => void;
  onRetry?: () => void;
  onReport?: (err: Error) => void;
  currentRole?: UserRole;
  error?: Error;
  className?: string;
}

export function CheckoutEmptyState(props: CheckoutEmptyStateProps) {
  const t = useTranslations(`checkouts.empty.${props.variant}`);
  const variantConfig = EMPTY_STATE_VARIANT_CONFIG[props.variant];

  return (
    <div
      role="status"
      aria-live={props.variant === 'error' ? 'assertive' : 'polite'}
      className={cn(CHECKOUT_EMPTY_STATE_TOKENS.container, variantConfig.iconBg)}
    >
      <variantConfig.Icon className={CHECKOUT_EMPTY_STATE_TOKENS.icon} aria-hidden="true" />
      <h3 className={CHECKOUT_EMPTY_STATE_TOKENS.title}>{t('title')}</h3>
      <p className={CHECKOUT_EMPTY_STATE_TOKENS.description}>{t('description')}</p>
      {renderCtas(props, t)}
      {props.variant === 'noFilterResult' && props.currentFilters && (
        <FilterChipList chips={props.currentFilters} />
      )}
      {props.variant === 'noPermission' && (
        <span className={CHECKOUT_EMPTY_STATE_TOKENS.metaLine}>
          {t('currentRoleLabel', { role: props.currentRole })}
        </span>
      )}
    </div>
  );
}
```

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` + lint 통과 | 빌드 |
| M2 | `CheckoutEmptyState` 5 variant 지원 + 각 CTA 존재 | grep |
| M3 | 각 variant에 **최소 1개 행동 제안 CTA** (막다른 골목 0) | E2E screenshot 5종 |
| M4 | `noFilterResult`: active filter chip 렌더 + "필터 초기화" CTA가 `onClearFilters` 콜백 호출 | E2E |
| M5 | `noPermission`: currentRole 표시 + "관리자에게 요청" CTA (mailto: 또는 알림 연계) | E2E |
| M6 | `error`: "다시 시도" CTA가 `onRetry` 호출 + "에러 신고" CTA가 `onReport(err)` 호출 (Sentry로 전달) | E2E |
| M7 | `network`: `use-online-status` 훅이 오프라인 감지 → variant 자동 전환. 재연결 시 자동 refetch + 토스트 알림 | E2E (Playwright offline mode) |
| M8 | `role="status"` + `aria-live` variant별 분기 (error는 assertive, 나머지 polite) | grep |
| M9 | Focus trap 없음 — Tab/Esc 자연 이동 가능 | keyboard E2E |
| M10 | Next.js 16 `error.tsx` boundary 경로 설정 완료 | grep |
| M11 | i18n 20+ 키 양 로케일 완전 | `jq` |
| M12 | Sentry 연동: `onReport` 시 `Sentry.captureException(err, { extra: { description } })` | grep |
| M13 | 오프라인 → 온라인 복귀 토스트가 i18n `reconnectedToast` 경유 | grep |
| M14 | Sprint 5.1 `CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg` 토큰 소비 (본 contract는 토큰 정의 X, 소비만) | grep |
| M15 | 변경 파일 수 ≤ **10** | `git diff --name-only` |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `noneYet` variant에 "5분 가이드" 동영상 임베드 또는 링크 | `empty-guide-video` |
| S2 | `noPermission`에서 "관리자에게 요청" 클릭 시 `POST /requests/role-upgrade` 워크플로 트리거 | `role-upgrade-request` |
| S3 | Error 상세 모달 (stack trace + 요청 정보 표시, admin role 한정) | `error-detail-modal-admin` |
| S4 | Offline 중 작성한 요청을 localStorage에 queue → online 복귀 시 자동 재시도 | `offline-mutation-queue` |
| S5 | Reconnect 알림을 `use-keyboard-shortcuts`(U-02)와 연계 (`R` = reconnect refetch) | `reconnect-shortcut-r` |
| S6 | Sentry breadcrumb에 filter 상태 + 사용자 role 자동 첨부 | `sentry-breadcrumb-context` |

---

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutEmptyState.tsx \
  apps/frontend/hooks/use-online-status.ts

test -f apps/frontend/hooks/use-online-status.ts && echo "online hook OK"

grep -n "variant === 'noneYet'\|'noPermission'\|'noFilterResult'\|'error'\|'network'" apps/frontend/components/checkouts/CheckoutEmptyState.tsx
# 기대: 5 variant 분기

grep -n "role=\"status\"\|aria-live" apps/frontend/components/checkouts/CheckoutEmptyState.tsx
# 기대: 2+ hit

grep -n "Sentry.captureException\|Sentry\\.captureException" apps/frontend/
# 기대: 1+ hit

jq '.checkouts.empty' apps/frontend/messages/ko.json apps/frontend/messages/en.json

git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 10

pnpm --filter frontend run test:e2e -- checkouts/suite-ux/u12-empty-error
```

---

## Acceptance

MUST 15개 PASS + 5 variant 각각 E2E 시나리오 + offline mode 테스트 + axe 0 violation.
SHOULD 미달 `tech-debt-tracker.md`.

---

## 연계 contracts

- Sprint 4.5 U-03 · `checkout-ux-u03-filter-sticky-saved-views.md` — filter chip 리스트 소비.
- Sprint 4.5 U-11 · `checkout-ux-u11-nav-your-turn-badge.md` — pendingCount 0 시 nav 배지와 일관.
- Sprint 4.3 · `checkout-detail-dday-badge.md` — OverdueBanner와 empty state가 동일 ARIA 패턴.
- Sprint 5.1 · empty state variant 3색 분리 — 토큰 정의 선행.
- MEMORY.md `feedback_senior_architectural_planning` — 보안/a11y "추후 고려" 금지, 본 contract에서 완전 커버.
