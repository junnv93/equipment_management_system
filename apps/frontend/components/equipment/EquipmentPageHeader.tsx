'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_LIST_HEADER_TOKENS } from '@/lib/design-tokens';

/**
 * 장비 목록 페이지 헤더 (Client Component)
 *
 * PPR sync Server Component에서 async getTranslations() 불가 → 별도 Client Component로 분리.
 * IntlProvider는 layout.tsx에서 이미 로드되므로 useTranslations() 즉시 작동.
 */
export function EquipmentPageHeader() {
  const t = useTranslations('equipment');

  return (
    <div className={EQUIPMENT_LIST_HEADER_TOKENS.container}>
      <div>
        <h1 className={EQUIPMENT_LIST_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={EQUIPMENT_LIST_HEADER_TOKENS.subtitle}>{t('subtitle')}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/equipment/create-shared">{t('list.createSharedButton')}</Link>
        </Button>
        <Button asChild>
          <Link href="/equipment/create">
            <Plus className="h-4 w-4 mr-2" />
            {t('list.createButton')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
