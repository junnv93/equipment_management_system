'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPTY_STATE_TOKENS } from '@/lib/design-tokens';
import type { EmptyStateVariant } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import type { Permission } from '@equipment-management/shared-constants';

export interface EmptyStatePrimaryAction {
  label: string;
  onClick?: () => void;
  href?: string;
  /** 지정 시 useAuth().can() 체크 후 표시 — 권한 없으면 렌더링 생략 */
  permission?: Permission;
}

export interface EmptyStateSecondaryAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: EmptyStatePrimaryAction;
  secondaryAction?: EmptyStateSecondaryAction;
  className?: string;
}

export function EmptyState({
  variant,
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const { can } = useAuth();

  const showPrimary = !primaryAction?.permission || can(primaryAction.permission);

  const iconColorClass = EMPTY_STATE_TOKENS.variantIconColor[variant];
  const iconBgClass = EMPTY_STATE_TOKENS.variantIconBg[variant];

  return (
    <div
      className={[EMPTY_STATE_TOKENS.container, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
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
