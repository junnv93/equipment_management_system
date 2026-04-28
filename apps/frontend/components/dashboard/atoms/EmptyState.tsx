/**
 * EmptyState — 대시보드 공용 빈 상태 (대시보드 개선안 §2.1, §A.17.2)
 *
 * 패턴: 아이콘 + 타이틀 + 설명 + (선택) CTA
 *  - variant="neutral" — 회색 ○ (활동 없음 등)
 *  - variant="success" — 초록 ✓ (기한 초과 없음 등)
 *  - variant="error"   — 빨강 ! (카드 ErrorBoundary 폴백 — §A.17.2)
 *
 * 의미론(접근성):
 *  - 의미 있는 빈 상태 → role="status"
 *  - 단순 placeholder → role="presentation" (cta 없는 sub-section)
 *  - error variant     → role="alert" 자동 적용
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CtaTarget = { onClick: () => void; href?: undefined } | { href: string; onClick?: undefined };

interface EmptyStateProps {
  variant?: 'neutral' | 'success' | 'error';
  title: string;
  description?: string;
  cta?: { label: string } & CtaTarget;
  /** 커스텀 아이콘 (기본 ○ / ✓ / ! 대체). lucide-react 컴포넌트 권장. */
  icon?: ReactNode;
  className?: string;
  /** role 강제 지정 (기본: error → 'alert' / cta → 'status' / 그 외 'presentation'). */
  role?: 'status' | 'presentation' | 'alert';
}

export function EmptyState({
  variant = 'neutral',
  title,
  description,
  cta,
  icon,
  className,
  role,
}: EmptyStateProps) {
  const computedRole = role ?? (variant === 'error' ? 'alert' : cta ? 'status' : 'presentation');

  const defaultIcon =
    variant === 'success' ? (
      <Check className="h-5 w-5" aria-hidden="true" />
    ) : variant === 'error' ? (
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    ) : (
      <Circle className="h-5 w-5" aria-hidden="true" />
    );

  const iconWrapClass =
    variant === 'success'
      ? 'bg-brand-success/10 text-brand-success'
      : variant === 'error'
        ? 'bg-brand-critical/10 text-brand-critical'
        : 'bg-muted text-muted-foreground';

  return (
    <div
      role={computedRole}
      aria-live={
        computedRole === 'status' ? 'polite' : computedRole === 'alert' ? 'assertive' : undefined
      }
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-7 px-4 text-center',
        className
      )}
    >
      <div
        className={cn('w-11 h-11 rounded-full grid place-items-center', iconWrapClass)}
        aria-hidden="true"
      >
        {icon ?? defaultIcon}
      </div>
      <p className="text-[13px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">{description}</p>
      )}
      {cta &&
        (cta.href ? (
          <Link
            href={cta.href}
            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 motion-safe:transition-colors"
          >
            {cta.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 motion-safe:transition-colors"
          >
            {cta.label}
          </button>
        ))}
    </div>
  );
}
