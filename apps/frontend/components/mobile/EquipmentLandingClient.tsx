'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  useEquipmentByManagementNumber,
  type EquipmentQRLanding,
} from '@/hooks/use-equipment-by-management-number';
import { EquipmentActionSheet } from './EquipmentActionSheet';
import { SITE_LABELS, type Site } from '@equipment-management/schemas';

interface EquipmentLandingClientProps {
  initialData: EquipmentQRLanding;
}

/**
 * 모바일 QR 랜딩 Client 컴포넌트.
 *
 * 서버에서 hydration한 초기 데이터를 표시하고 TanStack Query 캐시에 시딩한다.
 * 상단: 장비 요약 카드 (이름/관리번호/상태/다음 교정일)
 * 하단: 액션 시트 (서버 계산 allowedActions 기반)
 *
 * 모든 문자열은 `qr.landing.*` i18n 네임스페이스.
 */
export function EquipmentLandingClient({ initialData }: EquipmentLandingClientProps) {
  const t = useTranslations('qr.landing');

  const { data = initialData } = useEquipmentByManagementNumber(
    initialData.managementNumber,
    initialData
  );

  const nextCalibrationLabel = data.nextCalibrationDate
    ? new Date(data.nextCalibrationDate).toISOString().slice(0, 10)
    : '-';

  const siteLabel = data.site ? SITE_LABELS[data.site as Site] : '-';

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6 safe-area-bottom">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-foreground">{data.name}</h1>
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                {data.managementNumber}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {data.status}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex flex-col">
              <dt className="text-muted-foreground">{t('siteLabel')}</dt>
              <dd className="font-medium text-foreground">{siteLabel}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground">{t('teamLabel')}</dt>
              <dd className="font-medium text-foreground">{data.teamName ?? '-'}</dd>
            </div>
            <div className="col-span-2 flex flex-col">
              <dt className="text-muted-foreground">{t('nextCalibrationLabel')}</dt>
              <dd className="font-medium text-foreground tabular-nums">{nextCalibrationLabel}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <EquipmentActionSheet
        equipmentId={String(data.id)}
        equipmentName={data.name}
        managementNumber={data.managementNumber}
        teamName={data.teamName}
        allowedActions={data.allowedActions}
      />
    </div>
  );
}
