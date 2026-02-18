'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Equipment } from '@/lib/api/equipment-api';
import { MapPin, Tag, Package, Calendar, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/utils/date';
import { CALIBRATION_METHOD_LABELS, type CalibrationMethod } from '@equipment-management/schemas';
import { CONTENT_TOKENS } from '@/lib/design-tokens';

interface BasicInfoTabProps {
  equipment: Equipment;
}

/**
 * 기본 정보 탭
 *
 * UL Solutions 브랜딩:
 * - 카드 레이아웃으로 정보 그룹화
 * - 아이콘과 라벨로 가독성 향상
 */
export function BasicInfoTab({ equipment }: BasicInfoTabProps) {
  const t = useTranslations('equipment');
  // 정보 필드 컴포넌트
  const InfoField = ({
    label,
    value,
    icon: Icon,
    numeric = false,
  }: {
    label: string;
    value?: string | number | null;
    icon?: React.ComponentType<{ className?: string }>;
    numeric?: boolean;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <p
        className={`font-medium text-gray-900 dark:text-gray-100 ${numeric ? CONTENT_TOKENS.numeric.tabular : ''}`}
      >
        {value || '-'}
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 기본 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-ul-midnight" />
            {t('basicInfoTab.equipmentBasicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t('fields.name')} value={equipment.name} />
            <InfoField label={t('fields.modelName')} value={equipment.modelName} />
            <InfoField
              label={t('fields.managementNumber')}
              value={equipment.managementNumber}
              numeric
            />
            <InfoField label={t('fields.serialNumber')} value={equipment.serialNumber} numeric />
            {equipment.isShared && equipment.externalIdentifier && (
              <InfoField
                label={t('fields.externalIdentifier')}
                value={equipment.externalIdentifier}
                icon={Package}
              />
            )}
            <InfoField label={t('fields.manufacturer')} value={equipment.manufacturer} />
            <InfoField label={t('fields.purchaseYear')} value={equipment.purchaseYear} numeric />
          </div>

          {equipment.description && (
            <div className="pt-4 border-t">
              <InfoField label={t('fields.description')} value={equipment.description} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 위치 및 관리 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-ul-midnight" />
            {t('basicInfoTab.locationManagement')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label={t('fields.site')}
              value={
                equipment.site === 'suwon'
                  ? t('basicInfoTab.site.suwon')
                  : equipment.site === 'uiwang'
                    ? t('basicInfoTab.site.uiwang')
                    : equipment.site === 'pyeongtaek'
                      ? t('basicInfoTab.site.pyeongtaek')
                      : '-'
              }
              icon={MapPin}
            />
            <InfoField label={t('fields.team')} value={equipment.teamName} icon={Tag} />
            <InfoField label={t('fields.location')} value={equipment.location} icon={MapPin} />
            <InfoField
              label={t('fields.installationDate')}
              value={formatDate(equipment.installationDate)}
              icon={Calendar}
            />
          </div>

          {/* 운영책임자 정보 - 나중에 구현 */}
        </CardContent>
      </Card>

      {/* 교정 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-ul-midnight" />
            {t('basicInfoTab.calibrationInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label={t('basicInfoTab.calibrationMethod')}
              value={
                equipment.calibrationMethod
                  ? CALIBRATION_METHOD_LABELS[equipment.calibrationMethod as CalibrationMethod]
                  : '-'
              }
            />
            <InfoField
              label={t('basicInfoTab.calibrationCycle')}
              value={equipment.calibrationCycle}
              numeric
            />
            <InfoField
              label={t('basicInfoTab.lastCalibrationDate')}
              value={formatDate(equipment.lastCalibrationDate)}
              icon={Calendar}
            />
            <InfoField
              label={t('basicInfoTab.nextCalibrationDate')}
              value={formatDate(equipment.nextCalibrationDate)}
              icon={Calendar}
            />
            <InfoField
              label={t('basicInfoTab.calibrationAgency')}
              value={equipment.calibrationAgency}
            />
          </div>
        </CardContent>
      </Card>

      {/* 소프트웨어/펌웨어 정보 카드 */}
      {(equipment.softwareVersion || equipment.firmwareVersion || equipment.manualLocation) && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-ul-midnight" />
              {t('softwareTab.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {equipment.softwareVersion && (
                <InfoField
                  label={t('softwareTab.softwareVersion')}
                  value={equipment.softwareVersion}
                />
              )}
              {equipment.firmwareVersion && (
                <InfoField
                  label={t('softwareTab.firmwareVersion')}
                  value={equipment.firmwareVersion}
                />
              )}
              {equipment.manualLocation && (
                <InfoField
                  label={t('softwareTab.manualLocation')}
                  value={equipment.manualLocation}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
