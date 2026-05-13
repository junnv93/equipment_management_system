'use client';

import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { EmptyState } from '@/components/shared/EmptyState';
import { CHECKOUT_EMPTY_STATE_TOKENS, CHECKOUT_ICON_MAP } from '@/lib/design-tokens';
import type { CheckoutEmptyStateVariant } from '@/lib/design-tokens';
import { FRONTEND_ROUTES, type HelpTopicKey } from '@equipment-management/shared-constants';

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
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  /**
   * false 시 primaryAction을 숨긴다 (권한 없음). undefined이면 항상 표시.
   */
  canAct?: boolean;
  /** noPermission variant: 현재 역할 인라인 표시용 */
  roleLabel?: string;
  /** error variant 전용: 다시 시도 핸들러. 제공 시 자동 secondaryAction 합성. */
  onRetry?: () => void;
  /**
   * 제공 시 `/help#<topicKey>` 도움말 링크를 secondaryAction으로 자동 합성.
   * 명시적 secondaryAction 또는 error+onRetry 합성이 있으면 적용되지 않는다.
   */
  helpTopicKey?: HelpTopicKey;
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
  roleLabel,
  onRetry,
  helpTopicKey,
  className,
}: CheckoutEmptyStateProps) {
  const t = useTranslations('checkouts');
  const showPrimary = canAct !== false;
  const Icon = CHECKOUT_ICON_MAP.emptyState[variant];

  // network variant: 온라인 복구 시 안내 표시 — SSOT useOnlineStatus 훅 경유
  const { online: isOnline } = useOnlineStatus();
  const iconColorClass = CHECKOUT_EMPTY_STATE_TOKENS.variantIconColor[variant];
  const iconBgClass = CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg[variant];

  // U-12: network variant + offline → primary disabled + 사유 노출 (hide 대신 disabled+reason)
  const networkOffline = variant === 'network' && !isOnline;
  // U-12: error variant + onRetry → secondary 자동 합성 (호출부 단순화)
  // helpTopicKey → 도움말 링크 자동 합성 (명시적 secondaryAction / error+onRetry가 없을 때)
  const resolvedSecondary =
    secondaryAction ??
    (variant === 'error' && onRetry
      ? { label: t('emptyState.error.retry'), onClick: onRetry }
      : helpTopicKey
        ? { label: t('emptyState.helpLink'), href: FRONTEND_ROUTES.HELP.TOPIC(helpTopicKey) }
        : undefined);

  return (
    <EmptyState
      variant="no-data"
      icon={Icon}
      title={title}
      description={description}
      primaryAction={primaryAction}
      secondaryAction={resolvedSecondary}
      canAct={showPrimary}
      className={className}
      role={networkOffline ? 'alert' : 'status'}
      ariaLive={networkOffline ? 'assertive' : 'polite'}
      testId={`empty-state-${variant}`}
      iconColorClass={iconColorClass}
      iconBgClass={iconBgClass}
      primaryActionDisabled={networkOffline}
      primaryActionAriaDescribedBy={networkOffline ? 'offline-reason' : undefined}
    >
      {variant === 'network' && isOnline && (
        <p className="mt-1 text-xs text-brand-ok bg-brand-ok/10 rounded px-2 py-1 inline-block">
          {t('emptyState.network.restored')}
        </p>
      )}

      {networkOffline && (
        <p
          id="offline-reason"
          className="mt-1 text-xs text-brand-critical bg-brand-critical/10 rounded px-2 py-1 inline-block"
          aria-live="assertive"
        >
          {t('emptyState.network.offlineReason')}
        </p>
      )}

      {variant === 'noPermission' && roleLabel && (
        <p className="mt-1 text-xs text-muted-foreground bg-muted rounded px-2 py-1 inline-block">
          {roleLabel}
        </p>
      )}
    </EmptyState>
  );
}
