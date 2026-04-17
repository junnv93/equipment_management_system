'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ScanLine } from 'lucide-react';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { Button } from '@/components/ui/button';

/**
 * 모바일 헤더 전용 QR 스캔 진입 버튼.
 *
 * - `md:hidden` — 데스크톱에서는 노출하지 않음 (스캐너는 모바일 시나리오).
 * - 터치 타깃 `var(--touch-target-min)` (44px SSOT).
 * - 라우트는 `FRONTEND_ROUTES.SCAN` SSOT 경유.
 */
export function MobileScanTrigger() {
  const t = useTranslations('qr.scanner');

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="md:hidden min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)]"
    >
      <Link href={FRONTEND_ROUTES.SCAN} aria-label={t('title')}>
        <ScanLine className="h-5 w-5" aria-hidden="true" />
      </Link>
    </Button>
  );
}
