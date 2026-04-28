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
  children: React.ReactNode;
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

  return (
    <Link {...linkProps} className={cn('relative', className)}>
      <NavLinkInner indicatorVariant={indicatorVariant}>{children}</NavLinkInner>
    </Link>
  );
}

/**
 * useLinkStatus는 *next/link Link의 자식*에서만 동작 — 별도 컴포넌트로 분리 필수.
 */
function NavLinkInner({
  indicatorVariant,
  children,
}: {
  indicatorVariant: PendingIndicatorVariant;
  children: React.ReactNode;
}) {
  const { pending } = useLinkStatus();
  const begin = useNavigationPendingBegin();
  const t = useTranslations();

  // pending 시작 시 글로벌 counter increment, pending 해제 시 cleanup
  React.useEffect(() => {
    if (!pending) return;
    return begin();
  }, [pending, begin]);

  const opacityClass = indicatorVariant === 'opacity' ? getPendingOpacityClass(pending) : '';

  return (
    <span
      aria-busy={pending || undefined}
      className={cn('inline-flex items-center w-full', opacityClass)}
    >
      <span className={cn(indicatorVariant === 'border' && 'pl-1')}>{children}</span>
      {indicatorVariant !== 'opacity' ? (
        <PendingIndicator variant={indicatorVariant} pending={pending} />
      ) : null}
      {pending ? <span className="sr-only">{t(FEEDBACK_KEYS.navigating)}</span> : null}
    </span>
  );
}
