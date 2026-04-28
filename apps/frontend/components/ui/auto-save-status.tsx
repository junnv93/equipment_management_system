'use client';

import { Loader2, Check, AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AutoSaveStatus } from '@/hooks/use-auto-save';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';

interface AutoSaveStatusProps {
  /** useAutoSave()에서 반환된 status */
  status: AutoSaveStatus;
  /** useAutoSave()에서 반환된 lastSavedAt */
  lastSavedAt: Date | null;
  className?: string;
}

/** 상태별 아이콘/색상 토큰 */
const STATUS_CONFIG = {
  idle: {
    icon: Clock,
    colorClass: 'text-muted-foreground',
    spin: false,
  },
  saving: {
    icon: Loader2,
    colorClass: 'text-muted-foreground',
    spin: true,
  },
  saved: {
    icon: Check,
    colorClass: 'text-brand-ok',
    spin: false,
  },
  conflict: {
    icon: AlertTriangle,
    colorClass: 'text-destructive',
    spin: false,
  },
} as const satisfies Record<
  AutoSaveStatus,
  { icon: React.ComponentType<{ className?: string }>; colorClass: string; spin: boolean }
>;

/**
 * 자동 저장 상태 인디케이터 컴포넌트 (SSOT)
 *
 * `useAutoSave` 훅과 함께 사용.
 * WCAG 4.1.3: role="status" + aria-live="polite" — 스크린리더 정상 인식.
 *
 * @example
 * ```tsx
 * const { status, lastSavedAt } = useAutoSave({
 *   value: form.watch('content'),
 *   saveFn: (v) => api.update(id, { content: v }),
 * });
 *
 * <AutoSaveStatus status={status} lastSavedAt={lastSavedAt} />
 * ```
 */
export function AutoSaveStatus({ status, lastSavedAt, className }: AutoSaveStatusProps) {
  const t = useTranslations();
  const { icon: Icon, colorClass, spin } = STATUS_CONFIG[status];

  const label = (() => {
    if (status === 'saved' && lastSavedAt) {
      const time = lastSavedAt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return t(FEEDBACK_KEYS.autosaveSaved, { time });
    }
    const keyMap: Record<AutoSaveStatus, string> = {
      idle: FEEDBACK_KEYS.autosaveIdle,
      saving: FEEDBACK_KEYS.autosaveSaving,
      saved: FEEDBACK_KEYS.autosaveSaved,
      conflict: FEEDBACK_KEYS.autosaveConflict,
    };
    return t(keyMap[status]);
  })();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn('flex items-center gap-1.5 text-xs', colorClass, className)}
    >
      <Icon className={cn('h-3.5 w-3.5', spin && 'motion-safe:animate-spin')} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
