'use client';

import * as React from 'react';
import Link, { useLinkStatus, type LinkProps } from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useNavigationPendingBegin } from '@/hooks/use-navigation-pending';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import {
  PendingIndicator,
  getPendingOpacityClass,
  type PendingIndicatorVariant,
} from './pending-indicator';

export type NavLinkVariant = 'sidebar' | 'mobile' | 'breadcrumb' | 'card';

const VARIANT_TO_INDICATOR: Record<NavLinkVariant, PendingIndicatorVariant> = {
  sidebar: 'dot',
  mobile: 'border',
  breadcrumb: 'opacity',
  card: 'dot',
};

export interface NavLinkProps
  extends LinkProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: NavLinkVariant;
  /** 명시적 indicator 변형 — 없으면 variant에서 자동 추론 */
  pendingIndicator?: PendingIndicatorVariant;
  /** 가시 콘텐츠. invisible overlay 링크(`absolute inset-0` + `aria-label`)는 생략 가능 */
  children?: React.ReactNode;
  className?: string;
}

/**
 * NavLink — L1 Link-local pending 신호 SSOT
 *
 * 역할: `next/link` wrapper로 변형별 pending 표시 + 글로벌 counter 연동.
 *
 * 동작:
 * 1. `useLinkStatus()` hook으로 link click 후 RSC payload 도착까지 pending=true
 * 2. pending 동안 variant에 맞는 indicator 표시 (dot/border/opacity)
 * 3. NavigationPending counter도 동시 increment → GlobalProgressBar 활성
 *
 * 변형:
 * - `sidebar`: 텍스트 우측 4px dot
 * - `mobile`: 좌측 2px border-l (relative 컨테이너 필요)
 * - `breadcrumb`: opacity 0.7 fade
 * - `card`: 카드 카드 안 dot (기본 sidebar와 같음)
 *
 * a11y:
 * - `aria-busy={pending}` — 클릭 후 pending 동안 SR에 알림
 * - sr-only `t('feedback.navigating')` — pending 시작 announce (polite)
 *
 * BC: 기존 `<Link>` 사용처는 그대로 두고, 본 컴포넌트는 신규 사용처/마이그레이션에 사용.
 *
 * @example
 * ```tsx
 * <NavLink href="/equipment" variant="sidebar">장비 관리</NavLink>
 * ```
 */
export function NavLink({
  variant = 'sidebar',
  pendingIndicator,
  className,
  children,
  ...linkProps
}: NavLinkProps) {
  const indicatorVariant = pendingIndicator ?? VARIANT_TO_INDICATOR[variant];
  const [isPending, setIsPending] = React.useState(false);

  // opacity 변형(breadcrumb)은 <a> 자체에 opacity 적용
  const opacityClass = indicatorVariant === 'opacity' ? getPendingOpacityClass(isPending) : '';

  return (
    <Link
      {...linkProps}
      className={cn('relative', className, opacityClass)}
      aria-busy={isPending || undefined}
    >
      <NavLinkInner indicatorVariant={indicatorVariant} onPendingChange={setIsPending}>
        {children}
      </NavLinkInner>
    </Link>
  );
}

/**
 * useLinkStatus는 *next/link Link의 자식*에서만 동작 — 별도 컴포넌트로 분리 필수.
 *
 * 레이아웃 설계:
 * - fragment로 렌더링해 <Link>(<a>)의 flex 레이아웃을 보존함.
 *   이전: <span class="inline-flex w-full">이 래퍼로 작동해 <a>의 gap-3/flex-1이 무효화됨.
 *   현재: children과 PendingIndicator가 <a>의 직접 flex child로 렌더링됨.
 * - aria-busy / opacityClass는 NavLink가 <a>에 직접 적용 (onPendingChange 콜백 경유).
 */
function NavLinkInner({
  indicatorVariant,
  children,
  onPendingChange,
}: {
  indicatorVariant: PendingIndicatorVariant;
  children?: React.ReactNode;
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useLinkStatus();
  const begin = useNavigationPendingBegin();
  const t = useTranslations();

  React.useEffect(() => {
    onPendingChange(pending);
    if (!pending) return;
    return begin();
  }, [pending, begin, onPendingChange]);

  return (
    <>
      {/* border 변형(모바일): pl-1 패딩을 children 래퍼에만 적용 */}
      {indicatorVariant === 'border' ? <span className="pl-1">{children}</span> : children}
      {/* dot/border: PendingIndicator가 <a>의 flex child로 label 우측에 붙음 */}
      {indicatorVariant !== 'opacity' ? (
        <PendingIndicator variant={indicatorVariant} pending={pending} />
      ) : null}
      {/* sr-only는 position:absolute라 flex flow에서 벗어남 */}
      {pending ? <span className="sr-only">{t(FEEDBACK_KEYS.navigating)}</span> : null}
    </>
  );
}
