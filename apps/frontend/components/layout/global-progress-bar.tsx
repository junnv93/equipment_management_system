'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useNavigationPending } from '@/hooks/use-navigation-pending';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { PENDING_DIMENSIONS, PENDING_COLORS, PENDING_Z_INDEX } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * GlobalProgressBar — L3 시스템 신호 SSOT
 *
 * 역할: 어떤 라우트 전환이든 화면 상단 fixed bar로 즉시 시각화.
 *      L1(NavLink dot) 미적용 위치를 안전망으로 커버.
 *
 * 마운트: app/layout.tsx 1회 (NavigationPendingProvider 자식)
 *
 * a11y:
 * - role="progressbar" + aria-valuetext (활성)
 * - aria-busy="true" (활성 시), aria-hidden="true" (비활성 시)
 * - sr-only 텍스트로 polite announce
 *
 * Reduced motion:
 * - motion-safe: keyframes progress-indeterminate (기존 globals.css)
 * - motion-reduce: keyframes progress-pulse (Phase 0 추가)
 *
 * Flicker 방지: 활성 직후 200ms minimum visible (빠른 navigation 시 깜빡임 방지)
 */
export function GlobalProgressBar() {
  const isPending = useNavigationPending();
  const t = useTranslations();
  const visible = useDelayedFalse(isPending, 200);

  return (
    <div
      role="progressbar"
      aria-valuetext={visible ? t(FEEDBACK_KEYS.navigatingPage) : undefined}
      aria-busy={visible || undefined}
      aria-hidden={!visible || undefined}
      data-state={visible ? 'active' : 'idle'}
      className={cn(
        'fixed inset-x-0 top-0 overflow-hidden pointer-events-none',
        PENDING_DIMENSIONS.progressBarH,
        PENDING_Z_INDEX.progressBar,
        'transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {visible ? (
        <span
          aria-hidden="true"
          className={cn(
            PENDING_COLORS.indicator,
            'block h-full w-1/3',
            'motion-safe:animate-[progress-indeterminate_1.2s_ease-in-out_infinite]',
            'motion-reduce:w-full motion-reduce:animate-[progress-pulse_1.5s_ease-in-out_infinite]'
          )}
        />
      ) : null}
      {visible ? <span className="sr-only">{t(FEEDBACK_KEYS.navigatingPage)}</span> : null}
    </div>
  );
}

/**
 * `value` true 동안 즉시 true, false 전환 후 minimum ms 동안 true 유지.
 * 빠른 navigation에서 progressbar 깜빡임 방지.
 */
function useDelayedFalse(value: boolean, minimumMs: number) {
  const [visible, setVisible] = React.useState(value);
  const lastTrueAt = React.useRef<number>(0);

  React.useEffect(() => {
    if (value) {
      lastTrueAt.current = Date.now();
      setVisible(true);
      return;
    }
    const elapsed = Date.now() - lastTrueAt.current;
    const remaining = Math.max(0, minimumMs - elapsed);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [value, minimumMs]);

  return visible;
}
