'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSwUpdate } from '@/hooks/use-sw-update';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';
import { PENDING_Z_INDEX } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BannerKind = 'offline' | 'sw-update';

interface BannerSpec {
  kind: BannerKind;
  messageKey: string;
  ariaLive: 'polite' | 'assertive';
  variantClass: string;
  action?: { labelKey: string; onClick: () => void };
}

/**
 * ConnectionBanner — L0 시스템/네트워크 신호 SSOT
 *
 * 표시 조건 (우선순위 순):
 * 1. offline (assertive — 즉시 인식 필요)
 * 2. service worker update available (polite + 액션 버튼)
 *
 * 동시 활성 시 우선순위 높은 1개만 표시 (Invariant I8 — 동시 announce 1개).
 *
 * a11y:
 * - role="status" + aria-live (offline=assertive / sw-update=polite)
 * - 액션 버튼은 명시적 i18n 키 ('feedback.reload')
 * - WCAG 4.1.3 Status Messages
 *
 * 마운트: app/layout.tsx 1회 (NavigationPendingProvider 자식, GlobalProgressBar와 stack)
 */
export function ConnectionBanner() {
  const t = useTranslations();
  const { online } = useOnlineStatus();
  const { newAvailable, applyUpdate } = useSwUpdate();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const banner: BannerSpec | null = React.useMemo(() => {
    if (!online) {
      return {
        kind: 'offline',
        messageKey: FEEDBACK_KEYS.offline,
        ariaLive: 'assertive',
        variantClass: 'bg-destructive text-destructive-foreground',
      };
    }
    if (newAvailable) {
      return {
        kind: 'sw-update',
        messageKey: FEEDBACK_KEYS.swUpdateAvailable,
        ariaLive: 'polite',
        variantClass: 'bg-brand-info/15 text-foreground border-b border-brand-info/30',
        action: { labelKey: FEEDBACK_KEYS.reload, onClick: applyUpdate },
      };
    }
    return null;
  }, [online, newAvailable, applyUpdate]);

  if (!mounted || !banner) return null;

  return (
    <div
      role="status"
      aria-live={banner.ariaLive}
      aria-atomic="true"
      data-banner-kind={banner.kind}
      className={cn(
        'fixed inset-x-0 top-0 px-4 py-2',
        'flex items-center justify-center gap-3 text-sm',
        PENDING_Z_INDEX.connectionBanner,
        banner.variantClass
      )}
    >
      <span>{t(banner.messageKey)}</span>
      {banner.action ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={banner.action.onClick}
          className="bg-background"
        >
          {t(banner.action.labelKey)}
        </Button>
      ) : null}
    </div>
  );
}
