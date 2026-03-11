'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Equipment } from '@/lib/api/equipment-api';
import { MapPin, Package, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/utils/date';
import { CALIBRATION_METHOD_LABELS, type CalibrationMethod } from '@equipment-management/schemas';
import {
  getManagementNumberClasses,
  getTimestampClasses,
  getBrandSectionHeaderClasses,
} from '@/lib/design-tokens';

interface BasicInfoTabProps {
  equipment: Equipment;
}

/**
 * 기본 정보 탭 — 시험설비이력카드(UL-QP-18-02) 디지털화
 *
 * 라벨-값 수평 쌍: 왼쪽 muted 라벨 + 오른쪽 정렬된 값 (서류 양식 모방)
 * 관리번호/일련번호: font-mono tabular-nums tracking-wider
 * 날짜 필드: getTimestampClasses() 적용
 */
export function BasicInfoTab({ equipment }: BasicInfoTabProps) {
  const t = useTranslations('equipment');

  /** 서류 양식 스타일 수평 라벨-값 행 */
  const InfoRow = ({
    label,
    value,
    valueClassName,
  }: {
    label: string;
    value?: string | number | null;
    valueClassName?: string;
  }) => (
    <div className="flex items-baseline justify-between py-2.5 border-b border-border/40 last:border-0 gap-4">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className={`text-sm font-medium text-right ${valueClassName ?? 'text-foreground'}`}>
        {value ?? '-'}
      </dd>
    </div>
  );

  /** 카드 타이틀 (icon + 텍스트, 하단 구분선) */
  const CardSection = ({
    icon: Icon,
    title,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <CardTitle className={`flex items-center gap-2 text-sm ${getBrandSectionHeaderClasses()}`}>
      <Icon className="h-4 w-4 text-brand-text-muted shrink-0" aria-hidden="true" />
      {title}
    </CardTitle>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 기본 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardSection icon={Package} title={t('basicInfoTab.equipmentBasicInfo')} />
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="space-y-0">
            <InfoRow label={t('fields.name')} value={equipment.name} />
            <InfoRow label={t('fields.modelName')} value={equipment.modelName} />
            <InfoRow
              label={t('fields.managementNumber')}
              value={equipment.managementNumber}
              valueClassName={getManagementNumberClasses()}
            />
            <InfoRow
              label={t('fields.serialNumber')}
              value={equipment.serialNumber}
              valueClassName={getManagementNumberClasses()}
            />
            {equipment.isShared && equipment.externalIdentifier && (
              <InfoRow
                label={t('fields.externalIdentifier')}
                value={equipment.externalIdentifier}
              />
            )}
            <InfoRow label={t('fields.manufacturer')} value={equipment.manufacturer} />
            <InfoRow
              label={t('fields.purchaseYear')}
              value={equipment.purchaseYear}
              valueClassName="font-mono tabular-nums text-foreground"
            />
            {equipment.description && (
              <div className="pt-3 mt-1 border-t border-border/40">
                <dt className="text-sm text-muted-foreground mb-1">{t('fields.description')}</dt>
                <dd className="text-sm text-foreground">{equipment.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 위치 및 관리 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardSection icon={MapPin} title={t('basicInfoTab.locationManagement')} />
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="space-y-0">
            <InfoRow
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
            />
            <InfoRow label={t('fields.team')} value={equipment.teamName} />
            <InfoRow label={t('fields.location')} value={equipment.location} />
            <InfoRow
              label={t('fields.installationDate')}
              value={formatDate(equipment.installationDate)}
              valueClassName={getTimestampClasses()}
            />
          </dl>
          {/* 운영책임자 정보 - 나중에 구현 */}
        </CardContent>
      </Card>

      {/* 교정 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardSection icon={Wrench} title={t('basicInfoTab.calibrationInfo')} />
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="space-y-0">
            <InfoRow
              label={t('basicInfoTab.calibrationMethod')}
              value={
                equipment.calibrationMethod
                  ? CALIBRATION_METHOD_LABELS[equipment.calibrationMethod as CalibrationMethod]
                  : '-'
              }
            />
            <InfoRow
              label={t('basicInfoTab.calibrationCycle')}
              value={equipment.calibrationCycle}
              valueClassName="font-mono tabular-nums text-foreground"
            />
            <InfoRow
              label={t('basicInfoTab.lastCalibrationDate')}
              value={formatDate(equipment.lastCalibrationDate)}
              valueClassName={getTimestampClasses()}
            />
            <InfoRow
              label={t('basicInfoTab.nextCalibrationDate')}
              value={formatDate(equipment.nextCalibrationDate)}
              valueClassName={getTimestampClasses()}
            />
            <InfoRow
              label={t('basicInfoTab.calibrationAgency')}
              value={equipment.calibrationAgency}
            />
          </dl>
        </CardContent>
      </Card>

      {/* 소프트웨어/펌웨어 정보 카드 */}
      {(equipment.softwareVersion || equipment.firmwareVersion || equipment.manualLocation) && (
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="pb-3 border-b border-border">
            <CardSection icon={Package} title={t('softwareTab.title')} />
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="space-y-0">
              {equipment.softwareVersion && (
                <InfoRow
                  label={t('softwareTab.softwareVersion')}
                  value={equipment.softwareVersion}
                  valueClassName="font-mono tabular-nums text-foreground"
                />
              )}
              {equipment.firmwareVersion && (
                <InfoRow
                  label={t('softwareTab.firmwareVersion')}
                  value={equipment.firmwareVersion}
                  valueClassName="font-mono tabular-nums text-foreground"
                />
              )}
              {equipment.manualLocation && (
                <InfoRow label={t('softwareTab.manualLocation')} value={equipment.manualLocation} />
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
