'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
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
  /**
   * primaryAction 표시 여부를 부모가 결정합니다.
   * undefined이면 항상 표시 (후방호환).
   * false이면 권한 없음으로 판단해 primaryAction을 숨깁니다.
   */
  canAct?: boolean;
  /** E2E 테스트용 testid. 전달 시 root div에 data-testid 바인딩. */
  testId?: string;
}

export function EmptyState({
  variant,
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  canAct,
  testId,
}: EmptyStateProps) {
  const showPrimary = canAct !== false;

  const iconColorClass = EMPTY_STATE_TOKENS.variantIconColor[variant];
  const iconBgClass = EMPTY_STATE_TOKENS.variantIconBg[variant];

  return (
    <div
      className={[EMPTY_STATE_TOKENS.container, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      data-testid={testId}
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
