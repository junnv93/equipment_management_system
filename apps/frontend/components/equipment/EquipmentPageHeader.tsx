'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_LIST_HEADER_TOKENS } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import { exportFormTemplate } from '@/lib/api/reports-api';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const canCreate = can(Permission.CREATE_EQUIPMENT);
  const canExport = can(Permission.EXPORT_REPORTS);
  const [exporting, setExporting] = useState(false);

  const handleExportLedger = async () => {
    setExporting(true);
    try {
      // URL 필터 조건을 그대로 내보내기에 전달
      const params: Record<string, string> = {};
      for (const key of EXPORT_FILTER_KEYS) {
        const value = searchParams.get(key);
        if (value) params[key] = value;
      }
      // 사이트 기본값: URL에 없으면 사용자 사이트
      if (!params.site && user?.site) {
        params.site = user.site;
      }
      await exportFormTemplate('UL-QP-18-01', params);
    } catch {
      toast({ variant: 'destructive', description: t('list.exportError') });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={EQUIPMENT_LIST_HEADER_TOKENS.container}>
      <div>
        <h1 className={EQUIPMENT_LIST_HEADER_TOKENS.title}>{t('title')}</h1>
        <p className={EQUIPMENT_LIST_HEADER_TOKENS.subtitle}>{t('subtitle')}</p>
      </div>
      <div className="flex gap-2">
        {canExport && (
          <Button variant="outline" onClick={handleExportLedger} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {t('list.exportLedger')}
          </Button>
        )}
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
