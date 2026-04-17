'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { QrCode, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

/**
 * `/e/:managementNumber` 경로에서 `notFound()` 트리거 시 렌더.
 *
 * 원인별 메시지는 단일 — 유효하지 않은 포맷과 미존재 모두 동일한 사용자 행동(다시 스캔)
 * 으로 귀결되므로 구분하지 않는다. 임시 번호(`TEMP-*`) 안내는 본문에 포함.
 */
export default function EquipmentQRNotFound() {
  const t = useTranslations('qr.landing');

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-8 text-center safe-area-bottom">
      <QrCode className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-foreground">{t('notFoundTitle')}</h1>
      <p className="text-sm text-muted-foreground">{t('notFoundBody')}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Link href={FRONTEND_ROUTES.EQUIPMENT.LIST}>
          <Button variant="outline" className="w-full sm:w-auto min-h-[var(--touch-target-min)]">
            <List className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t('goToEquipmentList')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * RawHelper — 위 컴포넌트에서 사용하지 않지만, 추후 Phase 2에서 "스캔 다시 시도"
 * 버튼이 `/scan` 경로로 이동할 때 FRONTEND_ROUTES.SCAN을 참조하도록 배치.
 */
export { FRONTEND_ROUTES };
