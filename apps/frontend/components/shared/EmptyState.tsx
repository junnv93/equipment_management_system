'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Check, Circle } from 'lucide-react';
import { EmptyStateLayout } from '@/components/shared/EmptyStateLayout';
import { Button } from '@/components/ui/button';
import { EMPTY_STATE_TOKENS } from '@/lib/design-tokens';
import type { EmptyStateVariant } from '@/lib/design-tokens';
import type { Permission } from '@equipment-management/shared-constants';

export interface EmptyStatePrimaryAction {
  label: string;
  onClick?: () => void;
  href?: string;
  /**
   * @deprecated 런타임 권한 체크 용도로 사용하지 마세요.
   * 부모에서 `canAct` prop으로 권한 판정을 전달하세요.
   * 이 필드는 문서/계약 명시 용도로만 유지됩니다.
   */
  permission?: Permission;
}

export interface EmptyStateSecondaryAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: EmptyStatePrimaryAction;
  secondaryAction?: EmptyStateSecondaryAction;
  className?: string;
  /**
   * primaryAction 표시 여부를 부모가 결정합니다.
   * undefined이면 항상 표시 (후방호환).
   * false이면 권한 없음으로 판단해 primaryAction을 숨깁니다.
   */
  canAct?: boolean;
  /** E2E 테스트용 testid. 전달 시 root div에 data-testid 바인딩. */
  testId?: string;
  role?: 'status' | 'presentation' | 'alert';
  ariaLive?: 'polite' | 'assertive';
  children?: ReactNode;
  iconColorClass?: string;
  iconBgClass?: string;
  primaryActionDisabled?: boolean;
  primaryActionAriaDescribedBy?: string;
}

export function EmptyState({
  variant,
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  canAct,
  testId,
  role,
  ariaLive,
  children,
  iconColorClass,
  iconBgClass,
  primaryActionDisabled,
  primaryActionAriaDescribedBy,
}: EmptyStateProps) {
  const showPrimary = canAct !== false;
  const Icon = icon ?? DEFAULT_EMPTY_STATE_ICONS[variant] ?? Circle;
  const computedRole = role ?? (variant === 'error' ? 'alert' : 'status');

  const resolvedIconColorClass = iconColorClass ?? EMPTY_STATE_TOKENS.variantIconColor[variant];
  const resolvedIconBgClass = iconBgClass ?? EMPTY_STATE_TOKENS.variantIconBg[variant];

  return (
    <EmptyStateLayout
      containerClassName={EMPTY_STATE_TOKENS.container}
      className={className}
      role={computedRole}
      ariaLive={
        ariaLive ??
        (computedRole === 'alert' ? 'assertive' : computedRole === 'status' ? 'polite' : undefined)
      }
      testId={testId}
      iconContainerClassName={[EMPTY_STATE_TOKENS.iconContainer, resolvedIconBgClass]
        .filter(Boolean)
        .join(' ')}
      icon={
        <Icon
          className={[EMPTY_STATE_TOKENS.icon, resolvedIconColorClass].join(' ')}
          aria-hidden="true"
        />
      }
      title={title}
      titleClassName={EMPTY_STATE_TOKENS.title}
      description={description}
      descriptionClassName={EMPTY_STATE_TOKENS.description}
      children={children}
      actionsClassName={EMPTY_STATE_TOKENS.actions}
      actions={
        (showPrimary && primaryAction) || secondaryAction ? (
          <>
            {showPrimary &&
              primaryAction &&
              (primaryAction.href ? (
                <Button asChild disabled={primaryActionDisabled}>
                  <Link
                    href={primaryAction.href}
                    aria-disabled={primaryActionDisabled || undefined}
                    tabIndex={primaryActionDisabled ? -1 : undefined}
                  >
                    {primaryAction.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={primaryAction.onClick}
                  type="button"
                  disabled={primaryActionDisabled}
                  aria-describedby={primaryActionAriaDescribedBy}
                >
                  {primaryAction.label}
                </Button>
              ))}
            {secondaryAction &&
              (secondaryAction.href ? (
                <Button variant="outline" asChild>
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick} type="button">
                  {secondaryAction.label}
                </Button>
              ))}
          </>
        ) : undefined
      }
    />
  );
}

const DEFAULT_EMPTY_STATE_ICONS: Partial<Record<EmptyStateVariant, LucideIcon>> = {
  neutral: Circle,
  success: Check,
  error: AlertCircle,
};
