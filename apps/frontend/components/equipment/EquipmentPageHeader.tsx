'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_LIST_HEADER_TOKENS } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import { ExportFormButton } from '@/components/shared/ExportFormButton';

/**
 * 장비 목록 페이지 헤더 (Client Component)
 *
 * PPR sync Server Component에서 async getTranslations() 불가 → 별도 Client Component로 분리.
 * IntlProvider는 layout.tsx에서 이미 로드되므로 useTranslations() 즉시 작동.
 *
 * 권한: CREATE_EQUIPMENT 없는 역할(quality_manager)은 등록 버튼 숨김
 */
/** 내보내기에 전달할 필터 키 (URL searchParams → API query params) */
const EXPORT_FILTER_KEYS = [
  'site',
  'teamId',
  'status',
  'managementMethod',
  'classification',
  'manufacturer',
  'location',
  'isShared',
  'showRetired',
] as const;

export function EquipmentPageHeader() {
  const t = useTranslations('equipment');
  const { can, user } = useAuth();
  const searchParams = useSearchParams();
  const canCreate = can(Permission.CREATE_EQUIPMENT);

  // URL 필터 조건을 그대로 내보내기에 전달
  const exportParams: Record<string, string> = {};
  for (const key of EXPORT_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) exportParams[key] = value;
  }
  // 사이트 기본값: URL에 없으면 사용자 사이트
  if (!exportParams.site && user?.site) {
    exportParams.site = user.site;
  }

  return (
    <div className={EQUIPMENT_LIST_HEADER_TOKENS.container}>
      <div>
        <h1 className={EQUIPMENT_LIST_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={EQUIPMENT_LIST_HEADER_TOKENS.subtitle}>{t('subtitle')}</p>
      </div>
      <div className="flex gap-2">
        <ExportFormButton
          formNumber="UL-QP-18-01"
          params={exportParams}
          label={t('list.exportLedger')}
          errorToastDescription={t('list.exportError')}
          size="default"
          canAct={can(Permission.EXPORT_REPORTS)}
        />
        {canCreate && (
          <Button asChild>
            <Link href="/equipment/create">
              <Plus className="h-4 w-4 mr-2" />
              {t('list.createButton')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
