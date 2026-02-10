'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Equipment } from '@/lib/api/equipment-api';
import { MapPin, Tag, Package, Calendar, Wrench } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { CALIBRATION_METHOD_LABELS, type CalibrationMethod } from '@equipment-management/schemas';

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
  // 정보 필드 컴포넌트
  const InfoField = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value?: string | number | null;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value || '-'}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 기본 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-ul-midnight" />
            장비 기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="장비명" value={equipment.name} />
            <InfoField label="모델명" value={equipment.modelName} />
            <InfoField label="관리번호" value={equipment.managementNumber} />
            <InfoField label="일련번호" value={equipment.serialNumber} />
            {/* 소유처 원본 번호 (공용/렌탈 장비만 표시) */}
            {equipment.isShared && equipment.externalIdentifier && (
              <InfoField
                label="소유처 원본 번호"
                value={equipment.externalIdentifier}
                icon={Package}
              />
            )}
            <InfoField label="제조사" value={equipment.manufacturer} />
            <InfoField label="구입년도" value={equipment.purchaseYear} />
          </div>

          {equipment.description && (
            <div className="pt-4 border-t">
              <InfoField label="장비사양" value={equipment.description} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 위치 및 관리 정보 카드 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-ul-midnight" />
            위치 및 관리 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label="사이트"
              value={
                equipment.site === 'suwon'
                  ? '수원'
                  : equipment.site === 'uiwang'
                    ? '의왕'
                    : equipment.site === 'pyeongtaek'
                      ? '평택'
                      : '-'
              }
              icon={MapPin}
            />
            <InfoField label="팀" value={equipment.teamName} icon={Tag} />
            <InfoField label="현재 위치" value={equipment.location} icon={MapPin} />
            <InfoField
              label="설치 일자"
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
            교정 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label="교정 방법"
              value={
                equipment.calibrationMethod
                  ? CALIBRATION_METHOD_LABELS[equipment.calibrationMethod as CalibrationMethod]
                  : '-'
              }
            />
            <InfoField label="교정 주기 (개월)" value={equipment.calibrationCycle} />
            <InfoField
              label="마지막 교정일"
              value={formatDate(equipment.lastCalibrationDate)}
              icon={Calendar}
            />
            <InfoField
              label="다음 교정 예정일"
              value={formatDate(equipment.nextCalibrationDate)}
              icon={Calendar}
            />
            <InfoField label="교정 기관" value={equipment.calibrationAgency} />
          </div>
        </CardContent>
      </Card>

      {/* 소프트웨어/펌웨어 정보 카드 */}
      {(equipment.softwareVersion || equipment.firmwareVersion || equipment.manualLocation) && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-ul-midnight" />
              소프트웨어/매뉴얼 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {equipment.softwareVersion && (
                <InfoField label="소프트웨어 버전" value={equipment.softwareVersion} />
              )}
              {equipment.firmwareVersion && (
                <InfoField label="펌웨어 버전" value={equipment.firmwareVersion} />
              )}
              {equipment.manualLocation && (
                <InfoField label="매뉴얼 보관 위치" value={equipment.manualLocation} />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
