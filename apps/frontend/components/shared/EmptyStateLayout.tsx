'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateLayoutProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  containerClassName: string;
  iconContainerClassName: string;
  titleClassName: string;
  descriptionClassName: string;
  actionsClassName?: string;
  role: 'status' | 'presentation' | 'alert';
  ariaLive?: 'polite' | 'assertive';
  testId?: string;
  titleAs?: 'h3' | 'p';
}

export function EmptyStateLayout({
  icon,
  title,
  description,
  actions,
  children,
  className,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
  role,
  ariaLive,
  testId,
  titleAs = 'h3',
}: EmptyStateLayoutProps) {
  const Title = titleAs;

  return (
    <div
      className={cn(containerClassName, className)}
      role={role}
      aria-live={ariaLive}
      data-testid={testId}
    >
      <div className={iconContainerClassName} aria-hidden="true">
        {icon}
      </div>
      <Title className={titleClassName}>{title}</Title>
      {description && <p className={descriptionClassName}>{description}</p>}
      {children}
      {actions && <div className={actionsClassName}>{actions}</div>}
    </div>
  );
}
