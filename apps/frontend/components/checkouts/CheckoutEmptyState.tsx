'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  EMPTY_STATE_TOKENS,
  CHECKOUT_EMPTY_STATE_TOKENS,
  CHECKOUT_ICON_MAP,
} from '@/lib/design-tokens';
import type { CheckoutEmptyStateVariant } from '@/lib/design-tokens';

export interface CheckoutEmptyStatePrimaryAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CheckoutEmptyStateProps {
  variant: CheckoutEmptyStateVariant;
  title: string;
  description: string;
  primaryAction?: CheckoutEmptyStatePrimaryAction;
  secondaryAction?: { label: string; onClick: () => void };
  /**
   * false 시 primaryAction을 숨긴다 (권한 없음). undefined이면 항상 표시.
   */
  canAct?: boolean;
  className?: string;
}

/**
 * 반출 목록 전용 빈 상태 컴포넌트
 *
 * - variant에 따라 아이콘과 data-testid가 자동 결정됨 (CHECKOUT_ICON_MAP.emptyState 경유)
 * - 공용 EmptyState와 달리 아이콘 prop을 받지 않음 — variant로부터 내부 결정
 */
export default function CheckoutEmptyState({
  variant,
  title,
  description,
  primaryAction,
  secondaryAction,
  canAct,
  className,
}: CheckoutEmptyStateProps) {
  const showPrimary = canAct !== false;
  const Icon = CHECKOUT_ICON_MAP.emptyState[variant];
  const iconColorClass = CHECKOUT_EMPTY_STATE_TOKENS.variantIconColor[variant];
  const iconBgClass = CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg[variant];

  return (
    <div
      className={[EMPTY_STATE_TOKENS.container, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      data-testid={`empty-state-${variant}`}
    >
      <div className={[EMPTY_STATE_TOKENS.iconContainer, iconBgClass].filter(Boolean).join(' ')}>
        <Icon className={[EMPTY_STATE_TOKENS.icon, iconColorClass].join(' ')} aria-hidden="true" />
      </div>

      <h3 className={EMPTY_STATE_TOKENS.title}>{title}</h3>
      <p className={EMPTY_STATE_TOKENS.description}>{description}</p>

      {(showPrimary && primaryAction) || secondaryAction ? (
        <div className={EMPTY_STATE_TOKENS.actions}>
          {showPrimary &&
            primaryAction &&
            (primaryAction.href ? (
              <Button asChild>
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button onClick={primaryAction.onClick} type="button">
                {primaryAction.label}
              </Button>
            ))}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} type="button">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
