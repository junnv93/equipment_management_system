'use client';

import Image from 'next/image';
import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';

/**
 * PWA 설치 유도 배너.
 *
 * `beforeinstallprompt` 이벤트가 발화한 경우(Android Chrome, Edge 등)에만 표시.
 * 이미 설치된 경우(`display-mode: standalone`)나 iOS Safari(이벤트 미지원)에서는 숨김.
 *
 * 배치: 앱 루트 레이아웃 하단 (z-50 고정 오버레이 스타일).
 */
export function PWAInstallBanner() {
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const t = useTranslations('common');

  if (!canInstall || dismissed) return null;

  return (
    <div
      role="banner"
      aria-label={t('pwa.installBanner.ariaLabel')}
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/manifest-192.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="flex-shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t('pwa.installBanner.title')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('pwa.installBanner.subtitle')}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t('actions.close')}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5" onClick={promptInstall}>
          <Download className="h-3.5 w-3.5" />
          {t('pwa.installBanner.installCta')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
          {t('pwa.installBanner.laterCta')}
        </Button>
      </div>
    </div>
  );
}
